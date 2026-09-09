let chapter=null,zoom=1;
const $=s=>document.querySelector(s);
async function api(url){const r=await fetch(url);const d=await r.json();if(!r.ok)throw Error(d.error||'خطا');return d}
function cid(){return +(location.pathname.split('/').filter(Boolean).pop()||0)}
function render(){
  document.title='nightcomic — '+chapter.work_title+' | فصل '+chapter.number;
  $('#readerTitle').textContent=chapter.work_title+' — فصل '+chapter.number;
  $('#readerBack').href='/novel/'+chapter.work_id;
  $('#readerPages').innerHTML=(chapter.pages||[]).map((p,i)=>`<img class="manga-page" src="${p.image}" alt="صفحه ${i+1}" loading="lazy">`).join('')||'<div class="reader-loading">این فصل صفحه‌ای ندارد.</div>';
  $('#prevChapter').disabled=!chapter.prev;
  $('#nextChapter').disabled=!chapter.next;
  $('#prevChapter').onclick=()=>chapter.prev&&(location.href='/reader/'+chapter.prev.id);
  $('#nextChapter').onclick=()=>chapter.next&&(location.href='/reader/'+chapter.next.id);
  $('#chapterList').href='/novel/'+chapter.work_id+'#chapters';
  applyZoom();
}
function applyZoom(){
  document.querySelectorAll('.manga-page').forEach(img=>img.style.width=(zoom*100)+'%');
  $('#zoomLabel').textContent=Math.round(zoom*100)+'%';
}
$('#zoomIn').onclick=()=>{zoom=Math.min(2,+(zoom+.1).toFixed(2));applyZoom()};
$('#zoomOut').onclick=()=>{zoom=Math.max(.4,+(zoom-.1).toFixed(2));applyZoom()};
$('#zoomReset').onclick=()=>{zoom=1;applyZoom()};
$('#fitWidth').onclick=()=>{zoom=1;applyZoom();window.scrollTo({top:0,behavior:'smooth'})};
document.body.classList.remove('light');try{localStorage.removeItem('readerTheme')}catch(e){}
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'&&chapter?.next)location.href='/reader/'+chapter.next.id;
  if(e.key==='ArrowRight'&&chapter?.prev)location.href='/reader/'+chapter.prev.id;
  if(e.key==='+')$('#zoomIn').click();
  if(e.key==='-')$('#zoomOut').click();
});
api('/api/chapters/'+cid()).then(c=>{chapter=c;render()}).catch(e=>$('#readerPages').innerHTML='<div class="reader-loading">'+e.message+'</div>');
