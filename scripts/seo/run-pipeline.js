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
// --delai-min / --delai-max : minutes entre deux publications (défaut 5-15) — les articles
//   d'un même run sont commités/poussés un par un, décalés dans le temps, jamais tous d'un coup.
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
const { findImage } = require("./image-client");
const { voixPour } = require("../generation/voix-auteurs");
const { choisirParmi, entier } = require("../generation/variation");

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
// Les articles existants ont aussi des photos DANS LE CORPS (images locales
// /images/articles/...) — celles-ci restent volontairement OMISES : les générer
// proprement (photo pertinente par section, hébergée localement) demanderait un
// pipeline dédié non construit pour l'instant. En revanche chaque article reçoit
// une image À LA UNE (frontmatter `image`/`imageAlt`, voir findImage() plus bas) —
// lib/posts.ts accepte explicitement une URL absolue, pas seulement un chemin
// local (cf. commentaire sur le champ `image` dans ce fichier).
// Variation structurelle : sans ça, tous les articles d'un même lot suivent le
// même gabarit au nombre de sections/questions près — ça ressemble vite à du
// contenu produit en série, un signal que Google surveille (abus de contenu à
// grande échelle). Chaque appel tire sa propre combinaison.
function tirerVariation() {
  return {
    nbSections: entier(3, 5),
    nbFaq: entier(3, 4),
    angleOuverture: choisirParmi([
      "une situation concrète que le lecteur vit en ce moment dans son projet",
      "une question directe posée au lecteur",
      "un constat sur ce qui change ou ce qu'on sous-estime souvent sur ce sujet",
    ]),
  };
}

function construireConsigneStructure(variation, volume) {
  return `Rédige un article complet au format Markdown, prêt à coller dans le corps d'un
fichier (sans frontmatter). Ta réponse doit commencer PAR LE TITRE, seul sur la première
ligne, sans dièse ni guillemets ni gras, suivi d'une ligne vide, puis le corps de l'article.
Le titre est un intitulé naturel et concret (pas nécessairement une question), du type
"Comparer des devis de construction sans se faire piéger" ou "Aides et prêt à taux zéro
pour construire : ce qui est accessible en 2026" — jamais le mot-clé brut.
Ne mets JAMAIS de bloc de code (\`\`\`) autour de ta réponse, et n'ajoute AUCUN commentaire,
note ou explication avant ou après l'article — seulement le titre puis le corps, rien d'autre.
Ne mets AUCUNE image dans le corps (pas de balise ![...](...)) — l'image à la une est gérée à part.
Le corps suit ce fil :
1. Une accroche en gras-italique (***...***), 1 à 2 phrases qui résument le point clé de l'article.
2. Une introduction (2-4 phrases) qui part de ${variation.angleOuverture}.
3. ${variation.nbSections} sections "## Titre de section" qui répondent à la question de façon
   progressive et actionnable (étapes, critères, pièges à éviter...). Un tableau Markdown est
   bienvenu si l'article compare plusieurs options/postes/critères. Si une section est formulée
   comme une question ("Comment...", "Combien coûte...", "Quelle est la différence..."), la toute
   première phrase qui suit doit répondre directement en 1-2 phrases courtes, avant tout
   développement : jamais une mise en contexte avant la réponse.
4. "## Questions fréquentes" : ${variation.nbFaq} questions en ### , réponses 50-80 mots, concrètes.
Règles : tutoiement, phrases courtes (20 mots en moyenne, 25 max), un mot technique =
une explication au moment où il apparaît, aucune formule qui infantilise ("il suffit de",
"évidemment"...), jamais de tiret cadratin (—). Contexte France (permis de construire,
RE2020, garanties légales de la construction...).
Gras sémantique : dans chaque section ##, mets en **gras** (Markdown \`**...**\`) 2 à 4 passages
de 1 à 4 mots liés au mot-clé ou au vocabulaire technique du sujet (pas seulement des chiffres).
Jamais une phrase entière en gras, jamais le même terme mis en gras à plusieurs endroits de
l'article.
Si l'article compare des chiffres, des prix (construction, devis, aides...) ou des
caractéristiques, présente-les dans un vrai tableau Markdown ou une liste : une donnée de
comparaison ne doit jamais être lisible uniquement sur l'image à la une.
Si tu recommandes un type de prestataire, un matériau ou un produit précis, c'est important sur
ce site : les lecteurs s'en servent pour choisir un vrai professionnel ou un vrai produit, donc
explique toujours en une phrase pourquoi ce choix plutôt qu'un autre. N'écris jamais une
recommandation sans cette justification.${volume && volume > 500 ? `
Volume de recherche estimé pour ce sujet : ${volume}/mois, un volume notable : développe
l'article plus complètement (sections plus détaillées, davantage de cas concrets) plutôt qu'un
traitement minimal, sans pour autant gonfler artificiellement un sujet simple.` : ""}`;
}

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
- le gras sémantique : vérifie qu'il y a bien 2 à 4 passages en **gras** par section ##, courts
  (1 à 4 mots) et liés au sujet, jamais une phrase entière en gras, jamais le même terme en gras à
  plusieurs endroits de l'article — ajoute ou retire des **gras** si besoin, sans changer le texte
- que la réponse à une section-question ("Comment...", "Combien coûte...", "Quelle est la
  différence..."...) arrive bien dès la première phrase, sans longue mise en contexte avant :
  si c'est le cas, réordonne pour que la réponse arrive en premier, sans changer les informations
Ne change RIEN au fond : n'ajoute, ne retire et ne modifie aucune affirmation, chiffre, date ou fait — UNIQUEMENT
la forme. Corrige aussi le titre s'il contient une faute.
Ne lisse PAS le style propre de l'auteur (rythme de phrase, tournures récurrentes) vers un style
neutre générique — corrige seulement les vraies fautes, en gardant sa voix reconnaissable.
Réponds UNIQUEMENT par un JSON strict, sans texte avant ni après :
  {"ok": true} si rien à corriger
  {"ok": false, "titre": "...", "corps": "..."} avec la version corrigée complète sinon`;

async function genererArticle({ titre, theme, sources = [], brief = "", voix = "", volume }) {
  const variation = tirerVariation();
  const resultat = await generer({
    phase: "premier-jet",
    consigne: construireConsigneStructure(variation, volume) + (sources.length > 0 ? CONSIGNE_RESTER_DANS_LA_SOURCE : ""),
    instructions: voix,
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

// Requête image générique par sous-catégorie (repli quand le sujet n'a pas de
// mot-clé exploitable, ou pour les actus dont le titre contient souvent une
// marque/un nom propre qui égarerait la recherche photo).
const REQUETE_IMAGE_PAR_THEME = {
  "aides-budget": "financement maison budget",
  "terrain-etudes": "terrain à bâtir",
  "plans-dessinateur": "plan de maison architecte",
  "devis-construction": "devis construction documents",
  "choisir-entreprises": "chantier construction équipe",
  "permis-demarches": "permis de construire document",
  "contrats-assurances": "contrat signature stylo",
  "fondations-gros-oeuvre": "fondation chantier béton",
  "hors-d-eau-hors-d-air": "charpente toiture maison",
  "plomberie-electricite": "installation électrique maison",
  "peinture-sols-murs": "peinture mur intérieur",
  "suivi-chantier": "chantier construction maison",
  "reception-reserves": "maison neuve clés",
  "garanties-mise-en-service": "maison neuve livraison",
  "renovation-travaux": "rénovation maison travaux",
  "bricolage-reparations": "bricolage outils",
  "energie-economies": "isolation maison énergie",
  "deco-ambiance": "décoration intérieure salon",
  "amenagement-rangement": "aménagement intérieur rangement",
  "maison-en-famille": "famille maison enfants",
  "jardin-exterieur": "jardin maison extérieur",
  "outillage-equipement": "outils bricolage",
  "electromenager-cuisine": "cuisine électroménager",
  "maison-connectee-securite": "maison connectée sécurité",
  "jardin-plein-air": "jardin extérieur tondeuse",
};

// Toutes les URLs d'image déjà utilisées dans les articles existants — relu à chaque
// appel (pas mis en cache) pour voir aussi les images choisies plus tôt dans CE run.
function imagesDejaUtilisees() {
  const urls = new Set();
  if (!fs.existsSync(POSTS_DIR)) return urls;
  for (const f of fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"))) {
    const m = fs.readFileSync(path.join(POSTS_DIR, f), "utf8").match(/^image:\s*"([^"]+)"/m);
    if (m) urls.add(m[1]);
  }
  return urls;
}

async function construireArticle(sujet) {
  const { theme } = sujet;

  const sources = sujet.sourceUrl
    ? [{ url: sujet.sourceUrl, date: sujet.date || "", texte: `${sujet.titre} — ${sujet.resume || ""}` }]
    : [];

  // Auteur choisi AVANT la génération (sur le sujet, pas le titre généré) pour
  // que son style soit injecté dans le prompt — voir voix-auteurs.js.
  const choixAuteur = choisirAuteur({ titre: sujet.titre, description: sujet.resume || "", categorie: theme });

  const resultat = await genererArticle({
    titre: sujet.titre,
    theme,
    sources,
    brief: sujet.keyword ? `Mot-clé cible (SEO) : ${sujet.keyword}, volume estimé ${sujet.volume}/mois.` : "",
    voix: voixPour(choixAuteur.auteur),
    volume: sujet.volume,
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

  const choix = choixAuteur;
  const today = new Date().toISOString().slice(0, 10);

  // Image à la une obligatoire (au moins une par article) — requête par
  // sous-catégorie plutôt que le titre brut, pour éviter une marque/un produit
  // qui dérive la recherche (ex. un article sur une marque de peinture doit
  // renvoyer une photo de "peindre un mur", pas chercher la marque elle-même).
  // Anti-doublon : deux articles de la même sous-catégorie sans mot-clé (cas
  // fréquent des actus) retomberaient sinon sur le même résultat #1 — bug
  // observé sur techno-play.com, corrigé aussi ici par précaution.
  let image = null;
  try {
    const requeteImage = sujet.keyword || REQUETE_IMAGE_PAR_THEME[theme] || titre;
    const resultats = await findImage(requeteImage);
    const dejaUtilisees = imagesDejaUtilisees();
    image = resultats.find((r) => !dejaUtilisees.has(r.url)) || resultats[0] || null;
  } catch (err) {
    console.error(`Image non trouvée pour "${titre}" : ${err.message}`);
  }

  const frontmatterLignes = [
    "---",
    `title: ${JSON.stringify(titre)}`,
    `description: ${JSON.stringify(descriptionDepuisResume(sujet.resume) || `Tout savoir sur ${titre.toLowerCase()}.`)}`,
    `date: "${today}"`,
    `author: "${choix.auteur}"`,
    `category: "${theme}"`,
  ];
  if (image) {
    frontmatterLignes.push(`image: "${image.url}"`);
    frontmatterLignes.push(`imageAlt: ${JSON.stringify(image.alt || titre)}`);
  }
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

  return { ok: true, slug, fichier, theme, titre, auteur: choix.auteur, image: image?.url, type: sujet.type };
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
      // Publication échelonnée : un commit (+ push) par article, jamais tous
      // d'un coup — avec un délai aléatoire entre deux, pour que les articles
      // d'un même run n'apparaissent pas tous à la même seconde/minute.
      const delaiMin = val("--delai-min", 5); // minutes
      const delaiMax = val("--delai-max", 15);
      for (let i = 0; i < rapport.articles.length; i++) {
        const a = rapport.articles[i];
        execSync(`git add "${a.fichier}"`, { cwd: ROOT });
        const message = `feat(contenu): article autopilote (${a.type}) — ${a.titre}\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`;
        execSync(`git commit -m ${JSON.stringify(message)}`, { cwd: ROOT });
        a.commit = execSync("git rev-parse HEAD", { cwd: ROOT }).toString().trim();
        if (push) {
          execSync("git push", { cwd: ROOT });
          a.pushed = true;
        }
        console.log(`Publié : [${a.type}] ${a.titre} (commit ${a.commit.slice(0, 7)})`);
        const dernier = i === rapport.articles.length - 1;
        if (!dernier && delaiMax > 0) {
          const minutes = delaiMin + Math.random() * Math.max(0, delaiMax - delaiMin);
          console.log(`Attente de ${minutes.toFixed(1)} min avant la prochaine publication...`);
          await new Promise((r) => setTimeout(r, minutes * 60 * 1000));
        }
      }
    }
  }

  rapport.usage = resumerUsage();
  rapport.usageDepuisLeDebut = resumerHistorique();

  if (!dryRun) {
    try {
      for (const a of rapport.articles) {
        const relatif = path.relative(ROOT, a.fichier).replace(/\\/g, "/");
        const lienCode = a.commit
          ? `https://github.com/Rabary17/besthomeproject.com/blob/${a.commit}/${relatif}`
          : relatif;
        await ajouterLigneJournal({
          type: "contenu",
          action: `Article publié (${a.type})`,
          detail: a.titre,
          lienSite: `https://besthomeproject.com/${a.slug}/`,
          lienCode,
        });
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
