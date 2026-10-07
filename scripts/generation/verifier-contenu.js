// Contrôle bloquant avant chaque build (npm « prebuild », donc aussi sur
// Vercel) — dernier maillon du garde-fou « date de coupure » :
//   1. aucun article publié ne doit contenir de marqueur [À VÉRIFIER] ;
//   2. un article qui cite une date postérieure à la coupure du modèle de
//      génération doit déclarer ses sources en frontmatter (`sources:`).
// Échec → le build s'arrête avec la liste des passages à traiter.
"use strict";
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { auditer, CUTOFFS_OFFICIELS, MARQUEUR } = require("./garde-fou-cutoff");

const MODELE = process.env.GENERATION_MODEL || "claude-sonnet-5-5";
const CUTOFF = CUTOFFS_OFFICIELS[MODELE];
const DIR = path.join(__dirname, "..", "..", "content", "posts");

const erreurs = [];
for (const f of fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((x) => x.endsWith(".md")) : []) {
  const { data, content } = matter(fs.readFileSync(path.join(DIR, f), "utf8"));
  const lignes = content.split("\n");
  lignes.forEach((l, i) => {
    if (l.includes(MARQUEUR.slice(0, -1))) erreurs.push(`${f}:${i + 1} — marqueur non résolu : ${l.trim().slice(0, 100)}`);
  });
  const aDesSources = Array.isArray(data.sources) ? data.sources.length > 0 : Boolean(data.sources);
  if (CUTOFF && !aDesSources) {
    const r = auditer(content, { cutoff: CUTOFF });
    for (const v of r.violations.filter((x) => x.type === "date-posterieure")) {
      erreurs.push(`${f} — « ${v.extrait} » ${v.raison} : ajouter \`sources:\` en frontmatter ou retirer l'information`);
    }
  }
}
if (erreurs.length) {
  console.error(`\n✖ Garde-fou date de coupure (${MODELE}, coupure ${CUTOFF}) — publication bloquée :`);
  for (const e of erreurs) console.error(`  - ${e}`);
  console.error("");
  process.exit(1);
}
console.log(`✓ Garde-fou date de coupure : aucun passage bloquant (${MODELE}, coupure ${CUTOFF}).`);
