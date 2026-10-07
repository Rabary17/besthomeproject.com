import type { Metadata } from "next";
import Icon from "@/components/Icon";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SECTIONS, sectionUrl, subcategoryUrl } from "@/lib/categories";
import { KITS } from "@/lib/kits";

export const metadata: Metadata = {
  title: "Le parcours de ton projet de maison, de A à Z",
  description:
    "Du budget et des plans jusqu'à la remise des clés : les étapes d'un projet de construction, puis rénovation, déco et aménagement, avec un guide et un kit pour chacune.",
  alternates: { canonical: "/parcours/" },
};

// Page « Parcours » : la vue d'ensemble du projet, étape par étape (voir
// VISION.md). Les étapes numérotées sont les rubriques qui ont un `etape`.
export default function ParcoursPage() {
  const etapes = SECTIONS.filter((s) => s.etape);
  const apres = SECTIONS.filter((s) => !s.etape);
  return (
    <div className="container hub">
      <Breadcrumbs
        items={[
          { name: "Accueil", href: "/" },
          { name: "Parcours", href: "/parcours/" },
        ]}
      />
      <header className="hub-header">
        <h1>Ton projet de maison, étape par étape</h1>
        <p className="lead">
          Construire une maison, pour toi et ton conjoint, pour ta famille ou
          pour tes parents, ça se prépare. Voici le chemin complet, de la
          première réflexion sur ton budget jusqu&apos;à la remise des clés.
          À chaque étape : des guides pour comprendre, et un kit pour agir.
        </p>
      </header>

      <ol className="parcours-steps">
        {etapes.map((section) => {
          const kits = KITS.filter((k) => k.section === section.slug);
          return (
            <li key={section.slug} className="parcours-step">
              <span className="parcours-step__num" aria-hidden="true">
                {section.etape}
              </span>
              <div className="card parcours-step__card">
                <div className="situation-card__kicker">
                  <span className="icon-tile icon-tile--sm" aria-hidden="true">
                    <Icon name={section.icon} size={18} />
                  </span>
                  <span>Étape {section.etape}</span>
                </div>
                <h2>
                  <a href={sectionUrl(section)}>{section.title}</a>
                </h2>
                <p>{section.body}</p>
                <ul className="situation-card__subs" aria-label={`Thèmes de ${section.title}`}>
                  {section.subcategories.map((sub) => (
                    <li key={sub.slug}>
                      <a href={subcategoryUrl(section, sub)}>{sub.title}</a>
                    </li>
                  ))}
                </ul>
                {kits.length > 0 ? (
                  <p className="parcours-step__kits">
                    <strong>Kits de l&apos;étape :</strong>{" "}
                    {kits.map((k) => k.titre).join(" · ")} (<a href="/kits/">voir les kits</a>)
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <section className="hub-section">
        <h2>Et après la livraison</h2>
        <p className="lead">
          Une maison continue de vivre : on la rénove, on la décore, on
          l&apos;aménage, on l&apos;équipe. Ces rubriques t&apos;accompagnent
          bien au-delà de la remise des clés.
        </p>
        <div className="subcategory-grid">
          {apres.map((section) => (
            <a className="card subcategory-card" key={section.slug} href={sectionUrl(section)}>
              <span className="icon-tile">
                <Icon name={section.icon} size={22} />
              </span>
              <span className="subcategory-card__title">{section.title}</span>
              <span className="subcategory-card__body">{section.description}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
