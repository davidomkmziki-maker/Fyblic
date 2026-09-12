/* Fyblic V851R7 — maître clavier dédupliqué + jointure Android opaque. */
(function(){
  'use strict';
  if(window.__HAPPYAD_KEYBOARD_SURFACE_MASTER_V851R7__)return;
  window.__HAPPYAD_KEYBOARD_SURFACE_MASTER_V851R7__=true;

  var VERSION='HAPPYAD_V855R93_KEYBOARD_HOME_SCROLL_SILENT';
  var ROOT_CLASS='happyadKeyboardSurfaceOpenV851R2';
  var MANAGED_CLASS='happyadKeyboardSurfaceManagedV851R2';
  var lockY=0;
  var locked=false;
  var baselineHeight=0;
  var raf=0;
  var lastPayload='';
  var framePayloads=new WeakMap();
  var forceFramePost=true;

  function root(){return document.documentElement;}
  function byId(id){return document.getElementById(id);}
  function visible(node){
    if(!node)return false;
    try{
      var cs=getComputedStyle(node);
      return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0;
    }catch(_e){return true;}
  }
  function activeMessageSurface(){
    var shell=byId('happyadAppShell');
    if(!shell||!shell.classList.contains('on')||!visible(shell))return null;
    var frame=byId('happyadAppFrame_message')||shell.querySelector('.happyadAppFrame.on[data-happyad-page="message"]');
    if(!frame||!frame.classList.contains('on')||!visible(frame))return null;
    /* La liste des conversations conserve le dock principal V851R1.
       Le plein viewport clavier ne s'active que dans une conversation privée. */
    try{
      var chatView=frame.contentDocument&&frame.contentDocument.getElementById('chatView');
      if(!chatView||chatView.classList.contains('hidden')||getComputedStyle(chatView).display==='none')return null;
    }catch(_e){return null;}
    return {surface:shell,frame:frame,kind:'message'};
  }
  function activeChatSurface(){
    var host=byId('happyadChatHostV795');
    if(!host||!host.classList.contains('happyadChatHostOpenV795')||!visible(host))return null;
    return {surface:host,frame:byId('happyadChatFrameV795'),kind:'chat'};
  }
  function activeAssistanceSurface(){
    var host=byId('happyadAssistanceHostV738');
    if(!host||!host.classList.contains('show')||host.classList.contains('closing')||!visible(host))return null;
    return {surface:host,frame:byId('happyadAssistanceFrameV738'),kind:'assistance'};
  }
  function surfaces(){
    return [activeMessageSurface(),activeChatSurface(),activeAssistanceSurface()].filter(Boolean);
  }
  function lockParent(){
    if(locked)return;
    locked=true;
    lockY=Math.max(0,Math.round(window.scrollY||document.documentElement.scrollTop||0));
    root().style.setProperty('--happyad-parent-scroll-lock-v851r2',(-lockY)+'px');
    root().classList.add(ROOT_CLASS);
    document.body&&document.body.classList.add(ROOT_CLASS);
  }
  function unlockParent(){
    if(!locked)return;
    locked=false;
    root().classList.remove(ROOT_CLASS);
    document.body&&document.body.classList.remove(ROOT_CLASS);
    root().style.removeProperty('--happyad-parent-scroll-lock-v851r2');
    try{window.scrollTo(0,lockY);}catch(_e){}
  }
  function viewportMetrics(active){
    var vv=window.visualViewport;
    var inner=Math.max(320,Math.ceil(window.innerHeight||document.documentElement.clientHeight||0));
    if(!baselineHeight||inner>baselineHeight)baselineHeight=inner;
    var vvHeight=Math.max(320,Math.ceil(vv&&vv.height||inner));
    var vvTop=Math.max(0,Math.floor(vv&&vv.offsetTop||0));
    /* interactive-widget=resizes-content : innerHeight diminue, top reste zéro.
       Fallback anciens Chrome : innerHeight reste grand, visualViewport diminue/pan. */
    var contentResized=active&&baselineHeight-inner>80;
    var visualResized=active&&baselineHeight-vvHeight>80;
    var height=contentResized?inner:(visualResized?vvHeight:inner);
    var top=contentResized?0:(visualResized?vvTop:0);
    return {height:height,top:top,keyboardOpen:!!(active&&(contentResized||visualResized)),baseline:baselineHeight};
  }
  function postToFrame(item,metrics){
    var frame=item&&item.frame;
    if(!frame||!frame.contentWindow)return;
    try{
      frame.contentWindow.postMessage({
        type:'HAPPYAD_KEYBOARD_VIEWPORT_V851R2',
        detail:{
          version:VERSION,
          kind:item.kind,
          height:metrics.height,
          top:0,
          keyboardOpen:metrics.keyboardOpen,
          baseline:metrics.baseline
        }
      },location.origin);
    }catch(_e){
      try{frame.contentWindow.postMessage({type:'HAPPYAD_KEYBOARD_VIEWPORT_V851R2',detail:metrics},'*');}catch(_e2){}
    }
  }
  function apply(){
    raf=0;
    var list=surfaces();
    var active=list.length>0;
    if(active)lockParent();else unlockParent();
    var metrics=viewportMetrics(active);
    root().style.setProperty('--happyad-keyboard-surface-top-v851r2',metrics.top+'px');
    root().style.setProperty('--happyad-keyboard-surface-height-v851r2',metrics.height+'px');
    /* Chrome Android peut laisser une jointure subpixel entre la surface fixe et
       le clavier. Le parent reçoit une petite zone opaque hors mise en page ;
       l'iframe garde exactement la hauteur utile calculée. */
    root().style.setProperty('--happyad-keyboard-seam-cover-v851r7',metrics.keyboardOpen?'3px':'0px');

    var activeNodes=list.map(function(item){return item.surface;});
    ['happyadAppShell','happyadChatHostV795','happyadAssistanceHostV738'].forEach(function(id){
      var node=byId(id);if(node)node.classList.toggle(MANAGED_CLASS,activeNodes.indexOf(node)>=0);
    });
    /* V851R5 : chaque iframe reçoit le viewport seulement quand sa géométrie
       change, ou après son propre redémarrage. Le contrôle périodique de sécurité
       ne doit plus produire quatre recalages du fil Messages toutes les 500 ms. */
    list.forEach(function(item){
      var framePayload=[item.kind,metrics.height,metrics.top,metrics.keyboardOpen,metrics.baseline].join('|');
      if(forceFramePost||framePayloads.get(item.frame)!==framePayload){
        postToFrame(item,metrics);
        framePayloads.set(item.frame,framePayload);
      }
    });
    forceFramePost=false;
    var payload=[active,metrics.height,metrics.top,metrics.keyboardOpen,list.map(function(x){return x.kind;}).join(',')].join('|');
    if(payload!==lastPayload){
      lastPayload=payload;
      try{window.dispatchEvent(new CustomEvent('HAPPYAD_KEYBOARD_SURFACE_V851R2',{detail:{active:active,metrics:metrics,kinds:list.map(function(x){return x.kind;})}}));}catch(_e){}
    }
    if(locked){
      try{window.scrollTo(0,lockY);}catch(_e){}
    }
  }
  function schedule(){
    if(raf)return;
    raf=requestAnimationFrame(apply);
  }
  function patchViewportMeta(){
    try{
      var meta=document.querySelector('meta[name="viewport"]');
      if(!meta)return;
      var value=String(meta.getAttribute('content')||'');
      if(!/viewport-fit\s*=\s*cover/i.test(value))value+=',viewport-fit=cover';
      if(!/interactive-widget\s*=\s*resizes-content/i.test(value))value+=',interactive-widget=resizes-content';
      meta.setAttribute('content',value.replace(/^,|,,+/g,',').replace(/^,/,''));
    }catch(_e){}
  }
  function start(){
    patchViewportMeta();
    schedule();
    try{
      new MutationObserver(function(mutations){
        var relevant=false,frameSrc=false;
        (mutations||[]).forEach(function(mutation){
          var target=mutation&&mutation.target;
          try{if(target&&target.nodeType===1&&target.closest&&target.closest('#list'))return;}catch(_home){}
          relevant=true;
          if(mutation&&mutation.attributeName==='src'&&target&&String(target.tagName||'').toUpperCase()==='IFRAME')frameSrc=true;
        });
        if(!relevant)return;
        if(frameSrc)forceFramePost=true;
        schedule();
      }).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['class','src']});
    }catch(_e){}
    ['resize','pageshow','focusin','focusout'].forEach(function(name){window.addEventListener(name,schedule,{passive:true});});
    window.addEventListener('orientationchange',function(){baselineHeight=0;schedule();},{passive:true});
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize',schedule,{passive:true});
      window.visualViewport.addEventListener('scroll',schedule,{passive:true});
    }
    window.addEventListener('message',function(event){
      var data=event&&event.data||{};
      if(data.type==='HAPPYAD_FRAME_BOOTSTRAP_READY_V623'||data.type==='HAPPYAD_CHAT_READY'||data.type==='HAPPYAD_ASSISTANCE_V757_READY'||data.type==='HAPPYAD_INTERNAL_SCREEN_OPEN_V591'||(data.type==='HAPPYAD_INTERNAL_SCREEN_CLOSE_V591'||data.type==='HAPPYAD_INTERNAL_SCREEN_CLOSED_V591')){
        forceFramePost=true;
        schedule();
      }
    },true);
    setInterval(function(){if(surfaces().length||locked)schedule();},500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.HappyadKeyboardSurfaceV851R2={version:VERSION,refresh:function(){forceFramePost=true;schedule();}};
  window.HappyadKeyboardSurfaceV851R7=window.HappyadKeyboardSurfaceV851R2;
})();
