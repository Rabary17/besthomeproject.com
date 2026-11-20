// JSON-LD structuré (schema.org) — même logique que lib/schema.ts sur
// monauto/Techcars : chaque page injecte le schéma pertinent via le
// composant <JsonLd>. C'est ce qui alimente le GEO (Generative Engine
// Optimization) autant que le SEO classique — les moteurs génératifs
// s'appuient fortement sur ces données structurées.
//
// Structure alignée sur un modèle cible (média français établi, nov. 2026) :
// les entités (Organization, WebSite, Person) sont déclarées une fois, avec
// un `@id` stable, puis RÉFÉRENCÉES ailleurs (`{"@id": ...}`) plutôt que
// recopiées intégralement à chaque page — évite la duplication et laisse
// Google relier les pages à une seule et même entité. Même structure que
// techno-play.com (garder synchronisé si ajusté).
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, SOCIAL_LINKS, COMPANY } from "./site";
import { resolveCoverImage, type Post } from "./posts";
import { resolveAuthor, authorUrl, type Author } from "./authors";
import { resolveCategory } from "./categories";

/**
 * Identifiants uniques stables — toutes les pages y renvoient avec le même
 * `@id`, pour que les moteurs reconnaissent une seule et même entité.
 */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Référence légère vers l'organisation (`{"@id": ...}`) — à utiliser partout
 * où l'entité complète est déjà déclarée ailleurs sur la page/le site. */
function organizationRef() {
  return { "@id": ORGANIZATION_ID };
}

/** `cover.src` est tantôt un chemin local (`/covers/...`), tantôt une URL
 * absolue déjà complète (image de couverture issue d'une banque d'images,
 * ex. Unsplash) — ne préfixer par SITE_URL que dans le premier cas, sous
 * peine d'URL cassée du type "https://site.comhttps://images...". */
function urlAbsolue(src: string) {
  return /^https?:\/\//.test(src) ? src : `${SITE_URL}${src}`;
}

/** Identifiant stable de la société éditrice — nœud séparé du `@graph`,
 * référencé par `organizationNode().parentOrganization` via `{"@id": ...}`
 * (modèle cible : jamais de nœud dupliqué/imbriqué, voir lebigdata.fr). */
export const COMPANY_ID = `${SITE_URL}/#editeur`;

/**
 * Société éditrice : rattachée au média via `parentOrganization`. Le NIF
 * alimente `taxID` seulement quand il est renseigné ; le STAT (identifiant
 * statistique) n'a pas d'équivalent schema.org et reste sur les mentions
 * légales.
 */
export function companyNode() {
  const horaires = COMPANY.horaires.flatMap((h) =>
    h.schema
      ? [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: h.schema.jours,
            opens: h.schema.ouvre,
            closes: h.schema.ferme,
          },
        ]
      : []
  );
  return {
    "@type": "Organization",
    "@id": COMPANY_ID,
    name: COMPANY.nom,
    legalName: COMPANY.nom,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.adresse.rue,
      addressLocality: COMPANY.adresse.ville,
      postalCode: COMPANY.adresse.codePostal,
      addressCountry: COMPANY.adresse.codePays,
    },
    telephone: COMPANY.telephone,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: COMPANY.telephone,
      url: `${SITE_URL}/contact/`,
      availableLanguage: ["fr"],
    },
    openingHoursSpecification: horaires,
    ...(COMPANY.nif ? { taxID: COMPANY.nif } : {}),
  };
}

/**
 * Nœud Organization complet (un seul endroit où il est déclaré en entier).
 * `NewsMediaOrganization` en plus d'`Organization` : signal explicite pour
 * Google que ce site est un média d'actualité (éligibilité Google News /
 * Top Stories), conforme à la documentation Google pour les éditeurs.
 */
function organizationNode() {
  return {
    "@type": ["Organization", "NewsMediaOrganization"],
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    logo: {
      "@type": "ImageObject",
      "@id": `${SITE_URL}/#logo`,
      url: `${SITE_URL}/favicon-192x192.png`,
      contentUrl: `${SITE_URL}/favicon-192x192.png`,
      width: 192,
      height: 192,
    },
    // `sameAs` : signal E-E-A-T reconnu par Google — relie l'entité du site
    // à ses profils externes vérifiables (SOCIAL_LINKS dans lib/site.ts).
    // Les profils des auteurs, eux, sont dans le `sameAs` de leur Person
    // (personNode) — jamais ici : `sameAs` désigne la MÊME entité, pas ses
    // membres.
    ...(SOCIAL_LINKS.length > 0 ? { sameAs: SOCIAL_LINKS.map((s) => s.url) } : {}),
    // Page qui explique qui écrit et comment (ligne éditoriale, méthode) —
    // signal attendu des éditeurs de presse par Google.
    publishingPrinciples: `${SITE_URL}/a-propos/`,
    parentOrganization: { "@id": COMPANY_ID },
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: organizationRef(),
  };
}

export function organizationSchema() {
  return { "@context": "https://schema.org", ...organizationNode() };
}

export function websiteSchema() {
  return { "@context": "https://schema.org", ...websiteNode() };
}

/**
 * Organization + WebSite réunis en un seul @graph — utilisé une fois dans
 * app/layout.tsx (remplace les deux <JsonLd> séparés d'avant : même contenu,
 * un seul bloc, plus proche du modèle cible).
 */
export function homepageSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), websiteNode(), companyNode()],
  };
}

/**
 * Nœud Person complet (bio, expertise, photo, profils) — déclaré une seule
 * fois, sur la page auteur (profilePageSchema). Ailleurs (article signé), on
 * y renvoie par `@id` via personRef(), pour ne pas dupliquer la bio sur
 * chaque page.
 */
function personNode(author: Author) {
  const pageUrl = `${SITE_URL}${authorUrl(author)}`;
  const portraitId = `${pageUrl}#portrait`;
  return {
    "@type": "Person",
    "@id": `${pageUrl}#person`,
    name: author.name,
    url: pageUrl,
    jobTitle: author.role,
    description: author.shortBio,
    knowsAbout: author.expertise,
    ...(author.image
      ? {
          image: {
            "@type": "ImageObject",
            "@id": portraitId,
            url: `${SITE_URL}${author.image}`,
            contentUrl: `${SITE_URL}${author.image}`,
          },
        }
      : {}),
    worksFor: organizationRef(),
    sameAs: author.socials.map((s) => s.url),
    mainEntityOfPage: { "@id": pageUrl },
  };
}

/** Référence légère vers un auteur (`@type` + `@id` + `name` + `url`,
 * sans bio) — utilisée dans l'`author` d'un article : la bio complète vit
 * sur la page auteur (personNode), reliée par le même `@id`. */
function personRef(author: Author) {
  const pageUrl = `${SITE_URL}${authorUrl(author)}`;
  return { "@type": "Person", "@id": `${pageUrl}#person`, name: author.name, url: pageUrl };
}

/** Person isolée (avec son propre @context) — conservée pour un usage
 * autonome éventuel, hors @graph d'une page. */
export function personSchema(author: Author) {
  return { "@context": "https://schema.org", ...personNode(author) };
}

/** Page auteur : ProfilePage + Person en deux nœuds distincts d'un même
 * @graph, reliés par `@id` (pas un embed d'un objet dans l'autre). */
export function profilePageSchema(author: Author) {
  const pageUrl = `${SITE_URL}${authorUrl(author)}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": pageUrl,
        url: pageUrl,
        name: author.name,
        isPartOf: { "@id": WEBSITE_ID },
        mainEntity: { "@id": `${pageUrl}#person` },
        ...(author.image ? { primaryImageOfPage: { "@id": `${pageUrl}#portrait` } } : {}),
        inLanguage: "fr-FR",
      },
      personNode(author),
    ],
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/**
 * Article signé — `NewsArticle` (pas `BlogPosting`) : type attendu par
 * Google pour un contenu d'actualité/média, condition de l'éligibilité
 * Google News / Top Stories. `image` en tableau : le modèle cible attend
 * 3 ratios (16:9, 4:3, 1:1) — on n'en a qu'un seul ici (pas de pipeline de
 * recadrage), donc un tableau à une seule entrée plutôt qu'inventer des
 * URLs de recadrage qui n'existent pas.
 */
export function blogPostingSchema(post: Post) {
  const cover = resolveCoverImage(post);
  const author = resolveAuthor(post.author);
  const category = resolveCategory(post.category);
  const pageUrl = `${SITE_URL}/${post.slug}/`;
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${pageUrl}#article`,
    url: pageUrl,
    mainEntityOfPage: { "@id": pageUrl },
    headline: post.title,
    description: post.description,
    image: [urlAbsolue(cover.src)],
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    ...(category ? { articleSection: category.sub?.title ?? category.section.title } : {}),
    author: personRef(author),
    publisher: organizationRef(),
    inLanguage: "fr-FR",
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
