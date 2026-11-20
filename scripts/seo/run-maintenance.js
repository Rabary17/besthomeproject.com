#!/usr/bin/env node
// Maintenance SEO hebdomadaire : analyse Search Console (decay, striking-distance,
// cannibalisation) et journalise les recommandations. N'édite ni ne fusionne
// AUCUNE page automatiquement — voir analyser-gsc.js pour le raisonnement.
//
// Usage : node scripts/seo/run-maintenance.js
"use strict";
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env.local") });

const { analyserGSC } = require("./analyser-gsc");
const { ajouterLigneJournal, ecrireOpportunitesGSC, JOURNAL_SHEET_ID } = require("./journal-sheet");

async function main() {
  console.log("Analyse Search Console (decay, striking-distance, cannibalisation)...");
  const resultat = await analyserGSC();

  console.log(`Decay : ${resultat.decay.length} · Striking-distance : ${resultat.strikingDistance.length} · Cannibalisation : ${resultat.cannibalisation.length}`);

  await ecrireOpportunitesGSC(resultat);

  await ajouterLigneJournal({
    type: "maintenance",
    action: "Analyse GSC hebdomadaire",
    detail: `${resultat.decay.length} decay, ${resultat.strikingDistance.length} striking-distance, ${resultat.cannibalisation.length} cannibalisation — détail dans l'onglet « Opportunités GSC »`,
    lienSite: `https://docs.google.com/spreadsheets/d/${JOURNAL_SHEET_ID}/edit`,
  });

  console.log(`Journal mis à jour : https://docs.google.com/spreadsheets/d/${JOURNAL_SHEET_ID}/edit`);
}

main().catch((err) => {
  console.error("Erreur maintenance SEO :", err);
  process.exit(1);
});
