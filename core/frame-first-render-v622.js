(function(){
  'use strict';
  if(window.__HAPPYAD_FRAME_FIRST_RENDER_V622__)return;
  window.__HAPPYAD_FRAME_FIRST_RENDER_V622__=true;

  var sent=false;
  function pageName(){
    try{return String(location.pathname.split('/').pop()||'module').replace(/\.html$/i,'');}
    catch(_e){return 'module';}
  }
  function meaningful(){
    try{
      if(!document.body)return false;
      if(document.body.children&&document.body.children.length>0)return true;
      return String(document.body.textContent||'').replace(/\s+/g,' ').trim().length>0;
    }catch(_e){return false;}
  }
  function send(reason){
    if(sent)return true;
    if(!meaningful())return false;
    sent=true;
    try{
      window.parent&&window.parent!==window&&window.parent.postMessage({
        type:'HAPPYAD_FIRST_RENDER_READY_V622',
        page:pageName(),
        reason:String(reason||'first-paint'),
        at:Date.now()
      },'*');
    }catch(_e){}
    return true;
  }
  function afterPaint(reason){
    try{requestAnimationFrame(function(){requestAnimationFrame(function(){send(reason);});});}
    catch(_e){setTimeout(function(){send(reason);},0);}
  }
  function boot(){
    afterPaint('dom-ready');
    var tries=0;
    var timer=setInterval(function(){
      tries++;
      if(send('content-ready')||tries>24)clearInterval(timer);
    },80);
  }
  window.HappyadFirstRenderV622={ready:send};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
