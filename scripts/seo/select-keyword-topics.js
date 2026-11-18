// Sélectionne des sujets d'article SEO (hors actu) à partir de volumes de recherche réels
// DataForSEO, en excluant ce qui est déjà couvert par un article publié.
// Usage : node scripts/seo/select-keyword-topics.js [--n 3]
const fs = require("fs");
const path = require("path");
const { keywordsForKeywords } = require("./dataforseo-client");

const POSTS_DIR = path.join(__dirname, "..", "..", "content", "posts");

// Mots-clés "graines" par sous-catégorie — repris du champ `seoTarget` de
// lib/categories.ts (source de vérité éditoriale). Si une sous-catégorie est
// ajoutée/renommée côté site, répercuter le changement ici.
const GRAINES_PAR_THEME = {
  "aides-budget": ["budget construction maison", "plan de financement", "aides à la construction"],
  "terrain-etudes": ["acheter un terrain constructible", "étude de sol", "viabilisation terrain"],
  "plans-dessinateur": ["trouver un dessinateur de plan", "faire les plans d'une maison", "architecte ou dessinateur"],
  "devis-construction": ["devis construction maison", "comparer des devis", "lire un devis de constructeur"],
  "choisir-entreprises": ["choisir un constructeur de maison", "trouver un maître d'œuvre", "vérifier un artisan"],
  "permis-demarches": ["permis de construire dossier", "délai permis de construire", "démarches construction maison"],
  "contrats-assurances": ["contrat de construction de maison individuelle", "assurance dommages-ouvrage", "garantie décennale"],
  "fondations-gros-oeuvre": ["étapes construction maison fondations", "gros oeuvre maison", "dalle béton"],
  "hors-d-eau-hors-d-air": ["hors d'eau hors d'air définition", "charpente toiture", "pose des menuiseries"],
  "plomberie-electricite": ["installation électrique maison neuve", "plomberie maison neuve", "tableau électrique"],
  "peinture-sols-murs": ["finitions maison neuve", "peindre un mur", "poser un sol"],
  "suivi-chantier": ["suivre un chantier de construction", "réunion de chantier", "appels de fonds"],
  "reception-reserves": ["réception de chantier maison", "réserves à la livraison", "checklist réception maison neuve"],
  "garanties-mise-en-service": ["garantie parfait achèvement", "garantie décennale", "mise en service maison neuve"],
  "renovation-travaux": ["rénover une maison ancienne", "ordre des travaux de rénovation", "budget rénovation"],
  "bricolage-reparations": ["percer un mur", "fixer une étagère", "réparer une porte qui frotte"],
  "energie-economies": ["réduire sa facture d'énergie", "isolation maison", "chauffage économique"],
  "deco-ambiance": ["idées déco salon", "associer les couleurs déco", "ambiance salle de bain"],
  "amenagement-rangement": ["aménager un petit salon", "rangement entrée", "coin bureau à la maison"],
  "maison-en-famille": ["chambre enfant évolutive", "aménager un logement pour ses parents", "sécuriser la maison bébé"],
  "jardin-exterieur": ["potager débutant", "entretien de terrasse", "tailler une haie"],
  "outillage-equipement": ["perceuse visseuse", "ponceuse", "caisse à outils"],
  "electromenager-cuisine": ["robot cuiseur", "aspirateur robot", "four encastrable"],
  "maison-connectee-securite": ["caméra de surveillance maison", "serrure connectée", "thermostat connecté"],
  "jardin-plein-air": ["tondeuse", "robot tondeuse", "salon de jardin"],
};

function motsClesExistants() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => fs.readFileSync(path.join(POSTS_DIR, f), "utf8").slice(0, 400).toLowerCase());
}

function dejaCouvert(motCle, textesExistants) {
  const mc = motCle.toLowerCase();
  return textesExistants.some((t) => t.includes(mc));
}

// Têtes de gondole très fortement recherchées : jamais de vraies cibles d'article
// pour un petit site, et souvent polluées par des fautes de frappe auxquelles
// l'API colle à tort le même volume que le terme principal.
const VOLUME_MAX = 20000;

function estLongueTraine(motCle) {
  return motCle.trim().split(/\s+/).length >= 3;
}

async function selectionnerSujetsSeo({ n = 3, volumeMin = 100, volumeMax = VOLUME_MAX } = {}) {
  const textesExistants = motsClesExistants();
  const sujets = [];
  for (const [theme, graines] of Object.entries(GRAINES_PAR_THEME)) {
    if (sujets.length >= n * 3) break; // marge pour filtrer ensuite
    try {
      const resultats = await keywordsForKeywords(graines, { limit: 50 });
      for (const r of resultats) {
        if (!r.search_volume || r.search_volume < volumeMin || r.search_volume > volumeMax) continue;
        if (!estLongueTraine(r.keyword)) continue;
        if (dejaCouvert(r.keyword, textesExistants)) continue;
        sujets.push({ theme, keyword: r.keyword, volume: r.search_volume, cpc: r.cpc, competition: r.competition });
      }
    } catch (err) {
      console.error(`Erreur DataForSEO pour la sous-catégorie ${theme} : ${err.message}`);
    }
  }
  // Un meilleur mot-clé par sous-catégorie d'abord (diversité), puis complète par volume décroissant.
  sujets.sort((a, b) => b.volume - a.volume);
  const parTheme = new Map();
  const selection = [];
  for (const s of sujets) {
    if (selection.length >= n) break;
    if (!parTheme.has(s.theme)) {
      parTheme.set(s.theme, true);
      selection.push(s);
    }
  }
  for (const s of sujets) {
    if (selection.length >= n) break;
    if (!selection.includes(s)) selection.push(s);
  }
  return selection;
}

module.exports = { selectionnerSujetsSeo, GRAINES_PAR_THEME };

if (require.main === module) {
  const args = process.argv.slice(2);
  const n = args.includes("--n") ? Number(args[args.indexOf("--n") + 1]) : 3;
  selectionnerSujetsSeo({ n })
    .then((sujets) => {
      console.log(`${sujets.length} sujet(s) SEO retenu(s) :`);
      for (const s of sujets) {
        console.log(`- [${s.theme}] "${s.keyword}" — volume ${s.volume}/mois, cpc ${s.cpc}€, concurrence ${s.competition}`);
      }
    })
    .catch((err) => {
      console.error("Erreur sélection SEO :", err.message);
      process.exit(1);
    });
}
