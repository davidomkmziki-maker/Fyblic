(function(){
  'use strict';
  if(window.__HAPPYAD_SHARE_MASTER_V715__)return;
  window.__HAPPYAD_SHARE_MASTER_V715__=true;
  window.__HAPPYAD_SHARE_MASTER_V714__=true;
  window.__HAPPYAD_SHARE_MASTER_V713__=true;
  window.__HAPPYAD_SHARE_MASTER_V712__=true;
  window.__HAPPYAD_SHARE_MASTER_V711__=true;
  window.__HAPPYAD_SHARE_MASTER_V710__=true;
  window.__HAPPYAD_SHARE_MASTER_V709__=true;
  window.__HAPPYAD_SHARE_MASTER_V708__=true;
  window.__HAPPYAD_SHARE_MASTER_V707__=true;
  window.__HAPPYAD_SHARE_MASTER_V705__=true;
  window.__HAPPYAD_SHARE_MASTER_V702__=true;
  window.__HAPPYAD_SHARE_MASTER_V561__=true;
  var VERSION='V1041_SHARE_FIRST_OPEN_READY';
  var CENTER_ID='happyadShareCenter';
  var FRAME_ID='happyadShareCenterFrame';
  var FRAME_URL='modules/share-center.html?v=1041-first-open-ready';
  var SHEET_ID='happyadShareSheet';
  var DRAG_ID='happyadShareDragHandle';
  var HEADER_DRAG_ID='happyadShareHeaderDragZone';
  var HEIGHT_KEY='HAPPYAD_SHARE_SHEET_HEIGHT_V906';
  var HISTORY_FLAG='__happyadShareCenter';
  var current=null;
  var sourceWindow=null;
  var frameReady=false;
  var returnMessageContext=null;
  var sharedPhotoMessageContext=null;
  var sharedPhotoReturnObserver=null;
  var sharedVideoMessageContext=null;
  var sharedVideoReturnFallbackTimer=0;
  var sharedVideoHistoryArmed=false;
  var sharedVideoRestoring=false;
  var sharedVideoPopInstalled=false;
  var shareDragController=null;
  var shareContentPullController=null;
  var sourceMediaSnapshot=null;
  var frameHealthSeq=0;
  var frameHealthTimer=0;
  var frameResumeTimer=0;
  var frameContextRetryTimers=[];
  var recoveryInFlight=false;
  var recoveryAttempts=0;
  var lastFramePongAt=0;
  var hiddenAt=0;
  var externalLaunchAt=0;
  var externalReturnPending=false;
  var openedFromStory=false;
  var openSeq=0;
  var sharePermissionState='pending';
  function clean(v){return String(v==null?'':v).trim();}

  function captureSourceMedia(src){
    sourceMediaSnapshot=null;
    try{
      if(!src||!src.document)return null;
      var videos=Array.prototype.slice.call(src.document.querySelectorAll('video'));
      if(!videos.length)return null;
      var chosen=videos.find(function(v){return !v.paused&&!v.ended&&v.readyState>1;});
      if(!chosen){
        chosen=videos.find(function(v){
          try{
            var r=v.closest('.reel[data-id],.videoCard,[data-post-id]');
            if(!r)return false;
            var b=r.getBoundingClientRect();
            return b.bottom>0&&b.top<(src.innerHeight||720);
          }catch(_e){return false;}
        });
      }
      if(!chosen)chosen=videos[0];
      var host=null;
      try{host=chosen.closest('.reel[data-id],[data-post-id]');}catch(_e){}
      sourceMediaSnapshot={
        win:src,
        video:chosen,
        postId:clean(host&&((host.dataset&&host.dataset.id)||(host.dataset&&host.dataset.postId))),
        currentTime:Number(chosen.currentTime)||0,
        wasPlaying:!chosen.paused&&!chosen.ended,
        muted:!!chosen.muted,
        volume:Number.isFinite(Number(chosen.volume))?Number(chosen.volume):1,
        playbackRate:Number.isFinite(Number(chosen.playbackRate))?Number(chosen.playbackRate):1,
        capturedAt:Date.now()
      };
      try{chosen.dataset.happyadShareKeepAlive='1';}catch(_e){}
      return sourceMediaSnapshot;
    }catch(_e){sourceMediaSnapshot=null;return null;}
  }
  function restoreSourceMedia(snapshot){
    snapshot=snapshot||sourceMediaSnapshot;
    if(!snapshot)return false;
    function restore(){
      try{
        var w=snapshot.win;
        if(!w||w.closed||!w.document)return false;
        var v=snapshot.video;
        if(!v||!v.isConnected){
          if(snapshot.postId){
            var sel='.reel[data-id="'+css(snapshot.postId)+'"] video,[data-post-id="'+css(snapshot.postId)+'"] video';
            v=w.document.querySelector(sel);
          }
          if(!v)v=w.document.querySelector('video');
        }
        if(!v)return false;
        try{v.muted=snapshot.muted;}catch(_e){}
        try{v.volume=snapshot.volume;}catch(_e){}
        try{v.playbackRate=snapshot.playbackRate;}catch(_e){}
        try{
          if(Number.isFinite(snapshot.currentTime)&&Math.abs((Number(v.currentTime)||0)-snapshot.currentTime)>.75){
            v.currentTime=snapshot.currentTime;
          }
        }catch(_e){}
        try{delete v.dataset.happyadShareKeepAlive;}catch(_e){}
        if(snapshot.wasPlaying){
          try{var pr=v.play();if(pr&&pr.catch)pr.catch(function(){});}catch(_e){}
        }
        return true;
      }catch(_e){return false;}
    }
    restore();
    setTimeout(restore,60);
    setTimeout(restore,220);
    return true;
  }
  function shareIsOpen(){
    try{var el=document.getElementById(CENTER_ID);return !!(el&&el.classList.contains('on'));}catch(_e){return false;}
  }
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(_e){return v;}}
  function css(v){try{return window.CSS&&CSS.escape?CSS.escape(String(v)):String(v).replace(/[^a-zA-Z0-9_-]/g,'\\$&');}catch(_e){return String(v||'');}}
  function client(){try{if(typeof window.happyadSb==='function')return window.happyadSb();if(window.happyadSupabase)return window.happyadSupabase;if(window.supabaseClient)return window.supabaseClient;}catch(_e){}return null;}
  function isVideo(p){
    p=p||{};
    var kind=clean(p.media_type||p.mediaType||p.kind||p.type||p.post_type||p.mime_type||p.mimeType).toLowerCase();
    if(/video|reel|clip|mp4|webm|mov|m4v/.test(kind))return true;
    var u=firstMediaValueV878(p.video_url||p.videoUrl||p.video_url_compressed||p.videoUrlCompressed||p.compressed_video_url||p.compressedVideoUrl||p.video_url_original||p.videoUrlOriginal||p.original_video_url||p.originalVideoUrl||p.media_url||p.mediaUrl||p.home_media_url||p.homeMediaUrl||p.media_path||p.mediaPath||p.media_urls||p.mediaUrls||p.media||p.files||p.url||p.src);
    return /\.(?:mp4|webm|mov|m4v|avi|mkv)(?:[?#]|$)/i.test(clean(u));
  }
  function publicMediaUrl(value){
    var src=clean(value);if(!src)return '';
    if(/^https?:\/\//i.test(src)||/^data:/i.test(src)||/^blob:/i.test(src))return src;
    src=src.replace(/^\/+/, '').replace(/^happyad-media\//i,'');
    var base=clean(window.HAPPYAD_SUPABASE_URL||'').replace(/\/+$/,'');
    return base+'/storage/v1/object/public/happyad-media/'+encodeURI(src);
  }
  function firstMediaValueV878(value){
    if(value===null||value===undefined)return '';
    if(typeof value==='string'){
      var str=clean(value);if(!str)return '';
      if((str[0]==='['&&str[str.length-1]===']')||(str[0]==='{'&&str[str.length-1]==='}')){try{return firstMediaValueV878(JSON.parse(str));}catch(_e){}}
      return str;
    }
    if(Array.isArray(value)){for(var i=0;i<value.length;i++){var a=firstMediaValueV878(value[i]);if(a)return a;}return '';}
    if(typeof value==='object'){
      var keys=['url','publicUrl','public_url','src','path','storage_path','storagePath','file_path','filePath','media_url','mediaUrl','image_url','imageUrl','photo_url','photoUrl','video_url','videoUrl','thumbnail_url','thumbnailUrl','poster_url','posterUrl','cover_url','coverUrl','original_url','compressed_url'];
      for(var j=0;j<keys.length;j++){var b=firstMediaValueV878(value[keys[j]]);if(b)return b;}
    }
    return '';
  }
  function mediaCandidate(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    var video=isVideo(raw);
    var poster=firstMediaValueV878(raw.thumbnail_url||raw.thumbnailUrl||raw.poster_url||raw.posterUrl||raw.cover_url||raw.coverUrl||raw.home_thumbnail_url||raw.homeThumbnailUrl||raw.image_url||raw.imageUrl||raw.photo_url||raw.photoUrl||raw.preview_url||raw.previewUrl);
    var media=firstMediaValueV878(raw.home_media_url||raw.homeMediaUrl||raw.media_url||raw.mediaUrl||raw.media_path||raw.mediaPath||raw.image_url||raw.imageUrl||raw.photo_url||raw.photoUrl||raw.video_url_compressed||raw.videoUrlCompressed||raw.compressed_video_url||raw.compressedVideoUrl||raw.video_url_original||raw.videoUrlOriginal||raw.original_video_url||raw.originalVideoUrl||raw.video_url||raw.videoUrl||raw.media_urls||raw.mediaUrls||raw.images||raw.photos||raw.files||raw.gallery||raw.medias||raw.media||raw.marketplace_media||raw.marketplaceMedia||raw.url||raw.src);
    var chosen=video?(poster||media):(media||poster);
    if(video&&!poster&&/\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(media))chosen='';
    return publicMediaUrl(chosen);
  }
  function isStoryShare(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    var kind=clean(raw.content_type||raw.source_type||raw.mode||raw.category||raw.type).toLowerCase();
    return kind==='story'||!!raw.story_id||raw.__storyTable==='happyad_stories';
  }
  function normalize(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    var story=isStoryShare(raw);
    var id=clean(story?(raw.story_id||raw.id||raw.sourceId):(raw.id||raw.post_id||raw.postId||raw.publicationId||raw.publication_id));
    var type=isVideo(raw)?'video':'photo';
    var media=story?publicMediaUrl(raw.media_url||raw.mediaUrl||raw.preview_url||raw.thumbnail_url||raw.poster_url):mediaCandidate(raw);
    return {
      id:id,post_id:story?'':id,story_id:story?id:'',content_type:story?'story':'post',source_type:story?'story':'post',mode:story?'story':clean(raw.mode),
      media_type:type,kind:type,media_url:media,
      title:clean(raw.title)||(story?'Story Fyblic':'Publication Fyblic'),
      description:clean(raw.description||raw.desc||raw.caption),
      preview_url:media,
      thumbnail_url:story?publicMediaUrl(raw.thumbnail_url||raw.poster_url||media):media,
      poster_url:story?publicMediaUrl(raw.poster_url||raw.thumbnail_url||media):media,
      author_name:clean(raw.author_name||raw.creatorName||raw.creator_name||raw.display_name||raw.full_name||raw.username),
      owner_id:clean(raw.owner_id||raw.user_id||raw.creatorId||raw.creator_id),
      user_id:clean(raw.user_id||raw.owner_id||raw.creatorId||raw.creator_id),
      created_at:clean(raw.created_at||raw.createdAt),
      expires_at:clean(raw.expires_at||raw.expiresAt),
      updated_at:clean(raw.updated_at||raw.updatedAt||raw.created_at||raw.createdAt),
      share_version:clean(raw.share_version||raw.shareVersion),
      raw:raw
    };
  }
  function localPost(id){
    var lists=[];
    try{if(Array.isArray(window.ALL_POSTS))lists.push(window.ALL_POSTS);}catch(_e){}
    ['HAPPYAD_GLOBAL_POSTS_CACHE_V1','HAPPYAD_HOME_POSTS_CACHE_V1','HAPPYAD_FAST_OPEN_VIDEO_V1','HAPPYAD_VIDEO_CACHE_STABLE_V1'].forEach(function(k){try{var v=JSON.parse(localStorage.getItem(k)||'null');if(Array.isArray(v))lists.push(v);else if(v&&Array.isArray(v.posts))lists.push(v.posts);else if(v&&Array.isArray(v.items))lists.push(v.items);}catch(_e){}});
    for(var i=0;i<lists.length;i++){var p=lists[i].find(function(x){return clean(x&&(x.id||x.post_id))===id;});if(p)return p;}
    return null;
  }
  async function resolve(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    var base=normalize(raw),id=base.id;if(!id||base.content_type==='story')return base;
    var local=localPost(id);
    if(local){
      var localMedia=mediaCandidate(local)||mediaCandidate(raw);
      if(localMedia)return normalize(Object.assign({},raw,local,{id:id,post_id:id,preview_url:localMedia,thumbnail_url:localMedia,poster_url:localMedia}));
    }
    try{
      var c=client();
      if(c&&c.from){
        var r=await c.from('happyad_posts').select('*').eq('id',id).maybeSingle();
        if(r&&!r.error&&r.data){
          var mapped=typeof window.mapHappyPost==='function'?window.mapHappyPost(r.data):r.data;
          /* V714 — un deep link externe ne doit pas hydrater/rendre l'Accueil avant
             l'ouverture du média ciblé. Les ouvertures internes gardent le cache actuel. */
          if(!raw.__happyadDirectNoHomeSeed){try{if(Array.isArray(window.ALL_POSTS)&&!window.ALL_POSTS.some(function(x){return clean(x&&x.id)===id;}))window.ALL_POSTS.unshift(mapped);}catch(_e){}}
          var dbMedia=mediaCandidate(mapped)||mediaCandidate(r.data)||mediaCandidate(raw);
          return normalize(Object.assign({},raw,r.data,mapped,{id:id,post_id:id,preview_url:dbMedia,thumbnail_url:dbMedia,poster_url:dbMedia}));
        }
      }
    }catch(_e){}
    return base;
  }
  async function resolveDirectV879(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    var first=await resolve(raw);
    if(first&&first.id&&mediaCandidate(first))return first;
    var id=clean((first&&first.id)||raw.id||raw.post_id||raw.postId);if(!id)return first;
    /* Deep link externe: le SDK Supabase peut ne pas etre pret dans le premier cycle.
       Une lecture REST exacte evite d'ouvrir un fullscreen vide. */
    try{
      var base=clean(window.HAPPYAD_SUPABASE_URL||'').replace(/\/+$/,'');
      var key=clean(window.HAPPYAD_SUPABASE_KEY||'');
      if(base&&key&&typeof fetch==='function'){
        var ac=typeof AbortController!=='undefined'?new AbortController():null;
        var timer=setTimeout(function(){try{if(ac)ac.abort();}catch(_e){}},2200);
        try{
          var rr=await fetch(base+'/rest/v1/happyad_posts?id=eq.'+encodeURIComponent(id)+'&select=*&limit=1',{headers:{apikey:key,Authorization:'Bearer '+key,Accept:'application/json'},signal:ac?ac.signal:undefined,cache:'no-store'});
          if(rr&&rr.ok){var data=await rr.json();var row=Array.isArray(data)&&data[0]?data[0]:null;if(row){var mapped=typeof window.mapHappyPost==='function'?window.mapHappyPost(row):row;var media=mediaCandidate(mapped)||mediaCandidate(row);return normalize(Object.assign({},raw,row,mapped,{id:id,post_id:id,preview_url:media,thumbnail_url:media,poster_url:media}));}}
        }finally{clearTimeout(timer);}
      }
    }catch(_e){}
    return first;
  }
  function withTimeoutV878(promise,ms){
    return new Promise(function(resolve,reject){
      var done=false,t=setTimeout(function(){if(done)return;done=true;reject(new Error('timeout'));},Math.max(250,Number(ms)||2200));
      Promise.resolve(promise).then(function(v){if(done)return;done=true;clearTimeout(t);resolve(v);},function(e){if(done)return;done=true;clearTimeout(t);reject(e);});
    });
  }
  function explicitPhotoGroupV878(row){
    row=row||{};
    var fields=['album_id','group_id','batch_id','gallery_id','collection_id','multi_id','post_group_id','publication_group_id','parent_post_id','root_post_id','master_post_id','source_publication_id','publication_id'];
    for(var i=0;i<fields.length;i++){var f=fields[i],v=clean(row[f]);if(v)return {field:f,value:v};}
    return null;
  }
  function ownerFieldV878(row){
    row=row||{};var fs=['user_id','creator_id','owner_id','author_id','auth_user_id','account_uid','profile_id','created_by'];
    for(var i=0;i<fs.length;i++){if(clean(row[fs[i]]))return {field:fs[i],value:clean(row[fs[i]])};}
    return null;
  }
  function createdMsV878(row){try{var t=Date.parse(clean(row&&row.created_at));return Number.isFinite(t)?t:0;}catch(_e){return 0;}}
  function sameLegacyPhotoGroupV878(a,b){
    if(!a||!b)return false;
    var oa=ownerFieldV878(a),ob=ownerFieldV878(b);if(!oa||!ob||oa.value!==ob.value)return false;
    var ta=createdMsV878(a),tb=createdMsV878(b);if(!ta||!tb||Math.floor(ta/90000)!==Math.floor(tb/90000))return false;
    function lc(v){return clean(v).toLowerCase();}
    return lc(a.title)===lc(b.title)&&lc(a.description||a.desc||a.caption)===lc(b.description||b.desc||b.caption)&&lc(a.category)===lc(b.category);
  }
  function mappedPhotoV878(row){
    var mapped=row||{};
    try{if(typeof window.mapHappyPost==='function')mapped=window.mapHappyPost(row||{});}catch(_e){}
    var media=mediaCandidate(mapped)||mediaCandidate(row);
    return Object.assign({},mapped,{id:clean(mapped.id||row.id),post_id:clean(mapped.id||row.id),media_type:'photo',mediaType:'photo',kind:'photo',type:'photo',media_url:media,mediaUrl:media,home_media_url:media,image_url:media,photo_url:media,raw:row});
  }
  async function resolvePhotoAlbumV878(post){
    post=post&&typeof post==='object'?post:{};
    var raw=post.raw&&typeof post.raw==='object'?post.raw:post;
    var c=client();if(!c||!c.from||!clean(raw.id||post.id))return post;
    var rows=[raw],grp=explicitPhotoGroupV878(raw);
    try{
      if(grp){
        var qr=await withTimeoutV878(c.from('happyad_posts').select('*').eq(grp.field,grp.value).limit(24),1800);
        if(qr&&!qr.error&&Array.isArray(qr.data)&&qr.data.length)rows=qr.data;
      }else{
        var own=ownerFieldV878(raw),tm=createdMsV878(raw);
        if(own&&tm){
          var start=new Date(Math.floor(tm/90000)*90000).toISOString(),end=new Date((Math.floor(tm/90000)+1)*90000).toISOString();
          var q=c.from('happyad_posts').select('*').eq(own.field,own.value).gte('created_at',start).lt('created_at',end).limit(40);
          var rr=await withTimeoutV878(q,1800);
          if(rr&&!rr.error&&Array.isArray(rr.data)){
            var legacy=rr.data.filter(function(x){return !isVideo(x)&&sameLegacyPhotoGroupV878(raw,x);});
            if(legacy.length>1)rows=legacy;
          }
        }
      }
    }catch(_e){}
    var seen={},items=[];
    rows.forEach(function(r){var id=clean(r&&r.id);if(!id||seen[id]||isVideo(r))return;seen[id]=1;var m=mappedPhotoV878(r);if(mediaCandidate(m)||mediaCandidate(r))items.push(m);});
    items.sort(function(a,b){var ai=Number(a.groupIndex||a.group_index||a.photoIndex||a.photo_index||0),bi=Number(b.groupIndex||b.group_index||b.photoIndex||b.photo_index||0);if(ai!==bi)return ai-bi;return createdMsV878(a.raw||a)-createdMsV878(b.raw||b);});
    if(!items.length)return post;
    var targetId=clean(post.id||raw.id),idx=items.findIndex(function(x){return clean(x.id)===targetId;});if(idx<0)idx=0;
    var rep=Object.assign({},items[idx]||post,{__albumItems:items,__albumCount:items.length,__startAlbumIndex:idx,__actionId:clean((items[0]&&items[0].id)||targetId)});
    return rep;
  }
  function previewImageLinkV882(post){
    try{
      post=post||{};if(!post.id)return '';
      var type=isVideo(post)?'video':'photo';
      /* L'image OG resout elle-meme le media par ID : aucun URL media long
         dans le lien et aucune dependance au chargement de l'iframe. */
      return new URL('/share-image/'+encodeURIComponent(post.id)+'/r19?type='+encodeURIComponent(type),location.origin).href;
    }catch(_e){return '';}
  }
  function prewarmPreviewV882(post){
    try{
      if(!post||!post.id||post.content_type==='story')return;
      var page=shareLink(post),image=previewImageLinkV882(post);
      /* V882 : prechauffe la page OG puis son image. Le serveur met la vraie publication en cache avant l'envoi externe. */
      setTimeout(function(){
        if(page)fetch(page,{cache:'reload',credentials:'omit',redirect:'follow'}).catch(function(){});
        if(image)fetch(image,{cache:'force-cache',credentials:'omit',redirect:'follow'}).catch(function(){});
      },0);
    }catch(_e){}
  }
  function shareLink(post){
    post=post||{};
    if(post.content_type==='story')return '';
    var type=/video|reel|clip/i.test(clean(post.media_type||post.kind||post.type))?'v':'p';
    /* V877 : lien public court, sans nom/titre/description ni query longue.
       Le type reste dans le chemin afin que le deep-link humain parte immédiatement,
       sans lecture Supabase préalable. */
    /* V897/r19 : second logo Fyblic place par coordonnees absolues en bas a droite du media; logo bas V893 conserve. */
    try{return new URL('/s/'+type+'/'+encodeURIComponent(post.id)+'/r19',location.origin).href;}
    catch(_e){return location.origin+'/s/'+type+'/'+encodeURIComponent(post.id)+'/r19';}
  }
  function permissionGate(){
    try{return window.HappyInteractionPrivacyV855R52||null;}catch(_e){return null;}
  }
  async function shareAllowed(post){
    post=post||{};var id=clean(post.story_id||post.id||post.post_id);if(!id)return false;
    var gate=permissionGate();if(!gate)return false;
    var kind=clean(post.content_type||post.source_type||post.mode).toLowerCase();
    try{
      if(kind==='story'&&typeof gate.canStory==='function')return !!(await gate.canStory(id,'reposts',true));
      if(typeof gate.canPost==='function')return !!(await gate.canPost(id,'reposts',true));
    }catch(_e){}
    return false;
  }
  function sendPermission(){postFrame('HAPPYAD_SHARE_PERMISSION',{state:sharePermissionState,at:Date.now()});}
  function externalProtocolAllowed(url){
    try{var u=new URL(clean(url),location.href);return /^(https?:|mailto:|sms:)$/i.test(u.protocol);}catch(_e){return /^(mailto:|sms:)/i.test(clean(url));}
  }
  function markExternalTransition(meta){externalLaunchAt=Date.now();externalReturnPending=true;return true;}
  function launchExternal(url,meta){
    url=clean(url);if(!url||!externalProtocolAllowed(url))return false;
    if(sharePermissionState!=='allowed')return false;
    markExternalTransition(meta);
    /* V712 : le partage externe appartient au document parent. Le centre de partage
       ne doit jamais naviguer son propre iframe vers WhatsApp/Facebook/etc. */
    try{
      var a=document.createElement('a');
      a.href=url;a.target='_blank';a.rel='noopener noreferrer external';a.style.display='none';
      a.dataset.happyadShareExternal='1';
      document.body.appendChild(a);a.click();
      setTimeout(function(){try{if(a.parentNode)a.parentNode.removeChild(a);}catch(_e){}},0);
      return true;
    }catch(_e){}
    try{var w=window.open(url,'_blank','noopener,noreferrer');return !!w;}catch(_e2){return false;}
  }
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function viewportHeight(){
    try{if(window.visualViewport&&Number(window.visualViewport.height)>0)return Math.max(320,Number(window.visualViewport.height));}catch(_e){}
    return Math.max(320,window.innerHeight||document.documentElement.clientHeight||720);
  }
  var lastSheetBroadcast=-1,lastSheetAtMax=false,lastSheetAtMin=false;
  function broadcastSheetState(percent,force){
    var p=clamp(Number(percent)||68,54,95),atMax=p>=92.5,atMin=p<=59.5;
    /* V900 : pendant un drag, ne pas saturer le pont iframe avec un postMessage
       tous les quelques pixels. On diffuse à pas larges, mais immédiatement lors
       du franchissement des états utiles (plein écran / minimum). */
    if(!force&&lastSheetBroadcast>=0&&Math.abs(lastSheetBroadcast-p)<3&&atMax===lastSheetAtMax&&atMin===lastSheetAtMin)return;
    lastSheetBroadcast=p;lastSheetAtMax=atMax;lastSheetAtMin=atMin;
    postFrame('HAPPYAD_SHARE_SHEET_STATE',{percent:p,atMax:atMax,atMin:atMin,at:Date.now()});
  }
  function preferredHeight(){return 68;}
  function heightPxFromPercent(percent){return viewportHeight()*clamp(Number(percent)||68,54,95)/100;}
  function setSheetHeightPx(px,animate,persist){
    var sheet=document.getElementById(SHEET_ID);if(!sheet)return 0;
    var vh=viewportHeight(),min=vh*.54,max=vh*.95;px=clamp(Number(px)||vh*.68,min,max);
    sheet.classList.toggle('is-snapping',animate!==false);
    sheet.style.setProperty('height',Math.round(px)+'px','important');
    var percent=px/vh*100;sheet.dataset.height=String(percent);
    if(persist){try{localStorage.setItem(HEIGHT_KEY,String(Math.round(percent)));}catch(_e){}}
    broadcastSheetState(percent,false);
    return px;
  }
  function setSheetHeight(percent,animate,persist){return setSheetHeightPx(heightPxFromPercent(percent),animate,persist!==false);}
  function nearestSnap(percent,velocity){
    /* V899 : deux états seulement. Un geste ascendant ouvre directement le plein
       écran; un geste descendant sur la poignée revient à l'état d'ouverture. */
    if(velocity<-.10)return 95;
    if(velocity>.10)return 68;
    return Number(percent)>=81.5?95:68;
  }
  function installStyle(){
    if(document.getElementById('happyadShareCenterStyle'))return;
    var s=document.createElement('style');s.id='happyadShareCenterStyle';
    s.textContent='#'+CENTER_ID+'{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;background:rgba(0,0,0,.48)!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;transition:opacity .16s ease!important}#'+CENTER_ID+'.on{visibility:visible!important;opacity:1!important;pointer-events:auto!important}#'+SHEET_ID+'{position:relative!important;width:min(100%,760px)!important;height:68dvh!important;min-height:54dvh!important;max-height:95dvh!important;overflow:hidden!important;background:#12151b!important;border:1px solid rgba(255,255,255,.09)!important;border-bottom:0!important;border-radius:24px 24px 0 0!important;box-shadow:0 -12px 38px rgba(0,0,0,.42)!important;transform:translate3d(0,103%,0)!important;transition:height .21s cubic-bezier(.22,.84,.26,1),transform .22s cubic-bezier(.22,.84,.26,1)!important;will-change:height,transform!important;contain:layout paint!important}#'+CENTER_ID+'.on #'+SHEET_ID+'{transform:translate3d(0,0,0)!important}#'+SHEET_ID+'.is-dragging{transition:none!important;user-select:none!important;-webkit-user-select:none!important}#'+SHEET_ID+'.is-dragging #'+FRAME_ID+'{pointer-events:none!important}#'+SHEET_ID+'.is-content-pulling{transition:none!important;will-change:transform!important}#'+SHEET_ID+'.is-dragging.is-content-pulling #'+FRAME_ID+'{pointer-events:auto!important}#'+SHEET_ID+'.is-recovering #'+FRAME_ID+'{opacity:.12!important}#'+SHEET_ID+'.is-frame-pending #'+FRAME_ID+'{opacity:0!important}#'+FRAME_ID+'{transition:opacity .1s ease!important}#happyadShareWarm{position:absolute!important;left:0!important;right:0!important;top:22px!important;bottom:0!important;z-index:8!important;display:none!important;padding:8px 14px 14px!important;background:#12151b!important;pointer-events:none!important}#'+SHEET_ID+'.is-frame-pending #happyadShareWarm{display:block!important}#happyadShareWarm .hswHead{height:46px!important;display:grid!important;grid-template-columns:38px 1fr 38px!important;align-items:center!important}#happyadShareWarm .hswCircle{width:36px!important;height:36px!important;border-radius:50%!important;background:rgba(255,255,255,.08)!important}#happyadShareWarm .hswTitle{width:78px!important;height:14px!important;margin:auto!important;border-radius:7px!important;background:rgba(255,255,255,.11)!important}#happyadShareWarm .hswSearch{height:42px!important;margin-top:6px!important;border-radius:14px!important;background:rgba(255,255,255,.07)!important;border:1px solid rgba(255,255,255,.06)!important}#happyadShareWarm .hswGrid{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:16px 8px!important;margin-top:18px!important}#happyadShareWarm .hswPerson{display:flex!important;flex-direction:column!important;align-items:center!important;gap:7px!important}#happyadShareWarm .hswAvatar{width:54px!important;height:54px!important;border-radius:50%!important;background:rgba(255,255,255,.09)!important}#happyadShareWarm .hswName{width:50px!important;height:8px!important;border-radius:8px!important;background:rgba(255,255,255,.07)!important}#happyadShareWarm .hswBottom{position:absolute!important;left:14px!important;right:14px!important;bottom:16px!important;height:66px!important;border-radius:16px!important;background:rgba(255,255,255,.05)!important}#'+DRAG_ID+'{display:flex!important;align-items:center!important;justify-content:center!important;width:100%!important;height:22px!important;padding:0!important;border:0!important;background:#12151b!important;touch-action:none!important;overscroll-behavior:none!important;cursor:ns-resize!important;-webkit-user-select:none!important;user-select:none!important}#'+DRAG_ID+' span{display:block!important;width:42px!important;height:4px!important;border-radius:99px!important;background:rgba(235,239,246,.42)!important;pointer-events:none!important}#'+HEADER_DRAG_ID+'{position:absolute!important;inset:auto!important;width:0!important;height:0!important;pointer-events:none!important;overflow:hidden!important}#'+FRAME_ID+'{display:block!important;width:100%!important;height:calc(100% - 22px)!important;border:0!important;background:#12151b!important}html.happyadShareOpen,body.happyadShareOpen{overflow:hidden!important;overscroll-behavior:none!important;touch-action:none!important}html.happyadShareFromStoryV705,body.happyadShareFromStoryV705{overflow:hidden!important;overscroll-behavior:none!important;touch-action:none!important}#'+CENTER_ID+'.happyadShareFromStoryV705{z-index:2147483647!important}@media(min-width:761px){#'+SHEET_ID+'{border-radius:24px 24px 0 0!important}}';
    s.textContent+='#happyadShareWarm .hswReadyText{height:46px!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;text-align:center!important}#happyadShareWarm .hswReadyText strong{color:#f6f7f9!important;font:800 16px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif!important}#happyadShareWarm .hswReadyText span{color:#aab1bc!important;font:700 11px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif!important}';
    document.head.appendChild(s);
  }
  function installDrag(sheet,handle,headerZone){
    if(!sheet||!handle)return shareDragController;
    var active=false,startY=0,startPx=0,lastY=0,lastAt=0,velocity=0,pendingPx=0,raf=0,pointerId=null,captureEl=null;
    function applyFrame(){
      raf=0;
      if(!active)return;
      setSheetHeightPx(pendingPx,false,false);
    }
    function beginAt(y,id,el){
      if(active)return;
      active=true;
      pointerId=id==null?null:id;
      captureEl=el||null;
      startY=Number(y)||0;
      lastY=startY;
      lastAt=performance.now();
      velocity=0;
      startPx=sheet.getBoundingClientRect().height;
      pendingPx=startPx;
      sheet.classList.add('is-dragging');
      sheet.classList.remove('is-snapping');
    }
    function moveAt(y){
      if(!active)return;
      var now=performance.now();
      var nextY=Number(y);
      if(!Number.isFinite(nextY))nextY=lastY;
      var dt=Math.max(8,now-lastAt);
      velocity=velocity*.52+((nextY-lastY)/dt)*.48;
      lastY=nextY;
      lastAt=now;
      pendingPx=startPx+(startY-nextY);
      if(!raf)raf=requestAnimationFrame(applyFrame);
    }
    function endAt(y){
      if(!active)return;
      if(Number.isFinite(Number(y))&&Math.abs(Number(y)-lastY)>.5)moveAt(Number(y));
      if(raf){
        cancelAnimationFrame(raf);
        raf=0;
      }
      setSheetHeightPx(pendingPx,false,false);
      active=false;
      sheet.classList.remove('is-dragging');
      var percent=sheet.getBoundingClientRect().height/viewportHeight()*100;
      setSheetHeight(nearestSnap(percent,velocity),true,true);
      pointerId=null;
      captureEl=null;
    }
    function bindDragZone(zone){
      if(!zone||zone.__happyadDragReady)return;
      zone.__happyadDragReady=true;
      zone.addEventListener('pointerdown',function(e){
        if(e.button!=null&&e.button!==0)return;
        beginAt(e.clientY,e.pointerId,zone);
        try{zone.setPointerCapture(e.pointerId);}catch(_e){}
        e.preventDefault();
        e.stopPropagation();
      },{passive:false});
      zone.addEventListener('pointermove',function(e){
        if(!active||captureEl!==zone)return;
        moveAt(e.clientY);
        e.preventDefault();
        e.stopPropagation();
      },{passive:false});
      function finish(e){
        if(!active||captureEl!==zone)return;
        endAt(e.clientY);
        try{zone.releasePointerCapture(e.pointerId);}catch(_e){}
        e.preventDefault();
        e.stopPropagation();
      }
      zone.addEventListener('pointerup',finish,{passive:false});
      zone.addEventListener('pointercancel',finish,{passive:false});
    }
    bindDragZone(handle);
    bindDragZone(headerZone);
    handle.addEventListener('dblclick',function(e){
      var p=sheet.getBoundingClientRect().height/viewportHeight()*100;
      setSheetHeight(p<84?95:72,true,true);
      e.preventDefault();
    });
    shareDragController={
      start:function(y){beginAt(y,null,null);},
      move:moveAt,
      end:endAt,
      cancel:function(){if(active)endAt(lastY);},
      active:function(){return active;}
    };
    setSheetHeight(preferredHeight(),false,false);
    return shareDragController;
  }
  function installContentPullV906(sheet){
    if(!sheet)return shareContentPullController;
    if(shareContentPullController)return shareContentPullController;
    var active=false,startY=0,lastY=0,lastAt=0,velocity=0,pendingDy=0,raf=0,closeTimer=0;
    function clearTimer(){if(closeTimer){clearTimeout(closeTimer);closeTimer=0;}}
    function applyFrame(){
      raf=0;if(!active)return;
      sheet.style.setProperty('transform','translate3d(0,'+Math.max(0,Math.round(pendingDy))+'px,0)','important');
    }
    function cleanupStyles(){
      try{sheet.classList.remove('is-content-pulling');sheet.style.removeProperty('transition');sheet.style.removeProperty('transform');}catch(_e){}
    }
    function start(y){
      if(!shareIsOpen()||active)return false;
      clearTimer();
      if(shareDragController&&shareDragController.active&&shareDragController.active())shareDragController.cancel();
      active=true;startY=lastY=Number(y)||0;lastAt=performance.now();velocity=0;pendingDy=0;
      sheet.classList.add('is-content-pulling');
      sheet.style.setProperty('transition','none','important');
      return true;
    }
    function move(y){
      if(!active)return false;
      var now=performance.now(),nextY=Number(y);if(!Number.isFinite(nextY))nextY=lastY;
      var dt=Math.max(8,now-lastAt),step=nextY-lastY;
      velocity=velocity*.52+(step/dt)*.48;lastY=nextY;lastAt=now;
      pendingDy=Math.max(0,nextY-startY);
      if(!raf)raf=requestAnimationFrame(applyFrame);
      return true;
    }
    function settleBack(){
      active=false;
      if(raf){cancelAnimationFrame(raf);raf=0;}
      sheet.classList.remove('is-content-pulling');
      sheet.style.setProperty('transition','transform .14s cubic-bezier(.2,.85,.2,1)','important');
      sheet.style.setProperty('transform','translate3d(0,0,0)','important');
      closeTimer=setTimeout(function(){closeTimer=0;cleanupStyles();},155);
    }
    function end(y){
      if(!active)return false;
      if(Number.isFinite(Number(y)))move(Number(y));
      if(raf){cancelAnimationFrame(raf);raf=0;}
      sheet.style.setProperty('transform','translate3d(0,'+Math.max(0,Math.round(pendingDy))+'px,0)','important');
      var shouldClose=pendingDy>46||velocity>.34;
      active=false;sheet.classList.remove('is-content-pulling');
      if(!shouldClose){settleBack();return false;}
      sheet.style.setProperty('transition','transform .13s cubic-bezier(.2,.82,.2,1)','important');
      sheet.style.setProperty('transform','translate3d(0,103%,0)','important');
      closeTimer=setTimeout(function(){
        closeTimer=0;
        try{if(shareIsOpen())close('gesture-down-first-row-v906');}catch(_e){}
        cleanupStyles();
      },135);
      return true;
    }
    function cancel(){
      if(raf){cancelAnimationFrame(raf);raf=0;}
      clearTimer();active=false;velocity=0;pendingDy=0;
      cleanupStyles();
      return true;
    }
    shareContentPullController={start:start,move:move,end:end,cancel:cancel,active:function(){return active;}};
    return shareContentPullController;
  }
  function expandSheetFullV899(){
    var sheet=document.getElementById(SHEET_ID);if(!sheet||!shareIsOpen())return false;
    if(shareDragController&&shareDragController.active&&shareDragController.active())shareDragController.cancel();
    setSheetHeight(95,true,false);return true;
  }
  function closeSheetByGestureV899(){
    if(!shareIsOpen())return false;
    if(shareDragController&&shareDragController.active&&shareDragController.active())shareDragController.cancel();
    return close('gesture-down-first-row');
  }
  function frameNode(){return document.getElementById(FRAME_ID);}
  function frameDocumentHealthy(){
    var fr=frameNode();if(!fr||!fr.isConnected)return false;
    try{
      var w=fr.contentWindow;if(!w||!w.document)return false;
      var href=clean(w.location&&w.location.href);if(!href||href==='about:blank')return false;
      var got=new URL(href,location.href),want=new URL(FRAME_URL,location.href);
      return got.origin===want.origin&&got.pathname===want.pathname;
    }catch(_e){return false;}
  }
  function postFrame(type,detail){
    try{var fr=frameNode();if(fr&&fr.contentWindow){fr.contentWindow.postMessage({type:type,detail:detail||{}},'*');return true;}}catch(_e){}
    return false;
  }
  function clearFrameHealthTimer(){if(frameHealthTimer){clearTimeout(frameHealthTimer);frameHealthTimer=0;}}
  function clearFrameContextRetries(){
    while(frameContextRetryTimers.length){try{clearTimeout(frameContextRetryTimers.pop());}catch(_e){}}
  }
  function retryFrameContextV1041(reason){
    clearFrameContextRetries();
    [0,90,220,480,900,1450,2200].forEach(function(delay){
      frameContextRetryTimers.push(setTimeout(function(){
        if(!shareIsOpen()||!current)return;
        sendContext();
        postFrame('HAPPYAD_MODULE_RESUME',{source:'share-context-'+clean(reason),at:Date.now()});
      },delay));
    });
  }
  function markFrameAlive(source){
    frameReady=true;recoveryInFlight=false;recoveryAttempts=0;lastFramePongAt=Date.now();externalReturnPending=false;clearFrameHealthTimer();
    clearFrameContextRetries();
    try{var sheet=document.getElementById(SHEET_ID);if(sheet)sheet.classList.remove('is-recovering','is-frame-pending');}catch(_e){}
    postFrame('HAPPYAD_MODULE_RESUME',{source:source||'share-frame-alive',at:Date.now()});
    postFrame('HAPPYAD_SHARE_RESUME',{source:source||'share-frame-alive',at:Date.now()});
    if(current)sendContext();
    try{var sh=document.getElementById(SHEET_ID);if(sh)broadcastSheetState(sh.getBoundingClientRect().height/viewportHeight()*100,true);}catch(_e){}
  }
  function bindFrame(fr){
    if(!fr)return;
    fr.onload=function(){
      /* V1041 : une URL chargée n'est pas encore une interface prête. Seul le
         signal READY/PONG du contenu retire l'écran de préparation. */
      if(!frameReady){try{var sh=document.getElementById(SHEET_ID);if(sh)sh.classList.add('is-frame-pending');}catch(_e){}}
      recoveryInFlight=false;
      setTimeout(function(){
        if(!shareIsOpen()){
          if(frameDocumentHealthy())postFrame('HAPPYAD_SHARE_PING',{nonce:'warm-'+Date.now(),source:'warm-load',at:Date.now()});
          return;
        }
        if(!shareIsOpen())return;
        /* Si un navigateur a malgré tout remplacé le document interne pendant
           un aller-retour externe, on le recrée avant d'afficher un document cassé. */
        if(!frameDocumentHealthy()){rebuildFrame('unexpected-frame-navigation',true);return;}
        probeFrame('load');
      },80);
    };
  }
  function rebuildFrame(reason,force){
    if(!shareIsOpen()||!current||recoveryInFlight||(!force&&recoveryAttempts>=2))return false;
    var old=frameNode(),sheet=document.getElementById(SHEET_ID);if(!old||!old.parentNode)return false;
    recoveryInFlight=true;if(!force)recoveryAttempts++;frameReady=false;clearFrameHealthTimer();
    try{if(sheet)sheet.classList.add('is-recovering','is-frame-pending');}catch(_e){}
    var fr=document.createElement('iframe');fr.id=FRAME_ID;fr.title='Partager';fr.setAttribute('allow','clipboard-write;web-share');
    fr.src=FRAME_URL;
    bindFrame(fr);old.parentNode.replaceChild(fr,old);
    return true;
  }
  function probeFrame(reason){
    if(!shareIsOpen()||!current||document.hidden)return false;
    clearFrameHealthTimer();
    var nonce=String(++frameHealthSeq)+'-'+Date.now();
    postFrame('HAPPYAD_MODULE_RESUME',{source:'share-parent-'+clean(reason),at:Date.now()});
    postFrame('HAPPYAD_SHARE_PING',{nonce:nonce,source:clean(reason),at:Date.now()});
    var wait=/^(open|initial)/.test(clean(reason))?1600:900;
    frameHealthTimer=setTimeout(function(){
      frameHealthTimer=0;
      if(!shareIsOpen()||!current)return;
      rebuildFrame('no-pong-'+clean(reason));
    },wait);
    return true;
  }
  function scheduleFrameResume(reason){
    if(!shareIsOpen()||!current)return;
    if(frameResumeTimer)clearTimeout(frameResumeTimer);
    frameResumeTimer=setTimeout(function(){frameResumeTimer=0;probeFrame(reason||'resume');},160);
  }
  function resumeAfterExternal(reason){
    if(!shareIsOpen()||!current)return false;
    if(externalReturnPending&&!frameDocumentHealthy()){
      externalReturnPending=false;
      return rebuildFrame('external-return-'+clean(reason),true);
    }
    scheduleFrameResume(reason||'external-return');
    return true;
  }
  function shell(){
    installStyle();var el=document.getElementById(CENTER_ID);if(el)return el;
    el=document.createElement('section');el.id=CENTER_ID;el.setAttribute('aria-hidden','true');
    el.innerHTML='<div id="'+SHEET_ID+'" class="is-frame-pending" role="dialog" aria-modal="true" aria-label="Partager"><button id="'+DRAG_ID+'" type="button" aria-label="Modifier la hauteur du partage"><span></span></button><iframe id="'+FRAME_ID+'" title="Partager" src="'+FRAME_URL+'" allow="clipboard-write;web-share"></iframe><div id="happyadShareWarm" aria-live="polite"><div class="hswReadyText"><strong>Partager</strong><span>Préparation du partage…</span></div><div class="hswSearch"></div><div class="hswGrid">'+Array(8).fill('<span class="hswPerson"><i class="hswAvatar"></i><i class="hswName"></i></span>').join('')+'</div><div class="hswBottom"></div></div><div id="'+HEADER_DRAG_ID+'" role="slider" aria-label="Agrandir ou réduire le partage" aria-valuemin="46" aria-valuemax="96" tabindex="0"></div></div>';
    document.body.appendChild(el);
    var sheet=document.getElementById(SHEET_ID),handle=document.getElementById(DRAG_ID),headerZone=document.getElementById(HEADER_DRAG_ID),fr=frameNode();
    installDrag(sheet,handle,headerZone);
    installContentPullV906(sheet);
    el.addEventListener('click',function(e){if(e.target===el)close('backdrop');});
    bindFrame(fr);return el;
  }
  function sendContext(){if(!current)return;postFrame('HAPPYAD_SHARE_CONTEXT',{post:clone(current),link:shareLink(current),version:VERSION,permission_state:sharePermissionState});sendPermission();}
  function pushState(){
    try{
      var controller=window.HappyInternalReturnV694||window.HappyInternalReturnV591;
      if(controller&&typeof controller.open==='function')return controller.open('share-center-v927',{onBack:function(){close('share-return-v927',true);return true;}});
    }catch(_e){}
    return false;
  }
  function open(raw,src){
    var input=raw&&raw.detail?raw.detail:raw||{};
    var provisional=normalize(input);if(!provisional.id)return false;
    var seq=++openSeq;
    provisional.share_version=Date.now().toString(36);
    current=provisional;sharePermissionState='pending';
    openedFromStory=provisional.content_type==='story'&&clean(provisional.raw&&provisional.raw.share_origin)==='story_viewer_v705';
    sourceWindow=src||sourceWindow||window;if(openedFromStory)sourceMediaSnapshot=null;else captureSourceMedia(sourceWindow);
    recoveryAttempts=0;recoveryInFlight=false;externalReturnPending=false;externalLaunchAt=0;
    var el=shell(),sheet=document.getElementById(SHEET_ID);if(sheet&&!frameReady)sheet.classList.add('is-frame-pending');
    try{if(shareContentPullController)shareContentPullController.cancel();}catch(_pullReset){}
    lastSheetBroadcast=-1;setSheetHeight(preferredHeight(),true,false);el.classList.add('on');el.classList.toggle('happyadShareFromStoryV705',openedFromStory);el.setAttribute('aria-hidden','false');
    document.documentElement.classList.add('happyadShareOpen');document.body.classList.add('happyadShareOpen');
    if(openedFromStory){document.documentElement.classList.add('happyadShareFromStoryV705');document.body.classList.add('happyadShareFromStoryV705')}
    if(!(raw&&raw.fromPop))pushState();
    sendContext();
    if(!frameReady){retryFrameContextV1041('first-open');scheduleFrameResume('open');}

    /* V715 — le clic ouvre la feuille dans le même cycle UI. La résolution du post
       et la confidentialité continuent en parallèle; elles ne bloquent plus le toucher. */
    Promise.resolve(resolve(input)).then(function(post){
      if(seq!==openSeq||!shareIsOpen()||!post||!post.id)return;
      var version=current&&current.share_version;post.share_version=version||Date.now().toString(36);current=post;sendContext();prewarmPreviewV882(post);
    }).catch(function(){});
    Promise.resolve(shareAllowed(provisional)).then(function(ok){
      if(seq!==openSeq||!shareIsOpen())return;sharePermissionState=ok?'allowed':'denied';sendPermission();
    }).catch(function(){if(seq===openSeq&&shareIsOpen()){sharePermissionState='denied';sendPermission();}});
    return true;
  }
  function close(reason,fromPop){openSeq++;sharePermissionState='pending';var snapshot=sourceMediaSnapshot,closing=clone(current),fromStory=openedFromStory;clearFrameHealthTimer();clearFrameContextRetries();if(frameResumeTimer){clearTimeout(frameResumeTimer);frameResumeTimer=0;}recoveryInFlight=false;recoveryAttempts=0;externalReturnPending=false;externalLaunchAt=0;var el=document.getElementById(CENTER_ID);if(el){el.classList.remove('on','happyadShareFromStoryV705');el.setAttribute('aria-hidden','true');}document.documentElement.classList.remove('happyadShareOpen','happyadShareFromStoryV705');document.body.classList.remove('happyadShareOpen','happyadShareFromStoryV705');current=null;openedFromStory=false;try{var controller=window.HappyInternalReturnV694||window.HappyInternalReturnV591;if(controller&&typeof controller.close==='function')controller.close('share-center-v927');}catch(_return){}restoreSourceMedia(snapshot);sourceWindow=null;sourceMediaSnapshot=null;try{document.dispatchEvent(new CustomEvent('happyad:share-closed-v705',{detail:{reason:clean(reason)||'close',fromStory:!!fromStory,context:closing}}))}catch(_e){}return true;}
  function recordAction(detail){try{var target=sourceWindow&&sourceWindow.postMessage?sourceWindow:window;target.postMessage({type:'HAPPYAD_SHARE_RECORD_ACTION',detail:detail||{}},'*');}catch(_e){}}
  function captureSharedPhotoMessageContextV708(sourceWin){
    var fr=null;
    try{
      if(sourceWin){
        var frames=document.querySelectorAll('.happyadAppFrame[data-happyad-page]');
        for(var i=0;i<frames.length;i++){try{if(frames[i].contentWindow===sourceWin){fr=frames[i];break;}}catch(_e){}}
      }
    }catch(_e){}
    try{if(!fr&&window.HappyNavigation&&typeof window.HappyNavigation.activeFrame==='function')fr=window.HappyNavigation.activeFrame();}catch(_e){}
    try{if(!fr)fr=document.querySelector('#happyadAppFrame_message.on[data-happyad-page="message"]');}catch(_e){}
    if(!fr||clean(fr.getAttribute&&fr.getAttribute('data-happyad-page')).toLowerCase()!=='message')return null;
    var ctx={frame:fr,url:clean(fr.getAttribute('data-happyad-src')||fr.getAttribute('src'))||'modules/message-center.html?mode=inbox&v=783-message-read-story-age',scrollX:0,scrollY:0,at:Date.now(),wasVisitorDirect:false};
    try{ctx.scrollX=Number(fr.contentWindow&&fr.contentWindow.scrollX)||0;ctx.scrollY=Number(fr.contentWindow&&fr.contentWindow.scrollY)||0;}catch(_e){}
    try{ctx.wasVisitorDirect=!!(document.body.classList.contains('happyadVisitorDirectChatOpenV855R77')||fr.classList.contains('happyadVisitorDirectChatFrameV855R77'));}catch(_visitor){}
    try{if(fr.contentWindow)fr.contentWindow.postMessage({type:'HAPPYAD_MESSAGE_CONTEXT_HOLD_V708',detail:{source:'shared-photo',at:ctx.at}},'*');}catch(_e){}
    return ctx;
  }
  function restoreSharedPhotoMessageContextV708(reason){
    var ctx=sharedPhotoMessageContext;
    if(!ctx)return false;
    sharedPhotoMessageContext=null;
    try{if(sharedPhotoReturnObserver)sharedPhotoReturnObserver.disconnect();}catch(_e){}
    sharedPhotoReturnObserver=null;
    document.body.classList.remove('happyadSharedPhotoFromMessageV708');
    function run(){
      try{
        var fr=ctx.frame;
        if(!fr||!fr.isConnected)return false;
        var active=null;
        try{active=window.HappyNavigation&&typeof window.HappyNavigation.activeFrame==='function'?window.HappyNavigation.activeFrame():null;}catch(_e){}
        if(active!==fr&&!ctx.wasVisitorDirect&&window.HappyNavigation&&typeof window.HappyNavigation.activateMainTab==='function'){
          window.HappyNavigation.activateMainTab('message',{url:ctx.url,replace:true,force:true,source:'shared-photo-return-v708'});
          return true;
        }
        var root=document.getElementById('happyadAppShell');
        if(root){root.classList.add('on');root.classList.remove('happyadSkeletonOpen');root.setAttribute('aria-hidden','false');root.removeAttribute('inert');}
        if(ctx.wasVisitorDirect){document.body.classList.add('happyadVisitorDirectChatOpenV855R77');fr.classList.add('happyadVisitorDirectChatFrameV855R77');fr.style.setProperty('z-index','120','important');}
        fr.classList.add('on');fr.setAttribute('aria-hidden','false');fr.removeAttribute('inert');fr.style.removeProperty('opacity');fr.style.removeProperty('visibility');fr.style.removeProperty('pointer-events');
        try{if(fr.contentWindow&&Math.abs((Number(fr.contentWindow.scrollY)||0)-ctx.scrollY)>1)fr.contentWindow.scrollTo(ctx.scrollX,ctx.scrollY);}catch(_e){}
        try{if(fr.contentWindow)fr.contentWindow.postMessage({type:'HAPPYAD_MESSAGE_LAYOUT_REPAIR',detail:{reason:clean(reason)||'shared-photo-return-v708',restoreConversation:true,at:Date.now()}},'*');}catch(_e){}
        try{if(window.HappyOverlayMasterV615)window.HappyOverlayMasterV615.reconcile('shared-photo-return-v708');}catch(_e){}
        return true;
      }catch(_e){return false;}
    }
    run();setTimeout(run,70);setTimeout(run,220);
    return true;
  }
  function watchSharedPhotoReturnV708(){
    try{if(sharedPhotoReturnObserver)sharedPhotoReturnObserver.disconnect();}catch(_e){}
    sharedPhotoReturnObserver=null;
    var box=document.getElementById('happyadHomePhotoFullscreen');
    if(!box){restoreSharedPhotoMessageContextV708('photo-fullscreen-missing-v708');return false;}
    function check(){
      if(!box.classList.contains('on'))restoreSharedPhotoMessageContextV708('photo-fullscreen-closed-v708');
    }
    sharedPhotoReturnObserver=new MutationObserver(check);
    sharedPhotoReturnObserver.observe(box,{attributes:true,attributeFilter:['class']});
    setTimeout(check,900);
    return true;
  }

  function captureSharedVideoMessageContextV709(sourceWin){
    var base=captureSharedPhotoMessageContextV708(sourceWin);
    if(!base)return null;
    base.source='shared-video-v709';
    base.wasChat=false;
    base.conversationId='';
    base.messageContext=null;
    base.chatScrollTop=0;
    base.messageLayerWasOpen=false;
    base.wasVisitorDirect=false;
    try{
      var internalReturn=window.HappyInternalReturnV694||window.HappyInternalReturnV591;
      base.messageLayerWasOpen=!!(internalReturn&&typeof internalReturn.top==='function'&&clean(internalReturn.top())==='message-chat');
    }catch(_layer){}
    try{base.wasVisitorDirect=!!(document.body.classList.contains('happyadVisitorDirectChatOpenV855R77')||(base.frame&&base.frame.classList.contains('happyadVisitorDirectChatFrameV855R77')));}catch(_visitor){}
    try{
      var w=base.frame&&base.frame.contentWindow;
      var master=w&&w.HappyadMessageMaster;
      if(master){
        if(typeof master.getConversationId==='function')base.conversationId=clean(master.getConversationId());
        if(typeof master.getContext==='function')base.messageContext=clone(master.getContext());
      }
      base.wasChat=!!base.conversationId;
    }catch(_e){}
    try{
      var d=base.frame&&base.frame.contentDocument;
      var chat=d&&d.getElementById('chatBody');
      if(chat)base.chatScrollTop=Number(chat.scrollTop)||0;
    }catch(_e){}
    try{if(base.frame&&base.frame.contentWindow)base.frame.contentWindow.postMessage({type:'HAPPYAD_MESSAGE_CONTEXT_HOLD_V709',detail:{source:'shared-video',conversation_id:base.conversationId,at:base.at}},'*');}catch(_e){}
    return base;
  }
  function sharedVideoFrameV709(){
    try{return document.getElementById('happyadAppFrame_video')||document.querySelector('.happyadAppFrame[data-happyad-page="video"]');}catch(_e){return null;}
  }
  function holdSharedVideoMessageScrollV711(ctx,duration){
    try{
      var fr=ctx&&ctx.frame,w=fr&&fr.contentWindow,d=fr&&fr.contentDocument;
      if(!fr||!w)return false;
      var top=Number(ctx&&ctx.chatScrollTop);if(!Number.isFinite(top))top=0;
      var hold=Math.max(420,Number(duration)||900);
      try{
        var master=w.HappyadMessageMaster;
        if(master&&typeof master.holdReturnScroll==='function')master.holdReturnScroll(top,hold);
      }catch(_master){}
      try{w.postMessage({type:'HAPPYAD_MESSAGE_SCROLL_HOLD_V711',detail:{scrollTop:top,duration:hold,conversation_id:clean(ctx&&ctx.conversationId),source:'shared-video-return-v711',at:Date.now()}},'*');}catch(_post){}
      try{var chat=d&&d.getElementById('chatBody');if(chat)chat.scrollTop=top;}catch(_chat){}
      return true;
    }catch(_e){return false;}
  }
  function forceSharedVideoDockVisibleV709(reason){
    try{
      document.body.classList.remove('happyadVisitorDirectChatOpenV855R77');
      var messageFrame=document.getElementById('happyadAppFrame_message');
      if(messageFrame){messageFrame.classList.remove('happyadVisitorDirectChatFrameV855R77');messageFrame.style.removeProperty('z-index');messageFrame.style.removeProperty('opacity');messageFrame.style.removeProperty('visibility');}
      document.body.classList.remove('happyadInternalScreenOpenV591','happyadDockAutoHiddenV618','happyadPublishFullscreenV586');
      document.body.classList.add('happyadMainDockVisible','happyadSharedVideoFromMessageV709');
      document.body.setAttribute('data-happyad-main-page','video');
      var dock=document.getElementById('happyadMainDockV585')||document.querySelector('.bottom.happyadMainDockV585');
      if(dock){dock.removeAttribute('aria-hidden');dock.style.removeProperty('display');dock.style.removeProperty('visibility');dock.style.removeProperty('pointer-events');}
      try{if(window.HappyDockAutoHideV653&&typeof window.HappyDockAutoHideV653.show==='function')window.HappyDockAutoHideV653.show(clean(reason)||'shared-video-message-v709');}catch(_show){}
      try{if(window.HappyOverlayMasterV615)window.HappyOverlayMasterV615.reconcile('shared-video-dock-v709');}catch(_ov){}
    }catch(_e){}
  }
  function cleanupSharedVideoBackButtonV709(){
    var fr=sharedVideoFrameV709();
    try{
      var d=fr&&fr.contentDocument;if(!d)return false;
      var btn=d.getElementById('happyadSharedVideoMessageBackV709');
      if(btn&&btn.parentNode){
        var spacer=d.createElement('span');spacer.className='topBarSpacer';spacer.setAttribute('aria-hidden','true');
        btn.parentNode.replaceChild(spacer,btn);
      }
      var style=d.getElementById('happyadSharedVideoMessageBackStyleV709');if(style&&style.parentNode)style.parentNode.removeChild(style);
      d.documentElement.classList.remove('happyadSharedVideoFromMessageV709');
      return true;
    }catch(_e){return false;}
  }
  function requestSharedVideoReturnV709(reason){
    if(!sharedVideoMessageContext||sharedVideoRestoring)return false;
    clearTimeout(sharedVideoReturnFallbackTimer);sharedVideoReturnFallbackTimer=0;
    /* V927 : Vidéo est une vraie destination C. Le bouton et Android dépilent
       la même entrée; la restauration exacte du chat se fait sur popstate. */
    var videoRouteReady=false;try{videoRouteReady=!!(window.HappyNavigation&&typeof window.HappyNavigation.currentPage==='function'&&window.HappyNavigation.currentPage()==='video');}catch(_route){}
    if(sharedVideoHistoryArmed&&videoRouteReady){
      try{History.prototype.go.call(history,-1);}catch(_e){}
      return true;
    }
    return restoreSharedVideoMessageContextV709(reason||'video-back-direct-v711');
  }
  function installSharedVideoBackButtonV709(){
    var fr=sharedVideoFrameV709();
    try{
      var d=fr&&fr.contentDocument;if(!d||!d.documentElement)return false;
      d.documentElement.classList.add('happyadSharedVideoFromMessageV709');
      if(!d.getElementById('happyadSharedVideoMessageBackStyleV709')){
        var style=d.createElement('style');style.id='happyadSharedVideoMessageBackStyleV709';
        style.textContent='.happyadSharedVideoMessageBackV709{pointer-events:auto!important;width:46px!important;height:46px!important;border-radius:50%!important;display:grid!important;place-items:center!important;padding:0!important;color:#fff!important;background:rgba(15,17,22,.56)!important;border:1px solid rgba(255,255,255,.34)!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important;touch-action:manipulation!important}.happyadSharedVideoMessageBackV709 svg{width:27px!important;height:27px!important;display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:2.6!important;stroke-linecap:round!important;stroke-linejoin:round!important}.happyadSharedVideoMessageBackV709:active{background:rgba(255,255,255,.13)!important;border-color:#fff!important;transform:scale(.96)!important}';
        (d.head||d.documentElement).appendChild(style);
      }
      var top=d.getElementById('topBar')||d.querySelector('.topBar');if(!top)return false;
      var btn=d.getElementById('happyadSharedVideoMessageBackV709');
      if(!btn){
        btn=d.createElement('button');btn.id='happyadSharedVideoMessageBackV709';btn.className='round happyadSharedVideoMessageBackV709';btn.type='button';btn.setAttribute('data-happyad-internal-return-v591','1');btn.setAttribute('aria-label','Revenir dans la conversation');btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg>';
        var spacer=top.querySelector('.topBarSpacer');if(spacer)top.replaceChild(btn,spacer);else top.insertBefore(btn,top.firstChild||null);
      }
      if(!btn.__happyadSharedVideoReturnBoundV709){
        btn.__happyadSharedVideoReturnBoundV709=true;
        btn.addEventListener('click',function(ev){try{ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}catch(_e){}try{requestSharedVideoReturnV709('video-button-v709');}catch(_e){}},true);
      }
      return true;
    }catch(_e){return false;}
  }
  function armSharedVideoPhoneBackV709(){
    sharedVideoHistoryArmed=true;
    try{
      var internalReturn=window.HappyInternalReturnV694||window.HappyInternalReturnV591;
      if(sharedVideoMessageContext&&sharedVideoMessageContext.messageLayerWasOpen&&internalReturn&&typeof internalReturn.suspend==='function')internalReturn.suspend('message-chat');
    }catch(_e){}
    if(!sharedVideoPopInstalled){
      sharedVideoPopInstalled=true;
      try{EventTarget.prototype.addEventListener.call(window,'popstate',function(ev){
        if(!sharedVideoMessageContext||sharedVideoRestoring)return;
        var st=ev&&ev.state||{},marker=clean(st.__happyadInternalLayerV927),view=clean(st.view);
        if(marker==='message-chat'||(!sharedVideoMessageContext.messageLayerWasOpen&&view==='message'))restoreSharedVideoMessageContextV709('phone-back-v927');
      },true);}catch(_e){}
    }
    return sharedVideoHistoryArmed;
  }
  function restoreSharedVideoMessageContextV709(reason){
    var ctx=sharedVideoMessageContext;if(!ctx||sharedVideoRestoring)return false;
    sharedVideoRestoring=true;sharedVideoMessageContext=null;sharedVideoHistoryArmed=false;
    clearTimeout(sharedVideoReturnFallbackTimer);sharedVideoReturnFallbackTimer=0;
    cleanupSharedVideoBackButtonV709();
    document.body.classList.remove('happyadSharedVideoFromMessageV709');
    holdSharedVideoMessageScrollV711(ctx,620);

    /* V711 : remettre d'abord la couche message-chat exactement comme elle était.
       Ainsi le dock ne clignote pas entre Vidéos et la conversation. */
    if(ctx.messageLayerWasOpen){
      try{
        var internalReturn=window.HappyInternalReturnV694||window.HappyInternalReturnV591;
        if(internalReturn&&typeof internalReturn.resume==='function')internalReturn.resume('message-chat');
        else if(internalReturn&&typeof internalReturn.open==='function'&&(!internalReturn.top||clean(internalReturn.top())!=='message-chat'))internalReturn.open('message-chat');
      }catch(_layer){}
    }

    function prepareFrameInstant(fr){
      try{
        var d=fr&&fr.contentDocument;if(!d||!d.documentElement)return;
        d.documentElement.classList.add('happyadSharedMessageReturnInstantV710');
        var list=d.getElementById('listView'),chatView=d.getElementById('chatView');
        if(ctx.wasChat&&chatView){
          if(list){list.classList.add('hidden');list.setAttribute('aria-hidden','true');}
          chatView.classList.remove('hidden');chatView.setAttribute('aria-hidden','false');
          var chat=d.getElementById('chatBody');if(chat&&Number.isFinite(ctx.chatScrollTop))chat.scrollTop=ctx.chatScrollTop;
        }
      }catch(_e){}
    }
    function run(){
      try{
        var fr=ctx.frame;if(!fr||!fr.isConnected)return false;
        prepareFrameInstant(fr);
        try{if(fr.contentWindow)fr.contentWindow.scrollTo(ctx.scrollX,ctx.scrollY);}catch(_preWindow){}
        try{var preDoc=fr.contentDocument,preChat=preDoc&&preDoc.getElementById('chatBody');if(preChat&&Number.isFinite(ctx.chatScrollTop))preChat.scrollTop=ctx.chatScrollTop;}catch(_preChat){}
        var active=null;try{active=window.HappyNavigation&&typeof window.HappyNavigation.activeFrame==='function'?window.HappyNavigation.activeFrame():null;}catch(_active){}
        /* Un chat direct de profil visiteur est une couche au-dessus du profil,
           pas une nouvelle route Messages. Le pop canonique vient de restaurer
           le profil B : on remet seulement sa couche chat, sans remplacer B. */
        if(active!==fr&&!ctx.wasVisitorDirect&&window.HappyNavigation&&typeof window.HappyNavigation.activateMainTab==='function')window.HappyNavigation.activateMainTab('message',{url:ctx.url,replace:true,force:true,source:'shared-video-return-v711'});
        var root=document.getElementById('happyadAppShell');if(root){root.classList.add('on');root.classList.remove('happyadSkeletonOpen');root.setAttribute('aria-hidden','false');root.removeAttribute('inert');}
        if(ctx.wasVisitorDirect){document.body.classList.add('happyadVisitorDirectChatOpenV855R77');fr.classList.add('happyadVisitorDirectChatFrameV855R77');fr.style.setProperty('z-index','120','important');}
        fr.classList.add('on');fr.setAttribute('aria-hidden','false');fr.removeAttribute('inert');fr.style.removeProperty('opacity');fr.style.removeProperty('visibility');fr.style.removeProperty('pointer-events');
        try{if(fr.contentWindow)fr.contentWindow.scrollTo(ctx.scrollX,ctx.scrollY);}catch(_e){}
        try{var d=fr.contentDocument,chat=d&&d.getElementById('chatBody');if(chat&&Number.isFinite(ctx.chatScrollTop))chat.scrollTop=ctx.chatScrollTop;}catch(_e){}
        try{if(fr.contentWindow)fr.contentWindow.postMessage({type:'HAPPYAD_MESSAGE_LAYOUT_REPAIR',detail:{reason:clean(reason)||'shared-video-return-v711',restoreConversation:true,conversation_id:ctx.conversationId||'',at:Date.now()}},'*');}catch(_e){}
        try{if(window.HappyOverlayMasterV615)window.HappyOverlayMasterV615.reconcile('shared-video-return-v711');}catch(_e){}
        return true;
      }catch(_e){return false;}
    }
    run();[45,120,260,480].forEach(function(delay){setTimeout(run,delay);});setTimeout(function(){
      run();
      try{var d=ctx.frame&&ctx.frame.contentDocument;if(d&&d.documentElement)d.documentElement.classList.remove('happyadSharedMessageReturnInstantV710');}catch(_e){}
      sharedVideoRestoring=false;
    },620);
    return true;
  }
  function discardSharedVideoMessageContextV927(reason){
    if(!sharedVideoMessageContext)return false;
    sharedVideoMessageContext=null;sharedVideoHistoryArmed=false;sharedVideoRestoring=false;
    clearTimeout(sharedVideoReturnFallbackTimer);sharedVideoReturnFallbackTimer=0;
    cleanupSharedVideoBackButtonV709();document.body.classList.remove('happyadSharedVideoFromMessageV709');
    try{window.__HAPPYAD_SHARED_VIDEO_CONTEXT_DISCARDED_V927={reason:clean(reason)||'menu',at:Date.now()};}catch(_e){}
    return true;
  }
  function prepareSharedVideoFromMessageV709(postId,sourceWin){
    sharedVideoMessageContext=captureSharedVideoMessageContextV709(sourceWin);
    if(!sharedVideoMessageContext)return false;
    holdSharedVideoMessageScrollV711(sharedVideoMessageContext,480);
    armSharedVideoPhoneBackV709();
    forceSharedVideoDockVisibleV709('before-video-open-v709');
    [0,70,180,420,900,1500].forEach(function(delay){setTimeout(function(){if(!sharedVideoMessageContext)return;forceSharedVideoDockVisibleV709('video-open-'+delay+'-v709');installSharedVideoBackButtonV709();},delay);});
    return true;
  }

  function isDirectExternalShared(detail){
    detail=detail&&detail.detail?detail.detail:detail||{};
    var source=clean(detail.source).toLowerCase();
    if(detail.direct_external===true||detail.direct===true||detail.happyad_direct===true)return true;
    if(source==='external-link'||source==='shared_link'||source==='external-shared-link')return true;
    try{
      var boot=window.__HAPPYAD_SHARED_DIRECT_BOOT_V713,id=clean(detail.post_id||detail.postId||detail.id);
      return !!(boot&&id&&clean(boot.postId)===id);
    }catch(_e){return false;}
  }
  function finishDirectSharedBoot(reason){
    try{document.documentElement.classList.remove('happyadSharedDirectBootV713');}catch(_e){}
    try{window.__HAPPYAD_SHARED_DIRECT_BOOT_FINISH_V713={reason:clean(reason)||'ready',at:Date.now()};}catch(_e){}
    try{window.__HAPPYAD_SHARED_DIRECT_BOOT_V713=null;}catch(_e){}
  }
  function directRouteFallback(postId,type,reason){
    var video=/video|reel|clip/.test(clean(type).toLowerCase());
    var url=(video?'modules/video.html?post=':'modules/photo.html?post=')+encodeURIComponent(postId)+(video?'&autoplay=1':'')+'&from=shared_link&direct=1';
    try{window.__HAPPYAD_SHARED_DIRECT_FALLBACK_V714={postId:postId,type:video?'video':'photo',reason:clean(reason),at:Date.now()};}catch(_e){}
    /* Ne jamais enlever le masque pour montrer l'Accueil : la navigation remplace
       directement le document courant par la surface média de secours. */
    try{location.replace(url);return true;}catch(_e){}
    try{location.href=url;return true;}catch(_e2){}
    return false;
  }
  function releaseDirectPhotoBootWhenVisible(postId){
    var started=Date.now(),done=false,stable=0;
    function finish(reason){if(done)return;done=true;requestAnimationFrame(function(){requestAnimationFrame(function(){finishDirectSharedBoot(reason);});});}
    function check(){
      if(done)return;
      try{
        var box=document.getElementById('happyadHomePhotoFullscreen');
        var current=box&&(box.__happyadCurrentPostV613E||window.__HAPPYAD_ACTIVE_FULLSCREEN_POST_V613E);
        var currentId=clean(current&&(current.id||current.post_id||current.__actionId));
        if(box&&box.classList.contains('on')&&(!currentId||currentId===clean(postId))){
          stable++;
          if(stable>=2){finish('photo-fullscreen-painted');return;}
        }else stable=0;
      }catch(_e){stable=0;}
      if(Date.now()-started>12000){done=true;directRouteFallback(postId,'photo','photo-fullscreen-not-painted');return;}
      requestAnimationFrame(check);
    }
    requestAnimationFrame(check);
  }
  function releaseDirectVideoBootWhenVisible(url){
    var started=Date.now(),done=false,stable=0;
    function finish(reason){if(done)return;done=true;requestAnimationFrame(function(){requestAnimationFrame(function(){finishDirectSharedBoot(reason);});});}
    function check(){
      if(done)return;
      try{
        var fr=document.querySelector('.happyadAppFrame[data-happyad-page="video"].on,.happyadAppFrame[data-happyad-page="video"][aria-hidden="false"],[data-happyad-page="video"].on,[data-happyad-page="video"][aria-hidden="false"]');
        if(fr){stable++;if(stable>=2){finish('video-frame-painted');return;}}else stable=0;
      }catch(_e){stable=0;}
      /* Après une longue attente on remplace directement le document par la
         Centrale vidéo ciblée; on ne révèle toujours jamais l'Accueil. */
      if(Date.now()-started>12000){done=true;try{location.replace(url);}catch(_r){try{location.href=url;}catch(_h){/* garder le masque : ne jamais exposer l'Accueil */}}return;}
      requestAnimationFrame(check);
    }
    requestAnimationFrame(check);
  }
  function seedSharedPhotoForHome(postId,post,skipHomeSeed){
    post=post&&typeof post==='object'?post:{};
    var raw=post.raw&&typeof post.raw==='object'?post.raw:{};
    var media=publicMediaUrl(post.media_url||post.mediaUrl||post.preview_url||post.thumbnail_url||post.poster_url||raw.media_url||raw.mediaUrl||raw.home_media_url||raw.image_url||raw.photo_url||raw.media_path);
    var source=Object.assign({},raw,post,{
      id:postId,post_id:postId,media_type:'photo',mediaType:'photo',kind:'photo',type:'photo',
      media_url:media,mediaUrl:media,home_media_url:media,image_url:media,photo_url:media,
      title:clean(post.title||raw.title)||'Publication Fyblic',
      description:clean(post.description||raw.description||raw.desc||raw.caption),
      desc:clean(post.description||raw.description||raw.desc||raw.caption),
      user_id:clean(post.user_id||post.owner_id||raw.user_id||raw.owner_id||raw.creator_id),
      creatorId:clean(post.user_id||post.owner_id||raw.user_id||raw.owner_id||raw.creator_id),
      creatorName:clean(post.author_name||raw.display_name||raw.creator_name||raw.full_name||raw.username)||'Utilisateur Fyblic',
      created_at:clean(post.created_at||raw.created_at),createdAt:post.created_at||raw.created_at||Date.now()
    });
    var mapped=source;
    try{if(typeof window.mapHappyPost==='function')mapped=Object.assign({},window.mapHappyPost(source),source,{id:postId,mediaUrl:media,media_url:media,kind:'photo',media_type:'photo'});}catch(_e){}
    if(!skipHomeSeed){try{
      if(!Array.isArray(window.ALL_POSTS))window.ALL_POSTS=[];
      var at=window.ALL_POSTS.findIndex(function(x){return clean(x&&(x.id||x.post_id))===postId;});
      if(at>=0)window.ALL_POSTS[at]=Object.assign({},window.ALL_POSTS[at]||{},mapped);
      else window.ALL_POSTS.unshift(mapped);
    }catch(_e){}}
    return mapped;
  }
  async function openPhotoHome(postId,detail,sourceWin){
    detail=detail&&detail.detail?detail.detail:detail||{};
    var directExternal=isDirectExternalShared(detail);
    sharedPhotoMessageContext=directExternal?null:captureSharedPhotoMessageContextV708(sourceWin);
    var fromMessage=!!sharedPhotoMessageContext;
    var post=detail.__happyadResolvedPost||(directExternal?await resolveDirectV879(Object.assign({},detail,{id:postId,post_id:postId,media_type:'photo',__happyadDirectNoHomeSeed:true})):await resolve(Object.assign({},detail,{id:postId,post_id:postId,media_type:'photo',__happyadDirectNoHomeSeed:false})));
    if(directExternal)post=await resolvePhotoAlbumV878(post);
    var seeded=seedSharedPhotoForHome(postId,post,directExternal);

    /* V714 : depuis WhatsApp/Facebook/etc., aucune surface Accueil n'est
       exposée. Le masque de boot reste au-dessus jusqu'à ce que le fullscreen
       soit réellement monté pendant deux frames consécutives. */
    if(directExternal){
      if(!mediaCandidate(seeded||post||detail)){return directRouteFallback(postId,'photo','photo-media-unresolved');}
      try{
        if(typeof window.happyadOpenHomePhotoFullscreen==='function'){
          await window.happyadOpenHomePhotoFullscreen(postId,seeded||post||detail);
          releaseDirectPhotoBootWhenVisible(postId);
          return true;
        }
        if(typeof window.openLongPhoto==='function'){
          window.openLongPhoto(postId,seeded||post||detail);
          releaseDirectPhotoBootWhenVisible(postId);
          return true;
        }
      }catch(_directError){}
      return directRouteFallback(postId,'photo','photo-fullscreen-unavailable');
    }

    if(fromMessage){
      try{window.__happyadPhotoReturnSourceV478={id:String(postId),scrollY:window.scrollY||document.documentElement.scrollTop||0,at:Date.now(),el:null,source:'message-v708'};}catch(_e){}
      document.body.classList.add('happyadSharedPhotoFromMessageV708');
    }else{
      /* V927 : ne pas remplacer B par l'Accueil pour pouvoir réutiliser le
         lecteur Photo parent. Le fullscreen devient simplement la couche C ;
         sa fermeture révèle donc la vraie surface B restée dessous. */
      try{if(typeof window.render==='function')window.render();}catch(_e){}
      var card=null;
      try{card=document.querySelector('[data-post-id="'+css(postId)+'"]');if(card){window.__happyadPhotoReturnSourceV478={id:String(postId),scrollY:window.scrollY||document.documentElement.scrollTop||0,at:Date.now(),el:card};}}catch(_e){}
      /* V927 : le fullscreen Photo possède sa propre couche canonique. Aucune
         pseudo-route home_shared_post ne remplace la page courante. */
    }
    setTimeout(function(){
      var opened=false;
      try{
        if(typeof window.openLongPhoto==='function'){window.openLongPhoto(postId,seeded||post);opened=true;}
        else if(typeof window.happyadOpenHomePhotoFullscreen==='function'){window.happyadOpenHomePhotoFullscreen(postId,seeded||post);opened=true;}
        else if(!fromMessage&&window.HappyNavigation&&typeof window.HappyNavigation.open==='function'){window.HappyNavigation.open('modules/photo.html?post='+encodeURIComponent(postId),{source:'shared-message-photo-v708',postId:postId,force:true});opened=true;}
        else if(!fromMessage){location.href='modules/photo.html?post='+encodeURIComponent(postId);opened=true;}
      }catch(_e){opened=false;}
      if(fromMessage){
        if(opened)setTimeout(watchSharedPhotoReturnV708,0);
        else restoreSharedPhotoMessageContextV708('photo-open-failed-v708');
      }
    },36);
    return !!seeded;
  }
  async function openSharedPost(detail,sourceWin){
    detail=detail&&detail.detail?detail.detail:detail||{};
    var id=clean(detail.post_id||detail.postId||detail.id);if(!id)return false;
    var type=/video|reel|clip/.test(clean(detail.media_type||detail.type).toLowerCase())?'video':'photo';
    var directExternal=isDirectExternalShared(detail);
    if(directExternal){
      try{
        var resolved=await resolveDirectV879(Object.assign({},detail,{id:id,post_id:id,__happyadDirectNoHomeSeed:true}));
        if(resolved&&resolved.id){detail=Object.assign({},detail,resolved,{__happyadResolvedPost:resolved,direct_external:true,source:'external-link'});type=isVideo(resolved)?'video':'photo';}
      }catch(_resolveDirect){}
    }
    if(type==='video'){
      var fromMessage=directExternal?false:prepareSharedVideoFromMessageV709(id,sourceWin);
      var url='modules/video.html?post='+encodeURIComponent(id)+(directExternal?'&autoplay=1&from=shared_link&direct=1':'&from=message_share');
      var opened=false,directAsyncAccepted=false;
      try{
        if(window.HappyNavigation&&typeof window.HappyNavigation.openVideoPost==='function')opened=window.HappyNavigation.openVideoPost(url,{source:directExternal?'shared-direct-video-v714':(fromMessage?'shared-message-video-v709':'shared-video-v709'),postId:id,force:true});
        else if(window.happyadOpenInternalUrlV492)opened=window.happyadOpenInternalUrlV492(url,{source:directExternal?'shared-direct-video-v714':(fromMessage?'shared-message-video-v709':'shared-video-v709'),postId:id,force:true});
        /* V930 — openVideoDirect prépare volontairement la Centrale en arrière-plan
           et renvoie false pendant cette préparation. L'ancre posée dans la même
           tâche confirme que la route interne a bien accepté la vidéo : ne pas
           lancer ensuite location.replace(), qui ouvrirait la même vidéo une
           deuxième fois. Le véritable fallback reste actif si aucune ancre
           fraîche n'a été enregistrée. */
        if(directExternal&&opened===false)directAsyncAccepted=clean(window.__HAPPYAD_VIDEO_DIRECT_ANCHOR_V855R79)===id;
      }catch(_e){opened=false;directAsyncAccepted=false;}
      if(opened!==false||directAsyncAccepted){if(directExternal)releaseDirectVideoBootWhenVisible(url);return directAsyncAccepted?true:opened;}
      if(fromMessage){restoreSharedVideoMessageContextV709('video-open-failed-v709');return false;}
      if(directExternal){try{location.replace(url);}catch(_r){location.href=url;}return true;}
      location.href=url;return true;
    }
    return openPhotoHome(id,detail,sourceWin);
  }
  function maybeDeepLink(){
    try{
      var q=new URLSearchParams(location.search),id=clean(q.get('happyad_post'));if(!id)return;
      var type=clean(q.get('happyad_type'))||'photo';
      var direct=q.get('happyad_direct')==='1'||q.get('source')==='shared_link';
      /* V714 : aucun délai fixe et aucune révélation de l'Accueil. Le lien partagé
         est traité dès DOM prêt; seul le média ciblé peut retirer le masque. */
      Promise.resolve(openSharedPost({post_id:id,media_type:type,source:direct?'external-link':'deep-link',direct_external:direct})).catch(function(){
        if(direct){directRouteFallback(id,type,'deep-link-error');return;}
        finishDirectSharedBoot('deep-link-error');
      });
    }catch(_e){
      try{
        var q2=new URLSearchParams(location.search),id2=clean(q2.get('happyad_post')),type2=clean(q2.get('happyad_type'))||'photo';
        if(id2&&(q2.get('happyad_direct')==='1'||q2.get('source')==='shared_link')){directRouteFallback(id2,type2,'deep-link-exception');return;}
      }catch(_fallbackError){}
      finishDirectSharedBoot('deep-link-exception');
    }
  }
  function isCurrentFrameMessage(event){try{var fr=frameNode();return !!(fr&&fr.contentWindow&&event&&event.source===fr.contentWindow);}catch(_e){return false;}}
  window.addEventListener('message',function(event){
    var d=event&&event.data;if(!d||typeof d!=='object')return;
    if(d.type==='HAPPYAD_SHARE_OPEN')open(d.detail||{},event.source);
    else if(d.type==='HAPPYAD_SHARE_CENTER_READY'&&isCurrentFrameMessage(event)){markFrameAlive('center-ready');}
    else if((d.type==='HAPPYAD_SHARE_PONG'||d.type==='HAPPYAD_SHARE_CENTER_RESUMED')&&isCurrentFrameMessage(event))markFrameAlive(clean(d.detail&&d.detail.source)||d.type);
    else if(d.type==='HAPPYAD_SHARE_CLOSE')close(clean(d.detail&&d.detail.reason)||'close');
    else if(d.type==='HAPPYAD_SHARE_COMMITTED')recordAction(d.detail||{});
    else if(d.type==='HAPPYAD_OPEN_SHARED_POST')openSharedPost(d.detail||{},event.source);
    else if(d.type==='HAPPYAD_SHARED_VIDEO_RETURN_MESSAGE_V709')requestSharedVideoReturnV709(clean(d.detail&&d.detail.reason)||'video-message-v709');
    else if(d.type==='HAPPYAD_SHARE_EXPAND_FULL_V899'&&isCurrentFrameMessage(event))expandSheetFullV899();
    else if(d.type==='HAPPYAD_SHARE_CLOSE_GESTURE_V899'&&isCurrentFrameMessage(event))closeSheetByGestureV899();
    else if(d.type==='HAPPYAD_SHARE_PULL_CLOSE_START_V906'&&isCurrentFrameMessage(event)&&shareContentPullController)shareContentPullController.start(Number(d.detail&&d.detail.screenY));
    else if(d.type==='HAPPYAD_SHARE_PULL_CLOSE_MOVE_V906'&&isCurrentFrameMessage(event)&&shareContentPullController)shareContentPullController.move(Number(d.detail&&d.detail.screenY));
    else if(d.type==='HAPPYAD_SHARE_PULL_CLOSE_END_V906'&&isCurrentFrameMessage(event)&&shareContentPullController)shareContentPullController.end(Number(d.detail&&d.detail.screenY));
    else if(d.type==='HAPPYAD_SHARE_PULL_CLOSE_CANCEL_V906'&&isCurrentFrameMessage(event)&&shareContentPullController)shareContentPullController.cancel();
    else if(d.type==='HAPPYAD_SHARE_DRAG_START'&&isCurrentFrameMessage(event)&&shareDragController)shareDragController.start(Number(d.detail&&d.detail.screenY));
    else if(d.type==='HAPPYAD_SHARE_DRAG_MOVE'&&isCurrentFrameMessage(event)&&shareDragController)shareDragController.move(Number(d.detail&&d.detail.screenY));
    else if(d.type==='HAPPYAD_SHARE_DRAG_END'&&isCurrentFrameMessage(event)&&shareDragController)shareDragController.end(Number(d.detail&&d.detail.screenY));
    else if(d.type==='HAPPYAD_APP_FRAME_VISIBLE')scheduleFrameResume('app-frame-visible');
  },true);
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){hiddenAt=Date.now();frameReady=false;clearFrameHealthTimer();return;}
    if(shareIsOpen())resumeAfterExternal('visibility-visible-'+Math.max(0,Date.now()-hiddenAt));
  },true);
  window.addEventListener('HAPPYAD_MAIN_MENU_NAVIGATION_V927',function(ev){
    try{if(sharedVideoMessageContext&&!sharedVideoRestoring)discardSharedVideoMessageContextV927('main-menu-'+clean(ev&&ev.detail&&ev.detail.page)+'-v927');}catch(_e){}
  },true);
  window.addEventListener('pageshow',function(){if(shareIsOpen())resumeAfterExternal('pageshow');},true);
  window.addEventListener('focus',function(){if(shareIsOpen())resumeAfterExternal('focus');},true);
  /* V584: ancien popstate partage supprimé. */
  window.HappyadShareMaster={version:VERSION,open:open,close:close,openSharedPost:openSharedPost,returnSharedVideoToMessage:requestSharedVideoReturnV709,current:function(){return current;},isOpen:shareIsOpen,permission:function(){return sharePermissionState;},markExternalTransition:markExternalTransition,launchExternal:launchExternal,resume:function(){return resumeAfterExternal('api');},probe:function(){return probeFrame('api');},frameHealthy:frameDocumentHealthy,warm:function(){return shell();}};
  function warmShareCenter(){try{var q=new URLSearchParams(location.search);if(q.get('happyad_post'))return;}catch(_e){}try{shell();}catch(_e){}}
  function startShareMaster(){maybeDeepLink();try{if('requestIdleCallback' in window)requestIdleCallback(warmShareCenter,{timeout:700});else setTimeout(warmShareCenter,180);}catch(_e){setTimeout(warmShareCenter,180);}}
  installStyle();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startShareMaster,{once:true});else startShareMaster();
})();
