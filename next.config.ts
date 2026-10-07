import type { NextConfig } from "next";

// Export 100% statique — voir README.md "Pourquoi un export statique".
// Pas de backend, pas d'ISR, pas de fonctions serverless : le build produit
// un dossier `out/` de fichiers HTML/CSS/JS purs, déployable tel quel sur
// Vercel (ou n'importe quel hébergement statique). Le jour où un vrai
// CMS/back-office est nécessaire, retirer `output: "export"` et suivre le
// pattern déjà en place sur monauto/Techcars (WordPress headless + ISR,
// voir docs/architecture-headless.md de ce projet-là) plutôt que de
// réinventer une architecture différente.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true, // l'optimiseur d'image Next.js ne fonctionne pas en export statique
  },
};

export default nextConfig;
