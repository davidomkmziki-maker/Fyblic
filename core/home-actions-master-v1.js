/* Fyblic HOME ACTIONS MASTER V1
   Responsabilité unique : état des actions et compteurs de l'Accueil.
   - Aucun tri / aucune pagination du feed.
   - Aucun rendu/reconstruction de carte : mise à jour ciblée des nœuds existants.
   - Aucun texte de commentaire chargé pour une carte fermée.
   - Les commentaires détaillés sont chargés séparément, uniquement à l'ouverture.
*/
(function(){
  'use strict';
  if(window.HappyHomeActionsV1)return;

  var VERSION='V995_LIKE_STATE_NETWORK_RESILIENT';
  var KEY='HAPPYAD_VIDEO_ACTIONS_V1';
  var bridge=null;
  var memory=null;
  var cards=Object.create(null);
  var pending=Object.create(null);
  var loads=Object.create(null);
  var loadedAt=Object.create(null);
  var mutations=Object.create(null);
  var refreshTimers=Object.create(null);
  var countTimers=Object.create(null);
  var commentCountAt=Object.create(null);
  var commentCountValue=Object.create(null);
  var commentCountLoads=Object.create(null);
  var likeRetryTimers=Object.create(null);
  var visibleAt=new Map();
  var batchState={key:'',at:0,promise:null};
  var realtimeStarted=false;
  var realtimeDirty=Object.create(null);
  var storageBound=false;
  var authBound=false;
  var authEpoch=0;
  var activeAuthUid='';
  var authHydrateSeqV939=0;
  var persistTimer=0;

  function connect(adapter){
    bridge=adapter||null;
    try{if(!activeAuthUid&&localStorage.getItem('HAPPYAD_SESSION_ACTIVE')==='1')activeAuthUid=String(localStorage.getItem('HAPPYAD_AUTH_UID')||'').trim();}catch(_uid){}
    bindStorage();
    bindAuthStateV938();
    return api;
  }
  function b(name){return bridge&&typeof bridge[name]==='function'?bridge[name]:null;}
  function call(name){var fn=b(name);if(!fn)return undefined;return fn.apply(bridge,[].slice.call(arguments,1));}
  function sb(){return call('supabase')||null;}
  function allPosts(){var x=call('posts');return Array.isArray(x)?x:[];}
  function postById(id){id=String(id||'');var p=call('findPost',id);if(p)return p;return allPosts().find(function(x){return String(x&&x.id||'')===id;})||null;}
  function isVideo(p){return !!call('isVideo',p);}
  function authUser(){return Promise.resolve(call('authUser')).catch(function(){return null;});}

  function resetMineV938(a){
    a=normalize(a||{});
    a.like=false;a.fav=false;a.repost=false;
    try{delete a.__happyadLikeDirectV876;}catch(_e){}
    return a;
  }
  function clearPersonalStateV938(options){
    options=options||{};
    authEpoch++;
    pending=Object.create(null);
    mutations=Object.create(null);
    loadedAt=Object.create(null);
    batchState={key:'',at:0,promise:null};
    try{Object.keys(likeRetryTimers).forEach(function(id){clearTimeout(likeRetryTimers[id]);delete likeRetryTimers[id];});}catch(_e){}
    var m=ensureMemory();
    Object.keys(m||{}).forEach(function(id){m[id]=resetMineV938(m[id]);});
    if(options.persist!==false)persist();
    if(options.paint!==false){try{Object.keys(cards).forEach(refreshEverywhere);}catch(_e){}}
    return authEpoch;
  }
  function authUidFromDetailV938(detail){return String(detail&&detail.user_id||detail&&detail.user&&detail.user.id||'').trim();}
  function authMountedIdsV939(visibleOnly,limit){
    var out=[],seen=Object.create(null),list=document.getElementById('list');
    function add(id){id=String(id||'').trim();if(!id||seen[id])return;seen[id]=1;out.push(id);}
    try{
      if(list){
        var selector=visibleOnly?'.miniCard[data-post-id][data-happyad-near-viewport-v763="1"]':'.miniCard[data-post-id]';
        [].slice.call(list.querySelectorAll(selector)).forEach(function(card){add(card&&card.dataset&&card.dataset.postId);});
        if(visibleOnly&&!out.length){[].slice.call(list.querySelectorAll('.miniCard[data-post-id]')).slice(0,8).forEach(function(card){add(card&&card.dataset&&card.dataset.postId);});}
      }
    }catch(_dom){}
    if(!visibleOnly){try{Object.keys(cards||{}).forEach(function(id){if((cards[id]||[]).some(function(card){return !!(card&&card.isConnected);}))add(id);});}catch(_cards){}}
    return out.slice(0,Math.max(1,Number(limit||40)));
  }
  async function hydratePersonalFastV939(uid,options){
    options=options||{};uid=String(uid||'').trim();if(!uid||uid!==activeAuthUid)return false;
    var requestEpoch=authEpoch,seq=++authHydrateSeqV939,c=sb();if(!c)return false;
    var ids=Array.isArray(options.ids)?options.ids.map(String).filter(Boolean):authMountedIdsV939(options.visibleOnly!==false,options.limit||16);
    ids=[...new Set(ids)].slice(0,Math.max(1,Number(options.limit||40)));if(!ids.length)return false;
    var byPost=Object.create(null);ids.forEach(function(id){byPost[id]=resetMineV938(get(id));});
    try{
      var ar=await c.from('happyad_content_actions').select('post_id,action_type,liked').in('post_id',ids).eq('user_id',uid).limit(Math.max(80,ids.length*6));
      if(ar&&ar.error)throw ar.error;
      if(requestEpoch!==authEpoch||uid!==activeAuthUid||seq<authHydrateSeqV939-2)return false;
      (ar&&ar.data||[]).forEach(function(r){var id=String(r&&r.post_id||'');if(byPost[id])applyMine(byPost[id],[r]);});
      setMany(byPost);
      ids.forEach(refreshEverywhere);
      return true;
    }catch(_e){return false;}
  }
  function refreshAuthVisibleV939(uid){
    uid=String(uid||activeAuthUid||'').trim();if(!uid||uid!==activeAuthUid)return;
    /* Priorité absolue à la couleur personnelle : une seule requête actions, sans attendre
       publications/commentaires/compteurs. Le refresh complet continue ensuite en arrière-plan. */
    Promise.resolve(hydratePersonalFastV939(uid,{visibleOnly:true,limit:16})).catch(function(){});
    setTimeout(function(){
      if(uid!==activeAuthUid)return;
      Promise.resolve(hydratePersonalFastV939(uid,{visibleOnly:false,limit:60})).catch(function(){});
      Promise.resolve(refreshVisible({force:true,immediate:true})).catch(function(){});
    },320);
  }
  function applyAuthStateV938(detail){
    detail=detail||{};
    var authenticated=detail.authenticated===true,uid=authenticated?authUidFromDetailV938(detail):'',eventName=String(detail.event||'').toUpperCase();
    var storedUid='';try{storedUid=String(localStorage.getItem('HAPPYAD_AUTH_UID')||'').trim();}catch(_stored){}
    /* V995 : au démarrage/reconnexion lente, l'UID local confirmé peut arriver avant que
       activeAuthUid soit hydraté. Si c'est exactement le même compte, ne jamais blanchir
       le cœur rose entre deux états auth ; la requête personnelle le reconfirme ensuite. */
    if(authenticated&&uid&&(!activeAuthUid&&storedUid===uid))activeAuthUid=uid;
    if(authenticated&&uid&&uid===activeAuthUid){
      if(eventName==='SIGNED_IN'||eventName==='SIGNED_IN_READY'||eventName==='PROFILE_READY'||eventName==='INITIAL_SESSION'||eventName==='FRAME_READY')refreshAuthVisibleV939(uid);
      return false;
    }
    activeAuthUid=uid;
    clearPersonalStateV938({paint:true,persist:true});
    if(authenticated&&uid){refreshAuthVisibleV939(uid);setTimeout(function(){if(uid===activeAuthUid)refreshAuthVisibleV939(uid);},700);}
    return true;
  }
  function bindAuthStateV938(){
    if(authBound)return;authBound=true;
    window.addEventListener('HAPPYAD_AUTH_STATE_V595',function(ev){try{applyAuthStateV938(ev&&ev.detail||{});}catch(_e){}},true);
  }
  function normalize(a){
    try{
      if(!a||typeof a!=='object'||Array.isArray(a))a={};
      if(!Array.isArray(a.commentsList))a.commentsList=[];
      a.like=!!a.like;a.fav=!!a.fav;a.repost=!!a.repost;
      a.likes=Math.max(0,Number(a.likes||0)||0);
      a.comments=Math.max(0,Number(a.comments||0)||0);
      a.shares=Math.max(0,Number(a.shares||0)||0);
      a.reposts=Math.max(0,Number(a.reposts||0)||0);
      a.favs=Math.max(0,Number(a.favs||0)||0);
      a.views=Math.max(0,Number(a.views||0)||0);
      if(a.__commentsLoading!==true)a.__commentsLoading=false;
      return a;
    }catch(_e){return {like:false,fav:false,repost:false,likes:0,comments:0,shares:0,reposts:0,favs:0,views:0,commentsList:[],__commentsLoading:false};}
  }
  function ensureMemory(){
    if(memory)return memory;
    try{memory=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(_e){memory={};}
    return memory;
  }
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(ensureMemory()));}catch(_e){}}
  function schedulePersist(){
    clearTimeout(persistTimer);persistTimer=setTimeout(function wait(){
      if(call('scrollActive')){persistTimer=setTimeout(wait,180);return;}
      persistTimer=0;persist();
    },140);
  }
  function readAll(){return ensureMemory();}
  function saveAll(x){memory=(x&&typeof x==='object')?x:{};persist();}
  function get(id){
    id=String(id||'');var a=normalize(ensureMemory()[id]||{});
    /* Le code historique modifie puis appelle set(); retourner une copie évite les mutations silencieuses. */
    return Object.assign({},a,{commentsList:Array.isArray(a.commentsList)?a.commentsList.slice():[]});
  }
  /* V908 — garde anti-course pour le détail Commentaires.
     Les requêtes Home Actions (post + actions utilisateur) peuvent finir après la requête
     dédiée aux commentaires. Elles ne doivent jamais réécrire une ancienne copie vide de
     commentsList ni remettre __commentsLoading=true après que les commentaires sont visibles. */
  function preserveLatestCommentDetail(id,a){
    try{
      id=String(id||'');a=normalize(a||{});
      var latest=get(id)||{};
      if(Array.isArray(latest.commentsList))a.commentsList=latest.commentsList.slice();
      ['__commentsLoading','__commentsRefreshing','__commentsExact','__commentsLoadedAt','__commentsHasMore','__commentsOffset'].forEach(function(k){
        if(Object.prototype.hasOwnProperty.call(latest,k))a[k]=latest[k];
      });
      return a;
    }catch(_e){return normalize(a||{});}
  }
  function set(id,a,options){
    id=String(id||'');if(!id)return normalize(a||{});
    var n=normalize(a||{});ensureMemory()[id]=n;
    if(!(options&&options.deferPersist))persist();
    return n;
  }
  function setMany(map){
    var m=ensureMemory();Object.keys(map||{}).forEach(function(id){m[String(id)]=normalize(map[id]);});persist();
  }
  function num(){for(var i=0;i<arguments.length;i++){var v=Number(arguments[i]);if(isFinite(v)&&v>0)return v;}return 0;}
  function prime(p){
    try{
      if(!p||!p.id)return;var a=get(p.id);
      a.likes=Math.max(a.likes,num(p.likes_count,p.like_count,p.likes));
      a.comments=Math.max(a.comments,num(p.comments_count,p.comment_count,p.comments));
      a.shares=Math.max(a.shares,num(p.shares_count,p.share_count,p.shares));
      a.reposts=Math.max(a.reposts,num(p.reposts_count,p.repost_count,p.reposts,p.republication_count));
      a.favs=Math.max(a.favs,num(p.saves_count,p.favs_count,p.favorite_count,p.favorites_count,p.favs));
      a.views=Math.max(a.views,num(p.views_count,p.view_count,p.video_views_count,p.views));
      set(p.id,a,{deferPersist:true});schedulePersist();
    }catch(_e){}
  }

  function compact(n){
    n=Number(n||0);if(!isFinite(n))n=0;var sign=n<0?'-':'';n=Math.abs(n);
    function fmt(v,s){var cut=Math.floor(v*10+1e-7)/10;var out=cut.toFixed(1).replace(/\.0$/,'');return sign+out+s;}
    if(n<1000)return sign+String(Math.floor(n));
    if(n<1000000)return fmt(n/1000,'K');
    if(n<1000000000)return fmt(n/1000000,'M');
    if(n<1000000000000)return fmt(n/1000000000,'MD');
    return fmt(n/1000000000000,'T');
  }
  function countComments(list){return (list||[]).reduce(function(n,c){return n+1+countComments(c&&c.replies||[]);},0);}
  function refreshCard(card,id){
    if(!card||!card.querySelectorAll)return;
    var a=get(id),p=card.__happyadPost||postById(id)||{};
    var hideLikes=(p.hide_like_count===true||p.hideLikeCount===true);
    var commentsOff=(p.comments_disabled===true||p.commentsDisabled===true);
    card.querySelectorAll('[data-card-act]').forEach(function(el){
      var type=el.dataset.cardAct;
      var val=type==='like'?a.likes:type==='comment'?(a.comments!==undefined?a.comments:countComments(a.commentsList||[])):type==='share'?a.shares:type==='repost'?a.reposts:a.favs;
      var small=el.querySelector('small');
      if(small){small.textContent=compact(val||0);small.style.display=(type==='fav'||(type==='like'&&hideLikes))?'none':'';}
      if(type==='comment'){el.classList.toggle('haCommentsDisabledV63',commentsOff);el.setAttribute('aria-disabled',commentsOff?'true':'false');}
      el.classList.toggle('on',(type==='like'&&a.like)||(type==='fav'&&a.fav)||(type==='repost'&&a.repost));
    });
    var vb=card.querySelector('.happyadVideoViewsBadge');
    if(vb){
      var viewText=compact(a.views||0),viewCount=vb.querySelector('.happyadVideoViewsCount');
      if(!viewCount){
        vb.innerHTML='<svg class="happyadVideoViewsPlaySvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5.25 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L8.03 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"></path></svg><span class="happyadVideoViewsCount"></span>';
        viewCount=vb.querySelector('.happyadVideoViewsCount');
      }
      if(viewCount)viewCount.textContent=viewText;
      vb.setAttribute('aria-label',viewText+' vues');
    }
  }
  function register(card,p){
    if(!card||!p||!p.id)return;var id=String(p.id);card.__happyadPost=p;
    if(!cards[id])cards[id]=[];if(cards[id].indexOf(card)<0)cards[id].push(card);
  }
  function refreshEverywhere(id){
    id=String(id||'');var arr=(cards[id]||[]).filter(function(c){return c&&c.isConnected;});cards[id]=arr;arr.forEach(function(c){refreshCard(c,id);});
  }

  function pendingKey(postId,type){return String(postId||'')+'::'+String(type||'like');}
  function setPending(postId,type,on,count,ttl){pending[pendingKey(postId,type)]={on:!!on,count:Number(count||0),until:Date.now()+Number(ttl||6500)};}
  function clearPending(postId,type){delete pending[pendingKey(postId,type)];}
  function getPending(postId,type){var k=pendingKey(postId,type),x=pending[k];if(x&&Date.now()<Number(x.until||0))return x;if(x)delete pending[k];return null;}

  function mutationKey(postId,kind){return String(postId||'')+'::'+String(kind||'actions');}
  function markMutation(postId,kind,ttl){mutations[mutationKey(postId,kind)]=Date.now()+Number(ttl||2400);}
  function mutationRecent(postId,kind){var k=mutationKey(postId,kind),until=Number(mutations[k]||0);if(until>Date.now())return true;if(until)delete mutations[k];return false;}
  function scheduleRefresh(postId,contentType,delay){var id=String(postId||'');if(!id)return;var run=function(){delete refreshTimers[id];return load(id,contentType||'photo',{force:true}).catch(function(){});};try{var coordinator=window.HappyadConnectionWorkCoordinatorV869;if(coordinator&&typeof coordinator.schedule==='function')return coordinator.schedule('home-actions-refresh-'+id,run,{surface:'home',delay:Number(delay||120),maxDelay:1800,minGap:350});}catch(_e){}clearTimeout(refreshTimers[id]);refreshTimers[id]=setTimeout(run,Number(delay||120));}
  function schedulePostCounts(postId,contentType){var id=String(postId||'');if(!id)return;var run=function(){delete countTimers[id];return syncPostCounts(id,contentType).catch(function(){});};try{var coordinator=window.HappyadConnectionWorkCoordinatorV869;if(coordinator&&typeof coordinator.schedule==='function')return coordinator.schedule('home-actions-counts-'+id,run,{surface:'home',delay:220,maxDelay:2200,minGap:500});}catch(_e){}clearTimeout(countTimers[id]);countTimers[id]=setTimeout(run,160);}
  function realtimeTracked(postId){
    var id=String(postId||'');if(!id)return false;
    if(postById(id))return true;
    var live=(cards[id]||[]).filter(function(card){return !!(card&&card.isConnected);});
    if(live.length){cards[id]=live;return true;}
    delete cards[id];return false;
  }
  function queueRealtimeRefresh(row,kind,delay){
    row=row&&typeof row==='object'?row:{};
    var id=String(row.post_id||'');if(!realtimeTracked(id))return false;
    var rec=realtimeDirty[id]||(realtimeDirty[id]={id:id,contentType:String(row.content_type||'photo'),comments:false});
    rec.contentType=String(row.content_type||rec.contentType||'photo');
    if(kind==='comments')rec.comments=true;
    var run=function(){
      delete refreshTimers[id];
      var item=realtimeDirty[id]||rec;delete realtimeDirty[id];
      if(!realtimeTracked(id))return null;
      if(item.comments)try{call('commentRealtime',id);}catch(_e){}
      return load(id,item.contentType||'photo',{force:true}).catch(function(){});
    };
    try{
      var coordinator=window.HappyadConnectionWorkCoordinatorV869;
      if(coordinator&&typeof coordinator.schedule==='function')return coordinator.schedule('home-actions-'+id,run,{surface:'home',delay:Number(delay||180),maxDelay:1800,minGap:350});
    }catch(_e2){}
    clearTimeout(refreshTimers[id]);refreshTimers[id]=setTimeout(run,Number(delay||180));return true;
  }

  async function exactCommentCount(c,postId,force){
    var id=String(postId||'');if(!c||!id)return null;
    var now=Date.now();
    if(force!==true&&Object.prototype.hasOwnProperty.call(commentCountValue,id)&&now-Number(commentCountAt[id]||0)<12000)return Number(commentCountValue[id]);
    if(commentCountLoads[id]&&force!==true)return commentCountLoads[id];
    var task=(async function(){
      try{
        var q=await c.from('happyad_content_comments').select('id',{count:'exact',head:true}).eq('post_id',id);
        if(q&&q.error)throw q.error;
        var n=Number(q&&q.count);if(!isFinite(n))return null;
        n=Math.max(0,n);if(n===0){try{var q2=await c.from('happyad_content_comments').select('id',{count:'exact',head:true}).eq('content_id',id);if(q2&&!q2.error&&isFinite(Number(q2.count))&&Number(q2.count)>0)n=Math.max(0,Number(q2.count));}catch(_legacy){}}
        commentCountValue[id]=n;commentCountAt[id]=Date.now();return n;
      }catch(_e){return null;}
    })();
    commentCountLoads[id]=task;
    try{return await task;}finally{if(commentCountLoads[id]===task)delete commentCountLoads[id];}
  }
  async function exactCommentCountsBatch(c,ids){
    ids=Array.isArray(ids)?ids.map(String).filter(Boolean):[];var out=Object.create(null),next=0;
    async function worker(){while(next<ids.length){var id=ids[next++],n=await exactCommentCount(c,id,false);if(n!==null)out[id]=n;}}
    var workers=[];for(var i=0;i<Math.min(6,ids.length);i++)workers.push(worker());
    await Promise.all(workers);return out;
  }
  function applyExactCommentCount(id,a,n){
    if(n===null||n===undefined||!isFinite(Number(n)))return a;
    var exact=Math.max(0,Number(n)||0);
    /* Une insertion locale optimiste ne doit jamais être écrasée par un count réseau
       parti juste avant le commit Supabase. Hors mutation, le count table est autoritaire. */
    a.comments=mutationRecent(id,'comments')?Math.max(Number(a.comments||0),exact):exact;
    a.__commentsCountExact=true;a.__commentsCountAt=Date.now();
    return a;
  }

  function ownNum(p,names){
    p=p||{};for(var i=0;i<names.length;i++){var k=names[i];if(Object.prototype.hasOwnProperty.call(p,k)){var v=Number(p[k]);if(isFinite(v))return Math.max(0,v);}}return null;
  }
  function applyPostCounts(a,p,authoritative){
    p=p||{};var v;
    v=ownNum(p,['likes_count','like_count','likes']);if(v!==null)a.likes=authoritative?v:Math.max(Number(a.likes||0),v);
    v=ownNum(p,['comments_count','comment_count','comments']);if(v!==null)a.comments=authoritative?v:Math.max(Number(a.comments||0),v);
    v=ownNum(p,['shares_count','share_count','shares']);if(v!==null)a.shares=authoritative?v:Math.max(Number(a.shares||0),v);
    v=ownNum(p,['reposts_count','repost_count','reposts','republication_count']);if(v!==null)a.reposts=authoritative?v:Math.max(Number(a.reposts||0),v);
    v=ownNum(p,['saves_count','favs_count','favorite_count','favorites_count','favs']);if(v!==null)a.favs=authoritative?v:Math.max(Number(a.favs||0),v);
    v=ownNum(p,['views_count','view_count','video_views_count','views']);if(v!==null)a.views=authoritative?v:Math.max(Number(a.views||0),v);
    return a;
  }
  function applyMine(a,rows){
    (rows||[]).forEach(function(r){var t=String(r.action_type||'').toLowerCase();if(t==='like')a.like=!!r.liked;if(t==='fav'||t==='favorite'||t==='save')a.fav=!!r.liked;if(t==='repost'||t==='republish'||t==='republication')a.repost=!!r.liked;});return a;
  }
  function preservePending(id,a){
    var x=getPending(id,'like');if(x){a.like=!!x.on;a.likes=Number(x.count||0);}
    x=getPending(id,'fav')||getPending(id,'favorite');if(x){a.fav=!!x.on;a.favs=Number(x.count||0);}
    x=getPending(id,'repost');if(x){a.repost=!!x.on;a.reposts=Number(x.count||0);}
    var direct=window.HappyLikeDirectV876;
    if(direct&&direct.apply)a=direct.apply(id,a)||a;
    return a;
  }

  function paintIdsWhenIdle(ids){
    ids=Array.isArray(ids)?ids:[ids];
    (function paint(){if(call('scrollActive')){setTimeout(paint,120);return;}ids.forEach(refreshEverywhere);})();
  }
  async function waitScrollIdle(){
    while(call('scrollActive')){
      await new Promise(function(resolve){setTimeout(resolve,100);});
    }
  }

  async function load(postId,contentType,options){
    var id=String(postId||'');if(!id)return null;var opts=options||{};
    if(!opts.force&&Date.now()-Number(loadedAt[id]||0)<1800)return get(id);
    if(loads[id])return loads[id];
    var task=(async function(){
      var c=sb();if(!c)return get(id);
      var a=get(id),localPost=postById(id)||{};applyPostCounts(a,localPost,false);
      var requestEpoch=authEpoch;
      var user=null;try{user=await authUser();}catch(_e){}
      try{
        var pr=await c.from('happyad_posts').select('*').eq('id',id).maybeSingle();
        if(pr&&!pr.error&&pr.data)applyPostCounts(a,pr.data,true);
      }catch(_p){}
      try{applyExactCommentCount(id,a,await exactCommentCount(c,id,opts.force===true));}catch(_cc){}
      if(user&&user.id){
        try{
          var ar=await c.from('happyad_content_actions').select('action_type,liked').eq('post_id',id).eq('user_id',String(user.id)).limit(12);
          if(ar&&!ar.error){a=resetMineV938(a);applyMine(a,ar.data||[]);}
        }catch(_a){/* Connexion moyenne/faible : conserver le dernier état personnel confirmé localement. */}
      }else if(!activeAuthUid){
        a=resetMineV938(a);
      }
      preservePending(id,a);
      /* V908 : la requête ci-dessus a pu démarrer avant le chargement détaillé des commentaires.
         Relire l'état le plus récent juste avant l'écriture empêche le vieux snapshot de vider
         les commentaires déjà affichés ou de relancer « Chargement des commentaires… ». */
      a=preserveLatestCommentDetail(id,a);
      /* Une réponse réseau peut arriver pendant un nouveau geste : pas de stringify/localStorage à ce moment-là. */
      await waitScrollIdle();
      /* Le scroll peut avoir laissé le temps au moteur Commentaires d'évoluer encore. */
      a=preserveLatestCommentDetail(id,a);
      if(requestEpoch!==authEpoch)return get(id);
      set(id,a);loadedAt[id]=Date.now();paintIdsWhenIdle([id]);return a;
    })();
    loads[id]=task;
    try{return await task;}finally{if(loads[id]===task)delete loads[id];}
  }

  async function primeBatchRaw(posts){
    posts=Array.isArray(posts)?posts:[];var c=sb();if(!c||!posts.length)return;
    var requestEpoch=authEpoch;
    var ids=[...new Set(posts.map(function(p){return String(p&&p.id||'');}).filter(Boolean))].slice(0,80);if(!ids.length)return;
    var byPost={};ids.forEach(function(id){var p=posts.find(function(x){return String(x&&x.id||'')===id;})||postById(id)||{};byPost[id]=applyPostCounts(get(id),p,false);});
    try{
      var pr=await c.from('happyad_posts').select('*').in('id',ids);
      if(pr&&!pr.error)(pr.data||[]).forEach(function(p){var id=String(p&&p.id||'');if(byPost[id])applyPostCounts(byPost[id],p,true);});
    }catch(_p){}
    try{
      var exactCounts=await exactCommentCountsBatch(c,ids);
      ids.forEach(function(id){if(byPost[id]&&Object.prototype.hasOwnProperty.call(exactCounts,id))applyExactCommentCount(id,byPost[id],exactCounts[id]);});
    }catch(_cc){}
    var user=null;try{user=await authUser();}catch(_e){}
    if(user&&user.id){
      try{
        var ar=await c.from('happyad_content_actions').select('post_id,action_type,liked').in('post_id',ids).eq('user_id',String(user.id)).limit(Math.max(80,ids.length*6));
        if(ar&&!ar.error){ids.forEach(function(id){if(byPost[id])byPost[id]=resetMineV938(byPost[id]);});(ar.data||[]).forEach(function(r){var id=String(r.post_id||'');if(byPost[id])applyMine(byPost[id],[r]);});}
      }catch(_a){/* Ne pas blanchir les likes locaux si la requête échoue. */}
    }else if(!activeAuthUid){
      ids.forEach(function(id){if(byPost[id])byPost[id]=resetMineV938(byPost[id]);});
    }
    ids.forEach(function(id){preservePending(id,byPost[id]);byPost[id]=preserveLatestCommentDetail(id,byPost[id]);loadedAt[id]=Date.now();});
    /* La peinture était déjà différée ; la persistance lourde doit l'être aussi. */
    await waitScrollIdle();
    /* Même protection pour un primeBatch qui finirait pendant l'ouverture des commentaires. */
    ids.forEach(function(id){byPost[id]=preserveLatestCommentDetail(id,byPost[id]);});
    if(requestEpoch!==authEpoch)return;
    setMany(byPost);
    paintIdsWhenIdle(ids);
  }
  function primeBatch(posts){
    posts=Array.isArray(posts)?posts:[];var ids=[...new Set(posts.map(function(p){return String(p&&p.id||'');}).filter(Boolean))].slice(0,80).sort();if(!ids.length)return Promise.resolve();
    var key=ids.join('|'),now=Date.now();if(batchState.promise&&batchState.key===key)return batchState.promise;if(batchState.key===key&&now-batchState.at<15000)return Promise.resolve();
    var task;
    try{
      var coordinator=window.HappyadConnectionWorkCoordinatorV869;
      if(coordinator&&typeof coordinator.schedule==='function'){
        task=new Promise(function(resolve){
          var jobKey='home-actions-prime-v869-'+ids.length+'-'+ids[0]+'-'+ids[ids.length-1];
          coordinator.schedule(jobKey,function(){return Promise.resolve(primeBatchRaw(posts)).then(resolve,function(){resolve();});},{surface:'home',delay:280,maxDelay:2600,minGap:15000});
        });
      }
    }catch(_e){}
    if(!task)task=Promise.resolve().then(function(){return primeBatchRaw(posts);}).catch(function(){});
    batchState={key:key,at:now,promise:task};task.finally(function(){if(batchState.promise===task)batchState.promise=null;});return task;
  }
  async function refreshVisible(options){
    options=options||{};
    var list=document.getElementById('list');if(!list)return;
    var nodes=[].slice.call(list.querySelectorAll('.miniCard[data-post-id][data-happyad-near-viewport-v763="1"]'));
    if(!nodes.length)nodes=[].slice.call(list.querySelectorAll('.miniCard[data-post-id]')).slice(0,8);if(!nodes.length)return;
    var ids=[...new Set(nodes.map(function(x){return String(x.dataset.postId||'');}).filter(Boolean))].slice(0,12),now=Date.now(),ttl=options.force===true?0:60000;
    ids.forEach(refreshEverywhere);
    var posts=ids.map(postById).filter(Boolean).filter(function(p){var id=String(p.id||'');return !ttl||now-Number(visibleAt.get(id)||0)>=ttl;});
    if(!posts.length)return;posts.forEach(function(p){visibleAt.set(String(p.id||''),now);});if(options.immediate===true)await primeBatchRaw(posts);else await primeBatch(posts);
  }

  async function syncPostCounts(postId,contentType){
    var c=sb(),id=String(postId||'');if(!c||!id)return;var a=get(id);
    var patch={likes_count:Number(a.likes||0),saves_count:Number(a.favs||0)};
    /* comments_count n'est plus dérivé d'un cache local potentiellement vide.
       La table des commentaires est la source de vérité avant toute réécriture du post. */
    try{
      var exact=await exactCommentCount(c,id,true);
      if(exact!==null){a.comments=Math.max(0,Number(exact)||0);a.__commentsCountExact=true;a.__commentsCountAt=Date.now();patch.comments_count=Number(a.comments||0);set(id,preserveLatestCommentDetail(id,a));paintIdsWhenIdle([id]);}
    }catch(_cc){}
    if(String(contentType||'').toLowerCase()==='video')patch.views_count=Number(a.views||0);
    try{var r=await c.from('happyad_posts').update(patch).eq('id',id);if(r&&r.error)throw r.error;}catch(_e){}
  }
  function paintLikeImmediate(el,on,count){
    try{el.classList.toggle('on',!!on);var small=el.querySelector('small');if(small)small.textContent=compact(count||0);}catch(_e){}
  }
  function applyConfirmedLike(id,on,count){
    var a=get(id);a.like=!!on;if(count!==null&&count!==undefined)a.likes=Math.max(0,Number(count)||0);
    try{var d=window.HappyLikeDirectV876,p=d&&d.pending&&d.pending(id);if(p)a.__happyadLikeDirectV876=p;}catch(_e){}
    set(id,a);clearPending(id,'like');refreshEverywhere(id);return a;
  }
  function silentLikeRetry(id,contentType,on,token,attempt,epoch){
    attempt=Number(attempt||0);epoch=Number(epoch);if(attempt>2||epoch!==authEpoch)return;
    clearTimeout(likeRetryTimers[id]);likeRetryTimers[id]=setTimeout(function(){
      delete likeRetryTimers[id];if(epoch!==authEpoch)return;var direct=window.HappyLikeDirectV876;if(direct&&direct.isCurrent&&!direct.isCurrent(id,token))return;
      toggleRemote(id,contentType,'like',on,{likeToken:token,skipRetry:true,authEpoch:epoch}).then(function(result){
        if(epoch!==authEpoch)return;if(result&&result.__happyadConfirmedLikeV876)applyConfirmedLike(id,on,result.likes);
      }).catch(function(){if(epoch!==authEpoch)return;if(direct&&direct.keep)direct.keep(id,token,30000);silentLikeRetry(id,contentType,on,token,attempt+1,epoch);});
    },attempt===0?500:(attempt===1?1400:3200));
  }
  function broadcast(postId){try{localStorage.setItem('HAPPYAD_ACTION_FAST_SYNC_V1',JSON.stringify({id:String(postId),t:Date.now()}));}catch(_e){};}
  function mergeExternalStatePreserveCommentDetailV910(raw){
    try{
      var incoming=JSON.parse(raw||'{}')||{},current=ensureMemory(),merged={};
      var ids=Object.create(null);
      Object.keys(current||{}).forEach(function(id){ids[String(id)]=1;});
      Object.keys(incoming||{}).forEach(function(id){ids[String(id)]=1;});
      Object.keys(ids).forEach(function(id){
        var local=normalize(current[id]||{}),ext=normalize(incoming[id]||{}),hasLocalDetail=Array.isArray(local.commentsList)&&(local.commentsList.length>0||Number(local.__commentsLoadedAt||0)>0||local.__commentsLoading===true||local.__commentsRefreshing===true);
        if(!Object.prototype.hasOwnProperty.call(incoming,id)){merged[id]=local;return;}
        if(hasLocalDetail){
          ext.commentsList=local.commentsList.slice();
          ext.comments=Math.max(Number(ext.comments||0),Number(local.comments||0));
          ['__commentsLoading','__commentsRefreshing','__commentsExact','__commentsLoadedAt','__commentsHasMore','__commentsOffset'].forEach(function(k){if(Object.prototype.hasOwnProperty.call(local,k))ext[k]=local[k];});
        }
        try{var direct=window.HappyLikeDirectV876;if(direct&&direct.apply)ext=direct.apply(id,ext)||ext;}catch(_direct){}
        merged[id]=ext;
      });
      memory=merged;
    }catch(_e){/* Ne jamais jeter l'état local détaillé sur une écriture iframe malformée. */}
  }
  function bindStorage(){
    if(storageBound)return;storageBound=true;
    window.addEventListener('storage',function(e){try{
      /* V910 : photo.html / video.html utilisent encore la même clé d'actions. Une écriture
         provenant d'un iframe ne doit plus vider commentsList du popup parent. */
      if(e.key===KEY){if(e.newValue){mergeExternalStatePreserveCommentDetailV910(e.newValue);try{if(localStorage.getItem('HAPPYAD_SESSION_ACTIVE')!=='1'){var mm=ensureMemory();Object.keys(mm||{}).forEach(function(id){mm[id]=resetMineV938(mm[id]);});}}catch(_guest){}}}
      if(e.key==='HAPPYAD_ACTION_FAST_SYNC_V1'&&e.newValue){var r=JSON.parse(e.newValue||'{}');if(r&&r.id){var p=postById(r.id);scheduleRefresh(r.id,isVideo(p)?'video':'photo',140);}}
    }catch(_e){}});
  }

  async function toggleRemote(postId,contentType,actionType,nextValue,options){
    options=options||{};var opEpoch=(options.authEpoch===undefined?authEpoch:Number(options.authEpoch));
    var c=sb(),id=String(postId||'');if(!c||!id)throw new Error('Supabase non chargé');var user=await authUser();if(!user||!user.id)throw new Error('Connecte-toi pour enregistrer cette action');
    if(opEpoch!==authEpoch)return {__happyadAuthStaleV938:true};
    markMutation(id,'actions',2600);
    if((actionType==='share'||actionType==='repost')&&(actionType==='share'||nextValue)){
      var gate=window.HappyInteractionPrivacyV855R52;if(!gate||!(await gate.canPost(id,'reposts',true)))throw new Error('Le propriétaire n’autorise pas les partages ou republications.');
    }
    if(actionType==='share'){
      var ins=await c.from('happyad_content_actions').upsert({post_id:id,content_id:id,content_type:contentType,action_type:'share',user_id:user.id,liked:true},{onConflict:'post_id,content_type,action_type,user_id'});if(ins.error)throw ins.error;
    }else{
      var safe=actionType==='fav'?'favorite':actionType;
      var up=await c.from('happyad_content_actions').upsert({post_id:id,content_id:id,content_type:contentType,action_type:safe,user_id:user.id,liked:!!nextValue},{onConflict:'post_id,content_type,action_type,user_id'});if(up.error)throw up.error;
    }
    if(opEpoch!==authEpoch)return {__happyadAuthStaleV938:true};
    markMutation(id,'actions',2600);broadcast(id);
    if(actionType==='like'){
      var direct=window.HappyLikeDirectV876,token=options&&options.likeToken,count=null;
      if(direct&&direct.confirm&&token){count=await direct.confirm(c,id,token,!!nextValue);}
      if(opEpoch!==authEpoch)return {__happyadAuthStaleV938:true};
      if(count!==null&&count!==undefined){var confirmed=get(id);confirmed.like=!!nextValue;confirmed.likes=Math.max(0,Number(count)||0);set(id,confirmed);return {__happyadConfirmedLikeV876:true,likes:confirmed.likes,like:confirmed.like};}
      return get(id);
    }
    schedulePostCounts(id,contentType);return get(id);
  }

  function bindCard(card,p,title){
    if(!card||!p)return;
    card.querySelectorAll('[data-card-act]').forEach(function(el){
      el.onclick=async function(e){
        e.stopPropagation();var type=el.dataset.cardAct,contentType=isVideo(p)?'video':'photo',a=get(p.id);
        if(type==='comment'){var fn=b('openComments');if(fn)fn(p,contentType);return;}
        if(type==='like'){
          var beforeLike={on:!!a.like,count:Number(a.likes||0)},nextLike=!beforeLike.on;
          a.like=nextLike;a.likes=Math.max(0,beforeLike.count+(nextLike?1:-1));
          paintLikeImmediate(el,nextLike,a.likes);set(p.id,a);setPending(p.id,'like',nextLike,a.likes,30000);refreshEverywhere(p.id);
          var clickEpoch=authEpoch,direct=window.HappyLikeDirectV876,token=direct&&direct.mark?direct.mark(p.id,nextLike,a.likes,30000):'';
          var run=function(){if(clickEpoch!==authEpoch)return Promise.resolve();return toggleRemote(p.id,contentType,'like',nextLike,{likeToken:token,authEpoch:clickEpoch}).then(function(result){
            if(clickEpoch!==authEpoch||result&&result.__happyadAuthStaleV938)return;
            if(result&&result.__happyadConfirmedLikeV876)applyConfirmedLike(p.id,nextLike,result.likes);
            else{var current=get(p.id);setPending(p.id,'like',nextLike,current.likes,12000);refreshEverywhere(p.id);}
            if(nextLike)call('notifyAction',p,'like');
          }).catch(function(){if(clickEpoch!==authEpoch)return;if(direct&&direct.keep)direct.keep(p.id,token,30000);silentLikeRetry(p.id,contentType,nextLike,token,0,clickEpoch);});};
          if(direct&&direct.queue)direct.queue(p.id,run);else run();
          return;
        }
        if(type==='fav'||type==='repost'){
          if(el.dataset.busy==='1')return;el.dataset.busy='1';
          var key=type==='repost'?'repost':'fav',countKey=type==='repost'?'reposts':'favs',action=type==='fav'?'fav':type;
          var clickEpoch2=authEpoch,before={on:!!a[key],count:Number(a[countKey]||0)},next=!before.on;
          a[key]=next;a[countKey]=Math.max(0,before.count+(next?1:-1));setPending(p.id,action,next,a[countKey],7500);set(p.id,a);refreshEverywhere(p.id);
          toggleRemote(p.id,contentType,action,next,{authEpoch:clickEpoch2}).then(function(result){if(clickEpoch2!==authEpoch||result&&result.__happyadAuthStaleV938)return;var now=get(p.id);setPending(p.id,action,next,now[countKey],2400);setTimeout(function(){clearPending(p.id,action);},2450);if(next)call('notifyAction',p,action);}).catch(function(err){if(clickEpoch2!==authEpoch)return;clearPending(p.id,action);var rb=get(p.id);rb[key]=before.on;rb[countKey]=before.count;set(p.id,rb);refreshEverywhere(p.id);alert((type==='repost'?'Republication':'Favori')+' non enregistré : '+((err&&err.message)||err));}).finally(function(){setTimeout(function(){try{el.dataset.busy='0';}catch(_e){}},900);});return;
        }
        if(type==='share'){
          var before=Number(a.shares||0);a.shares=before+1;set(p.id,a);refreshEverywhere(p.id);
          try{await toggleRemote(p.id,contentType,'share',true);}catch(err){var rb=get(p.id);rb.shares=before;set(p.id,rb);refreshEverywhere(p.id);alert('Partage non enregistré : '+((err&&err.message)||err));}
          if(navigator.share)navigator.share({title:'Fyblic',text:title||'Publication Fyblic'}).catch(function(){});return;
        }
      };
    });
  }

  function startRealtime(){
    var c=sb();if(!c||realtimeStarted)return;realtimeStarted=true;
    try{
      c.channel('happyad-home-actions-v1')
        .on('postgres_changes',{event:'*',schema:'public',table:'happyad_content_actions'},function(payload){var row=(payload&&payload.new)||payload.old;if(row&&row.post_id&&!mutationRecent(row.post_id,'actions'))queueRealtimeRefresh(row,'actions',180);})
        .on('postgres_changes',{event:'*',schema:'public',table:'happyad_content_comments'},function(payload){var row=(payload&&payload.new)||payload.old;if(row&&row.post_id&&!mutationRecent(row.post_id,'comments'))queueRealtimeRefresh(row,'comments',200);})
        .on('postgres_changes',{event:'*',schema:'public',table:'happyad_video_views'},function(payload){var row=(payload&&payload.new)||payload.old;if(row&&row.post_id&&!mutationRecent(row.post_id,'views'))queueRealtimeRefresh(Object.assign({},row,{content_type:'video'}),'views',220);})
        .subscribe();
    }catch(_e){}
  }

  var api={
    version:VERSION,connect:connect,normalize:normalize,readAll:readAll,saveAll:saveAll,get:get,set:set,setMany:setMany,num:num,prime:prime,
    compact:compact,formatViews:compact,register:register,refreshCard:refreshCard,refreshEverywhere:refreshEverywhere,
    setPending:setPending,clearPending:clearPending,getPending:getPending,markMutation:markMutation,mutationRecent:mutationRecent,
    scheduleRefresh:scheduleRefresh,schedulePostCounts:schedulePostCounts,load:load,primeBatch:primeBatch,refreshVisible:refreshVisible,
    syncPostCounts:syncPostCounts,broadcast:broadcast,toggleRemote:toggleRemote,bindCard:bindCard,startRealtime:startRealtime,
    resetMine:resetMineV938,clearPersonalState:clearPersonalStateV938,applyAuthState:applyAuthStateV938,hydratePersonalFast:hydratePersonalFastV939,getAuthEpoch:function(){return authEpoch;}
  };
  window.HappyHomeActionsV1=api;
})();
