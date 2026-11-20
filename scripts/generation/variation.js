// Petit utilitaire de tirage aléatoire, utilisé pour faire varier la
// structure d'un article à l'autre (nombre de sections, de questions FAQ,
// style d'ouverture...) — voir l'usage dans scripts/seo/run-pipeline.js.
// Sans cette variation, des articles générés par lot suivent tous le même
// gabarit exact, ce qui ressemble à du contenu produit en masse plutôt qu'à
// de vrais articles — un signal que Google surveille explicitement.
"use strict";

function choisirParmi(options) {
  return options[Math.floor(Math.random() * options.length)];
}

function entier(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

module.exports = { choisirParmi, entier };
