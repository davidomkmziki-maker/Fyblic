/* Fyblic V868 — priorité globale au geste de scroll, Accueil et modules.
   Ce maître ne change ni le rendu ni le moteur de scroll. Il décale uniquement
   les travaux secondaires lourds (caches, avatars, identité) tant que le doigt
   ou l'inertie de l'Accueil sont actifs. */
(function(){
  'use strict';
  if(window.HappyadHomeScrollPriorityV863)return;

  var VERSION='V868_HOME_GLOBAL_SCROLL_PRIORITY';
  var jobs=Object.create(null);
  var timers=Object.create(null);
  var seq=0;

  function feedScrollActive(){
    try{
      var v=window.HappyHomeFeedViewV1;
      return !!(v&&typeof v.isScrollActive==='function'&&v.isScrollActive());
    }catch(_e){return false;}
  }
  function isActive(){
    try{if(document.hidden)return false;}catch(_e){}
    try{
      var global=window.HappyadGlobalScrollCoordinatorV868;
      if(global&&typeof global.isActive==='function'&&global.isActive())return true;
    }catch(_e2){}
    return feedScrollActive();
  }
  function clearTimer(key){
    if(timers[key]){clearTimeout(timers[key]);delete timers[key];}
  }
  function schedule(key,delay){
    clearTimer(key);
    timers[key]=setTimeout(function check(){
      delete timers[key];
      if(!jobs[key])return;
      if(isActive()){
        timers[key]=setTimeout(check,110);
        return;
      }
      var item=jobs[key];
      /* Une nouvelle interaction peut commencer entre le premier test et ce
         macrotask. On vérifie donc encore juste avant le travail lourd. */
      timers[key]=setTimeout(function(){
        delete timers[key];
        if(!jobs[key])return;
        if(isActive()){schedule(key,110);return;}
        item=jobs[key];delete jobs[key];
        try{item.fn();}catch(e){try{console.warn('Fyblic V863 deferred work',key,e);}catch(_e){}}
      },Math.max(0,Number(delay)||0));
    },0);
  }
  function defer(key,fn,delay){
    if(typeof fn!=='function')return false;
    key=String(key||('job-'+(++seq)));
    jobs[key]={fn:fn,at:Date.now()};
    schedule(key,delay==null?70:delay);
    return true;
  }
  function run(key,fn,delay){
    if(typeof fn!=='function')return false;
    if(isActive())return defer(key,fn,delay==null?90:delay);
    /* Même au repos on sort du handler courant : une notification d'auth ou
       d'avatar ne doit pas monopoliser le même frame que le toucher. */
    return defer(key,fn,delay==null?0:delay);
  }
  function whenIdle(){
    return new Promise(function(resolve){
      function check(){
        if(!isActive()){setTimeout(function(){if(isActive())check();else resolve(true);},70);return;}
        setTimeout(check,110);
      }
      check();
    });
  }
  function cancel(key){key=String(key||'');if(!key)return;delete jobs[key];clearTimer(key);}
  function flushIfIdle(){
    if(isActive())return false;
    Object.keys(jobs).forEach(function(key){schedule(key,0);});
    return true;
  }

  window.HappyadHomeScrollPriorityV863={
    version:VERSION,
    isActive:isActive,
    run:run,
    defer:defer,
    whenIdle:whenIdle,
    cancel:cancel,
    flushIfIdle:flushIfIdle
  };

  try{window.addEventListener('scrollend',flushIfIdle,{passive:true});}catch(_e){}
  try{window.addEventListener('touchend',function(){setTimeout(flushIfIdle,430);},{passive:true});}catch(_e2){}
  try{window.addEventListener('touchcancel',function(){setTimeout(flushIfIdle,430);},{passive:true});}catch(_e3){}
  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('home-scroll-priority',{file:'core/home-scroll-priority-master-v863.js',responsibility:'donner la priorité absolue au geste Accueil et décaler uniquement les travaux secondaires lourds',active:true,version:VERSION});}catch(_e4){}
})();
