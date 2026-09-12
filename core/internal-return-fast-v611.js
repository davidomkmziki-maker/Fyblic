(function(){
  'use strict';
  if(window.__HAPPYAD_INTERNAL_RETURN_FAST_V611__)return;
  window.__HAPPYAD_INTERNAL_RETURN_FAST_V611__=true;

  var VERSION='V611_INTERNAL_RETURN_FAST_TOUCH';
  var SELECTOR='[data-happyad-internal-return-v591="1"],[data-happyad-internal-return="1"],.happyadInternalBackV591';
  var active=null;
  var lastFastTarget=null;
  var lastFastAt=0;
  var MAX_MOVE=18;
  var MAX_TIME=900;
  var DEDUPE_MS=700;

  function installTouchStyle(){
    if(document.getElementById('happyadInternalReturnFastV611Style'))return;
    var style=document.createElement('style');
    style.id='happyadInternalReturnFastV611Style';
    style.textContent=SELECTOR+'{min-width:44px!important;min-height:44px!important;box-sizing:border-box!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;-webkit-user-select:none!important;user-select:none!important;}';
    (document.head||document.documentElement).appendChild(style);
  }

  function now(){return Date.now?Date.now():(new Date()).getTime();}
  function targetFrom(node){
    try{return node&&node.closest?node.closest(SELECTOR):null;}catch(_e){return null;}
  }
  function disabled(el){
    try{return !el||el.disabled||el.getAttribute('aria-disabled')==='true'||el.hidden||el.classList.contains('disabled');}catch(_e){return !el;}
  }
  function stop(ev){
    try{ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}catch(_e){}
  }
  function pointFromTouch(ev){
    try{
      var list=(ev.changedTouches&&ev.changedTouches.length?ev.changedTouches:ev.touches);
      var p=list&&list[0];
      return p?{x:Number(p.clientX)||0,y:Number(p.clientY)||0,id:Number(p.identifier)||0}:null;
    }catch(_e){return null;}
  }
  function begin(el,id,x,y,type){
    if(!el||disabled(el)){active=null;return;}
    active={el:el,id:id,x:Number(x)||0,y:Number(y)||0,at:now(),type:type||''};
  }
  function cancel(){active=null;}
  function movedTooFar(x,y){
    if(!active)return true;
    return Math.abs((Number(x)||0)-active.x)>MAX_MOVE||Math.abs((Number(y)||0)-active.y)>MAX_MOVE;
  }
  function fire(el,ev){
    if(!el||disabled(el))return false;
    var stamp=now();
    if(el.__happyadFastReturnBusyUntil&&stamp<el.__happyadFastReturnBusyUntil){stop(ev);return false;}
    el.__happyadFastReturnBusyUntil=stamp+420;
    lastFastTarget=el;
    lastFastAt=stamp;
    stop(ev);
    try{el.click();}catch(_e){
      try{el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));}catch(_x){}
    }
    try{el.blur();}catch(_blur){}
    return true;
  }
  function finish(id,x,y,ev){
    var s=active;active=null;
    if(!s||s.id!==id)return false;
    var elapsed=now()-s.at;
    if(elapsed<0||elapsed>MAX_TIME)return false;
    if(Math.abs((Number(x)||0)-s.x)>MAX_MOVE||Math.abs((Number(y)||0)-s.y)>MAX_MOVE)return false;
    var current=targetFrom(ev&&ev.target);
    if(current!==s.el)return false;
    return fire(s.el,ev);
  }

  installTouchStyle();

  if(window.PointerEvent){
    document.addEventListener('pointerdown',function(ev){
      if(ev.pointerType==='mouse')return;
      if(ev.isPrimary===false)return;
      var el=targetFrom(ev.target);if(!el)return;
      begin(el,Number(ev.pointerId)||1,ev.clientX,ev.clientY,ev.pointerType||'pointer');
    },true);
    document.addEventListener('pointermove',function(ev){
      if(!active||active.id!==(Number(ev.pointerId)||1))return;
      if(movedTooFar(ev.clientX,ev.clientY))cancel();
    },true);
    document.addEventListener('pointerup',function(ev){
      if(ev.pointerType==='mouse')return;
      finish(Number(ev.pointerId)||1,ev.clientX,ev.clientY,ev);
    },true);
    document.addEventListener('pointercancel',cancel,true);
  }else{
    document.addEventListener('touchstart',function(ev){
      var el=targetFrom(ev.target),p=pointFromTouch(ev);if(!el||!p)return;
      begin(el,p.id,p.x,p.y,'touch');
    },{capture:true,passive:true});
    document.addEventListener('touchmove',function(ev){
      if(!active)return;var p=pointFromTouch(ev);if(!p||p.id!==active.id)return;
      if(movedTooFar(p.x,p.y))cancel();
    },{capture:true,passive:true});
    document.addEventListener('touchend',function(ev){
      if(!active)return;var p=pointFromTouch(ev);if(!p)return;
      finish(p.id,p.x,p.y,ev);
    },{capture:true,passive:false});
    document.addEventListener('touchcancel',cancel,true);
  }

  /* Certains WebView Android génèrent encore un click natif après le click immédiat.
     Le second est supprimé afin qu'un retour ne se déclenche jamais deux fois. */
  document.addEventListener('click',function(ev){
    var el=targetFrom(ev.target);
    if(!el||ev.isTrusted===false)return;
    if(el===lastFastTarget&&now()-lastFastAt<DEDUPE_MS){stop(ev);lastFastTarget=null;lastFastAt=0;}
  },true);

  window.addEventListener('blur',cancel,true);
  document.addEventListener('visibilitychange',function(){if(document.hidden)cancel();},true);

  try{
    if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('internal-return-fast',{file:'core/internal-return-fast-v611.js',responsibility:'retour interne immédiat au relâchement tactile avec anti-double clic',active:true,version:'V611'});
  }catch(_e){}
  window.HappyInternalReturnFastV611={version:VERSION};
})();
