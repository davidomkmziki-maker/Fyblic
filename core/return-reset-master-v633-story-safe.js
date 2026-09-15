(function(){
  'use strict';
  if(window.__HAPPYAD_RETURN_RESET_V584__)return;
  window.__HAPPYAD_RETURN_RESET_V584__=true;
  var disabled=function(){return false;};
  var nativeAdd=window.addEventListener.bind(window);
  var nativeReplace=history.replaceState.bind(history);
  var nativeGo=history.go.bind(history);

  /* V927 : les anciens routeurs restent isolés. Le maître Navigation canonique
     utilise explicitement History.prototype afin d'être le seul à pouvoir créer
     des entrées. Cela évite qu'un vieux module enregistre la page courante comme
     destination de retour et reconstruise une boucle. */
  try{history.pushState=function(state,title,url){return nativeReplace(state,title,url);};}catch(_e){}
  try{history.back=disabled;}catch(_e){}
  try{history.go=function(delta){if(Number(delta)<0)return false;return nativeGo(delta);};}catch(_e){}

  /* Do not let legacy scripts reinstall popstate-based return controllers. */
  try{
    window.addEventListener=function(type,listener,options){
      if(String(type||'').toLowerCase()==='popstate')return;
      return nativeAdd(type,listener,options);
    };
  }catch(_e){}

  function canonicalBack(source){
    try{
      /* P1.04 : un seul moteur parent/enfant. Dans une surface embarquée,
         l'intention Retour est toujours remise au contrôleur canonique du parent;
         dans le shell principal, elle reste locale. */
      var host=window.parent&&window.parent!==window?window.parent:window;
      var internal=host.HappyInternalReturnV694||host.HappyInternalReturnV591;
      var top=internal&&typeof internal.top==='function'?String(internal.top()||''):'';
      if(top&&typeof internal.back==='function')return internal.back(top,{source:source||'canonical-return-v929'});
      if(host.HappyNavigation&&typeof host.HappyNavigation.back==='function')return host.HappyNavigation.back({source:source||'canonical-return-v929'});
      if(host!==window&&host.postMessage){host.postMessage({type:'HAPPYAD_NAV_BACK_REQUEST',detail:{source:source||'canonical-return-v929'}},'*');return true;}
      if(host===window){History.prototype.go.call(history,-1);return true;}
    }catch(_e){}
    return false;
  }
  function installCanonicalApi(name){
    try{Object.defineProperty(window,name,{configurable:true,enumerable:true,get:function(){return canonicalBack;},set:function(){}});}catch(_e){try{window[name]=canonicalBack;}catch(_x){}}
  }
  installCanonicalApi('happyadCloseAppPage');
  installCanonicalApi('happyadCloseAppPageChild');

  /* Les messages historiques sont arrêtés avant les anciens contrôleurs, mais
     leur intention est transmise une seule fois à la pile canonique. */
  nativeAdd('message',function(ev){
    try{
      var d=ev&&ev.data;
      var type=typeof d==='string'?d:(d&&d.type);
      if(type==='HAPPYAD_CLOSE_APP_PAGE'||type==='HAPPYAD_NAV_BACK_REQUEST'||type==='HAPPYAD_CLOSE_MESSAGE_CENTER'||type==='HAPPYAD_NOTIFICATIONS_CLOSE'){
        canonicalBack(type+'-canonical-v929');
        if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
        if(ev.stopPropagation)ev.stopPropagation();
      }
    }catch(_e){}
  },true);

  var exactSelectors=[
    '[aria-label="Retour"]','[aria-label^="Retour "]','[title="Retour"]',
    '#happyadVideoBackBtn','#backButton','#listBackBtn','#backBtn','#hsvBack','#hpsBack',
    '#haBackChoice','#haForgotBack','#backEdit','#realBackToCentral',
    '.photoFixedBack','.ha581Back','.haPcBack','.haHomeFsClose','.inlineBack',
    '.list-back-btn','.back-button','button.back-btn','button.hsvBack','button.hpsBack'
  ];
  function isReturnNode(el){
    if(!el||el.nodeType!==1)return false;
    /* V633 : les commandes du lecteur Story appartiennent au maître Story.
       Le nettoyeur global des anciens retours ne doit jamais les supprimer. */
    try{if(el.getAttribute&&el.getAttribute('data-happyad-story-control'))return false;}catch(_storyControl){}
    try{if(el.closest&&el.closest('#happyStoryViewerMasterV629[data-happyad-story-master]'))return false;}catch(_storyViewer){}
    try{if(el.getAttribute&&(el.getAttribute('data-happyad-internal-return-v591')==='1'||el.getAttribute('data-happyad-internal-return-v587')==='1'))return false;}catch(_approved){}
    try{if(el.matches(exactSelectors.join(',')))return true;}catch(_e){}
    var text=String(el.textContent||'').trim().toLowerCase();
    if((el.tagName==='BUTTON'||el.tagName==='A')&&(text==='retour'||text==='retour accueil'||text==='retour à happyad'))return true;
    if(el.tagName==='A'){
      var href=String(el.getAttribute('href')||'').trim();
      var cls=String(el.className||'');
      if((cls==='back'||/(^|\s)back(\s|$)/.test(cls))&&(/index\.html(?:[?#]|$)/.test(href)||href==='..\/index.html'))return true;
    }
    return false;
  }
  function isProfileIntentV928(el){
    try{return !!(el&&el.closest&&el.closest('[data-happyad-profile-intent-v928="1"],[data-open-slide-profile],.creatorPill'));}catch(_e){return false;}
  }
  function purge(root){
    root=root||document;
    try{
      var nodes=root.querySelectorAll(exactSelectors.join(',')+',button,a');
      for(var i=nodes.length-1;i>=0;i--){if(isReturnNode(nodes[i]))nodes[i].remove();}
    }catch(_e){}
  }
  nativeAdd('DOMContentLoaded',function(){purge(document);try{new MutationObserver(function(ms){ms.forEach(function(m){for(var i=0;i<m.addedNodes.length;i++){var n=m.addedNodes[i];if(n&&n.nodeType===1){if(isReturnNode(n))n.remove();else purge(n);}}});}).observe(document.documentElement,{childList:true,subtree:true});}catch(_e){};},false);
  document.addEventListener('click',function(ev){
    try{if(isProfileIntentV928(ev.target))return;var t=ev.target&&ev.target.closest&&ev.target.closest('button,a');if(isReturnNode(t)){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();canonicalBack('legacy-button-canonical-v929');return false;}}catch(_e){}
  },true);

  function neutralize(){
    /* V927 : HappyNavigation.back est désormais l'unique contrôleur officiel.
       Les façades anciennes délèguent vers lui et ne peuvent plus l'écraser. */
    try{if(window.HappyRouter)window.HappyRouter.back=canonicalBack;}catch(_e){}
    try{if(window.HappyHistory)window.HappyHistory.back=canonicalBack;}catch(_e){}
  }
  neutralize();
  var timer=setInterval(neutralize,120);
  setTimeout(function(){clearInterval(timer);neutralize();purge(document);},12000);
})();
