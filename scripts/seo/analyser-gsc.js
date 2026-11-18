// Analyse hebdomadaire Search Console : détecte 3 signaux sur les pages déjà
// publiées de techno-play.com. Ne modifie rien tout seul — chaque signal est une
// recommandation journalisée (voir journal-sheet.js), à valider par un humain
// avant toute réécriture ou fusion de page (risque différent d'une génération
// de contenu neuf, qui elle ne peut pas abîmer une page existante).
"use strict";
const { searchAnalyticsQuery } = require("./gsc-client");

const SITE_URL = process.env.GSC_SITE_URL || "sc-domain:besthomeproject.com";

function dateISO(offsetJours) {
  const d = new Date();
  d.setDate(d.getDate() + offsetJours);
  return d.toISOString().slice(0, 10);
}

// GSC a 2-3 jours de retard de données — on arrête la fenêtre "récente" à J-3.
const FIN_RECENTE = dateISO(-3);
const DEBUT_RECENT = dateISO(-31); // fenêtre de 28 jours
const FIN_PRECEDENTE = dateISO(-32);
const DEBUT_PRECEDENT = dateISO(-59); // les 28 jours juste avant

// Pages qui perdent des clics sur 28 jours vs les 28 jours précédents.
async function detecterDecay({ seuilBaissePourcent = 25, clicsMin = 5 } = {}) {
  const [recent, precedent] = await Promise.all([
    searchAnalyticsQuery(SITE_URL, { startDate: DEBUT_RECENT, endDate: FIN_RECENTE, dimensions: ["page"], rowLimit: 500 }),
    searchAnalyticsQuery(SITE_URL, { startDate: DEBUT_PRECEDENT, endDate: FIN_PRECEDENTE, dimensions: ["page"], rowLimit: 500 }),
  ]);
  const clicsPrecedent = new Map((precedent.rows || []).map((r) => [r.keys[0], r.clicks]));
  const decays = [];
  for (const r of recent.rows || []) {
    const page = r.keys[0];
    const avant = clicsPrecedent.get(page) || 0;
    if (avant < clicsMin) continue; // pas assez de volume pour que la variation soit significative
    const baisse = Math.round(((avant - r.clicks) / avant) * 100);
    if (baisse >= seuilBaissePourcent) {
      decays.push({ type: "decay", page, clicsAvant: avant, clicsApres: r.clicks, baissePourcent: baisse });
    }
  }
  return decays.sort((a, b) => b.baissePourcent - a.baissePourcent);
}

// Requêtes en position 5-20 (page 1 basse / page 2 haute) avec de vraies
// impressions : la page qui ressort est déjà en lice, mais pas assez forte.
async function detecterStrikingDistance({ positionMin = 5, positionMax = 20, impressionsMin = 20 } = {}) {
  const res = await searchAnalyticsQuery(SITE_URL, {
    startDate: DEBUT_RECENT,
    endDate: FIN_RECENTE,
    dimensions: ["query", "page"],
    rowLimit: 1000,
  });
  return (res.rows || [])
    .filter((r) => r.position >= positionMin && r.position <= positionMax && r.impressions >= impressionsMin)
    .map((r) => ({
      type: "striking-distance",
      requete: r.keys[0],
      page: r.keys[1],
      position: Math.round(r.position * 10) / 10,
      impressions: r.impressions,
      clics: r.clicks,
    }))
    .sort((a, b) => b.impressions - a.impressions);
}

// Deux pages (ou plus) qui se disputent la même requête — recommandation de
// fusion + redirection, jamais exécutée automatiquement (choix de la page
// gagnante = jugement éditorial, pas une décision à automatiser à l'aveugle).
async function detecterCannibalisation({ impressionsMin = 10 } = {}) {
  const res = await searchAnalyticsQuery(SITE_URL, {
    startDate: DEBUT_RECENT,
    endDate: FIN_RECENTE,
    dimensions: ["query", "page"],
    rowLimit: 2000,
  });
  const parRequete = new Map();
  for (const r of res.rows || []) {
    if (r.impressions < impressionsMin) continue;
    const [requete, page] = r.keys;
    if (!parRequete.has(requete)) parRequete.set(requete, []);
    parRequete.get(requete).push({ page, clics: r.clicks, impressions: r.impressions, position: Math.round(r.position * 10) / 10 });
  }
  const cannibalisations = [];
  for (const [requete, pages] of parRequete) {
    if (pages.length >= 2) {
      cannibalisations.push({ type: "cannibalisation", requete, pages: pages.sort((a, b) => b.clics - a.clics) });
    }
  }
  return cannibalisations;
}

async function analyserGSC() {
  const [decay, strikingDistance, cannibalisation] = await Promise.all([
    detecterDecay().catch((e) => {
      console.error(`Erreur analyse decay : ${e.message}`);
      return [];
    }),
    detecterStrikingDistance().catch((e) => {
      console.error(`Erreur analyse striking-distance : ${e.message}`);
      return [];
    }),
    detecterCannibalisation().catch((e) => {
      console.error(`Erreur analyse cannibalisation : ${e.message}`);
      return [];
    }),
  ]);
  return { decay, strikingDistance, cannibalisation };
}

module.exports = { analyserGSC, detecterDecay, detecterStrikingDistance, detecterCannibalisation };

if (require.main === module) {
  analyserGSC()
    .then((r) => {
      console.log(`Decay : ${r.decay.length} page(s)`);
      for (const d of r.decay) console.log(`  - ${d.page} : ${d.clicsAvant} → ${d.clicsApres} clics (-${d.baissePourcent}%)`);
      console.log(`Striking-distance : ${r.strikingDistance.length} requête(s)`);
      for (const s of r.strikingDistance.slice(0, 10)) console.log(`  - "${s.requete}" → ${s.page} (position ${s.position}, ${s.impressions} impressions)`);
      console.log(`Cannibalisation : ${r.cannibalisation.length} requête(s)`);
      for (const c of r.cannibalisation.slice(0, 10)) console.log(`  - "${c.requete}" : ${c.pages.map((p) => p.page).join(" vs ")}`);
    })
    .catch((err) => {
      console.error("Erreur analyse GSC :", err.message);
      process.exit(1);
    });
}
