(function(){
  'use strict';
  if(window.__FYBLIC_PUBLICATION_BACKGROUND_UI_V2__)return;
  window.__FYBLIC_PUBLICATION_BACKGROUND_UI_V2__=true;
  var MUTED_KEY='FYBLIC_PUBLICATION_MUTED_V1';
  var NOTICE_KEY='FYBLIC_PROFILE_PUBLICATION_NOTICES_V1';
  var hideTimer=null,currentJobId='';
  function json(key,fallback){try{var x=JSON.parse(localStorage.getItem(key)||'');return x&&typeof x==='object'?x:fallback;}catch(_e){return fallback;}}
  function muted(){return json(MUTED_KEY,{});}
  function isMuted(id){return !!(id&&muted()[id]);}
  function mute(id){if(!id)return;var map=muted();map[id]=Date.now();try{localStorage.setItem(MUTED_KEY,JSON.stringify(map));}catch(_e){}}
  function unmute(id){if(!id)return;var map=muted();delete map[id];try{localStorage.setItem(MUTED_KEY,JSON.stringify(map));}catch(_e){}}
  function addProfileNotice(detail,text,kind){
    var id=String(detail&&detail.jobId||detail&&detail.postId||'');if(!id)return;
    var list=json(NOTICE_KEY,[]);if(!Array.isArray(list))list=[];
    var notice={id:id,postId:String(detail&&detail.postId||''),text:String(text||'Publication entièrement prête.'),kind:String(kind||'success'),at:Date.now()};
    list=[notice].concat(list.filter(function(x){return x&&String(x.id)!==id;})).slice(0,12);
    try{localStorage.setItem(NOTICE_KEY,JSON.stringify(list));}catch(_e){}
  }
  function safeError(value){var m=String(value||'');if(/requested file could not be read|permission problems|reference to a file|notreadableerror|file.*could not be read/i.test(m))return 'Le téléphone a interrompu l’accès au média. Sélectionne-le puis réessaie.';return /supabase|23502|failing row|violates|constraint|postgres|pgrst|sql/i.test(m)?'Publication impossible. Réessaie après la mise à jour.':(m.slice(0,140)||'Publication impossible. Réessaie.');}
  function ensure(){
    var box=document.getElementById('fyblicPublicationProgressV2');if(box)return box;
    var style=document.createElement('style');style.textContent='#fyblicPublicationProgressV2{position:fixed;z-index:2147482000;left:0;right:0;top:calc(86px + env(safe-area-inset-top));padding:0 12px;pointer-events:none;display:none}#fyblicPublicationProgressV2.show{display:block}.fyblicPubV2Card{position:relative;max-width:760px;margin:auto;background:rgba(9,12,17,.96);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:8px 36px 8px 10px;box-shadow:0 8px 24px rgba(0,0,0,.3)}.fyblicPubV2Copy{display:flex;justify-content:space-between;gap:10px;color:#fff;font:800 12px/1.25 system-ui,sans-serif;margin-bottom:6px}.fyblicPubV2Copy span:last-child{color:#cfd5df}.fyblicPubV2Track{height:3px;background:#303642;border-radius:99px;overflow:hidden}.fyblicPubV2Fill{height:100%;width:0;background:#ffb000;transition:width .25s ease}.fyblicPubV2Card.fail .fyblicPubV2Fill{background:#ff4545}.fyblicPubV2Card.fail{pointer-events:auto}.fyblicPubV2Retry{display:none;border:0;background:transparent;color:#ffb000;font:900 12px system-ui;padding:4px 0 0}.fyblicPubV2Card.fail .fyblicPubV2Retry{display:inline-block}.fyblicPubV2Close{position:absolute;right:6px;top:4px;width:30px;height:30px;border:0;background:transparent;color:#fff;font:700 22px/30px system-ui;opacity:.8;pointer-events:auto}';document.head.appendChild(style);
    box=document.createElement('div');box.id='fyblicPublicationProgressV2';box.innerHTML='<div class="fyblicPubV2Card"><button type="button" class="fyblicPubV2Close" aria-label="Fermer">×</button><div class="fyblicPubV2Copy"><span>Publication en cours</span><span>0%</span></div><div class="fyblicPubV2Track"><div class="fyblicPubV2Fill"></div></div><button type="button" class="fyblicPubV2Retry">Réessayer depuis Publications</button></div>';document.body.appendChild(box);
    box.querySelector('.fyblicPubV2Close').onclick=function(){clearTimeout(hideTimer);mute(currentJobId);box.classList.remove('show');};
    return box;
  }
  function refreshHome(){try{localStorage.setItem('HAPPYAD_HOME_REFRESH_NEEDED','1');sessionStorage.removeItem('HAPPYAD_HOME_POSTS_LAST_SYNC');if(typeof window.happyadRefreshHomePostsNow==='function')window.happyadRefreshHomePostsNow('pipeline-v2-primary-ready');}catch(_e){}}
  function render(detail){
    detail=detail||{};var box=ensure(),jobId=String(detail.jobId||'');if(jobId)currentJobId=jobId;
    if(detail.status==='published'){
      addProfileNotice(detail,'Toutes les qualités de ta publication sont prêtes.','success');
      unmute(jobId);refreshHome();box.classList.remove('show');return;
    }
    if(detail.primaryReady===true){mute(jobId);refreshHome();box.classList.remove('show');return;}
    if(detail.status==='canceled'){unmute(jobId);box.classList.remove('show');return;}
    if(isMuted(jobId)){
      if(detail.status==='failed'){addProfileNotice(detail,'Publication affichée, mais certaines qualités n’ont pas été terminées.','warning');unmute(jobId);}
      box.classList.remove('show');return;
    }
    var card=box.firstElementChild,copy=card.querySelector('.fyblicPubV2Copy'),fill=card.querySelector('.fyblicPubV2Fill'),retry=card.querySelector('.fyblicPubV2Retry'),percent=Math.max(0,Math.min(100,Number(detail.progress||0)));
    clearTimeout(hideTimer);box.classList.add('show');card.classList.remove('fail');fill.style.width=percent+'%';copy.children[0].textContent=detail.stage||'Publication en cours';copy.children[1].textContent=percent+'%';retry.onclick=function(){try{if(window.HappyNavigation&&window.HappyNavigation.open)window.HappyNavigation.open('publish');else location.href='modules/publish.html';}catch(_e){location.href='modules/publish.html';}};
    if(detail.status==='failed'){card.classList.add('fail');copy.children[0].textContent=safeError(detail.error);copy.children[1].textContent='Échec';hideTimer=setTimeout(function(){mute(jobId);box.classList.remove('show');},7000);}
  }
  window.addEventListener('FYBLIC_PUBLICATION_PROGRESS_V2',function(ev){render(ev&&ev.detail);});
  window.addEventListener('message',function(ev){var d=ev&&ev.data;if(d&&d.type==='FYBLIC_PUBLICATION_PROGRESS_V2')render(d.detail);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){ensure();},{once:true});else ensure();
})();
