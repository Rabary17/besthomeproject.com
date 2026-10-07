// JSON-LD structuré (schema.org) — même logique que lib/schema.ts sur
// monauto/Techcars : chaque page injecte le schéma pertinent via le
// composant <JsonLd>. C'est ce qui alimente le GEO (Generative Engine
// Optimization) autant que le SEO classique — les moteurs génératifs
// s'appuient fortement sur ces données structurées.
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, SOCIAL_LINKS, COMPANY } from "./site";
import { resolveCoverImage, type Post } from "./posts";
import { resolveAuthor, authorUrl, type Author } from "./authors";
import { resolveCategory } from "./categories";

/**
 * Entité `Person` d'un auteur — `sameAs` relie la personne à ses profils
 * externes (LinkedIn, X, YouTube...), ce qui permet à Google et aux
 * moteurs génératifs de la reconnaître comme une entité réelle et
 * vérifiable (signal E-E-A-T « Experience/Expertise »).
 */
export function personSchema(author: Author) {
  return {
    "@type": "Person",
    "@id": `${SITE_URL}${authorUrl(author)}#person`,
    name: author.name,
    url: `${SITE_URL}${authorUrl(author)}`,
    jobTitle: author.role,
    ...(author.image ? { image: `${SITE_URL}${author.image}` } : {}),
    description: author.shortBio,
    knowsAbout: author.expertise,
    worksFor: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    sameAs: author.socials.map((s) => s.url),
  };
}

/** Page auteur : ProfilePage dont l'entité principale est la Person. */
export function profilePageSchema(author: Author) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: `${SITE_URL}${authorUrl(author)}`,
    mainEntity: personSchema(author),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };
}

/**
 * Société éditrice (Anmira Studio) : rattachée au média via
 * `parentOrganization`. Le NIF alimente `taxID` seulement quand il est
 * renseigné ; le STAT (identifiant statistique) n'a pas d'équivalent
 * schema.org et reste sur les mentions légales.
 */
export function companySchema() {
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

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    parentOrganization: companySchema(),
    // `sameAs` : signal E-E-A-T reconnu par Google — relie l'entité du site
    // à une présence externe vérifiable (voir décision du 2026-09-30).
    // Remplacer par les vrais profils dans lib/site.ts avant publication.
    ...(SOCIAL_LINKS.length > 0 ? { sameAs: SOCIAL_LINKS.map((s) => s.url) } : {}),
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

export function blogPostingSchema(post: Post) {
  const cover = resolveCoverImage(post);
  const author = resolveAuthor(post.author);
  const category = resolveCategory(post.category);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: `${SITE_URL}${cover.src}`,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    ...(category ? { articleSection: category.sub?.title ?? category.section.title } : {}),
    author: personSchema(author),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      parentOrganization: companySchema(),
      logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon-192x192.png` },
    },
    mainEntityOfPage: `${SITE_URL}/${post.slug}/`,
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
