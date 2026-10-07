#!/usr/bin/env node
// Usage : npm run new-post -- --categorie devis-construction "Titre de l'article"
// Crée content/posts/<slug>.md avec le frontmatter déjà rempli (date du
// jour, slug dérivé du titre) — évite les fautes de frappe dans les clés
// YAML attendues par lib/posts.ts. L'auteur est choisi selon sa spécialité
// (titre + sous-catégorie, voir scripts/generation/choisir-auteur.js).
const fs = require("fs");
const path = require("path");
const { choisirAuteur, REGLES } = require("./generation/choisir-auteur");

const args = process.argv.slice(2);
const iCat = args.indexOf("--categorie");
const categorie = iCat >= 0 ? args[iCat + 1] : "";
const title = args.filter((_, i) => iCat < 0 || (i !== iCat && i !== iCat + 1)).join(" ").trim();
if (!title) {
  console.error('Usage : npm run new-post -- --categorie <slug> "Titre de l\'article"');
  process.exit(1);
}
if (categorie && !REGLES.categories[categorie]) {
  console.error(`Sous-catégorie inconnue : ${categorie}`);
  process.exit(1);
}
const choix = choisirAuteur({ titre: title, categorie });

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const slug = slugify(title);
const dir = path.join(__dirname, "..", "content", "posts");
const file = path.join(dir, `${slug}.md`);

if (fs.existsSync(file)) {
  console.error(`Existe déjà : content/posts/${slug}.md`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "TODO — une phrase, affichée dans le listing et les meta/OG."
date: "${today}"
# Auteur : slug de lib/authors.ts, choisi selon sa spécialité
# (${choix.raison}). Modifiable à la main.
author: "${choix.auteur}"
# Sous-catégorie : un des slugs de lib/categories.ts —
#   Préparer son projet : aides-budget, terrain-etudes, plans-dessinateur,
#     devis-construction
#   Lancer le projet : choisir-entreprises, permis-demarches,
#     contrats-assurances
#   Le chantier : fondations-gros-oeuvre, hors-d-eau-hors-d-air,
#     plomberie-electricite, peinture-sols-murs, suivi-chantier
#   Livraison : reception-reserves, garanties-mise-en-service
#   Rénovation, déco & aménagement : renovation-travaux,
#     bricolage-reparations, energie-economies, deco-ambiance,
#     amenagement-rangement, maison-en-famille, jardin-exterieur
#   Équipements & comparatifs : outillage-equipement,
#     electromenager-cuisine, maison-connectee-securite, jardin-plein-air
# Détermine la rubrique, le fil d'Ariane et l'image à la une de secours.
category: "${categorie || "TODO"}"
# Date de mise à jour (optionnelle) : "AAAA-MM-JJ"
# updated: "${today}"
# Image à la une (optionnelle) : chemin sous public/ ou URL absolue. Sans
# elle, la couverture de la rubrique ci-dessus est utilisée automatiquement
# (voir lib/posts.ts, resolveCoverImage).
# image: "/uploads/mon-image.jpg"
# imageAlt: "TODO — description de l'image pour l'accessibilité et le SEO"
---

TODO — contenu de l'article en Markdown.
`;

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(file, frontmatter, "utf8");
console.log(`Créé : content/posts/${slug}.md — auteur : ${choix.auteur} (${choix.raison})`);
