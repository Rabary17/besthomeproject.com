#!/usr/bin/env node
// Usage : npm run generate-covers
//
// Génère une image de couverture de secours par rubrique dans
// public/covers/<slug>.png (1200×630, ratio Open Graph standard) :
// fond couleur de marque + icône Lucide de la rubrique + titre. Utilisée
// par lib/posts.ts comme image à la une quand un article n'a pas de champ
// `image` en frontmatter, et comme image Open Graph/Twitter par défaut
// (voir app/[slug]/page.tsx et app/layout.tsx).
//
// Les couleurs ci-dessous DOIVENT rester synchronisées avec les tokens
// --brand/--brand-hover/--signal de app/globals.css (identité Best Home
// Project : vert forêt + point orange). Si la charte change, relancer ce script pour régénérer les
// visuels — rien d'autre à toucher.
//
// Icônes Lucide : copies locales de lucide-static@0.460.0 dans
// scripts/lucide-icons/ (même version que la note de version dans
// app/globals.css, pour que les noms d'icônes utilisés partout restent
// cohérents). Copies locales plutôt qu'un fetch réseau à chaque
// génération : plus fiable, et reproductible même hors ligne. Pour
// ajouter une rubrique, télécharger sa nouvelle icône depuis
// https://unpkg.com/lucide-static@0.460.0/icons/<nom>.svg (vérifier
// d'abord qu'elle existe à cette version sur https://lucide.dev/icons) et
// la déposer dans ce même dossier.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ICONS_DIR = path.join(__dirname, "lucide-icons");
const BRAND = "#17603F";
const BRAND_HOVER = "#0F4A31";
const SIGNAL = "#F28C28";
const WHITE = "#FFFFFF";

// Une couverture par rubrique ET par sous-catégorie — garder synchronisé
// avec lib/categories.ts (slug, titre, icône).
const CATEGORIES = [
  // Rubriques
  { slug: "preparer-son-projet", title: "Préparer son projet", icon: "lightbulb" },
  { slug: "lancer-le-projet", title: "Lancer le projet", icon: "scale" },
  { slug: "chantier-etape-par-etape", title: "Le chantier, étape par étape", icon: "hammer" },
  { slug: "livraison-reception", title: "Livraison & Réception", icon: "shield-check" },
  { slug: "renovation-deco-amenagement", title: "Rénovation, Déco & Aménagement", icon: "lamp" },
  { slug: "equipements-comparatifs", title: "Équipements & Comparatifs", icon: "house" },
  // Préparer son projet
  { slug: "aides-budget", title: "Budget, Financement & Aides", icon: "piggy-bank" },
  { slug: "terrain-etudes", title: "Terrain & Études", icon: "trees" },
  { slug: "plans-dessinateur", title: "Plans & Dessinateur", icon: "lightbulb" },
  { slug: "devis-construction", title: "Devis de construction", icon: "scale" },
  // Lancer le projet
  { slug: "choisir-entreprises", title: "Choisir ses entreprises", icon: "shield-check" },
  { slug: "permis-demarches", title: "Permis & Démarches", icon: "newspaper" },
  { slug: "contrats-assurances", title: "Contrats & Assurances", icon: "shield-alert" },
  // Le chantier, étape par étape
  { slug: "fondations-gros-oeuvre", title: "Fondations & Gros œuvre", icon: "hammer" },
  { slug: "hors-d-eau-hors-d-air", title: "Hors d'eau & Hors d'air", icon: "house" },
  { slug: "plomberie-electricite", title: "Plomberie & Électricité", icon: "plug-zap" },
  { slug: "peinture-sols-murs", title: "Sols, Murs & Finitions", icon: "paint-roller" },
  { slug: "suivi-chantier", title: "Suivi & Contrôles", icon: "shield-check" },
  // Livraison & Réception
  { slug: "reception-reserves", title: "Réception & Réserves", icon: "shield-check" },
  { slug: "garanties-mise-en-service", title: "Garanties & Mise en service", icon: "shield-alert" },
  // Rénovation, Déco & Aménagement
  { slug: "renovation-travaux", title: "Rénovation & Travaux", icon: "hammer" },
  { slug: "bricolage-reparations", title: "Bricolage & Réparations", icon: "hammer" },
  { slug: "energie-economies", title: "Énergie & Isolation", icon: "thermometer" },
  { slug: "deco-ambiance", title: "Déco & Ambiance", icon: "lamp" },
  { slug: "amenagement-rangement", title: "Aménagement & Rangement", icon: "armchair" },
  { slug: "maison-en-famille", title: "Maison en famille", icon: "baby" },
  { slug: "jardin-exterieur", title: "Jardin & Extérieur", icon: "flower-2" },
  // Équipements & Comparatifs
  { slug: "outillage-equipement", title: "Outillage & Équipement", icon: "drill" },
  { slug: "electromenager-cuisine", title: "Électroménager & Cuisine", icon: "cooking-pot" },
  { slug: "maison-connectee-securite", title: "Maison connectée & Sécurité", icon: "house" },
  { slug: "jardin-plein-air", title: "Jardin & Plein air", icon: "trees" },
];

function readIconInner(name) {
  const file = path.join(ICONS_DIR, `${name}.svg`);
  const data = fs.readFileSync(file, "utf8");
  const match = data.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!match) {
    throw new Error(`SVG inattendu pour ${name} (${file})`);
  }
  return match[1].trim();
}

// Découpe grossière du titre en 1-2 lignes pour qu'il tienne dans la
// largeur du visuel à cette taille de police (pas besoin de plus robuste :
// les titres sont connus et fixes).
function wrapTitle(title, maxCharsPerLine = 21) {
  const words = title.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function buildSvg(category) {
  const iconInner = readIconInner(category.icon);
  const lines = wrapTitle(category.title);
  const lineHeight = 66;
  const titleStartY = 400;
  const titleTspans = lines
    .map(
      (line, i) =>
        `<tspan x="80" y="${titleStartY + i * lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BRAND}"/>
  <circle cx="1010" cy="110" r="230" fill="${BRAND_HOVER}" opacity="0.55"/>
  <g transform="translate(80,100) scale(8)" fill="none" stroke="${WHITE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    ${iconInner}
  </g>
  <circle cx="252" cy="272" r="20" fill="${SIGNAL}"/>
  <text font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="58" fill="${WHITE}">${titleTspans}</text>
  <text x="80" y="560" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="28" letter-spacing="2" fill="${WHITE}" opacity="0.85">BEST HOME PROJECT</text>
</svg>`;
}

// Visuel par défaut du site (pages sans rubrique : accueil, à propos,
// contact...) — même traitement que les rubriques, mais avec le vrai
// logo (pastille + maison + point) au lieu d'une icône Lucide, et le
// nom du site + sa tagline au lieu d'un titre de rubrique.
function buildDefaultSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BRAND}"/>
  <circle cx="1010" cy="110" r="230" fill="${BRAND_HOVER}" opacity="0.55"/>
  <rect x="80" y="100" width="192" height="192" rx="48" fill="${WHITE}"/>
  <g transform="translate(80,100) scale(3)">
    <polygon points="32,14 51,30 51,49 13,49 13,30" fill="${BRAND}" stroke="${BRAND}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="32" cy="38" r="5.5" fill="${SIGNAL}"/>
  </g>
  <text x="80" y="400" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="64" fill="${WHITE}">Best Home Project</text>
  <text font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="30" fill="${WHITE}" opacity="0.9">
    <tspan x="80" y="452">Guides, comparatifs et idées :</tspan>
    <tspan x="80" y="490">ta maison, sans jargon ni baratin</tspan>
  </text>
</svg>`;
}

async function main() {
  const outDir = path.join(__dirname, "..", "public", "covers");
  fs.mkdirSync(outDir, { recursive: true });

  for (const category of CATEGORIES) {
    const svg = await buildSvg(category);
    const outFile = path.join(outDir, `${category.slug}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outFile);
    console.log(`Généré : public/covers/${category.slug}.png`);
  }

  const defaultSvg = buildDefaultSvg();
  await sharp(Buffer.from(defaultSvg)).png().toFile(path.join(outDir, "default.png"));
  console.log("Généré : public/covers/default.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
