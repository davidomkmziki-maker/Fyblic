(function(){
  'use strict';
  if(window.__HAPPYAD_AUTH_STORAGE_QUOTA_MASTER_V752__)return;
  window.__HAPPYAD_AUTH_STORAGE_QUOTA_MASTER_V752__=true;

  var VERSION='HAPPYAD_AUTH_STORAGE_QUOTA_V937_IDB_AUTH_PURGE';
  var DB_NAME='HAPPYAD_AUTH_STORAGE_V752';
  var STORE_NAME='auth';
  var memory={};
  var dbPromise=null;
  var originalCreateClient=null;
  var cleanedAt=0;

  var TEMP_PREFIXES=[
    'HAPPYAD_GLOBAL_POSTS_CACHE_V1','HAPPYAD_HOME_POSTS_CACHE_V1','HAPPYAD_HOME_BOOT_CACHE',
    'HAPPYAD_HOME_BOOT_SNAPSHOT_V1','HAPPYAD_HOME_CONFIRMED_ORDER_V643','HAPPYAD_ALL_POSTS_V1',
    'HAPPYAD_SEARCH_POSTS_FAST_CACHE_V1','HAPPYAD_VIDEO_CACHE_STABLE_V1','HAPPYAD_PHOTO_STABLE_CACHE_V1',
    'HAPPYAD_STORIES_CACHE_V1','HAPPYAD_AUTHOR_PROFILE_CACHE_V1','HAPPYAD_PUBLIC_PROFILE_CACHE_V1',
    'HAPPYAD_PUBLIC_PROFILE_POSTS_CACHE_V1','HAPPYAD_PROFILE_POSTS_CACHE_V1','HAPPYAD_USER_POSTS_CACHE_V1',
    'HAPPYAD_PROFILE_OWN_POSTS_STABLE_CACHE_V1','HAPPYAD_PROFILE_HOME_PHOTO_BRIDGE_V482',
    'HAPPYAD_FAST_OPEN_PHOTO_V1','HAPPYAD_FAST_OPEN_VIDEO_V1','HAPPYAD_FIXED_RADAR_PUBLIC_CONFIG_V1',
    'HAPPYAD_MSG_CONNECTED_PROFILE_V1:','HAPPYAD_VIDEO_THUMB_V1_','HAPPYAD_SPONSOR_STATE_V1',
    'HAPPYAD_SPONSOR_MEDIA_CACHE_V1','HAPPYAD_PHOTO_FAST_CACHE','HAPPYAD_VIDEO_FAST_CACHE'
  ];


  /* V763 — Les listes structurelles de l'Accueil ne sont plus supprimées au
     premier dépassement de quota. Les miniatures et caches médias lourds sont
     évacués d'abord; les snapshots de publications sont compactés en dernier. */
  var HOME_STRUCTURAL_KEYS=[
    'HAPPYAD_HOME_BOOT_SNAPSHOT_V1','HAPPYAD_HOME_CONFIRMED_ORDER_V643','HAPPYAD_GLOBAL_POSTS_CACHE_V1',
    'HAPPYAD_HOME_POSTS_CACHE_V1','HAPPYAD_ALL_POSTS_V1','HAPPYAD_SEARCH_POSTS_FAST_CACHE_V1',
    'HAPPYAD_PUBLISH_POSTS_V2','HAPPYAD_PUBLIC_PROFILE_POSTS_CACHE_V1','HAPPYAD_PROFILE_POSTS_CACHE_V1',
    'HAPPYAD_USER_POSTS_CACHE_V1','HAPPYAD_PROFILE_OWN_POSTS_STABLE_CACHE_V1'
  ];
  var HOME_PRESERVE_KEYS=['HAPPYAD_HOME_CONFIRMED_ORDER_V643','HAPPYAD_GLOBAL_POSTS_CACHE_V1'];
  var MEDIA_FIRST_PREFIXES=[
    'HAPPYAD_VIDEO_THUMB_V1_','HAPPYAD_SPONSOR_MEDIA_CACHE_V1','HAPPYAD_PHOTO_FAST_CACHE','HAPPYAD_VIDEO_FAST_CACHE',
    'HAPPYAD_FAST_OPEN_PHOTO_V1','HAPPYAD_FAST_OPEN_VIDEO_V1','HAPPYAD_VIDEO_CACHE_STABLE_V1','HAPPYAD_PHOTO_STABLE_CACHE_V1',
    'HAPPYAD_STORIES_CACHE_V1','HAPPYAD_FIXED_RADAR_PUBLIC_CONFIG_V1','HAPPYAD_PROFILE_HOME_PHOTO_BRIDGE_V482'
  ];

  var PROTECTED_PARTS=[
    'AUTH','SESSION','FORCE_LOGOUT','CURRENT_USER','CENTRAL_USER','ACTIVE_PROFILE','PROFILE_IDENTITY_STABLE',
    'USER_SETTINGS','DRAFT','OUTBOX','UNSENT','MESSAGE','CONVERSATION','ASSISTANCE','SUPPORT_CHAT',
    'LIKE','FAVOR','REPOST','ACTION','COMMENT','FOLLOW','NOTIFICATION','DELETED','RECOVERY','SETTING'
  ];

  function clean(v){return String(v==null?'':v).trim();}
  function bytes(v){try{return new Blob([String(v==null?'':v)]).size;}catch(_e){return String(v==null?'':v).length*2;}}
  function isQuota(err){
    var name=clean(err&&err.name).toLowerCase(),msg=clean(err&&err.message||err).toLowerCase();
    return name==='quotaexceedederror'||name==='ns_error_dom_quota_reached'||msg.indexOf('quota')>-1||msg.indexOf('storage')>-1&&msg.indexOf('exceed')>-1;
  }
  function isAuthKey(key){key=clean(key).toLowerCase();return key.indexOf('sb-')===0&&key.indexOf('auth-token')>-1||key.indexOf('gotrue')>-1;}
  function isProtected(key){
    key=clean(key).toUpperCase();
    if(!key)return true;
    if(isAuthKey(key))return true;
    for(var i=0;i<PROTECTED_PARTS.length;i++)if(key.indexOf(PROTECTED_PARTS[i])>-1)return true;
    return false;
  }
  function isTemporary(key,value){
    key=clean(key);if(!key)return false;
    /* Audit V757 : les préfixes explicitement classés temporaires passent avant
       la protection large PROFILE/MESSAGE, sinon les plus gros caches n'étaient
       jamais libérés et le quota Auth pouvait revenir. */
    for(var i=0;i<TEMP_PREFIXES.length;i++)if(key===TEMP_PREFIXES[i]||key.indexOf(TEMP_PREFIXES[i])===0)return true;
    if(isProtected(key))return false;
    var up=key.toUpperCase();
    if(/(?:CACHE|THUMB|THUMBNAIL|PREPAINT|BOOT_SNAPSHOT|FAST_OPEN|FAST_CACHE|TEMP_MEDIA)/.test(up))return true;
    value=String(value==null?'':value);
    if(value.indexOf('data:image/')===0||value.indexOf('data:video/')===0||value.indexOf('data:audio/')===0)return true;
    return false;
  }
  function localBytes(){
    var total=0;
    try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i),v=k?localStorage.getItem(k):'';total+=bytes(k)+bytes(v);}}catch(_e){}
    return total;
  }
  function canWriteProbe(size){
    var key='__HAPPYAD_AUTH_HEADROOM_V752__',value='x'.repeat(Math.max(1024,Number(size||65536)));
    try{localStorage.setItem(key,value);localStorage.removeItem(key);return true;}catch(err){try{localStorage.removeItem(key);}catch(_e){}return false;}
  }
  function startsWithAny(key,list){for(var i=0;i<list.length;i++)if(key===list[i]||key.indexOf(list[i])===0)return true;return false;}
  function isStructuralKey(key){return startsWithAny(clean(key),HOME_STRUCTURAL_KEYS);}
  function cacheShape(raw){
    try{
      var value=JSON.parse(raw||'null'),shape='array',arr=value;
      if(value&&Array.isArray(value.posts)){arr=value.posts;shape='posts';}
      else if(value&&Array.isArray(value.data)){arr=value.data;shape='data';}
      if(!Array.isArray(arr))return null;
      return {value:value,shape:shape,arr:arr};
    }catch(_e){return null;}
  }
  function compactStructuralKey(key,limit){
    var raw='';try{raw=localStorage.getItem(key)||'';}catch(_e){return 0;}
    var parsed=cacheShape(raw);if(!parsed||parsed.arr.length<=limit)return 0;
    var before=bytes(raw),next=parsed.arr.slice(0,limit);
    try{
      if(parsed.shape==='posts')parsed.value.posts=next;
      else if(parsed.shape==='data')parsed.value.data=next;
      else parsed.value=next;
      var out=JSON.stringify(parsed.value);localStorage.setItem(key,out);return Math.max(0,before-bytes(out));
    }catch(_e){return 0;}
  }
  function cleanupTemporary(reason){
    var now=Date.now();
    if(now-cleanedAt<500&&canWriteProbe(32768))return {removed:0,bytes:0,compacted:0,reason:reason||''};
    cleanedAt=now;
    var candidates=[];
    try{
      for(var i=0;i<localStorage.length;i++){
        var key=localStorage.key(i);if(!key)continue;
        var value='';try{value=localStorage.getItem(key)||'';}catch(_e){}
        if(!isTemporary(key,value))continue;
        var structural=isStructuralKey(key);
        var media=startsWithAny(key,MEDIA_FIRST_PREFIXES)||value.indexOf('data:image/')===0||value.indexOf('data:video/')===0||value.indexOf('data:audio/')===0;
        candidates.push({key:key,size:bytes(key)+bytes(value),tier:structural?2:(media?0:1)});
      }
    }catch(_e){}
    candidates.sort(function(a,b){return a.tier-b.tier||b.size-a.size||a.key.localeCompare(b.key);});
    var removed=0,freed=0,compacted=0;

    /* Phase 1 : médias, miniatures et caches non structurels uniquement. */
    for(var j=0;j<candidates.length;j++){
      if(candidates[j].tier>=2)continue;
      try{localStorage.removeItem(candidates[j].key);removed++;freed+=candidates[j].size;}catch(_e){}
      if(freed>=262144&&canWriteProbe(65536))break;
    }

    /* Phase 2 : réduire les doublons de listes sans faire disparaître le fil. */
    if(!canWriteProbe(65536)){
      HOME_STRUCTURAL_KEYS.forEach(function(k){compacted+=compactStructuralKey(k,36);});
    }

    /* Phase 3 : supprimer seulement les caches structurels secondaires. Les deux
       snapshots maîtres restent présents pour l'ouverture immédiate de l'Accueil. */
    if(!canWriteProbe(65536)){
      for(var k=0;k<candidates.length;k++){
        var item=candidates[k];if(item.tier!==2||HOME_PRESERVE_KEYS.indexOf(item.key)>=0)continue;
        try{localStorage.removeItem(item.key);removed++;freed+=item.size;}catch(_e){}
        if(canWriteProbe(65536))break;
      }
    }

    /* Dernier secours : compacter encore les deux maîtres, jamais les effacer. */
    if(!canWriteProbe(65536))HOME_PRESERVE_KEYS.forEach(function(k){compacted+=compactStructuralKey(k,18);});

    try{
      ['HAPPYAD_FAST_OPEN_PHOTO_V1','HAPPYAD_FAST_OPEN_VIDEO_V1'].forEach(function(k){sessionStorage.removeItem(k);});
    }catch(_e){}
    try{localStorage.setItem('HAPPYAD_AUTH_STORAGE_RECOVERED_V752',JSON.stringify({at:Date.now(),removed:removed,bytes:freed,compacted:compacted,reason:clean(reason),homeSafeV763:true}));}catch(_e){}
    return {removed:removed,bytes:freed,compacted:compacted,reason:reason||''};
  }
  function openDb(){
    if(dbPromise)return dbPromise;
    dbPromise=new Promise(function(resolve){
      if(!window.indexedDB){resolve(null);return;}
      var req;try{req=indexedDB.open(DB_NAME,1);}catch(_e){resolve(null);return;}
      req.onupgradeneeded=function(){try{var db=req.result;if(!db.objectStoreNames.contains(STORE_NAME))db.createObjectStore(STORE_NAME);}catch(_e){}};
      req.onsuccess=function(){resolve(req.result||null);};
      req.onerror=function(){resolve(null);};
      req.onblocked=function(){resolve(null);};
    });
    return dbPromise;
  }
  async function idbGet(key){
    var db=await openDb();if(!db)return Object.prototype.hasOwnProperty.call(memory,key)?memory[key]:null;
    return new Promise(function(resolve){
      try{var tx=db.transaction(STORE_NAME,'readonly'),req=tx.objectStore(STORE_NAME).get(key);req.onsuccess=function(){resolve(req.result==null?null:String(req.result));};req.onerror=function(){resolve(Object.prototype.hasOwnProperty.call(memory,key)?memory[key]:null);};}catch(_e){resolve(Object.prototype.hasOwnProperty.call(memory,key)?memory[key]:null);}
    });
  }
  async function idbSet(key,value){
    memory[key]=String(value);
    var db=await openDb();if(!db)return true;
    return new Promise(function(resolve){
      try{var tx=db.transaction(STORE_NAME,'readwrite'),req=tx.objectStore(STORE_NAME).put(String(value),key);req.onsuccess=function(){resolve(true);};req.onerror=function(){resolve(false);};tx.onabort=function(){resolve(false);};}catch(_e){resolve(false);}
    });
  }
  async function idbRemove(key){
    delete memory[key];
    var db=await openDb();if(!db)return true;
    return new Promise(function(resolve){
      try{var tx=db.transaction(STORE_NAME,'readwrite'),req=tx.objectStore(STORE_NAME).delete(key);req.onsuccess=function(){resolve(true);};req.onerror=function(){resolve(false);};tx.onabort=function(){resolve(false);};}catch(_e){resolve(false);}
    });
  }

  var storage={
    getItem:async function(key){
      key=String(key);
      try{var local=localStorage.getItem(key);if(local!=null){idbSet(key,local);return local;}}catch(_e){}
      return await idbGet(key);
    },
    setItem:async function(key,value){
      key=String(key);value=String(value);
      var localSaved=false;
      try{localStorage.setItem(key,value);localSaved=true;}catch(err){
        if(isQuota(err)){
          cleanupTemporary('auth-setitem');
          try{localStorage.setItem(key,value);localSaved=true;}catch(_retry){}
        }
      }
      await idbSet(key,value);
      /* La session est valide même si Web Storage reste saturé : IndexedDB devient le secours persistant. */
      return localSaved||true;
    },
    removeItem:async function(key){
      key=String(key);try{localStorage.removeItem(key);}catch(_e){}
      await idbRemove(key);
    }
  };

  function wrapSupabase(){
    try{
      if(!window.supabase||typeof window.supabase.createClient!=='function')return false;
      if(window.supabase.createClient.__happyadQuotaV752)return true;
      originalCreateClient=window.supabase.createClient.bind(window.supabase);
      var wrapped=function(url,key,options){
        options=options&&typeof options==='object'?Object.assign({},options):{};
        options.auth=options.auth&&typeof options.auth==='object'?Object.assign({},options.auth):{};
        if(options.auth.persistSession!==false&&!options.auth.storage)options.auth.storage=storage;
        return originalCreateClient(url,key,options);
      };
      wrapped.__happyadQuotaV752=true;
      wrapped.__happyadOriginal=originalCreateClient;
      window.supabase.createClient=wrapped;
      return true;
    }catch(_e){return false;}
  }

  async function migrateAuthTokens(){
    var keys=[];
    try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&isAuthKey(k))keys.push(k);}}catch(_e){}
    for(var j=0;j<keys.length;j++){try{var v=localStorage.getItem(keys[j]);if(v!=null)await idbSet(keys[j],v);}catch(_e){}}
  }
  async function purgeAuthTokensV937(){
    var keys=[];
    try{
      for(var i=0;i<localStorage.length;i++){
        var lk=localStorage.key(i);if(lk&&isAuthKey(lk))keys.push(lk);
      }
      keys.forEach(function(k){try{localStorage.removeItem(k);}catch(_e){}});
    }catch(_e){}
    try{Object.keys(memory).forEach(function(k){if(isAuthKey(k))delete memory[k];});}catch(_e){}
    var db=await openDb();if(!db)return true;
    return await new Promise(function(resolve){
      var done=false,finish=function(ok){if(done)return;done=true;resolve(!!ok);};
      try{
        var tx=db.transaction(STORE_NAME,'readwrite'),store=tx.objectStore(STORE_NAME),req=store.getAllKeys();
        req.onsuccess=function(){
          try{(req.result||[]).forEach(function(k){if(isAuthKey(String(k)))store.delete(k);});}catch(_e){}
        };
        req.onerror=function(){finish(false);};
        tx.oncomplete=function(){finish(true);};tx.onerror=function(){finish(false);};tx.onabort=function(){finish(false);};
        setTimeout(function(){finish(false);},1200);
      }catch(_e){finish(false);}
    });
  }
  async function recover(reason){
    var result=cleanupTemporary(reason||'manual');
    await migrateAuthTokens();
    return result;
  }

  window.HappyadAuthStorageV752={version:VERSION,storage:storage,recover:recover,purgeAuthTokens:purgeAuthTokensV937,cleanup:cleanupTemporary,localBytes:localBytes,canWriteProbe:canWriteProbe,isQuota:isQuota,wrap:wrapSupabase};
  wrapSupabase();
  var wrapAttempts=0,wrapTimer=setInterval(function(){
    wrapAttempts++;
    if(wrapSupabase()||wrapAttempts>80)clearInterval(wrapTimer);
  },125);
  setTimeout(function(){try{if(!canWriteProbe(65536))recover('startup-headroom');else migrateAuthTokens();}catch(_e){}},0);
})();
