(function(){
  'use strict';
  if(window.__HAPPYAD_BUTTON_STATE_MASTER_V604__)return;
  window.__HAPPYAD_BUTTON_STATE_MASTER_V604__=true;

  var active=null;
  var pressedAt=0;
  var releaseTimer=0;
  var fallbackTimer=0;
  var selector=[
    'button','a[href]','[role="button"]','label[for]',
    'input[type="button"]','input[type="submit"]','input[type="reset"]',
    '.nav','.chip','.tab','.filterBtn','.sortBtn','.topBtn','.round','.actionBtn','.profileAct','.catCard',
    '.targetBtn','.periodBtn','.issueChip','.typeCard','.mediaThumb','.viewerThumb',
    '[data-action]','[data-card-act]','[data-profile-act]','[data-tab]','[data-filter]',
    '[data-command]','[data-open]','[data-close]','[onclick]'
  ].join(',');

  function find(target){
    try{return target&&target.closest?target.closest(selector):null;}catch(_e){return null;}
  }
  function disabled(el){
    try{return !!(el.disabled||el.getAttribute('aria-disabled')==='true'||el.classList.contains('disabled'));}catch(_e){return false;}
  }
  function remove(el){
    if(!el)return;
    try{el.classList.remove('happyadButtonPressedV604','happyadButtonPressedV603','happyadButtonPressedV602','happyadTapOrange','happyadBottomPressedV504','happyadMainDockPressedV586');}catch(_e){}
  }
  function clearNow(){
    clearTimeout(releaseTimer);clearTimeout(fallbackTimer);
    remove(active);active=null;pressedAt=0;
  }
  function release(){
    if(!active)return;
    clearTimeout(releaseTimer);
    var elapsed=Math.max(0,(performance&&performance.now?performance.now():Date.now())-pressedAt);
    var delay=Math.max(72,125-elapsed);
    var el=active;
    releaseTimer=setTimeout(function(){remove(el);if(active===el)active=null;},delay);
  }
  function press(ev){
    if(ev&&ev.pointerType==='mouse'&&ev.button!==0)return;
    var el=find(ev&&ev.target);if(!el||disabled(el))return;
    clearNow();active=el;pressedAt=(performance&&performance.now?performance.now():Date.now());
    try{el.classList.add('happyadButtonPressedV604');}catch(_e){}
    fallbackTimer=setTimeout(function(){if(active===el){remove(el);active=null;}},520);
  }
  function keyboardPulse(ev){
    if(!ev||ev.detail!==0)return;
    var el=find(ev.target);if(!el||disabled(el))return;
    clearNow();active=el;pressedAt=(performance&&performance.now?performance.now():Date.now());
    try{el.classList.add('happyadButtonPressedV604');}catch(_e){}
    releaseTimer=setTimeout(clearNow,145);
  }

  if(window.PointerEvent){document.addEventListener('pointerdown',press,true);document.addEventListener('pointerup',release,true);document.addEventListener('pointercancel',clearNow,true);}
  else{document.addEventListener('touchstart',press,{capture:true,passive:true});document.addEventListener('touchend',release,true);document.addEventListener('touchcancel',clearNow,true);document.addEventListener('mousedown',press,true);document.addEventListener('mouseup',release,true);}
  document.addEventListener('click',keyboardPulse,true);
  document.addEventListener('dragstart',clearNow,true);
  window.addEventListener('blur',clearNow,true);
  window.addEventListener('pagehide',clearNow,true);
  document.addEventListener('visibilitychange',function(){if(document.hidden)clearNow();},true);

  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('button-state',{file:'core/button-state-master-v604.js',responsibility:'pression blanche fiable, dock isolé et J’aime rose/rouge',active:true,version:'V604'});}catch(_e){}
})();
