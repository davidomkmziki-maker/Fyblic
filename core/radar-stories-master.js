(function(){
  'use strict';
  if(window.__HAPPYAD_RADAR_STORIES_MASTER_V4__)return;
  window.__HAPPYAD_RADAR_STORIES_MASTER_V4__=true;
  var MASTER_VERSION='RADAR_STORIES_MASTER_V4';
  var legacyOpenRadar=typeof window.openRadarPost==='function'?window.openRadarPost:null;
  function refresh(){try{if(typeof window.renderRadarHome==='function')return window.renderRadarHome();}catch(_e){} return false;}
  function open(item,opts){opts=opts||{}; if(legacyOpenRadar&&!opts.forceMaster){try{return legacyOpenRadar.call(window,item);}catch(_e){}}
    try{var isVideo=window.isVideo&&window.isVideo(item); if(isVideo&&window.HappyVideo)return HappyVideo.openFromHome(item.id); if(window.HappyPhoto)return HappyPhoto.openFromHome(item.id,{source:MASTER_VERSION});}catch(_e2){}
    return false;
  }
  window.HappyRadarStories={version:MASTER_VERSION,refresh:refresh,open:open,legacyOpenRadar:legacyOpenRadar};
  try{if(window.HappyMasterRegistry)HappyMasterRegistry.register('radar-stories',{file:'core/radar-stories-master.js',responsibility:'radar accueil, stories, nom+badge radar, ouverture story/post',legacy:['renderRadarHome','openRadarPost','openHappyadStoryViewer'],active:false});}catch(_e){}
})();
