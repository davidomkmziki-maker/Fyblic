(function(){
  'use strict';
  if(window.FyblicPublicationPipelineV2)return;

  var BASE=String(window.FYBLIC_MEDIA_COMPRESSOR_URL||'https://fyblic-media-worker-production.up.railway.app').replace(/\/+$/,'');
  var JOBS_KEY='FYBLIC_PUBLICATION_JOBS_V2';
  var ACTIVE_KEY='FYBLIC_ACTIVE_PUBLICATION_V1067R1';
  var REQUIRED_SCHEMA_VERSION=1071;
  var REQUIRED_PROTOCOL_VERSION=1072;
  var DIRECT_TUS_CHUNK=6*1024*1024;
  var healthCache={at:0,value:false,detail:null};
  var watchers={};

  function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  function publicError(value){
    var m=String(value||'').trim();
    if(!m)return 'Publication impossible. Réessaie.';
    if(/requested file could not be read|permission problems|reference to a file|notreadableerror|file.*could not be read/i.test(m))return 'Le téléphone a interrompu l’accès au média. Sélectionne-le puis réessaie.';
    if(/supabase|23502|failing row|violates|constraint|postgres|pgrst|sql/i.test(m))return 'La publication n’a pas pu être enregistrée. Réessaie après la mise à jour.';
    return m.slice(0,140);
  }
  function client(){try{return window.HappySupabaseClientMasterV972?window.HappySupabaseClientMasterV972.get():(window.happyadSupabase||null);}catch(_e){return null;}}
  async function auth(){var c=client();if(!c)throw new Error('Session Fyblic indisponible');var r=await c.auth.getSession(),s=r&&r.data&&r.data.session;if(!s||!s.access_token||!s.user)throw new Error('Session Fyblic expirée');return {token:s.access_token,user:s.user};}
  function headers(token,extra){var h=Object.assign({},extra||{});if(token)h.Authorization='Bearer '+token;return h;}
  async function request(path,options,token,timeoutMs){
    options=Object.assign({},options||{});options.headers=headers(token,options.headers);
    var controller=typeof AbortController!=='undefined'?new AbortController():null,timer=null;
    if(controller){options.signal=controller.signal;timer=setTimeout(function(){controller.abort();},timeoutMs||45000);}
    try{
      var response=await fetch(BASE+path,options);
      if(!response.ok){var body=await response.json().catch(function(){return {};});var e=new Error(body.error||('Service média indisponible ('+response.status+')'));e.status=response.status;e.response=response;throw e;}
      if(response.status===204)return {body:null,response:response};
      return {body:await response.json(),response:response};
    }catch(error){if(error&&error.name==='AbortError')throw new Error('Délai réseau dépassé');throw error;}finally{if(timer)clearTimeout(timer);}
  }
  function readJobs(){try{var v=JSON.parse(localStorage.getItem(JOBS_KEY)||'[]');return Array.isArray(v)?v:[];}catch(_e){return [];}}
  function writeJobs(list){try{localStorage.setItem(JOBS_KEY,JSON.stringify((list||[]).slice(0,20)));}catch(_e){}}
  function publicStage(job){var status=String(job&&job.status||'');if(status==='uploading')return 'Envoi du média';if(status==='failed')return 'Échec';if(status==='canceled')return 'Publication annulée';if(status==='published')return 'Publication terminée';return 'Publication en cours';}
  function visibleJob(job){if(!job||typeof job!=='object')return job;var copy=Object.assign({},job);copy.stage=publicStage(copy);return copy;}
  function activeJob(){try{var value=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');return value&&value.id?value:null;}catch(_e){return null;}}
  function activate(job,options){
    if(!job||!job.id)return;
    try{localStorage.setItem(ACTIVE_KEY,JSON.stringify({id:String(job.id),postId:String(job.post_id||job.postId||options&&options.postId||''),mode:String(options&&options.publicationType||job.publication_type||job.publicationType||'normal'),at:Date.now()}));}catch(_e){}
  }
  function clearActive(id){var active=activeJob();if(active&&String(active.id)===String(id||'')){try{localStorage.removeItem(ACTIVE_KEY);}catch(_e){}}}
  function remember(job){if(!job||!job.id)return;var list=readJobs().filter(function(x){return x&&x.id!==job.id;});list.unshift({id:job.id,postId:job.post_id||job.postId||'',status:job.status||'uploading',primaryReady:job.primary_ready===true,progress:Number(job.progress||0),stage:job.stage||'',createdAt:job.created_at||new Date().toISOString(),updatedAt:Date.now()});writeJobs(list);}
  function forget(id){writeJobs(readJobs().filter(function(x){return x&&x.id!==id;}));}
  function event(job){
    if(!job)return;
    remember(job);
    var detail={jobId:job.id,postId:job.post_id||job.postId||'',publicationType:job.publication_type||job.publicationType||'',status:job.status||'',primaryReady:job.primary_ready===true,progress:Number(job.progress||0),stage:publicStage(job),error:publicError(job.error_message||''),result:job.result||null};
    try{window.dispatchEvent(new CustomEvent('FYBLIC_PUBLICATION_PROGRESS_V2',{detail:detail}));}catch(_e){}
    try{if(window.parent&&window.parent!==window)window.parent.postMessage({type:'FYBLIC_PUBLICATION_PROGRESS_V2',detail:detail},'*');}catch(_e2){}
    if(detail.status==='failed'||detail.status==='canceled'){forget(job.id);clearActive(job.id);}
    else if(detail.status==='published'){clearActive(job.id);setTimeout(function(){forget(job.id);},1000);}
  }
  async function available(force){
    if(!force&&Date.now()-healthCache.at<30000)return healthCache.value;
    try{
      var r=await request('/health',{},'',10000),p=r.body&&r.body.pipelineV2||{};
      var v=!!(r.body&&r.body.ok&&p.enabled&&p.ready&&p.schemaReady&&Number(p.schemaVersion||0)>=REQUIRED_SCHEMA_VERSION&&Number(p.protocolVersion||0)>=REQUIRED_PROTOCOL_VERSION&&p.uploadMode==='direct-tus-binary'&&p.capabilities&&p.capabilities.normal===true&&p.capabilities.story===true&&p.capabilities.boutique===true);
      healthCache={at:Date.now(),value:v,detail:p};return v;
    }catch(error){healthCache={at:Date.now(),value:false,detail:{schemaError:error&&error.message||'Service média indisponible'}};return false;}
  }
  function readinessMessage(){var d=healthCache.detail||{},e=String(d.schemaError||'');if(Number(d.schemaVersion||0)<REQUIRED_SCHEMA_VERSION||/1071|migration|schema|schéma/i.test(e))return 'Mise à jour SQL V1071 requise avant de publier.';if(Number(d.protocolVersion||0)<REQUIRED_PROTOCOL_VERSION||d.uploadMode!=='direct-tus-binary')return 'Mise à jour du worker V1072 requise avant de publier.';if(e)return publicError(e);return 'Système de publication momentanément indisponible.';}
  function directHeaders(upload,token,extra){var h=Object.assign({'Tus-Resumable':String(upload&&upload.tusVersion||'1.0.0'),apikey:String(upload&&upload.apiKey||window.HAPPYAD_SUPABASE_KEY||'')},extra||{});if(token)h.Authorization='Bearer '+token;return h;}
  async function directFetch(url,options,timeoutMs){
    var controller=typeof AbortController!=='undefined'?new AbortController():null,timer=null;
    options=Object.assign({},options||{});if(controller){options.signal=controller.signal;timer=setTimeout(function(){controller.abort();},timeoutMs||600000);}
    try{return await fetch(url,options);}catch(error){if(error&&error.name==='AbortError')throw new Error('Le morceau a dépassé le délai réseau');throw error;}finally{if(timer)clearTimeout(timer);}
  }
  async function tusOffset(upload,token){
    var response=await directFetch(upload.url,{method:'HEAD',headers:directHeaders(upload,token)},120000);
    if(!response.ok){var error=new Error('Reprise directe refusée ('+response.status+')');error.status=response.status;throw error;}
    var offset=Number(response.headers.get('Upload-Offset'));
    if(!Number.isSafeInteger(offset)||offset<0)throw new Error('Position de reprise invalide');
    return offset;
  }
  async function uploadDirect(file,created,currentAuth,options){
    var upload=created&&created.upload;if(!upload||upload.mode!=='direct-binary'||!/^https:\/\//i.test(String(upload.url||'')))throw new Error('Session d’envoi direct V1070 absente');
    var token=currentAuth.token,offset=await tusOffset(upload,token),retries=0,chunkBytes=Number(upload.chunkBytes||DIRECT_TUS_CHUNK);
    if(!Number.isSafeInteger(chunkBytes)||chunkBytes<=0)chunkBytes=DIRECT_TUS_CHUNK;
    while(offset<file.size){
      var end=Math.min(offset+chunkBytes,file.size),blob=file.slice(offset,end);
      try{
        var response=await directFetch(upload.url,{method:'PATCH',headers:directHeaders(upload,token,{'Upload-Offset':String(offset),'Content-Type':'application/offset+octet-stream'}),body:blob},600000);
        if(!response.ok){var rejected=new Error('Envoi direct refusé ('+response.status+')');rejected.status=response.status;throw rejected;}
        var next=Number(response.headers.get('Upload-Offset'));
        if(!Number.isSafeInteger(next)||next<=offset||next>end)throw new Error('Confirmation directe incohérente');
        offset=next;retries=0;
        var uploadState=Object.assign({},created,{status:'uploading',uploaded_bytes:offset,progress:Math.max(1,Math.min(44,Math.round(offset/file.size*44))),stage:'Envoi direct du média'});event(uploadState);if(options.onProgress)options.onProgress(uploadState);
      }catch(error){
        retries++;
        if(retries>12)throw new Error('Envoi direct interrompu après 12 reprises automatiques');
        if(error&&(error.status===401||error.status===403)){try{currentAuth=await auth();token=currentAuth.token;}catch(_authError){}}
        try{offset=await tusOffset(upload,token);}catch(_offsetError){}
        await sleep(Math.min(10000,retries*900));
      }
    }
    return offset;
  }
  function fingerprint(file){return [file.name||'media',file.size||0,file.lastModified||0,file.type||''].join(':');}
  async function status(id,token){return visibleJob((await request('/api/v2/publications/'+id,{},token,30000)).body);}
  async function watch(id,token,onProgress){
    if(watchers[id])return watchers[id];
    watchers[id]=(async function(){
      try{
        for(;;){
          var job=await status(id,token);event(job);if(onProgress)onProgress(job);
          if(['published','failed','canceled'].indexOf(job.status)>=0)return job;
          await sleep(job.status==='uploading'?2500:1200);
        }
      }finally{delete watchers[id];}
    })();
    return watchers[id];
  }
  async function submit(file,options){
    options=options||{};
    if(!file)throw new Error('Média absent');
    if(!(await available(true)))return {used:false,reason:'pipeline-v2-unavailable'};
    var a=await auth();
    var created=visibleJob((await request('/api/v2/publications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      filename:file.name||'media',size:file.size,mime:file.type||'application/octet-stream',kind:options.kind||'photo',publicationType:options.publicationType||'normal',postId:options.postId,payload:options.payload||{},fingerprint:fingerprint(file)
    })},a.token,45000)).body);
    activate(created,options);remember(created);event(created);
    if(typeof options.onCreated==='function')options.onCreated(created);
    if(created.primary_ready===true||created.status==='published'){return {used:true,job:created,completion:Promise.resolve(created)};}
    if(created.status!=='uploading'){
      var existingCompletion=watch(created.id,a.token,options.onProgress).catch(function(error){event({id:created.id,post_id:options.postId,status:'failed',progress:Number(created.progress||45),stage:'Échec',error_message:error.message});throw error;});
      return {used:true,job:created,completion:existingCompletion};
    }
    await uploadDirect(file,created,a,options);
    var queued=visibleJob((await request('/api/v2/publications/'+created.id+'/complete',{method:'POST'},a.token,45000)).body);
    event(queued);if(options.onProgress)options.onProgress(queued);
    var completion=watch(created.id,a.token,options.onProgress).catch(function(error){event({id:created.id,post_id:options.postId,status:'failed',progress:45,stage:'Échec',error_message:error.message});throw error;});
    return {used:true,job:queued,completion:completion};
  }
  async function resumeTracking(){
    var now=Date.now(),active=activeJob(),jobs=readJobs().filter(function(j){
      if(!j||!j.id||['published','failed','canceled'].indexOf(j.status)>=0)return false;
      var age=now-(Number(j.updatedAt)||Date.parse(j.createdAt||'')||now);
      /* Après un rechargement, un upload resté au tout début ne possède plus le File
         Android nécessaire pour envoyer les morceaux restants. Ne jamais ressusciter
         indéfiniment une ancienne ligne à 1 %. Les tâches déjà remises au serveur
         (queued/processing/finalizing) restent, elles, suivies normalement. */
      /* Un upload interrompu ne peut pas reprendre sans l'objet File Android.
         Seule la page qui possède encore ce File envoie ses morceaux et ses événements. */
      if(String(j.status)==='uploading')return false;
      if(age>24*60*60*1000)return false;
      if(active&&active.id&&String(j.id)!==String(active.id))return false;
      return true;
    });
    if(!active&&jobs.length>1)jobs.sort(function(a,b){return Number(b.updatedAt||0)-Number(a.updatedAt||0);}).splice(1);
    writeJobs(jobs);if(!jobs.length)return;
    var a;try{a=await auth();}catch(_e){return;}
    jobs.forEach(function(job){watch(job.id,a.token).catch(function(){});});
  }
  async function cancel(id){var a=await auth(),job=(await request('/api/v2/publications/'+id+'/cancel',{method:'POST'},a.token,30000)).body;event(job);return job;}

  window.FyblicPublicationPipelineV2={version:'1072.0',requiredSchemaVersion:REQUIRED_SCHEMA_VERSION,requiredProtocolVersion:REQUIRED_PROTOCOL_VERSION,uploadMode:'direct-tus-binary',available:available,readinessMessage:readinessMessage,submit:submit,status:status,watch:watch,resumeTracking:resumeTracking,cancel:cancel,forget:forget};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(resumeTracking,1000);},{once:true});else setTimeout(resumeTracking,1000);
})();
