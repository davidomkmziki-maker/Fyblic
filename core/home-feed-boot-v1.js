/* Fyblic HOME FEED BOOT V1
   Propriétaire unique du démarrage Accueil : cache boot, première peinture,
   tête Supabase autoritaire, refresh partagé et événements de reprise. */
(function(){
  'use strict';
  if(window.HappyHomeFeedBootV1&&window.HappyHomeFeedBootV1.version==='V1_BOOT_CACHE_OWNER')return;

  var VERSION='V2_ATOMIC_BOOT_CACHE';
  var bridge=null;
  var state={
    bootPromise:null,
    bootReady:false,
    bootStartedAt:0,
    bootFinishedAt:0,
    remotePromise:null,
    refreshPromise:null,
    lastForcedRefresh:0,
    refreshTimer:0,
    refreshLastAt:0,
    refreshLastReason:'',
    lifecycleBound:false,
    deletePoll:0,
    pendingHead:null,
    pendingHeadBeforeKey:'',
    initialRetryTimer:0,
    initialRetryCount:0,
    initialEmptyCount:0
  };
  var KEYS={
    boot:'HAPPYAD_HOME_BOOT_SNAPSHOT_V1',
    confirmed:'HAPPYAD_HOME_CONFIRMED_ORDER_V643',
    session:'HAPPYAD_SESSION_ALL_POSTS_V104',
    global:'HAPPYAD_GLOBAL_POSTS_CACHE_V1',
    publish:'HAPPYAD_PUBLISH_POSTS_V2',
    refreshNeeded:'HAPPYAD_HOME_REFRESH_NEEDED',
    lastSync:'HAPPYAD_ALL_POSTS_LAST_SYNC',
    stories:'HAPPYAD_STORIES_CACHE_V1'
  };

  function accountStoryKeyV937(){
    try{var auth=window.HappyAuthSessionV598||window.HappyAuthSessionV595;if(auth&&typeof auth.isReady==='function'&&!auth.isReady())return 'HAPPYAD_STORIES_CACHE_V1:guest';}catch(_auth){}
    try{if(typeof window.happyadAccountKeyV937==='function')return window.happyadAccountKeyV937('HAPPYAD_STORIES_CACHE_V1');}catch(_e){}
    try{var id=localStorage.getItem('HAPPYAD_SESSION_ACTIVE')==='1'?String(localStorage.getItem('HAPPYAD_AUTH_UID')||'').trim():'';return 'HAPPYAD_STORIES_CACHE_V1:'+(id||'guest');}catch(_e2){return 'HAPPYAD_STORIES_CACHE_V1:guest';}
  }
  function bcall(name){
    if(!bridge||typeof bridge[name]!=='function')return undefined;
    var args=[].slice.call(arguments,1);
    return bridge[name].apply(bridge,args);
  }
  function maxPosts(){return Math.max(20,Number(bcall('maxPosts')||100));}
  function remotePage(){return Math.max(1,Number(bcall('remotePage')||20));}
  function posts(){var x=bcall('getPosts');return Array.isArray(x)?x:[];}
  function syncState(){try{bcall('onState',snapshot());}catch(_e){}return state;}
  function snapshot(){return {
    bootPromise:state.bootPromise,bootReady:state.bootReady,bootStartedAt:state.bootStartedAt,bootFinishedAt:state.bootFinishedAt,
    remotePromise:state.remotePromise,refreshPromise:state.refreshPromise,lastForcedRefresh:state.lastForcedRefresh,
    refreshLastAt:state.refreshLastAt,refreshLastReason:state.refreshLastReason,
    pendingHead:!!state.pendingHead
  };}
  function readJson(store,key,fallback){
    try{var raw=(store==='session'?sessionStorage:localStorage).getItem(key)||'';if(!raw)return fallback;var v=JSON.parse(raw);return v==null?fallback:v;}catch(_e){return fallback;}
  }
  function writeJson(store,key,value){try{(store==='session'?sessionStorage:localStorage).setItem(key,JSON.stringify(value));return true;}catch(_e){return false;}}
  function sanitize(rows,opts){var x=bcall('sanitizeCache',Array.isArray(rows)?rows:[],opts||{});return Array.isArray(x)?x:[];}
  function slim(row){var x=bcall('slimPost',row);return x&&typeof x==='object'?x:row;}
  function validTime(row){return Number(bcall('validTimestamp',row)||0)||0;}
  function freshLocal(row){return bcall('isFreshLocal',row)===true;}
  function waitIdle(){
    try{var p=bcall('whenIdle');if(p&&typeof p.then==='function')return p;}catch(_e){}
    return Promise.resolve(true);
  }
  function genericName(v){return /^(utilisateur happyad|utilisateur fyblic|happyad)$/i.test(String(v||'').trim());}
  function enrichConfirmedFromStable(rows){
    try{
      var stable=[].concat(readJson('local',KEYS.global,[])||[],readJson('local',KEYS.publish,[])||[]),by=Object.create(null);
      stable.forEach(function(x){var id=String(x&&x.id||'');if(id&&!by[id])by[id]=x;});
      return (rows||[]).map(function(row){
        var x=by[String(row&&row.id||'')];if(!x)return row;var q=Object.assign({},row);
        if((!q.creatorName||genericName(q.creatorName))&&x.creatorName&&!genericName(x.creatorName))q.creatorName=x.creatorName;
        if(!q.handle&&x.handle)q.handle=x.handle;if(!q.avatar&&x.avatar)q.avatar=x.avatar;if(!q.avatar_url&&x.avatar_url)q.avatar_url=x.avatar_url;if((!q.badge||q.badge==='aucun')&&x.badge)q.badge=x.badge;
        return q;
      });
    }catch(_e){return rows||[];}
  }

  function readFreshLocal(){
    var a=readJson('local',KEYS.publish,[]);if(!Array.isArray(a))a=[];
    return sanitize(a.filter(freshLocal));
  }
  function readConfirmed(){
    var a=readJson('local',KEYS.confirmed,[]);if(!Array.isArray(a))a=[];
    return sanitize(a,{confirmed:true});
  }
  function writeConfirmed(remoteRows){
    try{
      var remote=sanitize((remoteRows||[]).map(function(p){return Object.assign({},p,{__homeServerConfirmedV643:true});}),{confirmed:true});
      if(!remote.length)return readConfirmed();
      var previous=readConfirmed(),oldest=0,ids={};
      remote.forEach(function(p){var t=validTime(p);if(t&&(!oldest||t<oldest))oldest=t;ids[String(p&&p.id||'')]=1;});
      var older=previous.filter(function(p){return !ids[String(p&&p.id||'')]&&validTime(p)<oldest;});
      var merged=sanitize(remote.concat(older),{confirmed:true}).slice(0,maxPosts()).map(slim).map(function(p){p=Object.assign({},p);p.__homeServerConfirmedV643=true;return p;});
      writeJson('local',KEYS.confirmed,merged);writeJson('local',KEYS.boot,merged);
      return merged;
    }catch(_e){return [];}
  }
  function readBootCache(){
    var confirmed=enrichConfirmedFromStable(readConfirmed()),local=readFreshLocal();
    if(confirmed.length)return sanitize(local.concat(confirmed)).slice(0,maxPosts()).map(slim);
    var fallback=[].concat(
      readJson('session',KEYS.session,[])||[],
      readJson('local',KEYS.boot,[])||[],
      readJson('local',KEYS.global,[])||[]
    );
    return sanitize(local.concat(fallback)).slice(0,maxPosts()).map(slim);
  }
  function writeBootSnapshot(rows){
    var out=[];try{out=sanitize(rows||[]).slice(0,maxPosts()).map(slim);if(out.length)writeJson('local',KEYS.boot,out);}catch(_e){}
    return out;
  }
  function saveFastCache(rows){
    var full=bcall('mergeFast',rows||[]);if(!Array.isArray(full))full=Array.isArray(rows)?rows:[];
    var cached=full.slice(0,maxPosts());
    writeJson('session',KEYS.session,cached);writeJson('local',KEYS.global,cached);writeBootSnapshot(cached);
    return full;
  }

  function migrateLegacyCache(){
    try{
      var marker='HAPPYAD_HOME_BOOT_MIGRATION_V2_ATOMIC';
      if(localStorage.getItem(marker)==='1')return false;
      try{localStorage.removeItem(KEYS.confirmed);}catch(_e){}
      try{localStorage.removeItem(KEYS.boot);}catch(_e){}
      try{sessionStorage.removeItem(KEYS.session);}catch(_e){}
      try{localStorage.removeItem('HAPPYAD_HOME_CONFIRMED_ORDER_V642');}catch(_e){}
      localStorage.setItem(marker,'1');
      return true;
    }catch(_e){return false;}
  }

  function shareRemote(factory,userOnly){
    if(userOnly===true)return Promise.resolve().then(factory);
    if(state.remotePromise)return state.remotePromise;
    var task=Promise.resolve().then(factory);state.remotePromise=task;syncState();
    var finish=function(){if(state.remotePromise===task){state.remotePromise=null;syncState();}};
    task.then(finish,finish);return task;
  }

  function clearInitialRetry(resetCount){
    clearTimeout(state.initialRetryTimer);state.initialRetryTimer=0;
    if(resetCount!==false){state.initialRetryCount=0;state.initialEmptyCount=0;}
    syncState();
  }
  function scheduleInitialRetry(delay){
    if(posts().length){clearInitialRetry();return false;}
    if(state.initialRetryTimer||state.initialRetryCount>=3)return false;
    var delays=[700,1500,3200];
    delay=Math.max(180,Number(delay)||delays[Math.min(state.initialRetryCount,delays.length-1)]);
    state.initialRetryCount++;
    bcall('setLoading',true);bcall('renderSkeleton');syncState();
    state.initialRetryTimer=setTimeout(async function(){
      state.initialRetryTimer=0;syncState();
      if(posts().length){clearInitialRetry();return;}
      var before=String(bcall('postsKey',posts())||''),remote=null;
      try{remote=await Promise.resolve(bcall('fetchRemote',false,true));}catch(_e){remote=null;}
      if(Array.isArray(remote)){
        if(!remote.length)state.initialEmptyCount++;
        /* Une seule réponse vide juste après le démarrage peut encore provenir
           d'une session/règle RLS en restauration. Deux réponses vides réussies
           sont requises avant d'afficher le véritable état vide. */
        if(remote.length||state.initialEmptyCount>=2){
          await applyRemoteHead(remote,before,true);clearInitialRetry();return;
        }
      }
      if(state.initialRetryCount<3)scheduleInitialRetry();
      else{bcall('setLoading',true);bcall('renderSkeleton');syncState();}
    },delay);
    return true;
  }

  async function applyRemoteHead(remote,beforeKey,forceNow){
    if(!Array.isArray(remote)||(!remote.length&&posts().length))return false;
    var hasCards=!!bcall('hasCards');
    if(!forceNow&&hasCards&&Number(bcall('scrollY')||0)>180){
      state.pendingHead=remote.slice();state.pendingHeadBeforeKey=String(beforeKey||'');
      bcall('markPendingNew',true);syncState();return false;
    }
    if(hasCards)await waitIdle();
    var nextKey=String(bcall('postsKey',remote)||'');
    bcall('setLoading',false);
    bcall('replaceHead',remote,false);saveFastCache(posts());
    clearInitialRetry();
    state.pendingHead=null;state.pendingHeadBeforeKey='';bcall('markPendingNew',false);syncState();
    if(nextKey!==beforeKey||!hasCards)bcall('render');else bcall('renderRadar');
    return true;
  }
  async function applyPendingHeadIfAtTop(){
    if(!state.pendingHead||Number(bcall('scrollY')||0)>100)return false;
    var remote=state.pendingHead.slice(),before=state.pendingHeadBeforeKey||String(bcall('postsKey',posts())||'');
    return applyRemoteHead(remote,before,true);
  }

  async function runBoot(){
    clearInitialRetry();
    bcall('setLoading',true);
    try{bcall('seedCache',readBootCache(),remotePage());if(posts().length){saveFastCache(posts());bcall('exposePosts');}}catch(_e){bcall('setPosts',[]);bcall('exposePosts');}
    try{var stories=readJson('local',accountStoryKeyV937(),[]);bcall('setStories',Array.isArray(stories)?stories:[]);}catch(_e){bcall('setStories',[]);}
    bcall('resetForBoot');

    var beforeKey=String(bcall('postsKey',posts())||'');
    if(posts().length){
      bcall('setLoading',false);bcall('render');
      try{Promise.resolve(bcall('primeActions',posts().slice(0,remotePage()))).catch(function(e){console.warn('home action preload background',e);});}catch(_e){}
    }else bcall('renderSkeleton');
    try{Promise.resolve(bcall('fetchRadar')).then(function(){bcall('renderRadar');}).catch(function(){});}catch(_e){}

    var needForce=false;try{needForce=localStorage.getItem(KEYS.refreshNeeded)==='1';}catch(_e){}
    if(needForce){try{sessionStorage.removeItem(KEYS.lastSync);sessionStorage.removeItem(KEYS.session);localStorage.removeItem(KEYS.refreshNeeded);}catch(_e){}}

    var remotePromise=Promise.resolve(bcall('fetchRemote',false,needForce));
    var applied=false,applyTask=null,initialEmptyDeferred=false;
    async function applyOnce(remote){
      if(applied)return false;
      if(Array.isArray(remote)&&!remote.length&&!posts().length){
        if(!initialEmptyDeferred){initialEmptyDeferred=true;state.initialEmptyCount=Math.max(1,state.initialEmptyCount);scheduleInitialRetry(700);}
        return false;
      }
      if(applyTask)return applyTask;
      applyTask=(async function(){var did=await applyRemoteHead(remote,beforeKey,false);if(did)applied=true;return did;})();
      try{return await applyTask;}finally{applyTask=null;}
    }
    remotePromise.then(async function(late){
      try{
        if(await applyOnce(late)){bcall('refreshActions');return;}
        if(!posts().length&&!Array.isArray(late))scheduleInitialRetry(700);
      }catch(_e){if(!posts().length)scheduleInitialRetry(700);}
    }).catch(function(e){if(!posts().length)scheduleInitialRetry(700);console.warn('home remote late sync',e);});
    var pendingToken={},remote=await Promise.race([remotePromise,new Promise(function(resolve){setTimeout(function(){resolve(pendingToken);},900);})]);
    if(remote!==pendingToken&&await applyOnce(remote))return posts();
    if(!posts().length){
      /* Après 900 ms, la requête est seulement lente : l'Accueil conserve ses
         douze squelettes. Il ne transforme plus ce délai en "Aucune publication". */
      bcall('setLoading',true);bcall('renderSkeleton');
      if(remote!==pendingToken&&!Array.isArray(remote))scheduleInitialRetry(700);
    }else{bcall('setLoading',false);bcall('renderRadar');bcall('refreshActions');}
    return posts();
  }

  function load(){
    if(state.bootPromise)return state.bootPromise;
    state.bootStartedAt=Date.now();state.bootReady=false;bcall('setBootActive',true);syncState();
    var task=Promise.resolve().then(runBoot);state.bootPromise=task;syncState();
    var finish=function(){state.bootReady=true;state.bootFinishedAt=Date.now();bcall('setBootActive',false);if(state.bootPromise===task)state.bootPromise=null;syncState();};
    task.then(finish,finish);return task;
  }

  async function refreshRaw(reason){
    var now=Date.now(),hasCards=!!bcall('hasCards'),soft=/pageshow|visible|focus/.test(String(reason||''));
    if(soft&&hasCards&&now-state.lastForcedRefresh<300000){bcall('renderRadar');bcall('bindQuick');bcall('refreshActions');return posts();}
    state.lastForcedRefresh=now;syncState();
    if(!soft&&/post-deleted|storage|manual|publish/.test(String(reason||''))){try{sessionStorage.removeItem(KEYS.lastSync);localStorage.removeItem(KEYS.refreshNeeded);}catch(_e){}}
    try{
      var remote=await Promise.resolve(bcall('fetchRemote',false,!soft));
      if(Array.isArray(remote)){
        if(!remote.length){bcall('cleanPosts');bcall('setLoading',false);bcall('renderRadar');bcall('refreshActions');return posts();}
        var beforeIds=new Set(posts().map(function(x){return String(x&&x.id||'');})),oldKey=String(bcall('postsKey',posts())||'');
        var remoteHasNew=remote.some(function(x){return x&&x.id&&!beforeIds.has(String(x.id));});
        if(remoteHasNew&&hasCards&&Number(bcall('scrollY')||0)>180){state.pendingHead=remote.slice();state.pendingHeadBeforeKey=oldKey;bcall('markPendingNew',true);syncState();return posts();}
        if(hasCards)await waitIdle();
        bcall('replaceHead',remote,true);saveFastCache(posts());bcall('setLoading',false);
        var newKey=String(bcall('postsKey',posts())||'');
        if(oldKey!==newKey||!hasCards){bcall('invalidateRender');bcall('render');}
        else{bcall('renderRadar');bcall('refreshActions');}
        return posts();
      }
      if(!posts().length)scheduleInitialRetry(700);
    }catch(e){console.warn('home forced posts refresh',reason,e);}
    bcall('renderRadar');return posts();
  }

  function refresh(reason){
    var soft=/pageshow|visible|focus/.test(String(reason||''));
    if(soft&&state.bootPromise)return state.bootPromise;
    if(soft&&bcall('allowSoftRefresh',reason)===false)return Promise.resolve(posts());
    if(soft&&state.bootReady&&Date.now()-state.bootFinishedAt<9000)return Promise.resolve(posts());
    if(state.refreshPromise)return state.refreshPromise;
    var run=function(){return refreshRaw(reason);};
    var task=(state.bootPromise&&!soft)?state.bootPromise.then(run,run):Promise.resolve().then(run);
    state.refreshPromise=task;syncState();
    var finish=function(){if(state.refreshPromise===task){state.refreshPromise=null;syncState();}};
    task.then(finish,finish);return task;
  }

  function scheduleRefresh(reason,delay){
    try{
      var now=Date.now(),soft=/pageshow|visible|focus/.test(String(reason||'')),hasCards=!!bcall('hasCards');
      if(soft&&state.bootPromise)return false;
      if(soft&&bcall('startupActive')===true)return false;
      if(soft&&state.bootReady&&now-state.bootFinishedAt<9000)return false;
      if(soft&&hasCards&&now-state.refreshLastAt<1200)return false;
      clearTimeout(state.refreshTimer);state.refreshLastReason=reason;syncState();
      var run=function(){state.refreshTimer=0;state.refreshLastAt=Date.now();syncState();return refresh(state.refreshLastReason);};
      var coordinator=window.HappyadConnectionWorkCoordinatorV869;
      if(coordinator&&typeof coordinator.schedule==='function')coordinator.schedule('home-feed-background-v869',run,{surface:'home',delay:Math.max(0,Number(delay)||300),maxDelay:3200,minGap:soft?5000:1200});
      else state.refreshTimer=setTimeout(run,Math.max(0,Number(delay)||300));
      return true;
    }catch(_e){return false;}
  }

  function bindLifecycle(){
    if(state.lifecycleBound)return api;state.lifecycleBound=true;
    window.addEventListener('pageshow',function(){scheduleRefresh('pageshow',300);});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)scheduleRefresh('visible',300);});
    window.addEventListener('focus',function(){scheduleRefresh('focus',500);});
    try{window.addEventListener('storage',function(e){if(e&&/HAPPYAD_HOME_REFRESH_NEEDED|HAPPYAD_DELETED_POST_IDS_V1/.test(e.key||''))scheduleRefresh('storage',80);});}catch(_e){}
    /* V1087 — quand le worker annonce une optimisation après la qualité visible,
       rafraîchir doucement le feed afin que le 1080p prêt remplace le 720p.
       Aucun changement du pipeline de publication : seulement une lecture fraîche. */
    try{window.addEventListener('FYBLIC_PUBLICATION_PROGRESS_V2',function(e){
      var d=e&&e.detail||{},status=String(d.status||'').toLowerCase(),progress=Number(d.progress||0);
      if(d.primaryReady===true&&(status==='optimizing'||status==='published'||progress>=88))scheduleRefresh('quality-upgrade-v1087',650);
    });}catch(_qualityEvent){}
    try{window.addEventListener('happyad:marketplace-quality-upgraded',function(){scheduleRefresh('marketplace-quality-v1087',180);});}catch(_marketQuality){}
    /* V1088 — chaque appareil réévalue sa propre qualité lorsque sa connexion change.
       Il s'agit d'un refresh interne du feed, jamais d'un rechargement de la page. */
    try{
      var adaptiveConnectionV1088=navigator.connection||navigator.mozConnection||navigator.webkitConnection;
      if(adaptiveConnectionV1088&&typeof adaptiveConnectionV1088.addEventListener==='function'){
        adaptiveConnectionV1088.addEventListener('change',function(){scheduleRefresh('adaptive-network-v1088',120);});
      }
      window.addEventListener('online',function(){scheduleRefresh('adaptive-online-v1088',80);});
    }catch(_adaptiveNetworkV1088){}
    try{window.addEventListener('happyad:post-deleted',function(e){
      var id=e&&e.detail&&e.detail.id;Promise.resolve(waitIdle()).then(function(){if(id){bcall('removePost',id);saveFastCache(posts());bcall('render');}setTimeout(function(){refresh('post-deleted');},80);});
    });}catch(_e){}
    try{state.deletePoll=setInterval(function(){try{if(!document.hidden)scheduleRefresh('delete-fast-poll',500);}catch(_e){}},180000);}catch(_e){}
    return api;
  }

  function connect(adapter){bridge=adapter||null;syncState();return api;}
  function currentBootPromise(){return state.bootPromise;}
  function isBootActive(){return !!state.bootPromise;}
  function hasPendingHead(){return !!state.pendingHead;}

  var api={version:VERSION,connect:connect,migrateLegacyCache:migrateLegacyCache,readBootCache:readBootCache,readConfirmed:readConfirmed,writeConfirmed:writeConfirmed,writeBootSnapshot:writeBootSnapshot,saveFastCache:saveFastCache,shareRemote:shareRemote,runBoot:runBoot,load:load,refreshRaw:refreshRaw,refresh:refresh,scheduleRefresh:scheduleRefresh,bindLifecycle:bindLifecycle,applyPendingHeadIfAtTop:applyPendingHeadIfAtTop,hasPendingHead:hasPendingHead,currentBootPromise:currentBootPromise,isBootActive:isBootActive,state:snapshot};
  window.HappyHomeFeedBootV1=api;
})();
