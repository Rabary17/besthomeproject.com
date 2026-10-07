// Arborescence éditoriale du site, organisée selon le PARCOURS d'un projet
// de maison, de A à Z (voir VISION.md) :
//   1. Préparer son projet  → budget, terrain, plans, devis
//   2. Lancer le projet     → entreprises, permis, contrats
//   3. Le chantier          → de la fondation aux finitions
//   4. Livraison            → réception, garanties
//   5. Rénovation, déco & aménagement
//   6. Équipements & comparatifs (les achats qui jalonnent le projet)
// Source de vérité unique, réutilisée par :
//   - le menu principal et le pied de page (app/layout.tsx) ;
//   - la page d'accueil, /parcours/ et /kits/ ;
//   - les pages hub de rubrique (/<rubrique>/) et de sous-catégorie
//     (/<rubrique>/<sous-categorie>/) — voir app/[slug]/ ;
//   - le frontmatter des articles : champ `category` = slug d'une
//     SOUS-CATÉGORIE (ex. "devis-construction"), la rubrique parente en
//     est déduite ;
//   - scripts/generate-covers.js pour les visuels de secours.
// Ajouter une sous-catégorie ici suffit à la faire apparaître partout
// (penser à relancer `npm run generate-covers` pour son visuel, et à
// donner un titulaire dans lib/auteurs-specialites.json).
// Contexte : France (permis de construire, RE2020, garanties légales...).
//
// `seoTarget` = cible de mots-clés interne (brief de l'étude de mots-clés),
// jamais affichée sur le site.
import type { IconName } from "@/components/Icon";

export type SectionSlug =
  | "preparer-son-projet"
  | "lancer-le-projet"
  | "chantier-etape-par-etape"
  | "livraison-reception"
  | "renovation-deco-amenagement"
  | "equipements-comparatifs";

export type SubcategorySlug =
  // Préparer son projet
  | "aides-budget"
  | "terrain-etudes"
  | "plans-dessinateur"
  | "devis-construction"
  // Lancer le projet
  | "choisir-entreprises"
  | "permis-demarches"
  | "contrats-assurances"
  // Le chantier
  | "fondations-gros-oeuvre"
  | "hors-d-eau-hors-d-air"
  | "plomberie-electricite"
  | "peinture-sols-murs"
  | "suivi-chantier"
  // Livraison
  | "reception-reserves"
  | "garanties-mise-en-service"
  // Rénovation, déco & aménagement
  | "renovation-travaux"
  | "bricolage-reparations"
  | "energie-economies"
  | "deco-ambiance"
  | "amenagement-rangement"
  | "maison-en-famille"
  | "jardin-exterieur"
  // Équipements & comparatifs
  | "outillage-equipement"
  | "electromenager-cuisine"
  | "maison-connectee-securite"
  | "jardin-plein-air";

export interface Subcategory {
  slug: SubcategorySlug;
  title: string;
  icon: IconName;
  /** Une à deux phrases affichées sur la page hub et la page de la sous-catégorie. */
  body: string;
  /** Cible SEO interne — brief pour l'étude de mots-clés, non affichée. */
  seoTarget: string;
}

export interface Section {
  slug: SectionSlug;
  title: string;
  /** Libellé court pour le menu et les étiquettes. */
  short: string;
  icon: IconName;
  /** Numéro d'étape dans le parcours (1 à 4) ; absent pour les rubriques transversales. */
  etape?: number;
  /** Phrase d'accroche (meta description, cartes). */
  description: string;
  /** Paragraphe de présentation (page hub + accueil). */
  body: string;
  subcategories: Subcategory[];
}

export const SECTIONS: Section[] = [
  {
    slug: "preparer-son-projet",
    title: "Préparer son projet",
    short: "Préparer",
    icon: "lightbulb",
    etape: 1,
    description:
      "Avant la première pelleteuse : budget, financement, terrain, plans et devis. Tout ce qu'il faut cadrer pour lancer ton projet de maison sereinement.",
    body: "Un projet de maison se joue en grande partie avant le chantier. Combien puis-tu investir ? Quel terrain, quels plans, quel dessinateur, quels devis ? Ici, on t'aide à poser des bases solides : un budget réaliste, une étude sérieuse et des devis que tu sais comparer.",
    subcategories: [
      {
        slug: "aides-budget",
        title: "Budget, Financement & Aides",
        icon: "piggy-bank",
        body: "Définir ton budget, comprendre ton financement, repérer les aides : le plan financier de ton projet, avant de signer quoi que ce soit.",
        seoTarget: "budget construction maison, plan de financement, aides à la construction",
      },
      {
        slug: "terrain-etudes",
        title: "Terrain & Études",
        icon: "trees",
        body: "Choisir un terrain, comprendre ce qu'on peut y construire, anticiper les études nécessaires : les vérifications à faire avant d'acheter.",
        seoTarget: "acheter un terrain constructible, étude de sol, PLU, viabilisation",
      },
      {
        slug: "plans-dessinateur",
        title: "Plans & Dessinateur",
        icon: "lightbulb",
        body: "Définir ton besoin, trouver un dessinateur ou un architecte, lire un plan : transformer ton idée en plans que tu comprends vraiment.",
        seoTarget: "trouver un dessinateur de plan, faire les plans d'une maison, architecte ou dessinateur",
      },
      {
        slug: "devis-construction",
        title: "Devis de construction",
        icon: "scale",
        body: "Demander des devis, les comparer poste par poste, repérer ce qui manque : un devis se lit, et se négocie mieux quand on sait quoi regarder.",
        seoTarget: "devis construction maison, comparer des devis, lire un devis de constructeur",
      },
    ],
  },
  {
    slug: "lancer-le-projet",
    title: "Lancer le projet",
    short: "Lancer",
    icon: "scale",
    etape: 2,
    description:
      "Choisir les bonnes entreprises, obtenir ton permis, sécuriser contrats et assurances : les étapes pour démarrer ton projet de maison sans mauvaise surprise.",
    body: "Les plans sont prêts, le budget est posé : place à l'action. Il faut trouver les entreprises qui construiront ta maison, déposer les autorisations et signer des contrats solides. Chaque guide te dit quoi demander, quoi vérifier et quels pièges éviter.",
    subcategories: [
      {
        slug: "choisir-entreprises",
        title: "Choisir ses entreprises",
        icon: "shield-check",
        body: "Constructeur, maître d'œuvre ou artisans : où les trouver, quelles questions poser, quelles références vérifier avant de s'engager.",
        seoTarget: "choisir un constructeur de maison, trouver un maître d'œuvre, vérifier un artisan",
      },
      {
        slug: "permis-demarches",
        title: "Permis & Démarches",
        icon: "newspaper",
        body: "Permis de construire, déclarations, délais : le dossier administratif de ton projet, expliqué dans l'ordre.",
        seoTarget: "permis de construire dossier, délai permis de construire, démarches construction maison",
      },
      {
        slug: "contrats-assurances",
        title: "Contrats & Assurances",
        icon: "shield-alert",
        body: "Contrat de construction, garanties, assurances du chantier : ce qui te protège, et les clauses à lire de près avant de signer.",
        seoTarget: "contrat de construction de maison individuelle, assurance dommages-ouvrage, garantie décennale",
      },
    ],
  },
  {
    slug: "chantier-etape-par-etape",
    title: "Le chantier, étape par étape",
    short: "Chantier",
    icon: "hammer",
    etape: 3,
    description:
      "De la fondation aux finitions : chaque grande étape du chantier de ta maison, avec ce qu'il faut savoir, vérifier et demander à chaque stade.",
    body: "Un chantier se déroule dans un ordre précis, de la fondation jusqu'aux finitions. À chaque étape, on t'explique ce qui se passe, ce que tu dois contrôler et les questions à poser à tes entreprises, pour suivre ton chantier en sachant où tu en es.",
    subcategories: [
      {
        slug: "fondations-gros-oeuvre",
        title: "Fondations & Gros œuvre",
        icon: "hammer",
        body: "Terrassement, fondations, murs porteurs, dalle : la base de ta maison, et les points de contrôle à ne pas manquer.",
        seoTarget: "étapes construction maison fondations, gros oeuvre maison, dalle béton",
      },
      {
        slug: "hors-d-eau-hors-d-air",
        title: "Hors d'eau & Hors d'air",
        icon: "house",
        body: "Charpente, toiture, menuiseries : la maison se ferme, devient étanche, et le chantier peut continuer à l'abri.",
        seoTarget: "hors d'eau hors d'air définition, charpente toiture, pose des menuiseries",
      },
      {
        slug: "plomberie-electricite",
        title: "Plomberie & Électricité",
        icon: "plug-zap",
        body: "Réseaux, tableau électrique, sanitaires : le second œuvre technique, et ce qu'il faut vérifier avant de fermer les cloisons.",
        seoTarget: "installation électrique maison neuve, plomberie maison neuve, tableau électrique",
      },
      {
        slug: "peinture-sols-murs",
        title: "Sols, Murs & Finitions",
        icon: "paint-roller",
        body: "Plâtrerie, revêtements de sol, peinture : les finitions qui donnent à ta maison son visage, et les défauts à repérer.",
        seoTarget: "finitions maison neuve, peindre un mur, poser un sol",
      },
      {
        slug: "suivi-chantier",
        title: "Suivi & Contrôles",
        icon: "shield-check",
        body: "Réunions de chantier, calendrier, paiements par étapes : garder la main sur ton chantier, même sans être du métier.",
        seoTarget: "suivre un chantier de construction, réunion de chantier, appels de fonds",
      },
    ],
  },
  {
    slug: "livraison-reception",
    title: "Livraison & Réception",
    short: "Livraison",
    icon: "shield-check",
    etape: 4,
    description:
      "Réception du chantier, réserves, garanties, remise des clés : les derniers pas pour que ta maison terminée soit vraiment prête à vivre.",
    body: "La maison est terminée, tout est en place : reste l'étape la plus importante pour toi. Visiter avec méthode, noter les défauts, formuler des réserves, comprendre tes garanties. Ces guides t'aident à réceptionner ton chantier l'esprit tranquille.",
    subcategories: [
      {
        slug: "reception-reserves",
        title: "Réception & Réserves",
        icon: "shield-check",
        body: "Comment se passe la réception, quoi vérifier pièce par pièce, comment formuler des réserves qui seront prises au sérieux.",
        seoTarget: "réception de chantier maison, réserves à la livraison, checklist réception maison neuve",
      },
      {
        slug: "garanties-mise-en-service",
        title: "Garanties & Mise en service",
        icon: "shield-alert",
        body: "Parfait achèvement, biennale, décennale : tes garanties après la livraison, et les premiers réglages de ta maison.",
        seoTarget: "garantie parfait achèvement, garantie décennale, mise en service maison neuve",
      },
    ],
  },
  {
    slug: "renovation-deco-amenagement",
    title: "Rénovation, Déco & Aménagement",
    short: "Rénover & Décorer",
    icon: "lamp",
    description:
      "Rénovation, travaux, déco, aménagement, rangement et extérieur : donne à ta maison, neuve ou ancienne, le confort et le style qui te ressemblent.",
    body: "Une maison se rénove, se décore et s'aménage tout au long de sa vie. Isoler, refaire une pièce, repenser le rangement, choisir une ambiance, soigner l'extérieur : des idées concrètes et réalisables, avec leurs contraintes de budget et de surface.",
    subcategories: [
      {
        slug: "renovation-travaux",
        title: "Rénovation & Travaux",
        icon: "hammer",
        body: "Rénover une pièce ou une maison entière : par où commencer, dans quel ordre, avec quel budget et quelles autorisations.",
        seoTarget: "rénover une maison ancienne, ordre des travaux de rénovation, budget rénovation",
      },
      {
        slug: "bricolage-reparations",
        title: "Bricolage & Réparations",
        icon: "hammer",
        body: "Percer, fixer, réparer : les petits travaux du quotidien expliqués pas à pas, avec le bon outil et sans abîmer tes murs.",
        seoTarget: "percer un mur, fixer une étagère, réparer une porte qui frotte",
      },
      {
        slug: "energie-economies",
        title: "Énergie & Isolation",
        icon: "thermometer",
        body: "Isolation, chauffage, consommation : réduire ta facture avec les bons gestes, les bons équipements et les bonnes aides.",
        seoTarget: "réduire sa facture d'énergie, isolation, chauffage économique",
      },
      {
        slug: "deco-ambiance",
        title: "Déco & Ambiance",
        icon: "lamp",
        body: "Couleurs, textiles, luminaires, salle de bain : donne du caractère à tes pièces avec des idées qui ne ruinent pas ton budget.",
        seoTarget: "idées déco salon, associer les couleurs, luminaire, ambiance salle de bain",
      },
      {
        slug: "amenagement-rangement",
        title: "Aménagement & Rangement",
        icon: "armchair",
        body: "Petite surface, entrée sans place, coin bureau : agence tes pièces pour qu'elles soient pratiques autant que jolies.",
        seoTarget: "aménager un petit salon, rangement entrée, coin bureau à la maison",
      },
      {
        slug: "maison-en-famille",
        title: "Maison en famille",
        icon: "baby",
        body: "Chambre d'enfant, espace de jeu, logement pour les parents : une maison qui suit les besoins de toute la famille.",
        seoTarget: "chambre enfant évolutive, aménager un logement pour ses parents, sécuriser la maison bébé",
      },
      {
        slug: "jardin-exterieur",
        title: "Jardin & Extérieur",
        icon: "flower-2",
        body: "Potager, terrasse, haie, pelouse : aménager et entretenir ton extérieur sans y passer tous tes week-ends.",
        seoTarget: "potager débutant, entretien de terrasse, tailler une haie",
      },
    ],
  },
  {
    slug: "equipements-comparatifs",
    title: "Équipements & Comparatifs",
    short: "Équipements",
    icon: "house",
    description:
      "Outillage, électroménager, maison connectée, matériel de jardin : des comparatifs pour bien équiper ta maison selon ton usage et ton budget.",
    body: "Construire ou rénover, c'est aussi équiper : outils, cuisine, objets connectés, jardin. La vraie question n'est pas « quel est le meilleur produit ? » mais « quel est le bon pour ma maison, mon budget et mon usage ? ». Nos comparatifs partent de là, et te disent quand un produit ne vaut pas son prix.",
    subcategories: [
      {
        slug: "outillage-equipement",
        title: "Outillage & Équipement",
        icon: "drill",
        body: "Perceuse, visseuse, ponceuse, échelle : choisis l'outil qu'il te faut pour tes travaux, sans payer pour du matériel de chantier.",
        seoTarget: "perceuse visseuse, ponceuse, échelle, caisse à outils",
      },
      {
        slug: "electromenager-cuisine",
        title: "Électroménager & Cuisine",
        icon: "cooking-pot",
        body: "Robots, aspirateurs, fours, réfrigérateurs : les critères qui comptent vraiment avant d'acheter, de la capacité à la consommation.",
        seoTarget: "robot cuiseur, aspirateur robot, four encastrable, réfrigérateur",
      },
      {
        slug: "maison-connectee-securite",
        title: "Maison connectée & Sécurité",
        icon: "house",
        body: "Ampoules, caméras, serrures, thermostats : construis une maison connectée vraiment utile, compatible… et qui respecte ta vie privée.",
        seoTarget: "caméra de surveillance, serrure connectée, thermostat connecté, ampoules connectées",
      },
      {
        slug: "jardin-plein-air",
        title: "Jardin & Plein air",
        icon: "trees",
        body: "Tondeuse, robot tondeuse, barbecue, mobilier de jardin : de quoi équiper ton extérieur selon sa taille et ton temps disponible.",
        seoTarget: "tondeuse, robot tondeuse, barbecue, salon de jardin",
      },
    ],
  },
];

export const ALL_SUBCATEGORIES: { section: Section; sub: Subcategory }[] =
  SECTIONS.flatMap((section) => section.subcategories.map((sub) => ({ section, sub })));

export function getSection(slug: string | undefined): Section | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}

export function getSubcategory(
  slug: string | undefined
): { section: Section; sub: Subcategory } | undefined {
  return ALL_SUBCATEGORIES.find((entry) => entry.sub.slug === slug);
}

/**
 * Résout le champ `category` d'un article : slug de sous-catégorie
 * (cas normal) ou, à défaut, slug de rubrique. Renvoie la rubrique et,
 * si elle est connue, la sous-catégorie.
 */
export function resolveCategory(
  slug: string | undefined
): { section: Section; sub?: Subcategory } | undefined {
  const entry = getSubcategory(slug);
  if (entry) return entry;
  const section = getSection(slug);
  return section ? { section } : undefined;
}

export function sectionUrl(section: Section) {
  return `/${section.slug}/`;
}

export function subcategoryUrl(section: Section, sub: Subcategory) {
  return `/${section.slug}/${sub.slug}/`;
}
