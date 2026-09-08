import { X } from "lucide-react";
import { Cover } from "./Cover.jsx";

export function BookmarksDrawer({ open, onClose, bookmarks, series, onOpen }) {
  if (!open) return null;
  const list = series.filter((m) => bookmarks.includes(m.id));
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>لیست من</h2>
          <button className="icon-btn" onClick={onClose} aria-label="بستن">
            <X size={18} />
          </button>
        </div>
        {list.length === 0 ? (
          <p className="muted" style={{ padding: "0 20px 20px" }}>
            برای دسترسی سریع، یه سری رو به لیستت اضافه کن.
          </p>
        ) : (
          <div className="drawer-list">
            {list.map((m) => (
              <button
                key={m.id}
                className="drawer-item"
                onClick={() => {
                  onOpen(m.id);
                  onClose();
                }}
              >
                <div className="drawer-cover">
                  <Cover manga={m} size="sm" />
                </div>
                <div>
                  <div className="drawer-item-title">{m.title}</div>
                  <div className="muted" style={{ fontSize: "0.8rem" }}>
                    فصل {m.chapters[0]?.number ?? "—"} · {m.status}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
