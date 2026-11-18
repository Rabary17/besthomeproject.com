// Client minimal pour l'API DataForSEO (recherche de mots-clés), authentifié par Basic Auth
// login/password (.env.local : DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD).
require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env.local") });

const BASE_URL = "https://api.dataforseo.com/v3";

function authHeader() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error("DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD manquants dans .env.local");
  }
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

async function post(endpoint, payload) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (json.status_code !== 20000) {
    throw new Error(`DataForSEO erreur ${json.status_code}: ${json.status_message}`);
  }
  return json.tasks;
}

// Volume de recherche + CPC + difficulté pour une liste de mots-clés donnés (France, FR).
async function searchVolume(keywords, { locationCode = 2250, languageCode = "fr" } = {}) {
  const tasks = await post("/keywords_data/google_ads/search_volume/live", [
    {
      keywords,
      location_code: locationCode,
      language_code: languageCode,
    },
  ]);
  return (tasks[0]?.result || []).filter(Boolean);
}

// Suggestions de mots-clés associés à un mot-clé racine (volume de recherche réel, pas juste des idées).
async function keywordsForKeywords(seedKeywords, { locationCode = 2250, languageCode = "fr", limit = 200 } = {}) {
  const tasks = await post("/keywords_data/google_ads/keywords_for_keywords/live", [
    {
      keywords: seedKeywords,
      location_code: locationCode,
      language_code: languageCode,
      limit,
    },
  ]);
  return (tasks[0]?.result || []).filter(Boolean);
}

module.exports = { searchVolume, keywordsForKeywords };

if (require.main === module) {
  const seed = process.argv[2] || "intelligence artificielle";
  searchVolume([seed])
    .then((result) => {
      console.log(`Test DataForSEO — volume pour "${seed}" :`);
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error("Erreur DataForSEO :", err.message);
      process.exit(1);
    });
}
