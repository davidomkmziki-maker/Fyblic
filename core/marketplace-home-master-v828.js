/* Fyblic V828 — couvertures Marketplace réellement injectées dans Accueil,
   ouverture exacte de l'annonce, vues uniques et compatibilité photo/vidéo. */
(function(){
  'use strict';
  if(window.__HAPPYAD_MARKETPLACE_HOME_MASTER_V828__)return;
  window.__HAPPYAD_MARKETPLACE_HOME_MASTER_V828__=true;

  var VERSION='V991_MARKETPLACE_THREE_LINE_DESCRIPTION';
  var observed=new WeakSet();
  var pending=new Map();
  var refreshTimer=0;
  var realtimeChannel=null;
  var lastFullscreenId='';

  function clean(value){return String(value==null?'':value).replace(/\s+/g,' ').trim();}
  function truth(value){return value===true||value===1||/^(true|1|yes|oui|on)$/i.test(clean(value));}
  function isMarketplace(post){post=post||{};return post.happyadMarketplace===true||post.happyad_marketplace===true||post.is_marketplace===true||clean(post.mode).toLowerCase()==='marketplace';}
  function showOnHome(post){post=post||{};return truth(post.marketplaceShowOnHome)||truth(post.marketplace_show_on_home)||truth(post.showOnHome)||truth(post.marketplace_details&&post.marketplace_details.show_on_home);}
  function idOf(post){return clean(post&&(post.id||post.post_id||post.listing_id));}
  function client(){
    try{if(typeof window.happyadSb==='function'){var c=window.happyadSb();if(c&&typeof c.from==='function')return c;}}catch(_e){}
    try{if(window.happyadSupabase&&typeof window.happyadSupabase.from==='function')return window.happyadSupabase;}catch(_e){}
    try{if(window.supabaseClient&&typeof window.supabaseClient.from==='function')return window.supabaseClient;}catch(_e){}
    return null;
  }
  function mediaType(row){
    var raw=clean(row&&(
      row.marketplace_cover_type||row.media_type||row.mediaType||row.kind||row.type
    )).toLowerCase();
    var url=clean(row&&(row.marketplace_cover_url||row.media_url||row.mediaUrl));
    return raw.indexOf('video')>=0||/\.(mp4|webm|mov|m4v|3gp)(?:[?#]|$)/i.test(url)?'video':'photo';
  }
  function mapRow(row){
    row=row||{};
    var mapped=null;
    try{if(typeof window.mapHappyPost==='function')mapped=window.mapHappyPost(row);}catch(_e){}
    mapped=mapped&&typeof mapped==='object'?mapped:{};
    var cover=clean(row.marketplace_cover_url||row.media_url||mapped.mediaUrl||mapped.media_url);
    var coverPath=clean(row.marketplace_cover_path||row.media_path||mapped.mediaPath||mapped.media_path);
    var kind=mediaType(row);
    return Object.assign({},mapped,row,{
      id:idOf(row)||idOf(mapped),post_id:idOf(row)||idOf(mapped),
      mode:'marketplace',happyadMarketplace:true,happyad_marketplace:true,is_marketplace:true,
      marketplaceShowOnHome:true,marketplace_show_on_home:true,showOnHome:true,
      marketplaceCategory:row.marketplace_category||row.category||mapped.category||'',marketplace_category:row.marketplace_category||row.category||mapped.category||'',
      marketplaceCoverIndex:Number(row.marketplace_cover_index||0)||0,marketplace_cover_index:Number(row.marketplace_cover_index||0)||0,
      marketplaceCoverUrl:cover,marketplace_cover_url:cover,
      marketplaceCoverPath:coverPath,marketplace_cover_path:coverPath,
      marketplaceCoverType:kind==='video'?'video':'image',marketplace_cover_type:kind==='video'?'video':'image',
      mediaUrl:cover,media_url:cover,mediaPath:coverPath,media_path:coverPath,
      kind:kind,mediaType:kind,media_type:kind,
      listingViewsCount:Number(row.listing_views_count||0)||0,listing_views_count:Number(row.listing_views_count||0)||0,
      sellerBadge:clean(row.seller_badge||row.badge||row.user_badge),seller_badge:clean(row.seller_badge||row.badge||row.user_badge),
      createdAt:row.created_at?new Date(row.created_at).getTime():(Number(mapped.createdAt)||Date.now()),
      supabase:true,__homeServerConfirmedV643:true
    });
  }
  function marketplaceSignatureV869(post){post=post||{};return JSON.stringify([idOf(post),clean(post.marketplace_cover_url||post.marketplaceCoverUrl||post.media_url||post.mediaUrl),clean(post.marketplace_cover_path||post.marketplaceCoverPath||post.media_path||post.mediaPath),clean(post.marketplace_cover_type||post.marketplaceCoverType||post.media_type||post.kind),Number(post.marketplace_cover_index||post.marketplaceCoverIndex||0),Number(post.listing_views_count||post.listingViewsCount||0),clean(post.listing_status),truth(post.marketplace_show_on_home||post.marketplaceShowOnHome),clean(post.seller_badge||post.sellerBadge||post.badge||post.user_badge)]);}
  function allPosts(){
    try{if(typeof ALL_POSTS!=='undefined'&&Array.isArray(ALL_POSTS))return ALL_POSTS;}catch(_e){}
    try{return Array.isArray(window.ALL_POSTS)?window.ALL_POSTS:[];}catch(_e){return [];}
  }
  function postById(id){id=clean(id);if(!id)return null;return allPosts().find(function(post){return idOf(post)===id;})||null;}
  function writeCache(key,list,store){
    store=store||localStorage;
    try{
      var raw=JSON.parse(store.getItem(key)||'null'),shape='array';
      if(raw&&Array.isArray(raw.posts))shape='posts';else if(raw&&Array.isArray(raw.data))shape='data';
      var next=list.slice(0,120);
      if(shape==='posts'){raw=raw||{};raw.posts=next;store.setItem(key,JSON.stringify(raw));}
      else if(shape==='data'){raw=raw||{};raw.data=next;store.setItem(key,JSON.stringify(raw));}
      else store.setItem(key,JSON.stringify(next));
    }catch(_e){}
  }
  function mergeRows(rows){
    rows=(rows||[]).map(mapRow).filter(function(x){return idOf(x)&&showOnHome(x);});
    /* HOME FEED V1 : Marketplace n'est plus propriétaire de la chronologie.
       Il peut enrichir une annonce déjà chargée, jamais en ajouter, supprimer,
       trier ou déplacer une carte du fil principal. */
    var existingBy=Object.create(null);allPosts().forEach(function(post){var id=idOf(post);if(id)existingBy[id]=post;});
    var patches=rows.filter(function(row){var old=existingBy[idOf(row)];return !!old&&marketplaceSignatureV869(old)!==marketplaceSignatureV869(row);});
    var before=allPosts(),next=before;
    window.__HAPPYAD_MARKETPLACE_HOME_ROWS_V828=rows.slice();
    if(!patches.length)return before;
    try{
      if(typeof window.happyadFeedPatchExistingV1==='function')next=window.happyadFeedPatchExistingV1(patches)||before;
      else{
        var map={};patches.forEach(function(row){map[idOf(row)]=row;});
        next=before.map(function(post){return map[idOf(post)]?Object.assign({},post,map[idOf(post)]):post;});
      }
    }catch(_e){next=before;}
    try{if(typeof window.happyadSaveHomeFastCache==='function')window.happyadSaveHomeFastCache(next);}catch(_e){}
    try{if(typeof window.happyadRenderHomeFeedWhenIdleV794==='function')window.happyadRenderHomeFeedWhenIdleV794('marketplace-patch-feed-v1');}catch(_e){}
    setTimeout(scanCards,80);
    return next;
  }

  async function fetchSelected(){
    var c=client();if(!c)return [];
    var q=c.from('happyad_posts').select('*')
      .eq('happyad_marketplace',true)
      .eq('marketplace_show_on_home',true)
      .eq('listing_status','active')
      .eq('is_active',true)
      .is('deleted_at',null)
      .order('created_at',{ascending:false})
      .limit(60);
    var result=await q;if(result&&result.error)throw result.error;return (result&&result.data)||[];
  }
  function refresh(reason){
    clearTimeout(refreshTimer);
    refreshTimer=0;
    var run=function(){return fetchSelected().then(mergeRows).catch(function(error){console.warn('Fyblic marketplace home '+reason,error);});};
    try{
      var coordinator=window.HappyadConnectionWorkCoordinatorV869;
      if(coordinator&&typeof coordinator.schedule==='function')return coordinator.schedule('home-marketplace-refresh-v869',run,{surface:'home',delay:reason==='boot'?300:700,maxDelay:4200,minGap:reason==='stability'?60000:8000});
    }catch(_e){}
    refreshTimer=setTimeout(run,reason==='boot'?300:700);
    return true;
  }

  function currentUid(){
    try{var uid=clean(localStorage.getItem('HAPPYAD_AUTH_UID'));if(uid)return uid;}catch(_e){}
    try{var u=JSON.parse(localStorage.getItem('HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL')||'{}');return clean(u&&(u.id||u.user_id||u.uid));}catch(_e){return '';}
  }

  function applyOwnerMutationV933(detail){
    detail=detail||{};var id=clean(detail.id||detail.listing_id);if(!id)return false;
    var action=clean(detail.action).toLowerCase(),posts=allPosts(),changed=false;
    for(var i=posts.length-1;i>=0;i--){
      if(idOf(posts[i])!==id)continue;
      if(action==='pause'||action==='delete'){posts.splice(i,1);changed=true;continue;}
      if(action==='activate'){posts[i].listing_status='active';posts[i].status='active';posts[i].is_active=true;changed=true;}
    }
    if(action==='pause'||action==='delete'){
      try{document.querySelectorAll('[data-post-id="'+(window.CSS&&CSS.escape?CSS.escape(id):id)+'"]').forEach(function(node){if(node.classList.contains('miniCard')||node.closest&&node.closest('#list'))node.remove();});}catch(_e){}
    }
    try{if(changed&&typeof window.happyadSaveHomeFastCache==='function')window.happyadSaveHomeFastCache(posts);}catch(_e){}
    try{document.querySelectorAll('.happyadAppFrame,iframe').forEach(function(frame){if(frame&&frame.contentWindow)frame.contentWindow.postMessage({type:'HAPPYAD_MARKETPLACE_OWNER_MUTATION_V933',detail:detail},'*');});}catch(_e){}
    if(action==='activate'){refresh('owner-activate-v933');try{if(typeof window.happyadRefreshHomePostsNow==='function')window.happyadRefreshHomePostsNow('market-owner-activate-v933');}catch(_e){}}
    return changed;
  }
  function viewerKey(){
    var uid=currentUid();if(uid)return 'user:'+uid;
    var key='HAPPYAD_LISTING_VIEWER_KEY_V820',value='';try{value=clean(localStorage.getItem(key));}catch(_e){}
    if(value.length<8){value='device:'+Date.now().toString(36)+':'+Math.random().toString(36).slice(2,12);try{localStorage.setItem(key,value);}catch(_e){}}
    return value;
  }
  function viewMark(id,key){return 'HAPPYAD_LISTING_VIEWED_V820_'+String(id).replace(/[^a-zA-Z0-9_-]/g,'_')+'_'+String(key).replace(/[^a-zA-Z0-9_-]/g,'_').slice(-48);}
  async function recordView(post,source){
    var id=idOf(post);if(!id||!isMarketplace(post))return 0;
    var key=viewerKey(),mark=viewMark(id,key);
    try{if(sessionStorage.getItem(mark)==='1'||localStorage.getItem(mark)==='1')return Number(post.listing_views_count||0);}catch(_e){}
    if(pending.has(id))return pending.get(id);
    var task=(async function(){
      var c=client();if(!c||typeof c.rpc!=='function')return Number(post.listing_views_count||0);
      var result=await c.rpc('happyad_record_listing_view_v1',{p_listing_id:id,p_source:source||'home',p_viewer_key:key});
      if(result&&result.error)throw result.error;
      var count=Number(result&&result.data&&(result.data.count||result.data.views_count)||0)||0;
      post.listing_views_count=count;post.listingViewsCount=count;
      try{sessionStorage.setItem(mark,'1');localStorage.setItem(mark,'1');}catch(_e){}
      return count;
    })().catch(function(){return Number(post.listing_views_count||0);}).finally(function(){setTimeout(function(){pending.delete(id);},800);});
    pending.set(id,task);return task;
  }
  function closeHomeFullscreen(){try{var box=document.getElementById('happyadHomePhotoFullscreen');if(box){box.classList.remove('on');document.body.classList.remove('haHomePhotoFsLock');}}catch(_e){}}
  function stopVideoBeforeListingV850(){
    try{document.querySelectorAll('video,audio').forEach(function(media){try{media.pause();media.muted=true;}catch(_m){}});}catch(_e){}
    try{var fr=document.getElementById('happyadAppFrame_video');if(fr&&fr.contentWindow)fr.contentWindow.postMessage({type:'HAPPYAD_STOP_MEDIA',source:'listing-open-v850'},'*');}catch(_e){}
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_PAUSE_ALL_MEDIA',{detail:{source:'listing-open-v850'}}));}catch(_e){}
  }
  function safeListingV850(row){
    if(!row||typeof row!=='object')return null;
    try{return JSON.parse(JSON.stringify(row));}catch(_e){return row;}
  }
  function openListing(id,source,listing){
    id=clean(id);if(!id)return false;closeHomeFullscreen();stopVideoBeforeListingV850();
    var fastListing=safeListingV850(postById(id)||listing||null);
    try{if(fastListing)sessionStorage.setItem('HAPPYAD_DIRECT_LISTING_V850',JSON.stringify({id:id,listing:fastListing,at:Date.now()}));}catch(_e){}
    try{if(window.HappyadChatIntegrationV795&&typeof window.HappyadChatIntegrationV795.open==='function'){window.HappyadChatIntegrationV795.open({mode:'market',context:{source:source||'home-listing',listingId:id,listing:fastListing,fastOpen:true}});return true;}}catch(_e){}
    try{document.dispatchEvent(new CustomEvent('happyad:annonces-requested',{detail:{source:source||'home-listing',listingId:id,listing:fastListing,fastOpen:true}}));return true;}catch(_e){}
    return false;
  }
  window.HappyadOpenMarketplaceListingV850=openListing;
  window.HappyadOpenMarketplaceListingV828=openListing;
  window.HappyadOpenMarketplaceListingV821=openListing;
  window.HappyadOpenMarketplaceListingV820=openListing; // compatibilité centrale Vidéo V820.

  var observer=typeof IntersectionObserver==='function'?new IntersectionObserver(function(entries){
    entries.forEach(function(entry){var card=entry.target;clearTimeout(card.__happyadListingViewV828);if(entry.isIntersecting&&entry.intersectionRatio>=.55){card.__happyadListingViewV828=setTimeout(function(){var post=postById(card.dataset.postId);if(post)recordView(post,'home');},900);}});
  },{threshold:[0,.55,.8]}):null;
  function decorateCard(card){
    if(!card||observed.has(card))return;
    var post=postById(card.dataset.postId);if(!post||!isMarketplace(post)||!showOnHome(post))return;
    observed.add(card);card.classList.add('happyadMarketplaceHomeCardV828');card.dataset.happyadMarketplace='1';card.__happyadPost=post;
    var top=card.querySelector('.miniTop');if(top&&!top.querySelector('.happyadMarketplaceHomeTagV828,.happyadMarketplaceHomeTagV856')){var tag=document.createElement('span');tag.className='happyadMarketplaceHomeTagV828';tag.textContent='ANNONCE';top.appendChild(tag);}
    /* V857 : même une ancienne carte déjà présente dans le DOM perd physiquement
       J'aime / commentaire / republication / favori. Le seul geste social conservé
       pour une annonce est Partager, sans compteur. */
    var legacyActions=card.querySelector('.miniActions');if(legacyActions)legacyActions.remove();
    var frame=card.querySelector('.miniCardFrame')||card;
    var media=frame.querySelector('.miniMedia');
    var body=frame.querySelector('.miniBody');
    var titleRow=body&&body.querySelector('.miniTitleRow');
    var row=card.querySelector('.happyadMarketplaceCtaRowV856');
    if(!row){row=document.createElement('div');row.className='happyadMarketplaceCtaRowV856';row.innerHTML='<button class="happyadMarketplaceCardCtaV856" type="button"><span>Voir l’annonce</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>';}
    if(media&&row.previousElementSibling!==media)media.insertAdjacentElement('afterend',row);
    var shareBtn=card.querySelector('.happyadMarketplaceShareOnlyV857');
    if(!shareBtn){shareBtn=document.createElement('button');shareBtn.type='button';shareBtn.className='happyadMarketplaceShareOnlyV857';shareBtn.setAttribute('data-card-act','share');shareBtn.setAttribute('aria-label','Partager l’annonce');shareBtn.innerHTML='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';}
    if(titleRow&&shareBtn.parentNode!==titleRow)titleRow.appendChild(shareBtn);
    var listingBtn=row.querySelector('.happyadMarketplaceCardCtaV856');
    if(listingBtn&&!listingBtn.__happyadListingBoundV857){listingBtn.__happyadListingBoundV857=true;listingBtn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();openListing(idOf(post),'home-card',post);},true);}
    if(observer)observer.observe(card);
  }
  function scanCards(){document.querySelectorAll('#list .miniCard[data-post-id],.homeTimeline .miniCard[data-post-id]').forEach(decorateCard);}
  function scanAddedTree(node){
    if(!node||node.nodeType!==1)return;
    if(node.matches&&node.matches('.miniCard[data-post-id]'))decorateCard(node);
    if(node.querySelectorAll)node.querySelectorAll('.miniCard[data-post-id]').forEach(decorateCard);
  }
  function fullscreenPost(box){return box&&box.__happyadCurrentPostV613E||window.__HAPPYAD_ACTIVE_FULLSCREEN_POST_V613E||null;}
  function syncFullscreen(){
    var box=document.getElementById('happyadHomePhotoFullscreen');if(!box)return;
    var card=box.querySelector('.haHomeFsCard');if(!card)return;
    var cap=card.querySelector('.haHomeFsCaption');
    var post=fullscreenPost(box),id=idOf(post),existing=card.querySelector('.happyadOpenListingFromHomeV828'),shareBtn=card.querySelector('.happyadMarketplaceFsShareV857');
    var visible=box.classList.contains('on')&&post&&isMarketplace(post)&&id&&mediaType(post)!=='video';
    box.classList.toggle('happyadMarketplacePhotoFullscreenV856',!!visible);
    if(!visible){
      if(existing)existing.remove();if(shareBtn)shareBtn.remove();
      if(cap){var staleCta=cap.querySelector('.happyadMarketplaceFsCtaRowV1102'),staleTitle=cap.querySelector('.happyadMarketplaceFsTitleRowV1102');if(staleCta)staleCta.remove();if(staleTitle)staleTitle.remove();}
      lastFullscreenId='';return;
    }
    if(!existing){existing=document.createElement('button');existing.type='button';existing.className='happyadOpenListingFromHomeV828';existing.innerHTML='<span>Voir l’annonce</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
    if(!shareBtn){shareBtn=document.createElement('button');shareBtn.type='button';shareBtn.className='happyadMarketplaceFsShareV857';shareBtn.setAttribute('data-card-act','share');shareBtn.setAttribute('aria-label','Partager l’annonce');shareBtn.innerHTML='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';}
    existing.dataset.listingId=id;existing.onclick=function(event){event.preventDefault();event.stopPropagation();openListing(id,'photo-fullscreen',post);};
    shareBtn.dataset.postId=id;shareBtn.__happyadPost=post;
    if(cap){
      var ctaRow=cap.querySelector('.happyadMarketplaceFsCtaRowV1102');
      if(!ctaRow){ctaRow=document.createElement('div');ctaRow.className='happyadMarketplaceFsCtaRowV1102';cap.insertBefore(ctaRow,cap.firstChild||null);}
      if(existing.parentNode!==ctaRow)ctaRow.appendChild(existing);
      var titleRow=cap.querySelector('.happyadMarketplaceFsTitleRowV1102');
      if(!titleRow){titleRow=document.createElement('div');titleRow.className='happyadMarketplaceFsTitleRowV1102';if(ctaRow.nextSibling)cap.insertBefore(titleRow,ctaRow.nextSibling);else cap.appendChild(titleRow);}
      var titleCopy=titleRow.querySelector('.happyadMarketplaceFsTitleTextV1102');
      if(!titleCopy){titleCopy=document.createElement('div');titleCopy.className='happyadMarketplaceFsTitleTextV1102';titleRow.appendChild(titleCopy);}
      var originalTitle=cap.querySelector(':scope > .haHomeFsTitle');
      var nextTitle=clean((originalTitle&&originalTitle.textContent)||'Annonce Fyblic');if(titleCopy.textContent!==nextTitle)titleCopy.textContent=nextTitle;
      if(shareBtn.parentNode!==titleRow)titleRow.appendChild(shareBtn);
    }else{
      if(existing.parentNode!==card)card.appendChild(existing);
      if(shareBtn.parentNode!==card)card.appendChild(shareBtn);
    }
    if(lastFullscreenId!==id){lastFullscreenId=id;recordView(post,'detail');}
  }
  function patchFullscreenOpenV856(){
    try{
      var old=window.happyadOpenHomePhotoFullscreen;
      if(typeof old!=='function'||old.__happyadMarketplacePoint1V856)return;
      var wrapped=async function(){
        var result=await old.apply(this,arguments);
        try{syncFullscreen();}catch(_e){}
        requestAnimationFrame(function(){try{syncFullscreen();}catch(_e){}});
        return result;
      };
      wrapped.__happyadMarketplacePoint1V856=true;
      wrapped.__happyadMarketplaceOriginalV856=old;
      window.happyadOpenHomePhotoFullscreen=wrapped;
    }catch(_e){}
  }
  function bindRealtime(){
    var c=client();if(!c||typeof c.channel!=='function'||realtimeChannel)return;
    try{realtimeChannel=c.channel('happyad-marketplace-home-v828').on('postgres_changes',{event:'*',schema:'public',table:'happyad_posts'},function(payload){
      var row=(payload&&payload.new)||payload.old||{},id=idOf(row);
      if(!id||!(isMarketplace(row)||truth(row.marketplace_show_on_home)))return;
      /* La tête du Feed possède déjà les INSERT. Ce maître ne relit donc les
         annonces que si la carte concernée existe réellement sur l'Accueil. */
      if(!allPosts().some(function(post){return idOf(post)===id;}))return;
      refresh('realtime');
    }).subscribe();}catch(_e){}
  }
  function install(){
    patchFullscreenOpenV856();scanCards();syncFullscreen();refresh('boot');bindRealtime();
    /* R93 : ne jamais rescanner toutes les cartes sur les changements de classe
       produits par le scroll, le prépeint ou le chargement des images. */
    try{
      var list=document.getElementById('list');
      if(list){
        new MutationObserver(function(records){
          records.forEach(function(rec){
            if(rec.type==='attributes'){decorateCard(rec.target);return;}
            [].slice.call(rec.addedNodes||[]).forEach(scanAddedTree);
          });
        }).observe(list,{childList:true,subtree:true,attributes:true,attributeFilter:['data-post-id']});
      }
    }catch(_e){}
    /* Le bouton Voir l’annonce du fullscreen est synchronisé uniquement quand
       ce fullscreen change, au lieu d'un polling permanent toutes les 500 ms. */
    try{
      var fs=document.getElementById('happyadHomePhotoFullscreen');
      if(fs){
        var fsRaf=0;
        var queueFs=function(){if(fsRaf)return;fsRaf=requestAnimationFrame(function(){fsRaf=0;syncFullscreen();});};
        new MutationObserver(queueFs).observe(fs,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
      }
    }catch(_e){}
    window.addEventListener('message',function(event){var d=event&&event.data||{};if(d.type==='HAPPYAD_MARKETPLACE_OWNER_MUTATION_V933'){applyOwnerMutationV933(d.detail||{});return;}if(d.type!=='HAPPYAD_OPEN_MARKETPLACE_LISTING_V856')return;var id=clean(d.listingId||(d.listing&&idOf(d.listing)));if(id)openListing(id,d.source||'profile-card',d.listing||null);},true);
    document.addEventListener('happyad:marketplace-listing-published',function(){refresh('published');});
    window.addEventListener('HAPPYAD_VIDEO_POSTER_UPDATED_V693',function(){refresh('poster-updated');});
    setInterval(function(){if(!document.hidden)refresh('stability');},60000);
    window.addEventListener('focus',function(){patchFullscreenOpenV856();refresh('focus');});
    document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh('visible');});
  }
  var style=document.createElement('style');style.id='happyad-marketplace-home-master-v821-css';style.textContent='\
    .happyadMarketplaceHomeCardV828 .miniTop,.happyadMarketplaceDedicatedCardV856 .miniTop{position:relative!important}.happyadMarketplaceHomeTagV828,.happyadMarketplaceHomeTagV856{margin-left:auto;margin-right:6px;padding:5px 8px;border-radius:999px;background:rgba(255,119,26,.12);border:1px solid rgba(255,119,26,.40);color:#ff9b50;font-size:9px;font-weight:1000;letter-spacing:.08em;white-space:nowrap}\
    .happyadMarketplaceDedicatedCardV856 .miniActions,.happyadMarketplaceHomeCardV828 .miniActions{display:none!important}.happyadMarketplaceDedicatedCardV856 .happyadMarketplaceCtaRowV856,.happyadMarketplaceHomeCardV828 .happyadMarketplaceCtaRowV856{display:block!important;width:100%!important;min-height:44px!important;margin:0!important;padding:0!important;background:#d67824!important;border:0!important;box-shadow:none!important;overflow:hidden!important}.happyadMarketplaceDedicatedCardV856 .happyadMarketplaceCardCtaV856,.happyadMarketplaceHomeCardV828 .happyadMarketplaceCardCtaV856{width:100%!important;min-height:44px!important;padding:0 16px!important;border:0!important;border-radius:0!important;background:linear-gradient(90deg,#c96b1f 0%,#df812b 100%)!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;font-size:13.5px!important;font-weight:850!important;letter-spacing:.01em!important;box-shadow:none!important;touch-action:manipulation}.happyadMarketplaceDedicatedCardV856 .happyadMarketplaceCardCtaV856 svg,.happyadMarketplaceHomeCardV828 .happyadMarketplaceCardCtaV856 svg{width:18px!important;height:18px!important;flex:0 0 18px!important;fill:none!important;stroke:currentColor!important;stroke-width:2.2!important;stroke-linecap:round!important;stroke-linejoin:round!important}.happyadMarketplaceDedicatedCardV856 .miniTitleRow,.happyadMarketplaceHomeCardV828 .miniTitleRow{display:flex!important;align-items:flex-start!important;gap:8px!important;width:100%!important}.happyadMarketplaceDedicatedCardV856 .miniTitleRow .miniTitle,.happyadMarketplaceHomeCardV828 .miniTitleRow .miniTitle{flex:1 1 auto!important;min-width:0!important}.happyadMarketplaceDedicatedCardV856 .happyadMarketplaceShareOnlyV857,.happyadMarketplaceHomeCardV828 .happyadMarketplaceShareOnlyV857{width:40px!important;height:40px!important;min-width:40px!important;flex:0 0 40px!important;margin:-8px -8px 0 0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#f4f6f8!important;display:grid!important;place-items:center!important;box-shadow:none!important;touch-action:manipulation}.happyadMarketplaceDedicatedCardV856 .happyadMarketplaceShareOnlyV857 svg,.happyadMarketplaceHomeCardV828 .happyadMarketplaceShareOnlyV857 svg{width:21px!important;height:21px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;stroke-linecap:round!important;stroke-linejoin:round!important}.happyadMarketplaceDedicatedCardV856 .happyadMarketplaceDescV856{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}\
    #happyadHomePhotoFullscreen.happyadMarketplacePhotoFullscreenV856 .haHomeFsCaption{padding:0 0 calc(18px + env(safe-area-inset-bottom,0px))!important;background:#080b10!important;max-height:46dvh!important;overflow-y:auto!important;box-shadow:0 -1px 0 rgba(255,255,255,.04)!important}\
    #happyadHomePhotoFullscreen.happyadMarketplacePhotoFullscreenV856 .haHomeFsCaption>.haHomeFsTitle{display:none!important}\
    #happyadHomePhotoFullscreen .happyadMarketplaceFsCtaRowV1102{display:block!important;width:100%!important;min-height:44px!important;margin:0 0 12px!important;padding:0!important;background:#d67824!important;border:0!important;overflow:hidden!important}\
    #happyadHomePhotoFullscreen .happyadOpenListingFromHomeV828{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;top:auto!important;z-index:100!important;width:100%!important;max-width:none!important;min-height:44px!important;margin:0!important;padding:0 16px!important;border:0!important;border-radius:0!important;background:linear-gradient(90deg,#c96b1f 0%,#df812b 100%)!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;font-size:13.5px!important;font-weight:850!important;letter-spacing:.01em!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;touch-action:manipulation!important}\
    #happyadHomePhotoFullscreen .happyadOpenListingFromHomeV828 svg{width:18px!important;height:18px!important;flex:0 0 18px!important;fill:none!important;stroke:currentColor!important;stroke-width:2.2!important;stroke-linecap:round!important;stroke-linejoin:round!important}\
    #happyadHomePhotoFullscreen .happyadMarketplaceFsTitleRowV1102{display:flex!important;align-items:flex-start!important;gap:8px!important;width:100%!important;padding:0 18px!important;box-sizing:border-box!important}\
    #happyadHomePhotoFullscreen .happyadMarketplaceFsTitleTextV1102{flex:1 1 auto!important;min-width:0!important;color:#fff!important;font-size:19px!important;font-weight:900!important;line-height:1.2!important;overflow-wrap:anywhere!important}\
    #happyadHomePhotoFullscreen .happyadMarketplaceFsShareV857{position:relative!important;right:auto!important;bottom:auto!important;top:auto!important;z-index:101!important;width:40px!important;height:40px!important;min-width:40px!important;flex:0 0 40px!important;margin:-8px -8px 0 0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#f4f6f8!important;display:grid!important;place-items:center!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;touch-action:manipulation!important}\
    #happyadHomePhotoFullscreen .happyadMarketplaceFsShareV857 svg{width:21px!important;height:21px!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;stroke-linecap:round!important;stroke-linejoin:round!important}\
    #happyadHomePhotoFullscreen.happyadMarketplacePhotoFullscreenV856 .haHomeFsDesc{padding:0 18px!important;margin-top:2px!important;color:#f4f6f8!important;font-size:15px!important;line-height:1.32!important;font-weight:650!important}\
    #happyadHomePhotoFullscreen.happyadMarketplacePhotoFullscreenV856 .haHomeFsSeeMore{margin-left:18px!important;margin-top:6px!important}\
    #happyadHomePhotoFullscreen.happyadMarketplacePhotoFullscreenV856 .haHomeFsActions,#happyadHomePhotoFullscreen.happyadMarketplacePhotoFullscreenV856 .haPostMoreV613E{display:none!important}\
  ';document.head.appendChild(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('marketplace-home-v828',{file:'core/marketplace-home-master-v828.js',responsibility:'couvertures Marketplace Accueil, photo/vidéo et ouverture exacte',active:true,version:VERSION});}catch(_e){}
})();
