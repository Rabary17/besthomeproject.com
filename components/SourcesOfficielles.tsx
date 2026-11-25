// Bloc « Sources officielles » sous un article (YMYL) : liens vers les textes et
// organismes publics qui fondent l'information. N'affiche rien si la liste est vide.
type Source = { nom: string; url: string };

export default function SourcesOfficielles({ sources }: { sources?: Source[] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <aside className="post-sources" aria-label="Sources officielles">
      <h2>Sources officielles</h2>
      <ul>
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.nom}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
