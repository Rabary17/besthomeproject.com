import type { Metadata } from "next";
import Icon from "@/components/Icon";
import Breadcrumbs from "@/components/Breadcrumbs";
import { SECTIONS, sectionUrl } from "@/lib/categories";
import { KITS } from "@/lib/kits";

export const metadata: Metadata = {
  title: "Les kits pour ton projet de maison",
  description:
    "Budget, comparaison de devis, choix des entreprises, suivi de chantier, réception : des kits pratiques pour chaque étape de ton projet de maison.",
  alternates: { canonical: "/kits/" },
};

// Page « Kits » : tous les kits du parcours, regroupés par étape (voir
// lib/kits.ts). Les kits non prêts sont affichés « Bientôt ».
export default function KitsPage() {
  return (
    <div className="container hub">
      <Breadcrumbs
        items={[
          { name: "Accueil", href: "/" },
          { name: "Kits", href: "/kits/" },
        ]}
      />
      <header className="hub-header">
        <h1>Les kits pour ton projet de maison</h1>
        <p className="lead">
          Des ressources pratiques (modèles, checklists, trames) pour avancer
          concrètement à chaque étape de ton projet. Elles se préparent
          étape par étape : repasse régulièrement, ou suis le{" "}
          <a href="/parcours/">parcours</a> pour savoir où tu en es.
        </p>
      </header>

      {SECTIONS.map((section) => {
        const kits = KITS.filter((k) => k.section === section.slug);
        if (kits.length === 0) return null;
        return (
          <section className="hub-section" key={section.slug}>
            <h2>
              {section.etape ? `Étape ${section.etape} · ` : ""}
              <a href={sectionUrl(section)}>{section.title}</a>
            </h2>
            <div className="subcategory-grid">
              {kits.map((kit) => {
                const contenu = (
                  <>
                    <span className="icon-tile">
                      <Icon name={section.icon} size={22} />
                    </span>
                    <span className="subcategory-card__title">{kit.titre}</span>
                    <span className="subcategory-card__body">{kit.description}</span>
                    <span className={`kit-badge${kit.disponible ? " kit-badge--ok" : ""}`}>
                      {kit.disponible ? "Disponible" : "Bientôt"}
                    </span>
                  </>
                );
                return kit.disponible && kit.href ? (
                  <a className="card subcategory-card" key={kit.slug} href={kit.href}>
                    {contenu}
                  </a>
                ) : (
                  <div className="card subcategory-card" key={kit.slug}>
                    {contenu}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
