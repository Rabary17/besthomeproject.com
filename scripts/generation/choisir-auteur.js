// Choix de l'auteur d'un article selon sa spécialité, au moment de la
// publication. Les règles vivent dans lib/auteurs-specialites.json (source
// unique, lue aussi par le site) :
//   1. mots-clés du titre et des tags : l'auteur qui cumule le plus de
//      correspondances l'emporte ;
//   2. égalité ou aucune correspondance : titulaire de la sous-catégorie ;
//   3. sinon : rédacteur en chef (`defaut`).
// Le frontmatter `author:` reste modifiable à la main après coup.
//
// CLI :
//   node scripts/generation/choisir-auteur.js --categorie bricolage-reparations "Titre"
//   node scripts/generation/choisir-auteur.js --fichier content/posts/x.md [--ecrire]
"use strict";
const fs = require("fs");
const path = require("path");

const REGLES = require("../../lib/auteurs-specialites.json");

/** Minuscules, sans accents, apostrophes typographiques ramenées à « ' ». */
function normaliser(texte) {
  return String(texte || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Mots-clés de chaque auteur trouvés dans le texte (mot entier, pluriel en s/x toléré). */
function correspondances(texte, motsCles = REGLES.motsCles) {
  const t = ` ${normaliser(texte)} `;
  const resultat = {};
  for (const [auteur, liste] of Object.entries(motsCles)) {
    const trouves = liste.filter((kw) => {
      const re = new RegExp(`(^|[^a-z0-9])${echapper(normaliser(kw))}(s|x)?(?=$|[^a-z0-9])`);
      return re.test(t);
    });
    if (trouves.length) resultat[auteur] = trouves;
  }
  return resultat;
}

/**
 * @param {{titre?: string, categorie?: string, tags?: string[]}} article
 * @returns {{auteur: string, raison: string, correspondances: Record<string,string[]>}}
 */
function choisirAuteur({ titre = "", description = "", categorie = "", tags = [] } = {}, regles = REGLES) {
  const trouve = correspondances([titre, description, ...tags].join(" "), regles.motsCles);
  const titulaire = regles.categories[categorie];
  const max = Math.max(0, ...Object.values(trouve).map((l) => l.length));
  const enTete = Object.keys(trouve).filter((a) => trouve[a].length === max);

  if (enTete.length === 1) {
    return { auteur: enTete[0], raison: `spécialité (mots-clés : ${trouve[enTete[0]].join(", ")})`, correspondances: trouve };
  }
  if (enTete.length > 1 && titulaire && enTete.includes(titulaire)) {
    return { auteur: titulaire, raison: `égalité de mots-clés, départagée par la sous-catégorie « ${categorie} »`, correspondances: trouve };
  }
  if (titulaire) {
    return { auteur: titulaire, raison: `titulaire de la sous-catégorie « ${categorie} »`, correspondances: trouve };
  }
  return { auteur: regles.defaut, raison: "aucune spécialité reconnue : rédacteur en chef par défaut", correspondances: trouve };
}

/** Lecture minimale du frontmatter (titre, catégorie, tags) — sans dépendance. */
function lireFrontmatter(source) {
  const fm = (source.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || "";
  const champ = (cle) => {
    const m = fm.match(new RegExp(`^${cle}:\\s*(.*)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  };
  const tags = champ("tags").replace(/^\[|\]$/g, "").split(",").map((t) => t.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  return { titre: champ("title"), description: champ("description"), categorie: champ("category"), tags };
}

/** Écrit (ou remplace) la ligne `author:` du frontmatter, sans reformater le reste. */
function ecrireAuteur(source, auteur) {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) throw new Error("frontmatter introuvable");
  let fm = m[1];
  if (/^author:.*$/m.test(fm)) fm = fm.replace(/^author:.*$/m, `author: "${auteur}"`);
  else if (/^date:.*$/m.test(fm)) fm = fm.replace(/^(date:.*)$/m, `$1\nauthor: "${auteur}"`);
  else fm += `\nauthor: "${auteur}"`;
  return source.replace(m[0], `---\n${fm}\n---`);
}

module.exports = { normaliser, correspondances, choisirAuteur, ecrireAuteur, lireFrontmatter, REGLES };

if (require.main === module) {
  const args = process.argv.slice(2);
  const val = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const fichier = val("--fichier");
  let article;
  if (fichier) {
    const source = fs.readFileSync(fichier, "utf8");
    article = lireFrontmatter(source);
    const choix = choisirAuteur(article);
    console.log(`${path.basename(fichier)} → ${choix.auteur} (${choix.raison})`);
    if (args.includes("--ecrire")) {
      fs.writeFileSync(fichier, ecrireAuteur(source, choix.auteur), "utf8");
      console.log("  frontmatter mis à jour");
    }
  } else {
    const categorie = val("--categorie");
    const titre = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--categorie").join(" ");
    if (!titre && !categorie) {
      console.error('Usage : choisir-auteur.js --categorie <slug> "Titre"  |  --fichier article.md [--ecrire]');
      process.exit(1);
    }
    const choix = choisirAuteur({ titre, categorie });
    console.log(`${choix.auteur} (${choix.raison})`);
  }
}
