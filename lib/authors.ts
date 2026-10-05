// Auteurs du site — source de vérité pour l'encart auteur en bas des
// articles, la page /auteur/<slug>/, la page À propos et le JSON-LD
// `Person` (author des BlogPosting, ProfilePage). Signal E-E-A-T central :
// un rédacteur identifié, avec une bio et des profils externes vérifiables
// (`sameAs`), pèse bien plus qu'un article signé « La rédaction ».
//
// Frontmatter d'un article : `author: "andrianina-rabarivelo"` (slug
// ci-dessous). Sans champ `author`, l'article est attribué au rédacteur en
// chef (DEFAULT_AUTHOR_SLUG). À la publication, l'auteur est choisi selon sa
// spécialité : règles dans lib/auteurs-specialites.json, appliquées par
// scripts/generation/choisir-auteur.js et `npm run new-post`. Pas d'email public : le contact passe par
// la page /contact/.
//
// Les six auteurs sont ceux de Techno Play (même équipe, mêmes photos et
// profils) : leurs champs de couverture éditoriale ont été adaptés à la
// maison et au bricolage pour besthomeproject.com. Rôles et bios décrivent
// ce que chacun COUVRE sur le site — à faire valider par chacun avant mise
// en ligne ; ne pas y ajouter d'expérience ou de diplôme non confirmés.
import type { IconName } from "@/components/Icon";
import { ALL_SUBCATEGORIES, type Section, type Subcategory } from "./categories";
import REGLES from "./auteurs-specialites.json";

export interface AuthorSocial {
  label: string;
  url: string;
  icon: IconName;
}

export interface Author {
  slug: string;
  name: string;
  /** Initiales pour l'avatar de repli (tant qu'aucune photo n'est fournie). */
  initials: string;
  role: string;
  /** Photo de profil carrée (chemin sous public/), affichée en rond. */
  image?: string;
  /** Bio courte (encart auteur sous chaque article, ~50 mots). */
  shortBio: string;
  /** Bio longue (page auteur, À propos) — un paragraphe par entrée. */
  bio: string[];
  /** Domaines d'expertise — affichés sur la page auteur et repris en JSON-LD `knowsAbout`. */
  expertise: string[];
  socials: AuthorSocial[];
}

export const AUTHORS: Author[] = [
  {
    slug: "andrianina-rabarivelo",
    name: "Andrianina RABARIVELO",
    initials: "AR",
    role: "Rédacteur en chef",
    image: "/authors/andrianina-rabarivelo.jpg",
    shortBio:
      "Rédacteur en chef de Best Home Project, Andrianina RABARIVELO est développeur web et spécialiste du référencement. Il conçoit des automatisations et travaille avec les outils d'IA au quotidien, et couvre ici la maison connectée, la sécurité et les guides de travaux. Guitariste à ses heures, il applique une règle simple à chaque article : à la fin, ton projet doit avoir avancé.",
    bio: [
      "Andrianina RABARIVELO est le rédacteur en chef de Best Home Project. Développeur et responsable technique, il passe ses journées à la croisée du web, du référencement et de l'intelligence artificielle : sites WordPress et Next.js, scripts d'automatisation en Python et Node.js, extensions Chrome, infra cloud. Bref, la tech, il ne se contente pas d'en parler : il la fait tourner.",
      "Sur Best Home Project, il fixe la ligne éditoriale, choisit les sujets et veille à ce que chaque guide, comparatif ou idée réponde à une vraie question, avec des infos vérifiées. Il suit en particulier la maison connectée et la sécurité du logement (caméras, serrures, thermostats, domotique), un terrain où son regard de développeur aide à séparer le gadget utile de la fausse bonne idée, ainsi que les guides de bricolage, de plomberie, d'électricité et de jardin.",
      "Son critère, simple et sans pitié : un bon guide se juge à une seule chose — est-ce que ton projet a avancé à la fin ? Et quand le sujet touche à l'électricité, au gaz ou à la structure du logement, la bonne réponse est parfois : appelle un pro.",
      "Quand il lâche le clavier, c'est souvent pour prendre sa guitare : Andrianina est aussi guitariste.",
      "Tu peux aussi suivre ses analyses tech et IA, en français et en anglais, sur LinkedIn, X et YouTube.",
    ],
    expertise: [
      "Maison connectée et domotique",
      "Sécurité du logement (caméras, serrures, alarmes)",
      "Développement web (WordPress, Next.js)",
      "SEO et GEO (référencement sur les moteurs génératifs)",
      "Intelligence artificielle et automatisation",
    ],
    socials: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/andrianina-rabarivelo-81b160135/", icon: "linkedin" },
      { label: "X (Twitter)", url: "https://x.com/Rabarvl", icon: "twitter" },
      { label: "YouTube", url: "https://www.youtube.com/@andrianinarabarivelo2320", icon: "youtube" },
      { label: "Instagram", url: "https://www.instagram.com/mouta_rabary/", icon: "instagram" },
      { label: "Facebook", url: "https://www.facebook.com/andrianina.rabarivelo/", icon: "facebook" },
    ],
  },
  {
    slug: "felana-rabarivelo",
    name: "Felana RABARIVELO",
    initials: "FR",
    role: "Spécialiste déco, ambiance & salle de bain",
    image: "/authors/felana-rabarivelo.jpg",
    shortBio:
      "Chez Best Home Project, Felana RABARIVELO couvre la déco, l'ambiance et la salle de bain : couleurs, textiles, luminaires et tendances venues des réseaux. Son fil rouge : te dire si une idée tient ses promesses dans un vrai logement, au-delà de la jolie photo.",
    bio: [
      "Felana RABARIVELO est spécialiste déco, ambiance et salle de bain chez Best Home Project. Associer les couleurs, choisir un luminaire, habiller une pièce sans se ruiner, repenser une salle de bain : son terrain de jeu, c'est tout ce qui donne du caractère à un intérieur. L'esthétique et le soin au quotidien font aussi partie de ses centres d'intérêt, d'où un œil particulier pour la salle de bain.",
      "Elle s'intéresse aussi à la façon dont Instagram et TikTok font et défont les tendances déco, et à celles qui valent vraiment le coup une fois chez toi. Son angle : le vécu avant la photo de magazine, avec une question qui revient toujours — est-ce que ça marche dans un vrai salon, avec de vrais meubles et un vrai budget ?",
      "Tu peux suivre Felana sur Instagram, TikTok, Facebook et LinkedIn.",
    ],
    expertise: [
      "Déco et ambiance",
      "Salle de bain",
      "Couleurs, textiles et luminaires",
      "Tendances des réseaux sociaux (Instagram, TikTok)",
    ],
    socials: [
      { label: "Instagram", url: "https://www.instagram.com/rabaryvelo", icon: "instagram" },
      { label: "TikTok", url: "https://www.tiktok.com/@felana.rabaryvelo", icon: "tiktok" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/felana-rabarivelo-46b324145/", icon: "linkedin" },
      { label: "Facebook", url: "https://www.facebook.com/felana.rabaryvelo", icon: "facebook" },
    ],
  },
  {
    slug: "andee-rakotovao",
    name: "Andee RAKOTOVAO",
    initials: "AR",
    role: "Spécialiste design, aménagement & éclairage",
    image: "/authors/andee-rakotovao.jpg",
    shortBio:
      "Andee RAKOTOVAO couvre pour Best Home Project l'aménagement, le rangement, l'éclairage et les finitions : peinture, sols et murs. Avec un œil de designer, Andee juge chaque idée sur ce qui compte vraiment : que la pièce soit belle, mais surtout qu'elle fonctionne au quotidien.",
    bio: [
      "Andee RAKOTOVAO est spécialiste design, aménagement et éclairage chez Best Home Project. Design, graphisme, photographie : ces centres d'intérêt ont un point commun avec la maison, c'est une affaire de proportions, de lumière et de détails.",
      "Sur le site, Andee s'occupe de l'aménagement et du rangement (petites surfaces, entrées, coins bureau), ainsi que de la peinture, des sols et des murs, avec les critères qui comptent quand on veut un résultat net : bien préparer le support, choisir la bonne finition, penser la lumière. Les « avant/après » truqués et les astuces de magazine sans mode d'emploi n'ont qu'à bien se tenir.",
      "Tu peux suivre Andee sur Instagram, TikTok, LinkedIn et Facebook.",
    ],
    expertise: [
      "Design et graphisme",
      "Aménagement et rangement",
      "Peinture, sols et murs (finitions)",
      "Éclairage",
      "Photographie",
    ],
    socials: [
      { label: "Instagram", url: "https://www.instagram.com/the_wndrfl_mnstr/", icon: "instagram" },
      { label: "TikTok", url: "https://www.tiktok.com/@wndrfl_mnstr", icon: "tiktok" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/andee-rakotovao", icon: "linkedin" },
      { label: "Facebook", url: "https://www.facebook.com/andee.rakut", icon: "facebook" },
    ],
  },
  {
    slug: "mialy-andriaharisoa",
    name: "Mialy ANDRIAHARISOA",
    initials: "MA",
    role: "Spécialiste famille, cuisine & électroménager",
    image: "/authors/mialy-andriaharisoa.jpg",
    shortBio:
      "Mialy ANDRIAHARISOA couvre pour Best Home Project la maison en famille : chambre d'enfant, sécurité des petits, cuisine et électroménager, et même un peu de couture pour la maison. Son critère : un équipement doit faire gagner du temps à la maison, pas en faire perdre.",
    bio: [
      "Mialy ANDRIAHARISOA est spécialiste famille, cuisine et électroménager chez Best Home Project. Maman et enfant, couture, cuisine : ses sujets de prédilection se vivent à la maison, là où la famille passe le plus clair de son temps.",
      "Chambre d'enfant qui évolue avec l'âge, maison sécurisée pour les petits, robots de cuisine, aspirateurs, réfrigérateurs, rideaux et coussins cousus main : Mialy passe chaque sujet au filtre d'une question simple. Est-ce que ça facilite vraiment la vie d'une famille, ou est-ce un truc de plus à ranger ?",
      "Tu peux suivre Mialy sur Facebook, TikTok et LinkedIn.",
    ],
    expertise: [
      "Maison en famille (chambre d'enfant, sécurité des petits)",
      "Cuisine et électroménager",
      "Couture pour la maison",
      "Organisation du quotidien",
    ],
    socials: [
      { label: "Facebook", url: "https://www.facebook.com/mialiniaina.andria.92", icon: "facebook" },
      { label: "TikTok", url: "https://www.tiktok.com/@miiiiaaaaly", icon: "tiktok" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/mialy-andriaharisoa/", icon: "linkedin" },
    ],
  },
  {
    slug: "nekena-judicael",
    name: "Nekena JUDICAËL",
    initials: "NJ",
    role: "Spécialiste budget, outillage & actu maison",
    image: "/authors/nekena-judicael.jpg",
    shortBio:
      "Nekena JUDICAËL suit pour Best Home Project le budget des travaux, les aides à la rénovation, les économies d'énergie, l'outillage et l'actualité de la maison. Son rôle : t'expliquer ce que chaque règle, chaque aide ou chaque nouveauté change vraiment pour ton portefeuille, sans recopier les communiqués.",
    bio: [
      "Nekena JUDICAËL est spécialiste budget, outillage et actualité de la maison chez Best Home Project. Sa rubrique de prédilection : Actu & Aides, des dispositifs de soutien à la rénovation aux nouvelles normes, en passant par les nouveautés qui arrivent en magasin. Il s'intéresse au business et aux stratégies des entreprises, un réflexe utile pour lire un devis ou comparer deux offres.",
      "Nekena couvre aussi les économies d'énergie (isolation, chauffage, consommation) et l'outillage : perceuses, visseuses, ponceuses et compagnie. Le fil rouge : relier chaque nouveauté ou chaque achat à ce qu'il change concrètement pour ton budget.",
      "Tu peux suivre Nekena sur LinkedIn et Facebook.",
    ],
    expertise: [
      "Aides à la rénovation et budget travaux",
      "Lecture de devis",
      "Énergie et économies",
      "Outillage et équipement",
      "Actualité et nouveautés de la maison",
    ],
    socials: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/nekena-judica%C3%ABl-8916802ba/", icon: "linkedin" },
      { label: "Facebook", url: "https://www.facebook.com/nekenajudi", icon: "facebook" },
    ],
  },
  {
    slug: "dina-rakotoarivelo",
    name: "Dina RAKOTOARIVELO",
    initials: "DR",
    role: "Spécialiste outils numériques & sites web",
    image: "/authors/dina-rakotoarivelo.jpg",
    shortBio:
      "Dina RAKOTOARIVELO couvre pour Best Home Project les outils numériques du projet maison : applis de plan 3D, simulateurs, comparateurs de devis, plateformes d'artisans, et la création de sites avec WordPress. Chaque guide vise un outil que tu sais utiliser seul, sans passer par trois agences.",
    bio: [
      "Dina RAKOTOARIVELO est spécialiste WordPress et intégration HTML/CSS, et couvre chez Best Home Project les outils numériques qui facilitent un projet de maison : applis de plan et de visualisation 3D, simulateurs de budget ou de peinture, plateformes de mise en relation avec des artisans.",
      "Elle traduit le jargon du web en gestes concrets : comprendre ce que fait une appli, un simulateur ou un comparateur de devis, et savoir si tu peux lui faire confiance. Pour les artisans et les passionnés qui veulent leur propre site, elle explique aussi comment le créer avec WordPress, proprement et sans jargon.",
      "Tu peux suivre Dina sur LinkedIn et Facebook.",
    ],
    expertise: [
      "Applis de plan et de visualisation 3D",
      "Simulateurs et comparateurs en ligne",
      "WordPress (thèmes et plugins)",
      "Intégration HTML et CSS",
      "Création de sites web",
    ],
    socials: [
      { label: "LinkedIn", url: "https://www.linkedin.com/in/dina-henintsoa-rakotoarivelo", icon: "linkedin" },
      { label: "Facebook", url: "https://www.facebook.com/share/1EkxXgJAtC/", icon: "facebook" },
    ],
  },
];

export const DEFAULT_AUTHOR_SLUG = "andrianina-rabarivelo";

export function getAuthor(slug: string | undefined): Author | undefined {
  return AUTHORS.find((a) => a.slug === slug);
}

/**
 * Auteur d'un article : le slug du frontmatter s'il est connu, sinon le
 * rédacteur en chef. Accepte aussi le nom complet (« Andrianina
 * Rabarivelo ») pour tolérer un frontmatter écrit à la main.
 */
export function resolveAuthor(value: string | undefined): Author {
  const bySlug = getAuthor(value);
  if (bySlug) return bySlug;
  const byName = AUTHORS.find((a) => a.name.toLowerCase() === value?.trim().toLowerCase());
  return byName ?? (getAuthor(DEFAULT_AUTHOR_SLUG) as Author);
}

export function authorUrl(author: Author) {
  return `/auteur/${author.slug}/`;
}

/** Sous-catégories dont l'auteur est titulaire (lib/auteurs-specialites.json). */
export function authorSubcategories(author: Author): { section: Section; sub: Subcategory }[] {
  const categories = REGLES.categories as Record<string, string>;
  return ALL_SUBCATEGORIES.filter(({ sub }) => categories[sub.slug] === author.slug);
}
