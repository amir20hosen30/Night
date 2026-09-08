import { useEffect, useState, useCallback } from "react";
import { Nav } from "./Nav.jsx";
import { BookmarksDrawer } from "./BookmarksDrawer.jsx";
import { HomeView } from "./HomeView.jsx";
import { DetailView } from "./DetailView.jsx";
import { ReaderView } from "./ReaderView.jsx";
import { LoginView } from "./LoginView.jsx";
import { RegisterView } from "./RegisterView.jsx";
import { AdminView } from "./AdminView.jsx";
import { api } from "./api.js";

export default function App() {
  const [view, setView] = useState({ page: "home" });
  const [query, setQuery] = useState("");
  const [activeGenres, setActiveGenres] = useState([]);
  const [statusFilter, setStatusFilter] = useState("همه");
  const [sort, setSort] = useState("trending");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);

  const refreshSeries = useCallback(() => {
    api.getWorks().then(setSeries).catch(() => setSeries([]));
  }, []);

  useEffect(() => {
    refreshSeries();
    api
      .me()
      .then(({ user, favorites }) => {
        setUser(user);
        setBookmarks(favorites || []);
      })
      .finally(() => setLoading(false));
  }, [refreshSeries]);

  const toggleGenre = (g) =>
    setActiveGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const toggleBookmark = async (id) => {
    if (!user) {
      setView({ page: "login" });
      return;
    }
    setBookmarks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    try {
      await api.toggleFavorite(id);
    } catch {
      // revert on failure
      setBookmarks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }
  };

  const openManga = (id) => {
    setView({ page: "detail", mangaId: id });
    window.scrollTo?.({ top: 0 });
  };
  const openChapter = (chapterNum) => {
    setView((v) => ({ page: "reader", mangaId: v.mangaId, chapterNum }));
    window.scrollTo?.({ top: 0 });
  };
  const goHome = () => {
    setView({ page: "home" });
    setQuery("");
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setBookmarks([]);
    goHome();
  };

  const currentManga =
    view.page === "detail" || view.page === "reader"
      ? series.find((m) => m.id === view.mangaId)
      : null;

  return (
    <div className="app" dir="rtl" lang="fa">
      <Nav
        query={query}
        setQuery={(v) => {
          setQuery(v);
          if (view.page !== "home") setView({ page: "home" });
        }}
        goHome={goHome}
        bookmarkCount={bookmarks.length}
        onOpenDrawer={() => setDrawerOpen(true)}
        user={user}
        onGoLogin={() => setView({ page: "login" })}
        onGoAdmin={() => setView({ page: "admin" })}
        onLogout={handleLogout}
      />

      <div className="container">
        {loading && <div className="empty">در حال بارگذاری...</div>}

        {!loading && view.page === "home" && (
          <HomeView
            series={series}
            query={query}
            activeGenres={activeGenres}
            toggleGenre={toggleGenre}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sort={sort}
            setSort={setSort}
            onOpen={openManga}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
          />
        )}

        {!loading && view.page === "detail" && currentManga && (
          <DetailView
            manga={currentManga}
            onBack={goHome}
            onOpenChapter={openChapter}
            bookmarked={bookmarks.includes(currentManga.id)}
            onToggleBookmark={toggleBookmark}
          />
        )}

        {!loading && view.page === "reader" && currentManga && (
          <ReaderView
            manga={currentManga}
            chapterNum={view.chapterNum}
            onBack={() => setView({ page: "detail", mangaId: currentManga.id })}
            onChangeChapter={openChapter}
          />
        )}

        {view.page === "login" && (
          <LoginView
            onLoggedIn={(u) => {
              setUser(u);
              api.me().then(({ favorites }) => setBookmarks(favorites || []));
              goHome();
            }}
            onGoRegister={() => setView({ page: "register" })}
          />
        )}

        {view.page === "register" && (
          <RegisterView
            onRegistered={(u) => {
              setUser(u);
              goHome();
            }}
            onGoLogin={() => setView({ page: "login" })}
          />
        )}

        {view.page === "admin" && user?.role === "admin" && (
          <AdminView series={series} refreshSeries={refreshSeries} />
        )}
        {view.page === "admin" && user?.role !== "admin" && (
          <div className="empty">
            <p>این بخش فقط برای ادمین‌هاست.</p>
          </div>
        )}

        <div className="footer">NightComic — یک کاتالوگ نمایشی، متصل به بک‌اند خودش.</div>
      </div>

      <BookmarksDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        bookmarks={bookmarks}
        series={series}
        onOpen={openManga}
      />
    </div>
  );
}
