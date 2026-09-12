(function(){
  'use strict';
  if(window.__HAPPYAD_HOME_PHOTO_FULLSCREEN_MASTER_V591__)return;
  window.__HAPPYAD_HOME_PHOTO_FULLSCREEN_MASTER_V591__=true;

  var VERSION='V932_PROFILE_FULLSCREEN_HANDOFF_POINTER_RELEASE';
  var LAYER_ID='home-photo';
  var localObserver=null;
  var handoffBusyV928=false;

  function controller(){return window.HappyInternalReturnV591||null;}
  function dock(){return document.getElementById('happyadMainDockV585')||document.querySelector('.bottom.happyadMainDockV585');}
  function forceDock(on){
    try{
      var d=dock();
      document.body.classList.toggle('happyadPhotoSurfaceV591',!!on);
      if(on)document.body.classList.remove('happyadMainDockVisible');
      if(!d)return;
      if(on){d.setAttribute('aria-hidden','true');d.style.setProperty('display','none','important');d.style.setProperty('visibility','hidden','important');d.style.setProperty('pointer-events','none','important');}
      else{d.removeAttribute('aria-hidden');d.style.removeProperty('display');d.style.removeProperty('visibility');d.style.removeProperty('pointer-events');}
    }catch(_e){}
  }
  function restoreHomeSource(){
    try{
      var s=window.__happyadPhotoReturnSourceV478||{};
      var y=Number(s.scrollY);
      if(isFinite(y))requestAnimationFrame(function(){requestAnimationFrame(function(){try{window.scrollTo(0,y);}catch(_e){}});});
    }catch(_e){}
  }
  function clearSuspendedStyleV928(box){
    if(!box)return;
    try{
      box.style.removeProperty('display');
      box.style.removeProperty('visibility');
      box.style.removeProperty('pointer-events');
      box.removeAttribute('data-happyad-route-suspended-v928');
    }catch(_e){}
  }
  var resumeShieldTimerV930=0;
  function armResumeInputShieldV930(){
    try{
      var old=document.getElementById('happyadPhotoProfileReturnShieldV930');
      if(old)old.remove();
      var shield=document.createElement('div');
      shield.id='happyadPhotoProfileReturnShieldV930';
      shield.setAttribute('aria-hidden','true');
      shield.style.cssText='position:fixed!important;inset:0!important;z-index:2147483647!important;background:transparent!important;pointer-events:auto!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important;';
      var swallow=function(e){try{if(e&&e.cancelable)e.preventDefault();if(e)e.stopPropagation();if(e&&e.stopImmediatePropagation)e.stopImmediatePropagation();}catch(_e){}};
      ['pointerdown','pointerup','click','touchstart','touchmove','touchend'].forEach(function(type){shield.addEventListener(type,swallow,{capture:true,passive:false});});
      (document.body||document.documentElement).appendChild(shield);
      clearTimeout(resumeShieldTimerV930);
      resumeShieldTimerV930=setTimeout(function(){resumeShieldTimerV930=0;try{shield.remove();}catch(_e){}},360);
      return true;
    }catch(_e){return false;}
  }
  function resumeLocalV928(){
    var box=document.getElementById('happyadHomePhotoFullscreen');
    if(!box)return false;
    clearSuspendedStyleV928(box);
    try{
      box.classList.add('on');
      box.setAttribute('aria-hidden','false');
      document.body.classList.add('haHomePhotoFsLock');
    }catch(_e){}
    /* V932 : si ce fullscreen provenait de Mon profil/Profil visiteur, son bridge
       avait verrouille #happyadAppShell pendant l'affichage photo. Le verrou est
       volontairement retire pendant le handoff vers un profil visiteur, puis
       reinstalle uniquement quand le fullscreen revient au premier plan. */
    try{
      if(box.getAttribute('data-happyad-profile-underlay-suspended-v932')==='1'){
        var bridge=window.HappyProfilePhotoFullscreenV854R8||window.HappyProfilePhotoBridgeV854R8;
        if(bridge&&typeof bridge.lock==='function')bridge.lock();
        box.removeAttribute('data-happyad-profile-underlay-suspended-v932');
      }
    }catch(_profileRelock){}
    ensureLocalBack();forceDock(true);
    /* V930 : le clic Retour qui ferme le profil visiteur ne doit jamais tomber
       sur un élément de la page source (ex. cercle Story du profil) pendant le
       même geste tactile. Un bouclier transparent très court absorbe uniquement
       la fin de ce geste, puis disparaît automatiquement. */
    armResumeInputShieldV930();
    return true;
  }
  function suspendForRouteV928(){
    var box=document.getElementById('happyadHomePhotoFullscreen'),c=controller();
    if(!box||!box.classList.contains('on')||!c||typeof c.suspend!=='function')return null;
    var beforeEntry='';try{beforeEntry=String((history.state||{}).__happyadNavEntryV927||'');}catch(_state){}
    if(!c.suspend(LAYER_ID,{onResume:resumeLocalV928}))return null;
    try{
      box.setAttribute('data-happyad-route-suspended-v928','1');
      box.setAttribute('aria-hidden','true');
      box.style.setProperty('display','none','important');
      box.style.setProperty('visibility','hidden','important');
      box.style.setProperty('pointer-events','none','important');
      document.body.classList.remove('haHomePhotoFsLock');
    }catch(_e){}
    /* V932 : cas specifique d'un fullscreen cree depuis un profil. Le bridge
       profile-photo-parent verrouille tout le shell avec pointer-events:none afin
       que la page situee sous la photo ne capte rien. Lorsque la photo est
       suspendue pour ouvrir C = Profil visiteur, ce verrou ne doit surtout pas
       rester sur le shell, sinon le bouton Retour de C est visible mais ne recoit
       aucun clic. Le bouton Retour telephone fonctionnait car il ne depend pas des
       pointer events : c'etait le signal qui permettait d'isoler la cause. */
    try{
      var shell=document.getElementById('happyadAppShell');
      var bridge=window.HappyProfilePhotoFullscreenV854R8||window.HappyProfilePhotoBridgeV854R8;
      if(shell&&shell.getAttribute('data-profile-photo-underlay-v854r8')==='1'&&bridge&&typeof bridge.unlock==='function'){
        box.setAttribute('data-happyad-profile-underlay-suspended-v932','1');
        bridge.unlock();
      }
    }catch(_profileUnlock){}
    forceDock(false);
    return {entry:beforeEntry};
  }
  function cancelHandoffV928(){
    try{var c=controller();if(c&&typeof c.resume==='function')return c.resume(LAYER_ID,{onBack:closeLocal,onResume:resumeLocalV928});}catch(_e){}
    return resumeLocalV928();
  }
  function handoffToProfileV928(openRoute){
    if(handoffBusyV928||typeof openRoute!=='function')return false;
    var suspended=suspendForRouteV928();if(!suspended)return false;
    handoffBusyV928=true;
    var result;
    try{result=openRoute();}
    catch(err){cancelHandoffV928();handoffBusyV928=false;throw err;}
    setTimeout(function(){
      handoffBusyV928=false;
      /* Une ouverture valide crée immédiatement l'entrée C. Si aucune nouvelle
         entrée n'existe, rendre B au lieu de laisser le fullscreen masqué. */
      try{
        var box=document.getElementById('happyadHomePhotoFullscreen');
        var currentEntry=String((history.state||{}).__happyadNavEntryV927||'');
        if(box&&box.getAttribute('data-happyad-route-suspended-v928')==='1'&&suspended.entry&&currentEntry===suspended.entry)cancelHandoffV928();
      }catch(_e){}
    },80);
    return result;
  }
  function discardSuspendedV928(){
    var box=document.getElementById('happyadHomePhotoFullscreen');
    if(!box||box.getAttribute('data-happyad-route-suspended-v928')!=='1')return false;
    try{
      box.classList.remove('on');box.setAttribute('aria-hidden','true');
      document.body.classList.remove('haHomePhotoFsLock');
      var tr=box.querySelector('.haHomeFsAlbumTrack');if(tr)tr.innerHTML='';
    }catch(_e){}
    clearSuspendedStyleV928(box);forceDock(false);return true;
  }
  function closeLocal(){
    var box=document.getElementById('happyadHomePhotoFullscreen');
    if(!box)return false;
    try{
      clearSuspendedStyleV928(box);
      box.classList.remove('on');
      box.setAttribute('aria-hidden','true');
      document.body.classList.remove('haHomePhotoFsLock');
      var tr=box.querySelector('.haHomeFsAlbumTrack');if(tr)tr.innerHTML='';
    }catch(_e){}
    try{var c=controller();if(c)c.close(LAYER_ID);}catch(_e){}
    forceDock(false);
    restoreHomeSource();
    return true;
  }
  function requestBack(ev){
    if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}
    try{var c=controller();if(c&&typeof c.back==='function')return c.back(LAYER_ID);}catch(_e){}
    return closeLocal();
  }
  function ensureLocalBack(){
    var box=document.getElementById('happyadHomePhotoFullscreen');
    if(!box)return null;
    var b=box.querySelector('.haHomeFsBackV591');
    if(!b){
      var old=box.querySelector('.haHomeFsBackV590,.haHomeFsClose');
      b=old||document.createElement('button');
      b.type='button';
      b.className='haHomeFsClose haHomeFsBackV591 happyadInternalBackV591';
      b.setAttribute('aria-label','Revenir à la page précédente');
      b.setAttribute('data-happyad-internal-return-v591','1');
      b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
      if(!old){var card=box.querySelector('.haHomeFsCard')||box;card.insertBefore(b,card.firstChild||null);}
    }
    b.setAttribute('data-happyad-internal-return-v591','1');
    if(!b.__happyadV591Bound){b.__happyadV591Bound=true;b.addEventListener('click',requestBack,true);}
    return b;
  }
  function syncLocal(){
    var box=document.getElementById('happyadHomePhotoFullscreen');
    if(!box)return;
    if(box.getAttribute('data-happyad-route-suspended-v928')==='1')return;
    var open=box.classList.contains('on');
    if(open){
      ensureLocalBack();box.setAttribute('aria-hidden','false');forceDock(true);
      try{var c=controller();if(c)c.open(LAYER_ID,{onBack:closeLocal});}catch(_e){}
    }else{
      try{var c2=controller();if(c2)c2.close(LAYER_ID);}catch(_e){}
      forceDock(false);
    }
  }
  function observeLocal(){
    var box=document.getElementById('happyadHomePhotoFullscreen');
    if(!box)return;
    if(localObserver)try{localObserver.disconnect();}catch(_e){}
    localObserver=new MutationObserver(syncLocal);
    localObserver.observe(box,{attributes:true,attributeFilter:['class'],childList:true,subtree:false});
    syncLocal();
  }
  function patchLocalOpen(){
    try{
      var old=window.happyadOpenHomePhotoFullscreen;
      if(typeof old!=='function'||old.__happyadV591Wrapped)return;
      var wrapped=async function(){
        var stale=document.getElementById('happyadHomePhotoFullscreen');if(stale)clearSuspendedStyleV928(stale);
        forceDock(true);
        try{var c=controller();if(c)c.open(LAYER_ID,{onBack:closeLocal});}catch(_e){}
        var result;
        try{result=await old.apply(this,arguments);}catch(err){try{var c2=controller();if(c2)c2.close(LAYER_ID);}catch(_e){}forceDock(false);throw err;}
        ensureLocalBack();observeLocal();syncLocal();
        return result;
      };
      wrapped.__happyadV591Wrapped=true;
      window.happyadOpenHomePhotoFullscreen=wrapped;
    }catch(_e){}
  }
  function start(){patchLocalOpen();observeLocal();setTimeout(patchLocalOpen,80);setTimeout(patchLocalOpen,500);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('HAPPYAD_MAIN_MENU_NAVIGATION_V927',discardSuspendedV928,true);
  window.HappyHomePhotoFullscreenV591={version:VERSION,close:closeLocal,back:requestBack,handoffToProfile:handoffToProfileV928,resume:resumeLocalV928};
})();
