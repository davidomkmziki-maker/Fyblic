(function(){
  'use strict';
  if(window.__HAPPYAD_HOME_UI_MASTER_V4__)return;
  window.__HAPPYAD_HOME_UI_MASTER_V4__=true;
  var MASTER_VERSION='HOME_UI_MASTER_V4';
  function refresh(){try{if(typeof window.loadPosts==='function')return window.loadPosts();}catch(_e){}try{if(typeof window.render==='function')return window.render();}catch(_e2){}return false;}
  function cardOpen(post){try{if(window.isVideo&&window.isVideo(post)&&window.HappyVideo)return HappyVideo.openFromHome(post.id); if(window.HappyPhoto)return HappyPhoto.openFromHome(post.id,{source:MASTER_VERSION});}catch(_e){} return false;}
  window.HappyHomeUI={version:MASTER_VERSION,refresh:refresh,cardOpen:cardOpen};
  try{if(window.HappyMasterRegistry)HappyMasterRegistry.register('home-ui',{file:'core/home-ui-master.js',responsibility:'accueil visuel actuel : cartes/radar/pub/menu sans changer le design',active:false});}catch(_e){}
})();
