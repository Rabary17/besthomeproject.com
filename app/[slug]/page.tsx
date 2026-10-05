import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllSlugs, getPostBySlug, getPostsByCategory, resolveCoverImage } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";
import {
  SECTIONS,
  getSection,
  resolveCategory,
  sectionUrl,
  subcategoryUrl,
} from "@/lib/categories";
import { resolveAuthor, authorUrl } from "@/lib/authors";
import { formatDate } from "@/lib/format";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import AuthorBox from "@/components/AuthorBox";
import ArticleCard from "@/components/ArticleCard";
import SectionHub from "@/components/SectionHub";
import { blogPostingSchema } from "@/lib/schema";

// Ce segment sert deux types de pages au premier niveau d'URL :
//   - les articles (/<slug-article>/), un par fichier content/posts/*.md ;
//   - les hubs de rubrique (/guides-tutos/, /comparatifs-achats/...), un
//     par entrée de SECTIONS (lib/categories.ts).
// Les sous-catégories vivent un niveau plus bas : app/[slug]/[sub]/.
// Export statique : chaque slug connu au build devient un fichier HTML réel
// (out/<slug>/index.html) — pas de rendu à la demande, voir next.config.ts.
export function generateStaticParams() {
  const postSlugs = getAllSlugs();
  const sectionSlugs = SECTIONS.map((s) => s.slug);
  const clash = postSlugs.filter((slug) => (sectionSlugs as string[]).includes(slug));
  if (clash.length) {
    throw new Error(
      `Slug d'article identique à une rubrique (renommer le fichier) : ${clash.join(", ")}`
    );
  }
  return [...postSlugs, ...sectionSlugs].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const section = getSection(slug);
  if (section) {
    return {
      title: section.title,
      description: section.description,
      alternates: { canonical: sectionUrl(section) },
      openGraph: {
        title: section.title,
        description: section.description,
        url: `${SITE_URL}${sectionUrl(section)}`,
        images: [{ url: `/covers/${section.slug}.png`, width: 1200, height: 630, alt: section.title }],
      },
    };
  }

  const post = getPostBySlug(slug);
  if (!post) return {};
  const url = `${SITE_URL}/${post.slug}/`;
  const author = resolveAuthor(post.author);
  // Image à la une (réelle ou de secours, voir lib/posts.ts) réutilisée
  // pour l'aperçu Open Graph/Twitter — un article partagé sans vignette a
  // beaucoup moins de clics et paraît moins sérieux.
  const cover = resolveCoverImage(post);
  const image = { url: cover.src, width: 1200, height: 630, alt: cover.alt };
  const seoTitle = post.seoTitle || post.title;
  return {
    // seoTitle est calibré < 60 caractères : on n'y ajoute pas « — Best Home Project »
    title: post.seoTitle ? { absolute: post.seoTitle } : post.title,
    description: post.description,
    authors: [{ name: author.name, url: `${SITE_URL}${authorUrl(author)}` }],
    alternates: { canonical: `/${post.slug}/` },
    openGraph: {
      type: "article",
      title: seoTitle,
      description: post.description,
      url,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [`${SITE_URL}${authorUrl(author)}`],
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: post.description,
      images: [image.url],
    },
  };
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const section = getSection(slug);
  if (section) return <SectionHub section={section} />;

  const post = getPostBySlug(slug);
  if (!post) notFound();

  const cover = resolveCoverImage(post);
  const category = resolveCategory(post.category);
  const author = resolveAuthor(post.author);

  const crumbs = [{ name: "Accueil", href: "/" }];
  if (category) {
    crumbs.push({ name: category.section.title, href: sectionUrl(category.section) });
    if (category.sub) {
      crumbs.push({ name: category.sub.title, href: subcategoryUrl(category.section, category.sub) });
    }
  }
  crumbs.push({ name: post.title, href: `/${post.slug}/` });

  // Maillage interne : jusqu'à 3 articles de la même sous-catégorie, puis
  // de la même rubrique.
  const related = category
    ? [
        ...(category.sub ? getPostsByCategory(category.sub.slug) : []),
        ...getPostsByCategory(category.section.slug),
      ]
        .filter((p, i, arr) => p.slug !== post.slug && arr.findIndex((q) => q.slug === p.slug) === i)
        .slice(0, 3)
    : [];

  return (
    <div className="page">
      <Breadcrumbs items={crumbs} />
      <article className="post-content">
        <JsonLd data={blogPostingSchema(post)} />
        {category ? (
          <a
            className="tag"
            href={
              category.sub
                ? subcategoryUrl(category.section, category.sub)
                : sectionUrl(category.section)
            }
          >
            {category.sub?.title ?? category.section.title}
          </a>
        ) : null}
        <h1>{post.title}</h1>
        <p className="post-meta">
          Par <a href={authorUrl(author)}>{author.name}</a>, {author.role.toLowerCase()}
          <span aria-hidden="true"> · </span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.updated && post.updated !== post.date ? (
            <>
              <span aria-hidden="true"> · </span>
              mis à jour le <time dateTime={post.updated}>{formatDate(post.updated)}</time>
            </>
          ) : null}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element -- export
            statique (images.unoptimized dans next.config.ts), un <img>
            simple évite le poids du loader next/image pour rien ici. */}
        <img
          className="post-hero-image"
          src={cover.src}
          alt={cover.alt}
          width={1200}
          height={630}
          fetchPriority="high"
        />
        {/* Contenu Markdown pré-rendu au build (lib/posts.ts) — confiance
            totale dans la source (fichiers du repo), donc pas de risque XSS
            à sanitiser ici comme on le ferait pour du contenu externe/WP. */}
        <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      </article>

      {post.sources && post.sources.length > 0 ? (
        <aside className="post-sources" aria-label="Sources">
          <h2>Sources</h2>
          <ul>
            {post.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.titre}
                </a>
              </li>
            ))}
          </ul>
          {post.sourcesConsultees ? (
            <p>Consultées le {formatDate(post.sourcesConsultees)}.</p>
          ) : null}
        </aside>
      ) : null}

      <AuthorBox author={author} />

      {related.length > 0 ? (
        <section className="related">
          <h2>À lire aussi</h2>
          <div className="article-grid">
            {related.map((p) => (
              <ArticleCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
