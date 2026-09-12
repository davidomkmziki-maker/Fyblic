(function(){
  'use strict';
  if(window.__HAPPYAD_INTERNAL_RETURN_MASTER_V694__)return;
  window.__HAPPYAD_INTERNAL_RETURN_MASTER_V694__=true;

  var VERSION='V930_PHOTO_PROFILE_EXACT_RETURN';
  var NOTIF_CENTER_ID='happyadNotificationReturnCenter';
  var NOTIF_FRAME_ID='happyadNotificationCenterFrame';
  var NOTIF_URL='modules/notification-center.html?v=971-story-notification-fast';
  var NOTIF_CLASS='happyadNotificationInternalV591';
  var layers=[];
  var handlers=Object.create(null);
  var notificationOpen=false;
  var notificationReady=false;
  var notificationPrewarmed=false;
  var notificationPendingDetail=null;
  var notificationRevealTimer=0;
  var notificationSuspendedV927=false;
  var lastStableRoute=null;
  var NAV_DEPTH_KEY_V927='__happyadNavDepthV927';
  var LAYER_MARKER_KEY_V927='__happyadInternalLayerV927';
  var LAYER_DEPTH_KEY_V927='__happyadInternalDepthV927';
  var layerHistoryV927=Object.create(null);
  var suspendedLayersV927=Object.create(null);
  var layerPolicyV929=Object.create(null);
  var ignoredLayerPopsV927=0;
  var preparingMenuV927=false;

  function clean(v){return String(v==null?'':v).trim();}
  function now(){return Date.now?Date.now():(new Date()).getTime();}
  function activeFrame(){
    try{var shell=document.getElementById('happyadAppShell');return shell&&shell.querySelector('.happyadAppFrame.on[data-happyad-page]');}catch(_e){return null;}
  }
  function normalizeDockPage(page){
    page=clean(page).toLowerCase();
    if(page==='home_post'||page==='home_comment'||page==='notification_center'||page==='notification'||page==='home_detail'||page==='home_publication')return 'home';
    return page||'home';
  }
  function currentRoute(){
    var frame=activeFrame();
    var page=clean(frame&&frame.getAttribute('data-happyad-page'));
    var url=clean(frame&&frame.getAttribute('data-happyad-src'));
    if(page)return {page:normalizeDockPage(page),url:url||('modules/'+page+'.html')};
    try{var st=history.state||{};page=clean(st.view);url=clean(st.url);}catch(_e){}
    return {page:normalizeDockPage(page),url:url||'index.html'};
  }
  function dockAllowed(page){page=normalizeDockPage(page);return page==='home'||page==='profile'||page==='video'||page==='message';}
  function dockElement(){return document.getElementById('happyadMainDockV585')||document.querySelector('.bottom.happyadMainDockV585');}
  function notifyMessageLayout(reason){
    try{var fr=document.getElementById('happyadAppFrame_message');if(fr&&fr.contentWindow)fr.contentWindow.postMessage({type:'HAPPYAD_MESSAGE_LAYOUT_REPAIR',detail:{reason:reason||VERSION,at:now()}},'*');}catch(_e){}
  }
  function layerIndex(id){id=clean(id);for(var i=layers.length-1;i>=0;i--)if(layers[i]===id)return i;return -1;}
  function topLayer(){return layers.length?layers[layers.length-1]:'';}
  function defaultLayerPolicyV929(id){
    /* La publication Accueil ouverte depuis Notifications est une destination
       de retour, pas une fenêtre au-dessus de l'interface. Elle reste dans la
       pile Android/History mais ne doit ni masquer le dock ni bloquer le scroll
       de la page visitée ensuite. Le défaut par identifiant protège également
       une session où l'ancien centre de notifications serait encore en cache. */
    var passive=clean(id)==='notification-home-post-v927';
    return {blocksSurface:!passive,lockScroll:!passive};
  }
  function normalizeLayerPolicyV929(id,options,saved){
    options=options&&typeof options==='object'?options:{};
    var base=saved&&typeof saved==='object'?saved:(layerPolicyV929[id]||defaultLayerPolicyV929(id));
    var blocks=base.blocksSurface!==false,locks=base.lockScroll!==false;
    if(options.passive===true){blocks=false;locks=false;}
    if(options.blocksSurface===true||options.blocksSurface===false)blocks=options.blocksSurface;
    if(options.lockScroll===true||options.lockScroll===false)locks=options.lockScroll;
    if(!blocks&&options.lockScroll!==true)locks=false;
    return {blocksSurface:!!blocks,lockScroll:!!locks};
  }
  function layerBlocksSurfaceV929(id){var p=layerPolicyV929[clean(id)]||defaultLayerPolicyV929(id);return p.blocksSurface!==false;}
  function hasLayers(){for(var i=0;i<layers.length;i++)if(layerBlocksSurfaceV929(layers[i]))return true;return false;}
  function lockLayerV929(id){
    var p=layerPolicyV929[clean(id)]||defaultLayerPolicyV929(id);
    if(p.lockScroll===false){try{if(window.HappyOverlayMasterV615)window.HappyOverlayMasterV615.unlock('internal-'+id);}catch(_u){}return false;}
    try{if(window.HappyOverlayMasterV615)window.HappyOverlayMasterV615.lock('internal-'+id);}catch(_o){}
    return true;
  }
  function unlockLayerV929(id){try{if(window.HappyOverlayMasterV615)window.HappyOverlayMasterV615.unlock('internal-'+clean(id));}catch(_o){}return true;}
  function forceDockHidden(on){
    var dock=dockElement();
    if(!dock)return;
    try{
      if(on){
        dock.setAttribute('aria-hidden','true');
        dock.style.setProperty('display','none','important');
        dock.style.setProperty('visibility','hidden','important');
        dock.style.setProperty('pointer-events','none','important');
      }else{
        dock.removeAttribute('aria-hidden');
        dock.style.removeProperty('display');
        dock.style.removeProperty('visibility');
        dock.style.removeProperty('pointer-events');
      }
    }catch(_e){}
  }
  function applyDock(pageOverride){
    if(!document.body)return;
    var hidden=hasLayers();
    var route=currentRoute();
    var rawOverride=clean(pageOverride);
    var forcedPage=rawOverride?normalizeDockPage(rawOverride):'';
    if(forcedPage)route.page=forcedPage;
    var visitor=(route.page==='profile_public');
    var visible=!hidden&&!visitor&&dockAllowed(route.page);
    document.body.classList.toggle('happyadMainDockVisible',visible);
    document.body.classList.toggle('happyadInternalScreenOpenV591',hidden);
    forceDockHidden(hidden||visitor);
    /* V862 : une couche interne pouvait être ouverte alors que le dock était déjà
       auto-masqué par un ancien scroll. À la fermeture, happyadMainDockVisible revenait
       mais la classe auto-hidden survivait jusqu'au prochain timer/scroll. On nettoie
       toutes ces classes dans le même cycle que la restauration de la page. */
    if(visible){
      ['happyadDockAutoHiddenV618','happyadDockAutoHiddenV605','happyadDockAutoHiddenV607','happyadDockAutoHiddenV608','happyadDockScrollActiveV618'].forEach(function(c){document.body.classList.remove(c);});
      try{
        var dockApi=window.HappyDockAutoHideV653||window.HappyDockAutoHideV618||window.HappyDockAutoHideV608;
        if(dockApi&&typeof dockApi.stabilize==='function')dockApi.stabilize(route.page,'internal-return-v862');
        else if(dockApi&&typeof dockApi.show==='function')dockApi.show('internal-return-v862');
      }catch(_dock){}
    }
    setTimeout(function(){notifyMessageLayout(hidden?'internal-open-v591':'internal-closed-v591');},20);
  }

  function layerDepthV927(value){var n=Number(value&&value[LAYER_DEPTH_KEY_V927]);return isFinite(n)&&n>0?Math.floor(n):0;}
  function navDepthV927(value){var n=Number(value&&value[NAV_DEPTH_KEY_V927]);return isFinite(n)&&n>=0?Math.floor(n):0;}
  function layerUsesHistoryV927(id){return !!id&&id!=='photo-central';}
  function armLayerHistoryV927(id){
    if(!layerUsesHistoryV927(id))return false;
    var record=layerHistoryV927[id];if(record&&record.armed)return true;
    try{
      var base=Object.assign({},history.state||{}),depth=layerDepthV927(base);
      if(depth===0){delete base[LAYER_MARKER_KEY_V927];base[LAYER_DEPTH_KEY_V927]=0;History.prototype.replaceState.call(history,base,'',location.href);}
      var active=Object.assign({},base);
      active[LAYER_MARKER_KEY_V927]=id;active[LAYER_DEPTH_KEY_V927]=depth+1;active.__happyadInternalAtV927=now();
      History.prototype.pushState.call(history,active,'',location.href);
      layerHistoryV927[id]={armed:true,depth:depth+1};
      return true;
    }catch(_e){layerHistoryV927[id]={armed:false,depth:0};return false;}
  }
  function consumeLayerHistoryV927(id){
    var record=layerHistoryV927[id];
    if(!record||!record.armed||preparingMenuV927)return false;
    record.armed=false;ignoredLayerPopsV927++;
    try{History.prototype.go.call(history,-1);return true;}catch(_e){ignoredLayerPopsV927=Math.max(0,ignoredLayerPopsV927-1);return false;}
  }
  try{EventTarget.prototype.addEventListener.call(window,'popstate',function(ev){
    if(ignoredLayerPopsV927>0){ignoredLayerPopsV927--;return;}
    var id=topLayer();if(!id)return;
    var record=layerHistoryV927[id];if(!record||!record.armed)return;
    var next=ev&&ev.state||{},nextId=clean(next[LAYER_MARKER_KEY_V927]),nextDepth=layerDepthV927(next);
    if(nextId===id&&nextDepth>=record.depth)return;
    record.armed=false;
    back(id,{fromPop:true,source:'android-back-v927'});
  },true);}catch(_pop){}

  function openLayer(id,options){
    id=clean(id)||'internal';
    if(id==='photo-central')return id;
    delete suspendedLayersV927[id];
    var idx=layerIndex(id),alreadyTop=idx>=0&&idx===layers.length-1;
    var previousPolicy=layerPolicyV929[id]||null;
    layerPolicyV929[id]=normalizeLayerPolicyV929(id,options,previousPolicy);
    if(options&&typeof options.onBack==='function')handlers[id]=options.onBack;
    if(alreadyTop){
      /* Une sous-page interne (ex. Paramètres > Langue) peut traiter le premier
         Retour Android sans fermer son hôte. L'entrée de couche vient alors
         d'être dépilée : le signal KEEP_OPEN réarme exactement une sentinelle,
         afin que le Retour suivant ferme encore la bonne couche au lieu de
         traverser la route B restée dessous. */
      var currentRecord=layerHistoryV927[id];
      if(!(options&&options.fromHistory)&&(!currentRecord||!currentRecord.armed))armLayerHistoryV927(id);
      lockLayerV929(id);
      applyDock();
      return id;
    }
    if(idx>=0)layers.splice(idx,1);
    layers.push(id);
    if(!(options&&options.fromHistory))armLayerHistoryV927(id);
    lockLayerV929(id);
    applyDock();
    return id;
  }
  function closeLayer(id){
    id=clean(id);
    if(!id)id=topLayer();
    var idx=layerIndex(id);
    if(idx<0){
      /* Fermeture idempotente : même si une ancienne course a déjà retiré
         l'entrée de la pile, son propriétaire ne doit garder aucun verrou. */
      delete handlers[id];delete layerPolicyV929[id];unlockLayerV929(id);
      return false;
    }
    layers.splice(idx,1);
    consumeLayerHistoryV927(id);
    delete handlers[id];
    delete layerPolicyV929[id];
    unlockLayerV929(id);
    applyDock();
    return true;
  }
  function suspendLayerV927(id,options){
    id=clean(id);if(!id)return false;options=options||{};
    var idx=layerIndex(id);
    if(idx<0){
      if(suspendedLayersV927[id]&&typeof options.onResume==='function')suspendedLayersV927[id].onResume=options.onResume;
      return !!suspendedLayersV927[id];
    }
    var savedHandler=handlers[id],savedPolicy=layerPolicyV929[id]||defaultLayerPolicyV929(id);layers.splice(idx,1);delete handlers[id];delete layerPolicyV929[id];
    var record=layerHistoryV927[id];if(record){record.armed=false;record.suspended=true;}
    suspendedLayersV927[id]={handler:savedHandler||null,onResume:typeof options.onResume==='function'?options.onResume:null,depth:Number(record&&record.depth||layerDepthV927(history.state)||1),navDepth:navDepthV927(history.state),policy:savedPolicy};
    unlockLayerV929(id);
    applyDock();
    return true;
  }
  function resumeLayerV927(id,options){
    id=clean(id);if(!id)return false;options=options||{};
    var saved=suspendedLayersV927[id]||{},idx=layerIndex(id);
    if(idx<0)layers.push(id);
    if(typeof options.onBack==='function')handlers[id]=options.onBack;
    else if(typeof saved.handler==='function')handlers[id]=saved.handler;
    layerPolicyV929[id]=normalizeLayerPolicyV929(id,options,saved.policy||defaultLayerPolicyV929(id));
    var depth=layerDepthV927(history.state)||Number(saved.depth||1),onResume=typeof options.onResume==='function'?options.onResume:saved.onResume;
    layerHistoryV927[id]={armed:true,depth:depth,suspended:false};
    delete suspendedLayersV927[id];lockLayerV929(id);applyDock();
    try{if(typeof onResume==='function')onResume({id:id,depth:depth,source:'history-resume-v928'});}catch(_resume){}
    return true;
  }
  function register(id,onBack){id=clean(id);if(id&&typeof onBack==='function')handlers[id]=onBack;return function(){delete handlers[id];};}
  function postToFrame(page,type,detail){
    try{
      var fr=document.getElementById('happyadAppFrame_'+String(page||'').replace(/[^a-zA-Z0-9_-]/g,'_'));
      if(fr&&fr.contentWindow){fr.contentWindow.postMessage({type:type,detail:detail||{}},'*');return true;}
    }catch(_e){}
    return false;
  }
  function postToActive(type,detail){
    try{var fr=activeFrame();if(fr&&fr.contentWindow){fr.contentWindow.postMessage({type:type,detail:detail||{}},'*');return true;}}catch(_e){}
    return false;
  }

  function installNotificationStyle(){
    if(document.getElementById('happyadNotificationInternalV591Style'))return;
    var style=document.createElement('style');
    style.id='happyadNotificationInternalV591Style';
    style.textContent=[
      '#'+NOTIF_CENTER_ID+'{position:fixed!important;inset:0!important;z-index:1000100!important;width:100vw!important;height:100dvh!important;background:#03070d!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;overflow:hidden!important;contain:strict!important}',
      '#'+NOTIF_CENTER_ID+'.on{visibility:visible!important;opacity:1!important;pointer-events:auto!important}',
      '#'+NOTIF_CENTER_ID+' .haNotifBody{position:absolute!important;inset:0!important;overflow:hidden!important;background:#03070d!important;contain:strict!important}',
      '#'+NOTIF_CENTER_ID+' iframe{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border:0!important;background:#03070d!important;display:block!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;transition:none!important}',
      '#'+NOTIF_CENTER_ID+'.ready iframe{opacity:1!important;visibility:visible!important;pointer-events:auto!important}',
      '#'+NOTIF_CENTER_ID+' .haNotifInstant{display:none!important}',
      '#'+NOTIF_CENTER_ID+'.ready .haNotifInstant{display:none!important}',
      '#'+NOTIF_CENTER_ID+' .haNotifInstantTop{height:48px!important;display:flex!important;align-items:center!important;gap:11px!important;margin-bottom:12px!important}',
      '#'+NOTIF_CENTER_ID+' .haNotifInstantBack{width:36px!important;height:36px!important;border-radius:50%!important;border:1px solid rgba(255,255,255,.18)!important;display:grid!important;place-items:center!important;font-size:31px!important;line-height:1!important;background:rgba(255,255,255,.04)!important}',
      '#'+NOTIF_CENTER_ID+' .haNotifInstantTitle{font-size:22px!important;font-weight:950!important}',
      '#'+NOTIF_CENTER_ID+' .haNotifInstantList{display:grid!important;gap:8px!important}',
      '#'+NOTIF_CENTER_ID+' .haNotifInstantRow{height:68px!important;border-radius:17px!important;background:rgba(255,255,255,.035)!important;border:1px solid rgba(255,255,255,.045)!important;display:grid!important;grid-template-columns:48px minmax(0,1fr)!important;gap:10px!important;align-items:center!important;padding:9px 10px!important}',
      '#'+NOTIF_CENTER_ID+' .haNotifInstantAvatar{width:48px!important;height:48px!important;border-radius:50%!important;background:rgba(255,255,255,.09)!important}',
      '#'+NOTIF_CENTER_ID+' .haNotifInstantLines{display:grid!important;gap:8px!important}',
      '#'+NOTIF_CENTER_ID+' .haNotifInstantLine{height:10px!important;border-radius:999px!important;background:rgba(255,255,255,.08)!important;width:84%!important;position:relative!important;overflow:hidden!important}',
      '#'+NOTIF_CENTER_ID+' .haNotifInstantLine.small{width:52%!important;opacity:.72!important}',
      'html.'+NOTIF_CLASS+',body.'+NOTIF_CLASS+'{overflow:hidden!important;overscroll-behavior:none!important}',
      'body.'+NOTIF_CLASS+' .bottom.happyadMainDockV585,body.'+NOTIF_CLASS+' #happyadMainDockV585{display:none!important;visibility:hidden!important;pointer-events:none!important}',
      'body.'+NOTIF_CLASS+' #happyadAppShell{pointer-events:none!important}'
    ].join('\n');
    (document.head||document.documentElement).appendChild(style);
  }
  function notificationShell(){
    installNotificationStyle();
    var el=document.getElementById(NOTIF_CENTER_ID);
    if(el)return el;
    el=document.createElement('section');
    el.id=NOTIF_CENTER_ID;
    el.setAttribute('aria-hidden','true');
    el.innerHTML='<div class="haNotifBody"><iframe id="'+NOTIF_FRAME_ID+'" title="Notifications Fyblic" loading="eager" referrerpolicy="same-origin" src="'+NOTIF_URL+'"></iframe></div>';
    document.body.appendChild(el);
    el.addEventListener('click',function(ev){try{var back=ev&&ev.target&&ev.target.closest&&ev.target.closest('.haNotifInstantBack');if(back){ev.preventDefault();ev.stopPropagation();hideNotification('instant-back-v623');}}catch(_e){}},true);
    return el;
  }
  function notificationFrame(){return document.getElementById(NOTIF_FRAME_ID);}
  function sendNotification(type,detail){
    try{var fr=notificationFrame();if(fr&&fr.contentWindow){fr.contentWindow.postMessage({type:type,detail:detail||{}},'*');return true;}}catch(_e){}
    return false;
  }
  function prepareNotification(){
    var el=notificationShell(),fr=notificationFrame();
    if(!fr)return el;
    if(!fr.__happyadV591Bound){
      fr.__happyadV591Bound=true;
      fr.addEventListener('load',function(){
        /* Le load seul ne suffit pas : l'iframe peut être chargée mais encore vide.
           Le signal HAPPYAD_NOTIFICATION_CENTER_READY décide de l'affichage. */
        try{fr.setAttribute('data-happyad-document-loaded-v622','1');}catch(_e){}
      });
    }
    var src=clean(fr.getAttribute('src'));
    if(!src||src.indexOf('modules/notification-center.html')<0){notificationReady=false;fr.setAttribute('src',NOTIF_URL);}
    return el;
  }
  function prewarmNotification(){if(notificationPrewarmed||!document.body)return;notificationPrewarmed=true;prepareNotification();}
  function revealNotification(detail,reason,fromHistory){
    detail=detail&&detail.detail?detail.detail:(detail||{});
    clearTimeout(notificationRevealTimer);notificationRevealTimer=0;
    notificationPendingDetail=null;
    var el=notificationShell();
    notificationOpen=true;
    notificationSuspendedV927=false;
    openLayer('notification',fromHistory?{fromHistory:true}:null);
    document.documentElement.classList.add(NOTIF_CLASS);
    document.body.classList.add(NOTIF_CLASS);
    el.classList.add('on');el.setAttribute('aria-hidden','false');el.removeAttribute('inert');
    /* V626 : la vraie iframe reste visible dès l'ouverture. L'état ready sert uniquement à la synchronisation, jamais à masquer la page. */
    if(notificationReady)el.classList.add('ready');else el.classList.remove('ready');
    sendNotification('HAPPYAD_NOTIFICATIONS_REFRESH',{source:clean(detail.source)||VERSION,at:now(),reason:reason||'ready-v622'});
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_NOTIFICATION_CENTER_OPENED',{detail:{source:clean(detail.source)||VERSION,at:now(),reason:reason||'ready-v622'}}));}catch(_e){}
    return true;
  }
  function openNotification(detail){
    detail=detail&&detail.detail?detail.detail:(detail||{});
    prepareNotification();
    notificationPendingDetail=detail;
    /* V626 : le clic affiche directement la vraie page Notifications déjà montée, sans squelette intermédiaire. */
    revealNotification(detail,notificationReady?'already-ready-v626':'direct-frame-v626');
    clearTimeout(notificationRevealTimer);
    notificationRevealTimer=setTimeout(function(){
      try{
        var fr=notificationFrame();
        var d=fr&&fr.contentDocument;
        if(d&&d.body&&d.readyState!=='loading'){
          notificationReady=true;
          var el=notificationShell();el.classList.add('ready');
          sendNotification('HAPPYAD_NOTIFICATIONS_REFRESH',{source:clean(detail.source)||VERSION,at:now(),reason:'safe-document-ready-v623'});
        }
      }catch(_e){}
    },700);
    return true;
  }
  function restoreDockAfterNotification(reason){
    var run=function(){
      try{
        if(notificationOpen||hasLayers())return;
        document.documentElement.classList.remove(NOTIF_CLASS);
        document.body.classList.remove(NOTIF_CLASS);
        applyDock();
        if(dockAllowed(currentRoute().page)&&window.HappyDockAutoHideV653&&typeof window.HappyDockAutoHideV653.show==='function')window.HappyDockAutoHideV653.show('notification-return-'+String(reason||VERSION));
      }catch(_e){}
    };
    setTimeout(run,0);setTimeout(run,80);setTimeout(run,260);
  }
  function hideNotification(reason){
    clearTimeout(notificationRevealTimer);notificationRevealTimer=0;notificationPendingDetail=null;
    var el=document.getElementById(NOTIF_CENTER_ID);
    if(el){el.classList.remove('on');el.setAttribute('aria-hidden','true');el.setAttribute('inert','');}
    notificationOpen=false;
    notificationSuspendedV927=false;
    delete suspendedLayersV927.notification;
    document.documentElement.classList.remove(NOTIF_CLASS);
    document.body.classList.remove(NOTIF_CLASS);
    closeLayer('notification');
    restoreDockAfterNotification(reason||'notification-close');
    try{if(window.HappyOverlayMasterV615)window.HappyOverlayMasterV615.reconcile('notification-close-'+String(reason||''));}catch(_ov){}
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_NOTIFICATION_CENTER_CLOSED',{detail:{reason:reason||'internal-back-v591',at:now()}}));}catch(_e){}
    return true;
  }
  function suspendNotificationV927(reason){
    if(!notificationOpen){restoreDockAfterNotification(reason||'notification-handoff-already-closed');return false;}
    clearTimeout(notificationRevealTimer);notificationRevealTimer=0;notificationPendingDetail=null;
    var el=document.getElementById(NOTIF_CENTER_ID);if(el){el.classList.remove('on');el.setAttribute('aria-hidden','true');el.setAttribute('inert','');}
    notificationOpen=false;notificationSuspendedV927=true;
    document.documentElement.classList.remove(NOTIF_CLASS);document.body.classList.remove(NOTIF_CLASS);
    var idx=layerIndex('notification'),notificationPolicyV929=layerPolicyV929.notification||defaultLayerPolicyV929('notification');if(idx>=0)layers.splice(idx,1);delete layerPolicyV929.notification;
    var record=layerHistoryV927.notification;if(record){record.armed=false;record.suspended=true;}
    suspendedLayersV927.notification={handler:null,depth:Number(record&&record.depth||layerDepthV927(history.state)||1),navDepth:navDepthV927(history.state),policy:notificationPolicyV929};
    delete handlers.notification;applyDock();
    unlockLayerV929('notification');
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_NOTIFICATION_CENTER_SUSPENDED_V927',{detail:{reason:reason||'notification-handoff-v927',at:now()}}));}catch(_e){}
    return true;
  }
  function handoffNotification(reason){
    return suspendNotificationV927(reason||'notification-handoff-v927');
  }
  function discardLayersAboveDepthV927(depth){
    preparingMenuV927=true;
    try{
      while(layers.length){
        var id=topLayer(),record=layerHistoryV927[id];
        if(!record||Number(record.depth||0)<=depth)break;
        record.armed=false;layers.pop();
        try{if(typeof handlers[id]==='function')handlers[id]();else postToActive('HAPPYAD_INTERNAL_BACK_EXECUTE_V591',{id:id,source:'history-discard-v927'});}catch(_e){}
        delete handlers[id];delete layerPolicyV929[id];unlockLayerV929(id);
      }
    }finally{preparingMenuV927=false;}
  }
  function restoreHistoryStateV927(value){
    var id=clean(value&&value[LAYER_MARKER_KEY_V927]);
    if(id!=='notification'&&suspendedLayersV927[id]){
      var genericDepth=layerDepthV927(value)||Number(suspendedLayersV927[id].depth||1);
      discardLayersAboveDepthV927(genericDepth);
      resumeLayerV927(id);
      return true;
    }
    if(id!=='notification'||!notificationSuspendedV927)return false;
    var depth=layerDepthV927(value)||1;
    discardLayersAboveDepthV927(depth);
    layerHistoryV927.notification={armed:true,depth:depth,suspended:false};
    delete suspendedLayersV927.notification;
    revealNotification({source:'history-return-v927'},'history-return-v927',true);
    return true;
  }
  function suspendedHistoryOffsetV927(){
    /* Une couche suspendue peut déjà être comprise dans __happyadInternalDepthV927
       (Notification -> publication Accueil) ou se trouver avant une nouvelle
       route principale (Notification -> Profil -> photo). On ne compte ici que
       les entrées physiques qui ne sont pas déjà incluses dans la profondeur
       interne de l'état courant. */
    var current={};try{current=history.state||{};}catch(_e){}
    var currentNav=navDepthV927(current),currentInternal=layerDepthV927(current),extra=0;
    Object.keys(suspendedLayersV927).forEach(function(id){
      var saved=suspendedLayersV927[id]||{},savedNav=Math.max(0,Number(saved.navDepth)||0),savedDepth=Math.max(1,Number(saved.depth)||1);
      if(savedNav!==currentNav||currentInternal<savedDepth)extra++;
    });
    return extra;
  }
  function openInternalUrl(data){
    var url=clean(data&&data.url);if(!url)return false;
    handoffNotification('notification-content-v591');
    try{if(window.HappyNavigation&&typeof window.HappyNavigation.open==='function')window.HappyNavigation.open(url,Object.assign({force:true,source:VERSION},data.extra||{}));}catch(_e){}
    return true;
  }
  function openHomeComment(data){handoffNotification('notification-comment-v591');try{if(typeof window.happyadOpenHomeCommentFromNotificationV545==='function')window.happyadOpenHomeCommentFromNotificationV545(data||{});}catch(_e){}}
  function openHomePost(data){handoffNotification('notification-post-v591');try{if(typeof window.happyadOpenHomePostFromNotificationV548==='function')window.happyadOpenHomePostFromNotificationV548(data||{});}catch(_e){}}
  function returnFromCentralPhoto(){
    /* La centrale Photo est une vraie route, pas une couche. Son bouton Retour
       dépile donc exactement B, puis A, au lieu de relire une destination mémorisée
       qui pouvait sauter directement vers l'Accueil. */
    try{if(window.HappyNavigation&&typeof window.HappyNavigation.back==='function')return window.HappyNavigation.back({source:'photo-internal-return-v927'});}catch(_e){}
    return false;
  }
  function back(id,options){
    id=clean(id)||topLayer();
    if(!id)return false;
    try{if(typeof handlers[id]==='function')return handlers[id]();}catch(_e){}
    if(id==='notification')return hideNotification('notification-button-v591');
    if(id==='photo-central')return returnFromCentralPhoto();
    if(id==='message-chat')return postToFrame('message','HAPPYAD_INTERNAL_BACK_EXECUTE_V591',{id:id});
    if(postToActive('HAPPYAD_INTERNAL_BACK_EXECUTE_V591',{id:id,source:clean(options&&options.source)||VERSION}))return true;
    closeLayer(id);
    return true;
  }

  function prepareMenuNavigation(reason){
    preparingMenuV927=true;
    try{
      var pending=layers.slice().reverse();
      pending.forEach(function(id){
        var record=layerHistoryV927[id];if(record)record.armed=false;
        try{
          if(id==='notification')hideNotification(reason||'menu-v927');
          else if(typeof handlers[id]==='function')handlers[id]();
          else postToActive('HAPPYAD_INTERNAL_BACK_EXECUTE_V591',{id:id,source:reason||'menu-v927'});
        }catch(_e){}
        /* Certains hôtes répondent au message de fermeture après le changement
           de route. La libération idempotente ici empêche qu'un verrou interne
           survive entre les deux surfaces. */
        delete layerPolicyV929[id];unlockLayerV929(id);
      });
      layers.length=0;handlers=Object.create(null);layerPolicyV929=Object.create(null);
      notificationOpen=false;notificationSuspendedV927=false;suspendedLayersV927=Object.create(null);
      var el=document.getElementById(NOTIF_CENTER_ID);if(el){el.classList.remove('on');el.setAttribute('aria-hidden','true');el.setAttribute('inert','');}
      document.documentElement.classList.remove(NOTIF_CLASS);document.body&&document.body.classList.remove(NOTIF_CLASS);
      applyDock();
    }finally{preparingMenuV927=false;}
    return true;
  }

  window.addEventListener('HAPPYAD_NOTIFICATION_CENTER_REQUEST',function(ev){openNotification(ev&&ev.detail||{});},true);
  window.addEventListener('HAPPYAD_NAV_CHANGED_V586',function(ev){
    var d=ev&&ev.detail||{},page=clean(d.page)||'home',url=clean(d.url)||'index.html';
    if(page==='photo'){
      lastStableRoute={page:page,url:url};
      applyDock(page);
    }else{
      closeLayer('photo-central');
      /* V855R25 : lorsqu'on quitte un Profil visiteur après avoir ouvert une photo,
         les couches photo pouvaient rester enregistrées pendant quelques instants.
         Elles forçaient alors le dock inférieur à rester caché alors que l'Accueil
         était déjà visible. On les ferme dans le même cycle de navigation. */
      if(page!=='profile'&&page!=='profile_public'){
        /* V930 : lors de C -> B, restoreHistoryStateV927() a déjà restauré la
           couche fullscreen indiquée par l'entrée History dépilée. Si B est
           l'Accueil + home-photo, ne pas refermer cette couche au moment où
           Navigation repeint l'Accueil : sinon on retombe sur la simple carte
           publication au lieu du fullscreen exact. Une navigation normale vers
           l'Accueil n'a pas ce marqueur actif et continue de fermer les couches. */
        var historyLayerV930='';
        try{historyLayerV930=clean((history.state||{})[LAYER_MARKER_KEY_V927]);}catch(_historyLayer){}
        if(!(page==='home'&&historyLayerV930==='home-photo'&&layerIndex('home-photo')>=0))closeLayer('home-photo');
        if(!(page==='home'&&historyLayerV930==='profile-photo'&&layerIndex('profile-photo')>=0))closeLayer('profile-photo');
      }
      if(page!=='profile')closeLayer('profile-stats-v855');
      if(page!=='publish')lastStableRoute={page:page,url:url};
      /* Le routeur émet cet événement avant la mise à jour de history.state.
         Utiliser la page annoncée évite de relire momentanément profile_public. */
      applyDock(page);
    }
  },true);
  window.addEventListener('message',function(ev){
    try{
      var d=ev&&ev.data;if(!d||typeof d!=='object')return;
      var type=clean(d.type),detail=d.detail&&typeof d.detail==='object'?d.detail:d;
      var notifFrame=notificationFrame();
      var fromNotif=false;try{fromNotif=!!(notifFrame&&notifFrame.contentWindow===ev.source);}catch(_src){}
      if(type==='HAPPYAD_NOTIFICATION_CENTER_READY'||(type==='HAPPYAD_FRAME_BOOTSTRAP_READY_V623'&&fromNotif)){
        notificationReady=true;
        var notifEl=notificationShell();notifEl.classList.add('ready');
        sendNotification('HAPPYAD_NOTIFICATIONS_REFRESH',{source:VERSION,at:now(),reason:type});
        notificationPendingDetail=null;
      }
      else if(type==='HAPPYAD_INTERNAL_SCREEN_OPEN_V591')openLayer(clean(detail.id)||'internal');
      else if(type==='HAPPYAD_INTERNAL_SCREEN_CLOSE_V591'||type==='HAPPYAD_INTERNAL_SCREEN_CLOSED_V591')closeLayer(clean(detail.id)||'internal');
      else if(type==='HAPPYAD_INTERNAL_BACK_REQUEST_V591')back(clean(detail.id));
      else if(type==='HAPPYAD_PROFILE_VIEWER_OPEN_V581'||type==='HAPPYAD_PROFILE_VIEWER_OPEN_V588')openLayer('profile-photo');
      else if(type==='HAPPYAD_PROFILE_VIEWER_CLOSE_V581'||type==='HAPPYAD_PROFILE_VIEWER_CLOSE_V588')closeLayer('profile-photo');
      else if(type==='HAPPYAD_MESSAGE_CHAT_OPEN_V587')openLayer('message-chat');
      else if(type==='HAPPYAD_MESSAGE_CHAT_CLOSE_V587')closeLayer('message-chat');
      else if(type==='HAPPYAD_PHOTO_INTERNAL_BACK_V587'||type==='HAPPYAD_PHOTO_INTERNAL_BACK_V590')returnFromCentralPhoto();
      else if(type==='HAPPYAD_NOTIFICATION_INTERNAL_BACK_V587'||type==='HAPPYAD_NOTIFICATION_INTERNAL_BACK_V588')hideNotification('legacy-notification-back-v591');
      else if(type==='HAPPYAD_NOTIFICATION_CENTER_REQUEST')openNotification(detail);
      else if(type==='HAPPYAD_OPEN_INTERNAL_URL'&&d.url)openInternalUrl(d);
      else if(type==='HAPPYAD_NOTIFICATION_OPEN_HOME_COMMENT')openHomeComment(d);
      else if(type==='HAPPYAD_NOTIFICATION_OPEN_HOME_POST')openHomePost(d);
      else if(type==='HAPPYAD_NOTIFICATION_OPEN_PROFILE'||type==='HAPPYAD_NOTIFICATION_OPEN_PUBLICATION'||type==='HAPPYAD_NOTIFICATION_OPEN_ORDER'||type==='HAPPYAD_NOTIFICATION_OPEN_DETAILS'||type==='HAPPYAD_NOTIFICATIONS_NAVIGATE')handoffNotification(type);
    }catch(_e){}
  },true);
  ['resize','orientationchange','pageshow'].forEach(function(type){window.addEventListener(type,function(){if(notificationOpen){var el=notificationShell();el.style.height='100dvh';}applyDock();},true);});

  function start(){
    lastStableRoute=currentRoute();
    applyDock();
    /* V626 : la page Notifications est montée une seule fois dès le démarrage, puis conservée cachée. */
    try{window.__HAPPYAD_NOTIFICATION_LAZY_V615__=false;window.__HAPPYAD_NOTIFICATION_DIRECT_V626__=true;}catch(_e){}
    try{prewarmNotification();}catch(_warm){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

  window.HappyInternalReturnV694={version:VERSION,open:openLayer,close:closeLayer,suspend:suspendLayerV927,resume:resumeLayerV927,back:back,register:register,top:topLayer,openNotification:openNotification,closeNotification:hideNotification,returnFromCentralPhoto:returnFromCentralPhoto,prepareMenuNavigation:prepareMenuNavigation,restoreHistoryState:restoreHistoryStateV927,historyOffset:suspendedHistoryOffsetV927,applyDock:applyDock};
  window.HappyInternalReturnV591=window.HappyInternalReturnV694;
  window.HappyInternalReturnV588=window.HappyInternalReturnV694;
  window.HappyInternalReturnV587=window.HappyInternalReturnV694;
  window.HappyNotificationReturnCenter={version:VERSION,open:openNotification,close:hideNotification,handoff:handoffNotification,frame:notificationFrame};
})();
