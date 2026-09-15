/* Fyblic P1.07 — configuration Supabase publique canonique. */
(function(){
  'use strict';
  if(window.HappySupabaseConfigV973)return;

  /* Ces deux valeurs sont volontairement publiques : URL de projet + clé
     publishable Supabase. Aucun secret serveur ne doit être placé ici. */
  var PROJECT_URL='https://txjjyhupbejgjcianrmr.supabase.co';
  var PUBLISHABLE_KEY='sb_publishable_35EsjCOhZtaPtoZwdyAYOw_KaqlSKHD';

  function clean(v){return String(v==null?'':v).trim();}
  function validUrl(v){return /^https:\/\/[a-z0-9.-]+\.supabase\.co\/?$/i.test(clean(v));}
  function validKey(v){return /^sb_publishable_[A-Za-z0-9_-]+$/.test(clean(v));}
  function expose(name,value){
    try{
      var d=Object.getOwnPropertyDescriptor(window,name);
      if(d&&d.configurable===false)return;
      Object.defineProperty(window,name,{value:value,writable:false,enumerable:true,configurable:false});
    }catch(_e){try{window[name]=value;}catch(_e2){}}
  }
  function addNetworkHint(rel,href,crossorigin){
    try{
      if(!document||!document.head||!href)return;
      var selector='link[data-happyad-supabase-hint="'+rel+'"]';
      if(document.head.querySelector(selector))return;
      var link=document.createElement('link');
      link.rel=rel;link.href=href;link.setAttribute('data-happyad-supabase-hint',rel);
      if(crossorigin)link.crossOrigin='anonymous';
      document.head.appendChild(link);
    }catch(_e){}
  }

  if(!validUrl(PROJECT_URL)||!validKey(PUBLISHABLE_KEY))return;
  var api=Object.freeze({
    version:'HAPPYAD_SUPABASE_CONFIG_V973',
    url:PROJECT_URL,
    publishableKey:PUBLISHABLE_KEY,
    get:function(){return {url:PROJECT_URL,key:PUBLISHABLE_KEY};}
  });
  window.HappySupabaseConfigV973=api;
  expose('HAPPYAD_SUPABASE_URL',PROJECT_URL);
  expose('HAPPYAD_SUPABASE_KEY',PUBLISHABLE_KEY);
  addNetworkHint('preconnect',PROJECT_URL,true);
  try{addNetworkHint('dns-prefetch',new URL(PROJECT_URL).origin,false);}catch(_e){}
  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('supabase-config',{file:'core/supabase-config-master-v973.js',responsibility:'URL projet + clé publishable Supabase publiques canoniques',active:true,version:api.version});}catch(_e){}
})();
