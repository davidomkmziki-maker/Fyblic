(function(){
  'use strict';
  if(window.__HAPPYAD_CARD_AUTHOR_AVATAR_MASTER_V742__)return;
  window.__HAPPYAD_CARD_AUTHOR_AVATAR_MASTER_V742__=true;

  var VERSION='CARD_AUTHOR_AVATAR_MASTER_V855R33_EXACT_USER_CROP';
  var AUTHOR_KEY='HAPPYAD_AUTHOR_PROFILE_CACHE_V1';
  var USER_KEY='HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL';
  var AVATAR_MASTER=window.HappyProfileAvatarMasterV855R32||window.HappyProfileAvatarMaster||null;
  var CACHE_KEYS=[
    'HAPPYAD_HOME_BOOT_SNAPSHOT_V1','HAPPYAD_HOME_CONFIRMED_ORDER_V643','HAPPYAD_GLOBAL_POSTS_CACHE_V1','HAPPYAD_HOME_POSTS_CACHE_V1',
    'HAPPYAD_POSTS_CACHE_V1','HAPPYAD_CACHED_POSTS_V1','HAPPYAD_FEED_CACHE_V1','HAPPYAD_SEARCH_POSTS_FAST_CACHE_V1',
    'HAPPYAD_PUBLISH_POSTS_V2','HAPPYAD_PROFILE_POSTS_CACHE_V1','HAPPYAD_PROFILE_OWN_POSTS_STABLE_CACHE_V1','HAPPYAD_USER_POSTS_CACHE_V1'
  ];
  var busy=false,pending=false,lastFetch=0,observer=null,observerTimer=0,cacheRepairTimer=0;
  var mapMemo=null,mapMemoRaw='';
  function scrollPriority(){try{return window.HappyadHomeScrollPriorityV863||null;}catch(_e){return null;}}
  function deferAfterHomeScroll(key,fn,delay){var p=scrollPriority();if(p&&p.run)return p.run(key,fn,delay);setTimeout(fn,Math.max(0,Number(delay)||0));return true;}
  function homeScrollActive(){var p=scrollPriority();return !!(p&&p.isActive&&p.isActive());}
  function waitHomeIdle(){var p=scrollPriority();return p&&p.whenIdle?p.whenIdle():Promise.resolve(true);}

  function clean(v){v=String(v==null?'':v).trim();return (!v||v==='null'||v==='undefined'||v==='[object Object]')?'':v;}
  function json(k,f){try{var v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v;}catch(_e){return f;}}
  function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(_e){return false;}}
  function uidOf(p){p=p||{};return clean(p.creatorId||p.creator_id||p.user_id||p.userId||p.ownerId||p.owner_id||p.author_id||p.authorId||p.profile_id||p.profileId||p.auth_user_id||p.authUserId||p.account_uid||p.accountUid||p.uid||p.uuid);}
  function avatarOf(p){p=p||{};return clean(p.avatar_url||p.avatarUrl||p.avatar||p.user_avatar||p.userAvatar||p.creator_avatar||p.creatorAvatar||p.author_avatar||p.authorAvatar||p.profile_photo_url||p.profilePhotoUrl||p.profile_photo||p.profilePhoto||p.profile_picture_url||p.profilePictureUrl||p.profile_picture||p.profilePicture||p.photo_url||p.photoUrl||p.photo||p.image_url||p.imageUrl||p.picture||p.profile_image_url||p.profileImageUrl||p.profile_avatar_url||p.profileAvatarUrl);}
  function nameOf(p){p=p||{};return clean(p.full_name||p.display_name||p.name||p.creatorName||p.creator_name||p.user_name||p.author_name||p.username||p.handle);}
  function handleOf(p){p=p||{};return clean(p.username||p.handle||p.user_name).replace(/^@+/,'');}
  function normBadge(v){v=clean(v).toLowerCase();return (!v||v==='aucun'||v==='none'||v==='null'||v==='undefined'||v==='false'||v==='0')?'':v;}
  function badgeOf(p){p=p||{};return normBadge(p.badge||p.user_badge||p.userBadge||p.profile_badge||p.badge_type||p.certification||p.verified_badge);}
  function currentUid(){return clean(localStorage.getItem('HAPPYAD_AUTH_UID')||uidOf(json(USER_KEY,{})));}
  function client(){try{return window.happyadSupabase||(typeof window.happyadSb==='function'&&window.happyadSb())||null;}catch(_e){return null;}}
  function publicAvatar(v){
    v=clean(v).replace(/^url\(["']?(.*?)["']?\)$/i,'$1');
    var l=v.toLowerCase();
    if(!v||/^blob:/i.test(v)||v==='👤'||v==='🧑'||l==='none'||l==='null'||l==='undefined'||l.indexOf('placeholder')>-1)return '';
    if(/^https?:\/\//i.test(v)||/^data:image\/(?:png|jpe?g|webp|gif|avif);/i.test(v))return v;
    if(v.indexOf('/')<0&&!/\.(png|jpe?g|webp|gif|avif)(?:[?#]|$)/i.test(v))return '';
    var path=v.replace(/^\/+/, '').replace(/^happyad-media\//,'');
    try{var c=client();if(c&&c.storage&&c.storage.from){var r=c.storage.from('happyad-media').getPublicUrl(path);if(r&&r.data&&r.data.publicUrl)return r.data.publicUrl;}}catch(_e){}
    var base=clean(window.HAPPYAD_SUPABASE_URL||'').replace(/\/+$/,'');
    return base+'/storage/v1/object/public/happyad-media/'+encodeURI(path);
  }
  function stable(uid){return uid?json('HAPPYAD_PROFILE_IDENTITY_STABLE_V741:'+uid,{}):{};}
  function publicStable(uid){return uid?json('HAPPYAD_PUBLIC_PROFILE_STABLE_'+uid,{}):{};}
  function normalize(p){
    p=p||{};
    var id=clean(p.id||p.user_id||p.uid||p.uuid||p.auth_user_id||p.account_uid||uidOf(p));
    if(!id)return null;
    var n=nameOf(p)||'Utilisateur Fyblic',h=handleOf(p),ae=AVATAR_MASTER&&AVATAR_MASTER.getEntry&&AVATAR_MASTER.getEntry(id),known=!!(ae&&ae.known),av=known?(ae.url||''):'';
    return {id:id,user_id:id,name:n,full_name:n,handle:h,username:h,avatar:av,avatar_url:av,badge:badgeOf(p),role:clean(p.role),__happyadAvatarKnownV855R32:known,__happyadAvatarRevisionV855R32:known?(ae.revision||''):''};
  }
  function better(old,next){
    old=old||{};next=next||{};
    var nn=nameOf(next),on=nameOf(old);
    var name=(nn&&!/^(utilisateur happyad|utilisateur fyblic|happyad)$/i.test(nn))?nn:(on||'Utilisateur Fyblic');
    var id=clean(next.id||next.user_id||old.id||old.user_id),ae=AVATAR_MASTER&&AVATAR_MASTER.getEntry&&AVATAR_MASTER.getEntry(id),known=!!(ae&&ae.known);
    var av=known?(ae.url||''):'';
    var h=handleOf(next)||handleOf(old);
    return {id:next.id||old.id,user_id:next.user_id||old.user_id,name:name,full_name:name,handle:h,username:h,avatar:av,avatar_url:av,badge:badgeOf(next)||badgeOf(old),role:clean(next.role)||clean(old.role),__happyadAvatarKnownV855R32:known,__happyadAvatarRevisionV855R32:known?(ae.revision||''):''};
  }
  function sig(p){p=p||{};return [clean(p.id||p.user_id),nameOf(p),handleOf(p),publicAvatar(avatarOf(p)),p.__happyadAvatarKnownV855R32===true?'known':'unknown',clean(p.__happyadAvatarRevisionV855R32),badgeOf(p),clean(p.role)].join('|');}
  function authorMap(){
    var raw='';try{raw=localStorage.getItem(AUTHOR_KEY)||'';}catch(_e){}
    if(mapMemo&&raw===mapMemoRaw)return mapMemo;
    var m={};try{m=JSON.parse(raw||'{}')||{};}catch(_e){m={};}
    if(!m||typeof m!=='object'||Array.isArray(m))m={};
    mapMemo=m;mapMemoRaw=raw;return m;
  }
  function saveAuthorMap(map){
    var raw='';try{raw=JSON.stringify(map||{});}catch(_e){return false;}
    if(raw===mapMemoRaw){mapMemo=map;return false;}
    try{localStorage.setItem(AUTHOR_KEY,raw);mapMemo=map;mapMemoRaw=raw;return true;}catch(_e){return false;}
  }
  function localIdentity(uid){
    if(!uid)return null;
    var cache=authorMap(),me=json(USER_KEY,{}),s=stable(uid),ps=publicStable(uid),a=cache[uid]||{};
    var own=uid===currentUid()?me:{};
    return normalize(Object.assign({},a,ps,s,own,{id:uid,user_id:uid}));
  }
  function remember(rows){
    var map=authorMap(),changed=false;
    (rows||[]).forEach(function(raw){
      var n=normalize(raw);if(!n)return;
      var merged=better(map[n.id],n);
      if(sig(merged)!==sig(map[n.id])){map[n.id]=merged;changed=true;}
    });
    if(changed)saveAuthorMap(map);
    return {map:map,changed:changed};
  }
  function arrays(){
    var out=[];
    try{if(Array.isArray(window.ALL_POSTS))out.push(window.ALL_POSTS);}catch(_e){}
    CACHE_KEYS.forEach(function(k){var v=json(k,null);if(Array.isArray(v))out.push(v);else if(v&&Array.isArray(v.posts))out.push(v.posts);else if(v&&Array.isArray(v.data))out.push(v.data);});
    return out;
  }
  function allPosts(){
    var out=[],seen={};
    arrays().forEach(function(arr){arr.forEach(function(p){var id=clean(p&&p.id);if(!id||seen[id])return;seen[id]=1;out.push(p);});});
    return out;
  }
  function postById(id,index){id=clean(id);if(!id)return null;if(index&&index[id])return index[id];var all=allPosts();for(var i=0;i<all.length;i++)if(clean(all[i]&&all[i].id)===id)return all[i];return null;}
  function postIndex(){var out={};allPosts().forEach(function(p){var id=clean(p&&p.id);if(id&&!out[id])out[id]=p;});return out;}
  function patchPost(p,profile){
    if(!p||!profile)return p;
    var uid=uidOf(p)||profile.id;if(!uid||uid!==profile.id)return p;
    var n=better(normalize(p)||{id:uid,user_id:uid},profile),q=p,changed=false;
    function set(k,v){if(v!=null&&String(q[k]==null?'':q[k])!==String(v)){if(!changed){q=Object.assign({},p);changed=true;}q[k]=v;}}
    set('creatorId',uid);set('creator_id',uid);set('user_id',uid);
    if(n.name){set('creatorName',n.name);set('creator_name',n.name);set('display_name',n.name);set('full_name',n.name);set('user_name',n.name);}
    if(n.handle){set('handle','@'+n.handle);set('username',n.handle);}
    /* Une publication ne doit jamais ressusciter son ancienne copie d'avatar.
       Tant que profiles.avatar_url n'est pas résolu, on garde l'icône profil canonique. */
    set('avatar',n.avatar||'');set('avatar_url',n.avatar||'');set('creator_avatar',n.avatar||'');set('author_avatar',n.avatar||'');set('user_avatar',n.avatar||'');set('__happyadAvatarKnownV855R32',n.__happyadAvatarKnownV855R32===true);set('__happyadAvatarRevisionV855R32',n.__happyadAvatarRevisionV855R32||'');
    if(n.badge){set('badge',n.badge);set('user_badge',n.badge);set('userBadge',n.badge);}
    return q;
  }
  function repairCachesNow(map){
    try{
      if(Array.isArray(window.ALL_POSTS)){
        var changed=false,next=window.ALL_POSTS.map(function(p){var pr=map[uidOf(p)];if(!pr)return p;var n=patchPost(p,pr);if(n!==p)changed=true;return n;});
        if(changed)window.ALL_POSTS=next;
      }
    }catch(_e){}
    CACHE_KEYS.forEach(function(k){
      try{
        var v=json(k,null),shape='array',arr=v;
        if(v&&Array.isArray(v.posts)){arr=v.posts;shape='posts';}
        else if(v&&Array.isArray(v.data)){arr=v.data;shape='data';}
        if(!Array.isArray(arr))return;
        var changed=false,next=arr.map(function(p){var pr=map[uidOf(p)];if(!pr)return p;var n=patchPost(p,pr);if(n!==p)changed=true;return n;});
        if(!changed)return;
        if(shape==='posts'){v.posts=next;write(k,v);}else if(shape==='data'){v.data=next;write(k,v);}else write(k,next);
      }catch(_e){}
    });
  }
  function scheduleCacheRepair(map){
    clearTimeout(cacheRepairTimer);
    cacheRepairTimer=setTimeout(function(){
      /* V863 : pas de timeout requestIdleCallback capable de forcer cette grosse
         sérialisation pendant un nouveau geste. Le coordinateur revérifie le
         scroll juste avant l'exécution. */
      deferAfterHomeScroll('author-cache-repair',function(){repairCachesNow(map);},90);
    },900);
  }
  function initials(v){v=nameOf(v)||clean(v)||'H';return (v.charAt(0)||'H').toUpperCase();}
  function esc(v){return clean(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function badgeHtml(v){try{return typeof window.badgeMarkHtml==='function'?window.badgeMarkHtml(v):'';}catch(_e){return '';}}
  function sameImage(img,url){
    if(!img||!url)return false;
    var a=clean(img.getAttribute('src')||img.src),b=clean(url);
    if(a===b)return true;
    try{return new URL(a,location.href).href===new URL(b,location.href).href;}catch(_e){return false;}
  }
  function paintCard(card,p,profile){
    if(!card||!profile)return;
    var tops=Array.prototype.slice.call(card.querySelectorAll('.miniTop'));if(!tops.length)return;
    var uid=profile.id||uidOf(p)||'';
    if(uid&&card.dataset.happyadOwnerUid!==uid)card.dataset.happyadOwnerUid=uid;
    var entry=AVATAR_MASTER&&uid&&AVATAR_MASTER.getEntry&&AVATAR_MASTER.getEntry(uid);
    tops.forEach(function(top){
      var box=top.querySelector('.avatar'),title=top.querySelector('.creator b');
      if(box){
        try{box.dataset.happyadAvatarUid=uid;box.dataset.happyadAvatarName=profile.name||'';}catch(_data){}
        if(entry&&entry.known&&AVATAR_MASTER&&AVATAR_MASTER.paintBox){
          AVATAR_MASTER.paintBox(box,entry,profile.name);delete box.dataset.avatarFailed;
        }else{
          var av=publicAvatar(profile.avatar),img=box.querySelector('img');
          if(av&&!sameImage(img,av)){
            var next=document.createElement('img');next.alt='';next.src=av;
            if(AVATAR_MASTER&&AVATAR_MASTER.styleExactCropImage)AVATAR_MASTER.styleExactCropImage(next);
            next.onerror=function(){
              try{if(next.parentNode===box){next.remove();if(AVATAR_MASTER&&AVATAR_MASTER.showDefaultAvatar)AVATAR_MASTER.showDefaultAvatar(box);else{box.textContent='';box.classList.add('happyadDefaultProfileAvatarV989');}box.dataset.avatarFailed='1';}}catch(_e){}
              if(!card.__happyadAvatarRetryV763){card.__happyadAvatarRetryV763=1;setTimeout(function(){hydrate(false,[card]);},1200);}
            };
            box.replaceChildren(next);delete box.dataset.avatarFailed;
          }else if(!av){if(img)img.remove();if(AVATAR_MASTER&&AVATAR_MASTER.showDefaultAvatar)AVATAR_MASTER.showDefaultAvatar(box);else{box.textContent='';box.classList.add('happyadDefaultProfileAvatarV989');}delete box.dataset.avatarFailed;}
        }
      }
      if(title&&profile.name){var desired=esc(profile.name)+badgeHtml(profile.badge);if(title.innerHTML!==desired)title.innerHTML=desired;}
    });
  }
  function cardsFromNode(node){
    var out=[];if(!node||node.nodeType!==1)return out;
    if(node.matches&&node.matches('.miniCard[data-post-id]'))out.push(node);
    if(node.querySelectorAll)node.querySelectorAll('.miniCard[data-post-id]').forEach(function(c){out.push(c);});
    return out;
  }
  function paintCards(cards,map){
    try{
      var idx=postIndex();
      (cards||[]).forEach(function(card){var p=postById(card.dataset.postId,idx),uid=uidOf(p)||clean(card.dataset.happyadOwnerUid),pr=map[uid]||localIdentity(uid);if(pr)paintCard(card,p||{},pr);});
    }catch(_e){}
  }
  function allLoadedCards(){try{return Array.prototype.slice.call(document.querySelectorAll('#list .miniCard[data-post-id],.hScroller .miniCard[data-post-id]'));}catch(_e){return [];}}
  function collectProfilesFromPosts(){var rows=[];allPosts().forEach(function(p){var uid=uidOf(p);if(uid)rows.push(Object.assign({},p,{id:uid,user_id:uid}));});return rows;}
  function idsNeeding(map){
    var ids={};
    allPosts().forEach(function(p){var uid=uidOf(p);if(!uid)return;var pr=map[uid]||localIdentity(uid),ae=AVATAR_MASTER&&AVATAR_MASTER.getEntry&&AVATAR_MASTER.getEntry(uid);if(!ae||!ae.known||Date.now()-Number(ae.at||0)>60000||!pr||!nameOf(pr)||/^(utilisateur happyad|utilisateur fyblic|happyad)$/i.test(nameOf(pr)))ids[uid]=1;});
    return Object.keys(ids).slice(0,120);
  }
  async function fetchProfiles(ids){
    var c=client();if(!c||!c.from||!ids.length)return [];
    var rows=[],primaryOk=false;
    for(var i=0;i<ids.length;i+=40){
      var part=ids.slice(i,i+40);
      try{var r=await c.from('happyad_profiles_public_v1').select('*').in('id',part);if(r&&!r.error&&Array.isArray(r.data)){primaryOk=true;rows=rows.concat(r.data);}}catch(_e){}
      var missing=part.filter(function(id){return !rows.some(function(x){return clean(x&&x.id)===id||clean(x&&x.user_id)===id;});});
      if(missing.length){try{var r2=await c.from('happyad_profiles_public_v1').select('*').in('user_id',missing);if(r2&&!r2.error&&Array.isArray(r2.data))rows=rows.concat(r2.data);}catch(_e2){}}
    }
    if(AVATAR_MASTER&&primaryOk&&AVATAR_MASTER.primeProfiles)AVATAR_MASTER.primeProfiles(rows,ids,{source:'card-author-profile-fetch',markMissing:true,broadcast:true});
    return rows;
  }
  async function hydrate(force,cards){
    if(homeScrollActive()){
      pending=true;
      deferAfterHomeScroll('author-hydrate',function(){var again=pending;pending=false;if(again)hydrate(force,cards);},90);
      return;
    }
    if(busy){pending=true;return;}
    var now=Date.now();
    if(!force&&now-lastFetch<3200){
      deferAfterHomeScroll('author-paint-cached',function(){paintCards(cards&&cards.length?cards:allLoadedCards(),authorMap());},40);
      return;
    }
    busy=true;lastFetch=now;
    try{
      var localRows=collectProfilesFromPosts(),me=json(USER_KEY,{});if(uidOf(me)||clean(me.id))localRows.push(me);
      var localResult=remember(localRows),map=localResult.map;
      Object.keys(map).forEach(function(id){map[id]=better(localIdentity(id),map[id]);});
      await waitHomeIdle();
      paintCards(cards&&cards.length?cards:allLoadedCards(),map);
      if(localResult.changed)scheduleCacheRepair(map);
      var ids=idsNeeding(map),remote=await fetchProfiles(ids);
      if(remote.length){
        /* La requête peut terminer pendant que le doigt a repris le scroll.
           Aucune écriture d'index auteur ni repaint global avant le repos. */
        await waitHomeIdle();
        var remoteResult=remember(remote);map=remoteResult.map;
        Object.keys(map).forEach(function(id){map[id]=better(localIdentity(id),map[id]);});
        await waitHomeIdle();
        paintCards(allLoadedCards(),map);
        if(remoteResult.changed)scheduleCacheRepair(map);
      }
    }catch(e){try{console.warn('Fyblic V863 card author hydrate',e);}catch(_e){}}
    finally{busy=false;if(pending){pending=false;deferAfterHomeScroll('author-hydrate-pending',function(){hydrate(false);},120);}}
  }

  var oldOwner=window.postOwnerData;
  if(typeof oldOwner==='function'&&!oldOwner.__v742){window.postOwnerData=function(p){var base={};try{base=oldOwner.apply(this,arguments)||{};}catch(_e){}var uid=uidOf(p)||clean(base.id||base.user_id),pr=uid?localIdentity(uid):null;return pr?better(base,pr):base;};window.postOwnerData.__v742=true;}
  var oldMap=window.mapHappyPost;
  if(typeof oldMap==='function'&&!oldMap.__v742){window.mapHappyPost=function(r){var p=oldMap.apply(this,arguments);var uid=uidOf(r)||uidOf(p);if(uid){p.creatorId=uid;p.creator_id=uid;p.user_id=uid;}var pr=uid?localIdentity(uid):null;return pr?patchPost(p,pr):p;};window.mapHappyPost.__v742=true;}
  var oldSlim=window.happyadSlimHomePostV407;
  if(typeof oldSlim==='function'&&!oldSlim.__v742){window.happyadSlimHomePostV407=function(p){var q=oldSlim.apply(this,arguments);var uid=uidOf(p)||uidOf(q);if(uid){q.creatorId=uid;q.creator_id=uid;q.user_id=uid;}var pr=uid?localIdentity(uid):null;return pr?patchPost(q,pr):q;};window.happyadSlimHomePostV407.__v742=true;}
  var oldCard=window.createCard;
  if(typeof oldCard==='function'&&!oldCard.__v742){window.createCard=function(p){var uid=uidOf(p),pr=uid?localIdentity(uid):null;if(pr)p=patchPost(p,pr);var card=oldCard.call(this,p);Promise.resolve().then(function(){paintCard(card,p,pr||localIdentity(uid));});return card;};window.createCard.__v742=true;}

  function bindObserver(){
    try{
      var root=document.getElementById('list')||document.body;if(!root||observer)return;
      observer=new MutationObserver(function(ms){
        var cards=[];ms.forEach(function(m){Array.prototype.forEach.call(m.addedNodes||[],function(n){cards=cards.concat(cardsFromNode(n));});});
        if(!cards.length)return;
        paintCards(cards,authorMap());
        clearTimeout(observerTimer);observerTimer=setTimeout(function(){hydrate(false,cards);},420);
      });
      observer.observe(root,{subtree:true,childList:true});
    }catch(_e){}
  }
  function boot(){
    bindObserver();
    setTimeout(function(){hydrate(true);},160);
    setTimeout(function(){hydrate(false);},2200);
  }
  window.HappyadCardAuthorAvatarV742={version:VERSION+'+V863_SCROLL_PRIORITY',hydrate:hydrate,paint:function(){deferAfterHomeScroll('author-manual-paint',function(){paintCards(allLoadedCards(),authorMap());},40);}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('HAPPYAD_PROFILE_IDENTITY_READY_V741',function(){deferAfterHomeScroll('author-identity-event',function(){paintCards(allLoadedCards(),authorMap());hydrate(false);},100);});
  window.addEventListener('HAPPYAD_PROFILE_AVATAR_UPDATED_V855R32',function(){mapMemo=null;mapMemoRaw='';deferAfterHomeScroll('author-avatar-event',function(){paintCards(allLoadedCards(),authorMap());hydrate(false);},90);});
  window.addEventListener('focus',function(){hydrate(false);});
  window.addEventListener('online',function(){hydrate(true);});
  window.addEventListener('pageshow',function(e){if(e&&e.persisted)hydrate(false);});
})();
