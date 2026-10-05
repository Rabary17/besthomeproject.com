import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Message envoyé",
  description: `Ton message a bien été transmis à l'équipe ${SITE_NAME}.`,
  alternates: { canonical: "/contact/merci/" },
  robots: { index: false, follow: true },
};

// Page affichée après l'envoi du formulaire de contact : c'est la
// `returnURL` du formulaire Zoho Web-to-Lead (ZOHO_WEBFORM.returnUrl dans
// lib/site.ts). noindex : elle n'a aucune raison d'apparaître dans Google.
export default function MerciPage() {
  return (
    <div className="page">
      <h1>Message envoyé</h1>
      <p>
        Merci, ton message est bien arrivé. On le lit et on te répond à
        l&apos;adresse que tu as indiquée.
      </p>
      <p>
        En attendant, retourne à <a href="/">l&apos;accueil</a> ou explore les{" "}
        <a href="/guides-tutos/">guides et tutos</a>.
      </p>
    </div>
  );
}
