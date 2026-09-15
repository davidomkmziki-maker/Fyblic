(function(){
  'use strict';
  if(window.__HAPPYAD_PHOTO_MASTER_V14__)return;
  window.__HAPPYAD_PHOTO_MASTER_V14__=true;
  var MASTER_VERSION='PHOTO_MASTER_V14';
  var legacyOpenLong=typeof window.openLongPhoto==='function'?window.openLongPhoto:null;
  var legacyHomeFullscreen=typeof window.happyadOpenHomePhotoFullscreen==='function'?window.happyadOpenHomePhotoFullscreen:null;
  function cleanId(id){return String(id||'').trim();}
  function remember(id,source){
    try{sessionStorage.setItem('HAPPYAD_CORE_LAST_PHOTO_OPEN',JSON.stringify({id:cleanId(id),source:source||MASTER_VERSION,t:Date.now()}));}catch(_e){}
    try{if(window.HappyState)HappyState.set('photo.lastOpen',{id:cleanId(id),source:source||MASTER_VERSION},MASTER_VERSION);}catch(_e){}
  }
  function openFromHome(id,opts){
    id=cleanId(id); opts=opts||{}; if(!id)return false; remember(id,opts.source||'home');
    if(legacyOpenLong&&!opts.forceRoute){try{return legacyOpenLong.call(window,id);}catch(_e){}}
    if(legacyHomeFullscreen&&!opts.forceRoute){try{return legacyHomeFullscreen.call(window,id);}catch(_e2){}}
    try{if(window.HappyNavigation)return window.HappyNavigation.open('modules/photo.html?post='+encodeURIComponent(id),{source:MASTER_VERSION,postId:id});}catch(_e3){}
    try{if(window.happyadOpenInternalUrlV492)return window.happyadOpenInternalUrlV492('modules/photo.html?post='+encodeURIComponent(id),{source:MASTER_VERSION,postId:id});}catch(_e4){}
    try{location.href='modules/photo.html?post='+encodeURIComponent(id);return true;}catch(_e5){return false;}
  }
  function openCentral(opts){
    opts=opts||{};
    try{if(window.HappyNavigation)return window.HappyNavigation.open('modules/photo.html',{source:MASTER_VERSION});}catch(_e){}
    try{if(window.happyadOpenInternalUrlV492)return window.happyadOpenInternalUrlV492('modules/photo.html',{source:MASTER_VERSION});}catch(_e2){}
    try{location.href='modules/photo.html';return true;}catch(_e3){return false;}
  }
  function close(reason){try{if(window.HappyNavigation&&typeof window.HappyNavigation.close==='function')return window.HappyNavigation.close(reason||'photo-master-close');}catch(_e){}return false;}
  function destroy(){try{if(window.HappyMedia)HappyMedia.pauseAll('photo-master-destroy');}catch(_e){} return true;}
  window.HappyPhoto={version:MASTER_VERSION,openFromHome:openFromHome,openCentral:openCentral,close:close,destroy:destroy,legacyOpenLong:legacyOpenLong,legacyHomeFullscreen:legacyHomeFullscreen};
  try{if(window.HappyMasterRegistry)HappyMasterRegistry.register('photo',{file:'core/photo-master.js',responsibility:'centrale photo, fullscreen accueil, retour photo, source photo',legacy:['openLongPhoto','happyadOpenHomePhotoFullscreen'],active:true});}catch(_e){}
})();
