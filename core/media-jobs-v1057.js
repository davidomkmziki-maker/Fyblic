/* Fyblic V1058 — pipeline média lourd direct vers le worker, reprenable et persistant. */
(function(){
  'use strict';
  if(window.FyblicMediaJobsV1058)return;
  var WORKER=String(window.FYBLIC_MEDIA_COMPRESSOR_URL||'https://fyblic-media-worker-production.up.railway.app').replace(/\/+$/,'');
  var MAX_BYTES=1100000000,MAX_SECONDS=900,CHUNK_BYTES=5*1024*1024;
  var JOBS_KEY='FYBLIC_MEDIA_JOBS_V1058',UPLOAD_PREFIX='FYBLIC_MEDIA_UPLOAD_V1058:';
  var jobs=new Map(),files=new Map(),running=new Set(),strip=null;
  function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  function client(){try{return window.HappySupabaseClientMasterV972&&window.HappySupabaseClientMasterV972.get();}catch(_e){return null;}}
  async function auth(){
    var c=client();if(!c&&window.happyadEnsureSupabaseClientV972)c=await window.happyadEnsureSupabaseClientV972({});
    if(!c)throw new Error('Service Fyblic indisponible');
    var result=await c.auth.getSession(),session=result&&result.data&&result.data.session;
    if(!session||Number(session.expires_at||0)*1000-Date.now()<90000){result=await c.auth.refreshSession();session=result&&result.data&&result.data.session;}
    if(!session||!session.access_token||!session.user)throw new Error('Session expirée : reconnecte-toi');
    return session;
  }
  function cleanError(error){return String(error&&error.message||error||'Échec de publication').slice(0,500);}
  function retryable(error){return /fetch|network|timeout|aborted|délai|hors ligne|connexion|socket|HTTP (408|409|423|425|429|5\d\d)/i.test(cleanError(error));}
  function fingerprint(file,userId){return [userId,file.name,file.size,file.lastModified].join(':');}
  function persist(){try{localStorage.setItem(JOBS_KEY,JSON.stringify(Array.from(jobs.values()).filter(function(j){return j&&!['published','cancelled'].includes(j.status);}).slice(-20)));}catch(_e){}}
  function restore(){try{var list=JSON.parse(localStorage.getItem(JOBS_KEY)||'[]');(Array.isArray(list)?list:[]).forEach(function(job){if(job&&job.id)jobs.set(job.id,job);});}catch(_e){}}
  async function request(path,options,timeoutMs){
    var session=await auth(),controller=typeof AbortController!=='undefined'?new AbortController():null,timer=0;
    options=Object.assign({},options||{});options.headers=Object.assign({},options.headers||{},{Authorization:'Bearer '+session.access_token});
    if(controller){options.signal=controller.signal;timer=setTimeout(function(){controller.abort();},timeoutMs||45000);}
    try{var response=await fetch(WORKER+path,options),body=response.status===204?null:await response.json().catch(function(){return {};});if(!response.ok){var error=new Error(body&&body.error||('HTTP '+response.status));error.status=response.status;throw error;}return body;}
    finally{if(timer)clearTimeout(timer);}
  }
  function ensureStrip(){
    if(strip&&strip.isConnected)return strip;strip=document.getElementById('fyblicMediaJobsStripV1055');
    if(!strip){strip=document.createElement('section');strip.id='fyblicMediaJobsStripV1055';strip.setAttribute('aria-live','polite');strip.innerHTML='<div class="fyblicJobMetaV1055"><span class="fyblicJobLabelV1055">Publication en cours</span><button class="fyblicJobRetryV1055" type="button">Réessayer</button><span class="fyblicJobPercentV1055">0%</span></div><div class="fyblicJobTrackV1055"><div class="fyblicJobFillV1055"></div></div>';strip.querySelector('.fyblicJobRetryV1055').onclick=function(){var id=strip.dataset.jobId||'';if(id)void retry(id);};}
    var radar=document.getElementById('homeRadarStoryMasterV629')||document.querySelector('.radarBlock'),list=document.getElementById('list');
    if(radar&&radar.parentNode){if(radar.nextSibling!==strip)radar.parentNode.insertBefore(strip,radar.nextSibling);}else if(list&&strip.parentNode!==list)list.insertBefore(strip,list.firstChild);return strip;
  }
  function bestJob(){return Array.from(jobs.values()).filter(function(j){return j&&!['published','cancelled'].includes(j.status);}).sort(function(a,b){return Number(b.createdAt||0)-Number(a.createdAt||0);})[0]||null;}
  function render(){
    var el=ensureStrip(),job=bestJob();if(!job){el.className='';el.dataset.jobId='';return;}
    var failed=job.status==='failed',p=Math.max(0,Math.min(100,Number(job.uiProgress||job.progress||0)));
    el.className='on'+(failed?' failed':'')+(failed&&job.retryable?' retryable':'');el.dataset.jobId=job.id;
    el.querySelector('.fyblicJobLabelV1055').textContent=failed?'Échec de la publication':'Publication en cours';el.querySelector('.fyblicJobPercentV1055').textContent=failed?'Échec':Math.round(p)+'%';el.querySelector('.fyblicJobFillV1055').style.width=(failed?100:p)+'%';
  }
  function setJob(job){if(!job||!job.id)return;jobs.set(job.id,job);persist();render();}
  function finish(job){
    jobs.delete(job.id);files.delete(job.id);running.delete(job.id);persist();render();
    try{localStorage.setItem('HAPPYAD_HOME_REFRESH_NEEDED','1');localStorage.setItem('HAPPYAD_PROFILE_REFRESH_NEEDED',String(Date.now()));window.dispatchEvent(new CustomEvent('fyblic:media-published',{detail:{jobId:job.id,postId:job.postId}}));}catch(_e){}
    [0,500,1500,3000].forEach(function(ms){setTimeout(function(){try{if(typeof window.happyadRefreshHomePostsNow==='function')window.happyadRefreshHomePostsNow('publish-media-v1058');}catch(_e){}},ms);});
  }
  async function readDuration(file){
    return new Promise(function(resolve,reject){var url=URL.createObjectURL(file),video=document.createElement('video'),settled=false,timer=setTimeout(function(){done(new Error('Durée vidéo illisible'));},20000);function done(error){if(settled)return;settled=true;clearTimeout(timer);try{URL.revokeObjectURL(url);}catch(_e){}video.removeAttribute('src');if(error)reject(error);else resolve(Number(video.duration||0));}video.preload='metadata';video.onloadedmetadata=function(){done(null);};video.onerror=function(){done(new Error('Format vidéo illisible'));};video.src=url;});
  }
  async function createOrResume(file,post){
    var authSession=await auth(),fp=fingerprint(file,authSession.user.id),key=UPLOAD_PREFIX+fp,existing='';try{existing=localStorage.getItem(key)||'';}catch(_e){}
    if(existing){try{var old=await request('/api/uploads/'+existing,{},30000);if(old&&old.size===file.size&&old.status==='uploading')return {session:old,key:key};}catch(_e2){try{localStorage.removeItem(key);}catch(_e3){}}}
    var created=await request('/api/uploads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:file.name,size:file.size,mime:file.type,fingerprint:fp,postId:post.id,payload:post})},30000);try{localStorage.setItem(key,created.id);}catch(_e4){}return {session:created,key:key};
  }
  async function sendChunk(uploadId,file,offset){
    var tries=0;
    for(;;){
      var chunk=file.slice(offset,Math.min(offset+CHUNK_BYTES,file.size));
      try{
        var authSession=await auth(),controller=new AbortController(),timer=setTimeout(function(){controller.abort();},120000),response;
        try{response=await fetch(WORKER+'/api/uploads/'+uploadId,{method:'PUT',headers:{Authorization:'Bearer '+authSession.access_token,'Content-Type':'application/octet-stream','Upload-Offset':String(offset)},body:chunk,signal:controller.signal});}finally{clearTimeout(timer);}
        if(response.status===409){var exact=Number(response.headers.get('Upload-Offset'));if(Number.isFinite(exact))return exact;}
        if(!response.ok){var body=await response.json().catch(function(){return {};});var error=new Error(body.error||('HTTP '+response.status));error.status=response.status;throw error;}
        return Number(response.headers.get('Upload-Offset')||offset+chunk.size);
      }catch(error){tries+=1;if(!retryable(error)||tries>10)throw error;if(navigator.onLine===false)await new Promise(function(resolve){window.addEventListener('online',resolve,{once:true});});await wait(Math.min(30000,1000*Math.pow(2,tries-1)));var state=await request('/api/uploads/'+uploadId,{},30000);offset=Number(state.received||offset);if(offset>=Number(state.size||0))return offset;}
    }
  }
  async function uploadAndStart(localId,file,post){
    running.add(localId);var job=jobs.get(localId);
    try{
      var found=await createOrResume(file,post),session=found.session,offset=Number(session.received||0);files.set(session.id,file);job.uploadId=session.id;setJob(job);
      while(offset<file.size){offset=await sendChunk(session.id,file,offset);job.uiProgress=Math.max(job.uiProgress||1,Math.min(60,Math.round(offset/file.size*60)));setJob(job);}
      try{localStorage.removeItem(found.key);}catch(_e){}var started=await request('/api/uploads/'+session.id+'/complete',{method:'POST'},45000);
      jobs.delete(localId);job.id=started.jobId;job.status='queued';job.uiProgress=62;jobs.set(job.id,job);persist();render();running.delete(localId);void pollOne(job.id);
    }catch(error){job=jobs.get(localId)||job;job.status='failed';job.error=cleanError(error);job.retryable=retryable(error);setJob(job);running.delete(localId);}
  }
  async function pollOne(id){
    if(running.has(id))return;running.add(id);
    try{var remote=await request('/api/jobs/'+id,{},30000),local=jobs.get(id)||{id:id,createdAt:Date.now()};local.status=remote.status;local.error=remote.error||'';local.retryable=Boolean(remote.retryable);local.uiProgress=remote.status==='published'?100:62+Math.round(Math.max(0,Math.min(100,Number(remote.progress||0)))*.36);setJob(local);if(remote.status==='published'){finish(local);return;}}
    catch(error){var job=jobs.get(id);if(job){job.error=cleanError(error);job.retryable=true;setJob(job);}}finally{running.delete(id);}
  }
  async function retry(id){
    var job=jobs.get(id);if(!job||running.has(id))return;
    if(files.has(id)){job.status='uploading';job.error='';setJob(job);void uploadAndStart(id,files.get(id),job.post);return;}
    if(job.uploadId&&files.has(job.uploadId)){job.status='uploading';job.error='';setJob(job);void uploadAndStart(id,files.get(job.uploadId),job.post);return;}
    try{var remote=await request('/api/jobs/'+id+'/retry',{method:'POST'},30000);job.status=remote.status||'queued';job.error='';job.uiProgress=Math.max(62,job.uiProgress||62);setJob(job);}catch(error){job.error=cleanError(error);job.retryable=retryable(error);setJob(job);}
  }
  async function enqueue(input){
    var file=input&&input.file,post=input&&input.post;if(!file||!post||post.kind!=='video'||post.mode!=='publish')return null;
    if(!/^video\//i.test(file.type||''))throw new Error('Le fichier sélectionné n’est pas une vidéo');if(!Number.isSafeInteger(file.size)||file.size<=0||file.size>MAX_BYTES)throw new Error('Vidéo trop lourde : maximum 1,1 Go');
    var duration=0;try{duration=await readDuration(file);}catch(_metadataError){duration=0;}
    if(Number.isFinite(duration)&&duration>MAX_SECONDS+.05)throw new Error('Vidéo trop longue : maximum 15 minutes');
    var id='local-'+Date.now()+'-'+Math.random().toString(36).slice(2),job={id:id,postId:post.id,post:post,status:'uploading',uiProgress:1,createdAt:Date.now(),retryable:true};files.set(id,file);setJob(job);void uploadAndStart(id,file,post);return job;
  }
  function refresh(){Array.from(jobs.values()).forEach(function(job){if(job&&/^[a-f0-9-]{36}$/.test(job.id)&&!running.has(job.id))void pollOne(job.id);});}
  function available(){return /^https:\/\//i.test(WORKER);}
  restore();document.addEventListener('DOMContentLoaded',function(){ensureStrip();render();refresh();});setInterval(refresh,4000);window.addEventListener('online',refresh);
  new MutationObserver(function(){if(jobs.size)ensureStrip();}).observe(document.documentElement,{childList:true,subtree:true});
  window.FyblicMediaJobsV1058=window.FyblicMediaJobsV1055=Object.freeze({version:'V1058_WORKER_DIRECT',enqueue:enqueue,retry:retry,refresh:refresh,available:available});
})();
