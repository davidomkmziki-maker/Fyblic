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
  var inflightGroups={};
  var CANCELED_KEY='FYBLIC_PUBLICATION_CANCELLED_V1165';
  function canceledIds(){return readList(CANCELED_KEY).map(function(v){return typeof v==='string'?v:v&&v.id||'';});}
  function isCanceled(id){return !!id&&canceledIds().indexOf(String(id))>=0;}
  function markCanceled(id){var list=readList(CANCELED_KEY).filter(function(x){return x&&Date.now()-Number(x.at||0)<48*3600000&&String(x.id)!==String(id);});list.unshift({id:String(id),at:Date.now()});writeList(CANCELED_KEY,list,30);}
  function canceledError(){var error=new Error('Envoi annulé par l’utilisateur.');error.code='FYBLIC_CANCELED';return error;}
  function assertActive(ctx){if(ctx&&ctx.canceled)throw canceledError();}
  function reportDiagnostic(step,error){try{console.warn('[Fyblic TUS V1165]',step,error&&error.message||error);}catch(_e){}}

  function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  function cancellableSleep(ms,ctx){
    if(!ctx)return sleep(ms);
    return new Promise(function(resolve,reject){
      if(ctx.canceled){reject(canceledError());return;}
      var t;
      function cancel(){clearTimeout(t);ctx.waiters.delete(cancel);reject(canceledError());}
      ctx.waiters.add(cancel);
      t=setTimeout(function(){ctx.waiters.delete(cancel);resolve();},ms);
    });
  }
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
  function mergeJobState(previous,next){previous=previous||{};next=guardJob(next);if(!next)return previous;var out=Object.assign({},previous,next);if(!terminalStatus(next.status))out.progress=Math.max(Number(previous.progress||0),Number(next.progress||0));return out;}
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
  function directHeaders(upload,token,extra){var h=Object.assign({'Tus-Resumable':clean(upload&&upload.tusVersion)||'1.0.0',apikey:clean(upload&&upload.apiKey||window.HAPPYAD_SUPABASE_KEY)},extra||{});if(token)h.Authorization='Bearer '+token;return h;}
  async function directFetch(url,options,timeoutMs,ctx){
    assertActive(ctx);
    var controller=typeof AbortController!=='undefined'?new AbortController():null,timer=null;
    options=Object.assign({},options||{});
    if(controller){options.signal=controller.signal;if(ctx)ctx.controllers.add(controller);timer=setTimeout(function(){controller.abort();},timeoutMs||30000);}
    try{return await fetch(url,options);}
    catch(error){if(ctx&&ctx.canceled)throw canceledError();if(error&&error.name==='AbortError')throw new Error('Délai réseau dépassé pendant la vérification TUS');throw error;}
    finally{if(timer)clearTimeout(timer);if(ctx&&controller)ctx.controllers.delete(controller);}
  }
  function readOffset(value){
    if(value==null||!/^\d+$/.test(String(value)))throw new Error('En-tête Upload-Offset inaccessible : vérifier CORS/TUS du Storage Supabase.');
    var n=Number(value);if(!Number.isSafeInteger(n))throw new Error('Position de reprise invalide');return n;
  }
  async function tusOffset(upload,token,ctx){
    var response=await directFetch(upload.url,{method:'HEAD',headers:directHeaders(upload,token),cache:'no-store'},25000,ctx);
    if(!response.ok){var e=new Error('Reprise TUS refusée (HTTP '+response.status+')');e.status=response.status;throw e;}
    return readOffset(response.headers.get('Upload-Offset'));
  }
  function sendChunk(upload,token,offset,blob,onBytes,ctx){
    return new Promise(function(resolve,reject){
      if(ctx&&ctx.canceled){reject(canceledError());return;}
      var xhr=new XMLHttpRequest(),timer=null,settled=false,lastLoaded=0;
      if(ctx)ctx.xhrs.add(xhr);
      function finish(error,value){if(settled)return;settled=true;clearTimeout(timer);if(ctx)ctx.xhrs.delete(xhr);if(error)reject(error);else resolve(value);}
      function idle(){clearTimeout(timer);timer=setTimeout(function(){try{xhr.abort();}catch(_e){}finish(new Error('Aucune progression TUS depuis 90 secondes.'));},90000);}
      try{
        xhr.open('PATCH',upload.url,true);
        var h=directHeaders(upload,token,{'Upload-Offset':String(offset),'Content-Type':'application/offset+octet-stream'});
        Object.keys(h).forEach(function(k){xhr.setRequestHeader(k,h[k]);});
        xhr.upload.onprogress=function(event){if(ctx&&ctx.canceled)return;if(event.loaded>lastLoaded){lastLoaded=event.loaded;idle();notifyUI(onBytes,[Math.min(blob.size,event.loaded)]);}};
        xhr.upload.onload=function(){idle();};
        xhr.onload=function(){
          if(ctx&&ctx.canceled){finish(canceledError());return;}
          if(xhr.status<200||xhr.status>=300){var e=new Error('Envoi TUS refusé (HTTP '+xhr.status+'). Vérifier CORS, session et Storage.');e.status=xhr.status;finish(e);return;}
          try{finish(null,readOffset(xhr.getResponseHeader('Upload-Offset')));}catch(e){finish(e);}
        };
        xhr.onerror=function(){finish(ctx&&ctx.canceled?canceledError():new Error('Réseau ou CORS interdit le PATCH vers Supabase Storage.'));};
        xhr.onabort=function(){finish(ctx&&ctx.canceled?canceledError():new Error('Envoi TUS interrompu.'));};
        idle();xhr.send(blob);
      }catch(error){finish(error);}
    });
  }
  async function retryAuth(currentAuth){
    var c=client();if(c&&c.auth&&typeof c.auth.refreshSession==='function'){
      try{var r=await bounded(c.auth.refreshSession(),15000,'Rafraîchissement de session expiré');var s=r&&r.data&&r.data.session;if(s&&s.access_token&&s.user&&s.user.id===currentAuth.user.id){currentAuth.token=s.access_token;return s.access_token;}}catch(error){reportDiagnostic('refresh-session',error);}
    }
    var a=await auth();if(a.user.id!==currentAuth.user.id)throw new Error('Le compte a changé pendant la publication.');currentAuth.token=a.token;return a.token;
  }
  async function uploadDirect(file,created,currentAuth,onProgress,transferOptions,ctx){
    transferOptions=transferOptions||{};
    var upload=created&&created.upload;if(!upload||upload.mode!=='direct-binary'||!/^https:\/\//i.test(clean(upload.url)))throw new Error('Session d’envoi direct V1082 absente');
    var token=currentAuth.token,offset=0,retries=0,chunkBytes=Number(upload.chunkBytes||DIRECT_TUS_CHUNK);
    if(!Number.isSafeInteger(chunkBytes)||chunkBytes<=0)chunkBytes=DIRECT_TUS_CHUNK;
    chunkBytes=Math.min(chunkBytes,10*1024*1024);
    var firstChunkBytes=Number(transferOptions.firstChunkBytes||0),anchored=false;
    if(!Number.isSafeInteger(firstChunkBytes)||firstChunkBytes<0)firstChunkBytes=0;firstChunkBytes=Math.min(firstChunkBytes,chunkBytes);
    function report(bytes){
      // L'interface présente uniquement les octets confirmés par Upload-Offset, jamais 1 % fictif.
      var percent=Math.min(44,Math.floor(bytes/Math.max(1,file.size)*44));
      if(onProgress)onProgress(Object.assign({},created,{status:'uploading',uploaded_bytes:bytes,progress:percent,stage:'Envoi du média confirmé'}));
    }
    function anchor(){if(anchored&&transferOptions.onAnchored){notifyUI(transferOptions.onAnchored,[Object.assign({},created,{status:'uploading',uploaded_bytes:offset,progress:Math.floor(offset/Math.max(1,file.size)*44)}),{offset:offset,fileSize:file.size}]);transferOptions.onAnchored=null;}}
    // HEAD fait partie du circuit de reprises, comme PATCH. Ne jamais envoyer sans position vérifiée.
    for(;;){
      assertActive(ctx);
      try{offset=await tusOffset(upload,token,ctx);if(offset>file.size)throw new Error('Position de reprise invalide');break;}
      catch(error){assertActive(ctx);reportDiagnostic('tus-head-initial',error);if(error&&[400,404,410,413,415,422].indexOf(error.status)>=0)throw error;if(++retries>6)throw new Error('Vérification TUS impossible après 6 tentatives : '+String(error&&error.message||error));if(error&&(error.status===401||error.status===403))token=await retryAuth(currentAuth);await cancellableSleep(Math.min(6000,retries*700),ctx);}
    }
    anchored=offset>0;anchor();report(offset);retries=0;
    while(offset<file.size){
      assertActive(ctx);
      var end=Math.min(offset+(!anchored&&firstChunkBytes>0?firstChunkBytes:chunkBytes),file.size);
      try{
        // Le JWT peut changer pendant un long transfert, sans changer de propriétaire.
        if(retries===0&&Date.now()-Number(currentAuth.checkedAt||0)>5*60000){var a=await auth();if(a.user.id!==currentAuth.user.id)throw new Error('Compte différent');token=currentAuth.token=a.token;currentAuth.checkedAt=Date.now();}
        var next=await sendChunk(upload,token,offset,file.slice(offset,end),null,ctx);
        assertActive(ctx);
        if(next<=offset||next>end)throw new Error('Confirmation directe incohérente');
        offset=next;retries=0;anchored=true;anchor();report(offset);
      }catch(error){
        assertActive(ctx);reportDiagnostic('tus-patch',error);
        if(error&&error.name==='NotReadableError')throw new Error('Le téléphone ne peut plus lire ce média. Sélectionne-le à nouveau.');
        if(error&&[400,404,410,413,415,422].indexOf(error.status)>=0)throw error;
        if(++retries>12)throw new Error('Envoi interrompu après 12 reprises : '+String(error&&error.message||error));
        if(error&&(error.status===401||error.status===403))token=await retryAuth(currentAuth);
        // IMPORTANT : on ne renvoie jamais un morceau si la position HEAD est inconnue.
        var checked=false;
        try{var resumed=await tusOffset(upload,token,ctx);if(resumed>file.size)throw new Error('Position de reprise invalide');offset=resumed;checked=true;}
        catch(headError){assertActive(ctx);reportDiagnostic('tus-head-reconcile',headError);if(headError&&(headError.status===401||headError.status===403))token=await retryAuth(currentAuth);}
        if(checked){if(offset>0){anchored=true;anchor();report(offset);}await cancellableSleep(Math.min(10000,retries*900),ctx);}
        else { // La boucle recommence par HEAD; jamais de PATCH à offset potentiellement périmé.
          for(;;){assertActive(ctx);if(++retries>12)throw new Error('Position TUS impossible à vérifier : le serveur ne confirme pas les octets.');await cancellableSleep(Math.min(10000,retries*900),ctx);try{offset=await tusOffset(upload,token,ctx);if(offset>file.size)throw new Error('Position de reprise invalide');report(offset);anchored=offset>0;anchor();break;}catch(headError){assertActive(ctx);reportDiagnostic('tus-head-after-patch',headError);if(headError&&(headError.status===401||headError.status===403))token=await retryAuth(currentAuth);}}
        }
      }
    }
    assertActive(ctx);return offset;
  }
  function fingerprint(file){return [file.name||'media',file.size||0,file.lastModified||0,inferredMime(file)].join(':');}
  async function status(id,token){var job=visibleJob((await request('/api/v2/publications/'+id,{},token,30000)).body);return guardJob(job)||job;}
  function primaryVisible(job){return !!(job&&job.primary_ready===true&&(job.publication_type!=='album'||(job.result&&job.result.group_visible===true)));}
  async function watch(id,token,onProgress,untilPrimary){
    var key=id+'::'+(untilPrimary?'primary':'final');if(watchers[key])return watchers[key];
    watchers[key]=(async function(){try{for(;;){var job=await status(id,token);job=guardJob(job);if(!job){await sleep(800);continue;}rememberJob(job,job.publication_group_id||'');if(onProgress)onProgress(job);if(['failed','canceled'].indexOf(job.status)>=0)return job;if(untilPrimary&&primaryVisible(job))return job;if(job.status==='published'&&(!untilPrimary||job.publication_type!=='album'||(job.result&&job.result.group_visible===true)))return job;await sleep(job.status==='uploading'?2200:850);}}finally{delete watchers[key];}})();
    return watchers[key];
  }
  async function createAndUpload(file,options,currentAuth,onProgress,ctx){
    assertActive(ctx);
    var created=visibleJob((await request('/api/v2/publications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      filename:file.name||'media',size:file.size,mime:inferredMime(file),kind:options.kind||inferredKind(file)||'photo',publicationType:options.publicationType||'normal',postId:options.postId,payload:options.payload||{},fingerprint:fingerprint(file),groupId:options.groupId||options.postId,assetIndex:options.assetIndex||0,assetCount:options.assetCount||1
    })},currentAuth.token,45000)).body);
    if(created&&created.id&&!terminalStatus(created.status)&&terminalJobs[created.id]==='failed')delete terminalJobs[created.id];
    if(created&&created.status==='uploading'&&Number(created.uploaded_bytes||0)===0)created.progress=0;
    rememberJob(created,options.groupId||'');
    if(typeof options.onCreated==='function')options.onCreated(created);
    assertActive(ctx);
    if(created.primary_ready===true||created.status==='published'){if(typeof options.onUploadAnchored==='function'){try{options.onUploadAnchored(created,{offset:file.size,fileSize:file.size,reused:true});}catch(_anchorUi){}}return created;}
    if(created.status==='uploading'){
      await uploadDirect(file,created,currentAuth,function(job){rememberJob(job,options.groupId||'');if(onProgress)onProgress(job);},{firstChunkBytes:options.publicationType==='story'?STORY_FIRST_TUS_CHUNK:0,onAnchored:options.publicationType==='story'?options.onUploadAnchored:null},ctx);
      assertActive(ctx);
      created=visibleJob((await request('/api/v2/publications/'+created.id+'/complete',{method:'POST'},currentAuth.token,45000)).body);
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
    var group={id:clean(options.groupId)||('pub_'+uid().replace(/-/g,'')),postId:clean(options.postId)||('p_'+uid().replace(/-/g,'')),publicationType:clean(options.publicationType)||'normal',assetCount:files.length,children:[],createdAt:new Date().toISOString()};
    var ctx={id:group.id,canceled:false,xhrs:new Set(),controllers:new Set(),waiters:new Set(),runners:[],confirming:false};
    inflightGroups[group.id]=ctx;
    rememberGroup(group);activateGroup(group);
    var states=new Array(files.length).fill(null).map(function(){return {status:'uploading',progress:0,primary_ready:false};});
    var queuedJobs=new Array(files.length);
    function emit(index,job){if(ctx.canceled)return;states[index]=mergeJobState(states[index],job||{});var d=aggregate(group,states);dispatch(d);notifyUI(options.onProgress,[d,states.slice()]);}
    dispatch(aggregate(group,states));
    notifyUI(options.onGroupCreated,[group]);

    var cursor=0,concurrency=Math.max(1,Math.min(Number(options.uploadConcurrency||2)||2,3));
    async function runner(){
      for(;;){
        assertActive(ctx);var index=cursor++;if(index>=files.length)return;
        var file=files[index],postId=typeof options.postIdForAsset==='function'?options.postIdForAsset(index,file):((files.length===1)?group.postId:(group.postId+'_'+(index+1)));
        var payload=typeof options.payloadForAsset==='function'?options.payloadForAsset(index,file):(options.payload||{});
        try{
          var queued=await createAndUpload(file,{kind:kindOf(file),publicationType:group.publicationType==='normal'&&files.length>1?'album':group.publicationType,postId:postId,payload:payload,groupId:group.id,assetIndex:index,assetCount:files.length,onCreated:function(job){if(job&&job.id&&group.children.indexOf(job.id)<0){group.children.push(job.id);rememberGroup(group);updateActiveChildren(group);}emit(index,job);},onUploadAnchored:group.publicationType==='story'?function(job,info){if(typeof options.onUploadAnchored==='function'){try{options.onUploadAnchored(group,job,info||{});}catch(uiError){try{console.warn('Fyblic Story ancrage UI ignoré:',uiError&&uiError.message||uiError);}catch(_e){}}}}:null},a,function(job){emit(index,job);},ctx);
          queuedJobs[index]=queued;emit(index,queued);
        }catch(error){if(ctx.canceled)throw canceledError();states[index]=Object.assign({},states[index],{status:'failed',error_message:error&&error.message||String(error)});emit(index,states[index]);throw error;}
      }
    }
    var uploads=[];for(var i=0;i<Math.min(concurrency,files.length);i++)uploads.push(runner());
    ctx.runners=uploads;
    try{await Promise.all(uploads);}catch(error){if(!ctx.canceled){clearActive(group.id);delete inflightGroups[group.id];}throw ctx.canceled?canceledError():error;}
    assertActive(ctx);notifyUI(options.onUploadsComplete,[group]);

    var visiblePromises=queuedJobs.map(function(job,index){return watch(job.id,a.token,function(current){emit(index,current);},true);});
    var fullPromises=queuedJobs.map(function(job,index){return watch(job.id,a.token,function(current){emit(index,current);},false);});
    var visibleCompletion=Promise.all(visiblePromises).then(function(rows){var bad=rows.find(function(j){return j&&['failed','canceled'].indexOf(j.status)>=0;});if(bad)throw new Error(bad.error_message||'Publication échouée');return rows;});
    var fullCompletion=Promise.all(fullPromises).then(function(rows){var bad=rows.find(function(j){return j&&['failed','canceled'].indexOf(j.status)>=0;});if(bad)throw new Error(bad.error_message||'Publication échouée');clearActive(group.id);forgetGroup(group.id);delete inflightGroups[group.id];dispatch(aggregate(group,rows));return rows;}).catch(function(error){if(!ctx.canceled)clearActive(group.id);delete inflightGroups[group.id];throw error;});
    return {used:true,group:group,jobs:queuedJobs,visibleCompletion:visibleCompletion,completion:fullCompletion};
  }
  async function submit(file,options){
    options=options||{};var result=await submitMany([file],{groupId:options.groupId||options.postId,postId:options.postId,publicationType:options.publicationType||'normal',payload:options.payload||{},onGroupCreated:function(group){if(typeof options.onCreated==='function')options.onCreated({id:group.id,post_id:group.postId,publication_type:group.publicationType,status:'uploading',progress:0});},onProgress:function(detail){if(typeof options.onProgress==='function')options.onProgress(detail);}});
    if(!result||!result.used)return result;
    return {used:true,group:result.group,jobs:result.jobs,job:result.jobs[0],visibleCompletion:result.visibleCompletion.then(function(rows){return rows[0];}),completion:result.completion.then(function(rows){return rows[0];})};
  }
  async function cancel(id){
    var a=await auth(),state=null;
    // Ne pas effacer un média ou un post déjà visible / publié.
    try{state=await status(id,a.token);}catch(error){reportDiagnostic('cancel-status',error);}
    if(state&&['canceled','cancelled'].indexOf(state.status)>=0)return state;
    if(state&&(state.status==='published'||state.primary_ready===true))throw new Error('Publication déjà visible : elle ne peut pas être annulée depuis la barre de transfert.');
    var job=(await request('/api/v2/publications/'+encodeURIComponent(id)+'/cancel',{method:'POST'},a.token,30000)).body;
    if(!job||['canceled','cancelled'].indexOf(String(job.status))<0)throw new Error('Le serveur ne confirme pas l’annulation du média '+id+'.');
    rawEvent(job,job.publication_group_id||'',true);return job;
  }
  async function cancelGroup(id){
    id=clean(id||(active()&&active().id));if(!id)throw new Error('Publication introuvable.');
    var ctx=inflightGroups[id];
    if(ctx){ctx.canceled=true;ctx.waiters.forEach(function(cancel){try{cancel();}catch(_e){}});ctx.xhrs.forEach(function(xhr){try{xhr.abort();}catch(_e){}});ctx.controllers.forEach(function(controller){try{controller.abort();}catch(_e){}});}
    markCanceled(id);
    dispatch({jobId:id,groupId:id,status:'canceling',progress:0,stage:'Annulation et suppression en cours…'});
    if(ctx&&ctx.runners.length)await Promise.allSettled(ctx.runners);
    var group=readList(GROUPS_KEY).find(function(x){return x&&String(x.id)===id;});
    var ids=Array.from(new Set([].concat((group&&group.children)||[],(active()&&String(active().id)===id&&active().children)||[]).filter(Boolean)));
    var errors=[],done=[];
    if(!ids.length){
      // Aucun job créé ; aucun média serveur à supprimer.
      if(ctx){delete inflightGroups[id];}
      forgetGroup(id);clearActive(id);
      dispatch({jobId:id,groupId:id,status:'canceled',progress:0,stage:'Envoi annulé'});
      return {ok:true,canceled:0};
    }
    for(var i=0;i<ids.length;i++){
      var childId=ids[i];try{await cancel(childId);done.push(childId);}catch(error){errors.push(String(error&&error.message||error));reportDiagnostic('cancel-job',error);}
    }
    if(errors.length){
      dispatch({jobId:id,groupId:id,status:'cancel_error',progress:0,error:errors.join(' | '),stage:'Annulation non confirmée · réessayer X'});
      return {ok:false,canceled:done.length,error:errors.join(' | ')};
    }
    ids.forEach(forgetJob);forgetGroup(id);clearActive(id);delete inflightGroups[id];
    dispatch({jobId:id,groupId:id,status:'canceled',progress:0,stage:'Envoi annulé et suppression demandée au serveur'});
    return {ok:true,canceled:done.length};
  }
  function forget(id){forgetJob(id);forgetGroup(id);clearActive(id);}
  async function resumeTracking(){
    var a=active();if(!a||!a.id)return;
    if(isCanceled(a.id)){
      dispatch({jobId:a.id,groupId:a.id,postId:a.postId||'',publicationType:a.mode||'normal',status:'cancel_error',progress:0,error:'Annulation serveur en attente de confirmation.',stage:'Annulation non confirmée · appuie sur X pour réessayer'});
      return;
    }
    if(!Array.isArray(a.children)||!a.children.length)return;
    var session;try{session=await auth();}catch(_e){return;}
    var group={id:a.id,postId:a.postId||'',publicationType:a.mode||'normal',children:a.children.slice(),assetCount:a.children.length};
    var states=new Array(group.children.length).fill(null).map(function(){return {status:'processing',progress:0,primary_ready:false};});
    group.children.forEach(async function(id,index){
      try{
        var job=await status(id,session.token);if(isCanceled(group.id))return;
        if(job.status==='uploading'){
          var received=Number(job.uploaded_bytes||0),size=Number(job.size||job.total_bytes||0);
          // Sans File local, le navigateur ne peut reprendre un PATCH après actualisation.
          // Ne jamais inventer 45 %, et ne pas laisser un polling éternel.
          if(size>0&&received>=size){
            try{job=visibleJob((await request('/api/v2/publications/'+encodeURIComponent(id)+'/complete',{method:'POST'},session.token,45000)).body);}
            catch(error){reportDiagnostic('resume-complete',error);}
          }
          if(job.status==='uploading'){
            states[index]={status:'failed',progress:size>0?Math.floor(Math.min(1,received/size)*44):0,error_message:'Envoi interrompu après actualisation. Le média local doit être sélectionné à nouveau; utilise X pour annuler et nettoyer cette tentative.'};
            dispatch(aggregate(group,states));return;
          }
        }
        states[index]=mergeJobState(states[index],job);dispatch(aggregate(group,states));
        if(!terminalStatus(job.status)&&!primaryVisible(job)){
          await watch(id,session.token,function(updated){if(isCanceled(group.id))return;states[index]=mergeJobState(states[index],updated);dispatch(aggregate(group,states));},false);
        }
      }catch(error){if(isCanceled(group.id))return;states[index]={status:'failed',progress:0,error_message:'Vérification serveur impossible : '+String(error&&error.message||error)};dispatch(aggregate(group,states));}
    });
  }

  var api={version:'1165-tus-cancel-confirmed',requiredSchemaVersion:REQUIRED_SCHEMA_VERSION,requiredProtocolVersion:REQUIRED_PROTOCOL_VERSION,uploadMode:'direct-tus-binary',available:available,readinessMessage:readinessMessage,submit:submit,submitMany:submitMany,status:status,watch:watch,resumeTracking:resumeTracking,cancel:cancel,cancelGroup:cancelGroup,forget:forget};window.FyblicPublicationEngineV1082=api;window.FyblicPublicationEngineV1081=api;window.FyblicPublicationEngineV1080=api;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(resumeTracking,1000);},{once:true});else setTimeout(resumeTracking,1000);
})();
