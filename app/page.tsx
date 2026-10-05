import { getAllPosts } from "@/lib/posts";
import {
  SECTIONS,
  getSection,
  getSubcategory,
  sectionUrl,
  subcategoryUrl,
  type Section,
} from "@/lib/categories";
import { AUTHORS, DEFAULT_AUTHOR_SLUG, authorUrl } from "@/lib/authors";
import { faqSchema } from "@/lib/schema";
import Icon from "@/components/Icon";
import BrandMark from "@/components/BrandMark";
import ArticleCard from "@/components/ArticleCard";
import JsonLd from "@/components/JsonLd";
import { AuthorAvatar } from "@/components/AuthorBox";

// Accueil de Best Home Project — sur la charte de app/globals.css (tokens,
// Bricolage Grotesque + Inter, vert forêt + point orange du logo). Aucune
// photo : les visuels sont construits en CSS/SVG (dégradés de la marque,
// icônes Lucide), donc rien à créditer ni à héberger. Déroulé :
//   1. hero : promesse + panneau de navigation par rubrique + preuves
//   1 bis. « Les projets de la maison » : bento de 8 chantiers reliés aux
//      sous-rubriques
//   2. derniers articles (6 max)
//   3. « Par où commencer ? » : les 4 rubriques présentées par situation,
//      avec des exemples de questions — liés automatiquement à l'article
//      dès qu'il est publié (slug présent dans content/posts)
//   4. le nom de marque : pourquoi « Best Home Project »
//   5. la méthode (comment on travaille) + sécurité + indépendance
//   6. la rédaction (un spécialiste par sujet)
//   7. FAQ (JSON-LD FAQPage) + appel à proposer un sujet
// Ton : charte de ton du projet (tutoiement, direct, sans jargon). Aucun
// chiffre d'audience ou de volume inventé (garde-fou du site).

interface Exemple {
  question: string;
  /** Slug de l'article qui répond à la question, s'il existe ou existera. */
  slug?: string;
}

interface Situation {
  section: string;
  titre: string;
  texte: string;
  exemples: Exemple[];
  cta: string;
}

const SITUATIONS: Situation[] = [
  {
    section: "guides-tutos",
    titre: "Tu as des travaux à faire",
    texte:
      "Une étagère à fixer, un mur à repeindre, un robinet qui goutte ? Nos guides vont droit au but : matériel à prévoir, étapes numérotées, erreurs à éviter, et une consigne claire quand mieux vaut appeler un pro.",
    exemples: [
      { question: "Comment percer un mur sans l'abîmer ?" },
      { question: "Comment repeindre une pièce sans traces ?" },
      { question: "Mon robinet goutte : puis-je le réparer moi-même ?" },
    ],
    cta: "Voir les guides & tutos",
  },
  {
    section: "comparatifs-achats",
    titre: "Tu veux acheter sans te tromper",
    texte:
      "La bonne question n'est pas « quel est le meilleur ? », mais « quel est le bon pour mon logement, mon budget et mon niveau ? ». On compare selon ton usage, et on te dit quand un produit ne vaut pas son prix.",
    exemples: [
      { question: "Quelle perceuse-visseuse pour débuter ?" },
      { question: "Quel aspirateur robot pour une maison avec des animaux ?" },
      { question: "Quelle caméra de surveillance pour garder un œil sur l'entrée ?" },
    ],
    cta: "Voir les comparatifs",
  },
  {
    section: "idees-inspiration",
    titre: "Tu cherches des idées pour tes pièces",
    texte:
      "Petite surface, peu de lumière, budget serré : on part de pièces réelles et de leurs contraintes, puis on propose des idées que tu peux vraiment réaliser. Déco, rangement, aménagement, chambre d'enfant.",
    exemples: [
      { question: "Comment aménager un petit salon sans le surcharger ?" },
      { question: "Quelles couleurs associer dans une pièce sombre ?" },
      { question: "Comment ranger une entrée sans place ?" },
    ],
    cta: "Voir les idées",
  },
  {
    section: "actu-aides",
    titre: "Tu veux savoir ce qui change pour toi",
    texte:
      "Aides, prix, normes, nouveautés : on trie l'actu de la maison avec un seul filtre : qu'est-ce que ça change concrètement pour toi ? Vérifié à la source, sans emballement.",
    exemples: [
      { question: "Cette aide à la rénovation correspond-elle à mon projet ?" },
      { question: "Comment lire un devis de travaux sans se faire avoir ?" },
      { question: "Cette nouveauté mérite-t-elle vraiment le détour ?" },
    ],
    cta: "Voir l'actu & aides",
  },
];

interface Projet {
  titre: string;
  texte: string;
  /** Slug de la sous-rubrique vers laquelle pointe la tuile (icône reprise de celle-ci). */
  rubrique: string;
  /** Emplacement dans la grille (voir .trend-tile--* dans app/globals.css). */
  taille?: "grande" | "haute";
}

const PROJETS: Projet[] = [
  {
    titre: "Peindre une pièce",
    texte: "Préparer le mur, choisir la peinture, appliquer sans traces : le résultat propre dès la première fois.",
    rubrique: "peinture-sols-murs",
    taille: "grande",
  },
  {
    titre: "Plomberie & électricité",
    texte: "Robinet qui goutte, prise à changer, évier bouché : ce que tu peux faire seul, et quand appeler un pro.",
    rubrique: "plomberie-electricite",
    taille: "haute",
  },
  {
    titre: "Outillage",
    texte: "Perceuse, visseuse, ponceuse : le bon outil, sans payer du matériel de chantier.",
    rubrique: "outillage-equipement",
  },
  {
    titre: "Déco & ambiance",
    texte: "Couleurs, luminaires, textiles : du caractère sans ruiner ton budget.",
    rubrique: "deco-ambiance",
  },
  {
    titre: "Aides & budget",
    texte: "Aides à la rénovation, devis, financement : t'y retrouver.",
    rubrique: "aides-budget",
  },
  {
    titre: "Maison connectée",
    texte: "Ampoules, caméras, serrures : utile, compatible, respectueux de ta vie privée.",
    rubrique: "maison-connectee-securite",
  },
  {
    titre: "Énergie & économies",
    texte: "Isolation, chauffage, consommation : réduire ta facture avec les bons gestes.",
    rubrique: "energie-economies",
  },
  {
    titre: "Jardin & extérieur",
    texte: "Potager, terrasse, haie : un extérieur entretenu sans y passer tes week-ends.",
    rubrique: "jardin-exterieur",
  },
];

const METHODE = [
  {
    titre: "On part de ta question",
    texte:
      "Chaque article répond à une question que des gens se posent vraiment, formulée avec leurs mots. Pas à un sujet choisi pour remplir une grille.",
  },
  {
    titre: "On vérifie à la source",
    texte:
      "Notices des fabricants, normes, textes officiels, sites des organismes d'aides : chaque fait est contrôlé. Les sources s'affichent sous l'article, avec leur date de consultation.",
  },
  {
    titre: "On va droit au but",
    texte:
      "La réponse arrive dès les premières lignes, puis le détail : matériel, étapes numérotées, tableaux de synthèse, FAQ. Tu prends ce dont tu as besoin, et tu repars.",
  },
  {
    titre: "On dit ce qu'on pense",
    texte:
      "Un prix abusé, un gadget inutile, une promesse marketing creuse ? On te le dit, même quand la fiche technique brille.",
  },
  {
    titre: "On garde l'article à jour",
    texte:
      "Une règle change, un prix bouge, une erreur nous est signalée ? On corrige ouvertement, et la date de mise à jour s'affiche en tête d'article.",
  },
];

const FAQ = [
  {
    question: "C'est quoi, Best Home Project ?",
    answer:
      "Un média maison et bricolage indépendant, en français, qui explique la maison sans jargon : guides de travaux et de réparations, comparatifs pour bien acheter, idées de déco et d'aménagement, et l'actu des aides et du budget travaux.",
  },
  {
    question: "Faut-il être bricoleur pour suivre les guides ?",
    answer:
      "Non. Chaque guide part du principe que c'est ta première fois : matériel listé, étapes numérotées, vocabulaire expliqué au passage. Si une opération est risquée, on te prévient avant, et pour l'électricité, le gaz ou la structure du logement, on te dit quand appeler un pro.",
  },
  {
    question: "D'où viennent vos informations ?",
    answer:
      "De sources vérifiables : notices des fabricants, normes, textes officiels et sites des organismes d'aides. Elles sont listées en bas de chaque article, avec leur date de consultation.",
  },
  {
    question: "Comment choisissez-vous les produits de vos comparatifs ?",
    answer:
      "En partant de ton usage, de ton logement et de ton budget, sur des critères vérifiables : caractéristiques officielles, compatibilité, prix constatés. Les éventuels liens d'affiliation sont signalés et ne changent jamais un classement.",
  },
  {
    question: "Les articles sont-ils gratuits ?",
    answer: "Oui. Tout le site est en accès libre, sans inscription ni abonnement.",
  },
  {
    question: "Je ne trouve pas la réponse à ma question. Que faire ?",
    answer:
      "Écris-nous via la page Contact. Si ta question intéresse d'autres lecteurs, elle a de bonnes chances d'inspirer un prochain article.",
  },
];

function SituationCard({ situation, publies }: { situation: Situation; publies: Set<string> }) {
  const section = getSection(situation.section) as Section;
  return (
    <article className="card situation-card">
      <div className="situation-card__body">
        <div className="situation-card__kicker">
          <span className="icon-tile icon-tile--sm" aria-hidden="true">
            <Icon name={section.icon} size={18} />
          </span>
          <span>{section.title}</span>
        </div>
        <h3>
          <a href={sectionUrl(section)}>{situation.titre}</a>
        </h3>
        <p>{situation.texte}</p>
        <p className="situation-card__label">Par exemple :</p>
        <ul className="situation-card__examples">
          {situation.exemples.map((ex) => (
            <li key={ex.question}>
              <Icon name="arrow-right" size={16} />
              {ex.slug && publies.has(ex.slug) ? (
                <a href={`/${ex.slug}/`}>{ex.question}</a>
              ) : (
                <span>{ex.question}</span>
              )}
            </li>
          ))}
        </ul>
        <ul className="situation-card__subs" aria-label={`Sous-rubriques de ${section.title}`}>
          {section.subcategories.map((sub) => (
            <li key={sub.slug}>
              <a href={subcategoryUrl(section, sub)}>{sub.title}</a>
            </li>
          ))}
        </ul>
        <a className="situation-card__cta" href={sectionUrl(section)}>
          {situation.cta}
          <Icon name="arrow-right" size={16} />
        </a>
      </div>
    </article>
  );
}

export default function HomePage() {
  const posts = getAllPosts();
  const publies = new Set(posts.map((p) => p.slug));
  const editor = AUTHORS.find((a) => a.slug === DEFAULT_AUTHOR_SLUG);
  const equipe = [editor, ...AUTHORS.filter((a) => a.slug !== DEFAULT_AUTHOR_SLUG)].filter(
    (a): a is NonNullable<typeof a> => Boolean(a)
  );

  return (
    <>
      <JsonLd data={faqSchema(FAQ)} />

      {/* 1. Hero */}
      <section className="container hero hero--split">
        <div className="hero__text">
          <div className="hero-eyebrow">
            <span className="dot" aria-hidden="true" />
            <span>Média maison &amp; bricolage indépendant</span>
          </div>
          <h1>
            <span className="brand">Best Home Project</span> — ta maison,
            décortiquée, sans jargon ni baratin
          </h1>
          <p className="lead">
            Un mur à peindre, une perceuse à choisir, un robinet qui goutte,
            une aide à la rénovation à comprendre ? Tu es au bon endroit.
            Ici, la maison s&apos;explique avec des mots simples, des étapes
            claires et des avis francs. Un seul objectif : qu&apos;à la fin
            de l&apos;article, ton projet ait avancé.
          </p>
          <div className="hero-actions">
            <a className="btn btn--primary" href="#par-ou-commencer">
              Trouver un guide
            </a>
            <a className="btn btn--secondary" href="#derniers-articles">
              Lire les derniers articles
            </a>
          </div>
          <ul className="hero-proof">
            <li>
              <Icon name="check" size={18} />
              Sources et normes citées sous chaque article
            </li>
            <li>
              <Icon name="check" size={18} />
              Zéro jargon, zéro baratin
            </li>
            <li>
              <Icon name="check" size={18} />
              Gratuit, sans inscription
            </li>
          </ul>
        </div>
        <div className="hero__visual">
          <svg className="hero__house" viewBox="0 0 64 64" aria-hidden="true">
            <polygon
              points="32,8 56,29 56,54 8,54 8,29"
              fill="rgba(255,255,255,0.1)"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="40" r="5" fill="#F28C28" />
          </svg>
          <nav className="hero__chips" aria-label="Les quatre rubriques">
            {SECTIONS.map((section) => (
              <a key={section.slug} href={sectionUrl(section)}>
                <Icon name={section.icon} size={18} />
                {section.short}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* 1 bis. Projets */}
      <section className="home-section trends-section" aria-labelledby="projets-titre">
        <div className="container">
          <p className="kicker">Projets</p>
          <h2 id="projets-titre">Les projets de la maison, décortiqués</h2>
          <p className="section-intro">
            Peinture, plomberie, outillage, déco, budget, énergie… Les
            chantiers de tous les jours, expliqués sans jargon : ce que tu
            peux faire seul, ce que ça coûte, et quand il vaut mieux appeler
            un pro.
          </p>
          <ul className="trend-grid">
            {PROJETS.map((p) => {
              const cible = getSubcategory(p.rubrique);
              const href = cible ? subcategoryUrl(cible.section, cible.sub) : "/";
              const grande = p.taille === "grande";
              return (
                <li key={p.titre} className={`trend-tile${p.taille ? ` trend-tile--${p.taille}` : ""}`}>
                  {cible ? (
                    <span className="trend-tile__icon" aria-hidden="true">
                      <Icon name={cible.sub.icon} size={grande ? 160 : p.taille === "haute" ? 96 : 64} />
                    </span>
                  ) : null}
                  <div className="trend-tile__body">
                    {cible ? <span className="trend-tile__tag">{cible.sub.title}</span> : null}
                    <h3>
                      <a href={href}>{p.titre}</a>
                    </h3>
                    <p>{p.texte}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 2. Derniers articles */}
      <section id="derniers-articles" className="home-section">
        <div className="container">
          <h2>Les derniers articles</h2>
          <p className="section-intro">
            Fraîchement publiés, vérifiés et datés. Les sources de chaque
            article sont listées tout en bas : tu peux contrôler par
            toi-même.
          </p>
          {posts.length === 0 ? (
            <p className="empty-state">Les premiers articles arrivent très vite. Repasse bientôt !</p>
          ) : (
            <div className="article-grid">
              {posts.slice(0, 6).map((post) => (
                <ArticleCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Par où commencer ? */}
      <section id="par-ou-commencer" className="home-section">
        <div className="container">
          <h2>Par où commencer ? Dis-nous ce qui t&apos;amène</h2>
          <p className="section-intro">
            Quatre rubriques, quatre situations. Choisis la tienne : chaque
            carte te mène aux guides qui répondent à ce genre de question.
          </p>
          <div className="situation-grid">
            {SITUATIONS.map((situation) => (
              <SituationCard key={situation.section} situation={situation} publies={publies} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Le nom de marque */}
      <section className="home-section">
        <div className="container brand-story">
          <div className="brand-story__visual" aria-hidden="true">
            <BrandMark size={88} />
            <p className="brand-story__words">
              <span>Best</span>
              <span>Home</span>
              <span>
                Project<i className="brand-story__dot" />
              </span>
            </p>
          </div>
          <div className="brand-story__text">
            <p className="kicker">Le nom</p>
            <h2>Pourquoi «&nbsp;Best&nbsp;Home&nbsp;Project&nbsp;» ?</h2>
            <p>
              <strong>Best</strong>, pour le bon choix. Pas « le meilleur
              produit du monde », mais le meilleur pour ton logement, ton
              budget et ton niveau de bricolage.
            </p>
            <p>
              <strong>Home</strong>, pour la maison sous toutes ses coutures :
              murs, sols, pièces d&apos;eau, cuisine, jardin, objets connectés…
              tout ce qui rend un logement agréable à vivre.
            </p>
            <p>
              <strong>Project</strong>, parce qu&apos;une maison se construit
              projet après projet : une étagère ce week-end, une pièce
              repeinte le suivant. Chaque article t&apos;aide à faire avancer
              le tien, à ton rythme.
            </p>
            <div className="brand-story__logo">
              <span className="brand-story__logo-dot" aria-hidden="true" />
              <p>
                Et le logo ? La maison, c&apos;est ton chez-toi, le point de
                départ de chaque projet. Le point orange, c&apos;est l&apos;idée
                qui s&apos;allume : ce moment où tu te dis « ok, je peux le
                faire ». C&apos;est exactement ce qu&apos;on cherche à
                provoquer dans chaque article.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. La méthode */}
      <section className="promise-section method-section">
        <div className="container method">
          <div className="method__head">
            <p className="kicker">Notre méthode</p>
            <h2>Comment on travaille (et pourquoi tu peux nous faire confiance)</h2>
            <p className="method__intro">
              Un article Best Home Project suit toujours le même chemin, de ta
              question jusqu&apos;à sa mise à jour.
            </p>
            <p className="method__note method__note--safe">
              <strong>Sécurité d&apos;abord.</strong> Électricité, gaz,
              structure du logement : on t&apos;explique ce qui est à ta
              portée, et on te dit clairement quand il faut appeler un
              professionnel.
            </p>
            <p className="method__note">
              <strong>Indépendance.</strong> Aucun annonceur ne dicte la ligne
              éditoriale. Certains guides d&apos;achat peuvent contenir des
              liens d&apos;affiliation : ils sont signalés, et ne changent
              jamais un classement.
            </p>
            <div className="promise-actions">
              <a className="btn btn--primary" href="/a-propos/">
                Notre ligne éditoriale
              </a>
              <a className="btn btn--secondary" href="/contact/">
                Signaler une erreur
              </a>
            </div>
          </div>
          <ol className="method__steps">
            {METHODE.map((etape, i) => (
              <li key={etape.titre}>
                <span className="method__num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{etape.titre}</h3>
                  <p>{etape.texte}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 6. La rédaction */}
      <section className="home-section">
        <div className="container">
          <h2>Une rédaction, un spécialiste pour chaque sujet</h2>
          <p className="section-intro">
            Chaque article est confié à la personne dont c&apos;est le
            domaine, puis relu par le rédacteur en chef avant publication.
          </p>
          <ul className="team-grid">
            {equipe.map((author) => (
              <li key={author.slug} className="card team-card">
                <AuthorAvatar author={author} size={80} />
                <h3>
                  <a href={authorUrl(author)}>{author.name}</a>
                </h3>
                <p className="team-card__role">{author.role}</p>
                <p className="team-card__topics">
                  {author.expertise
                    .slice(0, 2)
                    .map((e) => e.replace(/\s*\(.*\)$/, ""))
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. FAQ + appel à proposer un sujet */}
      <section className="home-section">
        <div className="container home-faq">
          <div className="home-faq__head">
            <h2>Questions fréquentes</h2>
            <p>
              Tout ce que tu veux savoir sur Best Home Project, en bref. Les
              autres réponses sont sur la <a href="/faq/">page FAQ</a>.
            </p>
          </div>
          <div className="home-faq__list">
            {FAQ.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section--last">
        <div className="container">
          <div className="cta-band">
            <div className="cta-band__content">
              <h2>Un projet maison qui te prend la tête ?</h2>
              <p>
                Dis-nous lequel. S&apos;il intéresse d&apos;autres lecteurs,
                on en fera peut-être notre prochain article.
              </p>
              <a className="btn btn--light" href="/contact/">
                Proposer un sujet
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
