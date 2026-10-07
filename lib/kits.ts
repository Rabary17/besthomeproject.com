// Kits du parcours (voir VISION.md) : ressources pratiques (modèles,
// checklists, trames) associées à chaque étape du projet de maison.
// `disponible: false` = en préparation (affiché « Bientôt »). Quand un kit
// est prêt, renseigner `href` (page ou fichier) et passer `disponible` à true.
import type { SectionSlug } from "@/lib/categories";

export interface Kit {
  slug: string;
  titre: string;
  description: string;
  /** Rubrique / étape du parcours à laquelle le kit appartient. */
  section: SectionSlug;
  disponible: boolean;
  href?: string;
}

export const KITS: Kit[] = [
  {
    slug: "kit-budget-financement",
    titre: "Kit budget & plan de financement",
    description:
      "Une trame pour poser ton budget, ton apport, ta capacité d'emprunt et ta marge de sécurité avant de te lancer.",
    section: "preparer-son-projet",
    disponible: false,
  },
  {
    slug: "kit-cahier-des-charges",
    titre: "Kit cahier des charges",
    description:
      "Les questions à te poser (et à poser à ta famille) pour définir précisément ce que tu veux dans ta maison.",
    section: "preparer-son-projet",
    disponible: false,
  },
  {
    slug: "kit-brief-dessinateur",
    titre: "Kit brief pour dessinateur",
    description:
      "Un brief clair à envoyer à un dessinateur ou un architecte pour obtenir des plans qui correspondent à ton besoin.",
    section: "preparer-son-projet",
    disponible: false,
  },
  {
    slug: "kit-comparateur-devis",
    titre: "Kit comparateur de devis",
    description:
      "Une grille pour comparer tes devis de construction poste par poste, et repérer ce qui manque ou ce qui coûte trop cher.",
    section: "preparer-son-projet",
    disponible: false,
  },
  {
    slug: "kit-choix-entreprises",
    titre: "Kit choix des entreprises",
    description:
      "Les questions à poser, les références et les documents à demander avant de t'engager avec un constructeur ou un artisan.",
    section: "lancer-le-projet",
    disponible: false,
  },
  {
    slug: "kit-dossier-permis",
    titre: "Kit dossier de permis",
    description:
      "Une checklist des pièces et des étapes pour déposer ton permis de construire sans mauvaise surprise.",
    section: "lancer-le-projet",
    disponible: false,
  },
  {
    slug: "kit-suivi-chantier",
    titre: "Kit suivi de chantier",
    description:
      "Calendrier, points de contrôle à chaque étape, compte rendu de réunion : garde la main sur ton chantier, de la fondation aux finitions.",
    section: "chantier-etape-par-etape",
    disponible: false,
  },
  {
    slug: "kit-reception-chantier",
    titre: "Kit réception du chantier",
    description:
      "Checklist pièce par pièce et modèle de liste de réserves pour réceptionner ta maison l'esprit tranquille.",
    section: "livraison-reception",
    disponible: false,
  },
  {
    slug: "kit-renovation-deco",
    titre: "Kit rénovation, déco & aménagement",
    description:
      "Planning de travaux, budget par pièce et plan d'aménagement pour mener tes projets de rénovation et de déco dans le bon ordre.",
    section: "renovation-deco-amenagement",
    disponible: false,
  },
];
