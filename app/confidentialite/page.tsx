import type { Metadata } from "next";
import { SITE_NAME, COMPANY, COMPANY_ADDRESS, COMPANY_PHONE_HREF } from "@/lib/site";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: `Comment ${SITE_NAME} traite les données personnelles.`,
  alternates: { canonical: "/confidentialite/" },
};

// Politique volontairement courte : le site n'a, à ce stade, ni analytics
// ni compte utilisateur — la seule collecte réelle est le formulaire de
// contact (Zoho CRM, voir app/contact/page.tsx). À étoffer si un outil de
// mesure d'audience (Plausible, GA, etc.) est ajouté plus tard.
export default function ConfidentialitePage() {
  return (
    <div className="page">
      <h1>Politique de confidentialité</h1>

      <p>
        {SITE_NAME} accorde de l&apos;importance à la protection de vos
        données personnelles. Cette page explique quelles données sont
        collectées et pourquoi.
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données collectées sur {SITE_NAME}
        est {COMPANY.nom}, éditeur du site : {COMPANY_ADDRESS}. Téléphone :{" "}
        <a href={COMPANY_PHONE_HREF}>{COMPANY.telephone}</a>.
      </p>

      <h2>Formulaire de contact</h2>
      <p>
        Le formulaire de la page <a href="/contact/">contact</a> transmet
        directement vos informations (nom, email, message) au CRM Zoho, où
        elles créent une fiche prospect consultable par l&apos;équipe de{" "}
        {SITE_NAME} ({COMPANY.nom}) dans le seul but de répondre à votre demande (
        <a href="https://www.zoho.com/privacy.html" target="_blank" rel="noreferrer">
          politique de confidentialité de Zoho
        </a>
        ). Une copie du message est aussi transmise par e-mail au rédacteur
        en chef. Ces informations ne sont ni vendues, ni utilisées à des fins
        commerciales tierces. Si vous préférez ne pas utiliser ce formulaire,
        vous pouvez nous joindre par téléphone, aux horaires indiqués sur la
        page <a href="/contact/">contact</a>.
      </p>

      <h2>Mesure d&apos;audience</h2>
      <p>
        {/* TODO : mettre à jour cette section si un outil d'analytics est
            ajouté (nom de l'outil, cookies éventuels, durée de
            conservation). */}
        Ce site n&apos;utilise actuellement aucun outil de mesure
        d&apos;audience ni cookie de suivi publicitaire.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
        rectification et de suppression des données vous concernant.
        Contactez-nous via la page <a href="/contact/">contact</a>, par
        téléphone ou par courrier à l&apos;adresse de {COMPANY.nom} pour
        exercer ces droits.
      </p>
    </div>
  );
}
