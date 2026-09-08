import { Moon, Search, Bookmark, ShieldCheck } from "lucide-react";

export function Nav({ query, setQuery, goHome, bookmarkCount, onOpenDrawer, user, onGoLogin, onGoAdmin, onLogout }) {
  return (
    <nav className="nav">
      <button className="logo" onClick={goHome}>
        <Moon size={22} className="logo-mark" fill="currentColor" />
        <span className="logo-text">NightComic</span>
      </button>
      <div className="search-wrap">
        <Search size={15} />
        <input
          placeholder="جستجوی عنوان..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="nav-spacer" />
      <div className="nav-links">
        <button className="icon-btn" onClick={onOpenDrawer} aria-label="لیست من">
          <Bookmark size={16} />
          {bookmarkCount > 0 && <span className="bookmark-count">{bookmarkCount}</span>}
        </button>

        {user?.role === "admin" && (
          <button className="icon-btn" onClick={onGoAdmin} aria-label="پنل ادمین" title="پنل ادمین">
            <ShieldCheck size={16} />
          </button>
        )}

        {user ? (
          <div className="nav-user">
            <span>{user.username}</span>
            <button className="nav-link-btn" onClick={onLogout}>
              خروج
            </button>
          </div>
        ) : (
          <button className="nav-link-btn" onClick={onGoLogin}>
            ورود
          </button>
        )}
      </div>
    </nav>
  );
}
