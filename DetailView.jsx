import { ChevronRight, ChevronLeft, Star } from "lucide-react";
import { Cover, timeAgo } from "./Cover.jsx";

export function DetailView({ manga, onBack, onOpenChapter, bookmarked, onToggleBookmark }) {
  return (
    <div className="detail">
      <button className="back-link" onClick={onBack}>
        <ChevronRight size={16} /> بازگشت
      </button>
      <div className="detail-head">
        <Cover manga={manga} size="lg" />
        <div className="detail-info">
          <h1>{manga.title}</h1>
          <p className="detail-author">نویسنده: {manga.author}</p>
          <div className="detail-meta">
            <span className="rating">
              <Star size={13} strokeWidth={2.5} /> {manga.rating}
            </span>
            <span className="dot">·</span>
            <span>{manga.status}</span>
            <span className="dot">·</span>
            <span>{manga.chapters.length} فصل</span>
          </div>
          <div className="card-genres">
            {manga.genres.map((g) => (
              <span key={g} className="chip-mini">
                {g}
              </span>
            ))}
          </div>
          <p className="detail-synopsis">{manga.synopsis}</p>
          <div className="hero-actions">
            {manga.chapters[0] && (
              <button className="btn-primary" onClick={() => onOpenChapter(manga.chapters[0].number)}>
                خواندن فصل {manga.chapters[0].number}
              </button>
            )}
            <button className="btn-ghost" onClick={() => onToggleBookmark(manga.id)}>
              {bookmarked ? "در لیست من" : "افزودن به لیست"}
            </button>
          </div>
        </div>
      </div>

      <h2 className="chapter-list-heading">لیست فصل‌ها</h2>
      <div className="chapter-list">
        {manga.chapters.map((c) => (
          <button key={c.number} className="chapter-row" onClick={() => onOpenChapter(c.number)}>
            <span className="chapter-num">فصل {c.number}</span>
            <span className="chapter-title">
              {c.title || (c.number === manga.chapters[0].number ? "آخرین انتشار" : `فصل ${c.number}`)}
            </span>
            <span className="chapter-date">{timeAgo(c.created_at)}</span>
            <ChevronLeft size={16} className="chapter-chevron" />
          </button>
        ))}
      </div>
    </div>
  );
}
