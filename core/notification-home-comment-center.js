(function(){
  'use strict';
  if(window.__HAPPYAD_NOTIFICATION_HOME_MEDIA_ROUTE_V548__)return;
  window.__HAPPYAD_NOTIFICATION_HOME_MEDIA_ROUTE_V548__=true;

  var HISTORY_FLAG='__happyadNotificationHomeCommentV545';
  var POST_HISTORY_FLAG='__happyadNotificationHomePostV547';
  var NOTIFICATION_HISTORY_FLAG='__happyadNotificationCenter';
  var active=false;
  var closingFromPop=false;
  var baseClose=null;
  var currentRequest=null;
  var POST_LAYER_V927='notification-home-post-v927';
  var COMMENT_LAYER_V927='notification-home-comment-v927';

  function clean(v){return String(v==null?'':v).trim();}
  function cssEscape(v){
    try{return window.CSS&&CSS.escape?CSS.escape(String(v)):String(v).replace(/[^a-zA-Z0-9_-]/g,'\\$&');}
    catch(_e){return String(v||'');}
  }
  function cloneState(raw){
    var next={};
    try{Object.keys(raw||{}).forEach(function(k){next[k]=raw[k];});}catch(_e){}
    return next;
  }
  function returnControllerV927(){return window.HappyInternalReturnV694||window.HappyInternalReturnV591||null;}
  function closePostLayerV927(){try{var c=returnControllerV927();if(c)c.close(POST_LAYER_V927);}catch(_e){}return true;}
  function ensurePostLayerV927(){
    try{
      var c=returnControllerV927();
      /* Cette entrée mémorise Retour vers Notifications, mais la publication
         reste une vraie surface Accueil : aucun verrou global et aucun masque
         du dock ne doivent accompagner cette sentinelle d'historique. */
      if(c&&typeof c.open==='function')return c.open(POST_LAYER_V927,{onBack:closePostLayerV927,passive:true,blocksSurface:false,lockScroll:false});
    }catch(_e){}
    return false;
  }
  function closeCommentFromReturnV927(){
    closingFromPop=true;
    try{if(typeof baseClose==='function')baseClose();}catch(_e){}
    active=false;currentRequest=null;
    try{var c=returnControllerV927();if(c)c.close(COMMENT_LAYER_V927);}catch(_e2){}
    closingFromPop=false;
    return true;
  }
  function installRouteStyle(){
    if(document.getElementById('happyadNotificationMediaRouteV548Style'))return;
    var st=document.createElement('style');
    st.id='happyadNotificationMediaRouteV548Style';
    st.textContent='[data-post-id].happyadNotificationPostTargetV548{outline:2px solid rgba(45,137,255,.92)!important;outline-offset:3px!important;box-shadow:0 0 0 5px rgba(45,137,255,.16)!important;transition:box-shadow .25s ease,outline-color .25s ease!important;}';
    (document.head||document.documentElement).appendChild(st);
  }
  function allPosts(){
    try{if(typeof ALL_POSTS!=='undefined'&&Array.isArray(ALL_POSTS))return ALL_POSTS;}catch(_e){}
    try{if(Array.isArray(window.ALL_POSTS))return window.ALL_POSTS;}catch(_e){}
    return [];
  }
  function findLocal(postId){
    postId=clean(postId);
    var arr=allPosts();
    for(var i=0;i<arr.length;i++){
      if(String(arr[i]&&arr[i].id)===postId)return arr[i];
    }
    var keys=['HAPPYAD_GLOBAL_POSTS_CACHE_V1','HAPPYAD_PUBLISH_POSTS_V2','HAPPYAD_HOME_POSTS_CACHE_V1','HAPPYAD_ALL_POSTS_V1'];
    for(var k=0;k<keys.length;k++){
      try{
        var raw=JSON.parse(localStorage.getItem(keys[k])||'[]');
        var list=Array.isArray(raw)?raw:(raw&&Array.isArray(raw.posts)?raw.posts:[]);
        for(var j=0;j<list.length;j++){
          if(String(list[j]&&list[j].id)===postId)return list[j];
        }
      }catch(_e){}
    }
    return null;
  }
  async function resolvePost(postId){
    var local=findLocal(postId);
    if(local)return local;
    try{
      var c=typeof happyadSb==='function'?happyadSb():null;
      if(c&&typeof c.from==='function'){
        var r=await c.from('happyad_posts').select('*').eq('id',postId).maybeSingle();
        if(r&&!r.error&&r.data){
          var mapped=typeof mapHappyPost==='function'?mapHappyPost(r.data):r.data;
          try{
            if(typeof ALL_POSTS!=='undefined'&&Array.isArray(ALL_POSTS)){
              var exists=ALL_POSTS.some(function(x){return String(x&&x.id)===String(postId);});
              if(!exists)ALL_POSTS.unshift(mapped);
            }
          }catch(_e){}
          try{if(typeof render==='function')render();}catch(_e){}
          return mapped;
        }
      }
    }catch(_e){}
    return null;
  }
  function contentType(post,requested){
    var v=clean(requested||post&&(
      post.media_type||post.home_media_type||post.kind||post.type||post.post_type
    )).toLowerCase();
    return /video|reel|clip|mp4|webm|mov/.test(v)?'video':'photo';
  }
  function revealTarget(commentId,attempt){
    commentId=clean(commentId);
    attempt=Number(attempt||0);
    if(!commentId)return false;
    var box=document.getElementById('happyadHomeCommentPopup');
    var list=box&&box.querySelector('.haCommentList');
    var target=list&&list.querySelector('[data-comment-id="'+cssEscape(commentId)+'"]');
    if(target){
      var hidden=target.closest('.haCommentRepliesHidden[hidden]');
      while(hidden){
        hidden.hidden=false;
        var parentItem=hidden.closest('.haCommentItem');
        if(parentItem){
          var more=parentItem.querySelector('.haCommentMoreReplies');
          if(more)more.textContent='Masquer les réponses';
        }
        hidden=target.closest('.haCommentRepliesHidden[hidden]');
      }
      try{
        target.classList.remove('happyadNotificationCommentTargetV545');
        void target.offsetWidth;
        target.classList.add('happyadNotificationCommentTargetV545');
        target.scrollIntoView({block:'center',inline:'nearest',behavior:attempt>2?'auto':'smooth'});
        setTimeout(function(){try{target.classList.remove('happyadNotificationCommentTargetV545');}catch(_e){}},5200);
      }catch(_e){}
      return true;
    }
    if(attempt<40)setTimeout(function(){revealTarget(commentId,attempt+1);},125);
    return false;
  }
  function pushHistory(detail){
    ensurePostLayerV927();
    try{var c=returnControllerV927();if(c&&typeof c.open==='function')c.open(COMMENT_LAYER_V927,{onBack:closeCommentFromReturnV927});}catch(_e){}
  }
  function publicationHistoryState(detail){
    detail=detail||{};
    var next=cloneState(history.state||{});
    delete next[HISTORY_FLAG];
    delete next[NOTIFICATION_HISTORY_FLAG];
    next[POST_HISTORY_FLAG]=true;
    next.view='home_post';
    next.postId=clean(detail.postId||detail.post_id||detail.publicationId||detail.publication_id||next.postId);
    next.commentId='';
    next.returnTo='notification_center';
    next.source=clean(detail.source)||'notification-home-post';
    next.ts=Date.now();
    return next;
  }
  function keepPublicationVisible(detail,historyAlreadyPopped){
    var next=publicationHistoryState(detail||{});
    try{var c=returnControllerV927();if(c)c.close(COMMENT_LAYER_V927);}catch(_e){}
    var postId=clean(next.postId);
    if(postId){
      setTimeout(function(){
        try{
          var card=document.querySelector('[data-post-id="'+cssEscape(postId)+'"]');
          if(card&&card.scrollIntoView)card.scrollIntoView({block:'center',inline:'nearest',behavior:'auto'});
        }catch(_e){}
      },0);
    }
  }
  function finishCloseToPublication(detail,historyAlreadyPopped){
    active=false;
    currentRequest=null;
    keepPublicationVisible(detail||{},!!historyAlreadyPopped);
  }
  function scrollToPost(postId,attempt){
    postId=clean(postId);
    attempt=Number(attempt||0);
    if(!postId)return false;
    try{
      var card=document.querySelector('[data-post-id="'+cssEscape(postId)+'"]');
      if(card&&card.scrollIntoView){
        card.scrollIntoView({block:'center',inline:'nearest',behavior:attempt>2?'auto':'smooth'});
        card.classList.remove('happyadNotificationPostTargetV548');
        void card.offsetWidth;
        card.classList.add('happyadNotificationPostTargetV548');
        setTimeout(function(){try{card.classList.remove('happyadNotificationPostTargetV548');}catch(_e){}},2600);
        return true;
      }
    }catch(_e){}
    if(attempt<35)setTimeout(function(){scrollToPost(postId,attempt+1);},120);
    return false;
  }
  async function openPost(detail){
    detail=detail&&detail.detail?detail.detail:(detail||{});
    var postId=clean(detail.postId||detail.post_id||detail.publicationId||detail.publication_id);
    if(!postId)return false;

    active=false;
    currentRequest=null;
    var post=await resolvePost(postId);
    if(!post){
      try{if(typeof toast==='function')toast('Publication introuvable.');}catch(_e){}
      try{if(window.HappyNotificationReturnCenter)window.HappyNotificationReturnCenter.open({source:'home-post-not-found',fromPop:true});}catch(_e){}
      return false;
    }

    try{if(typeof render==='function')render();}catch(_e){}
    try{
      if(window.HappyNotificationReturnCenter&&typeof window.HappyNotificationReturnCenter.handoff==='function'){
        window.HappyNotificationReturnCenter.handoff('home-photo-post');
      }
    }catch(_e){}

    var next=publicationHistoryState(Object.assign({},detail,{postId:postId,source:'notification-photo-home'}));
    ensurePostLayerV927();
    scrollToPost(postId,0);
    return true;
  }
  function installCloseWrapper(){
    if(baseClose||typeof window.happyadCloseHomeCommentPopupV468!=='function')return;
    baseClose=window.happyadCloseHomeCommentPopupV468;
    var wrapped=function(){
      var wasActive=active;
      var request=currentRequest||{};
      var r=baseClose.apply(this,arguments);
      if(wasActive&&!closingFromPop){
        finishCloseToPublication(request,false);
      }
      return r;
    };
    window.happyadCloseHomeCommentPopupV468=wrapped;
    try{happyadCloseHomeCommentPopupV468=wrapped;}catch(_e){}
  }
  async function open(detail){
    detail=detail&&detail.detail?detail.detail:(detail||{});
    var postId=clean(detail.postId||detail.post_id||detail.publicationId||detail.publication_id);
    var commentId=clean(detail.commentId||detail.comment_id);
    if(!postId)return false;

    installCloseWrapper();
    currentRequest=detail;
    active=true;

    var post=await resolvePost(postId);
    if(!post){
      active=false;
      currentRequest=null;
      try{if(typeof toast==='function')toast('Publication introuvable.');}catch(_e){}
      try{
        if(window.HappyNotificationReturnCenter){
          window.HappyNotificationReturnCenter.open({source:'home-comment-not-found',fromPop:true});
        }
      }catch(_e){}
      return false;
    }

    try{
      var card=document.querySelector('[data-post-id="'+cssEscape(postId)+'"]');
      if(card&&card.scrollIntoView)card.scrollIntoView({block:'center',inline:'nearest',behavior:'auto'});
    }catch(_e){}

    pushHistory({postId:postId,commentId:commentId});

    try{
      if(typeof window.happyadOpenHomeCommentPopupV468==='function'){
        window.happyadOpenHomeCommentPopupV468(post,contentType(post,detail.publicationType||detail.publication_type));
        if(commentId)revealTarget(commentId,0);
        return true;
      }
    }catch(_e){}

    active=false;
    currentRequest=null;
    return false;
  }
  /* V584: ancien popstate notification/commentaire supprimé. */

  window.happyadOpenHomeCommentFromNotificationV545=open;
  window.happyadOpenHomeCommentFromNotificationV547=open;
  window.happyadOpenHomePostFromNotificationV548=openPost;
  window.HappyNotificationHomeCommentCenter={
    version:'V929_NOTIFICATION_POST_PASSIVE_ROUTE',
    open:open,
    openPost:openPost,
    active:function(){return active;},
    current:function(){return currentRequest;}
  };

  installRouteStyle();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){installRouteStyle();installCloseWrapper();},{once:true});
  else installCloseWrapper();
  setTimeout(installCloseWrapper,500);
})();
