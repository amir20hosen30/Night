import { Star, Bookmark, BookmarkCheck } from "lucide-react";
import { Cover, timeAgo } from "./Cover.jsx";

export function SeriesCard({ manga, onOpen, bookmarked, onToggleBookmark }) {
  const latest = manga.chapters[0];
  return (
    <div className="card">
      <button className="card-cover-btn" onClick={() => onOpen(manga.id)} aria-label={`باز کردن ${manga.title}`}>
        <Cover manga={manga} size="md" />
        {latest && timeAgo(latest.created_at) === "امروز" && <span className="badge-new">جدید</span>}
      </button>
      <div className="card-body">
        <button className="card-title" onClick={() => onOpen(manga.id)}>
          {manga.title}
        </button>
        <div className="card-meta">
          <span className="rating">
            <Star size={12} strokeWidth={2.5} /> {manga.rating}
          </span>
          <span className="dot">·</span>
          <span>فصل {latest ? latest.number : "—"}</span>
        </div>
        <div className="card-genres">
          {manga.genres.slice(0, 2).map((g) => (
            <span key={g} className="chip-mini">
              {g}
            </span>
          ))}
        </div>
      </div>
      <button
        className={`bookmark-btn ${bookmarked ? "is-active" : ""}`}
        onClick={() => onToggleBookmark(manga.id)}
        aria-label={bookmarked ? "حذف از لیست من" : "افزودن به لیست من"}
        title={bookmarked ? "حذف از لیست من" : "افزودن به لیست من"}
      >
        {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
      </button>
    </div>
  );
}
