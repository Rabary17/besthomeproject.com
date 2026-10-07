import { COMPANY, COMPANY_PHONE_HREF } from "@/lib/site";

// Coordonnées de l'éditeur (Anmira Studio) : adresse, téléphone, horaires.
// Source unique : COMPANY dans lib/site.ts. Utilisé sur /contact/ et
// /a-propos/ ; les mentions légales ont leur propre mise en page.
export default function CompanyDetails() {
  const { adresse } = COMPANY;
  return (
    <div className="card company-card">
      <p className="company-card__name">{COMPANY.nom}</p>
      <address>
        {adresse.rue}, {adresse.ville} {adresse.codePostal}
        <br />
        {adresse.pays}
        <br />
        <a href={COMPANY_PHONE_HREF}>{COMPANY.telephone}</a>
      </address>
      <div>
        <p className="company-card__label">Horaires d&apos;ouverture</p>
        <dl className="company-card__hours">
          {COMPANY.horaires.map((h) => (
            <div key={h.jours}>
              <dt>{h.jours}</dt>
              <dd>{h.horaires}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
