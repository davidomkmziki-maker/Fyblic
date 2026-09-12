(function(){
  'use strict';
  if(window.HappyProfileAvatarMasterV855R32)return;

  var VERSION='V995_PROFILE_AVATAR_SOURCE_DEFAULT_ICON';
  var CACHE_KEY='HAPPYAD_PROFILE_AVATAR_MASTER_V855R32';
  var SYNC_KEY='HAPPYAD_PROFILE_AVATAR_SYNC_V855R32';
  var CHANNEL_NAME='happyad-profile-avatar-v855r32';
  var MAX_ENTRIES=600;
  var FRESH_MS=60000;
  var AVATAR_FIELDS=['avatar','avatar_url','avatarUrl','user_avatar','userAvatar','creator_avatar','creatorAvatar','author_avatar','authorAvatar','profile_avatar','profileAvatar','profile_avatar_url','profileAvatarUrl','profile_photo_url','profilePhotoUrl'];
  var PROFILE_ONLY_FIELDS=['profile_photo','profilePhoto','profile_picture','profilePicture','profile_picture_url','profilePictureUrl','picture','picture_url'];
  var CACHE_HINT=/(?:Fyblic).*(?:PROFILE|USER|AUTHOR|ACTOR|POST|STOR|AVATAR|NOTIF|MESSAGE|CHAT|CONVERSATION|CONTACT|FOLLOW|SHARE|FAST_OPEN|ACTIVE|ACTION|VIDEO_CACHE|PHOTO_CACHE)/i;
  var instanceId=(Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
  var entries=loadEntries();
  var pending={};
  var retryAfter={};
  var flushTimer=0;
  var channel=null;
  var domObserver=null;
  var domTimer=0;
  var domRoots=[];
  var deferredEffects={changes:{},events:{},source:'',broadcast:false};
  function scrollPriority(){try{return window.HappyadHomeScrollPriorityV863||window.HappyProfileScrollPriorityV866||window.HappyProfileScrollPriorityV865||null;}catch(_e){return null;}}

  function clean(v){return String(v==null?'':v).trim();}
  function own(o,k){return !!(o&&Object.prototype.hasOwnProperty.call(o,k));}
  function uidOf(o){
    o=o&&typeof o==='object'?o:{};
    return clean(o.creatorId||o.creator_id||o.user_id||o.userId||o.ownerId||o.owner_id||o.authorId||o.author_id||o.actorId||o.actor_id||o.profile_id||o.profileId||o.target_user_id||o.targetUserId||o.other_user_id||o.otherUserId||o.auth_user_id||o.authUserId||o.account_uid||o.accountUid||o.uid||o.uuid||o.id);
  }
  function normalizeUrl(v){
    var raw=clean(v).replace(/^url\(["']?(.*?)["']?\)$/i,'$1');
    var low=raw.toLowerCase();
    if(!raw||low==='null'||low==='undefined'||low==='none'||low==='aucun'||raw==='👤'||raw==='🧑'||/^blob:/i.test(raw)||low.indexOf('placeholder')>=0)return '';
    if(/^https?:\/\//i.test(raw)||/^data:image\/(?:png|jpe?g|webp|gif|avif);/i.test(raw))return raw;
    if(/^\/storage\/v1\/object\//i.test(raw))return clean(window.HAPPYAD_SUPABASE_URL).replace(/\/+$/,'')+raw;
    return '';
  }
  function readJson(store,key,fallback){try{var value=JSON.parse(store.getItem(key)||'null');return value==null?fallback:value;}catch(_e){return fallback;}}
  function loadEntries(){
    var raw=readJson(localStorage,CACHE_KEY,{}),source=raw&&raw.entries&&typeof raw.entries==='object'?raw.entries:raw,out={};
    if(!source||typeof source!=='object'||Array.isArray(source))return out;
    Object.keys(source).forEach(function(uid){
      var row=source[uid];if(!row||row.known!==true)return;
      out[clean(uid)]={uid:clean(uid),known:true,url:normalizeUrl(row.url||row.avatarUrl),revision:clean(row.revision),at:Number(row.at||0)||0,source:clean(row.source||'cache')};
    });
    return out;
  }
  function persistEntries(){
    try{
      var ids=Object.keys(entries).sort(function(a,b){return Number(entries[b].at||0)-Number(entries[a].at||0);}).slice(0,MAX_ENTRIES),out={};
      ids.forEach(function(uid){out[uid]=entries[uid];});entries=out;
      localStorage.setItem(CACHE_KEY,JSON.stringify({version:VERSION,at:Date.now(),entries:out}));
    }catch(_e){}
  }
  function client(){
    try{
      if(window.happyadSupabase&&window.happyadSupabase.from)return window.happyadSupabase;
      if(window.supabaseClient&&window.supabaseClient.from)return window.supabaseClient;
      if(typeof window.happyadSb==='function'){var direct=window.happyadSb();if(direct&&direct.from)return direct;}
      if(window.parent&&window.parent!==window){
        if(window.parent.happyadSupabase&&window.parent.happyadSupabase.from)return window.parent.happyadSupabase;
        if(window.parent.supabaseClient&&window.parent.supabaseClient.from)return window.parent.supabaseClient;
        if(typeof window.parent.happyadSb==='function'){var parentDirect=window.parent.happyadSb();if(parentDirect&&parentDirect.from)return parentDirect;}
      }
      if(window.HappySupabaseClientMasterV972&&typeof window.HappySupabaseClientMasterV972.get==='function')return window.HappySupabaseClientMasterV972.get();
    }catch(_e){}
    return null;
  }
  function entry(uid){uid=clean(uid);return uid&&entries[uid]?Object.assign({},entries[uid]):null;}
  function current(uid,fallback){var e=entry(uid);return e&&e.known?e.url:normalizeUrl(fallback);}
  function isFresh(e){return !!(e&&e.known&&Date.now()-Number(e.at||0)<FRESH_MS);}
  function revisionOf(row){return clean(row&&row.avatar_revision||row&&row.avatar_updated_at||row&&row.updated_at||Date.now());}
  function makeEntry(uid,url,options){
    options=options||{};
    return {uid:clean(uid),known:true,url:normalizeUrl(url),revision:clean(options.revision||Date.now()),at:Number(options.at||Date.now()),source:clean(options.source||VERSION)};
  }
  function same(a,b){return !!(a&&b&&a.known===b.known&&a.url===b.url&&clean(a.revision)===clean(b.revision));}
  function detailOf(e,source){return {uid:e.uid,avatar:e.url,avatarUrl:e.url,avatar_url:e.url,known:true,deleted:!e.url,revision:e.revision,at:e.at,source:source||e.source||VERSION};}

  function patchObject(node,changes,depth,seen){
    if(!node||typeof node!=='object'||depth>7)return false;
    if(seen.indexOf(node)>=0)return false;seen.push(node);
    var changed=false,uid=uidOf(node),e=uid&&changes[uid];
    if(e){
      AVATAR_FIELDS.forEach(function(key){if(node[key]!==e.url){node[key]=e.url;changed=true;}});
      var looksPost=own(node,'post_id')||own(node,'media_url')||own(node,'mediaUrl')||own(node,'kind')||own(node,'title');
      if(!looksPost)PROFILE_ONLY_FIELDS.forEach(function(key){if(own(node,key)&&node[key]!==e.url){node[key]=e.url;changed=true;}});
      if(node.__happyadAvatarKnownV855R32!==true){node.__happyadAvatarKnownV855R32=true;changed=true;}
      if(node.__happyadAvatarRevisionV855R32!==e.revision){node.__happyadAvatarRevisionV855R32=e.revision;changed=true;}
    }
    if(Array.isArray(node)){
      for(var i=0;i<node.length;i++)if(patchObject(node[i],changes,depth+1,seen))changed=true;
    }else{
      Object.keys(node).forEach(function(key){var value=node[key];if(value&&typeof value==='object'&&patchObject(value,changes,depth+1,seen))changed=true;});
    }
    return changed;
  }
  function patchStore(store,changes){
    try{
      var keys=[];for(var i=0;i<store.length;i++){var key=store.key(i);if(key)keys.push(key);}
      keys.forEach(function(key){
        if(key===CACHE_KEY||key===SYNC_KEY)return;
        var direct=key.match(/^HAPPYAD_PROFILE_AVATAR_STABLE_CACHE_V743:(.+)$/);
        if(direct&&changes[clean(direct[1])]){var de=changes[clean(direct[1])];if(de.url)store.setItem(key,de.url);else store.removeItem(key);return;}
        if(key==='HAPPYAD_PROFILE_AVATAR_STABLE_CACHE_V1'){
          var authUid='';try{authUid=clean(localStorage.getItem('HAPPYAD_AUTH_UID'));}catch(_e){}
          if(changes[authUid]){if(changes[authUid].url)store.setItem(key,changes[authUid].url);else store.removeItem(key);}return;
        }
        if(!CACHE_HINT.test(key))return;
        var raw=store.getItem(key);if(!raw)return;
        /* Une très grosse copie est reconstruisible : la supprimer est moins
           coûteux et plus sûr que conserver un ancien avatar non corrigé. */
        if(raw.length>12000000){try{store.removeItem(key);}catch(_large){}return;}
        var value;try{value=JSON.parse(raw);}catch(_json){return;}
        if(patchObject(value,changes,0,[]))try{store.setItem(key,JSON.stringify(value));}catch(_write){}
      });
    }catch(_e){}
  }
  function invalidateCaches(changes){
    try{if(Array.isArray(window.ALL_POSTS))patchObject(window.ALL_POSTS,changes,0,[]);}catch(_e){}
    try{if(window.UserStore&&window.UserStore.data)patchObject(window.UserStore.data,changes,0,[]);}catch(_e2){}
    patchStore(localStorage,changes);patchStore(sessionStorage,changes);
    try{if(navigator.serviceWorker&&navigator.serviceWorker.controller)navigator.serviceWorker.controller.postMessage({type:'HAPPYAD_PROFILE_AVATAR_INVALIDATE_V855R32',uids:Object.keys(changes),source:VERSION});}catch(_e3){}
  }
  function initials(name){return clean(name||'H').split(/\s+/).slice(0,2).map(function(x){return x.charAt(0);}).join('').toUpperCase()||'H';}
  var DEFAULT_AVATAR_CLASS='happyadDefaultProfileAvatarV989';
  var DEFAULT_AVATAR_STYLE_ID='happyad-default-profile-avatar-v989-style';
  var DEFAULT_AVATAR_SELECTOR=[
    '.avatar','.commentAvatar','.commentAvatarSmall','.haCommentAvatar','.radarInitial','.mentionAutoAvatar',
    '.person-selector-avatar','.chat-avatar','.haProfileAvatar','.avatar-fallback','.ha629Avatar',
    '.ha629SharedPostAvatarV912','.haMentionAvatarV63','.haSearchAvatar','.happy-avatar','.hsvAvatar',
    '.haV872Avatar','.haHomeFsAvatar','#currentUserAvatar','#chatAvatar','#profileAvatar','#hsvAvatar'
  ].join(',');
  function ensureDefaultAvatarStyle(){
    try{
      if(document.getElementById(DEFAULT_AVATAR_STYLE_ID))return;
      var st=document.createElement('style');st.id=DEFAULT_AVATAR_STYLE_ID;
      st.textContent='.'+DEFAULT_AVATAR_CLASS+'{background-color:#fff!important;background-image:radial-gradient(circle at 50% 34%,#9299a4 0 19.5%,transparent 20.5%),radial-gradient(ellipse 61% 45% at 50% 103%,#9299a4 0 98%,transparent 100%)!important;background-repeat:no-repeat!important;background-size:100% 100%!important;background-position:center!important;color:transparent!important;text-shadow:none!important;}.'+DEFAULT_AVATAR_CLASS+'#currentUserAvatar #currentUserInitials{display:none!important;}.'+DEFAULT_AVATAR_CLASS+'>img[data-happyad-avatar-failed-v989="1"]{display:none!important;}';
      (document.head||document.documentElement).appendChild(st);
    }catch(_e){}
  }
  function directImage(box){
    try{return box&&box.querySelector?box.querySelector(':scope > img'):null;}catch(_e){return box&&box.querySelector?box.querySelector('img'):null;}
  }
  function clearDirectFallbackText(box){
    try{[].slice.call(box.childNodes||[]).forEach(function(node){if(node&&node.nodeType===3&&clean(node.nodeValue))node.nodeValue='';});}catch(_e){}
  }
  function showDefaultAvatar(box){
    if(!box)return;
    ensureDefaultAvatarStyle();
    try{
      box.classList.add(DEFAULT_AVATAR_CLASS);
      clearDirectFallbackText(box);
      /* V990 : le fallback doit rester visible même quand une surface impose
         son propre background avec !important (cartes, fullscreen, vidéo). */
      if(box.style){
        box.style.setProperty('background-color','#fff','important');
        box.style.setProperty('background-image','radial-gradient(circle at 50% 34%,#9299a4 0 19.5%,transparent 20.5%),radial-gradient(ellipse 61% 45% at 50% 103%,#9299a4 0 98%,transparent 100%)','important');
        box.style.setProperty('background-repeat','no-repeat','important');
        box.style.setProperty('background-size','100% 100%','important');
        box.style.setProperty('background-position','center','important');
        box.style.setProperty('color','transparent','important');
        box.style.setProperty('text-shadow','none','important');
      }
    }catch(_e){}
  }
  function hideDefaultAvatar(box){
    if(!box)return;
    try{
      box.classList.remove(DEFAULT_AVATAR_CLASS);
      if(box.style){
        ['background-color','background-image','background-repeat','background-size','background-position','color','text-shadow'].forEach(function(prop){box.style.removeProperty(prop);});
      }
    }catch(_e){}
  }
  function avatarBoxForImage(image){
    if(!image||!image.closest)return null;
    try{return image.closest(DEFAULT_AVATAR_SELECTOR);}catch(_e){return null;}
  }
  function refreshDefaultAvatarBox(box){
    if(!box||!box.matches)return;
    try{
      if(box.matches('.radarAvatar.add,.haProfileAvatarEdit,[data-happyad-avatar-no-default-v989]'))return;
      var image=directImage(box),src=image&&clean(image.getAttribute('src'));
      if(image&&src&&image.dataset.happyadAvatarFailedV989!=='1')hideDefaultAvatar(box);
      else showDefaultAvatar(box);
    }catch(_e){}
  }
  function scanDefaultAvatars(root){
    root=root||document;if(!root)return;
    var boxes=[];
    try{if(root.matches&&root.matches(DEFAULT_AVATAR_SELECTOR))boxes.push(root);if(root.querySelectorAll)root.querySelectorAll(DEFAULT_AVATAR_SELECTOR).forEach(function(box){boxes.push(box);});}catch(_e){}
    boxes.forEach(refreshDefaultAvatarBox);
  }
  function bindDefaultAvatarFallback(){
    ensureDefaultAvatarStyle();
    scanDefaultAvatars(document);
    document.addEventListener('error',function(event){
      var image=event&&event.target;if(!image||image.tagName!=='IMG')return;
      var box=avatarBoxForImage(image);if(!box)return;
      try{image.dataset.happyadAvatarFailedV989='1';image.style.setProperty('display','none','important');}catch(_e){}
      showDefaultAvatar(box);
    },true);
    document.addEventListener('load',function(event){
      var image=event&&event.target;if(!image||image.tagName!=='IMG')return;
      var box=avatarBoxForImage(image);if(!box)return;
      try{delete image.dataset.happyadAvatarFailedV989;image.style.removeProperty('display');}catch(_e){}
      hideDefaultAvatar(box);
    },true);
    try{
      var observer=new MutationObserver(function(records){
        records.forEach(function(record){
          if(record.type==='attributes'){var box=avatarBoxForImage(record.target);if(box)refreshDefaultAvatarBox(box);return;}
          try{if(record.target&&record.target.matches&&record.target.matches(DEFAULT_AVATAR_SELECTOR))refreshDefaultAvatarBox(record.target);}catch(_target){}
          [].slice.call(record.addedNodes||[]).forEach(function(node){if(node&&node.nodeType===1)scanDefaultAvatars(node);});
        });
      });
      observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
    }catch(_e){}
  }
  function styleExactCropImage(image){
    if(!image||!image.style)return image;
    try{
      image.classList.add('happyadCanonicalAvatarImageV855R33');
      image.style.setProperty('width','100%','important');
      image.style.setProperty('height','100%','important');
      image.style.setProperty('min-width','100%','important');
      image.style.setProperty('min-height','100%','important');
      image.style.setProperty('max-width','none','important');
      image.style.setProperty('max-height','none','important');
      image.style.setProperty('object-fit','cover','important');
      image.style.setProperty('object-position','50% 50%','important');
      image.style.setProperty('transform','none','important');
      image.style.setProperty('transform-origin','50% 50%','important');
      image.style.setProperty('display','block','important');
    }catch(_e){}
    return image;
  }
  function paintBox(box,e,name){
    if(!box||!e||!e.known)return;
    if(box.tagName==='IMG'){
      styleExactCropImage(box);
      if(e.url){
        try{delete box.dataset.happyadAvatarFailedV989;}catch(_clearFail){}
        if(clean(box.getAttribute('src'))!==e.url)box.src=e.url;box.hidden=false;
        var parentBox=avatarBoxForImage(box);if(parentBox)hideDefaultAvatar(parentBox);
      }else{
        box.removeAttribute('src');box.hidden=true;
        var fallbackParent=avatarBoxForImage(box);if(fallbackParent)showDefaultAvatar(fallbackParent);
      }
      try{box.dataset.happyadAvatarUid=e.uid;box.dataset.happyadAvatarKnown='1';box.dataset.happyadAvatarRevision=e.revision;}catch(_e){}
      return;
    }
    var image=directImage(box);
    if(e.url){
      hideDefaultAvatar(box);
      if(!image){image=document.createElement('img');image.alt='';image.decoding='async';box.replaceChildren(image);}
      try{delete image.dataset.happyadAvatarFailedV989;}catch(_clearFail2){}
      styleExactCropImage(image);
      if(clean(image.getAttribute('src'))!==e.url)image.src=e.url;
    }else{
      if(image)image.remove();
      showDefaultAvatar(box);
    }
    try{box.dataset.happyadAvatarUid=e.uid;box.dataset.happyadAvatarKnown='1';box.dataset.happyadAvatarRevision=e.revision;}catch(_e){}
  }
  function selectorUid(uid){try{return window.CSS&&CSS.escape?CSS.escape(uid):uid.replace(/["\\]/g,'\\$&');}catch(_e){return uid;}}
  function paintEntryDom(e,root){
    if(!e||!e.known||!root||!root.querySelectorAll)return;
    var uid=selectorUid(e.uid),nodes=[];
    try{
      if(root.matches&&root.matches('[data-happyad-avatar-uid="'+uid+'"]'))nodes.push(root);
      root.querySelectorAll('[data-happyad-avatar-uid="'+uid+'"]').forEach(function(n){nodes.push(n);});
      root.querySelectorAll('[data-happyad-owner-uid="'+uid+'"] .avatar').forEach(function(n){nodes.push(n);});
    }catch(_e){}
    nodes.forEach(function(node){paintBox(node,e,node.dataset&&node.dataset.happyadAvatarName);});
  }
  function paintKnownNodes(root,limit){
    root=root||document;if(!root||!root.querySelectorAll)return;
    var nodes=[];
    try{
      if(root.matches&&root.matches('[data-happyad-avatar-uid]'))nodes.push(root);
      root.querySelectorAll('[data-happyad-avatar-uid]').forEach(function(node){nodes.push(node);});
      root.querySelectorAll('[data-happyad-owner-uid] .avatar').forEach(function(node){nodes.push(node);});
    }catch(_e){}
    nodes.forEach(function(node){
      var owner=node.closest&&node.closest('[data-happyad-owner-uid]'),uid=clean(node.dataset&&node.dataset.happyadAvatarUid||owner&&owner.dataset&&owner.dataset.happyadOwnerUid),e=uid&&(limit?limit[uid]:entries[uid]);
      if(e&&e.known)paintBox(node,e,node.dataset&&node.dataset.happyadAvatarName);
    });
  }
  function emit(e,source){
    var detail=detailOf(e,source);
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_PROFILE_AVATAR_UPDATED_V855R32',{detail:detail}));}catch(_e){}
    try{document.dispatchEvent(new CustomEvent('happyad:profile-avatar-updated',{detail:detail}));}catch(_e2){}
  }
  function postEverywhere(message){
    var origin=(location.origin&&location.origin!=='null')?location.origin:'*';
    try{if(window.parent&&window.parent!==window)window.parent.postMessage(message,origin);}catch(_e){}
    try{document.querySelectorAll('iframe').forEach(function(frame){try{if(frame.contentWindow)frame.contentWindow.postMessage(message,origin);}catch(_x){}});}catch(_e2){}
  }
  function broadcastEntries(list,source){
    list=Array.isArray(list)?list.filter(Boolean):[];if(!list.length)return;
    var details=list.map(function(e){return detailOf(e,source);});
    var message={type:'HAPPYAD_PROFILE_AVATAR_SYNC_V855R32',sender:instanceId,details:details};
    if(details.length===1)message.detail=details[0];
    try{if(channel)channel.postMessage(message);}catch(_e){}
    try{localStorage.setItem(SYNC_KEY,JSON.stringify(Object.assign({nonce:Date.now()+'-'+Math.random()},message)));localStorage.removeItem(SYNC_KEY);}catch(_e2){}
    postEverywhere(message);
  }
  function flushDeferredEffects(){
    var changes=deferredEffects.changes,eventsMap=deferredEffects.events,source=deferredEffects.source,broadcast=deferredEffects.broadcast;
    deferredEffects={changes:{},events:{},source:'',broadcast:false};
    var events=Object.keys(eventsMap).map(function(uid){return eventsMap[uid];}).filter(Boolean);
    if(!events.length)return;
    persistEntries();
    invalidateCaches(changes);
    paintKnownNodes(document,changes);
    events.forEach(function(e){emit(e,source);});
    if(broadcast)broadcastEntries(events,source);
  }
  function queueBatchEffects(changed,events,options){
    options=options||{};
    Object.keys(changed||{}).forEach(function(uid){deferredEffects.changes[uid]=changed[uid];});
    (events||[]).forEach(function(e){if(e&&e.uid)deferredEffects.events[e.uid]=e;});
    deferredEffects.source=clean(options.source||deferredEffects.source||VERSION);
    if(options.broadcast!==false)deferredEffects.broadcast=true;
    var p=scrollPriority();
    if(p&&p.run)p.run('avatar-heavy-effects',flushDeferredEffects,90);
    else flushDeferredEffects();
  }
  function applyBatch(nextByUid,options){
    options=options||{};var changed={},events=[];
    Object.keys(nextByUid||{}).forEach(function(uid){
      uid=clean(uid);if(!uid)return;var next=nextByUid[uid],old=entries[uid];
      if(!next||next.known!==true)return;
      entries[uid]=next;
      if(!same(old,next)){changed[uid]=next;events.push(next);}
    });
    if(!events.length)return [];
    /* V863 : getEntry() voit immédiatement la nouvelle valeur en mémoire. Les
       parcours localStorage/sessionStorage, les repaint DOM et les broadcasts
       sont coalescés et exécutés seulement après le scroll de l'Accueil. */
    queueBatchEffects(changed,events,options);
    return events;
  }
  function set(uid,url,options){
    uid=clean(uid);if(!uid)return null;options=options||{};
    var next=makeEntry(uid,url,options);applyBatch((function(){var x={};x[uid]=next;return x;})(),options);return entry(uid);
  }
  function primeFromProfile(profile,options){
    profile=profile&&typeof profile==='object'?profile:{};var uid=clean(profile.id||profile.user_id||profile.uid);if(!uid||!own(profile,'avatar_url'))return null;
    options=Object.assign({source:'profiles.avatar_url',revision:revisionOf(profile)},options||{});
    return set(uid,profile.avatar_url,options);
  }
  function primeProfiles(rows,requestedIds,options){
    options=options||{};var next={},found={};
    (rows||[]).forEach(function(profile){var uid=clean(profile&&profile.id||profile&&profile.user_id);if(!uid||!own(profile,'avatar_url'))return;found[uid]=1;next[uid]=makeEntry(uid,profile.avatar_url,{source:options.source||'profiles.avatar_url',revision:revisionOf(profile)});});
    if(options.markMissing===true)(requestedIds||[]).forEach(function(uid){uid=clean(uid);if(uid&&!found[uid])next[uid]=makeEntry(uid,'',{source:options.source||'profiles.row-missing',revision:'missing'});});
    applyBatch(next,{source:options.source||'profiles.avatar_url',broadcast:options.broadcast!==false});return Object.keys(next).map(entry);
  }
  function request(uid,force){
    uid=clean(uid);if(!uid)return Promise.resolve(null);
    var cached=entry(uid);if(!force&&isFresh(cached))return Promise.resolve(cached);
    if(!force&&Number(retryAfter[uid]||0)>Date.now())return Promise.resolve(cached);
    return new Promise(function(resolve){
      if(!pending[uid])pending[uid]={force:!!force,waiters:[]};
      pending[uid].force=pending[uid].force||!!force;pending[uid].waiters.push(resolve);
      if(!flushTimer)flushTimer=setTimeout(flush,0);
    });
  }
  async function flush(){
    clearTimeout(flushTimer);flushTimer=0;var batch=pending;pending={};var ids=Object.keys(batch),c=client(),next={};
    if(c&&c.from&&ids.length){
      try{
        var rows=[];
        for(var i=0;i<ids.length;i+=80){
          var part=ids.slice(i,i+80),result=await c.from('profiles').select('id,avatar_url,updated_at').in('id',part);
          if(result&&result.error)throw result.error;
          if(result&&Array.isArray(result.data))rows=rows.concat(result.data);
        }
        var by={};rows.forEach(function(row){if(row&&row.id)by[clean(row.id)]=row;});
        ids.forEach(function(uid){var row=by[uid];delete retryAfter[uid];next[uid]=makeEntry(uid,row?row.avatar_url:'',{source:row?'profiles.avatar_url':'profiles.row-missing',revision:row?revisionOf(row):'missing'});});
        applyBatch(next,{source:'profiles.avatar_url',broadcast:true});
      }catch(_e){ids.forEach(function(uid){retryAfter[uid]=Date.now()+8000;});}
    }else{
      ids.forEach(function(uid){retryAfter[uid]=Date.now()+8000;});
    }
    ids.forEach(function(uid){var value=entry(uid);(batch[uid].waiters||[]).forEach(function(resolve){resolve(value);});});
    if(Object.keys(pending).length&&!flushTimer)flushTimer=setTimeout(flush,0);
  }
  function resolve(uid,options){options=options||{};return request(uid,!!options.force);}
  function resolveMany(ids,options){
    var seen={},list=[];(ids||[]).forEach(function(uid){uid=clean(uid);if(uid&&!seen[uid]){seen[uid]=1;list.push(uid);}});
    return Promise.all(list.map(function(uid){return request(uid,!!(options&&options.force));}));
  }
  function patchRecord(record,uid){
    record=record&&typeof record==='object'?record:{};uid=clean(uid||uidOf(record));var e=entry(uid);if(!e||!e.known)return record;
    var out=Object.assign({},record);AVATAR_FIELDS.forEach(function(key){out[key]=e.url;});var looksPost=own(out,'post_id')||own(out,'media_url')||own(out,'mediaUrl')||own(out,'kind')||own(out,'title');if(!looksPost)PROFILE_ONLY_FIELDS.forEach(function(key){if(own(out,key))out[key]=e.url;});out.__happyadAvatarKnownV855R32=true;out.__happyadAvatarRevisionV855R32=e.revision;return out;
  }
  function receive(message){
    if(!message||message.type!=='HAPPYAD_PROFILE_AVATAR_SYNC_V855R32'||message.sender===instanceId)return;
    var details=Array.isArray(message.details)?message.details:[message.detail||{}],nextByUid={},source='avatar-sync';
    details.forEach(function(d){var uid=clean(d&&d.uid);if(!uid||d.known!==true)return;source=d.source||source;nextByUid[uid]=makeEntry(uid,d.avatarUrl||d.avatar_url||d.avatar,{source:d.source||'avatar-sync',revision:d.revision,at:d.at});});
    applyBatch(nextByUid,{source:source,broadcast:false});
  }
  function bindSync(){
    try{if(typeof BroadcastChannel==='function'){channel=new BroadcastChannel(CHANNEL_NAME);channel.onmessage=function(event){receive(event&&event.data);};}}catch(_e){}
    window.addEventListener('storage',function(event){if(event&&event.key===SYNC_KEY&&event.newValue){try{receive(JSON.parse(event.newValue));}catch(_e){}}});
    window.addEventListener('message',function(event){try{if(location.origin!=='null'&&event.origin&&event.origin!==location.origin)return;receive(event.data);}catch(_e){}},true);
  }
  function watchDom(){
    try{
      function relevantRoot(node){
        if(!node||node.nodeType!==1)return null;
        try{
          if(node.matches&&node.matches('[data-happyad-avatar-uid],[data-happyad-owner-uid],.avatar'))return node;
          if(node.querySelector&&node.querySelector('[data-happyad-avatar-uid],[data-happyad-owner-uid] .avatar'))return node;
          var near=node.closest&&node.closest('[data-happyad-avatar-uid],[data-happyad-owner-uid] .avatar');
          if(near)return near;
        }catch(_e){}
        return null;
      }
      function queue(root){
        if(!root)return;
        if(domRoots.indexOf(root)<0)domRoots.push(root);
      }
      function flushDom(){
        domTimer=0;
        var roots=domRoots.splice(0,domRoots.length);
        var work=function(){roots.forEach(function(root){if(root&&root.isConnected)paintKnownNodes(root);});};
        var p=scrollPriority();if(p&&p.run)p.run('avatar-dom-new-roots',work,60);else work();
      }
      domObserver=new MutationObserver(function(records){
        records.forEach(function(record){
          [].slice.call(record.addedNodes||[]).forEach(function(node){queue(relevantRoot(node));});
        });
        if(!domRoots.length)return;
        clearTimeout(domTimer);
        /* V794 : une photo/vidéo ajoutée au fil n'entraîne plus un scan de tout
           document. Seules les nouvelles zones contenant réellement un avatar
           sont traitées, hors frame critique du scroll. */
        domTimer=setTimeout(flushDom,90);
      });
      domObserver.observe(document.documentElement,{childList:true,subtree:true});
    }catch(_e){}
  }
  function bootstrapCurrent(){
    var ids=[];try{var uid=clean(localStorage.getItem('HAPPYAD_AUTH_UID'));if(uid)ids.push(uid);}catch(_e){}
    try{var q=new URLSearchParams(location.search||''),route=clean(q.get('uid')||q.get('user_id')||q.get('profile_uid'));if(route)ids.push(route);}catch(_e2){}
    if(ids.length)resolveMany(ids).catch(function(){});
  }

  var api={version:VERSION,getEntry:entry,isKnown:function(uid){var e=entry(uid);return !!(e&&e.known);},current:current,resolve:resolve,resolveMany:resolveMany,set:set,primeFromProfile:primeFromProfile,primeProfiles:primeProfiles,patchRecord:patchRecord,paintBox:paintBox,showDefaultAvatar:showDefaultAvatar,hideDefaultAvatar:hideDefaultAvatar,scanDefaultAvatars:scanDefaultAvatars,styleExactCropImage:styleExactCropImage,paint:function(uid,root){var e=entry(uid);if(e)paintEntryDom(e,root||document);return e;},invalidate:function(uid,url,options){return set(uid,url,options||{});},uidOf:uidOf};
  window.HappyProfileAvatarMasterV855R32=Object.freeze(api);
  window.HappyProfileAvatarMaster=window.HappyProfileAvatarMasterV855R32;
  bindSync();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){paintKnownNodes(document);watchDom();bindDefaultAvatarFallback();bootstrapCurrent();},{once:true});
  else{paintKnownNodes(document);watchDom();bindDefaultAvatarFallback();bootstrapCurrent();}
})();
