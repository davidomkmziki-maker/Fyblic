(function(){
  'use strict';
  if(window.FyblicPublicationPipelineV2)return;

  var BASE=String(window.FYBLIC_MEDIA_COMPRESSOR_URL||'https://fyblic-media-worker-production.up.railway.app').replace(/\/+$/,'');
  var JOBS_KEY='FYBLIC_PUBLICATION_JOBS_V2';
  var CHUNK_SAFE=512*1024,CHUNK_FAST=1024*1024;
  var healthCache={at:0,value:false};
  var watchers={};

  function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  function chunkBytes(){var c=navigator.connection||navigator.mozConnection||navigator.webkitConnection||{};if(c.saveData||/^(slow-2g|2g|3g)$/i.test(String(c.effectiveType||'')))return CHUNK_SAFE;return CHUNK_FAST;}
  function publicError(value){var m=String(value||'').trim();if(!m)return 'Publication impossible. Réessaie.';if(/supabase|23502|failing row|violates|constraint|postgres|pgrst|sql/i.test(m))return 'La publication n’a pas pu être enregistrée. Réessaie après la mise à jour.';return m.slice(0,140);}
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
  function remember(job){if(!job||!job.id)return;var list=readJobs().filter(function(x){return x&&x.id!==job.id;});list.unshift({id:job.id,postId:job.post_id||job.postId||'',status:job.status||'uploading',primaryReady:job.primary_ready===true,progress:Number(job.progress||0),stage:job.stage||'',createdAt:job.created_at||new Date().toISOString()});writeJobs(list);}
  function forget(id){writeJobs(readJobs().filter(function(x){return x&&x.id!==id;}));}
  function event(job){
    if(!job)return;
    remember(job);
    var detail={jobId:job.id,postId:job.post_id||job.postId||'',status:job.status||'',primaryReady:job.primary_ready===true,progress:Number(job.progress||0),stage:job.stage||'',error:publicError(job.error_message||''),result:job.result||null};
    try{window.dispatchEvent(new CustomEvent('FYBLIC_PUBLICATION_PROGRESS_V2',{detail:detail}));}catch(_e){}
    try{if(window.parent&&window.parent!==window)window.parent.postMessage({type:'FYBLIC_PUBLICATION_PROGRESS_V2',detail:detail},'*');}catch(_e2){}
    if(detail.primaryReady||['published','failed','canceled'].indexOf(detail.status)>=0){setTimeout(function(){if(detail.primaryReady||detail.status==='published'||detail.status==='canceled')forget(job.id);},detail.primaryReady?8000:1000);}
  }
  async function available(force){
    if(!force&&Date.now()-healthCache.at<30000)return healthCache.value;
    try{var r=await request('/health',{},'',10000),v=!!(r.body&&r.body.ok&&r.body.pipelineV2&&r.body.pipelineV2.enabled);healthCache={at:Date.now(),value:v};return v;}catch(_e){healthCache={at:Date.now(),value:false};return false;}
  }
  async function chunkBase64(blob){
    var bytes=new Uint8Array(await blob.arrayBuffer()),parts=[],step=32768;
    for(var i=0;i<bytes.length;i+=step)parts.push(String.fromCharCode.apply(null,bytes.subarray(i,Math.min(i+step,bytes.length))));
    return btoa(parts.join(''));
  }
  function fingerprint(file){return [file.name||'media',file.size||0,file.lastModified||0,file.type||''].join(':');}
  async function status(id,token){return (await request('/api/v2/publications/'+id,{},token,30000)).body;}
  async function watch(id,token,onProgress){
    if(watchers[id])return watchers[id];
    watchers[id]=(async function(){
      try{
        for(;;){
          var job=await status(id,token);event(job);if(onProgress)onProgress(job);
          if(job.primary_ready===true||['published','failed','canceled'].indexOf(job.status)>=0)return job;
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
    var created=(await request('/api/v2/publications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      filename:file.name||'media',size:file.size,mime:file.type||'application/octet-stream',kind:options.kind||'photo',publicationType:options.publicationType||'normal',postId:options.postId,payload:options.payload||{},fingerprint:fingerprint(file)
    })},a.token,45000)).body;
    remember(created);event(created);
    if(typeof options.onCreated==='function')options.onCreated(created);
    if(created.primary_ready===true||created.status==='published'){return {used:true,job:created,completion:Promise.resolve(created)};}
    var offset=Number(created.uploaded_bytes||0),retries=0;
    while(offset<file.size){
      var end=Math.min(offset+chunkBytes(),file.size),blob=file.slice(offset,end),data=await chunkBase64(blob);
      try{
        var sent=await request('/api/v2/publications/'+created.id+'/chunks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({offset:offset,data:data})},a.token,60000);
        offset=Number(sent.response.headers.get('Upload-Offset')||end);retries=0;
        var uploadState=Object.assign({},created,{status:'uploading',uploaded_bytes:offset,progress:Math.max(1,Math.min(44,Math.round(offset/file.size*44))),stage:'Envoi sécurisé du média'});event(uploadState);if(options.onProgress)options.onProgress(uploadState);
      }catch(error){
        retries++;
        if(error.status===409&&error.response){offset=Number(error.response.headers.get('Upload-Offset')||offset);continue;}
        if(retries>12)throw new Error('Envoi interrompu après 12 reprises automatiques');
        try{var fresh=await status(created.id,a.token);offset=Number(fresh.uploaded_bytes||offset);event(fresh);}catch(_statusError){}
        await sleep(Math.min(8000,retries*800));
      }
    }
    var queued=(await request('/api/v2/publications/'+created.id+'/complete',{method:'POST'},a.token,45000)).body;
    event(queued);if(options.onProgress)options.onProgress(queued);
    var completion=watch(created.id,a.token,options.onProgress).catch(function(error){event({id:created.id,post_id:options.postId,status:'failed',progress:45,stage:'Échec',error_message:error.message});throw error;});
    return {used:true,job:queued,completion:completion};
  }
  async function resumeTracking(){
    var jobs=readJobs().filter(function(j){return j&&j.id&&j.primaryReady!==true&&['published','canceled'].indexOf(j.status)<0;});if(!jobs.length)return;
    var a;try{a=await auth();}catch(_e){return;}
    jobs.forEach(function(job){watch(job.id,a.token).catch(function(){});});
  }
  async function cancel(id){var a=await auth(),job=(await request('/api/v2/publications/'+id+'/cancel',{method:'POST'},a.token,30000)).body;event(job);return job;}

  window.FyblicPublicationPipelineV2={version:'1064.1',available:available,submit:submit,status:status,watch:watch,resumeTracking:resumeTracking,cancel:cancel,forget:forget};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(resumeTracking,1000);},{once:true});else setTimeout(resumeTracking,1000);
})();
