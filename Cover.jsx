export const GENRES = [
  "اکشن",
  "فانتزی",
  "عاشقانه",
  "ترسناک",
  "علمی-تخیلی",
  "کمدی",
  "درام",
  "رازآلود",
  "زندگی روزمره",
  "ورزشی",
];

export function timeAgo(dateStr) {
  const then = new Date(dateStr).getTime();
  const days = Math.max(0, Math.floor((Date.now() - then) / (1000 * 60 * 60 * 24)));
  if (days < 1) return "امروز";
  if (days === 1) return "۱ روز پیش";
  if (days < 30) return `${days} روز پیش`;
  const months = Math.floor(days / 30);
  return months === 1 ? "۱ ماه پیش" : `${months} ماه پیش`;
}

export function Cover({ manga, size = "md" }) {
  const h = manga.hue;
  const bg = `linear-gradient(160deg, hsl(${h} 65% 16%) 0%, hsl(${
    (h + 35) % 360
  } 55% 10%) 55%, hsl(${(h + 10) % 360} 70% 6%) 100%)`;
  return (
    <div className={`cover cover-${size}`} style={{ backgroundImage: manga.cover ? undefined : bg }}>
      {manga.cover && <img className="cover-img" src={manga.cover} alt="" />}
      {manga.cover && <div className="cover-scrim" />}
      {!manga.cover && (
        <>
          <svg className="cover-moon" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="70" cy="26" r="14" fill={`hsl(${h} 70% 82%)`} opacity="0.9" />
            <circle cx="64" cy="22" r="14" fill={`hsl(${(h + 30) % 360} 55% 12%)`} opacity="0.95" />
          </svg>
          <svg className="cover-grain" viewBox="0 0 100 140" aria-hidden="true">
            <filter id={`n-${manga.id}`}>
              <feTurbulence baseFrequency="0.9" numOctaves="2" seed={h} />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100" height="140" filter={`url(#n-${manga.id})`} opacity="0.05" />
          </svg>
        </>
      )}
      <div className="cover-title">{manga.title}</div>
      <div className="cover-author">{manga.author}</div>
    </div>
  );
}
