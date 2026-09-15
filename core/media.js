(function(){
  'use strict';
  if(window.HappyMedia)return;
  function pauseIn(doc){try{(doc||document).querySelectorAll('video,audio').forEach(function(m){try{m.pause();}catch(_e){}});}catch(_e){}}
  window.HappyMedia={
    pauseAll:function(reason){pauseIn(document);try{document.querySelectorAll('iframe').forEach(function(fr){try{if(fr.contentWindow)fr.contentWindow.postMessage({type:'HAPPYAD_CORE_PAUSE_MEDIA',reason:reason||'core'},'*');}catch(_e){}});}catch(_e){}},
    stopFrames:function(){try{document.querySelectorAll('iframe.happyadAppFrame').forEach(function(fr){try{fr.contentWindow&&fr.contentWindow.postMessage({type:'HAPPYAD_CORE_PAUSE_MEDIA',reason:'stopFrames-remove'},'*');}catch(_m){}try{fr.classList.remove('on');fr.remove();}catch(_e){try{fr.parentNode&&fr.parentNode.removeChild(fr);}catch(_x){}}});}catch(_e){}},
    onLeaveModule:function(moduleName){this.pauseAll('leave-'+String(moduleName||'module'));}
  };
  window.addEventListener('message',function(ev){try{var d=ev.data||{};if(d&&d.type==='HAPPYAD_CORE_PAUSE_MEDIA')pauseIn(document);}catch(_e){}},false);
})();
