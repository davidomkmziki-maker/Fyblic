/* HOME FEED ATOMIC V9R1 + REPOSITORY V2 + BOOT V2 + VIEW V2 + MEDIA LOADER V1 + ACTIONS MASTER V1 build */
// Regression lineage: happyad-pwa-v855r65-post-options-reactivation-fluid | happyad-pwa-v855r66-post-options-optimistic-bg | happyad-pwa-v855r67-popup-persistant-confirmation-haut
/* Fyblic V855R66 - Options instantanées, Supabase vérifié en arrière-plan */
'use strict';

var HAPPYAD_SW_VERSION = 'fyblic-pwa-v1091-chat-clean-radar-air-20260923';
var HAPPYAD_STATIC_CACHE = HAPPYAD_SW_VERSION + '-static';
var HAPPYAD_RUNTIME_CACHE = HAPPYAD_SW_VERSION + '-runtime';
var HAPPYAD_MEDIA_CACHE = 'happyad-message-media-v1';
var HAPPYAD_PUSH_STATE_CACHE = 'happyad-push-state-v1';
var HAPPYAD_PUSH_AVATAR_CACHE = 'happyad-push-avatar-v2';
var HAPPYAD_VAPID_PUBLIC_KEY = 'BA3UgDp8-6VYN6nZgSNX14LeZVLK6FesJgLXVytEKkKgplK_3KVssohN_SAKPDdkhoAmpQzIo3Ev9VGIXNZP-bE';
var HAPPYAD_APP_SHELL = [
  './',
  './index.html',
  './index.html?v=v1046-logo-compresseur',
  './manifest.webmanifest?v=1045-brand-unified',
  './core/fyblic-system-theme-v1022.css?v=1022-world-theme',
  './icons/fyblic-app-icon-v1046-96.png',
  './icons/fyblic-app-icon-v1046-192.png',
  './icons/fyblic-app-icon-v1046-512.png',
  './core/share-master.js?v=1041-first-open-ready',
  './modules/share-center.html?v=1041-first-open-ready',
  './icons/share-apps/whatsapp.png?v=555',
  './icons/share-apps/facebook.png',
  './icons/share-apps/x.png',
  './icons/share-apps/telegram.png',
  './icons/share-apps/messages.png',
  './icons/share-apps/gmail.png',
  './icons/share-apps/copy.png',
  './icons/share-apps/more.png',
  './core/chat-integration-master-v795.css?v=851r2-keyboard-rows',
  './core/keyboard-surface-master-v851r7.css?v=851r7-chat-refinement-seam',
  './core/keyboard-surface-master-v851r7.js?v=855r93-home-silent',
  './core/language-preference-master-v855r59.js?v=855r59-language-storage-real',
  './core/system-notification-master-v807.js?v=855r56-notification-preferences',
  './core/seller-verification-supabase-master-v801.js?v=807-team-wording-system-notifications',
  './core/listing-publication-supabase-master-v821.js?v=1087-auto-1080',
  './core/chat-integration-master-v795.js?v=1085-boutique-validation-visible',
  './core/home-chat-header-v1089.js?v=1089-source-svg',
  './core/marketplace-home-master-v828.js?v=991-market-three-line-description',
  './core/home-feed-repository-v1.js?v=2-batch-complete',
  './core/home-feed-master-v1.js?v=1088-adaptive-1080-priority',
  './core/home-media-loader-v1.js?v=982-grouped-photo-badge',
  './core/like-direct-master-v876.js?v=995-like-network-stable',
  './core/home-actions-master-v1.js?v=1002-view-play-professional',
  './core/actions-layout-master-v982.css?v=1006-action-count-15',
  './core/home-card-layout-master-v982.css?v=986-professional-icons-love',
  './core/home-visual-maturity-master-v988.css?v=1006-action-count-15',
  './core/action-counters-global-v1006.css?v=1006-counts-15-video-home-size',
  './core/happyad-global-coherence-v997.css?v=1025-search-suggestion-story',
  './core/happyad-global-coherence-v997.js?v=1025-search-suggestion-story',
  './core/happyad-search-nav-v998.css?v=1005r4-search-primary-name-white-locked',
  './core/story-name-presence-master-v999.css?v=999-story-name-presence-off',
  './core/story-name-presence-master-v999.js?v=999-story-name-presence-off',
  './core/mention-render-master-v943.js?v=944-photo-profile-handoff',
  './core/profile-link-master-v992.js?v=996-primary-name-badge',
  './core/comment-mention-master-v994.js?v=996-primary-name-visible',
  './core/home-card-renderer-v1.js?v=1002-view-play-professional',
  './core/home-card-story-ring-master-v992.js?v=992-home-story-ring-exact',
  './core/home-feed-view-v1.js?v=929-prepaint-anchor',
  './core/home-feed-boot-v1.js?v=1088-adaptive-1080-priority',
  './core/master-registry.js?v=974-p1-module-lifecycle-registry',
  './core/module-lifecycle-master-v614.js?v=974-p1-module-lifecycle-registry',
  './modules/happyad-chat.html?v=1085-boutique-validation-visible',
  './modules/message-center.html?mode=inbox&source=p1-module-lifecycle&v=1031-storage-security',
  './modules/notification-center.html?v=974-p1-module-lifecycle-registry',
  './core/notification-infinite-scroll-master-v700.js?v=869-connection-phase2',
  './modules/assistance.html?v=974-p1-module-lifecycle-registry',
  './modules/video.html?v=1088-adaptive-1080-priority',
  './modules/photo.html?v=983-seven-media-actions',
  './modules/map.html?v=974-p1-module-lifecycle-registry',
  './modules/publish.html?v=1072-finalisation-reseau',
  './core/media-compression-client-v1.js?v=1067-compression-lock',
  './core/publication-engine-v1082.js?v=1083-story-tus-anchor',
  './core/publication-background-ui-v2.js?v=1081-fast-primary',
  './core/profile-publication-notice-v1066.js?v=1066-silent-finish',
  './modules/live.html?v=974-p1-module-lifecycle-registry',
  './modules/user.html?v=974-p1-module-lifecycle-registry',
  './core/startup-master-v727.js?v=727-startup-unique',
  './core/analytics-master-v731.js?v=972-p1-single-client',
  './core/global-scroll-coordinator-v868.js?v=869-connection-phase2',
  './core/connection-work-coordinator-v869.js?v=869-connection-phase2',
  './core/return-reset-master-v633-story-safe.js?v=929-return-reset-canonical',
  './core/navigation-master-v668.js?v=1001-publication-profile-routes',
  './core/home-scroll-priority-master-v863.js?v=869-connection-phase2',
  './core/profile-avatar-master-v855r32.js?v=1031-storage-security',
  './core/follow-master-v855r34.js?v=986-professional-icons-love',
  './core/auth-storage-quota-master-v752.js?v=937-idb-auth-purge',
  './core/supabase-config-master-v973.js?v=973-p1-central-config',
  './core/supabase-client-master-v972.js?v=973-p1-central-config',
  './core/account-isolation-master-v937.js?v=966-view-once-tombstone-isolation',
  './core/message-privacy-master-v855r51.js?v=972-p1-single-client',
  './core/account-discovery-privacy-v855r53.js?v=855r53-account-discovery',
  './core/location-privacy-master-v855r54.js?v=855r54-location-privacy',
  './core/filtering-privacy-master-v855r55.js?v=855r55-filtering',
  './core/message-presence-app-master-v855r51.js?v=869-connection-phase2',
  './core/interaction-privacy-master-v855r52.js?v=972-p1-single-client',
  './core/post-options-master-v693.js?v=1031-storage-security',
  './core/share-button-bridge.js?v=938-guest-share-gate',
  './core/story-master-v699.js?v=1031-storage-security',
  './core/notification-master-v700.js?v=1031-storage-security',
  './core/auth-session-master-v598.js?v=1031-storage-security',
  './core/profile-identity-stable-master-v741.js?v=1031-storage-security',
  './core/profile-avatar-recovery-master-v743.js?v=855r32-no-resurrection',
  './core/card-author-avatar-master-v742.js?v=1031-storage-security',
  './core/home-scroll-prepaint-master-v696.js?v=855r100-home-scroll-physical-stable',
  './core/profile-edit-clear-master-v742.css?v=742-profile-edit-clear',
  './core/profile-edit-clear-master-v742.js?v=855r93-home-silent',
  './core/main-tabs-master-v615.js?v=1001-publication-profile-routes',
  './core/guest-radar-auth-v599.js?v=940-guest-auth-rainbow',
  './core/auth-frame-gate-v596.js?v=938-guest-passive',
  './core/publish-master-v589.js?v=927-publish-canonical-return',
  './core/push-master.js?v=push-v45-message-frame-route-v930',
  './core/internal-return-master-v694.js?v=930-photo-profile-exact-return',
  './core/home-photo-fullscreen-master-v591.js?v=932-profile-handoff-pointer-release',
  './core/notification-home-comment-center.js?v=929-notification-post-passive-route',
  './core/overlay-scroll-master-v662.js?v=905-p1-single-overlay-master',
  './core/assistance-integration-master-v738.css?v=855r34-squelette-chaque-ouverture',
  './core/assistance-integration-master-v738.js?v=937-account-isolation',
  './core/message-assistance-shortcut-v738.css?v=738-visible',
  './core/message-assistance-shortcut-v738.js?v=757-audit-stable',
  './core/button-state-master-v604.css?v=604',
  './core/button-state-master-v604.js?v=604',
  './core/frame-first-render-v622.js?v=622',
  './core/internal-return-fast-v611.js?v=611',
  './core/assistance-supabase-realtime-v750.js?v=851r12-ecriture-stable',
  './modules/my-profile.html?v=1066-silent-finish',
  './modules/profile-edit.html?v=974-p1-module-lifecycle-registry',
  './core/vendor/heic2any-v0.0.4.min.js?v=855r32-local-heif-decoder',
  './modules/settings.html?v=974-p1-module-lifecycle-registry',
  './core/profile/settings-account-auth-v855r48.js?v=972-p1-single-client',
  './core/profile/settings-data-v855r36.js?v=972-p1-single-client',
  './modules/visitor-profile.html?v=1001-profile-identity-scale',
  './modules/profile-stats.html?v=974-p1-module-lifecycle-registry',
  './core/profile/profile-design-v854r5.css?v=1001-profile-identity-scale',
  './core/profile/profile-stats-host-v855r4.css?v=855r28-skeleton',
  './core/profile/profile-settings-host-v855r26.css?v=855r28-skeleton',
  './core/profile/profile-edit-host-v855r31.css?v=855r31-securite-complete',
  './core/profile/profile-core-v855r6.js?v=1031-storage-security',
  './core/profile/profile-scroll-priority-v866.js?v=869-connection-phase2',
  './core/profile/profile-stats-host-v855r4.js?v=855r62-click-prefetch',
  './core/profile/profile-settings-host-v855r26.js?v=855r58-language-global',
  './core/profile/profile-edit-host-v855r31.js?v=855r32-transfert-binaire',
  './core/profile/owner-profile-v855r31.js?v=1031-storage-security',
  './core/profile/profile-privacy-master-v855r50.js?v=972-p1-single-client',
  './core/profile/visitor-profile-v855r7.js?v=992-story-or-profile-photo',
  './core/profile/profile-story-parent-v854r5.js?v=854r5',
  './core/profile/profile-photo-parent-v854r8.js?v=932-profile-handoff-pointer-release'
];

function isHappyCache(name){
  var n=String(name||'').toLowerCase();return n.indexOf('happyad') > -1 || n.indexOf('fyblic') > -1;
}
function isCurrentCache(name){
  return name === HAPPYAD_STATIC_CACHE || name === HAPPYAD_RUNTIME_CACHE || name === HAPPYAD_MEDIA_CACHE || name === HAPPYAD_PUSH_STATE_CACHE || name === HAPPYAD_PUSH_AVATAR_CACHE;
}
function sameOrigin(url){
  try{return new URL(url).origin === self.location.origin;}catch(e){return false;}
}
function isSupabaseOrExternal(url){
  try{var u=new URL(url);return u.origin !== self.location.origin || /supabase\.co|storage\.googleapis\.com|cloudinary|res\.cloudinary/i.test(u.hostname);}catch(e){return true;}
}
function isHeavyMedia(request){
  try{
    var u=new URL(request.url);
    var dest=request.destination||'';
    return dest==='video' || dest==='audio' || /\.(mp4|mov|webm|m4v|mp3|wav|ogg)(\?|$)/i.test(u.pathname);
  }catch(e){return false;}
}
function happyadFreshRequest(request){
  try{return new Request(request,{cache:'no-store'});}catch(_e){return request;}
}
function networkFirst(request){
  return caches.open(HAPPYAD_RUNTIME_CACHE).then(function(cache){
    return fetch(happyadFreshRequest(request)).then(function(response){
      try{if(response && response.ok)cache.put(request,response.clone());}catch(e){}
      return response;
    }).catch(function(){
      return caches.match(request).then(function(cached){return cached || caches.match('./index.html');});
    });
  });
}
function cacheFirst(request){
  return caches.match(request).then(function(cached){
    if(cached)return cached;
    return fetch(request).then(function(response){
      try{if(response && response.ok)caches.open(HAPPYAD_RUNTIME_CACHE).then(function(cache){cache.put(request,response.clone());});}catch(e){}
      return response;
    });
  });
}

function networkFirstFast(request){
  return caches.open(HAPPYAD_RUNTIME_CACHE).then(function(cache){
    return new Promise(function(resolve,reject){
      var settled=false;
      var network=fetch(happyadFreshRequest(request)).then(function(response){
        try{if(response&&response.ok)cache.put(request,response.clone());}catch(_e){}
        if(!settled){settled=true;resolve(response);}
        return response;
      }).catch(function(error){
        return cache.match(request).then(function(cached){
          if(!settled){settled=true;if(cached)resolve(cached);else reject(error);}
        });
      });
      setTimeout(function(){
        if(settled)return;
        cache.match(request).then(function(cached){if(cached&&!settled){settled=true;resolve(cached);}}).catch(function(){});
      },900);
      return network;
    });
  }).catch(function(){return fetch(request);});
}
function staleWhileRevalidate(request){
  return caches.open(HAPPYAD_RUNTIME_CACHE).then(function(cache){
    return cache.match(request).then(function(cached){
      var update=fetch(request).then(function(response){
        try{if(response&&response.ok)cache.put(request,response.clone());}catch(_e){}
        return response;
      }).catch(function(){return cached;});
      return cached||update;
    });
  });
}

self.addEventListener('install', function(event){
  event.waitUntil(caches.open(HAPPYAD_STATIC_CACHE).then(function(cache){
    /* Réutiliser les réponses exactes de la version précédente. Une mise à jour
       n'effectue ainsi que les quelques lectures réellement versionnées, sans
       rafale réseau susceptible de perturber le scroll de l'Accueil. */
    return Promise.all(HAPPYAD_APP_SHELL.map(function(url){
      return caches.match(url).then(function(existing){
        return existing ? cache.put(url,existing.clone()) : cache.add(url);
      }).catch(function(){return false;});
    }));
  }).then(function(){return self.skipWaiting();}));
});

self.addEventListener('activate', function(event){
  event.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(key){
      if(isHappyCache(key) && !isCurrentCache(key))return caches.delete(key);
      return Promise.resolve(false);
    }));
  }).then(function(){return caches.delete(HAPPYAD_PUSH_AVATAR_CACHE);})
    .then(function(){return caches.open(HAPPYAD_PUSH_AVATAR_CACHE);})
    .then(function(){return self.clients.claim();}));
});

self.addEventListener('message', function(event){
  try{
    var type=event && event.data && event.data.type;
    if(type==='HAPPYAD_SKIP_WAITING')self.skipWaiting();
    if(type==='HAPPYAD_CLEAR_OLD_CACHES'){
      event.waitUntil(caches.keys().then(function(keys){
        return Promise.all(keys.map(function(key){
          if(isHappyCache(key) && !isCurrentCache(key))return caches.delete(key);
          return Promise.resolve(false);
        }));
      }));
    }
    if(type==='HAPPYAD_CLEAR_USER_CACHES_V855R59'){
      event.waitUntil(caches.keys().then(function(keys){
        return Promise.all(keys.map(function(key){
          if(key===HAPPYAD_RUNTIME_CACHE || key===HAPPYAD_MEDIA_CACHE || key===HAPPYAD_PUSH_AVATAR_CACHE || key===HAPPYAD_PUSH_STATE_CACHE)return caches.delete(key);
          if(isHappyCache(key) && !isCurrentCache(key))return caches.delete(key);
          return Promise.resolve(false);
        }));
      }).then(function(){return Promise.all([caches.open(HAPPYAD_PUSH_AVATAR_CACHE),caches.open(HAPPYAD_PUSH_STATE_CACHE)]);}));
    }
    if(type==='HAPPYAD_PROFILE_AVATAR_INVALIDATE_V855R32'){
      event.waitUntil(caches.delete(HAPPYAD_PUSH_AVATAR_CACHE).then(function(){
        return caches.open(HAPPYAD_PUSH_AVATAR_CACHE);
      }));
    }
    if(type==='HAPPYAD_NOTIFICATION_QUIET_PREFERENCES_V855R57'){
      event.waitUntil(happyadStoreState('notification-preferences-v855r57',event.data&&event.data.preferences||{}));
    }
  }catch(e){}
});


/* Fyblic V39A — Push réel Messages : réveil robuste, affichage de secours et renouvellement. */
function happyadPushPayload(event){
  var fallback={
    type:'happyad_generic',
    title:'Fyblic',
    body:'Vous avez une nouvelle notification.',
    icon:'./icons/fyblic-app-icon-v1046-192.png',
    badge:'./icons/fyblic-app-icon-v1046-96.png',
    tag:'happyad-notification',
    url:'./index.html?source=push',
    sent_at:'',
    push_id:''
  };
  try{
    if(!event || !event.data)return fallback;
    var parsed=event.data.json();
    if(parsed && typeof parsed==='object'){
      Object.keys(parsed).forEach(function(k){if(parsed[k]!=null)fallback[k]=parsed[k];});
      return fallback;
    }
  }catch(_json){
    try{var txt=String(event.data.text()||'').trim();if(txt)fallback.body=txt;}catch(_text){}
  }
  return fallback;
}

function happyadPushData(data){
  return {
    type:String(data.type||'happyad_generic'),
    url:String(data.url||'./index.html?source=push'),
    conversation_id:String(data.conversation_id||''),
    message_id:String(data.message_id||''),
    sender_id:String(data.sender_id||''),
    sender_name:String(data.sender_name||''),
    sender_avatar:String(data.sender_avatar||''),
    sender_avatar_source:String(data.sender_avatar_source||''),
    sender_avatar_field:String(data.sender_avatar_field||''),
    sender_avatar_status:String(data.sender_avatar_status||''),
    sender_avatar_fallback_reason:String(data.sender_avatar_fallback_reason||''),
    sender_profile_table:String(data.sender_profile_table||''),
    sender_profile_match:String(data.sender_profile_match||''),
    sender_avatar_runtime_status:'',
    sender_avatar_runtime_reason:'',
    sender_badge:String(data.sender_badge||''),
    sender_handle:String(data.sender_handle||''),
    message_kind:String(data.message_kind||''),
    view_once:!!data.view_once,
    unread_count:Number(data.unread_count||1),
    push_id:String(data.push_id||''),
    sent_at:String(data.sent_at||''),
    received_at:Date.now(),
    delivery_delay_ms:0,
    notification_type:String(data.notification_type||data.type||''),
    notification_preference_key:String(data.notification_preference_key||''),
    priority:String(data.priority||data.notification_priority||''),
    important:data.important===true||data.important_message===true||data.urgent===true||data.critical===true,
    security_alert:data.security_alert===true||data.security===true||data.critical_security===true
  };
}

function happyadParseTime(value){
  if(value==null||value==='')return 0;
  var numeric=Number(value);
  if(Number.isFinite(numeric)&&numeric>0)return numeric;
  var parsed=Date.parse(String(value));
  return Number.isFinite(parsed)?parsed:0;
}

function happyadVisibleClients(){
  return self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    return (list||[]).filter(function(client){
      try{
        /* V780 : une page simplement conservée par Chrome ou dans les récents
           ne doit pas supprimer le popup système. Seule une fenêtre Fyblic
           réellement visible ET focalisée est considérée au premier plan. */
        return new URL(client.url).origin===self.location.origin &&
          client.visibilityState==='visible' && client.focused===true;
      }catch(_e){return false;}
    });
  }).catch(function(){return [];});
}

function happyadVisibleClientsFast(){
  return Promise.race([
    happyadVisibleClients(),
    new Promise(function(resolve){setTimeout(function(){resolve([]);},450);})
  ]);
}

function happyadPostToClients(type,data){
  return self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    (list||[]).forEach(function(client){
      try{client.postMessage({type:type,data:data||{}});}catch(_e){}
    });
  }).catch(function(){return undefined;});
}

function happyadStateRequest(name){
  return new Request(new URL('./__happyad_push_state__/'+encodeURIComponent(String(name||'state')),self.location.href).href,{method:'GET'});
}

function happyadStoreState(name,data){
  try{
    return caches.open(HAPPYAD_PUSH_STATE_CACHE).then(function(cache){
      return cache.put(happyadStateRequest(name),new Response(JSON.stringify(data||{}),{
        headers:{'Content-Type':'application/json','Cache-Control':'no-store'}
      }));
    }).catch(function(){return undefined;});
  }catch(_e){return Promise.resolve();}
}

function happyadReadState(name){
  try{
    return caches.open(HAPPYAD_PUSH_STATE_CACHE).then(function(cache){
      return cache.match(happyadStateRequest(name)).then(function(response){
        if(!response)return {};
        return response.json().catch(function(){return {};});
      });
    }).catch(function(){return {};});
  }catch(_e){return Promise.resolve({});}
}

function happyadQuietTimeMinutes(value){
  var match=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value||'').trim());
  return match?(Number(match[1])*60+Number(match[2])):-1;
}
function happyadValidTimeZone(zone){
  zone=String(zone||'').trim();if(!zone)return false;
  try{Intl.DateTimeFormat('en-US',{timeZone:zone}).format(new Date());return true;}catch(_e){return false;}
}
function happyadZonedMinutes(at,zone){
  var date=at instanceof Date?at:new Date(at||Date.now());
  if(!Number.isFinite(date.getTime()))date=new Date();
  try{
    var options={hour:'2-digit',minute:'2-digit',hourCycle:'h23'};
    if(happyadValidTimeZone(zone))options.timeZone=String(zone).trim();
    var parts=Intl.DateTimeFormat('en-GB',options).formatToParts(date),hour=0,minute=0;
    parts.forEach(function(part){if(part.type==='hour')hour=Number(part.value)||0;if(part.type==='minute')minute=Number(part.value)||0;});
    return hour*60+minute;
  }catch(_e){return date.getHours()*60+date.getMinutes();}
}
function happyadQuietActive(preferences,at){
  preferences=preferences&&typeof preferences==='object'?preferences:{};
  if(preferences.quietMode!==true)return false;
  var start=happyadQuietTimeMinutes(preferences.quietStart||'22:00');
  var end=happyadQuietTimeMinutes(preferences.quietEnd||'07:00');
  if(start<0||end<0)return false;
  var current=happyadZonedMinutes(at,preferences.quietTimeZone||'');
  if(start===end)return true;
  if(start<end)return current>=start&&current<end;
  return current>=start||current<end;
}
function happyadPushSecurity(data,detail){
  data=data||{};detail=detail||{};
  var type=String(data.type||detail.type||'').toLowerCase();
  return data.security_alert===true||data.security===true||data.critical_security===true||detail.security_alert===true||/^security(?:_|$)/.test(type);
}
function happyadPushImportant(data,detail){
  data=data||{};detail=detail||{};
  var priority=String(data.priority||data.notification_priority||detail.priority||'').toLowerCase();
  var type=String(data.type||detail.type||'').toLowerCase();
  return data.important===true||data.important_message===true||data.urgent===true||data.critical===true||detail.important===true||
    priority==='high'||priority==='urgent'||priority==='critical'||type==='important_message'||type==='urgent_message';
}
function happyadPushPreferenceKey(data,detail){
  data=data||{};detail=detail||{};
  var explicit=String(data.notification_preference_key||detail.notification_preference_key||'').trim();
  if(explicit)return explicit;
  var type=String(data.notification_type||data.type||detail.notification_type||detail.type||'').toLowerCase();
  if(type==='like'||type==='story_like'||type==='like_story')return 'likes';
  if(type==='comment')return 'comments';
  if(type==='reply'||type==='comment_reply')return 'commentReplies';
  if(type==='share'||type==='repost')return 'shares';
  if(type==='mention')return 'mentions';
  if(type==='tag'||type==='tagged'||type==='identification')return 'tags';
  if(type==='follow'||type==='follower'||type==='new_follower')return 'newFollowers';
  if(type==='message'||type==='private_message'||type==='dm'||type==='direct_message'||type==='chat_message'||type==='happyad_message')return 'privateMessages';
  if(type==='message_request'||type==='chat_request')return 'messageRequests';
  if(type==='audio_call'||type==='call_audio')return 'audioCalls';
  if(type==='video_call'||type==='call_video')return 'videoCalls';
  if(type==='conversation_reply'||type==='message_reply')return 'conversationReplies';
  if(type==='followed_post'||type==='new_followed_post')return 'followedPosts';
  if(type==='followed_story'||type==='new_followed_story')return 'followedStories';
  if(type==='post_activity'||type==='own_post_activity')return 'ownPostActivity';
  if(type==='profile_visit'||type==='important_profile_visit')return 'profileVisits';
  if(type==='recommended_post'||type==='post_recommendation')return 'recommendedPosts';
  if(type==='marketplace_message'||type==='listing_message')return 'marketplaceMessages';
  if(type==='order'||type==='order_update'||type==='order_status')return 'orders';
  if(type==='listing_status'||type==='marketplace_status'||type==='listing_published')return 'listingStatus';
  if(type==='listing_expired'||type==='expired_listing')return 'expiredListing';
  if(type==='saved_search_result'||type==='saved_search_results')return 'savedSearchResults';
  if(type==='price_change'||type==='availability_change'||type==='price_availability')return 'priceAvailability';
  if(type==='verification'||type==='verification_decision'||type==='seller_verification')return 'verificationDecisions';
  if(type==='system'||type==='announcement'||type==='important'||type==='happyad_info')return 'importantHappyad';
  return '';
}
function happyadPushDeliveryDecision(preferences,data,detail){
  preferences=preferences&&typeof preferences==='object'?preferences:{};
  if(preferences.push===false)return {show:false,reason:'push-disabled'};
  if(!happyadPushSecurity(data,detail)){
    var key=happyadPushPreferenceKey(data,detail);
    if(key&&preferences[key]===false)return {show:false,reason:'category-disabled',preference_key:key};
  }
  if(!happyadQuietActive(preferences,new Date()))return {show:true,reason:'allowed'};
  if(happyadPushSecurity(data,detail))return {show:true,reason:'security-during-quiet'};
  if(preferences.importantDuringQuiet===true&&happyadPushImportant(data,detail))return {show:true,reason:'important-during-quiet'};
  return {show:false,reason:'quiet-mode'};
}

function happyadNotificationAsset(value,fallback){
  var raw=String(value||'').trim();
  if(!raw)return String(fallback||'');
  try{
    var url=new URL(raw,self.location.href);
    if(url.protocol!=='https:' && url.origin!==self.location.origin)return String(fallback||'');
    return url.href;
  }catch(_e){return String(fallback||'');}
}


function happyadTinyHash(value){
  var text=String(value||''),hash=2166136261;
  for(var i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return (hash>>>0).toString(36);
}

function happyadAvatarCacheRequest(detail,url){
  var sender=String(detail&&detail.sender_id||'anonymous').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,64)||'anonymous';
  var key=happyadTinyHash(String(url||''));
  return new Request(new URL('./__happyad_push_avatar__/'+sender+'/'+key+'.img',self.location.href).href,{method:'GET'});
}

function happyadPrepareMessageAvatar(data,detail){
  var logo=happyadNotificationAsset('./icons/fyblic-app-icon-v1046-192.png','./icons/fyblic-app-icon-v1046-192.png');
  if(!detail || detail.type!=='happyad_message')return Promise.resolve({icon:happyadNotificationAsset(data.icon,logo)||logo,status:'not-message',reason:''});
  var exact=happyadNotificationAsset(detail.sender_avatar||data.sender_avatar,'');
  if(!exact){
    return Promise.resolve({icon:logo,status:'fallback-logo',reason:String(detail.sender_avatar_fallback_reason||'MISSING_SENDER_AVATAR')});
  }
  var request=happyadAvatarCacheRequest(detail,exact);
  return caches.open(HAPPYAD_PUSH_AVATAR_CACHE).then(function(cache){
    return cache.match(request).then(function(cached){
      if(cached)return {icon:request.url,status:'cache-hit',reason:''};
      var controller=typeof AbortController!=='undefined'?new AbortController():null;
      var timer=setTimeout(function(){try{if(controller)controller.abort();}catch(_e){}},6500);
      return fetch(exact,{cache:'no-store',credentials:'omit',redirect:'follow',signal:controller&&controller.signal}).then(function(response){
        clearTimeout(timer);
        if(!response || (!response.ok && response.type!=='opaque'))throw new Error('HTTP_'+String(response&&response.status||0));
        var type='';try{type=String(response.headers.get('content-type')||'').toLowerCase();}catch(_e){}
        if(response.type!=='opaque' && type && type.indexOf('image/')!==0)throw new Error('NOT_IMAGE');
        return cache.put(request,response.clone()).then(function(){
          return {icon:request.url,status:'prefetched-cache',reason:''};
        });
      }).catch(function(error){
        clearTimeout(timer);
        /* Le lien réel reste essayé directement. On ne remplace pas l'avatar
           simplement parce que le préchargement a été lent. */
        return {icon:exact,status:'remote-direct',reason:'PREFETCH_'+String(error&&error.message||error||'FAILED').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,80)};
      });
    });
  }).catch(function(error){
    return {icon:exact,status:'remote-direct',reason:'CACHE_'+String(error&&error.message||error||'FAILED').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,80)};
  });
}

function happyadNotificationOptions(data,detail,preparedIcon,withActions){
  var logo=happyadNotificationAsset('./icons/fyblic-app-icon-v1046-192.png','./icons/fyblic-app-icon-v1046-192.png');
  var badge=happyadNotificationAsset(data.badge||'./icons/fyblic-app-icon-v1046-96.png','./icons/fyblic-app-icon-v1046-96.png');
  var icon=happyadNotificationAsset(preparedIcon,'')||happyadNotificationAsset(data.icon,logo)||logo;
  var options={
    body:String(data.body||'Vous avez une nouvelle notification.'),
    icon:icon,
    badge:badge,
    tag:String(data.tag||('happyad-'+String(data.type||'notification'))),
    renotify:data.renotify!==false,
    requireInteraction:!!data.requireInteraction,
    silent:false,
    vibrate:Array.isArray(data.vibrate)?data.vibrate:[180,80,180],
    timestamp:happyadParseTime(data.sent_at)||Number(data.timestamp||Date.now()),
    data:detail
  };
  if(withActions!==false && detail.type==='happyad_message')options.actions=[{action:'reply',title:'Répondre'}];
  return options;
}

function happyadAvatarDiagnostic(detail,reason,stage){
  var diagnostic={
    at:Date.now(),stage:String(stage||''),reason:String(reason||''),
    sender_id:String(detail&&detail.sender_id||''),message_id:String(detail&&detail.message_id||''),
    sender_avatar:String(detail&&detail.sender_avatar||''),sender_avatar_source:String(detail&&detail.sender_avatar_source||''),
    sender_avatar_field:String(detail&&detail.sender_avatar_field||''),sender_avatar_status:String(detail&&detail.sender_avatar_status||''),
    sender_avatar_runtime_status:String(detail&&detail.sender_avatar_runtime_status||''),
    sender_avatar_runtime_reason:String(detail&&detail.sender_avatar_runtime_reason||'')
  };
  return happyadStoreState('last-avatar-fallback',diagnostic).then(function(){return happyadPostToClients('HAPPYAD_PUSH_AVATAR_DIAGNOSTIC',diagnostic);});
}

function happyadShowNotification(data,detail){
  var title=String(data.title||'Fyblic');
  var logo=happyadNotificationAsset('./icons/fyblic-app-icon-v1046-192.png','./icons/fyblic-app-icon-v1046-192.png');
  return happyadPrepareMessageAvatar(data,detail).then(function(prepared){
    detail.sender_avatar_runtime_status=String(prepared.status||'');
    detail.sender_avatar_runtime_reason=String(prepared.reason||'');
    var fullOptions=happyadNotificationOptions(data,detail,prepared.icon,true);
    return self.registration.showNotification(title,fullOptions).catch(function(firstError){
      /* Certains Android refusent une action ou une option mais acceptent la
         même photo. Le second essai conserve donc l'avatar réel. */
      var compactOptions=happyadNotificationOptions(data,detail,prepared.icon,false);
      compactOptions.requireInteraction=false;
      return happyadAvatarDiagnostic(detail,String(firstError&&firstError.message||firstError||'FULL_OPTIONS_FAILED'),'full-options').then(function(){
        return self.registration.showNotification(title,compactOptions);
      }).catch(function(secondError){
        detail.sender_avatar_runtime_status='fallback-logo';
        detail.sender_avatar_runtime_reason='SHOW_WITH_AVATAR_FAILED';
        var fallback=happyadNotificationOptions(data,detail,logo,false);
        fallback.requireInteraction=false;
        return happyadAvatarDiagnostic(detail,String(secondError&&secondError.message||secondError||'AVATAR_OPTIONS_FAILED'),'avatar-options').then(function(){
          return self.registration.showNotification(title,fallback);
        }).catch(function(thirdError){
          try{console.warn('Fyblic notification failed',firstError,secondError,thirdError);}catch(_e){}
          throw thirdError;
        });
      });
    });
  });
}


self.addEventListener('push', function(event){
  var data=happyadPushPayload(event);
  var detail=happyadPushData(data);
  var sentAt=happyadParseTime(data.sent_at)||Number(data.timestamp||0);
  detail.delivery_delay_ms=sentAt>0?Math.max(0,Date.now()-sentAt):0;

  event.waitUntil(
    Promise.all([
      happyadStoreState('last-received',detail),
      happyadReadState('notification-preferences-v855r57')
    ]).then(function(results){
      var preferences=results&&results[1]||{};
      return happyadVisibleClientsFast().then(function(visible){
        (visible||[]).forEach(function(client){
          try{client.postMessage({type:'HAPPYAD_PUSH_FOREGROUND',data:detail});}catch(_e){}
        });
        var decision=happyadPushDeliveryDecision(preferences,data,detail);
        if(!decision.show){
          var suppressed={
            push_id:detail.push_id,message_id:detail.message_id,conversation_id:detail.conversation_id,
            sent_at:detail.sent_at,received_at:detail.received_at,suppressed_at:Date.now(),
            reason:decision.reason||'quiet-mode',preference_key:decision.preference_key||''
          };
          return happyadStoreState('last-suppressed',suppressed).then(function(){
            return happyadPostToClients('HAPPYAD_PUSH_QUIET_SUPPRESSED',suppressed);
          });
        }
        return happyadShowNotification(data,detail).then(function(){
          var shown={
            push_id:detail.push_id,
            message_id:detail.message_id,
            conversation_id:detail.conversation_id,
            sent_at:detail.sent_at,
            received_at:detail.received_at,
            shown_at:Date.now(),
            delivery_delay_ms:detail.delivery_delay_ms,
            delivery_reason:decision.reason||'allowed'
          };
          return happyadStoreState('last-shown',shown).then(function(){
            return happyadPostToClients('HAPPYAD_PUSH_SHOWN',shown);
          });
        });
      });
    })
  );
});

function happyadBase64UrlToUint8Array(base64String){
  var padding='='.repeat((4-base64String.length%4)%4);
  var base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
  var raw=atob(base64);var out=new Uint8Array(raw.length);
  for(var i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}

function happyadSubscriptionJson(sub){
  try{return sub&&sub.toJSON?sub.toJSON():null;}catch(_e){return null;}
}

self.addEventListener('pushsubscriptionchange',function(event){
  var oldSub=event.oldSubscription||null;
  var options=null;
  try{options=oldSub&&oldSub.options?oldSub.options:null;}catch(_e){}
  if(!options||!options.applicationServerKey){
    options={userVisibleOnly:true,applicationServerKey:happyadBase64UrlToUint8Array(HAPPYAD_VAPID_PUBLIC_KEY)};
  }
  event.waitUntil(
    self.registration.pushManager.subscribe(options).then(function(newSub){
      var state={
        changed_at:Date.now(),
        old_subscription:happyadSubscriptionJson(oldSub),
        new_subscription:happyadSubscriptionJson(newSub),
        needs_server_sync:true
      };
      return happyadStoreState('pending-subscription',state).then(function(){
        return happyadPostToClients('HAPPYAD_PUSH_SUBSCRIPTION_REFRESHED',state);
      });
    }).catch(function(error){
      return happyadStoreState('subscription-refresh-error',{at:Date.now(),message:String(error&&error.message||error||'unknown')});
    })
  );
});

self.addEventListener('notificationclick', function(event){
  try{event.notification.close();}catch(_close){}
  var sourceData=(event.notification&&event.notification.data)||{};
  var data={};
  Object.keys(sourceData||{}).forEach(function(key){data[key]=sourceData[key];});
  var replyRequested=String(event.action||'')==='reply';
  if(replyRequested)data.focus_composer=true;

  var targetUrl;
  try{targetUrl=new URL(String(data.url||'./index.html?source=push'),self.location.origin);}
  catch(_url){targetUrl=new URL('./index.html?source=push',self.location.origin);}
  if(replyRequested)targetUrl.searchParams.set('happyad_reply','1');
  var target=targetUrl.href;

  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(function(list){
    var sameOriginClient=null;
    for(var i=0;i<list.length;i++){
      try{
        var c=list[i];
        if(new URL(c.url).origin===self.location.origin){sameOriginClient=c;break;}
      }catch(_e){}
    }
    if(sameOriginClient){
      try{sameOriginClient.postMessage({type:'HAPPYAD_PUSH_OPEN',data:data,url:target});}catch(_msg){}
      return sameOriginClient.focus();
    }
    return self.clients.openWindow(target);
  }));
});

self.addEventListener('fetch', function(event){
  var request=event.request;
  if(!request || request.method !== 'GET')return;
  var path='';try{path=new URL(request.url).pathname;}catch(_e){}
  if(/\/__happyad_push_avatar__\//i.test(path)){
    event.respondWith(caches.open(HAPPYAD_PUSH_AVATAR_CACHE).then(function(cache){
      return cache.match(request).then(function(response){return response||new Response('',{status:404});});
    }));
    return;
  }
  if(isSupabaseOrExternal(request.url) || isHeavyMedia(request))return;
  if(!sameOrigin(request.url))return;

  var dest=request.destination||'';
  /* La version est portée par la query. Une fois préchauffée, l’Assistance
     doit s’ouvrir depuis le cache immédiatement, sans second passage réseau. */
  if(/\/modules\/assistance\.html$/i.test(path)){
    event.respondWith(cacheFirst(request));
    return;
  }
  if(/\/modules\/share-center\.html$/i.test(path)){
    event.respondWith(cacheFirst(request));
    return;
  }
  if(/\/modules\/message-center\.html$/i.test(path)){
    event.respondWith(cacheFirst(request));
    return;
  }
  if(/\/modules\/my-profile\.html$/i.test(path)){
    event.respondWith(cacheFirst(request));
    return;
  }
  if(/\/(modules\/video\.html|modules\/happyad-chat\.html|core\/chat-integration-master-v795\.js|core\/marketplace-home-master-v828\.js)$/i.test(path)){
    event.respondWith(networkFirstFast(request));
    return;
  }
  if(/\/modules\/user\.html$/i.test(path) || /profile-(layout|scroll|publications|polish|ui-fixes|performance)/i.test(path)){
    event.respondWith(networkFirstFast(request));
    return;
  }
  if(request.mode==='navigate' || dest==='document' || /\.html(\?|$)/i.test(new URL(request.url).pathname)){
    event.respondWith(networkFirstFast(request));
    return;
  }
  var messageSubresource=false;
  try{messageSubresource=/\/modules\/message-center\.html$/i.test(new URL(request.referrer||'',self.location.href).pathname);}catch(_messageReferrer){}
  if(messageSubresource&&(dest==='script'||dest==='style'||/\.(js|css)(\?|$)/i.test(new URL(request.url).pathname))){
    event.respondWith(cacheFirst(request));
    return;
  }
  if(dest==='script' || dest==='style' || dest==='worker' || /\.(js|css|webmanifest)(\?|$)/i.test(new URL(request.url).pathname)){
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  if(dest==='image' || /\.(png|jpg|jpeg|webp|svg|ico)(\?|$)/i.test(new URL(request.url).pathname)){
    event.respondWith(cacheFirst(request));
  }
});
