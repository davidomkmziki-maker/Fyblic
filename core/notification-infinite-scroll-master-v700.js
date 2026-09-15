(function(){
  'use strict';
  if(window.__HAPPYAD_NOTIFICATION_INFINITE_SCROLL_V700__)return;
  window.__HAPPYAD_NOTIFICATION_INFINITE_SCROLL_V700__=true;

  var VERSION='V869_NOTIFICATION_ANCHOR_STABLE';
  var FIRST_PAGE=12;
  var NEXT_PAGE=10;
  var states=Object.create(null);
  var currentKey='';
  var container=null;
  var list=null;
  var observer=null;
  var lastConfig=null;
  var serverRequestPending=false;
  var serverRequestTimer=0;
  var restoreRaf=0;

  function finite(value){var n=Number(value);return Number.isFinite(n)?n:0;}
  function clean(value){return String(value==null?'':value).trim();}
  function globalScrollActive(){
    try{var g=window.HappyadGlobalScrollCoordinatorV868;return !!(g&&typeof g.isActive==='function'&&g.isActive());}catch(_e){return false;}
  }
  function deferRestore(page,target){
    try{
      var g=window.HappyadGlobalScrollCoordinatorV868;
      if(g&&typeof g.defer==='function'){g.defer('notification-scroll-position',function(){restorePosition(page,target);},55);return true;}
    }catch(_e){}
    return false;
  }

  function injectStyle(){
    if(document.getElementById('happyad-notification-scroll-style-v700'))return;
    var style=document.createElement('style');
    style.id='happyad-notification-scroll-style-v700';
    style.textContent=[
      'html,body{height:100%!important;min-height:0!important;overflow:hidden!important;overscroll-behavior:none!important;}',
      'body{position:relative!important;}',
      '.notification-shell{height:100vh!important;height:100dvh!important;min-height:0!important;display:grid!important;grid-template-rows:auto auto minmax(0,1fr)!important;overflow:hidden!important;}',
      '.notification-header{position:relative!important;top:auto!important;flex:none!important;}',
      '.filter-strip{position:relative!important;top:auto!important;flex:none!important;}',
      '.notification-content{height:100%!important;min-height:0!important;overflow-x:hidden!important;overflow-y:auto!important;overscroll-behavior-y:contain!important;-webkit-overflow-scrolling:touch!important;scrollbar-width:none!important;touch-action:pan-y!important;}',
      '.notification-content::-webkit-scrollbar{width:0!important;height:0!important;display:none!important;}',
      '.notification-content{ -ms-overflow-style:none!important; }',
      '.notification-list{min-height:1px!important;}',
      '.happyad-notification-sentinel-v700{height:2px!important;min-height:2px!important;width:100%!important;pointer-events:none!important;opacity:0!important;overflow:hidden!important;}',
      '.happyad-notification-page-anchor-v700{overflow-anchor:auto!important;}',
      '.notification-header,.filter-strip{overflow-anchor:none!important;}'
    ].join('\n');
    (document.head||document.documentElement).appendChild(style);
  }

  function stateFor(key){
    key=clean(key)||'all|all';
    if(!states[key])states[key]={limit:FIRST_PAGE,scrollTop:0,total:0};
    return states[key];
  }

  function saveCurrentPosition(){
    if(!container||!currentKey)return;
    stateFor(currentKey).scrollTop=Math.max(0,finite(container.scrollTop));
  }

  function captureVisibleAnchor(){
    if(!container||!list||finite(container.scrollTop)<3)return null;
    try{
      var top=container.getBoundingClientRect().top;
      var rows=list.querySelectorAll('.notification-item[data-id]');
      for(var i=0;i<rows.length;i++){
        var rect=rows[i].getBoundingClientRect();
        if(rect.bottom>top+1)return {id:clean(rows[i].dataset&&rows[i].dataset.id),offset:rect.top-top};
      }
    }catch(_e){}
    return null;
  }

  function cancelObserver(){
    if(observer){try{observer.disconnect();}catch(_e){}observer=null;}
  }

  function requestServerMore(){
    if(serverRequestPending||!lastConfig||lastConfig.serverHasMore!==true)return;
    serverRequestPending=true;
    clearTimeout(serverRequestTimer);
    serverRequestTimer=setTimeout(function(){serverRequestPending=false;},2200);
    try{if(typeof lastConfig.onNeedMore==='function')lastConfig.onNeedMore();}catch(_e){}
  }

  function advanceClientPage(){
    if(!lastConfig)return;
    var key=lastConfig.key;
    var state=stateFor(key);
    var total=Array.isArray(lastConfig.items)?lastConfig.items.length:0;
    if(state.limit<total){
      state.limit=Math.min(total,state.limit+NEXT_PAGE);
      try{if(typeof lastConfig.onAdvance==='function')lastConfig.onAdvance();}catch(_e){}
      return;
    }
    requestServerMore();
  }

  function observeSentinel(sentinel){
    cancelObserver();
    if(!sentinel||!container)return;
    if('IntersectionObserver' in window){
      observer=new IntersectionObserver(function(entries){
        for(var i=0;i<entries.length;i++){
          if(entries[i]&&entries[i].isIntersecting){advanceClientPage();break;}
        }
      },{root:container,rootMargin:'420px 0px 520px 0px',threshold:0.01});
      try{observer.observe(sentinel);}catch(_e){}
    }
  }

  function fallbackNearEnd(){
    if(!container||!lastConfig)return;
    var remaining=container.scrollHeight-container.scrollTop-container.clientHeight;
    if(remaining<560)advanceClientPage();
  }

  function bindContainer(nextContainer,nextList){
    injectStyle();
    if(container===nextContainer&&list===nextList)return;
    if(container){try{container.removeEventListener('scroll',fallbackNearEnd);}catch(_e){}}
    container=nextContainer||document.querySelector('.notification-content');
    list=nextList||document.getElementById('notificationList');
    if(container)container.addEventListener('scroll',fallbackNearEnd,{passive:true});
  }

  function begin(config){
    config=config||{};
    bindContainer(config.container,config.list);
    var visibleAnchor=captureVisibleAnchor();
    var key=clean(config.key)||'all|all';
    var keyChanged=!!currentKey&&currentKey!==key;
    if(currentKey)saveCurrentPosition();
    currentKey=key;
    var state=stateFor(key);
    var items=Array.isArray(config.items)?config.items:[];
    var oldTotal=state.total;
    state.total=items.length;
    if(config.reset===true){state.limit=FIRST_PAGE;state.scrollTop=0;}
    if(state.limit<FIRST_PAGE)state.limit=FIRST_PAGE;
    if(state.limit>Math.max(FIRST_PAGE,items.length)&&items.length<oldTotal)state.limit=Math.max(FIRST_PAGE,items.length);
    lastConfig={
      key:key,
      items:items,
      serverHasMore:config.serverHasMore===true,
      onAdvance:config.onAdvance,
      onNeedMore:config.onNeedMore
    };
    return {
      key:key,
      state:state,
      items:items.slice(0,Math.min(state.limit,items.length)),
      total:items.length,
      hasClientMore:state.limit<items.length,
      hasServerMore:config.serverHasMore===true,
      restoreScrollTop:state.scrollTop,
      visibleAnchor:visibleAnchor,
      keyChanged:keyChanged
    };
  }

  function restorePosition(page,target){
    if(globalScrollActive()){deferRestore(page,target);return;}
    cancelAnimationFrame(restoreRaf);
    restoreRaf=requestAnimationFrame(function(){
      if(!container||currentKey!==page.key)return;
      if(globalScrollActive()){deferRestore(page,target);return;}
      var max=Math.max(0,container.scrollHeight-container.clientHeight);
      var desired=Math.min(target,max),anchor=page&&page.visibleAnchor;
      if(anchor&&anchor.id){
        try{
          var escaped=window.CSS&&typeof window.CSS.escape==='function'?window.CSS.escape(anchor.id):anchor.id.replace(/["\\]/g,'\\$&');
          var next=list.querySelector('.notification-item[data-id="'+escaped+'"]');
          if(next){var top=container.getBoundingClientRect().top;desired=Math.max(0,Math.min(max,container.scrollTop+(next.getBoundingClientRect().top-top)-finite(anchor.offset)));}
        }catch(_e){}
      }
      if(Math.abs(container.scrollTop-desired)>1)container.scrollTop=desired;
      stateFor(page.key).scrollTop=desired;
      requestAnimationFrame(function(){
        if(!container||currentKey!==page.key||globalScrollActive())return;
        var max2=Math.max(0,container.scrollHeight-container.clientHeight);
        var settled=Math.min(desired,max2);
        if(Math.abs(container.scrollTop-settled)>2)container.scrollTop=settled;
        stateFor(page.key).scrollTop=settled;
        fallbackNearEnd();
      });
    });
  }

  function commit(page){
    page=page||{};
    if(!list||!container)return;
    if(globalScrollActive()){
      try{
        var global=window.HappyadGlobalScrollCoordinatorV868;
        if(global&&typeof global.defer==='function'){global.defer('notification-scroll-commit',function(){commit(page);},55);return;}
      }catch(_g){}
    }
    cancelObserver();
    var needsSentinel=page.hasClientMore||page.hasServerMore;
    var sentinel=null;
    if(needsSentinel){
      sentinel=document.createElement('div');
      sentinel.className='happyad-notification-sentinel-v700';
      sentinel.setAttribute('aria-hidden','true');
      sentinel.dataset.happyadMore=page.hasClientMore?'client':'server';
      list.appendChild(sentinel);
      observeSentinel(sentinel);
    }
    var target=Math.max(0,finite(page.restoreScrollTop));
    restorePosition(page,target);
  }

  function notifyDataArrived(){
    serverRequestPending=false;
    clearTimeout(serverRequestTimer);
  }

  function reset(key){
    key=clean(key);
    if(key){delete states[key];return;}
    states=Object.create(null);
    currentKey='';
  }

  window.HappyNotificationInfiniteScrollV700={
    version:VERSION,
    begin:begin,
    commit:commit,
    save:saveCurrentPosition,
    notifyDataArrived:notifyDataArrived,
    reset:reset,
    state:function(key){var s=stateFor(key||currentKey);return {limit:s.limit,scrollTop:s.scrollTop,total:s.total};}
  };

  injectStyle();
})();
