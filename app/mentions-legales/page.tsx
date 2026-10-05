import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, LEGAL, COMPANY, COMPANY_PHONE_HREF } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: `Mentions légales de ${SITE_NAME}.`,
  alternates: { canonical: "/mentions-legales/" },
  robots: { index: false, follow: true },
};

// Identité de l'éditeur (Anmira Studio) et de l'hébergeur — chaque champ
// vient de lib/site.ts (COMPANY, LEGAL), rien n'est inventé ici. La forme
// juridique n'a pas été communiquée : pas de ligne « Statut ». NIF et STAT
// n'apparaissent que lorsqu'ils sont renseignés dans COMPANY.
export default function MentionsLegalesPage() {
  return (
    <div className="page">
      <h1>Mentions légales</h1>

      <h2>Éditeur du site</h2>
      <p>
        {SITE_NAME} est édité par {LEGAL.editeur_nom}.
      </p>
      <p>
        Raison sociale : {LEGAL.editeur_nom}
        <br />
        Adresse : {LEGAL.editeur_adresse}
        <br />
        Téléphone : <a href={COMPANY_PHONE_HREF}>{LEGAL.editeur_telephone}</a>
        {COMPANY.nif && (
          <>
            <br />
            NIF : {COMPANY.nif}
          </>
        )}
        {COMPANY.stat && (
          <>
            <br />
            STAT : {COMPANY.stat}
          </>
        )}
        <br />
        Directeur de la publication : {LEGAL.directeur_publication}
      </p>

      <h2>Hébergement</h2>
      <p>
        {LEGAL.hebergeur_nom}
        <br />
        {LEGAL.hebergeur_adresse}
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des contenus publiés sur {SITE_URL} (textes, images,
        mises en page) est la propriété de {LEGAL.editeur_nom} et protégé par
        le droit d&apos;auteur. Toute
        reproduction sans autorisation préalable est interdite, sauf
        courtes citations avec mention de la source.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question relative à ces mentions légales, voir la page{" "}
        <a href="/contact/">contact</a>.
      </p>
    </div>
  );
}
