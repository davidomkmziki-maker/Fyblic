/* Fyblic V866 — protection renforcée du geste de scroll dans Mon profil et Profil visiteur.
   Le chargement/pagination des publications reste prioritaire. Les tâches secondaires lourdes
   et leurs commits après réponse réseau sont coalescés puis repris uniquement au repos réel. */
(function(){
  'use strict';
  if(window.HappyProfileScrollPriorityV866)return;

  var VERSION='V866_PROFILE_SCROLL_PRIORITY_HARD';
  var activeUntil=0;
  var jobs=Object.create(null);
  var timers=Object.create(null);
  var seq=0;
  var pointerDown=false;
  var pointerMoved=false;
  var startX=0,startY=0;
  var scrollingClass=false;

  function now(){return Date.now();}
  function markClass(on){
    if(scrollingClass===on)return;scrollingClass=on;
    try{document.documentElement.classList.toggle('haProfileScrollActiveV866',on);document.body&&document.body.classList.toggle('haProfileScrollActiveV866',on);}catch(_e){}
  }
  function arm(ms){activeUntil=Math.max(activeUntil,now()+Math.max(0,Number(ms)||0));markClass(true);}
  function isActive(){
    try{if(document.hidden)return false;}catch(_e){}
    return now()<activeUntil;
  }
  function clearTimer(key){if(timers[key]){clearTimeout(timers[key]);delete timers[key];}}
  function schedule(key,delay){
    clearTimer(key);
    function check(){
      delete timers[key];
      if(!jobs[key])return;
      if(isActive()){timers[key]=setTimeout(check,70);return;}
      /* Une marge courte évite qu'une tâche reparte entre touchend et le dernier
         scroll inertiel du navigateur. */
      timers[key]=setTimeout(function(){
        delete timers[key];
        if(!jobs[key])return;
        if(isActive()){schedule(key,70);return;}
        var item=jobs[key];delete jobs[key];
        try{item.fn();}catch(e){try{console.warn('Fyblic V866 deferred profile work',key,e);}catch(_e){}}
      },Math.max(0,Number(delay)||0));
    }
    timers[key]=setTimeout(check,0);
  }
  function defer(key,fn,delay){
    if(typeof fn!=='function')return false;
    key=String(key||('profile-job-'+(++seq)));
    jobs[key]={fn:fn,at:now()};
    schedule(key,delay==null?70:delay);
    return true;
  }
  function run(key,fn,delay){
    if(typeof fn!=='function')return false;
    return defer(key,fn,isActive()?(delay==null?90:delay):(delay==null?0:delay));
  }
  /* commit() est destiné aux callbacks qui reviennent d'un await/réseau : même si
     la requête a démarré au repos, son DOM/cache commit ne peut pas tomber en plein scroll. */
  function commit(key,fn,delay){return run('commit-'+String(key||(++seq)),fn,delay==null?70:delay);}
  function whenIdle(){
    return new Promise(function(resolve){
      function check(){
        if(isActive()){setTimeout(check,70);return;}
        setTimeout(function(){if(isActive())check();else resolve(true);},70);
      }
      check();
    });
  }
  function cancel(key){key=String(key||'');if(!key)return;delete jobs[key];clearTimer(key);delete jobs['commit-'+key];clearTimer('commit-'+key);}
  function flushIfIdle(){
    if(isActive())return false;
    markClass(false);
    Object.keys(jobs).forEach(function(key){schedule(key,0);});
    return true;
  }

  function point(ev){var p=ev&&ev.touches&&ev.touches[0]||ev;return {x:Number(p&&p.clientX||0),y:Number(p&&p.clientY||0)};}
  function begin(ev){var p=point(ev);pointerDown=true;pointerMoved=false;startX=p.x;startY=p.y;}
  function move(ev){
    if(!pointerDown)return;
    var p=point(ev),dx=Math.abs(p.x-startX),dy=Math.abs(p.y-startY);
    if(pointerMoved||dx>3||dy>3){pointerMoved=true;arm(460);}
  }
  function end(){if(pointerMoved)arm(390);pointerDown=false;pointerMoved=false;setTimeout(flushIfIdle,430);}

  try{window.addEventListener('touchstart',begin,{passive:true});window.addEventListener('touchmove',move,{passive:true});window.addEventListener('touchend',end,{passive:true});window.addEventListener('touchcancel',end,{passive:true});}catch(_e){}
  try{window.addEventListener('pointerdown',begin,{passive:true});window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',end,{passive:true});window.addEventListener('pointercancel',end,{passive:true});}catch(_e2){}
  try{window.addEventListener('scroll',function(){arm(340);setTimeout(flushIfIdle,370);},{passive:true});}catch(_e3){}
  try{window.addEventListener('wheel',function(){arm(390);setTimeout(flushIfIdle,420);},{passive:true});}catch(_e4){}
  try{window.addEventListener('scrollend',function(){arm(90);setTimeout(flushIfIdle,130);},{passive:true});}catch(_e5){}
  try{document.addEventListener('visibilitychange',function(){if(document.visibilityState!=='visible'){activeUntil=0;markClass(false);}else setTimeout(flushIfIdle,80);});}catch(_e6){}

  window.HappyProfileScrollPriorityV866={version:VERSION,isActive:isActive,run:run,defer:defer,commit:commit,whenIdle:whenIdle,cancel:cancel,flushIfIdle:flushIfIdle};
  /* alias pour les modules historiques qui recherchent encore V865 */
  window.HappyProfileScrollPriorityV865=window.HappyProfileScrollPriorityV866;
})();
