import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, COMPANY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Méthodologie",
  description: `Comment ${SITE_NAME} rédige ses guides de construction : sources, réglementation française et contrôles.`,
  alternates: { canonical: "/methodologie/" },
};

// Sources officielles vérifiées (réponse HTTP 200 au moment de la rédaction).
// Légifrance n'est pas listé ici : le site bloque les vérifications automatiques,
// le lien n'a donc pas pu être contrôlé.
const SOURCES_OFFICIELLES = [
  { nom: "Service-Public.fr", url: "https://www.service-public.fr/" },
  { nom: "ANIL, Agence nationale pour l'information sur le logement", url: "https://www.anil.org/" },
];

export default function MethodologiePage() {
  return (
    <div className="page">
      <h1>Méthodologie</h1>
      <p>
        Cette page explique comment {SITE_NAME} rédige ses guides, sur quelles sources ils s'appuient et ce
        qu'ils ne remplacent pas.
      </p>

      <h2>Comment nos guides sont rédigés</h2>
      <p>
        Les guides sont rédigés avec l'aide d'outils d'intelligence artificielle, puis contrôlés avant publication.
        Chaque chiffre, prix, date ou délai doit correspondre à une source citée. Sans source, l'information est
        retirée ou signalée pour vérification. Une relecture vérifie aussi la forme : grammaire, clarté, structure.
      </p>

      <h2>Réglementation française</h2>
      <p>
        Nos guides suivent la réglementation française en vigueur à la date indiquée sur chaque article, notamment
        pour les permis, les garanties de la construction et les démarches administratives. La date de mise à jour
        est affichée sur l'article. Une loi ou un barème qui change peut rendre une information obsolète : signalez-le
        nous si vous constatez une erreur.
      </p>

      <h2>Sources officielles</h2>
      <p>
        Lorsqu'un article s'appuie sur un texte ou un organisme public, le lien vers la source officielle est listé
        sous l'article, dans le bloc « Sources officielles ».
      </p>
      <ul>
        {SOURCES_OFFICIELLES.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.nom}
            </a>
          </li>
        ))}
      </ul>

      <h2>Ce que nos guides ne remplacent pas</h2>
      <p>
        Nos guides aident à préparer un projet. Ils ne remplacent pas l'avis d'un professionnel qualifié (notaire,
        architecte, assureur, bureau d'études), ni une vérification auprès de votre mairie ou de l'administration
        compétente pour votre dossier.
      </p>

      <h2>Éditeur</h2>
      <p>
        {SITE_NAME} est édité par {COMPANY.nom}. Coordonnées et mentions légales sont disponibles sur la page{" "}
        <Link href="/mentions-legales/">mentions légales</Link>.
      </p>
    </div>
  );
}
