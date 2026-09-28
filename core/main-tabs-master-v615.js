(function(){
  'use strict';
  if(window.__HAPPYAD_MAIN_TABS_MASTER_V615__)return;
  window.__HAPPYAD_MAIN_TABS_MASTER_V615__=true;

  var VERSION='MAIN_TABS_V998_EXCLUSIVE_MAIN_SURFACE';
  var lastAction='';
  var lastAt=0;
  var pendingMessageContext=null;
  var pendingMessageTimer=0;
  var DIRECT_BOOT_KEY_V855R76='HAPPYAD_MESSAGE_DIRECT_BOOT_V855R76';

  function clean(v){return String(v==null?'':v).trim();}
  function stop(ev){try{if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}}catch(_e){}}
  function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(v));}
  function canonicalAvatar(uid,fallback){var m=window.HappyProfileAvatarMasterV855R32||window.HappyProfileAvatarMaster,id=clean(uid);if(m&&id){var e=m.getEntry&&m.getEntry(id);if(e&&e.known)return clean(e.url);if(m.resolve)m.resolve(id).catch(function(){});return '';}return clean(fallback);}
  function nav(){return window.HappyNavigation||null;}
  function button(name){try{return document.querySelector('.bottom [data-happyad-main-nav="'+name+'"]');}catch(_e){return null;}}
  function setPressed(name){
    try{
      document.querySelectorAll('.bottom .nav').forEach(function(el){el.classList.remove('happyadButtonPressedV602','happyadButtonPressedV603');});
      var el=button(name);if(!el)return;
      el.classList.add('happyadButtonPressedV603');
      clearTimeout(el.__happyadDockPressT);
      el.__happyadDockPressT=setTimeout(function(){try{el.classList.remove('happyadButtonPressedV602','happyadButtonPressedV603');}catch(_e){}},130);
    }catch(_e){}
  }
  function dedupe(name){var now=Date.now();if(lastAction===name&&now-lastAt<260)return true;lastAction=name;lastAt=now;return false;}
  function loggedIn(){
    try{return localStorage.getItem('HAPPYAD_SESSION_ACTIVE')==='1'&&isUuid(localStorage.getItem('HAPPYAD_AUTH_UID'));}catch(_e){return false;}
  }
  function unlockReconnect(){
    try{
      ['HAPPYAD_FORCE_LOGOUT','HAPPYAD_FORCE_LOGOUT_UNTIL','HAPPYAD_LOGOUT_LOCK_V1','HAPPYAD_LOGOUT_AT_V1'].forEach(function(k){localStorage.removeItem(k);});
      if(!clean(localStorage.getItem('HAPPYAD_AUTH_UID')))localStorage.setItem('HAPPYAD_SESSION_ACTIVE','0');
    }catch(_e){}
  }
  function normalizeTarget(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    var id=clean(raw.id||raw.user_id||raw.uid||raw.uuid||raw.auth_user_id||raw.account_uid||raw.owner_id);
    if(!isUuid(id))return null;
    return {id:id,user_id:id,name:clean(raw.name||raw.full_name||raw.display_name||raw.username)||'Utilisateur Fyblic',avatar:canonicalAvatar(id,raw.avatar||raw.avatar_url||raw.profile_photo||raw.photo_url),badge:clean(raw.badge||raw.user_badge||raw.profile_badge),status:clean(raw.status||raw.handle||raw.username)};
  }
  function normalizeMessageContext(detail){
    detail=detail&&typeof detail==='object'?detail:{};
    var target=normalizeTarget(detail.target||detail.profile||detail.user);
    return {
      context_id:clean(detail.context_id)||('tabs-v594-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)),
      source:clean(detail.source)||'main-tabs-v594',
      mode:target?'direct':'inbox',
      conversation_id:isUuid(detail.conversation_id||detail.conversationId)?clean(detail.conversation_id||detail.conversationId):'',
      message_id:clean(detail.message_id||detail.messageId),
      return_to:clean(detail.return_to||detail.returnTo),
      surface:clean(detail.surface),
      menu:!!detail.menu,
      target:target
    };
  }
  function messageFrame(){return document.getElementById('happyadAppFrame_message');}
  function deliverMessageContext(){
    clearTimeout(pendingMessageTimer);
    var context=pendingMessageContext;
    if(!context)return false;
    try{
      var frame=messageFrame();
      if(frame&&frame.contentWindow){
        frame.contentWindow.postMessage({type:'HAPPYAD_MESSAGE_CONTEXT',detail:context},'*');
        return true;
      }
    }catch(_e){}
    pendingMessageTimer=setTimeout(deliverMessageContext,110);
    return false;
  }
  function activate(page,extra){
    var n=nav();extra=extra||{};
    try{
      if(n&&typeof n.activateMainTab==='function')return n.activateMainTab(page,extra);
      if(n&&typeof n.open==='function'){
        var urls={video:'modules/video.html',message:'modules/message-center.html?mode=inbox&source=v738-assistance&v=1026-avatar-cover',profile:'modules/my-profile.html?v=1001-profile-identity-scale',publish:'modules/publish.html?v=1001-public-publication-wording'};
        return n.open(urls[page]||'index.html',Object.assign({},extra,{page:page,source:extra.source||VERSION,force:true}));
      }
    }catch(_e){}
    return false;
  }
  function activateDockSurfaceV877(page,extra){
    extra=extra&&typeof extra==='object'?extra:{};
    var accepted=activate(page,extra);
    if(accepted===true)return true;
    /* Une installation qui vient de changer de service worker peut exposer le
       bouton un cycle avant le nouveau routeur. Une seule reprise, dans la tâche
       suivante, exécute l'intention sans demander un deuxième clic. */
    setTimeout(function(){
      try{
        var n=nav();
        if(n&&typeof n.currentPage==='function'&&n.currentPage()===page)return;
        activate(page,Object.assign({},extra,{force:true,source:clean(extra.source||VERSION)+'-retry-v877'}));
      }catch(_retry){}
    },32);
    return false;
  }
  function clearDirectBootContextV855R76(){
    try{sessionStorage.removeItem(DIRECT_BOOT_KEY_V855R76);}catch(_e){}
  }
  function saveDirectBootContextV855R76(context){
    try{sessionStorage.setItem(DIRECT_BOOT_KEY_V855R76,JSON.stringify(context||{}));}catch(_e){}
  }
  function markMessageDirectBootV855R76(frame){
    try{
      var doc=frame&&frame.contentDocument;
      if(doc&&doc.documentElement)doc.documentElement.classList.add('message-direct-boot');
    }catch(_e){}
  }
  function deliverDirectBeforeRevealV855R76(context){
    var frame=messageFrame();
    if(!frame)return false;
    markMessageDirectBootV855R76(frame);
    try{
      var api=frame.contentWindow&&frame.contentWindow.HappyadMessageMaster;
      if(api&&typeof api.applyContext==='function'){
        /* La vue Chat est peinte synchroniquement au début de applyContext(),
           avant les lectures Supabase. On prépare donc la conversation pendant
           que le Profil visiteur reste encore visible, puis seulement après on
           révèle l'onglet Messages. Aucun passage par la liste Conversations. */
        api.applyContext(context);
        clearDirectBootContextV855R76();
        return true;
      }
    }catch(_e){}
    return false;
  }
  var visitorDirectChatOpenV855R77=false;
  var visitorDirectChatSeqV872=0;
  var visitorDirectContextV872=null;
  function visitorProfileFrameV855R77(){return document.getElementById('happyadAppFrame_profile_public');}
  function visitorDirectOpeningV872(){return document.getElementById('happyadVisitorDirectOpeningV872');}
  function hideVisitorDirectOpeningV872(){
    try{var el=visitorDirectOpeningV872();if(el&&el.parentNode)el.parentNode.removeChild(el);}catch(_e){}
  }
  function showVisitorDirectOpeningV872(context){
    try{
      hideVisitorDirectOpeningV872();
      visitorDirectChatOpenV855R77=true;
      document.body&&document.body.classList.add('happyadVisitorDirectChatOpenV855R77');
      var root=document.getElementById('happyadAppShell')||document.body;
      var el=document.createElement('section');
      el.id='happyadVisitorDirectOpeningV872';
      el.setAttribute('aria-label','Ouverture de la conversation');
      el.innerHTML='<header class="haV872Chatbar"><button type="button" class="haV872Back" aria-label="Retour" data-happyad-internal-return-v591="1">‹</button><div class="haV872Avatar"></div><div class="haV872Identity"><strong></strong><span>Conversation Fyblic</span></div></header><div class="haV872OpeningBubbles"><i></i><i></i><i></i></div>';
      var target=context&&context.target||{},name=clean(target.name)||'Utilisateur Fyblic';
      var title=el.querySelector('.haV872Identity strong');if(title)title.textContent=name;
      var avatar=el.querySelector('.haV872Avatar'),url=clean(target.avatar);
      if(avatar){
        avatar.classList.remove('happyadDefaultProfileAvatarV989');avatar.replaceChildren();
        if(url){var img=document.createElement('img');img.alt='';img.src=url;img.referrerPolicy='no-referrer';img.onerror=function(){try{avatar.replaceChildren();avatar.classList.add('happyadDefaultProfileAvatarV989');}catch(_e){}};avatar.appendChild(img);}
        else avatar.classList.add('happyadDefaultProfileAvatarV989');
      }
      var back=el.querySelector('.haV872Back');if(back)back.addEventListener('click',function(ev){stop(ev);closeVisitorDirectChatV855R77('visitor-opening-back-v872');},true);
      root.appendChild(el);
      try{var ir=window.HappyInternalReturnV694||window.HappyInternalReturnV591;if(ir&&typeof ir.open==='function')ir.open('message-chat',{onBack:function(){return closeVisitorDirectChatV855R77('visitor-opening-hardware-v872');}});}catch(_ir){}
      return el;
    }catch(_e){return null;}
  }
  function revealVisitorDirectChatV855R77(frame,context){
    if(!frame)return false;
    try{
      visitorDirectChatOpenV855R77=true;
      document.body&&document.body.classList.add('happyadVisitorDirectChatOpenV855R77');
      frame.classList.add('on','happyadVisitorDirectChatFrameV855R77');
      frame.setAttribute('aria-hidden','false');frame.removeAttribute('inert');
      frame.style.setProperty('z-index','120','important');
      frame.style.setProperty('opacity','1','important');
      frame.style.setProperty('visibility','visible','important');
      hideVisitorDirectOpeningV872();
      try{frame.contentWindow&&frame.contentWindow.postMessage({type:'HAPPYAD_APP_FRAME_VISIBLE',page:'message',source:'visitor-direct-chat-v855r77',detail:{context_id:context&&context.context_id||''}},'*');}catch(_m){}
      try{frame.focus();}catch(_f){}
      return true;
    }catch(_e){return false;}
  }
  function closeVisitorDirectChatV855R77(reason){
    var frame=messageFrame();
    visitorDirectChatSeqV872++;
    visitorDirectChatOpenV855R77=false;
    visitorDirectContextV872=null;
    pendingMessageContext=null;
    clearTimeout(pendingMessageTimer);
    clearDirectBootContextV855R76();
    var api=null;
    try{api=frame&&frame.contentWindow&&frame.contentWindow.HappyadMessageMaster;}catch(_api){}
    try{
      hideVisitorDirectOpeningV872();
      if(frame){
        frame.classList.remove('on','happyadVisitorDirectChatFrameV855R77');
        frame.style.removeProperty('z-index');frame.style.removeProperty('opacity');frame.style.removeProperty('visibility');
        frame.setAttribute('aria-hidden','true');frame.setAttribute('inert','');
      }
      document.body&&document.body.classList.remove('happyadVisitorDirectChatOpenV855R77');
      var visitor=visitorProfileFrameV855R77();
      if(visitor&&visitor.classList.contains('on')){
        visitor.setAttribute('aria-hidden','false');visitor.removeAttribute('inert');
        try{visitor.contentWindow&&visitor.contentWindow.postMessage({type:'HAPPYAD_APP_FRAME_VISIBLE',page:'profile_public',source:'visitor-direct-chat-return-v855r77'},'*');}catch(_v){}
        try{visitor.focus();}catch(_vf){}
      }
    }catch(_e){}
    try{var ir=window.HappyInternalReturnV694||window.HappyInternalReturnV591;if(ir&&typeof ir.close==='function')ir.close('message-chat');}catch(_ir){}
    try{if(frame&&frame.contentWindow)frame.contentWindow.postMessage({type:'HAPPYAD_PAUSE_ALL_MEDIA',reason:reason||'visitor-direct-chat-close-v855r77'},'*');}catch(_p){}
    /* Le profil est déjà présenté. Le nettoyage du chat caché vient dans la tâche
       suivante et ne peut plus retarder le retour visible. */
    if(api&&typeof api.showInbox==='function')requestAnimationFrame(function(){setTimeout(function(){try{api.showInbox({source:'visitor-return-v872'});}catch(_e){}},0);});
    return false;
  }
  function openVisitorDirectChatV855R77(context){
    var openSeq=++visitorDirectChatSeqV872;
    visitorDirectContextV872=context;
    pendingMessageContext=context;
    saveDirectBootContextV855R76(context);
    showVisitorDirectOpeningV872(context);
    var n=nav();
    try{if(n&&typeof n.preloadFrame==='function')n.preloadFrame('message','modules/message-center.html?mode=inbox&source=visitor-direct-chat&v=1026-avatar-cover');}catch(_pre){}
    var started=Date.now(),done=false;
    function prepare(){
      if(done||openSeq!==visitorDirectChatSeqV872)return;
      var frame=messageFrame();
      if(frame){
        markMessageDirectBootV855R76(frame);
        try{
          var api=frame.contentWindow&&frame.contentWindow.HappyadMessageMaster;
          if(api&&typeof api.applyContext==='function'){
            api.applyContext(context);
            clearDirectBootContextV855R76();
            done=true;
            requestAnimationFrame(function(){revealVisitorDirectChatV855R77(frame,context);});
            return;
          }
        }catch(_api){}
      }
      if(Date.now()-started<1500){setTimeout(prepare,20);return;}
      /* Secours froid : la frame reste la même et le Profil visiteur n'est jamais
         démonté. Le contexte stocké est consommé au bootstrap de Messages. */
      if(frame){
        done=true;
        /* Le shell parent reste visible jusqu'à l'accusé de réception V872. Ainsi,
           même un CDN lent ne peut jamais remplacer le profil par une frame noire. */
        [0,80,220,520,1000,1800,3000].forEach(function(delay){setTimeout(deliverMessageContext,delay);});
      }else{
        clearDirectBootContextV855R76();
        pendingMessageContext=null;
        closeVisitorDirectChatV855R77('visitor-opening-unavailable-v872');
      }
    }
    prepare();
    return false;
  }
  function openDirectMessageSmoothV855R76(context){
    pendingMessageContext=context;
    saveDirectBootContextV855R76(context);
    var n=nav();
    try{
      /* Si Messages n'est pas encore chaud, on démarre sa frame en arrière-plan.
         Le Profil visiteur reste à l'écran jusqu'à ce que la vue directe sache
         se peindre. */
      if(n&&typeof n.preloadFrame==='function')n.preloadFrame('message','modules/message-center.html?mode=inbox&source=v738-assistance&v=1026-avatar-cover');
    }catch(_pre){}
    var started=Date.now(),done=false;
    function reveal(){
      if(done)return;
      if(deliverDirectBeforeRevealV855R76(context)){
        done=true;
        requestAnimationFrame(function(){
          activate('message',{source:context.source||'visitor-profile-v855r76-direct'});
          [0,80,220].forEach(function(delay){setTimeout(deliverMessageContext,delay);});
        });
        return;
      }
      /* Pendant un démarrage froid, on laisse au moteur Messages un court délai
         pour finir son bootstrap caché. Le clic paraît direct au lieu d'afficher
         d'abord l'inbox puis de basculer vers le chat. */
      if(Date.now()-started<900){setTimeout(reveal,24);return;}
      done=true;
      var frame=messageFrame();markMessageDirectBootV855R76(frame);
      activate('message',{source:context.source||'visitor-profile-v855r76-direct-fallback'});
      [0,60,160,360,720].forEach(function(delay){setTimeout(deliverMessageContext,delay);});
    }
    reveal();
    return false;
  }
  var videoDirectSeqV855R79=0;
  var VIDEO_DIRECT_KEY_V855R79='HAPPYAD_VIDEO_DIRECT_ANCHOR_V855R79';
  function videoFrameV855R79(){return document.getElementById('happyadAppFrame_video');}
  function clearVideoDirectV855R79(){
    videoDirectSeqV855R79++;
    try{sessionStorage.removeItem(VIDEO_DIRECT_KEY_V855R79);sessionStorage.removeItem('HAPPYAD_VIDEO_TARGET_POST_V594');}catch(_s){}
    try{delete window.__HAPPYAD_VIDEO_DIRECT_ANCHOR_V855R79;}catch(_w){window.__HAPPYAD_VIDEO_DIRECT_ANCHOR_V855R79='';}
    try{var fr=videoFrameV855R79();if(fr&&fr.contentWindow){fr.contentWindow.__HAPPYAD_VIDEO_DIRECT_PREPARING_V855R79=false;delete fr.contentWindow.__HAPPYAD_VIDEO_DIRECT_ANCHOR_V855R79;}}catch(_f){}
  }
  function openVideoDirectV855R79(detail){
    detail=detail&&typeof detail==='object'?detail:{};
    var id=clean(detail.postId||detail.post_id||detail.id||(detail.post&&(detail.post.id||detail.post.post_id)));
    if(!id)return false;
    var seq=++videoDirectSeqV855R79;
    rememberHomeScroll();setPublishFullscreen(false);
    try{sessionStorage.setItem(VIDEO_DIRECT_KEY_V855R79,id);sessionStorage.setItem('HAPPYAD_VIDEO_TARGET_POST_V594',id);}catch(_s){}
    try{window.__HAPPYAD_VIDEO_DIRECT_ANCHOR_V855R79=id;}catch(_w){}
    var n=nav();
    try{if(n&&typeof n.preloadFrame==='function')n.preloadFrame('video','modules/video.html?v=986-base-video-text');}catch(_pre){}
    var started=Date.now(),preparing=false;
    function fallback(){
      if(seq!==videoDirectSeqV855R79)return false;
      try{
        if(n&&typeof n.openVideoPost==='function')return n.openVideoPost('modules/video.html?post='+encodeURIComponent(id)+'&autoplay=1',{source:detail.source||'video-direct-v855r79-fallback',__happyadVideoDirectBypassV855R79:true});
      }catch(_e){}
      return false;
    }
    function prepare(){
      if(seq!==videoDirectSeqV855R79||preparing)return;
      var frame=videoFrameV855R79(),api=null;
      try{api=frame&&frame.contentWindow&&frame.contentWindow.HappyVideoDirectV855R79;}catch(_api){}
      if(api&&typeof api.prepareTargetFirst==='function'){
        preparing=true;
        Promise.resolve(api.prepareTargetFirst(id)).then(function(ok){
          if(seq!==videoDirectSeqV855R79)return;
          if(!ok){fallback();return;}
          /* Comme le Chat direct : l'Accueil reste visible jusqu'à ce que la bonne
             surface soit déjà peinte. On révèle ensuite l'iframe préparée. */
          activate('video',{source:detail.source||'video-card-target-first-v855r79'});
          requestAnimationFrame(function(){
            try{var fr=videoFrameV855R79(),a=fr&&fr.contentWindow&&fr.contentWindow.HappyVideoDirectV855R79;if(a&&typeof a.commitTargetFirst==='function')a.commitTargetFirst(id);}catch(_c){}
          });
        }).catch(function(){fallback();});
        return;
      }
      if(Date.now()-started<1400){setTimeout(prepare,18);return;}
      fallback();
    }
    prepare();
    return false;
  }

  function openMessage(detail){
    detail=detail&&typeof detail==='object'?detail:{};
    var auth=window.HappyAuthSessionV598||window.HappyAuthSessionV596||window.HappyAuthSessionV595||null;
    if(auth&&typeof auth.isAuthenticated==='function'&&!auth.isAuthenticated()&&!loggedIn()&&!detail.authResume){
      auth.require({action:'messages',resume:function(){openMessage(Object.assign({},detail,{authResume:true}));}});
      return false;
    }
    var context=normalizeMessageContext(detail);
    if(context.mode==='direct'&&context.target&&context.return_to==='visitor-profile')return openVisitorDirectChatV855R77(context);
    if(context.mode==='direct'&&context.target)return openDirectMessageSmoothV855R76(context);
    clearDirectBootContextV855R76();
    pendingMessageContext=context;
    activateDockSurfaceV877('message',{source:context.source||'main-tabs-message-v877',menu:!!context.menu});
    [0,60,160,360,720].forEach(function(delay){setTimeout(deliverMessageContext,delay);});
    return false;
  }
  function rememberHomeScroll(){
    try{sessionStorage.setItem('HAPPYAD_HOME_SCROLL_Y_V586',String(Math.max(0,Number(window.scrollY||document.documentElement.scrollTop||document.body.scrollTop||0))));}catch(_e){}
  }
  function restoreHomeSurface(){
    try{
      var root=document.getElementById('happyadAppShell');
      if(root){
        root.querySelectorAll('.happyadAppFrame').forEach(function(fr){
          try{fr.contentWindow&&fr.contentWindow.postMessage({type:'HAPPYAD_PAUSE_ALL_MEDIA',reason:'main-tabs-home-v594'},'*');}catch(_m){}
          fr.classList.remove('on');
        });
        root.classList.remove('on','happyadSkeletonOpen');root.setAttribute('aria-hidden','true');
      }
      try{var shield=document.getElementById('happyadAppTapShield');if(shield&&shield.parentNode)shield.parentNode.removeChild(shield);}catch(_shield){}
      document.body.classList.remove('happyadAppOpen','happyadPublishFullscreenV586','no-scroll','modal-open','story-open','fullscreen-open','happyad-story-fullscreen-lock','happyadShareOpen');
      document.documentElement.classList.remove('no-scroll','modal-open','story-open','fullscreen-open','happyad-story-fullscreen-lock','happyadShareOpen');
      document.body.classList.add('happyadMainDockVisible');
      ['overflow','overflow-y','touch-action','position','top','width'].forEach(function(prop){document.body.style.removeProperty(prop);document.documentElement.style.removeProperty(prop);});
      document.querySelectorAll('.bottom .nav').forEach(function(el){el.classList.remove('active');});
      var home=button('home');if(home)home.classList.add('active');
      var y=Number(sessionStorage.getItem('HAPPYAD_HOME_SCROLL_Y_V586')||0)||0;
      try{if(window.HappyOverlayMasterV615)window.HappyOverlayMasterV615.reconcile('main-tabs-home-v615');}catch(_ov){}
      requestAnimationFrame(function(){requestAnimationFrame(function(){try{window.scrollTo(0,y);}catch(_s){}});});
    }catch(_e){}
  }
  function goHome(){
    var n=nav();
    try{if(n&&typeof n.releaseNavGate==='function')n.releaseNavGate('main-tabs-home-v594');}catch(_g){}
    try{if(n&&typeof n.close==='function')n.close('main-tabs-home-v594',{menu:true,source:'main-tabs-home-v927'});}catch(_c){}
    restoreHomeSurface();
    return false;
  }
  function setPublishFullscreen(on){
    try{document.body.classList.toggle('happyadPublishFullscreenV586',!!on);if(on)document.body.classList.remove('happyadMainDockVisible');}catch(_e){}
  }
  /* V998 — Un bouton du menu principal représente un changement de surface,
     pas l'ouverture d'une couche au-dessus de la précédente. Les iframes restent
     en cache pour la vitesse, mais l'ancienne surface est immédiatement mise en
     pause + retirée visuellement avant l'activation de la suivante. */
  function closeParentMenuLayersV998(){
    try{
      var search=document.getElementById('happyadSmartSearchV427');
      if(search&&search.classList.contains('on')){
        search.classList.remove('on');
        try{var ae=document.activeElement;if(ae&&search.contains(ae)&&typeof ae.blur==='function')ae.blur();}catch(_blur){}
      }
      document.documentElement.classList.remove('haSearchLocked');
      document.body&&document.body.classList.remove('haSearchLocked');
    }catch(_e){}
  }
  function cutPreviousMainSurfaceV998(next){
    try{
      closeParentMenuLayersV998();
      next=clean(next).toLowerCase();
      var n=nav(),current='';
      try{current=n&&typeof n.currentPage==='function'?clean(n.currentPage()).toLowerCase():'';}catch(_c){}
      if(current===next)return true;
      var root=document.getElementById('happyadAppShell');
      if(root){
        root.querySelectorAll('.happyadAppFrame.on').forEach(function(fr){
          var pg=clean(fr.getAttribute('data-happyad-page')).toLowerCase();
          if(pg===next)return;
          try{if(n&&typeof n.pauseFrame==='function')n.pauseFrame(fr,'dock-exclusive-switch-v998-'+next);}catch(_p){}
          fr.classList.remove('on');
          fr.style.opacity='';fr.style.visibility='';
          fr.setAttribute('aria-hidden','true');fr.setAttribute('inert','');
        });
        if(next==='home'){root.classList.remove('on','happyadSkeletonOpen','happyadMessageCachePreparingV876','happyadMessageCachePreparingWithinShellV876');root.setAttribute('aria-hidden','true');}
        else{root.classList.add('on');root.classList.remove('happyadMessageCachePreparingV876');root.setAttribute('aria-hidden','false');}
      }
      if(document.body){
        if(next==='home')document.body.classList.remove('happyadAppOpen');
        else document.body.classList.add('happyadAppOpen');
      }
      return true;
    }catch(_e){return false;}
  }
  function openMain(name,detail){
    name=clean(name).toLowerCase();
    var resumeDetail=detail&&typeof detail==='object'?detail:{};
    if(!name||(!resumeDetail.authResume&&dedupe(name)))return false;
    setPressed(name);
    /* Même si une authentification est demandée avant la route, le menu principal
       ferme d'abord la Recherche parent : aucune ancienne couche ne reste derrière. */
    closeParentMenuLayersV998();
    var auth=window.HappyAuthSessionV598||window.HappyAuthSessionV596||window.HappyAuthSessionV595||null;
    if(name!=='video'&&name!=='home'&&auth&&typeof auth.isAuthenticated==='function'&&!auth.isAuthenticated()&&!loggedIn()&&!resumeDetail.authResume){
      var intent={action:'menu-'+name,mainNav:name,resume:function(){openMain(name,Object.assign({},resumeDetail,{authResume:true}));}};
      if(name==='profile'&&typeof auth.openChoice==='function')auth.openChoice(intent);
      else auth.require(intent);
      return false;
    }
    cutPreviousMainSurfaceV998(name);
    if(name==='home'){clearVideoDirectV855R79();return goHome();}
    rememberHomeScroll();
    if(name==='video'){clearVideoDirectV855R79();setPublishFullscreen(false);activate('video',{source:'main-tabs-video-v855r79-central',menu:true});return false;}
    clearVideoDirectV855R79();
    if(name==='message'){setPublishFullscreen(false);return openMessage(Object.assign({mode:'inbox',source:'main-tabs-message-v877',menu:true},resumeDetail));}
    if(name==='profile'){
      setPublishFullscreen(false);
      activateDockSurfaceV877('profile',{source:'main-tabs-profile-v877',url:'modules/my-profile.html?v=1001-profile-identity-scale',menu:true});return false;
    }
    if(name==='publish'){setPublishFullscreen(true);activate('publish',{source:'main-tabs-publish-v595',menu:true});return false;}
    return false;
  }
  function onDockEvent(ev){
    var el=ev&&ev.target&&ev.target.closest&&ev.target.closest('.bottom [data-happyad-main-nav]');if(!el)return;
    stop(ev);return openMain(el.getAttribute('data-happyad-main-nav')||'');
  }
  document.addEventListener('pointerdown',onDockEvent,true);
  document.addEventListener('click',function(ev){if(ev&&ev.detail===0)onDockEvent(ev);},true);

  window.addEventListener('HAPPYAD_NEW_MESSAGE_SYSTEM_REQUEST',function(ev){try{openMessage(ev&&ev.detail||{});}catch(_e){}},true);
  window.addEventListener('HAPPYAD_VIDEO_DIRECT_OPEN_REQUEST_V855R79',function(ev){try{openVideoDirectV855R79(ev&&ev.detail||{});}catch(_e){}},true);
  window.addEventListener('message',function(ev){
    try{
      var data=ev&&ev.data;if(!data)return;
      if(data.type==='HAPPYAD_NEW_MESSAGE_SYSTEM_REQUEST')return openMessage(data.detail||{});
      if(data.type==='HAPPYAD_MESSAGE_CENTER_READY')return deliverMessageContext();
      if(data.type==='HAPPYAD_MESSAGE_CONTEXT_ACCEPTED_V872'){
        var ackFrame=messageFrame();
        if(!ackFrame||ev.source!==ackFrame.contentWindow)return;
        var acceptedId=clean(data.detail&&data.detail.context_id);
        if(pendingMessageContext&&(!acceptedId||acceptedId===pendingMessageContext.context_id)){
          pendingMessageContext=null;
          clearTimeout(pendingMessageTimer);
        }
        if(visitorDirectChatOpenV855R77&&visitorDirectOpeningV872()){
          var visitorFrame=messageFrame();
          if(visitorFrame)requestAnimationFrame(function(){revealVisitorDirectChatV855R77(visitorFrame,visitorDirectContextV872||{});});
        }
        return;
      }
      if(data.type==='HAPPYAD_VISITOR_DIRECT_CHAT_CLOSE_V855R77'){
        var frame=messageFrame();
        if(frame&&ev.source===frame.contentWindow)return closeVisitorDirectChatV855R77(clean(data.detail&&data.detail.reason)||'message-back');
        return;
      }
      if(data.type==='HAPPYAD_MESSAGE_CONTEXT_APPLIED'){
        var id=clean(data.detail&&data.detail.context_id);
        if(pendingMessageContext&&(!id||id===pendingMessageContext.context_id))pendingMessageContext=null;
        clearDirectBootContextV855R76();
      }
    }catch(_e){}
  },true);

  window.addEventListener('HAPPYAD_NAV_CHANGED_V586',function(ev){
    try{var page=clean(ev&&ev.detail&&ev.detail.page)||'home';setPublishFullscreen(page==='publish');}catch(_e){}
  },true);

  function preload(){
    try{window.__HAPPYAD_MAIN_TABS_PRELOAD_DISABLED_V614__=true;}catch(_e){}
    return false;
  }
  function initialDockState(){
    try{
      var st=history.state;var page=clean(st&&st.view)||'home';
      var visible=(page==='home'||page==='profile'||page==='video'||page==='message');
      if(document.body)document.body.classList.toggle('happyadMainDockVisible',visible);
      preload();
    }catch(_e){if(document.body)document.body.classList.add('happyadMainDockVisible');preload();}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialDockState,{once:true});else initialDockState();

  window.HappyMainTabsV598={version:VERSION,open:openMain,openMessage:openMessage,openVideoDirect:openVideoDirectV855R79,clearVideoDirect:clearVideoDirectV855R79,deliverMessageContext:deliverMessageContext,closeVisitorDirectChat:closeVisitorDirectChatV855R77,preload:preload};
  window.HappyMainTabsV596=window.HappyMainTabsV598;
  window.HappyMainTabsV595=window.HappyMainTabsV598;
  window.HappyMainTabsV594=window.HappyMainTabsV598;
  window.HappyMainDockV586=window.HappyMainTabsV598;
  window.HappyMainDockV585=window.HappyMainTabsV598;
  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('main-bottom-nav',{file:'core/main-tabs-master-v615.js',responsibility:'onglets persistants, vidéo publique et notification invité au premier contact',active:true,version:VERSION});}catch(_e){}
})();
