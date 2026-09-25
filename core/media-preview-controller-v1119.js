/* Fyblic V1119 — Media Preview Controller
   Objectif: l'aperçu ne possède jamais le média original. Le File sélectionné reste
   intact; seules des URL blob temporaires (et, pour HEIC/HEIF, une copie JPEG
   d'aperçu) sont créées puis libérées de manière contrôlée. */
(function(global){
  'use strict';
  if(global.FyblicMediaPreviewV1119)return;

  var HEIF_BRANDS={heic:1,heix:1,hevc:1,hevx:1,heim:1,heis:1,heif:1,mif1:1,msf1:1};
  var HEIF_DECODER_URL='';
  var heifDecoderPromise=null;
  try{
    var currentScript=document.currentScript&&document.currentScript.src;
    if(currentScript)HEIF_DECODER_URL=new URL('vendor/heic2any-v0.0.4.min.js?v=855r32-local-heif-decoder',currentScript).href;
  }catch(_e){}
  function str(v){return String(v==null?'':v);}
  function now(){return Date.now();}
  function safeRevoke(url){if(!url)return;try{URL.revokeObjectURL(url);}catch(_e){}}
  function makeUrl(blob){try{return URL.createObjectURL(blob);}catch(_e){return '';}}
  function isBlobUrl(url){return /^blob:/i.test(str(url));}
  function fileLooksHeif(file){
    var type=str(file&&file.type).toLowerCase(),name=str(file&&file.name).toLowerCase();
    return type==='image/heic'||type==='image/heif'||/\.(heic|heif)$/i.test(name);
  }
  function ensureHeifDecoder(){
    if(typeof global.heic2any==='function')return Promise.resolve(global.heic2any);
    if(heifDecoderPromise)return heifDecoderPromise;
    heifDecoderPromise=new Promise(function(resolve,reject){
      if(typeof document==='undefined'||!HEIF_DECODER_URL)return reject(new Error('heif-decoder-unavailable'));
      var script=document.createElement('script'),done=false;
      function finish(ok){if(done)return;done=true;clearTimeout(timer);if(ok&&typeof global.heic2any==='function')resolve(global.heic2any);else reject(new Error('heif-decoder-load-failed'));}
      script.async=true;script.src=HEIF_DECODER_URL;script.onload=function(){finish(true);};script.onerror=function(){finish(false);};
      var timer=setTimeout(function(){finish(false);},12000);
      (document.head||document.documentElement).appendChild(script);
    }).catch(function(error){heifDecoderPromise=null;throw error;});
    return heifDecoderPromise;
  }

  async function fileIsHeif(file){
    if(!file)return false;
    if(fileLooksHeif(file))return true;
    try{
      var buf=await file.slice(0,40).arrayBuffer(),u8=new Uint8Array(buf);
      if(u8.length<12)return false;
      var box=String.fromCharCode(u8[4],u8[5],u8[6],u8[7]).toLowerCase();
      if(box!=='ftyp')return false;
      for(var i=8;i+3<u8.length;i+=4){
        var brand=String.fromCharCode(u8[i],u8[i+1],u8[i+2],u8[i+3]).toLowerCase();
        if(HEIF_BRANDS[brand])return true;
      }
    }catch(_e){}
    return false;
  }
  function stateClass(root,status){
    if(!root||!root.classList)return;
    root.classList.remove('mediaPreviewPendingV1119','mediaPreviewReadyV1119','mediaPreviewFallbackV1119');
    if(status==='ready')root.classList.add('mediaPreviewReadyV1119');
    else if(status==='fallback')root.classList.add('mediaPreviewFallbackV1119');
    else root.classList.add('mediaPreviewPendingV1119');
    var label=root.querySelector&&root.querySelector('[data-preview-status-v1119]');
    if(label){
      label.hidden=status==='ready';
      label.textContent=status==='fallback'?'Aperçu indisponible sur cet appareil. Le média original est conservé.':'Préparation de l’aperçu…';
    }
  }

  function createController(options){
    options=options||{};
    var current={id:0,file:null,kind:'',url:'',previewBlob:null,recoveries:0,recoveryPromise:null,createdAt:0};
    var bindings=new Set();
    var retired=new Set();
    var revokeTimers=new Map();

    function report(type,extra){
      try{if(typeof options.onDiagnostic==='function')options.onDiagnostic(Object.assign({type:type,sessionId:current.id,kind:current.kind,at:now()},extra||{}));}catch(_e){}
    }
    function tellUrl(url,reason){
      try{if(typeof options.onUrlChange==='function')options.onUrlChange(url,reason||'update',current.id);}catch(_e){}
    }
    function scheduleRevoke(url,delay){
      if(!url||!isBlobUrl(url)||url===current.url)return;
      if(revokeTimers.has(url))clearTimeout(revokeTimers.get(url));
      retired.add(url);
      var timer=setTimeout(function(){revokeTimers.delete(url);retired.delete(url);safeRevoke(url);},Math.max(1200,Number(delay)||12000));
      revokeTimers.set(url,timer);
    }
    function revokeAllRetired(){
      revokeTimers.forEach(function(timer,url){clearTimeout(timer);safeRevoke(url);});
      revokeTimers.clear();
      retired.forEach(safeRevoke);retired.clear();
    }
    function clearBindings(){
      bindings.forEach(function(binding){
        if(binding&&binding.timer)clearTimeout(binding.timer);
        try{if(binding&&binding.cleanup)binding.cleanup();}catch(_e){}
      });
      bindings.clear();
    }
    function updateBindingSource(binding,url){
      if(!binding||!binding.el||binding.sessionId!==current.id)return;
      var el=binding.el;
      try{
        el.dataset.fyblicPreviewSessionV1119=String(current.id);
        el.style.visibility='hidden';el.style.opacity='0';
        stateClass(binding.root,'pending');
        if(el.src!==url)el.src=url;
        if(el.tagName==='VIDEO'){
          el.preload='auto';el.playsInline=true;
          try{el.load();}catch(_e){}
        }
      }catch(_e){}
    }
    function switchUrl(newUrl,reason){
      if(!newUrl||newUrl===current.url)return current.url;
      var old=current.url;
      current.url=newUrl;
      tellUrl(newUrl,reason);
      bindings.forEach(function(binding){updateBindingSource(binding,newUrl);});
      scheduleRevoke(old,15000);
      report('url-switched',{reason:reason||'',old:!!old});
      return newUrl;
    }
    async function convertHeifForPreview(){
      if(!current.file||current.kind!=='photo')return '';
      if(!(await fileIsHeif(current.file)))return '';
      try{
        var decoder=await ensureHeifDecoder();
        var result=await decoder({blob:current.file,toType:'image/jpeg',quality:0.94,multiple:false});
        var blob=Array.isArray(result)?result[0]:result;
        if(!(blob instanceof Blob)||blob.size<256)return '';
        current.previewBlob=blob;
        var url=makeUrl(blob);
        if(url)report('heif-preview-converted',{size:blob.size});
        return url;
      }catch(error){report('heif-preview-convert-failed',{message:str(error&&error.message||error).slice(0,120)});return '';}
    }
    async function recover(reason){
      if(!current.file||!current.url)return false;
      if(current.recoveryPromise)return current.recoveryPromise;
      if(current.recoveries>=2){
        bindings.forEach(function(binding){stateClass(binding.root,'fallback');});
        report('recovery-exhausted',{reason:reason||''});
        return false;
      }
      current.recoveries++;
      var sessionId=current.id;
      current.recoveryPromise=(async function(){
        var newUrl='';
        if(current.kind==='photo')newUrl=await convertHeifForPreview();
        if(sessionId!==current.id)return false;
        if(!newUrl)newUrl=makeUrl(current.file);
        if(!newUrl){bindings.forEach(function(binding){stateClass(binding.root,'fallback');});return false;}
        switchUrl(newUrl,'recover-'+str(reason||'media-error'));
        return true;
      })().catch(function(){return false;}).finally(function(){if(sessionId===current.id)current.recoveryPromise=null;});
      return current.recoveryPromise;
    }
    function markReady(binding){
      if(!binding||binding.sessionId!==current.id)return;
      if(binding.timer){clearTimeout(binding.timer);binding.timer=0;}
      try{binding.el.style.visibility='visible';binding.el.style.opacity='1';}catch(_e){}
      stateClass(binding.root,'ready');
      try{if(typeof binding.onReady==='function')binding.onReady(binding.el);}catch(_e){}
    }
    function markMetadata(binding){
      if(!binding||binding.sessionId!==current.id)return;
      try{if(typeof binding.onMetadata==='function')binding.onMetadata(binding.el);}catch(_e){}
    }
    function bindElement(el,opts){
      opts=opts||{};if(!el||!current.file||!current.url)return null;
      var root=opts.root||el.parentElement||null;
      var binding={el:el,root:root,sessionId:current.id,onReady:opts.onReady,onMetadata:opts.onMetadata,timer:0,cleanup:null};
      stateClass(root,'pending');
      try{el.style.visibility='hidden';el.style.opacity='0';el.dataset.fyblicPreviewSessionV1119=String(current.id);}catch(_e){}
      if(el.tagName==='VIDEO'){
        var onMeta=function(){markMetadata(binding);};
        var onDecoded=function(){markReady(binding);};
        var onError=function(){if(binding.sessionId!==current.id)return;recover('video-error').then(function(ok){if(!ok&&binding.sessionId===current.id)stateClass(root,'fallback');});};
        el.addEventListener('loadedmetadata',onMeta);
        el.addEventListener('durationchange',onMeta);
        el.addEventListener('loadeddata',onDecoded);
        el.addEventListener('canplay',onDecoded);
        el.addEventListener('error',onError);
        binding.cleanup=function(){el.removeEventListener('loadedmetadata',onMeta);el.removeEventListener('durationchange',onMeta);el.removeEventListener('loadeddata',onDecoded);el.removeEventListener('canplay',onDecoded);el.removeEventListener('error',onError);};
        try{el.preload='auto';el.playsInline=true;}catch(_e){}
        binding.timer=setTimeout(function(){
          if(binding.sessionId!==current.id)return;
          if(el.readyState>=2)markReady(binding);
          else recover('video-timeout').then(function(ok){if(!ok&&binding.sessionId===current.id)stateClass(root,'fallback');});
        },12000);
        if(el.readyState>=1)markMetadata(binding);
        if(el.readyState>=2)markReady(binding);
        else{try{el.load();}catch(_e){}}
      }else if(el.tagName==='IMG'){
        var onLoad=function(){markReady(binding);};
        var onImgError=function(){if(binding.sessionId!==current.id)return;recover('image-error').then(function(ok){if(!ok&&binding.sessionId===current.id)stateClass(root,'fallback');});};
        el.addEventListener('load',onLoad);
        el.addEventListener('error',onImgError);
        binding.cleanup=function(){el.removeEventListener('load',onLoad);el.removeEventListener('error',onImgError);};
        binding.timer=setTimeout(function(){
          if(binding.sessionId!==current.id)return;
          if(el.complete&&el.naturalWidth>0)markReady(binding);
          else recover('image-timeout').then(function(ok){if(!ok&&binding.sessionId===current.id)stateClass(root,'fallback');});
        },9000);
        if(el.complete&&el.naturalWidth>0)markReady(binding);
      }
      bindings.add(binding);
      return binding;
    }
    function select(file,kind){
      clearBindings();
      var old=current.url;
      if(current.previewBlob)current.previewBlob=null;
      current={id:current.id+1,file:file||null,kind:str(kind||''),url:'',previewBlob:null,recoveries:0,recoveryPromise:null,createdAt:now()};
      if(file){current.url=makeUrl(file);tellUrl(current.url,'select');}
      scheduleRevoke(old,15000);
      report('selected',{name:str(file&&file.name).slice(0,90),type:str(file&&file.type),size:Number(file&&file.size||0)});
      return current.url;
    }
    function release(reason){
      clearBindings();
      var old=current.url;
      current={id:current.id+1,file:null,kind:'',url:'',previewBlob:null,recoveries:0,recoveryPromise:null,createdAt:0};
      tellUrl('',reason||'release');
      safeRevoke(old);revokeAllRetired();
      report('released',{reason:reason||''});
    }
    function snapshot(){return {id:current.id,file:current.file,kind:current.kind,url:current.url,recoveries:current.recoveries,createdAt:current.createdAt};}

    return {select:select,bindElement:bindElement,recover:recover,release:release,snapshot:snapshot,fileIsHeif:fileIsHeif};
  }

  global.FyblicMediaPreviewV1119={createController:createController,fileIsHeif:fileIsHeif,version:'1119'};
})(window);
