// Tests du garde-fou « date de coupure » : node --test scripts/generation/
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const g = require("./garde-fou-cutoff");

test("parseCutoff lit AAAA-MM et rejette le reste", () => {
  assert.equal(g.parseCutoff("2026-06"), "2026-06");
  assert.equal(g.parseCutoff("Mes connaissances s'arrêtent en 2025-02."), "2025-02");
  assert.equal(g.parseCutoff("juin 2026"), null);
  assert.equal(g.parseCutoff(""), null);
});

test("resoudreCutoff garde la date la plus stricte", async () => {
  const plusTot = await g.resoudreCutoff("claude-sonnet-5-5", async () => "2026-03");
  assert.equal(plusTot.cutoff, "2026-03");
  const plusTard = await g.resoudreCutoff("claude-sonnet-5-5", async () => "2027-01");
  assert.equal(plusTard.cutoff, "2026-06");
  const illisible = await g.resoudreCutoff("claude-sonnet-5-5", async () => "je ne sais pas");
  assert.equal(illisible.cutoff, "2026-06");
  const erreur = await g.resoudreCutoff("claude-haiku-4-5", async () => { throw new Error("réseau"); });
  assert.equal(erreur.cutoff, "2025-02");
  assert.equal(plusTot.zoneGriseDebut, "2025-10");
});

test("resoudreCutoff refuse un modèle inconnu sans réponse lisible", async () => {
  await assert.rejects(() => g.resoudreCutoff("modele-inconnu", async () => "aucune idée"), /Génération refusée/);
  const ok = await g.resoudreCutoff("modele-inconnu", async () => "2024-12");
  assert.equal(ok.cutoff, "2024-12");
});

test("blocSysteme contient la date, la zone grise et les interdits", () => {
  const b = g.blocSysteme({ cutoff: "2026-06", aujourdhui: "3 octobre 2026" });
  assert.match(b, /juin 2026/);
  assert.match(b, /janvier 2026/); // début de zone grise (6 mois)
  assert.match(b, /3 octobre 2026/);
  assert.match(b, /\[À VÉRIFIER\]/);
});

const C = { cutoff: "2026-06" };

test("audit : date postérieure à la coupure", () => {
  const r = g.auditer("Apple a présenté ce modèle en septembre 2026.", C);
  assert.equal(r.violations[0].type, "date-posterieure");
  assert.ok(r.texteMarque.includes("septembre 2026 [À VÉRIFIER]"));
  assert.equal(g.auditer("La PS6 sortira en 2027.", C).violations[0].type, "date-posterieure");
});

test("audit : zone grise", () => {
  const r = g.auditer("Mise à jour publiée en mars 2026.", C);
  assert.equal(r.violations[0].type, "zone-grise");
  assert.equal(g.auditer("Windows 11 est sorti en octobre 2021.", C).violations.length, 0);
});

test("audit : chiffres non sourcés (prix, %, specs, stats)", () => {
  const r = g.auditer("Il coûte 1 299 € et offre 12 Go de RAM, soit 30 % de mieux, pour 2 millions d'utilisateurs.", C);
  assert.deepEqual(r.violations.map((v) => v.type), Array(4).fill("chiffre-non-source"));
  assert.ok(r.bloquant);
});

test("audit : un chiffre présent dans les sources ou le brief passe", () => {
  const sources = [{ url: "https://exemple.fr", texte: "Prix public : 1299 €. Batterie de 5 000 mAh." }];
  const r = g.auditer("Il coûte 1 299 € [S1] avec une batterie de 5000 mAh [S1].", { ...C, sources });
  assert.equal(r.violations.length, 0);
  const b = g.auditer("Windows Defender suffit-il en 2026 ?", { ...C, brief: "Titre : Windows Defender suffit-il en 2026 ?" });
  assert.equal(b.violations.length, 0);
});

test("audit : pas de faux positif sur les noms de produits et les tutos", () => {
  const r = g.auditer(
    "Ta RTX 2080 suffit. Appuie 10 secondes sur le bouton, puis ouvre une nouvelle fenêtre. Sous Windows 11, va dans Paramètres.",
    C
  );
  assert.equal(r.violations.length, 0, JSON.stringify(r.violations));
});

test("audit : affirmation de nouveauté chiffrée", () => {
  const r = g.auditer("La dernière version d'iOS 27 change tout.", C);
  assert.equal(r.violations[0].type, "fraicheur-non-sourcee");
  assert.match(r.texteMarque, /iOS 27 \[À VÉRIFIER\]/);
});

test("audit : ignore le code, les URL et les marqueurs existants", () => {
  const r = g.auditer("Lance `sleep 2027` puis lis https://site.fr/2027/12 — prix inconnu [À VÉRIFIER (prix 2027)].", C);
  assert.equal(r.violations.length, 0, JSON.stringify(r.violations));
});

test("audit : ignore le frontmatter et les commentaires HTML", () => {
  const r = g.auditer('---\ndate: "2026-10-03"\n---\n<!-- note interne : coupure 2026-06 -->\nTexte sans date.', C);
  assert.equal(r.violations.length, 0, JSON.stringify(r.violations));
});

test("audit : cutoff obligatoire", () => {
  assert.throws(() => g.auditer("texte", {}), /cutoff/);
});
