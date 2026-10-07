#!/usr/bin/env node
// Usage : npm run generate-favicons
//
// Dérive de public/icon.svg les rasters PNG que les navigateurs/plateformes
// n'acceptant pas un favicon SVG exigent encore : icône iOS "ajouter à
// l'écran d'accueil" (apple-touch-icon, doit être un PNG) et un favicon
// PNG de secours pour les très vieux navigateurs et certains robots de
// prévisualisation (réseaux sociaux, etc.) qui ne lisent pas le SVG. Le
// SVG reste la source de vérité (voir public/icon.svg) ; ce script se
// contente de le rasteriser — le relancer si la marque change.
//
// Variante claire uniquement : ces formats n'ont pas de mécanisme de mode
// sombre (contrairement à public/icon.svg, qui s'adapte seul via CSS).
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function main() {
  const svgPath = path.join(__dirname, "..", "public", "icon.svg");
  const publicDir = path.join(__dirname, "..", "public");
  let svg = fs.readFileSync(svgPath, "utf8");
  // Force la variante claire (fond vert marque, marque blanche) : on retire
  // la media query sombre pour ce rendu figé.
  svg = svg.replace(/@media \(prefers-color-scheme: dark\)[^}]*\{[^}]*\}\s*\}/s, "");

  const targets = [
    { file: "apple-touch-icon.png", size: 180 },
    { file: "favicon-32x32.png", size: 32 },
    { file: "favicon-192x192.png", size: 192 },
  ];

  for (const { file, size } of targets) {
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(publicDir, file));
    console.log(`Généré : public/${file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
