/* Fyblic V1057 — pipeline medias lourds reconstruit sur tus-js-client. */
(function(){
  'use strict';
  if(window.FyblicMediaJobsV1055)return;
  var TABLE='fyblic_media_jobs',BUCKET='fyblic-media-temp',MAX_BYTES=1100000000,CHUNK_BYTES=6*1024*1024;
  var RETRY_DELAYS=[0,1000,3000,5000,10000,20000,30000,60000];
  var files=new Map(),jobs=new Map(),activeUploads=new Map(),progressWrites=new Map();
  var polling=false,unavailable=false,strip=null,realtime=null,publishedHandled=new Set();

  function client(){try{return window.HappySupabaseClientMasterV972&&window.HappySupabaseClientMasterV972.get();}catch(_e){return null;}}
  async function ensureClient(){var c=client();if(c)return c;try{return await window.happyadEnsureSupabaseClientV972({});}catch(_e){return null;}}
  function config(){var c=window.HappySupabaseConfigV973;return c&&c.get?c.get():{url:window.HAPPYAD_SUPABASE_URL||'',key:window.HAPPYAD_SUPABASE_KEY||''};}
  async function auth(){
    var c=await ensureClient();if(!c)throw new Error('Service Fyblic indisponible');
    var result=await c.auth.getSession(),session=result&&result.data&&result.data.session;
    var expires=Number(session&&session.expires_at||0)*1000;
    if(!session||expires-Date.now()<90000){try{result=await c.auth.refreshSession();session=result&&result.data&&result.data.session;}catch(_e){}}
    if(!session||!session.user||!session.access_token)throw new Error('Session absente : reconnecte-toi');
    return {client:c,session:session,user:session.user};
  }
  function cleanName(value){return String(value||'video.mp4').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'_').replace(/^\.+/,'').slice(-120)||'video.mp4';}
  function errorText(error){
    var response=error&&error.originalResponse,status=response&&response.getStatus?response.getStatus():0,body=response&&response.getBody?response.getBody():'';
    return [error&&error.message||error||'Échec de publication',status?'HTTP '+status:'',body].filter(Boolean).join(' · ').slice(0,700);
  }
  function isRetryable(error){
    var response=error&&error.originalResponse,status=response&&response.getStatus?Number(response.getStatus()):0;
    if(!status||[408,409,423,425,429].includes(status)||status>=500)return true;
    return /fetch|network|timeout|délai|hors ligne|connexion|socket|xhr/i.test(errorText(error));
  }
  function normalizeRow(value){return Array.isArray(value)?value[0]:value;}
  function directStorageBase(){var value=String(config().url||'').replace(/\/+$/,'');return value.replace(/^https:\/\/([a-z0-9-]+)\.supabase\.co$/i,'https://$1.storage.supabase.co');}
  function endpoints(){
    var project=String(config().url||'').replace(/\/+$/,'');
    return [directStorageBase(),project].filter(function(value,index,all){return value&&all.indexOf(value)===index;}).map(function(base){return base+'/storage/v1/upload/resumable';});
  }
  function ensureStrip(){
    if(strip&&strip.isConnected)return strip;strip=document.getElementById('fyblicMediaJobsStripV1055');
    if(!strip){
      strip=document.createElement('section');strip.id='fyblicMediaJobsStripV1055';strip.setAttribute('aria-live','polite');
      strip.innerHTML='<div class="fyblicJobMetaV1055"><span class="fyblicJobLabelV1055">Publication en cours</span><button class="fyblicJobRetryV1055" type="button">Réessayer</button><span class="fyblicJobPercentV1055">0%</span></div><div class="fyblicJobTrackV1055"><div class="fyblicJobFillV1055"></div></div>';
      strip.querySelector('.fyblicJobRetryV1055').addEventListener('click',function(){var id=strip.dataset.jobId||'';if(id)void retry(id);});
    }
    var radar=document.getElementById('homeRadarStoryMasterV629')||document.querySelector('.radarBlock');
    if(radar&&radar.parentNode){if(radar.nextSibling!==strip)radar.parentNode.insertBefore(strip,radar.nextSibling);}else{var list=document.getElementById('list');if(list&&strip.parentNode!==list)list.insertBefore(strip,list.firstChild);}
    return strip;
  }
  function bestJob(){
    var values=Array.from(jobs.values()).filter(function(job){return job&&!['cancelled','published'].includes(job.status);});
    values.sort(function(a,b){var aa=a.status!=='failed',ba=b.status!=='failed';if(aa!==ba)return aa?-1:1;return new Date(b.created_at||0)-new Date(a.created_at||0);});
    return values[0]||null;
  }
  function render(){
    var el=ensureStrip(),job=bestJob();if(!job){el.className='';el.dataset.jobId='';return;}
    var failed=job.status==='failed',progress=Math.max(0,Math.min(100,Number(job.progress||0)));
    var activeCount=Array.from(jobs.values()).filter(function(item){return !['published','failed','cancelled'].includes(item.status);}).length;
    var label=failed?'Échec de la publication':'Publication en cours';if(activeCount>1)label+=' · '+activeCount+' en cours';
    var canRetry=Boolean(job.retryable)&&(Boolean(job.uploaded_at)||files.has(job.id));
    el.className='on'+(failed?' failed':'')+(failed&&canRetry?' retryable':'');el.dataset.jobId=job.id||'';
    el.querySelector('.fyblicJobLabelV1055').textContent=label;el.querySelector('.fyblicJobPercentV1055').textContent=failed?'Échec':Math.round(progress)+'%';
    el.querySelector('.fyblicJobFillV1055').style.width=(failed?100:progress)+'%';
  }
  function refreshPublishedPost(job){
    if(!job||!job.id||publishedHandled.has(job.id))return;publishedHandled.add(job.id);
    try{localStorage.setItem('HAPPYAD_HOME_REFRESH_NEEDED','1');localStorage.setItem('HAPPYAD_PROFILE_REFRESH_NEEDED',String(Date.now()));}catch(_e){}
    try{window.dispatchEvent(new CustomEvent('fyblic:media-published',{detail:{jobId:job.id,postId:job.post_id}}));}catch(_e2){}
    [0,400,1200,2600].forEach(function(delay){setTimeout(function(){try{if(typeof window.happyadRefreshHomePostsNow==='function')window.happyadRefreshHomePostsNow('publish-media-job-v1057');}catch(_refresh){}},delay);});
  }
  function setJob(job){
    job=normalizeRow(job);if(!job||!job.id)return;
    if(job.status==='cancelled'){jobs.delete(job.id);files.delete(job.id);activeUploads.delete(job.id);render();return;}
    if(job.status==='published'){jobs.delete(job.id);files.delete(job.id);activeUploads.delete(job.id);render();refreshPublishedPost(job);return;}
    jobs.set(job.id,job);render();
  }
  async function rpc(name,args){var a=await auth(),result=await a.client.rpc(name,args||{});if(result.error)throw result.error;return {data:normalizeRow(result.data),auth:a};}
  async function reportProgress(id,progress){try{var result=await rpc('fyblic_report_media_upload_v1057',{p_job_id:id,p_progress:progress});if(result.data)setJob(result.data);}catch(error){console.warn('Fyblic progression différée:',errorText(error));}}
  function queueProgress(id,progress){var previous=progressWrites.get(id)||Promise.resolve();var next=previous.catch(function(){}).then(function(){return reportProgress(id,progress);});progressWrites.set(id,next);return next;}
  async function markUploaded(job){
    var waits=[0,500,1000,1800,3000,5000,8000,12000,20000],lastError=null;
    for(var attempt=0;attempt<waits.length;attempt+=1){
      if(waits[attempt])await new Promise(function(resolve){setTimeout(resolve,waits[attempt]);});
      try{var result=await rpc('fyblic_mark_media_uploaded_v1057',{p_job_id:job.id});if(result.data)setJob(result.data);return result.data;}
      catch(error){
        lastError=error;
        try{var a=await auth(),state=await a.client.from(TABLE).select('*').eq('id',job.id).maybeSingle();if(state.data&&['uploaded','processing','published'].includes(state.data.status)){setJob(state.data);return state.data;}}catch(_stateError){}
      }
    }
    var failure=new Error('Validation du fichier différée : '+errorText(lastError));failure.code='UPLOAD_FINALIZATION';throw failure;
  }
  function tusUpload(job,file,endpoint){
    return new Promise(function(resolve,reject){
      var cfg=config(),lastBytes=0,lastPersisted=0,lastPersistedAt=0,finished=false;
      var upload=new window.tus.Upload(file,{
        endpoint:endpoint,chunkSize:CHUNK_BYTES,retryDelays:RETRY_DELAYS,uploadDataDuringCreation:true,
        removeFingerprintOnSuccess:true,storeFingerprintForResuming:true,headers:{apikey:cfg.key,'x-upsert':'true'},
        fingerprint:function(input){return Promise.resolve(['fyblic-v1057',job.id,endpoint,input.name,input.size,input.lastModified].join('::'));},
        metadata:{bucketName:BUCKET,objectName:job.source_path,contentType:file.type||job.source_mime||'video/mp4',cacheControl:'31536000'},
        onBeforeRequest:async function(request){var a=await auth();request.setHeader('Authorization','Bearer '+a.session.access_token);request.setHeader('apikey',config().key);},
        onProgress:function(bytesUploaded,bytesTotal){
          lastBytes=bytesUploaded;var progress=Math.max(1,Math.min(60,Math.round((bytesUploaded/Math.max(1,bytesTotal))*60)));
          setJob(Object.assign({},jobs.get(job.id)||job,{status:'uploading',stage:'Publication en cours',progress:progress}));
          var now=Date.now();if(progress===60||progress-lastPersisted>=3||now-lastPersistedAt>=5000){lastPersisted=progress;lastPersistedAt=now;void queueProgress(job.id,progress);}
        },
        onError:function(error){if(finished)return;finished=true;activeUploads.delete(job.id);try{error.fyblicBytesUploaded=lastBytes;}catch(_e){}reject(error);},
        onSuccess:function(){if(finished)return;finished=true;activeUploads.delete(job.id);resolve({url:upload.url,bytesUploaded:lastBytes||file.size});}
      });
      activeUploads.set(job.id,upload);
      Promise.resolve(upload.findPreviousUploads()).then(function(previous){if(previous&&previous.length)upload.resumeFromPreviousUpload(previous[0]);upload.start();}).catch(function(error){activeUploads.delete(job.id);reject(error);});
    });
  }
  async function upload(job,file){
    if(!window.tus||typeof window.tus.Upload!=='function')throw new Error('Moteur d’envoi sécurisé indisponible');
    var routes=endpoints(),lastError=null;
    for(var index=0;index<routes.length;index+=1){
      try{await tusUpload(job,file,routes[index]);var pending=progressWrites.get(job.id);if(pending)await pending.catch(function(){});await markUploaded(job);return;}
      catch(error){lastError=error;var bytes=Number(error&&error.fyblicBytesUploaded||0);if(index+1<routes.length&&bytes===0&&isRetryable(error))continue;throw error;}
    }
    throw lastError||new Error('Envoi impossible');
  }
  async function failJob(job,error){
    var finalization=error&&error.code==='UPLOAD_FINALIZATION',retryable=finalization||isRetryable(error);
    try{var result=await rpc('fyblic_fail_media_upload_v1057',{p_job_id:job.id,p_error_code:finalization?'UPLOAD_FINALIZATION':(retryable?'TEMPORARY_NETWORK':'UPLOAD_ERROR'),p_error_message:errorText(error),p_retryable:retryable});if(result.data)setJob(result.data);}
    catch(_update){setJob(Object.assign({},jobs.get(job.id)||job,{status:'failed',stage:'Échec',retryable:retryable,error_message:errorText(error)}));}
  }
  async function runUpload(job,file){try{await upload(job,file);}catch(error){console.error('Fyblic V1057 upload:',error);await failJob(job,error);}}
  async function enqueue(input){
    if(unavailable)return null;var file=input&&input.file,post=input&&input.post;if(!file||!post||post.mode!=='publish'||post.kind!=='video')return null;
    if(file.size<=0||file.size>MAX_BYTES)throw new Error('Vidéo trop lourde : maximum 1,1 Go');
    if(!window.tus||typeof window.tus.Upload!=='function')throw new Error('Moteur d’envoi sécurisé indisponible');
    var id=(crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+'-0000-4000-8000-'+Math.random().toString(16).slice(2,14).padEnd(12,'0');
    try{
      var created=await rpc('fyblic_create_media_job_v1057',{p_job_id:id,p_post_id:String(post.id),p_source_name:cleanName(file.name),p_source_mime:file.type||'video/mp4',p_source_bytes:file.size,p_payload:post});
      var job=created.data;if(!job||!job.id)throw new Error('Tâche média non créée');files.set(job.id,file);setJob(job);void runUpload(job,file);return job;
    }catch(error){if(/fyblic_create_media_job_v1057|schema cache|Could not find|PGRST202/i.test(errorText(error)))unavailable=true;throw error;}
  }
  async function retry(id){
    var job=jobs.get(id),file=files.get(id);if(!job||activeUploads.has(id))return;
    if(job.uploaded_at){try{var result=await rpc('fyblic_retry_media_job_v1057',{p_job_id:id});if(result.data)setJob(result.data);}catch(error){await failJob(job,error);}return;}
    if(!file)return;
    try{var restarted=await rpc('fyblic_restart_media_upload_v1057',{p_job_id:id});if(restarted.data)setJob(restarted.data);void runUpload(restarted.data||job,file);}catch(error){await failJob(job,error);}
  }
  function cancelPosts(postIds){
    var wanted=new Set((Array.isArray(postIds)?postIds:[postIds]).map(String));
    Array.from(jobs.entries()).forEach(function(entry){var id=entry[0],job=entry[1];if(job&&wanted.has(String(job.post_id||''))){var active=activeUploads.get(id);if(active)void active.abort(false).catch(function(){});activeUploads.delete(id);jobs.delete(id);files.delete(id);}});render();
  }
  async function refresh(){
    if(polling||unavailable)return;polling=true;
    try{
      var a=await auth(),since=new Date(Date.now()-24*60*60*1000).toISOString();
      var result=await a.client.from(TABLE).select('*').eq('user_id',a.user.id).in('status',['uploading','uploaded','processing','published','failed']).gte('created_at',since).order('created_at',{ascending:false}).limit(12);
      if(result.error)throw result.error;
      (result.data||[]).forEach(function(job){if(job.status==='uploading'&&!files.has(job.id)&&Date.now()-new Date(job.updated_at||job.created_at||0).getTime()>30*60*1000)return;setJob(job);});
      if(!realtime&&a.client.channel)realtime=a.client.channel('fyblic-media-jobs-v1057').on('postgres_changes',{event:'UPDATE',schema:'public',table:TABLE,filter:'user_id=eq.'+a.user.id},function(event){setJob(event.new);}).subscribe();
    }catch(error){if(/fyblic_media_jobs|does not exist|schema cache/i.test(errorText(error)))unavailable=true;}finally{polling=false;}
  }
  var anchorScheduled=false,observer=new MutationObserver(function(){if(!jobs.size||anchorScheduled)return;anchorScheduled=true;requestAnimationFrame(function(){anchorScheduled=false;ensureStrip();});});
  observer.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('DOMContentLoaded',function(){ensureStrip();void refresh();});
  setInterval(function(){void refresh();},5000);window.addEventListener('online',function(){void refresh();});
  window.FyblicMediaJobsV1055=Object.freeze({version:'V1057_TUS_OFFICIAL',enqueue:enqueue,retry:retry,refresh:refresh,cancelPosts:cancelPosts,available:function(){return !unavailable&&Boolean(window.tus&&window.tus.Upload);}});
})();
