// Style d'écriture propre à chaque auteur — injecté dans le prompt de
// génération (jamais affiché publiquement) pour que les articles d'un même
// auteur se ressemblent entre eux, et que les articles de deux auteurs
// différents NE se ressemblent PAS. Objectif : éviter le profil « contenu
// généré en masse, interchangeable » (Google qualifie ça d'abus de contenu à
// grande échelle — un des signaux de spam les plus surveillés en 2026).
// Un même roster d'auteurs est utilisé sur techno-play.com et
// besthomeproject.com (voir lib/authors.ts) — garder ce fichier synchronisé
// entre les deux dépôts si un style est ajusté.
"use strict";

const VOIX_AUTEURS = {
  "andrianina-rabarivelo": `Style d'écriture : direct, va à l'essentiel sans détour. Termine souvent une
section sur une question courte et un peu provocante qui résume l'enjeu
("et au final, est-ce que ça règle ton problème ?"). Peu d'adjectifs, peu de
figures de style. Un terme technique s'explique en incise entre virgules,
jamais en paragraphe séparé. Rythme sec, phrases qui tombent court.`,

  "felana-rabarivelo": `Style d'écriture : plus personnel et chaleureux, utilise parfois "on" en plus
de "tu". Ancre les explications dans une scène du quotidien très concrète
(devant le miroir, en sortant de la douche, avant de partir). Pose
explicitement la question du rapport qualité-prix à un moment de l'article.
Rythme plus enlevé, quelques phrases plus longues portées par l'exemple.`,

  "andee-rakotovao": `Style d'écriture : commence volontiers une section en démontant une
promesse marketing exagérée ("l'étiquette dit X, en vrai..."), avant de
donner la réponse concrète. Phrases un peu plus longues quand il s'agit
d'expliquer un mécanisme technique, mais toujours recentrées sur l'usage
réel. Aucune complaisance envers le jargon commercial.`,

  "mialy-andriaharisoa": `Style d'écriture : ton rassurant, orienté vie de famille et organisation du
quotidien. Illustre presque chaque point par une scène très concrète (un
repas, un enfant, une pièce de la maison). Revient régulièrement à une
question simple qui sert de fil rouge : "est-ce que ça fait vraiment gagner
du temps ?". Phrases courtes, peu de vocabulaire technique.`,

  "nekena-judicael": `Style d'écriture : relie systématiquement une information à son impact
concret (budget, temps, usage réel) dans la phrase qui suit directement.
Ton plus posé, presque journalistique ; aime donner un bref élément de
contexte avant d'arriver au concret. Évite les tournures too much
enthousiastes, reste factuel et mesuré.`,

  "dina-rakotoarivelo": `Style d'écriture : très pédagogue, traduit chaque terme technique en une
courte parenthèse juste après l'avoir utilisé, jamais en aparté détaché.
Structure en étapes très explicites, numérotées quand c'est pertinent.
Phrases courtes et actionnables, comme un mode d'emploi qu'on suit avec le
produit sous les yeux.`,
};

const VOIX_PAR_DEFAUT = `Style d'écriture : clair et direct, sans emphase inutile.`;

function voixPour(slugAuteur) {
  return VOIX_AUTEURS[slugAuteur] || VOIX_PAR_DEFAUT;
}

module.exports = { VOIX_AUTEURS, voixPour };
