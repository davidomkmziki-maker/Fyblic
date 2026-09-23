/* Fyblic HOME FEED MASTER V3 NORMALIZED CARDS
   Source unique du fil Accueil : normalisation Supabase, ordre stable, albums,
   pagination append-only, identité de carte et orchestration rendu/pagination. */
(function(){
  'use strict';
  if(window.HappyHomeFeedV1&&window.HappyHomeFeedV1.version==='V9_AUTO_MORE_CONTINUOUS')return;

  var VERSION='V9_AUTO_MORE_CONTINUOUS';
  var MAX_ROWS=120;
  var bridge=null;
  var renderPending=null;
  var renderTimer=0;
  var pagination={
    cursor:null,
    seeded:false,
    done:false,
    loading:false,
    cycle:false,
    pending:false,
    timer:0,
    nextOffset:0,
    retryAt:0
  };

  function clean(v){return String(v==null?'':v).trim();}
  function idOf(p){return clean(p&&(p.id||p.post_id));}
  function createdMs(p){
    try{
      var v=p&&(p.createdAt!=null?p.createdAt:(p.created_at||p.timestamp||p.time||p.date||0));
      if(typeof v==='number'){var n=v>100000000000?v:v*1000;return Number.isFinite(n)?n:0;}
      var t=Date.parse(String(v||''));return Number.isFinite(t)?t:0;
    }catch(_e){return 0;}
  }
  function isMarketplace(p){p=p||{};return p.happyadMarketplace===true||p.happyad_marketplace===true||p.is_marketplace===true||clean(p.mode).toLowerCase()==='marketplace';}
  function showMarketplaceOnHome(p){p=p||{};return p.marketplaceShowOnHome===true||p.marketplace_show_on_home===true||p.showOnHome===true;}
  function renderable(p){
    if(!p||!idOf(p))return false;
    if(clean(p.deleted_at||p.deletedAt))return false;
    if(clean(p.boutique_product_id||p.boutiqueProductId))return false;
    if(isMarketplace(p)&&!showMarketplaceOnHome(p))return false;
    return true;
  }
  function compareDesc(a,b){
    var ta=createdMs(a),tb=createdMs(b);
    if(ta!==tb)return tb-ta;
    var ia=idOf(a),ib=idOf(b);
    if(ia===ib)return 0;
    return ib.localeCompare(ia);
  }
  function dedupeKeepOrder(rows){
    var seen=new Set(),out=[];
    (rows||[]).forEach(function(row){
      var id=idOf(row);if(!id||seen.has(id)||!renderable(row))return;
      seen.add(id);out.push(row);
    });
    return out;
  }
  function remoteOrder(rows){return dedupeKeepOrder(rows).slice().sort(compareDesc);}
  function seedCache(rows,limit){return remoteOrder(rows).slice(0,Math.max(1,Number(limit)||20));}

  function replaceHead(current,remoteHead,keepTail){
    var head=remoteOrder(remoteHead);
    if(!head.length)return dedupeKeepOrder(current).slice(0,MAX_ROWS);
    /* Au premier head distant, un cache ancien n'est jamais traité comme une page
       déjà chargée : on repart d'une tête contiguë. Les refresh suivants peuvent
       conserver uniquement les pages réellement chargées pendant cette session. */
    if(keepTail===false)return head.slice(0,MAX_ROWS);
    var currentRows=dedupeKeepOrder(current),headIds=new Set(head.map(idOf));
    var boundary=head[head.length-1],tail=[];
    currentRows.forEach(function(row){
      if(headIds.has(idOf(row)))return;
      if(compareDesc(row,boundary)>=0)tail.push(row);
    });
    return dedupeKeepOrder(head.concat(tail)).slice(0,MAX_ROWS);
  }

  /* Page distante strictement append-only : une ligne nouvelle plus récente que la
     dernière ligne déjà connue n'a jamais le droit d'être injectée au milieu. */
  function appendPage(current,page){
    var out=dedupeKeepOrder(current).slice(),byId=new Map();
    out.forEach(function(row,i){byId.set(idOf(row),i);});
    var ordered=remoteOrder(page),last=out.length?out[out.length-1]:null;
    ordered.forEach(function(row){
      var id=idOf(row),idx=byId.get(id);
      if(idx!=null){out[idx]=Object.assign({},out[idx],row);return;}
      if(last&&compareDesc(row,last)<0)return;
      byId.set(id,out.length);out.push(row);last=row;
    });
    return out.slice(0,MAX_ROWS);
  }

  function patchExisting(current,patches){
    var patchMap=new Map();
    (patches||[]).forEach(function(p){var id=idOf(p);if(id)patchMap.set(id,p);});
    return dedupeKeepOrder(current).map(function(row){var p=patchMap.get(idOf(row));return p?Object.assign({},row,p):row;});
  }
  function remove(current,id){id=clean(id);return dedupeKeepOrder(current).filter(function(row){return idOf(row)!==id;});}
  function cleanRows(rows){return dedupeKeepOrder(rows).slice(0,MAX_ROWS);}

  function explicitAlbumKey(p){
    if(!p)return '';
    var fs=['albumId','album_id','groupId','group_id','batchId','batch_id','galleryId','gallery_id','collectionId','collection_id','multiId','multi_id','postGroupId','post_group_id','publicationGroupId','publication_group_id'];
    for(var i=0;i<fs.length;i++){var v=p[fs[i]];if(v!=null&&clean(v))return 'album:'+clean(v);}
    return '';
  }
  function cardKey(p){return explicitAlbumKey(p)||('post:'+idOf(p));}

  /* V3 — normalisation unique des lignes Supabase avant leur entrée dans le fil. */
  function publicMediaUrl(src){
    src=clean(src);if(!src)return '';
    if(/^https?:\/\//i.test(src)||/^blob:/i.test(src)||/^data:/i.test(src))return src;
    src=src.replace(/^\/+/, '').replace(/^happyad-media\//,'');
    var base=clean(window.HAPPYAD_SUPABASE_URL||'').replace(/\/+$/,'');
    return base+'/storage/v1/object/public/happyad-media/'+encodeURI(src);
  }
  function normalizeHandle(v){v=clean(v).replace(/^@+/,'');return v?('@'+v):'';}
  function bool(v){return v===true||v===1||String(v).toLowerCase()==='true';}
  function normalizeAdaptiveVariantsV1087(value){
    var out={};
    if(!value)return out;
    if(Array.isArray(value)){
      value.forEach(function(item){
        if(!item||typeof item!=='object')return;
        var name=clean(item.name||item.quality||item.label||'');
        var url=clean(item.url||item.src||item.media_url||item.path||'');
        if(name&&url)out[name]=url;
      });
      return out;
    }
    if(typeof value==='object'){
      Object.keys(value).forEach(function(key){
        var raw=value[key],url='';
        if(typeof raw==='string')url=raw;
        else if(raw&&typeof raw==='object')url=raw.url||raw.src||raw.media_url||raw.path||'';
        if(clean(url))out[clean(key)]=clean(url);
      });
    }
    return out;
  }
  /* V1088 — qualité adaptative par utilisateur, 1080p prioritaire.
     On descend uniquement lorsque le débit estimé est réellement faible.
     L'option saveData ne force plus à elle seule une basse qualité : la connexion réelle prime. */
  function adaptiveWantedQualityV1088(){
    try{
      var connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection||{};
      var effective=String(connection.effectiveType||'').toLowerCase(),down=Number(connection.downlink||0);
      if(down>0){
        if(down<0.45)return '360p';
        if(down<1.15)return '540p';
        if(down<2.60)return '720p';
        return '1080p';
      }
      if(effective==='slow-2g')return '360p';
      if(effective==='2g')return '540p';
      if(effective==='3g')return '720p';
      return '1080p';
    }catch(_e){return '1080p';}
  }
  function adaptiveMedia(r,fallback,extraVariants){
    var crop=r&&((r.image_crop&&typeof r.image_crop==='object')?r.image_crop:r.imageCrop)||{};
    var variants=Object.assign({},normalizeAdaptiveVariantsV1087(crop&&crop.adaptive&&crop.adaptive.variants),normalizeAdaptiveVariantsV1087(extraVariants));
    if(!Object.keys(variants).length)return fallback;
    var wanted=adaptiveWantedQualityV1088();
    var order=wanted==='1080p'?['1080p','720p','540p','360p']:wanted==='720p'?['720p','540p','360p','1080p']:wanted==='540p'?['540p','360p','720p','1080p']:['360p','540p','720p','1080p'];
    for(var i=0;i<order.length;i++)if(variants[order[i]])return publicMediaUrl(variants[order[i]]);
    return fallback;
  }
  function normalizePost(r){
    r=r||{};
    var mode=clean(r.mode||'publish')||'publish';
    var marketplace=bool(r.happyad_marketplace)||bool(r.is_marketplace)||mode.toLowerCase()==='marketplace';
    var details=(r.marketplace_details&&typeof r.marketplace_details==='object')?r.marketplace_details:{};
    var showMarketplace=bool(r.marketplace_show_on_home)||bool(r.showOnHome)||bool(details.show_on_home);
    /* V1086 — Boutique possède déjà le poster dans marketplace_media.
       Le RPC historique ne le recopie pas toujours dans thumbnail_url/poster_url.
       L'Accueil doit donc lire la couverture choisie directement dans marketplace_media,
       uniquement pour les annonces Marketplace, sans modifier Normal/Story. */
    var marketplaceMediaRaw=Array.isArray(r.marketplace_media)?r.marketplace_media:(Array.isArray(r.media)?r.media:[]);
    var marketplaceCoverIndexRaw=(r.marketplace_cover_index!=null?r.marketplace_cover_index:(r.coverIndex!=null?r.coverIndex:details.cover_index));
    var marketplaceCoverIndex=Math.max(0,Math.min(Number(marketplaceCoverIndexRaw)||0,Math.max(0,marketplaceMediaRaw.length-1)));
    var marketplaceCoverItem=marketplaceMediaRaw[marketplaceCoverIndex]||marketplaceMediaRaw[0]||{};
    var marketplaceNestedSrc=clean(marketplaceCoverItem.src||marketplaceCoverItem.url||marketplaceCoverItem.media_url||marketplaceCoverItem.path||'');
    var marketplaceNestedPoster=clean(marketplaceCoverItem.poster||marketplaceCoverItem.poster_url||marketplaceCoverItem.thumbnail_url||marketplaceCoverItem.thumb||marketplaceCoverItem.preview||'');
    var marketplaceNestedType=clean(marketplaceCoverItem.type||marketplaceCoverItem.media_type||'');
    var marketplaceNestedPath=clean(marketplaceCoverItem.path||marketplaceCoverItem.media_path||'');
    var mediaType=clean(r.marketplace_cover_type||(marketplace?marketplaceNestedType:'')||r.media_type||r.home_media_type||r.kind||r.mediaType||'photo').toLowerCase()||'photo';
    var rawMedia=r.marketplace_cover_url||(marketplace?marketplaceNestedSrc:'')||r.media_url||r.mediaUrl||r.home_media_url||r.homeMediaUrl||r.video_url||r.videoUrl||r.url||r.src||r.thumbnail_url||r.cover_url||r.media_path||r.mediaPath||'';
    var media=adaptiveMedia(r,publicMediaUrl(rawMedia),marketplace?marketplaceCoverItem.variants:null);
    var rawPoster=r.thumbnail_url||r.thumbnailUrl||r.poster_url||r.posterUrl||(marketplace?marketplaceNestedPoster:'')||r.cover_url||r.coverUrl||r.image_url||r.imageUrl||'';
    var poster=publicMediaUrl(rawPoster);
    var owner=clean(r.user_id||r.creator_id||r.owner_id||r.author_id||r.profile_id||r.creatorId||r.userId||r.ownerId||r.authorId||r.profileId||'');
    var avatar=clean(r.avatar_url||r.avatar||r.user_avatar||r.creator_avatar||r.author_avatar||r.profile_photo_url||r.profile_photo||r.profile_picture_url||r.profile_picture||r.photo_url||r.image_url||r.picture||'');
    var createdRaw=r.created_at||r.createdAt||'';
    var created=createdRaw?createdMs({created_at:createdRaw}):0;
    var coverType=clean(r.marketplace_cover_type||(marketplace?marketplaceNestedType:'')||r.media_type||mediaType||'image');
    var coverUrl=publicMediaUrl(r.marketplace_cover_url||(marketplace?marketplaceNestedSrc:'')||media||'');
    var coverPath=clean(r.marketplace_cover_path||(marketplace?marketplaceNestedPath:'')||r.media_path||r.mediaPath||'');
    if(marketplace&&coverUrl){mediaType=coverType.toLowerCase().indexOf('video')>=0?'video':'photo';media=mediaType==='video'?adaptiveMedia(r,publicMediaUrl(coverUrl),marketplaceCoverItem.variants):coverUrl;}
    var mapped={
      id:r.id,mode:mode,title:r.title||'Publication Fyblic',desc:r.description||r.desc||'',description:r.description||r.desc||'',category:r.category||'',location:r.location||'',
      kind:mediaType,mediaType:mediaType,media_type:mediaType,mediaUrl:media,media_url:media,homeMediaUrl:media,home_media_url:media,mediaPath:coverPath||clean(r.media_path||r.mediaPath||''),media_path:coverPath||clean(r.media_path||r.mediaPath||''),
      creatorId:owner,creator_id:owner,user_id:owner,userId:owner,owner_id:owner,ownerId:owner,author_id:owner,authorId:owner,profile_id:owner,profileId:owner,
      creatorName:r.display_name||r.creator_name||r.full_name||r.user_name||r.creatorName||'Utilisateur Fyblic',handle:normalizeHandle(r.username||r.handle||''),username:clean(r.username||r.handle||'').replace(/^@+/,''),
      avatar:avatar,avatar_url:avatar,badge:r.badge||r.user_badge||'aucun',user_badge:r.user_badge||r.badge||'aucun',createdAt:created,created_at:r.created_at||r.createdAt||'',supabase:r.supabase!==false,
      likes_count:Number(r.likes_count||0),comments_count:Number(r.comments_count||0),shares_count:Number(r.shares_count||0),saves_count:Number(r.saves_count||0),views_count:Number(r.views_count||r.view_count||r.video_views_count||0),
      happyadMarketplace:marketplace,happyad_marketplace:marketplace,is_marketplace:marketplace,marketplaceShowOnHome:showMarketplace,marketplace_show_on_home:showMarketplace,showOnHome:showMarketplace,
      marketplaceCategory:r.marketplace_category||r.category||'',marketplace_category:r.marketplace_category||r.category||'',marketplaceCoverIndex:marketplace?marketplaceCoverIndex:(Number(r.marketplace_cover_index||r.coverIndex||0)||0),marketplace_cover_index:marketplace?marketplaceCoverIndex:(Number(r.marketplace_cover_index||r.coverIndex||0)||0),
      marketplaceMedia:marketplaceMediaRaw,marketplace_media:marketplaceMediaRaw,marketplaceCoverUrl:coverUrl||media,marketplace_cover_url:coverUrl||media,marketplaceCoverPath:coverPath,marketplace_cover_path:coverPath,
      marketplaceCoverType:coverType,marketplace_cover_type:coverType,listingViewsCount:Number(r.listing_views_count||r.viewsCount||0)||0,listing_views_count:Number(r.listing_views_count||r.viewsCount||0)||0,sellerBadge:r.seller_badge||r.badge||r.user_badge||'',seller_badge:r.seller_badge||r.badge||r.user_badge||'',
      imageCrop:r.image_crop||r.imageCrop||null,thumbnailUrl:poster,thumbnail_url:poster,posterUrl:poster,poster_url:poster,
      batchId:r.batch_id||r.batchId||'',batch_id:r.batch_id||r.batchId||'',groupIndex:Number(r.group_index||r.groupIndex||0)||0,group_index:Number(r.group_index||r.groupIndex||0)||0,photoIndex:Number(r.photo_index||r.photoIndex||r.group_index||r.groupIndex||0)||0,photo_index:Number(r.photo_index||r.photoIndex||r.group_index||r.groupIndex||0)||0,
      postType:r.postType||r.post_type||'',post_type:r.post_type||r.postType||'',boutique_product_id:r.boutique_product_id||r.boutiqueProductId||'',boutiqueProductId:r.boutiqueProductId||r.boutique_product_id||'',button_label:r.button_label||r.buttonLabel||'',action:r.action||'',
      visibility:r.visibility||r.privacy||r.audience||r.status||'',privacy:r.privacy||'',audience:r.audience||'',status:r.status||'',is_private:bool(r.is_private)||bool(r.private)||clean(r.visibility||r.privacy||r.audience||r.status).toLowerCase()==='private',private:bool(r.private),private_at:r.private_at||r.privated_at||'',
      comments_disabled:bool(r.comments_disabled),hide_like_count:bool(r.hide_like_count),mentioned_user_ids:(r.mentioned_user_ids!=null?r.mentioned_user_ids:(r.mentionedUserIds||[])),mention_handles:(r.mention_handles!=null?r.mention_handles:(r.mentionHandles||[])),mentions:r.mentions||r.mention_text||r.mentionText||'',mentionedUsers:Array.isArray(r.mentionedUsers)?r.mentionedUsers:[],deleted_at:r.deleted_at||r.deletedAt||''
    };
    if(mediaType.indexOf('video')>=0){mapped.videoUrl=media;mapped.video_url=media;}
    ['video_url_compressed','video_url_original','compressed_video_url','original_video_url'].forEach(function(k){if(r[k])mapped[k]=publicMediaUrl(r[k]);});
    ['media_width','media_height','image_width','image_height','natural_width','natural_height','width','height','photo_width','photo_height','original_width','original_height','aspect_ratio','media_aspect_ratio','image_aspect_ratio','ratio'].forEach(function(k){if(r[k]!=null&&r[k]!==''&&mapped[k]==null)mapped[k]=r[k];});
    return mapped;
  }
  function normalizeRows(rows){return (rows||[]).map(normalizePost).filter(function(p){return !!idOf(p);});}

  /* V3 — groupage album unique et pur. L'ordre de la première occurrence du groupe
     reste celui du Feed Master; aucun tri global n'est effectué après rendu. */
  function isLivePost(p){p=p||{};return bool(p.isLive)||clean(p.mode).toLowerCase()==='live'||clean(p.type).toLowerCase()==='live'||clean(p.category).toLowerCase()==='live';}
  function isStoryPost(p){p=p||{};if(isLivePost(p))return false;var m=clean(p.mode).toLowerCase(),t=clean(p.type).toLowerCase(),c=clean(p.category).toLowerCase();return m==='story'||t==='story'||c==='story';}
  function isVideoPost(p){p=p||{};if(isStoryPost(p)||isLivePost(p))return false;var t=clean(p.kind||p.type||p.mediaType||p.media_type).toLowerCase();return t==='video'||t.indexOf('video')>=0;}
  function marketplaceHomeVisible(p){if(!isMarketplace(p))return true;return showMarketplaceOnHome(p);}
  function albumCreatorKey(p){p=p||{};return clean(p.creatorId||p.user_id||p.userId||p.ownerId||p.owner_id||p.handle||p.creatorName).toLowerCase();}
  function fallbackAlbumKey(p){var t=createdMs(p);if(!t)return '';var bucket=Math.floor(t/90000);return ['auto',albumCreatorKey(p),clean(p&&p.title).toLowerCase(),clean(p&&(p.desc||p.description)).toLowerCase(),clean(p&&p.category).toLowerCase(),bucket].join('|');}
  function groupPosts(items){
    var groups=Object.create(null),slots=[];
    (items||[]).forEach(function(p){
      if(!p||!marketplaceHomeVisible(p))return;
      /* V856 POINT 1 — une annonce est un type de carte autonome. Elle ne doit
         jamais être fusionnée dans un album social, même si une ancienne ligne
         contient encore batch_id/group_id/album_id. */
      if(isMarketplace(p)){p.__feedCardKey='post:'+idOf(p);slots.push({type:'single',post:p});return;}
      if(isVideoPost(p)||isStoryPost(p)||isLivePost(p)){
        p.__feedCardKey=cardKey(p);slots.push({type:'single',post:p});return;
      }
      var explicit=explicitAlbumKey(p);
      /* Les publications Supabase modernes ne sont groupées que par un identifiant
         explicite (batch/group/album). Le fallback temporel reste réservé aux
         anciens objets locaux afin d'éviter de fusionner deux vraies publications. */
      var key=explicit||((p.supabase===false||p.__fromPublishSuccess===true)?fallbackAlbumKey(p):'')||('single:'+idOf(p));
      if(!groups[key]){groups[key]=[];slots.push({type:'album',key:key});}
      groups[key].push(p);
    });
    return slots.map(function(slot){
      if(slot.type==='single')return slot.post;
      var key=slot.key,arr=(groups[key]||[]).slice();
      arr.sort(function(a,b){var ai=Number(a.groupIndex||a.group_index||a.photoIndex||a.photo_index||0),bi=Number(b.groupIndex||b.group_index||b.photoIndex||b.photo_index||0);if(ai!==bi)return ai-bi;return createdMs(a)-createdMs(b);});
      if(arr.length>18)arr=arr.slice(0,18);
      var rep=Object.assign({},arr[0]||{});
      rep.__albumItems=arr;rep.__albumCount=arr.length;rep.__albumKey=key;rep.__actionId=arr[0]&&arr[0].id;
      rep.__feedCardKey=key.indexOf('single:')===0?('post:'+idOf(rep)):key;
      rep.__feedCreatedAt=arr.reduce(function(max,row){return Math.max(max,createdMs(row)||0);},0);
      return rep;
    });
  }

  function cursorDate(row){
    try{
      var raw=row&&(row.created_at||row.createdAt||row.timestamp||row.time||row.date)||'';
      if(typeof raw==='number'||/^\d+$/.test(String(raw))){var n=Number(raw);if(n>0)return new Date(n>100000000000?n:n*1000).toISOString();}
      var d=new Date(raw);return isNaN(d.getTime())?'':d.toISOString();
    }catch(_e){return '';}
  }
  function cursorFromRows(rows){
    try{var r=(rows||[])[(rows||[]).length-1]||null;if(!r)return null;var at=cursorDate(r),id=clean(r.id);return at&&id?{created_at:at,id:id}:null;}catch(_e){return null;}
  }
  function cursorCompare(a,b){
    try{
      if(!a&&!b)return 0;if(!a)return 1;if(!b)return -1;
      var ta=Date.parse(String(a.created_at||'')),tb=Date.parse(String(b.created_at||''));
      if(Number.isFinite(ta)&&Number.isFinite(tb)&&ta!==tb)return ta<tb?-1:1;
      var ia=String(a.id||''),ib=String(b.id||'');if(ia===ib)return 0;return ia<ib?-1:1;
    }catch(_e){return 0;}
  }
  function applyCursor(q,cursor){
    try{
      if(!q||!cursor||!cursor.created_at||!cursor.id)return q;
      return q.or('created_at.lt.'+cursor.created_at+',and(created_at.eq.'+cursor.created_at+',id.lt.'+cursor.id+')');
    }catch(_e){return q;}
  }

  function connectRuntime(adapter){bridge=adapter||null;return api;}
  function bcall(name){
    if(!bridge||typeof bridge[name]!=='function')return undefined;
    var args=[].slice.call(arguments,1);
    return bridge[name].apply(bridge,args);
  }
  function whenIdle(){
    return new Promise(function(resolve){
      function check(){
        if(!bcall('isScrollActive')){resolve(true);return;}
        setTimeout(check,90);
      }
      check();
    });
  }
  /* V922 — attente bornée réservée à la pagination. Si le coordinateur de scroll
     reste actif plus longtemps que prévu, on ne touche pas au DOM : on libère le
     cycle et on retente plus tard. Cela évite un loader bloqué sans sacrifier le scroll. */
  function whenPaginationIdle(maxWait){
    maxWait=Math.max(700,Number(maxWait)||1600);
    return new Promise(function(resolve){
      var started=Date.now(),settled=false;
      function finish(value){if(settled)return;settled=true;resolve(value);}
      function check(){
        if(!bcall('isScrollActive')){finish(true);return;}
        if(Date.now()-started>=maxWait){finish(false);return;}
        setTimeout(check,90);
      }
      check();
    });
  }
  function withPaginationTimeout(promise,ms){
    ms=Math.max(5000,Number(ms)||12000);
    return new Promise(function(resolve,reject){
      var settled=false;
      var timer=setTimeout(function(){if(settled)return;settled=true;reject(new Error('HOME_PAGINATION_TIMEOUT'));},ms);
      Promise.resolve(promise).then(function(value){if(settled)return;settled=true;clearTimeout(timer);resolve(value);},function(error){if(settled)return;settled=true;clearTimeout(timer);reject(error);});
    });
  }
  function hasPendingRender(){return !!renderPending;}
  function scheduleRenderFlush(delay){
    clearTimeout(renderTimer);
    renderTimer=setTimeout(flushRender,Math.max(90,Number(delay)||140));
  }
  function queueRender(options){
    options=options||{};
    var next={feedOnly:options.feedOnly===true,reason:options.reason||'home-feed-v2-idle'};
    if(renderPending){
      next.feedOnly=renderPending.feedOnly===true&&next.feedOnly===true;
      next.reason=options.reason||renderPending.reason||next.reason;
    }
    renderPending=next;
    scheduleRenderFlush(140);
    return false;
  }
  function flushRender(){
    renderTimer=0;
    if(!renderPending)return false;
    if(bcall('isScrollActive')){scheduleRenderFlush(120);return false;}
    var pending=renderPending;renderPending=null;
    bcall('invalidateRender');
    return bcall('commitRender',{feedOnly:pending.feedOnly===true,reason:pending.reason||'home-feed-v2-idle',__idleCommitV795:true});
  }
  function requestRender(options){
    options=options||{};
    var hasCards=!!bcall('hasCards');
    /* V907R4R1 — la pagination du bas est strictement append-only. Lorsqu'on est
       déjà proche de la fin, autoriser uniquement CET append pendant le geste évite
       le trou « dernière carte -> attente -> nouvelles cartes », sans reconstruire
       ni déplacer les cartes déjà visibles. Tous les autres rendus restent protégés. */
    var allowAppendDuringScroll=options.__appendDuringScrollV907R4R1===true;
    if(hasCards&&bcall('isScrollActive')&&options.__idleCommitV795!==true&&!allowAppendDuringScroll)return queueRender(options);
    return bcall('commitRender',options);
  }
  function renderWhenIdle(reason){return queueRender({feedOnly:true,reason:reason||'home-feed-v2-idle'});}

  function resetRuntime(){
    clearTimeout(renderTimer);renderTimer=0;renderPending=null;
    clearTimeout(pagination.timer);
    pagination.cursor=null;pagination.seeded=false;pagination.done=false;pagination.loading=false;
    pagination.cycle=false;pagination.pending=false;pagination.timer=0;pagination.nextOffset=0;pagination.retryAt=0;
    updatePaginationState();
  }
  function seedPagination(cursor,done){
    if(cursor&&!pagination.seeded){pagination.cursor={created_at:String(cursor.created_at||''),id:String(cursor.id||'')};pagination.seeded=true;}
    if(done===true)pagination.done=true;
    else if(done===false)pagination.done=false;
    updatePaginationState();
    return paginationState();
  }
  function paginationState(){return {cursor:pagination.cursor&&Object.assign({},pagination.cursor),seeded:pagination.seeded,done:pagination.done,loading:pagination.loading,cycle:pagination.cycle,pending:pagination.pending,nextOffset:pagination.nextOffset,retryAt:pagination.retryAt||0};}

  function paginationLoaderMarkup(){
    return '<div class="happyadHomeAutoLoaderV921" role="status" aria-live="polite"><i aria-hidden="true"></i><span>Chargement…</span></div>';
  }
  function ensurePaginationLoader(sentinel){
    try{
      if(!sentinel)return null;
      var loader=sentinel.querySelector('.happyadHomeAutoLoaderV921');
      if(!loader){sentinel.innerHTML=paginationLoaderMarkup();loader=sentinel.querySelector('.happyadHomeAutoLoaderV921');}
      return loader;
    }catch(_e){return null;}
  }
  function updatePaginationState(){
    try{
      var sentinel=document.getElementById('happyadHomePaginationSentinelV694');if(!sentinel)return;
      ensurePaginationLoader(sentinel);
      var total=Number(bcall('visibleTotal')||0);
      var limit=Number(bcall('getRenderLimit')||0);
      var localPending=limit<total;
      var busy=!!(pagination.loading||pagination.cycle);
      var done=!!(pagination.done&&!localPending&&!pagination.loading);
      sentinel.hidden=done;
      sentinel.classList.toggle('is-loading',busy);
      sentinel.classList.toggle('is-done',done);
      sentinel.classList.toggle('has-more',!done);
      sentinel.setAttribute('aria-busy',busy?'true':'false');
      if(window.__happyadHomePaginationObserverV694){
        try{if(done)window.__happyadHomePaginationObserverV694.unobserve(sentinel);else window.__happyadHomePaginationObserverV694.observe(sentinel);}catch(_e){}
      }
    }catch(_e){}
  }
  function schedulePagination(delay){
    clearTimeout(pagination.timer);
    pagination.timer=setTimeout(function(){pagination.timer=0;maybeLoadMore();},Math.max(120,Number(delay)||180));
  }
  function releasePagination(recheck,delay){
    pagination.cycle=false;
    var mustRecheck=!!recheck||pagination.pending;
    pagination.pending=false;
    if(mustRecheck)schedulePagination(delay||180);
  }
  function releasePaginationAfterPaint(recheck){
    var done=function(){releasePagination(recheck,190);};
    try{requestAnimationFrame(function(){requestAnimationFrame(done);});}catch(_e){setTimeout(done,80);}
  }
  function feedDistanceToViewportBottom(){
    try{
      var list=bcall('getListNode');if(!list)return Infinity;
      var vh=Math.max(window.innerHeight||0,document.documentElement.clientHeight||0,600);
      return Number(list.getBoundingClientRect().bottom||0)-vh;
    }catch(_e){return Infinity;}
  }
  function isCriticalFeedEnd(){
    var vh=Math.max(window.innerHeight||0,document.documentElement.clientHeight||0,600);
    return feedDistanceToViewportBottom()<=Math.max(520,Math.min(980,Math.round(vh*.95)));
  }

  async function loadMoreRemote(options){
    options=options||{};
    var deferReveal=options.deferReveal===true;
    if(pagination.loading||pagination.done)return false;
    if(!bridge)return false;
    pagination.loading=true;updatePaginationState();
    var visibleAdded=false,rawAdded=0,loops=0,lastError=null;
    try{
      if(!pagination.seeded){
        try{await bcall('ensureRemoteSeed');}catch(_seedErr){}
        if(!pagination.seeded)return false;
      }
      while(!pagination.done&&!visibleAdded&&loops<5){
        loops++;
        var beforeCursor=pagination.cursor&&Object.assign({},pagination.cursor);
        var beforeVisible=Number(bcall('visibleTotal')||0);
        var beforeRows=bcall('getRows')||[];
        var beforeIds=new Set(beforeRows.map(function(x){return idOf(x);}));
        var result=await withPaginationTimeout(bcall('fetchPage',pagination.cursor,Number(bcall('getRemoteProbe')||21)),12000);
        if(result&&result.error)throw result.error;
        var probeRows=(result&&result.rows)||[];
        var remotePage=Math.max(1,Number(bcall('getRemotePage')||20));
        var rows=(result&&Array.isArray(result.page)&&result.page.length)?result.page:probeRows.slice(0,remotePage);
        if(!rows.length){pagination.done=true;break;}
        var nextCursor=(result&&result.cursor)||cursorFromRows(rows);
        /* V907R4 : le réseau peut préparer la page suivante pendant le geste.
           On fusionne seulement les données en mémoire (append-only, donc aucune
           carte déjà visible ne change de position). Le rendu DOM et les écritures
           de cache restent différés/protégés pour préserver la fluidité du scroll. */
        if(nextCursor){pagination.cursor=nextCursor;pagination.seeded=true;}
        pagination.nextOffset+=rows.length;
        if(result&&result.done===true)pagination.done=true;
        else if(!(result&&result.done===false)&&probeRows.length<=remotePage)pagination.done=true;
        if(beforeCursor&&nextCursor&&cursorCompare(beforeCursor,nextCursor)===0){pagination.done=true;break;}

        var fresh=bcall('mapRows',rows)||rows;
        var merged=appendPage(beforeRows,fresh);
        bcall('setRows',merged);
        var current=bcall('getRows')||[];
        /* Sérialisation/cache hors geste : ne jamais faire payer JSON/localStorage
           au scroll qui vient de déclencher le préchargement. */
        (function(snapshot){
          whenIdle().then(function(){
            try{bcall('saveRows',snapshot);}catch(_save){}
            try{bcall('writeConfirmed',snapshot);}catch(_confirmed){}
          }).catch(function(){});
        })(current.slice());
        rawAdded+=current.filter(function(x){return !beforeIds.has(idOf(x));}).length;
        var afterVisible=Number(bcall('visibleTotal')||0);
        visibleAdded=afterVisible>beforeVisible;

        if(visibleAdded&&!deferReveal){
          var step=Math.max(1,Number(bcall('getProgressiveStep')||5));
          var currentLimit=Number(bcall('getRenderLimit')||0);
          var critical=isCriticalFeedEnd();
          /* Compatibilité : les appels explicites historiques peuvent encore révéler.
             Le préchargement automatique V921 utilise deferReveal afin de ne jamais
             modifier le DOM pendant le scroll. */
          var revealStep=critical?Math.max(step,8):step;
          bcall('setRenderLimit',Math.min(afterVisible,Math.max(currentLimit+revealStep,beforeVisible+1)));
          bcall('invalidateRender');
          requestRender({feedOnly:true,reason:'pagination-remote-feed-v2',__appendDuringScrollV907R4R1:critical});
        }
        try{bcall('primeActions',fresh);}catch(_e){}
        try{bcall('enrichFresh',fresh);}catch(_e){}
      }
    }catch(e){
      lastError=e;
      pagination.retryAt=Date.now()+1400;
      try{console.warn('home feed master load more',e);}catch(_e){}
    }
    finally{
      pagination.loading=false;ensureScrollLoader();updatePaginationState();
      if(!lastError){pagination.retryAt=0;if(!visibleAdded&&!pagination.done&&rawAdded===0)pagination.pending=true;}
    }
    return visibleAdded;
  }

  function revealAutomaticBatchV921(){
    try{
      var total=Number(bcall('visibleTotal')||0);
      var limit=Number(bcall('getRenderLimit')||0);
      if(limit>=total)return false;
      /* V921 — on garde de petits lots (8 cartes maximum par vague) afin que
         l'ajout DOM reste court. La révélation attend toujours la fin du geste :
         aucune carte existante n'est reconstruite ou déplacée pendant le scroll. */
      var step=Math.max(8,Number(bcall('getProgressiveStep')||5));
      bcall('setRenderLimit',Math.min(total,limit+step));
      bcall('invalidateRender');
      requestRender({feedOnly:true,reason:'pagination-auto-batch-v921'});
      updatePaginationState();
      return true;
    }catch(_e){return false;}
  }

  async function runAutomaticContinuationV921(){
    if(pagination.loading||pagination.cycle)return false;
    var waitRetry=Math.max(0,Number(pagination.retryAt||0)-Date.now());
    if(waitRetry>0){schedulePagination(waitRetry+40);return false;}
    pagination.pending=false;
    pagination.cycle=true;updatePaginationState();
    try{
      /* Si la page suivante est déjà en mémoire, attendre la fin du geste. L'attente
         est bornée : si le scroll reste actif, aucun DOM n'est modifié et le cycle
         est relâché pour une tentative ultérieure. */
      if(Number(bcall('getRenderLimit')||0)<Number(bcall('visibleTotal')||0)){
        var localIdle=await whenPaginationIdle(1800);
        if(!localIdle){releasePagination(false,220);updatePaginationState();schedulePagination(260);return false;}
        var localShown=revealAutomaticBatchV921();
        releasePaginationAfterPaint(false);
        if(localShown)schedulePagination(240);
        return localShown;
      }
      if(pagination.done){releasePagination(false,180);updatePaginationState();return false;}

      /* Le réseau travaille pendant l'approche de la fin, mais deferReveal interdit
         toute création DOM pendant le geste. Après réponse, l'append attend l'idle. */
      await loadMoreRemote({deferReveal:true});
      var remoteIdle=await whenPaginationIdle(1800);
      if(!remoteIdle){releasePagination(false,220);updatePaginationState();schedulePagination(260);return false;}
      var shown=revealAutomaticBatchV921();
      releasePaginationAfterPaint(false);
      schedulePagination(shown?240:(pagination.retryAt?1450:420));
      return shown;
    }catch(_e){
      pagination.retryAt=Date.now()+1400;
      releasePagination(false,300);updatePaginationState();
      schedulePagination(1450);
      return false;
    }
  }

  /* Compatibilité interne avec l'API V920 : il n'existe plus de bouton, mais un
     ancien appel explicite déclenche exactement le même chemin automatique sûr. */
  function loadNextBatchManual(){return runAutomaticContinuationV921();}

  function maybeLoadMore(){
    try{
      /* V921 — chargement continu sans bouton. Le détecteur peut préparer le réseau
         tôt, mais la révélation des nouvelles cartes attend la fin du geste afin de
         préserver la fluidité verticale. */
      if(bcall('allowPagination')===false){pagination.pending=true;schedulePagination(650);return;}
      if(pagination.cycle||pagination.loading){pagination.pending=true;return;}
      if(bcall('hasPendingHead')&&(window.scrollY||0)<=100&&!bcall('isScrollActive')){
        pagination.pending=true;
        Promise.resolve(bcall('applyPendingHead')).finally(function(){schedulePagination(180);});
        return;
      }
      var list=bcall('getListNode');if(!list)return;
      var vh=Math.max(window.innerHeight||0,document.documentElement.clientHeight||0,600);
      var bottom=list.getBoundingClientRect().bottom;
      var preloadDistance=Math.max(900,Math.min(1800,Math.round(vh*1.8)));
      if(bottom>vh+preloadDistance)return;
      var retryWait=Math.max(0,Number(pagination.retryAt||0)-Date.now());
      if(retryWait>0){schedulePagination(retryWait+40);return;}

      updatePaginationState();
      if(pagination.done&&Number(bcall('getRenderLimit')||0)>=Number(bcall('visibleTotal')||0))return;
      runAutomaticContinuationV921();
    }catch(e){releasePagination(false,260);schedulePagination(500);updatePaginationState();}
  }

  function ensurePaginationSentinel(){
    try{
      var list=bcall('getListNode');if(!list)return null;
      var sentinel=document.getElementById('happyadHomePaginationSentinelV694');
      if(!sentinel){
        sentinel=document.createElement('div');sentinel.id='happyadHomePaginationSentinelV694';
        sentinel.className='happyadHomeProgressiveSentinelV764';sentinel.innerHTML=paginationLoaderMarkup();
      }
      ensurePaginationLoader(sentinel);
      if(sentinel.parentNode!==list||sentinel!==list.lastElementChild)list.appendChild(sentinel);
      if(!window.__happyadHomePaginationObserverV694&&'IntersectionObserver' in window){
        window.__happyadHomePaginationObserverV694=new IntersectionObserver(function(entries){
          if(entries.some(function(entry){return entry.isIntersecting;}))maybeLoadMore();
        },{root:null,rootMargin:'0px 0px 1800px 0px',threshold:0});
      }
      if(window.__happyadHomePaginationObserverV694){
        if(window.__happyadHomePaginationSentinelNodeV764&&window.__happyadHomePaginationSentinelNodeV764!==sentinel){try{window.__happyadHomePaginationObserverV694.unobserve(window.__happyadHomePaginationSentinelNodeV764);}catch(_e){}}
        window.__happyadHomePaginationSentinelNodeV764=sentinel;
        try{window.__happyadHomePaginationObserverV694.observe(sentinel);}catch(_e){}
      }
      updatePaginationState();return sentinel;
    }catch(_e){return null;}
  }
  function ensureScrollLoader(){
    ensurePaginationSentinel();
    if(window.__happyadHomeScrollLoaderBoundV2)return;
    window.__happyadHomeScrollLoaderBoundV2=true;
    /* IntersectionObserver reste le déclencheur principal. Ce debounce très léger
       est seulement un filet de sécurité pour les 2e/3e vagues quand le sentinel
       reste dans la marge de l'observer et ne produit plus de nouvelle transition. */
    function armAfterScroll(delay){
      clearTimeout(window.__happyadHomePaginationScrollFallbackTimerV922);
      window.__happyadHomePaginationScrollFallbackTimerV922=setTimeout(function(){
        window.__happyadHomePaginationScrollFallbackTimerV922=0;maybeLoadMore();
      },Math.max(180,Number(delay)||260));
    }
    window.addEventListener('scroll',function(){armAfterScroll(280);},{passive:true});
    window.addEventListener('touchend',function(){armAfterScroll(220);},{passive:true});
    try{window.addEventListener('scrollend',function(){armAfterScroll(140);},{passive:true});}catch(_e){}
    window.addEventListener('resize',function(){schedulePagination(140);});
    window.addEventListener('pageshow',function(e){if(!e||!e.persisted)return;setTimeout(function(){ensurePaginationSentinel();schedulePagination(140);},120);},{passive:true});
  }

  var api={
    version:VERSION,
    idOf:idOf,
    createdMs:createdMs,
    compareDesc:compareDesc,
    renderable:renderable,
    clean:cleanRows,
    seedCache:seedCache,
    replaceHead:replaceHead,
    appendPage:appendPage,
    patchExisting:patchExisting,
    remove:remove,
    cardKey:cardKey,
    publicMediaUrl:publicMediaUrl,
    normalizePost:normalizePost,
    normalizeRows:normalizeRows,
    explicitAlbumKey:explicitAlbumKey,
    fallbackAlbumKey:fallbackAlbumKey,
    marketplaceHomeVisible:marketplaceHomeVisible,
    groupPosts:groupPosts,
    cursorDate:cursorDate,
    cursorFromRows:cursorFromRows,
    cursorCompare:cursorCompare,
    applyCursor:applyCursor,
    connectRuntime:connectRuntime,
    whenIdle:whenIdle,
    resetRuntime:resetRuntime,
    seedPagination:seedPagination,
    paginationState:paginationState,
    requestRender:requestRender,
    queueRender:queueRender,
    flushRender:flushRender,
    renderWhenIdle:renderWhenIdle,
    hasPendingRender:hasPendingRender,
    updatePaginationState:updatePaginationState,
    schedulePagination:schedulePagination,
    releasePagination:releasePagination,
    releasePaginationAfterPaint:releasePaginationAfterPaint,
    loadMoreRemote:loadMoreRemote,
    loadNextBatchManual:loadNextBatchManual,
    maybeLoadMore:maybeLoadMore,
    ensurePaginationSentinel:ensurePaginationSentinel,
    ensureScrollLoader:ensureScrollLoader
  };

  window.HappyHomeFeedV1=api;
  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('home-feed-v1',{file:'core/home-feed-master-v1.js',responsibility:'source unique, normalisation, albums, ordre, rendu et pagination du fil Accueil',active:true,version:VERSION});}catch(_e){}
})();
