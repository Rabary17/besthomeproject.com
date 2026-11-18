#!/usr/bin/env node
// Orchestrateur de l'autopilote SEO : sélectionne les sujets du jour (SEO +
// actu), génère les articles (garde-fou date de coupure inclus), vérifie,
// puis commit/push si tout est propre. Produit un rapport + un résumé dans
// le journal Google Sheet partagé.
//
// Usage :
//   node scripts/seo/run-pipeline.js --seo 1 --actu 2 [--dry-run] [--push]
//
// --dry-run : génère les fichiers mais ne commit/push rien (par défaut : commit, pas de push)
// --push    : pousse aussi sur origin (nécessite que la boucle planifiée soit validée manuellement d'abord)
"use strict";
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env.local") });

const { generer, appelBrut, MODELE_PAR_DEFAUT } = require("../generation/llm");
const { reinitialiser: reinitialiserUsage, resumer: resumerUsage, resumerHistorique } = require("../generation/usage-tracker");
const { choisirAuteur } = require("../generation/choisir-auteur");
const { selectionnerSujetsSeo } = require("./select-keyword-topics");
const { selectionnerActusDuJour } = require("./select-news-topics");
const { ajouterLigneJournal } = require("./journal-sheet");

const ROOT = path.join(__dirname, "..", "..");
const POSTS_DIR = path.join(ROOT, "content", "posts");
const RAPPORTS_DIR = path.join(ROOT, "_strategie", "rapports-pipeline");

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Structure réelle des articles de besthomeproject.com (voir content/posts/*.md
// existants) : pas d'encadrés <div> comme sur techno-play, mais une accroche en
// gras-italique, puis des sections ## , éventuellement un tableau, et une FAQ.
// Les articles existants ont aussi des photos dans le corps (images locales
// /images/articles/...) — volontairement OMISES ici : les générer proprement
// (vraie photo pertinente, hébergée localement) demanderait un pipeline dédié
// non construit pour l'instant. Sans champ `image` en frontmatter, le site
// retombe automatiquement sur la couverture générique de la sous-catégorie
// (voir scripts/generate-covers.js) — pas de rendu cassé, juste moins illustré
// qu'un article rédigé à la main.
const CONSIGNE_STRUCTURE = `Rédige un article complet au format Markdown, prêt à coller dans le corps d'un
fichier (sans frontmatter). Ta réponse doit commencer PAR LE TITRE, seul sur la première
ligne, sans dièse ni guillemets ni gras, suivi d'une ligne vide, puis le corps de l'article.
Le titre est un intitulé naturel et concret (pas nécessairement une question), du type
"Comparer des devis de construction sans se faire piéger" ou "Aides et prêt à taux zéro
pour construire : ce qui est accessible en 2026" — jamais le mot-clé brut.
Ne mets JAMAIS de bloc de code (\`\`\`) autour de ta réponse, et n'ajoute AUCUN commentaire,
note ou explication avant ou après l'article — seulement le titre puis le corps, rien d'autre.
Ne mets AUCUNE image (pas de balise ![...](...)) — le visuel est géré automatiquement par le site.
Le corps suit EXACTEMENT ce fil :
1. Une accroche en gras-italique (***...***), 1 à 2 phrases qui résument le point clé de l'article.
2. Une introduction (2-4 phrases, la situation concrète que le lecteur reconnaît).
3. 3 à 5 sections "## Titre de section" qui répondent à la question de façon progressive et actionnable
   (étapes, critères, pièges à éviter...). Un tableau Markdown est bienvenu si l'article compare
   plusieurs options/postes/critères.
4. "## Questions fréquentes" : 3 à 4 questions en ### , réponses 50-80 mots, concrètes.
Règles : tutoiement, phrases courtes (20 mots en moyenne, 25 max), un mot technique =
une explication au moment où il apparaît, aucune formule qui infantilise ("il suffit de",
"évidemment"...), jamais de tiret cadratin (—). Contexte France (permis de construire,
RE2020, garanties légales de la construction...).`;

const CONSIGNE_RESTER_DANS_LA_SOURCE = `
Important : tu ne disposes que d'un résumé court de la source (pas l'article complet).
N'ajoute AUCUN chiffre, nom, date ou détail qui ne figure pas explicitement dans la source
fournie — ni financement, ni résultat, ni partenaire, ni contexte que tu devinerais.
Si un aspect du sujet manque dans la source, n'en parle simplement pas (raccourcis l'article
sur ce point) plutôt que d'écrire un marqueur [À VÉRIFIER] : préfère un article plus court
mais entièrement sourcé à un article plus complet mais à moitié incertain.
Ne mets JAMAIS de balise [S1], [S2]... dans le texte : ce site n'affiche pas ces
renvois, ils apparaîtraient tels quels, en texte brut visible, ce qui a l'air cassé.`;

// Agent qualité : relit l'article APRÈS le garde-fou anti-hallucination (donc sur un
// texte déjà validé factuellement) et corrige UNIQUEMENT la forme — grammaire,
// orthographe, ton, structure. Interdiction explicite de toucher au fond.
const CONSIGNE_RELECTURE = `Tu es relecteur qualité pour un site grand public francophone (besthomeproject.com,
accompagnement de A à Z d'un projet de maison).
Relis cet article et corrige UNIQUEMENT :
- les fautes de grammaire, d'orthographe et de syntaxe (accords, mots manquants comme "de"/"le"/"la"...)
- les répétitions ou phrases mal formées
- le respect du ton : tutoiement, phrases courtes (20 mots en moyenne, 25 max), jamais "il suffit de" /
  "évidemment", jamais de tiret cadratin (—)
- le respect de la structure Markdown déjà en place (accroche en gras-italique, titres ##, tableaux,
  listes) — ne la change pas, corrige juste ce qui est mal écrit à l'intérieur
Ne change RIEN au fond : n'ajoute, ne retire et ne modifie aucune affirmation, chiffre, date ou fait — UNIQUEMENT
la forme. Corrige aussi le titre s'il contient une faute.
Réponds UNIQUEMENT par un JSON strict, sans texte avant ni après :
  {"ok": true} si rien à corriger
  {"ok": false, "titre": "...", "corps": "..."} avec la version corrigée complète sinon`;

async function genererArticle({ titre, theme, sources = [], brief = "" }) {
  const resultat = await generer({
    phase: "premier-jet",
    consigne: CONSIGNE_STRUCTURE + (sources.length > 0 ? CONSIGNE_RESTER_DANS_LA_SOURCE : ""),
    brief: `Titre de l'article : "${titre}"\nSous-catégorie : ${theme}\n${brief}`,
    sources,
    max_tokens: 6000,
  });
  return resultat;
}

function retirerBlocCode(texte) {
  const t = texte.trim();
  const m = t.match(/^```[a-z]*\n([\s\S]*?)\n```$/i);
  return m ? m[1].trim() : t;
}

function retirerBalisesSources(texte) {
  return texte.replace(/\s?\[S\d+\]/g, "");
}

function descriptionDepuisResume(resume) {
  if (!resume) return null;
  const propre = resume.replace(/\s+/g, " ").replace(/\s([,.;:!?])/g, "$1").trim();
  if (propre.length <= 150) return propre;
  const coupe = propre.slice(0, 150);
  const dernierPoint = coupe.lastIndexOf(". ");
  if (dernierPoint > 60) return coupe.slice(0, dernierPoint + 1);
  const dernierEspace = coupe.lastIndexOf(" ");
  return coupe.slice(0, dernierEspace > 60 ? dernierEspace : 150) + "…";
}

function separerTitreEtCorps(texte, titreDeSecours) {
  const t = retirerBlocCode(texte);
  const lignes = t.split("\n");
  const premiere = lignes[0].trim();
  if (premiere && premiere.length < 120 && !/^[#<*\-]/.test(premiere)) {
    return { titre: premiere, corps: lignes.slice(1).join("\n").trim() };
  }
  return { titre: titreDeSecours, corps: t };
}

async function relireQualite({ titre, corps }) {
  const user = `TITRE :\n${titre}\n\nCORPS (Markdown) :\n${corps}`;
  let texte;
  try {
    texte = await appelBrut({
      model: MODELE_PAR_DEFAUT,
      system: CONSIGNE_RELECTURE,
      messages: [{ role: "user", content: user }],
      max_tokens: 6000,
      phase: "relecture-qualite",
    });
  } catch (err) {
    console.error(`Relecture qualité indisponible (${err.message}) — article conservé tel quel.`);
    return { ok: true };
  }
  const match = texte.match(/\{[\s\S]*\}/);
  if (!match) return { ok: true };
  try {
    const verdict = JSON.parse(match[0]);
    if (verdict.ok) return { ok: true };
    if (typeof verdict.titre === "string" && typeof verdict.corps === "string") {
      return { ok: false, titre: verdict.titre, corps: verdict.corps };
    }
  } catch (err) {
    console.error(`Relecture qualité : JSON invalide (${err.message}) — article conservé tel quel.`);
  }
  return { ok: true };
}

async function construireArticle(sujet) {
  const { theme } = sujet;

  const sources = sujet.sourceUrl
    ? [{ url: sujet.sourceUrl, date: sujet.date || "", texte: `${sujet.titre} — ${sujet.resume || ""}` }]
    : [];

  const resultat = await genererArticle({
    titre: sujet.titre,
    theme,
    sources,
    brief: sujet.keyword ? `Mot-clé cible (SEO) : ${sujet.keyword}, volume estimé ${sujet.volume}/mois.` : "",
  });

  const { titre: titreGenere, corps } = separerTitreEtCorps(resultat.texte, sujet.titre);
  resultat.texte = retirerBalisesSources(corps);

  if (resultat.audit.bloquant) {
    return { ok: false, slug: slugify(titreGenere), raison: `garde-fou : ${resultat.audit.violations.length} violation(s)`, audit: resultat.audit };
  }
  if (resultat.texte.includes("[À VÉRIFIER")) {
    return { ok: false, slug: slugify(titreGenere), raison: "marqueur [À VÉRIFIER] non résolu (info non sourcée) — à corriger ou sourcer" };
  }

  const relecture = await relireQualite({ titre: titreGenere, corps: resultat.texte });
  const titre = relecture.ok ? titreGenere : relecture.titre;
  resultat.texte = relecture.ok ? resultat.texte : relecture.corps;
  if (!relecture.ok) console.log(`Relecture qualité : corrections appliquées pour "${titreGenere}"`);

  const slug = slugify(titre);
  const fichier = path.join(POSTS_DIR, `${slug}.md`);
  if (fs.existsSync(fichier)) {
    return { ok: false, slug, raison: "fichier déjà existant" };
  }

  const choix = choisirAuteur({ titre, description: sujet.resume || "", categorie: theme });
  const today = new Date().toISOString().slice(0, 10);

  const frontmatterLignes = [
    "---",
    `title: ${JSON.stringify(titre)}`,
    `description: ${JSON.stringify(descriptionDepuisResume(sujet.resume) || `Tout savoir sur ${titre.toLowerCase()}.`)}`,
    `date: "${today}"`,
    `author: "${choix.auteur}"`,
    `category: "${theme}"`,
  ];
  if (sources.length > 0) {
    frontmatterLignes.push("sources:");
    for (const s of sources) {
      frontmatterLignes.push(`  - titre: ${JSON.stringify(sujet.titre)}`);
      frontmatterLignes.push(`    url: "${s.url}"`);
    }
    frontmatterLignes.push(`sourcesConsultees: "${today}"`);
  }
  frontmatterLignes.push("---", "");

  const contenu = frontmatterLignes.join("\n") + resultat.texte.trim() + "\n";
  fs.writeFileSync(fichier, contenu, "utf8");

  return { ok: true, slug, fichier, theme, titre, auteur: choix.auteur, type: sujet.type };
}

function verifierBuild() {
  try {
    execSync("node scripts/generation/verifier-contenu.js", { cwd: ROOT, stdio: "pipe" });
    return { ok: true };
  } catch (err) {
    return { ok: false, sortie: err.stdout?.toString() || err.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const val = (nom, defaut) => (args.includes(nom) ? Number(args[args.indexOf(nom) + 1]) : defaut);
  const nSeo = val("--seo", 1);
  const nActu = val("--actu", 1);
  const dryRun = args.includes("--dry-run");
  const push = args.includes("--push");

  reinitialiserUsage();
  const rapport = { date: new Date().toISOString(), articles: [], echecs: [], erreurs: [] };

  console.log(`Sélection : ${nSeo} sujet(s) SEO, ${nActu} actu(s)...`);
  const [sujetsSeo, sujetsActu] = await Promise.all([
    selectionnerSujetsSeo({ n: nSeo }).catch((e) => {
      rapport.erreurs.push(`SEO : ${e.message}`);
      return [];
    }),
    selectionnerActusDuJour({ n: nActu, marquer: !dryRun }).catch((e) => {
      rapport.erreurs.push(`Actu : ${e.message}`);
      return [];
    }),
  ]);

  const tousLesSujets = [
    ...sujetsSeo.map((s) => ({ ...s, titre: s.keyword.charAt(0).toUpperCase() + s.keyword.slice(1), type: "seo" })),
    ...sujetsActu.map((s) => ({ ...s, type: "actu" })),
  ];

  for (const sujet of tousLesSujets) {
    console.log(`Génération : [${sujet.type}] ${sujet.titre}`);
    try {
      const res = await construireArticle(sujet);
      if (res.ok) rapport.articles.push(res);
      else rapport.echecs.push(res);
    } catch (err) {
      rapport.echecs.push({ titre: sujet.titre, raison: err.message });
    }
  }

  if (rapport.articles.length === 0) {
    console.log("Aucun article généré — rien à vérifier/publier.");
  } else if (dryRun) {
    console.log("--dry-run : articles générés mais non commités.");
  } else {
    const verif = verifierBuild();
    rapport.verification = verif;
    if (!verif.ok) {
      console.error("Vérification échouée, rien n'est commité :\n" + verif.sortie);
    } else {
      const fichiers = rapport.articles.map((a) => a.fichier);
      execSync(`git add ${fichiers.map((f) => `"${f}"`).join(" ")}`, { cwd: ROOT });
      const message = `feat(contenu): ${rapport.articles.length} article(s) autopilote (${rapport.articles.map((a) => a.type).join(", ")})\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`;
      execSync(`git commit -m ${JSON.stringify(message)}`, { cwd: ROOT });
      rapport.commit = execSync("git rev-parse HEAD", { cwd: ROOT }).toString().trim();
      if (push) {
        execSync("git push", { cwd: ROOT });
        rapport.pushed = true;
      }
    }
  }

  rapport.usage = resumerUsage();
  rapport.usageDepuisLeDebut = resumerHistorique();

  if (!dryRun) {
    try {
      for (const a of rapport.articles) {
        const relatif = path.relative(ROOT, a.fichier).replace(/\\/g, "/");
        const lien = rapport.commit
          ? `https://github.com/Rabary17/besthomeproject.com/blob/${rapport.commit}/${relatif}`
          : relatif;
        await ajouterLigneJournal({ type: "contenu", action: `Article publié (${a.type})`, detail: a.titre, lien });
      }
      if (rapport.articles.length === 0) {
        await ajouterLigneJournal({
          type: "contenu",
          action: "Aucun article publié",
          detail: rapport.echecs.map((e) => `${e.titre || e.slug} : ${e.raison}`).join(" | ") || "—",
        });
      }
      if (rapport.verification && !rapport.verification.ok) {
        await ajouterLigneJournal({
          type: "erreur",
          action: "Vérification build échouée — rien commité",
          detail: (rapport.verification.sortie || "").slice(0, 300),
        });
      }
      await ajouterLigneJournal({
        type: "résumé",
        action: `Run quotidien : ${rapport.articles.length} publié(s), ${rapport.echecs.length} échec(s)`,
        detail: rapport.erreurs.join(" | ") || "—",
        coutUsd: rapport.usage.coutUsd,
      });
    } catch (err) {
      console.error(`Journal Sheet indisponible (${err.message}) — le rapport JSON reste la source de vérité.`);
    }
  }

  fs.mkdirSync(RAPPORTS_DIR, { recursive: true });
  const nomRapport = `${new Date().toISOString().slice(0, 10)}.json`;
  fs.writeFileSync(path.join(RAPPORTS_DIR, nomRapport), JSON.stringify(rapport, null, 2), "utf8");

  console.log(`\n=== Rapport ===`);
  console.log(`Articles publiés : ${rapport.articles.length}`);
  for (const a of rapport.articles) console.log(`  - [${a.type}] ${a.titre} (${a.fichier})`);
  console.log(`Échecs : ${rapport.echecs.length}`);
  for (const e of rapport.echecs) console.log(`  - ${e.titre || e.slug} : ${e.raison}`);
  console.log(`\n=== Usage Claude (ce run) ===`);
  console.log(`Appels : ${rapport.usage.appels} · input : ${rapport.usage.inputTokens} tokens · output : ${rapport.usage.outputTokens} tokens`);
  console.log(`Coût équivalent API${rapport.usage.coutConnu ? "" : " (non disponible)"} : $${rapport.usage.coutUsd.toFixed(4)}`);
  console.log(`Coût cumulé depuis le début : $${rapport.usageDepuisLeDebut.coutUsd.toFixed(4)} sur ${rapport.usageDepuisLeDebut.appels} appel(s)`);
  console.log(`Rapport détaillé : ${path.join(RAPPORTS_DIR, nomRapport)}`);
}

main().catch((err) => {
  console.error("Erreur pipeline :", err);
  process.exit(1);
});
