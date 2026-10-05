import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { getPostsByCategory } from "@/lib/posts";
import {
  ALL_SUBCATEGORIES,
  getSection,
  sectionUrl,
  subcategoryUrl,
} from "@/lib/categories";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Page de sous-catégorie : /<rubrique>/<sous-categorie>/ (ex.
// /guides-tutos/peinture-sols-murs/). Tant qu'elle ne contient aucun article, elle
// est servie en noindex (évite d'exposer à Google des pages vides — risque
// « thin content ») et n'apparaît pas dans le sitemap (app/sitemap.ts).

// Génère les deux segments d'un coup ({ slug, sub }) : le
// generateStaticParams du segment parent est défini dans une page (pas un
// layout), Next.js ne le transmet donc pas ici.
export function generateStaticParams() {
  return ALL_SUBCATEGORIES.map(({ section, sub }) => ({ slug: section.slug, sub: sub.slug }));
}

function resolve(slug: string, subSlug: string) {
  const section = getSection(slug);
  const sub = section?.subcategories.find((s) => s.slug === subSlug);
  return section && sub ? { section, sub } : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; sub: string }>;
}): Promise<Metadata> {
  const { slug, sub: subSlug } = await params;
  const entry = resolve(slug, subSlug);
  if (!entry) return {};
  const { section, sub } = entry;
  const hasPosts = getPostsByCategory(sub.slug).length > 0;
  return {
    title: `${sub.title} — ${section.title}`,
    description: sub.body,
    alternates: { canonical: subcategoryUrl(section, sub) },
    robots: hasPosts ? undefined : { index: false, follow: true },
    openGraph: {
      title: sub.title,
      description: sub.body,
      url: `${SITE_URL}${subcategoryUrl(section, sub)}`,
      images: [{ url: `/covers/${sub.slug}.png`, width: 1200, height: 630, alt: sub.title }],
    },
  };
}

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ slug: string; sub: string }>;
}) {
  const { slug, sub: subSlug } = await params;
  const entry = resolve(slug, subSlug);
  if (!entry) notFound();
  const { section, sub } = entry;
  const posts = getPostsByCategory(sub.slug);
  const siblings = section.subcategories.filter((s) => s.slug !== sub.slug);

  return (
    <div className="container hub">
      <Breadcrumbs
        items={[
          { name: "Accueil", href: "/" },
          { name: section.title, href: sectionUrl(section) },
          { name: sub.title, href: subcategoryUrl(section, sub) },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: sub.title,
          description: sub.body,
          url: `${SITE_URL}${subcategoryUrl(section, sub)}`,
          isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
        }}
      />
      <header className="hub-header">
        <span className="icon-tile">
          <Icon name={sub.icon} size={26} />
        </span>
        <h1>{sub.title}</h1>
        <p className="lead">{sub.body}</p>
      </header>

      <section className="hub-section">
        {posts.length === 0 ? (
          <p className="empty-state">Les premiers articles de ce thème arrivent très vite. Repasse bientôt !</p>
        ) : (
          <div className="article-grid">
            {posts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>

      <section className="hub-section">
        <h2>Dans la rubrique {section.title}</h2>
        <div className="hub-chips">
          {siblings.map((s) => (
            <a key={s.slug} href={subcategoryUrl(section, s)}>
              <Icon name={s.icon} size={16} />
              <span>{s.title}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
