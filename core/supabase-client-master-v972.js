/* Fyblic P1.06 — constructeur Supabase canonique par contexte. */
(function(){
  'use strict';
  if(window.HappySupabaseClientMasterV972)return;

  var VERSION='HAPPYAD_SUPABASE_CLIENT_MASTER_V972';
  var localClient=null;
  var sdkPromise=null;

  function valid(client){
    return !!(client&&client.auth&&(typeof client.from==='function'||typeof client.rpc==='function'));
  }
  function sameOrigin(candidate){
    if(!candidate)return null;
    try{
      if(candidate===window)return candidate;
      void candidate.location.href;
      return candidate;
    }catch(_e){return null;}
  }
  function hosts(){
    var out=[];
    function add(candidate){candidate=sameOrigin(candidate);if(candidate&&out.indexOf(candidate)<0)out.push(candidate);}
    add(window);
    try{if(window.parent&&window.parent!==window)add(window.parent);}catch(_e){}
    try{if(window.top&&window.top!==window)add(window.top);}catch(_e2){}
    return out;
  }
  function existing(owner){
    owner=sameOrigin(owner);if(!owner)return null;
    try{
      var direct=owner.happyadSupabase||owner.HAPPYAD_SUPABASE||owner.__supabaseClient||null;
      if(valid(direct))return direct;
      if(owner.supabaseClient&&typeof owner.supabaseClient!=='function'&&valid(owner.supabaseClient))return owner.supabaseClient;
    }catch(_e){}
    return null;
  }
  function inheritEnvironment(owner){
    owner=sameOrigin(owner);if(!owner||owner===window)return;
    try{if(!window.supabase&&owner.supabase)window.supabase=owner.supabase;}catch(_sdk){}
    try{if(!window.HAPPYAD_SUPABASE_URL&&owner.HAPPYAD_SUPABASE_URL)window.HAPPYAD_SUPABASE_URL=owner.HAPPYAD_SUPABASE_URL;}catch(_url){}
    try{if(!window.HAPPYAD_SUPABASE_KEY&&owner.HAPPYAD_SUPABASE_KEY)window.HAPPYAD_SUPABASE_KEY=owner.HAPPYAD_SUPABASE_KEY;}catch(_key){}
  }
  function adopt(){
    if(valid(localClient))return localClient;
    var own=existing(window);
    if(valid(own)){localClient=own;return localClient;}
    var list=hosts();
    for(var i=0;i<list.length;i++){
      var owner=list[i];if(owner===window)continue;
      inheritEnvironment(owner);
      var shared=existing(owner);
      if(!valid(shared)){
        try{
          var api=owner.HappySupabaseClientMasterV972;
          if(api&&typeof api.get==='function')shared=api.get();
          else if(typeof owner.happyadSb==='function')shared=owner.happyadSb();
        }catch(_shared){}
      }
      if(valid(shared)){
        localClient=shared;
        window.happyadSupabase=shared;
        return shared;
      }
    }
    return null;
  }
  function authOptions(options){
    options=options||{};
    var auth=options.auth||{};
    return {
      persistSession:auth.persistSession!==false,
      autoRefreshToken:auth.autoRefreshToken!==false,
      detectSessionInUrl:auth.detectSessionInUrl!==false
    };
  }
  function projectConfig(){
    var list=hosts(),url='',key='';
    for(var i=0;i<list.length;i++){
      try{
        var canonical=list[i].HappySupabaseConfigV973;
        if(canonical){
          if(!url)url=String(canonical.url||'').trim();
          if(!key)key=String(canonical.publishableKey||'').trim();
        }
        if(!url)url=String(list[i].HAPPYAD_SUPABASE_URL||'').trim();
        if(!key)key=String(list[i].HAPPYAD_SUPABASE_KEY||'').trim();
      }catch(_e){}
      if(url&&key)break;
    }
    return {url:url,key:key};
  }
  function sdk(){
    try{if(window.supabase&&typeof window.supabase.createClient==='function')return window.supabase;}catch(_e){}
    var list=hosts();
    for(var i=0;i<list.length;i++){
      try{
        if(list[i].supabase&&typeof list[i].supabase.createClient==='function'){
          if(list[i]!==window)window.supabase=list[i].supabase;
          return list[i].supabase;
        }
      }catch(_e2){}
    }
    return null;
  }
  function protectAuthStorage(){
    try{
      if(window.HappyadAuthStorageV752&&typeof window.HappyadAuthStorageV752.wrap==='function')window.HappyadAuthStorageV752.wrap();
    }catch(_e){}
  }
  function get(options){
    var shared=adopt();if(valid(shared))return shared;
    var lib=sdk(),cfg=projectConfig();
    if(!lib||!cfg.url||!cfg.key)return null;
    try{
      protectAuthStorage();
      localClient=lib.createClient(cfg.url,cfg.key,{auth:authOptions(options)});
      if(valid(localClient)){
        window.happyadSupabase=localClient;
        window.__HAPPYAD_SUPABASE_CLIENT_V972=localClient;
        return localClient;
      }
    }catch(_e){localClient=null;}
    return null;
  }
  function ensure(options){
    options=options||{};
    var ready=get(options);if(valid(ready))return Promise.resolve(ready);
    if(sdkPromise)return sdkPromise.then(function(){return get(options);});
    var cfg=projectConfig();
    if(!cfg.url||!cfg.key)return Promise.resolve(null);
    sdkPromise=new Promise(function(resolve){
      try{
        var script=document.getElementById('happyadSupabaseSdkV972');
        if(!script){
          script=document.createElement('script');
          script.id='happyadSupabaseSdkV972';
          script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
          script.async=true;
          script.crossOrigin='anonymous';
          (document.head||document.documentElement).appendChild(script);
        }
        function done(){resolve(get(options));}
        if(sdk()){done();return;}
        script.addEventListener('load',done,{once:true});
        script.addEventListener('error',function(){resolve(null);},{once:true});
      }catch(_e){resolve(null);}
    });
    return sdkPromise;
  }
  function peek(){return valid(localClient)?localClient:existing(window);}
  function resetLocal(){localClient=null;try{delete window.__HAPPYAD_SUPABASE_CLIENT_V972;}catch(_e){window.__HAPPYAD_SUPABASE_CLIENT_V972=null;}}

  var api=Object.freeze({version:VERSION,get:get,ensure:ensure,peek:peek,adopt:adopt,resetLocal:resetLocal});
  window.HappySupabaseClientMasterV972=api;
  window.happyadSb=function(){return api.get();};
  window.happyadEnsureSupabaseClientV972=function(options){return api.ensure(options||{});};
  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('supabase-client',{file:'core/supabase-client-master-v972.js',responsibility:'constructeur Supabase unique par contexte + réutilisation parent/iframe',active:true,version:VERSION});}catch(_e){}
})();
