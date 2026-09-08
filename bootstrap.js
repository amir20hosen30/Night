// Seeds a fresh database with sample series so the site isn't empty on first run.
// All of this is placeholder/demo content — replace or delete it from the admin panel.

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

function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const RAW_SERIES = [
  { id: "moonlit-fangs", title: "Moonlit Fangs", author: "R. Amano", genres: ["اکشن", "فانتزی", "ترسناک"], status: "در حال انتشار", rating: 4.8, hue: 262, synopsis: "روستایی که زیر یه نفرین قدیمی گیر افتاده، یه شکارچی دوره‌گرد استخدام می‌کنه؛ غافل از اینکه خون خودِ شکارچی هم آلوده‌ست.", chapterCount: 64, startDaysAgo: 1 },
  { id: "paper-constellations", title: "Paper Constellations", author: "Y. Kessler", genres: ["عاشقانه", "درام"], status: "در حال انتشار", rating: 4.6, hue: 328, synopsis: "دو رئیس رقیبِ باشگاه اوریگامی شروع می‌کنن به رد و بدل کردن یادداشت‌های ناشناس، بدون اینکه بدونن یک سال تمام با هم روبروی هم بحث می‌کردن.", chapterCount: 31, startDaysAgo: 2 },
  { id: "last-cartographer", title: "The Last Cartographer", author: "D. Osei", genres: ["فانتزی", "رازآلود"], status: "در حال انتشار", rating: 4.9, hue: 178, synopsis: "یک قرن پیش دنیا از تغییر شکل دادن دست کشید. آخرین نقشه‌کشی که دلیلش رو یادشه، داره کاغذش تموم می‌شه.", chapterCount: 88, startDaysAgo: 0 },
  { id: "static-hearts", title: "Static Hearts", author: "L. Marchetti", genres: ["علمی-تخیلی", "عاشقانه"], status: "تکمیل شده", rating: 4.5, hue: 205, synopsis: "آندرویدی که ساخته شده تا صاحب‌هاش رو فراموش کنه، عاشق تکنسینی می‌شه که برای نهمین بار اومده حافظه‌شو پاک کنه.", chapterCount: 42, startDaysAgo: 40 },
  { id: "ninth-hour-diner", title: "Ninth Hour Diner", author: "T. Basara", genres: ["زندگی روزمره", "کمدی"], status: "در حال انتشار", rating: 4.4, hue: 38, synopsis: "رستورانی که فقط بین نیمه‌شب تا یک بامداد بازه، دقیقاً همون مشتری‌هایی رو جذب می‌کنه که باید.", chapterCount: 19, startDaysAgo: 3 },
  { id: "crownless", title: "Crownless", author: "H. Voss", genres: ["اکشن", "درام"], status: "در حال انتشار", rating: 4.7, hue: 12, synopsis: "وارث تاج و تخت مرگ خودشو جعل می‌کنه تا زیر نظر همون شورشی‌هایی آموزش ببینه که قسم خوردن نسلشو ریشه‌کن کنن.", chapterCount: 55, startDaysAgo: 1 },
  { id: "glass-orchard", title: "Glass Orchard", author: "N. Ferreira", genres: ["رازآلود", "درام"], status: "در حال انتشار", rating: 4.3, hue: 150, synopsis: "هر درخت توی این باغ از یه راز دفن‌شده روییده. باغبون تازه باید یاد بگیره این حرف چقدر واقعیه.", chapterCount: 24, startDaysAgo: 5 },
  { id: "wolftide", title: "Wolftide", author: "K. Sundberg", genres: ["فانتزی", "اکشن"], status: "در حال انتشار", rating: 4.6, hue: 220, synopsis: "یک بار در ماه، به جای آب، جزر و مد گرگ میاره. یه دهکده‌ی ماهیگیری یاد گرفته به‌جاش گرگ صید کنه.", chapterCount: 37, startDaysAgo: 2 },
  { id: "echoes-of-recess", title: "Echoes of Recess", author: "M. Iida", genres: ["کمدی", "زندگی روزمره"], status: "تکمیل شده", rating: 4.2, hue: 48, synopsis: "یه قهرمان سابق زنگ تفریح، این‌بار به عنوان معلم جانشین برمی‌گرده به همون سیاست‌های کلاس چهارمی.", chapterCount: 16, startDaysAgo: 90 },
  { id: "iron-bloom", title: "Iron Bloom", author: "P. Adeyemi", genres: ["ورزشی", "درام"], status: "در حال انتشار", rating: 4.8, hue: 350, synopsis: "یه پروتز شمشیربازی کنار گذاشته‌شده و یه ورزشکار محروم از مسابقه، تنها یه فرصت غیررسمی برای قهرمانی دارن.", chapterCount: 29, startDaysAgo: 4 },
  { id: "cicada-room", title: "The Cicada Room", author: "S. Whitlock", genres: ["ترسناک", "رازآلود"], status: "در حال انتشار", rating: 4.7, hue: 95, synopsis: "همین که وارد اتاق بشی صدا قطع می‌شه. هرکی رفته بفهمه چرا، موندگار شده که سکوتشو حفظ کنه.", chapterCount: 21, startDaysAgo: 6 },
  { id: "neon-requiem", title: "Neon Requiem", author: "F. Castellano", genres: ["علمی-تخیلی", "اکشن"], status: "در حال انتشار", rating: 4.5, hue: 285, synopsis: "توی شهری که با خاطرات قرضی می‌چرخه، یه مأمور وصول قرض شروع می‌کنه به پس‌گرفتن خاطرات اشتباهی.", chapterCount: 46, startDaysAgo: 3 },
  { id: "sundial-letters", title: "Sundial Letters", author: "A. Novak", genres: ["عاشقانه", "زندگی روزمره"], status: "در حال انتشار", rating: 4.4, hue: 25, synopsis: "مکاتبه‌ی دو نگهبان فانوس دریایی معلوم می‌شه یازده سال با تأخیر به دست هم می‌رسه، نامه به نامه.", chapterCount: 27, startDaysAgo: 7 },
  { id: "hollow-meridian", title: "Hollow Meridian", author: "C. Renwick", genres: ["فانتزی", "رازآلود"], status: "در حال انتشار", rating: 4.9, hue: 240, synopsis: "همه‌ی نقشه‌ها می‌گن کوه خالیه. قطب‌نمای نقشه‌بردار اصرار داره یه قله‌ی دومم داخلشه.", chapterCount: 71, startDaysAgo: 1 },
];

export function freshDb() {
  return {
    users: [],
    works: [],
    chapters: [],
    pages: [],
    favorites: [],
    seq: { users: 1, works: 1, chapters: 1, pages: 1 },
  };
}

export function seedDb(db, next) {
  for (const s of RAW_SERIES) {
    const work = {
      id: next("works"),
      slug: s.id,
      title: s.title,
      author: s.author,
      genres: s.genres,
      status: s.status,
      rating: s.rating,
      hue: s.hue,
      synopsis: s.synopsis,
      cover: "",
      created_at: daysAgoIso(s.startDaysAgo + 30),
    };
    db.works.push(work);

    for (let i = s.chapterCount; i >= 1; i--) {
      const daysAgo = s.startDaysAgo + (s.chapterCount - i) * 6;
      db.chapters.push({
        id: next("chapters"),
        work_id: work.id,
        number: i,
        title: "",
        created_at: daysAgoIso(daysAgo),
      });
    }
  }
  return db;
}
