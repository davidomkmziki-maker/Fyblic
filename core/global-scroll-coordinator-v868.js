/* Fyblic V868 — coordinateur global de priorité au défilement.
   Le parent possède l'état canonique de scroll pour l'Accueil et toutes ses
   iframes. Ce maître n'écrit jamais scrollTop, ne bloque aucun événement et ne
   change aucune propriété CSS : il reporte uniquement les commits secondaires. */
(function(){
  'use strict';
  if(window.HappyadGlobalScrollCoordinatorV868)return;

  var VERSION='V868_GLOBAL_SCROLL_COORDINATOR_PHASE1';
  var MSG_HELLO='HAPPYAD_GLOBAL_SCROLL_HELLO_V868';
  var MSG_PULSE='HAPPYAD_GLOBAL_SCROLL_PULSE_V868';
  var MSG_STATE='HAPPYAD_GLOBAL_SCROLL_STATE_V868';
  var STATE_EVENT='HAPPYAD_GLOBAL_SCROLL_STATE_CHANGE_V868';
  var DEFAULT_QUIET_MS=240;
  var MAX_QUIET_MS=700;
  var ACTIVE_HEARTBEAT_MS=480;
  var REMOTE_FAILSAFE_MS=1000;
  var embedded=false;
  try{embedded=!!(window.parent&&window.parent!==window);}catch(_e){}

  var localUntil=0;
  var remoteUntil=0;
  var canonicalUntil=0;
  var canonicalActive=false;
  var canonicalTimer=0;
  var remoteTimer=0;
  var lastBroadcastAt=0;
  var sources=typeof Map==='function'?new Map():null;
  var jobs=Object.create(null);
  var jobSeq=0;
  var queueTimer=0;
  var lastPublishedActive=false;
  var pointerMoved=false;
  var pointerDown=false;
  var pointerX=0;
  var pointerY=0;
  var pulseFrame=0;
  var pendingPulseReason='';
  var stats={pulses:0,broadcasts:0,deferred:0,flushed:0,lastReason:'',lastAt:0};

  function now(){return Date.now?Date.now():(new Date()).getTime();}
  function finite(value,fallback){var n=Number(value);return Number.isFinite(n)?n:Number(fallback)||0;}
  function clampQuiet(value){return Math.max(80,Math.min(MAX_QUIET_MS,finite(value,DEFAULT_QUIET_MS)));}
  function targetOrigin(){try{return location.origin&&location.origin!=='null'?location.origin:'*';}catch(_e){return '*';}}
  function allowedOrigin(event){
    try{
      var own=String(location.origin||''),incoming=String(event&&event.origin||'');
      if(!own||own==='null')return !incoming||incoming==='null';
      return incoming===own;
    }catch(_e){return false;}
  }
  function frameForSource(source){
    if(!source||!document||!document.querySelectorAll)return null;
    try{
      var frames=document.querySelectorAll('iframe');
      for(var i=0;i<frames.length;i++)if(frames[i].contentWindow===source)return frames[i];
    }catch(_e){}
    return null;
  }
  function sourceLabel(frame){
    try{return String(frame&&((frame.dataset&&frame.dataset.happyadPage)||frame.id||frame.name)||'frame');}catch(_e){return 'frame';}
  }
  function effectiveUntil(){return embedded?Math.max(localUntil,remoteUntil):Math.max(localUntil,canonicalUntil);}
  function isActive(){
    try{if(document.hidden)return false;}catch(_e){}
    return now()<effectiveUntil();
  }
  function emitStateIfChanged(){
    var active=isActive();
    if(active===lastPublishedActive)return;
    lastPublishedActive=active;
    try{window.dispatchEvent(new CustomEvent(STATE_EVENT,{detail:{active:active,until:effectiveUntil(),version:VERSION,at:now()}}));}catch(_e){}
    if(!active)flushIfIdle();
  }
  function armRemoteTimer(){
    clearTimeout(remoteTimer);remoteTimer=0;
    var wait=Math.max(0,effectiveUntil()-now()+8);
    if(wait>0)remoteTimer=setTimeout(function(){remoteTimer=0;emitStateIfChanged();if(isActive())armRemoteTimer();},wait);
  }
  function postToParent(message){
    if(!embedded)return false;
    try{window.parent.postMessage(message,targetOrigin());return true;}catch(_e){return false;}
  }
  function childHello(reason){
    return postToParent({type:MSG_HELLO,version:VERSION,reason:String(reason||'ready'),path:String(location&&location.pathname||''),at:now()});
  }
  function broadcastUntil(stamp){return canonicalActive?Math.max(canonicalUntil,stamp+REMOTE_FAILSAFE_MS):0;}
  function broadcastState(force){
    if(embedded)return;
    var stamp=now();
    if(!force&&canonicalActive&&stamp-lastBroadcastAt<ACTIVE_HEARTBEAT_MS)return;
    lastBroadcastAt=stamp;stats.broadcasts++;
    var message={type:MSG_STATE,version:VERSION,active:canonicalActive,until:broadcastUntil(stamp),at:stamp};
    try{
      var frames=document.querySelectorAll('iframe');
      for(var i=0;i<frames.length;i++){
        try{if(frames[i].contentWindow)frames[i].contentWindow.postMessage(message,targetOrigin());}catch(_e){}
      }
    }catch(_e2){}
  }
  function pruneSources(stamp){
    if(!sources)return 0;
    var max=0;
    sources.forEach(function(rec,source){
      var valid=rec&&rec.until>stamp;
      try{if(valid&&rec.frame&&(!rec.frame.isConnected||rec.frame.contentWindow!==source))valid=false;}catch(_e){valid=false;}
      if(!valid){sources.delete(source);return;}
      if(rec.until>max)max=rec.until;
    });
    return max;
  }
  function recomputeCanonical(forceBroadcast){
    if(embedded)return;
    var stamp=now(),previous=canonicalActive;
    canonicalUntil=Math.max(localUntil,pruneSources(stamp));
    canonicalActive=canonicalUntil>stamp;
    clearTimeout(canonicalTimer);canonicalTimer=0;
    if(canonicalActive){
      canonicalTimer=setTimeout(function(){canonicalTimer=0;recomputeCanonical(true);},Math.max(8,canonicalUntil-stamp+8));
    }
    if(previous!==canonicalActive||forceBroadcast)broadcastState(true);
    emitStateIfChanged();
  }
  function sendPulse(){
    pulseFrame=0;
    var reason=pendingPulseReason||'scroll';pendingPulseReason='';
    var stamp=now(),remaining=clampQuiet(Math.max(80,localUntil-stamp));
    stats.pulses++;stats.lastReason=reason;stats.lastAt=stamp;
    if(embedded){
      postToParent({type:MSG_PULSE,version:VERSION,reason:reason,quietMs:remaining,path:String(location&&location.pathname||''),at:stamp});
    }else{
      recomputeCanonical(canonicalActive&&now()-lastBroadcastAt>=ACTIVE_HEARTBEAT_MS);
    }
  }
  function schedulePulse(reason){
    pendingPulseReason=String(reason||pendingPulseReason||'scroll');
    if(pulseFrame)return;
    try{pulseFrame=requestAnimationFrame(sendPulse);}catch(_e){pulseFrame=setTimeout(sendPulse,16);}
  }
  function mark(reason,quietMs){
    var stamp=now(),quiet=clampQuiet(quietMs);
    localUntil=Math.max(localUntil,stamp+quiet);
    stats.lastReason=String(reason||'scroll');stats.lastAt=stamp;
    schedulePulse(reason||'scroll');
    emitStateIfChanged();armRemoteTimer();scheduleQueue();
    return localUntil;
  }

  function clearQueueTimer(){if(queueTimer){clearTimeout(queueTimer);queueTimer=0;}}
  function nextJobDelay(){
    var stamp=now(),keys=Object.keys(jobs),wait=Infinity;
    for(var i=0;i<keys.length;i++)wait=Math.min(wait,Math.max(0,finite(jobs[keys[i]]&&jobs[keys[i]].notBefore,stamp)-stamp));
    return wait===Infinity?0:wait;
  }
  function scheduleQueue(delay){
    if(!Object.keys(jobs).length)return;
    clearQueueTimer();
    var wait=Math.max(0,finite(delay,0));
    if(isActive())wait=Math.max(wait,effectiveUntil()-now()+20);
    else wait=Math.max(wait,nextJobDelay());
    queueTimer=setTimeout(drainQueue,wait);
  }
  function drainQueue(){
    queueTimer=0;
    if(isActive()){scheduleQueue();return false;}
    var stamp=now(),keys=Object.keys(jobs),ran=0;
    for(var i=0;i<keys.length&&ran<2;i++){
      var key=keys[i],item=jobs[key];
      if(!item||item.notBefore>stamp)continue;
      delete jobs[key];ran++;stats.flushed++;
      try{item.fn();}catch(error){try{console.warn('Fyblic V868 deferred work',key,error);}catch(_e){}}
      if(isActive())break;
    }
    if(Object.keys(jobs).length)scheduleQueue(ran?0:nextJobDelay());
    return ran>0;
  }
  function defer(key,fn,delay){
    if(typeof fn!=='function')return false;
    key=String(key||('global-scroll-job-'+(++jobSeq)));
    jobs[key]={fn:fn,notBefore:now()+Math.max(0,finite(delay,40)),at:now()};
    stats.deferred++;scheduleQueue();return true;
  }
  function deferIfActive(key,fn,delay){if(!isActive())return false;defer(key,fn,delay);return true;}
  function commit(key,fn,delay){if(deferIfActive(key,fn,delay))return true;if(typeof fn==='function')fn();return false;}
  function run(key,fn,delay){
    if(typeof fn!=='function')return false;
    key=String(key||('global-scroll-run-'+(++jobSeq)));
    if(isActive())return defer(key,fn,delay);
    setTimeout(function(){if(isActive())defer(key,fn,delay);else fn();},Math.max(0,finite(delay,0)));
    return true;
  }
  function cancel(key){key=String(key||'');if(!key)return false;var existed=!!jobs[key];delete jobs[key];if(!Object.keys(jobs).length)clearQueueTimer();return existed;}
  function flushIfIdle(){if(isActive())return false;return drainQueue();}
  function whenIdle(){
    if(!isActive())return Promise.resolve(true);
    return new Promise(function(resolve){
      function done(event){if(event&&event.detail&&event.detail.active)return;window.removeEventListener(STATE_EVENT,done);resolve(true);}
      window.addEventListener(STATE_EVENT,done);
      armRemoteTimer();
    });
  }
  function status(){
    return {version:VERSION,role:embedded?'child':'parent',active:isActive(),until:effectiveUntil(),queued:Object.keys(jobs).length,sources:!embedded&&sources?sources.size:0,stats:{pulses:stats.pulses,broadcasts:stats.broadcasts,deferred:stats.deferred,flushed:stats.flushed,lastReason:stats.lastReason,lastAt:stats.lastAt}};
  }

  function beginPointer(event){
    var p=event&&event.touches&&event.touches[0]||event;
    pointerDown=true;pointerMoved=false;pointerX=finite(p&&p.clientX,0);pointerY=finite(p&&p.clientY,0);
  }
  function movePointer(event){
    if(!pointerDown)return;
    var p=event&&event.touches&&event.touches[0]||event;
    var dx=Math.abs(finite(p&&p.clientX,0)-pointerX),dy=Math.abs(finite(p&&p.clientY,0)-pointerY);
    if(pointerMoved||dx>4||dy>4){pointerMoved=true;mark('gesture',360);}
  }
  function endPointer(){if(pointerMoved)mark('gesture-end',280);pointerDown=false;pointerMoved=false;}
  function bindSignals(){
    try{
      if(window.PointerEvent){
        window.addEventListener('pointerdown',beginPointer,{passive:true,capture:true});
        window.addEventListener('pointermove',movePointer,{passive:true,capture:true});
        window.addEventListener('pointerup',endPointer,{passive:true,capture:true});
        window.addEventListener('pointercancel',endPointer,{passive:true,capture:true});
      }else{
        window.addEventListener('touchstart',beginPointer,{passive:true,capture:true});
        window.addEventListener('touchmove',movePointer,{passive:true,capture:true});
        window.addEventListener('touchend',endPointer,{passive:true,capture:true});
        window.addEventListener('touchcancel',endPointer,{passive:true,capture:true});
      }
      window.addEventListener('wheel',function(){mark('wheel',340);},{passive:true,capture:true});
      window.addEventListener('scroll',function(){mark('scroll',DEFAULT_QUIET_MS);},{passive:true,capture:true});
      document.addEventListener('scroll',function(){mark('scroll-container',DEFAULT_QUIET_MS);},{passive:true,capture:true});
      window.addEventListener('scrollend',function(){mark('scrollend',90);},{passive:true,capture:true});
    }catch(_e){}
  }

  window.addEventListener('message',function(event){
    var data=event&&event.data;
    if(!data||typeof data!=='object'||!allowedOrigin(event))return;
    if(embedded){
      if(event.source!==window.parent||data.type!==MSG_STATE)return;
      remoteUntil=data.active===true?Math.max(now()+80,finite(data.until,now()+DEFAULT_QUIET_MS)):0;
      emitStateIfChanged();armRemoteTimer();scheduleQueue();
      return;
    }
    if(data.type!==MSG_PULSE&&data.type!==MSG_HELLO)return;
    var frame=frameForSource(event.source);if(!frame)return;
    if(data.type===MSG_HELLO){
      var helloAt=now();
      try{event.source.postMessage({type:MSG_STATE,version:VERSION,active:canonicalActive,until:broadcastUntil(helloAt),at:helloAt},targetOrigin());}catch(_e){}
      return;
    }
    var stamp=now(),quiet=clampQuiet(data.quietMs),until=stamp+quiet;
    if(sources)sources.set(event.source,{until:until,frame:frame,label:sourceLabel(frame),reason:String(data.reason||'scroll')});
    stats.pulses++;stats.lastReason=sourceLabel(frame)+':'+String(data.reason||'scroll');stats.lastAt=stamp;
    recomputeCanonical(canonicalActive&&stamp-lastBroadcastAt>=ACTIVE_HEARTBEAT_MS);
  },true);

  try{document.addEventListener('visibilitychange',function(){if(document.hidden){localUntil=0;remoteUntil=0;emitStateIfChanged();}else{if(embedded)childHello('visible');else recomputeCanonical(true);}},true);}catch(_e){}
  try{window.addEventListener('pagehide',function(){localUntil=0;remoteUntil=0;emitStateIfChanged();});}catch(_e2){}
  try{window.addEventListener('pageshow',function(){if(embedded)childHello('pageshow');else recomputeCanonical(true);});}catch(_e3){}

  window.HappyadGlobalScrollCoordinatorV868={version:VERSION,isParent:!embedded,isActive:isActive,mark:mark,run:run,defer:defer,deferIfActive:deferIfActive,commit:commit,whenIdle:whenIdle,cancel:cancel,flushIfIdle:flushIfIdle,status:status,eventName:STATE_EVENT};
  window.HappyadGlobalScrollCoordinator=window.HappyadGlobalScrollCoordinatorV868;
  bindSignals();
  if(embedded){childHello('boot');if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){childHello('dom-ready');},{once:true});}
  else recomputeCanonical(true);
})();
