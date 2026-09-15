(function(){
'use strict';
if(window.HappyProfilePhotoFullscreenV854R8)return;
var VERSION='V854R8_PROFILE_PHOTO_FULLSCREEN_V932_HANDOFF';
var active={rows:[],target:null,postId:'',expires:0,source:'',sourceWindow:null,opening:false};
var originalFinder=typeof window.happyadFindHomePhotoPostV466==='function'?window.happyadFindHomePhotoPostV466:null;
var boxObserver=null,openTimer=0;
var AVATAR_MASTER=window.HappyProfileAvatarMasterV855R32||window.HappyProfileAvatarMaster||null;
function clean(v){return String(v==null?'':v).trim();}
function idOf(p){return clean(p&&(p.id||p.post_id));}
function ownerOf(p){p=p||{};return clean(p.creatorId||p.creator_id||p.user_id||p.ownerId||p.owner_id||p.authorId||p.author_id||p.profile_id||p.profileId||p.uid);}
function cloneRows(rows){return (Array.isArray(rows)?rows:[]).filter(Boolean).slice(0,300);}
function findProfilePost(id){
 id=clean(id);if(!id||Date.now()>active.expires)return null;
 var rows=active.rows||[];
 for(var n=0;n<rows.length;n++){
  var p=rows[n];if(!p)continue;
  if(idOf(p)===id)return p;
  var a=Array.isArray(p.__albumItems)?p.__albumItems:[];
  for(var i=0;i<a.length;i++)if(idOf(a[i])===id)return Object.assign({},p,{__albumItems:a,__albumCount:a.length,__startAlbumIndex:i,__actionId:clean(p.__actionId||idOf(p)||idOf(a[0]))});
 }
 if(active.target){
  if(idOf(active.target)===id)return active.target;
  var ta=Array.isArray(active.target.__albumItems)?active.target.__albumItems:[];
  for(var j=0;j<ta.length;j++)if(idOf(ta[j])===id)return Object.assign({},active.target,{__albumItems:ta,__albumCount:ta.length,__startAlbumIndex:j,__actionId:clean(active.target.__actionId||idOf(active.target)||idOf(ta[0]))});
 }
 return null;
}
function installFinder(){
 if(window.happyadFindHomePhotoPostV466&&window.happyadFindHomePhotoPostV466.__happyadProfileBridgeV854R8)return;
 originalFinder=typeof window.happyadFindHomePhotoPostV466==='function'?window.happyadFindHomePhotoPostV466:originalFinder;
 var wrapped=function(id){var p=findProfilePost(id);if(p)return p;return originalFinder?originalFinder.apply(this,arguments):null;};
 wrapped.__happyadProfileBridgeV854R8=true;wrapped.__original=originalFinder;
 window.happyadFindHomePhotoPostV466=wrapped;
}
function idle(fn){try{if(typeof requestIdleCallback==='function'){requestIdleCallback(fn,{timeout:700});return;}}catch(_e){}setTimeout(fn,0);}
function save(payload){idle(function(){try{var raw=JSON.stringify(payload);sessionStorage.setItem('HAPPYAD_FAST_OPEN_PHOTO_V1',raw);localStorage.setItem('HAPPYAD_FAST_OPEN_PHOTO_V1',raw);}catch(_e){}});}
function esc(v){return clean(v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c;});}
function directMedia(v){
 if(v==null)return '';
 if(Array.isArray(v)){for(var i=0;i<v.length;i++){var a=directMedia(v[i]);if(a)return a;}return '';}
 if(typeof v==='object'){var keys=['url','src','publicUrl','public_url','marketplace_cover_url','marketplaceCoverUrl','marketplace_cover_path','marketplaceCoverPath','media_url','mediaUrl','image_url','imageUrl','photo_url','photoUrl','thumbnail_url','thumbnailUrl','poster_url','posterUrl','path'];for(var k=0;k<keys.length;k++){var x=directMedia(v[keys[k]]);if(x)return x;}return '';}
 var s=clean(v);if(!s)return '';
 if((s.charAt(0)==='{'||s.charAt(0)==='[')){try{return directMedia(JSON.parse(s));}catch(_e){}}
 return s;
}
function immediateUrl(payload){
 payload=payload||{};var t=payload.target||{},items=Array.isArray(t.__albumItems)?t.__albumItems:[];
 var candidates=[t.marketplace_cover_url,t.marketplaceCoverUrl,t.marketplace_cover_path,t.marketplaceCoverPath,t.mediaUrl,t.media_url,t.homeMediaUrl,t.home_media_url,t.imageUrl,t.image_url,t.photoUrl,t.photo_url,t.thumbnail_url,t.poster_url,t.url,t.src,items[t.__startAlbumIndex||0],items[0]];
 for(var i=0;i<candidates.length;i++){var u=directMedia(candidates[i]);if(u)return u;}return '';
}
function primeImmediate(payload){
 try{
  var b=document.getElementById('happyadHomePhotoFullscreen');
  if(!b){b=document.createElement('div');b.id='happyadHomePhotoFullscreen';(document.body||document.documentElement).appendChild(b);}
  if(!b.querySelector('.haHomeFsCard')||!b.querySelector('.haHomeFsAlbumTrack')){
   b.innerHTML='<div class="haHomeFsCard"><button class="haHomeFsClose haHomeFsBackV591" type="button" aria-label="Retour"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><div class="haHomeFsTop"><div class="haHomeFsAvatar"></div><div class="haHomeFsInfo"><b></b><span></span></div><div class="haHomeFsCount"></div></div><div class="haHomeFsMedia"><div class="haHomeFsAlbumTrack"><div class="haHomeFsAlbumSlide"><div class="haHomeFsSlideLoading">Chargement...</div></div></div></div><div class="haHomeFsActions"></div><div class="haHomeFsCaption"></div></div>';
  }
  var ctx=payload&&payload.profileContext||{},target=payload&&payload.target||{};
  var nm=b.querySelector('.haHomeFsInfo b'),sub=b.querySelector('.haHomeFsInfo span'),av=b.querySelector('.haHomeFsAvatar'),cap=b.querySelector('.haHomeFsCaption'),slide=b.querySelector('.haHomeFsAlbumSlide');
  if(nm)nm.textContent=clean(ctx.name||target.creatorName||target.creator_name||target.user_name||'Utilisateur Fyblic');
  if(sub)sub.textContent='';
  if(av){var uid=clean(ctx.uid||ownerOf(target)),ae=AVATAR_MASTER&&AVATAR_MASTER.getEntry&&AVATAR_MASTER.getEntry(uid),avatarName=clean(ctx.name||target.creatorName||'H');av.innerHTML='';av.dataset.happyadAvatarUid=uid;av.dataset.happyadAvatarName=avatarName;if(ae&&ae.known&&AVATAR_MASTER&&AVATAR_MASTER.paintBox)AVATAR_MASTER.paintBox(av,ae,avatarName);else if(AVATAR_MASTER&&AVATAR_MASTER.showDefaultAvatar)AVATAR_MASTER.showDefaultAvatar(av);else av.classList.add('happyadDefaultProfileAvatarV989');if(uid&&(!ae||!ae.known)&&AVATAR_MASTER&&AVATAR_MASTER.resolve)AVATAR_MASTER.resolve(uid).catch(function(){});}
  if(cap)cap.textContent=clean(target.description||target.caption||target.title||'');
  var url=immediateUrl(payload);
  if(slide&&url){slide.innerHTML='';var im=document.createElement('img');im.alt='';im.decoding='async';try{im.fetchPriority='high';}catch(_fp){}im.src=url;slide.appendChild(im);}
  document.body&&document.body.classList.add('haHomePhotoFsLock');
  b.classList.add('on');
  try{b.style.setProperty('z-index','2147483000','important');b.style.setProperty('pointer-events','auto','important');}catch(_z){}
  lockSurface();
  return true;
 }catch(_e){return false;}
}
function shell(){return document.getElementById('happyadAppShell');}
function box(){return document.getElementById('happyadHomePhotoFullscreen');}
function unlockSurface(){
 try{document.documentElement.classList.remove('haProfilePhotoFullscreenV854R8');document.body.classList.remove('haProfilePhotoFullscreenV854R8');}catch(_e){}
 try{var s=shell();if(s){s.style.removeProperty('pointer-events');s.removeAttribute('data-profile-photo-underlay-v854r8');}}catch(_e2){}
 try{if(boxObserver){boxObserver.disconnect();boxObserver=null;}}catch(_e3){}
 active.opening=false;
}
function lockSurface(){
 try{document.documentElement.classList.add('haProfilePhotoFullscreenV854R8');document.body.classList.add('haProfilePhotoFullscreenV854R8');}catch(_e){}
 try{var s=shell();if(s){s.style.setProperty('pointer-events','none','important');s.setAttribute('data-profile-photo-underlay-v854r8','1');}}catch(_e2){}
 var b=box();if(!b)return;
 try{b.style.setProperty('z-index','2147483000','important');b.style.setProperty('pointer-events','auto','important');}catch(_e3){}
 try{
  if(boxObserver)boxObserver.disconnect();
  boxObserver=new MutationObserver(function(){var x=box();if(!x||!x.classList.contains('on'))unlockSurface();});
  boxObserver.observe(b,{attributes:true,attributeFilter:['class']});
 }catch(_e4){}
}
function acknowledge(ok,reason){
 var target=active.sourceWindow;
 if(!target||typeof target.postMessage!=='function')return;
 try{target.postMessage({type:'HAPPYAD_PROFILE_PHOTO_FULLSCREEN_ACK_V854R8',postId:active.postId,ok:!!ok,reason:clean(reason),source:VERSION},'*');}catch(_e){}
}
function callOfficial(id){
 installFinder();
 var fn=null,kind='';
 if(typeof window.happyadOpenHomePhotoFullscreen==='function'){fn=window.happyadOpenHomePhotoFullscreen;kind='home-fullscreen';}
 else if(typeof window.openLongPhoto==='function'){fn=window.openLongPhoto;kind='home-photo';}
 else if(window.HappyPhoto&&typeof window.HappyPhoto.openFromHome==='function'){fn=function(x){return window.HappyPhoto.openFromHome(x,{source:VERSION});};kind='photo-master';}
 if(!fn)return false;
 try{
  /* Même chemin immédiat que l'Accueil : appeler d'abord son lecteur, puis installer le verrou autour de la frame. */
  fn.call(window,id);
  lockSurface();
  acknowledge(true,kind);
  return true;
 }catch(_e){return false;}
}
function fallbackRoute(id){
 try{if(window.HappyNavigation&&typeof window.HappyNavigation.open==='function'){window.HappyNavigation.open('modules/photo.html?post='+encodeURIComponent(id),{page:'photo',postId:id,source:VERSION});return true;}}catch(_e){}
 try{if(typeof window.happyadOpenInternalUrlV492==='function'){window.happyadOpenInternalUrlV492('modules/photo.html?post='+encodeURIComponent(id),{page:'photo',postId:id,source:VERSION});return true;}}catch(_e2){}
 return false;
}
function applyPayload(payload,sourceWindow){
 payload=payload&&typeof payload==='object'?payload:{};
 var id=clean(payload.postId||(payload.target&&idOf(payload.target)));if(!id)return '';
 active.rows=cloneRows(payload.list||payload.posts);active.target=payload.target||null;active.postId=id;active.source=clean(payload.source||VERSION);if(sourceWindow)active.sourceWindow=sourceWindow;active.expires=Date.now()+1800000;active.opening=true;var uid=clean(payload.profileContext&&payload.profileContext.uid||ownerOf(active.target));if(uid&&AVATAR_MASTER&&AVATAR_MASTER.resolve)AVATAR_MASTER.resolve(uid).catch(function(){});
 if(active.target&&!active.rows.some(function(x){return idOf(x)===id;}))active.rows.unshift(active.target);
 installFinder();
 return id;
}
function update(payload){var id=applyPayload(payload,null);if(id)save(payload);return !!id;}
function openFast(payload,sourceWindow){
 var id=applyPayload(payload,sourceWindow);if(!id)return false;
 try{window.__happyadPhotoReturnSourceV478={id:id,scrollY:window.scrollY||document.documentElement.scrollTop||0,at:Date.now(),source:'profile',profileMode:payload.profileContext&&payload.profileContext.mode||''};}catch(_r){}
 /* Aucun DOM provisoire, aucune sérialisation et aucune minuterie avant l'appel officiel. */
 if(callOfficial(id)){save(payload);return true;}
 /* Secours seulement si le maître Accueil n'est exceptionnellement pas encore présent. */
 primeImmediate(payload);save(payload);clearTimeout(openTimer);var tries=0;
 function attempt(){tries++;if(callOfficial(id))return;if(tries<12){openTimer=setTimeout(attempt,50);return;}try{var b=box();if(b)b.classList.remove('on');document.body&&document.body.classList.remove('haHomePhotoFsLock');}catch(_hide){}unlockSurface();var routed=fallbackRoute(id);acknowledge(routed,routed?'route-fallback':'opener-unavailable');active.opening=false;}
 attempt();return true;
}
function open(payload,sourceWindow){return openFast(payload,sourceWindow);}
window.addEventListener('message',function(e){
 var d=e&&e.data;if(!d)return;
 if(d.type==='HAPPYAD_OPEN_PROFILE_PHOTO_FULLSCREEN_V854R8'||d.type==='HAPPYAD_OPEN_PROFILE_PHOTO_FULLSCREEN_V854R7'||d.type==='HAPPYAD_OPEN_PROFILE_PHOTO_FULLSCREEN_V854R5')openFast(d.payload||d,e.source||null);
},true);
window.addEventListener('HAPPYAD_PROFILE_AVATAR_UPDATED_V855R32',function(event){var d=event&&event.detail||{},uid=clean(d.uid);if(!uid||d.known!==true)return;function patch(p){return ownerOf(p)===uid&&AVATAR_MASTER&&AVATAR_MASTER.patchRecord?AVATAR_MASTER.patchRecord(p,uid):p;}active.rows=(active.rows||[]).map(patch);if(active.target)active.target=patch(active.target);try{var av=box()&&box().querySelector('.haHomeFsAvatar'),ae=AVATAR_MASTER&&AVATAR_MASTER.getEntry&&AVATAR_MASTER.getEntry(uid);if(av&&clean(av.dataset.happyadAvatarUid)===uid&&ae&&ae.known&&AVATAR_MASTER&&AVATAR_MASTER.paintBox)AVATAR_MASTER.paintBox(av,ae,av.dataset.happyadAvatarName||'H');}catch(_e){}},true);
installFinder();
window.HappyProfilePhotoFullscreenV854R8={version:VERSION,open:function(payload){return openFast(payload,null);},openFast:function(payload){return openFast(payload,null);},update:update,find:findProfilePost,state:active,lock:lockSurface,unlock:unlockSurface};
window.HappyProfilePhotoBridgeV854R8=window.HappyProfilePhotoFullscreenV854R8;
})();
