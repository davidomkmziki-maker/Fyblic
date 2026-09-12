/* Fyblic P1.05 — moteur overlay/scroll canonique unique. API V615 conservée comme alias de compatibilité. */
(function(){
  'use strict';
  if(window.__HAPPYAD_OVERLAY_SCROLL_MASTER_V615__)return;
  window.__HAPPYAD_OVERLAY_SCROLL_MASTER_V615__=true;

  var VERSION='V905_OVERLAY_SCROLL_SINGLE_CANONICAL';
  var TAP_SHIELD_ID='happyadAppTapShield';
  var scheduled=false;
  var observer=null;
  var locks=Object.create(null);
  var lockCount=0;
  var savedScrollY=0;
  var managedAttrs='data-happyad-overlay-neutralized-v615';

  var SELECTORS=[
    '#happyadShareCenter','#happyadHomePhotoFullscreen','#happyadHomeCommentPopup','#happyStoryViewer','#happyStoryViewersModal',
    '#happyadPwaGuide','#hsvMoreMenu','#happyadNotificationReturnCenter','#happyadPublicAvatarViewer',
    '#profileEditBackdrop','#happyadSettingActionBackdrop','#happyadPhotoLoadingV438',
    '#happyadProfilePhotoFullscreenV478','#happyadProfilePhotoFullscreenV481',
    '#haPostMenuOverlayV438','#haPostModalOverlayV438','#videoCommentActionSheet',
    '.quickPostSheet','.haSearchOverlay','.searchOverlay','.cameraSheet','.step2','.publishProgress',
    '.media-viewer','.sheet-backdrop','.commentBackdrop','.profilePopupShade','.storyViewerShade',
    '.avatarCropShade','.haPostMenuOverlay','.haPostModalOverlay'
  ].join(',');

  var LEGACY_LOCK_CLASSES=[
    'no-scroll','modal-open','story-open','fullscreen-open','happyad-story-fullscreen-lock','happyadShareOpen',
    'haHomePhotoFsLock','haHomeCommentLock','storyOpen','hsvOpen','storyFullscreen','fullscreen'
  ];

  function removeTapShield(){
    try{var sh=document.getElementById(TAP_SHIELD_ID);if(sh&&sh.parentNode)sh.parentNode.removeChild(sh);}catch(_e){}
  }
  function num(v){v=parseFloat(v);return isFinite(v)?v:1;}
  function styleOf(el){try{return window.getComputedStyle(el);}catch(_e){return null;}}
  function isHidden(el){
    if(!el||!el.isConnected)return true;
    var cs=styleOf(el);if(!cs)return false;
    if(cs.display==='none'||cs.visibility==='hidden'||cs.visibility==='collapse'||num(cs.opacity)<=0.01)return true;
    try{var r=el.getBoundingClientRect();if(r.width<2||r.height<2)return true;}catch(_r){}
    return false;
  }
  function looksOpen(el){
    if(!el||!el.isConnected)return false;
    var classActive=false,cs=styleOf(el);
    try{
      var c=el.classList;
      classActive=!!(c&&(c.contains('on')||c.contains('show')||c.contains('open')||c.contains('active')||c.contains('visible')||c.contains('full')));
    }catch(_c){}
    if(classActive){
      return !!(!cs||(cs.display!=='none'&&cs.visibility!=='hidden'&&cs.visibility!=='collapse'));
    }
    try{
      if(el.getAttribute('aria-hidden')==='false')return !!(!cs||(cs.display!=='none'&&cs.visibility!=='hidden'&&cs.visibility!=='collapse'));
    }catch(_a){}
    if(isHidden(el))return false;
    return !!(cs&&cs.pointerEvents!=='none');
  }
  function neutralize(el){
    if(!el||el.id===TAP_SHIELD_ID)return;
    if(looksOpen(el)){
      try{
        if(el.getAttribute(managedAttrs)==='1'){
          el.removeAttribute(managedAttrs);
          el.removeAttribute('inert');
          el.style.removeProperty('pointer-events');
        }
        if(el.getAttribute('aria-hidden')==='true')el.setAttribute('aria-hidden','false');
      }catch(_o){}
      return;
    }
    try{
      if(el.getAttribute(managedAttrs)!=='1')el.setAttribute(managedAttrs,'1');
      if(el.getAttribute('aria-hidden')!=='true')el.setAttribute('aria-hidden','true');
      if(!el.hasAttribute('inert'))el.setAttribute('inert','');
      if(el.style.getPropertyValue('pointer-events')!=='none'||el.style.getPropertyPriority('pointer-events')!=='important')el.style.setProperty('pointer-events','none','important');
    }catch(_e){}
  }
  function activeOverlayCount(){
    var n=0;
    try{document.querySelectorAll(SELECTORS).forEach(function(el){if(looksOpen(el))n++;});}catch(_e){}
    return n;
  }
  function appShellActive(){
    try{
      var shell=document.getElementById('happyadAppShell');
      return !!(shell&&shell.classList.contains('on')&&document.body&&document.body.classList.contains('happyadAppOpen'));
    }catch(_e){return false;}
  }
  function releaseLegacyLocks(reason){
    try{
      if(activeOverlayCount()>0||lockCount>0)return false;
      var rootApp=appShellActive();
      var html=document.documentElement,body=document.body;
      LEGACY_LOCK_CLASSES.forEach(function(c){try{html&&html.classList.remove(c);body&&body.classList.remove(c);}catch(_e){}});
      if(!rootApp&&body){
        ['overflow','overflow-y','touch-action','position','top','width'].forEach(function(p){try{body.style.removeProperty(p);}catch(_e){}});
        ['overflow','overflow-y','touch-action'].forEach(function(p){try{html.style.removeProperty(p);}catch(_e){}});
      }
      try{window.__HAPPYAD_LAST_OVERLAY_UNLOCK_V615__={reason:String(reason||''),at:Date.now()};}catch(_w){}
      return true;
    }catch(_e){return false;}
  }
  function reconcile(reason){
    scheduled=false;
    removeTapShield();
    try{document.querySelectorAll(SELECTORS).forEach(neutralize);}catch(_e){}
    releaseLegacyLocks(reason||'reconcile');
  }
  function schedule(reason){
    if(scheduled)return;
    scheduled=true;
    var run=function(){reconcile(reason||'scheduled');};
    try{requestAnimationFrame(run);}catch(_e){setTimeout(run,0);}
  }
  function lock(owner){
    owner=String(owner||'overlay');
    if(locks[owner])return owner;
    locks[owner]=1;lockCount++;
    try{
      if(lockCount===1){
        savedScrollY=Math.max(0,window.scrollY||document.documentElement.scrollTop||0);
        document.documentElement.classList.add('happyadOverlayLockedV615');
        document.body.classList.add('happyadOverlayLockedV615');
      }
    }catch(_e){}
    return owner;
  }
  function unlock(owner){
    owner=String(owner||'overlay');
    if(locks[owner]){delete locks[owner];lockCount=Math.max(0,lockCount-1);}
    if(lockCount===0){
      try{document.documentElement.classList.remove('happyadOverlayLockedV615');document.body.classList.remove('happyadOverlayLockedV615');}catch(_e){}
      schedule('unlock-'+owner);
    }
    return true;
  }
  function installStyle(){
    if(document.getElementById('happyadOverlayScrollMasterV615Style'))return;
    var st=document.createElement('style');st.id='happyadOverlayScrollMasterV615Style';
    st.textContent=[
      '#'+TAP_SHIELD_ID+'{display:none!important;visibility:hidden!important;pointer-events:none!important;width:0!important;height:0!important;inset:auto!important}',
      '[data-happyad-overlay-neutralized-v615="1"]{pointer-events:none!important}',
      'html.happyadOverlayLockedV615,body.happyadOverlayLockedV615{overflow:hidden!important;overscroll-behavior:none!important}'
    ].join('\n');
    (document.head||document.documentElement).appendChild(st);
  }
  function start(){
    installStyle();removeTapShield();reconcile('start');
    try{
      observer=new MutationObserver(function(list){
        var relevant=false;
        for(var i=0;i<list.length;i++){
          var m=list[i],target=m&&m.target;
          /* R93 : les cartes Accueil ne sont jamais des overlays. Les mutations
             de classe/style et l'insertion progressive des médias dans #list
             ne doivent pas relancer une analyse globale des overlays. */
          try{if(target&&target.nodeType===1&&target.closest&&target.closest('#list'))continue;}catch(_home){}
          /* V651 : les transformations tactiles de l'image active du fullscreen Profil
             ne doivent pas relancer une analyse globale des overlays à chaque frame. */
          if(m&&m.type==='attributes'&&m.attributeName==='style'&&target&&target.nodeType===1&&target.matches&&target.matches('#happyadProfilePostFeedV581 .ha581Slide img,#happyadHomePhotoFullscreen .haHomeFsAlbumSlide img'))continue;
          /* V900 : la hauteur du bottom-sheet de partage change à chaque frame
             pendant un drag. Ce style ne doit pas relancer l'audit global des
             overlays 60 fois/s. L'état ouvert/fermé reste suivi par la classe du centre. */
          if(m&&m.type==='attributes'&&m.attributeName==='style'&&target&&target.nodeType===1&&target.id==='happyadShareSheet')continue;
          /* V901 : likes, avatars, pagination et drag de la poignée modifient souvent
             le DOM du popup Commentaires. Ces mutations internes ne changent jamais
             l'état global d'un overlay et ne doivent donc pas relancer reconcile(). */
          try{if(target&&target.nodeType===1&&target.closest&&target.closest('#happyadHomeCommentPopup')&&target.id!=='happyadHomeCommentPopup')continue;}catch(_comments){}
          if(m.type==='childList'||m.attributeName==='class'||m.attributeName==='style'||m.attributeName==='aria-hidden'){relevant=true;break;}
        }
        if(relevant)schedule('mutation');
      });
      observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','aria-hidden']});
    }catch(_e){}
    document.addEventListener('click',function(){schedule('click');setTimeout(function(){schedule('click-settle');},280);},true);
    window.addEventListener('pageshow',function(){schedule('pageshow');},true);
    window.addEventListener('message',function(ev){
      var d=ev&&ev.data,t=typeof d==='string'?d:(d&&d.type)||'';
      if(/CLOSE|HIDDEN|BACK|CANCEL|RESET/.test(String(t)))schedule('message-'+t);
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

  window.HappyOverlayMasterV615={version:VERSION,lock:lock,unlock:unlock,reconcile:reconcile,schedule:schedule,releaseLegacyLocks:releaseLegacyLocks,activeCount:activeOverlayCount};
})();
