(function(){
  'use strict';
  if(window.__HAPPYAD_NOTIFICATION_MASTER_V1__) return;
  window.__HAPPYAD_NOTIFICATION_MASTER_V1__ = true;

  var VERSION='V937_POST_MENTION_NOTIFICATION';
  var TABLE='happyad_notifications';
  var CACHE_PREFIX='happyad-notifications-cache-v1:';
  var INITIAL_LIMIT=100;
  var PAGE_LIMIT=60;
  var MAX_ROWS=500;
  var rows=[];
  var suggestions=[];
  var unreadTotal=0;
  var currentUserId='';
  var channel=null;
  var refreshPromise=null;
  var loadMorePromise=null;
  var hasMore=true;
  var retryTimer=0;
  var authBound=false;
  var minuteTimer=0;
  var generation=0;
  var SETTINGS_TABLE='happyad_user_settings';
  var SETTINGS_CACHE_PREFIX='HAPPYAD_USER_SETTINGS_V1_';
  var notificationPreferences={};
  var notificationPreferencesUpdatedAt='';
  var notificationPreferencesReady=false;
  var suggestionsUpdatedAt=0;
  var lastRefreshCompletedAt=0;
  var SUGGESTIONS_TTL=300000;

  function clean(value){return String(value==null?'':value).trim();}
  function avatarMaster(){return window.HappyProfileAvatarMasterV855R32||window.HappyProfileAvatarMaster||null;}
  function canonicalAvatar(uid,fallback){var m=avatarMaster(),id=clean(uid);if(m&&id){var e=m.getEntry&&m.getEntry(id);if(e&&e.known)return clean(e.url);if(m.resolve)m.resolve(id).catch(function(){});return '';}return clean(fallback);}
  function normalizeProfileBadge(value){
    var raw=clean(value);
    var low=raw.toLowerCase();
    if(!raw||['aucun','none','false','0','1','true','null','undefined','no','non'].indexOf(low)>=0)return '';
    return raw;
  }
  function isUuid(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value));}
  function finite(value){var n=Number(value);return Number.isFinite(n)?n:0;}
  function clone(value){try{return JSON.parse(JSON.stringify(value));}catch(_e){return value;}}
  function notificationDefaults(){return {
    privateMessages:true,messageRequests:true,audioCalls:true,videoCalls:true,conversationReplies:true,
    likes:true,comments:true,commentReplies:true,shares:true,mentions:true,tags:true,newFollowers:true,
    followedPosts:false,followedStories:false,ownPostActivity:true,profileVisits:false,recommendedPosts:false,
    marketplaceMessages:true,orders:true,listingStatus:true,expiredListing:true,savedSearchResults:false,priceAvailability:true,
    securityLogin:true,securityCredentials:true,securityRecovery:true,verificationDecisions:true,importantHappyad:true,
    inApp:true,push:true,gmailDelivery:false,criticalSms:false,quietMode:false,importantDuringQuiet:true,securityDuringQuiet:true,
    quietStart:'22:00',quietEnd:'07:00',quietTimeZone:''
  };}
  function normalizeNotificationPreferences(value){
    var out=notificationDefaults();
    value=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    Object.keys(out).forEach(function(key){
      if(!Object.prototype.hasOwnProperty.call(value,key))return;
      if(key==='quietStart'||key==='quietEnd'){
        var time=clean(value[key]);if(/^([01]\d|2[0-3]):[0-5]\d$/.test(time))out[key]=time;
      }else if(key==='quietTimeZone'){
        var zone=clean(value[key]);if(zone&&validTimeZone(zone))out[key]=zone;
      }else out[key]=value[key]===true;
    });
    out.securityLogin=true;out.securityCredentials=true;out.securityRecovery=true;out.securityDuringQuiet=true;
    if(!out.quietTimeZone)out.quietTimeZone=detectedTimeZone();
    return out;
  }
  function detectedTimeZone(){
    try{return clean(Intl.DateTimeFormat().resolvedOptions().timeZone)||'UTC';}catch(_e){return 'UTC';}
  }
  function validTimeZone(zone){
    zone=clean(zone);if(!zone)return false;
    try{Intl.DateTimeFormat('en-US',{timeZone:zone}).format(new Date());return true;}catch(_e){return false;}
  }
  function timeMinutes(value){
    var match=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(clean(value));
    return match?(Number(match[1])*60+Number(match[2])):-1;
  }
  function zonedMinutes(at,zone){
    var date=at instanceof Date?at:new Date(at||Date.now());
    if(!Number.isFinite(date.getTime()))date=new Date();
    zone=validTimeZone(zone)?zone:detectedTimeZone();
    try{
      var parts=Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
      var hour=0,minute=0;
      parts.forEach(function(part){if(part.type==='hour')hour=Number(part.value)||0;if(part.type==='minute')minute=Number(part.value)||0;});
      return hour*60+minute;
    }catch(_e){return date.getHours()*60+date.getMinutes();}
  }
  function quietState(at){
    var start=timeMinutes(notificationPreferences.quietStart),end=timeMinutes(notificationPreferences.quietEnd);
    var nowMinutes=zonedMinutes(at,notificationPreferences.quietTimeZone);
    var enabled=notificationPreferences.quietMode===true;
    var active=false;
    if(enabled&&start>=0&&end>=0){
      if(start===end)active=true;
      else if(start<end)active=nowMinutes>=start&&nowMinutes<end;
      else active=nowMinutes>=start||nowMinutes<end;
    }
    return {enabled:enabled,active:active,start:notificationPreferences.quietStart,end:notificationPreferences.quietEnd,timeZone:notificationPreferences.quietTimeZone||detectedTimeZone(),minute:nowMinutes};
  }
  function isImportantDuringQuiet(row){
    row=row&&typeof row==='object'?row:{};var meta=metadata(row);
    var priority=clean(meta.priority||meta.notification_priority||row.priority).toLowerCase();
    var type=clean(row.notification_type||row.type).toLowerCase();
    return meta.important===true||meta.important_message===true||meta.urgent===true||meta.critical===true||
      priority==='high'||priority==='urgent'||priority==='critical'||type==='important_message'||type==='urgent_message';
  }
  function quietAllows(row,channel){
    channel=clean(channel||'inApp');
    if(channel==='inApp'||channel==='category')return true;
    var state=quietState();if(!state.active)return true;
    if(isSecurityNotification(row))return true;
    return notificationPreferences.importantDuringQuiet===true&&isImportantDuringQuiet(row);
  }
  function syncQuietPreferencesToServiceWorker(){
    if(!('serviceWorker' in navigator))return;
    var payload={
      type:'HAPPYAD_NOTIFICATION_QUIET_PREFERENCES_V855R57',
      preferences:{
        push:notificationPreferences.push!==false,
        privateMessages:notificationPreferences.privateMessages!==false,
        messageRequests:notificationPreferences.messageRequests!==false,
        audioCalls:notificationPreferences.audioCalls!==false,
        videoCalls:notificationPreferences.videoCalls!==false,
        conversationReplies:notificationPreferences.conversationReplies!==false,
        likes:notificationPreferences.likes!==false,
        comments:notificationPreferences.comments!==false,
        commentReplies:notificationPreferences.commentReplies!==false,
        shares:notificationPreferences.shares!==false,
        mentions:notificationPreferences.mentions!==false,
        tags:notificationPreferences.tags!==false,
        newFollowers:notificationPreferences.newFollowers!==false,
        followedPosts:notificationPreferences.followedPosts!==false,
        followedStories:notificationPreferences.followedStories!==false,
        ownPostActivity:notificationPreferences.ownPostActivity!==false,
        profileVisits:notificationPreferences.profileVisits!==false,
        recommendedPosts:notificationPreferences.recommendedPosts!==false,
        marketplaceMessages:notificationPreferences.marketplaceMessages!==false,
        orders:notificationPreferences.orders!==false,
        listingStatus:notificationPreferences.listingStatus!==false,
        expiredListing:notificationPreferences.expiredListing!==false,
        savedSearchResults:notificationPreferences.savedSearchResults!==false,
        priceAvailability:notificationPreferences.priceAvailability!==false,
        verificationDecisions:notificationPreferences.verificationDecisions!==false,
        importantHappyad:notificationPreferences.importantHappyad!==false,
        quietMode:notificationPreferences.quietMode===true,
        importantDuringQuiet:notificationPreferences.importantDuringQuiet===true,
        securityDuringQuiet:true,
        quietStart:notificationPreferences.quietStart,
        quietEnd:notificationPreferences.quietEnd,
        quietTimeZone:notificationPreferences.quietTimeZone||detectedTimeZone(),
        updatedAt:Date.now()
      }
    };
    try{
      if(navigator.serviceWorker.controller)navigator.serviceWorker.controller.postMessage(payload);
      navigator.serviceWorker.ready.then(function(reg){
        var worker=reg&&(reg.active||reg.waiting||reg.installing);if(worker)worker.postMessage(payload);
      }).catch(function(){});
    }catch(_e){}
  }
  notificationPreferences=notificationDefaults();
  function explicitPreferenceKey(row){
    var meta=metadata(row),key=clean(meta.notification_preference_key||meta.notificationPreferenceKey);
    return Object.prototype.hasOwnProperty.call(notificationDefaults(),key)?key:'';
  }
  function notificationPreferenceKey(row){
    row=row&&typeof row==='object'?row:{};
    var explicit=explicitPreferenceKey(row);if(explicit)return explicit;
    var type=clean(row.notification_type||row.type||row.action||row.category).toLowerCase();
    var meta=metadata(row);
    if(meta.security_alert===true||meta.security===true||meta.critical_security===true||/^security(?:_|$)/.test(type))return 'securityLogin';
    if(meta.seller_verification_request_id||meta.verification_request_id||type==='verification'||type==='verification_decision'||type==='seller_verification')return 'verificationDecisions';
    if(meta.marketplace_status||type==='listing_status'||type==='marketplace_status'||type==='listing_published')return 'listingStatus';
    if(type==='like'||type==='story_like'||type==='like_story')return 'likes';
    if(type==='comment')return 'comments';
    if(type==='reply'||type==='comment_reply')return 'commentReplies';
    if(type==='share'||type==='repost')return 'shares';
    if(type==='mention'||type==='story_mention'||type==='mention_story')return 'mentions';
    if(type==='tag'||type==='tagged'||type==='identification')return 'tags';
    if(type==='follow'||type==='follower'||type==='new_follower')return 'newFollowers';
    if(type==='message'||type==='private_message'||type==='dm'||type==='direct_message'||type==='chat_message')return 'privateMessages';
    if(type==='message_request'||type==='chat_request')return 'messageRequests';
    if(type==='audio_call'||type==='call_audio')return 'audioCalls';
    if(type==='video_call'||type==='call_video')return 'videoCalls';
    if(type==='conversation_reply'||type==='message_reply')return 'conversationReplies';
    if(type==='followed_post'||type==='new_followed_post')return 'followedPosts';
    if(type==='followed_story'||type==='new_followed_story')return 'followedStories';
    if(type==='post_activity'||type==='own_post_activity')return 'ownPostActivity';
    if(type==='profile_visit'||type==='important_profile_visit')return 'profileVisits';
    if(type==='recommended_post'||type==='post_recommendation')return 'recommendedPosts';
    if(type==='marketplace_message'||type==='listing_message')return 'marketplaceMessages';
    if(type==='order'||type==='order_update'||type==='order_status')return 'orders';
    if(type==='listing_expired'||type==='expired_listing')return 'expiredListing';
    if(type==='saved_search_result'||type==='saved_search_results')return 'savedSearchResults';
    if(type==='price_change'||type==='availability_change'||type==='price_availability')return 'priceAvailability';
    if(type==='system'||type==='announcement'||type==='important'||type==='happyad_info')return 'importantHappyad';
    return '';
  }
  function isSecurityNotification(row){
    row=row&&typeof row==='object'?row:{};var meta=metadata(row),type=clean(row.notification_type||row.type).toLowerCase();
    return meta.security_alert===true||meta.security===true||meta.critical_security===true||/^security(?:_|$)/.test(type);
  }
  function categoryAllowed(row){
    if(isSecurityNotification(row))return true;
    var key=notificationPreferenceKey(row);if(!key)return true;
    return notificationPreferences[key]!==false;
  }
  function notificationAllowed(row,channel){
    if(!categoryAllowed(row))return false;
    channel=clean(channel||'inApp');
    if(channel==='category')return true;
    if(channel==='inApp')return notificationPreferences.inApp!==false;
    if(channel==='push')return notificationPreferences.push!==false&&quietAllows(row,'push');
    if(channel==='gmail')return notificationPreferences.gmailDelivery===true&&quietAllows(row,'gmail');
    if(channel==='sms')return notificationPreferences.criticalSms===true&&quietAllows(row,'sms');
    return true;
  }
  function applyPreferences(value,updatedAt){
    notificationPreferences=normalizeNotificationPreferences(value);
    notificationPreferencesUpdatedAt=clean(updatedAt);
    notificationPreferencesReady=true;
    syncQuietPreferencesToServiceWorker();
    return notificationPreferences;
  }
  function loadCachedNotificationPreferences(uid){
    if(!isUuid(uid))return notificationPreferences;
    try{
      var cached=JSON.parse(localStorage.getItem(SETTINGS_CACHE_PREFIX+uid)||'null');
      if(cached&&cached.uid===uid&&cached.data&&cached.data.notifications)applyPreferences(cached.data.notifications,cached.updatedAt||'');
    }catch(_e){}
    return notificationPreferences;
  }
  async function fetchNotificationPreferences(c,uid){
    uid=clean(uid);loadCachedNotificationPreferences(uid);
    if(!c||typeof c.from!=='function'||!isUuid(uid))return notificationPreferences;
    try{
      var result=await c.from(SETTINGS_TABLE).select('notifications,updated_at').eq('user_id',uid).maybeSingle();
      if(result&&result.error&&clean(result.error.code)!=='PGRST116')throw result.error;
      if(result&&result.data)applyPreferences(result.data.notifications,result.data.updated_at);
      else if(!notificationPreferencesReady)applyPreferences({},'');
    }catch(_e){if(!notificationPreferencesReady)applyPreferences({},'');}
    return notificationPreferences;
  }
  function escapeHtml(value){
    return String(value==null?'':value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  function client(){
    try{
      if(typeof window.happyadSb==='function')return window.happyadSb();
      if(window.happyadSupabase)return window.happyadSupabase;
      if(window.supabaseClient)return window.supabaseClient;
      if(window.HappySupabaseClientMasterV972&&typeof window.HappySupabaseClientMasterV972.get==='function')return window.HappySupabaseClientMasterV972.get();
    }catch(_e){}
    return null;
  }
  function frame(){return document.getElementById('happyadNotificationCenterFrame');}
  function cacheKey(uid){return CACHE_PREFIX+clean(uid).toLowerCase();}
  function readCache(uid){
    if(!isUuid(uid))return null;
    try{
      var parsed=JSON.parse(localStorage.getItem(cacheKey(uid))||'null');
      if(!parsed||parsed.user_id!==uid||!Array.isArray(parsed.rows))return null;
      return parsed;
    }catch(_e){return null;}
  }
  function connectionWork(key,fn,options){
    try{
      var coordinator=window.HappyadConnectionWorkCoordinatorV869;
      if(coordinator&&typeof coordinator.schedule==='function')return coordinator.schedule('notification-'+clean(key),fn,Object.assign({surface:'any',delay:80,maxDelay:1200},options||{}));
    }catch(_e){}
    setTimeout(fn,Math.max(0,finite(options&&options.delay)||0));return true;
  }
  function writeCacheNow(){
    if(!isUuid(currentUserId))return;
    try{
      localStorage.setItem(cacheKey(currentUserId),JSON.stringify({
        version:VERSION,
        user_id:currentUserId,
        rows:rows.slice(0,MAX_ROWS),
        unread_total:unreadTotal,
        has_more:hasMore===true,
        saved_at:Date.now()
      }));
    }catch(_e){}
  }
  function writeCache(){return connectionWork('cache',writeCacheNow,{delay:180,maxDelay:2600,minGap:1200});}
  function clearLocalState(){
    rows=[];
    suggestions=[];
    unreadTotal=0;
    hasMore=true;
    notificationPreferences=notificationDefaults();
    notificationPreferencesUpdatedAt='';
    notificationPreferencesReady=false;
    suggestionsUpdatedAt=0;
    renderBadge(0);
    publish();
  }
  function actorSnapshot(row){
    var value=row&&row.actor_snapshot;
    if(value&&typeof value==='object'&&!Array.isArray(value))return value;
    if(typeof value==='string'){
      try{var parsed=JSON.parse(value);if(parsed&&typeof parsed==='object')return parsed;}catch(_e){}
    }
    return {};
  }
  function metadata(row){
    var value=row&&row.metadata;
    if(value&&typeof value==='object'&&!Array.isArray(value))return value;
    if(typeof value==='string'){
      try{var parsed=JSON.parse(value);if(parsed&&typeof parsed==='object')return parsed;}catch(_e){}
    }
    return {};
  }
  function normalizeSystemMessage(value){
    var text=clean(value);
    if(!text)return '';
    return text
      .replace(/\s+par\s+l[’']équipe\s+Fyblic(?=[.!,;:?]|$)/gi,'')
      .replace(/\s+par\s+les\s+équipes?\s+Fyblic(?=[.!,;:?]|$)/gi,'')
      .replace(/\s+par\s+Fyblic(?=[.!,;:?]|$)/gi,'')
      .replace(/\s+([.!,;:?])/g,'$1')
      .replace(/\s{2,}/g,' ')
      .trim();
  }
  function relativeTime(value){
    var stamp=Date.parse(value||'');
    if(!Number.isFinite(stamp))return '';
    var diff=Math.max(0,Date.now()-stamp);
    var sec=Math.floor(diff/1000);
    if(sec<45)return 'À l’instant';
    var min=Math.floor(sec/60);
    if(min<60)return 'Il y a '+min+' min';
    var hour=Math.floor(min/60);
    if(hour<24)return 'Il y a '+hour+' h';
    var day=Math.floor(hour/24);
    if(day===1)return 'Hier';
    if(day<7)return 'Il y a '+day+' jours';
    try{return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:day>330?'numeric':undefined}).format(new Date(stamp));}
    catch(_e){return new Date(stamp).toLocaleDateString('fr-FR');}
  }
  function mapRow(row){
    row=row&&typeof row==='object'?row:{};
    var snap=actorSnapshot(row);
    var meta=metadata(row);
    var actorId=clean(row.actor_id||snap.id);
    var name=clean(snap.full_name||snap.display_name||snap.name||snap.username)||'Un utilisateur';
    var username=clean(snap.username||snap.handle).replace(/^@+/, '');
    var avatar=canonicalAvatar(actorId,snap.avatar_url||snap.avatar||snap.photo_url);
    var badge=normalizeProfileBadge(snap.badge||snap.badge_url||snap.verified_badge);
    var type=clean(row.notification_type).toLowerCase()||'activity';
    var entityType=clean(row.entity_type).toLowerCase();
    var contentType=clean(meta.content_type||meta.media_type||meta.post_type||(entityType==='story'?'story':'')).toLowerCase()||'post';
    var isStoryLike=type==='story_like'||type==='like_story'||(type==='like'&&(entityType==='story'||contentType==='story'));
    var storyId=clean(meta.story_id||meta.storyId||(entityType==='story'?row.entity_id:'')||(contentType==='story'?row.post_id:''));
    var isStoryMention=(type==='mention'||type==='story_mention'||type==='mention_story')&&!!storyId;
    var mentionPostId=(!isStoryMention&&(type==='mention'||type==='post_mention'||type==='mention_post'))?clean(row.post_id||meta.post_id||meta.postId||(entityType==='post'?row.entity_id:'')):'';
    var isPostMention=!!mentionPostId;
    var isPublicationType=!isStoryLike&&(type==='like'||type==='comment'||type==='reply'||type==='favorite'||type==='share'||type==='repost'||isPostMention);
    var postId=isPublicationType?clean(row.post_id||mentionPostId||(entityType==='post'?row.entity_id:'')):'';
    var isStoryRepostReturn=(type==='story_repost_return'||meta.story_repost_return===true)&&!!storyId;
    var category=isStoryLike?'like':(type==='reply'?'comment':((type==='share'||type==='repost'||isStoryMention||isPostMention||isStoryRepostReturn)?'activity':type));
    var commentId=clean(row.comment_id||meta.comment_id||(entityType==='comment'?row.entity_id:''));
    var parentCommentId=clean(meta.parent_id||meta.parent_comment_id);
    var shareChannel=clean(meta.channel||meta.share_channel||meta.shareChannel||meta.destination||meta.share_destination||row.share_channel||row.shareChannel||row.channel).toLowerCase();
    var shareContext=clean(meta.share_context||meta.shareContext||meta.destination_type||meta.destinationType||meta.action_source).toLowerCase();
    var addedPublicationToStory=(type==='share'||type==='repost')&&(
      shareChannel==='happyad-story'||shareChannel==='story'||shareChannel==='my-story'||shareChannel==='ma-story'||
      shareContext==='story'||shareContext==='happyad-story'||shareContext==='add-to-story'||
      meta.added_to_story===true||meta.addedToStory===true||meta.to_story===true||meta.toStory===true||meta.story_share===true
    );
    var bodyHtml='';
    if(isStoryLike)bodyHtml='<strong>'+escapeHtml(name)+'</strong> a aimé votre story.';
    else if(isStoryMention)bodyHtml='<strong>'+escapeHtml(name)+'</strong> vous a mentionné dans sa story.';
    else if(isPostMention)bodyHtml='<strong>'+escapeHtml(name)+'</strong> vous a mentionné dans sa publication.';
    else if(isStoryRepostReturn)bodyHtml='<strong>'+escapeHtml(name)+'</strong> a ajouté votre story à sa story.';
    else if(type==='like')bodyHtml='<strong>'+escapeHtml(name)+'</strong> a aimé votre publication.';
    else if(type==='comment')bodyHtml='<strong>'+escapeHtml(name)+'</strong> a commenté votre publication.';
    else if(type==='reply')bodyHtml='<strong>'+escapeHtml(name)+'</strong> a répondu à votre commentaire.';
    else if(type==='follow')bodyHtml='<strong>'+escapeHtml(name)+'</strong> s’est abonné à votre profil.';
    else if(type==='favorite')bodyHtml='<strong>'+escapeHtml(name)+'</strong> a ajouté votre publication aux favoris.';
    else if(addedPublicationToStory)bodyHtml='<strong>'+escapeHtml(name)+'</strong> a ajouté votre publication à sa story.';
    else if(type==='repost')bodyHtml='<strong>'+escapeHtml(name)+'</strong> a republié votre publication.';
    else if(type==='share'){var shareUnits=Math.max(1,finite(meta.share_units||1));bodyHtml='<strong>'+escapeHtml(name)+'</strong> a partagé votre publication'+(shareUnits>1?' '+shareUnits+' fois.':'.');}
    else {
      var fallbackBody=row.body||row.title||'Nouvelle activité Fyblic';
      bodyHtml=escapeHtml(type==='system'?normalizeSystemMessage(fallbackBody):fallbackBody);
    }

    return {
      id:clean(row.id),
      notification_id:clean(row.id),
      category:category,
      notification_type:type,
      action:isStoryLike?'story_like':type,
      profileId:actorId,
      actor_id:actorId,
      profileName:name,
      actor_name:name,
      username:username,
      handle:username?('@'+username):'',
      avatar:avatar,
      avatar_url:avatar,
      profileBadge:badge,
      profile_badge:badge,
      user_badge:badge,
      profileBadgeValue:badge,
      verified:!!badge,
      publicationId:postId,
      post_id:postId,
      publicationType:contentType,
      media_type:contentType,
      publicationAction:isStoryLike?'story_like':type,
      storyId:storyId,
      story_id:storyId,
      storyOwnerId:clean(meta.owner_id||meta.user_id||meta.creator_id),
      story_owner_id:clean(meta.owner_id||meta.user_id||meta.creator_id),
      commentId:commentId,
      comment_id:commentId,
      parentCommentId:parentCommentId,
      parent_comment_id:parentCommentId,
      thumb:clean(row.preview_url),
      preview_url:clean(row.preview_url),
      html:bodyHtml,
      title:clean(row.title),
      body:type==='system'?normalizeSystemMessage(row.body):clean(row.body),
      time:relativeTime(row.created_at),
      created_at:row.created_at,
      unread:row.is_read!==true,
      is_read:row.is_read===true,
      badge:(type==='like'||isStoryLike)?'heart':undefined,
      badgeColor:(type==='like'||isStoryLike)?'pink':undefined,
      canAddMentionedStory:isStoryMention&&(meta.can_add_to_story!==false),
      can_add_mentioned_story:isStoryMention&&(meta.can_add_to_story!==false),
      canAddStoryRepostReturn:isStoryRepostReturn&&(meta.can_add_repost_to_story!==false),
      can_add_story_repost_return:isStoryRepostReturn&&(meta.can_add_repost_to_story!==false),
      metadata:meta
    };
  }
  function mappedRows(){
    return rows.slice().sort(function(a,b){
      var at=Date.parse(a&&a.created_at||'')||0;
      var bt=Date.parse(b&&b.created_at||'')||0;
      return bt-at;
    }).map(mapRow);
  }
  function renderBadge(total){
    total=Math.max(0,finite(total));
    unreadTotal=total;
    var badge=document.getElementById('homeNotificationBadge');
    var button=document.getElementById('homeNotificationBtn');
    if(badge){
      if(total>0){
        badge.textContent=total>99?'99+':String(total);
        badge.hidden=false;
        badge.style.display='grid';
      }else{
        badge.textContent='';
        badge.hidden=true;
        badge.style.display='none';
      }
    }
    if(button){
      button.setAttribute('aria-label',total>0?('Notifications, '+total+' non lue'+(total>1?'s':'')):'Notifications');
      button.setAttribute('data-happyad-unread-total',String(total));
    }
    return total;
  }
  function send(type,payload){
    try{
      var fr=frame();
      if(fr&&fr.contentWindow)fr.contentWindow.postMessage({type:type,payload:payload||{}},'*');
    }catch(_e){}
  }
  function centerVisibleV869(){try{var fr=frame(),host=document.getElementById('happyadNotificationReturnCenter');if(host)return !!(fr&&host.classList.contains('on')&&host.getAttribute('aria-hidden')!=='true'&&!host.hasAttribute('inert'));return !!(fr&&fr.classList.contains('on')&&fr.getAttribute('aria-hidden')!=='true'&&!fr.hasAttribute('inert'));}catch(_e){return false;}}
  function publishNow(){
    if(!centerVisibleV869())return {deferred:true,unreadTotal:unreadTotal,loadedCount:rows.length,hasMore:hasMore===true};
    var payload={
      notifications:mappedRows(),
      suggestions:suggestions.slice(),
      unreadTotal:unreadTotal,
      userId:currentUserId,
      source:'happyad-notification-master',
      version:VERSION,
      updatedAt:Date.now(),
      hasMore:hasMore===true,
      loadedCount:rows.length
    };
    send('HAPPYAD_NOTIFICATIONS_SET_DATA',payload);
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_NOTIFICATIONS_DATA',{detail:clone(payload)}));}catch(_e){}
    return payload;
  }
  function publish(){return connectionWork('publish',publishNow,{delay:80,maxDelay:1200,minGap:120});}
  function normalizeRows(nextRows){
    var seen=Object.create(null);
    return (Array.isArray(nextRows)?nextRows:[]).filter(function(row){
      var id=clean(row&&row.id);
      if(!id||seen[id])return false;
      if(currentUserId&&clean(row.recipient_id)&&clean(row.recipient_id)!==currentUserId)return false;
      if(!notificationAllowed(row,'inApp'))return false;
      seen[id]=true;
      return true;
    }).sort(function(a,b){
      return (Date.parse(b&&b.created_at||'')||0)-(Date.parse(a&&a.created_at||'')||0);
    }).slice(0,MAX_ROWS);
  }
  function applyRows(nextRows,nextUnread,options){
    options=options||{};
    var incoming=Array.isArray(nextRows)?nextRows:[];
    rows=normalizeRows(options.append===true?rows.concat(incoming):incoming);
    if(typeof options.hasMore==='boolean')hasMore=options.hasMore;
    var computed=unreadFromRows(rows);
    var resolved=nextUnread==null?computed:Math.max(computed,Math.max(0,finite(nextUnread)));
    renderBadge(resolved);
    writeCache();
    publish();
  }
  async function sessionUser(c){
    if(!c||!c.auth)return null;
    try{
      var result=await c.auth.getSession();
      return result&&result.data&&result.data.session&&result.data.session.user||null;
    }catch(_e){return null;}
  }
  async function fetchRows(c,before,limit){
    var result=null;
    limit=Math.max(1,Math.min(MAX_ROWS,finite(limit)||INITIAL_LIMIT));
    before=clean(before)||null;
    if(c&&typeof c.rpc==='function'){
      result=await c.rpc('happyad_notifications_list',{
        p_limit:limit,
        p_before:before,
        p_type:null,
        p_unread_only:false
      });
      if(result&&!result.error&&Array.isArray(result.data))return result.data;
    }
    if(!c||typeof c.from!=='function')throw (result&&result.error)||new Error('Client Supabase indisponible');
    var query=c.from(TABLE)
      .select('*')
      .eq('recipient_id',currentUserId)
      .order('created_at',{ascending:false})
      .limit(limit);
    if(before)query=query.lt('created_at',before);
    result=await query;
    if(result&&result.error)throw result.error;
    return Array.isArray(result&&result.data)?result.data:[];
  }
  function oldestCursor(){
    var oldest='';
    var oldestStamp=Infinity;
    rows.forEach(function(row){
      var value=clean(row&&row.created_at);
      var stamp=Date.parse(value||'');
      if(value&&Number.isFinite(stamp)&&stamp<oldestStamp){oldest=value;oldestStamp=stamp;}
    });
    return oldest;
  }
  function unreadFromRows(list){
    return (list||[]).reduce(function(total,row){return total+(row&&row.is_read===true?0:1);},0);
  }
  function rpcCountValue(data){
    if(typeof data==='number'||typeof data==='string')return Math.max(0,finite(data));
    if(Array.isArray(data)&&data.length){
      var first=data[0];
      if(typeof first==='number'||typeof first==='string')return Math.max(0,finite(first));
      if(first&&typeof first==='object'){
        var keys=Object.keys(first);
        if(keys.length)return Math.max(0,finite(first[keys[0]]));
      }
    }
    return null;
  }
  async function fetchUnread(c,fallbackRows){
    var visibleFallback=normalizeRows(fallbackRows);
    var localCount=unreadFromRows(visibleFallback);
    if(notificationPreferences.inApp===false)return 0;

    /* V855R56 : le RPC compte uniquement les catégories autorisées. */
    try{
      var preferred=await c.rpc('happyad_notifications_unread_count_v855r56',{});
      if(preferred&&preferred.error)throw preferred.error;
      var preferredCount=rpcCountValue(preferred&&preferred.data);
      if(preferredCount!=null)return Math.max(localCount,preferredCount);
    }catch(_preferredError){}

    /* Secours client : filtrer les lignes non lues par les mêmes préférences. */
    try{
      var direct=await c.from(TABLE)
        .select('id,recipient_id,notification_type,metadata,is_read,created_at')
        .eq('recipient_id',currentUserId)
        .eq('is_read',false)
        .order('created_at',{ascending:false})
        .limit(1000);
      if(direct&&direct.error)throw direct.error;
      if(direct&&Array.isArray(direct.data))return Math.max(localCount,unreadFromRows(normalizeRows(direct.data)));
    }catch(_directError){}
    return localCount;
  }
  function profileSuggestion(row){
    row=row&&typeof row==='object'?row:{};
    var id=clean(row.id||row.user_id);
    if(!isUuid(id))return null;
    var name=clean(row.full_name||row.display_name||row.name||row.username||row.handle)||'Utilisateur Fyblic';
    var avatar=canonicalAvatar(id,row.avatar_url||row.avatar||row.photo_url||row.photo||'');
    var username=clean(row.username||row.handle).replace(/^@+/, '');
    return {
      id:id,
      profileId:id,
      profile_id:id,
      name:name,
      full_name:name,
      username:username,
      handle:username?('@'+username):'',
      avatar:avatar,
      avatar_url:avatar,
      badge:normalizeProfileBadge(row.badge||row.verification_badge||row.verified_badge||''),
      source:'account-recommendations-v855r54'
    };
  }
  async function fetchSuggestions(c){
    if(!c||typeof c.rpc!=='function'||!currentUserId)return [];
    var result=await c.rpc('happyad_account_recommendations_v855r54',{p_limit:12});
    if(result&&result.error){result=await c.rpc('happyad_account_recommendations_v855r53',{p_limit:12});}
    if(result&&result.error)throw result.error;
    var ids=(Array.isArray(result&&result.data)?result.data:[]).map(function(row){return clean(row&&row.target_user_id);}).filter(isUuid).filter(function(id){return id!==currentUserId;});
    if(!ids.length)return [];
    try{
      var follows=await c.from('happyad_follows').select('creator_id').eq('follower_id',currentUserId).in('creator_id',ids);
      if(follows&&!follows.error){
        var followed=Object.create(null);(follows.data||[]).forEach(function(row){followed[clean(row&&row.creator_id)]=1;});
        ids=ids.filter(function(id){return !followed[id];});
      }
    }catch(_followError){}
    if(!ids.length)return [];
    var profiles=await c.from('happyad_profiles_public_v1').select('*').in('id',ids);
    if(profiles&&profiles.error)throw profiles.error;
    var map=Object.create(null);
    (profiles&&Array.isArray(profiles.data)?profiles.data:[]).forEach(function(row){var id=clean(row&&row.id);if(isUuid(id))map[id]=row;});
    return ids.map(function(id){return profileSuggestion(map[id]);}).filter(Boolean);
  }
  function scheduleRefresh(delay,reason){
    clearTimeout(retryTimer);
    retryTimer=0;
    reason=clean(reason||'scheduled');
    var minGap=reason==='realtime-reconcile'?4500:(reason==='silent-poll'?30000:900);
    return connectionWork('refresh',function(){return refresh({reason:reason}).catch(function(){});},{delay:Math.max(0,finite(delay)),maxDelay:reason==='realtime-reconcile'?7000:2500,minGap:minGap});
  }
  async function refresh(options){
    options=options||{};
    if(refreshPromise&&!options.force)return refreshPromise;
    var myGeneration=++generation;
    refreshPromise=(async function(){
      var c=client();
      if(!c)throw new Error('Supabase non disponible');
      var user=await sessionUser(c);
      var uid=clean(user&&user.id);
      if(!isUuid(uid)){
        currentUserId='';
        await stopRealtime();
        clearLocalState();
        return [];
      }
      if(uid!==currentUserId){
        currentUserId=uid;
        notificationPreferences=notificationDefaults();
        notificationPreferencesUpdatedAt='';
        notificationPreferencesReady=false;
        loadCachedNotificationPreferences(uid);
        var cached=readCache(uid);
        if(cached){hasMore=cached.has_more!==false;applyRows(cached.rows,cached.unread_total,{hasMore:hasMore});}
        else clearLocalState();
        await startRealtime(uid);
      }
      await fetchNotificationPreferences(c,uid);
      var next=await fetchRows(c,null,INITIAL_LIMIT);
      var refreshSuggestions=!suggestionsUpdatedAt||Date.now()-suggestionsUpdatedAt>SUGGESTIONS_TTL||options.force===true||/boot|center-open|request-data|preferences|settings/.test(clean(options.reason));
      if(refreshSuggestions){try{suggestions=await fetchSuggestions(c);suggestionsUpdatedAt=Date.now();}catch(_suggestionsError){suggestions=suggestions||[];}}
      var preserveOlder=rows.length>INITIAL_LIMIT;
      var firstPageHasMore=next.length>=INITIAL_LIMIT;
      if(!preserveOlder)hasMore=firstPageHasMore;
      var count=await fetchUnread(c,next);
      if(myGeneration!==generation&&options.force!==true)return rows;
      applyRows(next,count,{append:preserveOlder,hasMore:hasMore});
      lastRefreshCompletedAt=Date.now();
      return next;
    })().catch(function(error){
      scheduleRefresh(1800,'retry');
      try{console.warn('[Fyblic Notifications] refresh',error&&error.message||error);}catch(_e){}
      return rows;
    }).finally(function(){refreshPromise=null;});
    return refreshPromise;
  }
  async function loadMore(){
    if(loadMorePromise)return loadMorePromise;
    if(!hasMore||!currentUserId||rows.length>=MAX_ROWS){hasMore=false;publish();return rows;}
    loadMorePromise=(async function(){
      var c=client();
      if(!c)throw new Error('Supabase non disponible');
      var before=oldestCursor();
      if(!before){hasMore=false;publish();return rows;}
      var next=await fetchRows(c,before,PAGE_LIMIT);
      hasMore=next.length>=PAGE_LIMIT&&rows.length+next.length<MAX_ROWS;
      applyRows(next,unreadTotal,{append:true,hasMore:hasMore});
      return rows;
    })().catch(function(error){
      try{console.warn('[Fyblic Notifications] pagination',error&&error.message||error);}catch(_e){}
      publish();
      return rows;
    }).finally(function(){loadMorePromise=null;});
    return loadMorePromise;
  }
  async function stopRealtime(){
    var c=client();
    var old=channel;
    channel=null;
    if(old&&c&&typeof c.removeChannel==='function'){
      try{await c.removeChannel(old);}catch(_e){}
    }
  }
  async function startRealtime(uid){
    uid=clean(uid);
    if(!isUuid(uid))return stopRealtime();
    if(channel&&channel.__happyadUid===uid)return channel;
    await stopRealtime();
    var c=client();
    if(!c||typeof c.channel!=='function')return null;
    var name='happyad-notifications-'+uid+'-'+Date.now();
    var ch=c.channel(name);
    ch.__happyadUid=uid;
    ch.on('postgres_changes',{
      event:'*',
      schema:'public',
      table:TABLE,
      filter:'recipient_id=eq.'+uid
    },function(payload){
      if(uid!==currentUserId)return;
      try{
        var eventType=clean(payload&&payload.eventType).toUpperCase();
        var next=payload&&payload.new;
        var old=payload&&payload.old;
        if(eventType==='INSERT'&&next&&clean(next.id)){
          if(!notificationAllowed(next,'inApp')){scheduleRefresh(5000,'realtime-reconcile');return;}
          rows=[next].concat(rows.filter(function(row){return clean(row.id)!==clean(next.id);})).slice(0,MAX_ROWS);
          if(next.is_read!==true)renderBadge(unreadTotal+1);
          writeCache();publish();
        }else if(eventType==='UPDATE'&&next&&clean(next.id)){
          var found=false;
          rows=rows.map(function(row){if(clean(row.id)===clean(next.id)){found=true;return next;}return row;});
          if(!found)rows.unshift(next);
          var localCount=rows.reduce(function(total,row){return total+(row.is_read===true?0:1);},0);
          renderBadge(localCount);writeCache();publish();
        }else if(eventType==='DELETE'&&old&&clean(old.id)){
          rows=rows.filter(function(row){return clean(row.id)!==clean(old.id);});
          var remaining=rows.reduce(function(total,row){return total+(row.is_read===true?0:1);},0);
          renderBadge(remaining);writeCache();publish();
        }
      }catch(_e){}
      scheduleRefresh(5000,'realtime-reconcile');
    });
    channel=ch;
    try{
      ch.subscribe(function(status){
        status=clean(status).toUpperCase();
        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED')scheduleRefresh(1800);
      });
    }catch(_e){scheduleRefresh(1800);}
    return ch;
  }
  function optimisticRead(id){
    id=clean(id);
    if(!id)return false;
    var changed=false;
    rows=rows.map(function(row){
      if(clean(row.id)!==id||row.is_read===true)return row;
      changed=true;
      var copy=Object.assign({},row,{is_read:true,read_at:row.read_at||new Date().toISOString(),updated_at:new Date().toISOString()});
      return copy;
    });
    if(changed){renderBadge(Math.max(0,unreadTotal-1));writeCache();publish();}
    return changed;
  }
  async function markRead(id){
    id=clean(id);
    if(!isUuid(id))return false;
    optimisticRead(id);
    var c=client();
    if(!c||typeof c.rpc!=='function'){scheduleRefresh(1200);return false;}
    try{
      var result=await c.rpc('happyad_notification_mark_read',{p_notification_id:id});
      if(result&&result.error)throw result.error;
      scheduleRefresh(60);
      return result&&result.data!==false;
    }catch(_e){scheduleRefresh(600);return false;}
  }
  async function markAllRead(){
    if(!currentUserId)return 0;
    var changed=0;
    rows=rows.map(function(row){
      if(row.is_read===true)return row;
      changed++;
      return Object.assign({},row,{is_read:true,read_at:row.read_at||new Date().toISOString(),updated_at:new Date().toISOString()});
    });
    renderBadge(0);writeCache();publish();
    var c=client();
    if(!c||typeof c.rpc!=='function'){scheduleRefresh(1200);return changed;}
    try{
      var result=await c.rpc('happyad_notifications_mark_all_read',{});
      if(result&&result.error)throw result.error;
      scheduleRefresh(60);
      return finite(result&&result.data);
    }catch(_e){scheduleRefresh(600);return changed;}
  }
  function bindAuth(){
    if(authBound)return;
    var c=client();
    if(!c||!c.auth||typeof c.auth.onAuthStateChange!=='function')return;
    authBound=true;
    try{
      c.auth.onAuthStateChange(function(event,session){
        var uid=clean(session&&session.user&&session.user.id);
        if(!uid){currentUserId='';stopRealtime();clearLocalState();}
        scheduleRefresh(30,'auth-change');
      });
    }catch(_e){authBound=false;}
  }
  function onMessage(event){
    var data=event&&event.data;
    if(!data||typeof data!=='object')return;
    if(data.type==='HAPPYAD_NOTIFICATION_CENTER_READY'){
      publish();
      scheduleRefresh(20,'center-open');
    }else if(data.type==='HAPPYAD_NOTIFICATION_MARK_READ'){
      markRead(data.notificationId||data.notification_id||(data.detail&&data.detail.notificationId));
    }else if(data.type==='HAPPYAD_NOTIFICATIONS_MARK_ALL_READ'){
      markAllRead();
    }else if(data.type==='HAPPYAD_NOTIFICATIONS_REQUEST_DATA'){
      publish();
      scheduleRefresh(20,'request-data');
    }else if(data.type==='HAPPYAD_NOTIFICATIONS_LOAD_MORE'){
      loadMore();
    }else if(data.type==='HAPPYAD_NOTIFICATION_PREFERENCES_UPDATED_V855R56'||data.type==='HAPPYAD_NOTIFICATION_PREFERENCES_UPDATED_V855R57'){
      notificationPreferencesReady=false;
      refresh({force:true,reason:'preferences-updated'}).catch(function(){});
    }
  }
  function restoreWarmBadge(){
    var uid='';
    try{uid=clean(localStorage.getItem('HAPPYAD_AUTH_UID'));}catch(_e){}
    if(!isUuid(uid))return false;
    loadCachedNotificationPreferences(uid);
    var cached=readCache(uid);
    if(!cached)return false;
    var cachedRows=normalizeRows(Array.isArray(cached.rows)?cached.rows:[]);
    var cachedCount=notificationPreferences.inApp===false?0:unreadFromRows(cachedRows);
    renderBadge(cachedCount);
    return true;
  }
  function boot(){
    /* Ne jamais effacer visuellement le dernier compteur confirmé pendant
       que Supabase restaure silencieusement la session. */
    if(!restoreWarmBadge())renderBadge(0);
    bindAuth();
    refresh({reason:'boot'}).catch(function(){});
    setTimeout(bindAuth,900);
    clearInterval(minuteTimer);
    /* Realtime reste prioritaire. Ce contrôle léger couvre les téléphones
       où Android ou le réseau suspend momentanément le canal Realtime. */
    minuteTimer=setInterval(function(){
      if(document.hidden){publish();return;}
      scheduleRefresh(0,'silent-poll');
    },120000);
  }

  window.addEventListener('message',onMessage,true);
  window.addEventListener('HAPPYAD_NOTIFICATION_CENTER_OPENED',function(){publish();scheduleRefresh(20,'center-open');},true);
  window.addEventListener('focus',function(){scheduleRefresh(30,'focus');},true);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)scheduleRefresh(30,'visible');},true);
  window.addEventListener('online',function(){scheduleRefresh(30,'online');},true);
  window.addEventListener('HAPPYAD_PROFILE_AVATAR_UPDATED_V855R32',function(){publish();},true);
  window.addEventListener('happyad:settings-data-change',function(event){
    var detail=event&&event.detail;if(detail&&detail.section==='notifications'){notificationPreferencesReady=false;refresh({force:true,reason:'settings-event'}).catch(function(){});}
  },true);

  window.HappyNotificationMaster={
    version:VERSION,
    refresh:function(){return refresh({force:true,reason:'api'});},
    loadMore:loadMore,
    markRead:markRead,
    markAllRead:markAllRead,
    rows:function(){return clone(rows);},
    suggestions:function(){return clone(suggestions);},
    unread:function(){return unreadTotal;},
    userId:function(){return currentUserId;},
    hasMore:function(){return hasMore===true;},
    preferences:function(){return clone(notificationPreferences);},
    preferencesReady:function(){return notificationPreferencesReady===true;},
    preferenceKey:function(type,meta){return notificationPreferenceKey({notification_type:type,metadata:meta||{}});},
    quietActive:function(){return quietState().active===true;},
    quietState:function(){return clone(quietState());},
    allows:function(type,meta,channel){return notificationAllowed({notification_type:type,metadata:meta||{}},channel||'inApp');}
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
