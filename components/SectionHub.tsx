import Icon from "@/components/Icon";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { getPostsByCategory } from "@/lib/posts";
import { sectionUrl, subcategoryUrl, type Section } from "@/lib/categories";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// Page hub d'une rubrique (/<rubrique>/) : présentation, sous-catégories,
// derniers articles de la rubrique.
export default function SectionHub({ section }: { section: Section }) {
  const posts = getPostsByCategory(section.slug);
  return (
    <div className="container hub">
      <Breadcrumbs
        items={[
          { name: "Accueil", href: "/" },
          { name: section.title, href: sectionUrl(section) },
        ]}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: section.title,
          description: section.description,
          url: `${SITE_URL}${sectionUrl(section)}`,
          isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
        }}
      />
      <header className="hub-header">
        <span className="icon-tile">
          <Icon name={section.icon} size={26} />
        </span>
        <h1>{section.title}</h1>
        <p className="lead">{section.body}</p>
      </header>

      <section className="hub-section">
        <h2>Les thèmes de la rubrique</h2>
        <div className="subcategory-grid">
          {section.subcategories.map((sub) => {
            const count = getPostsByCategory(sub.slug).length;
            return (
              <a className="card subcategory-card" key={sub.slug} href={subcategoryUrl(section, sub)}>
                <span className="icon-tile">
                  <Icon name={sub.icon} size={22} />
                </span>
                <span className="subcategory-card__title">{sub.title}</span>
                <span className="subcategory-card__body">{sub.body}</span>
                <span className="card__meta">
                  {count === 0 ? "Bientôt" : `${count} article${count > 1 ? "s" : ""}`}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="hub-section">
        <h2>Derniers articles</h2>
        {posts.length === 0 ? (
          <p className="empty-state">Les premiers articles de cette rubrique arrivent très vite. Repasse bientôt !</p>
        ) : (
          <div className="article-grid">
            {posts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
