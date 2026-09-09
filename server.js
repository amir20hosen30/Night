const express=require('express'),session=require('express-session'),path=require('path'),fs=require('fs');
const bcrypt=require('bcryptjs'),multer=require('multer'),AdmZip=require('adm-zip');
require('./bootstrap')();
const app=express(),PORT=process.env.PORT||8080,ROOT=__dirname;
const STORAGE_DIR=process.env.STORAGE_DIR||path.join(ROOT,'storage');
const DATA_DIR=path.join(STORAGE_DIR,'data'),DATA_FILE=path.join(DATA_DIR,'db.json');
const UPLOADS_DIR=path.join(STORAGE_DIR,'uploads');
fs.mkdirSync(DATA_DIR,{recursive:true});
fs.mkdirSync(path.join(UPLOADS_DIR,'covers'),{recursive:true});
fs.mkdirSync(path.join(UPLOADS_DIR,'chapters'),{recursive:true});
fs.mkdirSync(path.join(UPLOADS_DIR,'avatars'),{recursive:true});
fs.mkdirSync(path.join(UPLOADS_DIR,'tickets'),{recursive:true});
const TICKET_DEPARTMENTS=['پشتیبانی فنی','مالی و پرداخت','انسداد حساب','گزارش خطا','پیشنهاد و انتقاد','سایر'];
function fresh(){return {users:[],works:[],chapters:[],pages:[],favorites:[],history:[],comments:[],ratings:[],donations:[],tickets:[],seq:{users:1,works:1,chapters:1,pages:1,comments:1,ratings:1,donations:1,tickets:1}}}
let db;
try{db=fs.existsSync(DATA_FILE)?JSON.parse(fs.readFileSync(DATA_FILE,'utf8')):fresh()}catch{db=fresh()}
for(const k of ['users','works','chapters','pages','favorites','history','comments','ratings','donations','tickets'])if(!Array.isArray(db[k]))db[k]=[];
if(!db.seq)db.seq={users:1,works:1,chapters:1,pages:1,comments:1,ratings:1,donations:1,tickets:1};
for(const k of ['comments','ratings','donations','tickets'])if(!db.seq[k])db.seq[k]=1;
// migrate legacy single message/reply tickets into a threaded messages[] shape
for(const t of db.tickets){
  if(!Array.isArray(t.messages)){
    t.messages=[];
    if(t.message)t.messages.push({from:'user',text:t.message,at:t.created_at||new Date().toISOString()});
    if(t.reply)t.messages.push({from:'admin',text:t.reply,at:t.updated_at||t.created_at||new Date().toISOString()});
  }
  if(t.admin_seen===undefined)t.admin_seen=false;
  if(t.user_unread===undefined)t.user_unread=false;
}
function save(){fs.writeFileSync(DATA_FILE,JSON.stringify(db,null,2),'utf8')}
function next(k){const n=db.seq[k]||1;db.seq[k]=n+1;return n}
if(!db.users.some(u=>u.role==='admin') && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD){
  if(String(process.env.ADMIN_PASSWORD).length<8) throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  db.users.push({id:next('users'),username:String(process.env.ADMIN_USERNAME),password:bcrypt.hashSync(String(process.env.ADMIN_PASSWORD),12),role:'admin',avatar:'',created_at:new Date().toISOString()});
  save();
}
app.use(express.json());app.use(express.urlencoded({extended:true}));

// --- SEO / Google indexing ---
function publicBase(req){
  const configured=String(process.env.PUBLIC_URL||'').trim().replace(/\/+$/,'');
  if(configured) return configured;
  const proto=(req.headers['x-forwarded-proto']||req.protocol||'https').split(',')[0].trim();
  return `${proto}://${req.get('host')}`;
}
function xmlEscape(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
app.get('/robots.txt',(req,res)=>{
  const base=publicBase(req);
  res.type('text/plain').send(
`User-agent: *
Allow: /
Allow: /home
Allow: /novel/
Disallow: /admin
Disallow: /manager
Disallow: /login
Disallow: /reader/
Disallow: /api/
Disallow: /uploads/avatars/

Sitemap: ${base}/sitemap.xml
`);
});
app.get('/sitemap.xml',(req,res)=>{
  const base=publicBase(req);
  const urls=[`${base}/home`];
  for(const w of db.works||[]) urls.push(`${base}/novel/${encodeURIComponent(w.id)}`);
  const body=urls.map(u=>`  <url><loc>${xmlEscape(u)}</loc></url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`);
});
app.set('trust proxy',1);
app.use(session({secret:process.env.SESSION_SECRET||'nightcomic-local-only-change-me',resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:1000*60*60*24*30}}));
const user=req=>req.session.user||null;
app.use(express.static(path.join(ROOT,'public'),{index:false}));app.use('/uploads',express.static(UPLOADS_DIR,{maxAge:'7d'}));
const auth=(req,res,next)=>{if(!user(req))return res.status(401).json({error:'ورود لازم است'});next()};
const admin=(req,res,next)=>{if(!user(req)||user(req).role!=='admin')return res.status(403).json({error:'دسترسی مدیر لازم است'});next()};
const slugSafe=s=>String(s).replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g,'_').slice(0,80);
const storage=(folder)=>multer.diskStorage({destination:(req,file,cb)=>cb(null,path.join(UPLOADS_DIR,folder)),filename:(req,file,cb)=>cb(null,Date.now()+'-'+slugSafe(file.originalname))});
const uploadCover=multer({storage:storage('covers'),limits:{fileSize:8*1024*1024},fileFilter:(r,f,c)=>c(null,/^image\//.test(f.mimetype)||/\.(jpe?g|png|webp|gif|avif)$/i.test(f.originalname))});
const uploadAvatar=multer({storage:storage('avatars'),limits:{fileSize:5*1024*1024},fileFilter:(r,f,c)=>c(null,/^image\//.test(f.mimetype)||/\.(jpe?g|png|webp|gif)$/i.test(f.originalname))});
const uploadPages=multer({storage:storage('chapters'),limits:{fileSize:15*1024*1024,files:1001},fileFilter:(r,f,c)=>c(null,/^image\//.test(f.mimetype)||/\.(jpe?g|png|webp|gif|avif)$/i.test(f.originalname))});
const uploadChapter=multer({storage:storage('chapters'),limits:{fileSize:15*1024*1024,files:1001},fileFilter:(r,f,c)=>{if(f.fieldname==='zip')return c(null,/zip|compressed/i.test(f.mimetype)||/\.zip$/i.test(f.originalname));return c(null,/^image\//.test(f.mimetype))}});
const uploadTicketFile=multer({storage:storage('tickets'),limits:{fileSize:10*1024*1024},fileFilter:(r,f,c)=>c(null,/^image\//.test(f.mimetype)||/\.(jpe?g|png|webp|gif|pdf|zip|rar|7z|txt|docx?|xlsx?)$/i.test(f.originalname))});
const imageExt=/\.(jpe?g|png|webp|gif|avif)$/i;
function withCount(w){
  const ratings=db.ratings.filter(r=>r.work_id===w.id);
  const avg=ratings.length?ratings.reduce((a,r)=>a+r.value,0)/ratings.length:0;
  return {...w,
    chapter_count:db.chapters.filter(c=>c.work_id===w.id).length,
    rating_count:ratings.length,
    rating_avg:+avg.toFixed(1),
    favorite_count:db.favorites.filter(f=>f.work_id===w.id).length,
    views:w.views||0
  }
}
app.get('/health',(req,res)=>res.status(200).json({ok:true,service:'nightcomic',timestamp:new Date().toISOString()}));
app.get('/api/health',(req,res)=>res.status(200).json({ok:true}));
app.get('/api/me',(req,res)=>{const sess=user(req);if(!sess)return res.json({user:null});const u=db.users.find(x=>x.id===sess.id);if(u){sess.avatar=u.avatar||'';sess.preferences=u.preferences||{}}res.json({user:sess})});
app.patch('/api/me/preferences',auth,(req,res)=>{const u=db.users.find(x=>x.id===user(req).id);if(!u)return res.status(404).json({error:'کاربر پیدا نشد'});const incoming=req.body&&typeof req.body==='object'?req.body:{};const allowed=['ticketNotifications','siteNotifications','autoSaveProgress','imageQuality','readerWidth','showStats','newChapterAlerts','readingDirection','preloadNextChapter','matureContentWarning'];u.preferences={...(u.preferences||{})};for(const k of allowed){if(Object.prototype.hasOwnProperty.call(incoming,k))u.preferences[k]=incoming[k]}save();req.session.user.preferences=u.preferences;res.json({preferences:u.preferences})});
app.post('/api/register',(req,res)=>{const username=String(req.body?.username||'').trim(),password=String(req.body?.password||'');if(username.length<3||password.length<6)return res.status(400).json({error:'نام کاربری و رمز عبور معتبر لازم است (نام کاربری حداقل ۳ و رمز حداقل ۶ کاراکتر).'});if(db.users.some(u=>String(u.username).toLowerCase()===username.toLowerCase()))return res.status(409).json({error:'این نام کاربری قبلاً ثبت شده است.'});const u={id:next('users'),username,password:bcrypt.hashSync(password,10),role:'user',avatar:'',created_at:new Date().toISOString()};db.users.push(u);save();req.session.user={id:u.id,username:u.username,role:u.role,avatar:''};res.json({user:req.session.user})});
app.post('/api/login',(req,res)=>{const username=String(req.body?.username||'').trim(),password=String(req.body?.password||'');const r=db.users.find(u=>String(u.username).toLowerCase()===username.toLowerCase());if(!r||!bcrypt.compareSync(password,r.password))return res.status(401).json({error:'نام کاربری یا رمز عبور اشتباه است'});req.session.user={id:r.id,username:r.username,role:r.role,avatar:r.avatar||''};res.json({user:req.session.user})});
app.post('/api/logout',(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.post('/api/profile/avatar',auth,uploadAvatar.single('avatar'),(req,res)=>{if(!req.file)return res.status(400).json({error:'یک تصویر معتبر انتخاب کنید.'});const u=db.users.find(x=>x.id===user(req).id);if(!u)return res.status(404).json({error:'کاربر پیدا نشد'});if(u.avatar&&u.avatar.startsWith('/uploads/avatars/')){try{fs.unlinkSync(path.join(STORAGE_DIR,u.avatar.replace(/^\/uploads\//,'')))}catch{}}u.avatar='/uploads/avatars/'+req.file.filename;req.session.user.avatar=u.avatar;save();res.json({user:req.session.user})});
app.patch('/api/me/password',auth,(req,res)=>{const u=db.users.find(x=>x.id===user(req).id);if(!u)return res.status(404).json({error:'کاربر پیدا نشد'});const current=String(req.body?.current||''),next=String(req.body?.next||'');if(next.length<6)return res.status(400).json({error:'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.'});if(!bcrypt.compareSync(current,u.password))return res.status(401).json({error:'رمز عبور فعلی صحیح نیست.'});u.password=bcrypt.hashSync(next,10);save();res.json({ok:true})});
// --- Support tickets (threaded conversation) ---
function ticketOut(t){return {id:t.id,user_id:t.user_id,username:t.username,subject:t.subject,department:t.department||'عمومی',status:t.status,admin_seen:t.admin_seen,user_unread:t.user_unread,created_at:t.created_at,updated_at:t.updated_at,messages:t.messages}}
app.get('/api/ticket-departments',(req,res)=>res.json({departments:TICKET_DEPARTMENTS}));
app.get('/api/me/tickets',auth,(req,res)=>{const tickets=db.tickets.filter(t=>t.user_id===user(req).id).sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at))).map(ticketOut);res.json({tickets,unread:tickets.filter(t=>t.user_unread).length})});
app.patch('/api/me/tickets/:id/read',auth,(req,res)=>{const t=db.tickets.find(x=>x.id===+req.params.id&&x.user_id===user(req).id);if(!t)return res.status(404).json({error:'تیکت پیدا نشد'});t.user_unread=false;save();res.json({ok:true})});
app.post('/api/me/tickets',auth,uploadTicketFile.single('file'),(req,res)=>{const subject=String(req.body?.subject||'').trim().slice(0,120),message=String(req.body?.message||'').trim().slice(0,2000),department=String(req.body?.department||'').trim().slice(0,60)||'عمومی';if(!subject||!message)return res.status(400).json({error:'موضوع و متن پیام را وارد کنید.'});const now=new Date().toISOString();const msg={from:'user',text:message,at:now};if(req.file)msg.attachment={name:req.file.originalname,url:'/uploads/tickets/'+req.file.filename};const t={id:next('tickets'),user_id:user(req).id,username:user(req).username,subject,department,status:'open',admin_seen:false,user_unread:false,messages:[msg],created_at:now,updated_at:now};db.tickets.push(t);save();res.json({ticket:ticketOut(t)})});
app.post('/api/me/tickets/:id/reply',auth,uploadTicketFile.single('file'),(req,res)=>{const t=db.tickets.find(x=>x.id===+req.params.id&&x.user_id===user(req).id);if(!t)return res.status(404).json({error:'تیکت پیدا نشد'});const text=String(req.body?.message||'').trim().slice(0,2000);if(!text&&!req.file)return res.status(400).json({error:'متن پیام یا فایل را وارد کنید.'});const now=new Date().toISOString();const msg={from:'user',text,at:now};if(req.file)msg.attachment={name:req.file.originalname,url:'/uploads/tickets/'+req.file.filename};t.messages.push(msg);if(t.status!=='open')t.status='open';t.admin_seen=false;t.updated_at=now;save();res.json({ticket:ticketOut(t)})});
app.get('/api/me/notifications',auth,(req,res)=>{const tickets=db.tickets.filter(t=>t.user_id===user(req).id&&t.messages.some(m=>m.from==='admin')).sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)));const items=tickets.map(t=>{const last=[...t.messages].reverse().find(m=>m.from==='admin');return {ticket_id:t.id,subject:t.subject,text:last?.text||'',at:t.updated_at,unread:t.user_unread}});res.json({notifications:items,unread:items.filter(n=>n.unread).length})});
app.get('/api/admin/tickets',admin,(req,res)=>{const tickets=[...db.tickets].sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at))).map(ticketOut);res.json({tickets,unread:tickets.filter(t=>!t.admin_seen).length})});
app.get('/api/admin/tickets/:id',admin,(req,res)=>{const t=db.tickets.find(x=>x.id===+req.params.id);if(!t)return res.status(404).json({error:'تیکت پیدا نشد'});res.json({ticket:ticketOut(t)})});
app.post('/api/admin/tickets/:id/reply',admin,uploadTicketFile.single('file'),(req,res)=>{const t=db.tickets.find(x=>x.id===+req.params.id);if(!t)return res.status(404).json({error:'تیکت پیدا نشد'});const text=String(req.body?.message||'').trim().slice(0,3000);if(!text&&!req.file)return res.status(400).json({error:'متن پاسخ یا فایل را وارد کنید.'});const now=new Date().toISOString();const msg={from:'admin',by:user(req).username,text,at:now};if(req.file)msg.attachment={name:req.file.originalname,url:'/uploads/tickets/'+req.file.filename};t.messages.push(msg);const status=req.body?.status;t.status=['open','answered','closed'].includes(status)?status:'answered';t.admin_seen=true;t.user_unread=true;t.updated_at=now;save();res.json({ticket:ticketOut(t)})});
app.patch('/api/admin/tickets/:id',admin,(req,res)=>{const t=db.tickets.find(x=>x.id===+req.params.id);if(!t)return res.status(404).json({error:'تیکت پیدا نشد'});if(req.body?.status!==undefined&&['open','answered','closed'].includes(req.body.status))t.status=req.body.status;if(req.body?.admin_seen!==undefined)t.admin_seen=!!req.body.admin_seen;t.updated_at=new Date().toISOString();save();res.json({ticket:ticketOut(t)})});
app.get('/api/works',(req,res)=>{const q=(req.query.q||'').trim().toLowerCase();let works=db.works.filter(w=>!q||[w.title,w.english_title,w.description].some(v=>String(v||'').toLowerCase().includes(q))).sort((a,b)=>b.id-a.id);res.json({works:works.map(withCount)})});
app.get('/api/works/:id',(req,res)=>{const w=db.works.find(x=>x.id===+req.params.id);if(!w)return res.status(404).json({error:'اثر پیدا نشد'});w.views=(w.views||0)+1;save();const out=withCount(w);out.chapters=db.chapters.filter(c=>c.work_id===w.id).sort((a,b)=>b.number-a.number);if(user(req))out.favorite=db.favorites.some(f=>f.user_id===user(req).id&&f.work_id===w.id);res.json(out)});

app.get('/api/works/:id/comments',auth,(req,res)=>{
  const id=+req.params.id;
  const comments=db.comments.filter(c=>c.work_id===id).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
  res.json({comments});
});
app.post('/api/works/:id/comments',auth,(req,res)=>{
  const id=+req.params.id, text=String(req.body?.text||'').trim();
  if(!text)return res.status(400).json({error:'متن دیدگاه را وارد کنید.'});
  const c={id:next('comments'),work_id:id,user_id:user(req).id,username:user(req).username,text:text.slice(0,1000),created_at:new Date().toISOString()};
  db.comments.push(c);save();res.json({comment:c});
});
app.post('/api/works/:id/rate',auth,(req,res)=>{
  const id=+req.params.id, value=Math.max(1,Math.min(5,Math.round(+req.body?.value||0)));
  if(!value)return res.status(400).json({error:'امتیاز نامعتبر است.'});
  const old=db.ratings.find(r=>r.work_id===id&&r.user_id===user(req).id);
  if(old)old.value=value;
  else db.ratings.push({id:next('ratings'),work_id:id,user_id:user(req).id,value});
  save();res.json(withCount(db.works.find(w=>w.id===id)));
});
app.post('/api/works/:id/donate',auth,(req,res)=>{
  const id=+req.params.id, amount=Math.max(1,Math.round(+req.body?.amount||0));
  if(!amount)return res.status(400).json({error:'مبلغ نامعتبر است.'});
  db.donations.push({id:next('donations'),work_id:id,user_id:user(req).id,amount,created_at:new Date().toISOString()});
  save();res.json({ok:true});
});

app.post('/api/works/:id/favorite',auth,(req,res)=>{const uid=user(req).id,wid=+req.params.id,i=db.favorites.findIndex(f=>f.user_id===uid&&f.work_id===wid);if(i>=0)db.favorites.splice(i,1);else db.favorites.push({user_id:uid,work_id:wid});save();res.json({favorite:i<0})});
app.get('/api/me/favorites',auth,(req,res)=>res.json({works:db.works.filter(w=>db.favorites.some(f=>f.user_id===user(req).id&&f.work_id===w.id)).sort((a,b)=>b.id-a.id).map(withCount)}));
app.get('/api/me/history',auth,(req,res)=>res.json({history:db.history.filter(h=>h.user_id===user(req).id).sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)))}));
app.get('/api/chapters/:id',auth,(req,res)=>{const c=db.chapters.find(x=>x.id===+req.params.id);if(!c)return res.status(404).json({error:'فصل پیدا نشد'});const w=db.works.find(x=>x.id===c.work_id);const pages=db.pages.filter(p=>p.chapter_id===c.id).sort((a,b)=>a.page_no-b.page_no);const same=db.chapters.filter(x=>x.work_id===c.work_id).sort((a,b)=>a.number-b.number);const idx=same.findIndex(x=>x.id===c.id);res.json({...c,work_title:w?.title||'',pages,prev:same[idx-1]||null,next:same[idx+1]||null})});
app.post('/api/history',auth,(req,res)=>{const work_id=+req.body.work_id,chapter_id=+req.body.chapter_id,last_page=+req.body.last_page||1;const old=db.history.find(h=>h.user_id===user(req).id&&h.chapter_id===chapter_id);const now=new Date().toISOString();if(old){old.last_page=last_page;old.updated_at=now}else db.history.push({user_id:user(req).id,work_id,chapter_id,last_page,updated_at:now});save();res.json({ok:true})});
app.post('/api/admin/work',admin,uploadCover.single('cover'),(req,res)=>{const {title,english_title,description,kind,status,genres,year,author,designer,translator,cleaner,typesetter,publisher}=req.body;if(!title)return res.status(400).json({error:'عنوان لازم است'});const w={id:next('works'),title,english_title:english_title||'',description:description||'',kind:kind||'مانهوا',status:status||'در حال انتشار',genres:genres||'',year:year||'',author:author||'',designer:designer||'',translator:translator||'',cleaner:cleaner||'',typesetter:typesetter||'',publisher:publisher||'',cover:req.file?'/uploads/covers/'+req.file.filename:'',created_at:new Date().toISOString()};db.works.push(w);save();res.json({id:w.id})});
app.delete('/api/admin/work/:id',admin,(req,res)=>{const id=+req.params.id;db.works=db.works.filter(w=>w.id!==id);const ch=db.chapters.filter(c=>c.work_id===id).map(c=>c.id);db.chapters=db.chapters.filter(c=>c.work_id!==id);db.pages=db.pages.filter(p=>!ch.includes(p.chapter_id));db.favorites=db.favorites.filter(f=>f.work_id!==id);db.history=db.history.filter(h=>h.work_id!==id);save();res.json({ok:true})});
app.post('/api/admin/work/:id/chapter',admin,uploadChapter.fields([{name:'pages',maxCount:1000},{name:'zip',maxCount:1}]),(req,res)=>{
  const wid=+req.params.id;
  if(!db.works.some(w=>w.id===wid))return res.status(404).json({error:'اثر پیدا نشد'});
  const {title,number}=req.body;
  let chapterNumber=number;
  if(chapterNumber===undefined || chapterNumber===''){
    chapterNumber=Math.max(0,...db.chapters.filter(x=>x.work_id===wid).map(x=>+x.number||0))+1;
  }
  const finalTitle=title||('Chapter '+chapterNumber);
  const c={id:next('chapters'),work_id:wid,title:finalTitle,number:+chapterNumber,created_at:new Date().toISOString()};
  db.chapters.push(c);
  let images=[];
  const files=(req.files?.pages||[]).sort((a,b)=>a.originalname.localeCompare(b.originalname,undefined,{numeric:true}));
  images.push(...files.map(f=>({name:f.originalname,image:'/uploads/chapters/'+f.filename})));
  const zipFile=req.files?.zip?.[0];
  if(zipFile){
    try{
      const zip=new AdmZip(zipFile.path);
      const entries=zip.getEntries().filter(e=>!e.isDirectory && imageExt.test(e.entryName)).sort((a,b)=>a.entryName.localeCompare(b.entryName,undefined,{numeric:true}));
      const folder=path.join(UPLOADS_DIR,'chapters','chapter-'+c.id);
      fs.mkdirSync(folder,{recursive:true});
      entries.forEach((e,i)=>{
        const safe=path.basename(e.entryName).replace(/[^a-zA-Z0-9._-]/g,'_') || ('page-'+(i+1)+'.jpg');
        const filename=String(i+1).padStart(4,'0')+'-'+safe;
        fs.writeFileSync(path.join(folder,filename),e.getData());
        images.push({name:e.entryName,image:'/uploads/chapters/chapter-'+c.id+'/'+filename});
      });
      fs.unlinkSync(zipFile.path);
    }catch(err){
      try{fs.unlinkSync(zipFile.path)}catch{}
      db.chapters=db.chapters.filter(x=>x.id!==c.id); save();
      return res.status(400).json({error:'فایل ZIP قابل خواندن نیست.'});
    }
  }
  if(!images.length){db.chapters=db.chapters.filter(x=>x.id!==c.id);save();return res.status(400).json({error:'حداقل یک تصویر یا یک فایل ZIP شامل صفحات لازم است.'});}
  images.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
  images.forEach((f,i)=>db.pages.push({id:next('pages'),chapter_id:c.id,page_no:i+1,image:f.image}));
  save();
  res.json({id:c.id,pages:images.length});
});
app.delete('/api/admin/chapter/:id',admin,(req,res)=>{const id=+req.params.id;db.chapters=db.chapters.filter(c=>c.id!==id);db.pages=db.pages.filter(p=>p.chapter_id!==id);save();res.json({ok:true})});
app.get('/api/admin/stats',admin,(req,res)=>res.json({users:db.users.length,works:db.works.length,chapters:db.chapters.length,pages:db.pages.length}));
app.get('/novel/:id',(req,res)=>{
  const w=db.works.find(x=>x.id===+req.params.id);
  if(!w)return res.status(404).sendFile(path.join(ROOT,'public/404.html'));
  const base=publicBase(req);
  const title=String(w.title||'nightcomic');
  const description=String(w.description||`مطالعه ${title} در nightcomic`).replace(/\s+/g,' ').trim().slice(0,160);
  const image=w.cover||w.cover_url||'';
  const canonical=`${base}/novel/${encodeURIComponent(w.id)}`;
  let page=fs.readFileSync(path.join(ROOT,'public/detail.html'),'utf8');
  page=page.replace(/<title>[^<]*<\/title>/i,`<title>${xmlEscape(title)} — nightcomic</title>`);
  page=page.replace('</head>',`<meta name="description" content="${xmlEscape(description)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${xmlEscape(canonical)}">
<meta property="og:type" content="book">
<meta property="og:title" content="${xmlEscape(title)}">
<meta property="og:description" content="${xmlEscape(description)}">
<meta property="og:url" content="${xmlEscape(canonical)}">
${image?`<meta property="og:image" content="${xmlEscape(image.startsWith('http')?image:base+image)}">`:''}
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"Book","name":title,"description":description,"url":canonical,...(image?{image}: {})})}</script>
</head>`);
  res.type('html').send(page);
});
app.get('/reader/:id',(req,res)=>{if(!user(req))return res.redirect('/login');res.sendFile(path.join(ROOT,'public/reader.html'))});
app.get('/admin',(req,res)=>{if(!user(req)||user(req).role!=='admin')return res.redirect('/login');res.sendFile(path.join(ROOT,'admin.html'))});
app.get('/manager',(req,res)=>{if(!user(req)||user(req).role!=='admin')return res.redirect('/login');res.sendFile(path.join(ROOT,'manager.html'))});
app.get('/',(req,res)=>res.sendFile(path.join(ROOT,'public/index.html')));
app.get('/home',(req,res)=>res.sendFile(path.join(ROOT,'public/index.html')));
app.get('/login',(req,res)=>{if(user(req))return res.redirect('/profile');res.sendFile(path.join(ROOT,'public/login.html'))});
app.get('*',(req,res)=>res.sendFile(path.join(ROOT,'public/index.html')));
if(!fs.existsSync(path.join(ROOT,'public','index.html'))) throw new Error('nightcomic public/index.html is missing from deployment root');
const server=app.listen(PORT,'0.0.0.0',()=>console.log('nightcomic running on port '+PORT));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
process.on('SIGINT',()=>server.close(()=>process.exit(0)));
