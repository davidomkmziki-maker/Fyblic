/* Fyblic V1080 — moteur unique de publication : Normal + Story + Boutique.
   - Un seul protocole TUS direct pour tous les médias.
   - Les fichiers restent détenus par la fenêtre principale quand le module Publication se ferme.
   - Les publications multi-médias sont orchestrées comme un groupe unique avec progression agrégée.
*/
(function(){
  'use strict';
  if(window.FyblicPublicationEngineV1080)return;

  var BASE=String(window.FYBLIC_MEDIA_COMPRESSOR_URL||'https://fyblic-media-worker-production.up.railway.app').replace(/\/+$/,'');
  var JOBS_KEY='FYBLIC_PUBLICATION_JOBS_V1080';
  var GROUPS_KEY='FYBLIC_PUBLICATION_GROUPS_V1080';
  var ACTIVE_KEY='FYBLIC_ACTIVE_PUBLICATION_V1067R1';
  var REQUIRED_SCHEMA_VERSION=1080;
  var REQUIRED_PROTOCOL_VERSION=1080;
  var DIRECT_TUS_CHUNK=6*1024*1024;
  var healthCache={at:0,value:false,detail:null};
  var watchers={};

  function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  function clean(v){return String(v==null?'':v).trim();}
  function uid(){try{return crypto.randomUUID();}catch(_e){return 'g_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);}}
  function publicError(value){
    var m=clean(value);
    if(!m)return 'Publication impossible. Réessaie.';
    if(/requested file could not be read|permission problems|reference to a file|notreadableerror|file.*could not be read/i.test(m))return 'Le téléphone a interrompu l’accès au média. Sélectionne-le puis réessaie.';
    if(/supabase|23502|failing row|violates|constraint|postgres|pgrst|sql/i.test(m))return 'La publication n’a pas pu être enregistrée. Réessaie après la mise à jour.';
    return m.slice(0,160);
  }
  function client(){try{return window.HappySupabaseClientMasterV972?window.HappySupabaseClientMasterV972.get():(window.happyadSupabase||null);}catch(_e){return null;}}
  async function auth(){var c=client();if(!c)throw new Error('Session Fyblic indisponible');var r=await c.auth.getSession(),s=r&&r.data&&r.data.session;if(!s||!s.access_token||!s.user)throw new Error('Session Fyblic expirée');return {token:s.access_token,user:s.user};}
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
  function visibleJob(job){if(!job||typeof job!=='object')return job;var copy=Object.assign({},job);copy.stage=publicStage(copy);return copy;}
  function active(){try{var value=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');return value&&value.id?value:null;}catch(_e){return null;}}
  function activateGroup(group){try{localStorage.setItem(ACTIVE_KEY,JSON.stringify({id:group.id,postId:group.postId||'',mode:group.publicationType||'normal',children:(group.children||[]).slice(),at:Date.now()}));}catch(_e){}}
  function updateActiveChildren(group){var a=active();if(!a||String(a.id)!==String(group.id))return;try{a.children=(group.children||[]).slice();localStorage.setItem(ACTIVE_KEY,JSON.stringify(a));}catch(_e){}}
  function clearActive(id){var a=active();if(a&&String(a.id)===String(id||'')){try{localStorage.removeItem(ACTIVE_KEY);}catch(_e){}}}
  function rememberJob(job,groupId){if(!job||!job.id)return;var list=readList(JOBS_KEY).filter(function(x){return x&&x.id!==job.id;});list.unshift({id:job.id,groupId:groupId||job.publication_group_id||'',postId:job.post_id||'',publicationType:job.publication_type||'',status:job.status||'uploading',primaryReady:job.primary_ready===true,progress:Number(job.progress||0),stage:job.stage||'',createdAt:job.created_at||new Date().toISOString(),updatedAt:Date.now()});writeList(JOBS_KEY,list,60);}
  function rememberGroup(group){if(!group||!group.id)return;var list=readList(GROUPS_KEY).filter(function(x){return x&&x.id!==group.id;});list.unshift({id:group.id,postId:group.postId||'',publicationType:group.publicationType||'',children:(group.children||[]).slice(),assetCount:Number(group.assetCount||0),createdAt:group.createdAt||new Date().toISOString(),updatedAt:Date.now()});writeList(GROUPS_KEY,list,20);}
  function forgetGroup(id){writeList(GROUPS_KEY,readList(GROUPS_KEY).filter(function(x){return x&&String(x.id)!==String(id||'');}),20);}
  function forgetJob(id){writeList(JOBS_KEY,readList(JOBS_KEY).filter(function(x){return x&&String(x.id)!==String(id||'');}),60);}
  function dispatch(detail){
    detail=detail||{};
    try{window.dispatchEvent(new CustomEvent('FYBLIC_PUBLICATION_PROGRESS_V2',{detail:detail}));}catch(_e){}
    try{if(window.parent&&window.parent!==window)window.parent.postMessage({type:'FYBLIC_PUBLICATION_PROGRESS_V2',detail:detail},'*');}catch(_e2){}
  }
  function rawEvent(job,groupId,emit){
    if(!job)return;rememberJob(job,groupId);
    if(emit===false)return;
    dispatch({jobId:job.id,groupId:groupId||job.publication_group_id||'',postId:job.post_id||'',publicationType:job.publication_type||'',status:job.status||'',primaryReady:job.primary_ready===true,progress:Number(job.progress||0),stage:publicStage(job),error:publicError(job.error_message||''),result:job.result||null});
  }
  async function available(force){
    if(!force&&Date.now()-healthCache.at<30000)return healthCache.value;
    try{
      var r=await request('/health',{},'',10000),p=r.body&&r.body.pipelineV2||{};
      var caps=p.capabilities||{};
      var ok=!!(r.body&&r.body.ok&&p.enabled&&p.ready&&p.schemaReady&&Number(p.schemaVersion||0)>=REQUIRED_SCHEMA_VERSION&&Number(p.protocolVersion||0)>=REQUIRED_PROTOCOL_VERSION&&p.uploadMode==='direct-tus-binary'&&caps.normal===true&&caps.story===true&&caps.boutique===true&&caps.album===true&&caps.groupAssets===true&&caps.groupFinalize===true);
      healthCache={at:Date.now(),value:ok,detail:p};return ok;
    }catch(error){healthCache={at:Date.now(),value:false,detail:{schemaError:error&&error.message||'Service média indisponible'}};return false;}
  }
  function readinessMessage(){var d=healthCache.detail||{},e=clean(d.schemaError);if(Number(d.schemaVersion||0)<REQUIRED_SCHEMA_VERSION||/1080|migration|schema|schéma/i.test(e))return 'Mise à jour SQL V1080 requise avant de publier.';if(Number(d.protocolVersion||0)<REQUIRED_PROTOCOL_VERSION||d.uploadMode!=='direct-tus-binary')return 'Mise à jour du worker V1080 requise avant de publier.';if(e)return publicError(e);return 'Système de publication momentanément indisponible.';}
  function directHeaders(upload,token,extra){var h=Object.assign({'Tus-Resumable':clean(upload&&upload.tusVersion)||'1.0.0',apikey:clean(upload&&upload.apiKey||window.HAPPYAD_SUPABASE_KEY)},extra||{});if(token)h.Authorization='Bearer '+token;return h;}
  async function directFetch(url,options,timeoutMs){var controller=typeof AbortController!=='undefined'?new AbortController():null,timer=null;options=Object.assign({},options||{});if(controller){options.signal=controller.signal;timer=setTimeout(function(){controller.abort();},timeoutMs||600000);}try{return await fetch(url,options);}catch(error){if(error&&error.name==='AbortError')throw new Error('Le morceau a dépassé le délai réseau');throw error;}finally{if(timer)clearTimeout(timer);}}
  async function tusOffset(upload,token){var response=await directFetch(upload.url,{method:'HEAD',headers:directHeaders(upload,token)},120000);if(!response.ok){var e=new Error('Reprise directe refusée ('+response.status+')');e.status=response.status;throw e;}var offset=Number(response.headers.get('Upload-Offset'));if(!Number.isSafeInteger(offset)||offset<0)throw new Error('Position de reprise invalide');return offset;}
  async function uploadDirect(file,created,currentAuth,onProgress){
    var upload=created&&created.upload;if(!upload||upload.mode!=='direct-binary'||!/^https:\/\//i.test(clean(upload.url)))throw new Error('Session d’envoi direct V1080 absente');
    var token=currentAuth.token,offset=await tusOffset(upload,token),retries=0,chunkBytes=Number(upload.chunkBytes||DIRECT_TUS_CHUNK);if(!Number.isSafeInteger(chunkBytes)||chunkBytes<=0)chunkBytes=DIRECT_TUS_CHUNK;
    while(offset<file.size){
      var end=Math.min(offset+chunkBytes,file.size),blob=file.slice(offset,end);
      try{
        var response=await directFetch(upload.url,{method:'PATCH',headers:directHeaders(upload,token,{'Upload-Offset':String(offset),'Content-Type':'application/offset+octet-stream'}),body:blob},600000);
        if(!response.ok){var rejected=new Error('Envoi direct refusé ('+response.status+')');rejected.status=response.status;throw rejected;}
        var next=Number(response.headers.get('Upload-Offset'));if(!Number.isSafeInteger(next)||next<=offset||next>end)throw new Error('Confirmation directe incohérente');
        offset=next;retries=0;
        var uploadState=Object.assign({},created,{status:'uploading',uploaded_bytes:offset,progress:Math.max(1,Math.min(44,Math.round(offset/file.size*44))),stage:'Envoi du média'});
        if(onProgress)onProgress(uploadState);
      }catch(error){
        retries++;if(retries>12)throw new Error('Envoi interrompu après 12 reprises automatiques');
        if(error&&(error.status===401||error.status===403)){try{currentAuth=await auth();token=currentAuth.token;}catch(_authError){}}
        try{offset=await tusOffset(upload,token);}catch(_offsetError){}
        await sleep(Math.min(10000,retries*900));
      }
    }
    return offset;
  }
  function fingerprint(file){return [file.name||'media',file.size||0,file.lastModified||0,file.type||''].join(':');}
  async function status(id,token){return visibleJob((await request('/api/v2/publications/'+id,{},token,30000)).body);}
  function primaryVisible(job){return !!(job&&job.primary_ready===true&&(job.publication_type!=='album'||(job.result&&job.result.group_visible===true)));}
  async function watch(id,token,onProgress,untilPrimary){
    var key=id+'::'+(untilPrimary?'primary':'final');if(watchers[key])return watchers[key];
    watchers[key]=(async function(){try{for(;;){var job=await status(id,token);rememberJob(job,job.publication_group_id||'');if(onProgress)onProgress(job);if(['failed','canceled'].indexOf(job.status)>=0)return job;if(untilPrimary&&primaryVisible(job))return job;if(job.status==='published'&&(!untilPrimary||job.publication_type!=='album'||(job.result&&job.result.group_visible===true)))return job;await sleep(job.status==='uploading'?2200:1000);}}finally{delete watchers[key];}})();
    return watchers[key];
  }
  async function createAndUpload(file,options,currentAuth,onProgress){
    var created=visibleJob((await request('/api/v2/publications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      filename:file.name||'media',size:file.size,mime:file.type||'application/octet-stream',kind:options.kind||'photo',publicationType:options.publicationType||'normal',postId:options.postId,payload:options.payload||{},fingerprint:fingerprint(file),groupId:options.groupId||options.postId,assetIndex:options.assetIndex||0,assetCount:options.assetCount||1
    })},currentAuth.token,45000)).body);
    rememberJob(created,options.groupId||'');
    if(typeof options.onCreated==='function')options.onCreated(created);
    if(created.primary_ready===true||created.status==='published')return created;
    if(created.status==='uploading'){
      await uploadDirect(file,created,currentAuth,function(job){rememberJob(job,options.groupId||'');if(onProgress)onProgress(job);});
      created=visibleJob((await request('/api/v2/publications/'+created.id+'/complete',{method:'POST'},currentAuth.token,45000)).body);
      rememberJob(created,options.groupId||'');if(onProgress)onProgress(created);
    }
    return created;
  }
  function kindOf(file){return /^video\//i.test(clean(file&&file.type))?'video':'photo';}
  function aggregate(group,states){
    var count=states.length||1,total=0,allPrimary=true,allPublished=true,failed=null,canceled=false,anyUploading=false;
    states.forEach(function(job){job=job||{};total+=Math.max(0,Math.min(100,Number(job.progress||0)));if(!primaryVisible(job))allPrimary=false;if(job.status!=='published')allPublished=false;if(job.status==='failed'&&!failed)failed=job;if(job.status==='canceled')canceled=true;if(job.status==='uploading')anyUploading=true;});
    var progress=Math.round(total/count),status=failed?'failed':canceled?'canceled':allPublished?'published':(allPrimary?'optimizing':(anyUploading?'uploading':'processing'));
    return {jobId:group.id,groupId:group.id,postId:group.postId||'',publicationType:group.publicationType||'normal',status:status,primaryReady:allPrimary,progress:progress,stage:failed?'Échec':canceled?'Publication annulée':allPublished?'Publication terminée':allPrimary?'Publication visible · optimisation':anyUploading?'Envoi du média':'Publication en cours',error:failed?publicError(failed.error_message||failed.error||''):''};
  }
  async function submitMany(files,options){
    options=options||{};files=Array.prototype.slice.call(files||[]).filter(Boolean);if(!files.length)throw new Error('Média absent');
    if(options.publicationType==='story'&&files.length!==1)throw new Error('Une Story accepte un seul média.');
    if(!(await available(true)))return {used:false,reason:'engine-v1080-unavailable'};
    var a=await auth();
    var group={id:clean(options.groupId)||('pub_'+uid().replace(/-/g,'')),postId:clean(options.postId)||('p_'+uid().replace(/-/g,'')),publicationType:clean(options.publicationType)||'normal',assetCount:files.length,children:[],createdAt:new Date().toISOString()};
    rememberGroup(group);activateGroup(group);
    var states=new Array(files.length).fill(null).map(function(){return {status:'uploading',progress:0,primary_ready:false};});
    var queuedJobs=new Array(files.length);
    function emit(index,job){states[index]=Object.assign({},states[index]||{},job||{});var d=aggregate(group,states);dispatch(d);if(typeof options.onProgress==='function')options.onProgress(d,states.slice());}
    dispatch(aggregate(group,states));
    if(typeof options.onGroupCreated==='function')options.onGroupCreated(group);

    var cursor=0,concurrency=Math.max(1,Math.min(Number(options.uploadConcurrency||2)||2,3));
    async function runner(){
      for(;;){
        var index=cursor++;if(index>=files.length)return;
        var file=files[index],postId=typeof options.postIdForAsset==='function'?options.postIdForAsset(index,file):((files.length===1)?group.postId:(group.postId+'_'+(index+1)));
        var payload=typeof options.payloadForAsset==='function'?options.payloadForAsset(index,file):(options.payload||{});
        try{
          var queued=await createAndUpload(file,{kind:kindOf(file),publicationType:group.publicationType==='normal'&&files.length>1?'album':group.publicationType,postId:postId,payload:payload,groupId:group.id,assetIndex:index,assetCount:files.length,onCreated:function(job){if(job&&job.id&&group.children.indexOf(job.id)<0){group.children.push(job.id);rememberGroup(group);updateActiveChildren(group);}emit(index,job);}},a,function(job){emit(index,job);});
          queuedJobs[index]=queued;emit(index,queued);
        }catch(error){states[index]=Object.assign({},states[index],{status:'failed',error_message:error&&error.message||String(error)});emit(index,states[index]);throw error;}
      }
    }
    var uploads=[];for(var i=0;i<Math.min(concurrency,files.length);i++)uploads.push(runner());
    try{await Promise.all(uploads);}catch(error){clearActive(group.id);throw error;}

    var visiblePromises=queuedJobs.map(function(job,index){return watch(job.id,a.token,function(current){emit(index,current);},true);});
    var fullPromises=queuedJobs.map(function(job,index){return watch(job.id,a.token,function(current){emit(index,current);},false);});
    var visibleCompletion=Promise.all(visiblePromises).then(function(rows){var bad=rows.find(function(j){return j&&['failed','canceled'].indexOf(j.status)>=0;});if(bad)throw new Error(bad.error_message||'Publication échouée');return rows;});
    var fullCompletion=Promise.all(fullPromises).then(function(rows){var bad=rows.find(function(j){return j&&['failed','canceled'].indexOf(j.status)>=0;});if(bad)throw new Error(bad.error_message||'Publication échouée');clearActive(group.id);forgetGroup(group.id);dispatch(aggregate(group,rows));return rows;}).catch(function(error){clearActive(group.id);throw error;});
    return {used:true,group:group,jobs:queuedJobs,visibleCompletion:visibleCompletion,completion:fullCompletion};
  }
  async function submit(file,options){
    options=options||{};var result=await submitMany([file],{groupId:options.groupId||options.postId,postId:options.postId,publicationType:options.publicationType||'normal',payload:options.payload||{},onGroupCreated:function(group){if(typeof options.onCreated==='function')options.onCreated({id:group.id,post_id:group.postId,publication_type:group.publicationType,status:'uploading',progress:1});},onProgress:function(detail){if(typeof options.onProgress==='function')options.onProgress(detail);}});
    if(!result||!result.used)return result;
    return {used:true,group:result.group,jobs:result.jobs,job:result.jobs[0],visibleCompletion:result.visibleCompletion.then(function(rows){return rows[0];}),completion:result.completion.then(function(rows){return rows[0];})};
  }
  async function cancel(id){var a=await auth(),job=(await request('/api/v2/publications/'+id+'/cancel',{method:'POST'},a.token,30000)).body;rawEvent(job,job.publication_group_id||'',true);return job;}
  function forget(id){forgetJob(id);forgetGroup(id);clearActive(id);}
  async function resumeTracking(){
    var a=active();if(!a||!a.id||!Array.isArray(a.children)||!a.children.length)return;
    var session;try{session=await auth();}catch(_e){return;}
    var group={id:a.id,postId:a.postId||'',publicationType:a.mode||'normal',children:a.children.slice(),assetCount:a.children.length};
    var states=new Array(group.children.length).fill(null).map(function(){return {status:'processing',progress:45,primary_ready:false};});
    group.children.forEach(function(id,index){watch(id,session.token,function(job){states[index]=job;dispatch(aggregate(group,states));},false).catch(function(error){states[index]={status:'failed',progress:Number(states[index]&&states[index].progress||45),error_message:error.message};dispatch(aggregate(group,states));});});
  }

  window.FyblicPublicationEngineV1080={version:'1080.0',requiredSchemaVersion:REQUIRED_SCHEMA_VERSION,requiredProtocolVersion:REQUIRED_PROTOCOL_VERSION,uploadMode:'direct-tus-binary',available:available,readinessMessage:readinessMessage,submit:submit,submitMany:submitMany,status:status,watch:watch,resumeTracking:resumeTracking,cancel:cancel,forget:forget};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(resumeTracking,1000);},{once:true});else setTimeout(resumeTracking,1000);
})();
