(function(){
  'use strict';
  if(window.__FYBLIC_TOAST_MASTER_V1105__)return;
  window.__FYBLIC_TOAST_MASTER_V1105__=true;
  var VERSION='FYBLIC_TOAST_V1105';
  var timer=0,el=null,style=null;
  function clean(v){return String(v==null?'':v).trim();}
  function ensure(){
    if(!style||!style.isConnected){
      style=document.getElementById('fyblicToastCssV1105')||document.createElement('style');
      style.id='fyblicToastCssV1105';
      style.textContent='#fyblicToastV1105{position:fixed;left:50%;bottom:calc(94px + env(safe-area-inset-bottom,0px));transform:translate(-50%,10px) scale(.985);z-index:2147483600;display:block;width:max-content;max-width:min(86vw,360px);padding:11px 16px;border:0;border-radius:999px;background:rgba(255,255,255,.14);color:#fff;font:1000 16px/1.22 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:-.15px;text-align:center;white-space:normal;box-shadow:none;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .18s ease,transform .18s ease,visibility .18s ease}#fyblicToastV1105.on{opacity:1;visibility:visible;transform:translate(-50%,0) scale(1)}@media(max-width:390px){#fyblicToastV1105{font-size:15px;padding:10px 14px;max-width:88vw}}';
      if(!style.isConnected)(document.head||document.documentElement).appendChild(style);
    }
    if(!el||!el.isConnected){
      el=document.getElementById('fyblicToastV1105')||document.createElement('div');
      el.id='fyblicToastV1105';el.setAttribute('role','status');el.setAttribute('aria-live','polite');el.setAttribute('aria-atomic','true');
      if(!el.isConnected)(document.body||document.documentElement).appendChild(el);
    }
    return el;
  }
  function localShow(message,duration){
    var text=clean(message);if(!text)return false;
    var node=ensure();node.textContent=text;node.classList.add('on');
    clearTimeout(timer);timer=setTimeout(function(){try{node.classList.remove('on');}catch(_e){}},Math.max(1200,Number(duration)||2400));
    return true;
  }
  function show(message,duration){
    var text=clean(message);if(!text)return false;
    try{
      if(window.parent&&window.parent!==window&&window.parent.FyblicToastV1105&&typeof window.parent.FyblicToastV1105.show==='function'){
        window.parent.FyblicToastV1105.show(text,duration);return true;
      }
    }catch(_e){}
    return localShow(text,duration);
  }
  window.addEventListener('message',function(ev){
    try{var d=ev&&ev.data;if(!d||d.type!=='FYBLIC_TOAST_V1105')return;localShow(d.message,d.duration);}catch(_e){}
  });
  window.FyblicToastV1105={version:VERSION,show:show};
  window.toast=show;
})();
