import { useMemo } from "react";
import { Cover, GENRES } from "./Cover.jsx";
import { SeriesCard } from "./SeriesCard.jsx";

export function HomeView({
  series,
  query,
  activeGenres,
  toggleGenre,
  statusFilter,
  setStatusFilter,
  sort,
  setSort,
  onOpen,
  bookmarks,
  onToggleBookmark,
}) {
  const featured = series[0];
  const trending = series.slice(1, 5);

  const filtered = useMemo(() => {
    let list = series.filter((m) => {
      const matchesQuery = m.title.toLowerCase().includes(query.toLowerCase());
      const matchesGenre =
        activeGenres.length === 0 || activeGenres.every((g) => m.genres.includes(g));
      const matchesStatus = statusFilter === "همه" || m.status === statusFilter;
      return matchesQuery && matchesGenre && matchesStatus;
    });
    if (sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "newest")
      list = [...list].sort(
        (a, b) => new Date(b.chapters[0]?.created_at || 0) - new Date(a.chapters[0]?.created_at || 0)
      );
    return list;
  }, [series, query, activeGenres, statusFilter, sort]);

  const showHero = !query && activeGenres.length === 0 && statusFilter === "همه" && featured;

  if (series.length === 0) {
    return (
      <div className="empty">
        <p>هنوز هیچ سری‌ای اضافه نشده.</p>
        <p className="muted">از پنل ادمین یه سری جدید اضافه کن.</p>
      </div>
    );
  }

  return (
    <>
      {showHero && (
        <section className="hero">
          <button className="hero-cover" onClick={() => onOpen(featured.id)}>
            <Cover manga={featured} size="lg" />
          </button>
          <div className="hero-copy">
            <span className="eyebrow-soft">پیشنهاد امشب</span>
            <h1>{featured.title}</h1>
            <p className="hero-synopsis">{featured.synopsis}</p>
            <div className="card-genres">
              {featured.genres.map((g) => (
                <span key={g} className="chip-mini">
                  {g}
                </span>
              ))}
            </div>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => onOpen(featured.id)}>
                شروع مطالعه
              </button>
              <button className="btn-ghost" onClick={() => onToggleBookmark(featured.id)}>
                {bookmarks.includes(featured.id) ? "در لیست من" : "افزودن به لیست"}
              </button>
            </div>

            {trending.length > 0 && (
              <div className="trending">
                <span className="trending-label">پرطرفدارهای امشب</span>
                <ol>
                  {trending.map((m, i) => (
                    <li key={m.id}>
                      <button onClick={() => onOpen(m.id)}>
                        <span className="trending-num">{i + 1}</span>
                        <span className="trending-title">{m.title}</span>
                        <span className="trending-ch">فصل {m.chapters[0]?.number ?? "—"}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="filters">
        <div className="chip-row">
          <button
            className={`chip status-chip ${statusFilter === "همه" ? "chip-active" : ""}`}
            onClick={() => setStatusFilter("همه")}
          >
            همه
          </button>
          <button
            className={`chip status-chip ${statusFilter === "در حال انتشار" ? "chip-active" : ""}`}
            onClick={() => setStatusFilter("در حال انتشار")}
          >
            در حال انتشار
          </button>
          <button
            className={`chip status-chip ${statusFilter === "تکمیل شده" ? "chip-active" : ""}`}
            onClick={() => setStatusFilter("تکمیل شده")}
          >
            تکمیل‌شده
          </button>
        </div>
        <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="trending">پرطرفدار</option>
          <option value="newest">جدیدترین فصل‌ها</option>
          <option value="rating">بالاترین امتیاز</option>
          <option value="az">الفبایی</option>
        </select>
      </section>

      <section className="filters filters-genres">
        <div className="chip-row">
          {GENRES.map((g) => (
            <button
              key={g}
              className={`chip ${activeGenres.includes(g) ? "chip-active" : ""}`}
              onClick={() => toggleGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      <section className="grid-heading">
        <h2>{query || activeGenres.length || statusFilter !== "همه" ? "نتایج" : "همه‌ی سری‌ها"}</h2>
        <span className="muted">{filtered.length} عنوان</span>
      </section>

      {filtered.length === 0 ? (
        <div className="empty">
          <p>چیزی با این جستجو پیدا نشد.</p>
          <p className="muted">عبارت دیگه‌ای رو امتحان کن یا فیلترها رو پاک کن.</p>
        </div>
      ) : (
        <div className="grid">
          {filtered.map((m) => (
            <SeriesCard
              key={m.id}
              manga={m}
              onOpen={onOpen}
              bookmarked={bookmarks.includes(m.id)}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      )}
    </>
  );
}
