// Injecte un bloc <script type="application/ld+json"> — un composant par
// schéma sur une page (une page article peut cumuler BlogPosting +
// BreadcrumbList, par exemple).
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
