// Sélectionne les actus du jour à transformer en article, depuis le sheet de veille
// partagé ("Veille actus - Publiradar"), onglet "Construction d'habitation" (dédié à
// besthomeproject.com — les autres onglets appartiennent à d'autres sites du réseau).
// Filtre : français, non déjà traité, pertinent ET classé dans une sous-catégorie du
// site (décidé par un appel Claude léger, pas le pipeline de génération/garde-fou).
// Usage : node scripts/seo/select-news-topics.js [--n 2] [--marquer]
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env.local") });
const { getValues, updateValues } = require("./sheets-client");
const { spawnSync } = require("child_process");
const { enregistrer: enregistrerUsage, coutEstime } = require("../generation/usage-tracker");

const SPREADSHEET_ID = process.env.VEILLE_SHEET_ID || "1EBgO2wj8Tw2e9ZGkjRc3stOIEKhkjwVlwl0p6ckUf8g";
const ONGLET = "Construction d'habitation";

// Sous-catégories valides (slug : titre), reprises de lib/categories.ts — le
// classifieur doit choisir parmi celles-ci pour renseigner `category` en frontmatter.
const SOUS_CATEGORIES = {
  "aides-budget": "Budget, Financement & Aides",
  "terrain-etudes": "Terrain & Études",
  "plans-dessinateur": "Plans & Dessinateur",
  "devis-construction": "Devis de construction",
  "choisir-entreprises": "Choisir ses entreprises",
  "permis-demarches": "Permis & Démarches",
  "contrats-assurances": "Contrats & Assurances",
  "fondations-gros-oeuvre": "Fondations & Gros œuvre",
  "hors-d-eau-hors-d-air": "Hors d'eau & Hors d'air",
  "plomberie-electricite": "Plomberie & Électricité",
  "peinture-sols-murs": "Sols, Murs & Finitions",
  "suivi-chantier": "Suivi & Contrôles",
  "reception-reserves": "Réception & Réserves",
  "garanties-mise-en-service": "Garanties & Mise en service",
  "renovation-travaux": "Rénovation & Travaux",
  "bricolage-reparations": "Bricolage & Réparations",
  "energie-economies": "Énergie & Isolation",
  "deco-ambiance": "Déco & Ambiance",
  "amenagement-rangement": "Aménagement & Rangement",
  "maison-en-famille": "Maison en famille",
  "jardin-exterieur": "Jardin & Extérieur",
  "outillage-equipement": "Outillage & Équipement",
  "electromenager-cuisine": "Électroménager & Cuisine",
  "maison-connectee-securite": "Maison connectée & Sécurité",
  "jardin-plein-air": "Jardin & Plein air",
};

// Rejet rapide sans appel API : scripts non latins (coréen, cyrillique, etc.) et
// quelques marqueurs typiques d'autres langues latines (catalan, espagnol, italien).
function sembleNonFrancais(texte) {
  if (/[Ѐ-ӿ぀-ヿ一-鿿가-힯]/.test(texte)) return true; // cyrillique/CJK/hangul
  const marqueurs = [
    /\bl·l\b|l·|·l/i, // catalan (punt volat)
    /\b(és|això|amb|però|molt|també|què)\b/i, // catalan
    /\b(está|esto|pero|muy|también|qué|cómo|años)\b/i, // espagnol
    /\b(questo|però|anche|perché|molto)\b/i, // italien
  ];
  return marqueurs.some((r) => r.test(texte));
}

// Même double chemin d'appel que scripts/generation/llm.js : API directe si
// ANTHROPIC_API_KEY est présente (CI), sinon CLI Claude Code headless (abonnement, poste local).
async function appelModeleLeger(prompt, { model = "claude-haiku-5-5", system = "" } = {}) {
  const cle = process.env.ANTHROPIC_API_KEY;
  if (cle) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 200,
        ...(system ? { system } : {}),
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`API ${res.status} : ${await res.text()}`);
    const data = await res.json();
    enregistrerUsage({ phase: "classification-actu", model, usage: data.usage, coutUsd: coutEstime(model, data.usage), source: "api" });
    return (data.content || []).map((b) => b.text).join("");
  }
  const args = ["-p", "--restricted", "--output-format", "json", "--model", model];
  if (system) args.push("--system-prompt", system);
  const res = spawnSync("claude", args, { input: prompt, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  if (res.error) throw new Error(`Échec du lancement de la CLI claude : ${res.error.message}`);
  if (res.status !== 0) throw new Error(`claude -p a échoué (code ${res.status}) : ${res.stderr}`);
  let data;
  try {
    data = JSON.parse(res.stdout);
  } catch {
    throw new Error(`Sortie CLI illisible (JSON attendu) : ${res.stdout.slice(0, 500) || "(vide)"} — stderr : ${res.stderr.slice(0, 300)}`);
  }
  if (data.is_error) throw new Error(`claude -p : ${data.result || "erreur inconnue"}`);
  enregistrerUsage({ phase: "classification-actu", model, usage: data.usage, coutUsd: data.total_cost_usd, source: "cli-abonnement" });
  return data.result || "";
}

async function classifier(row) {
  const listeSousCategories = Object.entries(SOUS_CATEGORIES)
    .map(([slug, titre]) => `${slug} (${titre})`)
    .join(", ");
  const prompt = `Tu filtres des actus pour un média grand public francophone (besthomeproject.com, accompagnement de A à Z d'un projet de maison : budget, plans, devis, chantier, livraison, puis rénovation/déco/équipements), ton direct, pas infantilisant.
Réponds UNIQUEMENT par un JSON {"retenir": true|false, "raison": "...", "souscategorie": "<un slug parmi la liste ci-dessous, ou null si retenir est false>"}.
Critères pour retenir : article en français, source sérieuse (presse ou site spécialisé reconnu, pas un blog obscur ou un résumé IA sans substance), sujet concret et compréhensible pour un lecteur grand public qui a un projet de construction/rénovation de maison, fait confirmé (pas une rumeur non vérifiée du type "aurait", "pourrait"), ET qui correspond réellement à une des sous-catégories du site (sinon écarter, même si l'actu est par ailleurs intéressante).
Sous-catégories valides : ${listeSousCategories}
Titre : ${row.titre}
Résumé : ${row.resume.slice(0, 500)}
Source : ${row.sourceUrl}`;
  const texte = await appelModeleLeger(prompt);
  const match = texte.match(/\{[\s\S]*\}/);
  if (!match) return { retenir: false, raison: "réponse illisible" };
  try {
    const verdict = JSON.parse(match[0]);
    if (verdict.retenir && !SOUS_CATEGORIES[verdict.souscategorie]) {
      return { retenir: false, raison: `sous-catégorie invalide ou absente (« ${verdict.souscategorie} »)` };
    }
    return verdict;
  } catch (err) {
    throw new Error(`classifier : JSON invalide (${err.message}) — réponse brute : ${texte.slice(0, 300)}`);
  }
}

// Parcourt l'onglet jusqu'à trouver `max` actus retenues (pas juste `max` lignes évaluées) —
// toutes les lignes évaluées (retenues ou écartées) sont renvoyées, pour marquage ultérieur.
async function selectionnerPourOnglet(max) {
  const evaluees = [];
  let nbRetenues = 0;
  const rows = await getValues(SPREADSHEET_ID, `${ONGLET}!A2:F1000`);
  for (let i = 0; i < rows.length && nbRetenues < max; i++) {
    const [date, titre, resume = "", sourceUrl = "", thematique = "", statut = ""] = rows[i];
    if (!titre || statut) continue; // déjà traité ou écarté
    const rowIndex = i + 2; // +2 : en-tête + index 0-based
    if (sembleNonFrancais(`${titre} ${resume}`)) {
      evaluees.push({ onglet: ONGLET, rowIndex, titre, resume, sourceUrl, date, statut: "ecarte", raison: "langue" });
      continue;
    }
    const verdict = await classifier({ titre, resume, sourceUrl });
    if (verdict.retenir) {
      evaluees.push({
        onglet: ONGLET,
        rowIndex,
        titre,
        resume,
        sourceUrl,
        date,
        statut: "retenu",
        raison: verdict.raison,
        theme: verdict.souscategorie,
      });
      nbRetenues++;
    } else {
      evaluees.push({ onglet: ONGLET, rowIndex, titre, resume, sourceUrl, date, statut: "ecarte", raison: verdict.raison });
    }
  }
  return evaluees;
}

async function selectionnerActusDuJour({ n = 2, marquer = false } = {}) {
  const resultats = await selectionnerPourOnglet(n);
  const selection = resultats.filter((r) => r.statut === "retenu").slice(0, n);
  const tousLesEcartes = resultats.filter((r) => r.statut !== "retenu");
  if (marquer) {
    const aujourdhui = new Date().toISOString().slice(0, 10);
    for (const item of [...selection, ...tousLesEcartes]) {
      const valeur = item.statut === "retenu" ? `Publié ${aujourdhui}` : `Écarté (${item.raison}) ${aujourdhui}`;
      await updateValues(SPREADSHEET_ID, `${item.onglet}!F${item.rowIndex}`, [[valeur]]);
    }
  }
  return selection;
}

module.exports = { selectionnerActusDuJour, SOUS_CATEGORIES };

if (require.main === module) {
  const args = process.argv.slice(2);
  const n = args.includes("--n") ? Number(args[args.indexOf("--n") + 1]) : 2;
  const marquer = args.includes("--marquer");
  selectionnerActusDuJour({ n, marquer })
    .then((selection) => {
      console.log(`${selection.length} actu(s) retenue(s) :`);
      for (const s of selection) {
        console.log(`- [${s.theme}] ${s.titre}\n  ${s.sourceUrl}\n  raison : ${s.raison}`);
      }
      if (!marquer) console.log("\n(mode simulation — relancer avec --marquer pour écrire le statut dans le sheet)");
    })
    .catch((err) => {
      console.error("Erreur sélection actus :", err.message);
      process.exit(1);
    });
}
