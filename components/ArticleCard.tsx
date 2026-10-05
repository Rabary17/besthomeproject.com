import { resolveCoverImage, type Post } from "@/lib/posts";
import { resolveCategory } from "@/lib/categories";
import { resolveAuthor, authorUrl } from "@/lib/authors";
import { formatDate } from "@/lib/format";

// Carte d'article réutilisée par l'accueil, les pages de rubrique /
// sous-catégorie et la page auteur.
export default function ArticleCard({ post }: { post: Post }) {
  const cover = resolveCoverImage(post);
  const category = resolveCategory(post.category);
  const author = resolveAuthor(post.author);
  return (
    <article className="card article-card">
      {/* eslint-disable-next-line @next/next/no-img-element -- export
          statique (images.unoptimized dans next.config.ts), un <img>
          simple évite le poids du loader next/image pour rien ici. */}
      <img
        className="article-card__image"
        src={cover.src}
        alt={cover.alt}
        width={1200}
        height={630}
        loading="lazy"
      />
      <div className="article-card__body">
        {category ? (
          <span className="tag">{category.sub?.title ?? category.section.short}</span>
        ) : null}
        <h3>
          <a href={`/${post.slug}/`}>{post.title}</a>
        </h3>
        <p className="article-card__excerpt">{post.description}</p>
        <div className="article-card__meta">
          <span>
            Par <a href={authorUrl(author)}>{author.name}</a>
          </span>
          <span aria-hidden="true">·</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </div>
    </article>
  );
}
