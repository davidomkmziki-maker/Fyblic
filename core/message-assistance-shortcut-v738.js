(function(){
  'use strict';
  if(window.__HAPPYAD_MESSAGE_ASSISTANCE_SHORTCUT_V757__)return;
  window.__HAPPYAD_MESSAGE_ASSISTANCE_SHORTCUT_V757__=true;
  var lastOpenAt=0;
  function stop(event){
    try{event.preventDefault()}catch(_e){}
    try{event.stopPropagation()}catch(_e){}
    try{event.stopImmediatePropagation()}catch(_e){}
  }
  function open(event){
    stop(event);
    var now=Date.now();if(now-lastOpenAt<450)return false;lastOpenAt=now;
    var detail={source:'messages',returnTarget:'message-center'};
    try{
      if(window.parent&&window.parent!==window){
        window.parent.postMessage({type:'HAPPYAD_ASSISTANCE_V757_OPEN',detail:detail},location.origin);
        return false;
      }
      var master=window.HappyadAssistanceMasterV757;
      if(master&&typeof master.open==='function')master.open(detail);
    }catch(_e){}
    return false;
  }
  function bind(){
    document.querySelectorAll('[data-happyad-assistance-shortcut-v738]').forEach(function(button){
      if(button.__happyadV757Bound)return;
      button.__happyadV757Bound=true;
      button.addEventListener('click',open,{capture:true,passive:false});
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
