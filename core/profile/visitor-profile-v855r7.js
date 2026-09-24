(function(){
'use strict';
if(window.HappyVisitorProfileV855R50)return;
var C=window.HappyProfileCoreV855R6||window.HappyProfileCoreV855R5||window.HappyProfileCoreV855R4||window.HappyProfileCoreV855R3||window.HappyProfileCoreV855R2||window.HappyProfileCoreV855||window.HappyProfileCoreV854;if(!C)return;
var P=window.HappyProfilePrivacyV855R50||null;
var S=window.HappyProfileScrollPriorityV866||window.HappyProfileScrollPriorityV865||null;
var state={uid:'',profile:null,view:null,viewerUid:'',seq:0,pager:null,items:[],rendered:new Set(),observer:null,channel:null,tab:'posts',story:null,stories:[],storySeen:false,storyBound:false,destroyed:false,following:false,refreshTimer:0,countTimer:0,identityTimer:0,storyRefreshTimer:0,visibleLimit:12,pageStep:12,pageLoading:false,scrollIntent:0,lastScrollY:0,scrollBound:false,privacy:null,privacyKnown:false,privacyRefreshTimer:0,readySent:false,secondaryPostsPromise:null,frameVisible:false};
function $(id){return document.getElementById(id);}
function alive(seq){return !state.destroyed&&seq===state.seq;}
function toast(msg){try{if(window.parent&&window.parent!==window&&window.parent.FyblicToastV1105){window.parent.FyblicToastV1105.show(msg);return;}}catch(_e){}var t=$('profileToast');if(!t)return;clearTimeout(t.__timer);t.textContent=String(msg||'');t.classList.add('on');t.__timer=setTimeout(function(){t.classList.remove('on');},2400);}
function guestNoticeV938(){try{var p=window.parent&&window.parent!==window?window.parent:null,a=p&&(p.HappyAuthSessionV598||p.HappyAuthSessionV596);if(a&&typeof a.notice==='function'){a.notice();return false;}}catch(_e){}toast('Connexion requise');return false;}
function nonPriority(key,fn,delay){if(typeof fn!=='function')return false;var k='visitor-'+String(key||'job');if(S&&typeof S.run==='function')return S.run(k,fn,delay==null?60:delay);setTimeout(fn,Math.max(0,Number(delay)||0));return true;}
async function waitSecondaryIdle(){if(S&&typeof S.whenIdle==='function')try{await S.whenIdle();}catch(_e){}}
function commitSecondary(key,fn,delay){if(typeof fn!=='function')return false;var k='visitor-'+String(key||'commit');if(S&&typeof S.commit==='function')return S.commit(k,fn,delay==null?70:delay);return nonPriority(key,fn,delay);}
function cancelNonPriority(){if(!S||typeof S.cancel!=='function')return;['count','post-refresh','story','privacy','identity','avatar','initial-secondary','identity-paint','grid-empty','grid-items-reset','grid-items-append','grid-skeleton'].forEach(function(k){S.cancel('visitor-'+k);});}
function frameVisibleNowV869(){try{if(window.parent===window)return !document.hidden;var f=window.frameElement;if(!f)return !document.hidden;return !document.hidden&&f.getAttribute('aria-hidden')!=='true'&&!f.hasAttribute('inert')&&f.classList.contains('on');}catch(_e){return !document.hidden;}}
function stopRealtimeV869(){var c=C.client();if(c&&state.channel){try{c.removeChannel(state.channel);}catch(_e){try{state.channel.unsubscribe();}catch(_x){}}}state.channel=null;}
function suspendHiddenV869(){state.frameVisible=false;clearTimeout(state.refreshTimer);clearTimeout(state.countTimer);clearTimeout(state.identityTimer);clearTimeout(state.storyRefreshTimer);clearTimeout(state.privacyRefreshTimer);cancelNonPriority();if(state.observer){try{state.observer.disconnect();}catch(_e){}state.observer=null;}stopRealtimeV869();}
function resumeVisibleV869(){if(state.destroyed)return;state.frameVisible=true;if(!state.uid)return;setupObserver();setupRealtime();if(state.items.length)renderItems(true);else if(state.privacyKnown&&postsAllowed())loadPosts(true,{forceNetwork:true,reason:'visible-first-12'}).catch(function(){});schedulePrivacyRefresh();scheduleCountRefresh();if(storiesAllowed())nonPriority('story',setupStory,100);nonPriority('initial-secondary',initFollow,120);}
function compactVisitorBio(value){return String(value==null?'':value).replace(/\r/g,'').split('\n').map(function(line){return line.trim();}).filter(Boolean).join('\n');}
function cityOf(p){p=p||{};return C.clean(C.first(p.city,p.city_name,p.cityName,p.ville,p.profile_city,p.profileCity,p.location_city,p.locationCity,p.locality,p.town));}
function privacyFallback(){return {privateAccount:false,publicPosts:true,publicStories:true,showCity:false,showFollowers:true,showFollowing:true,viewerIsFollower:false,postsAllowed:false,storiesAllowed:false,available:false,error:'PRIVACY_NOT_READY'};}
function privacy(){return state.privacy||privacyFallback();}
function privateBlocked(){var x=privacy();return !!(x.privateAccount&&!x.viewerIsFollower);}
function postsAllowed(){var x=privacy();return !!(state.privacyKnown&&x.available&&x.postsAllowed);}
function storiesAllowed(){var x=privacy();return !!(state.privacyKnown&&x.available&&x.storiesAllowed);}
function updateStatsLayout(){var box=document.querySelector('.haProfileStats');if(!box)return;var visible=[].filter.call(box.children,function(el){return !el.hidden;}).length;box.style.gridTemplateColumns='repeat('+Math.max(1,visible)+',minmax(0,1fr))';}
function applyPrivacyUi(){
  var x=privacy(),followers=$('profileFollowers'),following=$('profileFollowing'),city=$('profileCity');
  if(followers&&followers.closest('.haProfileStat'))followers.closest('.haProfileStat').hidden=state.privacyKnown&&!x.showFollowers;
  if(following&&following.closest('.haProfileStat'))following.closest('.haProfileStat').hidden=state.privacyKnown&&!x.showFollowing;
  updateStatsLayout();
  if(city){var value=cityOf(state.profile);var visible=!!(state.privacyKnown&&x.showCity&&value);city.hidden=!visible;city.textContent=visible?value:'';}
  if(!storiesAllowed())clearStory();
}
function paintIdentity(p){
  state.profile=p||{};state.view=C.profileView(state.profile);var v=state.view,counts=C.cachedProfileCounts&&C.cachedProfileCounts(state.uid,true);
  if(counts){state.postsTotal=counts.posts;v.posts=counts.posts;v.followers=counts.followers;v.following=counts.following;v.likes=counts.likes;}else state.postsTotal=null;
  if(S&&typeof S.isActive==='function'&&S.isActive()){commitSecondary('identity-paint',function(){paintIdentity(state.profile);},50);return v;}
  $('profileName').textContent=v.name;$('profileHandle').textContent=v.handle?'@'+v.handle:'';$('profileBio').textContent=compactVisitorBio(v.bio);$('profileType').textContent=v.type||'Personnel';
  $('profilePostsCount').textContent=counts?C.compact(counts.posts):'…';
  $('profileFollowers').textContent=(counts&&state.privacyKnown&&privacy().showFollowers)?C.compact(counts.followers):'…';
  $('profileFollowing').textContent=(counts&&state.privacyKnown&&privacy().showFollowing)?C.compact(counts.following):'…';
  $('profileLikes').textContent=counts?C.compact(counts.likes):'…';
  var av=$('profileAvatar');av.replaceChildren();if(v.avatar){var im=document.createElement('img');im.src=v.avatar;im.alt='';im.decoding='async';av.appendChild(im);}else av.textContent='👤';happyadBindAvatarInteractionV992();var badge=$('profileBadge');badge.innerHTML=C.badgeHtml(v.badge);applyPrivacyUi();
}
function paintPostCount(){var hasExact=state.postsTotal!==null&&state.postsTotal!==undefined&&Number.isFinite(Number(state.postsTotal)),value;if(hasExact)value=Math.max(0,Number(state.postsTotal));else if(state.pager&&!state.pager.hasMore()){value=C.groupPosts(state.pager.raw||[]).length;state.postsTotal=value;}else{$('profilePostsCount').textContent='…';return null;}if(state.view)state.view.posts=value;$('profilePostsCount').textContent=C.compact(value);return value;}
function syncLoadHint(){
  var h=$('profileLoadHint');if(!h)return false;
  var eligible=state.tab==='posts'&&postsAllowed();
  var grouped=state.pager?C.groupPosts(state.pager.raw||[]):C.groupPosts(state.items||[]);
  var shown=Math.min(grouped.length,Math.max(0,Number(state.visibleLimit)||0));
  var more=!!(state.pageLoading||(state.pager&&(grouped.length>shown||state.pager.hasMore())));
  var on=!!(eligible&&shown>0&&more&&state.frameVisible&&frameVisibleNowV869());
  h.classList.toggle('on',on);h.setAttribute('aria-hidden',on?'false':'true');
  return on;
}
function setBootOff(){var b=$('profileBoot');if(b)b.classList.add('off');}
function showGridSkeleton(){if(S&&typeof S.isActive==='function'&&S.isActive()){commitSecondary('grid-skeleton',showGridSkeleton,60);return;}var g=$('profileGrid');g.innerHTML='';var h=$('profileLoadHint');if(h){h.classList.remove('on');h.setAttribute('aria-hidden','true');}for(var i=0;i<12;i++){var d=document.createElement('div');d.className='haSkTile';g.appendChild(d);}}
function setGridEmpty(title,text){if(S&&typeof S.isActive==='function'&&S.isActive()){commitSecondary('grid-empty',function(){setGridEmpty(title,text);},60);return;}$('profileGrid').innerHTML='<div class="haProfileEmpty"><b>'+C.esc(title)+'</b><span>'+C.esc(text||'')+'</span></div>';var h=$('profileLoadHint');if(h){h.classList.remove('on');h.setAttribute('aria-hidden','true');}}
function privacyGridMessage(){
  var x=privacy();
  if(!x.available)return ['Confidentialité indisponible','Impossible de vérifier les règles de ce profil. Réessayez dans un instant.'];
  if(privateBlocked())return ['Compte privé','Les publications et Stories de ce compte ne sont visibles que par les abonnés déjà autorisés.'];
  return ['Publications masquées','Ce compte a choisi de ne pas afficher ses publications aux visiteurs.'];
}
function openVisitorTileV1008(tile){
 if(!tile||!postsAllowed())return false;
 return C.openPost(tile.__happyadPost,C.groupPosts(state.items),'visitor-profile-v1008-first-tap',{mode:'visitor',uid:state.uid,profile:state.profile,view:state.view});
}
function bindVisitorTileFirstTapV1008(tile){
 if(!tile||tile.__fyblicFirstTapV1008)return;tile.__fyblicFirstTapV1008=true;
 var downX=0,downY=0,moved=false,openedAt=0;
 if(window.PointerEvent){
  tile.addEventListener('pointerdown',function(e){if(e.button!=null&&e.button!==0)return;downX=Number(e.clientX||0);downY=Number(e.clientY||0);moved=false;},{passive:true});
  tile.addEventListener('pointermove',function(e){if(Math.abs(Number(e.clientX||0)-downX)>10||Math.abs(Number(e.clientY||0)-downY)>10)moved=true;},{passive:true});
  tile.addEventListener('pointercancel',function(){moved=true;},{passive:true});
  tile.addEventListener('pointerup',function(e){
   if(moved||(e.button!=null&&e.button!==0)||(e.target&&e.target.closest&&e.target.closest('[data-profile-act],.haProfileMarketplaceCtaV856,.haProfileMarketplaceShareV857')))return;
   openedAt=Date.now();e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
   var current=e.currentTarget;setTimeout(function(){openVisitorTileV1008(current);},0);
  },{capture:true,passive:false});
 }
 tile.addEventListener('click',function(e){
  if(Date.now()-openedAt<650){e.preventDefault();e.stopPropagation();return;}
  openVisitorTileV1008(e.currentTarget);
 });
}
function renderItems(reset){if(S&&typeof S.isActive==='function'&&S.isActive()){commitSecondary(reset?'grid-items-reset':'grid-items-append',function(){renderItems(reset);},60);return 0;}var g=$('profileGrid');if(reset){g.innerHTML='';state.rendered.clear();}var grouped=C.groupPosts(state.items).slice(0,Math.max(0,state.visibleLimit)),frag=document.createDocumentFragment(),added=0;for(var i=0;i<grouped.length;i++){var p=grouped[i],id=C.clean(C.first(p.id,p.post_id));if(!id||state.rendered.has(id))continue;var tile=C.createTile(p);bindVisitorTileFirstTapV1008(tile);frag.appendChild(tile);state.rendered.add(id);added++;}if(added)g.appendChild(frag);if(!state.rendered.size&&!state.pager?.loading)setGridEmpty('Aucune publication','Ce profil ne contient aucune publication publique.');syncLoadHint();return added;}
async function loadPosts(reset,options){
  options=options||{};
  if(!postsAllowed()){state.items=[];state.pager=null;state.rendered.clear();var m=privacyGridMessage();setGridEmpty(m[0],m[1]);return [];}
  if(state.pageLoading)return [];
  var seq=state.seq;state.pageLoading=true;syncLoadHint();
  try{
    var cachedEnough=false;
    if(reset){
      state.visibleLimit=state.pageStep;
      state.pager=new C.PostPager({uid:state.uid,mode:'visitor',filter:'posts',pageSize:12,requestAlive:function(){return alive(seq)&&postsAllowed();}});
      state.items=[];state.rendered.clear();
      var cache=state.pager.readCache();state.pager.seed(cache);state.items=state.pager.raw.slice();
      cachedEnough=C.groupPosts(state.items).length>=state.visibleLimit;
      if(state.items.length)renderItems(true);else showGridSkeleton();
      if(cachedEnough&&options.forceNetwork!==true){paintPostCount();if(state.frameVisible&&frameVisibleNowV869())nonPriority('initial-post-refresh',refreshFirstPageSecondary,140);return [];}
    }else state.visibleLimit+=state.pageStep;
    var added=await state.pager.ensureGroupedCount(state.visibleLimit,!!reset);
    if(!alive(seq)||!postsAllowed()||!state.frameVisible||!frameVisibleNowV869())return [];
    if(reset&&state.pager&&state.pager.lastFetch&&state.pager.lastFetch.ok===true&&typeof state.pager.pruneInactiveCached==='function')await state.pager.pruneInactiveCached();
    if(!alive(seq)||!postsAllowed()||!state.frameVisible||!frameVisibleNowV869())return [];
    if(options.secondary===true){await waitSecondaryIdle();if(!alive(seq)||!postsAllowed()||!state.frameVisible||!frameVisibleNowV869())return [];}
    state.items=state.pager.raw.slice();
    var available=C.groupPosts(state.items).length;
    if(!state.pager.hasMore()&&state.visibleLimit>available)state.visibleLimit=available;
    renderItems(!!reset);paintPostCount();
    if(!added.length&&!state.items.length)setGridEmpty('Aucune publication','Ce profil ne contient aucune publication publique.');
    return added;
  }finally{state.pageLoading=false;syncLoadHint();}
}
async function refreshFirstPageSecondary(){
  if(state.secondaryPostsPromise)return state.secondaryPostsPromise;
  if(!state.uid||state.tab!=='posts'||!postsAllowed()||!state.frameVisible||!frameVisibleNowV869())return [];
  var task=(async function(){
    var seq=state.seq,tab=state.tab;
    var temp=new C.PostPager({uid:state.uid,mode:'visitor',filter:'posts',pageSize:12,cacheWrites:false,requestAlive:function(){return alive(seq)&&state.tab===tab&&postsAllowed();}});
    var fresh=await temp.fetchMore();
    if(!alive(seq)||state.tab!==tab||!postsAllowed()||!state.frameVisible||!frameVisibleNowV869())return [];
    await waitSecondaryIdle();
    if(!alive(seq)||state.tab!==tab||!postsAllowed()||!state.pager||!state.frameVisible||!frameVisibleNowV869())return [];
    var by={};
    (fresh||[]).forEach(function(row){var id=C.clean(C.first(row&&row.id,row&&row.post_id));if(id)by[id]=row;});
    var merged=(state.pager.raw||[]).map(function(row){var id=C.clean(C.first(row&&row.id,row&&row.post_id));if(id&&by[id]){var next=by[id];delete by[id];return next;}return row;});
    Object.keys(by).forEach(function(id){merged.push(by[id]);});
    merged.sort(function(a,b){return (Date.parse(C.first(b.created_at,b.createdAt,0))||0)-(Date.parse(C.first(a.created_at,a.createdAt,0))||0);});
    state.pager.raw=merged;state.pager.seen={};
    merged.forEach(function(row){var id=C.clean(C.first(row&&row.id,row&&row.post_id));if(id)state.pager.seen[id]=1;});
    if(typeof state.pager.pruneInactiveCached==='function')await state.pager.pruneInactiveCached();
    merged=state.pager.raw.slice();
    Object.keys(temp.offsets||{}).forEach(function(col){state.pager.offsets[col]=Math.max(Number(state.pager.offsets[col]||0),Number(temp.offsets[col]||0));});
    if(temp.supported&&temp.supported.length)state.pager.supported=temp.supported.slice();
    Object.keys(temp.done||{}).forEach(function(col){if(temp.done[col])state.pager.done[col]=true;});
    state.items=merged.slice();state.pager.writeCache();renderItems(true);paintPostCount();
    return fresh||[];
  })();
  state.secondaryPostsPromise=task;
  try{return await task;}finally{if(state.secondaryPostsPromise===task)state.secondaryPostsPromise=null;}
}
async function loadReposts(){if(!postsAllowed()){var m=privacyGridMessage();setGridEmpty(m[0],m[1]);return;}var seq=state.seq;showGridSkeleton();var rows=await C.actionPosts(state.uid,'reposts');if(!alive(seq)||state.tab!=='reposts'||!postsAllowed())return;state.items=rows.filter(C.publicAllowed);renderItems(true);if(!state.items.length)setGridEmpty('Aucune republication','Les republications publiques apparaîtront ici.');}
async function switchTab(tab){tab=tab==='reposts'?'reposts':'posts';if(state.tab===tab&&state.items.length)return;state.tab=tab;syncLoadHint();document.querySelectorAll('.haProfileTab').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab);});if(tab==='posts')await loadPosts(true);else await loadReposts();}
function bindTabs(){document.querySelectorAll('.haProfileTab').forEach(function(b){b.addEventListener('click',function(){switchTab(b.dataset.tab);});});}
async function loadCounts(force){if(!state.frameVisible||!frameVisibleNowV869())return;var seq=state.seq,counts=await C.profileCounts(state.uid,true,!!force);if(!alive(seq)||!counts||!state.frameVisible||!frameVisibleNowV869())return;await waitSecondaryIdle();if(!alive(seq)||!state.frameVisible||!frameVisibleNowV869())return;state.postsTotal=Math.max(0,Number(counts.posts)||0);state.view.posts=state.postsTotal;state.view.followers=Math.max(0,Number(counts.followers)||0);state.view.following=Math.max(0,Number(counts.following)||0);state.view.likes=Math.max(0,Number(counts.likes)||0);paintPostCount();$('profileFollowers').textContent=privacy().showFollowers?C.compact(state.view.followers):'';$('profileFollowing').textContent=privacy().showFollowing?C.compact(state.view.following):'';$('profileLikes').textContent=C.compact(state.view.likes);applyPrivacyUi();}
function markScrollIntent(){var y=Math.max(0,window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0);if(y>state.lastScrollY+3)state.scrollIntent=Date.now();state.lastScrollY=y;}
function setupObserver(){if(state.observer)state.observer.disconnect();if(!state.scrollBound){state.scrollBound=true;window.addEventListener('scroll',markScrollIntent,{passive:true});}state.observer=new IntersectionObserver(async function(entries){if(!entries.some(function(e){return e.isIntersecting;}))return;if(Date.now()-state.scrollIntent>1800)return;if(state.tab==='posts'&&postsAllowed()&&state.pager&&(state.pager.groupedCount()>state.visibleLimit||state.pager.hasMore())&&!state.pageLoading){state.scrollIntent=0;await loadPosts(false);}},{root:null,rootMargin:'120px 0px',threshold:.01});state.observer.observe($('profileSentinel'));}
function paintFollow(){var b=$('followBtn');if(privateBlocked()&&!state.following){b.classList.remove('following');b.textContent='Compte privé';b.disabled=true;return;}b.disabled=false;b.classList.toggle('following',state.following);b.textContent=state.following?'✓ Abonné':'S’abonner';}
async function initFollow(){var seq=state.seq;if(!state.viewerUid||state.viewerUid===state.uid){$('followBtn').disabled=state.viewerUid===state.uid;$('followBtn').textContent=state.viewerUid===state.uid?'Votre profil':'S’abonner';return;}if(state.privacyKnown&&privacy().available){state.following=!!privacy().viewerIsFollower;if(alive(seq))paintFollow();return;}state.following=await C.isFollowing(state.viewerUid,state.uid);await waitSecondaryIdle();if(alive(seq))paintFollow();}
async function toggleFollow(){var b=$('followBtn');if(!state.viewerUid){guestNoticeV938();return;}if(state.viewerUid===state.uid)return;if(privateBlocked()&&!state.following){toast('Ce compte est privé. Les nouvelles demandes d’abonnement seront reliées à l’étape dédiée.');return;}b.disabled=true;try{var next=!state.following;await C.setFollowing(state.viewerUid,state.uid,next);state.following=next;paintFollow();await refreshPrivacy(true);await loadCounts(true);toast(next?'Abonnement enregistré':'Abonnement retiré');}catch(e){toast('Échec : '+(e.message||e));}finally{paintFollow();}}
function openMessage(){
  if(!state.uid)return;
  if(!state.viewerUid){guestNoticeV938();return;}
  var v=state.view||{},payload={
    id:state.uid,user_id:state.uid,
    name:v.name,full_name:v.name,
    username:v.handle,handle:v.handle,
    avatar:v.avatar,avatar_url:v.avatar,
    badge:v.badge,
    source:'visitor-profile-v855r77-direct-chat-shared'
  };
  try{
    localStorage.setItem('HAPPYAD_MESSAGE_TARGET_PROFILE',JSON.stringify(payload));
    sessionStorage.setItem('HAPPYAD_MESSAGE_TARGET_PROFILE',JSON.stringify(payload));
  }catch(_e){}

  /* V855R77 : ne plus naviguer directement l'iframe Profil visiteur vers une URL
     de conversation. Le maître Messages possède déjà son canal officiel
     HAPPYAD_NEW_MESSAGE_SYSTEM_REQUEST : il ouvre la surface Messages existante,
     attend sa frame prête puis lui livre le contexte direct par postMessage. */
  var detail={
    context_id:'visitor-message:'+state.uid+':'+Date.now(),
    source:'visitor-profile-v855r77-direct-chat-shared',
    mode:'direct',
    return_to:'visitor-profile',
    surface:'visitor-direct-chat',
    target:payload
  };
  try{
    if(window.parent&&window.parent!==window){
      window.parent.postMessage({type:'HAPPYAD_NEW_MESSAGE_SYSTEM_REQUEST',detail:detail},'*');
      return;
    }
  }catch(_e2){}

  /* Secours uniquement si le module est ouvert hors de la coque Fyblic.
     L'URL reste courte : l'avatar n'est jamais injecté dans la query string. */
  var q='mode=direct&target_id='+encodeURIComponent(state.uid)+
    '&target_name='+encodeURIComponent(v.name||'')+
    '&source=visitor-profile-v855r77-standalone'+
    '&return_to=visitor-profile'+
    '&context_id='+encodeURIComponent('visitor-message:'+state.uid)+
    '&v=855r77-direct-chat-shared';
  try{location.href='message-center.html?'+q;}catch(_e3){}
}
function happyadProfileAvatarUrlV992(){try{return C.clean(C.first(state.view&&state.view.avatar,state.profile&&state.profile.avatar_url,state.profile&&state.profile.avatar,state.profile&&state.profile.photo_url));}catch(_e){return '';}}
function happyadEnsureAvatarViewerV992(){
  var box=$('happyadProfileAvatarViewerV992');if(box)return box;
  box=document.createElement('div');box.id='happyadProfileAvatarViewerV992';box.setAttribute('aria-hidden','true');box.innerHTML='<button type="button" class="haProfileAvatarViewerBackV992" aria-label="Fermer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"></path></svg></button><div class="haProfileAvatarViewerStageV992"><img alt="Photo de profil"></div>';
  var st=document.createElement('style');st.id='happyadProfileAvatarViewerStyleV992';st.textContent='#happyadProfileAvatarViewerV992{position:fixed;inset:0;z-index:2147483000;background:#000;display:none;align-items:center;justify-content:center;overflow:hidden;overscroll-behavior:contain;-webkit-tap-highlight-color:transparent}#happyadProfileAvatarViewerV992.on{display:flex}#happyadProfileAvatarViewerV992 .haProfileAvatarViewerStageV992{position:absolute;inset:0;display:grid;place-items:center;padding:72px 0 40px}#happyadProfileAvatarViewerV992 img{display:block;width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;object-position:center;user-select:none;-webkit-user-drag:none}#happyadProfileAvatarViewerV992 .haProfileAvatarViewerBackV992{position:absolute;z-index:3;left:16px;top:calc(14px + env(safe-area-inset-top));width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:rgba(12,15,20,.72);color:#fff;display:grid;place-items:center;padding:0;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}#happyadProfileAvatarViewerV992 .haProfileAvatarViewerBackV992 svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}';document.head.appendChild(st);document.body.appendChild(box);
  var notify=function(type){try{window.parent&&window.parent!==window&&window.parent.postMessage({type:type,detail:{id:'profile-avatar-photo-v992',source:'visitor-profile-v992'}},'*');}catch(_e){}};
  var close=function(){var was=box.classList.contains('on');box.classList.remove('on');box.setAttribute('aria-hidden','true');var im=box.querySelector('img');if(im)im.removeAttribute('src');if(was)notify('HAPPYAD_INTERNAL_SCREEN_CLOSE_V591');};
  box.__happyadCloseV992=close;box.__happyadNotifyV992=notify;box.querySelector('.haProfileAvatarViewerBackV992').onclick=function(e){e.preventDefault();e.stopPropagation();close();};box.addEventListener('click',function(e){if(e.target===box||e.target.classList.contains('haProfileAvatarViewerStageV992'))close();});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&box.classList.contains('on')){e.preventDefault();close();}},true);window.addEventListener('message',function(e){var d=e&&e.data,detail=d&&d.detail||{};if(d&&d.type==='HAPPYAD_INTERNAL_BACK_EXECUTE_V591'&&String(detail.id||'')==='profile-avatar-photo-v992'&&box.classList.contains('on')){e.stopImmediatePropagation&&e.stopImmediatePropagation();close();}},true);return box;
}
function happyadOpenAvatarPhotoV992(){var url=happyadProfileAvatarUrlV992();if(!url)return false;var box=happyadEnsureAvatarViewerV992(),im=box.querySelector('img');im.src=url;box.classList.add('on');box.setAttribute('aria-hidden','false');try{box.__happyadNotifyV992&&box.__happyadNotifyV992('HAPPYAD_INTERNAL_SCREEN_OPEN_V591');}catch(_e){}return true;}
function happyadOpenStoryOrAvatarV992(e){if(e){try{e.preventDefault();e.stopPropagation();}catch(_e){}}if(storiesAllowed()&&state.story&&state.stories.length){openStory();return true;}return happyadOpenAvatarPhotoV992();}
function happyadBindAvatarInteractionV992(){var av=$('profileAvatar');if(!av||av.__happyadAvatarInteractionV992)return;av.__happyadAvatarInteractionV992=true;av.setAttribute('role','button');av.setAttribute('tabindex','0');av.addEventListener('click',happyadOpenStoryOrAvatarV992);av.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();happyadOpenStoryOrAvatarV992(e);}});}
function clearStory(){state.stories=[];state.story=null;state.storySeen=false;paintStoryRing();}
function paintStoryRing(){var w=$('profileAvatarWrap');if(!w)return;var has=storiesAllowed()&&!!(state.story&&state.stories.length);w.classList.toggle('has-story',has);w.classList.toggle('story-seen',has&&state.storySeen);$('profileAvatar').setAttribute('aria-label',has?(state.storySeen?'Ouvrir la story vue':'Ouvrir la nouvelle story'):'Photo de profil');}
async function setupStory(){if(!storiesAllowed()){clearStory();return;}var seq=state.seq,viewer=state.viewerUid,info=await C.profileStoryState(state.uid,viewer);if(!alive(seq)||!storiesAllowed())return;await waitSecondaryIdle();if(!alive(seq)||!storiesAllowed())return;state.stories=info.rows||[];state.story=info.story||null;state.storySeen=!!info.seen;paintStoryRing();happyadBindAvatarInteractionV992();if(!state.storyBound){state.storyBound=true;window.addEventListener('storage',function(e){if(e&&C.storySeenStorageKey&&e.key===C.storySeenStorageKey()&&state.stories.length){var apply=function(){state.storySeen=state.stories.every(function(x){return C.storySeenLocal(x);});paintStoryRing();};commitSecondary('story-storage',apply,60);}});}}
function openStory(){if(!storiesAllowed()||!state.story)return;if(state.viewerUid){C.markStorySeenLocal(C.storyId(state.story));state.storySeen=state.stories.length>0&&state.stories.every(function(x){return C.storySeenLocal(x);});paintStoryRing();}if(!C.openProfileStory(state.uid,state.story,state.profile))toast('Story indisponible');}
async function refreshPrivacy(forceContent){
  if(!P||!state.uid)return privacy();
  var seq=state.seq,old=privacy(),next=await P.load(state.uid);if(!alive(seq))return old;await waitSecondaryIdle();if(!alive(seq))return old;state.privacy=next;state.privacyKnown=true;state.following=!!next.viewerIsFollower;applyPrivacyUi();paintFollow();
  var postsChanged=!!old.postsAllowed!==!!next.postsAllowed||!!old.available!==!!next.available;
  var storyChanged=!!old.storiesAllowed!==!!next.storiesAllowed||!!old.available!==!!next.available;
  if(forceContent||postsChanged){if(next.postsAllowed){if(state.tab==='posts')loadPosts(true);else loadReposts();}else{state.items=[];state.pager=null;var m=privacyGridMessage();setGridEmpty(m[0],m[1]);}}
  if(forceContent||storyChanged){if(next.storiesAllowed)setupStory();else clearStory();}
  return next;
}
function realtimeActionTouchesLoadedPostV869(payload){var row=payload&&((payload.new&&Object.keys(payload.new).length&&payload.new)||payload.old)||{},id=C.clean(C.first(row.post_id,row.content_id));if(!id)return false;var source=state.pager&&Array.isArray(state.pager.raw)?state.pager.raw:state.items;return (source||[]).some(function(post){if(C.clean(C.first(post&&post.id,post&&post.post_id,post&&post.__actionId))===id)return true;return Array.isArray(post&&post.__albumItems)&&post.__albumItems.some(function(item){return C.clean(C.first(item&&item.id,item&&item.post_id))===id;});});}
function setupRealtime(){if(!state.frameVisible||!frameVisibleNowV869()||state.channel)return;var c=C.client();if(!c||!c.channel)return;try{var ch=c.channel('profile-visitor-v869-'+state.uid);if(postsAllowed())ch=ch.on('postgres_changes',{event:'*',schema:'public',table:'happyad_posts'},function(payload){var row=payload&&((payload.new&&Object.keys(payload.new).length&&payload.new)||payload.old)||{};if(!C.belongsTo(row,state.uid))return;scheduleRefresh();});ch=ch.on('postgres_changes',{event:'*',schema:'public',table:'happyad_follows'},function(payload){var row=payload&&((payload.new&&Object.keys(payload.new).length&&payload.new)||payload.old)||{};if(C.clean(row.creator_id)!==state.uid&&C.clean(row.follower_id)!==state.uid)return;schedulePrivacyRefresh();scheduleCountRefresh();}).on('postgres_changes',{event:'*',schema:'public',table:'happyad_content_actions'},function(payload){if(!realtimeActionTouchesLoadedPostV869(payload))return;scheduleCountRefresh();}).on('postgres_changes',{event:'*',schema:'public',table:'profiles',filter:'id=eq.'+state.uid},function(){scheduleIdentityRefresh();});if(storiesAllowed())ch=ch.on('postgres_changes',{event:'*',schema:'public',table:'happyad_stories',filter:'user_id=eq.'+state.uid},function(){scheduleStoryRefresh();});state.channel=ch.subscribe();}catch(_e){}
}
function scheduleCountRefresh(){if(!state.frameVisible||!frameVisibleNowV869())return;clearTimeout(state.countTimer);state.countTimer=setTimeout(function(){nonPriority('count',function(){if(alive(state.seq)&&state.frameVisible&&frameVisibleNowV869())loadCounts(true);},60);},180);}
function scheduleRefresh(){if(!state.frameVisible||!frameVisibleNowV869())return;clearTimeout(state.refreshTimer);state.refreshTimer=setTimeout(function(){nonPriority('post-refresh',function(){if(!state.frameVisible||!frameVisibleNowV869())return;if(state.tab==='posts'&&postsAllowed())refreshFirstPageSecondary();scheduleCountRefresh();},70);},160);}
function scheduleStoryRefresh(){if(!state.frameVisible||!frameVisibleNowV869())return;clearTimeout(state.storyRefreshTimer);state.storyRefreshTimer=setTimeout(function(){nonPriority('story',function(){if(state.frameVisible&&frameVisibleNowV869()&&storiesAllowed())setupStory();},60);},100);}
function schedulePrivacyRefresh(){if(!state.frameVisible||!frameVisibleNowV869())return;clearTimeout(state.privacyRefreshTimer);state.privacyRefreshTimer=setTimeout(function(){nonPriority('privacy',function(){if(state.frameVisible&&frameVisibleNowV869())refreshPrivacy(false);},70);},120);}
function scheduleIdentityRefresh(){if(!state.frameVisible||!frameVisibleNowV869())return;clearTimeout(state.identityTimer);state.identityTimer=setTimeout(function(){nonPriority('identity',async function(){if(!state.frameVisible||!frameVisibleNowV869())return;var seq=state.seq,p=await C.fetchProfile(state.uid,'visitor',function(){return alive(seq)&&state.frameVisible;});if(!p||!alive(seq)||!state.frameVisible)return;await waitSecondaryIdle();if(p&&alive(seq)&&state.frameVisible&&frameVisibleNowV869())paintIdentity(p);},70);},120);}
function cleanup(){state.destroyed=true;state.seq++;suspendHiddenV869();}
function viewerUidHintV855R73(){try{if(localStorage.getItem('HAPPYAD_SESSION_ACTIVE')!=='1')return '';return C.clean(localStorage.getItem('HAPPYAD_AUTH_UID'));}catch(_e){return '';}}
function activeWarmIdentityV855R73(uid){try{var p=C.readJson(localStorage,'HAPPYAD_ACTIVE_PROFILE',null);return p&&C.objectUid(p)===uid?p:null;}catch(_e){return null;}}
function announceReadyV855R73(){if(state.readySent)return;state.readySent=true;setBootOff();C.notifyReady('visitor',state.uid);}
async function init(){
  C.pageRedirect('visitor');document.body.dataset.profileMode='visitor';state.frameVisible=frameVisibleNowV869();state.uid=C.routeUid();if(!state.uid){setBootOff();setGridEmpty('Profil introuvable','L’identifiant du profil manque.');C.notifyReady('visitor','');return;}try{var discovery=window.HappyAccountDiscoveryV855R53;if(discovery&&discovery.applyRobots)discovery.applyRobots(state.uid).catch(function(){});}catch(_robots){}
  var seq=++state.seq;state.viewerUid=viewerUidHintV855R73();if(state.viewerUid&&state.viewerUid===state.uid){try{window.parent&&window.parent!==window?window.parent.postMessage({type:'HAPPYAD_OPEN_INTERNAL_URL',url:'modules/my-profile.html',extra:{page:'profile',replace:true,source:'visitor-own-redirect-v855r73'}},'*'):location.replace('my-profile.html');}catch(_e){}return;}
  var cached=C.readJson(localStorage,C.cacheKey('visitor',state.uid,'IDENTITY'),null)||activeWarmIdentityV855R73(state.uid),hadCachedIdentity=!!cached;if(hadCachedIdentity){paintIdentity(cached);}else{state.profile={id:state.uid,user_id:state.uid};state.view=C.profileView(state.profile);}bindTabs();$('followBtn').addEventListener('click',toggleFollow);$('messageBtn').addEventListener('click',openMessage);setupObserver();showGridSkeleton();
  /* R73 : si l'identité vient de la carte Accueil, le Profil visiteur est rendu
     tout de suite. Auth, confidentialité et Supabase continuent en parallèle. */
  if(cached)announceReadyV855R73();
  var authPromise=C.authUser(),privacyPromise=P?P.load(state.uid):Promise.resolve(privacyFallback()),profilePromise=C.fetchProfile(state.uid,'visitor',function(){return alive(seq);});
  authPromise.then(function(user){if(!alive(seq))return;state.viewerUid=C.clean(user&&user.id)||state.viewerUid;if(state.viewerUid&&state.viewerUid===state.uid){try{window.parent&&window.parent!==window?window.parent.postMessage({type:'HAPPYAD_OPEN_INTERNAL_URL',url:'modules/my-profile.html',extra:{page:'profile',replace:true,source:'visitor-own-auth-confirm-v855r73'}},'*'):location.replace('my-profile.html');}catch(_e){}}}).catch(function(){});
  state.privacy=await privacyPromise;if(!alive(seq))return;state.privacyKnown=true;state.following=!!privacy().viewerIsFollower;applyPrivacyUi();paintFollow();
  var postsPromise=postsAllowed()?loadPosts(true):(function(){var m=privacyGridMessage();setGridEmpty(m[0],m[1]);return Promise.resolve([]);})();
  var p=await profilePromise;if(!alive(seq))return;if(hadCachedIdentity)await waitSecondaryIdle();if(!alive(seq))return;if(p)paintIdentity(p);announceReadyV855R73();state.frameVisible=frameVisibleNowV869();if(state.frameVisible)setupRealtime();
  postsPromise.finally(function(){if(!alive(seq)||!state.frameVisible||!frameVisibleNowV869())return;nonPriority('initial-secondary',function(){if(!alive(seq)||!state.frameVisible||!frameVisibleNowV869())return;authPromise.finally(function(){if(alive(seq)&&state.frameVisible&&frameVisibleNowV869()){loadCounts(true);initFollow();setupStory();}});},40);});
  window.addEventListener('focus',function(){if(frameVisibleNowV869())resumeVisibleV869();});document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&frameVisibleNowV869())resumeVisibleV869();else if(document.visibilityState!=='visible')suspendHiddenV869();});
}
$('profileBack').addEventListener('click',function(e){e.preventDefault();C.requestBack();});window.addEventListener('message',function(event){var data=event&&event.data;if(!data||typeof data!=='object')return;if(data.type==='HAPPYAD_APP_FRAME_HIDDEN')suspendHiddenV869();else if(data.type==='HAPPYAD_APP_FRAME_VISIBLE'||data.type==='HAPPYAD_PROFILE_SHOW_VISITOR_V649')resumeVisibleV869();},true);window.addEventListener('storage',function(e){if(!e||e.key!=='HAPPYAD_DELETED_POST_IDS_V1'||!state.pager)return;state.items=state.pager.raw.filter(function(row){return !C.isDeleted(row);});state.pager.raw=state.items.slice();state.pager.seen={};state.pager.raw.forEach(function(row){var id=C.clean(C.first(row&&row.id,row&&row.post_id));if(id)state.pager.seen[id]=1;});renderItems(true);paintPostCount();scheduleRefresh();},false);window.addEventListener('HAPPYAD_PROFILE_AVATAR_UPDATED_V855R32',function(event){var d=event&&event.detail||{};if(!state.uid||C.clean(d.uid)!==state.uid||d.known!==true)return;nonPriority('avatar',function(){if(!state.uid||C.clean(d.uid)!==state.uid)return;state.profile=Object.assign({},state.profile||{},{id:state.uid,user_id:state.uid,avatar:d.avatarUrl||'',avatar_url:d.avatarUrl||'',__happyadAvatarKnownV855R32:true});paintIdentity(state.profile);},50);});window.addEventListener('pagehide',cleanup,{once:true});window.addEventListener('beforeunload',cleanup,{once:true});
window.HappyVisitorProfileV855R50={init:init,state:state,destroy:cleanup,loadMore:function(){return loadPosts(false);},refreshPrivacy:refreshPrivacy};window.HappyVisitorProfileV855R7=window.HappyVisitorProfileV855R50;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
