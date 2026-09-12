(function(){
  'use strict';
  if(window.__HAPPYAD_STORY_LEGACY_LOCK_V629__)return;
  window.__HAPPYAD_STORY_LEGACY_LOCK_V629__=true;

  var LEGACY_IDS={
    happyStoryViewer:1,
    happyProfileStoryViewer:1,
    storyViewerShade:1,
    homeRadarBlock:1
  };
  var MASTER_VIEWER='happyStoryViewerMasterV629';
  var MASTER_RADAR='homeRadarStoryMasterV629';

  function installCriticalCss(){
    if(document.getElementById('happyad-story-legacy-lock-v629-css'))return;
    var st=document.createElement('style');
    st.id='happyad-story-legacy-lock-v629-css';
    st.textContent='\n'
      +'#happyStoryViewer,#happyProfileStoryViewer,#storyViewerShade,.storyViewerShade.show{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}\n'
      +'#homeRadarBlock{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;}\n'
      +'#'+MASTER_VIEWER+'{visibility:visible!important;opacity:1!important;}\n'
      +'#'+MASTER_RADAR+'{visibility:visible!important;opacity:1!important;}\n'
      +'#'+MASTER_RADAR+' .radarItem{-webkit-tap-highlight-color:transparent!important;outline:0!important;}\n'
      +'#'+MASTER_RADAR+' .radarItem:focus,#'+MASTER_RADAR+' .radarItem:active{outline:0!important;}\n';
    (document.head||document.documentElement).appendChild(st);
  }

  function neutralize(el){
    if(!el||el.nodeType!==1)return;
    var id=String(el.id||'');
    if(LEGACY_IDS[id]){
      try{el.setAttribute('aria-hidden','true');el.setAttribute('data-happyad-story-legacy-disabled','v629');}
      catch(_e){}
      try{
        el.style.setProperty('display','none','important');
        el.style.setProperty('visibility','hidden','important');
        el.style.setProperty('opacity','0','important');
        el.style.setProperty('pointer-events','none','important');
      }catch(_e2){}
    }
    try{
      var q=el.querySelectorAll&&el.querySelectorAll('#happyStoryViewer,#happyProfileStoryViewer,#storyViewerShade,#homeRadarBlock');
      if(q)Array.prototype.forEach.call(q,neutralize);
    }catch(_e3){}
  }

  function scanLegacy(){
    Object.keys(LEGACY_IDS).forEach(function(id){try{neutralize(document.getElementById(id));}catch(_e){}});
  }

  function master(){return window.HappyStoryV629||null;}
  function bindMaster(){
    var m=master();if(!m)return false;
    try{if(typeof m.renderRadar==='function')window.renderRadarHome=m.renderRadar;}catch(_e){}
    try{if(typeof m.routeRadar==='function')window.openRadarPost=m.routeRadar;}catch(_e){}
    try{if(typeof m.openItem==='function'){window.openHappyadStoryViewer=m.openItem;window.openCentralStory=m.openItem;}}catch(_e){}
    try{if(typeof m.openProfile==='function'){window.openProfileStoryPremium=m.openProfile;window.openStoryViewer=m.openProfile;}}catch(_e){}
    try{window.happyadHardCloseStoryViewer=m.close;}catch(_e){}
    try{document.documentElement.classList.add('happyadStoryMasterReadyV629');}catch(_e){}
    return true;
  }

  installCriticalCss();
  try{document.documentElement.classList.add('happyadStoryLegacyLockedV629');}catch(_e){}
  scanLegacy();

  try{
    var observer=new MutationObserver(function(list){
      list.forEach(function(m){Array.prototype.forEach.call(m.addedNodes||[],neutralize);});
      bindMaster();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }catch(_e){}

  document.addEventListener('DOMContentLoaded',function(){scanLegacy();bindMaster();},{once:true});
  window.addEventListener('pageshow',function(){scanLegacy();bindMaster();},true);
  var tries=0,fast=setInterval(function(){tries++;scanLegacy();if(bindMaster()&&tries>10){clearInterval(fast)}if(tries>80)clearInterval(fast)},50);
  setInterval(function(){scanLegacy();bindMaster();},1800);
})();
