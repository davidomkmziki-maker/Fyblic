(function(){
  'use strict';
  if(window.__HAPPYAD_MEDIA_MASTER_V4__)return;
  window.__HAPPYAD_MEDIA_MASTER_V4__=true;
  var MASTER_VERSION='MEDIA_MASTER_V4';
  function pauseAll(reason){
    try{document.querySelectorAll('video,audio').forEach(function(m){try{m.pause();}catch(_e){}});}catch(_e){}
    try{document.querySelectorAll('iframe').forEach(function(f){try{f.contentWindow.postMessage({type:'HAPPYAD_STOP_MEDIA',reason:reason||MASTER_VERSION},'*');}catch(_e2){}});}catch(_e3){}
    try{if(window.HappyMedia&&typeof HappyMedia.pauseAll==='function')HappyMedia.pauseAll(reason||MASTER_VERSION);}catch(_e4){}
    return true;
  }
  function stopModule(name){pauseAll('stop-module-'+String(name||''));}
  window.HappyMediaMaster={version:MASTER_VERSION,pauseAll:pauseAll,stopModule:stopModule};
  try{if(window.HappyMasterRegistry)HappyMasterRegistry.register('media',{file:'core/media-master.js',responsibility:'pause/stop vidéo/audio/frame par module',active:false});}catch(_e){}
})();
