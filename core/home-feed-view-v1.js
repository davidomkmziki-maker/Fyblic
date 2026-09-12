/* Fyblic HOME FEED VIEW V1
   Responsabilite unique : reconciler les cartes deja ordonnees par Home Feed Master.
   Aucune requete Supabase, aucun tri, aucune pagination, aucun chargement media ici.
   Le chemin normal de pagination est strictement append-only et ne deplace jamais
   une carte deja visible. */
(function(){
  'use strict';
  if(window.HappyHomeFeedViewV1)return;

  var VERSION='V929_PREPAINT_ANCHOR_NO_DELAY';
  var bridge=null;
  var mode='';
  var items=[];
  var busy=false;
  var scrollActiveUntil=0;
  var bound=false;

  function connect(adapter){
    bridge=adapter||null;
    bindScrollActivity();
    return api;
  }
  function b(name){return bridge&&typeof bridge[name]==='function'?bridge[name]:null;}
  function call(name){var fn=b(name);if(!fn)return undefined;return fn.apply(bridge,[].slice.call(arguments,1));}
  function truth(v){return v===true||v===1||/^(true|1|yes|oui|on)$/i.test(String(v==null?'':v).trim());}
  function isMarketplace(p){p=p||{};return truth(p.happyadMarketplace)||truth(p.happyad_marketplace)||truth(p.is_marketplace)||String(p.mode||'').trim().toLowerCase()==='marketplace';}
  function keyOf(p,i){
    var k=p&&(p.__feedCardKey||p.id);
    return String(k||('home-index-'+Number(i||0)));
  }
  function postSignature(p){
    try{
      p=p||{};var rows=(p.__albumItems&&p.__albumItems.length)?p.__albumItems:[p];
      return rows.map(function(x){x=x||{};var market=isMarketplace(x)?'market':'post';return [String(x.id||''),market,String(x.marketplace_cover_url||x.marketplaceCoverUrl||x.mediaUrl||x.media_url||x.homeMediaUrl||x.home_media_url||''),String(x.batchId||x.batch_id||'')].join('~');}).join('||');
    }catch(_e){return String(p&&p.id||'');}
  }
  function bindPayload(card,p,i){
    if(!card)return card;
    card.__happyadPost=p||null;
    card.dataset.feedKey=keyOf(p,i);
    card.dataset.feedSig=postSignature(p);
    return card;
  }
  function markScrollActive(delay){
    scrollActiveUntil=Math.max(scrollActiveUntil,Date.now()+Math.max(180,Number(delay||0)));
    return scrollActiveUntil;
  }
  function globalScrollActive(){
    try{var g=window.HappyadGlobalScrollCoordinatorV868;return !!(g&&typeof g.isActive==='function'&&g.isActive());}catch(_e){return false;}
  }
  function isScrollActive(){return Date.now()<scrollActiveUntil||globalScrollActive();}
  function currentMode(){return mode;}

  function notifyPending(reason){
    try{
      var feed=window.HappyHomeFeedV1;
      if(feed&&feed.hasPendingRender&&feed.hasPendingRender()&&feed.queueRender){
        feed.queueRender({feedOnly:true,reason:reason||'home-view-scroll-active'});
      }
    }catch(_e){}
  }
  function flushPending(){
    try{
      var feed=window.HappyHomeFeedV1;
      if(feed&&feed.hasPendingRender&&feed.hasPendingRender()&&feed.flushRender)feed.flushRender();
    }catch(_e){}
    try{var boot=window.HappyHomeFeedBootV1;if(boot&&boot.applyPendingHeadIfAtTop)boot.applyPendingHeadIfAtTop();}catch(_b){}
  }
  function bindScrollActivity(){
    if(bound||window.__happyadHomeFeedViewScrollBoundV1)return;
    bound=true;window.__happyadHomeFeedViewScrollBoundV1=true;
    function active(ms){markScrollActive(ms);notifyPending('home-view-scroll-active');}
    window.addEventListener('scroll',function(){active(280);},{passive:true});
    window.addEventListener('touchstart',function(){active(240);},{passive:true});
    window.addEventListener('touchmove',function(){active(380);},{passive:true});
    window.addEventListener('touchend',function(){notifyPending('home-view-touchend');setTimeout(flushPending,420);},{passive:true});
    window.addEventListener('touchcancel',function(){notifyPending('home-view-touchcancel');setTimeout(flushPending,420);},{passive:true});
    window.addEventListener('wheel',function(){active(340);},{passive:true});
    window.addEventListener('pointermove',function(e){if(e&&e.buttons)active(340);},{passive:true});
    try{window.addEventListener('scrollend',flushPending,{passive:true});}catch(_e){}
  }

  function viewportAnchor(list){
    try{
      if(isScrollActive()||!list||window.scrollY<80)return null;
      var cards=[].slice.call(list.querySelectorAll('.miniCard:not(.happyadSkeletonCard)'));
      for(var i=0;i<cards.length;i++){
        var r=cards[i].getBoundingClientRect();
        if(r.bottom>48){
          return {id:String(cards[i].dataset.feedKey||cards[i].dataset.postId||''),top:r.top};
        }
      }
    }catch(_e){}
    return null;
  }
  function restoreAnchor(list,anchor,appendOnly){
    if(appendOnly||!anchor||!anchor.id||isScrollActive())return;
    try{
      if(isScrollActive())return;
      var cards=[].slice.call(list.querySelectorAll('.miniCard[data-post-id]'));
      var node=cards.find(function(x){return String(x.dataset.feedKey||x.dataset.postId||'')===anchor.id;});
      if(!node)return;
      var delta=node.getBoundingClientRect().top-Number(anchor.top||0);
      var limit=Math.max(1400,(window.innerHeight||700)*2.2);
      /* V929 — le recalage a lieu dans le même cycle que la réconciliation, avant
         la prochaine peinture. L'ancien requestAnimationFrame montrait d'abord la
         mauvaise position puis lançait un scrollBy visible une image plus tard. */
      if(Math.abs(delta)>=1&&Math.abs(delta)<limit&&!isScrollActive()){
        var root=document.scrollingElement||document.documentElement||document.body;
        var current=Math.max(0,Number(window.scrollY||window.pageYOffset||(root&&root.scrollTop)||0));
        if(root)root.scrollTop=Math.max(0,current+delta);
        else window.scrollTo(0,Math.max(0,current+delta));
      }
    }catch(_e){}
  }

  function dispose(card){
    try{call('disposeCard',card);}catch(_e){}
    try{card.__happyadPost=null;card.__happyadVideo=false;}catch(_e){}
  }
  function isAppendOnly(oldCards,targetKeys,targetItems,previousMode,nextMode){
    if(previousMode!==nextMode||oldCards.length>targetKeys.length)return false;
    for(var i=0;i<oldCards.length;i++){
      var oldKey=String(oldCards[i].dataset.feedKey||oldCards[i].dataset.postId||'');
      if(oldKey!==String(targetKeys[i]||''))return false;
      if(String(oldCards[i].dataset.feedSig||'')!==postSignature(targetItems[i]))return false;
    }
    return true;
  }
  function clearTransient(list){
    try{list.querySelectorAll('.happyadHomeVirtualSpacerV616,.happyadSkeletonCard,.empty').forEach(function(x){x.remove();});}catch(_e){}
  }

  function render(nextItems,nextMode,opts){
    if(busy)return {busy:true};
    var list=call('getList');if(!list)return {missingList:true};
    busy=true;
    try{
      nextItems=Array.isArray(nextItems)?nextItems:[];opts=opts||{};
      var limit=Math.max(0,Number(call('getRenderLimit')||nextItems.length));
      var loaded=Math.min(limit,nextItems.length);
      var target=nextItems.slice(0,loaded);
      var targetKeys=target.map(keyOf);
      var previousMode=mode;
      var oldCards=[].slice.call(list.querySelectorAll('.miniCard:not(.happyadSkeletonCard)'));
      var anchor=viewportAnchor(list);
      var appendOnly=isAppendOnly(oldCards,targetKeys,target,previousMode,nextMode);
      var newPosts=[];

      mode=nextMode||'';
      items=nextItems;
      window.__happyadHomeWindowStartV616=0; // compat Media Loader : les premieres cartes restent prioritaires.
      list.className=mode;
      clearTransient(list);

      if(appendOnly){
        /* Chemin critique : une pagination normale n'effectue AUCUNE operation DOM
           sur les cartes deja presentes. Seules les nouvelles cartes sont ajoutees. */
        for(var ai=oldCards.length;ai<target.length;ai++){
          var post=target[ai];
          var card=call('createCard',post);
          if(!card)continue;
          bindPayload(card,post,ai);
          card.dataset.virtualIndex=String(ai);
          card.dataset.happyadProgressiveNewV764='1';
          var sentinel=document.getElementById('happyadHomePaginationSentinelV694');
          if(sentinel&&sentinel.parentNode===list)list.insertBefore(card,sentinel);else list.appendChild(card);
          newPosts.push(post);
        }
      }else{
        var reusable=Object.create(null);
        if(previousMode===mode){
          oldCards.forEach(function(card){var id=String(card.dataset.feedKey||card.dataset.postId||'');if(id&&!reusable[id])reusable[id]=card;});
        }
        var wanted=Object.create(null),ordered=[];
        for(var i=0;i<target.length;i++){
          var item=target[i],id=targetKeys[i];wanted[id]=1;
          var oldCard=reusable[id]||null;
          var same=!!(oldCard&&String(oldCard.dataset.feedSig||'')===postSignature(item));
          var card=same?oldCard:call('createCard',item);
          if(!card)continue;
          bindPayload(card,item,i);card.dataset.virtualIndex=String(i);
          if(!same){
            card.dataset.happyadProgressiveNewV764='1';newPosts.push(item);
            if(oldCard){
              /* V929 — aucune min-height temporaire retirée 900 ms plus tard :
                 cette seconde mutation était capable de déplacer tout le fil. */
              try{oldCard.replaceWith(card);}catch(_r){}
              dispose(oldCard);
            }
          }
          ordered.push(card);
        }
        var cursor=list.firstElementChild;
        ordered.forEach(function(card){
          if(card===cursor){cursor=cursor.nextElementSibling;return;}
          list.insertBefore(card,cursor||null);
        });
        oldCards.forEach(function(card){
          var id=String(card.dataset.feedKey||card.dataset.postId||'');
          if(previousMode!==mode||!wanted[id]){dispose(card);try{card.remove();}catch(_e){}}
        });
        restoreAnchor(list,anchor,false);
      }

      if(newPosts.length){
        /* V856 POINT 1 — les cartes Annonce n'ont pas d'actions sociales : elles ne
           déclenchent donc aucune lecture/amorçage du moteur J'aime/Commentaire/etc. */
        var socialPosts=newPosts.filter(function(x){x=x||{};return !isMarketplace(x);});
        if(socialPosts.length)Promise.resolve().then(function(){return call('primeActions',socialPosts);}).catch(function(e){console.warn('home view actions batch',e);});
      }
      return {appendOnly:appendOnly,loaded:loaded,newCards:newPosts.length,mode:mode};
    }finally{busy=false;}
  }

  function getItemByMediaId(id){
    id=String(id||'');var found=null;
    (items||[]).some(function(p){
      if(String(p&&p.id||'')===id){found=p;return true;}
      var a=(p&&p.__albumItems)||[];for(var i=0;i<a.length;i++){if(String(a[i]&&a[i].id||'')===id){found=Object.assign({},p,{__startAlbumIndex:i});return true;}}
      return false;
    });
    return found;
  }

  function reset(){mode='';items=[];busy=false;window.__happyadHomeWindowStartV616=0;return true;}
  function maintain(){return false;}

  var api={
    version:VERSION,connect:connect,render:render,reset:reset,maintain:maintain,getItemByMediaId:getItemByMediaId,postSignature:postSignature,
    markScrollActive:markScrollActive,isScrollActive:isScrollActive,currentMode:currentMode
  };
  window.HappyHomeFeedViewV1=api;
})();
