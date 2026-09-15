(function(){
  'use strict';
  if(window.__HAPPYAD_VIDEO_MASTER_V6__)return;
  window.__HAPPYAD_VIDEO_MASTER_V6__=true;
  var MASTER_VERSION='VIDEO_MASTER_V594_PERSISTENT';
  var legacyOpen=typeof window.openLongVideo==='function'?window.openLongVideo:null;
  function clearOneShot(){
    try{sessionStorage.removeItem('HAPPYAD_VIDEO_POST_OPEN_V532');}catch(_e){}
    try{delete window.__happyadVideoPostOpenV532;}catch(_e){window.__happyadVideoPostOpenV532=null;}
  }
  function openFromHome(id){
    id=String(id||'').trim();if(!id)return false;
    clearOneShot();
    try{if(typeof window.happyadVideoFastOpenPayload==='function')window.happyadVideoFastOpenPayload(id);}catch(_e){}
    try{if(typeof window.happyadMarkVideoViewFromHome==='function')window.happyadMarkVideoViewFromHome(id);}catch(_e){}
    var url='modules/video.html?post='+encodeURIComponent(id)+'&autoplay=1&from=home';
    try{if(window.HappyNavigation&&typeof window.HappyNavigation.openVideoPost==='function')return window.HappyNavigation.openVideoPost(url,{source:MASTER_VERSION,postId:id});if(window.HappyNavigation)return window.HappyNavigation.open(url,{source:MASTER_VERSION,postId:id});}catch(_e){}
    try{location.href=url;return true;}catch(_e2){return false;}
  }
  function openCentral(){
    clearOneShot();
    try{if(window.HappyNavigation&&typeof window.HappyNavigation.activateMainTab==='function')return window.HappyNavigation.activateMainTab('video',{source:MASTER_VERSION});if(window.HappyNavigation)return window.HappyNavigation.open('modules/video.html',{source:MASTER_VERSION});}catch(_e){}
    try{location.href='modules/video.html';return true;}catch(_e2){return false;}
  }
  function destroy(){
    clearOneShot();
    try{if(window.HappyNavigation)window.HappyNavigation.blankVideoFrame('video-master-destroy');}catch(_e){}
    try{if(window.HappyMedia)HappyMedia.pauseAll('video-master-destroy');}catch(_e){}
    return true;
  }
  window.HappyVideo={version:MASTER_VERSION,openFromHome:openFromHome,openCentral:openCentral,destroy:destroy,legacyOpen:legacyOpen};
  window.openLongVideo=function(id){return window.HappyVideo.openFromHome(id);};
  try{if(window.HappyMasterRegistry)HappyMasterRegistry.register('video',{file:'core/video-master.js',responsibility:'ouverture vidéo depuis accueil, centrale vidéo, retour vidéo, nettoyage frame vidéo',legacy:['openLongVideo','V492 video wrapper','V532 video return'],active:true,version:MASTER_VERSION});}catch(_e){}
})();
