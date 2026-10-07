import type { Metadata } from "next";
import { SITE_NAME, ZOHO_WEBFORM, COMPANY } from "@/lib/site";
import CompanyDetails from "@/components/CompanyDetails";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contacter l'équipe ${SITE_NAME}.`,
  alternates: { canonical: "/contact/" },
};

// Formulaire 100% statique : POST direct vers Zoho CRM (Web-to-Lead),
// aucun backend/serverless requis — compatible avec l'export statique
// (next.config.ts, output: "export"). Chaque soumission crée un prospect
// dans le module Prospects (Leads) du CRM Zoho. Le formulaire dédié
// « Prospect Best Home Project » reste À CRÉER dans Zoho (marche à suivre
// dans lib/site.ts) : tant que ZOHO_WEBFORM contient des « TODO », cette
// page affiche un message d'attente à la place du formulaire. Les valeurs
// cachées viennent du code généré par Zoho et vivent dans ZOHO_WEBFORM
// (lib/site.ts) : ne pas les modifier, Zoho prévient que le formulaire
// cesse de marcher sinon. Les
// attributs `name` visibles (Last Name, Email, Description) sont les noms
// d'API du formulaire Zoho. Anti-spam : champ-piège « honeypot » de Zoho
// (caché, doit rester vide) ; pas de captcha pour l'instant.
export default function ContactPage() {
  const formConfigured =
    !ZOHO_WEBFORM.xnQsjsdp.startsWith("TODO") &&
    !ZOHO_WEBFORM.xmIwtLD.startsWith("TODO") &&
    !ZOHO_WEBFORM.actionType.startsWith("TODO");

  return (
    <div className="page">
      <h1>Contact</h1>
      <p>
        Une question, une coquille à signaler, un sujet à proposer ? Écris-nous
        via le formulaire ci-dessous : on lit tout, et on te répond à
        l&apos;adresse que tu indiques.
      </p>

      {!formConfigured && (
        <p className="empty-state">
          Le formulaire de contact arrive très bientôt. En attendant, tu peux
          nous joindre par téléphone aux horaires indiqués plus bas.
        </p>
      )}

      {formConfigured && (
      <form method="POST" action={ZOHO_WEBFORM.actionUrl} acceptCharset="UTF-8" className="contact-form">
        {/* Champs requis par Zoho CRM — ne pas renommer ni retirer. */}
        <input type="hidden" name="xnQsjsdp" value={ZOHO_WEBFORM.xnQsjsdp} />
        <input type="hidden" name="xmIwtLD" value={ZOHO_WEBFORM.xmIwtLD} />
        <input type="hidden" name="actionType" value={ZOHO_WEBFORM.actionType} />
        <input type="hidden" name="returnURL" value={ZOHO_WEBFORM.returnUrl} />
        <input type="hidden" name="zc_gad" id="zc_gad" value="" />
        {/* Champ-piège anti-spam de Zoho : invisible, jamais rempli par un humain. */}
        <input
          type="text"
          name={ZOHO_WEBFORM.honeypot}
          defaultValue=""
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ display: "none" }}
        />

        <label htmlFor="lastName">Nom</label>
        <input type="text" id="lastName" name="Last Name" autoComplete="name" maxLength={80} required />

        <label htmlFor="email">Email</label>
        <input type="email" id="email" name="Email" autoComplete="email" maxLength={100} required />

        <label htmlFor="message">Message</label>
        <textarea id="message" name="Description" rows={6} required />

        <button type="submit" className="btn btn--primary">
          Envoyer
        </button>
        <p className="contact-form__note">
          En envoyant ce message, tu acceptes que ton nom et ton adresse soient
          utilisés uniquement pour te répondre. Détails dans la{" "}
          <a href="/confidentialite/">politique de confidentialité</a>.
        </p>
      </form>
      )}

      <h2>Coordonnées de l&apos;éditeur</h2>
      <p>
        {SITE_NAME} est édité par {COMPANY.nom}, à Antananarivo (Madagascar).
        Tu peux aussi nous joindre par téléphone aux horaires ci-dessous.
      </p>
      <CompanyDetails />
    </div>
  );
}
