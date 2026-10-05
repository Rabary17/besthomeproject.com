import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { SITE_URL } from "@/lib/site";

// Fil d'Ariane visible + son équivalent JSON-LD (BreadcrumbList) — les
// deux restent ainsi toujours synchronisés. `href` relatif ("/guides-tutos/").
export default function Breadcrumbs({ items }: { items: { name: string; href: string }[] }) {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema(items.map((i) => ({ name: i.name, url: `${SITE_URL}${i.href}` })))}
      />
      <nav className="breadcrumbs" aria-label="Fil d'Ariane">
        <ol>
          {items.map((item, i) => (
            <li key={item.href}>
              {i < items.length - 1 ? (
                <a href={item.href}>{item.name}</a>
              ) : (
                <span aria-current="page">{item.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
