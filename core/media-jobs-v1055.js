/* Fyblic V1056R1 — upload reprenable sur double route Supabase. */
(function(){
  'use strict';
  if(window.FyblicMediaJobsV1055)return;

  var TABLE='fyblic_media_jobs';
  var BUCKET='fyblic-media-temp';
  var CHUNK=6*1024*1024;
  var MAX_BYTES=1100000000;
  var MAX_CHUNK_RETRIES=8;
  var files=new Map();
  var jobs=new Map();
  var uploadUrls=new Map();
  var polling=false;
  var unavailable=false;
  var strip=null;
  var realtime=null;
  var publishedHandled=new Set();

  function client(){
    try{return window.HappySupabaseClientMasterV972&&window.HappySupabaseClientMasterV972.get();}catch(_e){return null;}
  }
  async function ensureClient(){
    var c=client();
    if(c)return c;
    try{return await window.happyadEnsureSupabaseClientV972({});}catch(_e){return null;}
  }
  function config(){
    var c=window.HappySupabaseConfigV973;
    return c&&c.get?c.get():{url:window.HAPPYAD_SUPABASE_URL||'',key:window.HAPPYAD_SUPABASE_KEY||''};
  }
  function cleanName(value){
    return String(value||'video.mp4').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'_').replace(/^\.+/,'').slice(-120)||'video.mp4';
  }
  function fingerprint(file,userId){
    return [userId,file.name,file.size,file.lastModified].join(':');
  }
  function metadata(values){
    return Object.keys(values).map(function(key){
      var encoded=btoa(unescape(encodeURIComponent(String(values[key]||''))));
      return key+' '+encoded;
    }).join(',');
  }
  function storageKey(fp){return 'FYBLIC_TUS_V1055:'+fp;}
  function retryable(error){return /fetch|network|Failed to fetch|timeout|délai|hors ligne|HTTP\s*(408|409|425|429|5\d\d)|\((408|409|425|429|5\d\d)\)|Upload interrompu \((408|409|425|429|5\d\d)\)/i.test(String(error&&error.message||error||''));}
  function errorText(error){return String(error&&error.message||error||'Échec de publication').slice(0,500);}
  function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  function waitOnline(){
    if(navigator.onLine!==false)return Promise.resolve();
    return new Promise(function(resolve){window.addEventListener('online',resolve,{once:true});});
  }
  function directStorageBase(){
    var value=String(config().url||'').replace(/\/+$/,'');
    return value.replace(/^https:\/\/([a-z0-9-]+)\.supabase\.co$/i,'https://$1.storage.supabase.co');
  }
  function projectStorageBase(){
    return String(config().url||'').replace(/\/+$/,'');
  }
  function storageBases(){
    return [directStorageBase(),projectStorageBase()].filter(function(value,index,all){return value&&all.indexOf(value)===index;});
  }
  function alternateTusUrl(url){
    try{
      var current=new URL(url);
      var alternate=storageBases().find(function(base){return new URL(base).origin!==current.origin;});
      return alternate?new URL(current.pathname+current.search,alternate).href:'';
    }catch(_e){return '';}
  }
  function isFetchFailure(error){
    return /fetch|network|Failed to fetch|Load failed|NetworkError|connexion/i.test(String(error&&error.message||error||''));
  }
  async function fetchTus(url,options){
    try{return {response:await fetch(url,options),url:url};}
    catch(primaryError){
      if(!isFetchFailure(primaryError))throw primaryError;
      var alternate=alternateTusUrl(url);
      if(!alternate)throw primaryError;
      try{
        var response=await fetch(alternate,options);
        if(response.status===404)throw primaryError;
        return {response:response,url:alternate};
      }catch(alternateError){
        if(alternateError===primaryError)throw primaryError;
        throw new Error('Stockage Supabase inaccessible sur les deux routes : '+errorText(alternateError));
      }
    }
  }

  function ensureStrip(){
    if(strip&&strip.isConnected)return strip;
    strip=document.getElementById('fyblicMediaJobsStripV1055');
    if(!strip){
      strip=document.createElement('section');
      strip.id='fyblicMediaJobsStripV1055';
      strip.setAttribute('aria-live','polite');
      strip.innerHTML='<div class="fyblicJobMetaV1055"><span class="fyblicJobLabelV1055">Publication vidéo</span><button class="fyblicJobRetryV1055" type="button">Réessayer</button><span class="fyblicJobPercentV1055">0%</span></div><div class="fyblicJobTrackV1055"><div class="fyblicJobFillV1055"></div></div>';
      strip.querySelector('.fyblicJobRetryV1055').addEventListener('click',function(){
        var id=strip.dataset.jobId||'';
        if(id)void retry(id);
      });
    }
    var radar=document.getElementById('homeRadarStoryMasterV629')||document.querySelector('.radarBlock');
    if(radar&&radar.parentNode){
      if(radar.nextSibling!==strip)radar.parentNode.insertBefore(strip,radar.nextSibling);
    }else{
      var list=document.getElementById('list');
      if(list&&strip.parentNode!==list)list.insertBefore(strip,list.firstChild);
    }
    return strip;
  }
  function bestJob(){
    var values=Array.from(jobs.values()).filter(function(job){return job&&!['cancelled','published'].includes(job.status);});
    values.sort(function(a,b){return new Date(b.created_at||0)-new Date(a.created_at||0);});
    return values.find(function(job){return job.status!=='failed';})||values[0]||null;
  }
  function render(){
    var el=ensureStrip();
    var job=bestJob();
    if(!job){el.className='';return;}
    var status=String(job.status||'uploading');
    var progress=Math.max(0,Math.min(100,Number(job.progress||0)));
    var failed=status==='failed';
    var activeCount=Array.from(jobs.values()).filter(function(item){return !['published','failed','cancelled'].includes(item.status);}).length;
    var label=failed?'Échec de la publication':(job.stage||'Publication vidéo');
    if(activeCount>1)label+=' · '+activeCount+' en cours';
    var sourceReady=Boolean(job.uploaded_at)||Number(job.progress||0)>=62;
    el.className='on'+(failed?' failed':'')+(failed&&job.retryable&&(sourceReady||files.has(job.id))?' retryable':'');
    el.dataset.jobId=job.id||'';
    el.querySelector('.fyblicJobLabelV1055').textContent=label;
    el.querySelector('.fyblicJobPercentV1055').textContent=failed?'Échec':Math.round(progress)+'%';
    el.querySelector('.fyblicJobFillV1055').style.width=(failed?100:progress)+'%';
  }
  function refreshPublishedPost(job){
    if(!job||!job.id||publishedHandled.has(job.id))return;
    publishedHandled.add(job.id);
    try{localStorage.setItem('HAPPYAD_HOME_REFRESH_NEEDED','1');localStorage.setItem('HAPPYAD_PROFILE_REFRESH_NEEDED',String(Date.now()));}catch(_e){}
    try{window.dispatchEvent(new CustomEvent('fyblic:media-published',{detail:{jobId:job.id,postId:job.post_id}}));}catch(_e2){}
    [0,450,1400].forEach(function(delay){
      setTimeout(function(){
        try{if(typeof window.happyadRefreshHomePostsNow==='function')window.happyadRefreshHomePostsNow('publish-media-job-v1055r2');}catch(_refresh){}
      },delay);
    });
  }
  function setJob(job){
    if(!job||!job.id)return;
    if(job.status==='cancelled'){
      jobs.delete(job.id);files.delete(job.id);uploadUrls.delete(job.id);render();return;
    }
    if(job.status==='published'){
      jobs.delete(job.id);
      files.delete(job.id);
      uploadUrls.delete(job.id);
      render();
      refreshPublishedPost(job);
      return;
    }
    jobs.set(job.id,job);
    render();
  }
  async function auth(){
    var c=await ensureClient();
    if(!c)throw new Error('Service Fyblic indisponible');
    var result=await c.auth.getSession();
    var session=result&&result.data&&result.data.session;
    if(!session){
      try{result=await c.auth.refreshSession();session=result&&result.data&&result.data.session;}catch(_e){}
    }
    if(!session||!session.user||!session.access_token)throw new Error('Session absente : reconnecte-toi');
    return {client:c,session:session,user:session.user};
  }
  async function update(id,values){
    var a=await auth();
    var result=await a.client.from(TABLE).update(values).eq('id',id).select('*').maybeSingle();
    if(result.error)throw result.error;
    if(result.data)setJob(result.data);
    return result.data;
  }
  async function createTus(file,sourcePath,a){
    var cfg=config();
    var bases=storageBases(),lastNetworkError=null;
    for(var index=0;index<bases.length;index+=1){
      var base=bases[index];
      try{
        var response=await fetch(base+'/storage/v1/upload/resumable',{
          method:'POST',
          headers:{
            Authorization:'Bearer '+a.session.access_token,
            apikey:cfg.key,
            'Tus-Resumable':'1.0.0',
            'Upload-Length':String(file.size),
            'Upload-Metadata':metadata({bucketName:BUCKET,objectName:sourcePath,contentType:file.type||'video/mp4',cacheControl:'31536000'}),
            'x-upsert':'true'
          }
        });
        if(response.status===404&&index+1<bases.length)continue;
        if(!response.ok)throw new Error('Initialisation upload refusée ('+response.status+') '+(await response.text()).slice(0,250));
        var location=response.headers.get('Location');
        if(!location)throw new Error('Adresse de reprise absente');
        return new URL(location,base).href;
      }catch(error){
        if(!isFetchFailure(error))throw error;
        lastNetworkError=error;
      }
    }
    throw new Error('Stockage Supabase inaccessible sur les deux routes : '+errorText(lastNetworkError));
  }
  async function tusOffset(url,a){
    var cfg=config();
    var sent=await fetchTus(url,{method:'HEAD',headers:{Authorization:'Bearer '+a.session.access_token,apikey:cfg.key,'Tus-Resumable':'1.0.0'}});
    if(!sent.response.ok)throw new Error('Reprise upload refusée ('+sent.response.status+')');
    return {offset:Number(sent.response.headers.get('Upload-Offset')||0),url:sent.url};
  }
  async function upload(job,file){
    var a=await auth();
    var cfg=config();
    var fp=fingerprint(file,a.user.id);
    var url=uploadUrls.get(job.id)||localStorage.getItem(storageKey(fp))||'';
    var offset=0;
    if(url){
      try{var resumed=await tusOffset(url,a);offset=resumed.offset;url=resumed.url;}catch(_resume){url='';offset=0;localStorage.removeItem(storageKey(fp));}
    }
    if(!url){
      url=await createTus(file,job.source_path,a);
      uploadUrls.set(job.id,url);
      localStorage.setItem(storageKey(fp),url);
    }
    var lastSaved=-1;
    while(offset<file.size){
      var end=Math.min(file.size,offset+CHUNK);
      var response=null,lastError=null;
      for(var attempt=0;attempt<=MAX_CHUNK_RETRIES;attempt+=1){
        try{
          await waitOnline();
          if(attempt>0){
            a=await auth();
            try{var currentOffset=await tusOffset(url,a);offset=currentOffset.offset;url=currentOffset.url;}catch(_headError){}
            end=Math.min(file.size,offset+CHUNK);
            if(offset>=file.size){
              response={ok:true,headers:new Headers({'Upload-Offset':String(offset)})};
              lastError=null;
              break;
            }
          }
          var sent=await fetchTus(url,{
            method:'PATCH',
            headers:{
              Authorization:'Bearer '+a.session.access_token,
              apikey:cfg.key,
              'Tus-Resumable':'1.0.0',
              'Upload-Offset':String(offset),
              'Content-Type':'application/offset+octet-stream'
            },
            body:file.slice(offset,end)
          });
          response=sent.response;
          if(sent.url!==url){
            url=sent.url;
            uploadUrls.set(job.id,url);
            localStorage.setItem(storageKey(fp),url);
          }
          if(response.ok){lastError=null;break;}
          var detail=(await response.text()).slice(0,220);
          lastError=new Error('Upload interrompu ('+response.status+') '+detail);
          if(![408,409,425,429].includes(response.status)&&response.status<500)throw lastError;
        }catch(chunkError){
          lastError=chunkError;
          if(!retryable(chunkError))throw chunkError;
        }
        if(attempt>=MAX_CHUNK_RETRIES)break;
        var waiting=Math.min(12000,700*Math.pow(1.7,attempt));
        setJob(Object.assign({},jobs.get(job.id)||job,{status:'uploading',stage:'Reconnexion au stockage · reprise automatique',progress:Math.min(60,Number((jobs.get(job.id)||job).progress||1))}));
        await wait(waiting+Math.round(Math.random()*350));
      }
      if(lastError)throw new Error(errorText(lastError)+' · '+(MAX_CHUNK_RETRIES+1)+' tentatives');
      offset=Number(response.headers.get('Upload-Offset')||end);
      var percent=Math.min(60,Math.max(2,Math.round(offset/file.size*60)));
      var current=Object.assign({},jobs.get(job.id)||job,{status:'uploading',stage:'Envoi sécurisé',progress:percent});
      setJob(current);
      if(percent-lastSaved>=3){lastSaved=percent;await update(job.id,{status:'uploading',stage:'Envoi sécurisé',progress:percent});}
    }
    localStorage.removeItem(storageKey(fp));
    var marked=await a.client.rpc('fyblic_mark_media_uploaded_v1055',{p_job_id:job.id});
    if(marked.error)throw marked.error;
    setJob(marked.data);
  }
  async function runUpload(job,file){
    try{await upload(job,file);}
    catch(error){
      console.error('Fyblic V1055 upload:',error);
      var canRetry=retryable(error);
      try{await update(job.id,{status:'failed',stage:'Échec',error_code:canRetry?'TEMPORARY_NETWORK':'UPLOAD_ERROR',error_message:errorText(error),retryable:canRetry});}
      catch(_update){setJob(Object.assign({},jobs.get(job.id)||job,{status:'failed',stage:'Échec',retryable:canRetry,error_message:errorText(error)}));}
    }
  }
  async function enqueue(input){
    if(unavailable)return null;
    var file=input&&input.file,post=input&&input.post;
    if(!file||!post||post.mode!=='publish'||post.kind!=='video')return null;
    if(file.size<=0||file.size>MAX_BYTES)throw new Error('Vidéo trop lourde : maximum 1,1 Go');
    var a=await auth();
    var id=(crypto&&crypto.randomUUID)?crypto.randomUUID():String(Date.now())+'-0000-4000-8000-'+Math.random().toString(16).slice(2,14).padEnd(12,'0');
    var sourcePath=a.user.id+'/'+id+'/'+cleanName(file.name);
    var row={
      id:id,user_id:a.user.id,post_id:post.id,content_type:'post',media_kind:'video',
      status:'uploading',stage:'Préparation',progress:1,source_bucket:BUCKET,source_path:sourcePath,
      source_name:file.name||'video.mp4',source_mime:file.type||'video/mp4',source_bytes:file.size,payload:post
    };
    var result=await a.client.from(TABLE).insert(row).select('*').single();
    if(result.error){
      if(result.error.code==='42P01'||/fyblic_media_jobs|does not exist|schema cache/i.test(String(result.error.message||'')))unavailable=true;
      throw result.error;
    }
    files.set(id,file);
    setJob(result.data||row);
    void runUpload(result.data||row,file);
    return result.data||row;
  }
  async function retry(id){
    var file=files.get(id),job=jobs.get(id);
    if(!job)return;
    if(job.uploaded_at||Number(job.progress||0)>=62){
      var a=await auth();
      var marked=await a.client.rpc('fyblic_mark_media_uploaded_v1055',{p_job_id:id});
      if(marked.error)throw marked.error;
      setJob(marked.data);
      return;
    }
    if(!file)return;
    await update(id,{status:'uploading',stage:'Reprise de l’envoi',progress:Math.min(60,Number(job.progress||1)),error_code:null,error_message:null,retryable:false});
    void runUpload(Object.assign({},job,{status:'uploading'}),file);
  }
  function cancelPosts(postIds){
    var wanted=new Set((Array.isArray(postIds)?postIds:[postIds]).map(String));
    Array.from(jobs.entries()).forEach(function(entry){
      var id=entry[0],job=entry[1];
      if(job&&wanted.has(String(job.post_id||''))){jobs.delete(id);files.delete(id);uploadUrls.delete(id);}
    });
    render();
  }
  async function refresh(){
    if(polling||unavailable)return;
    polling=true;
    try{
      var a=await auth();
      /* Une tache failed ne peut etre reprise apres rechargement car le navigateur
         ne possede plus le File d'origine. Ne pas ressusciter une barre rouge inutile. */
      var result=await a.client.from(TABLE).select('*').eq('user_id',a.user.id).in('status',['uploading','uploaded','processing','published']).order('created_at',{ascending:false}).limit(8);
      if(result.error){
        if(result.error.code==='42P01'||/fyblic_media_jobs|does not exist|schema cache/i.test(String(result.error.message||'')))unavailable=true;
        return;
      }
      (result.data||[]).forEach(setJob);
      if(!realtime&&a.client.channel){
        realtime=a.client.channel('fyblic-media-jobs-v1055').on('postgres_changes',{event:'UPDATE',schema:'public',table:TABLE,filter:'user_id=eq.'+a.user.id},function(event){setJob(event.new);}).subscribe();
      }
    }catch(_e){}finally{polling=false;}
  }

  var anchorScheduled=false;
  var observer=new MutationObserver(function(){
    if(!jobs.size||anchorScheduled)return;
    anchorScheduled=true;
    requestAnimationFrame(function(){anchorScheduled=false;ensureStrip();});
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',function(){ensureStrip();void refresh();});
  setInterval(function(){void refresh();},5000);
  window.addEventListener('online',function(){void refresh();});

  window.FyblicMediaJobsV1055=Object.freeze({version:'V1056R1_STORAGE_FAILOVER',enqueue:enqueue,retry:retry,refresh:refresh,cancelPosts:cancelPosts,available:function(){return !unavailable;}});
})();
