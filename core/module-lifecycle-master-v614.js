(function(){
  'use strict';
  if(window.__HAPPYAD_MODULE_LIFECYCLE_MASTER_V614__)return;
  window.__HAPPYAD_MODULE_LIFECYCLE_MASTER_V614__=true;

  var VERSION='MODULE_LIFECYCLE_V974_P1_02_09';
  var nativeSetInterval=window.setInterval.bind(window);
  var nativeClearInterval=window.clearInterval.bind(window);
  var nativeClearTimeout=window.clearTimeout.bind(window);
  var NativeMutationObserver=window.MutationObserver;
  var intervalSeq=614000000;
  var intervals=new Map();
  var observers=new Set();
  var state='new';
  var suspended=false;
  var unmounted=false;
  var suspendedAt=0;
  var resumeAfterVisibility=false;
  var resumeAfterPageShow=false;
  var aliases={
    'my-profile':'profile',
    'visitor-profile':'profile_public',
    'message-center':'message',
    'notification-center':'notifications',
    'profile-edit':'profile_edit',
    'profile-stats':'profile_stats',
    'share-center':'share',
    'happyad-chat':'chat'
  };

  function clean(value){return String(value==null?'':value).trim();}
  function normalizeSurface(value){
    var name=clean(value).toLowerCase();
    if(!name)return '';
    try{name=decodeURIComponent(name);}catch(_e){}
    name=name.split('#')[0].split('?')[0].replace(/\\/g,'/').replace(/^.*\//,'').replace(/\.html?$/,'');
    name=name.replace(/[^a-z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
    return aliases[name]||name;
  }
  var surface=(function(){
    try{return normalizeSurface(location.pathname)||'module';}catch(_e){return 'module';}
  })();
  function setSurface(value){var next=normalizeSurface(value);if(next)surface=next;return surface;}
  function safeCall(fn,args){
    try{
      if(typeof fn==='function')return fn.apply(window,args||[]);
      if(typeof fn==='string')return (0,eval)(fn);
    }catch(err){try{console.warn('Fyblic lifecycle interval',err);}catch(_e){}}
  }
  function startInterval(rec){
    if(!rec||!rec.enabled||suspended||unmounted||rec.nativeId!=null)return;
    rec.nativeId=nativeSetInterval(function(){safeCall(rec.fn,rec.args);},Math.max(16,Number(rec.delay)||0));
  }
  window.setInterval=function(fn,delay){
    var args=Array.prototype.slice.call(arguments,2);
    var token=++intervalSeq;
    var rec={token:token,fn:fn,delay:delay,args:args,enabled:true,nativeId:null};
    intervals.set(token,rec);
    startInterval(rec);
    return token;
  };
  window.clearInterval=function(id){
    var rec=intervals.get(id);
    if(rec){
      rec.enabled=false;
      if(rec.nativeId!=null){try{nativeClearInterval(rec.nativeId);}catch(_e){}rec.nativeId=null;}
      intervals.delete(id);
      return;
    }
    try{nativeClearInterval(id);}catch(_e){}
  };
  window.clearTimeout=function(id){
    if(intervals.has(id)){window.clearInterval(id);return;}
    try{nativeClearTimeout(id);}catch(_e){}
  };

  if(NativeMutationObserver){
    function ManagedMutationObserver(callback){
      var nativeObserver=new NativeMutationObserver(callback);
      var records=[];
      var originalObserve=nativeObserver.observe.bind(nativeObserver);
      var originalDisconnect=nativeObserver.disconnect.bind(nativeObserver);
      nativeObserver.observe=function(target,options){
        records.push({target:target,options:options});
        observers.add(nativeObserver);
        if(!suspended&&!unmounted)return originalObserve(target,options);
      };
      nativeObserver.disconnect=function(){records.length=0;observers.delete(nativeObserver);return originalDisconnect();};
      nativeObserver.__happyadLifecyclePause=function(){try{originalDisconnect();}catch(_e){}};
      nativeObserver.__happyadLifecycleResume=function(){
        records.forEach(function(item){
          try{if(item.target&&item.target.isConnected!==false)originalObserve(item.target,item.options);}catch(_e){}
        });
      };
      nativeObserver.__happyadLifecycleDispose=function(){records.length=0;try{originalDisconnect();}catch(_e){}};
      return nativeObserver;
    }
    ManagedMutationObserver.prototype=NativeMutationObserver.prototype;
    try{Object.setPrototypeOf(ManagedMutationObserver,NativeMutationObserver);}catch(_e){}
    window.MutationObserver=ManagedMutationObserver;
  }

  function pauseMedia(){
    try{
      document.querySelectorAll('video,audio').forEach(function(media){
        try{media.pause();}catch(_e){}
      });
    }catch(_e){}
  }
  function setCssPaused(on){
    try{
      var root=document.documentElement;
      if(root)root.classList.toggle('happyadModuleSuspendedV614',!!on);
      var st=document.getElementById('happyadModuleLifecycleStyleV614');
      if(!st){
        st=document.createElement('style');
        st.id='happyadModuleLifecycleStyleV614';
        st.textContent='html.happyadModuleSuspendedV614 *,html.happyadModuleSuspendedV614 *:before,html.happyadModuleSuspendedV614 *:after{animation-play-state:paused!important;}';
        (document.head||document.documentElement).appendChild(st);
      }
    }catch(_e){}
  }
  function post(type,payload){
    try{
      if(!window.parent||window.parent===window)return false;
      window.parent.postMessage(Object.assign({type:type,surface:surface,version:VERSION,at:Date.now()},payload||{}),'*');
      return true;
    }catch(_e){return false;}
  }
  function reportRegistration(){
    post('HAPPYAD_MODULE_LIFECYCLE_REGISTER_V974',{state:state,hooks:['mount','resume','suspend','unmount'],path:String(location.pathname||'')});
  }
  function report(action,reason,extra){
    post('HAPPYAD_MODULE_LIFECYCLE_STATE_V974',Object.assign({action:action,state:state,reason:clean(reason)},extra||{}));
  }
  function emit(name,detail){
    try{window.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));}catch(_e){}
  }
  function mount(reason){
    if(state==='mounted'||state==='active'||state==='suspended')return false;
    unmounted=false;suspended=false;state='mounted';
    setCssPaused(false);
    var detail={surface:surface,reason:clean(reason),at:Date.now()};
    emit('HAPPYAD_MODULE_MOUNT_V974',detail);
    report('mount',reason);
    return true;
  }
  function suspend(reason){
    if(unmounted||state==='unmounted')return false;
    if(state==='new')mount('before-suspend');
    if(suspended||state==='suspended'){pauseMedia();return false;}
    suspended=true;state='suspended';suspendedAt=Date.now();
    intervals.forEach(function(rec){
      if(rec.nativeId!=null){try{nativeClearInterval(rec.nativeId);}catch(_e){}rec.nativeId=null;}
    });
    observers.forEach(function(observer){try{observer.__happyadLifecyclePause&&observer.__happyadLifecyclePause();}catch(_e){}});
    pauseMedia();setCssPaused(true);
    var detail={surface:surface,reason:clean(reason),at:suspendedAt};
    emit('HAPPYAD_MODULE_SUSPEND_V614',detail);
    report('suspend',reason);
    return true;
  }
  function resume(reason){
    if(state==='new'||unmounted||state==='unmounted')mount('before-resume');
    if(state==='active'&&!suspended){setCssPaused(false);return false;}
    var hiddenMs=suspendedAt?Math.max(0,Date.now()-suspendedAt):0;
    suspended=false;unmounted=false;state='active';
    setCssPaused(false);
    observers.forEach(function(observer){try{observer.__happyadLifecycleResume&&observer.__happyadLifecycleResume();}catch(_e){}});
    intervals.forEach(startInterval);
    var detail={surface:surface,reason:clean(reason),hiddenMs:hiddenMs,at:Date.now()};
    emit('HAPPYAD_MODULE_RESUME_V614',detail);
    report('resume',reason,{hiddenMs:hiddenMs});
    return true;
  }
  function unmount(reason){
    if(unmounted||state==='unmounted')return false;
    unmounted=true;suspended=true;state='unmounted';
    intervals.forEach(function(rec){
      rec.enabled=false;
      if(rec.nativeId!=null){try{nativeClearInterval(rec.nativeId);}catch(_e){}rec.nativeId=null;}
    });
    intervals.clear();
    observers.forEach(function(observer){try{observer.__happyadLifecycleDispose&&observer.__happyadLifecycleDispose();}catch(_e){}});
    observers.clear();
    pauseMedia();setCssPaused(true);
    var detail={surface:surface,reason:clean(reason),at:Date.now()};
    emit('HAPPYAD_MODULE_UNMOUNT_V974',detail);
    report('unmount',reason);
    return true;
  }
  function status(){
    return {version:VERSION,surface:surface,state:state,mounted:state!=='new'&&state!=='unmounted',suspended:suspended,unmounted:unmounted,intervals:intervals.size,observers:observers.size,hooks:{mount:true,resume:true,suspend:true,unmount:true}};
  }

  window.addEventListener('message',function(event){
    try{if(window.parent!==window&&event.source&&event.source!==window.parent)return;}catch(_source){}
    var data=event&&event.data;
    var type=typeof data==='string'?data:clean(data&&data.type);
    if(data&&data.page)setSurface(data.page);
    if(type==='HAPPYAD_MODULE_LIFECYCLE_PROBE_V974'){reportRegistration();return;}
    if(type==='HAPPYAD_MODULE_MOUNT'){mount(data&&data.reason||type);return;}
    if(type==='HAPPYAD_APP_FRAME_HIDDEN'||type==='HAPPYAD_MODULE_SUSPEND'||type==='HAPPYAD_PAUSE_ALL_MEDIA'||type==='HAPPYAD_STOP_MEDIA'){
      if(type==='HAPPYAD_APP_FRAME_HIDDEN'||type==='HAPPYAD_MODULE_SUSPEND'){
        resumeAfterVisibility=false;resumeAfterPageShow=false;
      }
      suspend(data&&data.reason||type);
      return;
    }
    if(type==='HAPPYAD_APP_FRAME_VISIBLE'||type==='HAPPYAD_MODULE_RESUME'){
      if(document.visibilityState==='hidden'){
        if(state==='new'||unmounted||state==='unmounted')mount('visible-while-document-hidden');
        resumeAfterVisibility=true;suspend('visible-while-document-hidden');
        return;
      }
      resume(data&&data.source||data&&data.reason||type);
      return;
    }
    if(type==='HAPPYAD_MODULE_UNMOUNT')unmount(data&&data.reason||type);
  },true);

  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='hidden'){
      resumeAfterVisibility=state==='active';
      if(resumeAfterVisibility)suspend('document-hidden');
    }else if(resumeAfterVisibility){
      resumeAfterVisibility=false;resume('document-visible');
    }
  });
  window.addEventListener('pagehide',function(event){
    resumeAfterPageShow=!!(event&&event.persisted&&state==='active');
    if(event&&event.persisted)suspend('pagehide-persisted');else unmount('pagehide');
  });
  window.addEventListener('beforeunload',function(){unmount('beforeunload');});
  window.addEventListener('pageshow',function(event){
    if(event&&event.persisted&&resumeAfterPageShow){resumeAfterPageShow=false;resume('pageshow-persisted');}
    reportRegistration();
  });

  window.HappyModuleLifecycleV614={version:VERSION,mount:mount,resume:resume,suspend:suspend,unmount:unmount,status:status};
  mount('script-init');
  if(document.visibilityState==='hidden'){
    resumeAfterVisibility=true;suspend('script-init-hidden');
  }else resume('script-init');
  reportRegistration();
})();
