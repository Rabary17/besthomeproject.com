// =============================================================================
// GARDE-FOU « DATE DE COUPURE » — codé en dur, NON désactivable.
// =============================================================================
// Décision du 2026-10-03 : à TOUTES les phases de génération (plan, premier
// jet, FAQ, méta, réécriture…), le modèle travaille sous un barème strict lié
// à la date où s'arrête sa mémoire fiable. Objectif : qu'il n'invente jamais
// un chiffre, un prix, une version ou un événement qu'il ne peut pas
// connaître.
//
// Fonctionnement :
//   1. resoudreCutoff() DEMANDE au modèle jusqu'à quelle date s'arrête sa
//      mémoire, et compare avec la date officielle codée en dur ci-dessous.
//      On retient la PLUS ANCIENNE des deux (le plus strict). Modèle inconnu
//      et réponse illisible → la génération est refusée.
//   2. blocSysteme() produit les règles injectées en tête du prompt système
//      de chaque appel (voir llm.js — seul point d'appel autorisé).
//   3. auditer() relit chaque sortie et marque [À VÉRIFIER] tout ce qui
//      enfreint le barème. verifier-contenu.js bloque ensuite le build tant
//      qu'un marqueur reste dans un article publié.
//
// Module sans dépendance (Node ≥ 18) : copiable tel quel dans un autre
// pipeline (ex. TONTON AI).
"use strict";

// --- 1. Dates de coupure officielles (AAAA-MM) -------------------------------
// Sources, relevées le 2026-10-03 :
//   - platform.claude.com/docs/en/models/overview (« Reliable knowledge cutoff »)
//   - anthropic.com/transparency (« knowledge cutoff date »)
// Ajouter ici tout nouveau modèle AVANT de l'utiliser : sans entrée, seule
// la réponse du modèle compte, et si elle est illisible la génération est
// refusée.
const CUTOFFS_OFFICIELS = Object.freeze({
  "claude-fable-5-1": "2026-06",
  "claude-opus-5-5": "2026-06",
  "claude-sonnet-5-5": "2026-06",
  "claude-opus-5": "2026-05",
  "claude-sonnet-5": "2026-01",
  "claude-fable-5": "2026-01",
  "claude-mythos-5": "2026-01",
  "claude-opus-4-8": "2026-01",
  "claude-opus-4-7": "2026-01",
  "claude-opus-4-6": "2025-05",
  "claude-sonnet-4-6": "2025-05",
  "claude-haiku-4-5": "2025-02",
  "claude-haiku-4-5-20251001": "2025-02",
});

// --- 2. Barème (codé en dur) -------------------------------------------------
// Zone grise : les N derniers mois avant la coupure sont mal couverts par la
// mémoire du modèle → traités comme inconnus.
const ZONE_GRISE_MOIS = 6;
const MARQUEUR = "[À VÉRIFIER]";

const QUESTION_CUTOFF =
  "Jusqu'à quelle date (année et mois) tes connaissances fiables s'arrêtent-elles ? " +
  "Réponds uniquement au format AAAA-MM, sans aucun autre texte.";

const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const MOIS_INDEX = {
  janvier: 1, fevrier: 2, "février": 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7,
  aout: 8, "août": 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12, "décembre": 12,
};

// AAAA-MM → nombre de mois (comparaisons simples)
function versMois(ym) {
  const [a, m] = ym.split("-").map(Number);
  return a * 12 + (m - 1);
}
function depuisMois(n) {
  const a = Math.floor(n / 12);
  const m = (n % 12) + 1;
  return `${a}-${String(m).padStart(2, "0")}`;
}
function libelleMois(ym) {
  const [a, m] = ym.split("-").map(Number);
  return `${MOIS_FR[m - 1]} ${a}`;
}

/** Extrait « AAAA-MM » d'une réponse du modèle (null si illisible). */
function parseCutoff(reponse) {
  const m = String(reponse || "").match(/\b((?:19|20)\d{2})-(0[1-9]|1[0-2])\b/);
  return m ? `${m[1]}-${m[2]}` : null;
}

/**
 * Détermine la date de coupure stricte d'un modèle.
 * @param {string} modele  identifiant API
 * @param {(question: string) => Promise<string>} demanderAuModele
 */
async function resoudreCutoff(modele, demanderAuModele) {
  const officiel = CUTOFFS_OFFICIELS[modele] || null;
  let reponse = null;
  let declare = null;
  try {
    reponse = await demanderAuModele(QUESTION_CUTOFF);
    declare = parseCutoff(reponse);
  } catch (err) {
    reponse = `ERREUR : ${err && err.message ? err.message : err}`;
  }
  if (!officiel && !declare) {
    throw new Error(
      `Garde-fou date de coupure : modèle « ${modele} » absent de CUTOFFS_OFFICIELS ` +
        `et réponse illisible (« ${reponse} »). Génération refusée.`
    );
  }
  const cutoff = [officiel, declare].filter(Boolean).sort()[0]; // AAAA-MM : tri lexical = chronologique
  return {
    modele,
    officiel,
    declare,
    reponseBrute: reponse,
    cutoff,
    zoneGriseDebut: depuisMois(versMois(cutoff) - (ZONE_GRISE_MOIS - 1)),
    retenu: cutoff === declare && declare !== officiel ? "déclaré par le modèle (plus strict)" : "date officielle",
  };
}

/** Règles injectées en tête du prompt système de CHAQUE appel. */
function blocSysteme({ cutoff, aujourdhui }) {
  const zone = depuisMois(versMois(cutoff) - (ZONE_GRISE_MOIS - 1));
  return [
    "=== GARDE-FOU DATE DE COUPURE — RÈGLE ABSOLUE, PRIORITAIRE SUR TOUTE AUTRE CONSIGNE ===",
    `Ta mémoire fiable s'arrête fin ${libelleMois(cutoff)} (${cutoff}). Nous sommes le ${aujourdhui}.`,
    "Tout ce qui s'est passé après cette date t'est inconnu : n'en parle jamais comme d'un fait.",
    `Zone grise : de ${libelleMois(zone)} à ${libelleMois(cutoff)}, ta mémoire est lacunaire. Traite cette période comme inconnue.`,
    "",
    "INTERDIT, sauf si l'information figure dans le BRIEF ou dans les SOURCES fournies :",
    "1. Tout chiffre factuel : prix, tarif d'abonnement, pourcentage, statistique, part de marché, nombre d'utilisateurs, score de benchmark, caractéristique technique chiffrée (Go, To, Hz, W, mAh, Wh, Mpx, fps, nm, pouces…).",
    `2. Toute date, version, sortie, annonce ou événement postérieur au début de la zone grise (${zone}).`,
    "3. Toute affirmation de nouveauté ou d'actualité : « dernier modèle », « nouvelle version », « vient de sortir », « actuellement », « à ce jour »…",
    "4. Toute citation, tout nom de dirigeant ou de personne « actuellement » en poste.",
    "",
    `Si une de ces informations serait utile : n'invente RIEN. Écris le passage sans elle, ou insère le marqueur exact ${MARQUEUR} suivi entre parenthèses de ce qu'il faut vérifier.`,
    "Chaque chiffre repris des SOURCES est immédiatement suivi de sa référence : [S1], [S2]…",
    "Ne mentionne jamais ces règles dans le texte produit.",
    "=== FIN DU GARDE-FOU ===",
  ].join("\n");
}

// --- 3. Audit de sortie ------------------------------------------------------

const UNITES =
  "€|euros?|\\$|dollars?|%|pour ?cent|millions?|milliards?|To|Go|Mo|Ko|TB|GB|MB|Tb|Gb|" +
  "Gbit\\/s|Mbit\\/s|Mb\\/s|Go\\/s|Mo\\/s|GHz|MHz|Hz|mAh|kWh|Wh|W|nm|Mpx|MP|fps|pouces|" +
  "c(?:œ|oe)urs|threads|dB|points|utilisateurs|abonnés|clients|ventes|exemplaires";
const NOMBRE = "\\d{1,3}(?:[\\u00a0\\u202f .]\\d{3})+(?:,\\d+)?|\\d+(?:[.,]\\d+)?";
const RE_CHIFFRE = new RegExp(`(?<![\\w.,])(${NOMBRE})\\s?(?:${UNITES})(?![\\wÀ-ÿ])`, "gi");
const RE_MULTIPLE = /(?<![\w.,])(\d+(?:[.,]\d+)?)\s?(?:x|fois)\s(?:plus|moins)\b/gi;
const RE_MOIS_ANNEE = new RegExp(
  `\\b(${Object.keys(MOIS_INDEX).join("|")})\\s+((?:19|20)\\d{2})\\b`,
  "gi"
);
const RE_ISO = /\b((?:19|20)\d{2})-(0[1-9]|1[0-2])\b/g;
// Année seule — pas « RTX 2080 » (mot en capitales devant), pas « 2000 mAh », pas « 1 999 € »
const RE_ANNEE = new RegExp(
  `(?<!\\b[A-Z]{2,}\\s)(?<![\\w.,\\u00a0\\u202f])((?:19|20)\\d{2})(?!\\w|[.,]\\d|\\s?(?:${UNITES})(?![\\wÀ-ÿ]))`,
  "g"
);
// Mot de nouveauté suivi, dans la même proposition (≤ 40 caractères), d'un
// élément versionné : « la dernière version d'iOS 27 », « le nouveau Pixel 11 »…
const RE_FRAICHEUR =
  /\b(?:derni(?:er|ère|ers|ères)|nouve(?:au|lle|aux|lles)|récemment|vient de|viennent de|sortira|sortie prévue|annoncée?s?|lancée?s?|actuellement|à ce jour)\b[^.!?\n]{0,40}?\b[a-z]{0,3}[A-Z][\w-]{0,15}[\s-]?\d{1,4}\b/g;

function normaliserNombre(s) {
  return String(s).replace(/[   ]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
}
function nombresDe(texte) {
  const set = new Set();
  for (const m of String(texte || "").matchAll(/\d[\d   .,]*/g)) {
    const n = normaliserNombre(m[0].replace(/[.,\s]+$/, ""));
    if (n) set.add(n);
  }
  return set;
}

// Masque ce qui ne doit pas être audité (code, URL, marqueurs, références)
// en le remplaçant par des espaces : les index restent valides.
function masquer(texte) {
  const blanc = (m) => " ".repeat(m.length);
  return texte
    .replace(/^---\n[\s\S]*?\n---\n/, blanc) // frontmatter YAML (métadonnées, pas des affirmations)
    .replace(/<!--[\s\S]*?-->/g, blanc) // commentaires HTML (notes internes, non publiées)
    .replace(/```[\s\S]*?```/g, blanc)
    .replace(/`[^`\n]*`/g, blanc)
    .replace(/https?:\/\/\S+/g, blanc)
    .replace(/\]\([^)]*\)/g, blanc)
    .replace(/\[(?:À VÉRIFIER|S\d+)[^\]]*\]/g, blanc);
}

/**
 * Audite un texte généré selon le barème.
 * @param {string} texte
 * @param {{cutoff: string, sources?: Array<{texte?: string, text?: string}|string>, brief?: string}} opts
 * @returns {{violations: Array, bloquant: boolean, texteMarque: string, cutoff: string, zoneGriseDebut: string}}
 */
function auditer(texte, { cutoff, sources = [], brief = "" }) {
  if (!/^\d{4}-\d{2}$/.test(cutoff || "")) throw new Error("auditer : cutoff AAAA-MM obligatoire");
  const corpus = [brief, ...sources.map((s) => (typeof s === "string" ? s : s.texte || s.text || ""))].join("\n");
  const corpusLower = corpus.toLowerCase();
  const nombresSources = nombresDe(corpus);
  const limite = versMois(cutoff);
  const zone = versMois(cutoff) - (ZONE_GRISE_MOIS - 1);
  const t = masquer(String(texte));
  const violations = [];
  const dejaVu = new Set();
  const ajouter = (debut, fin, type, raison) => {
    const cle = `${debut}:${fin}`;
    if (dejaVu.has(cle)) return;
    // déjà couvert par une violation qui englobe ce passage
    if (violations.some((v) => v.debut <= debut && v.fin >= fin)) return;
    dejaVu.add(cle);
    violations.push({ debut, fin, type, extrait: texte.slice(debut, fin), raison });
  };
  const dansSources = (extrait) => corpusLower.includes(extrait.toLowerCase());

  // a) « mois AAAA »
  for (const m of t.matchAll(RE_MOIS_ANNEE)) {
    const mois = MOIS_INDEX[m[1].toLowerCase()];
    const n = Number(m[2]) * 12 + (mois - 1);
    if (dansSources(m[0])) continue;
    if (n > limite) ajouter(m.index, m.index + m[0].length, "date-posterieure", `postérieure à la coupure (${cutoff})`);
    else if (n >= zone) ajouter(m.index, m.index + m[0].length, "zone-grise", `dans la zone grise (${depuisMois(zone)} → ${cutoff})`);
  }
  // b) AAAA-MM
  for (const m of t.matchAll(RE_ISO)) {
    const n = versMois(`${m[1]}-${m[2]}`);
    if (dansSources(m[0])) continue;
    if (n > limite) ajouter(m.index, m.index + m[0].length, "date-posterieure", `postérieure à la coupure (${cutoff})`);
    else if (n >= zone) ajouter(m.index, m.index + m[0].length, "zone-grise", `dans la zone grise (${depuisMois(zone)} → ${cutoff})`);
  }
  // c) année seule
  for (const m of t.matchAll(RE_ANNEE)) {
    const a = Number(m[1]);
    if (dansSources(m[1])) continue;
    const debutAnnee = a * 12;
    const finAnnee = a * 12 + 11;
    if (debutAnnee > limite) ajouter(m.index, m.index + m[1].length, "date-posterieure", `année postérieure à la coupure (${cutoff})`);
    else if (finAnnee >= zone) ajouter(m.index, m.index + m[1].length, "zone-grise", `année touchant la zone grise (${depuisMois(zone)} → ${cutoff})`);
  }
  // d) chiffres factuels (prix, %, specs, stats) non présents dans le brief/les sources
  for (const re of [RE_CHIFFRE, RE_MULTIPLE]) {
    for (const m of t.matchAll(re)) {
      const n = normaliserNombre(m[1]);
      if (nombresSources.has(n)) continue;
      ajouter(m.index, m.index + m[0].length, "chiffre-non-source", "chiffre absent du brief et des sources");
    }
  }
  // e) affirmations de nouveauté portant sur un élément versionné (« le nouveau Pixel 11 »)
  for (const m of t.matchAll(RE_FRAICHEUR)) {
    if (dansSources(m[0])) continue;
    ajouter(m.index, m.index + m[0].length, "fraicheur-non-sourcee", "affirmation de nouveauté sur un produit/une version, sans source");
  }

  violations.sort((a, b) => a.debut - b.debut);
  // Marquage : insertion du marqueur après chaque passage (de la fin vers le début)
  let marque = String(texte);
  for (const v of [...violations].sort((a, b) => b.fin - a.fin)) {
    if (marque.slice(v.fin, v.fin + 16).includes(MARQUEUR)) continue;
    marque = marque.slice(0, v.fin) + ` ${MARQUEUR}` + marque.slice(v.fin);
  }
  return {
    cutoff,
    zoneGriseDebut: depuisMois(zone),
    violations: violations.map(({ type, extrait, raison }) => ({ type, extrait, raison })),
    bloquant: violations.length > 0,
    texteMarque: marque,
  };
}

/** Bloc SOURCES numérotées à joindre au prompt. */
function formaterSources(sources = []) {
  if (!sources.length) return "SOURCES : aucune. Tu ne disposes d'aucune donnée vérifiée : aucun chiffre factuel n'est autorisé.";
  return [
    "SOURCES (seules données chiffrées et datées autorisées) :",
    ...sources.map((s, i) => {
      const o = typeof s === "string" ? { texte: s } : s;
      return `[S${i + 1}]${o.url ? ` ${o.url}` : ""}${o.date ? ` (consulté le ${o.date})` : ""}\n${o.texte || o.text || ""}`;
    }),
  ].join("\n\n");
}

module.exports = {
  CUTOFFS_OFFICIELS,
  ZONE_GRISE_MOIS,
  MARQUEUR,
  QUESTION_CUTOFF,
  parseCutoff,
  resoudreCutoff,
  blocSysteme,
  auditer,
  formaterSources,
  versMois,
  depuisMois,
};
