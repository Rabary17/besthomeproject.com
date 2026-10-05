// Arborescence éditoriale du site : textes rédigés selon la charte de ton
// (tutoiement, ton direct, un peu d'humour).
// 4 rubriques par type de contenu (guides, comparatifs, idées, actu),
// chacune découpée en sous-catégories par thème de la maison. Source de
// vérité unique, réutilisée par :
//   - le menu principal et le pied de page (app/layout.tsx) ;
//   - les pages hub de rubrique (/<rubrique>/) et de sous-catégorie
//     (/<rubrique>/<sous-categorie>/) — voir app/[slug]/ ;
//   - le frontmatter des articles : champ `category` = slug d'une
//     SOUS-CATÉGORIE (ex. "peinture-sols-murs"), la rubrique parente en
//     est déduite ;
//   - scripts/generate-covers.js pour les visuels de secours.
// Ajouter une sous-catégorie ici suffit à la faire apparaître partout
// (penser à relancer `npm run generate-covers` pour son visuel, et à
// donner un titulaire dans lib/auteurs-specialites.json).
//
// `seoTarget` = cible de mots-clés interne (brief de l'étude de mots-clés),
// jamais affichée sur le site.
import type { IconName } from "@/components/Icon";

export type SectionSlug =
  | "guides-tutos"
  | "comparatifs-achats"
  | "idees-inspiration"
  | "actu-aides";

export type SubcategorySlug =
  // Guides & Tutos
  | "bricolage-reparations"
  | "peinture-sols-murs"
  | "plomberie-electricite"
  | "jardin-exterieur"
  // Comparatifs & Achats
  | "outillage-equipement"
  | "electromenager-cuisine"
  | "maison-connectee-securite"
  | "jardin-plein-air"
  // Idées & Inspiration
  | "deco-ambiance"
  | "amenagement-rangement"
  | "maison-en-famille"
  // Actu & Aides
  | "aides-budget"
  | "energie-economies"
  | "nouveautes-tendances";

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
  /** Phrase d'accroche (meta description, cartes). */
  description: string;
  /** Paragraphe de présentation (page hub + accueil). */
  body: string;
  subcategories: Subcategory[];
}

export const SECTIONS: Section[] = [
  {
    slug: "guides-tutos",
    title: "Guides & Tutos",
    short: "Guides & Tutos",
    icon: "wrench",
    description:
      "Tutos pas à pas pour réussir tes travaux et tes réparations : bricolage, peinture, plomberie, électricité et jardin.",
    body: "Une étagère qui ne tient pas, un mur à repeindre, un robinet qui goutte ? Ici, chaque guide part d'une question précise et va droit au but : le matériel à prévoir, des étapes numérotées, les erreurs à éviter, et une consigne claire quand mieux vaut appeler un pro.",
    subcategories: [
      {
        slug: "bricolage-reparations",
        title: "Bricolage & Réparations",
        icon: "hammer",
        body: "Percer, fixer, réparer : les petits travaux du quotidien expliqués pas à pas, avec le bon outil et sans abîmer tes murs.",
        seoTarget: "percer un mur, fixer une étagère, réparer une porte qui frotte",
      },
      {
        slug: "peinture-sols-murs",
        title: "Peinture, Sols & Murs",
        icon: "paint-roller",
        body: "Peindre une pièce, poser un sol, lisser un mur : les gestes qui donnent un résultat propre, même quand c'est ta première fois.",
        seoTarget: "peindre un mur, poser un sol vinyle, reboucher et lisser un mur",
      },
      {
        slug: "plomberie-electricite",
        title: "Plomberie & Électricité",
        icon: "plug-zap",
        body: "Un robinet qui goutte, une prise à changer, un évier bouché : ce que tu peux faire toi-même, et ce qu'il vaut mieux confier à un pro.",
        seoTarget: "robinet qui fuit, changer une prise, déboucher un évier",
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
    slug: "comparatifs-achats",
    title: "Comparatifs & Achats",
    short: "Comparatifs",
    icon: "scale",
    description:
      "Guides d'achat et comparatifs pour choisir ton outillage, ton électroménager, ta maison connectée et ton matériel de jardin selon ton usage et ton budget.",
    body: "Avant d'acheter, la vraie question n'est pas « quel est le meilleur produit ? » mais « quel est le bon produit pour mon logement, mon budget et mon niveau ? ». Nos comparatifs partent de ton usage, séparent les critères qui comptent vraiment du blabla marketing… et n'hésitent pas à te dire quand un produit ne vaut pas son prix.",
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
  {
    slug: "idees-inspiration",
    title: "Idées & Inspiration",
    short: "Idées",
    icon: "lightbulb",
    description:
      "Déco, aménagement, rangement et maison en famille : des idées concrètes et réalisables pour que chaque pièce te ressemble.",
    body: "Pas besoin de tout refaire pour que ça change tout. Ici, on part de pièces réelles, avec leurs contraintes (petite surface, peu de lumière, budget serré) et on propose des idées que tu peux réaliser : des astuces de déco, de rangement et d'aménagement qui marchent vraiment.",
    subcategories: [
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
        body: "Chambre d'enfant, espace de jeu, maison sécurisée pour les petits : une maison qui suit les besoins de toute la famille.",
        seoTarget: "chambre enfant évolutive, sécuriser la maison bébé, coin lecture enfant",
      },
    ],
  },
  {
    slug: "actu-aides",
    title: "Actu & Aides",
    short: "Actu & Aides",
    icon: "newspaper",
    description:
      "Aides à la rénovation, budget travaux, économies d'énergie et nouveautés : ce qui change vraiment pour ta maison et ton portefeuille.",
    body: "Les règles changent, les prix bougent, les nouveautés s'accumulent. On suit l'actu de la maison avec un filtre simple : qu'est-ce que ça change concrètement pour toi ? Aides financières, budget de travaux, économies d'énergie, nouveaux produits — l'essentiel, vérifié à la source, sans emballement.",
    subcategories: [
      {
        slug: "aides-budget",
        title: "Aides & Budget travaux",
        icon: "piggy-bank",
        body: "Aides à la rénovation, devis, financement : t'y retrouver et construire un budget de travaux réaliste.",
        seoTarget: "aides rénovation, lire un devis de travaux, budget travaux",
      },
      {
        slug: "energie-economies",
        title: "Énergie & Économies",
        icon: "thermometer",
        body: "Isolation, chauffage, consommation : réduire ta facture avec les bons gestes et les bons équipements.",
        seoTarget: "réduire sa facture d'énergie, isolation, chauffage économique",
      },
      {
        slug: "nouveautes-tendances",
        title: "Nouveautés & Tendances",
        icon: "sparkles",
        body: "Nouveaux produits, normes qui évoluent, tendances déco et bricolage : ce qui change pour ta maison.",
        seoTarget: "nouveautés bricolage, tendances déco, nouvelles normes",
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
