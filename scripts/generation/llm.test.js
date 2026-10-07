// Vérifie que generer() applique toujours le garde-fou (fetch simulé, aucun appel réseau).
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");

test("generer : question de coupure, garde-fou en tête du système, sortie auditée", async () => {
  process.env.ANTHROPIC_API_KEY = "test";
  const appels = [];
  global.fetch = async (_url, opts) => {
    const corps = JSON.parse(opts.body);
    appels.push(corps);
    const texte = corps.max_tokens === 20 ? "2026-03" : "Le nouveau Pixel 11 coûte 899 € et sort en novembre 2026.";
    return { ok: true, json: async () => ({ content: [{ type: "text", text: texte }] }) };
  };
  delete require.cache[require.resolve("./llm")];
  const { generer } = require("./llm");
  const r = await generer({ phase: "premier-jet", consigne: "Écris un paragraphe.", instructions: "Tutoie le lecteur.", model: "claude-sonnet-5-5" });

  assert.match(appels[0].messages[0].content, /AAAA-MM/); // 1er appel = question au modèle
  assert.equal(r.cutoff.cutoff, "2026-03"); // déclaré plus tôt que l'officiel (2026-06) → retenu
  assert.ok(appels[1].system.startsWith("=== GARDE-FOU DATE DE COUPURE")); // toujours en tête
  assert.ok(appels[1].system.indexOf("Tutoie") > appels[1].system.indexOf("FIN DU GARDE-FOU"));
  assert.ok(r.audit.bloquant);
  assert.deepEqual(r.audit.violations.map((v) => v.type).sort(), ["chiffre-non-source", "date-posterieure", "fraicheur-non-sourcee"].sort());
  assert.match(r.texte, /899 € \[À VÉRIFIER\]/);

  await generer({ phase: "faq", consigne: "FAQ", model: "claude-sonnet-5-5" });
  assert.equal(appels.filter((a) => a.max_tokens === 20).length, 1); // coupure mise en cache
  await assert.rejects(() => generer({ phase: "inconnue", consigne: "x" }), /Phase inconnue/);
});
