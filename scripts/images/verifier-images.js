// Contrôle strict des images à la une : échoue si une même photo sert à plusieurs
// articles. Un article sans vraie image (placeholder) est signalé, sans bloquer.
// Usage : node scripts/images/verifier-images.js
const path = require("path");
const u = require("./unicite");

const POSTS_DIR = path.join(__dirname, "..", "..", "content", "posts");

const doublons = u.articlesADoublonner(POSTS_DIR);
const sansVraieImage = u.lireArticles(POSTS_DIR).filter((a) => !a.image || u.estPlaceholder(a.image));

if (sansVraieImage.length) {
  console.warn(`Attention : ${sansVraieImage.length} article(s) sans vraie image : ${sansVraieImage.map((a) => a.fichier).join(", ")}`);
}
if (doublons.length) {
  console.error(`ÉCHEC : ${doublons.length} article(s) partagent une photo déjà utilisée : ${doublons.map((a) => a.fichier).join(", ")}`);
  process.exit(1);
}
console.log("Images : aucun doublon.");
