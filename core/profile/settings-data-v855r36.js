(function(){
  'use strict';
  if(window.HappySettingsDataV855R36)return;

  var VERSION='HAPPYAD_SETTINGS_DATA_V855R36';
  var TABLE='happyad_user_settings';
  var CACHE_PREFIX='HAPPYAD_USER_SETTINGS_V1_';
  var PENDING_PREFIX='HAPPYAD_USER_SETTINGS_PENDING_V1_';
  var LEGACY_OWNER_KEY='HAPPYAD_SETTINGS_LEGACY_OWNER_V1';
  var LEGACY_DONE_PREFIX='HAPPYAD_SETTINGS_LEGACY_DONE_V1_';
  var LEGACY_KEYS={
    language:'happyad_language_preference_v1',
    privacy:'happyad_privacy_preferences_v1',
    notifications:'happyad_notification_preferences_v1'
  };
  var SECTION_TYPES={
    language:'string',
    privacy:'object',
    notifications:'object',
    region:'string'
  };
  var LANGUAGE_VALUES={
    auto:1,fr:1,en:1,sw:1,ln:1,es:1,ar:1,zh:1,hi:1,pt:1,bn:1
  };

  var listeners=[];
  var bootPromise=null;
  var bootSequence=0;
  var writeChains={};
  var activeClient=null;
  var verifiedUid='';
  var state=blankState('');

  function blankState(uid){
    return {
      uid:cleanUid(uid),
      language:'auto',
      privacy:{},
      notifications:{},
      region:'',
      revision:0,
      updatedAt:'',
      ready:false,
      connected:false,
      pending:false,
      source:'defaults',
      lastError:''
    };
  }

  function clean(value){
    return String(value==null?'':value).trim();
  }

  function cleanUid(value){
    var uid=clean(value).toLowerCase();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uid)?uid:'';
  }

  function clone(value){
    if(value==null)return value;
    try{return JSON.parse(JSON.stringify(value));}catch(_e){return value;}
  }

  function readJson(key,fallback){
    try{
      var value=JSON.parse(localStorage.getItem(key)||'null');
      return value==null?fallback:value;
    }catch(_e){
      return fallback;
    }
  }

  function writeJson(key,value){
    try{
      localStorage.setItem(key,JSON.stringify(value));
      return true;
    }catch(_e){
      return false;
    }
  }

  function safeObject(value){
    if(typeof value==='string'){
      try{value=JSON.parse(value);}catch(_e){value={};}
    }
    if(!value||typeof value!=='object'||Array.isArray(value))return {};
    var output={};
    Object.keys(value).slice(0,100).forEach(function(key){
      if(!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key))return;
      if(key==='constructor'||key==='prototype'||key==='__proto__')return;
      var item=value[key];
      if(typeof item==='boolean')output[key]=item;
      else if(typeof item==='string')output[key]=item.slice(0,160);
      else if(typeof item==='number'&&Number.isFinite(item))output[key]=item;
      else if(item===null)output[key]=null;
    });
    return output;
  }

  function sanitize(section,value){
    if(section==='language'){
      var language=clean(value).toLowerCase();
      return LANGUAGE_VALUES[language]?language:'auto';
    }
    if(section==='region')return clean(value).slice(0,100);
    if(section==='privacy'||section==='notifications')return safeObject(value);
    return null;
  }

  function publicState(){
    return {
      version:VERSION,
      uid:state.uid,
      language:state.language,
      privacy:clone(state.privacy),
      notifications:clone(state.notifications),
      region:state.region,
      revision:Number(state.revision||0),
      updatedAt:state.updatedAt||'',
      ready:!!state.ready,
      connected:!!state.connected,
      pending:!!state.pending,
      source:state.source||'',
      lastError:state.lastError||''
    };
  }

  function emit(section,source){
    var detail={
      section:section||'all',
      source:source||state.source||'',
      state:publicState()
    };
    listeners.slice().forEach(function(listener){
      try{listener(detail);}catch(_e){}
    });
    try{
      window.dispatchEvent(new CustomEvent('happyad:settings-data-change',{detail:detail}));
    }catch(_e2){}
  }

  function cacheKey(uid){
    return CACHE_PREFIX+cleanUid(uid);
  }

  function pendingKey(uid){
    return PENDING_PREFIX+cleanUid(uid);
  }

  function cachePayload(){
    return {
      version:1,
      uid:state.uid,
      data:{
        language:state.language,
        privacy:clone(state.privacy),
        notifications:clone(state.notifications),
        region:state.region
      },
      revision:Number(state.revision||0),
      updatedAt:state.updatedAt||'',
      savedAt:new Date().toISOString()
    };
  }

  function persistCache(){
    if(!state.uid)return false;
    return writeJson(cacheKey(state.uid),cachePayload());
  }

  function readCache(uid){
    uid=cleanUid(uid);
    if(!uid)return null;
    var cached=readJson(cacheKey(uid),null);
    return cached&&cached.uid===uid&&cached.data&&typeof cached.data==='object'?cached:null;
  }

  function applyData(data,source){
    data=data&&typeof data==='object'?data:{};
    if(Object.prototype.hasOwnProperty.call(data,'language'))state.language=sanitize('language',data.language);
    if(Object.prototype.hasOwnProperty.call(data,'privacy'))state.privacy=sanitize('privacy',data.privacy);
    if(Object.prototype.hasOwnProperty.call(data,'notifications'))state.notifications=sanitize('notifications',data.notifications);
    if(Object.prototype.hasOwnProperty.call(data,'region'))state.region=sanitize('region',data.region);
    if(data.revision!=null)state.revision=Math.max(0,Number(data.revision)||0);
    if(data.updated_at||data.updatedAt)state.updatedAt=clean(data.updated_at||data.updatedAt);
    if(source)state.source=source;
  }

  function readPending(uid){
    uid=cleanUid(uid);
    var pending=uid?readJson(pendingKey(uid),null):null;
    if(!pending||pending.uid!==uid||!pending.sections||typeof pending.sections!=='object'){
      return {version:1,uid:uid,sections:{}};
    }
    return pending;
  }

  function writePending(pending){
    if(!pending||!pending.uid)return false;
    var keys=Object.keys(pending.sections||{});
    state.pending=keys.length>0;
    if(!keys.length){
      try{localStorage.removeItem(pendingKey(pending.uid));}catch(_e){}
      return true;
    }
    pending.savedAt=new Date().toISOString();
    return writeJson(pendingKey(pending.uid),pending);
  }

  function markPending(section,value){
    if(!state.uid)return '';
    var pending=readPending(state.uid);
    var token=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
    pending.sections[section]={
      value:clone(value),
      token:token,
      savedAt:new Date().toISOString()
    };
    writePending(pending);
    return token;
  }

  function clearPending(section,token){
    if(!state.uid)return;
    var pending=readPending(state.uid);
    var entry=pending.sections[section];
    if(entry&&(!token||entry.token===token))delete pending.sections[section];
    writePending(pending);
  }

  function clearAllPending(uid){
    uid=cleanUid(uid);
    if(!uid)return;
    try{localStorage.removeItem(pendingKey(uid));}catch(_e){}
    if(state.uid===uid)state.pending=false;
  }

  function pendingValues(uid){
    var pending=readPending(uid),values={};
    Object.keys(pending.sections).forEach(function(section){
      if(!SECTION_TYPES[section])return;
      values[section]=sanitize(section,pending.sections[section].value);
    });
    return {raw:pending,values:values};
  }

  function hintUid(){
    try{
      var direct=cleanUid(localStorage.getItem('HAPPYAD_AUTH_UID'));
      if(direct)return direct;
    }catch(_e){}
    try{
      var user=readJson('HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL',{});
      return cleanUid(user&&(user.id||user.user_id||user.uid));
    }catch(_e2){
      return '';
    }
  }

  function legacySeed(uid){
    uid=cleanUid(uid);
    if(!uid)return {};
    try{
      if(localStorage.getItem(LEGACY_DONE_PREFIX+uid)==='1')return {};
      var owner=cleanUid(localStorage.getItem(LEGACY_OWNER_KEY));
      if(owner&&owner!==uid){
        localStorage.setItem(LEGACY_DONE_PREFIX+uid,'1');
        return {};
      }
      if(!owner)localStorage.setItem(LEGACY_OWNER_KEY,uid);
      var seed={};
      var language=clean(localStorage.getItem(LEGACY_KEYS.language));
      var privacy=readJson(LEGACY_KEYS.privacy,null);
      var notifications=readJson(LEGACY_KEYS.notifications,null);
      if(language)seed.language=sanitize('language',language);
      if(privacy&&typeof privacy==='object')seed.privacy=sanitize('privacy',privacy);
      if(notifications&&typeof notifications==='object')seed.notifications=sanitize('notifications',notifications);
      localStorage.setItem(LEGACY_DONE_PREFIX+uid,'1');
      return seed;
    }catch(_e){
      return {};
    }
  }

  function activate(uid,allowLegacy){
    uid=cleanUid(uid);
    state=blankState(uid);
    if(!uid)return;
    var cached=readCache(uid);
    if(cached){
      applyData(cached.data,'cache');
      state.revision=Math.max(0,Number(cached.revision)||0);
      state.updatedAt=clean(cached.updatedAt);
    }else if(allowLegacy){
      var legacy=legacySeed(uid);
      applyData(legacy,'legacy');
      Object.keys(legacy).forEach(function(section){
        if(SECTION_TYPES[section])markPending(section,state[section]);
      });
      persistCache();
    }
    state.pending=Object.keys(readPending(uid).sections).length>0;
  }

  function sameOriginWindow(candidate){
    if(!candidate)return null;
    try{
      if(candidate===window)return candidate;
      if(candidate.location&&candidate.location.origin===window.location.origin)return candidate;
    }catch(_e){}
    return null;
  }

  function resolveClient(){
    if(activeClient&&activeClient.from&&activeClient.auth)return activeClient;
    var candidates=[window];
    try{if(window.parent&&window.parent!==window)candidates.push(window.parent);}catch(_e){}
    try{if(window.top&&window.top!==window.parent&&window.top!==window)candidates.push(window.top);}catch(_e2){}
    for(var i=0;i<candidates.length;i++){
      var target=sameOriginWindow(candidates[i]);
      if(!target)continue;
      try{
        var direct=target.happyadSupabase||target.supabaseClient||target.HAPPYAD_SUPABASE;
        if(direct&&direct.from&&direct.auth){
          activeClient=direct;
          return activeClient;
        }
      }catch(_e3){}
      try{
        if(typeof target.happyadSb==='function'){
          var canonical=target.happyadSb();
          if(canonical&&canonical.from&&canonical.auth){activeClient=canonical;return activeClient;}
        }
        if(target.HappySupabaseClientMasterV972&&typeof target.HappySupabaseClientMasterV972.get==='function'){
          var viaMaster=target.HappySupabaseClientMasterV972.get();
          if(viaMaster&&viaMaster.from&&viaMaster.auth){activeClient=viaMaster;return activeClient;}
        }
      }catch(_e4){}
    }
    return null;
  }

  async function authenticatedUser(client){
    if(!client||!client.auth)return null;
    try{
      var sessionResult=await client.auth.getSession();
      var session=sessionResult&&sessionResult.data&&sessionResult.data.session;
      var user=session&&session.user;
      if(user&&cleanUid(user.id))return user;
    }catch(_e){}
    try{
      var userResult=await client.auth.getUser();
      var remoteUser=userResult&&userResult.data&&userResult.data.user;
      if(remoteUser&&cleanUid(remoteUser.id))return remoteUser;
    }catch(_e2){}
    return null;
  }

  function selectedColumns(){
    return 'language,privacy,notifications,region,revision,updated_at';
  }

  async function readRemote(client,uid){
    var result=await client.from(TABLE).select(selectedColumns()).eq('user_id',uid).maybeSingle();
    if(result&&result.error)throw result.error;
    return result&&result.data||null;
  }

  async function ensureRemote(client,uid){
    var payload={
      user_id:uid,
      language:state.language,
      privacy:clone(state.privacy),
      notifications:clone(state.notifications),
      region:state.region,
      schema_version:1
    };
    var result=await client.from(TABLE).upsert(payload,{onConflict:'user_id'}).select(selectedColumns()).maybeSingle();
    if(result&&result.error)throw result.error;
    return result&&result.data||payload;
  }

  function classifyError(error){
    var code=clean(error&&error.code).toUpperCase();
    var message=clean(error&&error.message||error).toLowerCase();
    if(code==='42P01'||code==='42703'||code==='PGRST204'||code==='PGRST205'||
       message.indexOf('happyad_user_settings')>=0&&(
         message.indexOf('does not exist')>=0||
         message.indexOf('schema cache')>=0||
         message.indexOf('could not find')>=0
       ))return 'SETUP_REQUIRED';
    if(code==='42501'||message.indexOf('row-level security')>=0||message.indexOf('permission denied')>=0){
      return 'RLS_DENIED';
    }
    if(message.indexOf('fetch')>=0||message.indexOf('network')>=0||message.indexOf('offline')>=0){
      return 'OFFLINE';
    }
    return code||'SYNC_FAILED';
  }

  async function writeRemote(section,value,token){
    var client=resolveClient();
    if(!client)throw new Error('SUPABASE_UNAVAILABLE');
    var user=await authenticatedUser(client);
    var uid=cleanUid(user&&user.id);
    if(!uid||uid!==state.uid)throw new Error('AUTH_CHANGED');
    var payload={user_id:uid};
    payload[section]=clone(value);
    var result=await client.from(TABLE).upsert(payload,{onConflict:'user_id'}).select(selectedColumns()).maybeSingle();
    if(result&&result.error)throw result.error;
    if(result&&result.data){
      state.revision=Math.max(0,Number(result.data.revision)||state.revision||0);
      state.updatedAt=clean(result.data.updated_at)||state.updatedAt;
    }
    clearPending(section,token);
    state.connected=true;
    state.lastError='';
    state.source='remote-save';
    persistCache();
    emit(section,'remote-save');
    return true;
  }

  function queueWrite(section,value,token){
    var chainKey=state.uid+':'+section;
    var previous=writeChains[chainKey]||Promise.resolve();
    var task=previous.catch(function(){}).then(function(){
      return writeRemote(section,value,token);
    });
    writeChains[chainKey]=task;
    task.finally(function(){
      if(writeChains[chainKey]===task)delete writeChains[chainKey];
    }).catch(function(){});
    return task;
  }

  async function flushPending(){
    if(!state.uid)return false;
    var pending=readPending(state.uid);
    var sections=Object.keys(pending.sections).filter(function(section){
      return !!SECTION_TYPES[section];
    });
    var allSaved=true;
    for(var i=0;i<sections.length;i++){
      var section=sections[i],entry=pending.sections[section];
      try{
        await queueWrite(section,sanitize(section,entry.value),entry.token);
      }catch(error){
        allSaved=false;
        state.connected=false;
        state.lastError=classifyError(error);
      }
    }
    state.pending=Object.keys(readPending(state.uid).sections).length>0;
    persistCache();
    return allSaved;
  }

  async function performBoot(sequence){
    var client=resolveClient();
    if(!client)throw new Error('SUPABASE_UNAVAILABLE');
    var user=await authenticatedUser(client);
    if(sequence!==bootSequence)return publicState();
    var uid=cleanUid(user&&user.id);
    if(!uid){
      verifiedUid='';
      activate('',false);
      state.ready=true;
      state.lastError='AUTH_REQUIRED';
      emit('all','auth-required');
      return publicState();
    }

    verifiedUid=uid;
    if(state.uid!==uid)activate(uid,true);
    else if(!readCache(uid))activate(uid,true);
    persistCache();
    emit('all',state.source||'cache');

    var remote=await readRemote(client,uid);
    if(sequence!==bootSequence)return publicState();
    var pending=pendingValues(uid);

    if(remote){
      applyData(remote,'remote');
      Object.keys(pending.values).forEach(function(section){
        state[section]=pending.values[section];
      });
    }else{
      remote=await ensureRemote(client,uid);
      if(sequence!==bootSequence)return publicState();
      applyData(remote,'remote-created');
      clearAllPending(uid);
      pending={raw:{version:1,uid:uid,sections:{}},values:{}};
    }

    state.ready=true;
    state.connected=true;
    state.lastError='';
    state.pending=Object.keys(pending.raw.sections).length>0;
    persistCache();
    emit('all',state.source);

    if(state.pending)await flushPending();
    state.ready=true;
    persistCache();
    emit('all',state.pending?'pending':'remote-ready');
    return publicState();
  }

  function boot(force){
    if(bootPromise&&!force)return bootPromise;
    bootSequence++;
    verifiedUid='';
    var sequence=bootSequence;
    var hinted=hintUid();
    if(!state.uid||state.uid!==hinted)activate(hinted,false);
    state.ready=false;
    state.connected=false;
    state.lastError='';
    emit('all',state.source||'cache');
    bootPromise=performBoot(sequence).catch(function(error){
      if(sequence!==bootSequence)return publicState();
      state.ready=true;
      state.connected=false;
      state.pending=state.uid?Object.keys(readPending(state.uid).sections).length>0:false;
      state.lastError=classifyError(error);
      persistCache();
      emit('all','local-fallback');
      return publicState();
    });
    return bootPromise;
  }

  async function saveSection(section,value){
    if(!SECTION_TYPES[section])return {ok:false,remote:false,error:'UNKNOWN_SECTION'};
    await boot(false);
    if(!state.uid||verifiedUid!==state.uid){
      return {ok:false,remote:false,error:'AUTH_REQUIRED'};
    }
    value=sanitize(section,value);
    state[section]=clone(value);
    state.source='local-save';
    var token=markPending(section,value);
    persistCache();
    emit(section,'local-save');
    try{
      await queueWrite(section,value,token);
      return {ok:true,remote:true,pending:state.pending,state:publicState()};
    }catch(error){
      state.connected=false;
      state.pending=true;
      state.lastError=classifyError(error);
      persistCache();
      emit(section,'pending');
      return {ok:true,remote:false,pending:true,error:state.lastError,state:publicState()};
    }
  }

  function getSection(section,fallback){
    if(!SECTION_TYPES[section])return clone(fallback);
    var value=state[section];
    if(value==null)return clone(fallback);
    if(SECTION_TYPES[section]==='object'&&(!value||typeof value!=='object'))return clone(fallback);
    return clone(value);
  }

  function onChange(listener){
    if(typeof listener!=='function')return function(){};
    listeners.push(listener);
    return function(){
      var index=listeners.indexOf(listener);
      if(index>=0)listeners.splice(index,1);
    };
  }

  async function sync(){
    await boot(false);
    return flushPending();
  }

  function refresh(){
    bootPromise=null;
    activeClient=null;
    return boot(true);
  }

  window.HappySettingsDataV855R36={
    version:VERSION,
    boot:boot,
    refresh:refresh,
    sync:sync,
    getSection:getSection,
    saveSection:saveSection,
    status:publicState,
    onChange:onChange
  };

  boot(false);
})();
