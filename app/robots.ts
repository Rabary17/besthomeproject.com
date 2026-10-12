import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Requis par Next.js 15 en export statique pour les routes de métadonnées
// (robots.txt/sitemap.xml) — sans ça, le build échoue.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
