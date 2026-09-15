(function(){
  'use strict';
  if(window.__HAPPYAD_PROFILE_IDENTITY_STABLE_MASTER_V741__)return;
  window.__HAPPYAD_PROFILE_IDENTITY_STABLE_MASTER_V741__=true;
  var VERSION='PROFILE_IDENTITY_STABLE_MASTER_V741';
  var USER_KEY='HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL';
  var USER_KEYS=[USER_KEY,'HAPPYAD_USER','HAPPYAD_CURRENT_USER','happyad_current_user'];
  var STABLE_PREFIX='HAPPYAD_PROFILE_IDENTITY_STABLE_V741:';
  var AVATAR_MASTER=window.HappyProfileAvatarMasterV855R32||window.HappyProfileAvatarMaster||null;
  var busy=false,lastRun=0,channel=null;
  function scrollPriority(){try{return window.HappyadHomeScrollPriorityV863||null;}catch(_e){return null;}}
  function runAfterHomeScroll(key,fn,delay){var p=scrollPriority();if(p&&p.run)return p.run(key,fn,delay);setTimeout(fn,Math.max(0,Number(delay)||0));return true;}
  function homeScrollActive(){var p=scrollPriority();return !!(p&&p.isActive&&p.isActive());}
  function waitHomeIdle(){var p=scrollPriority();return p&&p.whenIdle?p.whenIdle():Promise.resolve(true);}
  /* V758 — séparation stricte entre Mon profil et Profil visiteur.
     Ce maître répare uniquement l'identité du compte connecté. Dans une iframe
     ouverte avec public=1, il ne doit jamais peindre le DOM visiteur ni écrire
     l'identité du propriétaire dans les caches du profil demandé. */
  function visitorSurfaceV758(){
    try{
      var qs=new URLSearchParams(location.search||'');
      var uid=clean(qs.get('uid')||qs.get('user_id')||qs.get('profile_uid')||qs.get('auth_user_id')||qs.get('account_uid')||qs.get('owner')||qs.get('owner_id')||qs.get('creator_id')||qs.get('profile_id'));
      if(String(qs.get('public')||'')==='1'&&uid)return true;
      var html=document.documentElement,body=document.body;
      if(html&&(html.dataset.happyadPublicRouteV669==='1'||html.classList.contains('haPublicProfileSurfaceGateV669')))return true;
      if(body&&(body.classList.contains('happyadPublicCreatorProfile')||body.classList.contains('haProfileVisitor')||body.classList.contains('happyadVisitorProfilePersistentV601')))return true;
    }catch(_e){}
    return false;
  }
  function clean(v){return String(v==null?'':v).trim();}
  function uuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(v));}
  function json(k,f){try{var x=JSON.parse(localStorage.getItem(k)||'null');return x&&typeof x==='object'?x:(f||{});}catch(_e){return f||{};}}
  function first(){for(var i=0;i<arguments.length;i++){var v=clean(arguments[i]);if(v)return v;}return '';}
  function poorName(v){v=clean(v).toLowerCase();return !v||v==='utilisateur'||v==='utilisateur happyad'||v==='utilisateur fyblic'||v==='happyad'||v==='fyblic'||v==='compte happyad'||v==='compte fyblic'||v.indexOf('aucun compte')>-1||v.indexOf('chargement profil')>-1;}
  function avatarOf(p){p=p||{};return publicAvatar(first(p.avatar_url,p.avatarUrl,p.avatar,p.profile_photo_url,p.profilePhotoUrl,p.profile_photo,p.profilePhoto,p.profile_picture_url,p.profilePictureUrl,p.profile_picture,p.profilePicture,p.photo_url,p.photoUrl,p.image_url,p.imageUrl,p.picture,p.creator_avatar,p.creatorAvatar,p.author_avatar,p.authorAvatar,p.user_avatar,p.userAvatar,p.profile_image_url,p.profileImageUrl,p.profile_avatar_url,p.profileAvatarUrl));}
  function publicAvatar(v){v=clean(v).replace(/^url\(["']?(.*?)["']?\)$/i,'$1');var l=v.toLowerCase();if(!v||/^blob:/i.test(v)||v==='👤'||v==='🧑'||l==='none'||l==='null'||l==='undefined'||l.indexOf('placeholder')>-1)return '';if(/^https?:\/\//i.test(v)||/^data:image\/(?:png|jpe?g|webp|gif|avif);/i.test(v))return v;if(v.indexOf('/')<0&&!/\.(png|jpe?g|webp|gif|avif)(?:[?#]|$)/i.test(v))return '';var path=v.replace(/^\/+/, '').replace(/^happyad-media\//,'');try{var c=client();if(c&&c.storage&&c.storage.from){var r=c.storage.from('happyad-media').getPublicUrl(path);if(r&&r.data&&r.data.publicUrl)return r.data.publicUrl;}}catch(_e){}var base=clean(window.HAPPYAD_SUPABASE_URL||'').replace(/\/+$/,'');return base+'/storage/v1/object/public/happyad-media/'+encodeURI(path);}
  function nameOf(p){p=p||{};return first(p.full_name,p.display_name,p.name,p.creatorName,p.creator_name,p.author_name,p.user_name);}
  function handleOf(p){p=p||{};return first(p.username,p.handle).replace(/^@+/,'');}
  function badgeOf(p){p=p||{};return first(p.badge,p.user_badge,p.profile_badge,p.badge_type,p.certification,p.verified_badge);}
  function uidOf(p){p=p||{};return first(p.user_id,p.creatorId,p.creator_id,p.userId,p.owner_id,p.ownerId,p.author_id,p.authorId,p.profile_id,p.profileId,p.auth_user_id,p.authUserId,p.account_uid,p.accountUid,p.uid,p.uuid,p.id);}
  function currentUid(){
    try{
      if(localStorage.getItem('HAPPYAD_SESSION_ACTIVE')!=='1')return '';
      if(localStorage.getItem('HAPPYAD_FORCE_LOGOUT')==='1'&&Number(localStorage.getItem('HAPPYAD_FORCE_LOGOUT_UNTIL')||0)>Date.now())return '';
      var id=clean(localStorage.getItem('HAPPYAD_AUTH_UID'));return uuid(id)?id:'';
    }catch(_e){return '';}
  }
  function storyCacheKeyV937(){try{if(typeof window.happyadAccountKeyV937==='function')return window.happyadAccountKeyV937('HAPPYAD_STORIES_CACHE_V1');}catch(_e){}return 'HAPPYAD_STORIES_CACHE_V1:'+(currentUid()||'guest');}
  function stable(uid){return uid?json(STABLE_PREFIX+uid,{}):{};}
  function local(uid){
    var out={};USER_KEYS.forEach(function(k){var x=json(k,{}),id=uidOf(x);if(!uid||!id||id===uid)Object.keys(x).forEach(function(n){if(out[n]==null||out[n]===''||out[n]===false)out[n]=x[n];});});return out;
  }
  function ownPostIdentity(uid){
    var arrays=[];
    try{if(Array.isArray(window.ALL_POSTS))arrays.push(window.ALL_POSTS);}catch(_e){}
    ['HAPPYAD_HOME_BOOT_SNAPSHOT_V1','HAPPYAD_HOME_CONFIRMED_ORDER_V643','HAPPYAD_GLOBAL_POSTS_CACHE_V1','HAPPYAD_HOME_POSTS_CACHE_V1','HAPPYAD_POSTS_CACHE_V1','HAPPYAD_CACHED_POSTS_V1','HAPPYAD_FEED_CACHE_V1','HAPPYAD_SEARCH_POSTS_FAST_CACHE_V1','HAPPYAD_PUBLISH_POSTS_V2','HAPPYAD_PROFILE_POSTS_CACHE_V1','HAPPYAD_PROFILE_OWN_POSTS_STABLE_CACHE_V1','HAPPYAD_USER_POSTS_CACHE_V1'].concat([storyCacheKeyV937()]).forEach(function(k){var a=json(k,null);if(Array.isArray(a))arrays.push(a);else if(a&&Array.isArray(a.posts))arrays.push(a.posts);else if(a&&Array.isArray(a.data))arrays.push(a.data);});
    var best={};
    arrays.forEach(function(a){a.forEach(function(p){if(uidOf(p)!==uid)return;var n=nameOf(p),av=avatarOf(p),b=badgeOf(p),h=handleOf(p);if(!poorName(n)&&poorName(nameOf(best)))best.name=n;if(av&&!avatarOf(best))best.avatar=av;if(b&&!badgeOf(best))best.badge=b;if(h&&!handleOf(best))best.handle=h;});});
    return best;
  }
  function merge(uid,remote){
    var cur=local(uid),st=stable(uid),post=ownPostIdentity(uid),r=remote||{};
    if(AVATAR_MASTER&&AVATAR_MASTER.primeFromProfile&&Object.prototype.hasOwnProperty.call(r,'avatar_url'))AVATAR_MASTER.primeFromProfile(r,{source:'identity-v741-remote'});
    var rn=nameOf(r), cn=nameOf(cur), sn=nameOf(st), pn=nameOf(post);
    var name=!poorName(rn)?rn:(!poorName(cn)?cn:(!poorName(sn)?sn:(!poorName(pn)?pn:'Utilisateur Fyblic')));
    var avatarEntry=AVATAR_MASTER&&AVATAR_MASTER.getEntry&&AVATAR_MASTER.getEntry(uid);
    var avatar=avatarEntry&&avatarEntry.known?(avatarEntry.url||''):'';
    var handle=first(handleOf(r),handleOf(cur),handleOf(st),handleOf(post));
    var remoteBadge=clean(badgeOf(r)).toLowerCase(),oldBadge=clean(first(badgeOf(cur),badgeOf(st),badgeOf(post))).toLowerCase();
    var badge=(remoteBadge&&remoteBadge!=='aucun'&&remoteBadge!=='none'&&remoteBadge!=='null'&&remoteBadge!=='undefined')?remoteBadge:(oldBadge||'aucun');
    var remoteRole=clean(r&&r.role).toLowerCase(),oldRole=clean(first(cur.role,st.role)).toLowerCase();
    var role=(remoteRole&&!(remoteRole==='user'&&oldRole&&oldRole!=='user'))?remoteRole:(oldRole||remoteRole||'user');
    var next=Object.assign({},st,cur,r,{id:uid,user_id:uid,name:name,full_name:name,display_name:name,handle:handle,username:handle,avatar:avatar,avatar_url:avatar,badge:badge,role:role});
    if(avatarEntry&&avatarEntry.known){next.__happyadAvatarKnownV855R32=true;next.__happyadAvatarRevisionV855R32=avatarEntry.revision||'';if(AVATAR_MASTER&&AVATAR_MASTER.patchRecord)next=AVATAR_MASTER.patchRecord(next,uid);}
    return next;
  }
  function identitySig(p){p=p||{};return [uidOf(p),nameOf(p),handleOf(p),avatarOf(p),badgeOf(p),clean(p.role),clean(p.type),clean(p.bio),clean(p.country)].join('|');}
  function persist(next,source){
    if(visitorSurfaceV758())return next;
    var uid=uidOf(next);if(!uuid(uid))return next;
    /* V937 : ce maître n'est plus une autorité de session. Une requête profil
       terminée après Déconnexion ne peut ni repeindre A ni réactiver le compte. */
    if(currentUid()!==uid)return next;
    var before=local(uid), changed=identitySig(before)!==identitySig(next);
    USER_KEYS.forEach(function(k){try{localStorage.setItem(k,JSON.stringify(Object.assign({},json(k,{}),next)));}catch(_e){}});
    try{localStorage.setItem(STABLE_PREFIX+uid,JSON.stringify(Object.assign({},stable(uid),next,{identity_source_v741:source||'',identity_saved_at_v741:new Date().toISOString()})));}catch(_e){}
    try{if(window.UserStore){window.UserStore.data=Object.assign({},window.UserStore.data||{},next);if(window.UserStore.save)window.UserStore.save();}}catch(_e){}
    if(changed){
      /* V863 : l'identité canonique est sauvegardée tout de suite, mais les
         réparations de gros caches, le repaint global et les événements qui
         déclenchent d'autres hydrations attendent la fin du geste Accueil. */
      runAfterHomeScroll('identity-heavy-'+uid,function(){
        repairPosts(next);
        paint(next,true);
        try{window.dispatchEvent(new CustomEvent('HAPPYAD_PROFILE_IDENTITY_READY_V741',{detail:{profile:next,source:source||VERSION}}));}catch(_e){}
        try{if(window.parent&&window.parent!==window)window.parent.postMessage({type:'HAPPYAD_PROFILE_IDENTITY_V741',profile:next,source:source||VERSION},location.origin);}catch(_e){}
      },90);
    }else paint(next,false);
    return next;
  }
  function repairPosts(next){
    var uid=uidOf(next);if(!uid)return;
    function patch(p){if(!p||uidOf(p)!==uid)return p;var ae=AVATAR_MASTER&&AVATAR_MASTER.getEntry&&AVATAR_MASTER.getEntry(uid),avatarKnown=!!(ae&&ae.known),avatar=avatarKnown?(ae.url||''):next.avatar;return Object.assign({},p,{creatorName:next.name,creator_name:next.name,display_name:next.name,full_name:next.name,handle:next.handle?('@'+next.handle):p.handle,username:next.handle||p.username,avatar:avatarKnown?avatar:(avatar||p.avatar),avatar_url:avatarKnown?avatar:(avatar||p.avatar_url),creator_avatar:avatarKnown?avatar:(avatar||p.creator_avatar),author_avatar:avatarKnown?avatar:(avatar||p.author_avatar),user_avatar:avatarKnown?avatar:(avatar||p.user_avatar),__happyadAvatarKnownV855R32:avatarKnown||p.__happyadAvatarKnownV855R32===true,badge:next.badge||p.badge,user_badge:next.badge||p.user_badge});}
    try{if(Array.isArray(window.ALL_POSTS))window.ALL_POSTS=window.ALL_POSTS.map(patch);}catch(_e){}
    ['HAPPYAD_HOME_BOOT_SNAPSHOT_V1','HAPPYAD_HOME_CONFIRMED_ORDER_V643','HAPPYAD_GLOBAL_POSTS_CACHE_V1','HAPPYAD_HOME_POSTS_CACHE_V1','HAPPYAD_POSTS_CACHE_V1','HAPPYAD_CACHED_POSTS_V1','HAPPYAD_FEED_CACHE_V1','HAPPYAD_SEARCH_POSTS_FAST_CACHE_V1','HAPPYAD_PUBLISH_POSTS_V2','HAPPYAD_PROFILE_POSTS_CACHE_V1','HAPPYAD_PROFILE_OWN_POSTS_STABLE_CACHE_V1','HAPPYAD_USER_POSTS_CACHE_V1'].concat([storyCacheKeyV937()]).forEach(function(k){try{var raw=json(k,null),shape='array',a=raw;if(raw&&Array.isArray(raw.posts)){a=raw.posts;shape='posts';}else if(raw&&Array.isArray(raw.data)){a=raw.data;shape='data';}if(!Array.isArray(a))return;var changed=false;var b=a.map(function(p){var n=patch(p);if(n!==p)changed=true;return n;});if(changed){if(shape==='posts'){raw.posts=b;localStorage.setItem(k,JSON.stringify(raw));}else if(shape==='data'){raw.data=b;localStorage.setItem(k,JSON.stringify(raw));}else localStorage.setItem(k,JSON.stringify(b));}}catch(_e){}});
  }
  function paint(next,allowRender){
    if(visitorSurfaceV758())return;
    try{
      var n=document.getElementById('profileName');if(n&&!poorName(next.name))n.textContent=next.name;
      var h=document.getElementById('profileHandle');if(h&&next.handle)h.textContent='@'+next.handle.replace(/^@+/,'');
      var av=document.getElementById('avatarPreview'),ae=AVATAR_MASTER&&AVATAR_MASTER.getEntry&&AVATAR_MASTER.getEntry(next.id);if(av&&ae&&ae.known){if(ae.url){av.style.backgroundImage="url('"+String(ae.url).replace(/'/g,'%27')+"')";av.dataset.stableAvatar=ae.url;av.dataset.stableAvatarUid=next.id;av.classList.remove('happyadAvatarPending');var f=av.firstChild;if(f&&f.nodeType===3)f.textContent='';}else{av.style.removeProperty('background-image');delete av.dataset.stableAvatar;av.dataset.stableAvatarUid=next.id;}}
      if(allowRender&&typeof window.render==='function'&&document.getElementById('profileName'))setTimeout(function(){try{window.render();}catch(_e){}},0);
    }catch(_e){}
  }
  function client(){try{return window.happyadSupabase||(typeof window.happyadSb==='function'&&window.happyadSb())||null;}catch(_e){return null;}}
  async function refresh(force){
    if(visitorSurfaceV758())return;
    /* V863 : merge() relit plusieurs caches de publications. Même cette phase de
       lecture est secondaire face au geste de l'Accueil. */
    if(homeScrollActive()){runAfterHomeScroll('identity-refresh',function(){refresh(force);},100);return;}
    var now=Date.now();if(busy||(!force&&now-lastRun<1200))return;busy=true;lastRun=now;
    try{
      var uid=currentUid();if(!uid)return;
      var provisional=merge(uid,{});persist(provisional,'local-repair-v741');
      var c=client();if(!c||!c.from)return;
      var q=await c.from('happyad_profiles_public_v1').select('*').eq('id',uid).maybeSingle();
      if(q&&q.error){console.warn('Fyblic V741 profile refresh kept local identity',q.error);return;}
      if(q&&q.data){
        /* La réponse réseau peut tomber au milieu d'un nouveau scroll. */
        await waitHomeIdle();
        if(AVATAR_MASTER&&AVATAR_MASTER.primeFromProfile)AVATAR_MASTER.primeFromProfile(q.data,{source:'identity-v741-refresh'});
        var next=merge(uid,q.data);persist(next,'supabase-profile-v741');
      }
    }catch(e){console.warn('Fyblic V863 profile identity refresh',e);}finally{busy=false;}
  }
  function subscribe(){
    if(visitorSurfaceV758())return;
    try{var uid=currentUid(),c=client();if(!uid||!c||!c.channel||channel)return;channel=c.channel('happyad_profile_identity_v741_'+uid).on('postgres_changes',{event:'*',schema:'public',table:'profiles',filter:'id=eq.'+uid},function(){refresh(true);}).subscribe();}catch(_e){}
  }
  window.HappyadProfileIdentityV741={version:VERSION+'+V758_VISITOR_ISOLATION',refresh:refresh,current:function(){var uid=currentUid();return uid?merge(uid,{}):{};},persist:persist,isVisitorSurface:visitorSurfaceV758};
  function boot(){refresh(true);setTimeout(function(){refresh(true);subscribe();},500);setTimeout(function(){refresh(false);},2200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('HAPPYAD_AUTH_STATE_V595',function(){setTimeout(function(){refresh(true);subscribe();},40);});
  window.addEventListener('HAPPYAD_PROFILE_IDENTITY_V741',function(e){try{var p=e&&e.detail&&e.detail.profile;if(p&&uuid(uidOf(p)))runAfterHomeScroll('identity-auth-event',function(){persist(merge(uidOf(p),p),'auth-event-v741');},70);}catch(_e){}});
  window.addEventListener('HAPPYAD_PROFILE_AVATAR_UPDATED_V855R32',function(e){try{var d=e&&e.detail||{},uid=clean(d.uid);if(uid&&uid===currentUid())runAfterHomeScroll('identity-avatar-event',function(){persist(merge(uid,{}),'avatar-master-v855r32');},70);}catch(_e){}});
  window.addEventListener('message',function(e){try{if(e.origin!==location.origin)return;var d=e.data||{};if(d.type==='HAPPYAD_PROFILE_IDENTITY_V741'&&d.profile&&uuid(uidOf(d.profile))){var profile=d.profile;runAfterHomeScroll('identity-frame-message',function(){persist(merge(uidOf(profile),profile),'frame-message-v741');},70);}}catch(_e){}},true);
  window.addEventListener('focus',function(){refresh(false);});
  window.addEventListener('online',function(){refresh(true);});
  window.addEventListener('pageshow',function(){refresh(false);});
  document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh(false);});
})();
