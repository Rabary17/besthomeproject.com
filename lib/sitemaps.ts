// Sitemaps séparés façon Yoast SEO : un index (sitemap_index.xml) qui pointe
// vers un sitemap par type de contenu.
//
//   /sitemap_index.xml   → index
//   /post-sitemap.xml    → articles
//   /page-sitemap.xml    → pages (accueil, parcours, kits, à propos, FAQ, contact)
//   /author-sitemap.xml  → auteurs ayant au moins un article publié
//
// Les rubriques et sous-catégories n'ont volontairement PAS de sitemap : ce
// sont des pages de navigation, servies en `noindex, follow` (voir
// app/[slug]/page.tsx et app/[slug]/[sub]/page.tsx). Le site n'a pas de tags.
// Les routes sont en export statique (force-static) : chaque sitemap devient
// un fichier XML dans out/.
import { getAllPosts } from "@/lib/posts";
import { AUTHORS, authorUrl, resolveAuthor } from "@/lib/authors";
import { SITE_URL } from "@/lib/site";

export interface SitemapEntry {
  url: string;
  lastModified?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const lastmod = (d?: string) => (d ? `<lastmod>${esc(d)}</lastmod>` : "");

export const SITEMAPS = [
  { file: "post-sitemap.xml", entries: postEntries },
  { file: "page-sitemap.xml", entries: pageEntries },
  { file: "author-sitemap.xml", entries: authorEntries },
] as const;

export function postEntries(): SitemapEntry[] {
  return getAllPosts().map((post) => ({
    url: `${SITE_URL}/${post.slug}/`,
    lastModified: post.updated ?? post.date,
  }));
}

export function pageEntries(): SitemapEntry[] {
  return ["/", "/parcours/", "/kits/", "/a-propos/", "/faq/", "/contact/"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
}

export function authorEntries(): SitemapEntry[] {
  const posts = getAllPosts();
  return AUTHORS.flatMap((author) => {
    const authored = posts.filter((p) => resolveAuthor(p.author).slug === author.slug);
    // Auteur sans article publié : page en noindex, donc hors sitemap.
    if (authored.length === 0) return [];
    const latest = authored.map((p) => p.updated ?? p.date).sort().at(-1);
    return [{ url: `${SITE_URL}${authorUrl(author)}`, lastModified: latest }];
  });
}

export function urlsetXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((e) => `  <url><loc>${esc(e.url)}</loc>${lastmod(e.lastModified)}</url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function sitemapIndexXml(): string {
  const body = SITEMAPS.map(({ file, entries }) => {
    const dates = entries()
      .map((e) => e.lastModified)
      .filter((d): d is string => Boolean(d))
      .sort();
    return `  <sitemap><loc>${SITE_URL}/${file}</loc>${lastmod(dates.at(-1))}</sitemap>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
