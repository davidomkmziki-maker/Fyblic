(function(){
  'use strict';
  if(window.__HAPPYAD_GUEST_RADAR_AUTH_V599__)return;
  window.__HAPPYAD_GUEST_RADAR_AUTH_V599__=true;

  var VERSION='GUEST_BROWSE_RADAR_V941_PREMIUM_AUTH';

  function clean(v){return String(v==null?'':v).trim();}
  function auth(){return window.HappyAuthSessionV598||window.HappyAuthSessionV597||window.HappyAuthSessionV596||window.HappyAuthSessionV595||null;}
  function localAuthenticated(){
    try{
      var forced=localStorage.getItem('HAPPYAD_FORCE_LOGOUT')==='1';
      var until=Number(localStorage.getItem('HAPPYAD_FORCE_LOGOUT_UNTIL')||0)||0;
      if(forced&&(!until||Date.now()<until))return false;
      var uid=clean(localStorage.getItem('HAPPYAD_AUTH_UID'));
      return localStorage.getItem('HAPPYAD_SESSION_ACTIVE')==='1'&&/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(uid);
    }catch(_e){return false;}
  }
  function isGuest(){
    var a=auth();
    if(a&&typeof a.isReady==='function'&&a.isReady()&&typeof a.isAuthenticated==='function')return !a.isAuthenticated();
    return !localAuthenticated();
  }
  function closeStoryViewers(){
    ['happyStoryViewer','happyProfileStoryViewer'].forEach(function(id){
      try{var el=document.getElementById(id);if(el)el.classList.remove('on','full','show','open');}catch(_e){}
    });
    try{
      document.body.classList.remove('story-open','happyad-story-fullscreen-lock');
      document.documentElement.classList.remove('story-open','happyad-story-fullscreen-lock');
    }catch(_e){}
  }
  function ensureStableBlock(){
    var block=document.getElementById('happyadGuestRadarStableV599');
    if(block)return block;
    var chips=document.querySelector('.chips');
    if(!chips)return null;
    block=document.createElement('section');
    block.id='happyadGuestRadarStableV599';
    block.className='radarBlock';
    block.setAttribute('aria-hidden','true');
    block.innerHTML='<div class="happyadGuestAuthButtonsV599"><button type="button" class="happyadGuestAuthBtnV599" data-happyad-auth-direct-v598="login">Connexion</button><button type="button" class="happyadGuestAuthBtnV599" data-happyad-auth-direct-v598="signup">Inscription</button></div>';
    chips.insertAdjacentElement('afterend',block);
    return block;
  }
  function setState(guest){
    var root=document.documentElement;
    var block=ensureStableBlock();
    root.classList.toggle('happyadRadarBootGuestV599',!!guest);
    root.classList.toggle('happyadRadarBootUserV599',!guest);
    if(block)block.setAttribute('aria-hidden',guest?'false':'true');
  }
  function apply(){setState(isGuest());}
  function boot(){
    ensureStableBlock();
    apply();
    window.addEventListener('HAPPYAD_AUTH_STATE_V595',apply,true);
    window.addEventListener('storage',function(ev){
      if(!ev||/HAPPYAD_(SESSION_ACTIVE|AUTH_UID|FORCE_LOGOUT)/.test(ev.key||''))apply();
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

  window.HappyGuestRadarV599={version:VERSION,apply:apply,isGuest:isGuest};
  window.HappyGuestRadarV598=window.HappyGuestRadarV599;
  try{
    if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('guest-radar-auth',{file:'core/guest-radar-auth-v599.js',responsibility:'Navigation invitée : Radar/Stories consultables + accès direct Connexion/Inscription',active:true,version:VERSION});
  }catch(_e){}
})();
