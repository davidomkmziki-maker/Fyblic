(function(){
  'use strict';
  if(window.parent===window)return;
  if(window.__HAPPYAD_AUTH_FRAME_GATE_V596__)return;
  window.__HAPPYAD_AUTH_FRAME_GATE_V596__=true;
  var pendingTarget=null;
  var bypassOnce=false;
  var lastAt=0;
  function clean(v){return String(v==null?'':v).trim();}
  function connected(){
    try{
      if(localStorage.getItem('HAPPYAD_FORCE_LOGOUT')==='1')return false;
      if(Number(localStorage.getItem('HAPPYAD_FORCE_LOGOUT_UNTIL')||0)>Date.now())return false;
      return localStorage.getItem('HAPPYAD_SESSION_ACTIVE')==='1'&&/^[0-9a-f-]{36}$/i.test(clean(localStorage.getItem('HAPPYAD_AUTH_UID')));
    }catch(_e){return false;}
  }
  function stop(e){try{e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}catch(_e){}}
  function alwaysAllowed(t){
    if(!t||!t.closest)return false;
    /* Le profil du créateur reste consultable en invité, mais un bouton d’abonnement
       éventuellement placé dans la même capsule reste une action privée. */
    if(t.closest('.happyadVideoFollowV855R34,.haHomeFsFollowV855R34,[data-follow],[data-act="follow"]'))return false;
    return !!t.closest('.haHomeFsBackV591,.haHomeFsClose,.haHomeFsSeeMore,.happyadInternalBackV591,[data-happyad-internal-return],[data-happyad-internal-return-v591],#backButton,#photoFixedBackV587,#photoReturnV591,.messageBack,.chatBack,#messageBackBtn,#notificationBackBtn,.notificationBack,.viewerClose,.draftFullClose,[data-close],[aria-label="Fermer"],[aria-label="Retour"],.tapSound,[data-video-control],.videoControl,.muteBtn,.soundBtn,.creatorPill,.slideCreator,[data-open-slide-profile],[data-open-comment-profile],.more,.miniSeeMore,[aria-label="Revenir à la page précédente"]');
  }
  function actionable(t){
    if(!t||!t.closest)return null;
    return t.closest('button,a[href],[role="button"],input[type="button"],input[type="submit"],select,textarea,[data-card-act],[data-act],[data-profile-act],.creatorPill,.profileMedia,.radarItem,.mapLite');
  }
  function gate(e){
    if(bypassOnce){bypassOnce=false;return;}
    if(connected())return;
    var t=e&&e.target;if(!t||alwaysAllowed(t))return;
    var act=actionable(t);if(!act)return;
    var now=Date.now();if(now-lastAt<250){stop(e);return;}lastAt=now;
    pendingTarget=act;stop(e);
    try{window.parent&&window.parent!==window&&window.parent.postMessage({type:'HAPPYAD_AUTH_OPEN_REQUEST_V596',detail:{action:clean(act.getAttribute('aria-label')||act.textContent)||'action',source:location.pathname}},'*');}catch(_e){}
    return false;
  }
  document.addEventListener('pointerdown',gate,true);
  document.addEventListener('click',gate,true);
  window.addEventListener('message',function(ev){
    var d=ev&&ev.data;if(!d)return;
    if(d.type==='HAPPYAD_AUTH_RESUME_LAST_ACTION_V596'||d.type==='HAPPYAD_AUTH_RESUME_LAST_ACTION_V595'){
      var target=pendingTarget;pendingTarget=null;
      if(target&&target.isConnected){bypassOnce=true;setTimeout(function(){try{target.click();}catch(_e){}},0);}
    }
  },true);
  try{window.parent&&window.parent!==window&&window.parent.postMessage({type:'HAPPYAD_AUTH_FRAME_READY_V596',detail:{path:location.pathname}},'*');}catch(_e){}
})();
