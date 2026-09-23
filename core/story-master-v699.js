(function(){
  'use strict';
  if(window.__HAPPYAD_STORY_MASTER_V699__)return;
  window.__HAPPYAD_STORY_MASTER_V699__=true;
  window.__HAPPYAD_STORY_MASTER_V698__=true;
  window.__HAPPYAD_STORY_MASTER_V697__=true;
  window.__HAPPYAD_STORY_MASTER_V629__=true;

  var VERSION='STORY_MASTER_V1000_ROOT_RADAR_IDENTITY';
  var state={
    box:null,owner:'',rows:[],profile:{},index:0,closed:true,paused:false,
    raf:0,timer:0,startedAt:0,elapsed:0,duration:10000,activeFill:null,progressAnim:null,progressBaseElapsed:0,
    holdTimer:0,hold:false,startX:0,startY:0,moved:false,lastTapAt:0,pointerDownAt:0,lastPointerType:'',
    pointers:new Map(),pinch:false,pinchDistance:0,pinchScale:1,
    preloadTimer:0,preloads:new Map(),
    zoom:{scale:1,x:0,y:0},openToken:0,
    composerDismissGuard:false,composerDismissGuardUntil:0,composerDismissPointerId:null,
    composerDismissTimer:0,composerViewportBase:0,
    shareOverlayOpen:false,shareResumePending:false,ageTimer:0,backgroundLockV922:null
  };

  var exactNotificationOpenTokenV735=0;
  var storyReturnRetryV927=0;
  var storyReturnArmedV927=false;

  var STORY_REPLY_MARKER='\u2063HAPPYAD_STORY_REPLY_V1\u2063';
  var STORY_SHARE_TYPE='story';
  var STORY_LIKE_KEY='HAPPYAD_STORY_LIKES_BY_STORY_V696';
  function mutedKey(){return 'HAPPYAD_MUTED_STORY_OWNERS_V1_'+(currentUid()||'guest')}
  function mutedOwners(){return readJson(mutedKey(),{})||{}}
  function isMutedOwner(uid){uid=clean(uid);return !!(uid&&uid!==currentUid()&&mutedOwners()[uid])}
  function $(id){return document.getElementById(id)}
  function clean(v){return String(v==null?'':v).trim()}
  function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c})}
  function storyAddIconHtmlV986(){return '<svg class="haStoryAddGlyphV986" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5.5v13M5.5 12h13"></path></svg>'}
  function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(v))}
  function sb(){try{return typeof window.happyadSb==='function'?window.happyadSb():(window.happyadSupabase||null)}catch(_e){return null}}
  function readJson(k,d){try{var x=JSON.parse(localStorage.getItem(k)||'');return x==null?d:x}catch(_e){return d}}
  function readUser(){try{return (window.UserStore&&window.UserStore.data)||readJson('HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL',{})||{}}catch(_e){return {}}}
  function currentUid(){try{var auth=window.HappyAuthSessionV598||window.HappyAuthSessionV595;if(auth&&typeof auth.isReady==='function'&&!auth.isReady())return '';if(auth&&typeof auth.isReady==='function'&&auth.isReady()&&typeof auth.isAuthenticated==='function'&&!auth.isAuthenticated())return '';if(localStorage.getItem('HAPPYAD_SESSION_ACTIVE')!=='1')return '';var direct=clean(localStorage.getItem('HAPPYAD_AUTH_UID'));if(isUuid(direct))return direct;return ''}catch(_e){return ''}}
  function accountKeyV937(base){try{var iso=window.HappyAccountIsolationV937;if(iso&&typeof iso.key==='function')return iso.key(base,currentUid())}catch(_e){}return clean(base)+':'+(currentUid()||'guest')}
  function storyCacheKeyV937(){return accountKeyV937('HAPPYAD_STORIES_CACHE_V1')}
  function storyLastGoodKeyV937(){return accountKeyV937('HAPPYAD_STORIES_LAST_GOOD_V885')}
  function storySeenKeyV937(){return accountKeyV937('HAPPYAD_HOME_RADAR_SEEN_V1')}
  function storyHiddenKeyV937(){return accountKeyV937('HAPPYAD_HIDDEN_STORIES_V1')}
  var radarStableSnapshotV792=[];
  var radarStableSnapshotAtV792=0;
  var radarCanonicalV792={loading:false,promise:null,awaitingStable:false,emptyUid:'',emptyAt:0,emptyCount:0};
  /* V907R3 : au démarrage, le Radar est réseau-d'abord. On ne peint plus une
     ancienne liste persistée puis une seconde liste serveur. Le cache local reste
     utile après le premier commit de la session (retour lecteur, état vu, etc.). */
  var radarFreshReadyV907R3=false;
  var radarFreshStartedAtV907R3=0;
  var radarFreshRetryTimerV907R3=0;
  var storyAccountUidV937=currentUid();
  var radarAccountGenerationV937=1;
  /* V941 : pendant une connexion interactive, préparer l'identité propriétaire et
     l'éventuelle Story AVANT que l'overlay Auth se ferme. Le premier cercle visible
     après connexion est ainsi directement la Story active, sinon l'avatar du compte. */
  var ownAuthSeedV941={};
  var ownAuthWarmV941={uid:'',promise:null,token:0,storyChecked:false};
  function authUserProfileSeedV941(uid,user){
    uid=clean(uid);user=user||{};var meta=user.user_metadata||user.raw_user_meta_data||{};var stable={};
    try{stable=readJson('HAPPYAD_PROFILE_IDENTITY_STABLE_V741:'+uid,{})||{}}catch(_e){}
    var current=readUser()||{},currentId=clean(current.id||current.user_id||current.uid);if(currentId&&currentId!==uid)current={};
    function first(){for(var i=0;i<arguments.length;i++){var v=clean(arguments[i]);if(v)return v}return ''}
    return {id:uid,user_id:uid,uid:uid,full_name:first(current.full_name,current.name,current.display_name,stable.full_name,stable.name,meta.full_name,meta.name),name:first(current.name,current.full_name,current.display_name,stable.name,stable.full_name,meta.name,meta.full_name),username:first(current.username,current.handle,stable.username,stable.handle,meta.username,meta.handle).replace(/^@+/,''),handle:first(current.handle,current.username,stable.handle,stable.username,meta.handle,meta.username).replace(/^@+/,''),avatar_url:first(current.avatar_url,current.avatar,current.photo_url,current.profile_photo,stable.avatar_url,stable.avatar,stable.photo_url,meta.avatar_url,meta.avatar,meta.picture),avatar:first(current.avatar,current.avatar_url,current.photo_url,current.profile_photo,stable.avatar,stable.avatar_url,meta.avatar,meta.avatar_url,meta.picture),badge:first(current.badge,current.user_badge,current.badge_type,stable.badge,stable.user_badge)};
  }
  function ownProfileForRenderV941(){
    var uid=currentUid(),base=readUser()||{},baseId=clean(base.id||base.user_id||base.uid);if(baseId&&uid&&baseId!==uid)base={};
    if(uid&&clean(ownAuthSeedV941.id||ownAuthSeedV941.user_id||ownAuthSeedV941.uid)===uid)return Object.assign({},ownAuthSeedV941,base,{id:uid,user_id:uid,uid:uid});
    return base;
  }
  function prepareSignedInIdentityV941(uid,user){
    uid=clean(uid);if(!isUuid(uid))return Promise.resolve({uid:'',story:false});
    /* finishSignedIn appelle directement ce préchauffage juste après applySession.
       window.postMessage est asynchrone : changer ici le contexte de compte évite que
       l'événement SIGNED_IN arrivé quelques ms plus tard annule la requête en cours. */
    if(storyAccountUidV937!==uid)resetStoryAccountV937(uid);
    ownAuthSeedV941=authUserProfileSeedV941(uid,user);
    if(ownAuthWarmV941.uid===uid&&ownAuthWarmV941.promise)return ownAuthWarmV941.promise;
    var token=++ownAuthWarmV941.token;ownAuthWarmV941.uid=uid;ownAuthWarmV941.storyChecked=false;
    var cachedOwn=[];try{cachedOwn=cacheStories().filter(function(p){return ownerOf(p)===uid&&active(p)})}catch(_e){}
    if(cachedOwn.length){
      /* Le cache du BON UID peut déjà peindre la Story derrière l'overlay de connexion,
         mais V941 vérifie quand même le serveur avant de fermer Auth : aucune Story
         supprimée ailleurs ne reste affichée comme vérité finale. */
      try{var prof=ownProfileForRenderV941();mergeStoryCache(uid,cachedRowsForOwner(uid),prof);renderRadarHomeV629()}catch(_e){}
    }
    var c=sb();if(!c){ownAuthWarmV941.storyChecked=true;ownAuthWarmV941.promise=Promise.resolve({uid:uid,story:!!cachedOwn.length,offline:true});return ownAuthWarmV941.promise}
    ownAuthWarmV941.promise=(async function(){
      try{
        var res=await c.from('happyad_stories').select('*').eq('user_id',uid).eq('is_active',true).order('created_at',{ascending:false}).limit(RADAR_REMOTE_ROWS_V788);
        if(token!==ownAuthWarmV941.token||currentUid()!==uid)return {uid:uid,stale:true};
        if(res&&res.error)throw res.error;
        var rows=(Array.isArray(res&&res.data)?res.data:[]).filter(active);
        ownAuthSeedV941=Object.assign({},ownAuthSeedV941,authUserProfileSeedV941(uid,user));
        mergeStoryCache(uid,rows,ownProfileForRenderV941());
        ownAuthWarmV941.storyChecked=true;renderRadarHomeV629();
        return {uid:uid,story:!!rows.length,cached:false};
      }catch(_e){ownAuthWarmV941.storyChecked=true;return {uid:uid,story:false,error:true}}
      finally{if(token===ownAuthWarmV941.token)ownAuthWarmV941.promise=null}
    })();
    return ownAuthWarmV941.promise;
  }
  function finalizeSignedInIdentityV941(uid,user){
    uid=clean(uid);if(!isUuid(uid)||currentUid()!==uid)return false;
    ownAuthSeedV941=Object.assign({},ownAuthSeedV941,authUserProfileSeedV941(uid,user));
    try{var ownRows=cachedRowsForOwner(uid);mergeStoryCache(uid,ownRows,ownProfileForRenderV941())}catch(_e){}
    try{renderRadarHomeV629()}catch(_e){}
    return true;
  }
  function resetStoryAccountV937(nextUid){
    nextUid=clean(nextUid);
    storyAccountUidV937=nextUid;radarAccountGenerationV937++;try{clearRadarVisiblePreloadsV942()}catch(_e){}
    ownAuthSeedV941={};ownAuthWarmV941.uid=nextUid;ownAuthWarmV941.promise=null;ownAuthWarmV941.storyChecked=false;ownAuthWarmV941.token++;
    try{if(radarFreshRetryTimerV907R3)clearTimeout(radarFreshRetryTimerV907R3)}catch(_e){}
    radarFreshRetryTimerV907R3=0;radarFreshReadyV907R3=false;radarFreshStartedAtV907R3=0;
    radarStableSnapshotV792=[];radarStableSnapshotAtV792=0;
    radarCanonicalV792.loading=false;radarCanonicalV792.promise=null;radarCanonicalV792.promiseGeneration=radarAccountGenerationV937;radarCanonicalV792.awaitingStable=true;radarCanonicalV792.emptyUid='';radarCanonicalV792.emptyAt=0;radarCanonicalV792.emptyCount=0;
    try{window.HAPPYAD_STORIES_ITEMS=[];window.__HAPPYAD_STORIES_ITEMS_CACHE=[];window.__HAPPYAD_CURRENT_STORY_CTX=null;window.__HAPPYAD_STORY_VIEWER_CTX=null}catch(_e){}
    try{state.owner='';state.rows=[];state.profile={};state.index=0;if(!state.closed)close()}catch(_e){}
  }
  var radarSkeletonUntilV885=Date.now()+180;
  function rememberRadarStableV792(items){
    try{
      items=(Array.isArray(items)?items:[]).filter(active);
      if(!items.length)return [];
      var seen={},next=[];
      items.slice().sort(function(a,b){return createdOf(b)-createdOf(a)}).forEach(function(p){var id=storyId(p),key=id||ownerOf(p)+'|'+mediaOf(p);if(!key||seen[key])return;seen[key]=1;next.push(p)});
      radarStableSnapshotV792=next.slice(0,320);radarStableSnapshotAtV792=Date.now();
      return radarStableSnapshotV792.slice();
    }catch(_e){return []}
  }
  function stableRadarSnapshotV792(){
    try{return (radarStableSnapshotV792||[]).filter(active).slice()}catch(_e){return []}
  }
  function publishStoryMasterSyncV924(items,source){
    try{
      var at=Date.now(),meta={at:at,count:Array.isArray(items)?items.length:0,uid:currentUid(),source:clean(source||'story-master')};
      localStorage.setItem('HAPPYAD_STORIES_MASTER_READY_V924',JSON.stringify(meta));
      var fr=document.querySelector('iframe[data-happyad-page="profile"]');
      if(fr&&fr.contentWindow){
        var target=(location.origin&&location.origin!=='null')?location.origin:'*';
        fr.contentWindow.postMessage({type:'HAPPYAD_STORIES_MASTER_SYNC_V924',detail:meta},target);
      }
      try{document.dispatchEvent(new CustomEvent('happyad:stories-master-sync-v924',{detail:meta}))}catch(_event){}
    }catch(_e){}
  }
  function commitRadarCacheV792(items){
    items=Array.isArray(items)?items.filter(active):[];
    radarFreshReadyV907R3=true;
    if(items.length)rememberRadarStableV792(items);
    else{radarStableSnapshotV792=[];radarStableSnapshotAtV792=Date.now()}
    try{window.HAPPYAD_STORIES_ITEMS=items;window.__HAPPYAD_STORIES_ITEMS_CACHE=items;localStorage.setItem(storyCacheKeyV937(),JSON.stringify(items.slice(0,320)));if(items.length)rememberLastGoodStoriesV885(items);else clearLastGoodStoriesV885()}catch(_e){}
    publishStoryMasterSyncV924(items,'canonical-commit');
    return items;
  }
  function seenMapV787(){return readJson(storySeenKeyV937(),{})||{}}
  function isLocallySeenV787(id){if(!currentUid())return false;id=clean(id);return !!(id&&seenMapV787()[id])}
  function markSeenLocalV787(row){
    if(!currentUid())return false;
    var id=storyId(row);if(!id)return false;
    try{var seen=seenMapV787();seen[id]=Date.now();localStorage.setItem(storySeenKeyV937(),JSON.stringify(seen));localStorage.setItem('HAPPYAD_RADAR_REFRESH_NEEDED','1')}catch(_e){}
    try{
      var arr=cacheStories();
      arr.forEach(function(p){if(storyId(p)===id){p.isSeen=true;p.seen=true;p.viewed=true}});
      window.HAPPYAD_STORIES_ITEMS=arr;
      localStorage.setItem(storyCacheKeyV937(),JSON.stringify(arr));
    }catch(_e){}
    return true;
  }
  function isMineItem(p){var me=currentUid(),o=ownerOf(p);if(me&&o===me)return true;try{if(typeof window.happyadIsMine==='function'&&window.happyadIsMine(p))return true}catch(_e){}var u=readUser(),h=clean(u.handle||u.username).replace(/^@+/,'').toLowerCase(),ph=clean(p&&(p.handle||p.username)).replace(/^@+/,'').toLowerCase();return !!(me&&h&&ph&&h===ph)}
  function ownerOf(p){p=p||{};return clean(p.creatorId||p.user_id||p.userId||p.auth_user_id||p.authUserId||p.account_uid||p.accountUid||p.ownerId||p.owner_id||p.creator_id||p.uid)}
  function storyId(p){p=p||{};return clean(p.sourceId||p.source_id||p.story_id||p.storyId||p.id)}
  function isStory(p){var k=clean(p&&(p.mode||p.type||p.category||p.source_type||p.sourceType)).toLowerCase();return k==='story'||!!(p&&p.__storyTable==='happyad_stories')||!!(p&&p.isRadar===true&&p.isLive!==true)}
  function mediaOf(p){p=p||{};return clean(p.media_url||p.mediaUrl||p.story||p.url||p.media)}
  function typeOf(p){var t=clean(p&&(p.media_type||p.mediaType||p.kind||p.storyKind)).toLowerCase();return t.indexOf('video')>=0?'video':'photo'}
  function descOf(p){p=p||{};return clean(p.description||p.caption||p.story_description||p.story_caption||p.desc||p.storyDesc)}
  function sharedPostIdV912(p){p=p||{};return clean(p.source_post_id||p.sourcePostId)}
  function sharedPostTypeV912(p){p=p||{};var t=clean(p.source_post_media_type||p.sourcePostMediaType||p.media_type||p.mediaType||p.kind).toLowerCase();return /video|reel|clip/.test(t)?'video':'photo'}
  function isSharedPostStoryV912(p){return !!sharedPostIdV912(p)}
  function sourceStoryIdV888(p){p=p||{};return clean(p.source_story_id||p.sourceStoryId)}
  function sourceStoryOwnerV888(p){p=p||{};return clean(p.source_story_owner_id||p.sourceStoryOwnerId)}
  function sourceStoryAuthorV888(p){p=p||{};return clean(p.source_story_author_name||p.sourceStoryAuthorName)||'Utilisateur Fyblic'}
  function sourceStoryUsernameV888(p){p=p||{};return clean(p.source_story_author_username||p.sourceStoryAuthorUsername).replace(/^@+/,'')}
  function sourceStoryAvatarV888(p){p=p||{};return clean(p.source_story_author_avatar||p.sourceStoryAuthorAvatar)}
  function sourceStoryBadgeV888(p){p=p||{};return clean(p.source_story_author_badge||p.sourceStoryAuthorBadge)}
  function sourceStoryCaptionV888(p){p=p||{};return clean(p.source_story_caption||p.sourceStoryCaption)}
  function originStoryIdV895(p){p=p||{};return clean(p.origin_story_id||p.originStoryId)}
  function originStoryOwnerV895(p){p=p||{};return clean(p.origin_story_owner_id||p.originStoryOwnerId)}
  function originStoryAuthorV895(p){p=p||{};return clean(p.origin_story_author_name||p.originStoryAuthorName)}
  function originStoryUsernameV895(p){p=p||{};return clean(p.origin_story_author_username||p.originStoryAuthorUsername).replace(/^@+/,'')}
  function originStoryAvatarV895(p){p=p||{};return clean(p.origin_story_author_avatar||p.originStoryAuthorAvatar)}
  function originStoryBadgeV895(p){p=p||{};return clean(p.origin_story_author_badge||p.originStoryAuthorBadge)}
  function repostDepthV895(p){p=p||{};return Math.max(0,Math.min(2,Number(p.story_repost_depth||p.storyRepostDepth||0)||0))}
  function isSharedStoryV888(p){return !!sourceStoryIdV888(p)}
  /* V917 point 1 : l'identité d'une Story ne doit jamais être déduite de
     l'absence temporaire de source_post_id dans un ancien cache. Une ligne
     venant directement de happyad_stories est marquée explicitement native
     ou shared_post; un ancien cache sans marque reste "inconnu" et doit
     être vérifié avant le premier rendu. */
  function storySourceKindV917(p){
    p=p||{};
    if(sourceStoryIdV888(p))return 'shared_story';
    if(sharedPostIdV912(p))return 'shared_post';
    var k=clean(p.story_source_kind||p.storySourceKind||p.__storySourceKindV917).toLowerCase();
    if(k==='shared_story'||k==='story_repost')return 'shared_story';
    if(k==='shared_post'||k==='shared')return 'shared_post';
    if(k==='native'||k==='story')return 'native';
    if(p.isSharedStory===true)return 'shared_story';
    if(p.isSharedPostStory===true)return 'shared_post';
    if(p.isSharedPostStory===false&&p.isSharedStory!==true&&p.__storyIdentityV916===true)return 'native';
    return '';
  }
  function storyIdentityKnownV917(p){return !!storySourceKindV917(p)}
  function sourcePostTitleV912(p){p=p||{};return clean(p.source_post_title||p.sourcePostTitle)||'Publication Fyblic'}
  function sourcePostAuthorV912(p){p=p||{};return clean(p.source_post_author_name||p.sourcePostAuthorName)||'Utilisateur Fyblic'}
  function sourcePostAvatarV912(p){p=p||{};return clean(p.source_post_author_avatar||p.sourcePostAuthorAvatar)}
  function sourcePostOwnerV890(p){p=p||{};return clean(p.source_post_owner_id||p.sourcePostOwnerId)}
  function sourcePostCaptionV912(p){p=p||{};return clean(p.source_post_caption||p.sourcePostCaption)}
  function sourcePostGroupIdsV913(p){
    p=p||{};var raw=p.source_post_group_ids!=null?p.source_post_group_ids:p.sourcePostGroupIds,arr=[];
    if(Array.isArray(raw))arr=raw;
    else if(raw&&typeof raw==='object'){try{arr=Array.isArray(raw.ids)?raw.ids:[]}catch(_e){}}
    else if(clean(raw)){try{var x=JSON.parse(clean(raw));if(Array.isArray(x))arr=x;else if(x&&Array.isArray(x.ids))arr=x.ids}catch(_e2){}}
    var seen={},out=[];arr.forEach(function(v){v=clean(v);if(v&&!seen[v]){seen[v]=1;out.push(v)}});return out.slice(0,40)
  }
  function sourcePostGroupCountV913(p){
    p=p||{};var n=Number(p.source_post_group_count!=null?p.source_post_group_count:p.sourcePostGroupCount),ids=sourcePostGroupIdsV913(p);
    if(!Number.isFinite(n)||n<1)n=ids.length||1;return Math.max(1,Math.min(40,Math.floor(n)))
  }
  function isGroupedSharedPostV913(p){p=p||{};return p.source_post_grouped===true||p.sourcePostGrouped===true||sourcePostGroupCountV913(p)>1||sourcePostGroupIdsV913(p).length>1}
  function timestampMsV783(v){
    if(v==null||v==='')return 0;
    if(typeof v==='number'&&Number.isFinite(v))return v>0&&v<100000000000?v*1000:(v>0?v:0);
    var text=clean(v);if(!text)return 0;
    if(/^\d+(?:\.\d+)?$/.test(text)){var n=Number(text);return Number.isFinite(n)?(n<100000000000?n*1000:n):0}
    var d=Date.parse(text);return Number.isFinite(d)?d:0;
  }
  function createdOf(p){
    p=p||{};var values=[p.created_at,p.createdAt,p.story_created_at,p.published_at,p.inserted_at];
    for(var i=0;i<values.length;i++){var ms=timestampMsV783(values[i]);if(ms>0)return ms}
    return 0;
  }
  function createdIsoV783(p){var ms=createdOf(p);return ms>0?new Date(ms).toISOString():''}
  function active(p){if(!p)return false;if(p.is_active===false||p.active===false||p.deleted===true)return false;var ex=p.expires_at||p.expiresAt||p.expire_at||p.expired_at;if(ex&&Date.parse(ex)<Date.now())return false;return !!mediaOf(p)}
  function bootCacheActiveV936(p){
    if(!active(p))return false;
    var ex=p&&(p.expires_at||p.expiresAt||p.expire_at||p.expired_at),exMs=timestampMsV783(ex);
    if(exMs>0)return exMs>Date.now();
    var cr=createdOf(p);
    return cr>0&&Date.now()-cr<86400000;
  }
  function badgeHtml(b){
    b=clean(b);if(!b)return '';
    try{if(typeof window.badgeMarkHtml==='function'){var html=window.badgeMarkHtml(b);if(html)return html}}catch(_e){}
    var value=b.toLowerCase(),cls='';
    if(/rose|pink/.test(value))cls='rose';
    else if(/violet|purple|jaune|yellow|business/.test(value))cls='violet';
    else if(/bleu|blue|verif|cert/.test(value))cls='bleu';
    return cls?'<span class="happyBadgeMark '+cls+'" aria-label="Compte vérifié"></span>':'';
  }
  function initials(n){n=clean(n)||'H';return (n[0]||'H').toUpperCase()}
  function ageOf(v){var d=createdOf(v);if(!d)return 'À l’instant';var s=Math.max(0,Math.floor((Date.now()-d)/1000));if(s<60)return s+' s';if(s<3600)return Math.floor(s/60)+' min';if(s<86400)return Math.floor(s/3600)+' h';return Math.floor(s/86400)+' j'}
  function stopAgeTickerV783(){if(state.ageTimer){clearInterval(state.ageTimer);state.ageTimer=0}}
  function refreshViewerAgeV783(){if(state.closed)return;var sub=$('ha629Sub'),row=currentRow();if(sub&&row)sub.textContent=ageOf(row)}
  function startAgeTickerV783(){stopAgeTickerV783();refreshViewerAgeV783();state.ageTimer=setInterval(refreshViewerAgeV783,1000)}
  function refreshRadarAgesV783(){
    if(document.hidden)return;
    document.querySelectorAll('[data-story-age-v783]').forEach(function(el){
      var ms=timestampMsV783(el.getAttribute('data-story-created-at'));
      if(ms>0)el.textContent=ageOf({createdAt:ms});
    });
  }
  function toast(msg){try{if(typeof window.toast==='function')return window.toast(msg)}catch(_e){}var old=$('haStoryToastV629');if(old)old.remove();var n=document.createElement('div');n.id='haStoryToastV629';n.textContent=msg;n.style.cssText='position:fixed;left:50%;bottom:calc(118px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483647;background:rgba(20,23,30,.94);color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:10px 15px;font:800 13px system-ui;max-width:82vw;text-align:center';document.body.appendChild(n);setTimeout(function(){try{n.remove()}catch(_e){}},2200)}

  function itemFromRow(r,p){p=p||{};return {
    id:storyId(r),sourceId:storyId(r),story_id:storyId(r),mode:'story',type:'story',category:'story',
    creatorId:ownerOf(r)||ownerOf(p),user_id:ownerOf(r)||ownerOf(p),
    creatorName:clean(p.full_name||p.display_name||p.name||r.user_name||r.display_name||r.creatorName)||'Utilisateur Fyblic',
    handle:clean(p.username||p.handle||r.username||r.handle),avatar:clean(p.avatar_url||p.avatar||r.user_avatar||r.avatar_url||r.avatar),
    badge:clean(p.badge||p.user_badge||p.badge_type||p.verification_badge||p.verified_badge||p.profile_badge||r.badge||r.user_badge||r.badge_type),mediaUrl:mediaOf(r),media_url:mediaOf(r),mediaType:typeOf(r),kind:typeOf(r),
    description:descOf(r),desc:descOf(r),createdAt:createdOf(r),created_at:r.created_at||createdIsoV783(r),expiresAt:r.expires_at||r.expiresAt||'',
    source_post_id:sharedPostIdV912(r),sourcePostId:sharedPostIdV912(r),source_post_media_type:clean(r.source_post_media_type||r.sourcePostMediaType),source_post_owner_id:clean(r.source_post_owner_id||r.sourcePostOwnerId),source_post_title:clean(r.source_post_title||r.sourcePostTitle),source_post_author_name:clean(r.source_post_author_name||r.sourcePostAuthorName),source_post_author_avatar:clean(r.source_post_author_avatar||r.sourcePostAuthorAvatar),source_post_caption:clean(r.source_post_caption||r.sourcePostCaption),source_post_grouped:!!(r.source_post_grouped||r.sourcePostGrouped||isGroupedSharedPostV913(r)),source_post_group_count:sourcePostGroupCountV913(r),source_post_group_ids:sourcePostGroupIdsV913(r),
    source_story_id:sourceStoryIdV888(r),sourceStoryId:sourceStoryIdV888(r),source_story_owner_id:sourceStoryOwnerV888(r),sourceStoryOwnerId:sourceStoryOwnerV888(r),source_story_author_name:sourceStoryAuthorV888(r),sourceStoryAuthorName:sourceStoryAuthorV888(r),source_story_author_username:sourceStoryUsernameV888(r),sourceStoryAuthorUsername:sourceStoryUsernameV888(r),source_story_author_avatar:sourceStoryAvatarV888(r),sourceStoryAuthorAvatar:sourceStoryAvatarV888(r),source_story_author_badge:sourceStoryBadgeV888(r),sourceStoryAuthorBadge:sourceStoryBadgeV888(r),source_story_caption:sourceStoryCaptionV888(r),sourceStoryCaption:sourceStoryCaptionV888(r),origin_story_id:originStoryIdV895(r),originStoryId:originStoryIdV895(r),origin_story_owner_id:originStoryOwnerV895(r),originStoryOwnerId:originStoryOwnerV895(r),origin_story_author_name:originStoryAuthorV895(r),originStoryAuthorName:originStoryAuthorV895(r),origin_story_author_username:originStoryUsernameV895(r),originStoryAuthorUsername:originStoryUsernameV895(r),origin_story_author_avatar:originStoryAvatarV895(r),originStoryAuthorAvatar:originStoryAvatarV895(r),origin_story_author_badge:originStoryBadgeV895(r),originStoryAuthorBadge:originStoryBadgeV895(r),story_repost_depth:repostDepthV895(r),storyRepostDepth:repostDepthV895(r),
    story_source_kind:sourceStoryIdV888(r)?'shared_story':(sharedPostIdV912(r)?'shared_post':'native'),storySourceKind:sourceStoryIdV888(r)?'shared_story':(sharedPostIdV912(r)?'shared_post':'native'),isSharedStory:!!sourceStoryIdV888(r),isSharedPostStory:!!sharedPostIdV912(r),__storyIdentityV916:true,__storySourceKindV917:sourceStoryIdV888(r)?'shared_story':(sharedPostIdV912(r)?'shared_post':'native'),
    isRadar:true,isLive:false,isSeen:!!(r.isSeen||r.seen||r.viewed||isLocallySeenV787(storyId(r))),seen:!!(r.isSeen||r.seen||r.viewed||isLocallySeenV787(storyId(r))),viewed:!!(r.isSeen||r.seen||r.viewed||isLocallySeenV787(storyId(r))),__storyTable:'happyad_stories'
  }}
  function rowFromItem(p){return {
    id:storyId(p),user_id:ownerOf(p),media_url:mediaOf(p),media_type:typeOf(p),description:descOf(p),created_at:p.created_at||createdIsoV783(p),
    expires_at:p.expires_at||p.expiresAt||'',user_name:p.creatorName||p.user_name||p.title||'',user_avatar:p.avatar||p.user_avatar||p.avatar_url||'',
    source_post_id:sharedPostIdV912(p),source_post_media_type:clean(p.source_post_media_type||p.sourcePostMediaType),source_post_owner_id:clean(p.source_post_owner_id||p.sourcePostOwnerId),source_post_title:clean(p.source_post_title||p.sourcePostTitle),source_post_author_name:clean(p.source_post_author_name||p.sourcePostAuthorName),source_post_author_avatar:clean(p.source_post_author_avatar||p.sourcePostAuthorAvatar),source_post_caption:clean(p.source_post_caption||p.sourcePostCaption),source_post_grouped:!!(p.source_post_grouped||p.sourcePostGrouped||isGroupedSharedPostV913(p)),source_post_group_count:sourcePostGroupCountV913(p),source_post_group_ids:sourcePostGroupIdsV913(p),
    source_story_id:sourceStoryIdV888(p),source_story_owner_id:sourceStoryOwnerV888(p),source_story_author_name:sourceStoryAuthorV888(p),source_story_author_username:sourceStoryUsernameV888(p),source_story_author_avatar:sourceStoryAvatarV888(p),source_story_author_badge:sourceStoryBadgeV888(p),source_story_caption:sourceStoryCaptionV888(p),origin_story_id:originStoryIdV895(p),origin_story_owner_id:originStoryOwnerV895(p),origin_story_author_name:originStoryAuthorV895(p),origin_story_author_username:originStoryUsernameV895(p),origin_story_author_avatar:originStoryAvatarV895(p),origin_story_author_badge:originStoryBadgeV895(p),story_repost_depth:repostDepthV895(p),
    story_source_kind:storySourceKindV917(p),storySourceKind:storySourceKindV917(p),isSharedStory:storySourceKindV917(p)==='shared_story',isSharedPostStory:storySourceKindV917(p)==='shared_post',__storyIdentityV916:storyIdentityKnownV917(p),__storySourceKindV917:storySourceKindV917(p),
    badge:p.badge||p.userBadge||p.user_badge||p.badge_type||p.verification_badge||p.verified_badge||p.profile_badge||'',username:clean(p.username||p.handle).replace(/^@+/,'')
  }}
  function profileFromItem(p){p=p||{};return {id:ownerOf(p),full_name:clean(p.creatorName||p.user_name||p.display_name||p.title),username:clean(p.username||p.handle).replace(/^@+/,''),avatar_url:clean(p.avatar||p.user_avatar||p.avatar_url),badge:clean(p.badge||p.userBadge||p.user_badge||p.badge_type||p.verification_badge||p.verified_badge||p.profile_badge)}}

  function lastGoodStoriesV885(){
    try{var arr=readJson(storyLastGoodKeyV937(),[]);return Array.isArray(arr)?arr.filter(active):[]}catch(_e){return []}
  }
  function rememberLastGoodStoriesV885(items){
    try{
      items=(Array.isArray(items)?items:[]).filter(active);
      if(items.length)localStorage.setItem(storyLastGoodKeyV937(),JSON.stringify(items.slice(0,320)));
      return items;
    }catch(_e){return []}
  }
  function clearLastGoodStoriesV885(){try{localStorage.removeItem(storyLastGoodKeyV937())}catch(_e){}}

  function cacheStories(){
    var arr=[];
    /* V936 : le premier rendu utilise immédiatement le dernier cache Story valide.
       V907R3 bloquait volontairement tout cache jusqu'à la réponse Supabase, ce qui
       laissait le Radar sur squelette pendant plusieurs requêtes réseau. Les lignes
       expirées/inactives restent filtrées localement par active(); Supabase ne fait
       ensuite qu'une réconciliation silencieuse. */
    try{if(Array.isArray(window.HAPPYAD_STORIES_ITEMS)&&window.HAPPYAD_STORIES_ITEMS.length)arr=arr.concat(window.HAPPYAD_STORIES_ITEMS)}catch(_e){}
    try{var x=readJson(storyCacheKeyV937(),[]);if(Array.isArray(x))arr=arr.concat(x)}catch(_e){}
    try{var lg=lastGoodStoriesV885();if(lg.length)arr=arr.concat(lg)}catch(_e){}
    var seen={},out=[];
    arr.forEach(function(p){var guest=!currentUid();if(guest)p=Object.assign({},p,{isSeen:false,seen:false,viewed:false});var id=storyId(p),key=id||ownerOf(p)+'|'+mediaOf(p),valid=radarFreshReadyV907R3?active(p):bootCacheActiveV936(p);if(!key||seen[key]||!isStory(p)||!valid||isMutedOwner(ownerOf(p)))return;if(id&&isLocallySeenV787(id)){p.isSeen=true;p.seen=true;p.viewed=true}seen[key]=1;out.push(p)});
    if(!radarFreshReadyV907R3){
      /* V936 : le nettoyage n'est pas seulement visuel. Les entrées expirées sont
         réellement retirées des deux caches persistants dès le premier passage. */
      try{localStorage.setItem(storyCacheKeyV937(),JSON.stringify(out.slice(0,320)));if(out.length)localStorage.setItem(storyLastGoodKeyV937(),JSON.stringify(out.slice(0,320)));else localStorage.removeItem(storyLastGoodKeyV937())}catch(_e){}
    }
    /* V792/V936 : pendant une réconciliation, garder aussi le snapshot mémoire de
       cette même session; ne jamais remplacer un lot valide par un état transitoire. */
    if(out.length)rememberRadarStableV792(out);
    else{var stable=stableRadarSnapshotV792();if(stable.length)out=stable}
    var me=readUser(),uid=currentUid();
    /* V783 : le secours local n'invente plus Date.now() à chaque rendu.
       Il n'est accepté que s'il possède l'identifiant et l'heure réels de la
       ligne happyad_stories. Sinon le prochain fetch serveur reste la vérité. */
    var localCreated=timestampMsV783(me.storyCreatedAt||me.story_created_at||me.storyCreated||'');
    var localExpires=timestampMsV783(me.storyExpiresAt||me.story_expires_at||me.storyExpires||'');
    if(uid&&me.storyActive&&clean(me.story)&&isUuid(me.storyId||me.story_id)&&localCreated>0&&(!localExpires||localExpires>Date.now())){
      var has=out.some(function(p){return ownerOf(p)===uid&&mediaOf(p)===clean(me.story)});
      if(!has)out.push({id:clean(me.storyId||me.story_id),sourceId:clean(me.storyId||me.story_id),mode:'story',type:'story',category:'story',creatorId:uid,user_id:uid,creatorName:clean(me.name||me.full_name)||'Ta story',handle:clean(me.handle||me.username),avatar:clean(me.avatar||me.avatar_url),badge:clean(me.badge||me.user_badge),mediaUrl:clean(me.story),mediaType:clean(me.storyKind)||'photo',description:clean(me.storyDesc),createdAt:localCreated,created_at:new Date(localCreated).toISOString(),expiresAt:localExpires?new Date(localExpires).toISOString():'',isRadar:true,isLive:false,__storyTable:'happyad_stories'});
    }
    if(out.length){rememberRadarStableV792(out);rememberLastGoodStoriesV885(out)}
    return out;
  }
  function cachedRowsForOwner(owner,seed){
    var me=currentUid();
    var arr=cacheStories().filter(function(p){return ownerOf(p)===owner||(owner===me&&isMineItem(p))}).map(function(p){var r=rowFromItem(p);if(owner===me&&isMineItem(p))r.user_id=owner;return r}).filter(active);
    if(seed&&(ownerOf(seed)===owner||(owner===me&&isMineItem(seed)))&&active(seed)&&!arr.some(function(r){return storyId(r)===storyId(seed)})){var sr=rowFromItem(seed);if(owner===me)sr.user_id=owner;arr.push(sr)}
    arr.sort(function(a,b){return createdOf(a)-createdOf(b)});
    return arr;
  }
  function mergeStoryCache(owner,rows,profile){
    try{
      var previous=cacheStories(),stickySeen={};
      previous.forEach(function(p){var id=storyId(p);if(id&&(p.isSeen||p.seen||p.viewed||isLocallySeenV787(id)))stickySeen[id]=1});
      var all=previous.filter(function(p){return ownerOf(p)!==owner});
      rows.forEach(function(r){
        var item=itemFromRow(r,profile),id=storyId(item);
        if(id&&(stickySeen[id]||isLocallySeenV787(id))){item.isSeen=true;item.seen=true;item.viewed=true}
        all.push(item);
      });
      all.sort(function(a,b){return createdOf(b)-createdOf(a)});
      all=all.slice(0,100);
      window.HAPPYAD_STORIES_ITEMS=all;
      localStorage.setItem(storyCacheKeyV937(),JSON.stringify(all));if(all.length)rememberLastGoodStoriesV885(all);
    }catch(_e){}
  }

  async function fetchRows(owner){
    var c=sb();if(!c||!owner)return [];
    try{var q=await c.from('happyad_stories').select('*').eq('user_id',owner).eq('is_active',true).order('created_at',{ascending:true}).limit(30);if(q&&q.error)throw q.error;return (q.data||[]).filter(active)}catch(_e){return []}
  }
  async function fetchProfile(owner,seedProfile){
    var me=readUser();if(owner&&owner===currentUid())return {id:owner,full_name:clean(me.name||me.full_name),username:clean(me.handle||me.username).replace(/^@+/,''),avatar_url:clean(me.avatar||me.avatar_url),badge:clean(me.badge||me.user_badge||me.badge_type||me.verification_badge||me.verified_badge||me.profile_badge)};
    var c=sb();if(c&&owner){try{var q=await c.from('happyad_profiles_public_v1').select('*').eq('id',owner).maybeSingle();if(q&&!q.error&&q.data)return q.data}catch(_e){}}
    return seedProfile||{};
  }
  function exactStoryExpiredV735(row){
    if(!row)return true;
    if(row.is_active===false||row.active===false||row.deleted===true)return true;
    var expires=clean(row.expires_at||row.expiresAt||row.expire_at||row.expired_at);
    if(expires){var expiresAt=Date.parse(expires);if(Number.isFinite(expiresAt)&&expiresAt<=Date.now())return true}
    else{
      var created=Date.parse(clean(row.created_at||row.createdAt));
      if(Number.isFinite(created)&&Date.now()-created>=86400000)return true;
    }
    return !mediaOf(row);
  }
  async function fetchExactStoryV735(id){
    id=clean(id);var c=sb();
    if(!id)return {status:'missing',row:null};
    if(!c||typeof c.from!=='function')return {status:'unavailable',row:null};
    try{
      var q=await c.from('happyad_stories').select('*').eq('id',id).maybeSingle();
      if(q&&q.error)throw q.error;
      if(!q||!q.data||exactStoryExpiredV735(q.data))return {status:'expired',row:q&&q.data||null};
      return {status:'active',row:q.data};
    }catch(_e){return {status:'error',row:null}}
  }
  function openExactNotificationShellV971(detail,id){
    detail=detail||{};id=clean(id||detail.story_id||detail.id);if(!id)return false;
    var cached=cacheStories().find(function(p){return storyId(p)===id&&active(p)&&storyIdentityKnownV917(p)})||null;
    var owner=clean(detail.owner_id||detail.user_id)||(cached&&ownerOf(cached))||'';
    if(cached&&owner){show(owner,[rowFromItem(cached)],profileFromItem(cached),id);return true;}
    if(!owner)return false;
    var box=ensureViewer(),seedProfile={id:owner,full_name:clean(detail.author_name)||'Story',avatar_url:clean(detail.author_avatar),badge:clean(detail.badge)};
    state.owner=owner;state.rows=[];state.profile=seedProfile;state.closed=false;state.paused=false;state.openToken++;
    activateViewerSurface(box);armStoryReturnV927();lock();
    $('ha629Progress').innerHTML='';$('ha629Avatar').innerHTML=seedProfile.avatar_url?'<img src="'+esc(seedProfile.avatar_url)+'" alt="">':'<span class="happyadDefaultProfileAvatarV989" aria-hidden="true"></span>';$('ha629Name').innerHTML=esc(seedProfile.full_name||'Story')+badgeHtml(seedProfile.badge);$('ha629Sub').textContent='Fyblic';$('ha629Media').innerHTML='<div class="ha629Loading">Ouverture de la story…</div>';$('ha629Caption').textContent='';$('ha629Bottom').innerHTML='';
    return true;
  }
  async function openExactNotificationV735(detail){
    detail=detail||{};var id=clean(detail.story_id||detail.id),token=++exactNotificationOpenTokenV735;
    if(!id){toast('Story introuvable.');return false}

    /* V971 : le clic Notification ouvre la surface Story immédiatement. La
       vérification Supabase reste la vérité, mais elle ne bloque plus le premier
       rendu ni l'animation d'ouverture. */
    openExactNotificationShellV971(detail,id);
    var exact=await fetchExactStoryV735(id);
    if(token!==exactNotificationOpenTokenV735)return false;

    if(exact.status==='expired'||exact.status==='missing'){
      toast('Cette story a expiré.');if(!state.closed&&(state.rows.length===0||storyId(currentRow())===id))close('notification-expired-v971');
      return false;
    }
    if(exact.status!=='active'||!exact.row){
      toast('Story indisponible. Réessayez.');if(!state.closed&&(state.rows.length===0||storyId(currentRow())===id))close('notification-error-v971');
      return false;
    }

    var row=exact.row,owner=ownerOf(row)||clean(detail.owner_id||detail.user_id);
    if(!owner||storyId(row)!==id||exactStoryExpiredV735(row)){
      toast('Cette story a expiré.');if(!state.closed&&(state.rows.length===0||storyId(currentRow())===id))close('notification-invalid-v971');
      return false;
    }

    var seed={
      id:id,story_id:id,sourceId:id,mode:'story',type:'story',category:'story',
      creatorId:owner,user_id:owner,creatorName:clean(detail.author_name||row.user_name||row.display_name)||'Utilisateur Fyblic',
      mediaUrl:mediaOf(row),media_url:mediaOf(row),mediaType:typeOf(row),description:descOf(row),
      created_at:row.created_at||'',expires_at:row.expires_at||'',isRadar:true,isLive:false,__storyTable:'happyad_stories'
    };
    var seedProfile=profileFromItem(seed);
    /* Le média exact est maintenant affiché dès la réponse Story. Le profil peut
       être enrichi ensuite sans retenir l'ouverture du lecteur. */
    mergeStoryCache(owner,[row],seedProfile||{});
    show(owner,[row],seedProfile||{},id);
    fetchProfile(owner,seedProfile).then(function(profile){if(token!==exactNotificationOpenTokenV735||state.closed||state.owner!==owner)return;mergeStoryCache(owner,[row],profile||seedProfile||{});syncVerifiedOwnerV785(owner,[row],profile||seedProfile||{});}).catch(function(){});
    return true;
  }
  async function authUid(){try{if(typeof window.happyadAuthUser==='function'){var u=await window.happyadAuthUser();if(u&&u.id)return clean(u.id)}}catch(_e){}return currentUid()}
  function analyticsTrackV728(type,row,extra){try{var api=window.HappyAnalyticsV728;if(!api||typeof api.track!=='function'||!row)return false;var owner=ownerOf(row),viewer=currentUid();if(!owner||owner===viewer)return false;extra=extra||{};return api.track(type,{ownerId:owner,contentId:storyId(row),contentType:'story',source:'story',completed:!!extra.completed,duration:Number(extra.duration||0)||0,dedupeKey:extra.dedupeKey||'',metadata:extra.metadata||{}})}catch(_e){return false}}
  async function markSeen(row){
    var id=storyId(row),owner=ownerOf(row);if(!id)return;
    /* V938 : un visiteur sans compte peut regarder les Stories, mais ne crée
       jamais de vue locale ni serveur. */
    var viewer=currentUid();if(!viewer)return;
    markSeenLocalV787(row);
    viewer=await authUid();if(!viewer)return;
    if(owner===viewer)return;
    var c=sb();if(!c)return;
    try{var now=new Date().toISOString();var q=await c.from('happyad_story_views').select('story_id').eq('story_id',id).eq('viewer_id',viewer).limit(1);if(q&&q.data&&q.data.length)await c.from('happyad_story_views').update({viewed_at:now}).eq('story_id',id).eq('viewer_id',viewer);else await c.from('happyad_story_views').insert({story_id:id,viewer_id:viewer,viewed_at:now})}catch(_e){}
  }
  function storyLikeStorageKey(){return STORY_LIKE_KEY+'_'+(currentUid()||'guest')}
  function storyLikeMap(){return readJson(storyLikeStorageKey(),{})||{}}
  function localStoryLike(id){id=clean(id);if(!id)return false;var map=storyLikeMap();return !!map[id]}
  function setLocalStoryLike(id,on){id=clean(id);if(!id)return;try{var map=storyLikeMap();if(on)map[id]=Date.now();else delete map[id];localStorage.setItem(storyLikeStorageKey(),JSON.stringify(map))}catch(_e){}}
  function storyLikeBool(data,fallback){
    if(typeof data==='boolean')return data;
    if(Array.isArray(data))data=data[0];
    if(data&&typeof data==='object'){
      if(typeof data.liked==='boolean')return data.liked;
      if(typeof data.is_liked==='boolean')return data.is_liked;
      if(typeof data.value==='boolean')return data.value;
    }
    return !!fallback;
  }
  function isMissingRpcError(err){
    var code=clean(err&&err.code).toUpperCase(),msg=clean(err&&(err.message||err.details||err.hint)).toLowerCase();
    return code==='PGRST202'||code==='42883'||msg.indexOf('function')>=0||msg.indexOf('schema cache')>=0;
  }
  async function loadLike(row){
    var id=storyId(row),viewer=await authUid(),c=sb();if(!id||!viewer||!c)return localStoryLike(id);
    try{
      var rpcState=await c.rpc('happyad_story_like_state_v697',{p_story_id:id});
      if(rpcState&&rpcState.error)throw rpcState.error;
      var rpcOn=storyLikeBool(rpcState&&rpcState.data,localStoryLike(id));setLocalStoryLike(id,rpcOn);return rpcOn;
    }catch(_rpcError){
      try{
        var q=await c.from('happyad_story_likes').select('liked,updated_at').eq('story_id',id).eq('user_id',viewer).maybeSingle();
        if(q&&q.error)throw q.error;
        var on=!!(q&&q.data&&q.data.liked);setLocalStoryLike(id,on);return on;
      }catch(_tableError){
        try{
          var old=await c.from('happyad_content_actions').select('liked,created_at').eq('post_id',id).eq('action_type','like').eq('user_id',viewer).in('content_type',['story','photo']).order('created_at',{ascending:false}).limit(1);
          if(old&&!old.error){var oldOn=!!(old.data&&old.data[0]&&old.data[0].liked);setLocalStoryLike(id,oldOn);return oldOn}
        }catch(_oldError){}
        return localStoryLike(id);
      }
    }
  }
  async function saveLike(row,on){
    var id=storyId(row),viewer=await authUid(),c=sb();if(!id||!viewer||!c)return false;
    setLocalStoryLike(id,on);
    try{
      var result=await c.rpc('happyad_story_like_set_v697',{p_story_id:id,p_liked:!!on});
      if(result&&result.error&&isMissingRpcError(result.error)){
        await new Promise(function(resolve){setTimeout(resolve,320)});
        result=await c.rpc('happyad_story_like_set_v697',{p_story_id:id,p_liked:!!on});
      }
      if(result&&result.error)throw result.error;
      var confirmed=storyLikeBool(result&&result.data,on);
      setLocalStoryLike(id,confirmed);
      return confirmed===!!on;
    }catch(_rpcError){
      try{
        var now=new Date().toISOString();
        var direct=await c.from('happyad_story_likes').upsert({story_id:id,user_id:viewer,liked:!!on,updated_at:now},{onConflict:'story_id,user_id'});
        if(direct&&direct.error)throw direct.error;
        return true;
      }catch(_tableError){
        setLocalStoryLike(id,!on);
        try{console.warn('[Fyblic V697] story like sync',_rpcError||_tableError)}catch(_e){}
        return false;
      }
    }
  }
  function uuid(){try{return crypto.randomUUID()}catch(_e){return '00000000-0000-4000-8000-'+String(Date.now()).padStart(12,'0').slice(-12)}}
  async function rpc(name,variants){
    var c=sb();if(!c||typeof c.rpc!=='function')throw new Error('Connexion Messages indisponible.');var last=null;
    for(var i=0;i<variants.length;i++){var r=await c.rpc(name,variants[i]);if(!r.error)return r.data;last=r.error;var code=clean(last&&last.code).toUpperCase(),txt=clean(last&&(last.message||last.details||last.hint)).toLowerCase();if(!(code==='PGRST202'||code==='42883'||txt.indexOf('function')>=0))break}
    throw new Error(clean(last&&(last.message||last.details))||'Envoi impossible.');
  }
  function firstRow(data){if(Array.isArray(data))return data[0]||{};if(data&&Array.isArray(data.data))return data.data[0]||{};return data||{}}
  async function storyReplyPermissionV898(row,force){
    var gate=window.HappyInteractionPrivacyV855R52,id=storyId(row),owner=ownerOf(row);
    if(!gate)return {allowed:null,available:false,source:'none'};
    /* V899 : source canonique = le JSON privacy réellement enregistré par
       Paramètres dans happyad_user_settings. L'ancienne RPC d'interactions peut
       rester désynchronisée et ne doit plus produire un faux refus. */
    if(owner&&typeof gate.canStoryRepliesOwnerStatusV899==='function'){
      try{
        var canonical=await gate.canStoryRepliesOwnerStatusV899(owner,!!force);
        if(canonical&&canonical.available===true){
          return {allowed:canonical.allowed===true,available:true,source:'settings-canonical'};
        }
      }catch(_canonicalGate){}
    }
    /* Compatibilité avant installation du SQL V899 : les anciennes sources ne
       sont acceptées que lorsqu'elles autorisent explicitement. Un ancien false
       est indéterminé, jamais une preuve de désactivation. */
    if(owner&&typeof gate.loadPolicy==='function'){
      try{
        var policy=await gate.loadPolicy(owner,!!force);
        if(policy&&policy.available===true&&policy.storyReplies===true){
          return {allowed:true,available:true,source:'legacy-owner-allow'};
        }
      }catch(_ownerPolicy){}
    }
    if(id&&typeof gate.canStoryStatus==='function'){
      try{
        var s=await gate.canStoryStatus(id,'storyReplies',!!force);
        if(s&&s.available&&s.allowed===true)return {allowed:true,available:true,source:'legacy-story-allow'};
      }catch(_storyGate){}
    }
    return {allowed:null,available:false,source:'canonical-unavailable'};
  }
  async function confirmStoryReplyPermissionV898(row){
    var waits=[0,220,520],last={allowed:null,available:false};
    for(var i=0;i<waits.length;i++){
      if(waits[i])await new Promise(function(resolve){setTimeout(resolve,waits[i])});
      last=await storyReplyPermissionV898(row,true);
      if(last&&last.available)return last;
    }
    return last;
  }
  async function sendStoryReply(row,text){
    var target=ownerOf(row),me=await authUid();if(!isUuid(target)||!isUuid(me)||target===me)throw new Error('Destinataire indisponible.');
    var replyPermission=await confirmStoryReplyPermissionV898(row);
    if(replyPermission&&replyPermission.available&&replyPermission.allowed===false)throw new Error('Le propriétaire a désactivé les réponses à cette Story.');
    if(!replyPermission||!replyPermission.available)throw new Error('Impossible de vérifier les réponses pour le moment. Réessayez.');
    var opened=await rpc('happyad_msg_open_direct_privacy_v855r51',[{p_target_user_id:target}]);
    var o=firstRow(opened),conversation=clean(o.conversation_id||o.id||(typeof opened==='string'?opened:''));if(!isUuid(conversation))throw new Error('Conversation indisponible.');
    var profile=state.profile||{},author=clean(profile.full_name||profile.display_name||profile.name||row.user_name)||'Fyblic';
    var meProfile=readUser(),replyActor=clean(meProfile.name||meProfile.full_name||meProfile.display_name||meProfile.username||meProfile.handle)||'Un utilisateur';
    var meta={story_id:storyId(row),owner_id:target,user_id:target,media_url:mediaOf(row),preview_url:mediaOf(row),thumbnail_url:clean(row.thumbnail_url||row.poster_url),media_type:typeOf(row),title:'Story de '+author,author_name:author,reply_actor_id:me,reply_actor_name:replyActor,description:descOf(row),created_at:row.created_at||new Date(createdOf(row)).toISOString(),expires_at:row.expires_at||row.expiresAt||''};
    var body=STORY_REPLY_MARKER+JSON.stringify(meta)+'\n'+clean(text),clientId=uuid();
    await rpc('happyad_msg_send_text',[{p_conversation_id:conversation,p_client_message_id:clientId,p_body:body,p_reply_to_id:null},{conversation_id:conversation,client_message_id:clientId,body:body,reply_to_id:null}]);
    analyticsTrackV728('story_reply',row,{dedupeKey:'v728:story-reply:'+clientId,metadata:{conversation_id:conversation}});
    try{localStorage.setItem('HAPPYAD_MESSAGES_REFRESH_NEEDED','1');localStorage.setItem('HAPPYAD_MSG_LAST_STORY_REPLY_V629',JSON.stringify({conversation_id:conversation,story_id:storyId(row),target_user_id:target,at:Date.now()}))}catch(_e){}
    return true;
  }

  function installCss(){
    if($('happyad-story-master-v699-css'))return;
    try{var previous=$('happyad-story-master-v629-css');if(previous)previous.remove()}catch(_e){}
    var st=document.createElement('style');st.id='happyad-story-master-v699-css';st.textContent=`
#happyStoryViewerMasterV629.haStoryV629{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;margin:0!important;padding:0!important;display:none!important;background:#000!important;color:#fff!important;z-index:2147483647!important;overflow:hidden!important;font-family:system-ui,-apple-system,Segoe UI,sans-serif!important;align-items:stretch!important;justify-content:stretch!important}
#happyStoryViewerMasterV629.haStoryV629.on{display:block!important}
#happyStoryViewerMasterV629.haStoryV629.haStoryShareUnderlayV705{z-index:2147483600!important;pointer-events:none!important}
body.haStoryOpenV629> :not(#happyStoryViewerMasterV629):not(#happyadShareCenter):not(#haStoryMoreModalV629):not(#haStoryActivityModalV629):not(#haSharedPostOpenLoaderV915):not(#haStoryToastV629){pointer-events:none!important}
body.haStoryOpenV629>iframe:not(#happyadShareCenterFrame){pointer-events:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Card{position:absolute!important;inset:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;background:#000!important;overflow:hidden!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Backdrop{position:absolute!important;inset:-28px!important;z-index:0!important;background-position:center!important;background-size:cover!important;filter:blur(26px) brightness(.42)!important;transform:scale(1.10)!important;opacity:.72!important;pointer-events:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Media{position:absolute!important;inset:0!important;z-index:1!important;display:grid!important;place-items:center!important;width:100%!important;height:100%!important;background:transparent!important;overflow:hidden!important;touch-action:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Media img,#happyStoryViewerMasterV629.haStoryV629 .ha629Media video{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;object-position:center!important;background:transparent!important;transform-origin:center center!important;will-change:transform!important;-webkit-user-drag:none!important;user-select:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629ShadeTop{position:absolute!important;left:0!important;right:0!important;top:0!important;height:180px!important;z-index:3!important;background:linear-gradient(rgba(0,0,0,.78),rgba(0,0,0,.22),transparent)!important;pointer-events:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629ShadeBottom{position:absolute!important;left:0!important;right:0!important;bottom:0!important;height:230px!important;z-index:3!important;background:linear-gradient(transparent,rgba(0,0,0,.45),rgba(0,0,0,.88))!important;pointer-events:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Progress{position:absolute!important;top:calc(env(safe-area-inset-top) + 8px)!important;left:10px!important;right:10px!important;height:3px!important;z-index:10!important;display:flex!important;gap:4px!important;background:transparent!important;overflow:visible!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Seg{flex:1 1 0!important;height:3px!important;border-radius:99px!important;background:rgba(255,255,255,.32)!important;overflow:hidden!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Seg>i{display:block!important;width:100%!important;height:100%!important;border-radius:99px!important;background:#fff!important;animation:none!important;transform:scaleX(0);transform-origin:left center!important;will-change:transform;backface-visibility:hidden;contain:paint}
#happyStoryViewerMasterV629.haStoryV629 .ha629Top{position:absolute!important;left:10px!important;right:10px!important;top:calc(env(safe-area-inset-top) + 18px)!important;z-index:11!important;display:flex!important;align-items:center!important;gap:10px!important;padding:8px 0!important;background:transparent!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Back,#happyStoryViewerMasterV629.haStoryV629 .ha629More{width:38px!important;height:38px!important;min-width:38px!important;border:0!important;border-radius:999px!important;background:rgba(0,0,0,.28)!important;color:#fff!important;display:grid!important;place-items:center!important;font-size:26px!important;font-weight:700!important;padding:0!important;backdrop-filter:blur(8px)!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629More{margin-left:auto!important;font-size:27px!important;line-height:1!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Avatar{width:40px!important;height:40px!important;min-width:40px!important;border-radius:999px!important;overflow:hidden!important;background:#1c2029!important;border:2px solid rgba(255,255,255,.82)!important;display:grid!important;place-items:center!important;font-weight:950!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Avatar img{width:100%!important;height:100%!important;object-fit:cover!important;transform:none!important;background:#151922!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Identity{min-width:0!important;flex:1 1 auto!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Name{display:flex!important;align-items:center!important;gap:5px!important;min-width:0!important;font-size:16px!important;font-weight:900!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;text-shadow:0 1px 4px #000!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Sub{font-size:12px!important;color:#e0e3e9!important;margin-top:2px!important;white-space:nowrap!important;text-shadow:0 1px 4px #000!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Caption{position:absolute!important;left:18px!important;right:18px!important;bottom:calc(var(--ha-story-composer-h,62px) + 38px + env(safe-area-inset-bottom))!important;z-index:7!important;padding:0!important;background:transparent!important;color:#fff!important;font-size:16px!important;font-weight:750!important;line-height:1.35!important;text-shadow:0 1px 5px #000!important;max-height:25vh!important;overflow:auto!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629VisitorActions{position:absolute!important;left:8px!important;right:8px!important;bottom:calc(8px + env(safe-area-inset-bottom))!important;z-index:12!important;display:grid!important;grid-template-columns:minmax(0,1fr) 42px 42px!important;align-items:end!important;gap:6px!important;padding:5px!important;border:1px solid rgba(255,255,255,.13)!important;border-radius:27px!important;background:linear-gradient(180deg,rgba(9,13,22,.72),rgba(3,6,11,.9))!important;box-shadow:0 10px 28px rgba(0,0,0,.34)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;transition:padding .16s ease,border-radius .16s ease,background .16s ease!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629VisitorActions.is-composing{grid-template-columns:minmax(0,1fr)!important;gap:0!important;padding:0!important;border-color:rgba(255,255,255,.18)!important;border-radius:27px!important;background:rgba(19,22,29,.96)!important;box-shadow:0 18px 48px rgba(0,0,0,.52)!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629ReplyForm{position:relative!important;display:flex!important;align-items:flex-end!important;min-width:0!important;min-height:44px!important;height:44px!important;max-height:44px!important;border:1px solid rgba(255,255,255,.22)!important;border-radius:22px!important;background:rgba(255,255,255,.075)!important;overflow:hidden!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)!important;transition:min-height .16s ease,height .16s ease,max-height .16s ease,border-color .14s ease,background .14s ease,border-radius .16s ease!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629ReplyForm:focus-within{border-color:rgba(255,255,255,.5)!important;background:rgba(255,255,255,.105)!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629VisitorActions.is-composing .ha629ReplyForm{width:100%!important;min-height:116px!important;height:116px!important;max-height:116px!important;border-color:transparent!important;border-radius:26px!important;background:transparent!important;box-shadow:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629ReplyInput{flex:1!important;min-width:0!important;width:100%!important;min-height:44px!important;height:44px!important;max-height:44px!important;border:0!important;outline:0!important;background:transparent!important;color:#fff!important;padding:11px 43px 10px 13px!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif!important;font-size:14.5px!important;font-style:normal!important;font-variant:normal!important;font-weight:400!important;letter-spacing:normal!important;line-height:20px!important;text-transform:none!important;box-sizing:border-box!important;resize:none!important;overflow-y:hidden!important;overflow-x:hidden!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;word-break:break-word!important;overscroll-behavior:contain!important;scrollbar-width:none!important;-ms-overflow-style:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629VisitorActions.is-composing .ha629ReplyInput{min-height:116px!important;height:116px!important;max-height:116px!important;padding:13px 54px 13px 16px!important;overflow-y:auto!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629ReplyInput::placeholder{color:rgba(255,255,255,.68)!important;font-family:inherit!important;font-size:14.5px!important;font-style:normal!important;font-weight:400!important;letter-spacing:normal!important;white-space:nowrap!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629ReplyInput::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629ReplyForm.is-scrollable .ha629ReplyInput{overflow-y:auto!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629VisitorActions.is-composing>.ha629IconAct{display:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Send{position:absolute!important;right:4px!important;bottom:4px!important;display:grid!important;place-items:center!important;width:36px!important;height:36px!important;min-width:36px!important;margin:0!important;align-self:auto!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:50%!important;background:rgba(255,255,255,.10)!important;color:rgba(255,255,255,.65)!important;padding:0!important;transition:transform .14s ease,background .14s ease,color .14s ease!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629VisitorActions.is-composing .ha629Send{right:8px!important;bottom:8px!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Send svg{width:19px!important;height:19px!important;display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:2.15!important;stroke-linecap:round!important;stroke-linejoin:round!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Send.ready{background:#fff!important;color:#0a0e16!important;border-color:#fff!important;box-shadow:0 6px 18px rgba(255,255,255,.18)!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Send.ready:active{transform:scale(.93)!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Send.sending{opacity:.62!important;pointer-events:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629IconAct{width:42px!important;height:42px!important;min-width:42px!important;border:1px solid rgba(255,255,255,.16)!important;border-radius:50%!important;background:rgba(255,255,255,.075)!important;color:#fff!important;display:grid!important;place-items:center!important;padding:0!important;text-shadow:0 1px 5px #000!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.05)!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629IconAct:active{transform:scale(.93)!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629IconAct.on{color:#ff4f78!important;background:rgba(255,79,120,.12)!important;border-color:rgba(255,79,120,.35)!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerActions{position:absolute!important;left:0!important;right:0!important;bottom:calc(4px + env(safe-area-inset-bottom))!important;z-index:12!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:0!important;padding:7px 8px 3px!important;background:rgba(6,9,14,.84)!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct{border:0!important;background:transparent!important;color:#fff!important;min-width:0!important;padding:2px 1px 5px!important;font-weight:800!important;font-size:11.5px!important;display:flex!important;flex-direction:column!important;align-items:center!important;gap:4px!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct span:first-child{font-size:24px!important;line-height:1!important}#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct svg{width:25px!important;height:25px!important;display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:2.15!important;stroke-linecap:round!important;stroke-linejoin:round!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Loading{position:absolute!important;inset:0!important;z-index:2!important;display:grid!important;place-items:center!important;color:#d9dde5!important;font-weight:800!important;background:#000!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Views{display:none!important}
body.haStoryOpenV629,html.haStoryOpenV629{overflow:hidden!important;overscroll-behavior:none!important}
.radarRow .haStoryRadarUnitV629{position:relative!important;flex:0 0 92px!important;width:92px!important;display:flex!important;justify-content:center!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important}
.radarRow .haStoryRadarUnitV629>.radarItem{width:92px!important;min-width:92px!important;max-width:92px!important;background:transparent!important;background-color:transparent!important;background-image:none!important;border:0!important;border-color:transparent!important;border-radius:0!important;box-shadow:none!important;outline:0!important;padding:0!important;color:inherit!important;cursor:pointer!important;-webkit-appearance:none!important;appearance:none!important;-webkit-tap-highlight-color:transparent!important;touch-action:manipulation!important;filter:none!important;translate:0 0!important;scale:1!important}
.radarRow .haStoryRadarUnitV629>.radarItem:hover,.radarRow .haStoryRadarUnitV629>.radarItem:focus,.radarRow .haStoryRadarUnitV629>.radarItem:focus-visible,.radarRow .haStoryRadarUnitV629>.radarItem:active,.radarRow .haStoryRadarUnitV629>.radarItem.happyadButtonPressedV604{background:transparent!important;background-color:transparent!important;background-image:none!important;border:0!important;border-color:transparent!important;box-shadow:none!important;outline:0!important;filter:none!important;translate:0 0!important;scale:1!important}
.radarRow .haStoryRadarUnitV629>.radarItem:active .radarAvatar,.radarRow .haStoryRadarUnitV629>.radarItem.happyadButtonPressedV604 .radarAvatar{transform:scale(.965)!important;transition:transform .07s ease!important}
.radarRow .haStoryRadarUnitV629 .radarAvatar{width:74px!important;height:74px!important;min-width:74px!important;max-width:74px!important;border-width:3px!important;margin:0 auto!important;box-sizing:border-box!important}
.radarRow .haStoryRadarUnitV629 .radarAvatar img{width:100%!important;height:100%!important;object-fit:cover!important}
.radarRow .haStoryRadarUnitV629 .radarName{max-width:92px!important;margin-top:7px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:13px!important}
.radarRow .haStoryRadarUnitV629 .radarName.haStoryNameMasterV1000{display:flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;width:max-content!important;max-width:92px!important;min-width:0!important;margin-left:auto!important;margin-right:auto!important;overflow:hidden!important;text-overflow:clip!important}
.radarRow .haStoryRadarUnitV629 .radarName.haStoryNameMasterV1000>.haStoryNameTextV1000{display:block!important;flex:0 1 auto!important;min-width:0!important;max-width:100%!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important}
.radarRow .haStoryRadarUnitV629 .radarName.haStoryNameMasterV1000>.haStoryBadgeSlotV1000{display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;width:auto!important;min-width:max-content!important;overflow:visible!important}
.radarRow .haStoryRadarUnitV629 .radarName.haStoryNameMasterV1000>.haStoryBadgeSlotV1000:empty{display:none!important}
.radarRow .haStoryRadarUnitV629 .radarName.haStoryNameMasterV1000>.haStoryBadgeSlotV1000 .happyBadgeMark{flex:0 0 auto!important;margin:0!important}
.radarRow .haStoryRadarUnitV629 .radarMeta{max-width:92px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:11px!important}
.radarRow .haStoryAddMiniV629{position:absolute!important;right:7px!important;top:51px!important;width:25px!important;height:25px!important;border-radius:50%!important;border:2.5px solid #07080d!important;background:#ff8500!important;color:#fff!important;display:grid!important;place-items:center!important;font-size:0!important;line-height:0!important;text-decoration:none!important;z-index:8!important;box-sizing:border-box!important;overflow:hidden!important}
.radarRow .haStoryAddMiniV629:visited{background:#ff8500!important;color:#fff!important;text-decoration:none!important}.radarRow .haStoryAddMiniV629:active,.radarRow .haStoryAddMiniV629.happyadButtonPressedV604{background:#ff8500!important;color:#fff!important;filter:brightness(1.08)!important;translate:0 0!important;scale:.94!important;box-shadow:none!important}
.radarRow .haStoryAddGlyphV986{display:block!important;width:13px!important;height:13px!important;overflow:visible!important;fill:none!important;stroke:currentColor!important;stroke-width:2.65!important;stroke-linecap:round!important;stroke-linejoin:round!important;pointer-events:none!important}
.radarRow .haStoryAddOnlyV629 .radarAvatar{background:transparent!important;border:0!important;color:#fff!important;font-size:22px!important;padding:0!important;box-shadow:none!important;overflow:visible!important}
.radarRow .haStoryAddOnlyV629 .radarAvatar img,.radarRow .haStoryAddOnlyV629 .radarAvatar .radarInitial{width:100%!important;height:100%!important;border-radius:50%!important;object-fit:cover!important;background:#11151d!important}
.radarRow .haStoryAddOnlyV629 .radarAvatar.haStoryGuestBubbleV939{position:relative!important;overflow:visible!important;background:radial-gradient(circle at 32% 25%,#91f2ee 0%,#5ed9ea 22%,#5d9bea 48%,#6f70df 70%,#7456cf 88%,#5b45aa 100%)!important;border:0!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.38)!important,inset 0 -12px 24px rgba(48,35,130,.18)!important,0 7px 20px rgba(70,93,210,.20)!important;color:#fff!important}
.radarRow .haStoryAddOnlyV629 .radarAvatar.haStoryGuestBubbleV939:before{content:""!important;position:absolute!important;left:13px!important;right:13px!important;top:7px!important;height:25px!important;border-radius:50%!important;background:radial-gradient(ellipse at center,rgba(255,255,255,.40) 0%,rgba(255,255,255,.12) 48%,rgba(255,255,255,0) 76%)!important;filter:blur(.7px)!important;pointer-events:none!important}
.radarRow .haStoryAddOnlyV629 .haStoryGuestOrbFaceV939{position:absolute!important;inset:0!important;border-radius:50%!important;background:radial-gradient(circle at 70% 78%,rgba(116,72,220,.22) 0%,rgba(116,72,220,0) 48%)!important;pointer-events:none!important}
.radarRow .haStoryAddOnlyV629 .haStoryIdlePlusV936{position:absolute!important;right:-1px!important;bottom:-1px!important;width:24px!important;height:24px!important;border-radius:50%!important;border:2.5px solid #07080d!important;background:#ff8500!important;color:#fff!important;display:grid!important;place-items:center!important;font-size:0!important;line-height:0!important;box-sizing:border-box!important;z-index:3!important;overflow:hidden!important}
.radarRow .haStoryAddOnlyV629 .radarMeta{display:none!important}
#haStoryActivityModalV629{position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(0,0,0,.58)!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;color:#fff!important;font-family:system-ui!important}
#haStoryActivityModalV629 .haSamCard{width:min(100vw,520px)!important;max-height:72vh!important;overflow:auto!important;background:#0b0f16!important;border-radius:24px 24px 0 0!important;padding:14px 16px calc(18px + env(safe-area-inset-bottom))!important;box-shadow:0 -20px 70px rgba(0,0,0,.5)!important}
#haStoryMoreModalV629{position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(0,0,0,.58)!important;display:flex!important;align-items:flex-end!important;justify-content:center!important;color:#fff!important;font-family:system-ui!important}#haStoryMoreModalV629 .haSmmCard{width:min(100vw,520px)!important;background:#0b0f16!important;border-radius:24px 24px 0 0!important;padding:12px 14px calc(18px + env(safe-area-inset-bottom))!important;box-shadow:0 -20px 70px rgba(0,0,0,.5)!important}.haSmmBtn{width:100%!important;min-height:50px!important;border:0!important;border-bottom:1px solid rgba(255,255,255,.08)!important;background:transparent!important;color:#fff!important;text-align:left!important;padding:12px 8px!important;font-size:15px!important;font-weight:850!important}.haSmmBtn.danger{color:#ff6f78!important}.haSmmCancel{text-align:center!important;color:#cbd2de!important}
#haStoryActivityModalV629 .haSamHead{display:flex!important;align-items:center!important;justify-content:space-between!important;font-size:18px!important;font-weight:950!important;margin-bottom:10px!important}.haSamClose{width:38px!important;height:38px!important;border:0!important;border-radius:50%!important;background:rgba(255,255,255,.12)!important;color:#fff!important;font-size:23px!important}.haSamRow{display:flex!important;align-items:center!important;gap:10px!important;padding:10px 0!important;border-bottom:1px solid rgba(255,255,255,.08)!important}.haSamCopy{min-width:0!important;flex:1!important}.haSamNameLine{display:flex!important;align-items:center!important;gap:5px!important;min-width:0!important}.haSamActions{display:flex!important;flex-wrap:wrap!important;gap:5px!important;margin-top:5px!important}.haSamAction{display:inline-flex!important;align-items:center!important;gap:4px!important;border:1px solid rgba(255,255,255,.10)!important;border-radius:999px!important;padding:3px 7px!important;background:rgba(255,255,255,.06)!important;color:#cfd7e4!important;font-size:11px!important;font-weight:850!important}.haSamAction.like{color:#ff7897!important}.haSamAction.reply{color:#76caff!important}.haSamAv{width:46px!important;height:46px!important;border-radius:50%!important;overflow:hidden!important;background:#181d27!important;display:grid!important;place-items:center!important;font-weight:900!important}.haSamAv img{width:100%!important;height:100%!important;object-fit:cover!important}.haSamEmpty{padding:22px 0!important;color:#cbd2de!important;font-weight:750!important}
@media(max-width:390px){.radarRow .haStoryRadarUnitV629{flex-basis:86px!important;width:86px!important}.radarRow .haStoryRadarUnitV629>.radarItem{width:86px!important;min-width:86px!important;max-width:86px!important}.radarRow .haStoryRadarUnitV629 .radarAvatar{width:68px!important;height:68px!important;min-width:68px!important;max-width:68px!important}.radarRow .haStoryRadarUnitV629 .radarName,.radarRow .haStoryRadarUnitV629 .radarMeta{max-width:86px!important}.radarRow .haStoryAddMiniV629{right:6px!important;top:46px!important}}
`;
    st.textContent+=`
#happyStoryViewerMasterV629 .ha629VisitorActions .ha629IconAct{display:grid!important;place-items:center!important;padding:0!important}
#happyStoryViewerMasterV629 .ha629VisitorActions .ha629IconAct svg{width:25px!important;height:25px!important;display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:2.15!important;stroke-linecap:round!important;stroke-linejoin:round!important;pointer-events:none!important}
#happyStoryViewerMasterV629 .ha629VisitorActions .ha629IconAct.on{color:#ff4773!important}
#happyStoryViewerMasterV629 .ha629VisitorActions .ha629IconAct[data-happyad-story-share-v699]{color:#fff!important}
#happyStoryViewerMasterV629 .ha629VisitorActions .ha629IconAct[data-happyad-story-share-v699]:active{transform:scale(.94)!important}


/* V900 — barre Story compacte et lisible sur petits téléphones. */
#happyStoryViewerMasterV629.haStoryV629 .ha629VisitorActions.is-replies-disabled .ha629Send{display:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629VisitorActions.is-replies-disabled .ha629ReplyInput{padding-right:13px!important;white-space:nowrap!important;overflow:hidden!important;font-size:13.5px!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629VisitorActions.is-replies-disabled .ha629ReplyInput::placeholder{font-size:13.5px!important;white-space:nowrap!important}
@media(max-width:360px){
#happyStoryViewerMasterV629.haStoryV629 .ha629VisitorActions{left:7px!important;right:7px!important;grid-template-columns:minmax(0,1fr) 40px 40px!important;gap:5px!important;padding:4px!important;border-radius:25px!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629ReplyForm{min-height:42px!important;height:42px!important;max-height:42px!important;border-radius:21px!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629ReplyInput{min-height:42px!important;height:42px!important;max-height:42px!important;padding:10px 40px 9px 12px!important;font-size:13.5px!important;line-height:19px!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629ReplyInput::placeholder{font-size:13.5px!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Send{width:34px!important;height:34px!important;min-width:34px!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629IconAct{width:40px!important;height:40px!important;min-width:40px!important}
#happyStoryViewerMasterV629 .ha629VisitorActions .ha629IconAct svg{width:23px!important;height:23px!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct{font-size:11px!important;gap:3px!important;padding-bottom:4px!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct svg{width:23px!important;height:23px!important}
}

/* V901 — Ma Story : Vues / Partager plus discrets, zone tactile large conservée. */
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerActions{bottom:calc(2px + env(safe-area-inset-bottom))!important;padding:3px 8px 1px!important;min-height:40px!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct{min-height:40px!important;padding:0 1px 2px!important;font-size:10px!important;line-height:1.05!important;gap:2px!important;font-weight:780!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct span:first-child{font-size:20px!important;line-height:1!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct svg{width:20px!important;height:20px!important;stroke-width:2!important}
@media(max-width:360px){
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerActions{padding:2px 7px 1px!important;min-height:38px!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct{min-height:38px!important;font-size:9.5px!important;gap:1px!important;padding-bottom:1px!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct svg{width:19px!important;height:19px!important}
}

/* V891 — cartes Story avec méta à l’extérieur, ratio naturel et texte net. */
#happyStoryViewerMasterV629 .ha629Media.is-shared-post-v912{padding:84px 10px calc(var(--ha-story-composer-h,62px) + 36px)!important;align-items:center!important;justify-content:center!important;touch-action:none!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888{position:relative!important;width:min(94vw,520px)!important;max-width:520px!important;background:transparent!important;color:#fff!important;overflow:visible!important;text-align:left!important;padding:0!important;display:flex!important;flex-direction:column!important;gap:10px!important;cursor:default!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;pointer-events:none!important;border:0!important;border-radius:0!important;box-shadow:none!important}
#happyStoryViewerMasterV629 .ha629SharedPostHeadV912{min-height:0!important;display:flex!important;align-items:center!important;gap:11px!important;padding:0 4px!important;background:transparent!important;border:0!important;flex:0 0 auto!important;text-shadow:none!important}
#happyStoryViewerMasterV629 .ha629SharedPostAvatarV912{width:46px!important;height:46px!important;border-radius:50%!important;overflow:hidden!important;background:rgba(20,24,31,.20)!important;display:grid!important;place-items:center!important;font-size:15px!important;font-weight:950!important;color:#fff!important;flex:0 0 46px!important;border:1.5px solid rgba(255,255,255,.72)!important;box-shadow:none!important}
#happyStoryViewerMasterV629 .ha629SharedPostAvatarV912 img{width:100%!important;height:100%!important;object-fit:cover!important;transform:none!important}
#happyStoryViewerMasterV629 .ha629SharedPostWhoV912{min-width:0!important;flex:1!important;display:flex!important;flex-direction:column!important;justify-content:center!important;gap:0!important}
#happyStoryViewerMasterV629 .ha629SharedNameLineV889{display:flex!important;align-items:center!important;gap:6px!important;min-width:0!important;min-height:23px!important}
#happyStoryViewerMasterV629 .ha629SharedNameLineV889 b{display:block!important;min-width:0!important;max-width:100%!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:16px!important;line-height:1.2!important;font-weight:950!important;letter-spacing:.01em!important;text-shadow:none!important}
#happyStoryViewerMasterV629 .ha629SharedNameLineV889 .happyBadgeMark{width:16px!important;height:16px!important;flex:0 0 16px!important;margin-left:0!important;vertical-align:0!important}
#happyStoryViewerMasterV629 .ha629SharedContextV889{display:none!important}
#happyStoryViewerMasterV629 .ha629RepostGlyphV890{display:inline-grid!important;place-items:center!important;width:24px!important;height:24px!important;flex:0 0 24px!important;margin-left:4px!important;border-radius:50%!important;background:rgba(255,255,255,.12)!important;border:1px solid rgba(255,255,255,.24)!important;color:#fff!important;filter:none!important}
#happyStoryViewerMasterV629 .ha629RepostGlyphV890 svg{width:14px!important;height:14px!important;display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:1.9!important;stroke-linecap:round!important;stroke-linejoin:round!important}
/* V895 — second et dernier repost : B principal, A origine en petit sous une ligne verticale. */
#happyStoryViewerMasterV629 .ha629RepostChainV895{display:flex!important;align-items:center!important;gap:6px!important;min-width:0!important;margin-top:3px!important;color:rgba(255,255,255,.78)!important;font-size:11.5px!important;line-height:1.15!important;font-weight:850!important;text-shadow:none!important}
#happyStoryViewerMasterV629 .ha629RepostChainLineV895{display:block!important;width:1.5px!important;height:13px!important;flex:0 0 1.5px!important;border-radius:999px!important;background:rgba(255,255,255,.52)!important}
#happyStoryViewerMasterV629 .ha629RepostChainNameV895{display:flex!important;align-items:center!important;gap:4px!important;min-width:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
#happyStoryViewerMasterV629 .ha629RepostChainNameV895 .happyBadgeMark{width:12px!important;height:12px!important;flex:0 0 12px!important}
#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-repost-depth2-v895 .ha629SharedNameLineV889 b{font-size:17px!important}
#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-repost-depth2-v895 .ha629SharedPostWhoV912{justify-content:center!important}
#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891.is-repost-depth2-v895 .ha629SharedPostHeadV912{min-height:68px!important;padding-bottom:9px!important;align-items:flex-start!important}
#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891.is-repost-depth2-v895 .ha629SharedNameLineV889 b{font-size:15px!important}
#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891.is-repost-depth2-v895 .ha629RepostChainV895{font-size:10.8px!important;margin-top:2px!important}
#happyStoryViewerMasterV629 .ha629SharedCardShellV891{position:relative!important;width:100%!important;border-radius:28px!important;overflow:hidden!important;border:1px solid rgba(255,255,255,.18)!important;background:transparent!important;box-shadow:0 12px 28px rgba(0,0,0,.18)!important}
#happyStoryViewerMasterV629 .ha629SharedPostMediaV912{position:relative!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;background:transparent!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;flex:0 0 auto!important;border:0!important;border-radius:28px!important}
#happyStoryViewerMasterV629 .ha629SharedPostMediaV912:before{display:none!important}
#happyStoryViewerMasterV629 .ha629SharedPostMediaV912 img,#happyStoryViewerMasterV629 .ha629SharedPostMediaV912 video{position:relative!important;z-index:1!important;display:block!important;width:100%!important;height:auto!important;max-width:100%!important;max-height:min(63dvh,700px)!important;object-fit:contain!important;background:transparent!important;transform:none!important;border-radius:28px!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedPostMediaV912 img,#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedPostMediaV912 video,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedPostMediaV912 img,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedPostMediaV912 video{width:auto!important;max-width:100%!important;max-height:min(67dvh,740px)!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-landscape-v891 .ha629SharedPostMediaV912 img,#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-landscape-v891 .ha629SharedPostMediaV912 video,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-landscape-v891 .ha629SharedPostMediaV912 img,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-landscape-v891 .ha629SharedPostMediaV912 video{width:100%!important;max-height:min(56dvh,560px)!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-square-v891 .ha629SharedPostMediaV912 img,#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-square-v891 .ha629SharedPostMediaV912 video,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-square-v891 .ha629SharedPostMediaV912 img,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-square-v891 .ha629SharedPostMediaV912 video{width:100%!important;max-height:min(61dvh,640px)!important}
#happyStoryViewerMasterV629 .ha629SharedPostGroupBadgeV913{position:absolute!important;right:12px!important;top:12px!important;z-index:5!important;display:inline-flex!important;align-items:center!important;gap:6px!important;min-height:31px!important;padding:5px 9px!important;border-radius:999px!important;background:rgba(18,22,29,.46)!important;border:1px solid rgba(255,255,255,.24)!important;color:#fff!important;box-shadow:none!important;-webkit-backdrop-filter:blur(10px)!important;backdrop-filter:blur(10px)!important;font-size:11px!important;font-weight:950!important;line-height:1!important;pointer-events:none!important}
#happyStoryViewerMasterV629 .ha629SharedPostGroupBadgeV913 svg{width:17px!important;height:17px!important;fill:none!important;stroke:currentColor!important;stroke-width:1.9!important;stroke-linejoin:round!important;stroke-linecap:round!important}
#happyStoryViewerMasterV629 .ha629SharedPostGroupBadgeV913 b{font:950 11px/1 system-ui!important;color:#fff!important}
#happyStoryViewerMasterV629 .ha629SharedPostBodyV912{padding:0 8px!important;background:transparent!important;flex:0 0 auto!important;text-shadow:none!important}
#happyStoryViewerMasterV629 .ha629SharedPostBodyV912 strong{display:block!important;font-size:16px!important;line-height:1.25!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#fff!important;text-shadow:none!important}
#happyStoryViewerMasterV629 .ha629SharedPostBodyV912 p{margin:4px 0 0!important;color:rgba(255,255,255,.92)!important;font-size:13px!important;line-height:1.38!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;text-shadow:none!important}
#happyStoryViewerMasterV629 .ha629SharedPostOpenV912{margin-top:8px!important;min-height:32px!important;display:flex!important;width:100%!important;justify-content:space-between!important;pointer-events:auto!important;position:relative!important;z-index:12!important;align-items:center!important;gap:8px!important;border:0!important;border-radius:0!important;background:transparent!important;padding:4px 0 2px!important;color:#ffc06f!important;font:950 13px/1.2 system-ui!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;box-shadow:none!important;text-shadow:none!important}
#happyStoryViewerMasterV629 .ha629SharedPostOpenV912:active{transform:none!important;background:transparent!important;opacity:.78!important}
#happyStoryViewerMasterV629 .ha629SharedPostOpenV912 svg{width:16px!important;height:16px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;pointer-events:none!important;flex:0 0 16px!important;filter:none!important}
#happyStoryViewerMasterV629 .ha629SharedStoryOriginV888{display:none!important}
@media(max-height:760px){#happyStoryViewerMasterV629 .ha629Media.is-shared-post-v912{padding-top:78px!important;padding-bottom:calc(var(--ha-story-composer-h,62px) + 28px)!important}#happyStoryViewerMasterV629 .ha629SharedPostCardV912,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888{gap:8px!important}#happyStoryViewerMasterV629 .ha629SharedPostHeadV912{padding:0 2px!important}#happyStoryViewerMasterV629 .ha629SharedPostAvatarV912{width:42px!important;height:42px!important;flex-basis:42px!important}#happyStoryViewerMasterV629 .ha629SharedPostMediaV912 img,#happyStoryViewerMasterV629 .ha629SharedPostMediaV912 video{max-height:min(58dvh,580px)!important}}

/* V892 — portrait uniquement : identité compacte dans la carte + zone sûre au-dessus des actions. */
#happyStoryViewerMasterV629 .ha629Media.is-shared-post-v912.haSharedPortraitV892{padding-top:74px!important;padding-bottom:calc(var(--ha-story-composer-h,62px) + 22px)!important;align-items:center!important;justify-content:flex-start!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891{position:relative!important;width:min(93vw,512px)!important;max-width:512px!important;gap:0!important;border:1px solid rgba(255,255,255,.18)!important;border-radius:27px!important;overflow:hidden!important;background:transparent!important;box-shadow:0 10px 26px rgba(0,0,0,.14)!important;max-height:calc(100dvh - var(--ha-story-composer-h,62px) - 120px)!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedPostHeadV912,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedPostHeadV912{position:absolute!important;left:0!important;right:0!important;top:0!important;z-index:9!important;padding:10px 11px 8px!important;gap:8px!important;min-height:48px!important;flex:0 0 auto!important;background:linear-gradient(180deg,rgba(7,10,14,.44),rgba(7,10,14,.10) 78%,transparent)!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedPostAvatarV912,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedPostAvatarV912{width:34px!important;height:34px!important;flex:0 0 34px!important;border-width:1.25px!important;font-size:12px!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedNameLineV889,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedNameLineV889{gap:5px!important;min-height:18px!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedNameLineV889 b,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedNameLineV889 b{font-size:14px!important;line-height:1.15!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedNameLineV889 .happyBadgeMark,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedNameLineV889 .happyBadgeMark{width:14px!important;height:14px!important;flex-basis:14px!important}
#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629RepostGlyphV890{width:20px!important;height:20px!important;flex-basis:20px!important;margin-left:2px!important;background:transparent!important;border:0!important}
#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629RepostGlyphV890 svg{width:15px!important;height:15px!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedCardShellV891,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedCardShellV891{border:0!important;border-radius:inherit!important;box-shadow:none!important;overflow:hidden!important;flex:1 1 auto!important;min-height:0!important;height:100%!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedPostMediaV912,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedPostMediaV912{height:100%!important;max-height:none!important;border-radius:inherit!important;overflow:hidden!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedPostMediaV912 img,#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedPostMediaV912 video,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedPostMediaV912 img,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedPostMediaV912 video{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;border-radius:inherit!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedPostBodyV912,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedPostBodyV912{position:absolute!important;left:0!important;right:0!important;bottom:0!important;z-index:9!important;padding:10px 12px 12px!important;flex:0 0 auto!important;background:linear-gradient(0deg,rgba(7,10,14,.78),rgba(7,10,14,.18) 72%,transparent)!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedPostBodyV912 strong{font-size:14px!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedPostBodyV912 p,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedPostBodyV912 p{font-size:12px!important;-webkit-line-clamp:2!important}
#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891 .ha629SharedPostOpenV912,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891 .ha629SharedPostOpenV912{margin-top:6px!important;min-height:28px!important;font-size:12px!important;padding:2px 0 1px!important}
@media(max-height:760px){#happyStoryViewerMasterV629 .ha629Media.is-shared-post-v912.haSharedPortraitV892{padding-top:70px!important;padding-bottom:calc(var(--ha-story-composer-h,62px) + 20px)!important}#happyStoryViewerMasterV629 .ha629SharedPostCardV912.is-portrait-v891,#happyStoryViewerMasterV629 .ha629SharedStoryCardV888.is-portrait-v891{max-height:calc(100dvh - var(--ha-story-composer-h,62px) - 112px)!important}}
/* V896 — vidéo partagée : ne jamais peindre une carte avec un ratio inconnu.
   Tant que loadedmetadata n’a pas fourni videoWidth/videoHeight, seule la Story
   de fond reste visible avec un petit loader central. */
#happyStoryViewerMasterV629 .ha629Media.is-shared-post-v912.haSharedRatioPendingV896 .ha629SharedPostCardV912,
#happyStoryViewerMasterV629 .ha629Media.is-shared-post-v912.haSharedRatioPendingV896 .ha629SharedStoryCardV888{opacity:0!important;visibility:hidden!important}
#happyStoryViewerMasterV629 .ha629Media.is-shared-post-v912.haSharedRatioPendingV896:after{content:""!important;position:absolute!important;left:50%!important;top:50%!important;width:34px!important;height:34px!important;margin:-17px 0 0 -17px!important;border:3px solid rgba(255,255,255,.24)!important;border-top-color:#fff!important;border-radius:50%!important;box-sizing:border-box!important;z-index:15!important;pointer-events:none!important;animation:haSharedSpinV915 .72s linear infinite!important}
/* V915 : cercle pendant le chargement du média de la publication Story. */
#happyStoryViewerMasterV629 .ha629SharedPostMediaLoaderV915{position:absolute!important;inset:0!important;z-index:4!important;display:grid!important;place-items:center!important;background:rgba(5,7,10,.42)!important;pointer-events:none!important;opacity:1!important;transition:opacity .15s ease!important}
#happyStoryViewerMasterV629 .ha629SharedPostMediaLoaderV915.done{opacity:0!important;visibility:hidden!important}
#happyStoryViewerMasterV629 .ha629SharedPostMediaLoaderV915 i,#haSharedPostOpenLoaderV915 .haSharedPostOpenSpinnerV915{width:34px!important;height:34px!important;border:3px solid rgba(255,255,255,.24)!important;border-top-color:#fff!important;border-radius:50%!important;display:block!important;animation:haSharedSpinV915 .72s linear infinite!important;box-sizing:border-box!important}
#happyStoryViewerMasterV629 .ha629SharedStoryOriginV888{display:inline-flex!important;align-items:center!important;gap:6px!important;color:#aeb6c3!important;font-size:11px!important;font-weight:800!important}
@keyframes haSharedSpinV915{to{transform:rotate(360deg)}}
#haSharedPostOpenLoaderV915{position:fixed!important;inset:0!important;z-index:2147483647!important;display:none!important;place-items:center!important;background:rgba(4,6,10,.74)!important;pointer-events:auto!important}
#haSharedPostOpenLoaderV915.on{display:grid!important}
#haSharedPostOpenLoaderV915 .haSharedPostOpenSpinnerV915{width:42px!important;height:42px!important;border-width:4px!important}

.radarRow .haStoryRadarLoadingV792{pointer-events:none!important;opacity:.72!important}
.radarRow .haStoryRadarLoadingV792 .radarAvatar{border-color:rgba(255,255,255,.12)!important;background:#12151b!important;box-shadow:none!important;overflow:hidden!important}
.radarRow .haStoryRadarLoadingV792 .radarName,.radarRow .haStoryRadarLoadingV792 .radarMeta{height:9px!important;margin-left:auto!important;margin-right:auto!important;border-radius:999px!important;background:rgba(255,255,255,.08)!important;color:transparent!important}
.radarRow .haStoryRadarLoadingV792 .radarName{width:58px!important}.radarRow .haStoryRadarLoadingV792 .radarMeta{width:34px!important;margin-top:5px!important}
.radarRow .haStoryRadarPulseV792{display:block!important;width:100%!important;height:100%!important;border-radius:50%!important;background:linear-gradient(100deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.15) 45%,rgba(255,255,255,.04) 65%)!important;background-size:220% 100%!important;animation:haStoryRadarPulseV792 1.15s linear infinite!important}
@keyframes haStoryRadarPulseV792{to{background-position:-220% 0}}
`;
    document.head.appendChild(st);
  }

  function ensureViewer(){
    installCss();
    var box=$('happyStoryViewerMasterV629');
    if(box&&!box.classList.contains('haStoryV629')){try{box.remove()}catch(_e){}box=null}
    if(!box){
      box=document.createElement('div');box.id='happyStoryViewerMasterV629';box.className='haStoryV629';box.setAttribute('data-happyad-story-master','v629');box.setAttribute('data-happyad-story-surface','1');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('tabindex','-1');
      box.innerHTML='<div class="ha629Card"><div class="ha629Backdrop" id="ha629Backdrop"></div><div class="ha629Media" id="ha629Media"></div><div class="ha629ShadeTop"></div><div class="ha629ShadeBottom"></div><div class="ha629Progress" id="ha629Progress"></div><div class="ha629Top"><button class="ha629Back" id="ha629Back" type="button" aria-label="Fermer la story" data-happyad-story-control="close">‹</button><div class="ha629Avatar" id="ha629Avatar"></div><div class="ha629Identity"><div class="ha629Name" id="ha629Name">Story</div><div class="ha629Sub" id="ha629Sub">Fyblic</div></div><button class="ha629More" id="ha629More" type="button" aria-label="Plus" data-happyad-story-control="more">⋮</button></div><div class="ha629Caption" id="ha629Caption"></div><div id="ha629Bottom"></div></div>';
      document.body.appendChild(box);
    }
    /* V633 : le lecteur reste monté après fermeture et ses commandes sont
       rebâties localement si un ancien nettoyeur les a retirées. */
    var card=box.querySelector('.ha629Card');
    if(card&&!box.querySelector('#ha629Back')){
      var top=card.querySelector('.ha629Top');
      if(top){var closeBtn=document.createElement('button');closeBtn.className='ha629Back';closeBtn.id='ha629Back';closeBtn.type='button';closeBtn.setAttribute('aria-label','Fermer la story');closeBtn.setAttribute('data-happyad-story-control','close');closeBtn.textContent='‹';top.insertBefore(closeBtn,top.firstChild)}
    }
    if(card&&!box.querySelector('#ha629More')){
      var top2=card.querySelector('.ha629Top');
      if(top2){var moreBtn=document.createElement('button');moreBtn.className='ha629More';moreBtn.id='ha629More';moreBtn.type='button';moreBtn.setAttribute('aria-label','Plus');moreBtn.setAttribute('data-happyad-story-control','more');moreBtn.textContent='⋮';top2.appendChild(moreBtn)}
    }
    state.box=box;
    var closeControl=box.querySelector('#ha629Back');
    var moreControl=box.querySelector('#ha629More');
    if(closeControl)closeControl.onclick=function(e){e.preventDefault();e.stopPropagation();close('button')};
    if(moreControl)moreControl.onclick=function(e){e.preventDefault();e.stopPropagation();openMore()};
    bindMediaGestures();
    return box;
  }

  /* V922 — la Story devient une surface modale réellement exclusive.
     Les éléments de l'application placés derrière le lecteur sont rendus inert
     pendant toute la session. Les seules surfaces autorisées au-dessus sont
     celles qui appartiennent à la Story (menus/activité/loader/toast) et le
     centre de partage lorsqu'il est explicitement ouvert depuis la Story. */
  function isStorySurfaceNodeV922(node){
    if(!node||node.nodeType!==1)return false;
    var id=clean(node.id);
    return id==='happyStoryViewerMasterV629'||id==='happyadShareCenter'||id==='haStoryMoreModalV629'||id==='haStoryActivityModalV629'||id==='haSharedPostOpenLoaderV915'||id==='haStoryToastV629'||id==='haStoryExitShieldV923'||node.getAttribute('data-happyad-story-surface')==='1';
  }
  function freezeBackgroundNodeV922(node,lockState){
    if(!node||node.nodeType!==1||isStorySurfaceNodeV922(node)||!lockState||lockState.records.has(node))return;
    var rec={hadInert:node.hasAttribute('inert'),inertValue:false,pointerValue:'',pointerPriority:''};
    try{rec.inertValue=!!node.inert}catch(_e){}
    try{rec.pointerValue=node.style.getPropertyValue('pointer-events');rec.pointerPriority=node.style.getPropertyPriority('pointer-events')}catch(_e){}
    lockState.records.set(node,rec);
    try{node.inert=true}catch(_e){try{node.setAttribute('inert','')}catch(_e2){}}
    try{node.style.setProperty('pointer-events','none','important')}catch(_e){}
  }
  function freezeStoryBackgroundV922(){
    if(state.backgroundLockV922)return;
    var lockState={records:new Map(),observer:null};state.backgroundLockV922=lockState;
    try{Array.prototype.slice.call(document.body.children).forEach(function(node){freezeBackgroundNodeV922(node,lockState)})}catch(_e){}
    try{
      lockState.observer=new MutationObserver(function(mutations){
        mutations.forEach(function(m){Array.prototype.slice.call(m.addedNodes||[]).forEach(function(node){if(node&&node.parentNode===document.body)freezeBackgroundNodeV922(node,lockState)})});
      });
      lockState.observer.observe(document.body,{childList:true});
    }catch(_e){}
    try{var ae=document.activeElement;if(ae&&ae!==document.body&&state.box&&!state.box.contains(ae)&&!isStorySurfaceNodeV922(ae.closest&&ae.closest('body>*')))ae.blur()}catch(_e){}
  }
  function restoreStoryBackgroundV922(){
    var lockState=state.backgroundLockV922;if(!lockState)return;state.backgroundLockV922=null;
    try{if(lockState.observer)lockState.observer.disconnect()}catch(_e){}
    try{lockState.records.forEach(function(rec,node){
      if(!node||node.nodeType!==1)return;
      try{node.inert=!!rec.inertValue;if(!rec.hadInert&&!rec.inertValue)node.removeAttribute('inert')}catch(_e){}
      try{if(rec.pointerValue)node.style.setProperty('pointer-events',rec.pointerValue,rec.pointerPriority||'');else node.style.removeProperty('pointer-events')}catch(_e){}
    })}catch(_e){}
  }
  function lock(){document.body.classList.add('haStoryOpenV629','happyad-story-fullscreen-lock');document.documentElement.classList.add('haStoryOpenV629');try{document.body.style.overflow='hidden';document.documentElement.style.overflow='hidden'}catch(_e){}freezeStoryBackgroundV922();try{if(state.box)state.box.focus({preventScroll:true})}catch(_e){}}
  function unlock(){restoreStoryBackgroundV922();document.body.classList.remove('haStoryOpenV629','happyad-story-fullscreen-lock','story-open','modal-open','no-scroll');document.documentElement.classList.remove('haStoryOpenV629','happyad-story-fullscreen-lock','story-open','modal-open','no-scroll');try{document.body.style.removeProperty('overflow');document.documentElement.style.removeProperty('overflow');document.body.style.removeProperty('pointer-events');document.body.style.removeProperty('touch-action')}catch(_e){}}

  function storySurfaceTargetAllowedV922(target){
    if(!target||!target.closest)return false;
    return !!target.closest('#happyStoryViewerMasterV629,#happyadShareCenter,#haStoryMoreModalV629,#haStoryActivityModalV629,#haSharedPostOpenLoaderV915,#haStoryToastV629,#haStoryExitShieldV923,[data-happyad-story-surface="1"]');
  }
  function guardStorySurfaceEventV922(e){
    if(state.closed||!document.body.classList.contains('haStoryOpenV629'))return;
    if(storySurfaceTargetAllowedV922(e&&e.target))return;
    try{if(e&&e.cancelable)e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation()}catch(_e){}
    return false;
  }
  ['pointerdown','pointerup','click','contextmenu'].forEach(function(type){document.addEventListener(type,guardStorySurfaceEventV922,true)});
  ['touchstart','touchmove','touchend'].forEach(function(type){document.addEventListener(type,guardStorySurfaceEventV922,{capture:true,passive:false})});

  /* V923 — verrou de fin de geste.
     Sur certains WebView Android, le pointerup qui ferme la dernière Story peut
     être suivi d'un click synthétique après que le viewer a déjà été caché.
     Le hit-test de ce click retombe alors sur l'Accueil / le Profil et peut ouvrir
     une page située exactement sous le doigt. On garde donc un bouclier transparent
     et un garde capture pendant la très courte queue du geste de fermeture. */
  var storyExitGuardUntilV923=0,storyExitGuardTimerV923=0;
  function removeStoryExitShieldV923(){
    clearTimeout(storyExitGuardTimerV923);storyExitGuardTimerV923=0;storyExitGuardUntilV923=0;
    try{var old=document.getElementById('haStoryExitShieldV923');if(old)old.remove()}catch(_e){}
  }
  function armStoryExitGuardV923(){
    storyExitGuardUntilV923=Date.now()+460;
    try{
      var shield=document.getElementById('haStoryExitShieldV923');
      if(!shield){shield=document.createElement('div');shield.id='haStoryExitShieldV923';shield.setAttribute('data-happyad-story-surface','1');shield.setAttribute('aria-hidden','true');document.body.appendChild(shield)}
      shield.style.cssText='position:fixed!important;inset:0!important;z-index:2147483647!important;background:transparent!important;pointer-events:auto!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important;';
      ['pointerdown','pointerup','click','touchstart','touchmove','touchend'].forEach(function(type){if(shield['__haV923_'+type])return;shield['__haV923_'+type]=1;shield.addEventListener(type,function(e){try{if(e.cancelable)e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation()}catch(_e){}},{capture:true,passive:false})});
    }catch(_e){}
    clearTimeout(storyExitGuardTimerV923);storyExitGuardTimerV923=setTimeout(removeStoryExitShieldV923,480);
  }
  function guardStoryExitTailV923(e){
    if(Date.now()>storyExitGuardUntilV923)return;
    try{if(e&&e.cancelable)e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation()}catch(_e){}
    return false;
  }
  ['pointerdown','pointerup','click','contextmenu'].forEach(function(type){document.addEventListener(type,guardStoryExitTailV923,true)});
  ['touchstart','touchmove','touchend'].forEach(function(type){document.addEventListener(type,guardStoryExitTailV923,{capture:true,passive:false})});
  document.addEventListener('focusin',function(e){
    if(state.closed||storySurfaceTargetAllowedV922(e&&e.target))return;
    try{if(e.target&&typeof e.target.blur==='function')e.target.blur();if(state.box)state.box.focus({preventScroll:true})}catch(_e){}
  },true);
  function cancelProgressAnimV787(){
    if(!state.progressAnim)return;
    try{state.progressAnim.onfinish=null;state.progressAnim.cancel()}catch(_e){}
    state.progressAnim=null;state.progressBaseElapsed=0;
  }
  function stopTimer(){if(state.timer){clearTimeout(state.timer);state.timer=0}if(state.raf){cancelAnimationFrame(state.raf);state.raf=0}cancelProgressAnimV787()}
  function stopMedia(){try{if(!state.box)return;state.box.querySelectorAll('video,audio').forEach(function(m){try{m.pause()}catch(_e){}try{m.removeAttribute('src');m.load()}catch(_e){}})}catch(_e){}}
  function activateViewerSurface(box){
    if(!box)return;
    box.classList.add('on');
    box.removeAttribute('aria-hidden');
    try{box.inert=false}catch(_e){}
    box.style.setProperty('display','block','important');
    box.style.setProperty('pointer-events','auto','important');
    box.style.setProperty('visibility','visible','important');
    box.style.setProperty('opacity','1','important');
  }
  function armStoryReturnV927(){
    clearTimeout(storyReturnRetryV927);storyReturnRetryV927=0;
    try{
      var controller=window.HappyInternalReturnV694||window.HappyInternalReturnV591;
      if(controller&&typeof controller.open==='function'){
        controller.open('story-viewer-v927',{onBack:function(){close('story-return-v927');return true;}});
        storyReturnArmedV927=true;
        return true;
      }
    }catch(_e){}
    /* Story est chargée très tôt dans index.html. Si l'utilisateur touche le
       Radar avant la fin du parsing, attendre brièvement le maître canonique au
       lieu de laisser cette ouverture sans protection Android. */
    if(!state.closed)storyReturnRetryV927=setTimeout(armStoryReturnV927,30);
    return false;
  }
  function releaseStoryReturnV927(){
    clearTimeout(storyReturnRetryV927);storyReturnRetryV927=0;
    try{var controller=window.HappyInternalReturnV694||window.HappyInternalReturnV591;if(storyReturnArmedV927&&controller&&typeof controller.close==='function')controller.close('story-viewer-v927');}catch(_e){}
    storyReturnArmedV927=false;
  }
  function close(reason){
    try{var closingRow=currentRow();if(closingRow&&reason!=='complete'&&reason!=='deleted'&&reason!=='empty'&&reason!=='error')analyticsTrackV728('story_exit',closingRow,{dedupeKey:'v728:story-exit:'+sessionStorage.getItem('HAPPYAD_ANALYTICS_SESSION_V728')+':'+storyId(closingRow)+':'+Math.floor(Date.now()/3000),metadata:{reason:clean(reason)||'close'}})}catch(_ae){}
    state.closed=true;state.openToken++;stopTimer();stopAgeTickerV783();stopMedia();clearStoryPreloadsV793();clearTimeout(state.holdTimer);state.holdTimer=0;clearTimeout(state.composerDismissTimer);state.composerDismissTimer=0;state.composerDismissGuard=false;state.composerDismissGuardUntil=0;state.composerDismissPointerId=null;state.composerViewportBase=0;state.shareOverlayOpen=false;state.shareResumePending=false;state.pointers.clear();resetZoom(false);
    if(state.box){
      state.box.classList.remove('on','full','haStoryShareUnderlayV705');
      state.box.setAttribute('aria-hidden','true');
      try{state.box.inert=true}catch(_e){}
      state.box.style.setProperty('display','none','important');
      state.box.style.setProperty('pointer-events','none','important');
      state.box.style.setProperty('visibility','hidden','important');
      state.box.style.setProperty('opacity','0','important');
    }
    state.paused=false;state.hold=false;state.pinch=false;state.moved=false;state.lastTapAt=0;state.pointerDownAt=0;state.lastPointerType='';
    releaseStoryReturnV927();
    unlock();
    /* V705 : la fermeture définitive de la Story restaure explicitement le dock principal.
       Le dock reste masqué tant que la Story ou son popup de partage est encore ouvert. */
    try{var dockApi=window.HappyDockAutoHideV653||window.HappyDockAutoHideV618||window.HappyDockAutoHideV608;if(dockApi&&typeof dockApi.show==='function')dockApi.show('story-final-close-v705')}catch(_e){}
    /* V633 : le lecteur reste monté et caché. Seul le Radar est actualisé;
       la prochaine ouverture réactive exactement le même chemin. */
    requestAnimationFrame(function(){
      installCss();
      restorePublicRoutes();
      renderRadarHomeV629();
    });
    try{document.dispatchEvent(new CustomEvent('happyad:story-master-closed-v629'))}catch(_e){}
  }

  /* V787 : les photos utilisent une animation Web Animations/Compositor linéaire.
     Le navigateur anime directement transform:scaleX sur le GPU : la progression
     reste continue sur 60/90/120 Hz et ne dépend plus d'une boucle JavaScript.
     Les vidéos restent calées sur currentTime réel du média. */
  function progressNowV786(){try{return performance.now()}catch(_e){return Date.now()}}
  function buildSegments(){var p=$('ha629Progress');if(!p)return;var html='';state.rows.forEach(function(){html+='<span class="ha629Seg"><i></i></span>'});p.innerHTML=html}
  function setFillV786(f,ratio){if(!f)return;ratio=Math.max(0,Math.min(1,Number(ratio)||0));f.style.transform='scaleX('+ratio.toFixed(6)+')'}
  function resetSegments(n){cancelProgressAnimV787();state.activeFill=null;var segs=state.box.querySelectorAll('.ha629Seg');segs.forEach(function(seg,i){var f=seg.querySelector('i');if(i<n)setFillV786(f,1);else if(i===n){setFillV786(f,0);state.activeFill=f}else setFillV786(f,0)})}
  function setProgress(p){if(state.activeFill)setFillV786(state.activeFill,Math.max(0,Math.min(100,p))/100)}
  function startPhotoProgressV787(){
    cancelProgressAnimV787();
    var fill=state.activeFill,ratio=Math.max(0,Math.min(1,state.elapsed/state.duration)),remaining=Math.max(0,state.duration-state.elapsed);
    setProgress(ratio*100);
    if(remaining<=0){setProgress(100);next();return}
    if(fill&&typeof fill.animate==='function'){
      state.progressBaseElapsed=state.elapsed;
      var anim=fill.animate([{transform:'scaleX('+ratio.toFixed(6)+')'},{transform:'scaleX(1)'}],{duration:remaining,easing:'linear',fill:'forwards'});
      state.progressAnim=anim;
      anim.onfinish=function(){
        if(state.progressAnim!==anim||state.closed||state.paused)return;
        state.elapsed=state.duration;setProgress(100);
        try{anim.onfinish=null;anim.cancel()}catch(_e){}
        state.progressAnim=null;state.progressBaseElapsed=0;next();
      };
      return;
    }
    runTimer();
  }
  function animate(){
    if(state.closed||state.paused||!state.box.classList.contains('on'))return;
    var v=state.box.querySelector('#ha629Media video'),pct=0;
    if(v&&isFinite(v.duration)&&v.duration>0){state.duration=Math.max(1000,v.duration*1000);state.elapsed=Math.max(0,(v.currentTime||0)*1000);pct=state.elapsed/state.duration*100}
    else{var n=state.elapsed+(progressNowV786()-state.startedAt);pct=n/state.duration*100;if(n>=state.duration){setProgress(100);next();return}}
    setProgress(pct);state.raf=requestAnimationFrame(animate);
  }
  function runTimer(){if(state.timer){clearTimeout(state.timer);state.timer=0}if(state.raf){cancelAnimationFrame(state.raf);state.raf=0}state.startedAt=progressNowV786();var v=state.box.querySelector('#ha629Media video');if(!v)state.timer=setTimeout(function(){state.elapsed+=progressNowV786()-state.startedAt;if(state.elapsed>=state.duration)next();else runTimer()},160);animate()}
  function pause(){
    if(state.paused||state.closed)return;state.paused=true;
    var v=state.box.querySelector('#ha629Media video');
    if(state.progressAnim){
      try{state.progressAnim.pause();state.elapsed=Math.min(state.duration,state.progressBaseElapsed+Math.max(0,Number(state.progressAnim.currentTime)||0))}catch(_e){}
      setProgress(state.elapsed/state.duration*100);return;
    }
    if(v&&isFinite(v.duration)&&v.duration>0){state.duration=Math.max(1000,v.duration*1000);state.elapsed=(v.currentTime||0)*1000;try{v.pause()}catch(_e){}}else state.elapsed+=progressNowV786()-state.startedAt;
    if(state.timer){clearTimeout(state.timer);state.timer=0}if(state.raf){cancelAnimationFrame(state.raf);state.raf=0}
    setProgress(state.elapsed/state.duration*100)
  }
  function resume(){
    if(!state.paused||state.closed||state.zoom.scale>1.01)return;state.paused=false;
    if(state.progressAnim){try{state.progressAnim.play()}catch(_e){}return}
    var v=state.box.querySelector('#ha629Media video');if(v)try{v.play().catch(function(){})}catch(_e){}
    if(v)runTimer();else startPhotoProgressV787()
  }
  function startDuration(row){
    stopTimer();state.paused=false;state.elapsed=0;state.duration=10000;
    var v=state.box.querySelector('#ha629Media video');
    if(typeOf(row)==='video'&&v){
      var begun=false;
      var start=function(){
        if(!(isFinite(v.duration)&&v.duration>0))return;
        state.duration=Math.max(1000,v.duration*1000);state.elapsed=(v.currentTime||0)*1000;
        if(!begun){begun=true;runTimer()}else setProgress(state.elapsed/state.duration*100)
      };
      v.onloadedmetadata=start;v.oncanplay=start;
      v.ondurationchange=function(){if(isFinite(v.duration)&&v.duration>0){state.duration=Math.max(1000,v.duration*1000);state.elapsed=(v.currentTime||0)*1000;setProgress(state.elapsed/state.duration*100)}};
      v.ontimeupdate=function(){if(!state.paused&&isFinite(v.duration)&&v.duration>0){state.duration=v.duration*1000;state.elapsed=(v.currentTime||0)*1000;setProgress(state.elapsed/state.duration*100)}};
      v.onended=next;try{v.play().catch(function(){})}catch(_e){}if(v.readyState>=1)start()
    }else startPhotoProgressV787()
  }
  function next(){if(state.closed)return;if(state.index>=state.rows.length-1){close('complete');return}paint(state.index+1)}
  function prev(){if(state.closed)return;if(state.index<=0){paint(0);return}paint(state.index-1)}

  function applyZoom(){var m=state.box&&state.box.querySelector('#ha629Media img,#ha629Media video');if(!m)return;var z=state.zoom;m.style.transform='translate3d('+z.x+'px,'+z.y+'px,0) scale('+z.scale+')'}
  function clampZoom(){var media=$('ha629Media');if(!media)return;var r=media.getBoundingClientRect(),s=state.zoom.scale;var mx=Math.max(0,r.width*(s-1)/2),my=Math.max(0,r.height*(s-1)/2);state.zoom.x=Math.max(-mx,Math.min(mx,state.zoom.x));state.zoom.y=Math.max(-my,Math.min(my,state.zoom.y))}
  function resetZoom(shouldResume){state.zoom={scale:1,x:0,y:0};applyZoom();if(shouldResume)resume()}
  function setZoom(scale,x,y){state.zoom.scale=Math.max(1,Math.min(4,scale));if(Number.isFinite(x))state.zoom.x=x;if(Number.isFinite(y))state.zoom.y=y;clampZoom();applyZoom();if(state.zoom.scale>1.01)pause();else resetZoom(true)}
  function storyViewportHeight(){try{return Math.round((window.visualViewport&&window.visualViewport.height)||window.innerHeight||document.documentElement.clientHeight||0)}catch(_e){return 0}}
  function rememberComposerViewport(){var h=storyViewportHeight(),inner=Math.round(window.innerHeight||0);state.composerViewportBase=Math.max(state.composerViewportBase||0,h,inner)}
  function clearComposerDismissGuard(shouldResume){clearTimeout(state.composerDismissTimer);state.composerDismissTimer=0;state.composerDismissGuard=false;state.composerDismissGuardUntil=0;state.composerDismissPointerId=null;if(shouldResume&&!state.closed)resume()}
  function watchComposerDismiss(){
    clearTimeout(state.composerDismissTimer);
    if(!state.composerDismissGuard||state.closed)return;
    var h=storyViewportHeight(),base=state.composerViewportBase||Math.round(window.innerHeight||0),keyboardClosed=!!(base&&h>=base-72);
    if(keyboardClosed||Date.now()>=state.composerDismissGuardUntil){clearComposerDismissGuard(true);return}
    state.composerDismissTimer=setTimeout(watchComposerDismiss,90);
  }
  function armComposerDismissGuard(input){
    rememberComposerViewport();pause();state.lastTapAt=0;state.composerDismissGuard=true;state.composerDismissGuardUntil=Date.now()+2300;state.composerDismissPointerId=null;
    try{if(input){input.setAttribute('readonly','readonly');input.blur();setTimeout(function(){try{input.removeAttribute('readonly')}catch(_e){}},180)}}catch(_e){}
    try{var a=document.activeElement;if(a&&a!==document.body&&typeof a.blur==='function')a.blur()}catch(_e){}
    state.composerDismissTimer=setTimeout(watchComposerDismiss,90);
  }
  function consumeComposerDismissPointer(e){
    if(!state.composerDismissGuard)return false;
    state.composerDismissPointerId=e.pointerId;state.lastTapAt=0;
    try{var a=document.activeElement;if(a&&typeof a.blur==='function')a.blur()}catch(_e){}
    try{e.preventDefault();e.stopPropagation()}catch(_e){}
    return true;
  }
  function finishComposerDismissPointer(e){
    if(state.composerDismissPointerId!==e.pointerId)return false;
    try{e.preventDefault();e.stopPropagation()}catch(_e){}
    state.composerDismissPointerId=null;clearTimeout(state.composerDismissTimer);state.composerDismissTimer=setTimeout(function(){clearComposerDismissGuard(true)},140);return true;
  }
  function distance(a,b){var x=a.x-b.x,y=a.y-b.y;return Math.sqrt(x*x+y*y)}

  /* V793 : navigation Story instantanée.
     - aucun délai artificiel pour attendre un éventuel double-tap ;
     - un maintien ne prend la main qu'après un vrai appui prolongé ;
     - un pointercancel/lostpointercapture ne déclenche jamais next()/prev() ;
     - dès qu'un déplacement réel commence, le timer de maintien est annulé. */
  var STORY_HOLD_DELAY_V793=360;
  function storyMoveToleranceV793(pointerType){return pointerType==='mouse'?8:16}
  function clearStoryHoldV793(){if(state.holdTimer){clearTimeout(state.holdTimer);state.holdTimer=0}}
  function finishStoryHoldV793(){clearStoryHoldV793();if(state.hold){state.hold=false;resume();return true}return false}

  function bindMediaGestures(){
    var media=$('ha629Media');if(!media||media.__haStoryGestureV629)return;media.__haStoryGestureV629=true;
    function pt(e){return {x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,baseX:state.zoom.x,baseY:state.zoom.y,pointerType:e.pointerType||''}}
    media.addEventListener('pointerdown',function(e){
      if(state.closed||state.shareOverlayOpen)return;if(consumeComposerDismissPointer(e))return;
      state.lastPointerType=e.pointerType||'';state.pointerDownAt=Date.now();
      try{media.setPointerCapture(e.pointerId)}catch(_e){}state.pointers.set(e.pointerId,pt(e));
      if(state.pointers.size===2){clearStoryHoldV793();state.hold=false;state.pinch=true;var a=Array.from(state.pointers.values());state.pinchDistance=distance(a[0],a[1]);state.pinchScale=state.zoom.scale;pause();e.preventDefault();return}
      state.startX=e.clientX;state.startY=e.clientY;state.moved=false;state.hold=false;
      if(state.zoom.scale<=1.01){state.holdTimer=setTimeout(function(){if(state.closed||state.shareOverlayOpen||state.moved||state.pointers.size!==1)return;state.hold=true;pause()},STORY_HOLD_DELAY_V793)}else pause();
    },{passive:false});
    media.addEventListener('pointermove',function(e){
      var p=state.pointers.get(e.pointerId);if(!p)return;p.x=e.clientX;p.y=e.clientY;
      if(state.pointers.size>=2){clearStoryHoldV793();var a=Array.from(state.pointers.values());var d=distance(a[0],a[1]);if(state.pinchDistance>0)setZoom(state.pinchScale*(d/state.pinchDistance),state.zoom.x,state.zoom.y);state.moved=true;e.preventDefault();return}
      var tol=storyMoveToleranceV793(e.pointerType||p.pointerType);
      if(Math.abs(e.clientX-state.startX)>tol||Math.abs(e.clientY-state.startY)>tol){state.moved=true;clearStoryHoldV793()}
      if(state.zoom.scale>1.01){state.zoom.x=p.baseX+(e.clientX-p.startX);state.zoom.y=p.baseY+(e.clientY-p.startY);clampZoom();applyZoom();e.preventDefault()}
    },{passive:false});
    function up(e){
      if(state.shareOverlayOpen){clearStoryHoldV793();state.pointers.delete(e.pointerId);return}if(finishComposerDismissPointer(e))return;
      var p=state.pointers.get(e.pointerId);state.pointers.delete(e.pointerId);clearStoryHoldV793();
      if(state.pinch){if(state.pointers.size<2){state.pinch=false;if(state.zoom.scale<=1.06)resetZoom(true)}return}
      if(finishStoryHoldV793())return;
      if(!p||state.moved||state.zoom.scale>1.01)return;
      /* Si le callback de maintien a été retardé par le navigateur, un appui qui
         a réellement duré longtemps ne doit tout de même jamais devenir un tap. */
      if(Date.now()-(state.pointerDownAt||0)>=STORY_HOLD_DELAY_V793){resume();return}
      var r=media.getBoundingClientRect(),x=e.clientX;
      state.lastTapAt=0;
      /* V918 : une Story-publication suit exactement les memes zones de
         navigation que toute autre Story. La carte reste non interactive, sauf
         son bouton « Voir la publication » qui stoppe la propagation plus bas.
         Ainsi : gauche = precedente, droite = suivante, centre = aucune navigation. */
      if(x>r.left+r.width*.56){
        try{if(e.cancelable)e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation()}catch(_e){}
        if(state.index>=state.rows.length-1){armStoryExitGuardV923();close('complete');return}
        next();return
      }else if(x<r.left+r.width*.44){
        try{if(e.cancelable)e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation()}catch(_e){}
        prev();return
      }
    }
    function cancel(e){
      if(finishComposerDismissPointer(e))return;
      state.pointers.delete(e.pointerId);clearStoryHoldV793();
      var wasHold=state.hold;state.hold=false;state.moved=false;state.pointerDownAt=0;
      if(state.pinch&&state.pointers.size<2){state.pinch=false;if(state.zoom.scale<=1.06)resetZoom(true)}
      else if(wasHold&&!state.closed)resume();
    }
    media.addEventListener('pointerup',up,{passive:false});
    media.addEventListener('pointercancel',cancel,{passive:false});
    media.addEventListener('lostpointercapture',cancel,{passive:false});
    /* Le double-clic est conservé uniquement à la souris et uniquement dans la
       zone centrale, où un clic simple n'est pas une commande précédent/suivant.
       Sur écran tactile, le zoom reste disponible par pinch sans retarder les taps. */
    media.addEventListener('dblclick',function(e){
      if((state.lastPointerType||'')!=='mouse')return;var r=media.getBoundingClientRect(),ratio=(e.clientX-r.left)/Math.max(1,r.width);if(ratio<.44||ratio>.56)return;e.preventDefault();if(state.zoom.scale>1.01)resetZoom(true);else setZoom(2,0,0)
    },false);
    media.addEventListener('contextmenu',function(e){e.preventDefault()},true);
  }

  function currentRow(){return state.rows[state.index]||null}
  function setStoryLikeButton(btn,on){
    if(!btn)return;btn.classList.toggle('on',!!on);btn.setAttribute('aria-pressed',on?'true':'false');btn.innerHTML=on?'<svg viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor!important"><path d="M20.8 4.6c-1.9-1.7-4.9-1.5-6.6.5L12 7.6 9.8 5.1C8.1 3.1 5.1 2.9 3.2 4.6 1.1 6.5 1 9.7 3 11.7l9 8.6 9-8.6c2-2 1.9-5.2-.2-7.1z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.6c-1.9-1.7-4.9-1.5-6.6.5L12 7.6 9.8 5.1C8.1 3.1 5.1 2.9 3.2 4.6 1.1 6.5 1 9.7 3 11.7l9 8.6 9-8.6c2-2 1.9-5.2-.2-7.1z"/></svg>';
  }
  function renderBottom(row){
    var bottom=$('ha629Bottom'),mine=ownerOf(row)===currentUid();if(!bottom)return;bottom.innerHTML='';try{if(state.box)state.box.style.setProperty('--ha-story-composer-h','62px')}catch(_e){}
    if(mine){
      bottom.innerHTML='<div class="ha629OwnerActions"><button class="ha629OwnerAct" id="ha629Activity" type="button"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V10M10 19V5M16 19v-7M22 19V8"/><path d="M2 19h22"/></svg></span><span>Vues</span></button><button class="ha629OwnerAct" id="ha629Share" type="button"><span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.1M8.7 13.3l6.6 4.1"/></svg></span><span>Partager</span></button></div>';
      $('ha629Activity').onclick=function(e){e.stopPropagation();openActivity(row)};
      $('ha629Share').onclick=function(e){e.stopPropagation();shareStory(row)};
    }else{
      bottom.innerHTML='<div class="ha629VisitorActions"><form class="ha629ReplyForm" id="ha629ReplyForm"><textarea class="ha629ReplyInput" id="ha629ReplyInput" rows="1" maxlength="1500" autocomplete="off" inputmode="text" enterkeyhint="enter" placeholder="Répondre à la story…"></textarea><button class="ha629Send" id="ha629Send" type="submit" aria-label="Envoyer la réponse"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-5.4 16-3.2-6.2L4 12Z"/><path d="m11.4 13.8 3.7-3.7"/></svg></button></form><button class="ha629IconAct" id="ha629Like" type="button" aria-label="J’aime" aria-pressed="false"></button><button class="ha629IconAct" id="ha629Share" data-happyad-story-share-v699="1" type="button" aria-label="Partager"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.1M8.7 13.3l6.6 4.1"/></svg></button></div>';
      var replyInput=$('ha629ReplyInput'),sendBtn=$('ha629Send'),replyForm=$('ha629ReplyForm'),visitorActions=replyInput&&replyInput.closest('.ha629VisitorActions');rememberComposerViewport();
      function composerActive(){return !!(replyInput&&(document.activeElement===replyInput||clean(replyInput.value)))}
      function sizeReplyInput(){
        if(!replyInput)return;
        var expanded=composerActive(),min=48,max=116;
        if(visitorActions)visitorActions.classList.toggle('is-composing',expanded);
        replyInput.style.height=(expanded?max:min)+'px';
        replyInput.style.minHeight=(expanded?max:min)+'px';
        replyInput.style.maxHeight=(expanded?max:min)+'px';
        var scrollable=expanded&&(replyInput.scrollHeight||0)>max+1;
        replyInput.style.overflowY=expanded?'auto':'hidden';
        if(replyForm)replyForm.classList.toggle('is-scrollable',scrollable);
        requestAnimationFrame(function(){
          try{var h=visitorActions?Math.ceil(visitorActions.getBoundingClientRect().height):62;if(state.box)state.box.style.setProperty('--ha-story-composer-h',Math.max(62,h)+'px')}catch(_e){}
        });
      }
      function syncReplySend(){if(!sendBtn)return;var ready=!!clean(replyInput&&replyInput.value);sendBtn.classList.toggle('ready',ready);sendBtn.setAttribute('aria-disabled',ready?'false':'true');sizeReplyInput()}
      if(visitorActions){['pointerdown','click','touchstart'].forEach(function(type){visitorActions.addEventListener(type,function(e){e.stopPropagation()},{passive:type==='touchstart'})})}
      if(replyInput){replyInput.onfocus=function(){rememberComposerViewport();pause();sizeReplyInput();setTimeout(sizeReplyInput,80)};replyInput.onblur=function(){setTimeout(function(){sizeReplyInput();if(!composerActive()&&!state.composerDismissGuard)resume()},90)};replyInput.addEventListener('input',syncReplySend,{passive:true});replyInput.addEventListener('change',sizeReplyInput,{passive:true});syncReplySend();setTimeout(sizeReplyInput,0)}
      var replyPermissionTokenV898=storyId(row)+'::'+Date.now();
      function applyReplyPermissionV898(status){
        if(state.closed||storyId(currentRow())!==storyId(row)||replyPermissionTokenV898.indexOf(storyId(row)+'::')!==0)return;
        if(status&&status.available&&status.allowed===false){
          if(visitorActions)visitorActions.classList.add('is-replies-disabled');
          replyInput.value='';replyInput.disabled=true;sendBtn.disabled=true;replyInput.placeholder='Réponses désactivées';sendBtn.classList.remove('ready');sendBtn.setAttribute('aria-disabled','true');sizeReplyInput();return;
        }
        if(visitorActions)visitorActions.classList.remove('is-replies-disabled');
        replyInput.disabled=false;sendBtn.disabled=false;replyInput.placeholder='Répondre à la story…';syncReplySend();
      }
      function checkReplyPermissionV898(attempt){
        attempt=attempt||0;storyReplyPermissionV898(row,attempt>0).then(function(status){
          if(state.closed||storyId(currentRow())!==storyId(row))return;
          /* Un refus provenant du premier cache doit être confirmé par une lecture
             distante forcée avant de modifier l'interface. */
          if(status&&status.available&&status.allowed===false&&attempt===0){
            applyReplyPermissionV898({allowed:null,available:false});
            setTimeout(function(){checkReplyPermissionV898(1)},160);return;
          }
          applyReplyPermissionV898(status);
          if((!status||!status.available)&&attempt<3)setTimeout(function(){checkReplyPermissionV898(attempt+1)},[180,420,850,1200][attempt]||850);
        }).catch(function(){
          if(state.closed||storyId(currentRow())!==storyId(row))return;
          applyReplyPermissionV898({allowed:null,available:false});
          if(attempt<3)setTimeout(function(){checkReplyPermissionV898(attempt+1)},[180,420,850,1200][attempt]||850);
        });
      }
      applyReplyPermissionV898({allowed:null,available:false});checkReplyPermissionV898(0);
      var likeBtn=$('ha629Like'),likeId=storyId(row),localOn=localStoryLike(likeId);setStoryLikeButton(likeBtn,localOn);var likeTouched=false;
      loadLike(row).then(function(remoteOn){if(!state.closed&&storyId(currentRow())===likeId&&!likeTouched)setStoryLikeButton(likeBtn,remoteOn)});
      $('ha629ReplyForm').onsubmit=function(e){e.preventDefault();e.stopPropagation();var form=e.currentTarget,input=$('ha629ReplyInput'),button=$('ha629Send'),txt=clean(input&&input.value);if(!txt||form.dataset.sending==='1')return;form.dataset.sending='1';if(button)button.classList.add('sending');input.value='';syncReplySend();try{input.scrollTop=0}catch(_e){}sendStoryReply(row,txt).then(function(){armComposerDismissGuard(input);syncReplySend()}).catch(function(err){if(input&&!input.value)input.value=txt;syncReplySend();try{input.focus({preventScroll:true});input.scrollTop=input.scrollHeight}catch(_e){}toast(err&&err.message||'Réponse impossible')}).finally(function(){setTimeout(function(){try{delete form.dataset.sending}catch(_e){}if(button)button.classList.remove('sending');syncReplySend()},260)})};
      likeBtn.onclick=function(e){e.stopPropagation();if(likeBtn.dataset.saving==='1')return;likeTouched=true;var on=!likeBtn.classList.contains('on');setStoryLikeButton(likeBtn,on);setLocalStoryLike(likeId,on);likeBtn.dataset.saving='1';saveLike(row,on).then(function(ok){if(!ok){setStoryLikeButton(likeBtn,!on);toast('J’aime non synchronisé')}}).finally(function(){delete likeBtn.dataset.saving})};
      $('ha629Share').onclick=function(e){e.stopPropagation();shareStory(row)};
    }
  }
  function storySharePayload(row){var p=state.profile||{};return {id:storyId(row),story_id:storyId(row),content_type:STORY_SHARE_TYPE,source_type:STORY_SHARE_TYPE,mode:'story',media_type:typeOf(row),kind:typeOf(row),media_url:mediaOf(row),preview_url:mediaOf(row),thumbnail_url:clean(row.thumbnail_url||row.poster_url),title:'Story de '+(clean(p.full_name||p.display_name||p.name||row.user_name)||'Fyblic'),description:descOf(row),author_name:clean(p.full_name||p.display_name||p.name||row.user_name)||'Fyblic',owner_id:ownerOf(row),user_id:ownerOf(row),created_at:row.created_at||new Date(createdOf(row)).toISOString(),expires_at:row.expires_at||row.expiresAt||''}}
  function restoreStoryAfterShare(reason){
    if(!state.shareOverlayOpen&&!state.shareResumePending)return false;
    state.shareOverlayOpen=false;state.shareResumePending=false;state.lastTapAt=0;state.pointers.clear();
    try{if(state.box)state.box.classList.remove('haStoryShareUnderlayV705')}catch(_e){}
    if(!state.closed&&state.box&&state.box.classList.contains('on'))resume();
    return true;
  }
  async function shareStory(row){
    if(state.closed||state.shareOverlayOpen)return false;
    var interactionGate=window.HappyInteractionPrivacyV855R52;if(!interactionGate||!(await interactionGate.canStory(storyId(row),'reposts',true))){toast('Le propriétaire n’autorise pas le partage de cette Story.');return false;}
    var payload=storySharePayload(row);payload.share_origin='story_viewer_v705';payload.keep_story_open=true;
    state.shareOverlayOpen=true;state.shareResumePending=true;state.lastTapAt=0;state.pointers.clear();pause();
    try{if(state.box)state.box.classList.add('haStoryShareUnderlayV705')}catch(_e){}
    try{
      var api=window.HappyadShareMaster;
      if(!api||typeof api.open!=='function')throw new Error('share-master-unavailable');
      Promise.resolve(api.open(payload,window)).then(function(ok){if(ok===false){restoreStoryAfterShare('open-refused');toast('Partage indisponible')}}).catch(function(){restoreStoryAfterShare('open-error');toast('Partage indisponible')});
      return true;
    }catch(_e){restoreStoryAfterShare('open-exception');toast('Partage indisponible');return false}
  }
  function refreshCurrentCacheRow(row){
    try{var arr=cacheStories(),id=storyId(row);arr.forEach(function(p){if(storyId(p)===id){p.description=descOf(row);p.desc=descOf(row);p.is_active=row.is_active!==false}});arr=arr.filter(active);window.HAPPYAD_STORIES_ITEMS=arr;localStorage.setItem(storyCacheKeyV937(),JSON.stringify(arr))}catch(_e){}
  }
  async function reportStory(row){
    var c=sb(),reporter=await authUid(),id=storyId(row),owner=ownerOf(row);if(!id||!reporter||reporter===owner)return false;
    var record={post_id:id,reporter_id:reporter,owner_id:owner||null,reason:'story_signalee',details:'Signalement depuis le lecteur Story Fyblic',source:'story',status:'pending',created_at:new Date().toISOString()};
    try{if(c){var r=await c.from('happyad_post_reports').insert(record);if(r&&r.error&&String(r.error.code||'')!=='23505')throw r.error}return true}catch(_e){try{var q=readJson('HAPPYAD_STORY_REPORT_OUTBOX_V634',[]);q.push(record);localStorage.setItem('HAPPYAD_STORY_REPORT_OUTBOX_V634',JSON.stringify(q.slice(-80)))}catch(_x){}return false}
  }
  function muteStoryOwner(row){var owner=ownerOf(row);if(!owner||owner===currentUid())return false;try{var h=mutedOwners();h[owner]=Date.now();localStorage.setItem(mutedKey(),JSON.stringify(h));var arr=cacheStories().filter(function(p){return ownerOf(p)!==owner});window.HAPPYAD_STORIES_ITEMS=arr;localStorage.setItem(storyCacheKeyV937(),JSON.stringify(arr));return true}catch(_e){return false}}
  function openMore(){
    var row=currentRow();if(!row)return;var old=$('haStoryMoreModalV629');if(old)old.remove();var mine=ownerOf(row)===currentUid();var m=document.createElement('div');m.id='haStoryMoreModalV629';
    m.innerHTML='<div class="haSmmCard">'+(mine?'<button class="haSmmBtn danger" data-act="delete" type="button">Supprimer la story</button>':'<button class="haSmmBtn" data-act="mute" type="button">Désactiver les stories de ce compte</button><button class="haSmmBtn danger" data-act="report" type="button">Signaler cette story</button>')+'<button class="haSmmBtn haSmmCancel" data-act="cancel" type="button">Annuler</button></div>';
    document.body.appendChild(m);m.onclick=async function(e){if(e.target===m){m.remove();return}var b=e.target&&e.target.closest&&e.target.closest('[data-act]');if(!b)return;var act=b.getAttribute('data-act');if(act==='cancel'){m.remove();return}if(act==='delete'){if(!confirm('Supprimer cette story ?'))return;var c2=sb();try{if(c2&&isUuid(storyId(row))){var d=await c2.from('happyad_stories').update({is_active:false}).eq('id',storyId(row)).eq('user_id',currentUid());if(d&&d.error)throw d.error}row.is_active=false;refreshCurrentCacheRow(row);m.remove();state.rows=state.rows.filter(active);if(state.rows.length)paint(Math.min(state.index,state.rows.length-1));else close('deleted');renderRadarHomeV629();toast('Story supprimée')}catch(_e){toast('Suppression impossible')}return}if(act==='mute'){muteStoryOwner(row);m.remove();close('muted-owner');renderRadarHomeV629();toast('Stories de ce compte désactivées');return}if(act==='report'){b.disabled=true;var ok=await reportStory(row);m.remove();toast(ok?'Story signalée':'Signalement conservé et envoyé dès que possible')}};
  }

  async function openActivity(row){
    var old=$('haStoryActivityModalV629');if(old)old.remove();var m=document.createElement('div');m.id='haStoryActivityModalV629';m.innerHTML='<div class="haSamCard"><div class="haSamHead"><span>Vues</span><button class="haSamClose" type="button">×</button></div><div id="haSamList"><div class="haSamEmpty">Chargement…</div></div></div>';document.body.appendChild(m);m.querySelector('.haSamClose').onclick=function(){m.remove()};m.onclick=function(e){if(e.target===m)m.remove()};
    var list=m.querySelector('#haSamList'),c=sb(),id=storyId(row);if(!c||!id){list.innerHTML='<div class="haSamEmpty">Vues indisponibles.</div>';return}
    try{
      var viewQ=c.from('happyad_story_views').select('*').eq('story_id',id).order('viewed_at',{ascending:false}).limit(300);
      var likeQ=c.from('happyad_story_likes').select('story_id,user_id,liked,created_at,updated_at').eq('story_id',id).eq('liked',true).limit(300);
      var replyPattern=STORY_REPLY_MARKER+'{\"story_id\":\"'+id+'\"%';
      var replyQ=c.from('happyad_msg_messages').select('sender_id,created_at,body').like('body',replyPattern).limit(300);
      var settled=await Promise.allSettled([viewQ,likeQ,replyQ]);
      var views=settled[0].status==='fulfilled'&&!settled[0].value.error?(settled[0].value.data||[]):[];
      var likes=settled[1].status==='fulfilled'&&!settled[1].value.error?(settled[1].value.data||[]):[];
      if(!likes.length){try{var alt=await c.from('happyad_content_actions').select('*').eq('post_id',id).eq('content_type','story').eq('action_type','like').eq('liked',true).limit(300);if(!alt.error)likes=alt.data||[]}catch(_e){}}
      var replies=settled[2].status==='fulfilled'&&!settled[2].value.error?(settled[2].value.data||[]):[];
      var actions={},touch=function(uid,kind,at){uid=clean(uid);if(!uid||uid===currentUid())return;if(!actions[uid])actions[uid]={uid:uid,view:false,like:false,reply:false,last:0};actions[uid][kind]=true;var t=Date.parse(at||'')||0;if(t>actions[uid].last)actions[uid].last=t};
      views.forEach(function(v){touch(v.viewer_id||v.user_id||v.uid,'view',v.viewed_at||v.created_at)});
      likes.forEach(function(v){touch(v.user_id||v.actor_id||v.viewer_id,'like',v.updated_at||v.created_at)});
      replies.forEach(function(v){touch(v.sender_id||v.user_id,'reply',v.created_at)});
      var ids=Object.keys(actions);if(!ids.length){list.innerHTML='<div class="haSamEmpty">Aucune vue pour le moment.</div>';return}
      var pr=await c.from('happyad_profiles_public_v1').select('*').in('id',ids),profiles=pr.data||[],map={};profiles.forEach(function(p){map[clean(p.id||p.user_id||p.uid)]=p});ids.sort(function(a,b){return actions[b].last-actions[a].last});
      list.innerHTML=ids.map(function(uid){var p=map[uid]||{},a=actions[uid],name=clean(p.full_name||p.display_name||p.name||p.username)||'Utilisateur Fyblic',av=clean(p.avatar_url||p.avatar),tags='<span class="haSamAction">Vue</span>'+(a.like?'<span class="haSamAction like">♥ Aimé</span>':'')+(a.reply?'<span class="haSamAction reply">↩ Répondu</span>':'');return '<div class="haSamRow"><div class="haSamAv">'+(av?'<img src="'+esc(av)+'" alt="">':'<span class="happyadDefaultProfileAvatarV989" aria-hidden="true"></span>')+'</div><div class="haSamCopy"><div class="haSamNameLine"><b>'+esc(name)+'</b>'+badgeHtml(p.badge||p.user_badge)+'</div><div class="haSamActions">'+tags+'</div></div></div>'}).join('');
    }catch(_e){list.innerHTML='<div class="haSamEmpty">Impossible de charger les vues.</div>'}
  }

  /* V793 : le voisin immédiat est préchauffé sans modifier la session Story.
     Les photos sont chargées + décodées en mémoire. Les vidéos voisines ne
     démarrent pas : le navigateur prépare seulement leur ressource pour réduire
     le temps entre le tap et la première image. Le pool est volontairement petit. */
  function storyPreloadKeyV793(row){return typeOf(row)+'|'+mediaOf(row)}
  function clearStoryPreloadsV793(){
    clearTimeout(state.preloadTimer);state.preloadTimer=0;
    try{state.preloads.forEach(function(x){if(x&&x.kind==='video'&&x.node){try{x.node.pause()}catch(_e){}try{x.node.removeAttribute('src');x.node.load()}catch(_e){}}});state.preloads.clear()}catch(_e){}
  }
  function preloadStoryRowV793(row,priority){
    if(!row||!active(row))return;var url=mediaOf(row),kind=typeOf(row),key=storyPreloadKeyV793(row);if(!url||state.preloads.has(key))return;
    try{
      if(kind==='photo'){
        var img=new Image();img.decoding='async';try{img.fetchPriority=priority?'high':'low'}catch(_e){};state.preloads.set(key,{kind:'photo',node:img,at:Date.now()});img.src=url;
        if(typeof img.decode==='function')img.decode().catch(function(){});
      }else{
        var v=document.createElement('video');v.preload=priority?'auto':'metadata';v.muted=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');state.preloads.set(key,{kind:'video',node:v,at:Date.now()});v.src=url;try{v.load()}catch(_e){}
      }
      if(state.preloads.size>4){var first=state.preloads.keys().next().value,old=state.preloads.get(first);state.preloads.delete(first);if(old&&old.kind==='video'&&old.node){try{old.node.removeAttribute('src');old.node.load()}catch(_e){}}}
    }catch(_e){}
  }
  function scheduleStoryNeighborsV793(index){
    clearTimeout(state.preloadTimer);state.preloadTimer=setTimeout(function(){
      if(state.closed||state.shareOverlayOpen)return;preloadStoryRowV793(state.rows[index+1],true);preloadStoryRowV793(state.rows[index-1],false)
    },90);
  }

  /* V942 : préchauffage AVANT ouverture, strictement limité aux cercles Story
     réellement visibles à l'écran. Ce pool est séparé du préchargement V793 du
     lecteur afin qu'un scroll du Radar ne perturbe jamais suivant/précédent.
     Une seule Story par cercle est préparée : exactement celle que le clic ouvrira. */
  var radarVisiblePreloadsV942=new Map(),radarVisibleObserverV942=null;
  function radarPreloadKeyV942(row){return storyId(row)+'|'+typeOf(row)+'|'+mediaOf(row)}
  function disposeRadarVisiblePreloadV942(key){
    key=clean(key);if(!key)return;var item=radarVisiblePreloadsV942.get(key);if(!item)return;radarVisiblePreloadsV942.delete(key);
    try{
      if(item.node&&item.kind==='video'){try{item.node.pause()}catch(_e){}try{item.node.removeAttribute('src');item.node.load()}catch(_e){}}
      else if(item.node&&item.kind==='photo'&&!item.ready){try{item.node.src=''}catch(_e){}}
    }catch(_e){}
    try{if(item.button&&item.button.__happyadRadarPreloadKeyV942===key)item.button.__happyadRadarPreloadKeyV942=''}catch(_e){}
  }
  function clearRadarVisiblePreloadsV942(){
    try{Array.from(radarVisiblePreloadsV942.keys()).forEach(disposeRadarVisiblePreloadV942)}catch(_e){}
    try{if(radarVisibleObserverV942)radarVisibleObserverV942.disconnect()}catch(_e){}radarVisibleObserverV942=null;
  }
  function radarSeedForButtonV942(btn){
    if(!btn)return null;var owner=clean(btn.dataset&&btn.dataset.storyOwner),sid=clean(btn.dataset&&btn.dataset.storyId);if(!owner)return null;
    var arr=cacheStories();return arr.find(function(p){return ownerOf(p)===owner&&(!sid||storyId(p)===sid)})||arr.find(function(p){return ownerOf(p)===owner})||null;
  }
  function preloadVisibleRadarButtonV942(btn){
    if(!btn||!btn.isConnected)return false;var row=radarSeedForButtonV942(btn);if(!row||!active(row))return false;
    var url=mediaOf(row),kind=typeOf(row),key=radarPreloadKeyV942(row);if(!url||!key)return false;
    var previous=clean(btn.__happyadRadarPreloadKeyV942);if(previous&&previous!==key)disposeRadarVisiblePreloadV942(previous);
    if(radarVisiblePreloadsV942.has(key)){btn.__happyadRadarPreloadKeyV942=key;return true}
    try{
      if(kind==='photo'){
        var img=new Image(),entry={kind:'photo',node:img,button:btn,ready:false,at:Date.now()};img.decoding='async';try{img.fetchPriority='high'}catch(_e){};
        img.onload=function(){entry.ready=true};img.onerror=function(){entry.ready=false};radarVisiblePreloadsV942.set(key,entry);btn.__happyadRadarPreloadKeyV942=key;img.src=url;
        if(img.complete&&img.naturalWidth)entry.ready=true;else if(typeof img.decode==='function')img.decode().then(function(){entry.ready=true}).catch(function(){});
      }else{
        var v=document.createElement('video'),entryV={kind:'video',node:v,button:btn,ready:false,at:Date.now()};v.preload='auto';v.muted=true;v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');
        var readyV=function(){entryV.ready=true};v.addEventListener('loadeddata',readyV,{once:true});v.addEventListener('canplay',readyV,{once:true});radarVisiblePreloadsV942.set(key,entryV);btn.__happyadRadarPreloadKeyV942=key;v.src=url;try{v.load()}catch(_e){}
      }
      return true;
    }catch(_e){disposeRadarVisiblePreloadV942(key);return false}
  }
  function releaseRadarButtonV942(btn){var key=clean(btn&&btn.__happyadRadarPreloadKeyV942);if(key)disposeRadarVisiblePreloadV942(key)}
  function refreshRadarVisiblePreloadsV942(block,row){
    if(!block||!row||!block.isConnected||!row.isConnected)return;
    if(typeof IntersectionObserver!=='function'){
      /* Secours anciens navigateurs : mesurer uniquement après le rendu, jamais
         précharger tout le lot. */
      requestAnimationFrame(function(){
        var rr=row.getBoundingClientRect(),vw=Math.max(document.documentElement.clientWidth||0,window.innerWidth||0),vh=Math.max(document.documentElement.clientHeight||0,window.innerHeight||0);
        row.querySelectorAll('button.radarItem[data-story-owner]').forEach(function(btn){var r=btn.getBoundingClientRect(),visible=r.right>Math.max(0,rr.left)&&r.left<Math.min(vw,rr.right)&&r.bottom>Math.max(0,rr.top)&&r.top<Math.min(vh,rr.bottom);if(visible)preloadVisibleRadarButtonV942(btn);else releaseRadarButtonV942(btn)})
      });return;
    }
    if(!radarVisibleObserverV942){
      radarVisibleObserverV942=new IntersectionObserver(function(entries){entries.forEach(function(entry){var btn=entry.target;if(entry.isIntersecting&&entry.intersectionRatio>=0.22)preloadVisibleRadarButtonV942(btn);else releaseRadarButtonV942(btn)})},{root:null,rootMargin:'0px',threshold:[0,0.22,0.6]});
    }
    var live=new Set();row.querySelectorAll('button.radarItem[data-story-owner]').forEach(function(btn){live.add(btn);if(!btn.__happyadRadarObservedV942){btn.__happyadRadarObservedV942=true;radarVisibleObserverV942.observe(btn)}});
    Array.from(radarVisiblePreloadsV942.entries()).forEach(function(pair){var item=pair[1];if(!item||!item.button||!item.button.isConnected||!live.has(item.button))disposeRadarVisiblePreloadV942(pair[0])});
  }

  function mapSharedGroupPostV913(raw){
    raw=raw||{};var mapped=raw;
    try{if(typeof window.mapHappyPost==='function')mapped=Object.assign({},window.mapHappyPost(raw),raw)}catch(_e){mapped=raw}
    return mapped||raw
  }
  function sharedPostVideoV913(p){
    p=p||{};var t=clean(p.media_type||p.mediaType||p.kind||p.type).toLowerCase();
    if(/video|reel|clip|mp4|webm|mov|m4v/.test(t))return true;
    var u=clean(p.media_url||p.mediaUrl||p.video_url||p.videoUrl||p.url||p.src);
    return /\.(mp4|webm|mov|m4v)(?:[?#]|$)/i.test(u)
  }

  /* V915 — source média exacte + loader partagé Story/publication. */
  function firstSharedMediaV915(value){
    if(value===null||value===undefined)return '';
    if(typeof value==='string'){
      var s=clean(value);if(!s)return '';
      if((s[0]==='['&&s[s.length-1]===']')||(s[0]==='{'&&s[s.length-1]==='}')){try{return firstSharedMediaV915(JSON.parse(s))}catch(_e){}}
      return s;
    }
    if(Array.isArray(value)){for(var i=0;i<value.length;i++){var a=firstSharedMediaV915(value[i]);if(a)return a}return ''}
    if(typeof value==='object'){
      var ks=['url','publicUrl','public_url','src','path','storage_path','storagePath','file_path','filePath','media_url','mediaUrl','video_url','videoUrl','image_url','imageUrl'];
      for(var k=0;k<ks.length;k++){var x=firstSharedMediaV915(value[ks[k]]);if(x)return x}
    }
    return ''
  }
  function publicSharedMediaV915(value){
    var src=firstSharedMediaV915(value);if(!src)return '';
    if(/^(?:https?:\/\/|data:|blob:)/i.test(src))return src;
    src=src.replace(/^\/+/, '').replace(/^happyad-media\//i,'');
    var base='';try{base=clean(window.HAPPYAD_SUPABASE_URL)}catch(_e){}
    return base.replace(/\/+$/,'')+'/storage/v1/object/public/happyad-media/'+encodeURI(src)
  }
  function sharedPostPlayableMediaV915(p,video){
    p=p||{};
    if(video)return publicSharedMediaV915(p.video_url_compressed||p.videoUrlCompressed||p.video_url_original||p.videoUrlOriginal||p.video_url||p.videoUrl||p.media_url||p.mediaUrl||p.url||p.src||p.file_url||p.fileUrl||p.media_urls||p.mediaUrls||p.files);
    return publicSharedMediaV915(p.media_url||p.mediaUrl||p.image_url||p.imageUrl||p.photo_url||p.photoUrl||p.home_media_url||p.homeMediaUrl||p.media_urls||p.mediaUrls||p.images||p.photos||p.files)
  }
  function ensureSharedOpenLoaderV915(){
    var el=document.getElementById('haSharedPostOpenLoaderV915');if(el)return el;
    el=document.createElement('div');el.id='haSharedPostOpenLoaderV915';el.setAttribute('aria-hidden','true');el.innerHTML='<span class="haSharedPostOpenSpinnerV915" aria-label="Chargement"></span>';document.body.appendChild(el);return el
  }
  function showSharedOpenLoaderV915(){var el=ensureSharedOpenLoaderV915();el.classList.add('on');el.setAttribute('aria-hidden','false');return el}
  function hideSharedOpenLoaderV915(){var el=document.getElementById('haSharedPostOpenLoaderV915');if(el){el.classList.remove('on');el.setAttribute('aria-hidden','true')}}
  function warmSharedOriginalMediaV915(post,video){
    return new Promise(function(resolve){
      var url=sharedPostPlayableMediaV915(post,video);if(!url){resolve(false);return}
      var done=false,t=setTimeout(function(){finish(false)},2600);
      function finish(ok){if(done)return;done=true;clearTimeout(t);resolve(!!ok)}
      try{
        if(video){var v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.onloadeddata=function(){finish(true)};v.oncanplay=function(){finish(true)};v.onerror=function(){finish(false)};v.src=url;try{v.load()}catch(_e){}}
        else{var im=new Image();im.decoding='async';im.onload=function(){finish(true)};im.onerror=function(){finish(false)};im.src=url;if(im.complete&&im.naturalWidth)finish(true);else if(typeof im.decode==='function')im.decode().then(function(){finish(true)}).catch(function(){})}
      }catch(_e){finish(false)}
    })
  }
  function waitSharedTargetReadyV915(video){
    return new Promise(function(resolve){
      var started=Date.now(),done=false;
      function finish(){if(done)return;done=true;resolve(true)}
      function watch(){
        if(done)return;
        try{
          if(video){
            var vf=document.getElementById('happyadAppFrame_video'),vd=vf&&vf.contentDocument,vs=vd&&vd.querySelectorAll('video');
            if(Date.now()-started>450&&vf&&vf.classList.contains('on')&&vs){for(var i=0;i<vs.length;i++){if(vs[i]&&vs[i].readyState>=2){finish();return}}}
          }else{
            var fs=document.getElementById('happyadHomePhotoFullscreen'),img=fs&&fs.querySelector('.haHomeFsMedia img'),loading=fs&&fs.querySelector('.haHomeFsLoading');
            if(fs&&fs.classList.contains('on')&&img&&img.complete&&img.naturalWidth>0&&(!loading||loading.style.display==='none')){finish();return}
            var pf=document.getElementById('happyadAppFrame_photo'),pd=pf&&pf.contentDocument,pi=pd&&pd.querySelector('img');
            if(pf&&pf.classList.contains('on')&&pd&&pd.readyState!=='loading'&&(!pi||(pi.complete&&pi.naturalWidth>0))){finish();return}
          }
        }catch(_e){}
        if(Date.now()-started>=7600){finish();return}setTimeout(watch,100)
      }
      watch()
    })
  }
  async function resolveSharedPostGroupV913(row,c){
    var ids=sourcePostGroupIdsV913(row),id=sharedPostIdV912(row);
    if(!ids.length&&id)ids=[id];
    if(!ids.length||!c||typeof c.from!=='function')return {ids:ids,items:[],first:null};
    var rows=[];
    try{
      var q=ids.length>1?await c.from('happyad_posts').select('*').in('id',ids):await c.from('happyad_posts').select('*').eq('id',ids[0]).limit(1);
      if(q&&q.error)throw q.error;rows=Array.isArray(q&&q.data)?q.data:[];
    }catch(_e){rows=[]}
    var by={};rows.forEach(function(r){var rid=clean(r&&r.id);if(rid)by[rid]=mapSharedGroupPostV913(r)});
    var ordered=[];ids.forEach(function(x){if(by[x])ordered.push(by[x])});
    /* Si une ancienne ligne Story ne contenait pas encore la liste d'IDs,
       conserver le comportement publication simple V912. */
    if(!ordered.length&&rows.length)ordered=rows.map(mapSharedGroupPostV913);
    return {ids:ids,items:ordered,first:ordered[0]||null}
  }

  async function openSharedPostV912(row){
    var id=sharedPostIdV912(row);if(!id)return false;pause();showSharedOpenLoaderV915();var c=sb(),resolved=null;
    try{resolved=await resolveSharedPostGroupV913(row,c)}catch(_e){resolved=null}
    var items=resolved&&resolved.items||[],post=resolved&&resolved.first||null;
    if(!post){hideSharedOpenLoaderV915();toast('Publication indisponible.');resume();return false}

    var grouped=isGroupedSharedPostV913(row)&&items.length>1;
    var typ=clean(post.media_type||post.mediaType||post.kind||post.type||sharedPostTypeV912(row)).toLowerCase(),video=/video|reel|clip/.test(typ)||sharedPostVideoV913(post);
    var firstId=clean(post.id||id),allPhotos=grouped&&items.every(function(x){return !sharedPostVideoV913(x)});

    /* Précharger le premier média pendant que le cercle reste visible. Le lecteur
       final garde ensuite son propre cache et son chemin d'ouverture habituel. */
    try{await warmSharedOriginalMediaV915(post,video)}catch(_warm){}
    close('shared-post-open-v915');
    var opened=false;
    try{
      if(allPhotos){
        var rep=Object.assign({},post,{id:firstId,post_id:firstId,__albumItems:items,__albumCount:items.length,__startAlbumIndex:0,__actionId:firstId});
        if(typeof window.happyadOpenHomePhotoFullscreen==='function'){window.happyadOpenHomePhotoFullscreen(firstId,rep);opened=true}
        else if(typeof window.openLongPhoto==='function'){window.openLongPhoto(firstId,rep);opened=true}
      }else if(video&&window.HappyVideo&&typeof window.HappyVideo.openFromHome==='function'){window.HappyVideo.openFromHome(firstId);opened=true}
      else if(!video&&window.HappyPhoto&&typeof window.HappyPhoto.openFromHome==='function'){window.HappyPhoto.openFromHome(firstId,{source:grouped?'story-shared-group-v915':'story-shared-post-v915'});opened=true}
      else{
        var url=(video?'modules/video.html?post=':'modules/photo.html?post=')+encodeURIComponent(firstId)+(video?'&autoplay=1&from=story':'');
        if(window.HappyNavigation&&typeof window.HappyNavigation.open==='function')window.HappyNavigation.open(url,{source:grouped?'story-shared-group-v915':'story-shared-post-v915',postId:firstId,force:true});else location.href=url;opened=true
      }
    }catch(_open){opened=false}
    if(!opened){hideSharedOpenLoaderV915();toast('Ouverture impossible.');return false}
    waitSharedTargetReadyV915(video&&!allPhotos).then(hideSharedOpenLoaderV915).catch(function(){setTimeout(hideSharedOpenLoaderV915,200)});
    return true
  }
  function sharedPostCardHtmlV912(row){
    var media=mediaOf(row),typ=sharedPostTypeV912(row),name=sourcePostAuthorV912(row),av=sourcePostAvatarV912(row),title=sourcePostTitleV912(row),cap=sourcePostCaptionV912(row);
    var avHtml=av?'<img src="'+esc(av)+'" alt="">':'<span class="happyadDefaultProfileAvatarV989" aria-hidden="true"></span>';
    /* V915 : pas de loop. Une vidéo partagée joue automatiquement une fois,
       puis la Story avance normalement. */
    var mediaHtml=typ==='video'?'<video src="'+esc(media)+'" autoplay playsinline webkit-playsinline preload="auto" controlslist="nodownload noplaybackrate" disablepictureinpicture></video>':'<img src="'+esc(media)+'" alt="Publication partagee" draggable="false">';
    var loader='<span class="ha629SharedPostMediaLoaderV915" aria-hidden="true"><i></i></span>';
    var grouped=isGroupedSharedPostV913(row),count=sourcePostGroupCountV913(row)||sourcePostGroupIdsV913(row).length;
    var groupBadge=grouped?'<span class="ha629SharedPostGroupBadgeV913" aria-label="Publication groupée"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="6" width="14" height="14" rx="2"></rect><path d="M8 3h10a3 3 0 0 1 3 3v10"></path></svg><b>'+esc(String(count||''))+'</b></span>':'';
    var arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
    return '<div class="ha629SharedPostCardV912" id="ha629SharedPostCardV912" role="group" aria-label="Publication partagée"><span class="ha629SharedPostHeadV912"><span class="ha629SharedPostAvatarV912">'+avHtml+'</span><span class="ha629SharedPostWhoV912"><span class="ha629SharedNameLineV889"><b>'+esc(name)+'</b><span id="ha629SharedPostBadgeV890"></span></span></span></span><span class="ha629SharedCardShellV891"><span class="ha629SharedPostMediaV912">'+mediaHtml+loader+groupBadge+'</span></span><span class="ha629SharedPostBodyV912"><strong>'+esc(title)+'</strong>'+(cap?'<p>'+esc(cap)+'</p>':'')+'<button class="ha629SharedPostOpenV912" id="ha629SharedPostOpenBottomV914" type="button"><span>Voir la publication</span>'+arrow+'</button></span></div>'
  }

  function applySharedAspectClassV891(card,node){
    if(!card||!node||!card.classList)return false;
    var w=0,h=0;
    try{w=Number(node.videoWidth||node.naturalWidth||node.clientWidth||0);h=Number(node.videoHeight||node.naturalHeight||node.clientHeight||0)}catch(_e){}
    if(!(w>0&&h>0))return false;
    card.classList.remove('is-portrait-v891','is-landscape-v891','is-square-v891');
    var host=card.closest&&card.closest('.ha629Media');
    if(host&&host.classList)host.classList.remove('haSharedPortraitV892','haSharedLandscapeV892','haSharedSquareV892');
    var r=w/h;
    if(r>1.18){card.classList.add('is-landscape-v891');if(host)host.classList.add('haSharedLandscapeV892')}
    else if(r<0.86){card.classList.add('is-portrait-v891');if(host)host.classList.add('haSharedPortraitV892')}
    else{card.classList.add('is-square-v891');if(host)host.classList.add('haSharedSquareV892')}
    return true;
  }

  function beginSharedVideoAspectV896(card){
    if(!card)return;
    var host=card.closest&&card.closest('.ha629Media');
    if(host&&host.classList){
      host.classList.remove('haSharedPortraitV892','haSharedLandscapeV892','haSharedSquareV892');
      host.classList.add('haSharedRatioPendingV896');
    }
    try{card.classList.remove('is-portrait-v891','is-landscape-v891','is-square-v891')}catch(_e){}
  }
  function revealSharedVideoAspectV896(card,node,force){
    if(!card)return false;
    var ok=applySharedAspectClassV891(card,node),host=card.closest&&card.closest('.ha629Media');
    if(ok||force){
      if(!ok&&force){card.classList.add('is-square-v891');if(host&&host.classList)host.classList.add('haSharedSquareV892')}
      if(host&&host.classList)host.classList.remove('haSharedRatioPendingV896');
      return true;
    }
    return false;
  }

  async function primeSharedPostBadgeV890(row,card){
    var slot=card&&card.querySelector('#ha629SharedPostBadgeV890'),uid=sourcePostOwnerV890(row);if(!slot||!uid)return;
    try{
      var cached=null,keys=['HAPPYAD_AUTHOR_PROFILE_CACHE_V1','HAPPYAD_PROFILE_CACHE_V1'];
      for(var i=0;i<keys.length&&!cached;i++){try{var raw=JSON.parse(localStorage.getItem(keys[i])||'null');if(raw&&typeof raw==='object')cached=raw[uid]||null}catch(_e){}}
      var badge=clean(cached&&(cached.badge||cached.user_badge||cached.profile_badge||cached.badge_type||cached.verified_badge));
      if(!badge){var c=sb();if(c){var q=await c.from('happyad_profiles_public_v1').select('*').eq('id',uid).maybeSingle();if(q&&!q.error&&q.data)badge=clean(q.data.badge||q.data.user_badge||q.data.profile_badge||q.data.badge_type||q.data.verified_badge)}}
      if(badge&&slot.isConnected)slot.innerHTML=badgeHtml(badge)
    }catch(_e){}
  }

  function bindSharedPostCardV912(row){
    var card=$('ha629SharedPostCardV912');if(!card)return;
    var action=$('ha629SharedPostOpenBottomV914'),node=card.querySelector('.ha629SharedPostMediaV912 video,.ha629SharedPostMediaV912 img'),loader=card.querySelector('.ha629SharedPostMediaLoaderV915'),sid=storyId(row),video=sharedPostTypeV912(row)==='video',mediaReady=false;
    if(video)beginSharedVideoAspectV896(card);else applySharedAspectClassV891(card,node);
    primeSharedPostBadgeV890(row,card);
    function sameStory(){return !state.closed&&storyId(currentRow())===sid}
    function finishMedia(ok){
      if(mediaReady)return;mediaReady=true;if(loader)loader.classList.add('done');if(node)node.classList.add('ha629SharedPostMediaReadyV915');if(sameStory())resume()
    }
    /* Tant que le média central n'est pas prêt, garder la progression en pause et
       montrer le cercle. Un changement manuel de Story reste toutefois possible. */
    requestAnimationFrame(function(){if(!mediaReady&&sameStory())pause()});
    if(node){
      if(video){
        try{node.autoplay=true;node.playsInline=true;node.setAttribute('playsinline','');node.setAttribute('webkit-playsinline','');node.removeAttribute('loop')}catch(_e){}
        function playSharedVideoV915(){
          try{node.muted=false;var pr=node.play();if(pr&&typeof pr.catch==='function')pr.catch(function(){try{node.muted=true;var retry=node.play();if(retry&&typeof retry.catch==='function')retry.catch(function(){})}catch(_e){}})}catch(_e){try{node.muted=true;node.play().catch(function(){})}catch(_x){}}
        }
        var metadataVideoV896=function(){if(!sameStory())return;revealSharedVideoAspectV896(card,node,false)};
        var readyVideo=function(){if(!sameStory())return;revealSharedVideoAspectV896(card,node,false);playSharedVideoV915();finishMedia(true)};
        node.addEventListener('loadedmetadata',metadataVideoV896);
        node.addEventListener('loadeddata',readyVideo,{once:true});node.addEventListener('canplay',readyVideo,{once:true});node.addEventListener('playing',readyVideo,{once:true});
        /* Les Stories vidéo créées par V912-V914 peuvent avoir stocké le poster
           dans media_url. Toujours relire la publication source et remplacer par
           le vrai fichier vidéo; les nouvelles V915 démarrent déjà avec ce fichier. */
        var sourceResolveDone=false;
        (async function(){
          try{var res=await resolveSharedPostGroupV913(row,sb()),first=res&&res.first,real=first&&sharedPostPlayableMediaV915(first,true);if(!real||!node.isConnected)return;if(clean(node.currentSrc||node.src)!==clean(real)){node.src=real;row.media_url=real;row.mediaUrl=real;try{node.load()}catch(_e){}}playSharedVideoV915()}
          catch(_e){}finally{sourceResolveDone=true;if(!mediaReady&&sameStory()&&node.error)finishMedia(false)}
        })();
        node.addEventListener('error',function(){if(sourceResolveDone&&!mediaReady&&sameStory()){revealSharedVideoAspectV896(card,node,true);finishMedia(false)}},{once:true});
        if(node.readyState>=1)metadataVideoV896();
        if(node.readyState>=2)readyVideo();else playSharedVideoV915();
        setTimeout(function(){if(!mediaReady&&sameStory()){revealSharedVideoAspectV896(card,node,true)}},5000)
      }else{
        node.addEventListener('load',function(){applySharedAspectClassV891(card,node);finishMedia(true)},{once:true});node.addEventListener('error',function(){finishMedia(false)},{once:true});if(node.complete&&node.naturalWidth){applySharedAspectClassV891(card,node);finishMedia(true)}
      }
    }else finishMedia(false);

    /* V915 : seule la ligne « Voir la publication » est interactive. Le reste
       de la carte laisse les pointer events remonter au moteur Story et passe à
       la Story suivante, même si le doigt est au centre de l'écran. */
    if(action){
      ['pointerdown','pointermove','pointerup','click'].forEach(function(type){action.addEventListener(type,function(e){e.stopPropagation()},{passive:false})});
      action.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openSharedPostV912(row)},false)
    }
  }

  async function openSharedStoryV888(row){
    var id=sourceStoryIdV888(row);if(!id)return false;
    pause();
    try{
      var ok=await openExactNotificationV735({story_id:id,id:id,owner_id:sourceStoryOwnerV888(row),user_id:sourceStoryOwnerV888(row),author_name:sourceStoryAuthorV888(row)});
      if(!ok)resume();
      return !!ok;
    }catch(_e){resume();toast('Story originale indisponible.');return false}
  }
  function sharedStoryCardHtmlV888(row){
    var media=mediaOf(row),typ=typeOf(row),name=sourceStoryAuthorV888(row),av=sourceStoryAvatarV888(row),badge=sourceStoryBadgeV888(row),cap=sourceStoryCaptionV888(row),depth=repostDepthV895(row);
    var avHtml=av?'<img src="'+esc(av)+'" alt="">':'<span class="happyadDefaultProfileAvatarV989" aria-hidden="true"></span>';
    var mediaHtml=typ==='video'?'<video src="'+esc(media)+'" autoplay playsinline webkit-playsinline preload="auto" controlslist="nodownload noplaybackrate" disablepictureinpicture></video>':'<img src="'+esc(media)+'" alt="Story ajoutée depuis une mention" draggable="false">';
    var loader='<span class="ha629SharedPostMediaLoaderV915" aria-hidden="true"><i></i></span>';
    var arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
    var repostIcon='<span class="ha629RepostGlyphV890" aria-label="Story republiée"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l4 4-4 4"></path><path d="M3 11V9a2 2 0 0 1 2-2h16"></path><path d="M7 21l-4-4 4-4"></path><path d="M21 13v2a2 2 0 0 1-2 2H3"></path></svg></span>';
    var chain='';
    if(depth>=2){
      var originName=originStoryAuthorV895(row),originBadge=originStoryBadgeV895(row);
      if(originName)chain='<span class="ha629RepostChainV895" aria-label="Story d’origine"><i class="ha629RepostChainLineV895" aria-hidden="true"></i><span class="ha629RepostChainNameV895">'+esc(originName)+badgeHtml(originBadge)+'</span></span>';
    }
    var depthClass=depth>=2?' is-repost-depth2-v895':'';
    var actionText=depth>=2?'Voir la story':'Voir la story originale';
    return '<div class="ha629SharedStoryCardV888'+depthClass+'" id="ha629SharedStoryCardV888" role="group" aria-label="Story republiée"><span class="ha629SharedPostHeadV912"><span class="ha629SharedPostAvatarV912">'+avHtml+'</span><span class="ha629SharedPostWhoV912"><span class="ha629SharedNameLineV889"><b>'+esc(name)+'</b>'+badgeHtml(badge)+repostIcon+'</span>'+chain+'</span></span><span class="ha629SharedCardShellV891"><span class="ha629SharedPostMediaV912">'+mediaHtml+loader+'</span></span><span class="ha629SharedPostBodyV912">'+(cap?'<p>'+esc(cap)+'</p>':'')+'<button class="ha629SharedPostOpenV912" id="ha629SharedStoryOpenV888" type="button"><span>'+actionText+'</span>'+arrow+'</button></span></div>';
  }

  function bindSharedStoryCardV888(row){
    var card=$('ha629SharedStoryCardV888');if(!card)return;
    var action=$('ha629SharedStoryOpenV888'),node=card.querySelector('.ha629SharedPostMediaV912 video,.ha629SharedPostMediaV912 img'),loader=card.querySelector('.ha629SharedPostMediaLoaderV915'),sid=storyId(row),ready=false,isVideo=!!(node&&node.tagName==='VIDEO');
    if(isVideo)beginSharedVideoAspectV896(card);else applySharedAspectClassV891(card,node);
    function sameStory(){return !state.closed&&storyId(currentRow())===sid}
    function done(){if(ready)return;ready=true;if(loader)loader.classList.add('done');if(sameStory())resume()}
    requestAnimationFrame(function(){if(!ready&&sameStory())pause()});
    if(node){
      if(node.tagName==='VIDEO'){
        try{node.autoplay=true;node.playsInline=true;node.removeAttribute('loop');var pr=node.play();if(pr&&pr.catch)pr.catch(function(){try{node.muted=true;node.play().catch(function(){})}catch(_e){}})}catch(_e){}
        var metaV896=function(){if(sameStory())revealSharedVideoAspectV896(card,node,false)};
        var readyV896=function(){if(!sameStory())return;revealSharedVideoAspectV896(card,node,false);done()};
        node.addEventListener('loadedmetadata',metaV896);node.addEventListener('loadeddata',readyV896,{once:true});node.addEventListener('canplay',readyV896,{once:true});node.addEventListener('playing',readyV896,{once:true});node.addEventListener('error',function(){revealSharedVideoAspectV896(card,node,true);done()},{once:true});if(node.readyState>=1)metaV896();if(node.readyState>=2)readyV896();setTimeout(function(){if(!ready&&sameStory())revealSharedVideoAspectV896(card,node,true)},5000);
      }else{node.addEventListener('load',function(){applySharedAspectClassV891(card,node);done()},{once:true});node.addEventListener('error',done,{once:true});if(node.complete&&node.naturalWidth){applySharedAspectClassV891(card,node);done()}}
    }else done();
    if(action){['pointerdown','pointermove','pointerup','click'].forEach(function(t){action.addEventListener(t,function(e){e.stopPropagation()},{passive:false})});action.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openSharedStoryV888(row)},false)}
  }

  function paint(n){
    if(state.closed||!state.rows.length)return;stopTimer();resetZoom(false);state.index=Math.max(0,Math.min(state.rows.length-1,n));var row=currentRow(),p=state.profile||{},name=clean(p.full_name||p.display_name||p.name||row.user_name)||'Utilisateur Fyblic',av=clean(p.avatar_url||p.avatar||row.user_avatar),badge=clean(p.badge||p.user_badge||p.badge_type||p.verification_badge||p.verified_badge||p.profile_badge||row.badge||row.user_badge||row.badge_type),media=mediaOf(row),typ=typeOf(row);
    $('ha629Avatar').innerHTML=av?'<img src="'+esc(av)+'" alt="">':'<span class="happyadDefaultProfileAvatarV989" aria-hidden="true"></span>';$('ha629Name').innerHTML=esc(name)+badgeHtml(badge);$('ha629Sub').textContent=ageOf(row);$('ha629Caption').textContent=descOf(row);
    var backdrop=$('ha629Backdrop'),mediaBox=$('ha629Media'),sharedStory=isSharedStoryV888(row),sharedPost=isSharedPostStoryV912(row),shared=sharedStory||sharedPost,backdropMedia=shared?clean(row.thumbnail_url||row.poster_url||media):media;if(typ==='photo'||shared)backdrop.style.backgroundImage='url("'+backdropMedia.replace(/["\\]/g,'\\$&')+'")';else backdrop.style.backgroundImage='none';
    mediaBox.classList.toggle('is-shared-post-v912',shared);
    mediaBox.classList.remove('haSharedPortraitV892','haSharedLandscapeV892','haSharedSquareV892');
    if(sharedStory){$('ha629Caption').textContent='';mediaBox.innerHTML=sharedStoryCardHtmlV888(row);bindSharedStoryCardV888(row)}
    else if(sharedPost){$('ha629Caption').textContent='';mediaBox.innerHTML=sharedPostCardHtmlV912(row);bindSharedPostCardV912(row)}
    else mediaBox.innerHTML=typ==='video'?'<video src="'+esc(media)+'" autoplay playsinline webkit-playsinline preload="auto" controlslist="nodownload noplaybackrate" disablepictureinpicture></video>':'<img src="'+esc(media)+'" alt="Story" draggable="false">';
    resetSegments(state.index);renderBottom(row);window.__HAPPYAD_CURRENT_STORY_CTX={id:storyId(row),row:row,p:itemFromRow(row,p),profile:p,isMine:ownerOf(row)===currentUid()};
    startAgeTickerV783();markSeen(row).then(function(){setTimeout(renderRadarHomeV629,50)});try{document.dispatchEvent(new CustomEvent('happyad:story-master-opened-v629'))}catch(_e){}startDuration(row);scheduleStoryNeighborsV793(state.index)
  }

  function show(owner,rows,profile,startId){
    var box=ensureViewer();state.owner=owner;state.rows=(rows||[]).filter(active).sort(function(a,b){return createdOf(a)-createdOf(b)});state.profile=profile||{};state.closed=false;state.paused=false;state.openToken++;var ix=0;if(startId){var f=state.rows.findIndex(function(r){return storyId(r)===clean(startId)});if(f>=0)ix=f}else{var cache=cacheStories(),unseen=state.rows.findIndex(function(r){var id=storyId(r),p=cache.find(function(x){return storyId(x)===id});return p&&!p.isSeen&&!p.seen&&!p.viewed});if(unseen>=0)ix=unseen}
    buildSegments();activateViewerSurface(box);armStoryReturnV927();lock();paint(ix);return false
  }

  /* V785 : une ouverture Story est une session de lecture immuable.
     Une vérification Supabase peut rafraîchir le cache et les métadonnées, mais
     elle ne remplace jamais state.rows, le média, les segments ni le timer de
     la Story déjà visible. Cela supprime définitivement le second départ de la
     barre quand les données distantes arrivent après l'ouverture locale. */
  function stableMediaKeyV785(v){
    v=clean(v);if(!v)return '';
    try{var u=new URL(v,location.href);return (u.origin+u.pathname).replace(/\/+$/,'').toLowerCase()}catch(_e){return v.split('#')[0].split('?')[0].replace(/\/+$/,'').toLowerCase()}
  }
  function samePlaybackRowV785(a,b){
    if(!a||!b)return false;
    var ai=storyId(a),bi=storyId(b);if(ai&&bi&&ai===bi)return true;
    var am=stableMediaKeyV785(mediaOf(a)),bm=stableMediaKeyV785(mediaOf(b));
    if(am&&bm&&am===bm){var at=createdOf(a),bt=createdOf(b);return !at||!bt||Math.abs(at-bt)<120000}
    return false;
  }
  function syncVerifiedOwnerV785(owner,rows,profile){
    if(state.closed||state.owner!==owner)return false;
    var current=currentRow();if(!current)return false;
    var fresh=(rows||[]).filter(active).sort(function(a,b){return createdOf(a)-createdOf(b)});
    var verified=fresh.find(function(r){return samePlaybackRowV785(current,r)})||null;

    /* Métadonnées autorisées : elles ne changent ni l'identité du média, ni
       son type, ni la liste de segments de la session en cours. */
    state.profile=profile||state.profile||{};
    if(verified){
      if(verified.description!=null)current.description=verified.description;
      if(verified.caption!=null)current.caption=verified.caption;
      if(verified.created_at)current.created_at=verified.created_at;
      if(verified.expires_at)current.expires_at=verified.expires_at;
      if(verified.user_name)current.user_name=verified.user_name;
      if(verified.user_avatar)current.user_avatar=verified.user_avatar;
      if(verified.badge)current.badge=verified.badge;
    }
    var row=current,p=state.profile||{},name=clean(p.full_name||p.display_name||p.name||row.user_name)||'Utilisateur Fyblic',av=clean(p.avatar_url||p.avatar||row.user_avatar),badge=clean(p.badge||p.user_badge||p.badge_type||p.verification_badge||p.verified_badge||p.profile_badge||row.badge||row.user_badge||row.badge_type);
    var avatar=$('ha629Avatar'),nameEl=$('ha629Name'),sub=$('ha629Sub'),caption=$('ha629Caption');
    if(avatar)avatar.innerHTML=av?'<img src="'+esc(av)+'" alt="">':'<span class="happyadDefaultProfileAvatarV989" aria-hidden="true"></span>';
    if(nameEl)nameEl.innerHTML=esc(name)+badgeHtml(badge);
    if(sub)sub.textContent=ageOf(row);
    if(caption)caption.textContent=descOf(row);
    window.__HAPPYAD_CURRENT_STORY_CTX={id:storyId(row),row:row,p:itemFromRow(row,p),profile:p,isMine:ownerOf(row)===currentUid()};
    return true;
  }

  function openOwner(owner,startId,seed){
    owner=clean(owner)||ownerOf(seed);if(!owner){toast('Story indisponible');return false}
    if(isMutedOwner(owner)){toast('Les stories de ce compte sont désactivées');return false}
    var seedProfile=profileFromItem(seed),cached=cachedRowsForOwner(owner,seed),cachedTrusted=!!(cached.length&&cached.every(storyIdentityKnownV917));
    /* V917 : un ancien cache qui ne dit pas explicitement "native" ou
       "shared_post" ne doit JAMAIS être peint comme Story personnelle.
       On affiche seulement le loader pendant la très courte vérification DB. */
    if(cachedTrusted)show(owner,cached,seedProfile,startId||storyId(seed));
    else{var box=ensureViewer();state.owner=owner;state.rows=[];state.profile=seedProfile;state.closed=false;state.openToken++;activateViewerSurface(box);armStoryReturnV927();lock();$('ha629Progress').innerHTML='';$('ha629Avatar').innerHTML=seedProfile.avatar_url?'<img src="'+esc(seedProfile.avatar_url)+'" alt="">':'<span class="happyadDefaultProfileAvatarV989" aria-hidden="true"></span>';$('ha629Name').innerHTML=esc(seedProfile.full_name||'Story')+badgeHtml(seedProfile.badge);$('ha629Sub').textContent='Fyblic';$('ha629Media').innerHTML='<div class="ha629Loading">Ouverture de la story…</div>';$('ha629Caption').textContent='';$('ha629Bottom').innerHTML=''}
    var token=state.openToken;
    Promise.all([fetchRows(owner),fetchProfile(owner,seedProfile)]).then(function(res){if(state.closed||token!==state.openToken||state.owner!==owner)return;var rows=res[0],profile=res[1]||seedProfile;if(!rows.length){if(cachedTrusted)return;toast('Aucune story active');close('empty');return}mergeStoryCache(owner,rows,profile);var keep=storyId(currentRow())||startId;if(cachedTrusted)syncVerifiedOwnerV785(owner,rows,profile);else show(owner,rows,profile,keep);setTimeout(renderRadarHomeV629,30)}).catch(function(){if(!cachedTrusted){toast('Story indisponible');close('error')}});
    return false
  }
  function openItem(p){if(!p||!isStory(p))return false;return openOwner(ownerOf(p),storyId(p),p)}

  var RADAR_INITIAL_OWNERS_V788=20;
  var RADAR_APPEND_OWNERS_V788=10;
  /* V907R3 : 20 lignes Story maximum au premier lot, puis pages de 20. */
  var RADAR_REMOTE_ROWS_V788=20;
  var radarRemoteV788={loading:false,exhausted:false,promise:null,beforeMs:0};
  var radarInitialTopupTimerV788=0;

  function radarCachedOwnerCountV788(){
    var me=currentUid(),seen={};
    cacheStories().filter(active).forEach(function(p){var o=isMineItem(p)&&me?me:ownerOf(p);if(o)seen[o]=1});
    return Object.keys(seen).length;
  }
  function oldestRadarCreatedV788(){
    var oldest=0;
    cacheStories().filter(active).forEach(function(p){var t=createdOf(p);if(t>0&&(!oldest||t<oldest))oldest=t});
    return oldest;
  }
  function mergeRadarRemoteV788(items){
    items=Array.isArray(items)?items:[];if(!items.length)return [];
    var all=cacheStories().concat(items),seen={},out=[];
    all.sort(function(a,b){return createdOf(b)-createdOf(a)});
    all.forEach(function(p){
      var id=storyId(p),key=id||ownerOf(p)+'|'+mediaOf(p);if(!key||seen[key]||!active(p))return;
      seen[key]=1;if(id&&isLocallySeenV787(id)){p.isSeen=true;p.seen=true;p.viewed=true}out.push(p);
    });
    /* Les stories ne contiennent que des métadonnées et des URL : garder plusieurs pages
       permet au rail de continuer sans recharger les médias eux-mêmes. */
    out=out.slice(0,320);
    try{window.HAPPYAD_STORIES_ITEMS=out;window.__HAPPYAD_STORIES_ITEMS_CACHE=out;localStorage.setItem(storyCacheKeyV937(),JSON.stringify(out));if(out.length)rememberLastGoodStoriesV885(out)}catch(_e){}
    return items;
  }
  function fetchMoreRadarV788(){
    if(radarRemoteV788.exhausted)return Promise.resolve([]);
    if(radarRemoteV788.promise)return radarRemoteV788.promise;
    /* Le curseur vient du lot global serveur, pas d'une éventuelle Story du
       propriétaire plus ancienne injectée pour garder « Ta story » disponible. */
    var c=sb(),before=Number(radarRemoteV788.beforeMs||0)||oldestRadarCreatedV788();if(!c||!before)return Promise.resolve([]);
    radarRemoteV788.loading=true;
    radarRemoteV788.promise=(async function(){
      try{
        var q=c.from('happyad_stories').select('*').eq('is_active',true).lt('created_at',new Date(before).toISOString()).order('created_at',{ascending:false}).limit(RADAR_REMOTE_ROWS_V788);
        var res=await q;if(res&&res.error)throw res.error;
        var raw=Array.isArray(res&&res.data)?res.data:[];
        if(raw.length<RADAR_REMOTE_ROWS_V788)radarRemoteV788.exhausted=true;
        if(raw.length){var nextBefore=0;raw.forEach(function(r){var t=createdOf(r);if(t>0&&(!nextBefore||t<nextBefore))nextBefore=t});if(nextBefore)radarRemoteV788.beforeMs=nextBefore}
        var rows=raw.filter(active).filter(function(r){return !isMutedOwner(ownerOf(r))});
        if(!rows.length)return [];
        var ids=[];rows.forEach(function(r){var id=ownerOf(r);if(id&&ids.indexOf(id)<0)ids.push(id)});
        var profiles={};
        if(ids.length){try{var pr=await c.from('happyad_profiles_public_v1').select('id,full_name,username,avatar_url,badge').in('id',ids);if(pr&&!pr.error)(pr.data||[]).forEach(function(x){profiles[clean(x.id)]=x})}catch(_e){}}
        var remoteSeen={};
        var viewer=currentUid(),storyIds=rows.map(storyId).filter(Boolean);
        if(viewer&&storyIds.length){try{var vr=await c.from('happyad_story_views').select('story_id').eq('viewer_id',viewer).in('story_id',storyIds);if(vr&&!vr.error)(vr.data||[]).forEach(function(x){remoteSeen[clean(x.story_id)]=1})}catch(_e){}}
        var items=rows.map(function(r){var item=itemFromRow(r,profiles[ownerOf(r)]||{}),id=storyId(r);if(id&&remoteSeen[id]){item.isSeen=true;item.seen=true;item.viewed=true}return item});
        return mergeRadarRemoteV788(items);
      }catch(_e){return []}
      finally{radarRemoteV788.loading=false;radarRemoteV788.promise=null}
    })();
    return radarRemoteV788.promise;
  }

  async function refreshRadarCanonicalV792(){
    var generationV937=radarAccountGenerationV937;
    if(radarCanonicalV792.promise&&radarCanonicalV792.promiseGeneration===generationV937)return radarCanonicalV792.promise;
    var c=sb();
    if(!c){radarCanonicalV792.awaitingStable=true;return []}
    radarCanonicalV792.loading=true;radarCanonicalV792.awaitingStable=true;
    var ownerUidV924=currentUid(),localPromiseV937=null;
    localPromiseV937=(async function(){
      try{
        function staleAccountCycleV937(){return generationV937!==radarAccountGenerationV937||currentUid()!==ownerUidV924;}
        /* V907R3 : lot principal strict de 20 lignes. La lecture propriétaire est
           parallèle uniquement pour garantir « Ta story »; le commit visible reste
           plafonné à 20 Stories au total. */
        var radarReqV924=c.from('happyad_stories').select('*').eq('is_active',true).order('created_at',{ascending:false}).limit(RADAR_REMOTE_ROWS_V788);
        var ownerReqV924=ownerUidV924?c.from('happyad_stories').select('*').eq('user_id',ownerUidV924).eq('is_active',true).order('created_at',{ascending:false}).limit(RADAR_REMOTE_ROWS_V788):Promise.resolve({data:[],error:null});
        var pairV924=await Promise.all([radarReqV924,ownerReqV924]);
        if(staleAccountCycleV937())return [];
        var res=pairV924[0],ownerResV924=pairV924[1];
        if(res&&res.error)throw res.error;
        var globalRaw=Array.isArray(res&&res.data)?res.data:[];
        radarRemoteV788.exhausted=globalRaw.length<RADAR_REMOTE_ROWS_V788;
        radarRemoteV788.beforeMs=0;

        var ownerRaw=ownerResV924&&!ownerResV924.error&&Array.isArray(ownerResV924.data)?ownerResV924.data:[];
        var rawSeenV924={},chosen=[];
        function takeV907R3(r){
          var id=storyId(r),key=id||ownerOf(r)+'|'+mediaOf(r);
          if(!key||rawSeenV924[key]||!active(r)||isMutedOwner(ownerOf(r))||chosen.length>=RADAR_REMOTE_ROWS_V788)return;
          rawSeenV924[key]=1;chosen.push(r);
        }
        /* Ta story est prioritaire, puis les plus récentes du lot global. */
        ownerRaw.filter(active).sort(function(a,b){return createdOf(b)-createdOf(a)}).forEach(takeV907R3);
        globalRaw.filter(active).sort(function(a,b){return createdOf(b)-createdOf(a)}).forEach(takeV907R3);
        var rows=chosen;
        /* Le prochain lot reprend juste après la plus ancienne ligne GLOBALE déjà
           visible. Les lignes globales évincées du premier lot par « Ta story » ne
           sont donc jamais sautées. */
        var chosenKeys={};rows.forEach(function(r){var id=storyId(r),key=id||ownerOf(r)+'|'+mediaOf(r);if(key)chosenKeys[key]=1});
        var globalSorted=globalRaw.slice().sort(function(a,b){return createdOf(b)-createdOf(a)}),firstOmitted=null;
        for(var gi=0;gi<globalSorted.length;gi++){var gr=globalSorted[gi],gid=storyId(gr),gkey=gid||ownerOf(gr)+'|'+mediaOf(gr);if(gkey&&!chosenKeys[gkey]){firstOmitted=gr;break}}
        if(firstOmitted){radarRemoteV788.beforeMs=(createdOf(firstOmitted)||Date.now())+1}
        else if(globalSorted.length){var oldestGlobal=0;globalSorted.forEach(function(r){var t=createdOf(r);if(t>0&&(!oldestGlobal||t<oldestGlobal))oldestGlobal=t});radarRemoteV788.beforeMs=oldestGlobal}

        if(staleAccountCycleV937())return [];
        if(!rows.length){
          radarCanonicalV792.awaitingStable=false;
          radarCanonicalV792.emptyUid='';radarCanonicalV792.emptyAt=0;radarCanonicalV792.emptyCount=0;
          return commitRadarCacheV792([]);
        }
        radarCanonicalV792.emptyUid='';radarCanonicalV792.emptyAt=0;radarCanonicalV792.emptyCount=0;
        var ids=[];rows.forEach(function(r){var id=ownerOf(r);if(id&&ids.indexOf(id)<0)ids.push(id)});
        var profiles={},remoteSeen={},viewer=currentUid(),storyIds=rows.map(storyId).filter(Boolean);
        /* V936 : profils et état vu partent en parallèle. Le lot Story n'attend plus
           deux allers-retours successifs avant sa réconciliation canonique. */
        var profileReqV936=ids.length?c.from('happyad_profiles_public_v1').select('id,full_name,username,avatar_url,badge').in('id',ids):Promise.resolve({data:[],error:null});
        var seenReqV936=(viewer&&storyIds.length)?c.from('happyad_story_views').select('story_id').eq('viewer_id',viewer).in('story_id',storyIds):Promise.resolve({data:[],error:null});
        try{
          var hydrateV936=await Promise.all([profileReqV936,seenReqV936]);
          if(staleAccountCycleV937())return [];
          var pr=hydrateV936[0],vr=hydrateV936[1];
          if(pr&&!pr.error)(pr.data||[]).forEach(function(x){profiles[clean(x.id)]=x});
          if(vr&&!vr.error)(vr.data||[]).forEach(function(x){remoteSeen[clean(x.story_id)]=1});
        }catch(_e){}
        if(staleAccountCycleV937())return [];
        var fresh=rows.map(function(r){var item=itemFromRow(r,profiles[ownerOf(r)]||{}),id=storyId(r);if(id&&(remoteSeen[id]||isLocallySeenV787(id))){item.isSeen=true;item.seen=true;item.viewed=true}return item});
        fresh.sort(function(a,b){return createdOf(b)-createdOf(a)});
        radarCanonicalV792.awaitingStable=false;
        return commitRadarCacheV792(fresh.slice(0,RADAR_REMOTE_ROWS_V788));
      }catch(_e){
        if(generationV937!==radarAccountGenerationV937||currentUid()!==ownerUidV924)return [];
        radarCanonicalV792.awaitingStable=true;
        return radarFreshReadyV907R3?cacheStories():[];
      }finally{
        if(radarCanonicalV792.promise===localPromiseV937){radarCanonicalV792.loading=false;radarCanonicalV792.promise=null;}
      }
    })();
    radarCanonicalV792.promise=localPromiseV937;radarCanonicalV792.promiseGeneration=generationV937;
    return localPromiseV937;
  }

  function renderRadarHomeV629(){
    var chips=document.querySelector('.chips');if(!chips)return false;try{if(typeof window.currentFilter!=='undefined'&&window.currentFilter!=='all')return false}catch(_e){}
    var old=$('homeRadarStoryMasterV629'),oldRow=old&&old.querySelector('.radarRow'),keepScroll=oldRow?oldRow.scrollLeft:0,keepCount=old?Number(old.getAttribute('data-radar-rendered-owners')||0):0;
    var all=cacheStories().filter(active),groups={},me=currentUid();
    all.forEach(function(p){var o=isMineItem(p)&&me?me:ownerOf(p);if(!o)return;if(!groups[o])groups[o]=[];groups[o].push(p)});Object.keys(groups).forEach(function(o){groups[o].sort(function(a,b){return createdOf(a)-createdOf(b)})});
    function ownerSeenV907R3(owner){if(owner===me)return false;var items=groups[owner]||[];return !!items.length&&items.every(function(p){return !!(p.isSeen||p.seen||p.viewed||isLocallySeenV787(storyId(p)))})}
    var owners=Object.keys(groups).sort(function(a,b){
      if(a===me&&b!==me)return -1;if(b===me&&a!==me)return 1;
      var as=ownerSeenV907R3(a),bs=ownerSeenV907R3(b);if(as!==bs)return as?1:-1;
      var aa=groups[a][groups[a].length-1],bb=groups[b][groups[b].length-1];return createdOf(bb)-createdOf(aa)
    });

    /* V791 : le RADAR maître est désormais un nœud persistant. Avant, chaque retour
       cache/Supabase supprimait tout le bloc puis le recréait. Le bouton + pouvait donc
       disparaître, laisser voir le fond noir, puis réapparaître. Ici on réconcilie les
       unités en place : le +, les avatars déjà chargés et le scroll restent montés. */
    var block=old,row=oldRow;
    if(!block){
      block=document.createElement('section');block.id='homeRadarStoryMasterV629';block.className='radarBlock';
      block.innerHTML='<div class="radarHead"><a class="mapLite" role="button" tabindex="0" aria-label="Annonces" data-happyad-annonces-placeholder-v790="1">📍 Annonces</a></div><div class="radarRow"></div>';
      row=block.querySelector('.radarRow');chips.insertAdjacentElement('afterend',block);
    }else if(!row){
      block.innerHTML='<div class="radarHead"><a class="mapLite" role="button" tabindex="0" aria-label="Annonces" data-happyad-annonces-placeholder-v790="1">📍 Annonces</a></div><div class="radarRow"></div>';
      row=block.querySelector('.radarRow');
    }
    block.setAttribute('data-happyad-story-master','v791');
    function avatarHtml(p,name){var av=clean(p&&(p.avatar||p.user_avatar||p.avatar_url));return av?'<img src="'+esc(av)+'" alt="" decoding="async">':'<span class="radarInitial happyadDefaultProfileAvatarV989" aria-hidden="true"></span>'}
    function addNode(){
      var w=row.querySelector('.haStoryAddOnlyV629'),meProfile=ownProfileForRenderV941()||{};
      if(!w){w=document.createElement('div');w.className='haStoryRadarUnitV629 haStoryAddOnlyV629';w.setAttribute('data-radar-static-add','1')}
      var name=clean(meProfile.name||meProfile.full_name||meProfile.display_name)||'Ta story';
      var av=clean(meProfile.avatar||meProfile.avatar_url||meProfile.photo_url||meProfile.profile_photo);
      var guestIdle=true;try{guestIdle=localStorage.getItem('HAPPYAD_SESSION_ACTIVE')!=='1'||!isUuid(clean(localStorage.getItem('HAPPYAD_AUTH_UID')))}catch(_e){guestIdle=true}
      var sig=[name,av,guestIdle?'guest':'account'].join('|');
      if(w.getAttribute('data-idle-profile-sig-v936')!==sig){
        var face=guestIdle?'<span class="haStoryGuestOrbFaceV939" aria-hidden="true"></span>':(av?'<img src="'+esc(av)+'" alt="" decoding="async">':'<span class="radarInitial happyadDefaultProfileAvatarV989" aria-hidden="true"></span>');
        var avatarClass='radarAvatar haStoryOwnIdleV936'+(guestIdle?' haStoryGuestBubbleV939':'');
        w.innerHTML='<a class="radarItem" href="modules/publish.html?mode=story" aria-label="Ajouter une story"><div class="'+avatarClass+'">'+face+'<span class="haStoryIdlePlusV936" aria-hidden="true">'+storyAddIconHtmlV986()+'</span></div><div class="radarName">Ta story</div></a>';
        w.setAttribute('data-idle-profile-sig-v936',sig);
      }
      if(row.firstElementChild!==w)row.insertBefore(w,row.firstElementChild);
      return w;
    }
    function findOwnerUnit(owner){
      var kids=row.children;for(var i=0;i<kids.length;i++){if(clean(kids[i].getAttribute&&kids[i].getAttribute('data-radar-owner'))===owner)return kids[i]}return null
    }
    var desiredOwners={};
    function appendOwner(owner){
      var items=groups[owner];if(!items||!items.length)return;
      desiredOwners[owner]=1;
      var first=items[items.length-1],name=owner===me?'Ta story':clean(first.creatorName||first.user_name||first.display_name||first.title)||'Utilisateur Fyblic',badge=clean(first.badge||first.userBadge||first.user_badge),seen=items.every(function(p){return !!(p.isSeen||p.seen||p.viewed||isLocallySeenV787(storyId(p)))}),start=items.find(function(p){return !(p.isSeen||p.seen||p.viewed||isLocallySeenV787(storyId(p)))})||items[0];
      var w=findOwnerUnit(owner);if(!w){w=document.createElement('div');w.className='haStoryRadarUnitV629';w.setAttribute('data-radar-owner',owner)}
      var btn=w.querySelector('button.radarItem[data-story-owner]');if(!btn){btn=document.createElement('button');btn.type='button';btn.className='radarItem';btn.dataset.storyOwner=owner;w.insertBefore(btn,w.firstChild||null)}
      btn.dataset.storyOwner=owner;btn.dataset.storyId=storyId(start);
      var av=clean(first&&(first.avatar||first.user_avatar||first.avatar_url));
      var visualSig=['v1000',storyId(first),storyId(start),name,badge,seen?'1':'0',String(items.length),av].join('|');
      if(btn.getAttribute('data-radar-visual-sig')!==visualSig){
        var renderedBadge=owner===me?'':badgeHtml(badge);
        btn.innerHTML='<div class="radarAvatar '+(seen?'seen ':'')+'">'+avatarHtml(first,name)+(items.length>1?'<span class="radarStoryCount">'+items.length+'</span>':'')+'</div><div class="radarName haStoryNameMasterV1000" title="'+esc(name)+'"><span class="haStoryNameTextV1000">'+esc(name)+'</span><span class="haStoryBadgeSlotV1000">'+renderedBadge+'</span></div><div class="radarMeta" data-story-age-v783="1" data-story-created-at="'+esc(String(createdOf(first)||''))+'">'+esc(ageOf(first))+'</div>';
        btn.setAttribute('data-radar-visual-sig',visualSig);
      }else{
        var meta=btn.querySelector('.radarMeta');if(meta){meta.setAttribute('data-story-created-at',String(createdOf(first)||''));meta.textContent=ageOf(first)}
      }
      var plus=w.querySelector('.haStoryAddMiniV629');
      if(owner===me){
        if(!plus){plus=document.createElement('a');plus.className='haStoryAddMiniV629';plus.href='modules/publish.html?mode=story';plus.setAttribute('aria-label','Ajouter une story');plus.innerHTML=storyAddIconHtmlV986();plus.onclick=function(e){e.stopPropagation()};w.appendChild(plus)}
      }else if(plus)plus.remove();
      row.appendChild(w);
    }
    function renderedCount(){return Number(block.getAttribute('data-radar-rendered-owners')||0)}
    function appendThrough(target){var from=renderedCount(),to=Math.min(owners.length,target);for(var i=from;i<to;i++)appendOwner(owners[i]);block.setAttribute('data-radar-rendered-owners',String(to));return to}
    var mine=me&&groups[me];
    if(me){if(!mine||!mine.length)addNode();else{var staleAdd=row.querySelector('.haStoryAddOnlyV629');if(staleAdd)staleAdd.remove()}}
    else{addNode()}
    Array.prototype.slice.call(row.querySelectorAll('.haStoryRadarLoadingV792')).forEach(function(n){n.remove()});
    /* V936 : le squelette n'est qu'un micro-indicateur de premier démarrage. Il ne
       doit jamais rester pendant les retries Supabase. Si aucun cache n'existe, on
       garde « Ta story » stable puis on laisse le rail vide jusqu'à la réponse. */
    if(!owners.length&&(radarCanonicalV792.loading||radarCanonicalV792.awaitingStable||!radarFreshReadyV907R3)&&Date.now()<radarSkeletonUntilV885){
      for(var lp=0;lp<2;lp++){var sk=document.createElement('div');sk.className='haStoryRadarUnitV629 haStoryRadarLoadingV792';sk.setAttribute('aria-hidden','true');sk.innerHTML='<div class="radarItem"><div class="radarAvatar"><span class="haStoryRadarPulseV792"></span></div><div class="radarName">&nbsp;</div><div class="radarMeta">&nbsp;</div></div>';row.appendChild(sk)}
      if(!block.__happyadStorySkeletonExpiryV936){block.__happyadStorySkeletonExpiryV936=true;setTimeout(function(){block.__happyadStorySkeletonExpiryV936=false;if(block.isConnected)renderRadarHomeV629()},Math.max(0,radarSkeletonUntilV885-Date.now())+20)}
    }
    block.setAttribute('data-radar-rendered-owners','0');
    var initial=Math.min(owners.length,Math.max(RADAR_INITIAL_OWNERS_V788,keepCount||0));appendThrough(initial);
    Array.prototype.slice.call(row.children).forEach(function(node){var owner=clean(node.getAttribute&&node.getAttribute('data-radar-owner'));if(owner&&!desiredOwners[owner])node.remove()});
    if((me&&(!mine||!mine.length))||!me){var stableAdd=row.querySelector('.haStoryAddOnlyV629');if(stableAdd&&row.firstElementChild!==stableAdd)row.insertBefore(stableAdd,row.firstElementChild)}

    /* V788 : 20 propriétaires sont prêts au premier rendu. Le reste n'ajoute aucun DOM
       tant que l'utilisateur n'approche pas de la fin du rail horizontal. */
    function nearRailEnd(){return row.scrollLeft+row.clientWidth>=row.scrollWidth-Math.max(280,row.clientWidth*1.15)}
    function growRadar(){
      if(!block.isConnected||!nearRailEnd())return;
      var current=renderedCount();
      if(current<owners.length){
        current=appendThrough(current+RADAR_APPEND_OWNERS_V788);
        if(owners.length-current<=RADAR_APPEND_OWNERS_V788&&!radarRemoteV788.exhausted)fetchMoreRadarV788();
        return;
      }
      if(radarCachedOwnerCountV788()>owners.length){
        block.setAttribute('data-radar-rendered-owners',String(current+RADAR_APPEND_OWNERS_V788));
        renderRadarHomeV629();return;
      }
      if(radarRemoteV788.exhausted)return;
      fetchMoreRadarV788().then(function(items){
        if(!items.length||!block.isConnected)return;
        block.setAttribute('data-radar-rendered-owners',String(current+RADAR_APPEND_OWNERS_V788));
        renderRadarHomeV629();
      });
    }
    block.__happyadGrowRadarV791=growRadar;
    if(!row.__happyadRadarStableScrollV791){
      row.__happyadRadarStableScrollV791=true;
      row.addEventListener('scroll',function(){if(row.__happyadRadarScrollTickV791)return;row.__happyadRadarScrollTickV791=true;requestAnimationFrame(function(){row.__happyadRadarScrollTickV791=false;var fn=block.__happyadGrowRadarV791;if(typeof fn==='function')fn()})},{passive:true});
    }

    /* Délégation unique : le bloc étant persistant, ne pas empiler un listener à chaque
       synchronisation distante. */
    if(!block.__happyadRadarClickBoundV791){
      block.__happyadRadarClickBoundV791=true;
      block.addEventListener('click',function(e){
        var btn=e.target&&e.target.closest&&e.target.closest('button.radarItem[data-story-owner]');
        if(!btn||!block.contains(btn))return;
        e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
        var owner=clean(btn.dataset.storyOwner),sid=clean(btn.dataset.storyId);
        var seed=cacheStories().find(function(p){return ownerOf(p)===owner&&(!sid||storyId(p)===sid)})||cacheStories().find(function(p){return ownerOf(p)===owner})||null;
        openOwner(owner,sid,seed);
      },true);
    }
    if(keepScroll>0)requestAnimationFrame(function(){try{row.scrollLeft=keepScroll}catch(_e){}refreshRadarVisiblePreloadsV942(block,row)});
    else requestAnimationFrame(function(){refreshRadarVisiblePreloadsV942(block,row)});
    /* V907R4 : le premier lot reste STRICTEMENT limité aux 20 Stories récupérées
       avec l'ouverture. Aucun top-up automatique par nombre de propriétaires : les
       lots suivants ne partent que lorsque l'utilisateur approche réellement de la
       fin du rail horizontal. */
    return true
  }

  function ingestCreatedStoryV912(row){
    row=row&&typeof row==='object'?row:{};var uid=currentUid();if(!uid||clean(row.user_id)!==uid||!storyId(row)||(!sharedPostIdV912(row)&&!sourceStoryIdV888(row)))return false;
    try{var me=readUser(),profile={id:uid,full_name:clean(me.name||me.full_name||me.display_name)||clean(row.user_name)||'Ta story',username:clean(me.handle||me.username).replace(/^@+/,''),avatar_url:clean(me.avatar||me.avatar_url)||clean(row.user_avatar),badge:clean(me.badge||me.user_badge||me.badge_type)};var item=itemFromRow(row,profile),arr=cacheStories().filter(function(x){return storyId(x)!==storyId(item)});arr.unshift(item);arr=arr.filter(active).slice(0,320);commitRadarCacheV792(arr);localStorage.setItem('HAPPYAD_RADAR_REFRESH_NEEDED','1');renderRadarHomeV629();return item}catch(_e){return false}
  }
  function ingestOptimisticStoryV925(row,tempId){
    row=row&&typeof row==='object'?Object.assign({},row):{};var uid=currentUid(),tid=clean(tempId||storyId(row));if(!uid||!tid||!sharedPostIdV912(row)||!mediaOf(row))return false;
    try{
      row.id=tid;row.story_id=tid;row.user_id=uid;row.is_active=true;row.__storyOptimisticV925=true;row.__storyOptimisticAtV925=Number(row.__storyOptimisticAtV925)||Date.now();
      if(!row.created_at)row.created_at=new Date(row.__storyOptimisticAtV925).toISOString();
      if(!row.expires_at)row.expires_at=new Date(row.__storyOptimisticAtV925+45000).toISOString();
      var me=readUser(),profile={id:uid,full_name:clean(me.name||me.full_name||me.display_name)||'Ta story',username:clean(me.handle||me.username).replace(/^@+/,''),avatar_url:clean(me.avatar||me.avatar_url),badge:clean(me.badge||me.user_badge||me.badge_type)};
      var item=itemFromRow(row,profile);item.__storyOptimisticV925=true;item.__storyOptimisticAtV925=row.__storyOptimisticAtV925;
      var arr=cacheStories().filter(function(x){return storyId(x)!==tid});arr.unshift(item);arr=arr.filter(active).slice(0,320);
      commitRadarCacheV792(arr);localStorage.setItem('HAPPYAD_RADAR_REFRESH_NEEDED','1');renderRadarHomeV629();return item;
    }catch(_e){return false}
  }
  function commitOptimisticStoryV925(row,tempId){
    row=row&&typeof row==='object'?row:{};var uid=currentUid(),tid=clean(tempId);if(!uid||clean(row.user_id)!==uid||!storyId(row)||!sharedPostIdV912(row))return false;
    try{
      var me=readUser(),profile={id:uid,full_name:clean(me.name||me.full_name||me.display_name)||clean(row.user_name)||'Ta story',username:clean(me.handle||me.username).replace(/^@+/,''),avatar_url:clean(me.avatar||me.avatar_url)||clean(row.user_avatar),badge:clean(me.badge||me.user_badge||me.badge_type)};
      var item=itemFromRow(row,profile),sid=storyId(item),arr=cacheStories().filter(function(x){var id=storyId(x);return id!==tid&&id!==sid});
      arr.unshift(item);arr=arr.filter(active).slice(0,320);commitRadarCacheV792(arr);localStorage.setItem('HAPPYAD_RADAR_REFRESH_NEEDED','1');renderRadarHomeV629();return item;
    }catch(_e){return false}
  }
  function failOptimisticStoryV925(tempId,message){
    var tid=clean(tempId);if(!tid)return false;
    try{var before=cacheStories(),arr=before.filter(function(x){return storyId(x)!==tid});if(arr.length!==before.length){commitRadarCacheV792(arr);renderRadarHomeV629();}localStorage.setItem('HAPPYAD_RADAR_REFRESH_NEEDED','1');if(clean(message))toast(clean(message));return true}catch(_e){return false}
  }
  function openCreatedStoryV914(row){
    var item=ingestCreatedStoryV912(row);if(!item)return false;
    var sid=storyId(item),owner=ownerOf(item)||currentUid();
    setTimeout(function(){
      try{var api=window.HappyadShareMaster;if(api&&typeof api.isOpen==='function'&&api.isOpen()&&typeof api.close==='function')api.close('story-created-open-v914')}catch(_e){}
      var seed=seedForRadar(owner,sid)||item;
      openOwner(owner,sid,seed);
    },70);
    return true
  }

  function seedForRadar(owner,sid){
    var arr=cacheStories();
    return arr.find(function(p){return (ownerOf(p)===owner||(owner===currentUid()&&isMineItem(p)))&&(!sid||storyId(p)===sid)})
      ||arr.find(function(p){return ownerOf(p)===owner||(owner===currentUid()&&isMineItem(p))})||null;
  }
  function openFromRadarEvent(e){
    var btn=e&&e.target&&e.target.closest&&e.target.closest('#homeRadarStoryMasterV629 button.radarItem[data-story-owner]');
    if(!btn)return;
    var owner=clean(btn.dataset.storyOwner),sid=clean(btn.dataset.storyId);
    if(!owner)return;
    if(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation()}
    restorePublicRoutes();
    openOwner(owner,sid,seedForRadar(owner,sid));
  }
  /* V633 : point d'entrée unique et permanent du Radar vers le lecteur persistant. */
  document.addEventListener('click',openFromRadarEvent,true);

  var oldRadar=window.openRadarPost;
  function routeRadar(p){if(p&&isStory(p))return openItem(p);return typeof oldRadar==='function'?oldRadar.apply(this,arguments):false}
  function routeProfile(ownerId){return openOwner(clean(ownerId)||currentUid(),'')}
  function restorePublicRoutes(){
    window.openRadarPost=routeRadar;
    window.openHappyadStoryViewer=openItem;
    window.openCentralStory=openItem;
    window.openProfileStoryPremium=routeProfile;
    window.openStoryViewer=routeProfile;
    window.renderRadarHome=renderRadarHomeV629;
  }
  restorePublicRoutes();
  window.HappyStoryV629={version:VERSION,openItem:openItem,openOwner:openOwner,openExactNotification:openExactNotificationV735,close:close,pause:pause,resume:resume,restoreAfterShare:restoreStoryAfterShare,isShareOpen:function(){return !!state.shareOverlayOpen},renderRadar:renderRadarHomeV629,refreshRadarData:refreshRadarCanonicalV792,getCachedStories:function(){return cacheStories().filter(active)},prepareSignedInIdentityV941:prepareSignedInIdentityV941,finalizeSignedInIdentityV941:finalizeSignedInIdentityV941,routeRadar:routeRadar,openProfile:routeProfile,sendReply:sendStoryReply,ingestSharedPostStory:ingestCreatedStoryV912,ingestMentionedStoryV888:ingestCreatedStoryV912,openCreatedSharedPostStory:openCreatedStoryV914};
  window.HappyStoryV699=window.HappyStoryV629;
  window.HappyStoryV698=window.HappyStoryV629;
  window.HappyStoryV697=window.HappyStoryV629;
  window.HappyStoryV696=window.HappyStoryV629;
  window.HappyStoryV634=window.HappyStoryV629;
  window.HappyStoryV633=window.HappyStoryV629;
  window.HappyStoryV632=window.HappyStoryV629;
  window.HappyStoryV628=window.HappyStoryV629;
  window.happyadHardCloseStoryViewer=close;

  document.addEventListener('happyad:share-closed-v705',function(e){
    var d=e&&e.detail||{};if(d.fromStory)restoreStoryAfterShare(d.reason||'share-close');
  },true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!state.closed&&!state.shareOverlayOpen)close('escape')},true);
  window.addEventListener('message',function(ev){var d=ev&&ev.data;if(!d)return;if(d.type==='HAPPYAD_STORY_POST_OPTIMISTIC_V925'){var od=d.detail||{};ingestOptimisticStoryV925(od.story||{},od.temp_id);return;}if(d.type==='HAPPYAD_STORY_POST_COMMITTED_V925'){var kd=d.detail||{};commitOptimisticStoryV925(kd.story||{},kd.temp_id);return;}if(d.type==='HAPPYAD_STORY_POST_FAILED_V925'){var fd=d.detail||{};failOptimisticStoryV925(fd.temp_id,fd.message);return;}if(d.type==='HAPPYAD_STORY_POST_CREATED_V912'){var cd=d.detail||{},cr=cd.story||{};if(cd.open_after_create===true)openCreatedStoryV914(cr);else ingestCreatedStoryV912(cr);return;}if(d.type==='HAPPYAD_OPEN_EXACT_STORY_NOTIFICATION_V735'){openExactNotificationV735(d.detail||{});return;}if(d.type==='HAPPYAD_STORY_MENTION_REPOST_CREATED_V888'){var md=d.detail||{};ingestCreatedStoryV912(md.story||{});return;}if(d.type==='HAPPYAD_OPEN_SHARED_STORY'){var x=d.detail||{};var seed={id:clean(x.story_id||x.id),story_id:clean(x.story_id||x.id),sourceId:clean(x.story_id||x.id),mode:'story',type:'story',category:'story',creatorId:clean(x.owner_id||x.user_id),user_id:clean(x.owner_id||x.user_id),creatorName:clean(x.author_name||x.creator_name)||'Utilisateur Fyblic',mediaUrl:clean(x.media_url||x.preview_url),media_url:clean(x.media_url||x.preview_url),mediaType:clean(x.media_type)||'photo',description:clean(x.description),created_at:x.created_at||'',expires_at:x.expires_at||'',isRadar:true,isLive:false,__storyTable:'happyad_stories'};openOwner(ownerOf(seed),storyId(seed),seed);return;}if(d.type==='HAPPYAD_OPEN_STORY_V629'||d.type==='HAPPYAD_OPEN_STORY_V628'){var x=d.detail||{};openOwner(clean(x.owner_id||x.user_id),clean(x.story_id),x.item||null)}if(d.type==='HAPPYAD_CLOSE_STORY_V629'||d.type==='HAPPYAD_CLOSE_STORY_V628')close('message')},true);
  /* V936 : ouverture cache-d'abord, réseau en réconciliation. Le cache persistant
     n'est plus vidé au boot; seules les lignes encore actives (<24 h / expires_at)
     peuvent être peintes. Cela donne immédiatement jusqu'à 20 propriétaires non lus
     en priorité, puis Supabase remplace silencieusement le lot. */
  function resetRadarFreshCycleV907R3(){
    radarFreshReadyV907R3=false;radarFreshStartedAtV907R3=Date.now();
    radarStableSnapshotV792=[];radarStableSnapshotAtV792=0;
    radarRemoteV788.exhausted=false;radarRemoteV788.beforeMs=0;
    radarSkeletonUntilV885=Date.now()+(cacheStories().length?0:220);
    radarCanonicalV792.awaitingStable=true;
  }
  function loadRadarFreshNowV907R3(reason,attempt){
    attempt=Math.max(0,Number(attempt)||0);
    if(attempt===0)resetRadarFreshCycleV907R3();
    renderRadarHomeV629();
    if(!sb()){
      if(attempt<7){if(radarFreshRetryTimerV907R3)clearTimeout(radarFreshRetryTimerV907R3);radarFreshRetryTimerV907R3=setTimeout(function(){loadRadarFreshNowV907R3(reason,attempt+1)},Math.min(1400,100+attempt*180))}
      return Promise.resolve([]);
    }
    return refreshRadarCanonicalV792().then(function(items){renderRadarHomeV629();return items}).catch(function(){renderRadarHomeV629();return []});
  }
  function scheduleRadarConnectionV869(reason,delay){
    var run=function(){return refreshRadarCanonicalV792().then(renderRadarHomeV629)};
    try{var coordinator=window.HappyadConnectionWorkCoordinatorV869;if(coordinator&&typeof coordinator.schedule==='function')return coordinator.schedule('home-radar-refresh-v869',run,{surface:'home',delay:Math.max(50,Number(delay)||120),maxDelay:4000,minGap:8000});}catch(_e){}
    setTimeout(function(){run().catch(function(){})},Math.max(50,Number(delay)||120));return true;
  }
  window.addEventListener('pageshow',function(e){
    if(state.closed)unlock();installCss();restorePublicRoutes();
    /* L'événement pageshow initial arrive souvent juste après le boot déjà lancé :
       ne pas démarrer deux cycles. Un vrai retour BFCache recharge au contraire le lot. */
    if(e&&e.persisted)loadRadarFreshNowV907R3('pageshow',0);else if(!radarFreshStartedAtV907R3)loadRadarFreshNowV907R3('pageshow',0);
  },true);
  window.addEventListener('online',function(){radarCanonicalV792.awaitingStable=true;if(!radarFreshReadyV907R3)loadRadarFreshNowV907R3('online',1);else scheduleRadarConnectionV869('online',120)},true);
  window.addEventListener('message',function(ev){var d=ev&&ev.data;if(!d)return;if(d.type==='HAPPYAD_AUTH_SIGNED_IN_V595'||d.type==='HAPPYAD_AUTH_SIGNED_OUT_V595'){var nextUid='',detail=d.detail||{},authEvent=clean(detail.event).toUpperCase();try{if(d.type==='HAPPYAD_AUTH_SIGNED_IN_V595'&&detail.authenticated!==false){nextUid=clean(detail.user_id||(detail.user&&detail.user.id)||currentUid());if(!isUuid(nextUid))nextUid=''}}catch(_e){}if(nextUid!==storyAccountUidV937)resetStoryAccountV937(nextUid);if(!nextUid){ownAuthSeedV941={};loadRadarFreshNowV907R3('auth-out',0);return;}var warm=prepareSignedInIdentityV941(nextUid,detail.user||null);/* Lors du premier SIGNED_IN interactif, l'overlay Auth est encore ouvert : ne pas
       lancer un rendu global concurrent. finishSignedIn V941 attend ce warm puis ferme
       l'overlay. Les autres événements (restore/profile ready) réconcilient normalement. */if(authEvent==='SIGNED_IN'){warm.catch(function(){});return;}warm.then(function(){finalizeSignedInIdentityV941(nextUid,detail.user||null);loadRadarFreshNowV907R3('auth-ready',0)}).catch(function(){loadRadarFreshNowV907R3('auth-ready-error',0)})}},true);
  /* V631 : le CSS du cercle est présent avant le premier rendu, pas seulement après
     la première ouverture du fullscreen. */
  installCss();restorePublicRoutes();
  loadRadarFreshNowV907R3('boot',0);
  setInterval(refreshRadarAgesV783,1000);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')refreshRadarAgesV783()},true);
})();

/* V903 — Ma Story : deux petits boutons séparés, aucun panneau noir parent. */
(function(){
  try{
    var id='haStoryOwnerButtonsV903';
    var old=document.getElementById('haStoryOwnerButtonsV902');if(old)old.remove();
    if(document.getElementById(id))return;
    var st=document.createElement('style');st.id=id;
    st.textContent=`
#happyStoryViewerMasterV629.haStoryV629 #ha629Bottom,
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerActions{
  background:transparent!important;background-image:none!important;
  border:0!important;outline:0!important;box-shadow:none!important;
  backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerActions{
  position:absolute!important;
  left:18px!important;right:18px!important;
  bottom:calc(11px + env(safe-area-inset-bottom))!important;
  width:auto!important;min-width:0!important;min-height:0!important;
  transform:none!important;
  display:flex!important;grid-template-columns:none!important;
  align-items:center!important;justify-content:space-between!important;
  gap:0!important;padding:0!important;margin:0!important;
  border-radius:0!important;
}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerActions::before,
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerActions::after{display:none!important;content:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct{
  width:auto!important;min-width:0!important;min-height:34px!important;
  padding:6px 9px!important;margin:0!important;
  display:inline-flex!important;flex-direction:row!important;
  align-items:center!important;justify-content:center!important;
  gap:6px!important;
  border:1px solid rgba(255,255,255,.18)!important;
  border-radius:18px!important;
  background:rgba(8,12,18,.34)!important;background-image:none!important;
  color:#fff!important;
  box-shadow:none!important;
  backdrop-filter:blur(7px)!important;-webkit-backdrop-filter:blur(7px)!important;
  font-size:10.5px!important;line-height:1!important;font-weight:800!important;
  white-space:nowrap!important;
  -webkit-tap-highlight-color:transparent!important;
}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct span:first-child{
  display:grid!important;place-items:center!important;
  width:18px!important;height:18px!important;font-size:18px!important;line-height:1!important;
}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct svg{
  width:17px!important;height:17px!important;stroke-width:2!important;
}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct:active{
  transform:scale(.96)!important;background:rgba(8,12,18,.48)!important;
}
/* Ma Story : ne jamais recréer une dalle noire derrière les deux commandes. */
#happyStoryViewerMasterV629.haStoryV629 .ha629Card:has(.ha629OwnerActions) .ha629ShadeBottom{
  background:linear-gradient(transparent,rgba(0,0,0,.16),rgba(0,0,0,.30))!important;
}
@media(max-width:360px){
  #happyStoryViewerMasterV629.haStoryV629 .ha629OwnerActions{left:12px!important;right:12px!important;bottom:calc(9px + env(safe-area-inset-bottom))!important}
  #happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct{min-height:32px!important;padding:5px 8px!important;gap:5px!important;font-size:10px!important;border-radius:17px!important}
  #happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct span:first-child{width:17px!important;height:17px!important}
  #happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct svg{width:16px!important;height:16px!important}
}
`;
    document.head.appendChild(st);
  }catch(_e){}
})();


/* V904 — Ma Story : aucun conteneur visible, deux boutons réellement libres et espacés. */
(function(){
  try{
    var id='haStoryOwnerButtonsV904';
    ['haStoryOwnerButtonsV903','haStoryOwnerButtonsV902'].forEach(function(x){var n=document.getElementById(x);if(n)n.remove()});
    if(document.getElementById(id))return;
    var st=document.createElement('style');st.id=id;
    st.textContent=`
#happyStoryViewerMasterV629.haStoryV629 #ha629Bottom{
  background:transparent!important;background-image:none!important;
  border:0!important;outline:0!important;box-shadow:none!important;
  backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
  padding:0!important;margin:0!important;
}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerActions{
  display:contents!important;
  background:transparent!important;background-image:none!important;
  border:0!important;outline:0!important;box-shadow:none!important;
  backdrop-filter:none!important;-webkit-backdrop-filter:none!important;
  padding:0!important;margin:0!important;
}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerActions::before,
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerActions::after{display:none!important;content:none!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct{
  position:absolute!important;
  bottom:calc(12px + env(safe-area-inset-bottom))!important;
  z-index:13!important;
  width:auto!important;min-width:0!important;min-height:34px!important;
  padding:6px 10px!important;margin:0!important;
  display:inline-flex!important;flex-direction:row!important;
  align-items:center!important;justify-content:center!important;gap:6px!important;
  border:1px solid rgba(255,255,255,.18)!important;border-radius:18px!important;
  background:rgba(8,12,18,.34)!important;background-image:none!important;
  color:#fff!important;box-shadow:none!important;
  backdrop-filter:blur(7px)!important;-webkit-backdrop-filter:blur(7px)!important;
  font-size:10.5px!important;line-height:1!important;font-weight:800!important;
  white-space:nowrap!important;-webkit-tap-highlight-color:transparent!important;
}
#happyStoryViewerMasterV629.haStoryV629 #ha629Activity{left:22px!important;right:auto!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerActions #ha629Share{right:22px!important;left:auto!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct span:first-child{
  display:grid!important;place-items:center!important;width:18px!important;height:18px!important;
  font-size:18px!important;line-height:1!important;
}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct svg{width:17px!important;height:17px!important;stroke-width:2!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct:active{transform:scale(.96)!important;background:rgba(8,12,18,.48)!important}
#happyStoryViewerMasterV629.haStoryV629 .ha629Card:has(.ha629OwnerActions) .ha629ShadeBottom{
  background:transparent!important;background-image:none!important;opacity:0!important;
}
@media(max-width:360px){
  #happyStoryViewerMasterV629.haStoryV629 #ha629Activity{left:14px!important}
  #happyStoryViewerMasterV629.haStoryV629 .ha629OwnerActions #ha629Share{right:14px!important}
  #happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct{bottom:calc(10px + env(safe-area-inset-bottom))!important;min-height:32px!important;padding:5px 8px!important;gap:5px!important;font-size:10px!important;border-radius:17px!important}
  #happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct span:first-child{width:17px!important;height:17px!important}
  #happyStoryViewerMasterV629.haStoryV629 .ha629OwnerAct svg{width:16px!important;height:16px!important}
}
`;
    document.head.appendChild(st);
  }catch(_e){}
})();
