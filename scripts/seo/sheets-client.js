// Client minimal pour l'API Google Sheets (lecture + écriture du statut),
// authentifié par son propre compte de service dédié (doit être partagé en
// Éditeur sur le Sheet, et l'API Google Sheets doit être activée sur son projet GCP) —
// distinct du compte de service GSC.
const fs = require("fs");
const path = require("path");
const dns = require("dns");
const { JWT } = require("google-auth-library");

dns.setDefaultResultOrder("ipv4first");

const KEY_PATH =
  process.env.SHEETS_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, "..", "..", ".secrets", "sheets-service-account.json");

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getClient() {
  let contenu;
  try {
    contenu = fs.readFileSync(KEY_PATH, "utf8");
  } catch (err) {
    throw new Error(`Compte de service Sheets introuvable (${KEY_PATH}) : ${err.message}`);
  }
  if (!contenu.trim()) {
    throw new Error(`Compte de service Sheets vide (${KEY_PATH}) — secret SHEETS_SERVICE_ACCOUNT_JSON absent ou vide en CI ?`);
  }
  let key;
  try {
    key = JSON.parse(contenu);
  } catch (err) {
    throw new Error(`Compte de service Sheets illisible (${KEY_PATH}, JSON attendu) : ${err.message}`);
  }
  return new JWT({ email: key.client_email, key: key.private_key, scopes: SCOPES });
}

// Enrichit l'erreur avec le statut HTTP et le corps brut — "Unexpected end of
// JSON input" seul (erreur générique de gaxios sur une réponse vide/HTML) ne
// dit pas pourquoi la requête a échoué (quota, auth, onglet inexistant...).
function erreurDetaillee(err, contexte) {
  const statut = err.response?.status;
  const corps = err.response?.data ? JSON.stringify(err.response.data).slice(0, 500) : err.message;
  return new Error(`${contexte} (HTTP ${statut ?? "?"}) : ${corps}`);
}

async function getValues(spreadsheetId, range) {
  try {
    const client = getClient();
    const res = await client.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    });
    return res.data.values || [];
  } catch (err) {
    throw erreurDetaillee(err, `Sheets getValues(${range})`);
  }
}

async function updateValues(spreadsheetId, range, values) {
  try {
    const client = getClient();
    const res = await client.request({
      url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        range
      )}?valueInputOption=RAW`,
      method: "PUT",
      data: { range, values, majorDimension: "ROWS" },
    });
    return res.data;
  } catch (err) {
    throw erreurDetaillee(err, `Sheets updateValues(${range})`);
  }
}

module.exports = { getValues, updateValues };

if (require.main === module) {
  const spreadsheetId = process.argv[2] || "1EBgO2wj8Tw2e9ZGkjRc3stOIEKhkjwVlwl0p6ckUf8g";
  getValues(spreadsheetId, "IA!A1:F3")
    .then((values) => {
      console.log("Lecture OK :");
      console.log(JSON.stringify(values, null, 2));
    })
    .catch((err) => {
      console.error("Erreur Sheets :", err.response?.data || err.message);
      process.exit(1);
    });
}
