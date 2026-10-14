/* Fyblic V1083 Story TUS Anchor — correctif ciblé sur Story, base moteur V1082 inchangée pour Normal/Boutique.
   - Un seul protocole TUS direct pour tous les médias.
   - Les fichiers restent détenus par la fenêtre principale quand le module Publication se ferme.
   - Les publications multi-médias sont orchestrées comme un groupe unique avec progression agrégée.
*/
(function(){
  'use strict';
  if(window.FyblicPublicationEngineV1082)return;

  var BASE=String(window.FYBLIC_MEDIA_COMPRESSOR_URL||'https://fyblic-media-worker-production.up.railway.app').replace(/\/+$/,'');
  var JOBS_KEY='FYBLIC_PUBLICATION_JOBS_V1080';
  var GROUPS_KEY='FYBLIC_PUBLICATION_GROUPS_V1080';
  var ACTIVE_KEY='FYBLIC_ACTIVE_PUBLICATION_V1067R1';
  var REQUIRED_SCHEMA_VERSION=1082;
  var REQUIRED_PROTOCOL_VERSION=1082;
  var DIRECT_TUS_CHUNK=6*1024*1024;
  var STORY_FIRST_TUS_CHUNK=1*1024*1024;
  // UI failures must never stop the transfer owned by the parent window.
  function notifyUI(fn,args){if(typeof fn==='function'){try{fn.apply(null,args||[]);}catch(error){try{console.warn('Fyblic publication UI:',error);}catch(_e){}}}}
  function bounded(promise,ms,label){var timer;return Promise.race([promise,new Promise(function(_,reject){timer=setTimeout(function(){reject(new Error(label));},ms);})]).finally(function(){clearTimeout(timer);});}
  var healthCache={at:0,value:false,detail:null};
  var watchers={};
  var terminalJobs={};
  var groupCancels={};
  var runningXhrs={};
  var RECOVERY_KEY='FYBLIC_PUBLICATION_RECOVERY_V1165';
  var RECOVERY_DB='fyblic-publication-resume-v1165';
  var RESTART_MAX_BYTES=32*1024*1024; // IndexedDB is best effort, not a guarantee for large videos.
  function recoveryPlan(){try{var p=JSON.parse(localStorage.getItem(RECOVERY_KEY)||'null');if(!p||!p.id)return null;if(Date.now()-Number(p.at||0)>48*3600000){localStorage.removeItem(RECOVERY_KEY);resumeFileDelete(p.id);return null;}return p;}catch(_e){return null;}}
  function openResumeDb(){return new Promise(function(resolve,reject){if(!window.indexedDB)return reject(new Error('Stockage hors ligne indisponible'));var r=indexedDB.open(RECOVERY_DB,1);r.onupgradeneeded=function(){if(!r.result.objectStoreNames.contains('files'))r.result.createObjectStore('files');};r.onsuccess=function(){resolve(r.result);};r.onerror=function(){reject(r.error||new Error('IndexedDB inaccessible'));};});}
  async function resumeFileStore(groupId,files){
    var db=await openResumeDb();try{await new Promise(function(resolve,reject){var tx=db.transaction('files','readwrite');tx.objectStore('files').put(files,groupId);tx.oncomplete=resolve;tx.onerror=function(){reject(tx.error||new Error('Cache indisponible'));};tx.onabort=function(){reject(tx.error||new Error('Cache annulé'));};});}finally{db.close();}
  }
  async function resumeFileRead(groupId){
    var db=await openResumeDb();try{return await new Promise(function(resolve,reject){var tx=db.transaction('files','readonly'),r=tx.objectStore('files').get(groupId);r.onsuccess=function(){resolve(r.result||null);};r.onerror=function(){reject(r.error);};});}finally{db.close();}
  }
  async function resumeFileDelete(groupId){try{var db=await openResumeDb();await new Promise(function(resolve,reject){var tx=db.transaction('files','readwrite');tx.objectStore('files').delete(groupId);tx.oncomplete=resolve;tx.onerror=function(){reject(tx.error);};});db.close();}catch(_e){}}
  function discardRecovery(groupId){var p=recoveryPlan();if(p&&String(p.id)===String(groupId)){try{localStorage.removeItem(RECOVERY_KEY);}catch(_e){}resumeFileDelete(groupId);}}
  function filesMatchPlan(files,plan){return !!(plan&&Array.isArray(plan.assets)&&files&&files.length===plan.assets.length&&Array.prototype.every.call(files,function(file,i){var saved=plan.assets[i];return saved&&file.name===saved.name&&file.size===saved.size&&inferredMime(file)===saved.mime; }));}
  function pendingForFiles(files){var p=recoveryPlan();return filesMatchPlan(files,p)?p:null;}
  async function storeRecovery(group,files,options,userId){
    var plan={id:group.id,postId:group.postId,publicationType:group.publicationType,owner:userId,at:Date.now(),assets:files.map(function(file,index){return {name:file.name,size:file.size,mime:inferredMime(file),lastModified:Number(file.lastModified||0),fingerprint:fingerprint(file),postId:typeof options.postIdForAsset==='function'?options.postIdForAsset(index,file):(files.length===1?group.postId:group.postId+'_'+(index+1)),payload:typeof options.payloadForAsset==='function'?options.payloadForAsset(index,file):(options.payload||{})};})};
    try{localStorage.setItem(RECOVERY_KEY,JSON.stringify(plan));}catch(_e){}
    if(files.reduce(function(n,f){return n+f.size;},0)>RESTART_MAX_BYTES)return;
    try{await resumeFileStore(group.id,files);}catch(error){try{console.warn('Fyblic : copie locale facultative indisponible',error.message);}catch(_e){}}
  }
  function isCanceled(groupId){return !!(groupCancels[groupId]&&groupCancels[groupId].canceled);}
  function assertNotCanceled(groupId){if(isCanceled(groupId)){var err=new Error('Publication annulée');err.canceled=true;throw err;}}
  function cancelError(error){return !!(error&&error.canceled);}


  function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  function clean(v){return String(v==null?'':v).trim();}
  function inferredMime(file){
    var raw=clean(file&&file.type).toLowerCase();if(raw&&raw!=='application/octet-stream')return raw;
    var name=clean(file&&file.name).toLowerCase(),m=name.match(/\.([a-z0-9]{2,8})$/),ext=m&&m[1]||'';
    return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',heic:'image/heic',heif:'image/heif',avif:'image/avif',bmp:'image/bmp',tif:'image/tiff',tiff:'image/tiff',mp4:'video/mp4',mov:'video/quicktime',m4v:'video/x-m4v','3gp':'video/3gpp','3g2':'video/3gpp2',webm:'video/webm',mkv:'video/x-matroska',avi:'video/x-msvideo',mpeg:'video/mpeg',mpg:'video/mpeg',mts:'video/mp2t',m2ts:'video/mp2t',ts:'video/mp2t'})[ext]||'application/octet-stream';
  }
  function inferredKind(file){var mime=inferredMime(file),name=clean(file&&file.name).toLowerCase();if(mime.indexOf('video/')===0||/\.(mp4|mov|m4v|3gp|3g2|webm|mkv|avi|mpeg|mpg|mts|m2ts|ts)$/.test(name))return 'video';if(mime.indexOf('image/')===0||/\.(jpe?g|png|webp|gif|heic|heif|avif|bmp|tiff?)$/.test(name))return 'photo';return '';}
  function uid(){try{return crypto.randomUUID();}catch(_e){return 'g_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);}}
  function publicError(value){
    var m=clean(value);
    if(!m)return 'Publication impossible. Réessaie.';
    if(/requested file could not be read|permission problems|reference to a file|notreadableerror|file.*could not be read/i.test(m))return 'Le téléphone a interrompu l’accès au média. Sélectionne-le puis réessaie.';
    if(/supabase|23502|failing row|violates|constraint|postgres|pgrst|sql/i.test(m))return 'La publication n’a pas pu être enregistrée. Réessaie après la mise à jour.';
    return m.slice(0,160);
  }
  function client(){try{return window.HappySupabaseClientMasterV972?window.HappySupabaseClientMasterV972.get():(window.happyadSupabase||null);}catch(_e){return null;}}
  async function auth(){var c=client();if(!c)throw new Error('Session Fyblic indisponible');var r=await bounded(c.auth.getSession(),15000,'La session ne répond pas. Reconnecte-toi puis réessaie.'),s=r&&r.data&&r.data.session;if(!s||!s.access_token||!s.user)throw new Error('Session Fyblic expirée');return {token:s.access_token,user:s.user};}
  function headers(token,extra){var h=Object.assign({},extra||{});if(token)h.Authorization='Bearer '+token;return h;}
  async function request(route,options,token,timeoutMs){
    options=Object.assign({},options||{});options.headers=headers(token,options.headers);
    var controller=typeof AbortController!=='undefined'?new AbortController():null,timer=null;
    if(controller){options.signal=controller.signal;timer=setTimeout(function(){controller.abort();},timeoutMs||45000);}
    try{
      var response=await fetch(BASE+route,options);
      if(!response.ok){var body=await response.json().catch(function(){return {};});var e=new Error(body.error||('Service média indisponible ('+response.status+')'));e.status=response.status;throw e;}
      if(response.status===204)return {body:null,response:response};
      return {body:await response.json(),response:response};
    }catch(error){if(error&&error.name==='AbortError')throw new Error('Délai réseau dépassé');throw error;}finally{if(timer)clearTimeout(timer);}
  }
  function readList(key){try{var v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?v:[];}catch(_e){return [];}}
  function writeList(key,list,limit){try{localStorage.setItem(key,JSON.stringify((list||[]).slice(0,limit||30)));}catch(_e){}}
  function publicStage(job){var status=clean(job&&job.status);if(status==='uploading')return 'Envoi du média';if(status==='failed')return 'Échec';if(status==='canceled')return 'Publication annulée';if(status==='published')return 'Publication terminée';if(job&&job.primary_ready===true)return 'Publication visible · optimisation';return 'Publication en cours';}
  function terminalStatus(status){status=clean(status);return status==='failed'||status==='canceled'||status==='published';}
  function guardJob(job){if(!job||!job.id)return job;var id=String(job.id),known=terminalJobs[id];if(known&&!terminalStatus(job.status))return null;if(terminalStatus(job.status))terminalJobs[id]=job.status;return job;}
  function mergeJobState(previous,next){previous=previous||{};next=guardJob(next);if(!next)return previous;var out=Object.assign({},previous,next);if(next.status==='uploading'&&!Number.isFinite(Number(next.progress)))out.progress=Number(previous.progress||0);return out;}
  function visibleJob(job){if(!job||typeof job!=='object')return job;var copy=Object.assign({},job);copy.stage=publicStage(copy);return copy;}
  function active(){try{var value=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');return value&&value.id?value:null;}catch(_e){return null;}}
  function activateGroup(group){try{localStorage.setItem(ACTIVE_KEY,JSON.stringify({id:group.id,postId:group.postId||'',mode:group.publicationType||'normal',children:(group.children||[]).slice(),at:Date.now()}));}catch(_e){}}
  function updateActiveChildren(group){var a=active();if(!a||String(a.id)!==String(group.id))return;try{a.children=(group.children||[]).slice();localStorage.setItem(ACTIVE_KEY,JSON.stringify(a));}catch(_e){}}
  function clearActive(id){var a=active();if(a&&String(a.id)===String(id||'')){try{localStorage.removeItem(ACTIVE_KEY);}catch(_e){}}}
  function rememberJob(job,groupId){job=guardJob(job);if(!job||!job.id)return;var list=readList(JOBS_KEY).filter(function(x){return x&&x.id!==job.id;});list.unshift({id:job.id,groupId:groupId||job.publication_group_id||'',postId:job.post_id||'',publicationType:job.publication_type||'',status:job.status||'uploading',primaryReady:job.primary_ready===true,progress:Number(job.progress||0),stage:job.stage||'',createdAt:job.created_at||new Date().toISOString(),updatedAt:Date.now()});writeList(JOBS_KEY,list,60);}
  function rememberGroup(group){if(!group||!group.id)return;var list=readList(GROUPS_KEY).filter(function(x){return x&&x.id!==group.id;});list.unshift({id:group.id,postId:group.postId||'',publicationType:group.publicationType||'',children:(group.children||[]).slice(),assetCount:Number(group.assetCount||0),createdAt:group.createdAt||new Date().toISOString(),updatedAt:Date.now()});writeList(GROUPS_KEY,list,20);}
  function forgetGroup(id){writeList(GROUPS_KEY,readList(GROUPS_KEY).filter(function(x){return x&&String(x.id)!==String(id||'');}),20);}
  function forgetJob(id){writeList(JOBS_KEY,readList(JOBS_KEY).filter(function(x){return x&&String(x.id)!==String(id||'');}),60);}
  function dispatch(detail){
    detail=detail||{};
    try{window.dispatchEvent(new CustomEvent('FYBLIC_PUBLICATION_PROGRESS_V2',{detail:detail}));}catch(_e){}
    try{if(window.parent&&window.parent!==window)window.parent.postMessage({type:'FYBLIC_PUBLICATION_PROGRESS_V2',detail:detail},'*');}catch(_e2){}
  }
  function rawEvent(job,groupId,emit){
    job=guardJob(job);if(!job)return;rememberJob(job,groupId);
    if(emit===false)return;
    dispatch({jobId:job.id,groupId:groupId||job.publication_group_id||'',postId:job.post_id||'',publicationType:job.publication_type||'',status:job.status||'',primaryReady:job.primary_ready===true,progress:Number(job.progress||0),stage:publicStage(job),error:publicError(job.error_message||''),result:job.result||null});
  }
  async function available(force){
    if(!force&&Date.now()-healthCache.at<30000)return healthCache.value;
    try{
      var r=await request('/health',{},'',10000),p=r.body&&r.body.pipelineV2||{};
      var caps=p.capabilities||{};
      var ok=!!(r.body&&r.body.ok&&p.enabled&&p.ready&&p.schemaReady&&Number(p.schemaVersion||0)>=REQUIRED_SCHEMA_VERSION&&Number(p.protocolVersion||0)>=REQUIRED_PROTOCOL_VERSION&&p.uploadMode==='direct-tus-binary'&&caps.normal===true&&caps.story===true&&caps.boutique===true&&caps.album===true&&caps.groupAssets===true&&caps.groupFinalize===true&&caps.postMediaSafe===true&&caps.yieldingOptimization===true&&caps.posterBeforePrimary===true);
      healthCache={at:Date.now(),value:ok,detail:p};return ok;
    }catch(error){healthCache={at:Date.now(),value:false,detail:{schemaError:error&&error.message||'Service média indisponible'}};return false;}
  }
  function readinessMessage(){var d=healthCache.detail||{},e=clean(d.schemaError);if(e&&d.schemaVersion==null)return publicError(e);if(Number(d.schemaVersion||0)<REQUIRED_SCHEMA_VERSION||/1082|migration|schema|schéma/i.test(e))return 'Mise à jour SQL V1082 requise avant de publier.';if(Number(d.protocolVersion||0)<REQUIRED_PROTOCOL_VERSION||d.uploadMode!=='direct-tus-binary')return 'Mise à jour du worker V1082 requise avant de publier.';if(e)return publicError(e);return 'Système de publication momentanément indisponible.';}
  function directHeaders(upload,token,extra){var h=Object.assign({'Tus-Resumable':clean(upload&&upload.tusVersion)||'1.0.0'},extra||{}),key=clean(upload&&upload.apiKey||window.HAPPYAD_SUPABASE_KEY);if(key)h.apikey=key;if(token)h.Authorization='Bearer '+token;return h;}
  async function directFetch(url,options,timeoutMs){var controller=typeof AbortController!=='undefined'?new AbortController():null,timer=null;options=Object.assign({},options||{});if(controller){options.signal=controller.signal;timer=setTimeout(function(){controller.abort();},timeoutMs||600000);}try{return await fetch(url,options);}catch(error){if(error&&error.name==='AbortError')throw new Error('Le morceau a dépassé le délai réseau');throw error;}finally{if(timer)clearTimeout(timer);}}
  function readOffset(value){
    if(value==null||!/^\d+$/.test(String(value)))throw new Error('Confirmation du transfert absente. Réessaie.');
    var n=Number(value);if(!Number.isSafeInteger(n))throw new Error('Position de reprise invalide');return n;
  }
  function proxyTusUrl(jobId){return BASE+'/api/v2/publications/'+encodeURIComponent(jobId)+'/tus';}
  async function tusOffset(upload,token,jobId,useProxy){
    var response;
    try{response=await directFetch(useProxy?proxyTusUrl(jobId):upload.url,{method:'HEAD',headers:useProxy?headers(token,{'Tus-Resumable':clean(upload&&upload.tusVersion)||'1.0.0'}):directHeaders(upload,token),cache:'no-store'},20000);}
    catch(error){throw new Error('HEAD TUS inaccessible (réseau ou CORS) : '+String(error&&error.message||error));}
    if(!response.ok){var e=new Error('HEAD TUS refusé ('+response.status+')');e.status=response.status;throw e;}
    var exposed=response.headers.get('Upload-Offset');
    if(exposed==null)throw new Error('HEAD TUS : en-tête Upload-Offset invisible. Vérifier Access-Control-Expose-Headers sur Supabase/worker.');
    return readOffset(exposed);
  }
  // Keep the server's TUS chunk size. An idle timeout, rather than a short
  // total timeout, allows slow connections to continue while bytes are moving.
  function sendChunk(upload,token,offset,blob,onBytes,groupId,jobId,useProxy){
    return new Promise(function(resolve,reject){
      var xhr=new XMLHttpRequest(),timer=null,settled=false,lastLoaded=0;
      if(isCanceled(groupId))return reject(Object.assign(new Error('Publication annulée'),{canceled:true}));
      (runningXhrs[groupId]||(runningXhrs[groupId]=[])).push(xhr);
      function finish(error,value){if(settled)return;settled=true;clearTimeout(timer);runningXhrs[groupId]=(runningXhrs[groupId]||[]).filter(function(x){return x!==xhr;});if(error)reject(error);else resolve(value);}
      function idle(){clearTimeout(timer);timer=setTimeout(function(){var error=new Error('Envoi sans réponse depuis 45 secondes. Vérifie ta connexion puis réessaie.');error.transportUnavailable=true;finish(error);try{xhr.abort();}catch(_e){}},45000);}
      try{
        xhr.open('PATCH',useProxy?proxyTusUrl(jobId):upload.url,true);
        var h=useProxy?headers(token,{'Tus-Resumable':clean(upload&&upload.tusVersion)||'1.0.0','Upload-Offset':String(offset),'Content-Type':'application/offset+octet-stream'}):directHeaders(upload,token,{'Upload-Offset':String(offset),'Content-Type':'application/offset+octet-stream'});
        Object.keys(h).forEach(function(k){xhr.setRequestHeader(k,h[k]);});
        xhr.upload.onprogress=function(event){if(event.loaded>lastLoaded){lastLoaded=event.loaded;idle();notifyUI(onBytes,[Math.min(blob.size,event.loaded)]);}};
        xhr.upload.onload=function(){idle();};
        xhr.onload=function(){
          if(xhr.status<200||xhr.status>=300){var e=new Error('PATCH TUS refusé ('+xhr.status+')');e.status=xhr.status;finish(e);return;}
          try{var confirmed=xhr.getResponseHeader('Upload-Offset');if(confirmed==null)throw new Error('PATCH TUS : Upload-Offset non exposé au navigateur (CORS).');finish(null,readOffset(confirmed));}catch(e){finish(e);}
        };
        xhr.onerror=function(){var error=new Error('PATCH TUS inaccessible (réseau, OPTIONS/CORS ou authentification).');error.transportUnavailable=true;finish(error);};
        xhr.onabort=function(){var canceled=isCanceled(groupId),error=canceled?Object.assign(new Error('Publication annulée'),{canceled:true}):new Error('Envoi interrompu. Réessaie.');if(!canceled)error.transportUnavailable=true;finish(error);};
        idle();xhr.send(blob);
      }catch(error){finish(error);}
    });
  }
  async function uploadDirect(file,created,currentAuth,onProgress,transferOptions){
    transferOptions=transferOptions||{};
    var upload=created&&created.upload;if(!upload||upload.mode!=='direct-binary'||!/^https:\/\//i.test(clean(upload.url)))throw new Error('Session d’envoi direct V1082 absente');
    var groupId=clean(transferOptions.groupId||created.publication_group_id||''),token=currentAuth.token,offset=0,retries=0,useProxy=false,chunkBytes=Number(upload.chunkBytes||DIRECT_TUS_CHUNK);
    // A HEAD failure is NOT proof that a remote file disappeared. Retry HEAD, never issue PATCH at a guessed offset.
    for(var h=0;;h++){
      assertNotCanceled(groupId);
      try{offset=await tusOffset(upload,token,created.id,useProxy);break;}
      catch(error){if(error&&(error.status===401||error.status===403)){var refreshed=await auth();currentAuth.token=refreshed.token;token=refreshed.token;}
        if(!useProxy&&!error.status){useProxy=true;continue;}
        if(error&&[400,404,410,413,415,422].indexOf(error.status)>=0||h>=11)throw error;
        await sleep(Math.min(10000,(h+1)*900));}
    }
    if(!Number.isSafeInteger(chunkBytes)||chunkBytes<=0)chunkBytes=DIRECT_TUS_CHUNK;
    if(offset>file.size)throw new Error('Position de reprise invalide');
    var firstChunkBytes=Number(transferOptions.firstChunkBytes||0),anchored=offset>0;
    if(!Number.isSafeInteger(firstChunkBytes)||firstChunkBytes<0)firstChunkBytes=0;firstChunkBytes=Math.min(firstChunkBytes,chunkBytes);
    function report(bytes,confirmed){
      // Network progress is provisional; 44% is reserved for all bytes acknowledged.
      var percent=Math.max(1,Math.min(confirmed?44:43,Math.floor(bytes/Math.max(1,file.size)*44)));
      if(onProgress)onProgress(Object.assign({},created,{status:'uploading',uploaded_bytes:offset,progress:percent,stage:'Envoi du média'}));
    }
    function anchor(){if(anchored&&transferOptions.onAnchored){notifyUI(transferOptions.onAnchored,[Object.assign({},created,{status:'uploading',uploaded_bytes:offset,progress:Math.max(1,Math.floor(offset/Math.max(1,file.size)*44))}),{offset:offset,fileSize:file.size}]);transferOptions.onAnchored=null;}}
    anchor();
    while(offset<file.size){
      assertNotCanceled(groupId);
      var end=Math.min(offset+(!anchored&&firstChunkBytes>0?firstChunkBytes:chunkBytes),file.size);
      try{
        assertNotCanceled(groupId);
        var next=await sendChunk(upload,token,offset,file.slice(offset,end),function(bytes){report(offset+bytes,false);},groupId,created.id,useProxy);
        assertNotCanceled(groupId);
        if(next<=offset||next>end)throw new Error('Confirmation directe incohérente');
        offset=next;retries=0;anchored=true;anchor();report(offset,true);
      }catch(error){
        if(cancelError(error)||isCanceled(groupId))throw Object.assign(new Error('Publication annulée'),{canceled:true});
        if(error&&error.name==='NotReadableError')throw new Error('Le téléphone ne peut plus lire ce média. Sélectionne-le à nouveau.');
        if(!useProxy&&error&&error.transportUnavailable){useProxy=true;retries=0;try{console.info('Fyblic: transfert navigateur indisponible, reprise TUS via Railway');}catch(_log){}}
        if(error&&[400,404,410,413,415,422].indexOf(error.status)>=0)throw error;
        if(++retries>12)throw new Error('Envoi interrompu après 12 reprises : '+String(error&&error.message||error));
        if(error&&(error.status===401||error.status===403)){var refreshed=await auth();currentAuth.token=refreshed.token;token=refreshed.token;}
        // Reconcile before another PATCH, including a lost response after success.
        // If HEAD also fails, retry reconciliation. Never PATCH again using a speculative offset.
        try{var resumed=await tusOffset(upload,token,created.id,useProxy);if(resumed>file.size)throw new Error('Position de reprise invalide');offset=resumed;if(offset>0){anchored=true;anchor();report(offset,true);}}
        catch(headError){if(retries>=12)throw headError;}
        if(offset<file.size)await sleep(Math.min(10000,retries*900));
      }
    }
    return offset;
  }
  function fingerprint(file){return [file.name||'media',file.size||0,file.lastModified||0,inferredMime(file)].join(':');}
  async function status(id,token){var job=visibleJob((await request('/api/v2/publications/'+id,{},token,30000)).body);return guardJob(job)||job;}
  function primaryVisible(job){return !!(job&&job.primary_ready===true&&(job.publication_type!=='album'||(job.result&&job.result.group_visible===true)));}
  async function watch(id,token,onProgress,untilPrimary){
    var key=id+'::'+(untilPrimary?'primary':'final');if(watchers[key])return watchers[key];
    watchers[key]=(async function(){try{for(;;){var job=await status(id,token);job=guardJob(job);if(!job){await sleep(800);continue;}rememberJob(job,job.publication_group_id||'');if(onProgress)onProgress(job);if(['failed','canceled'].indexOf(job.status)>=0)return job;if(untilPrimary&&primaryVisible(job))return job;if(job.status==='published'&&(!untilPrimary||job.publication_type!=='album'||(job.result&&job.result.group_visible===true)))return job;await sleep(job.status==='uploading'?2200:850);}}finally{delete watchers[key];}})();
    return watchers[key];
  }
  async function createAndUpload(file,options,currentAuth,onProgress){
    assertNotCanceled(options.groupId);
    var created=visibleJob((await request('/api/v2/publications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      filename:file.name||'media',size:file.size,mime:inferredMime(file),kind:options.kind||inferredKind(file)||'photo',publicationType:options.publicationType||'normal',postId:options.postId,payload:options.payload||{},fingerprint:options.savedFingerprint||fingerprint(file),groupId:options.groupId||options.postId,assetIndex:options.assetIndex||0,assetCount:options.assetCount||1
    })},currentAuth.token,45000)).body);
    if(created&&created.id&&!terminalStatus(created.status)&&terminalJobs[created.id]==='failed')delete terminalJobs[created.id];
    rememberJob(created,options.groupId||'');
    if(typeof options.onCreated==='function')options.onCreated(created);
    if(isCanceled(options.groupId)&&created&&created.id&&created.status==='uploading'){try{await request('/api/v2/publications/'+encodeURIComponent(created.id)+'/cancel',{method:'POST'},currentAuth.token,20000);}catch(_cancelError){}}
    assertNotCanceled(options.groupId);
    if(created.status==='failed'||created.status==='canceled')throw new Error(created.error_message||'Travail distant déjà terminé en échec ou annulé');
    if(created.primary_ready===true||created.status==='published'){if(typeof options.onUploadAnchored==='function'){try{options.onUploadAnchored(created,{offset:file.size,fileSize:file.size,reused:true});}catch(_anchorUi){}}return created;}
    if(created.status==='uploading'){
      await uploadDirect(file,created,currentAuth,function(job){rememberJob(job,options.groupId||'');if(onProgress)onProgress(job);},{firstChunkBytes:options.publicationType==='story'?STORY_FIRST_TUS_CHUNK:0,onAnchored:options.publicationType==='story'?options.onUploadAnchored:null,groupId:options.groupId});
      assertNotCanceled(options.groupId);
      // Reconcile a lost /complete response by querying the existing job (never create a duplicate publication).
      for(var attempt=0;;attempt++){try{created=visibleJob((await request('/api/v2/publications/'+created.id+'/complete',{method:'POST'},currentAuth.token,45000)).body);break;}catch(error){assertNotCanceled(options.groupId);if(attempt>=5||error&&[400,404,410,413,415,422].indexOf(error.status)>=0)throw error;try{var prior=await status(created.id,currentAuth.token);if(prior&&prior.status!=='uploading'){created=prior;break;}}catch(_check){}await sleep(Math.min(10000,(attempt+1)*1000));}}
      rememberJob(created,options.groupId||'');if(onProgress)onProgress(created);
    }
    return created;
  }
  function kindOf(file){return inferredKind(file)||'photo';}
  function aggregate(group,states){
    var count=states.length||1,total=0,allPrimary=true,allPublished=true,failed=null,canceled=false,anyUploading=false;
    states.forEach(function(job){job=job||{};total+=Math.max(0,Math.min(100,Number(job.progress||0)));if(!primaryVisible(job))allPrimary=false;if(job.status!=='published')allPublished=false;if(job.status==='failed'&&!failed)failed=job;if(job.status==='canceled')canceled=true;if(job.status==='uploading')anyUploading=true;});
    var progress=Math.round(total/count),status=failed?'failed':canceled?'canceled':allPublished?'published':(allPrimary?'optimizing':(anyUploading?'uploading':'processing'));
    return {jobId:group.id,groupId:group.id,postId:group.postId||'',publicationType:group.publicationType||'normal',status:status,primaryReady:allPrimary,progress:progress,stage:failed?'Échec':canceled?'Publication annulée':allPublished?'Publication terminée':allPrimary?'Publication visible · optimisation':anyUploading?'Envoi du média':'Publication en cours',error:failed?publicError(failed.error_message||failed.error||''):''};
  }
  async function submitMany(files,options){
    options=options||{};files=Array.prototype.slice.call(files||[]).filter(Boolean);if(!files.length)throw new Error('Média absent');
    if(options.publicationType==='story'&&files.length!==1)throw new Error('Une Story accepte un seul média.');
    if(!(await available(false)))return {used:false,reason:'engine-v1082-unavailable'};
    var a=await auth();
    var resume=options.recoveryPlan||null;
    if(resume&&(!filesMatchPlan(files,resume)||String(resume.owner)!==String(a.user.id)))throw new Error('Reprise refusée : compte ou fichiers différents.');
    var group={id:resume?resume.id:(clean(options.groupId)||('pub_'+uid().replace(/-/g,''))),postId:resume?resume.postId:(clean(options.postId)||('p_'+uid().replace(/-/g,''))),publicationType:resume?resume.publicationType:(clean(options.publicationType)||'normal'),assetCount:files.length,children:[],createdAt:new Date().toISOString()};
    // Preserve already-created jobs across an upload retry.
    var known=readList(GROUPS_KEY).find(function(g){return g&&String(g.id)===String(group.id);});
    if(known&&Array.isArray(known.children))group.children=known.children.slice();
    assertNotCanceled(group.id);
    groupCancels[group.id]={canceled:false};
    rememberGroup(group);activateGroup(group);
    if(!resume)await storeRecovery(group,files,options,a.user.id);
    var states=new Array(files.length).fill(null).map(function(){return {status:'uploading',progress:0,primary_ready:false};});
    var queuedJobs=new Array(files.length);
    function emit(index,job){states[index]=mergeJobState(states[index],job||{});var d=aggregate(group,states);dispatch(d);notifyUI(options.onProgress,[d,states.slice()]);}
    dispatch(aggregate(group,states));
    notifyUI(options.onGroupCreated,[group]);

    var cursor=0,concurrency=Math.max(1,Math.min(Number(options.uploadConcurrency||2)||2,3));
    async function runner(){
      for(;;){
        var index=cursor++;if(index>=files.length)return;
        assertNotCanceled(group.id);
        var file=files[index],postId=resume?resume.assets[index].postId:(typeof options.postIdForAsset==='function'?options.postIdForAsset(index,file):((files.length===1)?group.postId:(group.postId+'_'+(index+1))));
        var payload=resume?resume.assets[index].payload:(typeof options.payloadForAsset==='function'?options.payloadForAsset(index,file):(options.payload||{}));
        try{
          var queued=await createAndUpload(file,{kind:kindOf(file),publicationType:group.publicationType==='normal'&&files.length>1?'album':group.publicationType,postId:postId,payload:payload,groupId:group.id,assetIndex:index,assetCount:files.length,savedFingerprint:resume&&resume.assets[index].fingerprint,onCreated:function(job){if(job&&job.id&&group.children.indexOf(job.id)<0){group.children.push(job.id);rememberGroup(group);updateActiveChildren(group);}emit(index,job);},onUploadAnchored:group.publicationType==='story'?function(job,info){if(typeof options.onUploadAnchored==='function'){try{options.onUploadAnchored(group,job,info||{});}catch(uiError){try{console.warn('Fyblic Story ancrage UI ignoré:',uiError&&uiError.message||uiError);}catch(_e){}}}}:null},a,function(job){emit(index,job);});
          queuedJobs[index]=queued;emit(index,queued);
        }catch(error){states[index]=Object.assign({},states[index],{status:cancelError(error)||isCanceled(group.id)?'canceled':'failed',error_message:error&&error.message||String(error)});emit(index,states[index]);throw error;}
      }
    }
    var uploads=[];for(var i=0;i<Math.min(concurrency,files.length);i++)uploads.push(runner());
    try{await Promise.all(uploads);}catch(error){if(cancelError(error)||isCanceled(group.id)){discardRecovery(group.id);forgetGroup(group.id);clearActive(group.id);}else{dispatch({jobId:group.id,groupId:group.id,publicationType:group.publicationType,status:'paused',progress:0,stage:'Envoi interrompu · réessaie avec les mêmes médias',error:publicError(error&&error.message||error)});}throw error;}
    notifyUI(options.onUploadsComplete,[group]);

    var visiblePromises=queuedJobs.map(function(job,index){return watch(job.id,a.token,function(current){emit(index,current);},true);});
    var fullPromises=queuedJobs.map(function(job,index){return watch(job.id,a.token,function(current){emit(index,current);},false);});
    var visibleCompletion=Promise.all(visiblePromises).then(function(rows){var bad=rows.find(function(j){return j&&['failed','canceled'].indexOf(j.status)>=0;});if(bad)throw new Error(bad.error_message||'Publication échouée');return rows;});
    var fullCompletion=Promise.all(fullPromises).then(function(rows){var bad=rows.find(function(j){return j&&['failed','canceled'].indexOf(j.status)>=0;});if(bad)throw new Error(bad.error_message||'Publication échouée');clearActive(group.id);forgetGroup(group.id);discardRecovery(group.id);dispatch(aggregate(group,rows));return rows;}).catch(function(error){clearActive(group.id);throw error;});
    return {used:true,group:group,jobs:queuedJobs,visibleCompletion:visibleCompletion,completion:fullCompletion};
  }
  async function submit(file,options){
    options=options||{};var result=await submitMany([file],{groupId:options.groupId||options.postId,postId:options.postId,publicationType:options.publicationType||'normal',payload:options.payload||{},onGroupCreated:function(group){if(typeof options.onCreated==='function')options.onCreated({id:group.id,post_id:group.postId,publication_type:group.publicationType,status:'uploading',progress:1});},onProgress:function(detail){if(typeof options.onProgress==='function')options.onProgress(detail);}});
    if(!result||!result.used)return result;
    return {used:true,group:result.group,jobs:result.jobs,job:result.jobs[0],visibleCompletion:result.visibleCompletion.then(function(rows){return rows[0];}),completion:result.completion.then(function(rows){return rows[0];})};
  }
  async function cancel(id){var a=await auth(),job=(await request('/api/v2/publications/'+encodeURIComponent(id)+'/cancel',{method:'POST'},a.token,30000)).body;rawEvent(job,job.publication_group_id||'',true);return job;}
  async function cancelGroup(id){
    id=String(id||'');if(!id)return false;
    (groupCancels[id]||(groupCancels[id]={})).canceled=true;
    (runningXhrs[id]||[]).slice().forEach(function(xhr){try{xhr.abort();}catch(_e){}});
    var group=readList(GROUPS_KEY).find(function(x){return x&&String(x.id)===id;});
    var rec=recoveryPlan(),children=(group&&group.children||active()&&active().id===id&&active().children||[]).slice();
    if(children.length){
      var currentAuth=null;try{currentAuth=await auth();}catch(_auth){}
      if(currentAuth){for(var i=0;i<children.length;i++){
        var childId=children[i];try{
          var job=await status(childId,currentAuth.token);
          // Never ask the server to delete an already visible/finalized media object.
          if(job&&job.status==='uploading'&&!job.primary_ready){
            await request('/api/v2/publications/'+encodeURIComponent(childId)+'/cancel',{method:'POST'},currentAuth.token,30000);
          }
        }catch(error){try{console.warn('Fyblic annulation distante non confirmée',childId,error.message);}catch(_e){}}
      }}
    }
    clearActive(id);forgetGroup(id);discardRecovery(id);
    dispatch({jobId:id,groupId:id,publicationType:group&&group.publicationType||rec&&rec.publicationType||'normal',status:'canceled',progress:0,stage:'Publication annulée'});
    return true;
  }
  function forget(id){forgetJob(id);forgetGroup(id);clearActive(id);discardRecovery(id);}
  var resumeStarted=false;
  async function resumeTracking(){
    // The parent owns network transfers; an embedded publish iframe must not launch duplicates.
    if(resumeStarted||window.parent&&window.parent!==window&&window.parent.FyblicPublicationEngineV1082)return;
    resumeStarted=true;
    var a=active(),p=recoveryPlan(),groupId=a&&a.id||p&&p.id;
    if(!groupId||groupCancels[groupId]&&!groupCancels[groupId].canceled)return;
    var known=readList(GROUPS_KEY).find(function(g){return g&&String(g.id)===String(groupId);});
    var children=a&&a.children&&a.children.length?a.children:(known&&known.children||[]);
    var session;try{session=await auth();}catch(_e){return;}
    if(p&&p.owner!==session.user.id)return; // Never resume another account's media.
    if(p&&p.id===groupId){
      var files=null;try{files=await resumeFileRead(groupId);}catch(_e){}
      if(filesMatchPlan(files,p)){
        try{var resumed=await submitMany(files,{recoveryPlan:p,uploadConcurrency:2});
          if(resumed&&resumed.used){await resumed.completion;return;}
        }catch(error){try{console.warn('Fyblic reprise:',error.message);}catch(_e){}}
      }
    }
    var group={id:groupId,postId:a&&a.postId||known&&known.postId||p&&p.postId||'',publicationType:known&&known.publicationType||p&&p.publicationType||'normal',children:children.slice()};
    var states=children.map(function(){return {status:'uploading',progress:0,primary_ready:false};});
    if(!children.length){dispatch({jobId:group.id,groupId:group.id,publicationType:group.publicationType,status:'paused',progress:0,stage:'Envoi interrompu · sélectionne à nouveau le média'});return;}
    var jobs=await Promise.all(children.map(function(id){return status(id,session.token).catch(function(){return null;});}));
    jobs.forEach(function(job,index){if(job)states[index]=job;});
    // Remote-first recovery: before asking for a File, determine whether Supabase
    // already acknowledged its *entire* length. Never trust the nominal 45% status.
    if(p&&p.id===groupId&&p.owner===session.user.id){
      for(var i=0;i<jobs.length;i++){
        var old=jobs[i];if(!old||old.status!=='uploading')continue;
        var asset=p.assets.length===1?p.assets[0]:p.assets.find(function(asset){return asset.postId===old.post_id;});
        if(!asset)continue;
        try{
          var created=(await request('/api/v2/publications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:asset.name,size:asset.size,mime:asset.mime,kind:asset.mime.indexOf('video/')===0?'video':'photo',publicationType:p.publicationType==='normal'&&p.assets.length>1?'album':p.publicationType,postId:asset.postId,payload:asset.payload,fingerprint:asset.fingerprint,groupId:p.id,assetIndex:p.assets.indexOf(asset),assetCount:p.assets.length})},session.token,30000)).body;
          // A changed job ID means no verified reuse: do not finalize or delete it.
          if(!created||String(created.id)!==String(children[i]))continue;
          if(created.status==='published'||created.primary_ready===true){jobs[i]=created;states[i]=created;continue;}
          if(!created.upload||created.upload.mode!=='direct-binary')continue;
          var remoteOffset;try{remoteOffset=await tusOffset(created.upload,session.token,created.id,false);}catch(_directHead){remoteOffset=await tusOffset(created.upload,session.token,created.id,true);}
          if(remoteOffset>asset.size)throw new Error('TUS : taille distante incohérente');
          if(remoteOffset===asset.size){
            var completed=(await request('/api/v2/publications/'+encodeURIComponent(created.id)+'/complete',{method:'POST'},session.token,45000)).body;
            if(completed){jobs[i]=completed;states[i]=completed;}
          }else{states[i]=Object.assign({},old,{uploaded_bytes:remoteOffset,size:asset.size,progress:Math.floor(remoteOffset/Math.max(1,asset.size)*44)});}
        }catch(error){try{console.warn('Fyblic vérification distante non aboutie',error.message);}catch(_e){}}
      }
    }
    var allDone=jobs.length>0&&jobs.every(function(job){return job&&(job.status==='published'||job.primary_ready===true);});
    if(allDone){dispatch(aggregate(group,states));clearActive(group.id);forgetGroup(group.id);discardRecovery(group.id);return;}
    var failed=jobs.find(function(job){return job&&['failed','canceled'].indexOf(job.status)>=0;});
    if(failed){dispatch(aggregate(group,states));return;}
    if(jobs.every(function(job){return job&&job.status!=='uploading';})){
      // Bytes have already reached the server: observe processing, no File needed.
      dispatch(aggregate(group,states));
      children.forEach(function(id,index){watch(id,session.token,function(job){states[index]=job;dispatch(aggregate(group,states));if(states.every(function(j){return j&&j.status==='published';})){clearActive(group.id);forgetGroup(group.id);discardRecovery(group.id);}},false).catch(function(error){dispatch({jobId:group.id,groupId:group.id,publicationType:group.publicationType,status:'paused',progress:0,stage:'Suivi distant momentanément indisponible',error:error.message});});});
      return;
    }
    // We cannot reconstruct lost File bytes from localStorage after a page refresh.
    // Show a paused state rather than pretending that 45% of the upload was confirmed.
    var confirmedPercent=states.every(function(j){return Number(j.size||j.total_bytes||0)>0&&Number.isFinite(Number(j.uploaded_bytes));})?Math.floor(states.reduce(function(n,j){return n+Math.max(0,Math.min(1,Number(j.uploaded_bytes||0)/Number(j.size||j.total_bytes)));},0)/Math.max(1,states.length)*44):0;
    dispatch({jobId:group.id,groupId:group.id,postId:group.postId,publicationType:group.publicationType,status:'paused',progress:confirmedPercent,stage:'Envoi interrompu · sélectionne les mêmes médias pour reprendre'});
  }

  var api={version:'1166-tus-proxy-web-fallback',requiredSchemaVersion:REQUIRED_SCHEMA_VERSION,requiredProtocolVersion:REQUIRED_PROTOCOL_VERSION,uploadMode:'direct-tus-binary',available:available,readinessMessage:readinessMessage,submit:submit,submitMany:submitMany,status:status,watch:watch,resumeTracking:resumeTracking,cancel:cancel,cancelGroup:cancelGroup,pendingForFiles:pendingForFiles,pendingPlan:recoveryPlan,forget:forget};window.FyblicPublicationEngineV1082=api;window.FyblicPublicationEngineV1081=api;window.FyblicPublicationEngineV1080=api;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(resumeTracking,1000);},{once:true});else setTimeout(resumeTracking,1000);
})();
