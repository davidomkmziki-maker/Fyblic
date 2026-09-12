/* Fyblic V681 — maître unique du menu inférieur pendant les commentaires.
   - masque le dock dès qu'un commentaire s'ouvre dans Accueil, Profil, Photo ou Vidéo
   - restaure explicitement le dock après fermeture, retour, changement de page ou reprise Android
   - double contrôle : messages des modules + lecture directe des iframes de même origine
*/
(function(){
  'use strict';
  if(window.__HAPPYAD_COMMENT_OVERLAY_DOCK_MASTER_V681__)return;
  window.__HAPPYAD_COMMENT_OVERLAY_DOCK_MASTER_V681__=true;

  var BODY_CLASS='happyadCommentOverlayOpenV681';
  var AUTO_HIDDEN=['happyadDockAutoHiddenV618','happyadDockAutoHiddenV605','happyadDockAutoHiddenV607','happyadDockAutoHiddenV608'];
  var remoteLocks=new Map();
  var lastLocked=false;
  var observer=null;
  var timer=0;

  function body(){return document.body;}
  function dock(){return document.getElementById('happyadMainDockV585')||document.querySelector('.bottom.happyadMainDockV585');}
  function activeFrames(){
    try{return Array.prototype.slice.call(document.querySelectorAll('#happyadAppShell iframe.happyadAppFrame.on,iframe.happyadAppFrame.on,iframe[data-happyad-page].on'));}
    catch(_e){return [];}
  }
  function homeCommentOpen(){
    try{
      var box=document.getElementById('happyadHomeCommentPopup');
      return !!(box&&(box.classList.contains('on')||box.classList.contains('haCommentClosing')));
    }catch(_e){return false;}
  }
  function frameCommentOpen(frame){
    try{
      if(!frame||!frame.classList||!frame.classList.contains('on'))return false;
      var doc=frame.contentDocument||(frame.contentWindow&&frame.contentWindow.document);
      if(!doc)return false;
      var home=doc.getElementById('happyadHomeCommentPopup');
      if(home&&(home.classList.contains('on')||home.classList.contains('haCommentClosing')))return true;
      var panel=doc.getElementById('commentPanel');
      if(panel&&panel.classList.contains('show'))return true;
      return !!doc.querySelector('.commentPanel.show,[data-happyad-comment-overlay="open"]');
    }catch(_e){return false;}
  }
  function anyFrameCommentOpen(){
    var frames=activeFrames();
    for(var i=0;i<frames.length;i++)if(frameCommentOpen(frames[i]))return true;
    return false;
  }
  function clearAutoHidden(){
    var b=body();if(!b)return;
    AUTO_HIDDEN.forEach(function(c){b.classList.remove(c);});
    try{b.classList.remove('happyadDockScrollActiveV618');}catch(_e){}
  }
  function restoreDock(reason){
    var b=body();if(!b)return;
    b.classList.remove(BODY_CLASS);
    clearAutoHidden();
    try{
      var api=window.HappyDockAutoHideV653||window.HappyDockAutoHideV618||window.HappyDockAutoHideV608;
      if(api&&typeof api.show==='function')api.show(reason||'comment-close-v681');
    }catch(_e){}
    try{
      var d=dock();
      if(d){d.removeAttribute('data-happyad-comment-hidden-v681');}
    }catch(_e2){}
  }
  function hideDock(reason){
    var b=body();if(!b)return;
    b.classList.add(BODY_CLASS);
    try{var d=dock();if(d)d.setAttribute('data-happyad-comment-hidden-v681',String(reason||'comment-open'));}catch(_e){}
  }
  function pruneRemoteLocks(domOpen){
    var now=Date.now();
    remoteLocks.forEach(function(v,k){
      if(!v||v.open===false){remoteLocks.delete(k);return;}
      /* Si la frame active est lisible et ne contient plus aucun commentaire, un message
         de fermeture perdu ne doit jamais laisser le menu bloqué. */
      if(!domOpen&&now-Number(v.at||0)>900)remoteLocks.delete(k);
    });
  }
  function reconcile(reason){
    var domOpen=homeCommentOpen()||anyFrameCommentOpen();
    pruneRemoteLocks(domOpen);
    var locked=domOpen||remoteLocks.size>0;
    if(locked)hideDock(reason||'comment-open-v681');
    else if(lastLocked)restoreDock(reason||'comment-closed-v681');
    lastLocked=locked;
    return locked;
  }
  function lock(id,on,reason){
    id=String(id||'comment-client');
    if(on)remoteLocks.set(id,{open:true,at:Date.now(),reason:String(reason||'')});
    else remoteLocks.delete(id);
    reconcile(reason||(on?'comment-message-open':'comment-message-close'));
  }
  function clearAll(reason){
    remoteLocks.clear();
    restoreDock(reason||'comment-clear-v681');
    lastLocked=false;
  }
  function initObserver(){
    if(observer||!window.MutationObserver||!document.documentElement)return;
    observer=new MutationObserver(function(records){
      for(var i=0;i<records.length;i++){
        var r=records[i],t=r&&r.target;
        if(!t)continue;
        try{
          if(t.nodeType===1&&t.closest&&t.closest('#list')){
            var special=false;
            [].slice.call(r.addedNodes||[]).forEach(function(n){
              if(special||!n||n.nodeType!==1)return;
              if((n.id==='happyadHomeCommentPopup')||(n.matches&&n.matches('iframe.happyadAppFrame,iframe[data-happyad-page]'))||(n.querySelector&&n.querySelector('#happyadHomeCommentPopup,iframe.happyadAppFrame,iframe[data-happyad-page]')))special=true;
            });
            if(!special)continue;
          }
        }catch(_home){}
        if((t.id==='happyadHomeCommentPopup')||(t.id==='happyadAppShell')||(t.matches&&t.matches('iframe.happyadAppFrame,iframe[data-happyad-page]'))){
          reconcile('comment-dom-change-v681');return;
        }
        if(r.addedNodes&&r.addedNodes.length){reconcile('comment-dom-added-v681');return;}
      }
    });
    observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','src']});
  }
  function init(){
    initObserver();
    window.addEventListener('message',function(ev){
      try{
        var d=ev&&ev.data;if(!d||d.type!=='HAPPYAD_COMMENT_OVERLAY_V681')return;
        if(ev.origin&&ev.origin!=='null'&&ev.origin!==location.origin)return;
        lock(d.clientId||d.source||'comment-frame',!!d.open,d.reason||'comment-frame-v681');
      }catch(_e){}
    },true);
    window.addEventListener('HAPPYAD_NAV_CHANGED_V586',function(){clearAll('comment-navigation-v681');setTimeout(function(){reconcile('comment-navigation-check-v681');},80);},true);
    window.addEventListener('pageshow',function(){setTimeout(function(){reconcile('comment-pageshow-v681');},30);},{passive:true});
    window.addEventListener('focus',function(){setTimeout(function(){reconcile('comment-focus-v681');},30);},{passive:true});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)setTimeout(function(){reconcile('comment-visible-v681');},30);},true);
    window.addEventListener('pagehide',function(){clearAll('comment-pagehide-v681');},{passive:true});
    timer=setInterval(function(){reconcile('comment-watchdog-v681');},700);
    reconcile('comment-init-v681');
  }

  window.HappyCommentDockV681={
    open:function(id){lock(id||'home-comment',true,'comment-api-open-v681');},
    close:function(id){lock(id||'home-comment',false,'comment-api-close-v681');},
    clear:clearAll,
    reconcile:reconcile,
    isLocked:function(){return lastLocked;}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('comment-overlay-dock',{file:'core/comment-overlay-dock-master-v681.js',responsibility:'masquage et restauration fiables du menu inférieur pendant les commentaires',active:true,version:'V681'});}catch(_e){}
})();
