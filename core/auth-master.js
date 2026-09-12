(function(){
  'use strict';
  if(window.__HAPPYAD_AUTH_MASTER_V4__)return;
  window.__HAPPYAD_AUTH_MASTER_V4__=true;
  var MASTER_VERSION='AUTH_MASTER_V4';
  function readJson(k,d){try{return JSON.parse(localStorage.getItem(k)||'null')||d;}catch(_e){return d;}}
  function uid(){
    try{var u=readJson('HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL',{})||{};return String(u.id||u.user_id||u.uid||'').trim();}catch(_e){}
    try{return String(localStorage.getItem('HAPPYAD_AUTH_UID')||'').trim();}catch(_e2){return '';}
  }
  function user(){try{return readJson('HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL',{})||readJson('HAPPYAD_USER',{})||{};}catch(_e){return {};}}
  function isConnected(){return !!uid();}
  function isOwner(id){id=String(id||'').trim();return !!id&&id===uid();}
  function markSwitch(newUid){try{sessionStorage.setItem('HAPPYAD_AUTH_MASTER_LAST_UID',String(newUid||uid()||''));}catch(_e){} }
  window.HappyAuthMaster={version:MASTER_VERSION,uid:uid,user:user,isConnected:isConnected,isOwner:isOwner,markSwitch:markSwitch};
  try{if(window.HappyMasterRegistry)HappyMasterRegistry.register('auth',{file:'core/auth-master.js',responsibility:'source unique uid/utilisateur connecté/logout futur',active:false});}catch(_e){}
})();
