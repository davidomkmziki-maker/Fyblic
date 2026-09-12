(function(){
'use strict';
if(window.HappyOwnerProfileV855R32)return;
var C=window.HappyProfileCoreV855R6||window.HappyProfileCoreV855R5||window.HappyProfileCoreV855R4||window.HappyProfileCoreV855R3||window.HappyProfileCoreV855R2||window.HappyProfileCoreV855||window.HappyProfileCoreV854;if(!C)return;
var A=window.HappyProfileAvatarMasterV855R32||window.HappyProfileAvatarMaster||null;
var S=window.HappyProfileScrollPriorityV866||window.HappyProfileScrollPriorityV865||null;
var state={uid:'',profile:null,view:null,postsTotal:null,seq:0,pager:null,items:[],rendered:new Set(),observer:null,channel:null,tab:'posts',story:null,stories:[],storySeen:false,storyBound:false,destroyed:false,refreshTimer:0,countTimer:0,identityTimer:0,storyRefreshTimer:0,postsRetryTimer:0,postsRetryCount:0,postsEmptyConfirmations:0,visibleLimit:12,pageStep:12,pageLoading:false,scrollIntent:0,lastScrollY:0,scrollBound:false,uiBound:false,authBound:false,authTimer:0,initPromise:null,authSubscription:null,frameVisible:false,warmOnly:false,fullRuntime:false,secondaryPostsPromise:null};
function $(id){return document.getElementById(id);}
function setTextStable(id,value){var el=typeof id==='string'?$(id):id;if(!el)return false;value=String(value==null?'':value);if(el.textContent===value)return false;el.textContent=value;return true;}
function alive(seq){return !state.destroyed&&seq===state.seq;}
function toast(msg){var t=$('profileToast');if(!t)return;clearTimeout(t.__timer);t.textContent=String(msg||'');t.classList.add('on');t.__timer=setTimeout(function(){t.classList.remove('on');},2400);}
function nonPriority(key,fn,delay){if(typeof fn!=='function')return false;var k='owner-'+String(key||'job');if(S&&typeof S.run==='function')return S.run(k,fn,delay==null?60:delay);setTimeout(fn,Math.max(0,Number(delay)||0));return true;}
async function waitSecondaryIdle(){if(S&&typeof S.whenIdle==='function')try{await S.whenIdle();}catch(_e){}}
function commitSecondary(key,fn,delay){if(typeof fn!=='function')return false;var k='owner-'+String(key||'commit');if(S&&typeof S.commit==='function')return S.commit(k,fn,delay==null?70:delay);return nonPriority(key,fn,delay);}
function cancelNonPriority(){if(!S||typeof S.cancel!=='function')return;['activate','count','post-refresh','initial-post-refresh','story','story-storage','identity','avatar','identity-paint','grid-empty','grid-items-reset','grid-items-append','grid-skeleton'].forEach(function(k){S.cancel('owner-'+k);});}
function paintIdentity(p){state.profile=p||{};state.view=C.profileView(state.profile);var v=state.view,counts=C.cachedProfileCounts&&C.cachedProfileCounts(state.uid,false);if(counts){state.postsTotal=counts.posts;v.posts=counts.posts;v.followers=counts.followers;v.following=counts.following;v.likes=counts.likes;}else state.postsTotal=null;if(S&&typeof S.isActive==='function'&&S.isActive()){commitSecondary('identity-paint',function(){paintIdentity(state.profile);},50);return v;}setTextStable('profileName',v.name);setTextStable('profileHandle',v.handle?'@'+v.handle:'');setTextStable('profileBio',v.bio||'');setTextStable('profileType',v.type||'Personnel');setTextStable('profilePostsCount',counts?C.compact(counts.posts):'…');setTextStable('profileFollowers',counts?C.compact(counts.followers):'…');setTextStable('profileFollowing',counts?C.compact(counts.following):'…');setTextStable('profileLikes',counts?C.compact(counts.likes):'…');var av=$('profileAvatar'),current=av&&av.children&&av.children.length===1&&av.firstElementChild&&av.firstElementChild.tagName==='IMG'?av.firstElementChild:null;if(v.avatar){if(!current||current.getAttribute('src')!==v.avatar){var im=document.createElement('img');im.src=v.avatar;im.alt='';im.decoding='async';av.replaceChildren(im);}}else if(current||av.textContent!=='👤')av.textContent='👤';var badge=$('profileBadge'),badgeHtml=C.badgeHtml(v.badge);if(badge&&badge.innerHTML!==badgeHtml)badge.innerHTML=badgeHtml;return v;}
function paintPostCount(){var hasExact=state.postsTotal!==null&&state.postsTotal!==undefined&&Number.isFinite(Number(state.postsTotal)),value;if(hasExact)value=Math.max(0,Number(state.postsTotal));else if(state.pager&&!state.pager.hasMore()){value=C.groupPosts(state.pager.raw||[]).length;state.postsTotal=value;}else{setTextStable('profilePostsCount','…');return null;}if(state.view)state.view.posts=value;setTextStable('profilePostsCount',C.compact(value));return value;}
function syncLoadHint(){
  var h=$('profileLoadHint');if(!h)return false;
  var eligible=state.tab==='posts'||state.tab==='private';
  var grouped=state.pager?C.groupPosts(state.pager.raw||[]):C.groupPosts(state.items||[]);
  var shown=Math.min(grouped.length,Math.max(0,Number(state.visibleLimit)||0));
  var more=!!(state.pageLoading||(state.pager&&(grouped.length>shown||state.pager.hasMore())));
  var on=!!(eligible&&shown>0&&more&&(state.frameVisible||frameVisibleNow()));
  h.classList.toggle('on',on);h.setAttribute('aria-hidden',on?'false':'true');
  return on;
}
function setBootOff(){var b=$('profileBoot');if(b)b.classList.add('off');}
function setGridEmpty(title,text){if(S&&typeof S.isActive==='function'&&S.isActive()){commitSecondary('grid-empty',function(){setGridEmpty(title,text);},60);return;}var g=$('profileGrid');g.innerHTML='<div class="haProfileEmpty"><b>'+C.esc(title)+'</b><span>'+C.esc(text||'')+'</span></div>';var h=$('profileLoadHint');if(h){h.classList.remove('on');h.setAttribute('aria-hidden','true');}}
function setPrivateUi(on){on=!!on;try{document.body.classList.toggle('haProfileGuestV855R23',!on);}catch(_e){}['openSettings','openStats','openEdit','profileAvatarEdit'].forEach(function(id){var el=$(id);if(el)el.hidden=!on;});var tabs=document.querySelector('.haProfileTabs'),sentinel=$('profileSentinel'),hint=$('profileLoadHint');if(tabs)tabs.hidden=!on;if(sentinel)sentinel.hidden=!on;if(hint&&!on){hint.classList.remove('on');hint.setAttribute('aria-hidden','true');}}
function closeAllModals(){try{var h=window.HappyProfileEditHostV855R32||window.HappyProfileEditHostV855R31;if(h&&typeof h.close==='function')h.close({reason:'profile-state-reset',focus:false,restoreScroll:false,force:true});}catch(_e){}}
function frameVisibleNow(){try{if(document.hidden)return false;if(window.parent===window)return true;var f=window.frameElement;if(!f)return true;return f.getAttribute('aria-hidden')!=='true'&&!f.hasAttribute('inert')&&f.classList.contains('on');}catch(_e){return !document.hidden;}}
function stopProfileRealtime(){var c=C.client();if(c&&state.channel){try{c.removeChannel(state.channel);}catch(_e){try{state.channel.unsubscribe();}catch(_x){}}}state.channel=null;}
function stopAuthSubscription(){try{if(state.authSubscription&&typeof state.authSubscription.unsubscribe==='function')state.authSubscription.unsubscribe();}catch(_e){}state.authSubscription=null;}
function suspendVisibleRuntime(){state.frameVisible=false;state.fullRuntime=false;clearTimeout(state.refreshTimer);clearTimeout(state.countTimer);clearTimeout(state.identityTimer);clearTimeout(state.storyRefreshTimer);clearTimeout(state.postsRetryTimer);state.postsRetryTimer=0;cancelNonPriority();if(state.observer){try{state.observer.disconnect();}catch(_e){}state.observer=null;}stopProfileRealtime();stopAuthSubscription();}
function releaseRuntime(){state.seq++;suspendVisibleRuntime();clearTimeout(state.authTimer);state.postsRetryCount=0;state.postsEmptyConfirmations=0;state.pageLoading=false;state.pager=null;state.items=[];state.rendered.clear();state.postsTotal=null;state.story=null;state.stories=[];state.storySeen=false;}
function paintGuestState(){releaseRuntime();state.uid='';state.profile=null;state.view=null;state.tab='posts';setPrivateUi(false);closeAllModals();var av=$('profileAvatar');if(av){av.replaceChildren();av.textContent='👤';}var badge=$('profileBadge');if(badge)badge.innerHTML='';$('profileName').textContent='Mon profil';$('profileHandle').textContent='';$('profileBio').textContent='';$('profileType').textContent='Invité';['profilePostsCount','profileFollowers','profileFollowing','profileLikes'].forEach(function(id){var el=$(id);if(el)el.textContent='—';});setGridEmpty('Connexion requise','Connecte-toi pour ouvrir Mon profil.');setBootOff();C.notifyReady('owner','');}
function removeLegacySettingsUi(){try{document.querySelectorAll('.haProfileSettingsList,#settingsModal').forEach(function(node){node.remove();});}catch(_e){}}
function bindUiOnce(){if(state.uiBound)return;state.uiBound=true;removeLegacySettingsUi();bindTabs();bindActions();bindSettings();}
function scheduleAuthSync(detail,source){detail=detail&&typeof detail==='object'?detail:{};clearTimeout(state.authTimer);state.authTimer=setTimeout(function(){if(state.destroyed)return;var authenticated=!!detail.authenticated,uid=C.clean(detail.user_id||detail.user&&detail.user.id);if(authenticated){if(uid&&uid===state.uid&&state.profile){setPrivateUi(true);if(state.frameVisible&&state.fullRuntime)scheduleCountRefresh();return;}init({force:true,source:source||detail.event||'signed-in',visible:state.frameVisible});}else{paintGuestState();try{window.parent&&window.parent!==window&&window.parent.postMessage({type:'HAPPYAD_PROFILE_AUTH_SIGNED_OUT_V855R23',source:'owner-profile-v855r23'},'*');}catch(_e){} }},authenticatedDelay(detail));}
function authenticatedDelay(detail){return detail&&detail.authenticated?40:0;}
function ensureAuthSubscription(){if(state.authSubscription)return;var c=C.client();try{if(c&&c.auth&&typeof c.auth.onAuthStateChange==='function'){var sub=c.auth.onAuthStateChange(function(event,next){var u=next&&next.user;scheduleAuthSync({authenticated:!!(u&&u.id),user_id:u&&u.id||'',user:u||null,event:event||'AUTH_CHANGE'},'iframe-auth-change');});state.authSubscription=sub&&sub.data&&sub.data.subscription||sub&&sub.subscription||null;}}catch(_e){}}
function activateVisibleRuntime(source){var wasWarm=state.warmOnly===true;state.frameVisible=true;state.warmOnly=false;ensureAuthSubscription();if(!state.uid||!state.profile)return false;if(wasWarm){paintIdentity(state.profile);if(state.items.length)renderItems(true);else showGridSkeleton();setBootOff();C.notifyReady('owner',state.uid);}if(!state.fullRuntime){state.postsRetryCount=0;state.fullRuntime=true;setupObserver();setupRealtime();scheduleIdentityRefresh();nonPriority('activate',function(){if(state.frameVisible&&state.fullRuntime&&state.uid){loadCounts(true);setupStory();if(state.items.length)refreshFirstPageSecondary();else loadMainPosts(true,{forceNetwork:true,reason:'visible-first-12'}).catch(function(){});}},40);}return true;}
function bindAuthLifecycle(){if(state.authBound)return;state.authBound=true;window.addEventListener('message',function(ev){var d=ev&&ev.data;if(!d)return;if(d.type==='HAPPYAD_AUTH_SIGNED_IN_V595')scheduleAuthSync(d.detail||{},'parent-signed-in');else if(d.type==='HAPPYAD_AUTH_SIGNED_OUT_V595')scheduleAuthSync(d.detail||{},'parent-signed-out');else if(d.type==='HAPPYAD_STORIES_MASTER_SYNC_V924'){if(state.uid)setupStory({cacheOnly:true,allowHidden:true,source:'parent-master-sync-v924'});}else if(d.type==='HAPPYAD_APP_FRAME_HIDDEN'){suspendVisibleRuntime();}else if(d.type==='HAPPYAD_APP_FRAME_VISIBLE'||d.type==='HAPPYAD_PROFILE_SHOW_OWNER_V649'){activateVisibleRuntime(d.source||'frame-visible');C.authUser().then(function(u){if(u&&u.id&&C.clean(u.id)!==state.uid)scheduleAuthSync({authenticated:true,user_id:u.id,user:u},'frame-visible');else if(!u&&state.uid)scheduleAuthSync({authenticated:false},'frame-visible-signed-out');else if(u&&u.id)activateVisibleRuntime('frame-visible-auth-ok');}).catch(function(){});}},true);window.addEventListener('storage',function(e){if(!state.uid||!e)return;if(e.key==='HAPPYAD_STORIES_MASTER_READY_V924'||(C.storyCacheStorageKey&&e.key===C.storyCacheStorageKey()))setupStory({cacheOnly:true,allowHidden:true,source:'storage-master-sync-v924'});else if(e.key==='HAPPYAD_DELETED_POST_IDS_V1'&&state.pager){state.items=state.pager.raw.filter(function(row){return !C.isDeleted(row);});state.pager.raw=state.items.slice();state.pager.seen={};state.pager.raw.forEach(function(row){var id=C.clean(C.first(row&&row.id,row&&row.post_id));if(id)state.pager.seen[id]=1;});renderItems(true);paintPostCount();scheduleRefresh();}},false);if(frameVisibleNow())ensureAuthSubscription();try{window.parent&&window.parent!==window&&window.parent.postMessage({type:'HAPPYAD_AUTH_FRAME_READY_V595'},'*');}catch(_e2){}}

function groupedVisibleItems(rows){return C.groupPosts(rows||[]).slice(0,Math.max(0,state.visibleLimit));}
function gridVisualKey(p){var album=Array.isArray(p&&p.__albumItems)?p.__albumItems.map(function(x){return C.clean(C.first(x&&x.id,x&&x.post_id));}):[];return JSON.stringify([C.clean(C.first(p&&p.id,p&&p.post_id)),C.isMarketplace(p)?1:0,C.isVideo(p)?1:0,C.postPoster(p)||'',C.postMedia(p)||'',state.tab==='private'&&C.isPrivate(p)?1:0,album]);}
function gridVisualSignature(rows){return JSON.stringify(groupedVisibleItems(rows).map(gridVisualKey));}
function createOwnerTile(p,key){var tile=C.createTile(p,{showPrivate:state.tab==='private'});tile.__happyadProfileVisualKeyV870=key||gridVisualKey(p);tile.addEventListener('click',function(){var post=this.__happyadPost;C.openPost(post,C.groupPosts(state.items),'owner-profile-v855r4',{mode:'owner',uid:state.uid,profile:state.profile,view:state.view});});return tile;}
function visibleGridAnchor(g){if(!g||Math.max(0,window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0)<1)return null;var nodes=g.querySelectorAll('.haProfileTile'),limit=Math.max(0,Number(window.innerHeight)||0);for(var i=0;i<nodes.length;i++){var rect=nodes[i].getBoundingClientRect();if(rect.bottom>54&&rect.top<limit)return{id:C.clean(nodes[i].dataset&&nodes[i].dataset.postId),top:rect.top};}return null;}
function restoreVisibleGridAnchor(anchor,nodes){if(!anchor||!anchor.id)return;var node=(nodes||[]).find(function(x){return C.clean(x&&x.dataset&&x.dataset.postId)===anchor.id;});if(!node||!node.isConnected)return;var delta=node.getBoundingClientRect().top-anchor.top;if(Math.abs(delta)>.5)try{window.scrollBy(0,delta);}catch(_e){}}
function syncRenderedPostReferences(grouped){var by={};(grouped||groupedVisibleItems(state.items)).forEach(function(p){var id=C.clean(C.first(p&&p.id,p&&p.post_id));if(id)by[id]=p;});var g=$('profileGrid');if(!g)return;g.querySelectorAll('.haProfileTile[data-post-id]').forEach(function(tile){var p=by[C.clean(tile.dataset&&tile.dataset.postId)];if(p)tile.__happyadPost=p;});}
/* V870 : réconciliation par identifiant. Une réponse réseau identique ne
   détruit plus les images et les cartes déjà peintes. Si une vraie publication
   arrive, seules les cartes concernées bougent et l'ancre visuelle est conservée. */
function renderItems(reset){if(S&&typeof S.isActive==='function'&&S.isActive()){commitSecondary(reset?'grid-items-reset':'grid-items-append',function(){renderItems(reset);},60);return 0;}var g=$('profileGrid');if(!g)return 0;var grouped=groupedVisibleItems(state.items),existing={},desired=[],nextRendered=new Set(),added=0,changed=false,anchor=visibleGridAnchor(g);g.querySelectorAll('.haProfileTile[data-post-id]').forEach(function(tile){var id=C.clean(tile.dataset&&tile.dataset.postId);if(id&&!existing[id])existing[id]=tile;});for(var i=0;i<grouped.length;i++){var p=grouped[i],id=C.clean(C.first(p&&p.id,p&&p.post_id));if(!id||nextRendered.has(id))continue;var key=gridVisualKey(p),tile=existing[id];if(!tile||tile.__happyadProfileVisualKeyV870!==key){tile=createOwnerTile(p,key);added++;changed=true;}else tile.__happyadPost=p;desired.push(tile);nextRendered.add(id);}for(var j=0;j<desired.length;j++){var current=g.children[j]||null;if(current!==desired[j]){g.insertBefore(desired[j],current);changed=true;}}while(g.children.length>desired.length){g.removeChild(g.lastElementChild);changed=true;}state.rendered.clear();nextRendered.forEach(function(id){state.rendered.add(id);});if(changed)restoreVisibleGridAnchor(anchor,desired);if(!state.rendered.size&&!state.pager?.loading)setGridEmpty(state.tab==='posts'?'Aucune publication':state.tab==='private'?'Aucune publication privée':state.tab==='saved'?'Aucun favori':'Aucune republication','Le contenu apparaîtra ici.');syncLoadHint();return added;}
function showGridSkeleton(){if(S&&typeof S.isActive==='function'&&S.isActive()){commitSecondary('grid-skeleton',showGridSkeleton,60);return;}var g=$('profileGrid');if(!g)return;g.innerHTML='';state.rendered.clear();var h=$('profileLoadHint');if(h){h.classList.remove('on');h.setAttribute('aria-hidden','true');}for(var i=0;i<12;i++){var d=document.createElement('div');d.className='haSkTile';d.setAttribute('aria-hidden','true');g.appendChild(d);}}
function clearPostsRetry(resetCount){clearTimeout(state.postsRetryTimer);state.postsRetryTimer=0;if(resetCount!==false)state.postsRetryCount=0;}
function schedulePostsRetry(seq){
  if(!alive(seq)||C.groupPosts(state.items||[]).length>=state.visibleLimit||!(state.frameVisible||frameVisibleNow()))return false;
  if(state.postsRetryTimer||state.postsRetryCount>=3)return false;
  var delays=[650,1400,2800],delay=delays[Math.min(state.postsRetryCount,delays.length-1)];
  state.postsRetryCount++;
  state.postsRetryTimer=setTimeout(function(){
    state.postsRetryTimer=0;
    if(!alive(seq)||!(state.frameVisible||frameVisibleNow()))return;
    if(state.pageLoading){schedulePostsRetry(seq);return;}
    loadMainPosts(true,{forceNetwork:true,reason:'first-12-retry'}).catch(function(){});
  },delay);
  return true;
}
async function loadMainPosts(reset,options){
  options=options||{};
  var requestedTab=state.tab;
  /* La pagination attend la fin d'une relecture de la première page. Les deux
     chemins ne peuvent plus modifier pager.raw et la grille au même moment. */
  if(!reset&&state.secondaryPostsPromise){try{await state.secondaryPostsPromise;}catch(_e){}if(state.tab!==requestedTab)return [];}
  if(state.pageLoading)return [];
  var seq=state.seq;state.pageLoading=true;syncLoadHint();
  try{
    var cachedEnough=false;
    if(reset){
      state.visibleLimit=state.pageStep;
      state.pager=new C.PostPager({uid:state.uid,mode:'owner',filter:state.tab==='private'?'private':'posts',pageSize:12,requestAlive:function(){return alive(seq);}});
      state.items=[];state.rendered.clear();
      var cached=state.pager.readCache();state.pager.seed(cached);state.items=state.pager.raw.slice();
      cachedEnough=C.groupPosts(state.items).length>=state.visibleLimit;
      /* Une frame Profil préchargée reste strictement cache-only. Les lectures
         Supabase et même la création des <img> des 12 cartes démarrent seulement
         après FRAME_VISIBLE. Lire le cache en mémoire ne déclenche aucun média. */
      if(options.cacheOnly===true)return [];
      if(state.items.length)renderItems(true);else showGridSkeleton();
      if(cachedEnough&&options.forceNetwork!==true){
        clearPostsRetry();paintPostCount();
        if(state.frameVisible||frameVisibleNow())nonPriority('initial-post-refresh',refreshFirstPageSecondary,140);
        return [];
      }
    }else state.visibleLimit+=state.pageStep;

    var added=await state.pager.ensureGroupedCount(state.visibleLimit,!!reset);
    if(!alive(seq))return [];
    var fetchState=state.pager.lastFetch||{};
    if(reset&&fetchState.ok===true&&state.pager&&typeof state.pager.pruneInactiveCached==='function')await state.pager.pruneInactiveCached();
    if(!alive(seq))return [];
    if(options.secondary===true){await waitSecondaryIdle();if(!alive(seq)||!state.frameVisible||!state.fullRuntime)return [];}
    state.items=state.pager.raw.slice();
    var available=C.groupPosts(state.items).length;

    /* Une erreur temporaire conserve les cartes déjà connues. Sans cache, les
       douze squelettes restent affichés : "Aucune publication" n'est montré
       qu'après une réponse Supabase réellement réussie. */
    if(fetchState.retryable===true&&available<state.visibleLimit){
      state.postsEmptyConfirmations=0;
      if(state.items.length)renderItems(!!reset);else showGridSkeleton();
      paintPostCount();schedulePostsRetry(seq);return added;
    }

    if(!available&&fetchState.ok===true){
      state.postsEmptyConfirmations++;
      if(state.postsEmptyConfirmations<2){showGridSkeleton();paintPostCount();schedulePostsRetry(seq);return added;}
    }else if(available)state.postsEmptyConfirmations=0;

    clearPostsRetry();
    if(!state.pager.hasMore()&&state.visibleLimit>available)state.visibleLimit=available;
    renderItems(!!reset);paintPostCount();
    if(!added.length&&!state.items.length)setGridEmpty(state.tab==='private'?'Aucune publication privée':'Aucune publication','Publie du contenu pour le retrouver ici.');
    return added;
  }finally{state.pageLoading=false;syncLoadHint();}
}
async function refreshFirstPageSecondary(){
  if(state.secondaryPostsPromise)return state.secondaryPostsPromise;
  if(state.pageLoading)return [];
  if(!state.uid||!state.frameVisible||!state.fullRuntime||!(state.tab==='posts'||state.tab==='private'))return [];
  var task=(async function(){
    var seq=state.seq,tab=state.tab,filter=tab==='private'?'private':'posts';
    var temp=new C.PostPager({uid:state.uid,mode:'owner',filter:filter,pageSize:12,cacheWrites:false,requestAlive:function(){return alive(seq)&&state.frameVisible&&state.fullRuntime&&state.tab===tab;}});
    var fresh=await temp.fetchMore();
    if(!alive(seq)||!state.frameVisible||!state.fullRuntime||state.tab!==tab)return [];
    if(state.pageLoading)return [];
    if(temp.lastFetch&&temp.lastFetch.retryable===true&&temp.lastFetch.ok!==true){
      if(!state.items.length)showGridSkeleton();
      schedulePostsRetry(seq);return [];
    }
    await waitSecondaryIdle();
    if(!alive(seq)||!state.frameVisible||!state.fullRuntime||state.tab!==tab||state.pageLoading)return [];
    if(!state.pager||state.pager.filter!==filter)return [];
    var beforeSignature=gridVisualSignature(state.pager.raw||[]);
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
    state.items=merged.slice();state.pager.writeCache();if(state.items.length)clearPostsRetry();var afterSignature=gridVisualSignature(merged);if(beforeSignature===afterSignature)syncRenderedPostReferences(groupedVisibleItems(merged));else renderItems(true);paintPostCount();
    return fresh||[];
  })();
  state.secondaryPostsPromise=task;
  try{return await task;}finally{if(state.secondaryPostsPromise===task)state.secondaryPostsPromise=null;}
}
async function loadAux(tab){var seq=state.seq;showGridSkeleton();var rows=await C.actionPosts(state.uid,tab);if(!alive(seq)||state.tab!==tab)return;state.items=rows;renderItems(true);if(!rows.length)setGridEmpty(tab==='saved'?'Aucun favori':'Aucune republication','Les publications enregistrées apparaîtront ici.');}
async function switchTab(tab){tab=['posts','saved','private','reposts'].indexOf(tab)>=0?tab:'posts';if(state.tab===tab&&state.items.length)return;state.tab=tab;syncLoadHint();document.querySelectorAll('.haProfileTab').forEach(function(b){b.classList.toggle('active',b.dataset.tab===tab);});if(tab==='posts'||tab==='private')await loadMainPosts(true);else await loadAux(tab);}
function bindTabs(){document.querySelectorAll('.haProfileTab').forEach(function(b){b.addEventListener('click',function(){switchTab(b.dataset.tab);});});}
async function loadCounts(force){var seq=state.seq,counts=await C.profileCounts(state.uid,false,!!force);if(!alive(seq)||!counts)return;await waitSecondaryIdle();if(!alive(seq)||!state.frameVisible||!state.fullRuntime)return;state.postsTotal=Math.max(0,Number(counts.posts)||0);state.view.posts=state.postsTotal;state.view.followers=Math.max(0,Number(counts.followers)||0);state.view.following=Math.max(0,Number(counts.following)||0);state.view.likes=Math.max(0,Number(counts.likes)||0);paintPostCount();setTextStable('profileFollowers',C.compact(state.view.followers));setTextStable('profileFollowing',C.compact(state.view.following));setTextStable('profileLikes',C.compact(state.view.likes));}
function markScrollIntent(){var y=Math.max(0,window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0);if(y>state.lastScrollY+3)state.scrollIntent=Date.now();state.lastScrollY=y;}
function setupObserver(){if(state.observer)state.observer.disconnect();if(!state.scrollBound){state.scrollBound=true;window.addEventListener('scroll',markScrollIntent,{passive:true});}var s=$('profileSentinel');state.observer=new IntersectionObserver(async function(entries){if(!entries.some(function(e){return e.isIntersecting;}))return;if(Date.now()-state.scrollIntent>1800)return;if((state.tab==='posts'||state.tab==='private')&&state.pager&&(state.pager.groupedCount()>state.visibleLimit||state.pager.hasMore())&&!state.pageLoading){state.scrollIntent=0;await loadMainPosts(false);}}, {root:null,rootMargin:'120px 0px',threshold:0.01});state.observer.observe(s);}
function editHost(){return window.HappyProfileEditHostV855R32||window.HappyProfileEditHostV855R31||null;}
function openEdit(options){var h=editHost();if(h&&typeof h.open==='function')return h.open(options||{});toast('Modifier le profil est indisponible');return false;}
/* V870 : aucun module lourd n'est préchargé au pointerdown. Un doigt posé
   sur la rangée d'actions peut donc commencer un scroll sans construire en
   arrière-plan Stats, Paramètres ou l'éditeur photo. Le vrai click conserve
   exactement l'ouverture et le préchargement internes de chaque host. */
function actionClickAllowed(){return !(S&&typeof S.isActive==='function'&&S.isActive());}
function bindActions(){var edit=$('openEdit'),avatarEdit=$('profileAvatarEdit'),stats=$('openStats'),settings=$('openSettings');if(edit)edit.addEventListener('click',function(){if(actionClickAllowed())openEdit({reason:'edit-button'});});if(avatarEdit)avatarEdit.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();if(actionClickAllowed())openEdit({reason:'avatar-button',photo:true});});if(stats)stats.addEventListener('click',function(){if(!actionClickAllowed())return;if(window.HappyProfileStatsHostV855R4&&typeof window.HappyProfileStatsHostV855R4.open==='function')window.HappyProfileStatsHostV855R4.open();else toast('Statistiques indisponibles');});if(settings)settings.addEventListener('click',function(){if(!actionClickAllowed())return;if(window.HappyProfileSettingsHostV855R26&&typeof window.HappyProfileSettingsHostV855R26.open==='function')window.HappyProfileSettingsHostV855R26.open();else toast('Paramètres indisponibles');});}
function normalizeUsername(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^@+/,'').replace(/[^a-z0-9._]/g,'').replace(/[._]{2,}/g,function(match){return match[0];}).replace(/^[._]+|[._]+$/g,'').slice(0,50);}
function editProfileData(){var v=state.view||C.profileView(state.profile||{}),p=state.profile||{},status=C.clean(p.verification_status||p.verificationStatus);return {name:v.name||'',full_name:v.name||'',username:v.handle||'',bio:v.bio||'',avatarUrl:v.avatar||'',avatar_url:v.avatar||'',verification_status:status,badgeTemporarilyUnavailable:status.toLowerCase()==='pending_reverification'};}
function rpcMissing(error,name){var raw=String(error&&error.message||error||'').toLowerCase();return raw.indexOf(String(name||'').toLowerCase())>=0&&(raw.indexOf('could not find')>=0||raw.indexOf('schema cache')>=0||raw.indexOf('pgrst202')>=0||raw.indexOf('function')>=0);}
async function checkUsername(username){username=normalizeUsername(username);if(username.length<3)return {connected:true,available:false,error:'invalid_username'};var current=normalizeUsername(state.view&&state.view.handle||state.profile&&state.profile.username||'');if(username===current)return {connected:true,available:true,current:true};var c=C.client();if(!c)return {connected:false};var r=await c.rpc('happyad_check_username_v1',{p_username:username});if(r&&r.error){if(rpcMissing(r.error,'happyad_check_username_v1'))return {connected:false,setupRequired:true,error:'username_rpc_missing'};throw r.error;}var data=r&&r.data||{};if(typeof data==='string'){try{data=JSON.parse(data);}catch(_e){data={};}}return {connected:true,available:data.available===true,current:data.current===true};}
function avatarStorageRef(value){var raw=C.clean(value);if(!raw)return null;var bucket='',path='';if(/^profiles\//i.test(raw)){bucket='happyad-media';path=raw;}else{try{var u=new URL(raw,location.href),decoded=decodeURIComponent(u.pathname||''),buckets=['happyad-profile-avatars','happyad-media'];for(var b=0;b<buckets.length;b++){var name=buckets[b],markers=['/storage/v1/object/public/'+name+'/','/storage/v1/object/sign/'+name+'/','/storage/v1/object/authenticated/'+name+'/'];for(var i=0;i<markers.length;i++){var at=decoded.indexOf(markers[i]);if(at>=0){bucket=name;path=decoded.slice(at+markers[i].length);break;}}if(path)break;}}catch(_e){}}path=C.clean(path).replace(/^\/+/, '').split('?')[0].split('#')[0];var prefix='profiles/'+state.uid+'/';return bucket&&path.indexOf(prefix)===0?{bucket:bucket,path:path}:null;}
async function removeAvatarRef(ref){if(!ref||!ref.bucket||!ref.path)return false;var prefix='profiles/'+state.uid+'/';if(ref.path.indexOf(prefix)!==0)return false;var c=C.client();if(!c||!c.storage)return false;try{var r=await c.storage.from(ref.bucket).remove([ref.path]);if(r&&r.error)throw r.error;return true;}catch(error){try{console.warn('[Fyblic V855R31] nettoyage avatar non bloquant',error);}catch(_e){}return false;}}
async function uploadCroppedAvatar(blob){if(!blob)return null;if(typeof blob.arrayBuffer!=='function'||!/^image\/jpeg$/i.test(blob.type||'')){var error=new Error('La photo recadrée est invalide.');error.userMessage='La photo recadrée n’a pas pu être préparée.';throw error;}if(!blob.size||blob.size>2097152){var sizeError=new Error('Photo trop lourde');sizeError.userMessage='La photo recadrée est vide ou dépasse 2 Mo.';throw sizeError;}var head=new Uint8Array(await blob.slice(0,3).arrayBuffer());if(head[0]!==255||head[1]!==216||head[2]!==255){var formatError=new Error('Signature JPEG invalide');formatError.userMessage='La photo préparée n’est pas un JPEG valide.';throw formatError;}var c=C.client();if(!c)throw new Error('Supabase non chargé');var bucket='happyad-profile-avatars',suffix=(window.crypto&&typeof window.crypto.randomUUID==='function'?window.crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2)),path='profiles/'+state.uid+'/avatar-'+suffix+'.jpg';var up=await c.storage.from(bucket).upload(path,blob,{contentType:'image/jpeg',cacheControl:'31536000',upsert:false});if(up&&up.error)throw up.error;var pub=c.storage.from(bucket).getPublicUrl(path),url=pub&&pub.data&&pub.data.publicUrl||'';if(!url){await removeAvatarRef({bucket:bucket,path:path});throw new Error('URL avatar indisponible');}return {bucket:bucket,path:path,url:url};}
async function reconcileFailedAvatarUpload(ref){if(!ref||!ref.url)return {status:'none'};var c=C.client();if(!c)return {status:'unknown'};try{var r=await c.from('profiles').select('*').eq('id',state.uid).maybeSingle();if(!r||r.error)return {status:'unknown'};var profile=r.data||null;if(profile&&C.clean(profile.avatar_url)===C.clean(ref.url))return {status:'committed',profile:profile};await removeAvatarRef(ref);return {status:'not-committed',profile:profile};}catch(_e){return {status:'unknown'};}}
function clearBadgeFields(target){target=target||{};['badge','user_badge','userBadge','verification_badge','badge_type','verified_badge','verifiedBadge','profile_badge','certification','role_badge','account_badge'].forEach(function(key){target[key]='';});target.verified=false;target.is_verified=false;target.isVerified=false;return target;}
function profileSaveError(error){var raw=String(error&&error.message||error||'').toLowerCase(),next=error instanceof Error?error:new Error(String(error||'Échec de l’enregistrement.'));if(rpcMissing(error,'happyad_update_my_profile_v2')||raw.indexOf('profile_update_rpc_missing')>=0)next.userMessage='Le SQL Fyblic V855R32 doit être exécuté dans Supabase avant cet enregistrement.';else if(/duplicate|unique|23505/.test(raw))next.userMessage='Ce nom d’utilisateur vient d’être choisi. Sélectionnez un autre nom.';else if(/row-level security|rls|42501|permission denied/.test(raw))next.userMessage='Supabase refuse cette modification. Exécutez le SQL V855R32 puis reconnectez-vous.';else if(/network|fetch|offline/.test(raw))next.userMessage='Connexion indisponible. Réessayez lorsque le réseau est stable.';else next.userMessage=error&&error.userMessage||'Le profil n’a pas pu être enregistré.';return next;}
async function saveProfile(draft,avatarBlob){var uploaded=null,saved=false;try{if(!state.uid)throw new Error('Session absente');var c=C.client();if(!c)throw new Error('Supabase non chargé');draft=draft||{};var name=C.clean(draft.name).slice(0,80),username=normalizeUsername(draft.username),bio=C.clean(draft.bio).slice(0,600);if(!name){var nameError=new Error('Nom requis');nameError.userMessage='Ajoutez votre nom avant d’enregistrer.';throw nameError;}if(username.length<3){var userError=new Error('Nom utilisateur invalide');userError.userMessage='Le nom d’utilisateur doit contenir au moins 3 caractères.';throw userError;}var current=normalizeUsername(state.view&&state.view.handle||state.profile&&state.profile.username||''),requestedUsernameChange=username!==current;if(requestedUsernameChange){var availability=await checkUsername(username);if(!availability.connected){var offline=new Error(availability.setupRequired?'profile_update_rpc_missing':'Vérification indisponible');offline.userMessage=availability.setupRequired?'Le SQL Fyblic V855R32 doit être exécuté dans Supabase.':'La disponibilité du nom d’utilisateur ne peut pas être vérifiée.';throw offline;}if(!availability.available){var taken=new Error('Nom utilisateur déjà utilisé');taken.userMessage='Ce nom d’utilisateur appartient déjà à un autre compte.';throw taken;}}var previousAvatar=state.view&&state.view.avatar||C.avatarOf(state.profile||{})||'',previousRef=avatarStorageRef(previousAvatar),nextAvatar=previousAvatar;if(draft.avatarRemoved)nextAvatar='';else if(draft.avatarChanged){if(!avatarBlob){var blobError=new Error('Photo recadrée absente');blobError.userMessage='La photo recadrée n’est plus disponible. Choisissez-la de nouveau.';throw blobError;}uploaded=await uploadCroppedAvatar(avatarBlob);nextAvatar=uploaded.url;}var rpc=await c.rpc('happyad_update_my_profile_v1',{p_full_name:name,p_username:username,p_bio:bio,p_avatar_url:nextAvatar||null});if(rpc&&rpc.error){if(rpcMissing(rpc.error,'happyad_update_my_profile_v1')){var missing=new Error('profile_update_rpc_missing');missing.userMessage='Le SQL Fyblic V855R32 doit être exécuté dans Supabase avant cet enregistrement.';throw missing;}throw rpc.error;}saved=true;var result=rpc&&rpc.data||{};if(typeof result==='string'){try{result=JSON.parse(result);}catch(_json){result={};}}var remote=result.profile&&typeof result.profile==='object'?result.profile:result,usernameChanged=result.username_changed===true;if(A&&A.set)A.set(state.uid,nextAvatar,{source:'owner-profile-save-v855r32',revision:remote.avatar_updated_at||remote.updated_at||Date.now(),broadcast:true});var merged=Object.assign({},state.profile,remote,{id:state.uid,user_id:state.uid,name:name,display_name:name,full_name:name,handle:username,username:username,bio:bio,avatar:nextAvatar,avatar_url:nextAvatar,__happyadAvatarKnownV855R32:true});if(usernameChanged){clearBadgeFields(merged);merged.verification_status='pending_reverification';merged.verification_reason='username_changed';merged.badge_suspended_at=result.badge_suspended_at||new Date().toISOString();}state.profile=merged;C.cacheProfile(state.uid,'owner',state.profile);try{var local=C.localProfileSeed(state.uid),central=Object.assign({},local,state.profile);if(usernameChanged)clearBadgeFields(central);localStorage.setItem('HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL',JSON.stringify(central));}catch(_e){}paintIdentity(state.profile);toast(usernameChanged?'Profil enregistré · badge en nouvelle vérification':'Profil enregistré');if(previousRef&&(draft.avatarRemoved||uploaded)&&(!uploaded||previousRef.bucket!==uploaded.bucket||previousRef.path!==uploaded.path))removeAvatarRef(previousRef);if(usernameChanged){var detail={uid:state.uid,username:username,badgeTemporarilyUnavailable:true,verificationStatus:'pending_reverification',verificationRequestId:result.verification_request_id||'',at:Date.now()};try{document.dispatchEvent(new CustomEvent('happyad:profile-username-changed',{detail:detail}));}catch(_event){}try{if(window.parent&&window.parent!==window)window.parent.postMessage({type:'HAPPYAD_PROFILE_BADGE_SUSPENDED_V855R31',detail:detail},(window.location.origin&&window.location.origin!=='null')?window.location.origin:'*');}catch(_parent){}}return {profile:editProfileData(),usernameChanged:usernameChanged,verificationStatus:result.verification_status||'',verificationRequestId:result.verification_request_id||''};}catch(error){if(uploaded&&!saved)await removeAvatarRef(uploaded);throw profileSaveError(error);}}
async function logout(){try{var edit=window.HappyProfileEditHostV855R32||window.HappyProfileEditHostV855R31;if(edit)edit.close({reason:'logout',focus:false,restoreScroll:false,force:true});}catch(_editHost){}try{if(window.HappyProfileSettingsHostV855R26)window.HappyProfileSettingsHostV855R26.close({reason:'logout',focus:false});}catch(_host){}var delegated=false;try{if(window.parent&&window.parent!==window){var auth=window.parent.HappyAuthSessionV598||window.parent.HappyAuthSessionV597||window.parent.HappyAuthSessionV596||window.parent.HappyAuthSessionV595;if(auth&&typeof auth.logout==='function'){delegated=true;await auth.logout({source:'owner-profile-v855r23'});}else{window.parent.postMessage({type:'HAPPYAD_AUTH_LOGOUT_REQUEST_V595',detail:{source:'owner-profile-v855r23'}},'*');delegated=true;}}}catch(_e){}if(delegated)return;try{var c=C.client();if(c&&c.auth)await c.auth.signOut({scope:'local'});}catch(_e2){}try{['HAPPYAD_AUTH_UID','HAPPYAD_SESSION_ACTIVE','HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL'].forEach(function(k){localStorage.removeItem(k);});localStorage.setItem('HAPPYAD_SESSION_ACTIVE','0');}catch(_e3){}location.replace('../index.html');}
function bindSettings(){}
function paintStoryRing(){var w=$('profileAvatarWrap');if(!w)return;var has=!!(state.story&&state.stories.length);w.classList.toggle('has-story',has);w.classList.toggle('story-seen',has&&state.storySeen);$('profileAvatar').setAttribute('aria-label',has?(state.storySeen?'Ouvrir la story vue':'Ouvrir la nouvelle story'):'Photo de profil');}
async function setupStory(options){options=options||{};var seq=state.seq,viewer=state.uid,info;if(options.cacheOnly&&typeof C.profileStoryStateCached==='function')info=C.profileStoryStateCached(state.uid);else info=await C.profileStoryState(state.uid,viewer);if(!alive(seq))return;if(!options.allowHidden){await waitSecondaryIdle();if(!alive(seq)||!state.frameVisible||!state.fullRuntime)return;}state.stories=info&&info.rows||[];state.story=info&&info.story||null;state.storySeen=!!(info&&info.seen);paintStoryRing();if(!state.storyBound){state.storyBound=true;$('profileAvatar').addEventListener('click',openStory);window.addEventListener('storage',function(e){if(e&&C.storySeenStorageKey&&e.key===C.storySeenStorageKey()&&state.stories.length){var apply=function(){state.storySeen=state.stories.every(function(x){return C.storySeenLocal(x)||x&&x.isSeen===true||x&&x.seen===true||x&&x.viewed===true;});paintStoryRing();};commitSecondary('story-storage',apply,60);}});}}
function openStory(){if(!state.story)return;C.markStorySeenLocal(C.storyId(state.story));state.storySeen=state.stories.length>0&&state.stories.every(function(x){return C.storySeenLocal(x);});paintStoryRing();if(!C.openProfileStory(state.uid,state.story,state.profile))toast('Story indisponible');}
function realtimeActionTouchesLoadedPostV869(payload){var row=payload&&((payload.new&&Object.keys(payload.new).length&&payload.new)||payload.old)||{},id=C.clean(C.first(row.post_id,row.content_id));if(!id)return false;var source=state.pager&&Array.isArray(state.pager.raw)?state.pager.raw:state.items;return (source||[]).some(function(post){if(C.clean(C.first(post&&post.id,post&&post.post_id,post&&post.__actionId))===id)return true;return Array.isArray(post&&post.__albumItems)&&post.__albumItems.some(function(item){return C.clean(C.first(item&&item.id,item&&item.post_id))===id;});});}
function setupRealtime(){if(!state.frameVisible||!state.fullRuntime||state.channel)return;var c=C.client();if(!c||!c.channel)return;try{state.channel=c.channel('profile-owner-v869-'+state.uid).on('postgres_changes',{event:'*',schema:'public',table:'happyad_posts'},function(payload){var row=payload&&((payload.new&&Object.keys(payload.new).length&&payload.new)||payload.old)||{};if(!C.belongsTo(row,state.uid))return;scheduleRefresh();}).on('postgres_changes',{event:'*',schema:'public',table:'happyad_follows'},function(payload){var row=payload&&((payload.new&&Object.keys(payload.new).length&&payload.new)||payload.old)||{};if(C.clean(row.creator_id)!==state.uid&&C.clean(row.follower_id)!==state.uid)return;scheduleCountRefresh();}).on('postgres_changes',{event:'*',schema:'public',table:'happyad_content_actions'},function(payload){if(!realtimeActionTouchesLoadedPostV869(payload))return;scheduleCountRefresh();}).on('postgres_changes',{event:'*',schema:'public',table:'profiles',filter:'id=eq.'+state.uid},function(){scheduleIdentityRefresh();}).on('postgres_changes',{event:'*',schema:'public',table:'happyad_stories',filter:'user_id=eq.'+state.uid},function(){scheduleStoryRefresh();}).subscribe();}catch(_e){}
}
function scheduleCountRefresh(){if(!state.frameVisible||!state.fullRuntime)return;clearTimeout(state.countTimer);state.countTimer=setTimeout(function(){nonPriority('count',function(){if(state.frameVisible&&state.fullRuntime)loadCounts(true);},60);},180);}
function scheduleRefresh(){if(!state.frameVisible||!state.fullRuntime)return;clearTimeout(state.refreshTimer);state.refreshTimer=setTimeout(function(){nonPriority('post-refresh',function(){if(!state.frameVisible||!state.fullRuntime)return;if(state.tab==='posts'||state.tab==='private')refreshFirstPageSecondary();scheduleCountRefresh();},70);},160);}
function scheduleStoryRefresh(){if(!state.frameVisible||!state.fullRuntime)return;clearTimeout(state.storyRefreshTimer);state.storyRefreshTimer=setTimeout(function(){nonPriority('story',function(){if(state.frameVisible&&state.fullRuntime)setupStory();},60);},100);}
function scheduleIdentityRefresh(){if(!state.frameVisible||!state.fullRuntime)return;clearTimeout(state.identityTimer);state.identityTimer=setTimeout(function(){nonPriority('identity',async function(){if(!state.frameVisible||!state.fullRuntime)return;var seq=state.seq,p=await C.fetchProfile(state.uid,'owner',function(){return alive(seq)&&state.frameVisible;});if(!p||!alive(seq)||!state.frameVisible)return;await waitSecondaryIdle();if(p&&alive(seq)&&state.frameVisible&&state.fullRuntime)paintIdentity(p);},70);},120);}
function cleanup(){state.destroyed=true;releaseRuntime();stopAuthSubscription();}
async function init(options){
  options=options||{};C.pageRedirect('owner');document.body.dataset.profileMode='owner';
  var visible=options.visible===true||frameVisibleNow();state.frameVisible=visible;state.warmOnly=!visible;
  C.writeJson(sessionStorage,'HAPPYAD_PROFILE_ENGINE_V855',{mode:'owner',at:Date.now(),source:options.source||'init',lightWarmup:!visible});
  bindUiOnce();bindAuthLifecycle();if(state.initPromise&&!options.force)return state.initPromise;
  var run=(async function(){
    releaseRuntime();state.destroyed=false;state.frameVisible=visible||frameVisibleNow();state.warmOnly=!state.frameVisible;
    var seq=state.seq,user=await C.authUser();if(!alive(seq))return;
    if(!user||!user.id){paintGuestState();return;}
    state.uid=C.clean(user.id);
    try{var canonicalUid=localStorage.getItem('HAPPYAD_SESSION_ACTIVE')==='1'?C.clean(localStorage.getItem('HAPPYAD_AUTH_UID')):'';if(!canonicalUid||canonicalUid!==state.uid){paintGuestState();return;}}catch(_authGuard){paintGuestState();return;}
    setPrivateUi(true);
    setupStory({cacheOnly:true,allowHidden:true,source:'owner-init-cache-v924'});
    var cached=C.readJson(localStorage,C.cacheKey('owner',state.uid,'IDENTITY'),null)||C.localProfileSeed(state.uid),hadCachedIdentity=!!(cached&&Object.keys(cached).length);
    if(hadCachedIdentity){state.profile=cached;state.view=C.profileView(cached);if(state.frameVisible){paintIdentity(cached);setBootOff();C.notifyReady('owner',state.uid);}}
    else{state.profile={id:state.uid,user_id:state.uid,email:user.email||''};state.view=C.profileView(state.profile);}
    var postsPromise=loadMainPosts(true,{cacheOnly:!state.frameVisible,reason:'owner-init-v869'});
    if(!state.frameVisible&&!frameVisibleNow()){
      state.warmOnly=true;suspendVisibleRuntime();postsPromise.catch(function(){});return;
    }
    state.frameVisible=true;
    var profilePromise=C.fetchProfile(state.uid,'owner',function(){return alive(seq)&&state.frameVisible;});
    var p=await profilePromise;if(!alive(seq))return;if(hadCachedIdentity)await waitSecondaryIdle();if(!alive(seq))return;
    p=p||state.profile||{};paintIdentity(Object.assign({},p,{email:user.email||p.email}));setBootOff();C.notifyReady('owner',state.uid);
    activateVisibleRuntime('init-visible-v869');postsPromise.catch(function(){});
  })();
  state.initPromise=run;try{return await run;}finally{if(state.initPromise===run)state.initPromise=null;}
}
$('profileBack').addEventListener('click',function(e){e.preventDefault();C.requestBack();});window.addEventListener('HAPPYAD_PROFILE_AVATAR_UPDATED_V855R32',function(event){var d=event&&event.detail||{};if(!state.uid||C.clean(d.uid)!==state.uid||d.known!==true)return;nonPriority('avatar',function(){if(!state.uid||C.clean(d.uid)!==state.uid)return;state.profile=Object.assign({},state.profile||{},{id:state.uid,user_id:state.uid,avatar:d.avatarUrl||'',avatar_url:d.avatarUrl||'',__happyadAvatarKnownV855R32:true});paintIdentity(state.profile);},50);});window.addEventListener('pagehide',cleanup,{once:true});window.addEventListener('beforeunload',cleanup,{once:true});
window.HappyOwnerProfileEditControllerV855R32={getProfileData:editProfileData,checkUsername:checkUsername,saveProfile:saveProfileV855R32};window.HappyOwnerProfileEditControllerV855R31=window.HappyOwnerProfileEditControllerV855R32;window.HappyOwnerProfileEditControllerV855R30=window.HappyOwnerProfileEditControllerV855R32;window.HappyOwnerProfileEditControllerV855R29=window.HappyOwnerProfileEditControllerV855R32;window.HappyOwnerProfileV855R32={init:init,state:state,destroy:cleanup,loadMore:function(){return loadMainPosts(false);},syncAuth:scheduleAuthSync,logout:logout,openEdit:openEdit,activateVisible:activateVisibleRuntime,suspendHidden:suspendVisibleRuntime};window.HappyOwnerProfileV855R31=window.HappyOwnerProfileV855R32;window.HappyOwnerProfileV855R30=window.HappyOwnerProfileV855R32;window.HappyOwnerProfileV855R29=window.HappyOwnerProfileV855R32;window.HappyOwnerProfileV855R23=window.HappyOwnerProfileV855R32;window.HappyOwnerProfileV855R6=window.HappyOwnerProfileV855R32;window.HappyOwnerProfileV855R5=window.HappyOwnerProfileV855R32;window.HappyOwnerProfileV855R4=window.HappyOwnerProfileV855R32;window.HappyOwnerProfileV855R3=window.HappyOwnerProfileV855R32;window.HappyOwnerProfileV855R2=window.HappyOwnerProfileV855R32;window.HappyOwnerProfileV855R1=window.HappyOwnerProfileV855R32;window.HappyOwnerProfileV854R8=window.HappyOwnerProfileV855R32;
async function saveProfileV855R32(draft,avatarBlob){
  var uploaded=null,saved=false;
  try{
    if(!state.uid)throw new Error('Session absente');
    var c=C.client();if(!c)throw new Error('Supabase non chargé');
    draft=draft||{};
    var name=C.clean(draft.name).slice(0,80),username=normalizeUsername(draft.username),bio=C.clean(draft.bio).slice(0,600);
    if(!name){var nameError=new Error('Nom requis');nameError.userMessage='Ajoutez votre nom avant d’enregistrer.';throw nameError;}
    if(username.length<3){var userError=new Error('Nom utilisateur invalide');userError.userMessage='Le nom d’utilisateur doit contenir au moins 3 caractères.';throw userError;}
    var current=normalizeUsername(state.view&&state.view.handle||state.profile&&state.profile.username||''),requestedUsernameChange=username!==current;
    if(requestedUsernameChange){
      var availability=await checkUsername(username);
      if(!availability.connected){var offline=new Error(availability.setupRequired?'profile_update_rpc_missing':'Vérification indisponible');offline.userMessage=availability.setupRequired?'Le SQL Fyblic V855R32 doit être exécuté dans Supabase.':'La disponibilité du nom d’utilisateur ne peut pas être vérifiée.';throw offline;}
      if(!availability.available){var taken=new Error('Nom utilisateur déjà utilisé');taken.userMessage='Ce nom d’utilisateur appartient déjà à un autre compte.';throw taken;}
    }
    var known=A&&A.getEntry&&A.getEntry(state.uid),previousAvatar=known&&known.known?(known.url||''):(state.view&&state.view.avatar||''),previousRef=avatarStorageRef(previousAvatar),nextAvatar=previousAvatar;
    var avatarMutation=!!(draft.avatarRemoved||draft.avatarChanged);
    if(draft.avatarRemoved)nextAvatar='';
    else if(draft.avatarChanged){
      if(!avatarBlob){var blobError=new Error('Photo recadrée absente');blobError.userMessage='La photo recadrée n’est plus disponible. Choisissez-la de nouveau.';throw blobError;}
      uploaded=await uploadCroppedAvatar(avatarBlob);nextAvatar=uploaded.url;
    }
    var rpc=await c.rpc('happyad_update_my_profile_v2',{
      p_full_name:name,p_username:username,p_bio:bio,p_avatar_url:avatarMutation?(nextAvatar||null):null,p_avatar_changed:avatarMutation
    });
    if(rpc&&rpc.error){
      if(rpcMissing(rpc.error,'happyad_update_my_profile_v2')){var missing=new Error('profile_update_rpc_missing');missing.userMessage='Le SQL Fyblic V855R32 doit être exécuté dans Supabase avant cet enregistrement.';throw missing;}
      throw rpc.error;
    }
    saved=true;
    var result=rpc&&rpc.data||{};if(typeof result==='string'){try{result=JSON.parse(result);}catch(_json){result={};}}
    var remote=result.profile&&typeof result.profile==='object'?result.profile:result,usernameChanged=result.username_changed===true;
    if(Object.prototype.hasOwnProperty.call(remote,'avatar_url'))nextAvatar=C.clean(remote.avatar_url);
    if(Object.prototype.hasOwnProperty.call(result,'previous_avatar_url'))previousRef=avatarStorageRef(result.previous_avatar_url);
    if(A&&A.set)A.set(state.uid,nextAvatar,{source:'owner-profile-save-v855r32',revision:remote.avatar_revision||remote.avatar_updated_at||remote.updated_at||Date.now(),broadcast:true});
    var merged=Object.assign({},state.profile,remote,{id:state.uid,user_id:state.uid,name:name,display_name:name,full_name:name,handle:username,username:username,bio:bio,avatar:nextAvatar,avatar_url:nextAvatar,__happyadAvatarKnownV855R32:true});
    if(usernameChanged){clearBadgeFields(merged);merged.verification_status='pending_reverification';merged.verification_reason='username_changed';merged.badge_suspended_at=result.badge_suspended_at||new Date().toISOString();}
    state.profile=merged;C.cacheProfile(state.uid,'owner',state.profile);
    try{var local=C.localProfileSeed(state.uid),central=Object.assign({},local,state.profile);if(usernameChanged)clearBadgeFields(central);localStorage.setItem('HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL',JSON.stringify(central));}catch(_e){}
    paintIdentity(state.profile);toast(usernameChanged?'Profil enregistré · badge en nouvelle vérification':'Profil enregistré');
    /* V941 — l'UID reste canonique; propager le nouveau nom principal aux mentions déjà affichées. */
    try{var identityDetailV941={uid:state.uid,full_name:name,name:name,username:username,at:Date.now()};document.dispatchEvent(new CustomEvent('happyad:profile-identity-changed',{detail:identityDetailV941}));if(window.parent&&window.parent!==window)window.parent.postMessage({type:'HAPPYAD_PROFILE_IDENTITY_CHANGED_V941',detail:identityDetailV941},(window.location.origin&&window.location.origin!=='null')?window.location.origin:'*');}catch(_identityV941){}
    if(previousRef&&avatarMutation&&(!uploaded||previousRef.bucket!==uploaded.bucket||previousRef.path!==uploaded.path))removeAvatarRef(previousRef);
    if(usernameChanged){
      var detail={uid:state.uid,username:username,badgeTemporarilyUnavailable:true,verificationStatus:'pending_reverification',verificationRequestId:result.verification_request_id||'',at:Date.now()};
      try{document.dispatchEvent(new CustomEvent('happyad:profile-username-changed',{detail:detail}));}catch(_event){}
      try{if(window.parent&&window.parent!==window)window.parent.postMessage({type:'HAPPYAD_PROFILE_BADGE_SUSPENDED_V855R31',detail:detail},(window.location.origin&&window.location.origin!=='null')?window.location.origin:'*');}catch(_parent){}
    }
    return {profile:editProfileData(),usernameChanged:usernameChanged,verificationStatus:result.verification_status||'',verificationRequestId:result.verification_request_id||''};
  }catch(error){
    if(uploaded&&!saved){
      var reconciliation=await reconcileFailedAvatarUpload(uploaded);
      if(reconciliation.status==='committed'){
        var confirmed=reconciliation.profile||{},confirmedAvatar=C.clean(confirmed.avatar_url);
        if(A&&A.set)A.set(state.uid,confirmedAvatar,{source:'owner-profile-network-reconcile-v855r32',revision:confirmed.avatar_revision||confirmed.avatar_updated_at||confirmed.updated_at||Date.now(),broadcast:true});
        state.profile=Object.assign({},state.profile,confirmed,{id:state.uid,user_id:state.uid,avatar:confirmedAvatar,avatar_url:confirmedAvatar,__happyadAvatarKnownV855R32:true});
        C.cacheProfile(state.uid,'owner',state.profile);
        try{var seed=C.localProfileSeed(state.uid),central=Object.assign({},seed,state.profile);localStorage.setItem('HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL',JSON.stringify(central));}catch(_cacheError){}
        paintIdentity(state.profile);toast('Profil enregistré après vérification du serveur');
        if(previousRef&&(previousRef.bucket!==uploaded.bucket||previousRef.path!==uploaded.path))removeAvatarRef(previousRef);
        return {profile:editProfileData(),reconciled:true,verificationStatus:C.clean(confirmed.verification_status)};
      }
      /* Si la relecture réseau échoue aussi, conserver l’objet est plus sûr que
         supprimer une photo que la transaction serveur pourrait déjà référencer. */
    }
    throw profileSaveError(error);
  }
}
window.HappyOwnerProfileEditControllerV855R32.saveProfile=saveProfileV855R32;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
