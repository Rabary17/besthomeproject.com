# Best Home Project

> **Vision et orientation éditoriale du site : voir [`VISION.md`](VISION.md).**

Accompagnement en français, de A à Z, pour construire sa maison — [besthomeproject.com](https://besthomeproject.com) :
budget, plans, devis, entreprises, chantier, livraison, puis rénovation, déco et aménagement
(orientation du 2026-10-07, voir `VISION.md`). Pages `/parcours/` et `/kits/` (kits : `lib/kits.ts`).
Site frère de Techno Play : même socle technique, même éditeur (Anmira Studio), mêmes six
auteurs, thématique et identité différentes (créé le 2026-10-05).

## Pourquoi un export statique

Ce projet est en **export statique Next.js** (`output: "export"` dans `next.config.ts`) :

- Les articles sont des fichiers Markdown dans `content/posts/` (pas de CMS, pas de base de
  données).
- `next build` produit un dossier `out/` de fichiers HTML/CSS/JS purs — zéro serveur, zéro
  fonction serverless, hébergeable sur Vercel gratuitement (ou n'importe quel hébergeur
  statique).
- Tout le socle SEO/GEO est en place dès le départ (voir plus bas) — l'export statique ne
  sacrifie rien sur ce plan (pas d'hydratation JS, chargement instantané).

**Quand faire évoluer vers un vrai back-office** (une fois qu'il y a du trafic et une vraie
stratégie de contenu) : retirer `output: "export"`, brancher un CMS headless et repasser en
ISR.

## SEO/GEO déjà en place

- Title/description uniques par page, URL canonique (`lib/site.ts`, `generateMetadata`).
- Open Graph + Twitter Card sur chaque page.
- JSON-LD (schema.org) : `WebSite`/`Organization` (avec `parentOrganization` Anmira Studio)
  sur tout le site, `BlogPosting` + `BreadcrumbList` sur chaque article, `Person`/`ProfilePage`
  pour les auteurs, `FAQPage` (accueil et FAQ) — voir `lib/schema.ts`.
- `sitemap_index.xml` (+ `post-sitemap.xml`, `page-sitemap.xml`, `author-sitemap.xml`, façon Yoast, voir `lib/sitemaps.ts`) et `robots.txt` générés automatiquement ; rubriques/sous-catégories en `noindex, follow`, hors sitemap.
- HTML sémantique (un seul `h1` par page, hiérarchie de titres propre).

## Ajouter un article

```bash
npm run new-post -- --categorie peinture-sols-murs "Comment repeindre une pièce sans traces"
```

Crée `content/posts/<slug-derive-du-titre>.md` avec le frontmatter pré-rempli (auteur choisi
selon sa spécialité). Éditer le fichier (description, contenu Markdown), puis `npm run build`
pour vérifier que ça compile. L'article apparaît automatiquement sur la page d'accueil et
dans le sitemap.

Format attendu (frontmatter YAML) :

```markdown
---
title: "Titre de l'article"
description: "Une phrase — utilisée dans le listing, les meta et l'Open Graph."
date: "2026-10-05"
updated: "2026-10-15"            # optionnel — date de mise à jour (dateModified)
author: "andrianina-rabarivelo"  # slug de lib/authors.ts — par défaut le rédacteur en chef
category: "peinture-sols-murs"   # slug de SOUS-catégorie, voir lib/categories.ts
---

Contenu en Markdown.
```

## Développement local

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # génère out/ (export statique)
npm run start     # sert out/ localement pour vérifier le build de prod
```

## Mise en ligne (à faire)

1. **GitHub** : créer un repo vide (sans README ni .gitignore), puis
   `git remote add origin git@github.com:<compte>/best-home-project.git`,
   `git branch -M main`, `git push -u origin main`.
2. **Vercel** : [vercel.com/new](https://vercel.com/new) → importer le repo. Framework Next.js
   détecté automatiquement, aucune variable d'environnement requise.
3. **Domaine** : projet Vercel → Settings → Domains → ajouter `besthomeproject.com` (et `www`),
   puis suivre les instructions DNS chez le registrar.
4. **Formulaire de contact** : voir la section suivante — tant qu'il n'est pas branché, la page
   Contact affiche un message d'attente.

## Formulaire de contact (Zoho CRM) — à brancher

La page `/contact/` envoie un formulaire « Web-to-Lead » vers Zoho CRM (aucun backend).
Les valeurs sont dans `ZOHO_WEBFORM` (`lib/site.ts`) et valent `TODO` pour l'instant : le
formulaire est donc masqué. Pour le brancher :

1. Zoho CRM → Configuration → Canaux → Formulaires web → module Prospects → Nouveau
   formulaire, nommé « Prospect Best Home Project ».
2. Champs : Nom (Last Name), E-mail (Email), Description. URL de redirection :
   `https://besthomeproject.com/contact/merci`. Activer le honeypot.
3. Recopier **tels quels** `xnQsjsdp`, `xmIwtLD` et `actionType` dans `ZOHO_WEBFORM`.
4. Optionnel : une règle de workflow Zoho (création d'un prospect → e-mail) pour recevoir une
   copie dans la boîte de la rédaction. L'adresse e-mail n'a pas à figurer dans ce dépôt (public).

Ne pas réutiliser le formulaire de Techno Play : la redirection et l'origine des messages
seraient celles de l'autre site.

## Arborescence éditoriale

6 rubriques (pages hub `/<rubrique>/`), organisées selon le parcours du projet, découpées en
25 sous-catégories (`/<rubrique>/<sous-categorie>/`) — source de vérité : `lib/categories.ts`.
Les articles restent à la racine (`/<slug>/`) : changer un article de rubrique ne casse jamais
son URL. Rubriques et sous-catégories sont toujours en `noindex, follow` et hors sitemap.

1. **Préparer son projet** : aides-budget, terrain-etudes, plans-dessinateur, devis-construction
2. **Lancer le projet** : choisir-entreprises, permis-demarches, contrats-assurances
3. **Le chantier, étape par étape** : fondations-gros-oeuvre, hors-d-eau-hors-d-air, plomberie-electricite, peinture-sols-murs, suivi-chantier
4. **Livraison & Réception** : reception-reserves, garanties-mise-en-service
5. **Rénovation, Déco & Aménagement** : renovation-travaux, bricolage-reparations, energie-economies, deco-ambiance, amenagement-rangement, maison-en-famille, jardin-exterieur
6. **Équipements & Comparatifs** : outillage-equipement, electromenager-cuisine, maison-connectee-securite, jardin-plein-air

Ajouter une sous-catégorie : l'ajouter dans `lib/categories.ts`, dans
`lib/auteurs-specialites.json` (titulaire) **et** dans `scripts/generate-covers.js`, puis
`npm run generate-covers`. Les icônes sont des tracés Lucide copiés dans `components/Icon.tsx`
(et `scripts/lucide-icons/` pour les visuels).

## Auteurs (E-E-A-T)

`lib/authors.ts` : la rédaction — rédacteur en chef (Andrianina RABARIVELO) et cinq
spécialistes, les mêmes personnes que sur Techno Play avec un périmètre éditorial adapté à la
maison :

- **Andrianina RABARIVELO** — rédacteur en chef ; maison connectée et sécurité, guides de
  bricolage, plomberie, électricité et jardin ;
- **Felana RABARIVELO** — déco, ambiance, salle de bain ;
- **Andee RAKOTOVAO** — design, aménagement, rangement, éclairage, peinture, sols et murs ;
- **Mialy ANDRIAHARISOA** — famille, cuisine, électroménager, couture pour la maison ;
- **Nekena JUDICAËL** — budget et aides, énergie, outillage, nouveautés ;
- **Dina RAKOTOARIVELO** — outils numériques (applis de plan 3D, simulateurs, devis en
  ligne), WordPress et création de sites.

Les rôles et bios décrivent ce que chacun **couvre** sur le site : à faire valider par chaque
personne avant mise en ligne, sans y ajouter d'expérience ou de diplôme non confirmés. Pas
d'email public : le contact passe par `/contact/`. Alimente l'encart auteur sous chaque
article, la page `/auteur/<slug>/`, la section « La rédaction » de `/a-propos/` et l'auteur du
JSON-LD `BlogPosting`. Une page auteur sans article publié est en `noindex` et hors sitemap.

### Choix de l'auteur à la publication (selon la spécialité)

Règles dans `lib/auteurs-specialites.json` (source unique, lue aussi par la page auteur) :

1. **Mots-clés** du titre (et des tags) : l'auteur qui cumule le plus de correspondances
   l'emporte (« perceuse » → Nekena, « aspirateur » → Mialy, « peindre » → Andee, « WordPress »
   ou « plan 3D » → Dina…) ;
2. égalité ou aucun mot-clé : **titulaire de la sous-catégorie** (chaque sous-catégorie a un
   titulaire ; Dina n'en a pas, elle est choisie par ses mots-clés) ;
3. sinon : rédacteur en chef.

```bash
npm run new-post -- --categorie outillage-equipement "Quelle perceuse-visseuse pour débuter"
npm run auteur -- --categorie bricolage-reparations "Peindre un plafond sans traces"   # suggestion
npm run auteur -- --fichier content/posts/mon-article.md --ecrire                      # écrit author:
```

Le champ `author:` se corrige à la main. Tests : `npm run test:garde-fou` (inclut
`choisir-auteur.test.js`, qui vérifie que chaque sous-catégorie a un titulaire existant).

## Éditeur et mentions légales (Anmira Studio)

Best Home Project est édité par **Anmira Studio** (Andranomanalina, Antananarivo 101,
Madagascar). Tout vient de `COMPANY` et `LEGAL` dans `lib/site.ts` : mentions légales, page
contact, À propos, politique de confidentialité, FAQ, pied de page et JSON-LD
(`parentOrganization`). Directeur de la publication : Andrianina RABARIVELO.

- **NIF et STAT** : vides pour l'instant. Les renseigner dans `COMPANY.nif` et `COMPANY.stat`
  suffit : les lignes apparaissent alors dans les mentions légales. Tant qu'ils sont vides, rien
  ne s'affiche.
- **Forme juridique** : non communiquée, donc pas de ligne « Statut ».
- **Hébergeur** : Vercel Inc. (adresse relevée le 2026-10-05 sur vercel.com/legal/privacy-policy).
- **Profils sociaux du média** : `SOCIAL_LINKS` est vide tant qu'aucun vrai compte n'existe
  (Google Business Profile, LinkedIn, YouTube, Facebook, Pinterest, Instagram, par ordre de
  priorité).

## Identité visuelle

Vert forêt (`--brand` #17603F, #6FD3A0 en mode sombre) + point orange du logo (`--signal`
#F28C28, décoratif). Titres Bricolage Grotesque, texte Inter (`next/font`, auto-hébergées).
Logo : pastille + maison + point orange (`public/icon.svg`, `public/brand/`,
`components/BrandMark.tsx`). L'accueil n'a **aucune photo** : panneaux en dégradé et grandes
icônes Lucide (donc rien à créditer). Le jour où l'on ajoute des photos, vérifier leur licence
et créditer les photographes.

Visuels de secours des rubriques (1200×630) : `npm run generate-covers` (couleurs à garder
synchronisées avec `app/globals.css`). Favicons PNG dérivés du SVG : `npm run generate-favicons`.

## Génération IA : garde-fou « date de coupure » (codé en dur)

**Toute** phase de génération (plan, premier jet, FAQ, méta, titre, réécriture) passe par
`scripts/generation/llm.js` → `generer()`, qui applique sans option de désactivation :

1. **Date de coupure stricte** : le modèle est interrogé (« jusqu'à quelle date s'arrêtent tes
   connaissances ? »), sa réponse est comparée à la date officielle codée en dur dans
   `scripts/generation/garde-fou-cutoff.js` (`CUTOFFS_OFFICIELS`) — **la plus ancienne des deux
   est retenue**. Modèle absent de la table + réponse illisible → génération refusée.
2. **Barème injecté en tête du prompt système** : interdiction de tout chiffre (prix, %,
   stats, specs), date, version ou nouveauté postérieure au début de la **zone grise** (6 mois
   avant la coupure), sauf si l'info est dans le brief ou les sources ; sinon marqueur
   `[À VÉRIFIER]`. Particulièrement important ici : montants d'aides, plafonds, normes et prix
   changent souvent.
3. **Audit de chaque sortie** : les passages hors barème reçoivent automatiquement
   `[À VÉRIFIER]`.
4. **Blocage au build** (`prebuild` → `verifier-contenu.js`, actif aussi sur Vercel) :
   impossible de publier un article contenant un `[À VÉRIFIER]`, ou citant une date postérieure
   à la coupure sans `sources:` en frontmatter.

```bash
npm run garde-fou:cutoff                       # date de coupure retenue (ANTHROPIC_API_KEY requise)
npm run garde-fou:audit -- content/posts/x.md  # audite un texte produit ailleurs ; --marquer pour annoter
npm run test:garde-fou                         # tests
```

## Ton éditorial

Tutoiement, ton direct et légèrement décalé, honnête sur les défauts. Les textes du site
(rubriques, accueil, À propos, FAQ, bios) suivent cette charte ; les pages légales restent au
vouvoiement. Sur les sujets à risque (électricité, gaz, structure du logement), toujours dire
clairement quand appeler un professionnel.

## Structure

```
app/
├── layout.tsx            # Layout global — header/footer, meta par défaut, JSON-LD site
├── page.tsx              # Accueil
├── not-found.tsx         # 404
├── sitemap_index.xml, *-sitemap.xml (routes) / robots.ts
├── [slug]/page.tsx       # Article (content/posts/*.md) OU hub de rubrique
├── [slug]/[sub]/page.tsx # Page de sous-catégorie
└── auteur/[author]/      # Page auteur
content/posts/*.md        # Les articles — un fichier = un article
lib/
├── site.ts               # URL, nom, éditeur, formulaire Zoho, mentions légales
├── categories.ts         # Rubriques + sous-catégories
├── authors.ts            # Rédaction (bio, réseaux, JSON-LD Person)
├── auteurs-specialites.json # Routage article → auteur
├── posts.ts              # Lecture des fichiers Markdown (gray-matter + marked)
└── schema.ts             # JSON-LD (schema.org)
components/               # JsonLd, ArticleCard, AuthorBox, Breadcrumbs, SectionHub, Icon, BrandMark
scripts/                  # new-post, generate-covers, generate-favicons, generation/ (garde-fou)
```
