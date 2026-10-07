// Source de contenu du blog : fichiers Markdown versionnés dans
// content/posts/*.md, lus au moment du build (export statique — aucun appel
// réseau, aucun CMS). Voir README.md "Ajouter un article" pour la marche à
// suivre : `npm run new-post`, ou copier un fichier existant.
//
// Choix assumé : pas de CMS pour l'instant (cf. décision du 2026-09-30 —
// site sans trafic/stratégie de contenu encore définie). Le jour où un vrai
// back-office éditorial est nécessaire, ce module est le seul point à
// remplacer par un client WordPress/autre CMS — aucune page ne dépend
// directement du système de fichiers ailleurs que dans ce fichier.
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import { resolveCategory, type SubcategorySlug, type SectionSlug } from "./categories";
import { resolveAuthor } from "./authors";
import { SITE_NAME } from "./site";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostFrontmatter = {
  // H1 de l'article (et titre par défaut des métadonnées)
  title: string;
  // Titre SEO (<title>, Open Graph) s'il doit différer du H1 — < 60 caractères
  seoTitle?: string;
  description: string;
  date: string; // format ISO "AAAA-MM-JJ"
  slug: string;
  // Slug d'un auteur de lib/authors.ts — sans valeur, l'article est
  // attribué au rédacteur en chef (voir resolveAuthor).
  author?: string;
  // Sources consultées (affichées sous l'article, signal E-E-A-T) et date
  // de consultation "AAAA-MM-JJ". Exigées par le garde-fou si l'article cite
  // une date postérieure à la coupure du modèle (voir scripts/generation/).
  sources?: { titre: string; url: string }[];
  sourcesConsultees?: string;
  // Date de mise à jour (optionnelle, "AAAA-MM-JJ") — reprise en
  // dateModified dans le JSON-LD et affichée sous le titre.
  updated?: string;
  // Sous-catégorie (voir lib/categories.ts), ex. "peinture-sols-murs" — détermine
  // la rubrique parente, le fil d'Ariane, l'étiquette affichée sur les
  // cartes et, en l'absence d'`image`, l'image à la une de secours (voir
  // resolveCoverImage ci-dessous). Un slug de rubrique est toléré.
  category?: SubcategorySlug | SectionSlug;
  // Image à la une : chemin sous public/ (ex. "/uploads/mon-image.jpg") ou
  // URL absolue. Optionnelle — resolveCoverImage() fournit toujours un
  // visuel de repli quand elle est absente, aucune carte ne reste sans
  // image.
  image?: string;
  imageAlt?: string;
};

export type Post = PostFrontmatter & {
  contentHtml: string;
};

function readSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

function readPost(slug: string): Post {
  const raw = fs.readFileSync(path.join(POSTS_DIR, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);
  const fm = data as Omit<PostFrontmatter, "slug">;
  return {
    ...fm,
    slug,
    contentHtml: marked.parse(content, { async: false }) as string,
  };
}

/** Tous les articles, triés du plus récent au plus ancien. */
export function getAllPosts(): Post[] {
  return readSlugs()
    .map(readPost)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Un article précis par son slug (undefined si absent). */
export function getPostBySlug(slug: string): Post | undefined {
  if (!readSlugs().includes(slug)) return undefined;
  return readPost(slug);
}

/** Articles d'une rubrique (toutes sous-catégories confondues) ou d'une sous-catégorie. */
export function getPostsByCategory(slug: string): Post[] {
  return getAllPosts().filter((post) => {
    const cat = resolveCategory(post.category);
    return cat?.section.slug === slug || cat?.sub?.slug === slug;
  });
}

/** Articles signés par un auteur (slug de lib/authors.ts). */
export function getPostsByAuthor(authorSlug: string): Post[] {
  return getAllPosts().filter((post) => resolveAuthor(post.author).slug === authorSlug);
}

/** Tous les slugs — pour generateStaticParams (export statique). */
export function getAllSlugs(): string[] {
  return readSlugs();
}

/**
 * Image à la une résolue pour un article : la photo fournie en
 * frontmatter si elle existe, sinon la couverture de secours de sa
 * sous-catégorie ou de sa rubrique (public/covers/<slug>.png — voir
 * scripts/generate-covers.js),
 * sinon le visuel générique du site. Toujours une image valide : aucune
 * carte ni page article ne se retrouve sans visuel.
 */
export function resolveCoverImage(
  post: Pick<Post, "image" | "imageAlt" | "category" | "title">
): { src: string; alt: string } {
  if (post.image) {
    return { src: post.image, alt: post.imageAlt || post.title };
  }
  const category = resolveCategory(post.category);
  if (category?.sub) {
    return { src: `/covers/${category.sub.slug}.png`, alt: category.sub.title };
  }
  if (category) {
    return { src: `/covers/${category.section.slug}.png`, alt: category.section.title };
  }
  return { src: "/covers/default.png", alt: SITE_NAME };
}
