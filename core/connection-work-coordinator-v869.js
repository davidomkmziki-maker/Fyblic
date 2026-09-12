/* Fyblic V869 — coordinateur des travaux réseau non critiques.
   Les canaux Realtime continuent de recevoir leurs événements. Ce maître
   coalesce uniquement les lectures, sérialisations et peintures secondaires,
   puis les exécute lorsque le scroll est au repos et la surface concernée visible. */
(function(){
  'use strict';
  if(window.HappyadConnectionWorkCoordinatorV869)return;

  var VERSION='V869_CONNECTION_WORK_COORDINATOR_PHASE2';
  var jobs=Object.create(null);
  var lastRun=Object.create(null);
  var timer=0;
  var seq=0;
  var stats={scheduled:0,replaced:0,ran:0,cancelled:0,lastKey:'',lastAt:0};

  function now(){return Date.now?Date.now():(new Date()).getTime();}
  function finite(value,fallback){var n=Number(value);return Number.isFinite(n)?n:Number(fallback)||0;}
  function clean(value){return String(value==null?'':value).trim();}
  function embedded(){try{return !!(window.parent&&window.parent!==window);}catch(_e){return false;}}
  function scrollActive(){
    try{var g=window.HappyadGlobalScrollCoordinatorV868;return !!(g&&typeof g.isActive==='function'&&g.isActive());}catch(_e){return false;}
  }
  function frameVisible(){
    try{
      if(!embedded())return !document.hidden;
      var frame=window.frameElement;if(!frame)return !document.hidden;
      if(frame.hasAttribute('inert')||frame.getAttribute('aria-hidden')==='true')return false;
      return frame.classList.contains('on')&&!document.hidden;
    }catch(_e){return false;}
  }
  function homeVisible(){
    try{
      if(document.hidden)return false;
      if(document.body&&(document.body.classList.contains('happyadInternalScreenOpenV591')||document.body.classList.contains('happyadNotificationInternalV591')))return false;
      if(document.documentElement&&document.documentElement.classList.contains('happyadNotificationInternalV591'))return false;
      var navigation=window.HappyNavigation;
      if(navigation&&typeof navigation.currentPage==='function')return clean(navigation.currentPage())==='home';
      return !(document.body&&document.body.classList.contains('happyadAppOpen'));
    }catch(_e){return false;}
  }
  function surfaceVisible(surface){
    surface=clean(surface).toLowerCase();
    if(!surface||surface==='any')return !document.hidden;
    if(embedded())return frameVisible();
    if(surface==='home'||surface==='radar'||surface==='feed')return homeVisible();
    return !document.hidden;
  }
  function ready(item,stamp){
    if(!item||typeof item.fn!=='function'||scrollActive())return false;
    if(item.allowHidden!==true&&!surfaceVisible(item.surface))return false;
    if(stamp<item.notBefore)return false;
    var previous=finite(lastRun[item.key],0);
    return !previous||stamp-previous>=item.minGap;
  }
  function nextDelay(){
    var stamp=now(),keys=Object.keys(jobs),delay=Infinity;
    if(!keys.length)return 0;
    if(scrollActive()){
      try{
        var g=window.HappyadGlobalScrollCoordinatorV868,s=g&&g.status&&g.status();
        delay=Math.max(80,Math.min(900,finite(s&&s.until,stamp+180)-stamp+25));
      }catch(_e){delay=180;}
      return delay;
    }
    for(var i=0;i<keys.length;i++){
      var item=jobs[keys[i]];if(!item)continue;
      if(item.allowHidden!==true&&!surfaceVisible(item.surface))continue;
      var previous=finite(lastRun[item.key],0),due=Math.max(item.notBefore,previous?previous+item.minGap:0);
      delay=Math.min(delay,Math.max(0,due-stamp));
    }
    return delay===Infinity?-1:delay;
  }
  function arm(delay){
    if(!Object.keys(jobs).length)return;
    var wait=finite(delay,nextDelay());
    if(wait<0){clearTimeout(timer);timer=0;return;}
    clearTimeout(timer);timer=setTimeout(drain,Math.max(0,wait));
  }
  function drain(){
    timer=0;
    var stamp=now(),keys=Object.keys(jobs),ran=0;
    for(var i=0;i<keys.length&&ran<2;i++){
      var key=keys[i],item=jobs[key];
      if(!ready(item,stamp))continue;
      delete jobs[key];lastRun[key]=stamp;ran++;stats.ran++;stats.lastKey=key;stats.lastAt=stamp;
      try{
        var result=item.fn();
        if(result&&typeof result.catch==='function')result.catch(function(error){try{console.warn('Fyblic V869 connection work',error);}catch(_e){}});
      }catch(error){try{console.warn('Fyblic V869 connection work',key,error);}catch(_e2){}}
      if(scrollActive())break;
    }
    if(Object.keys(jobs).length)arm(ran?20:nextDelay());
    return ran;
  }
  function schedule(key,fn,options){
    if(typeof fn!=='function')return false;
    options=options&&typeof options==='object'?options:{};
    key=clean(key)||('connection-job-'+(++seq));
    var stamp=now(),old=jobs[key],firstAt=old?old.firstAt:stamp;
    var delay=Math.max(0,finite(options.delay,120));
    var maxDelay=Math.max(delay,finite(options.maxDelay,4000));
    jobs[key]={
      key:key,fn:fn,firstAt:firstAt,at:stamp,
      notBefore:Math.min(stamp+delay,firstAt+maxDelay),
      minGap:Math.max(0,finite(options.minGap,0)),
      surface:clean(options.surface||old&&old.surface||'any'),
      allowHidden:options.allowHidden===true
    };
    stats.scheduled++;if(old)stats.replaced++;arm(nextDelay());return true;
  }
  function cancel(key){
    key=clean(key);if(!key||!jobs[key])return false;
    delete jobs[key];stats.cancelled++;
    if(!Object.keys(jobs).length){clearTimeout(timer);timer=0;}
    return true;
  }
  function cancelPrefix(prefix){
    prefix=clean(prefix);if(!prefix)return 0;
    var count=0;Object.keys(jobs).forEach(function(key){if(key.indexOf(prefix)!==0)return;delete jobs[key];count++;stats.cancelled++;});
    if(!Object.keys(jobs).length){clearTimeout(timer);timer=0;}
    return count;
  }
  function flush(){if(!Object.keys(jobs).length)return 0;clearTimeout(timer);timer=0;return drain();}
  function status(){return {version:VERSION,queued:Object.keys(jobs).length,scrollActive:scrollActive(),frameVisible:frameVisible(),homeVisible:homeVisible(),stats:Object.assign({},stats)};}

  try{window.addEventListener('HAPPYAD_GLOBAL_SCROLL_STATE_CHANGE_V868',function(event){if(!event||!event.detail||event.detail.active!==true)arm(25);},true);}catch(_e){}
  try{window.addEventListener('HAPPYAD_CONNECTION_SURFACE_CHANGE_V869',function(){arm(25);},true);}catch(_e2){}
  try{window.addEventListener('HAPPYAD_NOTIFICATION_CENTER_OPENED',function(){arm(25);},true);window.addEventListener('HAPPYAD_NOTIFICATION_CENTER_CLOSED',function(){arm(25);},true);}catch(_e2b){}
  try{window.addEventListener('message',function(event){var t=clean(event&&event.data&&event.data.type);if(t==='HAPPYAD_APP_FRAME_VISIBLE'||t==='HAPPYAD_MODULE_RESUME')arm(25);},true);}catch(_e3){}
  try{window.addEventListener('online',function(){arm(80);},{passive:true});window.addEventListener('focus',function(){arm(80);},{passive:true});window.addEventListener('pageshow',function(){arm(80);},{passive:true});}catch(_e4){}
  try{document.addEventListener('visibilitychange',function(){if(!document.hidden)arm(80);},true);}catch(_e5){}

  window.HappyadConnectionWorkCoordinatorV869={version:VERSION,schedule:schedule,cancel:cancel,cancelPrefix:cancelPrefix,flush:flush,isScrollActive:scrollActive,isSurfaceVisible:surfaceVisible,status:status};
  window.HappyadConnectionWorkCoordinator=window.HappyadConnectionWorkCoordinatorV869;
})();
