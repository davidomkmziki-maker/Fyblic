(function(){
  'use strict';
  if(window.FyblicMediaCompressionV1)return;

  var configured=String(window.FYBLIC_MEDIA_COMPRESSOR_URL||'').trim().replace(/\/+$/,'');
  var CHUNK_FALLBACK=5*1024*1024;

  function enabled(){return /^https?:\/\//i.test(configured);}
  function join(path){return configured+path;}
  function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  function message(error,fallback){return String(error&&error.message||fallback||'Compression impossible');}
  function headers(token,extra){var h=Object.assign({},extra||{});if(token)h.Authorization='Bearer '+token;return h;}
  async function api(path,options,token){
    options=Object.assign({},options||{});options.headers=headers(token,options.headers);
    var response=await fetch(join(path),options);
    if(!response.ok){var body=await response.json().catch(function(){return {};});throw new Error(body.error||('Service média indisponible ('+response.status+')'));}
    if(response.status===204)return null;
    return response.json();
  }
  function uploadKey(file,userId){return 'FYBLIC_COMPRESS_UPLOAD_V1:'+String(userId||'')+':'+file.name+':'+file.size+':'+file.lastModified;}
  async function sessionFor(file,token,userId){
    var key=uploadKey(file,userId),existing='';try{existing=localStorage.getItem(key)||'';}catch(_e){}
    if(existing){try{var old=await api('/api/uploads/'+existing,{},token);if(old.size===file.size&&old.status==='uploading')return {session:old,key:key};}catch(_e2){try{localStorage.removeItem(key);}catch(_e3){}}}
    var created=await api('/api/uploads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:file.name,size:file.size,mime:file.type})},token);
    try{localStorage.setItem(key,created.id);}catch(_e4){}
    return {session:created,key:key};
  }
  async function upload(file,token,userId,config,onProgress){
    var found=await sessionFor(file,token,userId),session=found.session,offset=Number(session.received||0),retries=0,chunkBytes=Number(config.chunkBytes||CHUNK_FALLBACK);
    while(offset<file.size){
      var end=Math.min(offset+chunkBytes,file.size),chunk=file.slice(offset,end);
      onProgress&&onProgress({phase:'upload',percent:Math.round((offset/file.size)*45),text:'Préparation du média'});
      try{
        var response=await fetch(join('/api/uploads/'+session.id),{method:'POST',headers:headers(token,{'Upload-Offset':String(offset),'Content-Type':'application/octet-stream'}),body:chunk});
        if(!response.ok&&response.status!==409){var body=await response.json().catch(function(){return {};});var fatal=new Error(body.error||('Envoi refusé ('+response.status+')'));fatal.fatal=true;throw fatal;}
        if(response.status===409)throw new Error('Reprise du média');
        offset=Number(response.headers.get('Upload-Offset')||end);retries=0;
      }catch(error){
        if(error.fatal)throw error;
        retries+=1;if(retries>12)throw new Error('Envoi interrompu après 12 reprises automatiques');
        try{session=await api('/api/uploads/'+session.id,{},token);offset=Number(session.received||0);}catch(statusError){if(retries>=12)throw statusError;}
        await sleep(Math.min(7000,retries*700));
      }
    }
    try{localStorage.removeItem(found.key);}catch(_e){}
    return session.id;
  }
  async function waitJob(jobId,token,onProgress){
    for(;;){
      var job=await api('/api/jobs/'+jobId,{},token);
      if(job.status==='failed')throw new Error(job.error||'Compression impossible');
      if(job.status==='completed')return job;
      var internal=Math.max(0,Math.min(100,Number(job.progress||0)));
      onProgress&&onProgress({phase:'compression',percent:45+Math.round(internal*.4),text:'Compression du média'});
      await sleep(900);
    }
  }
  function preferred(job,kind){
    var outputs=Array.isArray(job.outputs)?job.outputs:[];
    if(kind==='video')return outputs.filter(function(x){return x.mime==='video/mp4';}).sort(function(a,b){return Number(b.name.replace(/\D/g,''))-Number(a.name.replace(/\D/g,''));})[0];
    return outputs.find(function(x){return x.name==='fullscreen';})||outputs.find(function(x){return x.name==='feed';})||outputs[0];
  }
  async function compress(file,options){
    options=options||{};
    if(!enabled())return {file:file,compressed:false,reason:'not-configured'};
    if(!file)throw new Error('Média absent');
    var token=String(options.accessToken||'');if(!token)throw new Error('Session Fyblic expirée');
    var config=await api('/api/config',{},token);
    if(file.size>Number(config.maxBytes||0))throw new Error('Média trop lourd pour la compression');
    var uploadId=await upload(file,token,options.userId,config,options.onProgress);
    var started=await api('/api/uploads/'+uploadId+'/complete',{method:'POST'},token);
    var job=await waitJob(started.jobId,token,options.onProgress);
    if((options.kind||'photo')==='video'){
      options.onProgress&&options.onProgress({phase:'publish-variants',percent:88,text:'Enregistrement des qualités vidéo'});
      var remote=await api('/api/jobs/'+started.jobId+'/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({postId:options.postId})},token);
      if(!remote||!remote.primary)throw new Error('Versions vidéo adaptées indisponibles');
      return {prepared:{__fyblicPrepared:true,kind:'video',primary:remote.primary,poster:remote.poster,variants:remote.variants||[],job:job},compressed:true,job:job,originalBytes:file.size,compressedBytes:(remote.primary&&remote.primary.bytes)||0};
    }
    var output=preferred(job,options.kind||'photo');if(!output)throw new Error('Aucun média compressé disponible');
    options.onProgress&&options.onProgress({phase:'download',percent:88,text:'Finalisation du média'});
    var response=await fetch(join(output.url),{headers:headers(token)});if(!response.ok)throw new Error('Récupération du média compressé impossible');
    var blob=await response.blob();
    var extension=output.mime==='video/mp4'?'mp4':'webp';
    var name=(String(file.name||'media').replace(/\.[^.]+$/,'')||'media')+'.'+extension;
    return {file:new File([blob],name,{type:output.mime,lastModified:Date.now()}),compressed:true,job:job,output:output,originalBytes:file.size,compressedBytes:blob.size};
  }
  window.FyblicMediaCompressionV1={version:'1.0.0',enabled:enabled,compress:compress,message:message};
})();
