/* Fyblic V681 — client léger des commentaires dans les modules iframe. */
(function(){
  'use strict';
  if(window.__HAPPYAD_COMMENT_OVERLAY_CLIENT_V681__)return;
  window.__HAPPYAD_COMMENT_OVERLAY_CLIENT_V681__=true;
  if(window.parent===window)return;

  var clientId='comment-'+String(location.pathname||'module').replace(/[^a-z0-9]+/gi,'-')+'-'+Math.random().toString(36).slice(2,8);
  var last=null,treeObserver=null,targetObserver=null,timer=0;
  var observed=new WeakSet();
  function candidates(){
    var out=[];
    try{var p=document.getElementById('happyadHomeCommentPopup');if(p)out.push(p);}catch(_e){}
    try{var c=document.getElementById('commentPanel');if(c)out.push(c);}catch(_e2){}
    return out;
  }
  function isOpen(){
    try{
      var popup=document.getElementById('happyadHomeCommentPopup');
      if(popup&&(popup.classList.contains('on')||popup.classList.contains('haCommentClosing')))return true;
      var panel=document.getElementById('commentPanel');
      if(panel&&panel.classList.contains('show'))return true;
      return !!document.querySelector('.commentPanel.show,[data-happyad-comment-overlay="open"]');
    }catch(_e){return false;}
  }
  function send(open,reason,force){
    open=!!open;
    if(!force&&last===open)return;
    last=open;
    try{window.parent.postMessage({type:'HAPPYAD_COMMENT_OVERLAY_V681',clientId:clientId,source:location.pathname,open:open,reason:String(reason||''),at:Date.now()},'*');}catch(_e){}
  }
  function check(reason){send(isOpen(),reason,false);}
  function bindTargets(){
    candidates().forEach(function(el){
      if(observed.has(el))return;
      observed.add(el);
      try{targetObserver.observe(el,{attributes:true,attributeFilter:['class','style']});}catch(_e){}
    });
  }
  function init(){
    try{
      targetObserver=new MutationObserver(function(){check('module-comment-state-v681');});
      bindTargets();
      treeObserver=new MutationObserver(function(){bindTargets();check('module-comment-added-v681');});
      treeObserver.observe(document.body||document.documentElement,{subtree:true,childList:true});
    }catch(_e){}
    document.addEventListener('click',function(){setTimeout(function(){bindTargets();check('module-click-v681');},0);setTimeout(function(){check('module-click-late-v681');},260);},true);
    document.addEventListener('touchend',function(){setTimeout(function(){bindTargets();check('module-touch-v681');},0);setTimeout(function(){check('module-touch-late-v681');},260);},{capture:true,passive:true});
    document.addEventListener('visibilitychange',function(){check('module-visibility-v681');},true);
    window.addEventListener('pageshow',function(){bindTargets();check('module-pageshow-v681');},{passive:true});
    window.addEventListener('pagehide',function(){send(false,'module-pagehide-v681',true);},{passive:true});
    window.addEventListener('beforeunload',function(){send(false,'module-unload-v681',true);});
    timer=setInterval(function(){bindTargets();check('module-watchdog-v681');},700);
    check('module-init-v681');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
