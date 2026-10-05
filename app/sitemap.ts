import type { MetadataRoute } from "next";
import { getAllPosts, getPostsByCategory } from "@/lib/posts";
import { SECTIONS, ALL_SUBCATEGORIES, sectionUrl, subcategoryUrl } from "@/lib/categories";
import { AUTHORS, authorUrl, resolveAuthor } from "@/lib/authors";
import { SITE_URL } from "@/lib/site";

// Généré au build (export statique) en sitemap.xml — pas besoin de
// régénération à la demande tant que la fréquence de publication reste
// faible (rebuild à chaque nouvel article de toute façon, voir README.md).
// `force-static` requis par Next.js 15 en export statique.
// Les sous-catégories sans article sont exclues (elles sont aussi en
// noindex, voir app/[slug]/[sub]/page.tsx).
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    ...SECTIONS.map((section) => ({
      url: `${SITE_URL}${sectionUrl(section)}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    })),
    ...ALL_SUBCATEGORIES.filter(({ sub }) => getPostsByCategory(sub.slug).length > 0).map(
      ({ section, sub }) => ({
        url: `${SITE_URL}${subcategoryUrl(section, sub)}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })
    ),
    ...posts.map((post) => ({
      url: `${SITE_URL}/${post.slug}/`,
      lastModified: post.updated ?? post.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // Auteurs sans article publié : pages en noindex, donc hors sitemap.
    ...AUTHORS.filter((author) => posts.some((post) => resolveAuthor(post.author).slug === author.slug)).map((author) => ({
      url: `${SITE_URL}${authorUrl(author)}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    { url: `${SITE_URL}/a-propos/`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/faq/`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/contact/`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
