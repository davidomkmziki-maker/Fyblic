(function(){
  'use strict';
  if(window.__HAPPYAD_PHOTO_FULLSCREEN_ZOOM_MASTER_V637__)return;
  window.__HAPPYAD_PHOTO_FULLSCREEN_ZOOM_MASTER_V637__=true;

  var MAX_SCALE=4;
  var MIN_SCALE=1;
  var state={
    box:null,track:null,slide:null,img:null,index:-1,
    scale:1,tx:0,ty:0,gesture:null,
    suppressClickUntil:0,scrollRaf:0,observer:null
  };

  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function dist(a,b){var x=a.clientX-b.clientX,y=a.clientY-b.clientY;return Math.hypot(x,y);}
  function center(a,b){return {x:(a.clientX+b.clientX)/2,y:(a.clientY+b.clientY)/2};}
  function fullscreenBox(){return document.getElementById('happyadHomePhotoFullscreen');}
  function isOpen(box){return !!(box&&box.classList&&box.classList.contains('on'));}
  function closestSlide(el){return el&&el.closest?el.closest('#happyadHomePhotoFullscreen .haHomeFsAlbumSlide'):null;}
  function slideImage(slide){return slide&&slide.querySelector?slide.querySelector('img'):null;}
  function slideIndex(slide){var n=Number(slide&&slide.dataset&&slide.dataset.index);return isFinite(n)?n:-1;}

  function visibleSlide(track){
    if(!track)return null;
    var slides=[].slice.call(track.querySelectorAll('.haHomeFsAlbumSlide'));
    if(!slides.length)return null;
    var middle=track.scrollLeft+(track.clientWidth/2),best=slides[0],distance=Infinity;
    slides.forEach(function(sl){
      var d=Math.abs((sl.offsetLeft+sl.offsetWidth/2)-middle);
      if(d<distance){distance=d;best=sl;}
    });
    return best;
  }

  function touchSlide(ev){
    var touches=ev.touches||[];
    var x=0,y=0;
    if(touches.length>=2){x=(touches[0].clientX+touches[1].clientX)/2;y=(touches[0].clientY+touches[1].clientY)/2;}
    else if(touches.length===1){x=touches[0].clientX;y=touches[0].clientY;}
    var el=null;
    try{el=document.elementFromPoint(x,y);}catch(_e){}
    return closestSlide(el)||closestSlide(ev.target)||visibleSlide(state.track);
  }

  function bounds(scale,img,slide){
    var iw=Math.max(1,img&&img.offsetWidth||0),ih=Math.max(1,img&&img.offsetHeight||0);
    var sw=Math.max(1,slide&&slide.clientWidth||0),sh=Math.max(1,slide&&slide.clientHeight||0);
    return {
      x:Math.max(0,(iw*scale-sw)/2),
      y:Math.max(0,(ih*scale-sh)/2)
    };
  }

  function clampPan(){
    if(!state.img||!state.slide)return;
    var b=bounds(state.scale,state.img,state.slide);
    state.tx=clamp(state.tx,-b.x,b.x);
    state.ty=clamp(state.ty,-b.y,b.y);
  }

  function apply(animate){
    if(!state.img)return;
    clampPan();
    state.img.style.setProperty('transform-origin','50% 50%','important');
    state.img.style.setProperty('will-change','transform','important');
    state.img.style.setProperty('transition',animate?'transform .18s ease-out':'none','important');
    state.img.style.setProperty('transform','translate3d('+state.tx.toFixed(2)+'px,'+state.ty.toFixed(2)+'px,0) scale('+state.scale.toFixed(4)+')','important');
    if(state.box)state.box.classList.toggle('haPhotoFsZoomedV637',state.scale>1.01);
  }

  function clearImageStyle(img){
    if(!img)return;
    img.style.removeProperty('transform');
    img.style.removeProperty('transform-origin');
    img.style.removeProperty('will-change');
    img.style.removeProperty('transition');
  }

  function reset(animate){
    var img=state.img;
    if(img&&animate){
      state.scale=1;state.tx=0;state.ty=0;apply(true);
      setTimeout(function(){
        if(state.img===img&&state.scale===1)clearImageStyle(img);
      },210);
    }else if(img){clearImageStyle(img);}
    if(state.box)state.box.classList.remove('haPhotoFsZoomedV637');
    state.slide=null;state.img=null;state.index=-1;
    state.scale=1;state.tx=0;state.ty=0;state.gesture=null;
  }

  function select(slide){
    if(!slide)return false;
    var img=slideImage(slide);
    if(!img)return false;
    if(state.img&&state.img!==img)reset(false);
    state.slide=slide;state.img=img;state.index=slideIndex(slide);
    return true;
  }

  function stop(ev){
    try{if(ev.cancelable)ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}catch(_e){}
  }

  function beginPinch(ev){
    if(!isOpen(state.box)||!ev.touches||ev.touches.length!==2)return false;
    var slide=touchSlide(ev);if(!select(slide))return false;
    var a=ev.touches[0],b=ev.touches[1],c=center(a,b);
    var sr=slide.getBoundingClientRect();
    var cx=sr.left+sr.width/2,cy=sr.top+sr.height/2;
    state.gesture={
      type:'pinch',startDist:Math.max(1,dist(a,b)),startScale:state.scale,
      startTx:state.tx,startTy:state.ty,
      focalX:(c.x-cx-state.tx)/Math.max(state.scale,.001),
      focalY:(c.y-cy-state.ty)/Math.max(state.scale,.001),
      slideCx:cx,slideCy:cy,moved:false
    };
    state.img.style.setProperty('transition','none','important');
    stop(ev);return true;
  }

  function beginPan(ev){
    if(!isOpen(state.box)||state.scale<=1.01||!ev.touches||ev.touches.length!==1)return false;
    var slide=touchSlide(ev);if(!slide||slide!==state.slide||!state.img)return false;
    var t=ev.touches[0];
    state.gesture={type:'pan',x:t.clientX,y:t.clientY,moved:false};
    state.img.style.setProperty('transition','none','important');
    stop(ev);return true;
  }

  function onTouchStart(ev){
    state.box=fullscreenBox();if(!isOpen(state.box))return;
    state.track=state.box.querySelector('.haHomeFsAlbumTrack');
    if(!state.track||!ev.target||!ev.target.closest||!ev.target.closest('#happyadHomePhotoFullscreen .haHomeFsAlbumTrack'))return;
    if(ev.touches&&ev.touches.length===2){beginPinch(ev);return;}
    if(ev.touches&&ev.touches.length===1&&state.scale>1.01)beginPan(ev);
  }

  function onTouchMove(ev){
    var g=state.gesture;if(!g||!state.img||!state.slide)return;
    if(g.type==='pinch'&&ev.touches&&ev.touches.length>=2){
      var a=ev.touches[0],b=ev.touches[1],c=center(a,b);
      var next=clamp(g.startScale*(dist(a,b)/g.startDist),MIN_SCALE,MAX_SCALE);
      state.scale=next;
      state.tx=c.x-g.slideCx-g.focalX*next;
      state.ty=c.y-g.slideCy-g.focalY*next;
      g.moved=true;apply(false);state.suppressClickUntil=Date.now()+500;stop(ev);return;
    }
    if(g.type==='pan'&&ev.touches&&ev.touches.length===1){
      var t=ev.touches[0],dx=t.clientX-g.x,dy=t.clientY-g.y;
      if(Math.abs(dx)+Math.abs(dy)>1)g.moved=true;
      state.tx+=dx;state.ty+=dy;g.x=t.clientX;g.y=t.clientY;
      apply(false);state.suppressClickUntil=Date.now()+500;stop(ev);
    }
  }

  function onTouchEnd(ev){
    var g=state.gesture;if(!g)return;
    if(g.moved)state.suppressClickUntil=Date.now()+500;
    if(g.type==='pinch'&&ev.touches&&ev.touches.length===1&&state.scale>1.01){
      var t=ev.touches[0];state.gesture={type:'pan',x:t.clientX,y:t.clientY,moved:false};stop(ev);return;
    }
    if(ev.touches&&ev.touches.length)return;
    state.gesture=null;
    if(state.scale<=1.03)reset(true);else{apply(true);setTimeout(function(){if(state.img)state.img.style.setProperty('transition','none','important');},210);}
    if(g.moved)stop(ev);
  }

  function onClick(ev){
    if(!ev.target||!ev.target.closest)return;
    var inside=ev.target.closest('#happyadHomePhotoFullscreen .haHomeFsAlbumSlide img');
    if(!inside)return;
    if(Date.now()<state.suppressClickUntil||state.scale>1.01){
      ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
    }
  }

  function attachTrack(){
    var box=fullscreenBox();
    state.box=box;
    if(!box){state.track=null;return;}
    var track=box.querySelector('.haHomeFsAlbumTrack');
    if(box&&!box.__haFsZoomClassObserverV637){
      try{
        box.__haFsZoomClassObserverV637=new MutationObserver(function(){
          if(!isOpen(box)&&state.img)reset(false);
          if(isOpen(box))attachTrack();
        });
        box.__haFsZoomClassObserverV637.observe(box,{attributes:true,attributeFilter:['class'],childList:true,subtree:false});
      }catch(_boxObs){}
    }
    if(track===state.track)return;
    if(state.track&&state.track.__haFsZoomScrollV637){try{state.track.removeEventListener('scroll',state.track.__haFsZoomScrollV637);}catch(_e){}}
    state.track=track;
    if(!track)return;
    var last=slideIndex(visibleSlide(track));
    var handler=function(){
      if(state.scrollRaf)return;
      state.scrollRaf=requestAnimationFrame(function(){
        state.scrollRaf=0;
        var now=slideIndex(visibleSlide(track));
        if(now!==last){last=now;if(state.img)reset(false);}
      });
    };
    track.__haFsZoomScrollV637=handler;
    track.addEventListener('scroll',handler,{passive:true});
  }

  function sync(){
    var box=fullscreenBox();
    if(!box){reset(false);state.box=null;state.track=null;return;}
    state.box=box;attachTrack();
    if(!isOpen(box)&&state.img)reset(false);
  }

  document.addEventListener('touchstart',onTouchStart,{capture:true,passive:false});
  document.addEventListener('touchmove',onTouchMove,{capture:true,passive:false});
  document.addEventListener('touchend',onTouchEnd,{capture:true,passive:false});
  document.addEventListener('touchcancel',onTouchEnd,{capture:true,passive:false});
  document.addEventListener('click',onClick,true);
  window.addEventListener('resize',function(){if(state.img){clampPan();apply(false);}},false);

  function start(){sync();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

  window.HappyPhotoFullscreenZoomV637={
    version:'V637_FULLSCREEN_ONLY',
    reset:function(){reset(true);},
    getState:function(){return {scale:state.scale,tx:state.tx,ty:state.ty,index:state.index};}
  };
})();
