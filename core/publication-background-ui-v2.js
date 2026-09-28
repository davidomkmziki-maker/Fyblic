(function(){
  'use strict';
  if(window.__FYBLIC_PUBLICATION_BACKGROUND_UI_V2__)return;
  window.__FYBLIC_PUBLICATION_BACKGROUND_UI_V2__=true;
  var MUTED_KEY='FYBLIC_PUBLICATION_MUTED_V1';
  var NOTICE_KEY='FYBLIC_PROFILE_PUBLICATION_NOTICES_V1';
  var ACTIVE_KEY='FYBLIC_ACTIVE_PUBLICATION_V1067R1';
  var hideTimer=null,currentJobId='',mountTimer=null,lastStoryDetail=null;
  function json(key,fallback){try{var x=JSON.parse(localStorage.getItem(key)||'');return x&&typeof x==='object'?x:fallback;}catch(_e){return fallback;}}
  function muted(){return json(MUTED_KEY,{});}
  function active(){return json(ACTIVE_KEY,null);}
  function isCurrent(id){var value=active();return !value||!value.id||String(value.id)===String(id||'');}
  function clearActive(id){var value=active();if(value&&String(value.id)===String(id||'')){try{localStorage.removeItem(ACTIVE_KEY);}catch(_e){}}}
  function forgetOnly(id){try{['FYBLIC_PUBLICATION_JOBS_V1080','FYBLIC_PUBLICATION_JOBS_V2'].forEach(function(key){var list=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(list))localStorage.setItem(key,JSON.stringify(list.filter(function(x){return x&&String(x.id)!==String(id||'')&&String(x.groupId||'')!==String(id||'');})));});}catch(_e){}}
  function isMuted(id){return !!(id&&muted()[id]);}
  function writeMuted(map){
    var now=Date.now();Object.keys(map||{}).forEach(function(id){if(!Number(map[id])||now-Number(map[id])>7*24*60*60*1000)delete map[id];});
    try{localStorage.setItem(MUTED_KEY,JSON.stringify(map||{}));}catch(_e){}
  }
  function mute(id){if(!id)return;var map=muted();map[id]=Date.now();writeMuted(map);}
  function unmute(id){if(!id)return;var map=muted();delete map[id];writeMuted(map);}
  function addProfileNotice(detail,text,kind){
    var id=String(detail&&detail.jobId||detail&&detail.postId||'');if(!id)return;
    var list=json(NOTICE_KEY,[]);if(!Array.isArray(list))list=[];
    var notice={id:id,postId:String(detail&&detail.postId||''),text:String(text||'Publication entièrement prête.'),kind:String(kind||'success'),at:Date.now()};
    list=[notice].concat(list.filter(function(x){return x&&String(x.id)!==id;})).slice(0,12);
    try{localStorage.setItem(NOTICE_KEY,JSON.stringify(list));}catch(_e){}
  }
  function safeError(value){var m=String(value||'');if(/requested file could not be read|permission problems|reference to a file|notreadableerror|file.*could not be read/i.test(m))return 'Le téléphone a interrompu l’accès au média. Sélectionne-le puis réessaie.';return /supabase|23502|failing row|violates|constraint|postgres|pgrst|sql/i.test(m)?'Publication impossible. Réessaie après la mise à jour.':(m.slice(0,140)||'Publication impossible. Réessaie.');}
  function radarAnchor(){
    return document.getElementById('homeRadarStoryMasterV629')||document.getElementById('homeRadarBlock')||document.querySelector('.radarBlock:not([aria-hidden="true"])');
  }
  function storyAvatar(){var root=radarAnchor();if(!root)return null;return root.querySelector('.haStoryAddOnlyV629 .radarAvatar')||root.querySelector('.haStoryRadarUnitV629 .radarAvatar');}
  function clearStoryRing(){document.querySelectorAll('.fyblicStoryProgressV1067R1,.fyblicStoryProgressLabelV1072').forEach(function(node){node.remove();});lastStoryDetail=null;}
  function paintStoryRing(detail){
    lastStoryDetail=detail;var avatar=storyAvatar();if(!avatar)return;
    document.querySelectorAll('.fyblicStoryProgressV1067R1').forEach(function(node){if(node.parentNode!==avatar)node.remove();});
    var ring=avatar.querySelector('.fyblicStoryProgressV1067R1');if(!ring){ring=document.createElement('span');ring.className='fyblicStoryProgressV1067R1';ring.setAttribute('aria-hidden','true');avatar.appendChild(ring);}
    var percent=Math.max(1,Math.min(100,Number(detail&&detail.progress||1)));ring.style.setProperty('--fyblic-story-angle',(percent*3.6)+'deg');ring.classList.toggle('fail',detail&&detail.status==='failed');
    var label=avatar.querySelector('.fyblicStoryProgressLabelV1072');if(!label){label=document.createElement('span');label.className='fyblicStoryProgressLabelV1072';label.setAttribute('aria-live','polite');avatar.appendChild(label);}var failed=detail&&detail.status==='failed';label.textContent=failed?'Échec':Math.round(percent)+'%';label.classList.toggle('fail',!!failed);
  }
  function mount(box){
    box=box||document.getElementById('fyblicPublicationProgressV2');if(!box)return false;
    var radar=radarAnchor();
    if(radar&&radar.parentNode){if(box.previousElementSibling!==radar)radar.insertAdjacentElement('afterend',box);box.setAttribute('data-fyblic-progress-anchor','radar');return true;}
    var list=document.getElementById('list');
    if(list&&list.parentNode){if(box.nextElementSibling!==list)list.parentNode.insertBefore(box,list);box.setAttribute('data-fyblic-progress-anchor','timeline');return true;}
    return false;
  }
  function scheduleMount(box){clearTimeout(mountTimer);mountTimer=setTimeout(function(){mount(box);},0);}
  function ensure(){
    var box=document.getElementById('fyblicPublicationProgressV2');if(box){mount(box);return box;}
    var style=document.createElement('style');style.textContent='#fyblicPublicationProgressV2{position:relative;z-index:4;width:100%;box-sizing:border-box;margin:-2px 0 7px;padding:0 7px 1px;pointer-events:none;display:none;overflow-anchor:none}#fyblicPublicationProgressV2.show{display:block}.fyblicPubV2Card{position:relative;width:100%;box-sizing:border-box;background:transparent;border:0;border-radius:0;padding:0 26px 0 1px;box-shadow:none}.fyblicPubV2Copy{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#cbd1db;font:750 10.5px/1.2 system-ui,sans-serif;margin-bottom:4px;min-height:15px}.fyblicPubV2Copy span:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fyblicPubV2Copy span:last-child{color:#aeb6c3;flex:0 0 auto;font-variant-numeric:tabular-nums}.fyblicPubV2Track{height:2px;background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden}.fyblicPubV2Fill{height:100%;width:0;background:#ffb000;transition:width .25s ease}.fyblicPubV2Card.fail .fyblicPubV2Fill{background:#ff4545}.fyblicPubV2Card.fail{pointer-events:auto}.fyblicPubV2Retry{display:none;border:0;background:transparent;color:#ffb000;font:850 10.5px system-ui;padding:5px 0 0}.fyblicPubV2Card.fail .fyblicPubV2Retry{display:inline-block}.fyblicPubV2Close{position:absolute;right:-3px;top:-5px;width:24px;height:24px;border:0;background:transparent;color:#9fa7b3;font:700 18px/24px system-ui;opacity:.9;pointer-events:auto;padding:0}.fyblicStoryProgressV1067R1{position:absolute!important;inset:-5px!important;border-radius:50%!important;z-index:8!important;pointer-events:none!important;background:conic-gradient(#ff8a00 0 var(--fyblic-story-angle,3.6deg),rgba(255,255,255,.16) var(--fyblic-story-angle,3.6deg) 360deg)!important;-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 calc(100% - 3px));mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 calc(100% - 3px))}.fyblicStoryProgressV1067R1.fail{background:conic-gradient(#ff4545 0 var(--fyblic-story-angle,3.6deg),rgba(255,69,69,.18) var(--fyblic-story-angle,3.6deg) 360deg)!important}.fyblicStoryProgressLabelV1072{position:absolute!important;inset:0!important;z-index:10!important;display:grid!important;place-items:center!important;border-radius:50%!important;background:rgba(0,0,0,.5)!important;color:#fff!important;font:900 11px/1 system-ui,sans-serif!important;text-shadow:0 1px 2px #000!important;pointer-events:none!important}.fyblicStoryProgressLabelV1072.fail{background:rgba(72,0,0,.72)!important;color:#ffb2b2!important;font-size:9px!important}';document.head.appendChild(style);
    box=document.createElement('div');box.id='fyblicPublicationProgressV2';box.setAttribute('aria-live','polite');box.innerHTML='<div class="fyblicPubV2Card"><button type="button" class="fyblicPubV2Close" aria-label="Masquer la progression">×</button><div class="fyblicPubV2Copy"><span>Publication en cours</span><span>0%</span></div><div class="fyblicPubV2Track"><div class="fyblicPubV2Fill"></div></div><button type="button" class="fyblicPubV2Retry">Réessayer depuis Publications</button></div>';
    var list=document.getElementById('list');if(list&&list.parentNode)list.parentNode.insertBefore(box,list);else document.body.appendChild(box);mount(box);
    box.querySelector('.fyblicPubV2Close').onclick=function(){clearTimeout(hideTimer);mute(currentJobId);box.classList.remove('show');};
    var observer=new MutationObserver(function(){if(box.classList.contains('show')||box.getAttribute('data-fyblic-progress-anchor')!=='radar')scheduleMount(box);if(lastStoryDetail)setTimeout(function(){paintStoryRing(lastStoryDetail);},0);});
    try{observer.observe(document.body,{childList:true,subtree:true});}catch(_e){}
    return box;
  }
  function refreshHome(){try{localStorage.setItem('HAPPYAD_HOME_REFRESH_NEEDED','1');sessionStorage.removeItem('HAPPYAD_HOME_POSTS_LAST_SYNC');if(typeof window.happyadRefreshHomePostsNow==='function')window.happyadRefreshHomePostsNow('pipeline-v2-primary-ready');}catch(_e){}}
  function render(detail){
    detail=detail||{};var box=ensure(),jobId=String(detail.jobId||'');if(jobId)currentJobId=jobId;mount(box);
    if(String(detail.publicationType||'')==='story'){
      if(jobId&&!isCurrent(jobId))return;
      box.classList.remove('show');
      if(detail.status==='published'){addProfileNotice(detail,'Ta Story est entièrement prête.','success');try{localStorage.setItem('HAPPYAD_RADAR_REFRESH_NEEDED','1');}catch(_e){}clearStoryRing();refreshHome();return;}
      if(detail.status==='canceled'){clearStoryRing();refreshHome();return;}
      if(detail.primaryReady===true){try{localStorage.setItem('HAPPYAD_RADAR_REFRESH_NEEDED','1');}catch(_e){}clearActive(jobId);clearStoryRing();refreshHome();return;}
      paintStoryRing(detail);
      if(detail.status==='failed')return;
      return;
    }
    /* Une seule tâche possède la barre. Les événements retardés d'une ancienne
       publication ne peuvent plus afficher/masquer la progression courante. */
    if(jobId&&!isCurrent(jobId))return;
    if(String(detail.publicationType||'')==='boutique'&&detail.status==='published'){
      unmute(jobId);clearActive(jobId);forgetOnly(jobId);box.classList.remove('show');return;
    }
    if(detail.status==='published'){
      addProfileNotice(detail,'Toutes les qualités de ta publication sont prêtes.','success');
      unmute(jobId);clearActive(jobId);forgetOnly(jobId);refreshHome();box.classList.remove('show');return;
    }
    if(detail.primaryReady===true){mute(jobId);clearActive(jobId);refreshHome();box.classList.remove('show');return;}
    if(detail.status==='canceled'){unmute(jobId);clearActive(jobId);forgetOnly(jobId);box.classList.remove('show');return;}
    if(isMuted(jobId)){
      if(detail.status==='failed'){addProfileNotice(detail,'Publication affichée, mais certaines qualités n’ont pas été terminées.','warning');unmute(jobId);}
      box.classList.remove('show');return;
    }
    var card=box.firstElementChild,copy=card.querySelector('.fyblicPubV2Copy'),fill=card.querySelector('.fyblicPubV2Fill'),retry=card.querySelector('.fyblicPubV2Retry'),percent=Math.max(0,Math.min(100,Number(detail.progress||0)));
    clearTimeout(hideTimer);box.classList.add('show');card.classList.remove('fail');fill.style.width=percent+'%';copy.children[0].textContent=detail.stage||'Publication en cours';copy.children[1].textContent=percent+'%';retry.onclick=function(){try{if(window.HappyNavigation&&window.HappyNavigation.open)window.HappyNavigation.open('publish');else location.href='modules/publish.html';}catch(_e){location.href='modules/publish.html';}};
    if(detail.status==='failed'){card.classList.add('fail');copy.children[0].textContent=safeError(detail.error);copy.children[1].textContent='Échec';forgetOnly(jobId);clearActive(jobId);hideTimer=setTimeout(function(){unmute(jobId);box.classList.remove('show');},1400);}
  }
  window.addEventListener('FYBLIC_PUBLICATION_PROGRESS_V2',function(ev){render(ev&&ev.detail);});
  window.addEventListener('message',function(ev){var d=ev&&ev.data;if(d&&d.type==='FYBLIC_PUBLICATION_PROGRESS_V2')render(d.detail);});
  window.addEventListener('pageshow',function(){var box=ensure();mount(box);},{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){ensure();},{once:true});else ensure();
})();
