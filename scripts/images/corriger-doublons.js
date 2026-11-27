// Corrige les images à la une : articles sans vraie image (placeholder) et articles
// dont la photo est déjà utilisée ailleurs sur le site (on garde le plus ancien).
// Usage : node scripts/images/corriger-doublons.js [--dry-run]
// Clés lues dans l'environnement : UNSPLASH_ACCESS_KEY, PEXELS_API_KEY, PIXABAY_API_KEY.
const fs = require("fs");
const path = require("path");
const { findImage } = require("../seo/image-client");
const u = require("./unicite");

const POSTS_DIR = path.join(__dirname, "..", "..", "content", "posts");
const DRY = process.argv.includes("--dry-run");

async function main() {
  const articles = u.lireArticles(POSTS_DIR);
  const sansVraieImage = articles.filter((a) => !a.image || u.estPlaceholder(a.image));
  const doublons = u.articlesADoublonner(POSTS_DIR);
  const cibles = [...new Map([...sansVraieImage, ...doublons].map((a) => [a.fichier, a])).values()];

  // Photos déjà prises par les articles qu'on ne touche pas.
  const cibleFichiers = new Set(cibles.map((c) => c.fichier));
  const utilisees = new Set();
  for (const a of articles) {
    if (!cibleFichiers.has(a.fichier) && a.image && !u.estPlaceholder(a.image)) utilisees.add(u.identifiantImage(a.image));
  }

  console.log(`${cibles.length} article(s) à corriger (${sansVraieImage.length} sans vraie image, ${doublons.length} doublon(s)).`);
  let corriges = 0;
  for (const a of cibles) {
    const trouvee = await u.choisirImageUnique(u.requetesImage({ titre: a.titre }), findImage, utilisees);
    if (!trouvee) {
      console.log(`  ${a.fichier} : aucune photo libre trouvée, image inchangée.`);
      continue;
    }
    if (!DRY) fs.writeFileSync(a.chemin, u.ecrireImageDansFrontmatter(a.brut, trouvee.url, trouvee.alt || a.titre), "utf8");
    console.log(`  ${a.fichier} : ${DRY ? "[dry-run] " : ""}${trouvee.url.slice(0, 90)}`);
    corriges++;
  }
  console.log(`Terminé : ${corriges} image(s) corrigée(s).`);
}

main().catch((e) => {
  console.error("ÉCHEC :", e.message);
  process.exit(1);
});
