import Icon from "@/components/Icon";
import { authorUrl, type Author } from "@/lib/authors";
import { SITE_NAME } from "@/lib/site";

// Encart auteur : avatar, nom, rôle, bio courte et profils sociaux.
// Affiché sous chaque article et sur la page À propos — rend visible pour
// le lecteur ce que le JSON-LD `Person` déclare aux moteurs (E-E-A-T).
export default function AuthorBox({
  author,
  heading = "À propos de l'auteur",
  headingLevel = 2,
}: {
  author: Author;
  heading?: string;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <aside className="author-box" aria-label={heading}>
      <AuthorAvatar author={author} size={72} />
      <div className="author-box__body">
        <span className="author-box__eyebrow">{heading}</span>
        <Heading className="author-box__name">
          <a href={authorUrl(author)}>{author.name}</a>
        </Heading>
        <p className="author-box__role">{author.role}, {SITE_NAME}</p>
        <p className="author-box__bio">{author.shortBio}</p>
        <AuthorSocials author={author} />
      </div>
    </aside>
  );
}

export function AuthorAvatar({ author, size }: { author: Author; size: number }) {
  if (author.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- export statique
      <img
        className="author-avatar"
        src={author.image}
        alt={author.name}
        width={size}
        height={size}
      />
    );
  }
  return (
    <span
      className="author-avatar author-avatar--initials"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {author.initials}
    </span>
  );
}

export function AuthorSocials({ author }: { author: Author }) {
  return (
    <ul className="author-socials">
      {author.socials.map((social) => (
        <li key={social.url}>
          <a
            href={social.url}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={`${author.name} sur ${social.label}`}
            title={social.label}
          >
            <Icon name={social.icon} size={18} />
          </a>
        </li>
      ))}
    </ul>
  );
}
