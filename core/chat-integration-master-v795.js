/* Fyblic V806 — base fonctionnelle V804 conservée.
   Correction unique : le host et l'iframe Chat restent plein écran ; aucune hauteur ni
   position visualViewport n'est appliquée à la couche extérieure. Le Chat interne gère seul le clavier. */
(function(){
  'use strict';
  if(window.__HAPPYAD_CHAT_INTEGRATION_MASTER_V795__)return;
  window.__HAPPYAD_CHAT_INTEGRATION_MASTER_V795__=true;

  var VERSION='V935_MARKET_OWNER_FIRST_PAINT';
  var CHAT_URL='modules/happyad-chat.html?v=1085-boutique-validation-visible';
  var HOST_ID='happyadChatHostV795';
  var FRAME_ID='happyadChatFrameV795';
  var host=null,frame=null,frameReady=false,pendingMode='ask',pendingContext=null;
  var lastOpenAt=0,homeScrollY=0;
  var initializationRequestId=0,openSessionId=0;

  /* V806 : aucun gestionnaire visualViewport dans le parent.
     La frame extérieure reste fixe à 100 % ; le module interne conserve sa propre
     adaptation du contenu et du scroll lorsque le clavier apparaît. */
  var previousBridges={
    marketplace:window.HAPPYAD_MARKETPLACE_BRIDGE||null,
    message:window.HAPPYAD_MESSAGE_BRIDGE||null,
    host:window.HAPPYAD_HOST_BRIDGE||null,
    verification:window.HAPPYAD_VERIFICATION_BRIDGE||null,
    publication:window.HAPPYAD_PUBLICATION_BRIDGE||null
  };

  function clean(value){return String(value==null?'':value).replace(/\s+/g,' ').trim();}
  function isUuid(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value));}
  function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(_e){return value;}}
  function readJson(key,fallback){try{var value=JSON.parse(localStorage.getItem(key)||'');return value==null?fallback:value;}catch(_e){return fallback;}}
  function first(obj,keys,fallback){
    obj=obj&&typeof obj==='object'?obj:{};
    for(var i=0;i<keys.length;i++){
      var value=obj[keys[i]];
      if(value!==undefined&&value!==null&&value!=='')return value;
    }
    return fallback;
  }
  function supabaseClient(){
    try{if(typeof window.happyadSb==='function'){var c=window.happyadSb();if(c&&typeof c.from==='function')return c;}}catch(_e){}
    try{if(window.happyadSupabase&&typeof window.happyadSupabase.from==='function')return window.happyadSupabase;}catch(_e){}
    try{if(window.supabaseClient&&typeof window.supabaseClient.from==='function')return window.supabaseClient;}catch(_e){}
    return null;
  }
  function avatarMaster(){return window.HappyProfileAvatarMasterV855R32||window.HappyProfileAvatarMaster||null;}
  function canonicalAvatar(uid,fallback){var m=avatarMaster(),id=clean(uid);if(m&&id){var e=m.getEntry&&m.getEntry(id);if(e&&e.known)return clean(e.url);if(m.resolve)m.resolve(id).catch(function(){});return '';}return clean(fallback);}
  function readCurrentUserLocal(){
    var keys=['HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL','HAPPYAD_LOGGED_USER','HAPPYAD_CURRENT_USER','HAPPYAD_USER'];
    var out={};
    for(var i=0;i<keys.length;i++){
      var item=readJson(keys[i],null);
      if(item&&typeof item==='object')out=Object.assign(out,item);
    }
    var authUid=clean(localStorage.getItem('HAPPYAD_AUTH_UID')||'');
    var uid=authUid||clean(first(out,['id','user_id','uid','auth_id','auth_user_id','account_uid'],''));
    var localAvatar=canonicalAvatar(uid,first(out,['avatar_url','avatar','profile_photo_url','profile_photo','photo_url','image_url'],''));
    return {
      id:uid,user_id:uid,uid:uid,
      name:clean(first(out,['name','full_name','display_name','username'],'Utilisateur Fyblic')),
      full_name:clean(first(out,['full_name','name','display_name'],'Utilisateur Fyblic')),
      username:clean(first(out,['username','handle'],'' )).replace(/^@+/,''),
      avatar:localAvatar,
      avatar_url:localAvatar,
      badge:clean(first(out,['badge','user_badge','profile_badge'],'')),
      account_type:clean(first(out,['account_type','type_compte','profile_type','role'],'user')),
      city:clean(first(out,['city','ville','town'],'')),
      country:clean(first(out,['country','pays'],''))
    };
  }
  async function resolveCurrentUser(){
    var local=readCurrentUserLocal();
    var client=supabaseClient();
    if(!client)return local;
    try{
      var auth=await client.auth.getUser();
      var authUser=auth&&auth.data&&auth.data.user;
      if(authUser&&isUuid(authUser.id)){
        local.id=local.user_id=local.uid=authUser.id;
        if(!local.name||local.name==='Utilisateur Fyblic')local.name=clean(authUser.user_metadata&&first(authUser.user_metadata,['full_name','name','display_name'],authUser.email||'Utilisateur Fyblic'));
        try{
          var profile=await client.from('happyad_profiles_public_v1').select('*').eq('id',authUser.id).maybeSingle();
          if(profile&&!profile.error&&profile.data){
            var p=profile.data;
            var master=avatarMaster();if(master&&master.primeFromProfile)master.primeFromProfile(p,{source:'chat-current-profile-v855r32'});
            local.name=clean(first(p,['full_name','display_name','name'],local.name));
            local.full_name=local.name;
            local.username=clean(first(p,['username','handle'],local.username)).replace(/^@+/, '');
            local.avatar=local.avatar_url=canonicalAvatar(authUser.id,p.avatar_url);
            local.badge=clean(first(p,['badge','user_badge','profile_badge'],local.badge));
            local.account_type=clean(first(p,['account_type','profile_type','role'],local.account_type));
            local.city=clean(first(p,['city','ville','town'],local.city));
            local.country=clean(first(p,['country','pays'],local.country));
          }
        }catch(_profileError){}
      }
    }catch(_authError){}
    return local;
  }

  function pushUnique(target,seen,row){
    if(!row||typeof row!=='object')return;
    var id=clean(first(row,['id','post_id','listing_id','offer_id'],''));
    var fingerprint=id||clean(first(row,['title','caption','description','content'],'')).slice(0,90)+'|'+clean(first(row,['created_at','createdAt'],'')).slice(0,30);
    if(!fingerprint||seen[fingerprint])return;
    seen[fingerprint]=1;
    target.push(row);
  }
  function localPostRows(){
    var rows=[],seen={};
    try{if(typeof ALL_POSTS!=='undefined'&&Array.isArray(ALL_POSTS))ALL_POSTS.forEach(function(row){pushUnique(rows,seen,row);});}catch(_e){}
    try{if(Array.isArray(window.ALL_POSTS))window.ALL_POSTS.forEach(function(row){pushUnique(rows,seen,row);});}catch(_e){}
    var keys=['HAPPYAD_GLOBAL_POSTS_CACHE_V1','HAPPYAD_PUBLISH_POSTS_V2','HAPPYAD_HOME_POSTS_CACHE_V1','HAPPYAD_ALL_POSTS_V1','HAPPYAD_SEARCH_POSTS_FAST_CACHE_V1','HAPPYAD_HOME_BOOT_SNAPSHOT_V1'];
    keys.forEach(function(key){
      var value=readJson(key,[]);
      if(value&&Array.isArray(value.posts))value=value.posts;
      if(value&&Array.isArray(value.data))value=value.data;
      if(Array.isArray(value))value.forEach(function(row){pushUnique(rows,seen,row);});
    });
    return rows.slice(0,420);
  }
  function mediaList(row){
    var out=[],bySrc={};
    function add(src,type,poster){
      src=clean(src);if(!src)return;
      var video=clean(type).toLowerCase().indexOf('video')>=0||/\.(mp4|webm|mov|m4v|3gp|3g2|mkv|avi|mpeg|mpg)(\?|#|$)/i.test(src);
      if(bySrc[src]){if(video)bySrc[src].type='video';if(clean(poster)&&!bySrc[src].poster)bySrc[src].poster=clean(poster);return;}
      var item={src:src,type:video?'video':'image',poster:clean(poster)};bySrc[src]=item;out.push(item);
    }
    var arrays=['marketplace_media','media','medias','media_list','media_urls','images','photos','videos','attachments','files'];
    arrays.forEach(function(key){
      var value=row&&row[key];
      if(typeof value==='string'){try{value=JSON.parse(value);}catch(_e){value=value.split(',');}}
      if(!Array.isArray(value))return;
      value.forEach(function(item){
        if(typeof item==='string')add(item,'','');
        else if(item&&typeof item==='object')add(first(item,['src','url','media_url','image_url','video_url','file_url'],''),first(item,['type','media_type','kind'],''),first(item,['poster','poster_url','thumbnail_url'],''));
      });
    });
    var rowPoster=clean(first(row,['thumbnail_url','thumbnailUrl','poster_url','posterUrl','cover_url','coverUrl'],''));
    add(first(row,['marketplace_cover_url','media_url','mediaUrl','image_url','imageUrl','photo_url','cover_url','file_url','url'],''),first(row,['marketplace_cover_type','media_type','mediaType','content_type','kind'],''),rowPoster);
    add(first(row,['video_url','videoUrl'],''),'video',rowPoster);
    if(rowPoster){
      var coverIndex=Math.max(0,Number(first(row,['marketplace_cover_index','coverIndex'],0)||0)),coverType=clean(first(row,['marketplace_cover_type','media_type','mediaType','kind'],'')).toLowerCase(),target=-1;
      if(coverType.indexOf('video')>=0&&out[coverIndex]&&out[coverIndex].type==='video')target=coverIndex;
      if(target<0)target=out.findIndex(function(item){return item.type==='video';});
      if(target>=0)out[target].poster=rowPoster;
    }
    return out.slice(0,10);
  }
  function slimListing(row,index){
    row=row&&typeof row==='object'?row:{};
    var medias=mediaList(row);
    var ownerUid=clean(first(row,['seller_id','owner_id','user_id','author_id','profile_id','creatorId','creator_id','uid'],''));
    var seller=clean(first(row,['seller_name','owner_name','author_name','creatorName','user_name','display_name','full_name','username'],'Utilisateur Fyblic'));
    var title=clean(first(row,['title','product_name','listing_title','name','caption','headline'],'Annonce Fyblic'));
    var description=clean(first(row,['description','desc','details','content','text','caption'],''));
    var category=clean(first(row,['marketplace_category','product_category','listing_category','category','post_type','kind','type'],'Produit'));
    return {
      id:first(row,['id','listing_id','offer_id','post_id'],'happyad_'+index),
      post_id:first(row,['post_id','id'],''),
      title:title,description:description,caption:clean(first(row,['caption'],description)),
      category:category,marketplace_category:category,
      listing_type:clean(first(row,['listing_type','offer_type','post_type','type','kind'],category)),
      price:first(row,['marketplace_price','price','amount','offer_price','product_price','listing_price','monthly_price'],0),
      price_label:clean(first(row,['price_label','formatted_price'],'')),
      currency:clean(first(row,['currency','price_currency','monnaie'],'')),
      city:clean(first(row,['city','town','ville'],'')),
      country:clean(first(row,['country','pays'],'')),
      area:clean(first(row,['area','zone','district','neighborhood','quartier'],'')),
      location:clean(first(row,['location','address','place','location_name'],'')),
      seller_id:ownerUid,owner_id:ownerUid,user_id:ownerUid,author_id:ownerUid,
      seller_name:seller,owner_name:seller,author_name:seller,
      seller_avatar:clean(first(row,['seller_avatar','owner_avatar','author_avatar','creatorAvatar','user_avatar','avatar_url','avatar'],'')),
      seller_badge:clean(first(row,['seller_badge','owner_badge','author_badge','badge','user_badge'],'')),
      media:medias,marketplace_media:first(row,['marketplace_media'],medias),
      media_url:clean(first(row,['marketplace_cover_url','media_url','mediaUrl'],medias[0]&&medias[0].src||'')),
      media_type:clean(first(row,['marketplace_cover_type','media_type','mediaType'],medias[0]&&medias[0].type||'')),
      thumbnail_url:clean(first(row,['thumbnail_url','poster_url','cover_url'],medias[0]&&medias[0].poster||'')),
      marketplace_show_on_home:first(row,['marketplace_show_on_home','showOnHome'],false)===true,
      marketplace_cover_index:Number(first(row,['marketplace_cover_index','coverIndex'],0)||0),
      marketplace_cover_url:clean(first(row,['marketplace_cover_url','media_url','mediaUrl'],'')),
      marketplace_cover_path:clean(first(row,['marketplace_cover_path','media_path','mediaPath'],'')),
      marketplace_cover_type:clean(first(row,['marketplace_cover_type','media_type','mediaType'],'')),
      listing_views_count:Number(first(row,['listing_views_count','viewsCount'],0)||0),
      status:clean(first(row,['listing_status','status','state','moderation_status'],'active')),
      listing_status:clean(first(row,['listing_status','status','state','moderation_status'],'active')),
      happyad_marketplace:first(row,['happyad_marketplace','is_marketplace'],false)===true,
      availability:clean(first(row,['availability','available_text'],'')),
      condition:clean(first(row,['product_condition','condition','item_condition'],'')),
      quantity:Number(first(row,['quantity','stock_quantity'],0)||0),
      product_brand:clean(first(row,['product_brand','brand'],'')),
      product_model:clean(first(row,['product_model','model','reference'],'')),
      marketplace_details:first(row,['marketplace_details'],{}),
      vehicle_year:first(row,['vehicle_year'],null),vehicle_mileage:first(row,['vehicle_mileage'],null),
      land_area:first(row,['land_area'],null),land_area_unit:clean(first(row,['land_area_unit'],'')),land_use:clean(first(row,['land_use'],'')),land_document_type:clean(first(row,['land_document_type'],'')),
      service_mode:clean(first(row,['service_mode'],'')),service_pricing:clean(first(row,['service_pricing'],'')),service_experience:clean(first(row,['service_experience'],'')),
      company_name:clean(first(row,['company_name'],'')),job_contract:clean(first(row,['job_contract'],'')),job_work_mode:clean(first(row,['job_work_mode'],'')),job_experience:clean(first(row,['job_experience'],'')),job_positions:first(row,['job_positions'],null),job_deadline:first(row,['job_deadline'],null),
      property_type:clean(first(row,['property_type'],'')),property_rooms:first(row,['property_rooms'],null),property_area:first(row,['property_area'],null),
      is_active:first(row,['is_active','active'],true)!==false,
      deleted_at:first(row,['deleted_at'],null),
      created_at:first(row,['created_at','createdAt','published_at','publishedAt'],null),
      keywords:clean(first(row,['keywords','search_text','tags'],title+' '+description+' '+category))
    };
  }
  function looksLikeMarketplace(row){
    row=row&&typeof row==='object'?row:{};
    if(first(row,['happyad_marketplace','is_marketplace'],false)===true)return true;
    if(clean(first(row,['mode'],'' )).toLowerCase()==='marketplace')return true;
    var category=clean(first(row,['marketplace_category','product_category','listing_category','category','post_type','kind','type'],'')).toLowerCase();
    var listingType=clean(first(row,['listing_type','offer_type','post_type','type'],'')).toLowerCase();
    var price=Number(first(row,['marketplace_price','price','amount','offer_price','product_price','listing_price','monthly_price'],0)||0);
    return price>0&&/produit|product|electron|électron|vehicule|véhicule|terrain|immobilier|service|emploi|job|market|offre|vente|sale|louer|rent/.test(category+' '+listingType);
  }
  function mergeListings(a,b){
    var out=[],seen={};
    (a||[]).concat(b||[]).forEach(function(row){
      if(!row||typeof row!=='object'||!looksLikeMarketplace(row))return;
      var id=clean(first(row,['id','listing_id','offer_id','post_id'],''));
      var key=id||clean(first(row,['title','caption','description'],'')).slice(0,100)+'|'+clean(first(row,['created_at','createdAt'],'')).slice(0,30);
      if(!key||seen[key])return;seen[key]=1;out.push(row);
    });
    return out;
  }
  async function fetchRemoteListings(){
    var client=supabaseClient();if(!client)return [];
    /* Source distante officielle : happyad_posts. Le filtre V803 est tenté en premier,
       mais un résultat vide ne masque pas les anciennes annonces non encore marquées. */
    try{
      var filtered=await client.from('happyad_posts').select('*').eq('happyad_marketplace',true).eq('listing_status','active').order('created_at',{ascending:false}).limit(420);
      if(filtered&&!filtered.error&&Array.isArray(filtered.data)&&filtered.data.length)return filtered.data;
    }catch(_e){}
    try{
      var fallback=await client.from('happyad_posts').select('*').order('created_at',{ascending:false}).limit(420);
      if(fallback&&!fallback.error&&Array.isArray(fallback.data))return fallback.data;
    }catch(_e){}
    return [];
  }
  function activeListingRow(row){
    row=row&&typeof row==='object'?row:{};
    var status=clean(row.listing_status||row.status||'active').toLowerCase();
    return !row.deleted_at&&row.is_active!==false&&['removed','expired','sold','paused','deleted','rejected','archived'].indexOf(status)<0;
  }
  function newestFirst(rows){
    return (rows||[]).sort(function(a,b){
      var ad=Date.parse(a&&a.created_at||'')||0;
      var bd=Date.parse(b&&b.created_at||'')||0;
      return bd-ad;
    });
  }
  async function activeListings(){
    /* V815 : Supabase reste la source de vérité. Le cache local accélère l’ouverture,
       mais ne peut plus remplacer les anciennes annonces par la dernière publication. */
    var priorRows=[];
    if(previousBridges.marketplace){
      var fn=previousBridges.marketplace.getActiveListings||previousBridges.marketplace.listActiveOffers||previousBridges.marketplace.getOffers;
      if(typeof fn==='function'){
        try{
          var prior=await fn.call(previousBridges.marketplace,{status:'active',limit:500,source:'happyad-chat-v817'});
          priorRows=Array.isArray(prior)?prior:first(prior||{},['data','listings','offers'],[]);
        }catch(_e){}
      }
    }
    var localRows=localPostRows();
    var remoteRows=await fetchRemoteListings();
    var merged=mergeListings(remoteRows,mergeListings(priorRows,localRows));
    return newestFirst(merged.map(slimListing).filter(activeListingRow)).slice(0,500);
  }

  function ensureHost(){
    if(host&&host.isConnected&&frame&&frame.isConnected)return host;
    host=document.getElementById(HOST_ID);
    if(!host){
      host=document.createElement('section');
      host.id=HOST_ID;
      host.setAttribute('aria-hidden','true');
      host.setAttribute('aria-label','Chat annonce');
      host.innerHTML='<div id="happyadChatBootV795">Ouverture du Chat annonce…</div><iframe id="'+FRAME_ID+'" title="Chat annonce" allow="camera; microphone; clipboard-read; clipboard-write" referrerpolicy="same-origin"></iframe>';
      document.body.appendChild(host);
    }
    frame=document.getElementById(FRAME_ID);
    if(frame&&!frame.getAttribute('src')){
      frame.addEventListener('load',function(){
        frameReady=true;
        sendFastBootstrapV935();
        sendFastListingOpenV850();
        setTimeout(function(){if(host)host.classList.add('happyadChatFrameReadyV795');},24);
        sendInitialization(pendingMode,pendingContext);
      });
      frame.setAttribute('src',CHAT_URL);
    }
    return host;
  }
  function languageCode(){
    var raw=clean(document.documentElement.lang||navigator.language||'fr').toLowerCase();
    if(raw.indexOf('sw')===0)return 'sw';
    if(raw.indexOf('ln')===0)return 'ln';
    if(raw.indexOf('en')===0)return 'en';
    if(raw.indexOf('es')===0)return 'es';
    if(raw.indexOf('pt')===0)return 'pt';
    if(raw.indexOf('de')===0)return 'de';
    if(raw.indexOf('ar')===0)return 'ar';
    if(raw.indexOf('ru')===0)return 'ru';
    if(raw.indexOf('zh')===0)return 'zh';
    if(raw.indexOf('hi')===0)return 'hi';
    return 'fr';
  }
  async function resolveVerificationState(){
    var bridge=previousBridges.verification;
    if(bridge&&typeof bridge.getStatus==='function'){
      try{return await bridge.getStatus();}catch(error){console.warn('Fyblic verification status V801',error);}
    }
    return null;
  }
  function pushVerificationStateToChat(state){
    if(!frame||!frame.contentWindow)return false;
    try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_SET_VERIFICATION',payload:{verification:clone(state||null)},source:'happyad-host',version:VERSION},location.origin);return true;}catch(_e){
      try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_SET_VERIFICATION',payload:{verification:clone(state||null)},source:'happyad-host',version:VERSION},'*');return true;}catch(_e2){return false;}
    }
  }
  function readFastListingV850(context){
    context=context&&typeof context==='object'?context:{};
    if(context.listing&&typeof context.listing==='object')return clone(context.listing);
    try{var saved=JSON.parse(sessionStorage.getItem('HAPPYAD_DIRECT_LISTING_V850')||'null');if(saved&&saved.listing&&Date.now()-Number(saved.at||0)<120000)return clone(saved.listing);}catch(_e){}
    return null;
  }
  function activeListingsFastV935(){
    try{
      var localRows=localPostRows();
      var merged=mergeListings([],localRows);
      return newestFirst(merged.map(slimListing).filter(activeListingRow)).slice(0,72);
    }catch(_e){return [];}
  }
  function sendFastBootstrapV935(){
    if(!frame||!frame.contentWindow)return false;
    var payload={
      openSessionId:openSessionId,
      mode:pendingMode,
      user:readCurrentUserLocal(),
      listings:activeListingsFastV935(),
      context:clone(pendingContext||{}),
      source:'happyad-host-v935'
    };
    try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_FAST_BOOTSTRAP_V935',payload:payload,source:'happyad-host',version:VERSION},location.origin);return true;}catch(_e){
      try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_FAST_BOOTSTRAP_V935',payload:payload,source:'happyad-host',version:VERSION},'*');return true;}catch(_e2){return false;}
    }
  }
  function sendFastListingOpenV850(){
    if(!frame||!frame.contentWindow||pendingMode!=='market')return false;
    var context=clone(pendingContext||{}),id=clean(context.listingId||context.listing_id||'');
    if(!id)return false;
    var payload={mode:'market',listingId:id,listing:readFastListingV850(context),context:context,openSessionId:openSessionId,source:'happyad-host-v850'};
    try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_OPEN_LISTING_FAST',payload:payload,source:'happyad-host',version:VERSION},location.origin);return true;}catch(_e){
      try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_OPEN_LISTING_FAST',payload:payload,source:'happyad-host',version:VERSION},'*');return true;}catch(_e2){return false;}
    }
  }
  async function sendInitialization(mode,context){
    if(!frame||!frame.contentWindow)return false;
    var requestId=++initializationRequestId;
    var sessionId=openSessionId;
    function stillCurrent(){return requestId===initializationRequestId&&sessionId===openSessionId&&frame&&frame.contentWindow;}
    var userPromise=resolveCurrentUser().then(function(user){
      if(stillCurrent()){
        try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_SET_USER',payload:{user:clone(user),resolved:true,openSessionId:sessionId},source:'happyad-host-v935',version:VERSION},location.origin);}catch(_e){try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_SET_USER',payload:{user:clone(user),resolved:true,openSessionId:sessionId},source:'happyad-host-v935',version:VERSION},'*');}catch(_e2){}}
      }
      return user;
    });
    var listingsPromise=activeListings().then(function(listings){
      if(stillCurrent()){
        try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_SET_OFFERS',payload:{listings:clone(listings),replace:true,resolved:true,openSessionId:sessionId,source:'happyad-host-v935'},source:'happyad-host-v935',version:VERSION},location.origin);}catch(_e){try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_SET_OFFERS',payload:{listings:clone(listings),replace:true,resolved:true,openSessionId:sessionId,source:'happyad-host-v935'},source:'happyad-host-v935',version:VERSION},'*');}catch(_e2){}}
      }
      return listings;
    });
    var verificationPromise=resolveVerificationState();
    var resolved=await Promise.all([userPromise,listingsPromise,verificationPromise]);
    /* Une initialisation Supabase peut finir après que l'utilisateur a déjà choisi
       Je propose ou Annonces. On utilise donc toujours le mode le plus récent et
       on ignore toute réponse appartenant à une ancienne ouverture. */
    if(!stillCurrent())return false;
    var user=resolved[0],listings=resolved[1],verification=resolved[2];
    var liveMode=['ask','offer','market'].indexOf(pendingMode)>=0?pendingMode:mode;
    var payload={
      origin:location.origin,
      mode:liveMode==='market'?'market':(liveMode==='offer'?'offer':'ask'),
      openSessionId:sessionId,
      language:languageCode(),
      user:user,
      verification:verification,
      listings:listings,
      context:clone(context||pendingContext||{})
    };
    try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_INIT',payload:payload,source:'happyad-host',version:VERSION},location.origin);return true;}catch(_e){
      try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_INIT',payload:payload,source:'happyad-host',version:VERSION},'*');return true;}catch(_e2){return false;}
    }
  }
  function pauseHomeMedia(){
    try{document.querySelectorAll('video,audio').forEach(function(media){try{media.pause();}catch(_e){}});}catch(_e){}
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_PAUSE_ALL_MEDIA',{detail:{source:VERSION}}));}catch(_e){}
  }
  function openChat(options){
    options=options&&typeof options==='object'?options:{};
    var now=Date.now();if(now-lastOpenAt<180)return false;lastOpenAt=now;
    openSessionId++;
    initializationRequestId++;
    pendingMode=['ask','offer','market'].indexOf(options.mode)>=0?options.mode:'ask';
    pendingContext=clone(options.context||options.profile||{});
    homeScrollY=Math.max(0,Number(window.scrollY||document.documentElement.scrollTop||0));
    ensureHost();
    pauseHomeMedia();
    document.documentElement.classList.add('happyadChatOpenV795');
    document.body.classList.add('happyadChatOpenV795');
    host.classList.add('happyadChatHostOpenV795');
    host.setAttribute('aria-hidden','false');
    if(frameReady){
      sendFastBootstrapV935();
      sendFastListingOpenV850();
      sendInitialization(pendingMode,pendingContext);
      try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_OPEN_MODE',payload:{mode:pendingMode,openSessionId:openSessionId,context:clone(pendingContext||{})}},location.origin);}catch(_e){}
    }
    return false;
  }
  function closeChat(detail){
    detail=detail&&typeof detail==='object'?detail:{};
    if(previousBridges.host&&typeof previousBridges.host.closeChat==='function'){
      try{previousBridges.host.closeChat(detail);}catch(_e){}
    }
    if(!host)return false;
    host.classList.remove('happyadChatHostOpenV795');
    host.setAttribute('aria-hidden','true');
    document.documentElement.classList.remove('happyadChatOpenV795');
    document.body.classList.remove('happyadChatOpenV795');
    requestAnimationFrame(function(){try{window.scrollTo(0,homeScrollY);}catch(_e){}});
    return false;
  }

  function listingCacheForUid(uid){
    uid=clean(uid);if(!uid)return null;
    var rows=localPostRows();
    for(var i=0;i<rows.length;i++){
      var row=rows[i]||{};
      var owner=clean(first(row,['seller_id','owner_id','user_id','author_id','profile_id','creatorId','creator_id','uid'],''));
      if(owner===uid)return row;
    }
    return null;
  }
  async function resolveMessageTarget(payload){
    payload=payload&&typeof payload==='object'?payload:{};
    var uid=clean(payload.recipientUid||payload.recipient_id||payload.target_id);
    if(!isUuid(uid))return null;
    var source=listingCacheForUid(uid)||{};
    var target={
      id:uid,user_id:uid,
      name:clean(payload.recipientName||first(source,['seller_name','owner_name','author_name','creatorName','user_name','display_name','full_name','username'],'Utilisateur Fyblic')),
      avatar:canonicalAvatar(uid,payload.recipientAvatar||first(source,['seller_avatar','owner_avatar','author_avatar','creatorAvatar','user_avatar','avatar_url','avatar'],'')),
      badge:clean(payload.recipientBadge||first(source,['seller_badge','owner_badge','author_badge','badge','user_badge'],'')),
      status:''
    };
    var client=supabaseClient();
    if(client){
      try{
        var response=await client.from('happyad_profiles_public_v1').select('id,full_name,display_name,name,username,avatar_url,avatar,badge,user_badge').eq('id',uid).maybeSingle();
        if(response&&!response.error&&response.data){
          var p=response.data;
          var master=avatarMaster();if(master&&master.primeFromProfile)master.primeFromProfile(p,{source:'chat-message-target-v855r32'});
          target.name=clean(first(p,['full_name','display_name','name','username'],target.name));
          target.avatar=canonicalAvatar(uid,p.avatar_url);
          target.badge=clean(first(p,['badge','user_badge'],target.badge));
          target.status=clean(first(p,['username'],''));
        }
      }catch(_e){}
    }
    return target;
  }
  async function openRealMessage(payload){
    payload=payload&&typeof payload==='object'?payload:{};
    if(previousBridges.message&&typeof previousBridges.message.openConversation==='function'){
      try{return await previousBridges.message.openConversation(payload);}catch(_e){}
    }
    var target=await resolveMessageTarget(payload);
    if(!target){
      try{frame&&frame.contentWindow&&frame.contentWindow.postMessage({type:'HAPPYAD_MESSAGE_OPENED',payload:{ok:false,reason:'recipient_missing'}},'*');}catch(_e){}
      throw new Error('Annonceur introuvable.');
    }
    try{
      localStorage.setItem('HAPPYAD_PENDING_LISTING_CONTEXT_V795',JSON.stringify({
        source:'happyad-chat-v806',recipientUid:target.id,offerId:payload.offerId||payload.listingId||'',
        title:payload.title||'',price:payload.price||'',location:payload.location||'',media:payload.media||[],at:Date.now()
      }));
    }catch(_e){}
    closeChat({reason:'open_messages'});
    var tabs=window.HappyMainTabsV598||window.HappyMainTabsV596||window.HappyMainTabsV595||window.HappyMainTabsV594;
    if(!tabs||typeof tabs.openMessage!=='function')throw new Error('Le maître Messages Fyblic est indisponible.');
    tabs.openMessage({
      source:'happyad-chat-v806',
      context_id:'happyad-chat-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
      target:target,
      listing_context:{offerId:payload.offerId||payload.listingId||'',title:payload.title||'',price:payload.price||'',location:payload.location||'',media:payload.media||[]}
    });
    try{frame&&frame.contentWindow&&frame.contentWindow.postMessage({type:'HAPPYAD_MESSAGE_OPENED',payload:{ok:true,target_id:target.id}},'*');}catch(_e){}
    return true;
  }

  window.HAPPYAD_MARKETPLACE_BRIDGE={
    getActiveListings:activeListings,
    listActiveOffers:activeListings,
    getOffers:activeListings
  };
  window.HAPPYAD_HOST_BRIDGE={closeChat:closeChat};
  window.HAPPYAD_MESSAGE_BRIDGE={openConversation:openRealMessage};
  /* V800 : ne jamais écraser silencieusement un maître déjà présent.
     Tant que Supabase n'est pas branché, le fallback rejette proprement afin que
     le Chat n'affiche jamais à tort « transmis ». */
  window.HAPPYAD_VERIFICATION_BRIDGE={
    version:VERSION,
    submitSellerVerification:function(payload){
      var prior=previousBridges.verification;
      if(prior&&typeof prior.submitSellerVerification==='function')return prior.submitSellerVerification(payload);
      return Promise.reject(new Error('Vérification vendeur Supabase V801 indisponible.'));
    },
    getStatus:function(){return resolveVerificationState();},
    subscribe:function(callback){
      var prior=previousBridges.verification;
      if(prior&&typeof prior.subscribe==='function')return prior.subscribe(function(state){
        pushVerificationStateToChat(state);
        if(typeof callback==='function')callback(state);
      });
      return function(){};
    }
  };
  if(previousBridges.verification&&typeof previousBridges.verification.subscribe==='function'){
    try{previousBridges.verification.subscribe(pushVerificationStateToChat);}catch(_verificationSubscribeError){}
  }
  window.HAPPYAD_PUBLICATION_BRIDGE={
    publishOffer:function(payload){
      var prior=previousBridges.publication;
      if(prior&&typeof prior.publishOffer==='function')return prior.publishOffer(payload);
      return Promise.reject(new Error('Publication Annonce non connectée au maître Fyblic.'));
    }
  };

  document.addEventListener('happyad:chat-sticker-requested',function(event){
    openChat({mode:'ask',context:{source:'home-sticker',detail:clone(event&&event.detail||{})}});
  });
  document.addEventListener('happyad:annonces-requested',function(event){
    var detail=clone(event&&event.detail||{});
    openChat({mode:'market',context:Object.assign({source:'home-annonces'},detail||{})});
  });
  window.addEventListener('message',function(event){
    try{var data=event&&event.data||{};if(data.type==='HAPPYAD_VIDEO_TAB_READY_V594'||data.type==='HAPPYAD_VIDEO_READY'){setTimeout(function(){try{ensureHost();}catch(_e){}},120);}}catch(_e){}
  },true);
  window.addEventListener('message',function(event){
    if(frame&&event.source!==frame.contentWindow)return;
    var data=event&&event.data||{};
    var payload=data.payload||data.detail||{};
    if(data.type==='HAPPYAD_CHAT_READY'){
      frameReady=true;
      sendFastBootstrapV935();
      sendFastListingOpenV850();
      setTimeout(function(){if(host)host.classList.add('happyadChatFrameReadyV795');},24);
      sendInitialization(pendingMode,pendingContext);
    }else if(data.type==='HAPPYAD_CHAT_MODE_CHANGED'){
      if(['ask','offer','market'].indexOf(payload.mode)>=0)pendingMode=payload.mode;
    }else if(data.type==='HAPPYAD_CHAT_CLOSE'||data.type==='HAPPYAD_CLOSE_CHAT'){
      closeChat(payload);
    }else if(data.type==='HAPPYAD_OPEN_MESSAGE_DIRECT'||data.type==='HAPPYAD_OPEN_MESSAGE'){
      openRealMessage(payload).catch(function(error){
        console.warn('Fyblic Chat Messages V795',error);
        try{frame&&frame.contentWindow&&frame.contentWindow.postMessage({type:'HAPPYAD_MESSAGE_OPENED',payload:{ok:false,message:error.message||'Ouverture impossible'}},'*');}catch(_e){}
      });
    }
  },true);
  function refreshPublishedListings(event){
    if(!(frame&&frameReady))return;
    activeListings().then(function(list){
      try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_SET_OFFERS',payload:{listings:list,replace:true,source:'supabase-v820'}},'*');}catch(_e){}
    });
  }
  document.addEventListener('happyad:marketplace-product-published',refreshPublishedListings);
  document.addEventListener('happyad:marketplace-listing-published',refreshPublishedListings);
  window.addEventListener('HAPPYAD_PROFILE_AVATAR_UPDATED_V855R32',function(event){var d=event&&event.detail||{},uid=clean(d.userId||d.uid||d.id);if(!uid||!(frame&&frameReady))return;resolveCurrentUser().then(function(user){if(user&&user.id===uid)try{frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_SET_USER',payload:{user:user},source:'happyad-host',version:VERSION},'*');}catch(_e){}});});
  document.addEventListener('keydown',function(event){if(event.key==='Escape'&&host&&host.classList.contains('happyadChatHostOpenV795'))closeChat({reason:'escape'});},true);

  window.HappyadChatIntegrationV795={
    version:VERSION,
    open:openChat,
    close:closeChat,
    reloadListings:function(){return activeListings().then(function(list){if(frame&&frame.contentWindow)frame.contentWindow.postMessage({type:'HAPPYAD_CHAT_SET_OFFERS',payload:{listings:list,replace:true,source:'supabase-v820'}},'*');return list.length;});},
    getState:function(){return {open:!!(host&&host.classList.contains('happyadChatHostOpenV795')),ready:frameReady,mode:pendingMode};}
  };
  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('chat-integration',{file:'core/chat-integration-master-v795.js',responsibility:'frame Chat isolée plein écran V806, un seul gestionnaire viewport interne, publication Marketplace V820, vérification vendeur Supabase/admin, retour et maître Messages',active:true,version:VERSION});}catch(_e){}
})();
