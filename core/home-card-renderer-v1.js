/* Fyblic HOME CARD RENDERER V1
   Responsabilité unique : construire une carte Accueil à partir d'une publication
   déjà ordonnée/normalisée par Home Feed Master. Ce module ne trie, ne pagine et
   ne modifie jamais la chronologie du fil. */
(function(){
  'use strict';
  if(window.HappyHomeCardRendererV1)return;

  var VERSION='V991_HOME_DOUBLE_TAP_LOVE_INLINE_MORE';
  var bridge=null;

  function connect(adapter){bridge=adapter||null;return api;}
  function b(name){return bridge&&typeof bridge[name]==='function'?bridge[name]:null;}
  function call(name){var fn=b(name);if(!fn)return undefined;return fn.apply(bridge,[].slice.call(arguments,1));}
  function safeText(v){return String(v==null?'':v);}
  function esc(v){var fn=b('esc');if(fn)return fn(v);return safeText(v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}
  function mentionHtml(v,p){try{var m=window.HappyMentionRenderV937R1;if(m&&typeof m.html==='function')return m.html(v,p);}catch(_e){}return esc(v);}
  function visibleTitle(v){
    v=safeText(v).trim();
    if(!v||/^(publication|photo|vid[eé]o)\s+(?:happyad|fyblic)$/i.test(v))return '';
    return v;
  }
  function visibleMeta(v){
    v=safeText(v).trim();
    return /^publication$/i.test(v)?'':v;
  }
  function visibleCreatorSubline(v){
    v=safeText(v).trim();
    return /^(?:happyad|fyblic)$/i.test(v)?'':v;
  }
  function bindCardFollowV986(card,ownerUid,ownerName){
    try{
      ownerUid=safeText(ownerUid).trim();
      if(!card||!ownerUid)return;
      var top=card.querySelector('.miniTop'),avatar=top&&top.querySelector('.avatar');
      if(!top||!avatar)return;
      var wrap=avatar.parentElement&&avatar.parentElement.classList&&avatar.parentElement.classList.contains('haHomeAvatarFollowWrapV986')?avatar.parentElement:null;
      if(!wrap){
        wrap=document.createElement('div');
        wrap.className='haHomeAvatarFollowWrapV986';
        top.insertBefore(wrap,avatar);
        wrap.appendChild(avatar);
      }
      var button=wrap.querySelector('.happyadHomeAvatarFollowV986');
      if(!button){
        button=document.createElement('button');
        button.type='button';
        button.className='happyadHomeAvatarFollowV986';
        button.hidden=true;
        button.dataset.happyadFollowVisual='compact-svg-v986';
        button.setAttribute('aria-label','S’abonner à '+safeText(ownerName||'ce créateur'));
        wrap.appendChild(button);
      }
      var master=window.HappyFollowMasterV855R34||window.HappyFollowMaster||null;
      if(master&&typeof master.bindOneWay==='function')master.bindOneWay(button,{targetUid:ownerUid});
    }catch(_e){}
  }
  function videoViewsBadge(v){
    var value=esc(v==null?'0':v);
    return '<div class="happyadVideoViewsBadge" aria-label="'+value+' vues"><svg class="happyadVideoViewsPlaySvg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5.25 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L8.03 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"></path></svg><span class="happyadVideoViewsCount">'+value+'</span></div>';
  }

  function roundedLoveSvg(className){
    return '<svg class="'+className+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 21.15C10.92 20.18 4.34 16.05 2.57 10.62 1.35 6.88 3.58 3.2 7.34 3.2c1.98 0 3.68.96 4.66 2.47.98-1.51 2.68-2.47 4.66-2.47 3.76 0 5.99 3.68 4.77 7.42-1.77 5.43-8.35 9.56-9.43 10.53Z"></path></svg>';
  }
  function showDoubleTapLove(media,event){
    try{
      if(!media)return;
      var previous=media.querySelector('.happyadHomeLoveBurstV991');
      if(previous)previous.remove();
      var rect=media.getBoundingClientRect();
      var clientX=event&&isFinite(Number(event.clientX))?Number(event.clientX):(rect.left+rect.width/2);
      var clientY=event&&isFinite(Number(event.clientY))?Number(event.clientY):(rect.top+rect.height/2);
      var x=Math.max(64,Math.min(Math.max(64,rect.width-64),clientX-rect.left));
      var y=Math.max(72,Math.min(Math.max(72,rect.height-76),clientY-rect.top));
      var burst=document.createElement('div');
      burst.className='happyadHomeLoveBurstV991';
      burst.setAttribute('aria-hidden','true');
      burst.style.setProperty('--ha-home-love-x',x+'px');
      burst.style.setProperty('--ha-home-love-y',y+'px');
      burst.innerHTML='<span class="happyadHomeLoveMainV991">'+roundedLoveSvg('happyadHomeLoveEchoV991 e1')+roundedLoveSvg('happyadHomeLoveEchoV991 e2')+roundedLoveSvg('happyadHomeLoveCoreV991')+'</span><span class="happyadHomeLoveSparkV991 s1">'+roundedLoveSvg('happyadHomeLoveSmallV991')+'</span><span class="happyadHomeLoveSparkV991 s2">'+roundedLoveSvg('happyadHomeLoveSmallV991')+'</span><span class="happyadHomeLoveSparkV991 s3">'+roundedLoveSvg('happyadHomeLoveSmallV991')+'</span><span class="happyadHomeLoveSparkV991 s4">'+roundedLoveSvg('happyadHomeLoveSmallV991')+'</span>';
      media.appendChild(burst);
      setTimeout(function(){try{burst.remove();}catch(_e){}},1250);
    }catch(_e){}
  }
  function openCardMedia(card,p,video,expanded){
    var cp=card.__happyadPost||p;
    if(video)return call('openVideo',cp&&cp.id,cp);
    return call('openPhoto',cp&&cp.id,expanded?Object.assign({},cp,{__happyadOpenDescriptionExpandedV983:true}):cp);
  }
  function bindTapOpenAndDoubleLike(card,p,video){
    try{
      var media=card&&card.querySelector&&card.querySelector('.miniMedia');
      if(!media||media.__happyadTapOpenV991)return;
      media.__happyadTapOpenV991=1;
      var downX=0,downY=0,moved=false,lastTap=0,lastX=0,lastY=0,openTimer=0;
      function clearOpen(){if(openTimer){clearTimeout(openTimer);openTimer=0;}}
      function resetPointer(){moved=false;}
      function performDouble(e){
        clearOpen();lastTap=0;
        var btn=card.querySelector('[data-card-act="like"]');
        var cp=card.__happyadPost||p;
        var a=call('getAction',cp&&cp.id)||{};
        if(btn&&!(a&&a.like))btn.click();
        showDoubleTapLove(media,e);
        try{card.classList.remove('happyadHomeDoubleTapPulseV991');void card.offsetWidth;card.classList.add('happyadHomeDoubleTapPulseV991');setTimeout(function(){card.classList.remove('happyadHomeDoubleTapPulseV991');},260);}catch(_pulse){}
      }
      if('PointerEvent' in window){
        media.addEventListener('pointerdown',function(e){
          if(e.button!=null&&e.button!==0)return;
          downX=Number(e.clientX||0);downY=Number(e.clientY||0);moved=false;
        },{passive:true});
        media.addEventListener('pointermove',function(e){
          if(Math.abs(Number(e.clientX||0)-downX)>11||Math.abs(Number(e.clientY||0)-downY)>11)moved=true;
        },{passive:true});
        media.addEventListener('pointercancel',function(){clearOpen();lastTap=0;resetPointer();},{passive:true});
        media.addEventListener('pointerup',function(e){
          if(e.button!=null&&e.button!==0)return;
          if(moved){lastTap=0;clearOpen();resetPointer();return;}
          var now=Date.now(),x=Number(e.clientX||0),y=Number(e.clientY||0);
          var near=Math.abs(x-lastX)<58&&Math.abs(y-lastY)<58;
          if(lastTap&&near&&now-lastTap<280){performDouble(e);e.preventDefault();e.stopPropagation();return;}
          lastTap=now;lastX=x;lastY=y;clearOpen();
          openTimer=setTimeout(function(){openTimer=0;lastTap=0;openCardMedia(card,p,video,false);},290);
        },false);
        media.addEventListener('click',function(e){
          if(e.target&&e.target.closest&&e.target.closest('button,a,[data-card-act]'))return;
          e.preventDefault();e.stopPropagation();
        },true);
      }else{
        media.addEventListener('click',function(e){
          if(e.target&&e.target.closest&&e.target.closest('button,a,[data-card-act]'))return;
          e.preventDefault();e.stopPropagation();
          var now=Date.now();
          if(lastTap&&now-lastTap<280){performDouble(e);return false;}
          lastTap=now;clearOpen();
          openTimer=setTimeout(function(){openTimer=0;lastTap=0;openCardMedia(card,p,video,false);},290);
          return false;
        },true);
      }
    }catch(_e){}
  }
  function bindNormalInlineMore(card,p,video){
    try{
      var wrap=card.querySelector('.happyadInlineDescWrapV991'),desc=wrap&&wrap.querySelector('.happyadInlineDescV991'),btn=wrap&&wrap.querySelector('.happyadInlineMoreV991');
      if(!wrap||!desc||!btn)return;
      var attempts=0;
      function measure(){
        if(!card.isConnected){if(attempts++<12)setTimeout(measure,40);return;}
        btn.hidden=true;wrap.classList.remove('hasMore');
        var more=desc.scrollHeight>desc.clientHeight+2;
        if(more){wrap.classList.add('hasMore');btn.hidden=false;}
      }
      setTimeout(function(){requestAnimationFrame(measure);},0);
      btn.onclick=function(e){e.preventDefault();e.stopPropagation();openCardMedia(card,p,video,true);return false;};
    }catch(_e){}
  }
  function bindMarketplaceInlineMore(card){
    try{
      var wrap=card.querySelector('.happyadMarketplaceDescWrapV991'),desc=wrap&&wrap.querySelector('.happyadMarketplaceDescV856'),btn=wrap&&wrap.querySelector('.happyadMarketplaceMoreV991');
      if(!wrap||!desc||!btn)return;
      var attempts=0;
      function measure(){
        if(!card.isConnected){if(attempts++<12)setTimeout(measure,40);return;}
        wrap.classList.remove('expanded','hasMore');btn.textContent='Voir plus';btn.hidden=true;
        var more=desc.scrollHeight>desc.clientHeight+2;
        if(more){wrap.classList.add('hasMore');btn.hidden=false;}
      }
      setTimeout(function(){requestAnimationFrame(measure);},0);
      btn.onclick=function(e){
        e.preventDefault();e.stopPropagation();
        var expanded=wrap.classList.toggle('expanded');
        btn.textContent=expanded?'Réduire':'Voir plus';
        return false;
      };
    }catch(_e){}
  }


  function truth(v){return v===true||v===1||/^(true|1|yes|oui|on)$/i.test(safeText(v).trim());}
  function isMarketplace(p){p=p||{};return truth(p.happyadMarketplace)||truth(p.happyad_marketplace)||truth(p.is_marketplace)||safeText(p.mode).trim().toLowerCase()==='marketplace';}

  function createMarketplaceCard(p){
    var video=!!call('isVideo',p);
    var owner=call('ownerData',p)||{};
    var name=owner.name||'Utilisateur Fyblic';
    var ownerUid=safeText(owner.id||owner.user_id||p.creatorId||p.creator_id||p.user_id||p.owner_id||p.author_id||'').trim();
    var title=p.title||'Annonce Fyblic';
    var rawDesc=safeText(p.desc||p.description||p.caption||'').trim();
    var desc=(rawDesc&&rawDesc!==safeText(title).trim())?rawDesc:'';
    var creatorSubline=visibleCreatorSubline(p.location);
    var meta=creatorSubline?('📍 '+creatorSubline):(p.marketplaceCategory||p.marketplace_category||p.category||'Annonce');
    var card=document.createElement('div');
    card.__happyadPost=p;
    card.__happyadVideo=video;
    card.className='miniCard happyadMarketplaceDedicatedCardV856'+(video?' videoCard':'');
    card.dataset.postId=safeText(p.id||p.post_id||'');
    card.dataset.feedKey=safeText(p.__feedCardKey||('post:'+safeText(p.id||p.post_id||'')));
    card.dataset.happyadMarketplace='1';
    if(ownerUid)card.dataset.happyadOwnerUid=ownerUid;
    var av=owner.avatar?'<img src="'+esc(owner.avatar)+'" alt="">':'<span class="happyadDefaultProfileAvatarV989" aria-hidden="true"></span>';
    var avatarAttrs=(ownerUid?' data-happyad-avatar-uid="'+esc(ownerUid)+'"':'')+' data-happyad-avatar-name="'+esc(name)+'"';
    var ago=call('timeAgo',call('postTimestamp',p))||'';
    var badge=call('badgeHtml',owner.badge)||'';
    card.innerHTML='<div class="miniCardFrame"><div class="miniTop"><div class="avatar"'+avatarAttrs+'>'+av+'</div><div class="creator'+(creatorSubline?'':' haCreatorSingleLineV984')+'"><b>'+esc(name)+badge+'</b>'+(creatorSubline?'<span>'+esc(creatorSubline)+'</span>':'')+'</div><div class="miniPostDate">'+esc(ago)+'</div><span class="happyadMarketplaceHomeTagV856">ANNONCE</span></div><div class="miniMedia">'+(video?'<div class="play">▶</div>':'')+'</div><div class="happyadMarketplaceCtaRowV856"><button class="happyadMarketplaceCardCtaV856" type="button"><span>Voir l’annonce</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div><div class="miniBody"><div class="miniTitleRow"><div class="miniTitle">'+esc(title||'Annonce Fyblic')+'</div><button class="happyadMarketplaceShareOnlyV857" type="button" data-card-act="share" aria-label="Partager l’annonce"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button></div>'+(desc?'<div class="happyadMarketplaceDescWrapV991"><div class="miniDesc happyadMarketplaceDescV856">'+esc(desc)+'</div><button class="happyadMarketplaceMoreV991" type="button" hidden>Voir plus</button></div>':'')+'<div class="miniMeta">'+esc(meta)+'</div></div></div>';
    bindCardFollowV986(card,ownerUid,name);
    bindMarketplaceInlineMore(card);
    try{var top=card.querySelector('.miniTop');if(top)top.onclick=function(e){e.preventDefault();e.stopPropagation();return call('openProfile',card.__happyadPost||p);};}catch(_e){}
    var cta=card.querySelector('.happyadMarketplaceCardCtaV856');
    if(cta)cta.onclick=function(e){e.preventDefault();e.stopPropagation();var cp=card.__happyadPost||p;return call('openListing',cp&& (cp.id||cp.post_id),cp);};
    var media=card.querySelector('.miniMedia');
    if(media)media.onclick=function(e){e.preventDefault();e.stopPropagation();var cp=card.__happyadPost||p;if(video)return call('openVideo',cp&&(cp.id||cp.post_id),cp);return call('openPhoto',cp&&(cp.id||cp.post_id),cp);};
    card.onclick=function(e){if(e.target&&e.target.closest&&e.target.closest('button,a,.miniTop,.miniMedia'))return;var cp=card.__happyadPost||p;if(video)return call('openVideo',cp&&(cp.id||cp.post_id),cp);return call('openPhoto',cp&&(cp.id||cp.post_id),cp);};
    if(!video){try{call('preparePhotoRatio',card.querySelector('.miniMedia'),p);}catch(_e){}}
    call('observeMedia',card,p,video);
    return card;
  }

  function createCard(p){
    if(!p)throw new Error('HappyHomeCardRendererV1.createCard: post manquant');
    if(isMarketplace(p))return createMarketplaceCard(p);
    call('primeAction',p);
    var video=!!call('isVideo',p);
    var owner=call('ownerData',p)||{};
    var name=owner.name||'Utilisateur Fyblic';
    var ownerUid=safeText(owner.id||owner.user_id||p.creatorId||p.creator_id||p.user_id||p.owner_id||p.author_id||'').trim();
    var rawTitle=safeText(p.title||'').trim();
    var title=visibleTitle(rawTitle);
    var rawDesc=safeText(p.desc||p.description||p.caption||'').trim();
    var desc=(rawDesc&&rawDesc!==rawTitle)?rawDesc:'';
    var creatorSubline=visibleCreatorSubline(p.location);
    var meta=visibleMeta(creatorSubline?('📍 '+creatorSubline):(p.category||'Publication'));
    var card=document.createElement('div');
    card.__happyadPost=p;
    card.className='miniCard'+(video?' videoCard':'')+(call('isLive',p)?' isLive':'');
    card.dataset.postId=safeText(p.id||'');
    card.dataset.feedKey=safeText(p.__feedCardKey||('post:'+safeText(p.id||'')));
    if(ownerUid)card.dataset.happyadOwnerUid=ownerUid;

    var av=owner.avatar?'<img src="'+esc(owner.avatar)+'" alt="">':'<span class="happyadDefaultProfileAvatarV989" aria-hidden="true"></span>';
    var avatarAttrs=(ownerUid?' data-happyad-avatar-uid="'+esc(ownerUid)+'"':'')+' data-happyad-avatar-name="'+esc(name)+'"';
    var ago=call('timeAgo',call('postTimestamp',p))||'';
    var album=!video&&Number(p&&p.__albumCount||0)>1;

    if(album){
      call('prepareAlbumShell',card,p);
      bindCardFollowV986(card,ownerUid,name);
      call('refreshAction',card,p.id);
      call('observeCard',card,p,false);
      return card;
    }

    var badge=call('badgeHtml',owner.badge)||'';
    var body=(title||desc||meta)?'<div class="miniBody haSocialBodyV983">'+(title?'<div class="miniTitleRow"><div class="miniTitle">'+esc(title)+'</div></div>':'')+(desc?'<div class="happyadInlineDescWrapV991"><div class="miniDesc happyadInlineDescV991">'+mentionHtml(desc,p)+'</div><button class="miniSeeMore happyadInlineMoreV991" type="button" hidden>Voir plus</button></div>':'')+(meta?'<div class="miniMeta">'+esc(meta)+'</div>':'')+'</div>':'';
    card.innerHTML='<div class="miniCardFrame"><div class="miniTop"><div class="avatar"'+avatarAttrs+'>'+av+'</div><div class="creator'+(creatorSubline?'':' haCreatorSingleLineV984')+'"><b>'+esc(name)+badge+'</b>'+(creatorSubline?'<span>'+esc(creatorSubline)+'</span>':'')+'</div><div class="miniPostDate">'+esc(ago)+'</div></div><div class="miniMedia"><div class="play">▶</div></div>'+body+'<div class="miniActions"><button class="actionBtn" data-card-act="like"><span class="haLineIcon haLikeIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20.8 4.6c-1.9-1.7-4.9-1.5-6.6.5L12 7.6 9.8 5.1C8.1 3.1 5.1 2.9 3.2 4.6 1.1 6.5 1 9.7 3 11.7l9 8.6 9-8.6c2-2 1.9-5.2-.2-7.1z"/></svg></span><small>0</small></button><button class="actionBtn" data-card-act="comment"><span class="haLineIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9.6 9.6 0 0 1-4-.9L3 20l1.1-4.2A8.3 8.3 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z"/></svg></span><small>0</small></button><button class="actionBtn" data-card-act="share"><span class="haLineIcon" aria-hidden="true"><svg class="haSharePlaneSvg" viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></span><small>0</small></button><button class="actionBtn" data-card-act="repost"><span class="haLineIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></span><small>0</small></button><button class="actionBtn fav" data-card-act="fav"><span class="haLineIcon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></svg></span></button></div></div>';

    bindCardFollowV986(card,ownerUid,name);

    try{
      var top=card.querySelector('.miniTop');
      if(top)top.onclick=function(e){e.preventDefault();e.stopPropagation();return call('openProfile',card.__happyadPost||p);};
    }catch(_e){}

    bindNormalInlineMore(card,p,video);
    bindTapOpenAndDoubleLike(card,p,video);
    if(!video){try{call('preparePhotoRatio',card.querySelector('.miniMedia'),p);}catch(_e){}}

    if(video){
      var media=card.querySelector('.miniMedia');
      var a=call('getAction',p.id)||{};
      var views=call('formatViews',(a&&a.views)||p.views_count||p.video_views_count||0)||'0';
      if(media)media.insertAdjacentHTML('beforeend','<div class="videoHint">Ouvrir vidéo longue</div>'+videoViewsBadge(views));
      else card.insertAdjacentHTML('beforeend',videoViewsBadge('0'));
      card.onclick=function(e){if(e.target&&e.target.closest&&e.target.closest('[data-card-act],button,a,.miniTop,.miniMedia'))return;var cp=card.__happyadPost||p;call('openVideo',cp&&cp.id,cp);};
    }else{
      card.onclick=function(e){if(e.target&&e.target.closest&&e.target.closest('[data-card-act],button,a,.miniTop,.miniMedia'))return;var cp=card.__happyadPost||p;call('openPhoto',cp&&cp.id,cp);};
    }

    call('refreshAction',card,p.id);
    call('observeCard',card,p,video);
    return card;
  }

  var api={version:VERSION,connect:connect,createCard:createCard,showDoubleTapLove:showDoubleTapLove};
  window.HappyHomeCardRendererV1=api;
})();
