// =============================================================================
// Point d'appel UNIQUE au modèle pour toutes les phases de génération.
// =============================================================================
// Toute génération (plan, premier jet, FAQ, méta, réécriture, titre…) DOIT
// passer par generer(). Le garde-fou « date de coupure »
// (garde-fou-cutoff.js) y est câblé en dur :
//   - la date de coupure est résolue (question posée au modèle + date
//     officielle, on garde la plus stricte) avant le premier appel ;
//   - les règles sont placées EN TÊTE du prompt système — il n'existe aucun
//     paramètre pour les retirer ou les remplacer ;
//   - chaque sortie est auditée, et les passages hors barème reçoivent le
//     marqueur [À VÉRIFIER] (bloquant au build, voir verifier-contenu.js).
//
// Usage en ligne de commande :
//   node scripts/generation/llm.js --cutoff [--model claude-sonnet-5-5]
//       → affiche la date de coupure retenue (interroge le modèle)
//   node scripts/generation/llm.js --audit chemin/article.md [--cutoff 2026-06] [--sources fichier.txt] [--marquer]
//       → audite un texte produit ailleurs (Cowork, TONTON AI…) ;
//         --marquer réécrit le fichier avec les marqueurs [À VÉRIFIER]
// Variables d'environnement : ANTHROPIC_API_KEY, GENERATION_MODEL (optionnel).
"use strict";
const fs = require("fs");
const {
  resoudreCutoff,
  blocSysteme,
  auditer,
  formaterSources,
  CUTOFFS_OFFICIELS,
} = require("./garde-fou-cutoff");

const MODELE_PAR_DEFAUT = process.env.GENERATION_MODEL || "claude-sonnet-5-5";
const PHASES = Object.freeze(["plan", "premier-jet", "faq", "meta", "titre", "reecriture"]);
const API_URL = "https://api.anthropic.com/v1/messages";

function aujourdhui() {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
}

async function appelBrut({ model, system, messages, max_tokens }) {
  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) throw new Error("ANTHROPIC_API_KEY manquante");
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": cle,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens, ...(system ? { system } : {}), messages }),
  });
  if (!res.ok) throw new Error(`API ${res.status} : ${await res.text()}`);
  const data = await res.json();
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
}

// Date de coupure résolue une fois par modèle et par exécution.
const cacheCutoff = new Map();
async function cutoffPour(model) {
  if (!cacheCutoff.has(model)) {
    const info = await resoudreCutoff(model, (question) =>
      appelBrut({ model, messages: [{ role: "user", content: question }], max_tokens: 20 })
    );
    console.error(
      `[garde-fou] ${model} — officiel : ${info.officiel || "inconnu"} · déclaré : ${info.declare || "illisible"} → retenu : ${info.cutoff} (${info.retenu}), zone grise dès ${info.zoneGriseDebut}`
    );
    cacheCutoff.set(model, info);
  }
  return cacheCutoff.get(model);
}

/**
 * Génère un texte sous garde-fou.
 * @param {object} p
 * @param {string} p.phase         une des PHASES
 * @param {string} p.consigne      ce qui est demandé au modèle
 * @param {string} [p.brief]       contexte fourni par l'humain (mot-clé, titre, charte…) — ses chiffres sont autorisés
 * @param {Array}  [p.sources]     [{url, date, texte}] — seules données chiffrées/datées autorisées
 * @param {string} [p.instructions] consignes système complémentaires (placées APRÈS le garde-fou)
 * @param {string} [p.model]
 * @param {number} [p.max_tokens]
 */
async function generer({ phase, consigne, brief = "", sources = [], instructions = "", model = MODELE_PAR_DEFAUT, max_tokens = 8000 }) {
  if (!PHASES.includes(phase)) throw new Error(`Phase inconnue « ${phase} » (attendu : ${PHASES.join(", ")})`);
  if (!consigne) throw new Error("consigne obligatoire");
  const info = await cutoffPour(model);
  const system = [
    blocSysteme({ cutoff: info.cutoff, aujourdhui: aujourdhui() }), // toujours en premier
    instructions,
    formaterSources(sources),
  ]
    .filter(Boolean)
    .join("\n\n");
  const user = [brief && `BRIEF :\n${brief}`, consigne].filter(Boolean).join("\n\n");
  const brut = await appelBrut({ model, system, messages: [{ role: "user", content: user }], max_tokens });
  const audit = auditer(brut, { cutoff: info.cutoff, sources, brief });
  return { phase, model, cutoff: info, texte: audit.texteMarque, texteBrut: brut, audit };
}

module.exports = { generer, cutoffPour, PHASES, MODELE_PAR_DEFAUT };

// --- CLI -----------------------------------------------------------------
if (require.main === module) {
  const args = process.argv.slice(2);
  const val = (nom) => {
    const i = args.indexOf(nom);
    return i >= 0 ? args[i + 1] : undefined;
  };
  (async () => {
    // --audit d'abord : dans ce mode, --cutoff sert d'option (valeur AAAA-MM)
    if (args.includes("--audit")) {
      const fichier = val("--audit");
      const model = val("--model") || MODELE_PAR_DEFAUT;
      const cutoff = val("--cutoff") || CUTOFFS_OFFICIELS[model];
      if (!cutoff) throw new Error(`Pas de date officielle pour ${model} : passe --cutoff AAAA-MM`);
      const sources = val("--sources") ? [fs.readFileSync(val("--sources"), "utf8")] : [];
      const texte = fs.readFileSync(fichier, "utf8");
      const r = auditer(texte, { cutoff, sources });
      console.log(`Coupure ${r.cutoff} · zone grise dès ${r.zoneGriseDebut} · ${r.violations.length} passage(s) hors barème`);
      for (const v of r.violations) console.log(`  - [${v.type}] « ${v.extrait.slice(0, 90)} » — ${v.raison}`);
      if (args.includes("--marquer") && r.bloquant) {
        fs.writeFileSync(fichier, r.texteMarque, "utf8");
        console.log(`Marqueurs [À VÉRIFIER] ajoutés dans ${fichier}`);
      }
      process.exitCode = r.bloquant ? 1 : 0;
      return;
    }
    if (args.includes("--cutoff")) {
      const info = await cutoffPour(val("--model") || MODELE_PAR_DEFAUT);
      console.log(JSON.stringify(info, null, 2));
      return;
    }
    console.log("Usage : --cutoff [--model X] | --audit fichier.md [--cutoff AAAA-MM] [--sources fichier] [--marquer]");
  })().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}
