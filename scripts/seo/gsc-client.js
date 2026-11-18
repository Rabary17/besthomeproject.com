// Client minimal pour l'API Search Console (lecture seule), authentifié par compte de service.
// Nécessite .secrets/gsc-service-account.json (voir .env.local pour le chemin si déplacé).
const fs = require("fs");
const path = require("path");
const dns = require("dns");
const { JWT } = require("google-auth-library");

// Cet environnement résout IPv6 en priorité mais ne route pas vers IPv6 — sans ceci,
// les appels à googleapis.com échouent silencieusement (host unreachable).
dns.setDefaultResultOrder("ipv4first");

const KEY_PATH =
  process.env.GSC_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, "..", "..", ".secrets", "gsc-service-account.json");

const SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"];

function getClient() {
  const key = JSON.parse(fs.readFileSync(KEY_PATH, "utf8"));
  return new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: SCOPES,
  });
}

async function listSites() {
  const client = getClient();
  const res = await client.request({
    url: "https://www.googleapis.com/webmasters/v3/sites",
  });
  return res.data.siteEntry || [];
}

async function searchAnalyticsQuery(siteUrl, body) {
  const client = getClient();
  const res = await client.request({
    url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      siteUrl
    )}/searchAnalytics/query`,
    method: "POST",
    data: body,
  });
  return res.data;
}

async function inspectUrl(siteUrl, inspectionUrl) {
  const client = getClient();
  const res = await client.request({
    url: "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    method: "POST",
    data: { inspectionUrl, siteUrl },
  });
  return res.data;
}

module.exports = { listSites, searchAnalyticsQuery, inspectUrl };

if (require.main === module) {
  listSites()
    .then((sites) => {
      console.log("Propriétés accessibles par ce compte de service :");
      for (const s of sites) {
        console.log(`- ${s.siteUrl} (${s.permissionLevel})`);
      }
      if (sites.length === 0) {
        console.log(
          "Aucune propriété — vérifier que l'email du compte de service a été ajouté comme utilisateur dans Search Console."
        );
      }
    })
    .catch((err) => {
      console.error("Erreur GSC :", err.response?.data || err.message);
      process.exit(1);
    });
}
