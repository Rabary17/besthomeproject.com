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
import { KITS } from "@/lib/kits";
import { faqSchema } from "@/lib/schema";
import Icon from "@/components/Icon";
import BrandMark from "@/components/BrandMark";
import ArticleCard from "@/components/ArticleCard";
import JsonLd from "@/components/JsonLd";
import { AuthorAvatar } from "@/components/AuthorBox";

// Accueil de Best Home Project — sur la charte de app/globals.css (tokens,
// Bricolage Grotesque + Inter, vert forêt + point orange du logo). Aucune
// photo : les visuels sont construits en CSS/SVG (dégradés de la marque,
// icônes Lucide), donc rien à créditer ni à héberger. Orientation (voir
// VISION.md) : accompagnement de A à Z d'un projet de maison. Déroulé :
//   1. hero : promesse + panneau de navigation par étape + preuves
//   1 bis. « Les grands moments de ton projet » : bento de 8 étapes clés
//      reliées aux sous-rubriques
//   2. derniers articles (6 max)
//   3. « Par où commencer ? » : les 6 rubriques présentées par situation,
//      avec des exemples de questions — liés automatiquement à l'article
//      dès qu'il est publié (slug présent dans content/posts)
//   3 bis. les kits du parcours (lib/kits.ts)
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
    section: "preparer-son-projet",
    titre: "Tu as un projet, mais pas encore de plan",
    texte:
      "Avant de construire, il faut cadrer : combien tu peux investir, quel terrain, quels plans, quels devis. On t'aide à poser des bases solides, avant de signer quoi que ce soit.",
    exemples: [
      { question: "Quel budget prévoir pour construire ma maison ?" },
      { question: "Comment trouver un dessinateur pour mes plans ?" },
      { question: "Comment comparer deux devis de construction ?" },
    ],
    cta: "Préparer mon projet",
  },
  {
    section: "lancer-le-projet",
    titre: "Tu es prêt à te lancer",
    texte:
      "Entreprises, permis de construire, contrats, assurances : les étapes pour démarrer ton projet, avec les bonnes questions à poser et les pièges à éviter.",
    exemples: [
      { question: "Comment choisir un constructeur ou un maître d'œuvre ?" },
      { question: "Quelles étapes pour obtenir mon permis de construire ?" },
      { question: "Quelles garanties vérifier dans mon contrat ?" },
    ],
    cta: "Lancer mon projet",
  },
  {
    section: "chantier-etape-par-etape",
    titre: "Ton chantier démarre",
    texte:
      "De la fondation aux finitions, chaque étape a ses points de contrôle. On t'explique ce qui se passe, ce qu'il faut vérifier, et comment suivre ton chantier sans être du métier.",
    exemples: [
      { question: "Quelles sont les étapes d'un chantier, de la fondation aux finitions ?" },
      { question: "Que vérifier avant de fermer les cloisons ?" },
      { question: "Comment suivre un chantier sans être du métier ?" },
    ],
    cta: "Suivre mon chantier",
  },
  {
    section: "livraison-reception",
    titre: "Ta maison est presque terminée",
    texte:
      "Visiter avec méthode, noter les défauts, formuler des réserves, comprendre tes garanties : réceptionne ton chantier l'esprit tranquille, puis emménage.",
    exemples: [
      { question: "Comment se passe la réception du chantier ?" },
      { question: "Comment formuler des réserves ?" },
      { question: "Quelles garanties après la livraison ?" },
    ],
    cta: "Réceptionner ma maison",
  },
  {
    section: "renovation-deco-amenagement",
    titre: "Tu rénoves, tu décores, tu aménages",
    texte:
      "Rénovation, déco, rangement, extérieur : des idées concrètes pour une maison neuve ou ancienne, avec leurs contraintes de budget et de surface.",
    exemples: [
      { question: "Par où commencer pour rénover une maison ?" },
      { question: "Comment aménager un petit salon sans le surcharger ?" },
      { question: "Comment ranger une entrée sans place ?" },
    ],
    cta: "Rénover et décorer",
  },
  {
    section: "equipements-comparatifs",
    titre: "Tu dois équiper ta maison",
    texte:
      "La bonne question n'est pas « quel est le meilleur ? », mais « quel est le bon pour ma maison, mon budget et mon usage ? ». On compare selon ton usage, et on te dit quand un produit ne vaut pas son prix.",
    exemples: [
      { question: "Quelle perceuse-visseuse pour débuter ?" },
      { question: "Quel aspirateur robot pour une maison avec des animaux ?" },
      { question: "Quelle caméra de surveillance pour garder un œil sur l'entrée ?" },
    ],
    cta: "Voir les comparatifs",
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
    titre: "Définir ton budget",
    texte: "Apport, financement, aides, marge de sécurité : le plan financier de ton projet, avant de signer quoi que ce soit.",
    rubrique: "aides-budget",
    taille: "grande",
  },
  {
    titre: "Trouver ton dessinateur",
    texte: "Définir ton besoin, choisir qui dessine tes plans, comprendre ce qu'on te montre.",
    rubrique: "plans-dessinateur",
    taille: "haute",
  },
  {
    titre: "Comparer tes devis",
    texte: "Poste par poste, sans te faire avoir : ce qu'il faut regarder.",
    rubrique: "devis-construction",
  },
  {
    titre: "Choisir tes entreprises",
    texte: "Constructeur, artisans, références : les bonnes questions à poser.",
    rubrique: "choisir-entreprises",
  },
  {
    titre: "Permis & démarches",
    texte: "Le dossier administratif, dans l'ordre et sans oubli.",
    rubrique: "permis-demarches",
  },
  {
    titre: "Suivre ton chantier",
    texte: "De la fondation aux finitions, sans être du métier.",
    rubrique: "suivi-chantier",
  },
  {
    titre: "Réceptionner ta maison",
    texte: "Réserves, garanties, remise des clés : l'étape à ne pas rater.",
    rubrique: "reception-reserves",
  },
  {
    titre: "Déco & aménagement",
    texte: "Une maison qui te ressemble, pièce par pièce.",
    rubrique: "deco-ambiance",
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
      "Un site qui accompagne, de A à Z, les personnes qui veulent construire leur maison : pour elles et leur conjoint, pour leur famille ou pour leurs parents. Budget, plans, devis, entreprises, chantier, livraison, puis rénovation, déco et aménagement : des guides clairs et des kits pour chaque étape.",
  },
  {
    question: "Faut-il déjà s'y connaître en construction ?",
    answer:
      "Non. Chaque guide part du principe que c'est ta première fois : vocabulaire expliqué au passage, étapes dans l'ordre, erreurs à éviter. Quand un sujet engage ta sécurité, ton argent ou la structure de la maison, on te dit clairement quand faire appel à un professionnel.",
  },
  {
    question: "C'est quoi, les kits ?",
    answer:
      "Des ressources pratiques (modèles, checklists, trames) pour avancer concrètement à chaque étape : budget, comparaison de devis, choix des entreprises, suivi de chantier, réception. Elles sont en préparation et arrivent étape par étape : la page Kits indique celles qui sont prêtes.",
  },
  {
    question: "Vos contenus remplacent-ils un professionnel ?",
    answer:
      "Non. Ils t'aident à comprendre, à préparer ton projet et à poser les bonnes questions. Pour le financement, les aspects juridiques, les plans et la structure de la maison, un professionnel (banque, notaire, architecte, maître d'œuvre, entreprises) reste indispensable.",
  },
  {
    question: "D'où viennent vos informations ?",
    answer:
      "De sources vérifiables : textes officiels, normes, notices des fabricants et sites des organismes d'aides. Elles sont listées en bas de chaque article, avec leur date de consultation.",
  },
  {
    question: "Comment choisissez-vous les produits de vos comparatifs ?",
    answer:
      "En partant de ton usage, de ta maison et de ton budget, sur des critères vérifiables : caractéristiques officielles, compatibilité, prix constatés. Les éventuels liens d'affiliation sont signalés et ne changent jamais un classement.",
  },
  {
    question: "Les contenus sont-ils gratuits ?",
    answer: "Oui. Tout le site est en accès libre, sans inscription ni abonnement.",
  },
  {
    question: "Je ne trouve pas la réponse à ma question. Que faire ?",
    answer:
      "Écris-nous via la page Contact. Si ta question intéresse d'autres porteurs de projet, elle a de bonnes chances d'inspirer un prochain article ou un prochain kit.",
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
            <span>Ton projet de maison, de A à Z</span>
          </div>
          <h1>
            <span className="brand">Best Home Project</span> — construis ta
            maison, accompagné de A à Z
          </h1>
          <p className="lead">
            Tu veux construire ta maison, avec ton conjoint, pour ta famille
            ou pour tes parents ? Ici, tu n&apos;es pas seul. De ton budget
            et tes plans jusqu&apos;à la remise des clés, on t&apos;accompagne
            étape par étape, avec des guides clairs et des kits pour chaque
            moment du projet.
          </p>
          <div className="hero-actions">
            <a className="btn btn--primary" href="/parcours/">
              Voir le parcours
            </a>
            <a className="btn btn--secondary" href="/kits/">
              Découvrir les kits
            </a>
          </div>
          <ul className="hero-proof">
            <li>
              <Icon name="check" size={18} />
              Un parcours clair, de l&apos;idée à la remise des clés
            </li>
            <li>
              <Icon name="check" size={18} />
              Sources et normes citées sous chaque article
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
          <nav className="hero__chips" aria-label="Les étapes du parcours">
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
          <p className="kicker">Le parcours</p>
          <h2 id="projets-titre">Les grands moments de ton projet</h2>
          <p className="section-intro">
            Budget, plans, devis, entreprises, permis, chantier, réception,
            puis déco : les moments clés d&apos;un projet de maison, un par
            un. À chacun, des guides pour comprendre et des kits pour agir.
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
          <h2>Par où commencer ? Dis-nous où tu en es</h2>
          <p className="section-intro">
            Six situations, de l&apos;idée au dernier meuble. Choisis la
            tienne : chaque carte te mène aux guides de l&apos;étape.
          </p>
          <div className="situation-grid">
            {SITUATIONS.map((situation) => (
              <SituationCard key={situation.section} situation={situation} publies={publies} />
            ))}
          </div>
        </div>
      </section>

      {/* 3 bis. Les kits */}
      <section className="home-section" aria-labelledby="kits-titre">
        <div className="container">
          <p className="kicker">Les kits</p>
          <h2 id="kits-titre">Un kit pour chaque étape de ton projet</h2>
          <p className="section-intro">
            Modèles, checklists et trames pour passer de la théorie à
            l&apos;action : budget, devis, entreprises, chantier, réception.
            Ils arrivent étape par étape.
          </p>
          <div className="subcategory-grid">
            {KITS.slice(0, 6).map((kit) => {
              const section = getSection(kit.section) as Section;
              return (
                <div className="card subcategory-card" key={kit.slug}>
                  <span className="icon-tile">
                    <Icon name={section.icon} size={22} />
                  </span>
                  <span className="subcategory-card__title">{kit.titre}</span>
                  <span className="subcategory-card__body">{kit.description}</span>
                  <span className={`kit-badge${kit.disponible ? " kit-badge--ok" : ""}`}>
                    {kit.disponible ? "Disponible" : "Bientôt"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="section-intro" style={{ marginTop: "var(--space-5)" }}>
            <a href="/kits/">Voir tous les kits →</a>
          </p>
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
              du monde », mais le meilleur pour ton projet, ton budget et ta
              famille.
            </p>
            <p>
              <strong>Home</strong>, pour la maison de tes rêves, du premier plan
              à la dernière étagère : le lieu où tu vivras avec ceux que tu
              aimes.
            </p>
            <p>
              <strong>Project</strong>, parce qu&apos;une maison se construit
              étape après étape : le budget, les plans, le chantier, la
              livraison. Chaque guide et chaque kit t&apos;aident à faire
              avancer le tien, à ton rythme.
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
              Un contenu Best Home Project suit toujours le même chemin, de ta
              question jusqu&apos;à sa mise à jour.
            </p>
            <p className="method__note method__note--safe">
              <strong>Sécurité d&apos;abord.</strong> Électricité, gaz,
              structure du logement, finances : on t&apos;explique ce qui est à ta
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
              <h2>Un projet de maison qui te donne le vertige ?</h2>
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
