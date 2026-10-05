import type { Metadata } from "next";
import { SITE_NAME, COMPANY, COMPANY_PHONE_HREF } from "@/lib/site";
import CompanyDetails from "@/components/CompanyDetails";
import { SECTIONS, sectionUrl } from "@/lib/categories";
import { AUTHORS, DEFAULT_AUTHOR_SLUG, getAuthor, authorUrl, type Author } from "@/lib/authors";
import AuthorBox from "@/components/AuthorBox";

export const metadata: Metadata = {
  title: "À propos",
  description: `Qui est derrière ${SITE_NAME}, notre ligne éditoriale et la rédaction.`,
  alternates: { canonical: "/a-propos/" },
};

// Page E-E-A-T centrale : Google (et un lecteur humain) veut savoir qui
// publie, pourquoi, et selon quels principes.
export default function AboutPage() {
  const editor = getAuthor(DEFAULT_AUTHOR_SLUG) as Author;
  const team = AUTHORS.filter((a) => a.slug !== DEFAULT_AUTHOR_SLUG);
  return (
    <div className="page">
      <h1>À propos de {SITE_NAME}</h1>
      <p>
        {SITE_NAME}, c&apos;est le média maison et bricolage indépendant qui
        répond aux questions que tu te poses vraiment : comment réaliser ce
        chantier, quoi acheter sans te faire avoir, comment aménager ta
        pièce, et quelles aides existent pour tes travaux. Le tout sans
        jargon — et sans baratin.
      </p>

      <h2>Notre ligne éditoriale</h2>
      <p>
        Chaque article part d&apos;une question précise et doit y répondre
        complètement — pas remplir une grille de mots-clés. Un chiffre, une
        caractéristique technique, une affirmation ? C&apos;est vérifié,
        jamais inventé. Quand un produit déçoit ou coûte trop cher pour ce
        qu&apos;il offre, on te le dit. Et une erreur signalée est corrigée
        ouvertement. Sur les sujets à risque (électricité, gaz, structure du
        logement), on te dit clairement quand il vaut mieux appeler un
        professionnel.
      </p>
      <p>Le site tourne autour de quatre rubriques :</p>
      <ul>
        {SECTIONS.map((section) => (
          <li key={section.slug}>
            <a href={sectionUrl(section)}>{section.title}</a> —{" "}
            {section.description}
          </li>
        ))}
      </ul>

      <h2 id="la-redaction">La rédaction</h2>
      <p>
        Aux commandes de la ligne éditoriale : {editor.name},{" "}
        {editor.role.toLowerCase()} de {SITE_NAME}. Son parcours complet est
        sur <a href={authorUrl(editor)}>sa page auteur</a>.
      </p>
      <AuthorBox author={editor} heading="Rédacteur en chef" />
      <p>
        Autour de lui, chaque sujet est confié à la personne dont c&apos;est
        la spécialité — et chaque article est relu par le rédacteur en chef
        avant publication.
      </p>
      {team.map((author) => (
        <AuthorBox key={author.slug} author={author} heading="L'équipe" headingLevel={3} />
      ))}

      <h2 id="editeur">Qui édite {SITE_NAME} ?</h2>
      <p>
        {SITE_NAME} est un média édité par {COMPANY.nom}, une entreprise basée
        à {COMPANY.adresse.ville}, à {COMPANY.adresse.pays}. L&apos;identité
        complète de l&apos;éditeur, le directeur de la publication et
        l&apos;hébergeur figurent dans les{" "}
        <a href="/mentions-legales/">mentions légales</a>.
      </p>
      <CompanyDetails />

      <h2>Nous contacter</h2>
      <p>
        Une question, une coquille à signaler, un sujet à proposer ? Passe par
        la <a href="/contact/">page contact</a>, on lit tout. Tu peux aussi
        appeler {COMPANY.nom} au{" "}
        <a href={COMPANY_PHONE_HREF}>{COMPANY.telephone}</a>, aux horaires
        indiqués ci-dessus.
      </p>
    </div>
  );
}
