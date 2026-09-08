import { useEffect, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { api } from "./api.js";
import { Cover, GENRES } from "./Cover.jsx";

function WorkForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genres, setGenres] = useState([]);
  const [status, setStatus] = useState("در حال انتشار");
  const [rating, setRating] = useState("4.5");
  const [synopsis, setSynopsis] = useState("");
  const [cover, setCover] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const toggleGenre = (g) =>
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("author", author);
      fd.append("genres", JSON.stringify(genres));
      fd.append("status", status);
      fd.append("rating", rating);
      fd.append("synopsis", synopsis);
      fd.append("hue", String(Math.floor(Math.random() * 360)));
      if (cover) fd.append("cover", cover);
      const work = await api.adminCreateWork(fd);
      onCreated(work);
      setTitle("");
      setAuthor("");
      setGenres([]);
      setSynopsis("");
      setCover(null);
      e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-panel" onSubmit={submit}>
      <h2>افزودن سری جدید</h2>
      {error && <div className="form-error">{error}</div>}
      <div className="form-field">
        <label>عنوان</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="form-field">
        <label>نویسنده</label>
        <input value={author} onChange={(e) => setAuthor(e.target.value)} required />
      </div>
      <div className="form-field">
        <label>ژانرها</label>
        <div className="admin-genre-picker">
          {GENRES.map((g) => (
            <button
              type="button"
              key={g}
              className={`chip ${genres.includes(g) ? "chip-active" : ""}`}
              onClick={() => toggleGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="form-field">
        <label>وضعیت</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>در حال انتشار</option>
          <option>تکمیل شده</option>
        </select>
      </div>
      <div className="form-field">
        <label>امتیاز (۱ تا ۵)</label>
        <input type="number" step="0.1" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} />
      </div>
      <div className="form-field">
        <label>خلاصه داستان</label>
        <textarea value={synopsis} onChange={(e) => setSynopsis(e.target.value)} />
      </div>
      <div className="form-field">
        <label>تصویر جلد (اختیاری — در غیر این‌صورت جلد گرادیانی خودکار ساخته می‌شه)</label>
        <input type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] || null)} />
      </div>
      <button className="btn-primary" type="submit" disabled={busy}>
        {busy ? "در حال ذخیره..." : "افزودن سری"}
      </button>
    </form>
  );
}

function ChapterManager({ work, onChanged }) {
  const [number, setNumber] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploadFiles, setUploadFiles] = useState({}); // chapterId -> FileList

  const addChapter = async (e) => {
    e.preventDefault();
    setError("");
    if (!number) return;
    setBusy(true);
    try {
      await api.adminCreateChapter(work.id, number, chapterTitle);
      setNumber("");
      setChapterTitle("");
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteChapter = async (id) => {
    if (!confirm("این فصل حذف بشه؟")) return;
    await api.adminDeleteChapter(id);
    onChanged();
  };

  const uploadPages = async (chapterId) => {
    const files = uploadFiles[chapterId];
    if (!files || files.length === 0) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("pages", f));
    setBusy(true);
    try {
      await api.adminUploadPages(work.id, chapterId, fd);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-panel">
      <h2>فصل‌های «{work.title}»</h2>
      {error && <div className="form-error">{error}</div>}
      <form className="admin-chapter-form" onSubmit={addChapter}>
        <div className="form-field">
          <label>شماره فصل</label>
          <input type="number" value={number} onChange={(e) => setNumber(e.target.value)} required />
        </div>
        <div className="form-field">
          <label>عنوان فصل (اختیاری)</label>
          <input value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} />
        </div>
        <button className="btn-primary" type="submit" disabled={busy}>
          افزودن
        </button>
      </form>

      <div className="admin-chapter-list">
        {work.chapters.map((c) => (
          <div key={c.id} className="admin-chapter-row">
            <span className="admin-chapter-row-num">فصل {c.number}</span>
            <span className="admin-chapter-row-info">{c.title || "—"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ maxWidth: 150, fontSize: "0.7rem" }}
              onChange={(e) => setUploadFiles((prev) => ({ ...prev, [c.id]: e.target.files }))}
            />
            <button className="icon-btn" title="آپلود صفحات" onClick={() => uploadPages(c.id)}>
              <Upload size={14} />
            </button>
            <button className="icon-btn" title="حذف فصل" onClick={() => deleteChapter(c.id)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <p className="file-hint">صفحات رو به ترتیب نمایش انتخاب کن؛ آپلود جدید صفحات قبلیِ همون فصل رو جایگزین می‌کنه.</p>
    </div>
  );
}

export function AdminView({ series, refreshSeries }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = series.find((w) => w.id === selectedId) || null;

  useEffect(() => {
    if (!selectedId && series.length > 0) setSelectedId(series[0].id);
  }, [series, selectedId]);

  const deleteWork = async (id) => {
    if (!confirm("این سری و همه‌ی فصل‌هاش برای همیشه حذف بشه؟")) return;
    await api.adminDeleteWork(id);
    if (selectedId === id) setSelectedId(null);
    refreshSeries();
  };

  return (
    <div className="admin-page">
      <h1>پنل ادمین</h1>
      <span className="muted">افزودن سری، مدیریت فصل‌ها و آپلود تصاویر.</span>

      <div className="admin-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <WorkForm onCreated={refreshSeries} />

          <div className="admin-panel">
            <h2>سری‌های موجود</h2>
            <div className="admin-work-list">
              {series.map((w) => (
                <div key={w.id} className="admin-work-row">
                  <Cover manga={w} size="sm" />
                  <div className="admin-work-row-info">
                    <div className="admin-work-row-title">{w.title}</div>
                    <div className="admin-work-row-meta">
                      {w.chapters.length} فصل · {w.status}
                    </div>
                  </div>
                  <div className="admin-work-row-actions">
                    <button className="btn-ghost" onClick={() => setSelectedId(w.id)}>
                      مدیریت فصل‌ها
                    </button>
                    <button className="btn-danger" onClick={() => deleteWork(w.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>{selected && <ChapterManager work={selected} onChanged={refreshSeries} />}</div>
      </div>
    </div>
  );
}
