let me=null, work=null, currentTab='info';
const $=s=>document.querySelector(s);
async function api(url,opt={}){const r=await fetch(url,opt);const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'خطا');return d}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function id(){return +(location.pathname.split('/').filter(Boolean).pop()||0)}
async function init(){
  const m=await api('/api/me'); me=m.user;
  work=await api('/api/works/'+id());
  document.title='nightcomic — '+work.title;
  render();
  loadComments();
}
function tags(){return (work.genres||'').split(/[,،|]/).map(x=>x.trim()).filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}
function statIcon(name){const icons={
 eye:'<svg viewBox="0 0 24 24"><path d="M1 12s4.5-7.5 11-7.5S23 12 23 12s-4.5 7.5-11 7.5S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>',
 star:'<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.5l3.09 6.26 6.91 1-5 4.87 1.18 6.87L12 17.9l-6.18 3.6L7 14.63l-5-4.87 6.91-1z"/></svg>',
 book:'<svg viewBox="0 0 24 24"><path d="M4 19.2A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
};return icons[name]||''}
function metaRow(label,value){return `<div class="meta-row"><span>${esc(label)}</span><b>${esc(value||'-')}</b></div>`}
function render(){
  $('#detailApp').innerHTML=`
  <div class="yellow-breadcrumb"><div class="wrap"><a href='/' style='color:inherit;text-decoration:none'>nightcomic</a> <span>‹</span> ادامه مطلب</div></div>
  <main class="wrap detail-shell">
    <nav class="detail-tabs" id="detailTabs">
      <button data-tab="info" class="active">اطلاعات</button>
      <button data-tab="rating">امتیاز و دونیت</button>
      <button data-tab="chapters">چپترها <em>(${work.chapter_count||0})</em></button>
      <button data-tab="staff">دست اندرکاران</button>
      <button data-tab="comments">دیدگاه ها</button>
      <button data-tab="related">مرتبط ها</button>
    </nav>

    <section class="detail-card hero-detail">
      <div class="cover-wrap">${work.cover?`<img src="${esc(work.cover)}" alt="${esc(work.title)}">`:`<div class="no-cover">nightcomic</div>`}</div>
      <div class="hero-detail-info">
        <h1>${esc(work.title)}</h1>
        ${work.english_title?`<p class="english-title">${esc(work.english_title)}</p>`:''}
        <div class="tag-list">${tags()}</div>
        <div class="quick-stats">
          <span class="stat-eye">${statIcon('eye')} ${Number(work.views||0).toLocaleString('fa-IR')}</span>
          <span class="stat-star">${statIcon('star')} ${work.rating_avg||'—'} / 5</span>
          <span class="stat-book">${statIcon('book')} ${work.chapter_count||0} فصل</span>
        </div>
        <div class="hero-buttons">
          ${work.chapters?.length?`<button class="primary big" onclick="openChapter(${work.chapters[0].id})">📖 شروع به خواندن</button>`:''}
          <button class="ghost big" onclick="favorite()">${work.favorite?'★ حذف از علاقه‌مندی':'☆ افزودن به لیست علاقه‌مندی'}</button>
        </div>
      </div>
    </section>

    <section id="tab-info" class="tab-content active">
      <div class="info-grid">
        <div class="detail-card meta-card">
          ${metaRow('نوع',work.kind)}
          ${metaRow('سال انتشار',work.year||'نامشخص')}
          ${metaRow('تعداد چپتر',work.chapter_count||0)}
          ${metaRow('طراح',work.designer||'-')}
          ${metaRow('نویسنده',work.author||'-')}
          ${metaRow('رده سنی',work.age||'بالای 17 سال')}
          ${metaRow('آخرین چپتر',work.chapter_count||0)}
        </div>
        <div class="detail-card dark-section"><h2>نام های دیگر</h2><p>${esc(work.other_names||work.english_title||'ثبت نشده است')}</p></div>
      </div>
      <div class="detail-card story"><h2>خلاصه داستان</h2><p>${esc(work.description||'برای این اثر خلاصه‌ای ثبت نشده است.')}</p></div>
    </section>

    <section id="tab-rating" class="tab-content">
      <div class="two-col">
        <div class="detail-card rating-box"><h2>امتیاز کاربران</h2><div class="big-rating"><span class="big-rating-star">${statIcon('star')}</span> ${work.rating_avg||'—'} <small>/ 5</small></div><p>${work.rating_count||0} رای ثبت شده</p><div class="stars">${[1,2,3,4,5].map(n=>`<button onclick="rate(${n})" aria-label="امتیاز ${n}">${statIcon('star')}</button>`).join('')}</div></div>
        <div class="detail-card donation-box"><h2>حمایت و دونیت</h2><p>اگر از ترجمه و سایت راضی هستی، می‌توانی از تیم ترجمه حمایت کنی.</p><div class="donate-row">${[10,25,50,100].map(n=>`<button onclick="donate(${n})">${n} هزار</button>`).join('')}</div><small>این بخش در نسخه محلی، ثبت حمایت را شبیه‌سازی می‌کند.</small></div>
      </div>
    </section>

    <section id="tab-chapters" class="tab-content">
      <div class="detail-card chapter-box"><div class="section-title"><h2>چپتر ها</h2><span>${work.chapter_count||0} فصل</span></div><div class="chapter-list">${(work.chapters||[]).map(c=>`<button onclick="openChapter(${c.id})"><span>فصل ${esc(c.number)}</span><b>${esc(c.title||'بدون عنوان')}</b><small>مطالعه ›</small></button>`).join('')||'<p class="muted">هنوز فصلی ثبت نشده است.</p>'}</div></div>
    </section>

    <section id="tab-staff" class="tab-content">
      <div class="detail-card staff-card"><h2>دست اندرکاران</h2><div class="staff-grid">
        <div><span>نویسنده</span><b>${esc(work.author||'ثبت نشده')}</b></div>
        <div><span>طراح</span><b>${esc(work.designer||'ثبت نشده')}</b></div>
        <div><span>مترجم</span><b>${esc(work.translator||'تیم nightcomic')}</b></div>
        <div><span>ناشر</span><b>${esc(work.publisher||'ثبت نشده')}</b></div>
      </div></div>
    </section>

    <section id="tab-comments" class="tab-content">
      <div class="detail-card comments-card"><div class="section-title"><h2>دیدگاه ها</h2><span id="commentCount">در حال بارگذاری…</span></div>
        <div class="comment-form">${me?`<textarea id="commentText" placeholder="نظر خودت را درباره این اثر بنویس…"></textarea><button class="primary" onclick="sendComment()">ارسال دیدگاه</button>`:`<p>برای ثبت دیدگاه ابتدا وارد حساب شو.</p><button class="primary" onclick="login()">ورود / ثبت نام</button>`}</div>
        <div id="commentsList"></div>
      </div>
    </section>

    <section id="tab-related" class="tab-content">
      <div class="detail-card"><h2>مرتبط ها</h2><div id="relatedGrid" class="related-grid">در حال بارگذاری…</div></div>
    </section>
  </main>`;
  document.querySelectorAll('#detailTabs button').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  loadRelated();
}
function switchTab(tab){
  currentTab=tab;
  document.querySelectorAll('#detailTabs button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  document.querySelectorAll('.tab-content').forEach(x=>x.classList.toggle('active',x.id==='tab-'+tab));
  if(tab==='comments')loadComments();
}
async function favorite(){
  if(!me)return login();
  const r=await api('/api/works/'+work.id+'/favorite',{method:'POST'});
  work.favorite=r.favorite;render();switchTab(currentTab);
}
function openChapter(cid){location.href='/reader/'+cid}
async function rate(value){
  if(!me)return login();
  work=await api('/api/works/'+work.id+'/rate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({value})});
  render();switchTab('rating');
}
async function donate(amount){
  if(!me)return login();
  await api('/api/works/'+work.id+'/donate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount})});
  alert('حمایت شما ثبت شد ❤️');
}
async function loadComments(){
  if(!work)return;
  const d=await api('/api/works/'+work.id+'/comments');
  const list=$('#commentsList'); if(!list)return;
  $('#commentCount').textContent=d.comments.length+' دیدگاه';
  list.innerHTML=d.comments.length?d.comments.map(c=>`<article class="comment"><div class="comment-head"><b>${esc(c.username)}</b><small>${new Date(c.created_at).toLocaleDateString('fa-IR')}</small></div><p>${esc(c.text)}</p></article>`).join(''):'<p class="muted empty-comments">هنوز دیدگاهی ثبت نشده است.</p>';
}
async function sendComment(){
  const text=$('#commentText')?.value.trim(); if(!text)return;
  await api('/api/works/'+work.id+'/comments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
  $('#commentText').value='';loadComments();switchTab('comments');
}
async function loadRelated(){
  const grid=$('#relatedGrid'); if(!grid)return;
  const d=await api('/api/works'); const genres=String(work.genres||'').split(/[,،|]/).map(x=>x.trim()).filter(Boolean);
  const rel=d.works.filter(x=>x.id!==work.id&&genres.some(g=>String(x.genres||'').includes(g))).slice(0,6);
  grid.innerHTML=rel.length?rel.map(x=>`<a href="/novel/${x.id}" class="related-card">${x.cover?`<img src="${esc(x.cover)}">`:''}<b>${esc(x.title)}</b></a>`).join(''):'<p class="muted">اثر مرتبطی پیدا نشد.</p>';
}
function login(){
  const modal=$('#modal');
  modal.innerHTML=`<div class="box"><button class="close" onclick="modal.classList.remove('show')">×</button><h2>ورود / ثبت نام</h2><div class="form"><input id="u" placeholder="نام کاربری"><input id="p" type="password" placeholder="رمز عبور"><button class="primary" onclick="doLogin()">ورود</button></div><p id="msg"></p></div>`;
  modal.classList.add('show');
}
async function doLogin(){try{await api('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:$('#u').value,password:$('#p').value})});location.reload()}catch(e){$('#msg').textContent=e.message}}
document.body.classList.remove('light');try{localStorage.removeItem('theme')}catch(e){}
init().catch(e=>$('#detailApp').innerHTML=`<div class="detail-loading">${esc(e.message)}</div>`);
