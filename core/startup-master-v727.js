(function(){
  'use strict';
  if(window.__HAPPYAD_STARTUP_MASTER_V727__)return;
  window.__HAPPYAD_STARTUP_MASTER_V727__=true;

  var STARTED_AT=Date.now();
  var STARTUP_LOCK_MS=9000;
  var lastHiddenAt=0;
  var lastVisibleAt=STARTED_AT;
  var userInteracted=false;
  var lastByKey=Object.create(null);

  function now(){return Date.now();}
  function homeBootActive(){return !!window.__HAPPYAD_HOME_BOOT_ACTIVE_V655__;}
  function startupActive(){return homeBootActive() || now()-STARTED_AT<STARTUP_LOCK_MS;}
  function markInteraction(){userInteracted=true;}

  ['pointerdown','touchstart','wheel','keydown'].forEach(function(type){
    try{window.addEventListener(type,markInteraction,{capture:true,passive:true,once:true});}catch(_e){}
  });
  try{window.addEventListener('scroll',function(){if((window.scrollY||0)>36)userInteracted=true;},{passive:true});}catch(_e){}
  try{document.addEventListener('visibilitychange',function(){
    if(document.hidden)lastHiddenAt=now();
    else lastVisibleAt=now();
  },true);}catch(_e){}

  function allowSoft(reason){
    reason=String(reason||'soft');
    var t=now();
    if(startupActive())return false;
    if(/pageshow/i.test(reason) && !userInteracted && t-STARTED_AT<15000)return false;
    if(/focus|visible/i.test(reason)){
      var hiddenFor=lastHiddenAt?Math.max(0,t-lastHiddenAt):0;
      if(hiddenFor<12000 && t-lastVisibleAt<1600)return false;
    }
    var key='soft:'+reason;
    if(t-Number(lastByKey[key]||0)<2500)return false;
    lastByKey[key]=t;
    return true;
  }

  function allowRadar(reason){
    var t=now();
    if(startupActive() && reason!=='home-boot')return false;
    if(t-Number(lastByKey.radar||0)<1400)return false;
    lastByKey.radar=t;
    return true;
  }

  function allowPagination(){
    if(startupActive() && !userInteracted)return false;
    return userInteracted || now()-STARTED_AT>12000;
  }

  function whenIdle(fn,delay){
    delay=Math.max(0,Number(delay||0));
    var run=function(){
      try{
        if('requestIdleCallback' in window)window.requestIdleCallback(function(){fn();},{timeout:1800});
        else setTimeout(fn,0);
      }catch(_e){setTimeout(fn,0);}
    };
    setTimeout(run,delay);
  }

  window.HappyStartupV727={
    version:'HAPPYAD_STARTUP_V727',
    startedAt:STARTED_AT,
    startupActive:startupActive,
    allowSoft:allowSoft,
    allowRadar:allowRadar,
    allowPagination:allowPagination,
    whenIdle:whenIdle,
    interacted:function(){return userInteracted;}
  };
})();
