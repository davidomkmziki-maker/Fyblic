(function(){
  'use strict';
  if(window.__HAPPYAD_VIDEO_COVER_EDITOR_MASTER_V693__)return;
  window.__HAPPYAD_VIDEO_COVER_EDITOR_MASTER_V693__=true;

  var VERSION='V828_VIDEO_POSTER_MARKETPLACE_IN_PLACE';
  var EDITOR_ID='happyadVideoCoverEditorV693';
  var STYLE_ID='happyadVideoCoverEditorStyleV693';
  var UPDATE_KEY='HAPPYAD_VIDEO_POSTER_UPDATED_V693';
  var BUCKET='happyad-media';
  var CACHE_KEYS=[
    'HAPPYAD_GLOBAL_POSTS_CACHE_V1','HAPPYAD_PUBLISH_POSTS_V2','HAPPYAD_ALL_POSTS_V1',
    'HAPPYAD_HOME_CONFIRMED_ORDER_V643','HAPPYAD_HOME_BOOT_SNAPSHOT_V1','HAPPYAD_VIDEO_CACHE_STABLE_V1','HAPPYAD_SESSION_ALL_POSTS_V104',
    'HAPPYAD_SESSION_PROFILE_POSTS_V104','HAPPYAD_PROFILE_POSTS_CACHE_V1','HAPPYAD_PROFILE_PUBLISHED_POSTS_V1',
    'HAPPYAD_PROFILE_POSTS_V1','HAPPYAD_CACHED_POSTS_V1','HAPPYAD_FEED_CACHE_V1',
    'HAPPYAD_HOME_POSTS_CACHE_V1','HAPPYAD_PHOTO_STABLE_CACHE_V1','HAPPYAD_POSTS_CACHE_V1',
    'HAPPYAD_SEARCH_POSTS_FAST_CACHE_V1','HAPPYAD_USER_POSTS_CACHE_V1',
    'HAPPYAD_VIDEO_ACTIVE_POST_V621','HAPPYAD_VIDEO_OPEN_POST_V594','HAPPYAD_VIDEO_TARGET_POST_V594','HAPPYAD_FAST_OPEN_VIDEO_V1'
  ];
  var active=null;

  function clean(v){return String(v==null?'':v).trim();}
  function num(v,fallback){v=Number(v);return Number.isFinite(v)?v:Number(fallback||0);}
  function esc(v){return clean(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function postId(p){p=p||{};return clean(p.id||p.post_id||p.postId||p.source_id);}
  function thumbKey(id){return 'HAPPYAD_VIDEO_THUMB_V1_'+String(id||'').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,120);}
  function officialPoster(p){
    p=p||{};var id=postId(p),local='';
    if(id){try{local=clean(localStorage.getItem(thumbKey(id))||sessionStorage.getItem(thumbKey(id))||'');}catch(_e){}}
    return local||clean(p.thumbnail_url||p.thumbnailUrl||p.poster_url||p.posterUrl||p.cover_url||p.coverUrl||p.thumb_url||p.thumbUrl||p.preview_url||p.previewUrl||p.image_url||p.imageUrl||'');
  }
  function ownerId(p){p=p||{};return clean(p.user_id||p.creatorId||p.creator_id||p.userId||p.owner_id||p.ownerId||p.author_id||p.authorId||p.uid||p.profile_id);}
  function kindOf(p){p=p||{};return clean(p.kind||p.media_type||p.mediaType||p.home_media_type||p.type||p.content_type).toLowerCase();}
  function rawVideoUrl(p){
    p=p||{};
    return clean(p.media_url||p.mediaUrl||p.video_url||p.videoUrl||p.home_media_url||p.homeMediaUrl||p.url||p.src||p.file_url||p.fileUrl||p.media_path||p.mediaPath||p.storage_path||p.storagePath||p.file_path||p.filePath);
  }
  function canEdit(p){
    var k=kindOf(p),u=rawVideoUrl(p);
    return k.indexOf('video')>=0||/\.(mp4|webm|mov|m4v|3gp)(?:[?#]|$)/i.test(u);
  }
  function readJson(store,key,fallback){try{var raw=store.getItem(key);if(!raw)return fallback;var v=JSON.parse(raw);return v==null?fallback:v;}catch(_e){return fallback;}}
  function writeJson(store,key,value){try{store.setItem(key,JSON.stringify(value));return true;}catch(_e){return false;}}
  function client(){
    try{
      if(window.happyadSupabase)return window.happyadSupabase;
      if(typeof window.happyadSb==='function'){var x=window.happyadSb();if(x)return x;}
      if(window.HappySupabaseClientMasterV972&&typeof window.HappySupabaseClientMasterV972.get==='function')return window.HappySupabaseClientMasterV972.get();
    }catch(_e){}
    return null;
  }
  function localUid(){
    var direct=clean(localStorage.getItem('HAPPYAD_AUTH_UID')||localStorage.getItem('HAPPYAD_USER_ID')||'');if(direct)return direct;
    var keys=['HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL','HAPPYAD_CURRENT_USER','HAPPYAD_AUTH_USER','HAPPYAD_USER'];
    for(var i=0;i<keys.length;i++){
      var u=readJson(localStorage,keys[i],{}),id=clean(u&&(u.id||u.user_id||u.uid||u.auth_id||u.profile_id));if(id)return id;
    }
    try{
      for(var j=0;j<localStorage.length;j++){
        var k=localStorage.key(j)||'';if(k.indexOf('sb-')!==0||k.indexOf('-auth-token')<0)continue;
        var token=readJson(localStorage,k,{}),tid=clean(token&&token.user&&(token.user.id||token.user.user_id));if(tid)return tid;
      }
    }catch(_scan){}
    return '';
  }
  async function resolveUid(){
    var fallback=localUid(),c=client();
    if(c&&c.auth&&c.auth.getUser){
      try{
        var r=await Promise.race([c.auth.getUser(),new Promise(function(_,reject){setTimeout(function(){reject(new Error('auth timeout'));},1600);})]);
        var id=clean(r&&r.data&&r.data.user&&r.data.user.id);if(id){return id;}
      }catch(_e){}
    }
    return fallback;
  }
  function publicStorageUrl(path){
    path=clean(path);if(!path)return '';
    if(/^(https?:|blob:|data:)/i.test(path))return path;
    path=path.replace(/^\/+/, '').replace(/^happyad-media\//i,'');
    try{var c=client(),r=c&&c.storage&&c.storage.from(BUCKET).getPublicUrl(path);return clean(r&&r.data&&r.data.publicUrl);}catch(_e){return '';}
  }
  function resolveVideoUrl(p){
    var raw=rawVideoUrl(p);if(!raw)return '';
    if(/^(https?:|blob:|data:)/i.test(raw))return raw;
    return publicStorageUrl(raw)||raw;
  }
  function fmtTime(s){
    s=Math.max(0,Math.floor(num(s,0)));var m=Math.floor(s/60),r=s%60;return m+':'+String(r).padStart(2,'0');
  }
  function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');s.id=STYLE_ID;
    s.textContent='\
#'+EDITOR_ID+'{position:fixed!important;inset:0!important;z-index:2147483500!important;background:#07090e!important;color:#fff!important;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif!important;display:flex!important;justify-content:center!important;overflow:hidden!important;overscroll-behavior:contain!important}#'+EDITOR_ID+' *{box-sizing:border-box!important}#'+EDITOR_ID+' .haVcPanel{width:min(620px,100%)!important;height:100dvh!important;min-height:0!important;padding:calc(7px + env(safe-area-inset-top,0px)) 12px calc(8px + env(safe-area-inset-bottom,0px))!important;display:flex!important;flex-direction:column!important;gap:8px!important;overflow-y:auto!important;scrollbar-width:none!important}#'+EDITOR_ID+' .haVcPanel::-webkit-scrollbar{display:none!important}#'+EDITOR_ID+' .haVcHead{display:flex!important;align-items:center!important;gap:10px!important;min-height:48px!important;flex:0 0 auto!important}#'+EDITOR_ID+' .haVcHeadText{flex:1 1 auto!important;min-width:0!important;text-align:left!important;line-height:1.12!important}#'+EDITOR_ID+' .haVcHeadText b{display:block!important;font-size:18px!important;font-weight:1000!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}#'+EDITOR_ID+' .haVcHeadText span{display:block!important;margin-top:3px!important;color:#aeb5c3!important;font-size:11px!important;font-weight:750!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}#'+EDITOR_ID+' .haVcClose{flex:0 0 40px!important;width:40px!important;height:40px!important;border:1px solid rgba(255,255,255,.13)!important;border-radius:50%!important;background:#171c26!important;color:#fff!important;font-size:22px!important;display:grid!important;place-items:center!important;padding:0!important}#'+EDITOR_ID+' .haVcStage{position:relative!important;width:100%!important;height:min(43dvh,510px)!important;min-height:230px!important;flex:0 0 auto!important;background:#020305!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:19px!important;overflow:hidden!important;display:grid!important;place-items:center!important}#'+EDITOR_ID+' .haVcStage video,#'+EDITOR_ID+' .haVcStage img{width:100%!important;height:100%!important;object-fit:contain!important;background:#020305!important}#'+EDITOR_ID+' .haVcStage img[hidden],#'+EDITOR_ID+' .haVcStage video[hidden]{display:none!important}#'+EDITOR_ID+' .haVcStatus{position:absolute!important;left:10px!important;right:10px!important;bottom:10px!important;background:rgba(5,7,11,.86)!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:12px!important;padding:8px 10px!important;text-align:center!important;font-size:11px!important;line-height:1.25!important;font-weight:850!important;backdrop-filter:blur(9px)!important}#'+EDITOR_ID+' .haVcStatus[hidden]{display:none!important}#'+EDITOR_ID+' .haVcControls{flex:0 0 auto!important;background:#11161f!important;border:1px solid rgba(255,255,255,.10)!important;border-radius:17px!important;padding:10px!important;display:grid!important;gap:7px!important}#'+EDITOR_ID+' .haVcRange{width:100%!important;height:27px!important;margin:0!important;accent-color:#ff9100!important}#'+EDITOR_ID+' .haVcTimes{display:flex!important;justify-content:space-between!important;color:#c9ced8!important;font-size:11px!important;font-weight:900!important;margin-top:-4px!important}#'+EDITOR_ID+' .haVcNudge{display:grid!important;grid-template-columns:1fr 1fr 1fr!important;gap:7px!important}#'+EDITOR_ID+' button{appearance:none!important;-webkit-appearance:none!important;border:0!important;touch-action:manipulation!important}#'+EDITOR_ID+' .haVcSmall,#'+EDITOR_ID+' .haVcPick{min-height:40px!important;border-radius:12px!important;background:#202735!important;color:#fff!important;font-size:12px!important;font-weight:950!important;padding:7px 10px!important}#'+EDITOR_ID+' .haVcSmall:active,#'+EDITOR_ID+' .haVcPick:active{transform:translateY(1px)!important;background:#303949!important}#'+EDITOR_ID+' .haVcPick{width:100%!important;border:1px dashed rgba(255,164,54,.55)!important;background:rgba(255,145,0,.10)!important;color:#ffbd6b!important}#'+EDITOR_ID+' .haVcHint{color:#aeb5c3!important;font-size:10px!important;line-height:1.3!important;text-align:center!important}#'+EDITOR_ID+' .haVcProgress{height:4px!important;border-radius:999px!important;background:rgba(255,255,255,.09)!important;overflow:hidden!important}#'+EDITOR_ID+' .haVcProgress i{display:block!important;width:0;height:100%!important;background:linear-gradient(90deg,#ff9b20,#ff6d21)!important;transition:width .2s ease!important}#'+EDITOR_ID+' .haVcFoot{position:sticky!important;bottom:0!important;z-index:3!important;display:grid!important;grid-template-columns:.8fr 1.35fr!important;gap:8px!important;flex:0 0 auto!important;margin-top:0!important;padding-top:2px!important;background:linear-gradient(180deg,rgba(7,9,14,0),#07090e 28%)!important}#'+EDITOR_ID+' .haVcCancel,#'+EDITOR_ID+' .haVcSave{min-height:48px!important;border-radius:14px!important;font-size:13px!important;font-weight:1000!important;padding:9px 11px!important}#'+EDITOR_ID+' .haVcCancel{background:#1c222d!important;color:#fff!important;border:1px solid rgba(255,255,255,.10)!important}#'+EDITOR_ID+' .haVcSave{background:linear-gradient(135deg,#ff9b20,#ff6d21)!important;color:#111!important}#'+EDITOR_ID+' .haVcSave:disabled{opacity:.48!important;filter:grayscale(.35)!important}#'+EDITOR_ID+'.haSaving .haVcCancel,#'+EDITOR_ID+'.haSaving .haVcClose{pointer-events:none!important;opacity:.45!important}@media(max-height:760px){#'+EDITOR_ID+' .haVcStage{height:min(36dvh,360px)!important;min-height:190px!important}#'+EDITOR_ID+' .haVcHint{display:none!important}#'+EDITOR_ID+' .haVcPanel{gap:6px!important}#'+EDITOR_ID+' .haVcControls{padding:8px!important;gap:5px!important}}@media(max-width:360px){#'+EDITOR_ID+' .haVcHeadText b{font-size:16px!important}#'+EDITOR_ID+' .haVcHeadText span{font-size:10px!important}#'+EDITOR_ID+' .haVcPanel{padding-left:9px!important;padding-right:9px!important}}.happyadPosterRefreshingV693{background:radial-gradient(circle at 50% 38%,#263044 0,#151b27 44%,#090c12 100%)!important}.happyadPosterRefreshingV693>img,.happyadPosterRefreshingV693 img.happyadVideoPoster,.happyadPosterRefreshingV693 img.hpvStableVideoPoster{opacity:0!important}.happyadPosterRefreshingV693.haPosterReadyV693>img,.happyadPosterRefreshingV693.haPosterReadyV693 img.happyadVideoPoster,.happyadPosterRefreshingV693.haPosterReadyV693 img.hpvStableVideoPoster{opacity:1!important;transition:opacity .16s ease!important}';
    document.head.appendChild(s);
  }

  function parentShellDoc(){try{return window.parent&&window.parent!==window&&window.parent.document?window.parent.document:document;}catch(_e){return document;}}
  function enterFullscreenShell(ctx){
    var d=parentShellDoc(),b=d&&d.body;if(!b)return;
    ctx.shellDoc=d;ctx.shellBody=b;ctx.shellHadClass=b.classList.contains('happyadVideoCoverEditorOpenV693');
    b.classList.add('happyadVideoCoverEditorOpenV693');
    var dock=d.getElementById('happyadMainDockV585')||d.querySelector('.bottom.happyadMainDockV585');
    if(dock){ctx.shellDock=dock;ctx.shellDockState={display:dock.style.getPropertyValue('display'),displayPriority:dock.style.getPropertyPriority('display'),visibility:dock.style.getPropertyValue('visibility'),visibilityPriority:dock.style.getPropertyPriority('visibility'),pointer:dock.style.getPropertyValue('pointer-events'),pointerPriority:dock.style.getPropertyPriority('pointer-events'),aria:dock.getAttribute('aria-hidden')};dock.style.setProperty('display','none','important');dock.style.setProperty('visibility','hidden','important');dock.style.setProperty('pointer-events','none','important');dock.setAttribute('aria-hidden','true');}
    var shell=d.getElementById('happyadAppShell');if(shell){ctx.shellApp=shell;ctx.shellAppState={inset:shell.style.getPropertyValue('inset'),insetPriority:shell.style.getPropertyPriority('inset'),height:shell.style.getPropertyValue('height'),heightPriority:shell.style.getPropertyPriority('height'),maxHeight:shell.style.getPropertyValue('max-height'),maxHeightPriority:shell.style.getPropertyPriority('max-height')};shell.style.setProperty('inset','0','important');shell.style.setProperty('height','100dvh','important');shell.style.setProperty('max-height','none','important');}
  }
  function leaveFullscreenShell(ctx){
    if(!ctx)return;var b=ctx.shellBody,d=ctx.shellDock,st=ctx.shellDockState;
    try{if(b&&!ctx.shellHadClass)b.classList.remove('happyadVideoCoverEditorOpenV693');}catch(_e){}
    try{if(d&&st){if(st.display)d.style.setProperty('display',st.display,st.displayPriority||'');else d.style.removeProperty('display');if(st.visibility)d.style.setProperty('visibility',st.visibility,st.visibilityPriority||'');else d.style.removeProperty('visibility');if(st.pointer)d.style.setProperty('pointer-events',st.pointer,st.pointerPriority||'');else d.style.removeProperty('pointer-events');if(st.aria==null)d.removeAttribute('aria-hidden');else d.setAttribute('aria-hidden',st.aria);}}catch(_r){}
    try{var a=ctx.shellApp,as=ctx.shellAppState;if(a&&as){if(as.inset)a.style.setProperty('inset',as.inset,as.insetPriority||'');else a.style.removeProperty('inset');if(as.height)a.style.setProperty('height',as.height,as.heightPriority||'');else a.style.removeProperty('height');if(as.maxHeight)a.style.setProperty('max-height',as.maxHeight,as.maxHeightPriority||'');else a.style.removeProperty('max-height');}}catch(_a){}
  }

  function setStatus(ctx,text,show){if(!ctx||!ctx.status)return;ctx.status.textContent=text||'';ctx.status.hidden=show===false||!text;}
  function setProgress(ctx,value,text){if(!ctx)return;var p=Math.max(0,Math.min(100,num(value,0)));if(ctx.progress)ctx.progress.style.width=p+'%';if(text)setStatus(ctx,text,true);}
  function close(){
    if(!active)return;var ctx=active;active=null;
    try{if(ctx.video){ctx.video.pause();ctx.video.removeAttribute('src');ctx.video.load();}}catch(_e){}
    try{if(ctx.objectUrl)URL.revokeObjectURL(ctx.objectUrl);}catch(_u){}
    try{ctx.root.remove();}catch(_r){}
    try{document.documentElement.style.overflow=ctx.oldHtmlOverflow||'';document.body.style.overflow=ctx.oldBodyOverflow||'';}catch(_s){}
    leaveFullscreenShell(ctx);
  }

  function seekTo(ctx,value){
    if(!ctx||!ctx.video||!Number.isFinite(ctx.video.duration))return;
    var max=Math.max(0,ctx.video.duration-.04),t=Math.max(0,Math.min(max,num(value,0)));
    ctx.selectedTime=t;ctx.frameReady=false;
    try{ctx.video.pause();ctx.video.currentTime=t;}catch(_e){}
    ctx.range.value=String(t);ctx.current.textContent=fmtTime(t);ctx.selectedFile=null;ctx.image.hidden=true;ctx.video.hidden=false;ctx.pick.textContent='Choisir une image du téléphone';setStatus(ctx,'Préparation de cette image…',true);
  }
  function selectedImageFromPhone(ctx,file){
    if(!ctx||!file||!/^image\//i.test(file.type||'')){setStatus(ctx,'Choisis un fichier image valide.',true);return;}
    try{if(ctx.objectUrl)URL.revokeObjectURL(ctx.objectUrl);}catch(_e){}
    ctx.selectedFile=file;ctx.objectUrl=URL.createObjectURL(file);ctx.image.src=ctx.objectUrl;ctx.image.hidden=false;ctx.video.hidden=true;ctx.save.disabled=false;ctx.pick.textContent='Changer l’image choisie';setStatus(ctx,'Image du téléphone sélectionnée.',true);
  }

  function imageToJpegBlob(file){
    return new Promise(function(resolve,reject){
      var url='';try{url=URL.createObjectURL(file);}catch(e){reject(e);return;}
      var img=new Image();
      img.onload=function(){
        try{
          var w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;if(!w||!h)throw new Error('Image vide');
          var scale=Math.min(1,1280/Math.max(w,h)),cw=Math.max(2,Math.round(w*scale)),ch=Math.max(2,Math.round(h*scale));
          var c=document.createElement('canvas');c.width=cw;c.height=ch;var x=c.getContext('2d',{alpha:false});x.fillStyle='#050609';x.fillRect(0,0,cw,ch);x.drawImage(img,0,0,cw,ch);
          c.toBlob(function(blob){URL.revokeObjectURL(url);if(blob&&blob.size>500)resolve(blob);else reject(new Error('Image non convertible'));},'image/jpeg',.9);
        }catch(e){URL.revokeObjectURL(url);reject(e);}
      };
      img.onerror=function(){URL.revokeObjectURL(url);reject(new Error('Image illisible'));};img.src=url;
    });
  }
  function waitForVideoEvent(video,names,timeout){
    names=Array.isArray(names)?names:[names];return new Promise(function(resolve){var done=false,timer=null;function finish(name){if(done)return;done=true;if(timer)clearTimeout(timer);names.forEach(function(n){try{video.removeEventListener(n,onEvent);}catch(_e){}});resolve(name||'timeout');}function onEvent(e){finish(e&&e.type||'event');}names.forEach(function(n){try{video.addEventListener(n,onEvent,{once:false});}catch(_e){}});timer=setTimeout(function(){finish('timeout');},Math.max(120,num(timeout,1400)));});
  }
  function waitForPresentedFrame(video,timeout){
    if(video&&typeof video.requestVideoFrameCallback==='function')return new Promise(function(resolve){var done=false,t=setTimeout(function(){if(!done){done=true;resolve(false);}},Math.max(180,num(timeout,900)));try{video.requestVideoFrameCallback(function(){if(done)return;done=true;clearTimeout(t);resolve(true);});}catch(_e){clearTimeout(t);resolve(false);}});
    return waitForVideoEvent(video,['loadeddata','canplay','seeked','timeupdate'],timeout).then(function(name){return name!=='timeout';});
  }
  async function prepareVideoFrame(ctx){
    var video=ctx&&ctx.video;if(!video)throw new Error('Lecteur vidéo indisponible');
    var target=num(ctx.selectedTime,video.currentTime||0);if(!Number.isFinite(target))target=0;
    if(video.readyState<1||!Number.isFinite(video.duration)||video.duration<=0){await waitForVideoEvent(video,['loadedmetadata','durationchange'],2200);}
    if(Number.isFinite(video.duration)&&video.duration>0){target=Math.max(0,Math.min(Math.max(0,video.duration-.05),target));ctx.selectedTime=target;if(Math.abs(num(video.currentTime,0)-target)>.12){try{video.currentTime=target;}catch(_e){}await waitForVideoEvent(video,['seeked','timeupdate','loadeddata'],1800);}}
    var wasPaused=video.paused;video.muted=true;video.playsInline=true;
    for(var attempt=0;attempt<3;attempt++){
      if(video.videoWidth>0&&video.videoHeight>0&&video.readyState>=2){await waitForPresentedFrame(video,500);ctx.frameReady=true;return video;}
      try{var playPromise=video.play();if(playPromise&&playPromise.then)await Promise.race([playPromise,wait(700)]);}catch(_p){}
      await waitForPresentedFrame(video,1000+attempt*350);
      if(wasPaused||attempt===2){try{video.pause();}catch(_q){}}
      if(Number.isFinite(video.duration)&&video.duration>0&&Math.abs(num(video.currentTime,0)-target)>.18){try{video.currentTime=target;}catch(_s){}await waitForVideoEvent(video,['seeked','timeupdate'],900);}
      if(video.videoWidth>0&&video.videoHeight>0&&video.readyState>=2){ctx.frameReady=true;return video;}
    }
    try{video.pause();}catch(_x){}
    throw new Error('L’image vidéo n’a pas pu être décodée. Choisis une image du téléphone.');
  }
  async function captureVideoFrame(ctx){
    var video=await prepareVideoFrame(ctx);
    var w=video.videoWidth,h=video.videoHeight;if(!w||!h)throw new Error('Dimensions vidéo indisponibles');
    var scale=Math.min(1,1280/Math.max(w,h)),cw=Math.max(2,Math.round(w*scale)),ch=Math.max(2,Math.round(h*scale));
    var c=document.createElement('canvas');c.width=cw;c.height=ch;var x=c.getContext('2d',{alpha:false});x.fillStyle='#050609';x.fillRect(0,0,cw,ch);
    try{x.drawImage(video,0,0,cw,ch);}catch(e){throw new Error('Cette ancienne vidéo bloque l’extraction. Choisis une image du téléphone.');}
    return await new Promise(function(resolve,reject){try{c.toBlob(function(blob){if(blob&&blob.size>500)resolve(blob);else reject(new Error('Cette image ne peut pas être extraite'));},'image/jpeg',.9);}catch(e){reject(new Error('Cette ancienne vidéo bloque l’extraction. Choisis une image du téléphone.'));}});
  }

  function patchTree(value,id,patch,seen){
    if(!value||typeof value!=='object')return false;seen=seen||[];if(seen.indexOf(value)>=0)return false;seen.push(value);var changed=false;
    if(clean(value.id||value.post_id||value.postId||value.source_id)===id){Object.keys(patch).forEach(function(k){value[k]=patch[k];});changed=true;}
    if(Array.isArray(value)){value.forEach(function(x){if(patchTree(x,id,patch,seen))changed=true;});}
    else Object.keys(value).forEach(function(k){if(k==='parentNode'||k==='ownerDocument'||k==='window')return;var v=value[k];if(v&&typeof v==='object'&&(Array.isArray(v)||Object.prototype.toString.call(v)==='[object Object]')){if(patchTree(v,id,patch,seen))changed=true;}});
    return changed;
  }
  function storageKeys(store){
    var out=CACHE_KEYS.slice();try{for(var i=0;i<store.length;i++){var k=store.key(i)||'';if(/^HAPPYAD_.*(?:POST|VIDEO|PROFILE)/i.test(k))out.push(k);}}catch(_e){}
    var seen={};return out.filter(function(k){if(!k||seen[k])return false;seen[k]=1;return true;});
  }
  function patchStorage(store,id,patch){
    storageKeys(store).forEach(function(k){var v=readJson(store,k,null);if(v&&patchTree(v,id,patch,[]))writeJson(store,k,v);});
  }
  function cssEscape(v){try{return CSS.escape(String(v));}catch(_e){return String(v).replace(/["\\]/g,'\\$&');}}
  function swapPosterImage(img,url){
    if(!img||!url)return;var host=img.parentElement,pre=new Image();
    try{if(host){host.classList.remove('haPosterReadyV693');host.classList.add('happyadPosterRefreshingV693');}img.style.opacity='0';}catch(_e){}
    pre.onload=function(){try{img.src=url;img.setAttribute('src',url);requestAnimationFrame(function(){try{if(host){host.classList.add('haPosterReadyV693');setTimeout(function(){host.classList.remove('happyadPosterRefreshingV693','haPosterReadyV693');},220);}img.style.opacity='1';}catch(_e){}});}catch(_e){}};
    pre.onerror=function(){try{img.src=url;img.setAttribute('src',url);img.style.opacity='1';if(host)host.classList.remove('happyadPosterRefreshingV693','haPosterReadyV693');}catch(_e){}};
    pre.src=url;
  }
  function applyDom(id,url){
    if(!id||!url)return;var safe=cssEscape(id),roots=[];
    ['[data-post-id="'+safe+'"]','[data-id="'+safe+'"]','[data-photo-id="'+safe+'"]','[data-source-id="'+safe+'"]'].forEach(function(sel){try{document.querySelectorAll(sel).forEach(function(el){if(roots.indexOf(el)<0)roots.push(el);});}catch(_e){}});
    roots.forEach(function(root){
      try{if(root.__happyadPostV613E)patchTree(root.__happyadPostV613E,id,{thumbnail_url:url,thumbnailUrl:url,poster_url:url,posterUrl:url,cover_url:url,coverUrl:url},[]);if(root.__happyadPost)patchTree(root.__happyadPost,id,{thumbnail_url:url,thumbnailUrl:url,poster_url:url,posterUrl:url,cover_url:url,coverUrl:url},[]);}catch(_p){}
      try{root.querySelectorAll('video').forEach(function(v){v.poster=url;v.setAttribute('poster',url);});}catch(_v){}
      try{root.querySelectorAll('img.happyadVideoPoster,img[data-video-poster],img.hpvStableVideoPoster,.miniMedia>img,.profilePostMedia>img,.profileMedia>img,.ha581Slide>img').forEach(function(img){swapPosterImage(img,url);});}catch(_i){}
      try{root.querySelectorAll('.loader').forEach(function(ld){ld.classList.add('hasPoster');ld.style.backgroundImage='url("'+url.replace(/"/g,'%22')+'")';});}catch(_l){}
    });
    try{document.querySelectorAll('video[data-post-id="'+safe+'"],video[data-id="'+safe+'"]').forEach(function(v){v.poster=url;});}catch(_d){}
  }
  function detailPatch(detail){
    detail=detail||{};var url=clean(detail.thumbnail_url||detail.thumbnailUrl||detail.poster_url||detail.posterUrl),id=clean(detail.postId||detail.post_id||detail.id);if(!id||!url)return null;
    return {id:id,url:url,frameTime:num(detail.cover_frame_time||detail.coverFrameTime,0),updatedAt:clean(detail.updated_at||detail.updatedAt)||new Date().toISOString(),marketplaceMedia:marketplaceMediaArray(detail.marketplace_media||detail.marketplaceMedia)};
  }
  function applyUpdate(detail,opts){
    var d=detailPatch(detail);if(!d)return;
    var patch={thumbnail_url:d.url,thumbnailUrl:d.url,poster_url:d.url,posterUrl:d.url,cover_url:d.url,coverUrl:d.url,cover_frame_time:d.frameTime,coverFrameTime:d.frameTime,thumbnail_updated_at:d.updatedAt};
    if(d.marketplaceMedia&&d.marketplaceMedia.length){patch.marketplace_media=d.marketplaceMedia;patch.marketplaceMedia=d.marketplaceMedia;patch.media=d.marketplaceMedia;}
    try{patchStorage(localStorage,d.id,patch);patchStorage(sessionStorage,d.id,patch);var tk=thumbKey(d.id);localStorage.setItem(tk,d.url);sessionStorage.setItem(tk,d.url);}catch(_s){}
    try{
      ['ALL_POSTS','HAPPYAD_STORIES_ITEMS','HAPPYAD_VIDEO_ITEMS','HAPPYAD_PROFILE_POSTS'].forEach(function(name){var value=window[name];if(value&&typeof value==='object')patchTree(value,d.id,patch,[]);});
    }catch(_g){}
    try{applyDom(d.id,d.url);}catch(_d){}
    try{if(active&&active.post&&postId(active.post)===d.id)patchTree(active.post,d.id,patch,[]);}catch(_a){}
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_VIDEO_POSTER_UPDATED_V693',{detail:Object.assign({},d,patch)}));window.dispatchEvent(new CustomEvent('HAPPYAD_VIDEO_POSTER_UPDATED_V692',{detail:Object.assign({},d,patch)}));}catch(_e){}
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_POST_MUTATED_V613E',{detail:{action:'video-poster',postId:d.id,postIds:[d.id],patch:patch,at:Date.now()}}));}catch(_m){}
    if(opts&&opts.persist){try{localStorage.setItem(UPDATE_KEY,JSON.stringify({postId:d.id,thumbnail_url:d.url,poster_url:d.url,cover_frame_time:d.frameTime,marketplace_media:d.marketplaceMedia||[],updated_at:d.updatedAt,at:Date.now()}));}catch(_p){}}
  }
  function broadcastChildren(detail,except){
    try{document.querySelectorAll('iframe').forEach(function(frame){if(except&&frame.contentWindow===except)return;try{frame.contentWindow.postMessage({type:UPDATE_KEY,detail:detail},'*');}catch(_e){}});}catch(_f){}
  }
  function broadcast(detail){
    applyUpdate(detail,{persist:true});
    try{
      if(window.parent&&window.parent!==window)window.parent.postMessage({type:UPDATE_KEY,detail:detail},'*');
      else broadcastChildren(detail,null);
    }catch(_e){}
  }

  function marketplaceMediaArray(value){
    if(Array.isArray(value))return value.map(function(x){return x&&typeof x==='object'?Object.assign({},x):x;});
    if(typeof value==='string'){try{var parsed=JSON.parse(value);return Array.isArray(parsed)?parsed.map(function(x){return x&&typeof x==='object'?Object.assign({},x):x;}):[];}catch(_e){return [];}}
    return [];
  }
  function marketplaceMediaType(item){
    if(!item)return '';
    if(typeof item==='string')return /\.(mp4|webm|mov|m4v|3gp|mkv|avi)(?:[?#]|$)/i.test(item)?'video':'image';
    var type=clean(item.type||item.media_type||item.kind).toLowerCase(),src=clean(item.src||item.url||item.media_url||item.video_url);
    return type.indexOf('video')>=0||/\.(mp4|webm|mov|m4v|3gp|mkv|avi)(?:[?#]|$)/i.test(src)?'video':'image';
  }
  function patchMarketplaceVideoPoster(row,url){
    row=row||{};var media=marketplaceMediaArray(row.marketplace_media||row.marketplaceMedia||row.media),market=!!(row.happyad_marketplace===true||row.is_marketplace===true||clean(row.mode).toLowerCase()==='marketplace'||media.length);
    if(!market||!media.length)return {market:false,media:media,target:-1};
    var coverIndex=Math.max(0,Number(row.marketplace_cover_index||row.coverIndex||0)||0),coverType=clean(row.marketplace_cover_type||row.media_type||row.kind).toLowerCase(),target=-1;
    if(coverType.indexOf('video')>=0&&media[coverIndex]&&marketplaceMediaType(media[coverIndex])==='video')target=coverIndex;
    if(target<0){for(var i=0;i<media.length;i++){if(marketplaceMediaType(media[i])==='video'){target=i;break;}}}
    if(target>=0){
      var item=media[target];if(typeof item==='string')item={src:item,type:'video'};else item=Object.assign({},item);
      item.type='video';item.poster=url;item.poster_url=url;item.thumbnail_url=url;media[target]=item;
    }
    return {market:true,media:media,target:target};
  }
  async function uploadAndSave(ctx,blob){
    var c=client();if(!c)throw new Error('Supabase indisponible');
    var uid=await resolveUid(),id=postId(ctx.post);if(!uid)throw new Error('Connexion requise');if(uid!==ownerId(ctx.post))throw new Error('Cette vidéo ne t’appartient pas');
    var path=uid+'/thumbs/'+id+'-cover-'+Date.now()+'.jpg';
    setProgress(ctx,35,'Envoi de la nouvelle miniature…');
    var up=await c.storage.from(BUCKET).upload(path,blob,{upsert:false,cacheControl:'31536000',contentType:'image/jpeg'});if(up&&up.error)throw up.error;
    var pub=c.storage.from(BUCKET).getPublicUrl(path),url=clean(pub&&pub.data&&pub.data.publicUrl);if(!url)throw new Error('URL de miniature vide');
    setProgress(ctx,70,'Mise à jour de la publication…');
    var currentRow=ctx.post||{};
    try{var read=await c.from('happyad_posts').select('*').eq('id',id).eq('user_id',uid).maybeSingle();if(read&&!read.error&&read.data)currentRow=read.data;}catch(_read){}
    var mediaPatch=patchMarketplaceVideoPoster(currentRow,url);
    var payload={thumbnail_url:url,poster_url:url,cover_frame_time:ctx.selectedFile?0:num(ctx.selectedTime,ctx.video.currentTime||0)};
    if(mediaPatch.market&&mediaPatch.target>=0){payload.marketplace_media=mediaPatch.media;payload.media=mediaPatch.media;}
    var last='',saved=false;
    for(var attempt=0;attempt<5;attempt++){
      var q=c.from('happyad_posts').update(payload).eq('id',id).eq('user_id',uid).select('id').maybeSingle(),r=await q;
      if(!r||!r.error){if(!r||!r.data||!r.data.id)throw new Error('Publication non modifiée : propriétaire ou règle Supabase refusée');saved=true;break;}
      last=clean(r.error.message||r.error.details||r.error.hint||r.error);
      var m=last.match(/(?:column|champ) ["']?([a-zA-Z0-9_]+)["']? (?:of relation|does not exist|n.existe pas)|["']([a-zA-Z0-9_]+)["'] column/i),col=clean(m&&(m[1]||m[2]));
      if(col&&col!=='thumbnail_url'&&Object.prototype.hasOwnProperty.call(payload,col)){delete payload[col];continue;}
      throw r.error;
    }
    if(!saved)throw new Error(last||'La miniature n’a pas été enregistrée dans Supabase');
    setProgress(ctx,92,'Actualisation dans Fyblic…');
    var detail={postId:id,thumbnail_url:url,poster_url:url,cover_frame_time:num(payload.cover_frame_time,0),updated_at:new Date().toISOString(),owner_id:uid,source:'creator-video-cover-v828',marketplace_media:(mediaPatch.market&&mediaPatch.target>=0)?mediaPatch.media:null};
    var patch={thumbnail_url:url,thumbnailUrl:url,poster_url:url,posterUrl:url,cover_url:url,coverUrl:url,cover_frame_time:detail.cover_frame_time,coverFrameTime:detail.cover_frame_time};
    if(detail.marketplace_media){patch.marketplace_media=detail.marketplace_media;patch.marketplaceMedia=detail.marketplace_media;patch.media=detail.marketplace_media;}
    patchTree(ctx.post,id,patch,[]);broadcast(detail);
    try{localStorage.setItem('HAPPYAD_HOME_REFRESH_NEEDED',String(Date.now()));localStorage.setItem('HAPPYAD_PROFILE_REFRESH_NEEDED',String(Date.now()));}catch(_r){}
    setProgress(ctx,100,'Miniature mise à jour pour tous les comptes.');await wait(650);close();
  }

  async function save(ctx){
    if(!ctx||ctx.saving)return;ctx.saving=true;ctx.root.classList.add('haSaving');ctx.save.disabled=true;
    try{
      setProgress(ctx,12,ctx.selectedFile?'Préparation de l’image…':'Extraction de l’image choisie…');
      var blob=ctx.selectedFile?await imageToJpegBlob(ctx.selectedFile):await captureVideoFrame(ctx);
      if(!blob||blob.size<500)throw new Error('Miniature vide');
      await uploadAndSave(ctx,blob);
    }catch(e){
      ctx.saving=false;ctx.root.classList.remove('haSaving');ctx.save.disabled=false;setProgress(ctx,0,'Impossible d’enregistrer : '+clean(e&&e.message||e));
    }
  }

  async function open(options){
    options=options||{};var p=options.post||{};if(!postId(p)){return false;}if(!canEdit(p)){return false;}
    var uid=await resolveUid();if(!uid||uid!==ownerId(p)){return false;}
    close();ensureStyle();
    var root=document.createElement('div');root.id=EDITOR_ID;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.innerHTML='\
<div class="haVcPanel"><div class="haVcHead"><div class="haVcHeadText"><b>Modifier la miniature vidéo</b><span>Choisis l’image affichée partout dans Fyblic</span></div><button class="haVcClose" type="button" aria-label="Fermer">×</button></div><div class="haVcStage"><video muted playsinline webkit-playsinline preload="auto" crossorigin="anonymous"></video><img alt="Miniature choisie" hidden><div class="haVcStatus">Chargement de la vidéo…</div></div><div class="haVcControls"><input class="haVcRange" type="range" min="0" max="1" step="0.05" value="0" disabled><div class="haVcTimes"><span class="haVcCurrent">0:00</span><span class="haVcDuration">0:00</span></div><div class="haVcNudge"><button class="haVcSmall" data-act="back" type="button">−1 s</button><button class="haVcSmall" data-act="play" type="button">Lire</button><button class="haVcSmall" data-act="next" type="button">+1 s</button></div><button class="haVcPick" type="button">Choisir une image du téléphone</button><input class="haVcFile" type="file" accept="image/*" hidden><div class="haVcHint">Déplace le curseur jusqu’à l’image voulue. Pour une ancienne vidéo illisible, choisis directement une image depuis le téléphone.</div><div class="haVcProgress"><i></i></div></div><div class="haVcFoot"><button class="haVcCancel" type="button">Annuler</button><button class="haVcSave" type="button" disabled>Enregistrer cette image</button></div></div>';
    var oldHtmlOverflow=document.documentElement.style.overflow||'',oldBodyOverflow=document.body.style.overflow||'';
    document.body.appendChild(root);try{document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';}catch(_s){}
    var ctx={root:root,post:p,oldHtmlOverflow:oldHtmlOverflow,oldBodyOverflow:oldBodyOverflow,video:root.querySelector('video'),image:root.querySelector('img'),status:root.querySelector('.haVcStatus'),range:root.querySelector('.haVcRange'),current:root.querySelector('.haVcCurrent'),duration:root.querySelector('.haVcDuration'),play:root.querySelector('[data-act="play"]'),pick:root.querySelector('.haVcPick'),file:root.querySelector('.haVcFile'),save:root.querySelector('.haVcSave'),progress:root.querySelector('.haVcProgress i'),selectedFile:null,objectUrl:'',saving:false,selectedTime:0,frameReady:false};active=ctx;
    enterFullscreenShell(ctx);root.querySelector('.haVcClose').onclick=close;root.querySelector('.haVcCancel').onclick=close;ctx.save.onclick=function(){save(ctx);};ctx.pick.onclick=function(){ctx.file.click();};ctx.file.onchange=function(){selectedImageFromPhone(ctx,ctx.file.files&&ctx.file.files[0]);};
    root.querySelector('[data-act="back"]').onclick=function(){seekTo(ctx,num(ctx.video.currentTime,0)-1);};root.querySelector('[data-act="next"]').onclick=function(){seekTo(ctx,num(ctx.video.currentTime,0)+1);};ctx.play.onclick=function(){if(ctx.video.hidden){ctx.selectedFile=null;ctx.image.hidden=true;ctx.video.hidden=false;ctx.pick.textContent='Choisir une image du téléphone';}if(ctx.video.paused){ctx.video.play().catch(function(){});}else ctx.video.pause();};
    ctx.range.addEventListener('input',function(){seekTo(ctx,ctx.range.value);});ctx.range.addEventListener('change',function(){prepareVideoFrame(ctx).then(function(){ctx.save.disabled=false;setStatus(ctx,'Image prête. Tu peux l’enregistrer.',true);}).catch(function(){ctx.save.disabled=false;setStatus(ctx,'Appuie sur Enregistrer : Fyblic préparera cette image.',true);});});ctx.video.addEventListener('play',function(){ctx.play.textContent='Pause';});ctx.video.addEventListener('pause',function(){ctx.play.textContent='Lire';});ctx.video.addEventListener('timeupdate',function(){ctx.selectedTime=num(ctx.video.currentTime,ctx.selectedTime||0);if(!ctx.range.matches(':active')){ctx.range.value=String(ctx.selectedTime);ctx.current.textContent=fmtTime(ctx.selectedTime);}});ctx.video.addEventListener('seeked',function(){ctx.frameReady=ctx.video.readyState>=2&&ctx.video.videoWidth>0;ctx.save.disabled=false;setStatus(ctx,'Image prête. Tu peux l’enregistrer.',true);});
    ctx.video.addEventListener('loadedmetadata',function(){var d=num(ctx.video.duration,0);ctx.range.max=String(Math.max(.05,d-.04));ctx.range.disabled=!d;ctx.duration.textContent=fmtTime(d);var initial=num(p.cover_frame_time||p.coverFrameTime,0);if(!initial&&d>2)initial=Math.min(1,d*.08);seekTo(ctx,initial);ctx.save.disabled=false;prepareVideoFrame(ctx).then(function(){ctx.save.disabled=false;setStatus(ctx,'Arrête la vidéo sur l’image que tu veux afficher.',true);}).catch(function(){ctx.save.disabled=false;setStatus(ctx,'Déplace le curseur puis enregistre, ou choisis une image du téléphone.',true);});});
    ctx.video.addEventListener('loadeddata',function(){ctx.frameReady=true;ctx.save.disabled=false;});ctx.video.addEventListener('canplay',function(){ctx.frameReady=true;ctx.save.disabled=false;});ctx.video.addEventListener('error',function(){ctx.range.disabled=true;ctx.save.disabled=!ctx.selectedFile;setStatus(ctx,'Cette ancienne vidéo ne peut pas être lue dans l’éditeur. Choisis une image du téléphone.',true);});
    var src=resolveVideoUrl(p);if(!src){setStatus(ctx,'Fichier vidéo introuvable. Choisis une image du téléphone.',true);ctx.range.disabled=true;}else{ctx.video.src=src;try{ctx.video.load();}catch(_l){}}
    return false;
  }

  function installMessageBridge(){
    window.addEventListener('message',function(e){var d=e&&e.data;if(!d||d.type!==UPDATE_KEY)return;applyUpdate(d.detail||{},{});if(window.parent===window)broadcastChildren(d.detail||{},e.source);});
    window.addEventListener('storage',function(e){if(e.key!==UPDATE_KEY||!e.newValue)return;try{applyUpdate(JSON.parse(e.newValue),{});}catch(_e){}});
  }
  function subscribeRealtime(attempt){
    if(window.parent!==window)return;attempt=attempt||0;var c=client();if(!c||!c.channel){if(attempt<8)setTimeout(function(){subscribeRealtime(attempt+1);},1800);return;}
    if(window.__HAPPYAD_VIDEO_COVER_REALTIME_V693__)return;window.__HAPPYAD_VIDEO_COVER_REALTIME_V693__=true;
    try{
      c.channel('happyad-video-cover-v693').on('postgres_changes',{event:'UPDATE',schema:'public',table:'happyad_posts'},function(payload){var n=payload&&payload.new||{},o=payload&&payload.old||{},url=clean(n.thumbnail_url||n.poster_url);if(!url||url===clean(o.thumbnail_url||o.poster_url))return;var detail={postId:n.id,thumbnail_url:url,poster_url:clean(n.poster_url||url),cover_frame_time:num(n.cover_frame_time,0),updated_at:clean(n.updated_at)||new Date().toISOString(),source:'realtime-v828',marketplace_media:n.marketplace_media||n.media||[]};applyUpdate(detail,{persist:true});broadcastChildren(detail,null);}).subscribe();
    }catch(_e){window.__HAPPYAD_VIDEO_COVER_REALTIME_V693__=false;if(attempt<8)setTimeout(function(){subscribeRealtime(attempt+1);},2200);}
  }

  ensureStyle();installMessageBridge();setTimeout(function(){subscribeRealtime(0);},2200);
  window.happyadOfficialVideoPosterV693=officialPoster;window.HappyVideoCoverEditorV693={version:VERSION,open:open,close:close,canEdit:canEdit,applyUpdate:applyUpdate,resolveVideoUrl:resolveVideoUrl,officialPoster:officialPoster};window.HappyVideoCoverEditorV692=window.HappyVideoCoverEditorV693;
  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('video-cover-editor',{file:'core/video-cover-editor-master-v693.js',responsibility:'miniature vidéo choisie par le créateur, Supabase et propagation globale',active:true,version:VERSION});}catch(_reg){}
})();
