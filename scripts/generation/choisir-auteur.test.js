"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { choisirAuteur, correspondances, ecrireAuteur, REGLES } = require("./choisir-auteur");

const racine = path.join(__dirname, "..", "..");
const slugsAuteurs = [...fs.readFileSync(path.join(racine, "lib/authors.ts"), "utf8").matchAll(/^\s{4}slug: "([^"]+)"/gm)].map((m) => m[1]);
const slugsCategories = [...fs.readFileSync(path.join(racine, "lib/categories.ts"), "utf8").matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]);

test("chaque sous-catégorie a un titulaire, et chaque auteur cité existe", () => {
  const sousCategories = slugsCategories.filter((s) => !["guides-tutos", "comparatifs-achats", "idees-inspiration", "actu-aides"].includes(s));
  for (const s of sousCategories) assert.ok(REGLES.categories[s], `sous-catégorie sans titulaire : ${s}`);
  for (const [cat, a] of Object.entries(REGLES.categories)) {
    assert.ok(sousCategories.includes(cat), `catégorie inconnue : ${cat}`);
    assert.ok(slugsAuteurs.includes(a), `auteur inconnu : ${a}`);
  }
  for (const a of Object.keys(REGLES.motsCles)) assert.ok(slugsAuteurs.includes(a), `auteur inconnu : ${a}`);
  assert.ok(slugsAuteurs.includes(REGLES.defaut));
});

test("mots-clés : mot entier, sans accents, pluriel toléré", () => {
  assert.deepStrictEqual(Object.keys(correspondances("Les meilleures perceuses visseuses sans fil")), ["nekena-judicael"]);
  assert.deepStrictEqual(Object.keys(correspondances("Chambre de bébé : les erreurs à éviter")), ["mialy-andriaharisoa"]);
  assert.deepStrictEqual(correspondances("Poser une étagère sur un mur en placo"), {});
  assert.deepStrictEqual(correspondances("Fixer un cadre sans percer : la fourchette de prix des adhésifs"), {});
  assert.deepStrictEqual(correspondances("Réparer ta porte à l'aide d'un tournevis"), {});
});

test("la spécialité l'emporte sur la sous-catégorie", () => {
  assert.strictEqual(choisirAuteur({ titre: "Meilleur aspirateur robot pour poils d'animaux", categorie: "outillage-equipement" }).auteur, "mialy-andriaharisoa");
  assert.strictEqual(choisirAuteur({ titre: "Peindre un plafond sans traces : la méthode", categorie: "bricolage-reparations" }).auteur, "andee-rakotovao");
  assert.strictEqual(choisirAuteur({ titre: "Quelle caméra de surveillance choisir pour ton entrée ?", categorie: "deco-ambiance" }).auteur, "andrianina-rabarivelo");
});

test("outils numériques, WordPress et intégration HTML/CSS : Dina, quelle que soit la sous-catégorie", () => {
  assert.strictEqual(choisirAuteur({ titre: "Installer un thème WordPress et le personnaliser avec Elementor", categorie: "nouveautes-tendances" }).auteur, "dina-rakotoarivelo");
  assert.strictEqual(choisirAuteur({ titre: "Centrer un élément en CSS : la méthode simple", categorie: "bricolage-reparations" }).auteur, "dina-rakotoarivelo");
  assert.strictEqual(choisirAuteur({ titre: "Créer un site vitrine responsive en HTML", categorie: "deco-ambiance" }).auteur, "dina-rakotoarivelo");
  assert.strictEqual(choisirAuteur({ titre: "Simuler la peinture d'une pièce avec une appli de plan 3D", categorie: "peinture-sols-murs" }).auteur, "dina-rakotoarivelo");
  assert.deepStrictEqual(correspondances("Activer le mode sombre et changer de thème sur Windows"), {});
});

test("égalité ou aucun mot-clé : titulaire de la sous-catégorie, puis rédacteur en chef", () => {
  // Égalité Nekena (perceuse) / Mialy (aspirateur) : la sous-catégorie départage.
  assert.strictEqual(choisirAuteur({ titre: "Perceuse et aspirateur : lequel acheter ?", categorie: "electromenager-cuisine" }).auteur, "mialy-andriaharisoa");
  assert.strictEqual(choisirAuteur({ titre: "Perceuse et aspirateur : lequel acheter ?", categorie: "outillage-equipement" }).auteur, "nekena-judicael");
  // Aucun mot-clé : titulaire de la sous-catégorie.
  assert.strictEqual(choisirAuteur({ titre: "Colmater une fuite sous l'évier", categorie: "plomberie-electricite" }).auteur, "andrianina-rabarivelo");
  assert.strictEqual(choisirAuteur({ titre: "Raccorder une prise de courant", categorie: "aides-budget" }).auteur, "nekena-judicael");
  assert.strictEqual(choisirAuteur({ titre: "Un titre neutre" }).auteur, REGLES.defaut);
});

test("ecrireAuteur remplace ou insère la ligne author sans toucher au reste", () => {
  const avec = '---\ntitle: "X"\ndate: "2026-10-03"\nauthor: "andrianina-rabarivelo"\n---\n\nCorps';
  assert.match(ecrireAuteur(avec, "andee-rakotovao"), /author: "andee-rakotovao"\n---\n\nCorps$/);
  const sans = '---\ntitle: "X"\ndate: "2026-10-03"\n---\nCorps';
  assert.match(ecrireAuteur(sans, "mialy-andriaharisoa"), /date: "2026-10-03"\nauthor: "mialy-andriaharisoa"\n---/);
});
