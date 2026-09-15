/* Fyblic V654 — dock stable pendant les changements de page et retour immédiat.
   - un seul événement scroll passif par document
   - masquage uniquement pendant le mouvement vers le bas
   - retour automatique après l'arrêt du scroll
   - menu toujours visible dans la Centrale vidéo, même si l'état de route arrive en retard
*/
(function(){
  'use strict';
  if(window.__HAPPYAD_DOCK_AUTO_HIDE_MASTER_V653__)return;
  window.__HAPPYAD_DOCK_AUTO_HIDE_MASTER_V653__=true;

  var VERSION='V654';
  /* La classe visuelle V618 est conservée pour ne pas modifier le CSS validé. */
  var HIDDEN_CLASS='happyadDockAutoHiddenV618';
  var OLD_HIDDEN_CLASSES=['happyadDockAutoHiddenV605','happyadDockAutoHiddenV607','happyadDockAutoHiddenV608'];
  var HIDE_DISTANCE=18;
  var SHOW_DISTANCE=12;
  var TOP_LIMIT=12;
  var IDLE_SHOW_DELAY=460;
  var NAV_STABLE_MS=900;
  var USER_SCROLL_INTENT_MS=1000;
  var navStableUntil=0;
  var activePage='home';
  var contexts=new WeakMap();
  var contextList=[];
  var frames=new WeakSet();
  var shellObserver=null;
  var scrollingTimer=0;
  var idleShowTimer=0;

  function body(){return document.body;}
  function dock(){return document.getElementById('happyadMainDockV585')||document.querySelector('.bottom.happyadMainDockV585');}
  function normalizedPage(v){v=String(v||'home').trim().toLowerCase();return v||'home';}
  function currentBodyPage(){try{return normalizedPage(document.body&&document.body.getAttribute('data-happyad-main-page')||activePage);}catch(_e){return normalizedPage(activePage);}}
  function pageFromFrame(frame){
    try{
      if(!frame)return '';
      var p=normalizedPage(frame.getAttribute('data-happyad-page')||'');
      if(p&&p!=='home')return p;
      var src=String(frame.getAttribute('src')||frame.src||'').toLowerCase();
      if(src.indexOf('modules/video.html')>=0||/\bvideo\.html(?:[?#]|$)/.test(src))return 'video';
      if(src.indexOf('modules/visitor-profile.html')>=0||/\bvisitor-profile\.html(?:[?#]|$)/.test(src))return 'profile_public';if(src.indexOf('modules/my-profile.html')>=0||/\bmy-profile\.html(?:[?#]|$)/.test(src)||src.indexOf('modules/user.html')>=0)return 'profile';
      return p||'';
    }catch(_e){return '';}
  }
  function activeFrame(){
    try{return document.querySelector('#happyadAppShell .happyadAppFrame.on[data-happyad-page],#happyadAppShell .happyadAppFrame.on,iframe.happyadAppFrame.on');}
    catch(_e){return null;}
  }
  function activeVisualPage(){
    var fr=activeFrame();
    var fp=pageFromFrame(fr);
    if(fp)return fp;
    return currentBodyPage();
  }
  function videoCentralFixed(){return activeVisualPage()==='video'||currentBodyPage()==='video';}
  function clearOldClasses(){var b=body();if(!b)return;OLD_HIDDEN_CLASSES.forEach(function(c){b.classList.remove(c);});}
  function clearIdleShow(){clearTimeout(idleShowTimer);idleShowTimer=0;}
  function dockPageVisible(page){
    page=normalizedPage(page||currentBodyPage());
    return page==='home'||page==='profile'||page==='video'||page==='message';
  }
  function navigationStable(){return Date.now()<navStableUntil;}
  function markUserScrollIntent(ctx){if(ctx)ctx.userIntentUntil=Date.now()+USER_SCROLL_INTENT_MS;}
  function userScrollIntentActive(ctx){return !!(ctx&&Date.now()<Number(ctx.userIntentUntil||0));}
  function armNavigationStable(page,reason){
    page=normalizedPage(page||currentBodyPage());
    if(!dockPageVisible(page)){navStableUntil=0;return;}
    navStableUntil=Date.now()+NAV_STABLE_MS;
    clearIdleShow();
    var b=body();
    if(b){
      b.classList.remove(HIDDEN_CLASS,'happyadDockScrollActiveV618');
      clearOldClasses();
      try{b.dataset.happyadDockNavigationStable=String(reason||page);}
      catch(_e){}
    }
    show(reason||'navigation-stable');
  }
  function markScrolling(){
    var b=body();if(!b)return;
    b.classList.add('happyadDockScrollActiveV618');
    clearTimeout(scrollingTimer);
    scrollingTimer=setTimeout(function(){try{b.classList.remove('happyadDockScrollActiveV618');}catch(_e){}},110);
  }
  function dockCanAppear(){
    var b=body(),d=dock();
    if(!b||!d||!b.classList.contains('happyadMainDockVisible'))return false;
    if(b.classList.contains('happyadPublishFullscreenV586')||b.classList.contains('haHomePhotoFsLock')||b.classList.contains('happyadPhotoSurfaceV591')||b.classList.contains('happyadInternalScreenOpenV591'))return false;
    return true;
  }
  function allowed(){return dockCanAppear()&&!videoCentralFixed();}
  function show(reason){
    var b=body();if(!b)return;
    clearOldClasses();
    b.classList.remove(HIDDEN_CLASS);
    try{b.dataset.happyadDockMotion='shown';b.dataset.happyadDockMotionReason=String(reason||'');}catch(_e){}
  }
  function hide(reason){
    var b=body();
    if(videoCentralFixed()){show('video-central-fixed');return;}
    if(!b||!allowed())return;
    clearOldClasses();
    b.classList.add(HIDDEN_CLASS);
    try{b.dataset.happyadDockMotion='hidden';b.dataset.happyadDockMotionReason=String(reason||'');}catch(_e){}
  }
  function armIdleShow(ctx,reason){
    clearIdleShow();
    if(videoCentralFixed()){show('video-central-scroll-guard');return;}
    idleShowTimer=setTimeout(function(){
      idleShowTimer=0;
      if(!dockCanAppear())return;
      if(ctx&&!contextIsActive(ctx))return;
      show(reason||'scroll-idle');
    },IDLE_SHOW_DELAY);
  }
  function num(v){v=Number(v);return Number.isFinite(v)?v:0;}
  function rootScroller(doc){return doc&&(doc.scrollingElement||doc.documentElement||doc.body);}
  function isVerticalScroller(el,doc){
    try{
      if(!el||el===doc||el===doc.documentElement||el===doc.body||el===rootScroller(doc))return true;
      if(el.nodeType!==1)return false;
      return num(el.scrollHeight)>num(el.clientHeight)+6;
    }catch(_e){return false;}
  }
  function scrollTopOf(target,win,doc){
    try{
      if(target&&target.nodeType===1&&target!==doc.documentElement&&target!==doc.body&&target!==rootScroller(doc)&&isVerticalScroller(target,doc))return Math.max(0,num(target.scrollTop));
      var se=rootScroller(doc);
      return Math.max(0,num(win&&win.scrollY)||num(se&&se.scrollTop)||num(doc&&doc.documentElement&&doc.documentElement.scrollTop)||num(doc&&doc.body&&doc.body.scrollTop));
    }catch(_e){return 0;}
  }
  function contextIsActive(ctx){
    if(!ctx)return false;
    var page=activeVisualPage();
    if(ctx.kind==='home')return page==='home';
    if(ctx.kind==='frame'){
      if(page==='home')return false;
      var fr=ctx.frame;
      if(!fr||!fr.classList||!fr.classList.contains('on'))return false;
      var framePage=pageFromFrame(fr);
      return framePage===page || (page==='profile_public'&&framePage==='profile') || activeFrame()===fr;
    }
    return false;
  }
  function process(ctx,target,y){
    if(!ctx||!contextIsActive(ctx))return;
    if(videoCentralFixed()){show('video-central-scroll');return;}
    if(!allowed())return;
    y=num(y);
    var key=(target&&typeof target==='object')?target:ctx.doc;
    /* V654 : un changement de page peut produire plusieurs scrolls programmatiques
       (restauration de position, squelette, médias qui prennent leur hauteur). Ces
       scrolls ne doivent jamais faire disparaître le dock pendant l'ouverture. */
    if(navigationStable()){
      ctx.states.set(key,{last:y,trend:0});
      show('navigation-stable-'+ctx.label);
      return;
    }
    /* Le masquage automatique répond uniquement à un vrai geste de défilement.
       Un scroll généré par le code ou par un reflow met seulement à jour la référence. */
    if(!userScrollIntentActive(ctx)){
      var passiveState=ctx.states.get(key);
      if(passiveState){passiveState.last=y;passiveState.trend=0;}
      else ctx.states.set(key,{last:y,trend:0});
      return;
    }
    var state=ctx.states.get(key);
    if(!state){ctx.states.set(key,{last:y,trend:0});if(y<=TOP_LIMIT)show('top-first-'+ctx.label);armIdleShow(ctx,'scroll-idle-first-'+ctx.label);return;}
    var delta=y-state.last;
    state.last=y;
    if(Math.abs(delta)<1.5){armIdleShow(ctx,'scroll-idle-small-'+ctx.label);return;}
    if((delta>0&&state.trend<0)||(delta<0&&state.trend>0))state.trend=0;
    state.trend+=delta;
    if(y<=TOP_LIMIT){state.trend=0;show('top-'+ctx.label);armIdleShow(ctx,'scroll-idle-top-'+ctx.label);return;}
    if(state.trend>=HIDE_DISTANCE){state.trend=0;hide('scroll-forward-'+ctx.label);armIdleShow(ctx,'scroll-idle-forward-'+ctx.label);return;}
    if(state.trend<=-SHOW_DISTANCE){state.trend=0;show('scroll-back-'+ctx.label);armIdleShow(ctx,'scroll-idle-back-'+ctx.label);return;}
    armIdleShow(ctx,'scroll-idle-'+ctx.label);
  }
  function schedule(ctx,target){
    if(!ctx||ctx.raf)return;
    ctx.pendingTarget=target;
    ctx.raf=(ctx.win.requestAnimationFrame||window.requestAnimationFrame)(function(){
      ctx.raf=0;
      var t=ctx.pendingTarget||rootScroller(ctx.doc);ctx.pendingTarget=null;
      if(!contextIsActive(ctx))return;
      markScrolling();
      process(ctx,t,scrollTopOf(t,ctx.win,ctx.doc));
    });
  }
  function bindContext(win,doc,label,kind,frame){
    if(!win||!doc)return null;
    var found=contexts.get(doc);if(found)return found;
    var ctx={win:win,doc:doc,label:String(label||kind||'context'),kind:kind||'frame',frame:frame||null,states:new WeakMap(),raf:0,pendingTarget:null,userIntentUntil:0,gestureY:null,gesturePointer:null};
    contexts.set(doc,ctx);contextList.push(ctx);
    function gestureStart(y,id){ctx.gestureY=num(y);ctx.gesturePointer=id==null?'':String(id);}
    function gestureMove(y,id){
      if(ctx.gestureY==null)return;
      if(ctx.gesturePointer&&id!=null&&String(id)!==ctx.gesturePointer)return;
      if(Math.abs(num(y)-num(ctx.gestureY))>=7)markUserScrollIntent(ctx);
    }
    try{doc.addEventListener('touchstart',function(ev){var t=ev.touches&&ev.touches[0];if(t)gestureStart(t.clientY,'touch');},{capture:true,passive:true});}catch(_ts){}
    try{doc.addEventListener('touchmove',function(ev){var t=ev.touches&&ev.touches[0];if(t)gestureMove(t.clientY,'touch');},{capture:true,passive:true});}catch(_tm){}
    try{doc.addEventListener('pointerdown',function(ev){if(!ev||ev.pointerType==='mouse'&&ev.button!==0)return;gestureStart(ev.clientY,ev.pointerId);},{capture:true,passive:true});}catch(_pd){}
    try{doc.addEventListener('pointermove',function(ev){if(!ev)return;gestureMove(ev.clientY,ev.pointerId);},{capture:true,passive:true});}catch(_pm){}
    try{doc.addEventListener('wheel',function(){markUserScrollIntent(ctx);},{capture:true,passive:true});}catch(_wh){}
    try{doc.addEventListener('keydown',function(ev){var k=String(ev&&ev.key||'');if(k==='ArrowDown'||k==='ArrowUp'||k==='PageDown'||k==='PageUp'||k==='Home'||k==='End'||k===' ')markUserScrollIntent(ctx);},true);}catch(_kd){}
    function onScroll(ev){
      var target=ev&&ev.target;
      if(target===doc||target===win||!target)target=rootScroller(doc);
      if(!isVerticalScroller(target,doc))return;
      ctx.pendingTarget=target;schedule(ctx,target);
    }
    try{doc.addEventListener('scroll',onScroll,{capture:true,passive:true});}catch(_e){}
    try{win.addEventListener('scroll',function(){ctx.pendingTarget=rootScroller(doc);schedule(ctx,ctx.pendingTarget);},{passive:true});}catch(_e2){}
    /* Une lecture vidéo dans la frame Vidéo doit toujours restaurer le menu. */
    if(kind==='frame'){
      try{doc.addEventListener('play',function(){if(pageFromFrame(frame)==='video'&&contextIsActive(ctx))show('video-play');},true);}catch(_e3){}
      try{doc.addEventListener('playing',function(){if(pageFromFrame(frame)==='video'&&contextIsActive(ctx))show('video-playing');},true);}catch(_e4){}
    }
    return ctx;
  }
  function attachFrame(frame){
    if(!frame)return;
    try{
      var win=frame.contentWindow,doc=frame.contentDocument||(win&&win.document);
      if(!win||!doc)return;
      bindContext(win,doc,'frame-'+String(frame.getAttribute('data-happyad-page')||frame.id||''),'frame',frame);
      if(pageFromFrame(frame)==='video'&&frame.classList&&frame.classList.contains('on'))show('video-frame-attached');
    }catch(_e){}
  }
  function bindFrame(frame){
    if(!frame)return;
    if(!frames.has(frame)){
      frames.add(frame);
      try{frame.addEventListener('load',function(){attachFrame(frame);if(pageFromFrame(frame)==='video'&&frame.classList.contains('on'))show('video-frame-load');},{passive:true});}catch(_e){}
    }
    attachFrame(frame);
  }
  function scanFrames(){
    try{document.querySelectorAll('#happyadAppShell iframe.happyadAppFrame,iframe[data-happyad-page]').forEach(bindFrame);}catch(_e){}
    if(videoCentralFixed())show('video-scan-fixed');
  }
  function setActivePage(page){
    activePage=normalizedPage(page||currentBodyPage());
    clearIdleShow();
    if(videoCentralFixed())show('video-central-fixed');
  }
  function reset(reason){
    clearIdleShow();
    contextList.forEach(function(ctx){ctx.states=new WeakMap();ctx.pendingTarget=null;});
    show(reason||'reset');
    scanFrames();
  }
  function init(){
    bindContext(window,document,'home','home',null);
    scanFrames();
    try{
      var shell=document.getElementById('happyadAppShell');
      if(shell&&window.MutationObserver){
        shellObserver=new MutationObserver(function(records){
          records.forEach(function(r){
            Array.prototype.forEach.call(r.addedNodes||[],function(n){
              if(!n||n.nodeType!==1)return;
              if(n.matches&&n.matches('iframe.happyadAppFrame,iframe[data-happyad-page]'))bindFrame(n);
              if(n.querySelectorAll)n.querySelectorAll('iframe.happyadAppFrame,iframe[data-happyad-page]').forEach(bindFrame);
            });
            if(r.type==='attributes'&&r.target&&r.target.matches&&r.target.matches('iframe.happyadAppFrame,iframe[data-happyad-page]'))bindFrame(r.target);
          });
          if(videoCentralFixed())show('video-frame-state');
        });
        shellObserver.observe(shell,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-happyad-page']});
      }
    }catch(_e){}
    document.addEventListener('pointerdown',function(ev){
      try{if(ev.target&&ev.target.closest&&ev.target.closest('#happyadMainDockV585'))show('dock-touch');}catch(_e){}
    },{capture:true,passive:true});
    window.addEventListener('HAPPYAD_NAV_CHANGED_V586',function(ev){
      var page='home';
      try{page=ev&&ev.detail&&ev.detail.page||'home';setActivePage(page);}catch(_e){page='home';setActivePage('home');}
      armNavigationStable(page,videoCentralFixed()?'video-central-navigation':'navigation');
      scanFrames();
    },true);
    window.addEventListener('message',function(ev){
      try{
        var type=String(ev&&ev.data&&ev.data.type||'');
        if(type==='HAPPYAD_MESSAGE_CENTER_READY'||type==='HAPPYAD_PROFILE_READY'||type==='HAPPYAD_VIDEO_READY'||type==='HAPPYAD_VIDEO_TAB_READY_V594'||type==='HAPPYAD_PROFILE_SHOW_V601'||type==='HAPPYAD_APP_FRAME_VISIBLE')scanFrames();
        if((type==='HAPPYAD_VIDEO_READY'||type==='HAPPYAD_VIDEO_TAB_READY_V594')&&videoCentralFixed())show('video-ready-fixed');
        if(type==='HAPPYAD_DOCK_SCROLL_V608'){
          if(videoCentralFixed())show('video-module-message');
          else if(ev.data.direction==='hide'){hide('module-message');armIdleShow(null,'module-message-idle');}
          else if(ev.data.direction==='show')show('module-message');
        }
      }catch(_e){}
    },true);
    window.addEventListener('resize',function(){show('resize');},{passive:true});
    window.addEventListener('orientationchange',function(){show('orientation');},{passive:true});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)show('visible');},true);
    window.addEventListener('pageshow',function(){show(videoCentralFixed()?'video-pageshow':'pageshow');scanFrames();},{passive:true});
    setActivePage(currentBodyPage());
    clearOldClasses();
    show(videoCentralFixed()?'video-central-init':'init');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  var api={version:VERSION,show:show,hide:hide,scan:scanFrames,reset:reset,setActivePage:setActivePage,stabilize:armNavigationStable,isVideoFixed:videoCentralFixed};
  window.HappyDockAutoHideV653=api;
  window.HappyDockAutoHideV618=api;
  window.HappyDockAutoHideV608=api;
  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('dock-auto-hide',{file:'core/dock-auto-hide-master-v653.js',responsibility:'scroll utilisateur uniquement; dock stable pendant navigation; retour automatique immédiat; dock toujours visible dans la centrale vidéo',active:true,version:VERSION});}catch(_e){}
})();
