/* Fyblic V731 — Collecte analytique réelle avec fuseau local et durée vidéo continue. */
(function(){
  'use strict';
  if(window.__HAPPYAD_ANALYTICS_MASTER_V731__)return;
  window.__HAPPYAD_ANALYTICS_MASTER_V731__=true;

  var VERSION='HAPPYAD_ANALYTICS_V855R7';
  var queue=[],flushTimer=0,authPromise=null,checkpointTimer=0,observed=new WeakSet(),viewTimers=new WeakMap(),videoStates=new WeakMap();
  var route=String(location.pathname||'').toLowerCase();

  function clean(v){return String(v==null?'':v).trim()}
  function json(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch(_e){return fallback}}
  function client(){try{if(typeof window.happyadSb==='function'){var c=window.happyadSb();if(c)return c}if(window.happyadSupabase)return window.happyadSupabase;if(window.supabaseClient&&window.supabaseClient.rpc)return window.supabaseClient;if(window.HappySupabaseClientMasterV972&&typeof window.HappySupabaseClientMasterV972.get==='function')return window.HappySupabaseClientMasterV972.get()}catch(_e){}return null}
  function localUid(){var u=json('HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL',{});return clean(u.id||u.user_id||u.uid||localStorage.getItem('HAPPYAD_AUTH_UID'))}
  function authUid(){if(authPromise)return authPromise;authPromise=(async function(){var c=client();if(c&&c.auth&&c.auth.getUser){try{var r=await c.auth.getUser();var id=clean(r&&r.data&&r.data.user&&r.data.user.id);if(id)return id}catch(_e){}}return localUid()})().finally(function(){setTimeout(function(){authPromise=null},30000)});return authPromise}
  function sessionId(){var key='HAPPYAD_ANALYTICS_SESSION_V728',v='';try{v=clean(sessionStorage.getItem(key));if(!v){v=(crypto&&crypto.randomUUID?crypto.randomUUID():'s'+Date.now()+Math.random().toString(36).slice(2));sessionStorage.setItem(key,v)}}catch(_e){v='s'+Date.now()+Math.random().toString(36).slice(2)}return v}
  function pageSource(){if(route.indexOf('/video')>-1)return 'video';if(route.indexOf('/user')>-1)return /[?&]public=1(?:&|$)/.test(location.search)?'visitor_profile':'profile';if(route.indexOf('/photo')>-1)return 'photo';return 'home'}
  function postFromId(id){id=clean(id);var pools=[window.ALL_POSTS,window.allVideos,window.__HAPPYAD_VIDEO_SOURCE_V621,window.__HAPPYAD_OWN_PROFILE_ALL_POSTS_V627,window.HAPPYAD_STORIES_ITEMS];for(var i=0;i<pools.length;i++){var a=pools[i];if(Array.isArray(a)){var p=a.find(function(x){return clean(x&&(x.id||x.post_id||x.story_id))===id});if(p)return p}}return null}
  function objectOf(el){if(!el)return null;return el.__happyadPost||el.__happyadPostV613E||el.__happyadItem||postFromId(el.dataset&&(el.dataset.postId||el.dataset.id||el.dataset.storyId))||null}
  function ownerOf(obj,el){obj=obj||{};var id=clean(obj.owner_id||obj.ownerId||obj.user_id||obj.userId||obj.creator_id||obj.creatorId||obj.author_id||obj.authorId||obj.uid);if(id)return id;try{var a=el&&el.closest&&el.closest('[data-owner-id],[data-user-id],[data-creator-id]');return clean(a&&(a.dataset.ownerId||a.dataset.userId||a.dataset.creatorId))}catch(_e){return ''}}
  function contentIdOf(obj,el){obj=obj||{};return clean(obj.id||obj.post_id||obj.story_id||(el&&el.dataset&&(el.dataset.postId||el.dataset.id||el.dataset.storyId)))}
  function contentTypeOf(obj,el){obj=obj||{};var t=clean(obj.content_type||obj.media_type||obj.post_type||obj.kind||obj.type||(el&&el.dataset&&(el.dataset.kind||el.dataset.type))).toLowerCase();if(t.indexOf('video')>-1||t==='reel')return 'video';if(t.indexOf('story')>-1)return 'story';if(t.indexOf('album')>-1||t.indexOf('carousel')>-1)return 'album';return 'photo'}
  function profileOwner(){try{var q=new URLSearchParams(location.search||'');var x=clean(q.get('uid')||q.get('user_id')||q.get('profile_uid')||q.get('owner_id'));if(x)return x}catch(_e){}var p=json('HAPPYAD_ACTIVE_PROFILE',{});return clean(p.id||p.user_id||p.uid)}
  function metadataSafe(v){try{return JSON.parse(JSON.stringify(v||{}))}catch(_e){return {}}}

  async function flush(){
    clearTimeout(flushTimer);flushTimer=0;
    if(!queue.length)return;
    var batch=queue.splice(0,20),c=client(),me=await authUid();
    if(!c||!c.rpc||!me){queue=batch.concat(queue);scheduleFlush(2500);return}
    var retry=[];
    await Promise.all(batch.map(async function(e){
      try{
        var res=await c.rpc('happyad_track_analytics_event_v728',{
          p_event_type:e.eventType,p_owner_id:e.ownerId,p_content_id:e.contentId||null,p_content_type:e.contentType||null,
          p_source:e.source||pageSource(),p_session_id:e.sessionId||sessionId(),p_duration_seconds:e.duration||0,
          p_completed:!!e.completed,p_metadata:e.metadata||{},p_dedupe_key:e.dedupeKey||null
        });
        if(res&&res.error){
          var msg=clean(res.error.message||res.error.details||res.error.hint);
          if(!/PGRST202|42883|schema cache|function/i.test(msg))retry.push(e);
        }
      }catch(_e){retry.push(e)}
    }));
    if(retry.length)queue=retry.concat(queue);
    if(queue.length)scheduleFlush(retry.length?2200:120)
  }
  function scheduleFlush(delay){if(flushTimer)return;flushTimer=setTimeout(flush,delay==null?550:delay)}
  function track(eventType,payload){payload=payload||{};var owner=clean(payload.ownerId||payload.owner_id);if(!owner)return false;var me=localUid();if(me&&owner===me)return false;var meta=metadataSafe(payload.metadata);if(!Object.prototype.hasOwnProperty.call(meta,'timezoneOffsetMinutes'))meta.timezoneOffsetMinutes=new Date().getTimezoneOffset();if(!meta.timezone){try{meta.timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(_e){meta.timezone=''}}queue.push({eventType:clean(eventType).toLowerCase(),ownerId:owner,contentId:clean(payload.contentId||payload.content_id),contentType:clean(payload.contentType||payload.content_type),source:clean(payload.source)||pageSource(),sessionId:sessionId(),duration:Number(payload.duration||payload.durationSeconds||0)||0,completed:!!payload.completed,metadata:meta,dedupeKey:clean(payload.dedupeKey||payload.dedupe_key)});scheduleFlush();return true}

  function markContentView(el){var obj=objectOf(el)||{},id=contentIdOf(obj,el),owner=ownerOf(obj,el),type=contentTypeOf(obj,el);if(!id||!owner||type==='video'||type==='story')return;track('content_view',{ownerId:owner,contentId:id,contentType:type,source:pageSource(),dedupeKey:'v728:view:'+sessionId()+':'+id,metadata:{route:route}})}
  var io=('IntersectionObserver'in window)?new IntersectionObserver(function(entries){entries.forEach(function(en){var el=en.target,old=viewTimers.get(el);if(en.isIntersecting&&en.intersectionRatio>=.55){if(!old){old=setTimeout(function(){viewTimers.delete(el);markContentView(el)},900);viewTimers.set(el,old)}}else if(old){clearTimeout(old);viewTimers.delete(el)}})},{threshold:[0,.55,.8]}):null;
  function scan(root){if(!io)return;var nodes=(root||document).querySelectorAll?root.querySelectorAll('.miniCard[data-post-id],.profilePost[data-post-id],[data-post-id].haProfileContentTileV687'):[];Array.prototype.forEach.call(nodes,function(el){if(observed.has(el))return;observed.add(el);io.observe(el)})}

  function installProfileEvents(){if(route.indexOf('/user')<0)return;var owner=profileOwner(),me=localUid();if(owner&&owner!==me&&/[?&]public=1(?:&|$)/.test(location.search||'')){setTimeout(function(){track('profile_visit',{ownerId:owner,contentType:'profile',source:'visitor_profile',dedupeKey:'v728:profile:'+sessionId()+':'+owner})},450)}document.addEventListener('click',function(e){var ownerNow=profileOwner();if(!ownerNow||ownerNow===localUid())return;var msg=e.target&&e.target.closest&&e.target.closest('#publicMessageBtn,[data-profile-message]');if(msg){track('profile_message_tap',{ownerId:ownerNow,contentType:'profile',source:'visitor_profile',dedupeKey:'v728:message:'+sessionId()+':'+ownerNow+':'+Math.floor(Date.now()/3000)});return}var link=e.target&&e.target.closest&&e.target.closest('[data-profile-link],.profileLink,.bioLink,a[data-bio-link]');if(link){track('profile_link_tap',{ownerId:ownerNow,contentType:'profile',source:'visitor_profile',dedupeKey:'v728:link:'+sessionId()+':'+ownerNow+':'+Math.floor(Date.now()/3000),metadata:{href:clean(link.getAttribute&&link.getAttribute('href')).slice(0,250)}})}},true)}

  function videoContext(video){var host=video&&video.closest&&video.closest('[data-post-id],[data-content-id],[data-id],.reel[data-id],.reel[data-post-id]'),obj=objectOf(video)||objectOf(host)||{};var id=contentIdOf(obj,video)||contentIdOf(obj,host)||clean(sessionStorage.getItem('HAPPYAD_VIDEO_ACTIVE_POST_V621'));if((!obj||!Object.keys(obj).length)&&id)obj=postFromId(id)||{};var owner=ownerOf(obj,video)||ownerOf(obj,host);return {id:id,owner:owner,obj:obj}}
  function flushVideo(video,completed,restart){var st=videoStates.get(video);if(!st||!st.playing)return;var elapsed=Math.max(0,(performance.now()-st.started)/1000);st.total+=elapsed;st.playing=false;st.started=0;if(st.total>=1.5||completed){var ctx=videoContext(video);if(ctx.id&&ctx.owner){track('video_watch',{ownerId:ctx.owner,contentId:ctx.id,contentType:'video',source:'video',duration:Math.round(st.total*1000)/1000,completed:!!completed,metadata:{currentTime:Number(video.currentTime||0),duration:Number(video.duration||0)}})}st.total=0}if(restart&&!video.paused&&!video.ended){st.playing=true;st.started=performance.now()}}
  function bindVideo(video){if(videoStates.has(video))return;var initial={playing:false,started:0,total:0,viewed:false};videoStates.set(video,initial);if(!video.paused&&!video.ended){initial.playing=true;initial.started=performance.now()}video.addEventListener('play',function(){var st=videoStates.get(video);if(st&&!st.viewed){var ctx=videoContext(video);if(ctx.id&&ctx.owner)track('video_view',{ownerId:ctx.owner,contentId:ctx.id,contentType:'video',source:pageSource(),dedupeKey:'v855r7:video-view:'+sessionId()+':'+ctx.id});st.viewed=true}if(st&&!st.playing){st.playing=true;st.started=performance.now()}},{passive:true});video.addEventListener('pause',function(){flushVideo(video,false,false)},{passive:true});video.addEventListener('ended',function(){flushVideo(video,true,false)},{passive:true})}
  function scanVideos(root){var nodes=(root||document).querySelectorAll?root.querySelectorAll('video'):[];Array.prototype.forEach.call(nodes,bindVideo)}

  function install(){scan(document);scanVideos(document);installProfileEvents();var mo=new MutationObserver(function(list){list.forEach(function(m){Array.prototype.forEach.call(m.removedNodes||[],function(n){if(!n||n.nodeType!==1)return;if(n.matches&&n.matches('video'))flushVideo(n,false,false);if(n.querySelectorAll)n.querySelectorAll('video').forEach(function(v){flushVideo(v,false,false)})});Array.prototype.forEach.call(m.addedNodes||[],function(n){if(n&&n.nodeType===1){if(n.matches&&n.matches('.miniCard[data-post-id],.profilePost[data-post-id],[data-post-id].haProfileContentTileV687'))scan(n.parentNode||document);scan(n);scanVideos(n)}})})});try{mo.observe(document.documentElement,{childList:true,subtree:true})}catch(_e){}checkpointTimer=setInterval(function(){document.querySelectorAll('video').forEach(function(v){flushVideo(v,false,true)});if(queue.length)flush()},15000);document.addEventListener('visibilitychange',function(){if(document.hidden){document.querySelectorAll('video').forEach(function(v){flushVideo(v,false,false)});flush()}},{passive:true});window.addEventListener('pagehide',function(){clearInterval(checkpointTimer);document.querySelectorAll('video').forEach(function(v){flushVideo(v,false,false)});flush()});window.addEventListener('online',function(){scheduleFlush(50)});window.HappyAnalyticsV731={version:VERSION,track:track,flush:flush,scan:function(){scan(document);scanVideos(document)},profileOwner:profileOwner};window.HappyAnalyticsV728=window.HappyAnalyticsV731}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
