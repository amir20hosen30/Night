import { useEffect, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { api } from "./api.js";

export function ReaderView({ manga, chapterNum, onBack, onChangeChapter }) {
  const idx = manga.chapters.findIndex((c) => c.number === chapterNum);
  const chapter = manga.chapters[idx];
  const next = manga.chapters[idx - 1]; // list is stored newest-first
  const prev = manga.chapters[idx + 1];

  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!chapter) return;
    setLoading(true);
    api
      .getChapterPages(chapter.id)
      .then((data) => {
        if (!cancelled) setPages(data.pages || []);
      })
      .catch(() => {
        if (!cancelled) setPages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chapter?.id]);

  const panelCount = 6;

  return (
    <div className="reader">
      <div className="reader-bar">
        <button className="back-link" onClick={onBack}>
          <ChevronRight size={16} /> {manga.title}
        </button>
        <span className="reader-chapter">فصل {chapterNum}</span>
      </div>

      <div className="reader-panels">
        {!loading && pages.length > 0
          ? pages.map((src, i) => <img key={i} className="panel-img" src={src} alt={`صفحه ${i + 1}`} loading="lazy" />)
          : Array.from({ length: panelCount }).map((_, i) => {
              const h = (manga.hue + i * 18) % 360;
              return (
                <div
                  key={i}
                  className="panel"
                  style={{
                    backgroundImage: `linear-gradient(${100 + i * 12}deg, hsl(${h} 40% 14%), hsl(${(h + 40) % 360} 30% 8%))`,
                  }}
                >
                  <span className="panel-label">پنل {i + 1}</span>
                </div>
              );
            })}
      </div>

      <div className="reader-nav">
        <button className="btn-ghost" disabled={!prev} onClick={() => prev && onChangeChapter(prev.number)}>
          <ChevronRight size={16} /> فصل قبل
        </button>
        <span className="muted">
          فصل {chapterNum} از {manga.chapters.length}
        </span>
        <button className="btn-primary" disabled={!next} onClick={() => next && onChangeChapter(next.number)}>
          فصل بعد <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}
