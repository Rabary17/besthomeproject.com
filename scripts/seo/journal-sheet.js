// Journal centralisé des actions de l'autopilote pour besthomeproject.com, dans
// le MÊME Google Sheet que techno-play (onglets séparés par site — demande
// explicite : un seul Sheet pour tout le réseau). Compte de service déjà
// partagé en Éditeur (même sheet que le journal techno-play).
"use strict";
const { getValues, updateValues } = require("./sheets-client");

const JOURNAL_SHEET_ID = process.env.JOURNAL_SHEET_ID || "1IMqEjZLwH6uQs5-A7dNJHAwgBP-ibUDlKmpMV3g794k";
const ONGLET_JOURNAL = "BHP - Journal quotidien";
const ONGLET_OPPORTUNITES = "BHP - Opportunités GSC";

function maintenant() {
  const d = new Date();
  return { date: d.toISOString().slice(0, 10), heure: d.toISOString().slice(11, 16) };
}

// Deux liens séparés : la page réelle du site (ce qu'on veut voir en premier) et
// le fichier source sur GitHub (pour vérifier le contenu/historique).
async function ajouterLigneJournal({ type, action, detail = "", lienSite = "", lienCode = "", coutUsd = null }) {
  const { date, heure } = maintenant();
  const lignes = await getValues(JOURNAL_SHEET_ID, `${ONGLET_JOURNAL}!A:A`);
  const prochaineRow = lignes.length + 1;
  await updateValues(JOURNAL_SHEET_ID, `${ONGLET_JOURNAL}!A${prochaineRow}:H${prochaineRow}`, [
    [date, heure, type, action, detail, lienSite, lienCode, coutUsd != null ? coutUsd.toFixed(4) : ""],
  ]);
}

async function ecrireOpportunitesGSC({ decay, strikingDistance, cannibalisation }) {
  const { date } = maintenant();
  const lignes = [["Date détection", "Type", "Page ou requête", "Métrique", "Recommandation", "Statut"]];
  for (const d of decay) {
    lignes.push([
      date,
      "Decay",
      d.page,
      `${d.clicsAvant} → ${d.clicsApres} clics (-${d.baissePourcent}%)`,
      "Page à rafraîchir (contenu vieillissant ou concurrence qui a progressé) — à revoir manuellement.",
      "Signalé pour revue",
    ]);
  }
  for (const s of strikingDistance.slice(0, 30)) {
    lignes.push([
      date,
      "Striking-distance",
      `"${s.requete}" → ${s.page}`,
      `position ${s.position}, ${s.impressions} impressions, ${s.clics} clics`,
      "Page déjà en lice mais pas assez forte sur cette requête — à renforcer (contenu, maillage) plutôt que dupliquer.",
      "Signalé pour revue",
    ]);
  }
  for (const c of cannibalisation) {
    lignes.push([
      date,
      "Cannibalisation",
      c.requete,
      c.pages.map((p) => `${p.page} (${p.clics} clics, pos. ${p.position})`).join(" vs "),
      "Plusieurs pages se disputent cette requête — fusionner vers la plus performante + rediriger l'autre.",
      "Signalé pour revue",
    ]);
  }
  if (lignes.length === 1) {
    lignes.push([date, "—", "—", "—", "Aucune opportunité détectée cette semaine.", "—"]);
  }
  await updateValues(JOURNAL_SHEET_ID, `${ONGLET_OPPORTUNITES}!A1:F1000`, Array.from({ length: 1000 }, () => ["", "", "", "", "", ""]));
  await updateValues(JOURNAL_SHEET_ID, `${ONGLET_OPPORTUNITES}!A1:F${lignes.length}`, lignes);
}

module.exports = { JOURNAL_SHEET_ID, ONGLET_JOURNAL, ONGLET_OPPORTUNITES, ajouterLigneJournal, ecrireOpportunitesGSC };
