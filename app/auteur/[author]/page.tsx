import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { AuthorAvatar, AuthorSocials } from "@/components/AuthorBox";
import { AUTHORS, getAuthor, authorUrl, authorSubcategories } from "@/lib/authors";
import { subcategoryUrl } from "@/lib/categories";
import { getPostsByAuthor } from "@/lib/posts";
import { profilePageSchema } from "@/lib/schema";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Page auteur (/auteur/<slug>/) — page E-E-A-T de référence pour chaque
// signataire : bio complète, expertise, profils vérifiables, articles.
// C'est l'URL vers laquelle pointe `author.url` dans le JSON-LD de chaque
// article (lib/schema.ts).
export function generateStaticParams() {
  return AUTHORS.map((a) => ({ author: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ author: string }>;
}): Promise<Metadata> {
  const { author: slug } = await params;
  const author = getAuthor(slug);
  if (!author) return {};
  // Page sans article = page mince : hors index (et hors sitemap) tant que
  // l'auteur n'a rien publié, comme les sous-catégories vides.
  const hasPosts = getPostsByAuthor(author.slug).length > 0;
  return {
    title: `${author.name}, ${author.role.toLowerCase()}`,
    ...(hasPosts ? {} : { robots: { index: false, follow: true } }),
    description: author.shortBio,
    alternates: { canonical: authorUrl(author) },
    openGraph: {
      type: "profile",
      title: `${author.name} — ${author.role} de ${SITE_NAME}`,
      description: author.shortBio,
      url: `${SITE_URL}${authorUrl(author)}`,
    },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ author: string }>;
}) {
  const { author: slug } = await params;
  const author = getAuthor(slug);
  if (!author) notFound();
  const posts = getPostsByAuthor(author.slug);

  return (
    <div className="page">
      <JsonLd data={profilePageSchema(author)} />
      <Breadcrumbs
        items={[
          { name: "Accueil", href: "/" },
          { name: "À propos", href: "/a-propos/" },
          { name: author.name, href: authorUrl(author) },
        ]}
      />
      <header className="author-header">
        <AuthorAvatar author={author} size={112} />
        <div>
          <h1>{author.name}</h1>
          <p className="author-header__role">
            {author.role} de {SITE_NAME}
          </p>
          <AuthorSocials author={author} />
        </div>
      </header>

      {author.bio.map((paragraph) => (
        <p key={paragraph.slice(0, 32)}>{paragraph}</p>
      ))}

      <h2>Domaines d&apos;expertise</h2>
      <ul>
        {author.expertise.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {authorSubcategories(author).length > 0 && (
        <>
          <h2>Rubriques suivies</h2>
          <ul>
            {authorSubcategories(author).map(({ section, sub }) => (
              <li key={sub.slug}>
                <a href={subcategoryUrl(section, sub)}>{sub.title}</a> ({section.title})
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>Contact</h2>
      <p>
        Une question sur un article, une coquille à signaler, un sujet à
        proposer ? Passe par la <a href="/contact/">page contact</a>, le
        message arrive directement à la rédaction.
      </p>

      <h2>Articles de {author.name}</h2>
      {posts.length === 0 ? (
        <p className="empty-state">Pas encore d&apos;article publié — ça arrive très vite.</p>
      ) : (
        <div className="article-grid">
          {posts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
