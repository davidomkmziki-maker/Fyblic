(function(){
  'use strict';
  if(window.__HAPPYAD_CACHE_MASTER_V4__)return;
  window.__HAPPYAD_CACHE_MASTER_V4__=true;
  var MASTER_VERSION='CACHE_MASTER_V4';
  var PREFIX='HAPPYAD_CORE_';
  var groups={
    video:['HAPPYAD_FAST_OPEN_VIDEO_V1','HAPPYAD_VIDEO_CACHE_STABLE_V1','HAPPYAD_VIDEO_POST_OPEN_V532'],
    profile:['HAPPYAD_ACTIVE_PROFILE','HAPPYAD_PUBLIC_PROFILE_STABLE_','HAPPYAD_PUBLIC_PROFILE_POSTS_'],
    posts:['HAPPYAD_SESSION_ALL_POSTS_V104','HAPPYAD_HOME_BOOT_SNAPSHOT_V1','HAPPYAD_GLOBAL_POSTS_CACHE_V1','HAPPYAD_PUBLISH_POSTS_V2','HAPPYAD_ALL_POSTS_V1'],
    stories:['HAPPYAD_STORIES_CACHE_V1']
  };
  function read(k,def){try{var v=localStorage.getItem(k);return v==null?def:JSON.parse(v);}catch(_e){return def;}}
  function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(_e){return false;}}
  function removeKeys(keys,storage){storage=storage||sessionStorage;(keys||[]).forEach(function(k){try{storage.removeItem(k);}catch(_e){}});}
  function clearGroup(name){var keys=groups[name]||[];removeKeys(keys,sessionStorage);removeKeys(keys,localStorage);try{write(PREFIX+'LAST_CLEAR_'+String(name).toUpperCase(),{name:name,t:Date.now()});}catch(_e){}return keys.length;}
  window.HappyCacheMaster={version:MASTER_VERSION,groups:groups,read:read,write:write,clearGroup:clearGroup,removeKeys:removeKeys};
  try{if(window.HappyMasterRegistry)HappyMasterRegistry.register('cache',{file:'core/cache-master.js',responsibility:'liste officielle des caches/stockages par catégorie avant suppression progressive',active:false,groups:Object.keys(groups)});}catch(_e){}
})();
