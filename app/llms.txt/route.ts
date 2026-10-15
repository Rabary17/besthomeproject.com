import { getAllPosts } from "@/lib/posts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { SECTIONS, sectionUrl } from "@/lib/categories";

// Fichier llms.txt : résumé lisible par les moteurs de réponse IA (convention
// llmstxt.org). Généré au build à partir des articles publiés, donc toujours à jour.
export const dynamic = "force-static";

export function GET(): Response {
  const lignes = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "Best Home Project accompagne les porteurs de projet de construction de maison en France, de A à Z : budget, plans, devis, entreprises, permis, chantier, réception, puis déco et aménagement. Les contenus sont gratuits, sourcés et signés par des auteurs identifiés.",
    "",
    "## Parcours",
    "",
    ...SECTIONS.map((s) => `- [${s.title}](${SITE_URL}${sectionUrl(s)}): ${s.description}`),
    "",
    "## Articles",
    "",
    ...getAllPosts().map((p) => `- [${p.seoTitle ?? p.title}](${SITE_URL}/${p.slug}/): ${p.description}`),
    "",
    "## Pages utiles",
    "",
    `- [Kits pratiques](${SITE_URL}/kits/): modèles à remplir pour chaque étape du projet`,
    `- [Questions fréquentes](${SITE_URL}/faq/): réponses aux questions les plus posées`,
    `- [À propos](${SITE_URL}/a-propos/): qui écrit et pourquoi`,
    `- [Contact](${SITE_URL}/contact/)`,
    "",
  ];
  return new Response(lignes.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
