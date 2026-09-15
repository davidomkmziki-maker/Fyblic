(function(){
  'use strict';
  if(window.__HAPPYAD_PUBLISH_MASTER_V589__)return;
  window.__HAPPYAD_PUBLISH_MASTER_V589__=true;

  var VERSION='V589_PUBLISH_FUNCTIONAL_WHITE_BUTTONS';
  var lastMainRoute={page:'home',url:'index.html'};
  var allowed={home:1,profile:1,profile_public:1,video:1,message:1};

  function clean(v){return String(v==null?'':v).trim();}
  function normalize(page,url){
    page=clean(page)||'home';
    url=clean(url)||(page==='home'?'index.html':'');
    if(!allowed[page])return null;
    return {page:page,url:url};
  }
  function remember(page,url){
    var route=normalize(page,url);
    if(route)lastMainRoute=route;
  }
  function initialRoute(){
    try{
      var st=history.state||{};
      remember(st.view||st.page||'home',st.url||'index.html');
    }catch(_e){}
  }
  function closePublish(reason){
    reason=clean(reason)||'publish-close-v589';
    /* V927 : la destination n'est plus recalculée depuis une variable locale.
       La vraie pile conserve B et A, y compris après plusieurs ouvertures. */
    try{if(window.HappyNavigation&&typeof window.HappyNavigation.back==='function')return window.HappyNavigation.back({source:reason+'-v927'});}catch(_canonical){}
    var route=lastMainRoute||{page:'home',url:'index.html'};
    try{
      if(route.page==='home'){
        if(window.HappyMainDockV586&&typeof window.HappyMainDockV586.open==='function')return window.HappyMainDockV586.open('home',{source:reason});
        if(window.HappyNavigation&&typeof window.HappyNavigation.close==='function')return window.HappyNavigation.close(reason);
        return false;
      }
      if(window.HappyNavigation&&typeof window.HappyNavigation.open==='function'){
        return window.HappyNavigation.open(route.url,{page:route.page,source:reason,force:true,replace:true});
      }
    }catch(_e){}
    try{location.href='index.html';}catch(_e){}
    return false;
  }

  initialRoute();
  window.addEventListener('HAPPYAD_NAV_CHANGED_V586',function(ev){
    try{
      var d=ev&&ev.detail||{};
      var page=clean(d.page)||'home';
      if(page!=='publish')remember(page,d.url);
    }catch(_e){}
  },true);
  window.addEventListener('message',function(ev){
    try{
      var d=ev&&ev.data;
      if(!d||d.type!=='HAPPYAD_PUBLISH_CLOSE_REQUEST_V589')return;
      if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
      if(ev.stopPropagation)ev.stopPropagation();
      closePublish(d.reason||'publish-close-message-v589');
    }catch(_e){}
  },true);

  window.HappyPublishMasterV589={version:VERSION,close:closePublish,getReturnRoute:function(){return Object.assign({},lastMainRoute);}};
})();
