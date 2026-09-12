(function(){
  'use strict';
  if(window.__HAPPYAD_ASSISTANCE_OPEN_CLOSE_V757__)return;
  window.__HAPPYAD_ASSISTANCE_OPEN_CLOSE_V757__=true;

  var VERSION='HAPPYAD_ASSISTANCE_OPEN_CLOSE_V937_ACCOUNT_ISOLATION';
  var HOST_ID='happyadAssistanceHostV738';
  var FRAME_ID='happyadAssistanceFrameV738';
  var FRAME_URL='modules/assistance.html?v=851r12-ecriture-stable';
  var CONTEXT_KEY='happyad_support_user_context_v27';
  var host=null,frame=null;
  var isOpen=false,isReady=false,frameStarted=false,closeTimer=0,openLockUntil=0;
  var lastContext=null,prewarmTimer=0,readyPoll=0,readyPollCount=0,returnRegistered=false;
  var revealTimer=0,openedAt=0;
  var MIN_SKELETON_MS=120;
  var lastAccountUidV937='';

  function clean(v){return String(v==null?'':v).trim()}
  function activeUidV937(){try{if(localStorage.getItem('HAPPYAD_SESSION_ACTIVE')!=='1')return '';return clean(localStorage.getItem('HAPPYAD_AUTH_UID'));}catch(_e){return '';}}
  function localUser(){try{if(!activeUidV937())return {};var u=Object.assign({},JSON.parse(localStorage.getItem('HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL')||'{}')||{});var id=clean(u.id||u.user_id||u.uid);return !id||id===activeUidV937()?u:{};}catch(_e){return {}}}
  function buildContext(detail){
    detail=detail&&typeof detail==='object'?detail:{};
    var user=localUser();
    var canonical=activeUidV937();
    var id=clean(canonical&&(detail.uid||user.id||user.user_id||canonical));
    if(id!==canonical)id=canonical;
    var settings={};
    try{settings=JSON.parse(localStorage.getItem('HAPPYAD_PROFILE_SETTINGS_V712_'+(id||'local'))||'{}')||{}}catch(_e){}
    return {
      source:clean(detail.source)||'happyad',
      uid:id,
      language:clean(detail.language||settings.language||user.language||navigator.language||'fr'),
      country:clean(detail.country||user.country||user.location),
      user:{
        id:id,
        name:clean(user.name||user.full_name||user.display_name),
        username:clean(user.username||user.handle).replace(/^@+/,''),
        avatar:clean(user.avatar||user.avatar_url)
      },
      returnTarget:clean(detail.returnTarget),
      openedAt:Date.now()
    };
  }
  function saveContext(context){
    lastContext=context;
    try{localStorage.setItem(CONTEXT_KEY,JSON.stringify(context))}catch(_e){}
  }
  function sendContext(){
    if(!frame||!frame.contentWindow||!lastContext)return false;
    try{frame.contentWindow.postMessage({type:'HAPPYAD_ASSISTANCE_CONTEXT',detail:lastContext},location.origin);return true}catch(_e){return false}
  }
  function ensureHost(){
    if(host&&frame)return host;
    host=document.getElementById(HOST_ID);
    if(!host){
      host=document.createElement('section');
      host.id=HOST_ID;
      host.className='happyadAssistanceHostV738';
      host.setAttribute('aria-hidden','true');
      host.setAttribute('inert','');
      host.innerHTML='<div class="happyadAssistanceLoadingV738" role="status" aria-label="Ouverture de l’assistance"><div class="haAssistanceSkeletonV855R34" aria-hidden="true"><header class="haAssistanceSkeletonTopV855R34"><i class="haAssistanceSkeletonBackV855R34"></i><span class="haAssistanceSkeletonHeadingV855R34"><b></b><em></em></span><i class="haAssistanceSkeletonActionV855R34"></i></header><main class="haAssistanceSkeletonBodyV855R34"><section class="haAssistanceSkeletonWelcomeV855R34"><i></i><span><b></b><em></em></span></section><div class="haAssistanceSkeletonChoicesV855R34"><i></i><i></i><i></i></div><section class="haAssistanceSkeletonCardV855R34"><b></b><span></span><span class="short"></span></section><div class="haAssistanceSkeletonRowsV855R34"><article><i></i><span><b></b><em></em></span></article><article><i></i><span><b></b><em></em></span></article><article><i></i><span><b></b><em></em></span></article></div></main><footer class="haAssistanceSkeletonComposerV855R34"><i></i><span></span><b></b></footer></div></div><iframe id="'+FRAME_ID+'" class="happyadAssistanceFrameV738" title="Assistance Fyblic" loading="eager" referrerpolicy="same-origin" allow="clipboard-read; clipboard-write" aria-label="Assistance Fyblic"></iframe>';
      document.body.appendChild(host);
    }
    frame=document.getElementById(FRAME_ID);
    if(frame&&!frame.__happyadV756Bound){
      frame.__happyadV756Bound=true;
      frame.addEventListener('load',function(){sendContext();pollReady()});
    }
    return host;
  }
  function frameReady(){
    if(!frame)return false;
    try{
      var d=frame.contentDocument,w=frame.contentWindow;
      return !!(w&&w.HappyadAssistance&&d&&d.documentElement.classList.contains('happyad-ready')&&d.getElementById('chat'));
    }catch(_e){return false}
  }
  function stopPoll(){if(readyPoll){clearTimeout(readyPoll);readyPoll=0}}
  function pollReady(){
    stopPoll();
    if(isReady)return;
    if(frameReady()){markReady();return}
    readyPollCount++;
    /* Audit V757 : aucun polling infini si le module a une erreur réseau/JS.
       Le signal READY postMessage reste capable de terminer l'ouverture plus tard. */
    if(readyPollCount>=50)return;
    readyPoll=setTimeout(pollReady,80);
  }
  function stopReveal(){if(revealTimer){clearTimeout(revealTimer);revealTimer=0}}
  function revealReady(){
    stopReveal();
    if(!host||!isOpen||!isReady)return false;
    var wait=Math.max(0,MIN_SKELETON_MS-(Date.now()-openedAt));
    if(wait){revealTimer=setTimeout(revealReady,wait);return false}
    host.classList.add('ready');
    return true;
  }
  function markReady(){
    if(!isReady){
      isReady=true;
      readyPollCount=0;
      stopPoll();
    }
    sendContext();
    revealReady();
  }
  function prepare(){
    ensureHost();
    if(frameStarted||!frame)return false;
    frameStarted=true;
    frame.src=FRAME_URL;
    return true;
  }
  function registerReturn(){
    if(returnRegistered)return true;
    try{
      var master=window.HappyInternalReturnV694||window.HappyInternalReturnV591;
      if(master&&typeof master.open==='function'){master.open('assistance',{onBack:function(){close('physical-back')}});returnRegistered=true;return true;}
    }catch(_e){}
    return false;
  }
  function unregisterReturn(){
    if(!returnRegistered)return true;
    try{
      var master=window.HappyInternalReturnV694||window.HappyInternalReturnV591;
      if(master&&typeof master.close==='function')master.close('assistance');
    }catch(_e){}
    returnRegistered=false;
    return true;
  }
  function open(detail){
    var now=Date.now();
    if(now<openLockUntil)return true;
    openLockUntil=now+350;
    saveContext(buildContext(detail));
    ensureHost();
    if(closeTimer){clearTimeout(closeTimer);closeTimer=0}
    /* Une réouverture pendant le bouclier de fermeture réutilise le même état
       de retour au lieu d'empiler une seconde entrée. */
    if(isOpen){sendContext();return true}
    isOpen=true;
    openedAt=Date.now();
    stopReveal();
    host.classList.remove('ready','closing','closingDirectV757');
    host.classList.add('show');
    host.setAttribute('aria-hidden','false');
    host.removeAttribute('inert');
    document.documentElement.classList.add('happyadAssistanceOpenV738');
    document.body.classList.add('happyadAssistanceOpenV738');
    registerReturn();
    if(!frameStarted)prepare();
    sendContext();
    if(isReady)revealReady();
    else{readyPollCount=0;pollReady();}
    return true;
  }
  function finishClose(reason){
    if(!host)return false;
    stopReveal();
    host.classList.remove('show','ready','closing','closingDirectV757');
    host.setAttribute('aria-hidden','true');
    host.setAttribute('inert','');
    document.documentElement.classList.remove('happyadAssistanceOpenV738');
    document.body.classList.remove('happyadAssistanceOpenV738');
    unregisterReturn();
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_ASSISTANCE_CLOSED',{detail:{reason:reason||'close',context:lastContext,at:Date.now()}}))}catch(_e){}
    return true;
  }
  function close(reason){
    if(!isOpen||closeTimer)return false;
    isOpen=false;
    stopReveal();
    if(host){
      /* V757 : la page précédente redevient visible immédiatement. Le host
         transparent reste néanmoins au-dessus jusqu'à la fin du clic Android,
         afin qu'aucun bouton derrière ne reçoive le même geste. */
      host.classList.add('closing','closingDirectV757');
      host.setAttribute('aria-hidden','false');
      host.removeAttribute('inert');
    }
    closeTimer=setTimeout(function(){closeTimer=0;finishClose(reason||'close')},120);
    return true;
  }
  function resetAccountFrameV937(reason){
    try{if(closeTimer){clearTimeout(closeTimer);closeTimer=0;}}catch(_e){}
    isOpen=false;isReady=false;readyPollCount=0;stopPoll();stopReveal();
    lastContext=null;openLockUntil=0;openedAt=0;
    try{localStorage.removeItem(CONTEXT_KEY);}catch(_e){}
    try{finishClose(reason||'account-reset-v937');}catch(_e){}
    if(frame){
      try{frame.src='about:blank';}catch(_e){}
      frameStarted=false;
    }
    return true;
  }
  function sameOrigin(event){return !event.origin||event.origin===location.origin}
  window.addEventListener('message',function(event){
    if(!sameOrigin(event))return;
    var data=event&&event.data||{};
    if(data.type==='HAPPYAD_ASSISTANCE_V757_OPEN'||data.type==='HAPPYAD_ASSISTANCE_V755_OPEN'){open(data.detail||{});return}
    if(data.type==='HAPPYAD_ASSISTANCE_V757_PREPARE'||data.type==='HAPPYAD_ASSISTANCE_V755_PREPARE'){prepare();return}
    if(frame&&event.source&&event.source!==frame.contentWindow)return;
    if(data.type==='HAPPYAD_ASSISTANCE_V757_CLOSE'||data.type==='HAPPYAD_ASSISTANCE_V755_CLOSE')close('assistance-x');
    else if(data.type==='HAPPYAD_ASSISTANCE_V757_READY'||data.type==='HAPPYAD_ASSISTANCE_V755_READY')markReady();
  },true);
  try{lastAccountUidV937=activeUidV937();}catch(_e){}
  window.addEventListener('HAPPYAD_AUTH_STATE_V595',function(event){
    try{
      var detail=event&&event.detail||{};
      var next=detail.authenticated?clean(detail.user_id||detail.user&&detail.user.id||activeUidV937()):'';
      if(next===lastAccountUidV937)return;
      lastAccountUidV937=next;
      resetAccountFrameV937('auth-account-change-v937');
      if(next)setTimeout(function(){try{prepare();}catch(_e){}},120);
    }catch(_e){}
  },true);
  window.addEventListener('keydown',function(event){if(isOpen&&event.key==='Escape'){event.preventDefault();close('escape')}},true);

  function start(){
    ensureHost();
    var run=function(){prewarmTimer=0;prepare()};
    if('requestIdleCallback'in window)prewarmTimer=requestIdleCallback(run,{timeout:1400});
    else prewarmTimer=setTimeout(run,650);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

  var api=Object.freeze({version:VERSION+'-V855R34-SKELETON-EVERY-OPEN',open:open,close:close,prepare:prepare,isOpen:function(){return isOpen},isReady:function(){return isReady},context:function(){return lastContext?JSON.parse(JSON.stringify(lastContext)):null},resetAccount:resetAccountFrameV937});
  window.HappyadAssistanceMasterV757=api;
  window.HappyadAssistanceMasterV756=api;
  window.HappyadAssistanceMasterV755=api;
  /* Alias de compatibilité : aucun autre moteur n’est créé. */
  window.HappyadAssistanceMasterV751=window.HappyadAssistanceMasterV750=window.HappyadAssistanceMasterV749=window.HappyadAssistanceMasterV748=window.HappyadAssistanceMasterV747=window.HappyadAssistanceMasterV740=window.HappyadAssistanceMasterV738=window.HappyadAssistanceMasterV737=api;
})();
