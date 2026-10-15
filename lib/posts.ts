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
import { choisirAuteur, resolveAuthor } from "./authors";
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
  // Slug d'un auteur de lib/authors.ts. Sans valeur, l'auteur est choisi
  // automatiquement selon la spécialité (voir choisirAuteur).
  author?: string;
  tags?: string[];
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

export type PostFaq = { question: string; answer: string };

export type Post = PostFrontmatter & {
  contentHtml: string;
  // Questions/réponses de la section « Questions fréquentes » (H2) : un H3
  // suivi d'un paragraphe. Sert au JSON-LD FAQPage de la page article.
  faq: PostFaq[];
};

/** Retire le markdown inline d'un texte (gras, italique, code, liens). */
function texteBrut(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|__|`/g, "")
    .replace(/(^|\s)\*([^*]+)\*/g, "$1$2")
    .trim();
}

function faqDepuisMarkdown(content: string): PostFaq[] {
  const faq: PostFaq[] = [];
  let dansFaq = false;
  let question: string | null = null;
  for (const token of marked.lexer(content)) {
    if (token.type === "heading" && token.depth === 2) {
      dansFaq = /questions fréquentes/i.test(token.text);
      question = null;
      continue;
    }
    if (!dansFaq) continue;
    if (token.type === "heading" && token.depth === 3) {
      question = texteBrut(token.text);
      continue;
    }
    if (token.type === "paragraph" && question) {
      faq.push({ question, answer: texteBrut(token.text) });
      question = null;
    }
  }
  return faq;
}

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
    author: fm.author ?? choisirAuteur(fm),
    slug,
    contentHtml: marked.parse(content, { async: false }) as string,
    faq: faqDepuisMarkdown(content),
  };
}

/** Date du jour au fuseau du site (Madagascar), au format "AAAA-MM-JJ". */
function aujourdhuiSite(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Indian/Antananarivo" }).format(new Date());
}

/**
 * Un article est publié quand sa date est arrivée. Les articles à date future
 * restent versionnés dans content/posts/ mais sont masqués partout : listes,
 * rubriques, pages auteur, sitemap et pages article. Le déploiement quotidien
 * (.github/workflows/publication-programmee.yml) les rend visibles le jour J.
 */
export function estPublie(post: { date: string }): boolean {
  return String(post.date).slice(0, 10) <= aujourdhuiSite();
}

/** Tous les articles publiés, triés du plus récent au plus ancien. */
export function getAllPosts(): Post[] {
  return readSlugs()
    .map(readPost)
    .filter(estPublie)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Un article publié, par son slug (undefined si absent ou à venir). */
export function getPostBySlug(slug: string): Post | undefined {
  if (!readSlugs().includes(slug)) return undefined;
  const post = readPost(slug);
  return estPublie(post) ? post : undefined;
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

/** Slugs des articles publiés — pour generateStaticParams (export statique). */
export function getAllSlugs(): string[] {
  return readSlugs().filter((slug) => estPublie(readPost(slug)));
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
