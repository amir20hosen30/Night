import express from "express";
import session from "express-session";
import multer from "multer";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { freshDb, seedDb, GENRES } from "./bootstrap.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(ROOT, "storage");
const DATA_FILE = path.join(STORAGE_DIR, "data", "db.json");
const UPLOADS_DIR = path.join(STORAGE_DIR, "uploads");
const COVERS_DIR = path.join(UPLOADS_DIR, "covers");
const CHAPTERS_DIR = path.join(UPLOADS_DIR, "chapters");
const DIST_DIR = path.join(ROOT, "dist");
const PORT = process.env.PORT || 8080;

for (const dir of [path.join(STORAGE_DIR, "data"), COVERS_DIR, CHAPTERS_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

// ---------- tiny JSON "database" ----------
function loadDb() {
  if (!fs.existsSync(DATA_FILE)) {
    const db = freshDb();
    seedDb(db, next(db));
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    return db;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function next(db) {
  return (table) => db.seq[table]++;
}

let db = loadDb();
let saveTimer = null;
function saveDb() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  }, 50);
}

// ---------- bootstrap admin user from env ----------
async function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  if (!db.users.find((u) => u.role === "admin")) {
    const hash = await bcrypt.hash(password, 10);
    db.users.push({
      id: next(db)("users"),
      username,
      password: hash,
      role: "admin",
      created_at: new Date().toISOString(),
    });
    saveDb();
    console.log(`Admin account ready → username: "${username}" (see ADMIN_USERNAME/ADMIN_PASSWORD env vars)`);
  }
}
await ensureAdmin();

// ---------- app setup ----------
const app = express();
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "nightcomic-dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 },
  })
);
app.use("/uploads", express.static(UPLOADS_DIR));

// ---------- upload handling ----------
const coverUpload = multer({
  storage: multer.diskStorage({
    destination: COVERS_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const chapterUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(CHAPTERS_DIR, req.params.workId, req.params.chapterId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${String(file.fieldIndex ?? 0).padStart(3, "0")}${ext}`);
    },
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
});

// ---------- auth helpers ----------
function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: "لازمه وارد حساب کاربری بشی." });
  next();
}
function requireAdmin(req, res, next) {
  const user = db.users.find((u) => u.id === req.session.userId);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "دسترسی ادمین لازمه." });
  next();
}
function publicUser(u) {
  if (!u) return null;
  return { id: u.id, username: u.username, role: u.role };
}

// ---------- auth routes ----------
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: "نام کاربری و رمز عبور (حداقل ۶ کاراکتر) لازمه." });
  }
  if (db.users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(409).json({ error: "این نام کاربری قبلاً ثبت شده." });
  }
  const hash = await bcrypt.hash(password, 10);
  const user = {
    id: next(db)("users"),
    username,
    password: hash,
    role: "user",
    created_at: new Date().toISOString(),
  };
  db.users.push(user);
  saveDb();
  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  const user = db.users.find((u) => u.username.toLowerCase() === (username || "").toLowerCase());
  if (!user || !(await bcrypt.compare(password || "", user.password))) {
    return res.status(401).json({ error: "نام کاربری یا رمز عبور اشتباهه." });
  }
  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", (req, res) => {
  const user = db.users.find((u) => u.id === req.session.userId);
  const favorites = user ? db.favorites.filter((f) => f.user_id === user.id).map((f) => f.work_id) : [];
  res.json({ user: publicUser(user), favorites });
});

// ---------- public work/chapter routes ----------
function chapterSummaries(workId) {
  return db.chapters
    .filter((c) => c.work_id === workId)
    .sort((a, b) => b.number - a.number)
    .map((c) => ({ id: c.id, number: c.number, title: c.title, created_at: c.created_at }));
}

app.get("/api/works", (req, res) => {
  res.json(
    db.works
      .slice()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((w) => ({ ...w, chapters: chapterSummaries(w.id) }))
  );
});

app.get("/api/works/:id", (req, res) => {
  const work = db.works.find((w) => String(w.id) === req.params.id || w.slug === req.params.id);
  if (!work) return res.status(404).json({ error: "این سری پیدا نشد." });
  res.json({ ...work, chapters: chapterSummaries(work.id) });
});

app.get("/api/chapters/:chapterId/pages", (req, res) => {
  const chapter = db.chapters.find((c) => String(c.id) === req.params.chapterId);
  if (!chapter) return res.status(404).json({ error: "این فصل پیدا نشد." });
  const pages = db.pages
    .filter((p) => p.chapter_id === chapter.id)
    .sort((a, b) => a.page_no - b.page_no)
    .map((p) => p.image);
  res.json({ chapter, pages });
});

app.get("/api/genres", (req, res) => res.json(GENRES));

// ---------- favorites ----------
app.post("/api/works/:id/favorite", requireAuth, (req, res) => {
  const workId = Number(req.params.id);
  const existing = db.favorites.find((f) => f.user_id === req.session.userId && f.work_id === workId);
  if (existing) {
    db.favorites = db.favorites.filter((f) => f !== existing);
  } else {
    db.favorites.push({ user_id: req.session.userId, work_id: workId });
  }
  saveDb();
  res.json({ favorited: !existing });
});

// ---------- admin: works ----------
app.post("/api/admin/works", requireAuth, requireAdmin, coverUpload.single("cover"), (req, res) => {
  const { title, author, genres, status, rating, hue, synopsis } = req.body;
  if (!title || !author) return res.status(400).json({ error: "عنوان و نویسنده لازمه." });
  const work = {
    id: next(db)("works"),
    slug: title.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 60) + "-" + Date.now().toString(36),
    title,
    author,
    genres: genres ? JSON.parse(genres) : [],
    status: status || "در حال انتشار",
    rating: Number(rating) || 4.5,
    hue: Number(hue) || Math.floor(Math.random() * 360),
    synopsis: synopsis || "",
    cover: req.file ? `/uploads/covers/${req.file.filename}` : "",
    created_at: new Date().toISOString(),
  };
  db.works.push(work);
  saveDb();
  res.json(work);
});

app.put("/api/admin/works/:id", requireAuth, requireAdmin, coverUpload.single("cover"), (req, res) => {
  const work = db.works.find((w) => w.id === Number(req.params.id));
  if (!work) return res.status(404).json({ error: "این سری پیدا نشد." });
  const { title, author, genres, status, rating, hue, synopsis } = req.body;
  if (title) work.title = title;
  if (author) work.author = author;
  if (genres) work.genres = JSON.parse(genres);
  if (status) work.status = status;
  if (rating) work.rating = Number(rating);
  if (hue) work.hue = Number(hue);
  if (synopsis !== undefined) work.synopsis = synopsis;
  if (req.file) work.cover = `/uploads/covers/${req.file.filename}`;
  saveDb();
  res.json(work);
});

app.delete("/api/admin/works/:id", requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const chapterIds = db.chapters.filter((c) => c.work_id === id).map((c) => c.id);
  db.works = db.works.filter((w) => w.id !== id);
  db.chapters = db.chapters.filter((c) => c.work_id !== id);
  db.pages = db.pages.filter((p) => !chapterIds.includes(p.chapter_id));
  db.favorites = db.favorites.filter((f) => f.work_id !== id);
  saveDb();
  res.json({ ok: true });
});

// ---------- admin: chapters ----------
app.post("/api/admin/works/:workId/chapters", requireAuth, requireAdmin, (req, res) => {
  const workId = Number(req.params.workId);
  const work = db.works.find((w) => w.id === workId);
  if (!work) return res.status(404).json({ error: "این سری پیدا نشد." });
  const { number, title } = req.body;
  const chapter = {
    id: next(db)("chapters"),
    work_id: workId,
    number: Number(number),
    title: title || "",
    created_at: new Date().toISOString(),
  };
  db.chapters.push(chapter);
  saveDb();
  res.json(chapter);
});

app.delete("/api/admin/chapters/:id", requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  db.chapters = db.chapters.filter((c) => c.id !== id);
  db.pages = db.pages.filter((p) => p.chapter_id !== id);
  saveDb();
  res.json({ ok: true });
});

// custom multer middleware that tags each file with its array index for ordered filenames
function orderedImages(req, res, next) {
  const upload = chapterUpload.array("pages", 300);
  upload(req, res, next);
}
app.post(
  "/api/admin/works/:workId/chapters/:chapterId/pages",
  requireAuth,
  requireAdmin,
  orderedImages,
  (req, res) => {
    const chapterId = Number(req.params.chapterId);
    const chapter = db.chapters.find((c) => c.id === chapterId);
    if (!chapter) return res.status(404).json({ error: "این فصل پیدا نشد." });
    db.pages = db.pages.filter((p) => p.chapter_id !== chapterId); // replace existing pages
    (req.files || []).forEach((file, i) => {
      db.pages.push({
        id: next(db)("pages"),
        chapter_id: chapterId,
        page_no: i + 1,
        image: `/uploads/chapters/${req.params.workId}/${req.params.chapterId}/${file.filename}`,
      });
    });
    saveDb();
    res.json({ ok: true, count: (req.files || []).length });
  }
);

// ---------- serve built frontend ----------
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send(
      "NightComic API در حال اجراست. برای دیدن رابط کاربری، اول «npm run build» رو اجرا کن یا در حالت توسعه «npm run dev» رو اجرا کن (پورت 5173)."
    );
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "خطای سرور." });
});

app.listen(PORT, () => {
  console.log(`NightComic server listening on http://localhost:${PORT}`);
});
