(function(){
  'use strict';
  if(window.HappyFollowMasterV855R34)return;

  var VERSION='V986_FOLLOW_SINGLE_ENGINE_COMPACT_SVG';
  var CACHE_KEY='HAPPYAD_FOLLOW_STATE_V855R34';
  var SYNC_KEY='HAPPYAD_FOLLOW_SYNC_V855R34';
  var CHANNEL_NAME='happyad-follow-v855r34';
  var FRESH_MS=20000;
  var MAX_ENTRIES=800;
  var instanceId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  var entries=loadEntries();
  var pending={};
  var inflight={};
  var flushTimer=0;
  var channel=null;

  function clean(v){return String(v==null?'':v).trim();}
  function pairKey(viewer,target){return clean(viewer)+'>'+clean(target);}
  function readJson(key,fallback){try{var value=JSON.parse(localStorage.getItem(key)||'null');return value==null?fallback:value;}catch(_e){return fallback;}}
  function loadEntries(){
    var raw=readJson(CACHE_KEY,{}),source=raw&&raw.entries&&typeof raw.entries==='object'?raw.entries:raw,out={};
    if(!source||typeof source!=='object'||Array.isArray(source))return out;
    Object.keys(source).forEach(function(key){
      var row=source[key];if(!row||!clean(row.viewer)||!clean(row.target)||typeof row.following!=='boolean')return;
      out[pairKey(row.viewer,row.target)]={viewer:clean(row.viewer),target:clean(row.target),following:row.following,at:Number(row.at||0)||0,source:clean(row.source||'cache')};
    });
    return out;
  }
  function persistEntries(){
    try{
      var keys=Object.keys(entries).sort(function(a,b){return Number(entries[b].at||0)-Number(entries[a].at||0);}).slice(0,MAX_ENTRIES),out={};
      keys.forEach(function(key){out[key]=entries[key];});entries=out;
      localStorage.setItem(CACHE_KEY,JSON.stringify({version:VERSION,at:Date.now(),entries:out}));
    }catch(_e){}
  }
  function client(){
    try{
      if(window.happyadSupabase&&window.happyadSupabase.from)return window.happyadSupabase;
      if(window.supabaseClient&&window.supabaseClient.from)return window.supabaseClient;
      if(typeof window.happyadSb==='function'){var direct=window.happyadSb();if(direct&&direct.from)return direct;}
      if(window.parent&&window.parent!==window){
        var parentClient=window.parent.happyadSupabase||window.parent.supabaseClient||null;
        if(!parentClient&&typeof window.parent.happyadSb==='function')parentClient=window.parent.happyadSb();
        if(parentClient&&parentClient.from){window.happyadSupabase=parentClient;return parentClient;}
        if(!window.supabase&&window.parent.supabase)window.supabase=window.parent.supabase;
      }
      if(window.HappySupabaseClientMasterV972&&typeof window.HappySupabaseClientMasterV972.get==='function')return window.HappySupabaseClientMasterV972.get();
    }catch(_e){}
    return null;
  }
  function fastViewerUid(){
    try{
      var local=readJson('HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL',{})||{};
      return clean(localStorage.getItem('HAPPYAD_AUTH_UID')||local.id||local.user_id||local.uid);
    }catch(_e){return '';}
  }
  async function viewerUid(value){
    var direct=clean(value)||fastViewerUid();if(direct)return direct;
    var c=client();if(!c||!c.auth)return '';
    try{
      var session=await c.auth.getSession(),user=session&&session.data&&session.data.session&&session.data.session.user;
      if(!user){var result=await c.auth.getUser();user=result&&result.data&&result.data.user;}
      if(user&&user.id){direct=clean(user.id);return direct;}
    }catch(_e){}
    return '';
  }
  function getEntry(viewer,target){var row=entries[pairKey(viewer,target)];return row?Object.assign({},row):null;}
  function isFresh(row){return !!(row&&Date.now()-Number(row.at||0)<FRESH_MS);}
  function show(button,on){
    if(!button)return;
    button.hidden=!on;
    if(on)button.removeAttribute('aria-hidden');else button.setAttribute('aria-hidden','true');
  }
  function isCompactSvgV986(button){
    return !!(button&&button.dataset&&button.dataset.happyadFollowVisual==='compact-svg-v986');
  }
  function compactIconHtmlV986(following){
    return following
      ? '<svg class="happyadFollowGlyphV986 happyadFollowCheckGlyphV986" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5.8 12.6 4 4 8.5-8.8"></path></svg>'
      : '<svg class="happyadFollowGlyphV986 happyadFollowPlusGlyphV986" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5.5v13M5.5 12h13"></path></svg>';
  }
  function paintVisualV986(button,following){
    if(!button)return;
    if(isCompactSvgV986(button)){
      button.innerHTML=compactIconHtmlV986(!!following);
      button.setAttribute('aria-label',following?'Abonnement ajouté':clean(button.dataset.happyadFollowIdleLabel||'S’abonner'));
      return;
    }
    button.textContent=following?'✔️':'S’abonner';
  }
  function paintButton(button,known,following){
    if(!button)return;
    var successUntil=Number(button.dataset&&button.dataset.happyadFollowSuccessUntil||0);
    if(following&&successUntil>Date.now()){
      show(button,true);button.disabled=true;paintVisualV986(button,true);button.classList.add('happyadFollowSuccessV855R34');
      return;
    }
    button.classList.remove('happyadFollowSuccessV855R34');
    button.removeAttribute('data-happyad-follow-success-until');
    if(!known||following){button.disabled=!!following;show(button,false);return;}
    button.disabled=false;paintVisualV986(button,false);show(button,true);
  }
  function syncButtons(viewer,target,following){
    try{
      document.querySelectorAll('[data-happyad-follow-target]').forEach(function(button){
        if(clean(button.dataset.happyadFollowViewer)===clean(viewer)&&clean(button.dataset.happyadFollowTarget)===clean(target))paintButton(button,true,!!following);
      });
    }catch(_e){}
  }
  function emit(row,source){
    var detail={viewerUid:row.viewer,targetUid:row.target,following:!!row.following,at:row.at,source:source||row.source||VERSION};
    syncButtons(row.viewer,row.target,row.following);
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_FOLLOW_STATE_UPDATED_V855R34',{detail:detail}));}catch(_e){}
    try{document.dispatchEvent(new CustomEvent('happyad:follow-state-updated',{detail:detail}));}catch(_e2){}
  }
  function remember(viewer,target,following,options){
    options=options||{};viewer=clean(viewer);target=clean(target);if(!viewer||!target||viewer===target)return null;
    var row={viewer:viewer,target:target,following:!!following,at:Number(options.at||Date.now()),source:clean(options.source||VERSION)};
    entries[pairKey(viewer,target)]=row;
    if(options.persist!==false)persistEntries();
    emit(row,options.source);
    if(options.broadcast===true)broadcast(row,options.source);
    return Object.assign({},row);
  }
  function broadcast(row,source){
    var message={type:'HAPPYAD_FOLLOW_STATE_SYNC_V855R34',sender:instanceId,detail:{viewerUid:row.viewer,targetUid:row.target,following:!!row.following,at:row.at,source:source||row.source||VERSION}};
    try{if(channel)channel.postMessage(message);}catch(_e){}
    try{localStorage.setItem(SYNC_KEY,JSON.stringify(Object.assign({nonce:Date.now()+'-'+Math.random()},message)));localStorage.removeItem(SYNC_KEY);}catch(_e2){}
  }
  function receive(message){
    var detail=message&&message.detail||{};if(message&&message.sender===instanceId)return;
    var viewer=clean(detail.viewerUid),target=clean(detail.targetUid);if(!viewer||!target||typeof detail.following!=='boolean')return;
    remember(viewer,target,detail.following,{at:detail.at,source:detail.source||'sync',persist:true,broadcast:false});
  }
  function bindSync(){
    try{if(typeof BroadcastChannel==='function'){channel=new BroadcastChannel(CHANNEL_NAME);channel.onmessage=function(event){receive(event&&event.data);};}}catch(_e){}
    window.addEventListener('storage',function(event){if(event.key!==SYNC_KEY||!event.newValue)return;try{receive(JSON.parse(event.newValue));}catch(_e){};});
  }
  function resolveBatch(viewer,targets){
    return (async function(){
      var c=client(),followed={};
      try{
        if(!c||!c.from)throw new Error('Supabase non chargé');
        var result=await c.from('happyad_follows').select('creator_id').eq('follower_id',viewer).in('creator_id',targets);
        if(result&&result.error)throw result.error;
        (result&&result.data||[]).forEach(function(row){var id=clean(row&&row.creator_id);if(id)followed[id]=true;});
        targets.forEach(function(target){remember(viewer,target,!!followed[target],{source:'happyad_follows',persist:false,broadcast:false});});
        persistEntries();
      }catch(_error){}
      targets.forEach(function(target){
        var key=pairKey(viewer,target),row=getEntry(viewer,target),value=!!(row&&row.following);
        (inflight[key]&&inflight[key].waiters||[]).forEach(function(resolve){resolve(value);});
        delete inflight[key];
      });
    })();
  }
  function flush(){
    clearTimeout(flushTimer);flushTimer=0;
    var batch=pending;pending={};var groups={};
    Object.keys(batch).forEach(function(key){var item=batch[key];inflight[key]=item;if(!groups[item.viewer])groups[item.viewer]=[];groups[item.viewer].push(item.target);});
    Object.keys(groups).forEach(function(viewer){resolveBatch(viewer,groups[viewer].filter(function(target,index,list){return list.indexOf(target)===index;}));});
  }
  function isFollowing(viewer,target,options){
    viewer=clean(viewer);target=clean(target);options=options||{};
    if(!viewer||!target||viewer===target)return Promise.resolve(false);
    var cached=getEntry(viewer,target);if(options.force!==true&&isFresh(cached))return Promise.resolve(!!cached.following);
    var key=pairKey(viewer,target);
    return new Promise(function(resolve){
      if(inflight[key]){inflight[key].waiters.push(resolve);return;}
      if(!pending[key])pending[key]={viewer:viewer,target:target,waiters:[]};
      pending[key].waiters.push(resolve);
      if(!flushTimer)flushTimer=setTimeout(flush,24);
    });
  }
  function invalidateCountCaches(viewer,target){
    try{
      [viewer,target].filter(Boolean).forEach(function(uid){
        localStorage.removeItem('HAPPYAD_PROFILE_V854_OWNER_'+uid+'_COUNTS_V855R35_LEGACY_GROUPS');
        localStorage.removeItem('HAPPYAD_PROFILE_V854_VISITOR_'+uid+'_COUNTS_V855R35_LEGACY_GROUPS');
      });
    }catch(_e){}
  }
  async function setFollowing(viewer,target,on){
    viewer=clean(viewer);target=clean(target);on=!!on;
    if(!viewer)throw new Error('Connexion requise');
    if(!target)throw new Error('Profil introuvable');
    if(viewer===target)throw new Error('Auto-abonnement interdit');
    var c=client();if(!c||!c.from)throw new Error('Supabase non chargé');
    if(on){
      var insert=await c.from('happyad_follows').upsert({follower_id:viewer,creator_id:target,created_at:new Date().toISOString()},{onConflict:'follower_id,creator_id'});
      if(insert&&insert.error)throw insert.error;
    }else{
      var remove=await c.from('happyad_follows').delete().eq('follower_id',viewer).eq('creator_id',target);
      if(remove&&remove.error)throw remove.error;
    }
    invalidateCountCaches(viewer,target);
    remember(viewer,target,on,{source:'happyad_follows-write',persist:true,broadcast:true});
    return on;
  }
  function unbindOneWay(button){
    if(!button)return;
    var binding=button.__happyadFollowBindingV855R34;
    if(binding&&binding.handler)button.removeEventListener('click',binding.handler,true);
    button.__happyadFollowBindingV855R34=null;
    delete button.dataset.happyadFollowViewer;delete button.dataset.happyadFollowTarget;delete button.dataset.happyadFollowSuccessUntil;
    button.classList.remove('happyadFollowSuccessV855R34');show(button,false);
  }
  function bindOneWay(button,options){
    options=options||{};if(!button)return null;
    if(isCompactSvgV986(button)&&!clean(button.dataset.happyadFollowIdleLabel))button.dataset.happyadFollowIdleLabel=clean(button.getAttribute('aria-label')||'S’abonner');
    unbindOneWay(button);
    var binding={token:Date.now()+'-'+Math.random(),button:button,target:clean(options.targetUid),viewer:'',handler:null};
    button.__happyadFollowBindingV855R34=binding;paintVisualV986(button,false);show(button,false);
    binding.handler=function(event){
      event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();
      if(button.disabled||!binding.viewer||!binding.target)return false;
      var until=Date.now()+720;button.dataset.happyadFollowSuccessUntil=String(until);paintVisualV986(button,true);button.disabled=true;button.classList.add('happyadFollowSuccessV855R34');show(button,true);
      setFollowing(binding.viewer,binding.target,true).then(function(){
        if(button.__happyadFollowBindingV855R34!==binding)return;
        setTimeout(function(){if(button.__happyadFollowBindingV855R34===binding){delete button.dataset.happyadFollowSuccessUntil;paintButton(button,true,true);}},Math.max(0,until-Date.now()));
        if(typeof options.onFollowed==='function')options.onFollowed(binding.target);
      }).catch(function(error){
        if(button.__happyadFollowBindingV855R34!==binding)return;
        delete button.dataset.happyadFollowSuccessUntil;button.disabled=false;paintButton(button,true,false);
        if(typeof options.onError==='function')options.onError(error);
      });
      return false;
    };
    button.addEventListener('click',binding.handler,true);
    viewerUid(options.viewerUid).then(function(viewer){
      if(button.__happyadFollowBindingV855R34!==binding)return;
      binding.viewer=clean(viewer);button.dataset.happyadFollowViewer=binding.viewer;button.dataset.happyadFollowTarget=binding.target;
      if(!binding.viewer||!binding.target||binding.viewer===binding.target){show(button,false);return;}
      var cached=getEntry(binding.viewer,binding.target);if(cached)paintButton(button,true,cached.following);
      isFollowing(binding.viewer,binding.target,{force:options.force===true}).then(function(following){
        if(button.__happyadFollowBindingV855R34===binding)paintButton(button,true,!!following);
      });
    });
    return binding;
  }

  var api={version:VERSION,client:client,viewerUid:viewerUid,getEntry:getEntry,isFollowing:isFollowing,setFollowing:setFollowing,follow:function(viewer,target){return setFollowing(viewer,target,true);},bindOneWay:bindOneWay,unbindOneWay:unbindOneWay,compactIconHtmlV986:compactIconHtmlV986};
  window.HappyFollowMasterV855R34=Object.freeze(api);
  window.HappyFollowMaster=window.HappyFollowMasterV855R34;
  bindSync();
})();
