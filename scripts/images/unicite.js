// Règles strictes pour les images à la une (appliquées à tout le site) :
//  1. Une même photo ne sert qu'une seule fois sur le site. L'identité d'une photo
//     est sa source (Unsplash, Pexels, Pixabay), pas l'URL complète : une même photo
//     revient avec des paramètres d'URL différents.
//  2. Aucun repli sur une photo déjà utilisée : si toutes les requêtes ne donnent
//     que des photos prises, l'article garde l'image par défaut (ou aucune) et le
//     script de correction réessaiera plus tard.
//  3. Vérification : verifier-images.js échoue si un doublon subsiste.
const fs = require("fs");
const path = require("path");

const IMAGE_PAR_DEFAUT_PREFIXE = "/images/articles/default-";

function identifiantImage(url) {
  if (!url) return null;
  const u = String(url);
  let m = u.match(/photo-([0-9]+-[0-9a-f]+)/); // Unsplash
  if (m) return `unsplash:${m[1]}`;
  m = u.match(/pexels\.com\/photos\/(\d+)/); // Pexels
  if (m) return `pexels:${m[1]}`;
  m = u.match(/pixabay\.com\/.*?(\d{5,})/); // Pixabay
  if (m) return `pixabay:${m[1]}`;
  return `url:${u.split("?")[0]}`; // fichier local ou autre source
}

function estPlaceholder(url) {
  return !url || String(url).startsWith(IMAGE_PAR_DEFAUT_PREFIXE);
}

function lireArticles(dossier) {
  if (!fs.existsSync(dossier)) return [];
  return fs
    .readdirSync(dossier)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const brut = fs.readFileSync(path.join(dossier, f), "utf8");
      const image = (brut.match(/^image:\s*"([^"]*)"/m) || [])[1] || null;
      const date = (brut.match(/^date:\s*"?([^"\n]+)"?/m) || [])[1] || "";
      const titre = (brut.match(/^title:\s*(".*")\s*$/m) || [])[1];
      return { fichier: f, chemin: path.join(dossier, f), brut, image, date, titre: titre ? JSON.parse(titre) : f };
    });
}

// Identifiants déjà pris par un article (placeholders exclus).
function idsUtilisees(dossier, saufFichier) {
  const ids = new Set();
  for (const a of lireArticles(dossier)) {
    if (a.fichier === saufFichier || estPlaceholder(a.image)) continue;
    const id = identifiantImage(a.image);
    if (id) ids.add(id);
  }
  return ids;
}

// Groupes de doublons : pour chaque photo utilisée plus d'une fois, on garde
// l'article le plus ancien et on renvoie les autres à corriger.
function articlesADoublonner(dossier) {
  const parId = new Map();
  for (const a of lireArticles(dossier)) {
    if (estPlaceholder(a.image)) continue;
    const id = identifiantImage(a.image);
    if (!parId.has(id)) parId.set(id, []);
    parId.get(id).push(a);
  }
  const aCorriger = [];
  for (const groupe of parId.values()) {
    if (groupe.length < 2) continue;
    groupe.sort((x, y) => (x.date < y.date ? -1 : 1));
    aCorriger.push(...groupe.slice(1));
  }
  return aCorriger;
}

// Requêtes de recherche dérivées du sujet. Une requête par variante, sans doublon.
const MOTS_VIDES = new Set(["le", "la", "les", "de", "des", "du", "un", "une", "et", "en", "au", "aux", "pour", "sur", "dans", "par", "avec", "est", "que", "qui", "quoi", "comment", "pourquoi", "quel", "quelle", "quels", "quelles", "ce", "se", "sa", "son", "ses", "vs"]);

function requetesImage({ keyword, theme, titre, synonymes = [] }) {
  const mots = String(titre || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter((m) => m.length > 2 && !MOTS_VIDES.has(m));
  const variantes = [
    keyword,
    ...synonymes,
    mots.slice(0, 3).join(" "),
    mots.slice(-3).join(" "),
    mots.slice(1, 4).join(" "),
    titre,
  ];
  return [...new Set(variantes.map((v) => (v || "").trim()).filter(Boolean))];
}

// Premier résultat libre, toutes requêtes confondues. Jamais de photo déjà prise.
async function choisirImageUnique(requetes, rechercher, utilisees) {
  for (const requete of requetes) {
    let resultats = [];
    try {
      resultats = await rechercher(requete);
    } catch (err) {
      console.error(`Recherche image échouée pour « ${requete} » : ${err.message}`);
      continue;
    }
    for (const r of resultats) {
      const id = identifiantImage(r.url);
      if (!id || utilisees.has(id)) continue;
      utilisees.add(id);
      return r;
    }
  }
  return null;
}

// Écrit image et imageAlt dans le frontmatter, sans toucher au reste.
function ecrireImageDansFrontmatter(brut, url, alt) {
  const ligneImage = `image: "${url}"`;
  const ligneAlt = `imageAlt: ${JSON.stringify(alt)}`;
  if (/^image:/m.test(brut)) {
    let sortie = brut.replace(/^image:.*$/m, ligneImage);
    sortie = /^imageAlt:/m.test(sortie) ? sortie.replace(/^imageAlt:.*$/m, ligneAlt) : sortie.replace(/^(image:.*)$/m, `$1\n${ligneAlt}`);
    return sortie;
  }
  const fin = brut.indexOf("\n---", 4);
  return brut.slice(0, fin) + `\n${ligneImage}\n${ligneAlt}` + brut.slice(fin);
}

module.exports = {
  identifiantImage,
  estPlaceholder,
  lireArticles,
  idsUtilisees,
  articlesADoublonner,
  requetesImage,
  choisirImageUnique,
  ecrireImageDansFrontmatter,
};
