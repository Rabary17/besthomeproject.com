// Logo de Best Home Project — pastille + maison + point orange, dessiné en
// SVG inline (même géométrie que public/icon.svg). Les couleurs passent par
// des props pour pouvoir s'adapter au fond : par défaut, pastille blanche
// et maison verte (utilisé sur les panneaux dégradés de l'accueil).
export default function BrandMark({
  size = 96,
  tile = "#FFFFFF",
  mark = "#17603F",
  dot = "#F28C28",
  className,
}: {
  size?: number;
  tile?: string;
  mark?: string;
  dot?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="16" fill={tile} />
      <polygon
        points="32,14 51,30 51,49 13,49 13,30"
        fill={mark}
        stroke={mark}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="38" r="5.5" fill={dot} />
    </svg>
  );
}
