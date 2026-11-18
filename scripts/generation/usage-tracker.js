// Comptabilise chaque appel au modèle (CLI abonnement ou API directe) : tokens
// et coût. Le coût vient de `claude -p --output-format json` (total_cost_usd,
// un équivalent prix API même quand l'appel ne facture rien grâce à l'abonnement
// — utile pour savoir "ce que ça aurait coûté"). Pour le chemin API directe
// (normalement jamais emprunté en prod, voir llm.js), le coût est recalculé
// depuis un tarif statique, par prudence marqué "estimation".
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const LOG_PATH = path.join(ROOT, "_strategie", "usage-claude.jsonl");

// Tarifs officiels $/1M tokens — utilisés seulement pour estimer le coût du
// chemin API directe (fallback), puisque la CLI renvoie déjà total_cost_usd.
const TARIFS_API = {
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
};

function coutEstime(model, usage) {
  const tarif = TARIFS_API[model];
  if (!tarif || !usage) return null;
  return (usage.input_tokens / 1e6) * tarif.input + (usage.output_tokens / 1e6) * tarif.output;
}

let appelsRun = [];

function enregistrer({ phase, model, usage, coutUsd, source }) {
  const entree = {
    horodatage: new Date().toISOString(),
    phase,
    model,
    source, // "cli-abonnement" | "api"
    inputTokens: usage?.input_tokens ?? null,
    outputTokens: usage?.output_tokens ?? null,
    cacheReadTokens: usage?.cache_read_input_tokens ?? null,
    cacheCreationTokens: usage?.cache_creation_input_tokens ?? null,
    coutUsd: coutUsd ?? null,
  };
  appelsRun.push(entree);
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, JSON.stringify(entree) + "\n", "utf8");
  } catch (err) {
    console.error(`[usage-tracker] écriture du log impossible : ${err.message}`);
  }
  return entree;
}

function reinitialiser() {
  appelsRun = [];
}

function resumer() {
  const total = {
    appels: appelsRun.length,
    inputTokens: 0,
    outputTokens: 0,
    coutUsd: 0,
    coutConnu: false,
    parPhase: {},
  };
  for (const a of appelsRun) {
    total.inputTokens += a.inputTokens || 0;
    total.outputTokens += a.outputTokens || 0;
    if (typeof a.coutUsd === "number") {
      total.coutUsd += a.coutUsd;
      total.coutConnu = true;
    }
    const p = (total.parPhase[a.phase] ||= { appels: 0, inputTokens: 0, outputTokens: 0, coutUsd: 0 });
    p.appels++;
    p.inputTokens += a.inputTokens || 0;
    p.outputTokens += a.outputTokens || 0;
    p.coutUsd += a.coutUsd || 0;
  }
  return total;
}

// Résumé sur tout l'historique du fichier log (pas seulement le run courant) —
// pour un rapport "depuis le début" plutôt que juste le dernier run.
function resumerHistorique() {
  if (!fs.existsSync(LOG_PATH)) return { appels: 0, inputTokens: 0, outputTokens: 0, coutUsd: 0 };
  const lignes = fs.readFileSync(LOG_PATH, "utf8").trim().split("\n").filter(Boolean);
  const total = { appels: 0, inputTokens: 0, outputTokens: 0, coutUsd: 0 };
  for (const ligne of lignes) {
    const a = JSON.parse(ligne);
    total.appels++;
    total.inputTokens += a.inputTokens || 0;
    total.outputTokens += a.outputTokens || 0;
    total.coutUsd += a.coutUsd || 0;
  }
  return total;
}

module.exports = { enregistrer, reinitialiser, resumer, resumerHistorique, coutEstime, TARIFS_API, LOG_PATH };
