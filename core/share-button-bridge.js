(function(){
  'use strict';
  if(window.__HAPPYAD_SHARE_BUTTON_BRIDGE_V858__)return;
  window.__HAPPYAD_SHARE_BUTTON_BRIDGE_V858__=true;
  window.__HAPPYAD_SHARE_BUTTON_BRIDGE_V567__=true;
  window.__HAPPYAD_SHARE_BUTTON_BRIDGE_V857__=true;
  function clean(v){return String(v==null?'':v).trim();}
  function isShareTarget(t){return t&&t.closest&&t.closest('[data-card-act="share"],[data-profile-act="share"],[data-profile-fs-act="share"],.act[data-act="share"] button,.act[data-act="share"]');}
  function postIdFrom(target){
    try{var el=target.closest('[data-post-id],[data-photo-id],.reel[data-id]');if(el)return clean(el.dataset.postId||el.dataset.photoId||el.dataset.id);}catch(_e){}
    try{var fs=target.closest('#happyadHomePhotoFullscreen,.photoFullscreen');if(fs){var src=window.__happyadPhotoReturnSourceV478||{};if(src.id)return clean(src.id);}}catch(_e){}
    try{var q=new URLSearchParams(location.search);return clean(q.get('post')||q.get('id'));}catch(_e){return '';}
  }
  function arrays(){var out=[];['ALL_POSTS','allPhotoPosts','posts','POSTS','profilePosts','publishedPosts'].forEach(function(k){try{if(Array.isArray(window[k]))out.push(window[k]);}catch(_e){}});try{if(typeof window.profileVisiblePosts==='function'){var p=window.profileVisiblePosts();if(Array.isArray(p))out.push(p);}}catch(_e){}return out;}
  function findPost(id){for(var a of arrays()){var p=a.find(function(x){return clean(x&&(x.id||x.post_id))===id;});if(p)return p;}return null;}
  function domPost(target){
    try{var root=target&&target.closest&&target.closest('[data-post-id],[data-photo-id],.reel[data-id],.miniCard,.haProfileTile,.profilePost');if(root&&root.__happyadPost)return root.__happyadPost;}catch(_e){}
    try{var fs=target&&target.closest&&target.closest('#happyadHomePhotoFullscreen,.photoFullscreen');if(fs){return fs.__happyadCurrentPostV613E||window.__HAPPYAD_ACTIVE_FULLSCREEN_POST_V613E||null;}}catch(_e){}
    return null;
  }
  function domPreview(target){
    try{var root=target.closest('[data-post-id],[data-photo-id],.reel[data-id],.photoSlide,.miniCard,.profilePost');if(!root)return {};var img=root.querySelector('.miniMedia img,.haProfileTile img,.photoMediaBox img,.photoGroupTrack img,.photoSlideMedia img,.profilePostMedia img,img[data-post-media],img[data-publication-media]');var video=root.querySelector('.miniMedia video,.photoMediaBox video,.reel video,video[data-post-media],video[data-publication-media]');var title=root.querySelector('.miniTitle,.profilePostTitle,.slideInfo .title,.info .title,[data-post-title]');var desc=root.querySelector('.miniDesc,.profilePostDesc,.slideInfo .desc,.info .desc,[data-post-description]');var preview=clean((img&&(img.currentSrc||img.src))||(video&&(video.poster||video.getAttribute('poster'))));return {title:clean(title&&title.textContent),description:clean(desc&&desc.textContent),preview_url:preview,thumbnail_url:preview};}catch(_e){return {};}
  }
  function mediaType(target,post){var path=location.pathname.toLowerCase();if(path.indexOf('video.html')>=0||target.closest&&target.closest('.reel[data-id]'))return 'video';var raw=clean(post&&(post.marketplace_cover_type||post.marketplaceCoverType||post.media_type||post.mediaType||post.kind||post.type)).toLowerCase();return /video|reel|clip|mp4|webm|mov/.test(raw)?'video':'photo';}
  function payload(target){var id=postIdFrom(target);var p=findPost(id)||domPost(target)||{};var d=domPreview(target);return Object.assign({},p,d,{id:id,post_id:id,media_type:mediaType(target,p),source:location.pathname.split('/').pop()||'index.html'});}
  function openShare(detail){try{if(window.parent&&window.parent!==window&&window.parent.HappyadShareMaster)return window.parent.HappyadShareMaster.open(detail,window);}catch(_e){}try{if(window.HappyadShareMaster)return window.HappyadShareMaster.open(detail,window);}catch(_e){}try{(window.parent||window).postMessage({type:'HAPPYAD_SHARE_OPEN',detail:detail},'*');}catch(_e){}return true;}
  function client(){try{if(typeof window.happyadSb==='function')return window.happyadSb();if(window.happyadSupabase)return window.happyadSupabase;if(window.supabaseClient)return window.supabaseClient;}catch(_e){}return null;}
  function feedback(msg){try{if(typeof window.toast==='function'){window.toast(msg);return;}}catch(_e){}try{if(window.parent&&window.parent!==window&&typeof window.parent.toast==='function'){window.parent.toast(msg);return;}}catch(_e){}try{window.alert(msg);}catch(_e){}}
  function authenticatedV938(){try{return localStorage.getItem('HAPPYAD_SESSION_ACTIVE')==='1'&&/^[0-9a-f-]{36}$/i.test(clean(localStorage.getItem('HAPPYAD_AUTH_UID')));}catch(_e){return false;}}
  function guestNoticeV938(){try{var p=window.parent&&window.parent!==window?window.parent:window;var a=p&&(p.HappyAuthSessionV598||p.HappyAuthSessionV596);if(a&&typeof a.notice==='function'){a.notice();return false;}}catch(_e){}feedback('Connexion requise');return false;}
  async function sharingAllowed(id,detail){var gate=window.HappyInteractionPrivacyV855R52;if(!gate&&window.parent&&window.parent!==window)try{gate=window.parent.HappyInteractionPrivacyV855R52;}catch(_e){}if(!gate)return false;var d=detail||{},kind=clean(d.content_type||d.source_type||d.mode).toLowerCase();if(kind==='story'&&typeof gate.canStory==='function')return !!(await gate.canStory(clean(id),'reposts',true));if(typeof gate.canPost!=='function')return false;return !!(await gate.canPost(clean(id),'reposts',true));}
  function uuid(){try{if(crypto&&typeof crypto.randomUUID==='function')return crypto.randomUUID();}catch(_e){}return '00000000-0000-4000-8000-'+(String(Date.now()).slice(-8)+String(Math.random()).replace(/\D/g,'').slice(0,4)).padEnd(12,'0').slice(0,12);}
  function first(data){if(Array.isArray(data))return data[0]||{};if(data&&Array.isArray(data.data))return data.data[0]||{};return data&&typeof data==='object'?data:{};}
  function refreshUi(id,count){
    try{if(window.HappyadShareCountMaster)window.HappyadShareCountMaster.applyCount(id,count);}catch(_e){}
    try{if(typeof window.refreshLikeEverywhere==='function')window.refreshLikeEverywhere(id);}catch(_e){}
    try{if(typeof window.refresh==='function')window.refresh();}catch(_e){}
  }
  async function recordShare(detail){
    detail=detail&&typeof detail==='object'?detail:{};var p=detail.post||detail||{};var id=clean(p.post_id||p.id);if(!id)return false;
    var type=/video/.test(clean(p.media_type).toLowerCase())?'video':'photo';var channel=clean(detail.channel)||'unknown';var units=Math.min(20,Math.max(1,Number(detail.share_units||detail.units||1)||1));var eventId=clean(detail.client_event_id)||uuid();
    try{
      if(!(await sharingAllowed(id,p)))throw new Error('Le propriétaire n’autorise pas ce partage.');
      if(clean(p.content_type||p.source_type||p.mode).toLowerCase()==='story')return true;
      var c=client();if(!c||!c.rpc)throw new Error('Connexion Supabase indisponible.');
      var r=await c.rpc('happyad_share_commit',{p_post_id:id,p_content_type:type,p_channel:channel,p_share_units:units,p_client_event_id:eventId,p_metadata:{source:clean(p.source),link:clean(p.link),recipient_count:units,channel:channel,share_channel:channel,share_context:channel==='happyad-story'?'story':'standard'}});
      if(r&&r.error)throw r.error;
      var out=first(r&&r.data);var count=Number(out.shares_count);
      if(!Number.isFinite(count)){
        var q=await c.from('happyad_posts').select('shares_count').eq('id',id).maybeSingle();if(q&&!q.error&&q.data)count=Number(q.data.shares_count||0);
      }
      if(Number.isFinite(count))refreshUi(id,count);
      try{localStorage.setItem('HAPPYAD_ACTION_FAST_SYNC_V1',JSON.stringify({id:id,t:Date.now(),type:'share',shares_count:count}));}catch(_e){}
      try{(window.parent||window).postMessage({type:'HAPPYAD_SHARE_COUNT_UPDATED',detail:{post_id:id,shares_count:count}},'*');}catch(_e){}
      return true;
    }catch(err){console.warn('Fyblic share commit',err);return false;}
  }
  document.addEventListener('pointerdown',function(e){var share=isShareTarget(e.target);if(!share)return;try{share.style.touchAction='manipulation';share.dataset.happyadShareTouch='1';}catch(_e){}},true);
  document.addEventListener('click',function(e){var share=isShareTarget(e.target);if(!share)return;if(share.closest&&share.closest('#hsvShare,.storyViewer'))return;if(!authenticatedV938()){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();guestNoticeV938();return false;}var d=payload(share);if(!d.id)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    /* V858 — aucune requête Supabase avant la réaction visuelle. Le Share Master
       ouvre la feuille immédiatement puis vérifie la confidentialité en parallèle. */
    try{openShare(d);}catch(_e){feedback('Partage indisponible pour cette publication.');}
    return false;},true);
  window.addEventListener('message',function(e){var d=e&&e.data;if(d&&d.type==='HAPPYAD_SHARE_RECORD_ACTION')recordShare(d.detail||{});},true);
})();
