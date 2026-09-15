(function(){
  'use strict';
  if(window.HappyAccountIsolationV937)return;
  var VERSION='ACCOUNT_ISOLATION_V937_STRICT_UID';
  var UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  var ACTIVE_IDENTITY_KEYS=[
    'HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL','HAPPYAD_USER','HAPPYAD_CURRENT_USER','happyad_current_user',
    'HAPPYAD_LOGGED_USER','HAPPYAD_USER_V1','HAPPYAD_AUTH_USER','HAPPYAD_ACTIVE_PROFILE',
    'HAPPYAD_PUBLIC_PROFILE_ACTIVE_UID','HAPPYAD_ACTIVE_PROFILE_UID','HAPPYAD_PROFILE_MASTER_ACTIVE_UID','HAPPYAD_PROFILE_MASTER_ACTIVE_URL'
  ];
  var LEGACY_PRIVATE_KEYS=[
    'HAPPYAD_STORIES_CACHE_V1','HAPPYAD_STORIES_LAST_GOOD_V885','HAPPYAD_HOME_RADAR_SEEN_V1','HAPPYAD_HIDDEN_STORIES_V1',
    'HAPPYAD_STORIES_MASTER_READY_V924','HAPPYAD_RADAR_REFRESH_NEEDED','HAPPYAD_STORY_REPORT_OUTBOX_V634',
    'HAPPYAD_STORY_LIKES_BY_STORY_V1','HAPPYAD_PUBLISH_DRAFT_V1','HAPPYAD_PUBLISH_TEMP_V1','HAPPYAD_PUBLISH_UPLOAD_TEMP_V1',
    'HAPPYAD_POST_MUTATION_OUTBOX_V613E','HAPPYAD_ACTIVE_PROFILE','HAPPYAD_PUBLIC_PROFILE_ACTIVE_UID','HAPPYAD_ACTIVE_PROFILE_UID',
    'HAPPYAD_COMMENT_LIKES_V2','HAPPYAD_PRIVATE_POST_IDS_V1','HAPPYAD_FOLLOW_STATE_V855R34','HAPPYAD_FOLLOW_SYNC_V855R34',
    'HAPPYAD_PROFILE_OWN_POSTS_STABLE_CACHE_V1','HAPPYAD_PROFILE_POSTS_CACHE_V1','HAPPYAD_PROFILE_PUBLISHED_POSTS_V1','HAPPYAD_PROFILE_POSTS_V1','HAPPYAD_USER_POSTS_CACHE_V1',
    'HAPPYAD_MESSAGE_UNREAD_TOTAL','HAPPYAD_MSG_LAST_STORY_REPLY_V629','HAPPYAD_FAST_OPEN_PHOTO_V1','HAPPYAD_FAST_OPEN_PHOTO_V1_LOCAL','HAPPYAD_FAST_OPEN_VIDEO_V1',
    'HAPPYAD_NOTIFICATION_OPEN_PHOTO_V1','HAPPYAD_OPEN_PHOTO_PAYLOAD_V1','HAPPYAD_MESSAGE_DIRECT_BOOT_V855R76',
    'HAPPYAD_VIDEO_ACTIONS_V1','HAPPYAD_ACTION_FAST_SYNC_V1','HAPPYAD_VIDEO_VIEW_MARKED_V1','HAPPYAD_PROFILE_AVATAR_STABLE_CACHE_V1',
    'happyad_support_chats_v26','happyad_support_current_v26','happyad_support_deleted_v745','happyad_support_user_context_v27'
  ];
  var ACCOUNT_PREFIXES=[
    'HAPPYAD_STORIES_CACHE_V1:','HAPPYAD_STORIES_LAST_GOOD_V885:','HAPPYAD_HOME_RADAR_SEEN_V1:','HAPPYAD_HIDDEN_STORIES_V1:',
    'HAPPYAD_STORY_LIKES_BY_STORY_V1:','HAPPYAD_STORY_LIKES_BY_STORY_V696_','HAPPYAD_MUTED_STORY_OWNERS_V1_',
    'HAPPYAD_MESSAGE_UNREAD_TOTAL_V931:','HAPPYAD_MESSAGE_REALTIME_JOURNAL_V930:','HAPPYAD_MSG_CONNECTED_PROFILE_V1:',
    'HAPPYAD_MESSAGE_INBOX_SNAPSHOT_V875:','HAPPYAD_MESSAGE_CONNECTED_IDENTITY_V1:','HAPPYAD_MSG_VIEW_ONCE_TOMBSTONES_V966:',
    'happyad-notifications-cache-v1:','HAPPYAD_USER_SETTINGS_V1_','HAPPYAD_USER_SETTINGS_PENDING_V1_','HAPPYAD_SETTINGS_LEGACY_DONE_V1_',
    'HAPPYAD_PROFILE_SETTINGS_V712_','HAPPYAD_PROFILE_AVATAR_STABLE_CACHE_V743:','HAPPYAD_PROFILE_IDENTITY_STABLE_V741:'
  ];
  function clean(v){return String(v==null?'':v).trim();}
  function isUuid(v){return UUID.test(clean(v));}
  function uidHint(){
    try{
      if(localStorage.getItem('HAPPYAD_SESSION_ACTIVE')!=='1')return '';
      var id=clean(localStorage.getItem('HAPPYAD_AUTH_UID'));
      return isUuid(id)?id:'';
    }catch(_e){return '';}
  }
  function key(base,uid){
    uid=clean(uid||uidHint());
    return clean(base)+':'+(isUuid(uid)?uid:'guest');
  }
  function removeKey(store,k){try{store.removeItem(k);}catch(_e){}}
  function clearActiveIdentity(){
    try{ACTIVE_IDENTITY_KEYS.forEach(function(k){localStorage.removeItem(k);});}catch(_e){}
    try{
      if(window.UserStore&&typeof window.UserStore==='object'){
        try{window.UserStore.data={};}catch(_x){}
        try{if(typeof window.UserStore.set==='function')window.UserStore.set({});}catch(_y){}
      }
    }catch(_e){}
  }
  function clearPrivateMemory(){
    /* V938 : l'état personnel des actions Home vit aussi en RAM. Le localStorage peut
       déjà avoir été purgé, mais les cartes montées doivent perdre leur couleur avant
       même le broadcast SIGNED_OUT / changement de compte. Les compteurs publics restent. */
    try{var homeActions=window.HappyHomeActionsV1;if(homeActions&&typeof homeActions.clearPersonalState==='function')homeActions.clearPersonalState({paint:true,persist:false});}catch(_actions){}
    try{window.HAPPYAD_STORIES_ITEMS=[];}catch(_e){}
    try{window.__HAPPYAD_STORIES_ITEMS_CACHE=[];}catch(_e){}
    try{window.__HAPPYAD_CURRENT_STORY_CTX=null;}catch(_e){}
    try{window.__HAPPYAD_STORY_VIEWER_CTX=null;}catch(_e){}
    try{window.__HAPPYAD_MESSAGE_CURRENT_USER=null;}catch(_e){}
    try{window.__HAPPYAD_ACTIVE_PROFILE=null;}catch(_e){}
    try{window.HAPPYAD_COMMENT_LIKE_MUTATIONS_V909=Object.create(null);}catch(_e){}
    try{window.__HAPPYAD_MESSAGE_CONTEXT=null;}catch(_e){}
  }
  function resetSensitiveFramesV937(reason){
    /* Les frames principales sont persistantes pour la vitesse. Lors d'un changement
       de compte, Publier et Messages ne doivent jamais conserver le DOM, un fichier
       sélectionné, un brouillon, une conversation ou un handle IndexedDB de A. */
    try{
      ['publish','message','profile'].forEach(function(page){
        var fr=document.getElementById('happyadAppFrame_'+page);if(!fr)return;
        try{fr.contentWindow&&fr.contentWindow.postMessage({type:'HAPPYAD_AUTH_SIGNED_OUT_V595',detail:{authenticated:false,event:'ACCOUNT_ISOLATION_RESET',reason:reason||'account-change-v937'}},'*');}catch(_m){}
        try{fr.src='about:blank';}catch(_s){}
        try{fr.remove();}catch(_r){}
      });
    }catch(_e){}
    try{
      var share=document.getElementById('happyadShareCenterFrame');
      if(share){try{share.src='about:blank';}catch(_s2){}try{share.remove();}catch(_r2){}}
    }catch(_e){}
  }
  function purgeLegacyPrivate(){
    try{
      LEGACY_PRIVATE_KEYS.forEach(function(k){localStorage.removeItem(k);});
      var dynamic=[];
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i)||'';
        if(k.indexOf('HAPPYAD_STORY_DESC_EDITED_')===0||k.indexOf('HAPPYAD_STORY_DESC_EDITED_ONCE_')===0||
           /^happyad_support_(?:chats|current)_v(?:7|8|9|1\d|2[0-5])$/.test(k))dynamic.push(k);
      }
      dynamic.forEach(function(k){localStorage.removeItem(k);});
    }catch(_e){}
    try{
      ['HAPPYAD_FAST_OPEN_PHOTO_V1','HAPPYAD_FAST_OPEN_VIDEO_V1','HAPPYAD_RECONNECT_OPEN_AUTH_V35','HAPPYAD_MESSAGE_DIRECT_BOOT_V855R76',
       'HAPPYAD_SESSION_PROFILE_POSTS_V104','HAPPYAD_MESSAGE_CONTEXT','HAPPYAD_MESSAGE_TARGET_PROFILE','HAPPYAD_NOTIFICATION_OPEN_PHOTO_V1','HAPPYAD_VIDEO_VIEW_MARKED_V1'].forEach(function(k){sessionStorage.removeItem(k);});
    }catch(_e){}
  }
  function shouldRemoveForUid(k,uid){
    k=clean(k);uid=clean(uid);if(!k||!uid)return false;
    for(var i=0;i<ACCOUNT_PREFIXES.length;i++){
      var p=ACCOUNT_PREFIXES[i];
      if(k.indexOf(p)===0 && k.indexOf(uid,p.length)>=0)return true;
    }
    return false;
  }
  function purgeLocalForUid(uid){
    uid=clean(uid);if(!isUuid(uid))return;
    try{
      var rm=[];
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);if(shouldRemoveForUid(k,uid))rm.push(k);
      }
      rm.forEach(function(k){removeKey(localStorage,k);});
    }catch(_e){}
  }
  function deleteDb(name){
    return new Promise(function(resolve){
      if(!window.indexedDB){resolve(false);return;}
      var done=false,finish=function(ok){if(done)return;done=true;resolve(!!ok);};
      try{
        var req=indexedDB.deleteDatabase(name);
        req.onsuccess=function(){finish(true);};req.onerror=function(){finish(false);};req.onblocked=function(){setTimeout(function(){finish(false);},250);};
        setTimeout(function(){finish(false);},900);
      }catch(_e){finish(false);}
    });
  }
  function clearMediaDbV937(){
    return new Promise(function(resolve){
      if(!window.indexedDB){resolve(false);return;}
      var done=false,finish=function(ok){if(done)return;done=true;resolve(!!ok);};
      try{
        var req=indexedDB.open('HAPPYAD_MEDIA_DB',1);
        req.onupgradeneeded=function(){try{if(!req.result.objectStoreNames.contains('media'))req.result.createObjectStore('media',{keyPath:'id'});}catch(_e){}};
        req.onerror=function(){finish(false);};
        req.onsuccess=function(){
          var db=req.result;
          try{
            if(!db.objectStoreNames.contains('media')){try{db.close();}catch(_c){}finish(true);return;}
            var tx=db.transaction('media','readwrite');tx.objectStore('media').clear();
            tx.oncomplete=function(){try{db.close();}catch(_c){}finish(true);};
            tx.onerror=tx.onabort=function(){try{db.close();}catch(_c){}finish(false);};
          }catch(_e){try{db.close();}catch(_c){}finish(false);}
        };
        setTimeout(function(){finish(false);},1200);
      }catch(_e){finish(false);}
    });
  }
  async function purgeIndexedDbForUid(uid){
    uid=clean(uid);
    if(isUuid(uid))await deleteDb('happyad-msg-v38a1-'+uid).catch(function(){});
    await clearMediaDbV937().catch(function(){});
    return true;
  }
  function beforeAccountChange(oldUid,newUid){
    oldUid=clean(oldUid);newUid=clean(newUid);
    if(oldUid&&oldUid!==newUid)purgeLocalForUid(oldUid);
    purgeLegacyPrivate();
    clearActiveIdentity();
    clearPrivateMemory();
    resetSensitiveFramesV937('before-account-change-v937');
    /* Laisser les iframes recevoir le reset de compte et fermer leurs handles DB
       avant deleteDatabase/clear; sinon Android peut garder l'ancienne DB bloquée. */
    if(oldUid&&oldUid!==newUid)setTimeout(function(){purgeIndexedDbForUid(oldUid).catch(function(){});},80);
  }
  async function purgeAccount(uid){
    uid=clean(uid);
    purgeLocalForUid(uid);purgeLegacyPrivate();clearActiveIdentity();clearPrivateMemory();resetSensitiveFramesV937('purge-account-v937');
    await purgeIndexedDbForUid(uid).catch(function(){});
    return true;
  }
  window.HappyAccountIsolationV937={version:VERSION,key:key,uidHint:uidHint,isUuid:isUuid,clearActiveIdentity:clearActiveIdentity,clearPrivateMemory:clearPrivateMemory,resetSensitiveFrames:resetSensitiveFramesV937,purgeLegacyPrivate:purgeLegacyPrivate,purgeLocalForUid:purgeLocalForUid,clearMediaDb:clearMediaDbV937,beforeAccountChange:beforeAccountChange,purgeAccount:purgeAccount};
  window.happyadAccountKeyV937=key;
})();
