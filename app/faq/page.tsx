import type { Metadata } from "next";
import { SITE_NAME, COMPANY } from "@/lib/site";
import JsonLd from "@/components/JsonLd";
import { faqSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "FAQ",
  description: `Questions fréquentes sur ${SITE_NAME} : qui écrit, à quel rythme, liens affiliés, comment nous contacter.`,
  alternates: { canonical: "/faq/" },
};

// Page FAQ : complète /a-propos/ côté E-E-A-T (qui/pourquoi) en couvrant les
// questions pratiques (fréquence, indépendance, contact) — le JSON-LD
// FAQPage (lib/schema.ts) aide aussi les moteurs génératifs (GEO) à extraire
// des réponses directement. TODO : ajuster les réponses une fois la vraie
// ligne éditoriale/fréquence de publication stabilisée (voir /a-propos/).
const questions = [
  {
    question: `Qui écrit les articles de ${SITE_NAME} ?`,
    answer: `Chaque article est signé par le spécialiste du sujet — déco et salle de bain, design et aménagement, famille et cuisine, budget et outillage, outils numériques et sites web — et publié sous la responsabilité d'Andrianina RABARIVELO, rédacteur en chef de ${SITE_NAME}, qui fixe la ligne éditoriale et relit chaque article avant publication. Toute l'équipe est présentée dans la section « La rédaction » de la page À propos.`,
  },
  {
    question: `Qui est derrière ${SITE_NAME} ?`,
    answer: `${SITE_NAME} est édité par ${COMPANY.nom}, une entreprise basée à ${COMPANY.adresse.ville}, à ${COMPANY.adresse.pays}. Les coordonnées complètes et le directeur de la publication figurent dans les mentions légales.`,
  },
  {
    question: "À quelle fréquence publiez-vous ?",
    answer:
      "Ça dépend de l'actu et du temps qu'il faut pour vérifier chaque article. Une règle : on préfère publier juste que publier vite.",
  },
  {
    question: `${SITE_NAME} est-il indépendant ?`,
    answer:
      "Oui. Aucun annonceur ni partenaire commercial ne dicte ce qu'on écrit. Si un contenu sponsorisé devait un jour être publié, il serait clairement signalé comme tel — pas déguisé en article.",
  },
  {
    question: "Les comparatifs contiennent-ils des liens affiliés ?",
    answer:
      "Certains guides d'achat peuvent contenir des liens d'affiliation : si tu achètes un produit via l'un de ces liens, le site peut toucher une commission, sans surcoût pour toi. Ces liens sont signalés comme tels et n'influencent ni le choix des produits ni leur classement — un produit décevant reste décevant, commission ou pas.",
  },
  {
    question: "Peut-on tout faire soi-même ?",
    answer:
      "Non, et on le dit. Pour le tableau électrique, le gaz ou tout ce qui touche à la structure du logement, nos guides indiquent quand faire appel à un professionnel : une économie qui tourne mal coûte presque toujours plus cher que le devis d'un artisan.",
  },
  {
    question: "Comment signaler une erreur ?",
    answer: `Écris-nous via le formulaire de la page Contact, ou appelle-nous aux horaires indiqués. Chaque signalement est lu, et l'article est corrigé si besoin.`,
  },
];

export default function FaqPage() {
  return (
    <div className="page">
      <JsonLd data={faqSchema(questions)} />
      <h1>Questions fréquentes</h1>
      <div>
        {questions.map((q) => (
          <section key={q.question} style={{ marginTop: "1.5rem" }}>
            <h2>{q.question}</h2>
            <p>{q.answer}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
