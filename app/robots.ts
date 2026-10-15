import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Requis par Next.js 15 en export statique pour les routes de métadonnées
// (robots.txt/sitemap.xml) — sans ça, le build échoue.
export const dynamic = "force-static";

// Moteurs de réponse IA et robots de recherche : autorisés explicitement,
// pour que la visibilité dans les réponses génératives ne dépende pas d'une
// règle générique. Liste à relire quand les éditeurs changent de nom de robot.
const ROBOTS_IA = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "DuckAssistBot",
  "Meta-ExternalAgent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...ROBOTS_IA.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
