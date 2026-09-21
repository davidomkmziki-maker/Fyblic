(function(){
  'use strict';
  if(window.__FYBLIC_PROFILE_PUBLICATION_NOTICE_V1066__)return;
  window.__FYBLIC_PROFILE_PUBLICATION_NOTICE_V1066__=true;
  var KEY='FYBLIC_PROFILE_PUBLICATION_NOTICES_V1';
  function read(){try{var x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[];}catch(_e){return [];}}
  function write(list){try{localStorage.setItem(KEY,JSON.stringify(list||[]));}catch(_e){}}
  function ensure(){
    var box=document.getElementById('fyblicProfilePublicationNoticeV1066');if(box)return box;
    var style=document.createElement('style');style.textContent='#fyblicProfilePublicationNoticeV1066{display:none;align-items:center;gap:10px;margin:8px 14px 12px;padding:10px 11px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:#121821;color:#fff;font:750 13px/1.3 system-ui,sans-serif}#fyblicProfilePublicationNoticeV1066.show{display:flex}#fyblicProfilePublicationNoticeV1066 i{width:8px;height:8px;flex:0 0 8px;border-radius:50%;background:#2bd875}#fyblicProfilePublicationNoticeV1066.warning i{background:#ffb000}#fyblicProfilePublicationNoticeV1066 span{flex:1}#fyblicProfilePublicationNoticeV1066 button{width:30px;height:30px;border:0;background:transparent;color:#fff;font:700 22px/30px system-ui}';document.head.appendChild(style);
    box=document.createElement('div');box.id='fyblicProfilePublicationNoticeV1066';box.innerHTML='<i></i><span></span><button type="button" aria-label="Fermer">×</button>';
    var host=document.querySelector('.haProfileHero');if(host&&host.parentNode)host.parentNode.insertBefore(box,host.nextSibling);else document.body.appendChild(box);
    box.querySelector('button').onclick=function(){write([]);box.classList.remove('show','warning');};return box;
  }
  function render(){var box=ensure(),list=read();if(!list.length){box.classList.remove('show','warning');return;}var first=list[0],count=list.length,text=count>1?(count+' publications ont terminé leur préparation.'):(first.text||'Publication entièrement prête.');box.querySelector('span').textContent=text;box.classList.toggle('warning',first.kind==='warning');box.classList.add('show');}
  window.addEventListener('storage',function(ev){if(ev&&ev.key===KEY)render();});
  window.addEventListener('pageshow',render);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render();
})();
