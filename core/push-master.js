(function(){
  'use strict';
  if(window.__HAPPYAD_PUSH_MASTER_V45__)return;
  window.__HAPPYAD_PUSH_MASTER_V45__=true;

  var VERSION='HAPPYAD_PUSH_MASTER_V45_VOLUNTARY_SETTINGS';
  var VAPID_PUBLIC_KEY='BA3UgDp8-6VYN6nZgSNX14LeZVLK6FesJgLXVytEKkKgplK_3KVssohN_SAKPDdkhoAmpQzIo3Ev9VGIXNZP-bE';
  var INSTALL_KEY='HAPPYAD_PUSH_INSTALLATION_ID_V1';
  var DISMISS_KEY='HAPPYAD_PUSH_PROMPT_DISMISSED_AT_V2';
  var LEGACY_DISMISS_KEY='HAPPYAD_PUSH_PROMPT_DISMISSED_AT_V1';
  var LAST_UID_KEY='HAPPYAD_PUSH_LAST_UID_V1';
  var TEST_DONE_KEY='HAPPYAD_PUSH_TEST_DONE_V2';
  var VAPID_BINDING_KEY='HAPPYAD_PUSH_VAPID_PUBLIC_KEY_V1';
  var LAST_ENSURE_KEY='HAPPYAD_PUSH_LAST_ENSURE_AT_V1';
  var LAST_DELAY_NOTICE_KEY='HAPPYAD_PUSH_LAST_DELAY_NOTICE_AT_V1';
  var REPAIR_KEY='HAPPYAD_PUSH_REPAIR_V780';
  var LAST_ERROR_KEY='HAPPYAD_PUSH_LAST_ERROR_V780';
  var ENSURE_INTERVAL_MS=4*60*60*1000;
  var PROMPT_INTERVAL_MS=24*60*60*1000;
  var ui=null;
  var busy=false;
  var authBound=false;
  var lastSessionUid='';
  var ensurePromise=null;
  var promptTimer=0;

  function clean(v){return String(v==null?'':v).trim();}
  function now(){return Date.now();}
  function safeGet(k){try{return localStorage.getItem(k)||'';}catch(e){return '';}}
  function safeSet(k,v){try{localStorage.setItem(k,String(v));}catch(e){}}
  function safeRemove(k){try{localStorage.removeItem(k);}catch(e){}}
  function rememberError(err){
    var raw=clean(err&&err.message||err&&err.code||err);
    if(raw)safeSet(LAST_ERROR_KEY,raw);else safeRemove(LAST_ERROR_KEY);
    return raw;
  }
  function clearError(){safeRemove(LAST_ERROR_KEY);}
  function activationErrorMessage(err){
    var raw=clean(err&&err.message||err&&err.code||err).toUpperCase();
    if(!raw)return 'Activation impossible. Réessayez après avoir actualisé Fyblic.';
    if(raw.indexOf('AUTH_OR_SW_NOT_READY')>=0||raw.indexOf('AUTH_REQUIRED')>=0)return 'Reconnectez-vous puis réessayez l’activation.';
    if(raw.indexOf('SERVICE_WORKER_TIMEOUT')>=0||raw.indexOf('SERVICE WORKER')>=0)return 'Le moteur de notification n’est pas encore prêt. Actualisez Fyblic puis réessayez.';
    if(raw.indexOf('PGRST202')>=0||raw.indexOf('FUNCTION')>=0&&raw.indexOf('NOT FOUND')>=0||raw.indexOf('HAPPYAD_PUSH_REGISTER_SUBSCRIPTION')>=0)return 'Le SQL Push doit être réparé dans Supabase avant l’activation.';
    if(raw.indexOf('SUBSCRIPTION_INCOMPLETE')>=0)return 'Le téléphone n’a pas créé une souscription Push complète. Réessayez après avoir actualisé.';
    if(raw.indexOf('NOTALLOWEDERROR')>=0||raw.indexOf('PERMISSION')>=0)return 'Android ou Chrome bloque les notifications pour Fyblic.';
    if(raw.indexOf('ABORTERROR')>=0||raw.indexOf('INVALIDSTATEERROR')>=0)return 'L’ancien abonnement du navigateur est bloqué. Actualisez Fyblic puis réessayez.';
    if(raw.indexOf('NETWORK')>=0||raw.indexOf('FAILED TO FETCH')>=0)return 'Connexion impossible à Supabase. Vérifiez Internet puis réessayez.';
    return 'Activation impossible : '+clean(err&&err.message||err&&err.code||err).slice(0,140);
  }
  function workerReady(timeoutMs){
    return Promise.race([
      navigator.serviceWorker.ready,
      new Promise(function(_resolve,reject){setTimeout(function(){reject(new Error('SERVICE_WORKER_TIMEOUT'));},Number(timeoutMs||10000));})
    ]);
  }
  function supports(){return !!(window.isSecureContext&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window);}
  function client(){
    try{if(typeof window.happyadSb==='function')return window.happyadSb();}catch(e){}
    try{return window.happyadSupabase||null;}catch(e){return null;}
  }
  function base64UrlToUint8Array(base64String){
    var padding='='.repeat((4-base64String.length%4)%4);
    var base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
    var raw=atob(base64);var out=new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
    return out;
  }
  function randomId(){
    try{if(crypto&&crypto.randomUUID)return crypto.randomUUID();}catch(e){}
    try{var a=new Uint8Array(16);crypto.getRandomValues(a);return Array.from(a).map(function(n){return n.toString(16).padStart(2,'0');}).join('');}catch(e){}
    return 'ha-'+now()+'-'+Math.random().toString(36).slice(2);
  }
  function installationId(){var id=clean(safeGet(INSTALL_KEY));if(!id){id=randomId();safeSet(INSTALL_KEY,id);}return id;}
  function subscriptionJson(sub){
    var j=sub&&sub.toJSON?sub.toJSON():{};
    return {
      endpoint:clean(sub&&sub.endpoint||j.endpoint),
      expirationTime:(sub&&sub.expirationTime!=null?sub.expirationTime:j.expirationTime)||null,
      p256dh:clean(j&&j.keys&&j.keys.p256dh),
      auth:clean(j&&j.keys&&j.keys.auth)
    };
  }
  function sameBytes(a,b){
    try{
      var left=new Uint8Array(a||new ArrayBuffer(0));
      var right=new Uint8Array(b||new ArrayBuffer(0));
      if(left.length!==right.length)return false;
      for(var i=0;i<left.length;i++)if(left[i]!==right[i])return false;
      return true;
    }catch(e){return false;}
  }
  function subscriptionUsesCurrentVapid(sub){
    if(!sub)return false;
    try{
      var actual=sub.options&&sub.options.applicationServerKey;
      if(actual)return sameBytes(actual,base64UrlToUint8Array(VAPID_PUBLIC_KEY));
    }catch(e){}
    return clean(safeGet(VAPID_BINDING_KEY))===VAPID_PUBLIC_KEY;
  }
  function disableSavedSubscription(session,sub){
    var c=client();var endpoint=clean(sub&&sub.endpoint);
    if(!c||!session||!session.user||!endpoint)return Promise.resolve(false);
    return c.rpc('happyad_push_disable_subscription',{p_endpoint:endpoint})
      .then(function(r){return !(r&&r.error);})
      .catch(function(){return false;});
  }
  function retireSubscription(session,sub){
    if(!sub)return Promise.resolve(null);
    return disableSavedSubscription(session,sub)
      .then(function(){return sub.unsubscribe().catch(function(){return false;});})
      .then(function(){safeRemove(TEST_DONE_KEY);safeRemove(VAPID_BINDING_KEY);return null;});
  }
  function currentSession(){
    var c=client();if(!c||!c.auth||!c.auth.getSession)return Promise.resolve(null);
    return c.auth.getSession().then(function(r){return r&&r.data&&r.data.session||null;}).catch(function(){return null;});
  }
  function toast(msg){
    try{if(typeof window.showToast==='function'){window.showToast(msg);return;}}catch(e){}
    try{if(typeof window.toast==='function'){window.toast(msg);return;}}catch(e){}
    var old=document.getElementById('happyadPushToastV38E1');if(old)old.remove();
    var t=document.createElement('div');t.id='happyadPushToastV38E1';t.textContent=msg;
    t.style.cssText='position:fixed;left:50%;bottom:104px;transform:translateX(-50%);z-index:2147483647;background:#111820;color:#fff;border:1px solid rgba(255,138,0,.45);border-radius:999px;padding:10px 15px;font:900 13px/1.2 system-ui;box-shadow:0 12px 34px rgba(0,0,0,.65);max-width:86vw;text-align:center';
    document.body.appendChild(t);setTimeout(function(){try{t.remove();}catch(e){}},2600);
  }
  function hidePrompt(){if(ui){try{ui.remove();}catch(e){}ui=null;}}
  function promptKey(uid){return DISMISS_KEY+':'+clean(uid)+':'+installationId();}
  function promptDismissedAt(uid){
    var key=promptKey(uid);var current=Number(safeGet(key)||0);
    if(current>0)return current;
    var legacy=Number(safeGet(LEGACY_DISMISS_KEY)||0);
    if(legacy>0){safeSet(key,legacy);safeRemove(LEGACY_DISMISS_KEY);return legacy;}
    return 0;
  }
  function promptDismissedRecently(uid){var t=promptDismissedAt(uid);return t>0&&(now()-t)<PROMPT_INTERVAL_MS;}
  function clearPromptTimer(){if(promptTimer){clearTimeout(promptTimer);promptTimer=0;}}
  function schedulePromptReminder(uid,firstDelay){
    clearPromptTimer();uid=clean(uid||lastSessionUid);
    if(!uid||!supports()||Notification.permission==='granted')return;
    var dismissed=promptDismissedAt(uid);
    var delay=Number(firstDelay);
    if(!(delay>=0))delay=dismissed>0?Math.max(0,PROMPT_INTERVAL_MS-(now()-dismissed)):1800;
    promptTimer=setTimeout(function(){promptTimer=0;maybeShowPromptDue(uid);},Math.min(delay,2147480000));
  }
  function maybeShowPromptDue(uid){
    uid=clean(uid||lastSessionUid);if(!uid||!supports()||Notification.permission==='granted'){clearPromptTimer();hidePrompt();return;}
    if(promptDismissedRecently(uid)){schedulePromptReminder(uid);return;}
    if(document.visibilityState==='hidden'){schedulePromptReminder(uid,60*1000);return;}
    showPrompt(uid);
  }
  function ensureStyle(){
    if(document.getElementById('happyadPushStyleV38E1'))return;
    var s=document.createElement('style');s.id='happyadPushStyleV38E1';s.textContent='#happyadPushPromptV38E1{position:fixed;left:12px;right:12px;bottom:92px;z-index:2147483000;display:flex;align-items:center;gap:10px;background:linear-gradient(145deg,rgba(11,15,22,.98),rgba(1,4,8,.98));border:1px solid rgba(255,138,0,.42);border-radius:19px;padding:10px;box-shadow:0 20px 48px rgba(0,0,0,.72);font-family:system-ui;color:#fff}#happyadPushPromptV38E1 img{width:44px;height:44px;border-radius:13px;background:#000;object-fit:cover;flex:0 0 44px}#happyadPushPromptV38E1 .haPushText{min-width:0;flex:1}#happyadPushPromptV38E1 b{display:block;font-size:14px;line-height:1.15;font-weight:1000}#happyadPushPromptV38E1 span{display:block;margin-top:3px;color:#b9c0cc;font-size:11px;line-height:1.25;font-weight:750}#happyadPushPromptV38E1 .haPushActions{display:flex;align-items:center;gap:6px}#happyadPushPromptV38E1 button{border:0;font:1000 12px/1 system-ui;cursor:pointer}#happyadPushPromptV38E1 .haPushEnable{height:38px;padding:0 13px;border-radius:13px;background:linear-gradient(135deg,#ff9b16,#ff6500);color:#101114}#happyadPushPromptV38E1 .haPushClose{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.07);color:#fff;font-size:18px}@media(max-width:370px){#happyadPushPromptV38E1{left:8px;right:8px;gap:8px}#happyadPushPromptV38E1 img{width:40px;height:40px;flex-basis:40px}#happyadPushPromptV38E1 span{display:none}#happyadPushPromptV38E1 .haPushEnable{padding:0 10px}}';
    document.head.appendChild(s);
  }
  function showTestPrompt(){
    if(ui||!supports()||Notification.permission!=='granted'||safeGet(TEST_DONE_KEY)==='1')return;
    ensureStyle();
    var box=document.createElement('div');box.id='happyadPushPromptV38E1';
    box.innerHTML='<img src="./icons/happyad-icon-v535center1-96.png" alt="Fyblic"><div class="haPushText"><b>Tester hors application</b><span>Touchez Tester, puis fermez Fyblic et Chrome. La notification doit arriver dans 12 secondes.</span></div><div class="haPushActions"><button class="haPushEnable" type="button">Tester</button><button class="haPushClose" type="button" aria-label="Fermer">×</button></div>';
    box.querySelector('.haPushClose').addEventListener('click',function(){hidePrompt();});
    box.querySelector('.haPushEnable').addEventListener('click',function(){
      var btn=this;btn.disabled=true;btn.textContent='Préparation…';
      testAfterClose().then(function(){safeSet(TEST_DONE_KEY,'1');hidePrompt();}).catch(function(err){btn.disabled=false;btn.textContent='Tester';toast('Le serveur Push de test n’est pas encore prêt.');try{console.warn('Fyblic PUSH TEST',err);}catch(e){}});
    });
    document.body.appendChild(box);ui=box;
  }
  function showPrompt(uid){
    uid=clean(uid||lastSessionUid);
    if(ui||!uid||!supports()||Notification.permission==='granted'||promptDismissedRecently(uid))return;
    ensureStyle();
    var denied=Notification.permission==='denied';
    var box=document.createElement('div');box.id='happyadPushPromptV38E1';
    box.innerHTML='<img src="./icons/happyad-icon-v535center1-96.png" alt="Fyblic"><div class="haPushText"><b>'+(denied?'Réactiver les notifications':'Activer les notifications')+'</b><span>'+(denied?'Autorisez Fyblic dans les paramètres du site ou du téléphone.':'Recevez vos messages même lorsque Fyblic est fermé.')+'</span></div><div class="haPushActions"><button class="haPushEnable" type="button">'+(denied?'Instructions':'Activer')+'</button><button class="haPushClose" type="button" aria-label="Plus tard">×</button></div>';
    box.querySelector('.haPushClose').addEventListener('click',function(){safeSet(promptKey(uid),now());hidePrompt();schedulePromptReminder(uid);});
    box.querySelector('.haPushEnable').addEventListener('click',function(){
      if(denied){safeSet(promptKey(uid),now());hidePrompt();schedulePromptReminder(uid);toast('Dans les paramètres du navigateur, ouvrez Autorisations puis activez Notifications pour Fyblic.');return;}
      activateFromGesture().catch(function(){});
    });
    document.body.appendChild(box);ui=box;
  }
  function notifyWorker(type,data){
    try{
      if(navigator.serviceWorker&&navigator.serviceWorker.controller){
        navigator.serviceWorker.controller.postMessage({type:type,data:data||{}});
      }
    }catch(_e){}
  }
  function cleanupOwnSubscriptions(session,current){
    var c=client();var endpoint=clean(current&&current.endpoint);
    if(!c||!session||!session.user||!endpoint)return Promise.reject(new Error('PUSH_CLEANUP_NOT_READY'));
    var args={p_keep_endpoint:endpoint,p_keep_installation_id:installationId()};
    return c.rpc('happyad_push_cleanup_own_subscriptions',args).then(function(r){
      if(r&&r.error)throw r.error;return r&&r.data||r;
    }).catch(function(first){
      /* Compatibilité temporaire avec l'ancienne RPC sans paramètres. */
      return c.rpc('happyad_push_cleanup_own_subscriptions',{}).then(function(r){if(r&&r.error)throw r.error;return r&&r.data||r;}).catch(function(){throw first;});
    });
  }
  function verifySingleActiveSubscription(session,current){
    var c=client();var endpoint=clean(current&&current.endpoint);
    if(!c||!session||!session.user||!endpoint)return Promise.reject(new Error('PUSH_VERIFY_NOT_READY'));
    return c.from('happyad_push_subscriptions').select('endpoint,enabled,updated_at').eq('user_id',session.user.id).eq('enabled',true).then(function(r){
      if(r&&r.error)throw r.error;var rows=Array.isArray(r&&r.data)?r.data:[];
      if(rows.length!==1||clean(rows[0]&&rows[0].endpoint)!==endpoint)throw new Error('PUSH_SINGLE_ACTIVE_LINK_NOT_CONFIRMED');
      return true;
    });
  }
  function saveSubscription(session,sub){
    var c=client();var s=subscriptionJson(sub);
    if(!c||!session||!session.user||!s.endpoint||!s.p256dh||!s.auth)return Promise.reject(new Error('SUBSCRIPTION_INCOMPLETE'));
    return c.rpc('happyad_push_register_subscription',{
      p_endpoint:s.endpoint,
      p_p256dh:s.p256dh,
      p_auth_key:s.auth,
      p_installation_id:installationId(),
      p_expiration_time:s.expirationTime,
      p_content_encoding:'aes128gcm',
      p_user_agent:navigator.userAgent||'',
      p_platform:(navigator.userAgentData&&navigator.userAgentData.platform)||navigator.platform||''
    }).then(function(r){
      if(r&&r.error)throw r.error;
      var data=r&&r.data;
      if(data&&data.ok===false)throw new Error(clean(data.error)||'PUSH_REGISTER_REJECTED');

      /* V780 : l’enregistrement atomique est la seule étape bloquante.
         Les contrôles secondaires ne doivent plus annuler une activation réussie. */
      Promise.resolve()
        .then(function(){return cleanupOwnSubscriptions(session,s);})
        .then(function(){return verifySingleActiveSubscription(session,s);})
        .catch(function(err){try{console.warn('Fyblic PUSH secondary verification',err);}catch(_e){}});

      safeSet(LAST_UID_KEY,session.user.id);
      safeSet(VAPID_BINDING_KEY,VAPID_PUBLIC_KEY);
      safeSet(LAST_ENSURE_KEY,now());
      lastSessionUid=session.user.id;
      clearError();
      notifyWorker('HAPPYAD_PUSH_SUBSCRIPTION_BOUND',{user_id:session.user.id,installation_id:installationId(),endpoint:s.endpoint});
      return sub;
    });
  }

  function ensureSubscription(showErrors,propagate){
    if(ensurePromise)return ensurePromise;
    if(!supports()||Notification.permission!=='granted')return Promise.resolve(null);
    busy=true;
    ensurePromise=Promise.all([workerReady(12000),currentSession()]).then(function(values){
      var reg=values[0],session=values[1];if(!reg||!session||!session.user)throw new Error('AUTH_OR_SW_NOT_READY');
      var previousUid=clean(safeGet(LAST_UID_KEY));
      return reg.pushManager.getSubscription().then(function(sub){
        if(sub&&previousUid&&previousUid!==session.user.id)return retireSubscription(session,sub);
        if(sub&&!subscriptionUsesCurrentVapid(sub))return retireSubscription(session,sub);
        return sub;
      }).then(function(sub){
        if(sub)return sub;
        return reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64UrlToUint8Array(VAPID_PUBLIC_KEY)});
      }).then(function(sub){return saveSubscription(session,sub);});
    }).catch(function(err){
      rememberError(err);
      var message=activationErrorMessage(err);
      if(showErrors)toast(message);
      try{console.warn('Fyblic PUSH activation',err);}catch(e){}
      if(propagate)throw new Error(message);
      return null;
    }).finally(function(){busy=false;ensurePromise=null;});
    return ensurePromise;
  }

  function ensureIfDue(force){
    if(!supports()||Notification.permission!=='granted')return Promise.resolve(null);
    var last=Number(safeGet(LAST_ENSURE_KEY)||0);
    if(!force&&last>0&&(now()-last)<ENSURE_INTERVAL_MS)return Promise.resolve(null);
    return ensureSubscription(false);
  }
  function invokeTest(delaySeconds){
    return currentSession().then(function(session){
      if(!session||!session.access_token)throw new Error('AUTH_REQUIRED');
      var base=clean(window.HAPPYAD_SUPABASE_URL).replace(/\/+$/,'');
      var key=clean(window.HAPPYAD_SUPABASE_KEY);
      return fetch(base+'/functions/v1/happyad-push-test',{
        method:'POST',keepalive:true,
        headers:{'Content-Type':'application/json','apikey':key,'Authorization':'Bearer '+session.access_token},
        body:JSON.stringify({delay_seconds:Number(delaySeconds||0)})
      }).then(function(r){return r.json().catch(function(){return {};}).then(function(j){if(!r.ok||!j.ok)throw new Error(j.error||('HTTP_'+r.status));return j;});});
    });
  }
  function activateFromGesture(){
    if(!supports()){toast('Notifications non prises en charge sur ce téléphone.');return Promise.resolve(null);}
    var uid=clean(lastSessionUid);
    if(Notification.permission==='denied'){
      if(uid){safeSet(promptKey(uid),now());schedulePromptReminder(uid);}
      hidePrompt();toast('Dans les paramètres du navigateur, autorisez les notifications pour Fyblic.');return Promise.resolve(null);
    }
    var p=Notification.permission==='granted'?Promise.resolve('granted'):Notification.requestPermission();
    return p.then(function(permission){
      if(permission!=='granted'){if(uid){safeSet(promptKey(uid),now());schedulePromptReminder(uid);}hidePrompt();toast('Autorisation de notification non accordée.');return null;}
      if(uid)safeRemove(promptKey(uid));clearPromptTimer();
      return ensureSubscription(true,true).then(function(sub){
        if(!sub)return null;
        hidePrompt();toast('Notifications Fyblic activées sur ce lien uniquement.');
        return sub;
      });
    }).catch(function(err){var msg=activationErrorMessage(err);rememberError(err);toast(msg);throw err;});
  }
  function testAfterClose(){
    return ensureSubscription(true).then(function(sub){
      if(!sub)throw new Error('SUBSCRIPTION_REQUIRED');
      return invokeTest(12).then(function(result){toast('Fermez Fyblic et Chrome : test dans 12 secondes.');return result;});
    });
  }
  function unsubscribeLocal(){
    if(!supports())return Promise.resolve(false);
    return navigator.serviceWorker.ready.then(function(reg){return reg.pushManager.getSubscription();}).then(function(sub){
      if(!sub)return false;
      return sub.unsubscribe().catch(function(){return false;});
    }).catch(function(){return false;});
  }
  function deactivateCurrent(){
    if(!supports())return Promise.resolve(false);
    return Promise.all([navigator.serviceWorker.ready,currentSession()]).then(function(values){
      var reg=values[0],session=values[1],c=client();
      return reg.pushManager.getSubscription().then(function(sub){
        var disableServer=Promise.resolve(false);
        if(c&&session&&session.user){
          disableServer=c.rpc('happyad_push_disable_all_own_subscriptions',{}).then(function(r){if(r&&r.error)throw r.error;return true;}).catch(function(){
            return sub?disableSavedSubscription(session,sub):false;
          });
        }
        return Promise.resolve(disableServer).then(function(){
          return sub?sub.unsubscribe().catch(function(){return false;}):false;
        }).then(function(result){
          safeRemove(LAST_ENSURE_KEY);safeRemove(VAPID_BINDING_KEY);safeRemove(TEST_DONE_KEY);
          return result;
        });
      });
    }).catch(function(){return unsubscribeLocal();});
  }
  function bindAuth(){
    if(authBound)return;var c=client();if(!c||!c.auth||!c.auth.onAuthStateChange)return;
    authBound=true;
    c.auth.onAuthStateChange(function(event,session){
      var uid=clean(session&&session.user&&session.user.id);
      if(event==='SIGNED_OUT'){
        lastSessionUid='';hidePrompt();clearPromptTimer();unsubscribeLocal();return;
      }
      if(uid){lastSessionUid=uid;if(Notification.permission==='granted')setTimeout(function(){ensureSubscription(false);},250);else schedulePromptReminder(uid,1500);}
    });
  }
  function boot(){
    if(!supports())return;
    bindAuth();
    currentSession().then(function(session){
      var uid=clean(session&&session.user&&session.user.id);if(!uid)return;
      lastSessionUid=uid;
      if(Notification.permission==='granted'){
        var forceRepair=safeGet(REPAIR_KEY)!=='1';
        ensureSubscription(forceRepair).then(function(sub){if(sub)safeSet(REPAIR_KEY,'1');});
      }else schedulePromptReminder(uid,1800);
    });
  }

  function isUuid(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value));}
  function safeAvatar(value){var url=clean(value);return (!url||url.length>2048||/^data:/i.test(url))?'':url;}
  function normalizePushOpen(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    var senderId=clean(raw.sender_id);
    if(!isUuid(senderId))return null;
    return {
      type:'happyad_message',
      conversation_id:clean(raw.conversation_id),
      message_id:clean(raw.message_id),
      sender_id:senderId,
      sender_name:clean(raw.sender_name)||'Utilisateur Fyblic',
      sender_avatar:safeAvatar(raw.sender_avatar),
      sender_badge:clean(raw.sender_badge),
      sender_handle:clean(raw.sender_handle),
      focus_composer:raw.focus_composer===true||clean(raw.focus_composer)==='1'||clean(raw.happyad_reply)==='1'
    };
  }
  function pushFromLocation(){
    try{
      var q=new URLSearchParams(location.search||'');
      if(clean(q.get('happyad_push'))!=='message')return null;
      return normalizePushOpen({
        conversation_id:q.get('conversation_id'),message_id:q.get('message_id'),sender_id:q.get('sender_id'),sender_name:q.get('sender_name'),
        sender_avatar:q.get('sender_avatar'),sender_badge:q.get('sender_badge'),sender_handle:q.get('sender_handle'),
        happyad_reply:q.get('happyad_reply')
      });
    }catch(_e){return null;}
  }
  function clearPushLocation(){
    try{
      var u=new URL(location.href);
      ['happyad_push','conversation_id','message_id','sender_id','sender_name','sender_avatar','sender_badge','sender_handle','happyad_reply'].forEach(function(k){u.searchParams.delete(k);});
      history.replaceState(history.state||{},'',u.pathname+(u.search||'')+(u.hash||''));
    }catch(_e){}
  }
  function focusMessageComposerFromPush(){
    var attempts=0;
    function tryFocus(){
      attempts++;
      try{
        var frame=document.getElementById('happyadAppFrame_message')||document.getElementById('happyadMessageCenterFrame')||document.querySelector('iframe[data-happyad-page="message"]');
        var doc=frame&&frame.contentDocument;
        var input=doc&&doc.getElementById('messageInput');
        var chat=doc&&doc.getElementById('chatView');
        var ready=!!(input&&!input.disabled&&(!chat||!chat.classList.contains('hidden')));
        if(ready){
          try{input.focus({preventScroll:false});}catch(_e){try{input.focus();}catch(_e2){}}
          try{var end=String(input.value||'').length;input.setSelectionRange(end,end);}catch(_caret){}
          try{input.click();}catch(_click){}
          return;
        }
      }catch(_e){}
      if(attempts<36)setTimeout(tryFocus,100);
    }
    setTimeout(tryFocus,60);
  }

  function openPushMessage(raw){
    var data=normalizePushOpen(raw);if(!data)return Promise.resolve(false);
    var target={
      id:data.sender_id,user_id:data.sender_id,
      name:clean(data.sender_name)||'Utilisateur Fyblic',
      avatar:safeAvatar(data.sender_avatar),
      badge:clean(data.sender_badge),
      status:(function(){var h=clean(data.sender_handle);return h?'@'+h.replace(/^@+/,''):'Conversation Fyblic';})()
    };
    var attempts=0;
    return new Promise(function(resolve){
      function tryOpen(){
        attempts++;
        try{
          if(window.HappyMessageReturnCenter&&typeof window.HappyMessageReturnCenter.open==='function'){
            window.HappyMessageReturnCenter.open({
              source:'push-message',mode:'direct',target:target,
              conversation_id:data.conversation_id,message_id:data.message_id
            });
            try{if(typeof window.happyadRefreshMessageUnreadTotal==='function')window.happyadRefreshMessageUnreadTotal();}catch(_e){}
            if(data.focus_composer)focusMessageComposerFromPush();
            resolve(true);return;
          }
        }catch(_e){}
        if(attempts<20){setTimeout(tryOpen,50);return;}
        try{document.documentElement.classList.remove('happyadPushDirectBootV38E4');}catch(_mask){}
        resolve(false);
      }
      tryOpen();
    });
  }
  function maybeNoticeDelayedPush(data){
    var delay=Number(data&&data.delivery_delay_ms||0);
    if(!(delay>15000))return;
    var last=Number(safeGet(LAST_DELAY_NOTICE_KEY)||0);
    if(last>0&&(now()-last)<86400000)return;
    safeSet(LAST_DELAY_NOTICE_KEY,now());
    toast('Le téléphone a retardé une notification. Fyblic a renforcé le réveil en arrière-plan.');
  }
  function handleServiceWorkerPush(event){
    var payload=event&&event.data||{};
    if(payload.type==='HAPPYAD_PUSH_OPEN')openPushMessage(payload.data||{});
    else if(payload.type==='HAPPYAD_PUSH_FOREGROUND'){
      maybeNoticeDelayedPush(payload.data||{});
      try{if(typeof window.happyadRefreshMessageUnreadTotal==='function')window.happyadRefreshMessageUnreadTotal();}catch(_e){}
    }else if(payload.type==='HAPPYAD_PUSH_SHOWN'){
      maybeNoticeDelayedPush(payload.data||{});
    }else if(payload.type==='HAPPYAD_PUSH_SUBSCRIPTION_REFRESHED'){
      setTimeout(function(){ensureSubscription(false);},80);
    }
  }
  try{navigator.serviceWorker.addEventListener('message',handleServiceWorkerPush);}catch(_e){}
  var initialPushData=pushFromLocation();
  if(initialPushData){clearPushLocation();openPushMessage(initialPushData);}

  window.HappyPushMaster={
    version:VERSION,
    supported:supports,
    activate:activateFromGesture,
    ensure:ensureSubscription,
    test:testAfterClose,
    unsubscribeLocal:unsubscribeLocal,
    deactivateCurrent:deactivateCurrent,
    showActivationPrompt:function(){maybeShowPromptDue(lastSessionUid);},
    openMessage:openPushMessage,
    status:function(){
      if(!supports())return Promise.resolve({supported:false,permission:'unsupported',subscribed:false});
      return navigator.serviceWorker.ready.then(function(reg){return reg.pushManager.getSubscription();}).then(function(sub){
        var uid=clean(lastSessionUid);var dismissed=uid?promptDismissedAt(uid):0;
        return {supported:supports(),permission:Notification.permission,subscribed:!!sub,installation_id:installationId(),last_ensure_at:Number(safeGet(LAST_ENSURE_KEY)||0),prompt_due_at:dismissed?dismissed+PROMPT_INTERVAL_MS:0,last_error:clean(safeGet(LAST_ERROR_KEY))};
      }).catch(function(){return {supported:supports(),permission:Notification.permission,subscribed:false};});
    }
  };
  function refreshPushState(force){
    if(Notification.permission==='granted'){clearPromptTimer();hidePrompt();return ensureIfDue(!!force);}
    maybeShowPromptDue(lastSessionUid);return Promise.resolve(null);
  }
  window.addEventListener('online',function(){refreshPushState(true);});
  window.addEventListener('pageshow',function(){refreshPushState(false);});
  window.addEventListener('focus',function(){refreshPushState(false);});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')refreshPushState(false);});
  try{navigator.serviceWorker.addEventListener('controllerchange',function(){setTimeout(function(){refreshPushState(true);},250);});}catch(_controller){}
  setInterval(function(){if(document.visibilityState==='visible')refreshPushState(false);},15*60*1000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
