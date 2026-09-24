(function(){
  'use strict';
  if(window.__HAPPYAD_AUTH_SESSION_MASTER_V598__)return;
  window.__HAPPYAD_AUTH_SESSION_MASTER_V598__=true;

  var VERSION='AUTH_SESSION_V1105_UI_GOOGLE_GUEST_PROFILE';
  var USER_KEY='HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL';
  var session=null;
  var ready=false;
  var refreshPromise=null;
  var sessionErrorCountV937=0;
  var sessionRetryTimerV937=0;
  var profileSyncPromiseV865=null;
  var profileSyncUidV865='';
  var profileSyncLastAtV865=0;
  var profileSyncResultV865=null;
  var PROFILE_SYNC_DEDUPE_MS_V865=2500;
  var pendingIntent=null;
  var overlay=null;
  var panelRoot=null;
  var busy=false;
  var lastGateTarget=null;
  var lastGateAt=0;
  var lastNoticeText='';
  var lastNoticeAt=0;
  var lastDirectMode='';
  var lastDirectAt=0;
  var authOpeningTimerV710=0;
  var authUnlockAtV710=0;
  var recoveryFlowV855R40={email:'',verified:false};
  var loginGuardV855R47={pending:false,userId:'',email:'',phone:'',policy:null,verified:{},codesSent:{gmail:false,phone:false}};
  var LOGIN_GUARD_PENDING_KEY_V855R47='HAPPYAD_LOGIN_GUARD_PENDING_V855R47';
  var LOGIN_GUARD_TTL_MS_V855R47=15*60*1000;

  function clean(v){return String(v==null?'':v).trim();}
  function readLoginGuardPendingV855R47(){
    try{
      var raw=JSON.parse(localStorage.getItem(LOGIN_GUARD_PENDING_KEY_V855R47)||'null');
      if(!raw||!raw.until||Date.now()>=Number(raw.until)){localStorage.removeItem(LOGIN_GUARD_PENDING_KEY_V855R47);return null;}
      return raw;
    }catch(_e){return null;}
  }
  function isLoginGuardPendingV855R47(){return !!(loginGuardV855R47.pending||readLoginGuardPendingV855R47());}
  function setLoginGuardPendingV855R47(on,userId){
    loginGuardV855R47.pending=!!on;
    if(on){
      if(userId)loginGuardV855R47.userId=clean(userId);
      try{localStorage.setItem(LOGIN_GUARD_PENDING_KEY_V855R47,JSON.stringify({uid:clean(userId||loginGuardV855R47.userId),until:Date.now()+LOGIN_GUARD_TTL_MS_V855R47}));localStorage.setItem('HAPPYAD_SESSION_ACTIVE','0');localStorage.removeItem('HAPPYAD_AUTH_UID');}catch(_e){}
    }else{
      try{localStorage.removeItem(LOGIN_GUARD_PENDING_KEY_V855R47);}catch(_e){}
    }
  }
  function resetLoginGuardV855R47(){
    loginGuardV855R47={pending:false,userId:'',email:'',phone:'',policy:null,verified:{},codesSent:{gmail:false,phone:false}};
    setLoginGuardPendingV855R47(false,'');
  }
  function happyadHttpOriginV701(value){
    try{
      var u=new URL(String(value||''),location.href);
      if(u.protocol!=='https:'&&u.protocol!=='http:')return '';
      if(!u.hostname||/\.supabase\.co$/i.test(u.hostname))return '';
      return u.origin.replace(/\/+$/,'');
    }catch(_e){return '';}
  }
  function happyadRecoveryAppOriginV701(){
    var candidates=[];
    try{if(window.top&&window.top!==window)candidates.push(window.top.location.origin);}catch(_e){}
    try{if(location.ancestorOrigins&&location.ancestorOrigins.length)candidates.push(location.ancestorOrigins[0]);}catch(_e){}
    try{if(document.referrer)candidates.push(new URL(document.referrer).origin);}catch(_e){}
    try{candidates.push(location.origin);}catch(_e){}
    try{candidates.push(localStorage.getItem('HAPPYAD_APP_ORIGIN_V701'));}catch(_e){}
    for(var i=0;i<candidates.length;i++){
      var origin=happyadHttpOriginV701(candidates[i]);
      if(!origin)continue;
      try{localStorage.setItem('HAPPYAD_APP_ORIGIN_V701',origin);}catch(_e){}
      return origin;
    }
    return '';
  }
  function happyadPasswordRecoveryRedirectV701(){
    var origin=happyadRecoveryAppOriginV701();
    return origin?origin+'/auth/reset/':'';
  }
  window.happyadPasswordRecoveryRedirectV701=happyadPasswordRecoveryRedirectV701;
  try{happyadRecoveryAppOriginV701();}catch(_e){}
  function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(v));}
  function isolationV937(){try{return window.HappyAccountIsolationV937||null;}catch(_e){return null;}}
  function logoutLockActiveV937(){
    try{
      if(localStorage.getItem('HAPPYAD_FORCE_LOGOUT')!=='1')return false;
      var until=Number(localStorage.getItem('HAPPYAD_FORCE_LOGOUT_UNTIL')||0)||0;
      return !until||Date.now()<until;
    }catch(_e){return false;}
  }
  function syncBootAuthClassV937(authenticated){
    try{
      var root=document.documentElement;if(!root)return;
      root.classList.toggle('happyadRadarBootUserV599',!!authenticated);
      root.classList.toggle('happyadRadarBootGuestV599',!authenticated);
    }catch(_e){}
  }
  function esc(v){return clean(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function client(){
    try{
      if(window.happyadSupabase)return window.happyadSupabase;
      if(typeof window.happyadSb==='function')return window.happyadSb();
      if(window.HappySupabaseClientMasterV972&&typeof window.HappySupabaseClientMasterV972.get==='function')return window.HappySupabaseClientMasterV972.get();
    }catch(_e){}
    return null;
  }
  function actualUser(){return session&&session.user&&isUuid(session.user.id)?session.user:null;}
  function localHintId(){
    try{
      if(localStorage.getItem('HAPPYAD_FORCE_LOGOUT')==='1')return '';
      if(Number(localStorage.getItem('HAPPYAD_FORCE_LOGOUT_UNTIL')||0)>Date.now())return '';
      if(localStorage.getItem('HAPPYAD_SESSION_ACTIVE')!=='1')return '';
      var id=clean(localStorage.getItem('HAPPYAD_AUTH_UID'));
      return isUuid(id)?id:'';
    }catch(_e){return '';}
  }
  function isAuthenticated(){if(isLoginGuardPendingV855R47())return false;var u=actualUser();if(u&&u.id)return true;return !ready&&!!localHintId();}
  function sessionDetail(eventName){
    var u=actualUser();
    /* V964 : pendant le très court démarrage de getSession(), un UUID local déjà
       validé par la session précédente reste un indice connecté. FRAME_READY ne
       doit jamais transformer cet intervalle en faux SIGNED_OUT pour Messages. */
    var hintedId=!u&&!ready&&!isLoginGuardPendingV855R47()?localHintId():'';
    var effectiveUser=u||(hintedId?{id:hintedId,user_metadata:{},happyad_provisional_session_v964:true}:null);
    var authenticated=!!effectiveUser&&!isLoginGuardPendingV855R47();
    return {event:eventName||'',authenticated:authenticated,user:authenticated?effectiveUser:null,user_id:authenticated&&effectiveUser&&effectiveUser.id||'',pending_second_step:!!u&&!authenticated,provisional:!!(authenticated&&!u),version:VERSION};
  }
  function forEachFrame(fn){
    try{document.querySelectorAll('#happyadAppShell iframe.happyadAppFrame').forEach(function(fr){try{if(fr.contentWindow)fn(fr.contentWindow,fr);}catch(_e){}});}catch(_e){}
  }
  function signalFramesSignedOutForSwitchV937(oldId,nextId){
    if(!oldId||!nextId||oldId===nextId)return;
    var detail={event:'ACCOUNT_SWITCH_RESET',authenticated:false,user:null,user_id:'',previous_user_id:oldId,next_user_id:nextId,version:VERSION};
    forEachFrame(function(w){try{w.postMessage({type:'HAPPYAD_AUTH_SIGNED_OUT_V595',detail:detail},'*');}catch(_e){}});
  }
  function broadcast(eventName){
    var detail=sessionDetail(eventName);
    syncBootAuthClassV937(detail.authenticated);
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_AUTH_STATE_V595',{detail:detail}));}catch(_e){}
    var type=detail.authenticated?'HAPPYAD_AUTH_SIGNED_IN_V595':'HAPPYAD_AUTH_SIGNED_OUT_V595';
    forEachFrame(function(w){try{w.postMessage({type:type,detail:detail},'*');}catch(_e){}});
    try{window.postMessage({type:type,detail:detail},'*');}catch(_e){}
  }
  function removeLogoutLocks(){
    try{
      ['HAPPYAD_FORCE_LOGOUT','HAPPYAD_FORCE_LOGOUT_UNTIL','HAPPYAD_LOGOUT_LOCK_V1','HAPPYAD_LOGOUT_AT_V1'].forEach(function(k){localStorage.removeItem(k);});
    }catch(_e){}
  }
  var PROFILE_STABLE_PREFIX_V741='HAPPYAD_PROFILE_IDENTITY_STABLE_V741:';
  function avatarMasterV937(){try{return window.HappyProfileAvatarMasterV855R32||window.HappyProfileAvatarMaster||null;}catch(_e){return null;}}
  function hasOwnV741(o,k){return !!(o&&Object.prototype.hasOwnProperty.call(o,k));}
  function firstV741(){for(var i=0;i<arguments.length;i++){var v=clean(arguments[i]);if(v)return v;}return '';}
  function readJsonV741(k){try{return JSON.parse(localStorage.getItem(k)||'null')||{};}catch(_e){return {};}}
  function poorNameV741(v){v=clean(v).toLowerCase();return !v||v==='utilisateur'||v==='utilisateur happyad'||v==='utilisateur fyblic'||v==='happyad'||v==='fyblic'||v==='compte happyad'||v==='compte fyblic'||v.indexOf('aucun compte')>-1||v.indexOf('chargement profil')>-1;}
  function poorHandleV741(v){v=clean(v).replace(/^@+/,'').toLowerCase();return !v||v==='happyad'||v==='utilisateur';}
  function readStableV741(uid){return uid?readJsonV741(PROFILE_STABLE_PREFIX_V741+uid):{};}
  function readCurrentV741(uid){
    var keys=['HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL','HAPPYAD_USER','HAPPYAD_CURRENT_USER','happyad_current_user'];
    var out={};
    keys.forEach(function(k){var x=readJsonV741(k);var xid=clean(x.id||x.user_id||x.uid);if(!uid||!xid||xid===uid)Object.keys(x||{}).forEach(function(n){if(out[n]==null||out[n]===''||out[n]===false)out[n]=x[n];});});
    return out;
  }
  function profileAvatarV741(p){p=p||{};return firstV741(p.avatar_url,p.avatarUrl,p.avatar,p.user_avatar,p.creator_avatar,p.author_avatar,p.profile_photo_url,p.profilePhotoUrl,p.profile_photo,p.profilePhoto,p.profile_picture_url,p.profilePictureUrl,p.profile_picture,p.profilePicture,p.photo_url,p.photoUrl,p.image_url,p.imageUrl,p.picture,p.profile_image_url,p.profileImageUrl,p.profile_avatar_url,p.profileAvatarUrl);}
  function profileBadgeV741(p){p=p||{};return firstV741(p.badge,p.user_badge,p.profile_badge,p.badge_type,p.certification,p.verified_badge);}
  function saveStableV741(u){
    try{
      var uid=clean(u&&u.id||u&&u.user_id);if(!uid)return;
      var avatarMaster=avatarMasterV937();if(avatarMaster&&avatarMaster.patchRecord)u=avatarMaster.patchRecord(Object.assign({},u||{}),uid);
      var old=readStableV741(uid), next=Object.assign({},old,u||{}, {id:uid,user_id:uid,updated_at_local:new Date().toISOString()});
      if(poorNameV741(next.name||next.full_name||next.display_name))delete next.name;
      if(!firstV741(next.avatar,next.avatar_url)&&next.__happyadAvatarKnownV855R32!==true)delete next.avatar;
      localStorage.setItem(PROFILE_STABLE_PREFIX_V741+uid,JSON.stringify(next));
    }catch(_e){}
  }
  function saveWarmUser(user,profile){
    user=user||{};profile=profile||{};
    var meta=user.user_metadata||{};
    var uid=clean(user.id||profile.id);
    var avatarMaster=avatarMasterV937();if(avatarMaster&&avatarMaster.primeFromProfile&&hasOwnV741(profile,'avatar_url'))avatarMaster.primeFromProfile(profile,{source:'auth-session-profile-v855r32'});
    var current=readCurrentV741(uid), stable=readStableV741(uid);
    var email=firstV741(user.email,current.email,current.contact,stable.email,stable.contact);
    var base=(email?email.split('@')[0]:'happyad')||'happyad';
    var remoteName=firstV741(profile.full_name,profile.display_name,profile.name);
    var metaName=firstV741(meta.full_name,meta.name,meta.display_name);
    var keptName=firstV741(current.name,current.full_name,current.display_name,stable.name,stable.full_name,stable.display_name);
    var name=!poorNameV741(remoteName)?remoteName:(!poorNameV741(keptName)?keptName:(!poorNameV741(metaName)?metaName:base));
    if(poorNameV741(name))name='Utilisateur Fyblic';
    var remoteHandle=firstV741(profile.username,profile.handle).replace(/^@+/,'');
    var keptHandle=firstV741(current.handle,current.username,stable.handle,stable.username,meta.username,meta.handle,base).replace(/^@+/,'');
    var handle=(!poorHandleV741(remoteHandle)?remoteHandle:keptHandle).replace(/\s+/g,'').toLowerCase()||base;
    var avatarEntry=avatarMaster&&avatarMaster.getEntry&&avatarMaster.getEntry(uid);
    var avatar=avatarEntry&&avatarEntry.known?(avatarEntry.url||''):profileAvatarV741(profile);
    var remoteRole=clean(profile.role).toLowerCase(),keptRole=clean(firstV741(current.role,stable.role,meta.role)).toLowerCase();
    var role=(remoteRole&&!(remoteRole==='user'&&keptRole&&keptRole!=='user'))?remoteRole:(keptRole||remoteRole||'user');
    var remoteBadge=clean(profileBadgeV741(profile)).toLowerCase(),keptBadge=clean(firstV741(current.badge,stable.badge)).toLowerCase();
    var remoteBadgeUseful=remoteBadge&&remoteBadge!=='aucun'&&remoteBadge!=='none'&&remoteBadge!=='null'&&remoteBadge!=='undefined';
    var keptBadgeUseful=keptBadge&&keptBadge!=='aucun'&&keptBadge!=='none'&&keptBadge!=='null'&&keptBadge!=='undefined';
    var badge=remoteBadgeUseful?remoteBadge:(keptBadgeUseful?keptBadge:'aucun');
    var next=Object.assign({},stable,current,{
      id:uid,user_id:uid,name:name,full_name:name,display_name:name,handle:handle,username:handle,
      email:email,contact:email,avatar:avatar,avatar_url:avatar,
      bio:firstV741(profile.bio,current.bio,stable.bio),country:firstV741(profile.country,current.country,stable.country),
      type:firstV741(profile.type,current.type,stable.type,'personal'),role:role,badge:badge,
      posts:Number(profile.posts!=null?profile.posts:current.posts||stable.posts||0)||0,
      followers:Number(profile.followers!=null?profile.followers:current.followers||stable.followers||0)||0,
      following:Number(profile.following!=null?profile.following:current.following||stable.following||0)||0,
      likes:Number(profile.likes!=null?profile.likes:current.likes||stable.likes||0)||0,
      passwordSet:true,contactVerified:!!user.email_confirmed_at
    });
    if(avatarEntry&&avatarEntry.known&&avatarMaster&&avatarMaster.patchRecord)next=avatarMaster.patchRecord(next,uid);
    try{
      ['HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL','HAPPYAD_USER','happyad_current_user','HAPPYAD_CURRENT_USER'].forEach(function(k){localStorage.setItem(k,JSON.stringify(next));});
      localStorage.setItem('HAPPYAD_AUTH_UID',next.id);
      localStorage.setItem('HAPPYAD_SESSION_ACTIVE','1');
      removeLogoutLocks();
      saveStableV741(next);
      window.dispatchEvent(new CustomEvent('HAPPYAD_PROFILE_IDENTITY_V741',{detail:{profile:next,source:'auth-session-v741'}}));
    }catch(_e){}
    return next;
  }
  async function fetchOrCreateProfile(user,seed){
    var c=client();if(!c||!c.from||!user||!isUuid(user.id))return null;
    var profile=null, confirmedMissing=false;
    try{
      var q=await c.from('happyad_profiles_public_v1').select('*').eq('id',user.id).maybeSingle();
      if(q&&q.error){console.warn('Fyblic V741 profile read refused; local identity kept',q.error);return null;}
      if(q&&q.data)profile=q.data;else confirmedMissing=true;
    }catch(_e){console.warn('Fyblic V741 profile read failed; no automatic overwrite',_e);return null;}
    if(profile)return profile;
    if(!confirmedMissing)return null;
    seed=Object.assign({},readStableV741(user.id),readCurrentV741(user.id),seed||{});
    var meta=user.user_metadata||{};
    var email=clean(user.email||seed.email);
    var base=(email?email.split('@')[0]:'happyad')||'happyad';
    var payload={
      id:user.id,
      full_name:firstV741(seed.full_name,seed.name,meta.full_name,meta.name,base)||'Utilisateur Fyblic',
      username:firstV741(seed.username,seed.handle,meta.username,meta.handle,base).replace(/^@+/,'').replace(/\s+/g,'').toLowerCase()||('user_'+Date.now()),
      avatar_url:firstV741(seed.avatar_url,seed.avatar,meta.avatar_url,meta.picture),
      bio:firstV741(seed.bio,meta.bio),type:firstV741(seed.type,meta.type,'personal')
    };
    try{
      var ins=await c.from('profiles').insert(payload).select('id,user_id,uid,auth_id,username,full_name,avatar_url,bio,country,created_at,badge,type,updated_at,followers,following,verification_status,avatar_updated_at,avatar_revision').maybeSingle();
      if(ins&&!ins.error&&ins.data)return ins.data;
      if(ins&&ins.error && /duplicate|unique|already exists|23505/i.test(String(ins.error.message||ins.error.code||''))){
        var again=await c.from('happyad_profiles_public_v1').select('*').eq('id',user.id).maybeSingle();
        if(again&&!again.error&&again.data)return again.data;
      }
      if(ins&&ins.error)console.warn('Fyblic V741 profile create skipped',ins.error);
    }catch(_e){console.warn('Fyblic V741 profile create failed safely',_e);}
    return null;
  }
  function syncWarmProfileV865(user,seed,options){
    options=options||{};seed=seed||{};
    var uid=clean(user&&user.id);if(!uid||!isUuid(uid))return Promise.resolve(null);
    var now=Date.now();
    if(profileSyncPromiseV865&&profileSyncUidV865===uid)return profileSyncPromiseV865;
    if(profileSyncUidV865===uid&&profileSyncLastAtV865&&now-profileSyncLastAtV865<PROFILE_SYNC_DEDUPE_MS_V865){return Promise.resolve(profileSyncResultV865);}
    profileSyncUidV865=uid;
    var run=(async function(){
      var p=await fetchOrCreateProfile(user,seed).catch(function(){return null;});
      var current=actualUser();
      if(!current||clean(current.id)!==uid||isLoginGuardPendingV855R47())return p;
      var effective=p||seed||{};
      saveWarmUser(user,effective);
      profileSyncResultV865=effective;profileSyncLastAtV865=Date.now();
      if(options.broadcastReady!==false)broadcast('PROFILE_READY');
      return p;
    })();
    profileSyncPromiseV865=run;
    return run.finally(function(){if(profileSyncPromiseV865===run)profileSyncPromiseV865=null;});
  }
  function applySession(next,eventName,options){
    options=options||{};
    var oldId=actualUser()&&actualUser().id||localHintId()||'';
    var nextSession=next&&next.user&&isUuid(next.user.id)?next:null;
    var nextId=nextSession&&nextSession.user&&clean(nextSession.user.id)||'';
    if(oldId!==nextId){
      if(oldId&&nextId)signalFramesSignedOutForSwitchV937(oldId,nextId);
      try{var iso=isolationV937();if(iso&&typeof iso.beforeAccountChange==='function')iso.beforeAccountChange(oldId,nextId);}catch(_isolation){}
    }
    session=nextSession;
    ready=true;
    var user=actualUser();
    if(user){
      if(isLoginGuardPendingV855R47()){
        setLoginGuardPendingV855R47(true,user.id);
      }else{
        removeLogoutLocks();
        try{localStorage.setItem('HAPPYAD_SESSION_ACTIVE','1');localStorage.setItem('HAPPYAD_AUTH_UID',user.id);}catch(_e){}
        /* V937 : poser immédiatement une identité minimale du BON compte. L'ancien
           profil a déjà été retiré avant le changement d'UID; aucun écran ne peut
           donc réutiliser l'identité du compte précédent pendant la requête profils. */
        try{saveWarmUser(user,options.seed||{});}catch(_warm){}
        if(!options.skipProfileSync)syncWarmProfileV865(user,options.seed||{},{broadcastReady:true}).catch(function(){});
      }
    }else{
      try{var iso2=isolationV937();if(iso2&&typeof iso2.clearActiveIdentity==='function')iso2.clearActiveIdentity();if(iso2&&typeof iso2.clearPrivateMemory==='function')iso2.clearPrivateMemory();}catch(_isolation2){}
      try{localStorage.setItem('HAPPYAD_SESSION_ACTIVE','0');localStorage.removeItem('HAPPYAD_AUTH_UID');}catch(_e){}
      profileSyncUidV865='';profileSyncLastAtV865=0;profileSyncResultV865=null;
    }
    var newId=user&&user.id||'';
    var ev=clean(eventName).toUpperCase();
    if(options.forceBroadcast||oldId!==newId||(!user&&(ev==='SIGNED_OUT'||ev==='USER_DELETED'||ev==='SESSION_ERROR'||ev==='NO_CLIENT')))broadcast(eventName||'SESSION');
    else syncBootAuthClassV937(!!user);
    return user;
  }
  async function refresh(force){
    /* Une seule lecture canonique à la fois : deux refresh concurrents pouvaient
       appliquer leurs résultats dans l'ordre inverse pendant une reprise réseau. */
    if(refreshPromise)return refreshPromise;
    refreshPromise=(async function(){
      var c=client();
      if(!c||!c.auth){
        /* Le chargement différé du client (CDN/WebView) n'est pas une déconnexion. */
        var memoryUser=actualUser(),clientHint=localHintId();
        if((memoryUser||clientHint)&&!logoutLockActiveV937()){
          sessionErrorCountV937++;
          ready=!!memoryUser;syncBootAuthClassV937(true);
          if(sessionRetryTimerV937)clearTimeout(sessionRetryTimerV937);
          var clientRetryDelay=Math.min(30000,Math.max(500,500*Math.pow(2,Math.min(6,sessionErrorCountV937-1))));
          sessionRetryTimerV937=setTimeout(function(){sessionRetryTimerV937=0;refresh(true).catch(function(){});},clientRetryDelay);
          return memoryUser||(clientHint?{id:clientHint,user_metadata:{},happyad_provisional_session_v964:true}:null);
        }
        ready=true;applySession(null,'NO_CLIENT',{forceBroadcast:true});return null;
      }
      try{
        if(logoutLockActiveV937()){
          try{await c.auth.signOut({scope:'local'});}catch(_e){}
          try{var st=window.HappyadAuthStorageV752;if(st&&typeof st.purgeAuthTokens==='function')await st.purgeAuthTokens();}catch(_purge){}
          applySession(null,'FORCED_LOGOUT',{forceBroadcast:true});
          return null;
        }
        var result=await c.auth.getSession();
        if(result&&result.error)throw result.error;
        sessionErrorCountV937=0;
        if(sessionRetryTimerV937){clearTimeout(sessionRetryTimerV937);sessionRetryTimerV937=0;}
        var s=result&&result.data&&result.data.session||null;
        if(s&&readLoginGuardPendingV855R47()){
          try{await c.auth.signOut();}catch(_e){}
          resetLoginGuardV855R47();
          applySession(null,'PENDING_SECOND_STEP_RESET',{forceBroadcast:true});
          return null;
        }
        applySession(s,'SESSION_REFRESH',{forceBroadcast:!!force});
        return actualUser();
      }catch(_e){
        sessionErrorCountV937++;
        /* V964 : une erreur technique n'est jamais une preuve de déconnexion.
           Tant qu'un utilisateur en mémoire ou un hint local cohérent existe,
           conserver l'état connecté et retenter avec un délai borné. Seuls un
           getSession() réussi avec session=null, SIGNED_OUT et USER_DELETED ont
           le droit de fermer la session. */
        var hint=localHintId();
        var keptUser=actualUser();
        if((keptUser||hint)&&!logoutLockActiveV937()){
          ready=!!keptUser;syncBootAuthClassV937(true);
          if(sessionRetryTimerV937)clearTimeout(sessionRetryTimerV937);
          var retryDelay=Math.min(30000,Math.max(500,500*Math.pow(2,Math.min(6,sessionErrorCountV937-1))));
          sessionRetryTimerV937=setTimeout(function(){sessionRetryTimerV937=0;refresh(true).catch(function(){});},retryDelay);
          return keptUser||(hint?{id:hint,user_metadata:{},happyad_provisional_session_v964:true}:null);
        }
        ready=true;
        applySession(null,'SESSION_ERROR',{forceBroadcast:true});
        return null;
      }finally{refreshPromise=null;}
    })();
    return refreshPromise;
  }
  function stop(ev){try{if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}}catch(_e){}
  }
  function toast(text){
    text=clean(text)||'Connexion requise';
    var now=Date.now();
    if(text===lastNoticeText&&now-lastNoticeAt<900)return;
    lastNoticeText=text;lastNoticeAt=now;
    try{if(typeof window.toast==='function'){window.toast(text);return;}}catch(_e){}
    try{
      var old=document.getElementById('happyadAuthToastV595');if(old)old.remove();
      var d=document.createElement('div');d.id='happyadAuthToastV595';d.textContent=text;
      d.style.cssText='position:fixed;left:50%;bottom:calc(94px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:4000005;width:max-content;max-width:calc(100vw - 32px);padding:10px 17px;border:1px solid rgba(145,185,232,.30);border-radius:14px;background:linear-gradient(145deg,rgba(31,45,64,.97),rgba(14,23,36,.985));color:#f8fbff;font:900 13px/1.2 system-ui,-apple-system,Segoe UI,sans-serif;letter-spacing:.05px;text-align:center;white-space:nowrap;box-shadow:0 12px 30px rgba(0,0,0,.48),0 0 0 1px rgba(86,145,204,.05),inset 0 1px 0 rgba(255,255,255,.10);backdrop-filter:blur(16px) saturate(1.08);-webkit-backdrop-filter:blur(16px) saturate(1.08)';
      document.body.appendChild(d);setTimeout(function(){try{d.remove();}catch(_e){}},2400);
    }catch(_e){}
  }
  function authOpeningActiveV710(){return !!(overlay&&Date.now()<authUnlockAtV710);}
  function armAuthOpeningV710(delay){
    if(!overlay)return;
    clearTimeout(authOpeningTimerV710);
    authUnlockAtV710=Date.now()+Math.max(180,Number(delay)||280);
    overlay.classList.add('happyadAuthOpeningV710');
    authOpeningTimerV710=setTimeout(function(){
      authOpeningTimerV710=0;authUnlockAtV710=0;
      try{overlay&&overlay.classList.remove('happyadAuthOpeningV710');}catch(_e){}
    },Math.max(180,Number(delay)||280));
  }
  function blockAuthOpeningEventV710(ev){
    if(!authOpeningActiveV710())return;
    stop(ev);return false;
  }

  function ensureOverlay(){
    if(overlay&&overlay.isConnected)return overlay;
    var css=document.getElementById('happyadAuthGateCssV595');
    if(!css){
      css=document.createElement('style');css.id='happyadAuthGateCssV595';css.textContent='\
#happyadAuthGateV595{position:fixed;inset:0;z-index:4000000;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#fff}\
#happyadAuthGateV595.on{display:flex}\
#happyadAuthGateV595.happyadAuthOpeningV710 .haAuthGatePanel,#happyadAuthGateV595.happyadAuthOpeningV710 .haAuthGatePanel *{pointer-events:none!important}\
#happyadAuthGateV595.on .haAuthGatePanel{animation:happyadAuthPanelInV710 .2s cubic-bezier(.2,.8,.2,1) both}\
@keyframes happyadAuthPanelInV710{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}\
#happyadAuthGateV595 .haAuthGatePanel{position:relative;width:min(440px,100%);max-height:min(88dvh,760px);overflow:auto;border:1px solid rgba(255,255,255,.28);border-radius:26px;background:linear-gradient(180deg,#12151b,#080a0e);box-shadow:0 30px 90px rgba(0,0,0,.72);padding:22px}\
#happyadAuthGateV595 .haAuthGateClose{position:absolute;right:14px;top:14px;width:42px;height:42px;min-height:42px!important;padding:0!important;box-sizing:border-box;border:1px solid rgba(255,255,255,.62);border-radius:50%!important;background:rgba(255,255,255,.04);color:#fff;font-size:25px;line-height:1;display:grid;place-items:center}\
#happyadAuthGateV595 .haAuthGateClose:active,#happyadAuthGateV595 button:active{background:rgba(190,196,205,.16)!important;border-color:#fff!important;color:#fff!important;transform:scale(.97) translateY(1px)}\
#happyadAuthGateV595 .haAuthTitle{font-size:27px;font-weight:1000;letter-spacing:-.6px;padding-right:50px}\
#happyadAuthGateV595 .haAuthHint{color:#bbc1cc;font-size:14px;font-weight:700;line-height:1.35;margin:8px 0 18px}\
#happyadAuthGateV595 .haAuthChoices{display:grid;gap:10px}\
#happyadAuthGateV595 button{min-height:50px;border:1px solid rgba(255,255,255,.62);border-radius:16px;background:rgba(255,255,255,.035);color:#fff;font-size:16px;font-weight:950;padding:12px 15px;transition:transform .12s ease,background .12s ease,border-color .12s ease}\
#happyadAuthGateV595 button:disabled{opacity:1!important;color:#fff!important;border-color:#fff!important;background:rgba(190,196,205,.14)!important;cursor:wait!important}\
#happyadAuthGateV595 .haAuthBack{min-height:40px;width:auto;padding:8px 12px;margin-bottom:12px;font-size:13px}\
#happyadAuthGateV595 .haAuthField{width:100%;height:52px;margin:0 0 10px;border:1px solid rgba(255,255,255,.24);border-radius:15px;background:#080b10;color:#fff;padding:0 14px;font-size:16px;outline:none}\
#happyadAuthGateV595 .haAuthField:focus{border-color:#fff;box-shadow:0 0 0 2px rgba(255,255,255,.10)}\
#happyadAuthGateV595 .haAuthFoot{margin-top:12px;color:#aeb5c1;font-size:12px;line-height:1.4}\
#happyadAuthGateV595 .haAuthStatus{min-height:20px;margin:10px 0 0;color:#fff;font-size:13px;font-weight:800}\
#happyadAuthGateV595 .haAuthStatus.haAuthStatusErrorV855R61{color:#ff565f}\
#happyadAuthGateV595 .haAuthTextLinkV855R61{min-height:30px!important;height:auto!important;width:auto!important;padding:3px 2px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:#dce2eb!important;font-size:13px!important;font-weight:650!important;text-align:left}\
#happyadAuthGateV595 .haAuthTextLinkV855R61:active{background:transparent!important;border:0!important;transform:none!important;opacity:.72}\
#happyadAuthGateV595 .haAuthTextLinkV855R61:disabled{background:transparent!important;border:0!important;color:#dce2eb!important;opacity:.55!important}\
#happyadAuthGateV595 #happyadAuthForgotV595{display:block!important;margin:14px auto 0!important;padding:4px 8px!important;text-align:center!important;justify-self:center!important}\
#happyadAuthGateV595 .haAuthInlineHelpV855R61{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:8px;color:#9fa7b4;font-size:12px;line-height:1.35}\
#happyadAuthGateV595 .haAuthInlineHelpV855R61 .haAuthTextLinkV855R61{color:#fff!important;font-weight:800!important}\
#happyadAuthGateV595 .haAuthGuardListV855R47{display:grid;gap:10px;margin:0 0 12px}\
#happyadAuthGateV595 .haAuthGuardFieldV855R47 label{display:block;margin:0 0 6px;color:#dfe5ee;font-size:13px;font-weight:900}\
#happyadAuthGateV595 .haAuthGuardFieldV855R47 .haAuthField{margin-bottom:0}\
body.happyadAuthGateOpenV595{overflow:hidden!important}\
body.happyadAuthGateOpenV595 #happyadMainDockV585{pointer-events:none!important}\
';document.head.appendChild(css);
    }
    var uiCss=document.getElementById('fyblicAuthUiCssV1105');
    if(!uiCss){
      uiCss=document.createElement('style');uiCss.id='fyblicAuthUiCssV1105';uiCss.textContent='\
#happyadAuthGateV595{align-items:stretch!important;justify-content:center!important;padding:0!important;background:#111214!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}\
#happyadAuthGateV595 .haAuthGatePanel{width:min(480px,100%)!important;min-height:100dvh!important;max-height:100dvh!important;overflow-y:auto!important;border:0!important;border-radius:0!important;background:#111214!important;box-shadow:none!important;padding:0 22px calc(24px + env(safe-area-inset-bottom,0px))!important;scrollbar-width:none!important}\
#happyadAuthGateV595 .haAuthGatePanel::-webkit-scrollbar{display:none!important}\
#happyadAuthGateV595 .haAuthGateClose{position:fixed!important;right:max(14px,calc((100vw - 480px)/2 + 14px))!important;top:calc(10px + env(safe-area-inset-top,0px))!important;width:34px!important;height:34px!important;min-height:34px!important;border-color:rgba(255,255,255,.12)!important;background:rgba(255,255,255,.05)!important;color:#d9dde2!important;font-size:20px!important;z-index:3!important}\
#happyadAuthGateRootV595{padding-top:calc(46px + env(safe-area-inset-top,0px))!important}\
#happyadAuthGateV595 .haAuthBrandV1105{display:flex;align-items:center;justify-content:center;gap:8px;margin:4px 0 28px;color:#eef4f5;font-size:27px;font-weight:850;letter-spacing:-.9px}\
#happyadAuthGateV595 .haAuthBrandV1105 img{width:27px;height:27px;display:block;object-fit:contain}\
#happyadAuthGateV595 .haAuthModeTabsV1105{display:grid;grid-template-columns:1fr 1fr;gap:0;margin:0 0 24px;padding:4px;border:1px solid rgba(255,255,255,.12);border-radius:15px;background:#18191b}\
#happyadAuthGateV595 .haAuthModeTabV1105{min-height:46px!important;border:0!important;border-radius:12px!important;background:transparent!important;color:#899096!important;font-size:15.5px!important;font-weight:650!important;padding:7px 9px!important;box-shadow:none!important}\
#happyadAuthGateV595 .haAuthModeTabV1105.active{background:#2a2a2d!important;color:#f4f7f8!important}\
#happyadAuthGateV595 .haAuthTitle{font-size:23px!important;padding-right:44px!important;margin-bottom:16px!important}\
#happyadAuthGateV595 .haAuthHint{color:#8c9397!important;font-size:14px!important;margin:4px 0 18px!important;font-weight:600!important}\
#happyadAuthGateV595 .haAuthField{height:54px!important;margin:0 0 11px!important;border:1px solid rgba(255,255,255,.12)!important;border-radius:15px!important;background:#222325!important;color:#f7f8f9!important;padding:0 16px!important;font-size:15.5px!important;box-shadow:none!important}\
#happyadAuthGateV595 .haAuthField::placeholder{color:#899195!important}\
#happyadAuthGateV595 .haAuthField:focus{border-color:#54ff45!important;box-shadow:0 0 0 1px #54ff45!important}\
#happyadAuthGateV595 .haAuthPasswordWrapV1105{position:relative;margin-bottom:11px}\
#happyadAuthGateV595 .haAuthPasswordWrapV1105 .haAuthField{margin:0!important;padding-right:58px!important}\
#happyadAuthGateV595 .haAuthEyeV1105{position:absolute;right:7px;top:50%;transform:translateY(-50%)!important;width:40px!important;height:40px!important;min-height:40px!important;border:0!important;background:transparent!important;color:#99a3a6!important;padding:0!important;font-size:21px!important;box-shadow:none!important}\
#happyadAuthGateV595 .haAuthPrimaryV1105{min-height:54px!important;margin-top:2px!important;border:0!important;border-radius:15px!important;background:linear-gradient(110deg,#09dfca 0%,#00f58e 42%,#48ff00 100%)!important;color:#061008!important;font-size:17px!important;font-weight:1000!important;box-shadow:none!important}\
#happyadAuthGateV595 .haAuthPrimaryV1105:disabled{background:linear-gradient(110deg,#0bb9aa,#1ac86d,#55cd25)!important;color:#061008!important;opacity:.72!important;border:0!important}\
#happyadAuthGateV595 #happyadAuthForgotV595{margin:8px auto 0!important;color:#b6bec1!important}\
#happyadAuthGateV595 .haAuthSocialDividerV1105{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;color:#879093;font-size:14px;font-weight:650;margin:24px 0 18px}\
#happyadAuthGateV595 .haAuthSocialDividerV1105:before,#happyadAuthGateV595 .haAuthSocialDividerV1105:after{content:"";height:1px;background:rgba(255,255,255,.11)}\
#happyadAuthGateV595 .haAuthGoogleRowV1105{display:flex;justify-content:center;margin-bottom:18px}\
#happyadAuthGateV595 .haAuthGoogleV1105{width:50px!important;height:50px!important;min-height:50px!important;border-radius:50%!important;border:0!important;background:#fff!important;color:#222!important;padding:0!important;display:grid!important;place-items:center!important;box-shadow:none!important}\
#happyadAuthGateV595 .haAuthGoogleMarkV1105{font:1000 22px/1 Arial,sans-serif;background:conic-gradient(from -45deg,#4285f4 0 25%,#34a853 0 50%,#fbbc05 0 75%,#ea4335 0);-webkit-background-clip:text;background-clip:text;color:transparent}\
#happyadAuthGateV595 .haAuthAgreementV1105{max-width:370px;margin:0 auto;text-align:center;color:#858e92;font-size:11.5px;line-height:1.4}\
#happyadAuthGateV595 .haAuthAgreementV1105 b{color:#64ff50;font-weight:800}\
#happyadAuthGateV595 .haAuthStatus{margin-top:8px!important}\
#happyadAuthGateV595 .haAuthBack{border-color:rgba(255,255,255,.15)!important;background:#1b1d20!important}\
@media(max-width:390px){#happyadAuthGateV595 .haAuthGatePanel{padding-left:17px!important;padding-right:17px!important}#happyadAuthGateRootV595{padding-top:calc(42px + env(safe-area-inset-top,0px))!important}#happyadAuthGateV595 .haAuthBrandV1105{margin-bottom:22px;font-size:25px}#happyadAuthGateV595 .haAuthBrandV1105 img{width:25px;height:25px}#happyadAuthGateV595 .haAuthModeTabsV1105{margin-bottom:20px}#happyadAuthGateV595 .haAuthField{height:51px!important}#happyadAuthGateV595 .haAuthPrimaryV1105{min-height:51px!important}#happyadAuthGateV595 .haAuthSocialDividerV1105{margin:20px 0 15px}#happyadAuthGateV595 .haAuthGoogleV1105{width:48px!important;height:48px!important;min-height:48px!important}}\
';document.head.appendChild(uiCss);
    }
    overlay=document.createElement('div');overlay.id='happyadAuthGateV595';overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML='<div class="haAuthGatePanel" role="dialog" aria-modal="true" aria-label="Connexion Fyblic"><button type="button" class="haAuthGateClose" aria-label="Fermer">×</button><div id="happyadAuthGateRootV595"></div></div>';
    document.body.appendChild(overlay);panelRoot=overlay.querySelector('#happyadAuthGateRootV595');
    overlay.querySelector('.haAuthGateClose').addEventListener('click',function(e){stop(e);closeOverlay(false);},true);
    overlay.addEventListener('click',function(e){if(e.target===overlay){stop(e);closeOverlay(false);}},true);
    ['pointerdown','pointerup','click','touchstart','touchend','contextmenu'].forEach(function(type){overlay.addEventListener(type,blockAuthOpeningEventV710,true);});
    return overlay;
  }
  function setStatus(text,type){try{var s=document.getElementById('happyadAuthStatusV595');if(s){s.textContent=text||'';s.classList.toggle('haAuthStatusErrorV855R61',type==='error');}}catch(_e){}}
  function normalizeEmailV855R61(v){return clean(v).toLowerCase();}
  function invalidCredentialsV855R61(err){var t=(clean(err&&err.code)+' '+clean(err&&err.message||err)).toLowerCase();return /invalid_credentials|invalid login credentials|email or password|wrong password/.test(t);}
  function value(id){var el=document.getElementById(id);return clean(el&&el.value);}
  function setSubmitBusy(id,on,busyText,idleText){
    try{
      var el=document.getElementById(id);if(!el)return;
      if(on){
        if(!el.dataset.happyadIdleLabel)el.dataset.happyadIdleLabel=idleText||clean(el.textContent)||'Se connecter';
        el.textContent=busyText||'Connexion…';
        el.disabled=true;
        el.setAttribute('aria-busy','true');
      }else{
        el.textContent=el.dataset.happyadIdleLabel||idleText||'Se connecter';
        el.disabled=false;
        el.removeAttribute('aria-busy');
      }
    }catch(_e){}
  }
  function authBrandV1105(){
    return '<div class="haAuthBrandV1105"><span>Fyblic</span><img src="icons/fyblic-brand-mark-v1046-transparent.svg" alt="" aria-hidden="true"></div>';
  }
  function authTabsV1105(mode){
    return '<div class="haAuthModeTabsV1105" role="tablist" aria-label="Connexion ou inscription"><button type="button" class="haAuthModeTabV1105 '+(mode==='login'?'active':'')+'" id="happyadAuthTabLoginV1105" role="tab" aria-selected="'+(mode==='login'?'true':'false')+'">Se connecter</button><button type="button" class="haAuthModeTabV1105 '+(mode==='signup'?'active':'')+'" id="happyadAuthTabSignupV1105" role="tab" aria-selected="'+(mode==='signup'?'true':'false')+'">Inscription</button></div>';
  }
  function authGoogleV1105(mode){
    return '<div class="haAuthSocialDividerV1105"><span>Ou continuer avec</span></div><div class="haAuthGoogleRowV1105"><button type="button" class="haAuthGoogleV1105" id="happyadAuthGoogleV1105" aria-label="Continuer avec Google" title="Google"><span class="haAuthGoogleMarkV1105">G</span></button></div><div class="haAuthAgreementV1105">En continuant, vous confirmez respecter les conditions d’utilisation de <b>Fyblic</b>.</div>';
  }
  function bindAuthShellV1105(mode){
    var login=document.getElementById('happyadAuthTabLoginV1105'),signup=document.getElementById('happyadAuthTabSignupV1105'),google=document.getElementById('happyadAuthGoogleV1105');
    if(login)login.onclick=function(e){stop(e);renderLogin();};
    if(signup)signup.onclick=function(e){stop(e);renderSignup();};
    if(google)google.onclick=function(e){doGoogleAuthV1105(e,mode);};
    var eye=document.getElementById('happyadAuthEyeV1105');
    if(eye)eye.onclick=function(e){stop(e);var pass=document.getElementById(mode==='signup'?'happyadAuthSignupPassV595':'happyadAuthPassV595');if(!pass)return;var reveal=pass.type==='password';pass.type=reveal?'text':'password';eye.textContent=reveal?'◉':'◌';eye.setAttribute('aria-label',reveal?'Masquer le mot de passe':'Afficher le mot de passe');};
  }
  function renderChoice(){
    renderLogin();
  }
  function renderLogin(prefill){
    ensureOverlay();
    prefill=clean(prefill||'');
    panelRoot.innerHTML=authBrandV1105()+authTabsV1105('login')+'<input class="haAuthField" id="happyadAuthEmailV595" type="email" autocomplete="email" placeholder="E-mail" value="'+esc(prefill)+'"><div class="haAuthPasswordWrapV1105"><input class="haAuthField" id="happyadAuthPassV595" type="password" autocomplete="current-password" placeholder="Mot de passe"><button type="button" class="haAuthEyeV1105" id="happyadAuthEyeV1105" aria-label="Afficher le mot de passe">◌</button></div><div class="haAuthChoices"><button type="button" class="haAuthPrimaryV1105" id="happyadAuthLoginSubmitV595">Se connecter</button></div><button type="button" class="haAuthTextLinkV855R61" id="happyadAuthForgotV595">Mot de passe oublié</button><div class="haAuthStatus" id="happyadAuthStatusV595"></div>'+authGoogleV1105('login');
    bindAuthShellV1105('login');
    document.getElementById('happyadAuthLoginSubmitV595').onclick=doLogin;
    document.getElementById('happyadAuthForgotV595').onclick=function(e){stop(e);renderForgot(value('happyadAuthEmailV595'));};
    var pass=document.getElementById('happyadAuthPassV595');
    if(pass)pass.addEventListener('keydown',function(e){if(e.key==='Enter')doLogin(e);});
  }
  function resetRecoveryFlowV855R40(){recoveryFlowV855R40={email:'',verified:false};}
  async function cancelRecoveryVerifiedSessionV855R40(){
    if(!recoveryFlowV855R40.verified){resetRecoveryFlowV855R40();return;}
    try{var c=client();if(c&&c.auth)await c.auth.signOut();}catch(_e){}
    applySession(null,'PASSWORD_RECOVERY_CANCELLED',{forceBroadcast:true});
    resetRecoveryFlowV855R40();
  }
  function renderForgot(prefill){
    ensureOverlay();
    prefill=clean(prefill||recoveryFlowV855R40.email||'');
    recoveryFlowV855R40.email=prefill;
    panelRoot.innerHTML='<button type="button" class="haAuthBack" id="happyadAuthForgotBackV597">Retour</button><div class="haAuthTitle">Récupérer le compte</div><div class="haAuthHint">Entre ton Gmail. Fyblic t’enverra un code de récupération à 6 chiffres.</div><input class="haAuthField" id="happyadAuthForgotEmailV597" type="email" autocomplete="email" inputmode="email" placeholder="Gmail" value="'+esc(prefill)+'"><div class="haAuthChoices"><button type="button" id="happyadAuthForgotSubmitV597">Envoyer le code</button></div><div class="haAuthStatus" id="happyadAuthStatusV595"></div>';
    document.getElementById('happyadAuthForgotBackV597').onclick=function(e){stop(e);resetRecoveryFlowV855R40();renderLogin(value('happyadAuthForgotEmailV597'));};
    document.getElementById('happyadAuthForgotSubmitV597').onclick=doForgot;
    var email=document.getElementById('happyadAuthForgotEmailV597');
    if(email){email.focus();email.addEventListener('keydown',function(e){if(e.key==='Enter')doForgot(e);});}
  }
  function renderForgotCodeV855R40(email,message){
    ensureOverlay();email=clean(email||recoveryFlowV855R40.email||'');recoveryFlowV855R40.email=email;
    panelRoot.innerHTML='<button type="button" class="haAuthBack" id="happyadAuthForgotCodeBackV855R40">Changer Gmail</button><div class="haAuthTitle">Entre le code</div><div class="haAuthHint">Saisis le code à 6 chiffres envoyé à <b>'+esc(email)+'</b>.</div><input class="haAuthField" id="happyadAuthForgotCodeV855R40" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="Code à 6 chiffres"><div class="haAuthStatus" id="happyadAuthStatusV595"></div><div class="haAuthInlineHelpV855R61"><span>Code non reçu ?</span><button type="button" class="haAuthTextLinkV855R61" id="happyadAuthForgotResendV855R40">Renvoyer le code</button></div>';
    document.getElementById('happyadAuthForgotCodeBackV855R40').onclick=function(e){stop(e);renderForgot(email);};
    document.getElementById('happyadAuthForgotResendV855R40').onclick=function(e){doForgot(e,{email:email,resend:true});};
    var code=document.getElementById('happyadAuthForgotCodeV855R40');
    if(code){
      code.focus();
      code.addEventListener('input',function(e){
        this.value=String(this.value||'').replace(/\D/g,'').slice(0,6);
        if(this.value.length===6&&!this.dataset.happyadAutoVerifyV855R61){this.dataset.happyadAutoVerifyV855R61='1';setTimeout(function(){doForgotVerifyV855R40(null);},40);}
        if(this.value.length<6)delete this.dataset.happyadAutoVerifyV855R61;
      });
      code.addEventListener('keydown',function(e){if(e.key==='Enter'&&String(this.value||'').replace(/\D/g,'').length===6)doForgotVerifyV855R40(e);});
    }
    if(message&&/nouveau code/i.test(message))setStatus('Nouveau code envoyé.');
  }
  function renderForgotPasswordV855R40(email){
    ensureOverlay();email=clean(email||recoveryFlowV855R40.email||'');
    panelRoot.innerHTML='<button type="button" class="haAuthBack" id="happyadAuthForgotPasswordCancelV855R40">Annuler</button><div class="haAuthTitle">Nouveau mot de passe</div><div class="haAuthHint">Code vérifié. Choisis maintenant ton nouveau mot de passe Fyblic.</div><input class="haAuthField" id="happyadAuthForgotPass1V855R40" type="password" autocomplete="new-password" placeholder="Nouveau mot de passe"><input class="haAuthField" id="happyadAuthForgotPass2V855R40" type="password" autocomplete="new-password" placeholder="Confirmer le mot de passe"><div class="haAuthChoices"><button type="button" id="happyadAuthForgotSaveV855R40">Enregistrer le mot de passe</button></div><div class="haAuthStatus" id="happyadAuthStatusV595"></div><div class="haAuthFoot">Après l’enregistrement, reconnecte-toi avec ton nouveau mot de passe.</div>';
    document.getElementById('happyadAuthForgotPasswordCancelV855R40').onclick=async function(e){stop(e);await cancelRecoveryVerifiedSessionV855R40();renderLogin(email);};
    document.getElementById('happyadAuthForgotSaveV855R40').onclick=doForgotSavePasswordV855R40;
    var p1=document.getElementById('happyadAuthForgotPass1V855R40');if(p1)p1.focus();
    var p2=document.getElementById('happyadAuthForgotPass2V855R40');if(p2)p2.addEventListener('keydown',function(e){if(e.key==='Enter')doForgotSavePasswordV855R40(e);});
  }
  function renderSignup(){
    ensureOverlay();
    var d=new Date();d.setFullYear(d.getFullYear()-18);var max=d.toISOString().slice(0,10);
    panelRoot.innerHTML=authBrandV1105()+authTabsV1105('signup')+'<input class="haAuthField" id="happyadAuthNameV595" placeholder="Nom"><input class="haAuthField" id="happyadAuthHandleV595" placeholder="Nom d’utilisateur complet"><input class="haAuthField" id="happyadAuthBirthV595" type="date" max="'+esc(max)+'" aria-label="Date de naissance"><input class="haAuthField" id="happyadAuthSignupEmailV595" type="email" autocomplete="email" placeholder="E-mail"><div class="haAuthPasswordWrapV1105"><input class="haAuthField" id="happyadAuthSignupPassV595" type="password" autocomplete="new-password" placeholder="Mot de passe"><button type="button" class="haAuthEyeV1105" id="happyadAuthEyeV1105" aria-label="Afficher le mot de passe">◌</button></div><input class="haAuthField" id="happyadAuthSignupPass2V595" type="password" autocomplete="new-password" placeholder="Confirmer le mot de passe"><div class="haAuthChoices"><button type="button" class="haAuthPrimaryV1105" id="happyadAuthSignupSubmitV595">S’inscrire</button></div><div class="haAuthStatus" id="happyadAuthStatusV595"></div>'+authGoogleV1105('signup');
    bindAuthShellV1105('signup');
    document.getElementById('happyadAuthSignupSubmitV595').onclick=doSignup;
  }
  function lifecycleMissingV855R48(error){
    var text=String((error&&error.code)||'')+' '+String((error&&error.message)||error||'');
    return /PGRST202|42883|happyad_account_lifecycle_status_v855r48|could not find the function/i.test(text);
  }
  function lifecycleDateV855R48(value){
    var d=new Date(value||'');
    if(!isFinite(d.getTime()))return '';
    try{return d.toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'});}catch(_e){return d.toLocaleString();}
  }
  async function loadAccountLifecycleV855R48(){
    var c=client();
    if(!c||!c.rpc)return {setupRequired:true};
    try{
      var r=await c.rpc('happyad_account_lifecycle_status_v855r48');
      if(r&&r.error)throw r.error;
      var d=r&&r.data||{};if(Array.isArray(d))d=d[0]||{};
      return {
        setupRequired:false,
        disabledUntil:d.disabled_until||null,
        deletionRequestedAt:d.deletion_requested_at||null,
        deletionDueAt:d.deletion_due_at||null
      };
    }catch(err){
      if(lifecycleMissingV855R48(err))return {setupRequired:true};
      throw err;
    }
  }
  async function enforceAccountLifecycleBeforeLoginV855R48(){
    var state=await loadAccountLifecycleV855R48();
    if(state.setupRequired)return state;
    var now=Date.now();
    var disabled=state.disabledUntil?new Date(state.disabledUntil).getTime():0;
    if(disabled&&disabled>now){
      var e=new Error('Ce compte est désactivé jusqu’au '+lifecycleDateV855R48(state.disabledUntil)+'. La connexion reste bloquée jusqu’à la fin de la période choisie.');
      e.code='ACCOUNT_TEMP_DISABLED';throw e;
    }
    var due=state.deletionDueAt?new Date(state.deletionDueAt).getTime():0;
    if(due&&due<=now){
      var d=new Error('Le délai de récupération de 30 jours est terminé. Ce compte ne peut plus être récupéré.');
      d.code='ACCOUNT_DELETION_EXPIRED';throw d;
    }
    return state;
  }
  async function recoverDeletionAfterSuccessfulLoginV855R48(){
    var c=client();
    if(!c||!c.rpc)return {recovered:false};
    try{
      var r=await c.rpc('happyad_cancel_deletion_after_login_v855r48');
      if(r&&r.error)throw r.error;
      var d=r&&r.data||{};if(Array.isArray(d))d=d[0]||{};
      return {recovered:!!d.recovered,expired:!!d.expired};
    }catch(err){
      if(lifecycleMissingV855R48(err))return {recovered:false};
      throw err;
    }
  }

  function normalizeLoginGuardMethodsV855R47(value){
    var allowed={authenticator:true,phone:true,gmail:true,secret:true},out=[];
    (Array.isArray(value)?value:[]).forEach(function(item){item=clean(item).toLowerCase();if(allowed[item]&&out.indexOf(item)<0)out.push(item);});
    return out;
  }
  async function loadLoginGuardPolicyV855R47(user){
    var c=client();
    if(!c||!c.from)return {enabled:false,methods:[]};
    var r=await c.from('happyad_user_settings').select('two_factor_enabled,two_factor_methods,verified_gmail,verified_phone').eq('user_id',user.id).maybeSingle();
    if(r&&r.error){
      var msg=String(r.error.message||r.error.code||'');
      if(/two_factor_enabled|two_factor_methods|PGRST204|42703|schema cache/i.test(msg)){
        var er=new Error('Exécutez le SQL V855R47 de validation en deux étapes dans Supabase avant de vous connecter.');er.code='TWO_FACTOR_SQL_REQUIRED';throw er;
      }
      throw r.error;
    }
    var row=r&&r.data||{};
    return {
      enabled:!!row.two_factor_enabled,
      methods:normalizeLoginGuardMethodsV855R47(row.two_factor_methods),
      verifiedGmail:clean(row.verified_gmail).toLowerCase(),
      verifiedPhone:clean(row.verified_phone),
      email:clean(user.email).toLowerCase(),
      phone:clean(user.phone)
    };
  }
  async function verifiedTotpFactorV855R47(){
    var c=client(),mfa=c&&c.auth&&c.auth.mfa;
    if(!mfa||typeof mfa.listFactors!=='function')return null;
    var r=await mfa.listFactors();if(r&&r.error)throw r.error;
    var d=r&&r.data||{},list=[];
    if(Array.isArray(d.totp))list=list.concat(d.totp);
    if(Array.isArray(d.all))list=list.concat(d.all.filter(function(f){return clean(f&&f.factor_type||f&&f.factorType||f&&f.type).toLowerCase()==='totp';}));
    var seen={};
    return list.find(function(f){var id=clean(f&&f.id);if(!id||seen[id])return false;seen[id]=1;return clean(f&&f.status).toLowerCase()==='verified';})||null;
  }
  function loginGuardFieldV855R47(id,label,placeholder,type,maxlength){
    return '<div class="haAuthGuardFieldV855R47"><label for="'+id+'">'+label+'</label><input class="haAuthField" id="'+id+'" type="'+(type||'text')+'" '+(maxlength?'maxlength="'+maxlength+'" ':'')+'autocomplete="one-time-code" inputmode="'+((type||'')==='password'?'text':'numeric')+'" placeholder="'+placeholder+'"></div>';
  }
  function renderLoginGuardV855R47(user,policy){
    ensureOverlay();
    var methods=normalizeLoginGuardMethodsV855R47(policy.methods),html='';
    if(methods.indexOf('authenticator')>=0)html+=loginGuardFieldV855R47('happyadAuthGuardAuthenticatorV855R47','Application d’authentification','Code à 6 chiffres','text',6);
    if(methods.indexOf('phone')>=0)html+=loginGuardFieldV855R47('happyadAuthGuardPhoneV855R47','Code OTP téléphone','Code à 6 chiffres','text',6);
    if(methods.indexOf('gmail')>=0)html+=loginGuardFieldV855R47('happyadAuthGuardGmailV855R47','Code OTP Gmail','Code à 6 chiffres','text',6);
    if(methods.indexOf('secret')>=0)html+=loginGuardFieldV855R47('happyadAuthGuardSecretV855R47','Clé secrète','Votre clé secrète','password',12);
    panelRoot.innerHTML='<div class="haAuthTitle">Connexion protégée</div><div class="haAuthHint">Mot de passe correct. Fyblic exige maintenant toutes les protections que vous avez activées avant d’ouvrir la session.</div><div class="haAuthGuardListV855R47">'+html+'</div><div class="haAuthChoices"><button type="button" id="happyadAuthGuardSubmitV855R47">Vérifier et se connecter</button>'+((methods.indexOf('gmail')>=0||methods.indexOf('phone')>=0)?'<button type="button" id="happyadAuthGuardResendV855R47">Renvoyer les codes</button>':'')+'</div><div class="haAuthStatus" id="happyadAuthStatusV595"></div>';
    var submit=document.getElementById('happyadAuthGuardSubmitV855R47');if(submit)submit.onclick=verifyLoginGuardV855R47;
    var resend=document.getElementById('happyadAuthGuardResendV855R47');if(resend)resend.onclick=function(e){sendLoginGuardCodesV855R47(e,true);};
    ['happyadAuthGuardAuthenticatorV855R47','happyadAuthGuardPhoneV855R47','happyadAuthGuardGmailV855R47'].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('input',function(){this.value=String(this.value||'').replace(/\D/g,'').slice(0,6);});});
    armAuthOpeningV710(220);
  }
  async function sendLoginGuardCodesV855R47(e,resend){
    stop(e);var c=client(),p=loginGuardV855R47.policy||{},methods=normalizeLoginGuardMethodsV855R47(p.methods);
    var button=document.getElementById('happyadAuthGuardResendV855R47');if(button)setSubmitBusy(button.id,true,'Envoi…','Renvoyer les codes');
    try{
      var sent=[];
      if(methods.indexOf('gmail')>=0&&!loginGuardV855R47.verified.gmail){
        var email=clean(loginGuardV855R47.email||p.email);if(!email)throw new Error('Gmail vérifié introuvable.');
        var rg=await c.auth.signInWithOtp({email:email,options:{shouldCreateUser:false}});if(rg&&rg.error)throw rg.error;
        loginGuardV855R47.codesSent.gmail=true;sent.push('Gmail');
      }
      if(methods.indexOf('phone')>=0&&!loginGuardV855R47.verified.phone){
        var phone=clean(loginGuardV855R47.phone||p.phone);if(!phone)throw new Error('Téléphone vérifié introuvable.');
        var rp=await c.auth.signInWithOtp({phone:phone,options:{shouldCreateUser:false}});if(rp&&rp.error)throw rp.error;
        loginGuardV855R47.codesSent.phone=true;sent.push('téléphone');
      }
      if(sent.length)setStatus((resend?'Nouveaux codes envoyés : ':'Codes envoyés : ')+sent.join(' + ')+'.');
    }catch(err){setStatus('Envoi impossible : '+clean(err&&err.message||err));}
    finally{if(button)setSubmitBusy(button.id,false,'Envoi…','Renvoyer les codes');}
  }
  function markGuardInputVerifiedV855R47(id){try{var el=document.getElementById(id);if(el){el.disabled=true;el.value='';el.placeholder='Vérifié ✓';}}catch(_e){}}
  async function verifyLoginGuardV855R47(e){
    stop(e);if(busy)return;
    var c=client(),p=loginGuardV855R47.policy||{},methods=normalizeLoginGuardMethodsV855R47(p.methods);
    if(!methods.length){setStatus('Configuration de sécurité invalide.');return;}
    var codes={
      authenticator:value('happyadAuthGuardAuthenticatorV855R47').replace(/\D/g,''),
      phone:value('happyadAuthGuardPhoneV855R47').replace(/\D/g,''),
      gmail:value('happyadAuthGuardGmailV855R47').replace(/\D/g,''),
      secret:value('happyadAuthGuardSecretV855R47')
    };
    if(methods.indexOf('authenticator')>=0&&!loginGuardV855R47.verified.authenticator&&!/^\d{6}$/.test(codes.authenticator)){setStatus('Entre les 6 chiffres de l’application d’authentification.');return;}
    if(methods.indexOf('phone')>=0&&!loginGuardV855R47.verified.phone&&!/^\d{6}$/.test(codes.phone)){setStatus('Entre les 6 chiffres reçus sur le téléphone.');return;}
    if(methods.indexOf('gmail')>=0&&!loginGuardV855R47.verified.gmail&&!/^\d{6}$/.test(codes.gmail)){setStatus('Entre les 6 chiffres reçus sur Gmail.');return;}
    if(methods.indexOf('secret')>=0&&!loginGuardV855R47.verified.secret&&!codes.secret){setStatus('Entre votre clé secrète.');return;}
    busy=true;setStatus('');setSubmitBusy('happyadAuthGuardSubmitV855R47',true,'Vérification…','Vérifier et se connecter');
    try{
      // Les OTP email/téléphone sont vérifiés avant le TOTP afin que le TOTP soit la dernière élévation AAL2 lorsqu'il est sélectionné.
      if(methods.indexOf('gmail')>=0&&!loginGuardV855R47.verified.gmail){
        var email=clean(loginGuardV855R47.email||p.email);var re=await c.auth.verifyOtp({email:email,token:codes.gmail,type:'email'});if(re&&re.error)throw re.error;
        var ue=re&&re.data&&re.data.user;if(ue&&clean(ue.id)!==clean(loginGuardV855R47.userId))throw new Error('Le code Gmail ne correspond pas à ce compte.');
        loginGuardV855R47.verified.gmail=true;markGuardInputVerifiedV855R47('happyadAuthGuardGmailV855R47');
      }
      if(methods.indexOf('phone')>=0&&!loginGuardV855R47.verified.phone){
        var phone=clean(loginGuardV855R47.phone||p.phone);var rp=await c.auth.verifyOtp({phone:phone,token:codes.phone,type:'sms'});if(rp&&rp.error)throw rp.error;
        var up=rp&&rp.data&&rp.data.user;if(up&&clean(up.id)!==clean(loginGuardV855R47.userId))throw new Error('Le code téléphone ne correspond pas à ce compte.');
        loginGuardV855R47.verified.phone=true;markGuardInputVerifiedV855R47('happyadAuthGuardPhoneV855R47');
      }
      if(methods.indexOf('secret')>=0&&!loginGuardV855R47.verified.secret){
        if(!c.rpc)throw new Error('Vérification de la clé secrète indisponible.');
        var rs=await c.rpc('happyad_verify_secret_v855r46',{p_secret:codes.secret});if(rs&&rs.error)throw rs.error;
        if(rs.data!==true)throw new Error('Clé secrète incorrecte.');
        loginGuardV855R47.verified.secret=true;markGuardInputVerifiedV855R47('happyadAuthGuardSecretV855R47');
      }
      if(methods.indexOf('authenticator')>=0&&!loginGuardV855R47.verified.authenticator){
        var factor=await verifiedTotpFactorV855R47();if(!factor)throw new Error('Application d’authentification non configurée.');
        var mfa=c.auth&&c.auth.mfa;if(!mfa||typeof mfa.challengeAndVerify!=='function')throw new Error('Vérification MFA indisponible.');
        var ra=await mfa.challengeAndVerify({factorId:factor.id,code:codes.authenticator});if(ra&&ra.error)throw ra.error;
        loginGuardV855R47.verified.authenticator=true;markGuardInputVerifiedV855R47('happyadAuthGuardAuthenticatorV855R47');
      }
      var all=methods.every(function(m){return loginGuardV855R47.verified[m]===true;});if(!all)throw new Error('Toutes les protections choisies doivent être validées.');
      var gs=await c.auth.getSession();var sess=gs&&gs.data&&gs.data.session||null;var user=sess&&sess.user||actualUser();if(!user||clean(user.id)!==clean(loginGuardV855R47.userId))throw new Error('Session utilisateur introuvable après vérification.');
      resetLoginGuardV855R47();
      var done=await finishSignedIn(user,{email:clean(user.email)});
      toast(done&&done.recoveredDeletion?'Compte récupéré ✅ La suppression programmée a été annulée.':'Connecté ✅');
    }catch(err){setStatus('Vérification impossible : '+clean(err&&err.message||err));}
    finally{busy=false;setSubmitBusy('happyadAuthGuardSubmitV855R47',false,'Vérification…','Vérifier et se connecter');}
  }
  async function beginLoginGuardV855R47(user,email){
    var policy=await loadLoginGuardPolicyV855R47(user);
    if(!policy.enabled)return false;
    var methods=normalizeLoginGuardMethodsV855R47(policy.methods);
    if(!methods.length)throw new Error('La validation en deux étapes est activée sans méthode configurée.');
    if(methods.indexOf('gmail')>=0&&(!policy.verifiedGmail||policy.verifiedGmail!==clean(user.email).toLowerCase()))throw new Error('Le Gmail protégé n’est plus vérifié.');
    if(methods.indexOf('phone')>=0&&(!policy.verifiedPhone||policy.verifiedPhone!==clean(user.phone)))throw new Error('Le téléphone protégé n’est plus vérifié.');
    if(methods.indexOf('authenticator')>=0&&!await verifiedTotpFactorV855R47())throw new Error('L’application d’authentification n’est plus configurée.');
    loginGuardV855R47={pending:true,userId:user.id,email:clean(user.email||email),phone:clean(user.phone),policy:policy,verified:{},codesSent:{gmail:false,phone:false}};
    setLoginGuardPendingV855R47(true,user.id);
    renderLoginGuardV855R47(user,policy);
    if(methods.indexOf('gmail')>=0||methods.indexOf('phone')>=0)setTimeout(function(){sendLoginGuardCodesV855R47(null,false);},80);
    return true;
  }

  async function finishSignedIn(user,seed){
    var c=client();var s=null;
    try{var gs=await c.auth.getSession();s=gs&&gs.data&&gs.data.session||null;}catch(_e){}
    if(!s&&user)s={user:user};
    var lifecycle=await recoverDeletionAfterSuccessfulLoginV855R48();
    if(lifecycle&&lifecycle.expired){
      try{await c.auth.signOut();}catch(_signout){}
      throw new Error('Le délai de récupération de 30 jours est terminé. Ce compte ne peut plus être récupéré.');
    }
    applySession(s,'SIGNED_IN',{forceBroadcast:false,skipProfileSync:true});
    var storyWarmV941=Promise.resolve(null),storyMasterV941=null;
    try{storyMasterV941=window.HappyStoryV629||window.HappyStoryV699||null;if(storyMasterV941&&typeof storyMasterV941.prepareSignedInIdentityV941==='function')storyWarmV941=Promise.resolve(storyMasterV941.prepareSignedInIdentityV941(user&&user.id||'',user));}catch(_storyWarm){storyWarmV941=Promise.resolve(null)}
    await Promise.all([syncWarmProfileV865(user,seed||{},{broadcastReady:false}),storyWarmV941.catch(function(){return null})]);
    try{if(storyMasterV941&&typeof storyMasterV941.finalizeSignedInIdentityV941==='function')storyMasterV941.finalizeSignedInIdentityV941(user&&user.id||'',user)}catch(_storyFinal){}
    broadcast('SIGNED_IN_READY');
    closeOverlay(true);
    return {recoveredDeletion:!!(lifecycle&&lifecycle.recovered)};
  }
  async function signInWithQuotaRecoveryV752(c,email,pass){
    try{return await c.auth.signInWithPassword({email:email,password:pass});}
    catch(err){
      var q=window.HappyadAuthStorageV752;
      if(!q||!q.isQuota||!q.isQuota(err))throw err;
      try{await q.recover('login-retry');}catch(_e){}
      return await c.auth.signInWithPassword({email:email,password:pass});
    }
  }
  async function doLogin(e){
    stop(e);if(busy)return;var email=value('happyadAuthEmailV595'),pass=value('happyadAuthPassV595');
    if(!email||!pass){setStatus('Entre Gmail et mot de passe.');return;}
    var c=client();if(!c||!c.auth){setStatus('Connexion non prête.');return;}
    busy=true;setStatus('');setSubmitBusy('happyadAuthLoginSubmitV595',true,'Connexion…','Se connecter');
    setLoginGuardPendingV855R47(true,'');
    try{
      var r=await signInWithQuotaRecoveryV752(c,email,pass);if(r&&r.error)throw r.error;
      var user=r&&r.data&&r.data.user;if(!user)throw new Error('Session introuvable.');
      await enforceAccountLifecycleBeforeLoginV855R48();
      setLoginGuardPendingV855R47(true,user.id);
      var protectedLogin=await beginLoginGuardV855R47(user,email);
      if(!protectedLogin){
        resetLoginGuardV855R47();
        var done=await finishSignedIn(user,{email:email});
        toast(done&&done.recoveredDeletion?'Compte récupéré ✅ La suppression programmée a été annulée.':'Connecté ✅');
      }
    }catch(err){
      try{await c.auth.signOut();}catch(_e){}
      applySession(null,'LOGIN_GUARD_FAILED',{forceBroadcast:true});resetLoginGuardV855R47();
      var q=window.HappyadAuthStorageV752;
      if(q&&q.isQuota&&q.isQuota(err))setStatus('Espace temporaire saturé. Fyblic a libéré le cache de chargement. Appuie encore une fois sur Se connecter.','error');
      else if(invalidCredentialsV855R61(err))setStatus('Gmail ou mot de passe incorrect.','error');
      else setStatus('Connexion impossible : '+clean(err&&err.message||err),'error');
    }
    finally{busy=false;setSubmitBusy('happyadAuthLoginSubmitV595',false,'Connexion…','Se connecter');}
  }
  async function doForgot(e,opts){
    stop(e);if(busy)return;opts=opts||{};
    var email=clean(opts.email||value('happyadAuthForgotEmailV597')||recoveryFlowV855R40.email);
    if(!email){setStatus('Entre ton Gmail.');return;}
    var c=client();if(!c||!c.auth){setStatus('Connexion non prête.');return;}
    recoveryFlowV855R40.email=email;recoveryFlowV855R40.verified=false;
    busy=true;setStatus('');
    var btnId=opts.resend?'happyadAuthForgotResendV855R40':'happyadAuthForgotSubmitV597';
    setSubmitBusy(btnId,true,'Envoi…',opts.resend?'Renvoyer le code':'Envoyer le code');
    try{
      var redirect=happyadPasswordRecoveryRedirectV701();
      var options=redirect?{redirectTo:redirect}:{};
      var r=await c.auth.resetPasswordForEmail(email,options);if(r&&r.error)throw r.error;
      renderForgotCodeV855R40(email,opts.resend?'Nouveau code envoyé. Vérifie ton Gmail.':'Code envoyé. Vérifie ton Gmail.');
    }catch(err){setStatus('Envoi impossible : '+clean(err&&err.message||err));}
    finally{busy=false;setSubmitBusy(btnId,false,'Envoi…',opts.resend?'Renvoyer le code':'Envoyer le code');}
  }
  async function doForgotVerifyV855R40(e){
    stop(e);if(busy)return;
    var email=clean(recoveryFlowV855R40.email),code=clean(value('happyadAuthForgotCodeV855R40')).replace(/\D/g,'');
    if(!email){renderForgot('');setStatus('Entre ton Gmail.');return;}
    if(!/^\d{6}$/.test(code)){setStatus('Entre exactement les 6 chiffres du code reçu.');return;}
    var c=client();if(!c||!c.auth){setStatus('Connexion non prête.');return;}
    busy=true;setStatus('Vérification…');
    try{
      var expectedEmail=normalizeEmailV855R61(email);
      var r=await c.auth.verifyOtp({email:email,token:code,type:'recovery'});if(r&&r.error)throw r.error;
      var verifiedUser=r&&r.data&&r.data.user||null;
      var verifiedSession=r&&r.data&&r.data.session||null;
      if(!verifiedSession){var gs=await c.auth.getSession();verifiedSession=gs&&gs.data&&gs.data.session||null;}
      if(!verifiedSession)throw new Error('Session de récupération introuvable après vérification du code.');
      var sessionUser=verifiedSession.user||verifiedUser||null;
      if(!sessionUser||normalizeEmailV855R61(sessionUser.email)!==expectedEmail){
        try{await c.auth.signOut();}catch(_signoutMismatch){}
        recoveryFlowV855R40.verified=false;
        throw new Error('Ce code ne correspond pas au Gmail de récupération demandé.');
      }
      if(verifiedUser&&normalizeEmailV855R61(verifiedUser.email)!==expectedEmail){
        try{await c.auth.signOut();}catch(_signoutMismatch2){}
        recoveryFlowV855R40.verified=false;
        throw new Error('Ce code appartient à un autre Gmail.');
      }
      recoveryFlowV855R40.verified=true;
      renderForgotPasswordV855R40(email);
    }catch(err){
      var input=document.getElementById('happyadAuthForgotCodeV855R40');if(input){delete input.dataset.happyadAutoVerifyV855R61;input.value='';input.focus();}
      setStatus('Code invalide, expiré ou associé à un autre Gmail.','error');
    }
    finally{busy=false;}
  }
  async function doForgotSavePasswordV855R40(e){
    stop(e);if(busy)return;
    var email=clean(recoveryFlowV855R40.email),pass1=value('happyadAuthForgotPass1V855R40'),pass2=value('happyadAuthForgotPass2V855R40');
    if(!recoveryFlowV855R40.verified){setStatus('Vérifie d’abord le code reçu.');return;}
    if(pass1.length<6){setStatus('Utilise au moins 6 caractères pour le mot de passe.');return;}
    if(pass1!==pass2){setStatus('Les mots de passe ne sont pas identiques.');return;}
    var c=client();if(!c||!c.auth){setStatus('Connexion non prête.');return;}
    busy=true;setStatus('');setSubmitBusy('happyadAuthForgotSaveV855R40',true,'Enregistrement…','Enregistrer le mot de passe');
    try{
      var r=await c.auth.updateUser({password:pass1});if(r&&r.error)throw r.error;
      try{await c.auth.signOut();}catch(_e){}
      applySession(null,'PASSWORD_RECOVERY_COMPLETE',{forceBroadcast:true});
      resetRecoveryFlowV855R40();
      renderLogin(email);setStatus('Mot de passe modifié. Connecte-toi avec ton nouveau mot de passe.');toast('Mot de passe modifié ✅');
    }catch(err){setStatus('Modification impossible : '+clean(err&&err.message||err));}
    finally{busy=false;setSubmitBusy('happyadAuthForgotSaveV855R40',false,'Enregistrement…','Enregistrer le mot de passe');}
  }
  function ageFromBirth(value){var b=new Date(value+'T00:00:00');if(isNaN(b.getTime()))return -1;var n=new Date();var a=n.getFullYear()-b.getFullYear();var m=n.getMonth()-b.getMonth();if(m<0||(m===0&&n.getDate()<b.getDate()))a--;return a;}
  async function doGoogleAuthV1105(e,mode){
    stop(e);if(busy)return false;
    setStatus('');
    toast(mode==='signup'
      ? 'Google n’est pas encore disponible. Inscrivez-vous avec votre Gmail et un mot de passe.'
      : 'Google n’est pas encore disponible. Saisissez votre Gmail et votre mot de passe pour vous connecter.');
    return false;
  }
  async function doSignup(e){
    stop(e);if(busy)return;
    var name=value('happyadAuthNameV595'),handle=value('happyadAuthHandleV595').replace(/^@+/,'').replace(/\s+/g,'').toLowerCase();
    var birth=value('happyadAuthBirthV595'),email=value('happyadAuthSignupEmailV595'),pass=value('happyadAuthSignupPassV595'),pass2=value('happyadAuthSignupPass2V595');
    if(!name||!handle||!birth||!email||!pass){setStatus('Remplis tous les champs.');return;}
    if(ageFromBirth(birth)<18){setStatus('Inscription autorisée à partir de 18 ans.');return;}
    if(pass.length<6){setStatus('Utilise au moins 6 caractères pour le mot de passe.');return;}
    if(pass!==pass2){setStatus('Les mots de passe ne sont pas identiques.');return;}
    var c=client();if(!c||!c.auth){setStatus('Connexion non prête.');return;}
    busy=true;setStatus('Création du compte…');
    try{
      var r=await c.auth.signUp({email:email,password:pass,options:{data:{full_name:name,username:handle,birth_date:birth}}});if(r&&r.error)throw r.error;
      var user=r&&r.data&&r.data.user;if(!user)throw new Error('Compte non créé.');
      if(r.data&&r.data.session){await finishSignedIn(user,{name:name,full_name:name,username:handle,handle:handle,email:email});toast('Compte créé ✅');}
      else{setStatus('Compte créé. Confirme ton Gmail puis connecte-toi.');}
    }catch(err){setStatus('Création impossible : '+clean(err&&err.message||err));}
    finally{busy=false;}
  }
  function resumePending(){
    var intent=pendingIntent;pendingIntent=null;if(!intent)return;
    setTimeout(function(){
      try{
        if(typeof intent.resume==='function'){intent.resume();return;}
        if(intent.sourceWindow&&intent.sourceWindow.postMessage){intent.sourceWindow.postMessage({type:'HAPPYAD_AUTH_RESUME_LAST_ACTION_V595',detail:{action:intent.action||''}},'*');return;}
        if(intent.mainNav&&window.HappyMainTabsV595){window.HappyMainTabsV595.open(intent.mainNav,{authResume:true});}
      }catch(_e){}
    },90);
  }
  function closeOverlay(authSuccess){
    if(!overlay)return;
    if(isLoginGuardPendingV855R47()&&!authSuccess){
      try{var gc=client();if(gc&&gc.auth)gc.auth.signOut().catch(function(){});}catch(_e){}
      applySession(null,'LOGIN_GUARD_CANCELLED',{forceBroadcast:true});
      resetLoginGuardV855R47();
    }
    if(recoveryFlowV855R40.verified&&!authSuccess){
      try{var rc=client();if(rc&&rc.auth)rc.auth.signOut().catch(function(){});}catch(_e){}
      applySession(null,'PASSWORD_RECOVERY_CLOSED',{forceBroadcast:true});
      resetRecoveryFlowV855R40();
    }
    clearTimeout(authOpeningTimerV710);authOpeningTimerV710=0;authUnlockAtV710=0;
    overlay.classList.remove('on','happyadAuthOpeningV710');overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('happyadAuthGateOpenV595');
    if(authSuccess)resumePending();
  }
  function showOverlay(intent,mode){
    pendingIntent=intent||null;ensureOverlay();
    mode=clean(mode).toLowerCase();
    if(mode==='login')renderLogin();
    else if(mode==='signup'||mode==='register'||mode==='inscription')renderSignup();
    else renderChoice();
    armAuthOpeningV710(300);
    overlay.classList.add('on');overlay.setAttribute('aria-hidden','false');document.body.classList.add('happyadAuthGateOpenV595');
  }
  function guestNotice(){toast('Connexion requise');return false;}
  async function requireAuth(intent){
    if(isAuthenticated())return true;
    /* V598 : toutes les actions invité affichent seulement une notification. */
    guestNotice();
    return false;
  }
  function open(intent){return requireAuth(intent||{});}
  function openLogin(intent){
    if(isAuthenticated())return true;
    showOverlay(intent||{},'login');return false;
  }
  function openSignup(intent){
    if(isAuthenticated())return true;
    showOverlay(intent||{},'signup');return false;
  }
  function openChoice(intent){
    if(isAuthenticated())return true;
    showOverlay(intent||{},'choice');return false;
  }
  function clearPrivateAuthStorage(){
    try{
      var remove=[];
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);if(!k)continue;var low=k.toLowerCase();
        if(low.indexOf('supabase')>-1||low.indexOf('sb-')===0||low.indexOf('auth-token')>-1||low.indexOf('gotrue')>-1||k.indexOf('HAPPYAD_AUTH')===0||k==='HAPPYAD_SESSION_ACTIVE'||k===USER_KEY||k==='HAPPYAD_USER'||k==='HAPPYAD_CURRENT_USER'||k==='happyad_current_user'||k==='HAPPYAD_LOGGED_USER'||k==='HAPPYAD_USER_V1'||k==='HAPPYAD_AUTH_USER'||k==='HAPPYAD_ACTIVE_PROFILE'||k==='HAPPYAD_PUBLIC_PROFILE_ACTIVE_UID'||k==='HAPPYAD_ACTIVE_PROFILE_UID')remove.push(k);
      }
      remove.forEach(function(k){try{localStorage.removeItem(k);}catch(_e){}});
      localStorage.setItem('HAPPYAD_SESSION_ACTIVE','0');
      localStorage.setItem('HAPPYAD_FORCE_LOGOUT','1');
      localStorage.setItem('HAPPYAD_FORCE_LOGOUT_UNTIL',String(Date.now()+1500));
    }catch(_e){}
    try{
      ['HAPPYAD_RECONNECT_OPEN_AUTH_V35','HAPPYAD_PROFILE_MASTER_ACTIVE_UID','HAPPYAD_PROFILE_MASTER_ACTIVE_URL'].forEach(function(k){sessionStorage.removeItem(k);});
    }catch(_e){}
  }
  async function logout(options){
    options=options||{};if(busy)return false;busy=true;
    var oldUid=actualUser()&&actualUser().id||localHintId()||'';
    var pushTask=null,signOutTask=null,accountPurgeTask=null,c=null;
    try{var pushMaster=window.HappyPushMaster;if(pushMaster&&typeof pushMaster.deactivateCurrent==='function')pushTask=Promise.resolve(pushMaster.deactivateCurrent()).catch(function(){});}catch(_pushError){}
    try{c=client();if(c&&typeof c.removeAllChannels==='function')c.removeAllChannels();}catch(_channels){}
    /* V937 : l'interface devient invitée immédiatement, mais les jetons Supabase ne
       sont plus effacés sous les pieds de signOut. La purge auth IndexedDB arrive
       après signOut (ou son délai maximal), ce qui supprime la course A -> B. */
    session=null;ready=true;
    /* Purge synchrone d'abord (aucune donnée A ne reste peinte), puis broadcast :
       Messages reçoit SIGNED_OUT et ferme sa base IndexedDB avant la suppression
       physique de la DB. Cela évite un deleteDatabase bloqué par l'iframe ouverte. */
    try{
      var iso=isolationV937();
      if(iso){
        if(typeof iso.purgeLocalForUid==='function')iso.purgeLocalForUid(oldUid);
        if(typeof iso.purgeLegacyPrivate==='function')iso.purgeLegacyPrivate();
        if(typeof iso.clearActiveIdentity==='function')iso.clearActiveIdentity();
        if(typeof iso.clearPrivateMemory==='function')iso.clearPrivateMemory();
      }
    }catch(_iso){}
    try{localStorage.setItem('HAPPYAD_SESSION_ACTIVE','0');localStorage.removeItem('HAPPYAD_AUTH_UID');localStorage.setItem('HAPPYAD_FORCE_LOGOUT','1');localStorage.setItem('HAPPYAD_FORCE_LOGOUT_UNTIL',String(Date.now()+5000));localStorage.setItem('HAPPYAD_LOGOUT_LOCK_V1','1');localStorage.setItem('HAPPYAD_LOGOUT_AT_V1',String(Date.now()));if(oldUid)localStorage.setItem('HAPPYAD_LOGOUT_PREVIOUS_UID_V1',oldUid);}catch(_state){}
    broadcast('SIGNED_OUT');closeOverlay(false);
    try{
      var isoAfter=isolationV937();
      if(isoAfter&&typeof isoAfter.purgeAccount==='function')accountPurgeTask=new Promise(function(resolve){setTimeout(function(){Promise.resolve(isoAfter.purgeAccount(oldUid)).then(resolve,resolve);},60);});
    }catch(_isoAfter){}
    try{if(navigator.serviceWorker&&navigator.serviceWorker.controller)navigator.serviceWorker.controller.postMessage({type:'HAPPYAD_CLEAR_USER_CACHES_V855R59'});}catch(_sw){}
    try{var nav=window.HappyNavigation;if(nav&&typeof nav.close==='function')nav.close('auth-logout-v937',true);if(nav&&typeof nav.invalidateOwnerProfile==='function')nav.invalidateOwnerProfile('auth-logout-v937');}catch(_e){}
    toast('Déconnecté ✅');
    /* Le push doit avoir une courte fenêtre pour désactiver l'abonnement serveur
       avec la session A encore valide. L'interface est déjà invitée pendant ce temps. */
    try{if(pushTask)await Promise.race([Promise.resolve(pushTask),new Promise(function(resolve){setTimeout(resolve,550);})]);}catch(_pushBeforeSignout){}
    try{if(c&&c.auth&&c.auth.signOut)signOutTask=Promise.resolve(c.auth.signOut({scope:'local'})).catch(function(){});}catch(_signOutError){}
    try{
      if(signOutTask)await Promise.race([signOutTask,new Promise(function(resolve){setTimeout(resolve,1800);})]);
      var storage=window.HappyadAuthStorageV752;if(storage&&typeof storage.purgeAuthTokens==='function')await storage.purgeAuthTokens().catch(function(){});
    }catch(_authPurge){}
    clearPrivateAuthStorage();
    try{if(accountPurgeTask)await Promise.race([accountPurgeTask,new Promise(function(resolve){setTimeout(resolve,1200);})]);}catch(_accountPurgeWait){}
    try{await Promise.race([Promise.resolve(pushTask),new Promise(function(resolve){setTimeout(resolve,450);})]);}catch(_pushWait){}
    busy=false;
    return true;
  }
  function isAuthOverlayTarget(target){return !!(target&&target.closest&&target.closest('#happyadAuthGateV595'));}
  function isPwaInstallTarget(target){return !!(target&&target.closest&&target.closest('#happyadInstallAppBtn,#happyadPwaGuide'));}
  function isCachedMainDockSurfaceV877(target){
    try{
      if(!localHintId()||!target||!target.closest)return false;
      return !!target.closest('.bottom [data-happyad-main-nav="message"],.bottom [data-happyad-main-nav="profile"]');
    }catch(_e){return false;}
  }
  function isHomePhotoViewerControl(target){
    if(!target||!target.closest)return false;
    return !!target.closest('#happyadHomePhotoFullscreen .haHomeFsBackV591,#happyadHomePhotoFullscreen .haHomeFsClose,#happyadHomePhotoFullscreen .haHomeFsSeeMore,#happyadHomePhotoFullscreen .haHomeFsPrev,#happyadHomePhotoFullscreen .haHomeFsNext');
  }
  function isAllowedVideoOpen(target){
    if(!target||!target.closest)return false;
    if(target.closest('[data-happyad-main-nav="video"]'))return true;
    var card=target.closest('.miniCard.videoCard,[data-happyad-open-video],[data-open-video]');
    if(!card)return false;
    if(target.closest('[data-card-act],.miniActions,.miniTop,.creator,.avatar,.miniSeeMore,a,button:not(.play)'))return false;
    return !!target.closest('.miniMedia,.play,.miniCardFrame')||target===card;
  }
  function isAllowedHomePhotoOpen(target){
    if(!target||!target.closest)return false;
    var card=target.closest('#list .miniCard:not(.videoCard),.hScroller .miniCard:not(.videoCard)');
    if(!card)return false;
    if(target.closest('[data-card-act],.miniActions,.miniTop,.creator,.avatar,.miniSeeMore,a,button'))return false;
    return !!target.closest('.miniMedia,.happyadAlbumSlide,.haAlbumFullSlide,img');
  }
  function isGuestPassiveAllowedV938(target){
    if(!target||!target.closest)return false;
    /* V938 : sans compte, Fyblic reste consultable. Seules les surfaces de
       lecture/navigation ci-dessous passent le gate central. Les écritures et
       surfaces privées continuent à passer par guestNotice(). */
    if(target.closest('#homeSearchBtn,#homeSearchPanel,#happyadSmartSearchV427,.chip'))return true;
    if(target.closest('.bottom [data-happyad-main-nav="home"],.bottom [data-happyad-main-nav="video"]'))return true;
    if(target.closest('.happyadMarketplaceCardCtaV856,[data-happyad-open-listing],[data-open-marketplace-listing]'))return true;
    if(target.closest('button.radarItem[data-story-owner],#homeRadarStoryMasterV629 button.radarItem[data-story-owner]'))return true;
    if(target.closest('.miniTop,.creatorPill,[data-open-slide-profile],[data-open-comment-profile],[data-ha-profile-uid],.happyadMentionLink,[data-happyad-profile-uid]'))return true;
    if(target.closest('[aria-label="Retour"],[aria-label="Revenir à la page précédente"],[aria-label="Fermer"],[data-happyad-internal-return],[data-happyad-internal-return-v591],.ha629Back,.haHomeFsBackV591,.haHomeFsClose'))return true;
    /* Le viewer Story lui-même est passif : navigation gauche/droite/zoom est
       autorisée. Ses boutons Like/Partager/Répondre/Plus ne le sont pas. */
    if(target.closest('#happyStoryViewerMasterV629')){
      if(target.closest('#ha629Like,#ha629Share,#ha629ReplyForm,#ha629ReplyInput,#ha629Send,.ha629More,.ha629OwnerActions,.ha629VisitorActions'))return false;
      return true;
    }
    return false;
  }
  function actionable(target){
    if(!target||!target.closest)return null;
    return target.closest('button,a[href],[role="button"],input[type="button"],input[type="submit"],select,textarea,[data-card-act],[data-act],[data-profile-act],.creatorPill,.miniTop,.radarItem,.mapLite,.seeMore');
  }
  function gateParentClick(e){
    var target=e&&e.target;if(!target||isAuthOverlayTarget(target)||isPwaInstallTarget(target)||isAuthenticated())return;
    /* Une vérification réseau momentanément en retard ne doit pas avaler le clic
       sur une surface locale déjà autorisée. Chaque module reconfirme ensuite la
       session canonique avant son travail connecté. */
    if(target.closest&&target.closest('.bottom [data-happyad-main-nav="profile"]')){stop(e);openChoice({action:'profile-guest',mainNav:'profile'});return false;}
    if(target.closest&&target.closest('.bottom [data-happyad-main-nav="profile"]')){try{e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}catch(_e){}return;}
    if(isCachedMainDockSurfaceV877(target))return;
    if(isGuestPassiveAllowedV938(target))return;
    var direct=target.closest&&target.closest('[data-happyad-auth-direct-v598]');
    if(direct){
      stop(e);
      var mode=clean(direct.getAttribute('data-happyad-auth-direct-v598')).toLowerCase();
      var nowDirect=Date.now();
      if(mode===lastDirectMode&&nowDirect-lastDirectAt<420)return false;
      lastDirectMode=mode;lastDirectAt=nowDirect;
      if(mode==='signup'||mode==='inscription'||mode==='register')openSignup({action:'inscription-radar'});
      else openLogin({action:'connexion-radar'});
      return false;
    }
    if(isHomePhotoViewerControl(target)||isAllowedVideoOpen(target)||isAllowedHomePhotoOpen(target))return;
    var act=actionable(target);if(!act)return;
    var now=Date.now();if(lastGateTarget===act&&now-lastGateAt<420){stop(e);return false;}lastGateTarget=act;lastGateAt=now;
    stop(e);
    guestNotice();
    return false;
  }
  function holdParentPointerDownV710(e){
    var target=e&&e.target;if(!target||isAuthOverlayTarget(target)||isPwaInstallTarget(target)||isAuthenticated())return;
    if(isCachedMainDockSurfaceV877(target))return;
    if(isGuestPassiveAllowedV938(target))return;
    var direct=target.closest&&target.closest('[data-happyad-auth-direct-v598]');
    if(!direct&&isHomePhotoViewerControl(target))return;
    if(!direct&&isAllowedVideoOpen(target))return;
    if(!direct&&isAllowedHomePhotoOpen(target))return;
    var act=direct||actionable(target);if(!act)return;
    /* Ne pas ouvrir le popup au pointerdown : le clic final pourrait tomber sur
       un bouton qui vient juste d'apparaître. On bloque seulement la propagation. */
    try{e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}catch(_e){}
  }
  document.addEventListener('pointerdown',holdParentPointerDownV710,true);
  document.addEventListener('click',gateParentClick,true);

  window.addEventListener('message',function(ev){
    try{
      var d=ev&&ev.data;if(!d)return;
      if(d.type==='HAPPYAD_AUTH_OPEN_REQUEST_V597'||d.type==='HAPPYAD_AUTH_OPEN_REQUEST_V596'||d.type==='HAPPYAD_AUTH_OPEN_REQUEST_V595'){
        requireAuth({action:clean(d.detail&&d.detail.action)||'action',sourceWindow:ev.source||null});
      }else if(d.type==='HAPPYAD_AUTH_LOGOUT_REQUEST_V597'||d.type==='HAPPYAD_AUTH_LOGOUT_REQUEST_V596'||d.type==='HAPPYAD_AUTH_LOGOUT_REQUEST_V595'){
        logout({source:'frame'});
      }else if(d.type==='HAPPYAD_AUTH_FRAME_READY_V597'||d.type==='HAPPYAD_AUTH_FRAME_READY_V596'||d.type==='HAPPYAD_AUTH_FRAME_READY_V595'){
        var detail=sessionDetail('FRAME_READY');
        try{ev.source&&ev.source.postMessage({type:detail.authenticated?'HAPPYAD_AUTH_SIGNED_IN_V595':'HAPPYAD_AUTH_SIGNED_OUT_V595',detail:detail},'*');}catch(_e){}
      }
    }catch(_e){}
  },true);

  function bindAuthState(){
    var c=client();if(!c||!c.auth||typeof c.auth.onAuthStateChange!=='function')return;
    try{c.auth.onAuthStateChange(function(event,nextSession){
      var ev=clean(event).toUpperCase();
      if(logoutLockActiveV937()&&nextSession&&nextSession.user){applySession(null,'FORCED_LOGOUT_AUTH_EVENT',{forceBroadcast:true});return;}
      if(ev==='SIGNED_OUT'||ev==='USER_DELETED'){
        if(sessionRetryTimerV937){clearTimeout(sessionRetryTimerV937);sessionRetryTimerV937=0;}
        sessionErrorCountV937=0;
      }
      if(nextSession&&nextSession.user)sessionErrorCountV937=0;
      /* TOKEN_REFRESHED/USER_UPDATED peuvent arriver sans objet session pendant
         une reprise réseau. Ce vide transitoire ne vaut pas SIGNED_OUT. */
      if((!nextSession||!nextSession.user)&&ev!=='SIGNED_OUT'&&ev!=='USER_DELETED'&&(actualUser()||localHintId())){
        if(sessionRetryTimerV937)clearTimeout(sessionRetryTimerV937);
        sessionRetryTimerV937=setTimeout(function(){sessionRetryTimerV937=0;refresh(false).catch(function(){});},120);
        return;
      }
      applySession(nextSession,event||'AUTH_CHANGE',{forceBroadcast:ev==='SIGNED_OUT'||ev==='USER_DELETED'});
    });}catch(_e){}
  }
  /* V937 : Auth démarre avant le rendu des modules. L'overlay attend toujours le DOM,
     mais la session canonique et son listener ne doivent plus attendre DOMContentLoaded. */
  refresh(false);bindAuthState();
  window.addEventListener('online',function(){
    if(!(actualUser()||localHintId())||logoutLockActiveV937())return;
    if(sessionRetryTimerV937){clearTimeout(sessionRetryTimerV937);sessionRetryTimerV937=0;}
    refresh(false).catch(function(){});
  },{passive:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){ensureOverlay();},{once:true});
  else ensureOverlay();

  window.HappyAuthSessionV598={version:VERSION,isReady:function(){return ready;},isAuthenticated:isAuthenticated,user:actualUser,refresh:refresh,require:requireAuth,open:open,openLogin:openLogin,openSignup:openSignup,openChoice:openChoice,notice:guestNotice,close:closeOverlay,logout:logout,broadcast:broadcast};
  window.HappyAuthSessionV597=window.HappyAuthSessionV598;
  window.HappyAuthSessionV596=window.HappyAuthSessionV598;
  window.HappyAuthSessionV595=window.HappyAuthSessionV598;
  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('auth-session',{file:'core/auth-session-master-v598.js',responsibility:'session centrale, notification invité simple et popup réservé au Radar',active:true,version:VERSION});}catch(_e){}
})();
