(function(){
  'use strict';
  if(window.HappyMasterRegistry&&window.HappyMasterRegistry.version==='P1_02_09_MODULE_LIFECYCLE_V974')return;

  var VERSION='P1_02_09_MODULE_LIFECYCLE_V974';
  var REQUIRED_HOOKS=['mount','resume','suspend','unmount'];
  var masters={};
  var surfaces={};
  var sourceToSurface=typeof WeakMap==='function'?new WeakMap():null;
  var transitionSeq=0;

  var aliases={
    'index':'home',
    'my-profile':'profile',
    'visitor-profile':'profile_public',
    'message-center':'message',
    'notification-center':'notifications',
    'profile-edit':'profile_edit',
    'profile-stats':'profile_stats',
    'share-center':'share',
    'happyad-chat':'chat'
  };
  var definitions=[
    ['home','index.html','root'],
    ['assistance','modules/assistance.html','iframe'],
    ['chat','modules/happyad-chat.html','iframe'],
    ['live','modules/live.html','iframe'],
    ['map','modules/map.html','iframe'],
    ['message','modules/message-center.html','iframe'],
    ['profile','modules/my-profile.html','iframe'],
    ['notifications','modules/notification-center.html','iframe'],
    ['photo','modules/photo.html','iframe'],
    ['profile_edit','modules/profile-edit.html','iframe'],
    ['profile_stats','modules/profile-stats.html','iframe'],
    ['publish','modules/publish.html','iframe'],
    ['settings','modules/settings.html','iframe'],
    ['share','modules/share-center.html','iframe'],
    ['user','modules/user.html','redirect'],
    ['video','modules/video.html','iframe'],
    ['profile_public','modules/visitor-profile.html','iframe']
  ];

  function clone(value){
    try{return JSON.parse(JSON.stringify(value));}catch(_e){return value;}
  }
  function clean(value){return String(value==null?'':value).trim();}
  function normalizeSurface(value){
    var name=clean(value).toLowerCase();
    if(!name)return '';
    try{name=decodeURIComponent(name);}catch(_e){}
    name=name.split('#')[0].split('?')[0].replace(/\\/g,'/').replace(/^.*\//,'').replace(/\.html?$/,'');
    name=name.replace(/[^a-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
    return aliases[name]||name;
  }
  function register(name,spec){
    name=clean(name);
    if(!name)return null;
    masters[name]=Object.assign({name:name,version:'CORE_V4',active:false,mode:'grouped-safe',createdAt:Date.now()},spec||{});
    try{if(window.HappyCorrectionRegistry)window.HappyCorrectionRegistry.register('master:'+name,masters[name]);}catch(_e){}
    return clone(masters[name]);
  }
  function list(){return clone(masters);}
  function get(name){return clone(masters[clean(name)]);}

  function surfaceFromFrame(frame){
    if(!frame)return '';
    var cached=clean(frame.__happyadRegistrySurfaceV974);
    if(cached)return cached;
    var candidates=[];
    try{candidates.push(frame.getAttribute('data-happyad-page'));}catch(_e){}
    try{candidates.push(frame.id&&frame.id.replace(/^happyadAppFrame_/,''));}catch(_e2){}
    try{candidates.push(frame.getAttribute('src'));}catch(_e3){}
    try{candidates.push(frame.getAttribute('data-happyad-src'));}catch(_e4){}
    for(var i=0;i<candidates.length;i++){
      var value=clean(candidates[i]);
      if(!value||value==='about:blank')continue;
      var name=normalizeSurface(value);
      if(name&&surfaces[name]){
        try{frame.__happyadRegistrySurfaceV974=name;}catch(_e5){}
        return name;
      }
    }
    return '';
  }
  function framesForSurface(name){
    var found=[];
    try{
      document.querySelectorAll('iframe').forEach(function(frame){
        if(surfaceFromFrame(frame)===name)found.push(frame);
      });
    }catch(_e){}
    return found;
  }
  function sendCommand(name,action,detail){
    if(name==='home')return true;
    var sent=false;
    framesForSurface(name).forEach(function(frame){
      try{
        if(!frame.contentWindow)return;
        frame.contentWindow.postMessage({
          type:'HAPPYAD_MODULE_'+String(action||'').toUpperCase(),
          surface:name,
          reason:clean(detail&&detail.reason)||VERSION,
          source:VERSION,
          at:Date.now()
        },'*');
        sent=true;
      }catch(_e){}
    });
    return sent;
  }
  function defaultLifecycle(name){
    return {
      mount:function(detail){return sendCommand(name,'mount',detail);},
      resume:function(detail){return sendCommand(name,'resume',detail);},
      suspend:function(detail){return sendCommand(name,'suspend',detail);},
      unmount:function(detail){return sendCommand(name,'unmount',detail);}
    };
  }
  function snapshotSurface(record){
    if(!record)return null;
    return {
      name:record.name,
      path:record.path,
      kind:record.kind,
      state:record.state,
      connected:!!record.connected,
      lifecycle:{mount:true,resume:true,suspend:true,unmount:true},
      childVersion:record.childVersion||'',
      registeredAt:record.registeredAt,
      lastTransitionAt:record.lastTransitionAt||0,
      lastAction:record.lastAction||'',
      lastReason:record.lastReason||'',
      transitionCount:record.transitionCount||0,
      history:clone(record.history||[])
    };
  }
  function registerSurface(name,spec){
    name=normalizeSurface(name);
    if(!name)return null;
    spec=spec||{};
    var existing=surfaces[name];
    var lifecycle=spec.lifecycle||existing&&existing.lifecycle||defaultLifecycle(name);
    REQUIRED_HOOKS.forEach(function(hook){
      if(typeof lifecycle[hook]!=='function')lifecycle[hook]=defaultLifecycle(name)[hook];
    });
    var record=existing||{
      name:name,
      state:'unmounted',
      connected:false,
      registeredAt:Date.now(),
      transitionCount:0,
      history:[]
    };
    record.path=clean(spec.path)||record.path||'';
    record.kind=clean(spec.kind)||record.kind||'iframe';
    record.lifecycle=lifecycle;
    if(spec.childVersion)record.childVersion=clean(spec.childVersion);
    surfaces[name]=record;
    return snapshotSurface(record);
  }
  function stateFor(action){
    if(action==='mount')return 'mounted';
    if(action==='resume')return 'active';
    if(action==='suspend')return 'suspended';
    if(action==='unmount')return 'unmounted';
    return '';
  }
  function applyTransition(name,action,detail,invokeHook){
    name=normalizeSurface(name);action=clean(action).toLowerCase();detail=detail||{};
    var record=surfaces[name];
    if(!record||REQUIRED_HOOKS.indexOf(action)<0)return null;
    var nextState=stateFor(action);
    if(record.state===nextState&&action!=='mount')return snapshotSurface(record);
    if(invokeHook!==false){
      try{record.lifecycle[action](detail);}catch(_e){}
    }
    record.state=nextState;
    record.connected=action!=='unmount';
    record.lastAction=action;
    record.lastReason=clean(detail.reason||detail.source);
    record.lastTransitionAt=Number(detail.at)||Date.now();
    record.transitionCount=(record.transitionCount||0)+1;
    record.history.push({seq:++transitionSeq,action:action,state:nextState,reason:record.lastReason,at:record.lastTransitionAt});
    if(record.history.length>12)record.history.splice(0,record.history.length-12);
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_SURFACE_LIFECYCLE_V974',{detail:snapshotSurface(record)}));}catch(_e2){}
    return snapshotSurface(record);
  }
  function transition(name,action,detail){return applyTransition(name,action,detail,true);}
  function report(name,action,detail){return applyTransition(name,action,detail,false);}
  function listSurfaces(){
    var out={};
    Object.keys(surfaces).forEach(function(name){out[name]=snapshotSurface(surfaces[name]);});
    return out;
  }
  function getSurface(name){return snapshotSurface(surfaces[normalizeSurface(name)]);}
  function auditLifecycle(){
    var missing=[];
    Object.keys(surfaces).forEach(function(name){
      var lifecycle=surfaces[name]&&surfaces[name].lifecycle||{};
      REQUIRED_HOOKS.forEach(function(hook){if(typeof lifecycle[hook]!=='function')missing.push(name+':'+hook);});
    });
    return {version:VERSION,valid:missing.length===0,total:Object.keys(surfaces).length,requiredHooks:REQUIRED_HOOKS.slice(),missing:missing};
  }
  function frameForSource(source){
    var match=null;
    if(!source)return null;
    try{
      document.querySelectorAll('iframe').forEach(function(frame){
        if(!match&&frame.contentWindow===source)match=frame;
      });
    }catch(_e){}
    return match;
  }
  function receiveLifecycle(event){
    var data=event&&event.data;
    if(!data||typeof data!=='object')return;
    var type=clean(data.type);
    if(type!=='HAPPYAD_MODULE_LIFECYCLE_REGISTER_V974'&&type!=='HAPPYAD_MODULE_LIFECYCLE_STATE_V974')return;
    var frame=frameForSource(event.source);
    var known='';
    try{if(sourceToSurface&&event.source)known=sourceToSurface.get(event.source)||'';}catch(_e){}
    var derived=frame?surfaceFromFrame(frame):known;
    var claimed=normalizeSurface(data.surface);
    var name=derived||claimed;
    if(!name||!surfaces[name]||(!frame&&!known))return;
    if(frame){
      try{frame.__happyadRegistrySurfaceV974=name;}catch(_e2){}
      try{if(sourceToSurface&&event.source)sourceToSurface.set(event.source,name);}catch(_e3){}
    }
    var record=surfaces[name];
    record.connected=true;
    record.childVersion=clean(data.version)||record.childVersion||'';
    record.lastSeenAt=Date.now();
    if(type==='HAPPYAD_MODULE_LIFECYCLE_REGISTER_V974'){
      var childState=clean(data.state).toLowerCase();
      if(['mounted','active','suspended','unmounted'].indexOf(childState)>=0){
        record.state=childState;record.connected=childState!=='unmounted';
      }
      return;
    }
    report(name,clean(data.action).toLowerCase(),{reason:data.reason||data.source,source:data.source,at:data.at});
  }
  function rememberFrame(frame){
    var name=surfaceFromFrame(frame);
    if(name){
      try{frame.__happyadRegistrySurfaceV974=name;}catch(_e){}
      try{if(sourceToSurface&&frame.contentWindow)sourceToSurface.set(frame.contentWindow,name);}catch(_e2){}
      try{
        if(frame.contentWindow&&!frame.__happyadRegistryProbeV974){
          frame.__happyadRegistryProbeV974=true;
          frame.contentWindow.postMessage({type:'HAPPYAD_MODULE_LIFECYCLE_PROBE_V974',surface:name,source:VERSION,at:Date.now()},'*');
        }
      }catch(_e3){}
    }
  }
  function scanFrames(root){
    try{
      if(root&&root.tagName==='IFRAME')rememberFrame(root);
      if(root&&root.querySelectorAll)root.querySelectorAll('iframe').forEach(rememberFrame);
    }catch(_e){}
  }
  function markRemoved(root){
    try{
      var frames=[];
      if(root&&root.tagName==='IFRAME')frames.push(root);
      if(root&&root.querySelectorAll)root.querySelectorAll('iframe').forEach(function(frame){frames.push(frame);});
      frames.forEach(function(frame){
        var name=clean(frame.__happyadRegistrySurfaceV974)||surfaceFromFrame(frame);
        if(name&&surfaces[name]&&surfaces[name].state!=='unmounted')report(name,'unmount',{reason:'frame-removed',at:Date.now()});
      });
    }catch(_e){}
  }
  function observeFrames(){
    scanFrames(document);
    if(!window.MutationObserver)return;
    try{
      var observer=new MutationObserver(function(records){
        records.forEach(function(record){
          if(record.type==='attributes'){rememberFrame(record.target);return;}
          record.addedNodes&&Array.prototype.forEach.call(record.addedNodes,scanFrames);
          record.removedNodes&&Array.prototype.forEach.call(record.removedNodes,markRemoved);
        });
      });
      observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','data-happyad-page','data-happyad-src']});
    }catch(_e){}
  }

  definitions.forEach(function(definition){
    registerSurface(definition[0],{path:definition[1],kind:definition[2],lifecycle:defaultLifecycle(definition[0])});
  });
  report('home','mount',{reason:'registry-init',at:Date.now()});
  report('home','resume',{reason:'registry-init',at:Date.now()});

  window.addEventListener('message',receiveLifecycle,true);
  window.addEventListener('HAPPYAD_NAV_CHANGED_V586',function(event){
    var page=normalizeSurface(event&&event.detail&&event.detail.page)||'home';
    report('home',page==='home'?'resume':'suspend',{reason:'navigation-'+page,at:Date.now()});
  });
  window.addEventListener('pagehide',function(event){
    report('home',event&&event.persisted?'suspend':'unmount',{reason:event&&event.persisted?'pagehide-persisted':'pagehide',at:Date.now()});
  });
  window.addEventListener('pageshow',function(event){
    if(event&&event.persisted){report('home','mount',{reason:'pageshow-persisted',at:Date.now()});report('home','resume',{reason:'pageshow-persisted',at:Date.now()});}
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeFrames,{once:true});else observeFrames();

  window.HappyMasterRegistry={
    version:VERSION,
    register:register,
    list:list,
    get:get,
    registerSurface:registerSurface,
    listSurfaces:listSurfaces,
    getSurface:getSurface,
    transition:transition,
    mount:function(name,detail){return transition(name,'mount',detail);},
    resume:function(name,detail){return transition(name,'resume',detail);},
    suspend:function(name,detail){return transition(name,'suspend',detail);},
    unmount:function(name,detail){return transition(name,'unmount',detail);},
    auditLifecycle:auditLifecycle,
    note:'P1.02.09 : registre canonique unique des modules et des surfaces, avec mount/resume/suspend/unmount.'
  };
})();
