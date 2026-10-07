// Constantes du site — seule source de vérité pour le nom/l'URL/la
// description, réutilisée par les métadonnées, le JSON-LD et le sitemap.
export const SITE_URL = "https://besthomeproject.com";
export const SITE_NAME = "Best Home Project";
export const SITE_DESCRIPTION =
  "Construis ta maison de A à Z : budget, plans, devis, entreprises, chantier, livraison, puis rénovation, déco et aménagement. Guides et kits pas à pas.";
// Locale par défaut du site (balises lang, Open Graph).
export const SITE_LOCALE = "fr_FR";
export const SITE_LANG = "fr";

// Éditeur du site : Anmira Studio (informations fournies par Andrianina
// le 2026-10-05). Source unique pour
// les mentions légales, la page contact, À propos, la politique de
// confidentialité, le pied de page et le JSON-LD.
// NIF et STAT : à renseigner dès qu'on les a — tant qu'ils sont vides, les
// lignes correspondantes n'apparaissent nulle part (ni page, ni JSON-LD).
export interface Horaire {
  jours: string;
  horaires: string;
  /** Pour le JSON-LD (OpeningHoursSpecification) ; absent = fermé. */
  schema?: { jours: string[]; ouvre: string; ferme: string };
}

export const COMPANY = {
  nom: "Anmira Studio",
  adresse: {
    rue: "Andranomanalina",
    ville: "Antananarivo",
    codePostal: "101",
    pays: "Madagascar",
    codePays: "MG",
  },
  telephone: "+261 34 29 917 88",
  nif: "",
  stat: "",
  horaires: [
    {
      jours: "Lundi au vendredi",
      horaires: "9h00 – 16h00",
      schema: {
        jours: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        ouvre: "09:00",
        ferme: "16:00",
      },
    },
    {
      jours: "Samedi",
      horaires: "8h00 – 12h00",
      schema: { jours: ["Saturday"], ouvre: "08:00", ferme: "12:00" },
    },
    { jours: "Dimanche", horaires: "Fermé" },
  ] as Horaire[],
};

export const COMPANY_ADDRESS = `${COMPANY.adresse.rue}, ${COMPANY.adresse.ville} ${COMPANY.adresse.codePostal}, ${COMPANY.adresse.pays}`;
export const COMPANY_PHONE_HREF = `tel:${COMPANY.telephone.replace(/\s+/g, "")}`;

// Pas d'email public : tout le monde passe par le formulaire de contact, ou
// par téléphone (COMPANY). La copie des messages dans la boîte d'Andrianina
// se règle dans Zoho CRM (règle de workflow sur la création d'un prospect) :
// l'adresse n'a rien à faire dans ce dépôt, qui est public.

// Zoho CRM — formulaire « Web-to-Lead » : POST direct depuis une page
// statique vers Zoho, sans backend — chaque soumission crée un prospect
// (Lead) directement dans le CRM.
//
// À FAIRE avant la mise en ligne : créer un formulaire dédié à ce site.
// Marche à suivre dans Zoho CRM : Configuration (⚙) > Canaux > Formulaires
// web (Webforms) > module Prospects (Leads) > Nouveau formulaire, nommé par
// exemple « Prospect Best Home Project », avec les champs Nom (Last Name),
// E-mail (Email) et Description, une URL de redirection
// https://besthomeproject.com/contact/merci et le « honeypot » activé. Zoho
// génère alors un extrait HTML : en recopier TELS QUELS les trois champs
// cachés (xnQsjsdp, xmIwtLD, actionType) ci-dessous — Zoho prévient que le
// formulaire cesse de fonctionner s'ils sont modifiés. Ne pas réutiliser le
// formulaire d'un autre site : la redirection et l'origine des messages
// seraient celles de l'autre site.
// Tant que les valeurs commencent par « TODO », la page contact masque le
// formulaire et affiche un message d'attente (voir app/contact/page.tsx).
export const ZOHO_WEBFORM = {
  actionUrl: "https://crm.zoho.com/crm/WebToLeadForm",
  xnQsjsdp: "TODO",
  xmIwtLD: "TODO",
  actionType: "TODO",
  // Champ-piège anti-spam de Zoho (base64 de « honeypot ») : caché, doit
  // rester vide — Zoho écarte les envois où il est rempli.
  honeypot: "aG9uZXlwb3Q",
  // Page affichée après soumission (returnURL), identique à celle déclarée
  // dans Zoho : page de remerciement app/contact/merci/ (le serveur ajoute
  // la barre finale par redirection).
  returnUrl: `${SITE_URL}/contact/merci`,
};

// Profils officiels du média : VIDE tant qu'aucun vrai compte n'existe (un
// lien mort ou fictif nuit plus à la crédibilité qu'une absence). Ajouter
// ici un profil réel, `{ label, url }` : il apparaît alors dans « Nous
// suivre » du pied de page et dans le `sameAs` JSON-LD de l'organisation
// (lib/schema.ts). Ordre de priorité pour Google : fiche Google Business
// Profile / Maps d'Anmira Studio, page LinkedIn, chaîne YouTube (seulement
// si on y publie des vidéos), puis Facebook, Pinterest et Instagram.
export const SOCIAL_LINKS: { label: string; url: string }[] = [
  { label: "LinkedIn", url: "https://www.linkedin.com/company/best-home-project" },
];

// Mentions légales : identité de l'éditeur (Anmira Studio) et de
// l'hébergeur. Aucune valeur inventée : la forme juridique n'a pas été
// communiquée, la ligne « Statut » n'existe donc pas ; NIF et STAT
// s'affichent dès qu'ils sont renseignés dans COMPANY.
export const LEGAL = {
  editeur_nom: COMPANY.nom,
  editeur_adresse: COMPANY_ADDRESS,
  editeur_telephone: COMPANY.telephone,
  directeur_publication: "Andrianina RABARIVELO",
  hebergeur_nom: "Vercel Inc.",
  // Adresse relevée le 2026-10-05 dans la section « Contact Us » de
  // vercel.com/legal/privacy-policy.
  hebergeur_adresse: "440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis",
};
