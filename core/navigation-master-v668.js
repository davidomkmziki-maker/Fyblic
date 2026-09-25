(function(){
  'use strict';
  if(window.__HAPPYAD_NAVIGATION_MASTER_V668__)return;
  window.__HAPPYAD_NAVIGATION_MASTER_V668__=true;
  window.__HAPPYAD_NAVIGATION_MASTER_V656__=true;

  var MASTER_VERSION='NAV_MASTER_V931_VISITOR_PROFILE_ROUTE_BACK';
  var VISITOR_PROFILE_PRELOAD_URL_V601='modules/visitor-profile.html?deferred=1&v=869-connection-phase2';
  var VISITOR_PROFILE_MESSAGE_V601='HAPPYAD_PROFILE_SHOW_V601';
  var NAV_FLAG='__happyadCoreNavV10';
  var NAV_DEPTH_KEY_V927='__happyadNavDepthV927';
  var NAV_ENTRY_KEY_V927='__happyadNavEntryV927';
  var NAV_SOURCE_KEY_V927='__happyadNavSourceV927';
  var INTERNAL_LAYER_KEY_V927='__happyadInternalLayerV927';
  var INTERNAL_DEPTH_KEY_V927='__happyadInternalDepthV927';
  var SHELL_ID='happyadAppShell';
  var LOADER_ID='happyadAppMiniLoader';
  var SKELETON_ID='happyadAppSkeleton';
  var VIDEO_DIRECT_ID='happyadAppVideoDirect';
  var SKELETON_STYLE_ID='happyadAppSkeletonStyleV625';
  var PUBLISH_TAP_SHIELD_ID_V889='happyadPublishTapShieldV889';
  var publishTapShieldStateV889=null;
  var PREFETCH_FLAG='__happyadSoftPrefetchV27';
  var MAIN_TABS_PRELOAD_FLAG='__happyadMainTabsPreloadV594';
  var VIDEO_TARGET_KEY_V594='HAPPYAD_VIDEO_TARGET_POST_V594';
  var RESTORE_KEY_V16ZH='HAPPYAD_LAST_OPEN_ROUTE_V16ZH';
  var BOOT_RESTORE_CLASS_V16ZJ='happyadBootRestoringPageV16ZJ';
  var activePage='home';
  var activeUrl='index.html';
  var restoring=false;
  var navDepthV927=0;
  var navEntrySeqV927=0;
  var menuResetV927=null;
  var bootHadCanonicalV927=false;
  var pendingNav=null;
  var pendingNavTimer=null;
  var NAV_GATE_MS=850;

  var pages={
    home:'index.html',
    profile:'modules/my-profile.html?v=1001-profile-identity-scale',
    profile_public:'modules/visitor-profile.html',
    video:'modules/video.html?v=986-base-video-text',
    photo:'modules/photo.html',
    message:'modules/message-center.html?mode=inbox&source=v738-assistance&v=1026-avatar-cover',
    publish:'modules/publish.html?v=1122-publication-session-renewed',
    map:'modules/map.html'
  };

  function clean(v){return String(v==null?'':v).trim().replace(/^\.\//,'');}
  function shell(){return document.getElementById(SHELL_ID);}
  function loader(){return document.getElementById(LOADER_ID);}
  function skeleton(){return document.getElementById(SKELETON_ID);}
  function injectSkeletonStyle(){
    try{
      if(document.getElementById(SKELETON_STYLE_ID))return;
      var st=document.createElement('style');st.id=SKELETON_STYLE_ID;
      st.textContent='\n'+
      '#happyadAppShell.happyadSkeletonOpen{display:block!important;background:#050507!important;}\n'+
      /* V876 : le document Messages peut réellement composer son cache, mais le
         shell entier reste transparent par opacity. Aucune règle noire héritée
         du routeur ou du dock ne peut donc recouvrir la surface courante. */
      '#happyadAppShell.happyadMessageCachePreparingV876{display:block!important;opacity:0!important;visibility:visible!important;background:transparent!important;pointer-events:none!important;}\n'+
      '#happyadAppShell.happyadMessageCachePreparingV876 #happyadAppFrame_message{display:block!important;opacity:1!important;visibility:visible!important;pointer-events:none!important;}\n'+
      '#happyadAppShell.happyadMessageCachePreparingWithinShellV876 #happyadAppFrame_message{display:block!important;opacity:0!important;visibility:visible!important;pointer-events:none!important;}\n'+
      '.happyadTapAcceptedV16U{filter:brightness(1.08)!important;transition:filter .12s ease,transform .12s ease!important;}\n'+
      '#happyadPublishTapShieldV889{position:fixed!important;inset:0!important;z-index:2147483646!important;display:block!important;background:transparent!important;pointer-events:auto!important;touch-action:none!important;overscroll-behavior:none!important;-webkit-tap-highlight-color:transparent!important;}\n'+
      '#happyadAppSkeleton{position:absolute!important;inset:0!important;z-index:7!important;display:none!important;background:linear-gradient(180deg,#050609 0%,#020306 100%)!important;color:#fff!important;overflow:hidden!important;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif!important;pointer-events:auto!important;}\n'+
      '#happyadAppSkeleton.on{display:block!important;}\n'+
      '#happyadAppSkeleton .haSkPage{position:absolute!important;inset:0!important;padding:18px 13px 92px!important;box-sizing:border-box!important;overflow:hidden!important;}\n'+
      '#happyadAppSkeleton .haSkTop{height:42px!important;display:flex!important;align-items:center!important;gap:10px!important;margin-bottom:10px!important;}\n'+
      '#happyadAppSkeleton .haSkBack{width:34px!important;height:34px!important;border-radius:50%!important;background:rgba(255,255,255,.055)!important;box-shadow:0 0 0 1px rgba(255,255,255,.04) inset!important;position:relative!important;overflow:hidden!important;}\n'+
      '#happyadAppSkeleton .haSkTitle{height:15px!important;width:132px!important;border-radius:999px!important;background:rgba(255,255,255,.075)!important;position:relative!important;overflow:hidden!important;}\n'+
      '#happyadAppSkeleton .haSkLogo{display:none!important;}\n'+
      '#happyadAppSkeleton .haSkProfilePage{padding-top:28px!important;}\n'+
      '#happyadAppSkeleton .haSkProfilePage[data-page="profile_public"]{padding:18px 0 92px!important;}\n'+
      '#happyadAppSkeleton .haSkProfilePage[data-page="profile_public"] .haSkProfileIdentity{padding:0 14px!important;margin-top:18px!important;}\n'+
      '#happyadAppSkeleton .haSkProfilePage[data-page="profile_public"] .haSkStats{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:0!important;margin:18px 14px 0!important;border:1px solid rgba(255,255,255,.065)!important;border-radius:16px!important;overflow:hidden!important;}\n'+
      '#happyadAppSkeleton .haSkProfilePage[data-page="profile_public"] .haSkStat{height:46px!important;border:0!important;border-right:1px solid rgba(255,255,255,.055)!important;border-radius:0!important;}\n'+
      '#happyadAppSkeleton .haSkProfilePage[data-page="profile_public"] .haSkStat:last-child{border-right:0!important;}\n'+
      '#happyadAppSkeleton .haSkProfilePage[data-page="profile_public"] .haSkBio{display:none!important;}\n'+
      '#happyadAppSkeleton .haSkProfilePage[data-page="profile_public"] .haSkActions{display:none!important;}\n'+
      '#happyadAppSkeleton .haSkProfilePage[data-page="profile_public"] .haSkProfileGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:3px!important;margin:92px 0 0!important;}\n'+
      '#happyadAppSkeleton .haSkProfilePage[data-page="profile_public"] .haSkCard{border-radius:2px!important;aspect-ratio:4/5!important;background:#10141b!important;}\n'+
      '#happyadAppSkeleton .haSkVisitorBack{position:absolute!important;left:18px!important;top:18px!important;width:54px!important;height:54px!important;border-radius:50%!important;background:rgba(255,138,0,.14)!important;border:1px solid rgba(255,138,0,.45)!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:42px!important;line-height:1!important;color:#fff!important;box-sizing:border-box!important;}\n'+
      '#happyadAppSkeleton .haSkProfileIdentity{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;margin:0 auto 18px!important;text-align:center!important;}\n'+
      '#happyadAppSkeleton .haSkAvatar{width:86px!important;height:86px!important;border-radius:50%!important;background:rgba(255,255,255,.075)!important;box-shadow:0 0 0 1px rgba(255,255,255,.055) inset,0 16px 44px rgba(0,0,0,.20)!important;position:relative!important;overflow:hidden!important;flex:0 0 auto!important;}\n'+
      '#happyadAppSkeleton .haSkAvatarCenter{width:96px!important;height:96px!important;margin:0 auto!important;}\n'+
      '#happyadAppSkeleton .haSkAvatar i{position:absolute!important;inset:0!important;display:block!important;z-index:1!important;}\n'+
      '#happyadAppSkeleton .haSkAvatar i:before{content:""!important;position:absolute!important;left:50%!important;top:24%!important;width:29%!important;height:29%!important;border-radius:50%!important;transform:translateX(-50%)!important;background:rgba(255,255,255,.16)!important;box-shadow:0 0 0 1px rgba(255,255,255,.035) inset!important;}\n'+
      '#happyadAppSkeleton .haSkAvatar i:after{content:""!important;position:absolute!important;left:50%!important;bottom:20%!important;width:58%!important;height:31%!important;border-radius:999px 999px 30px 30px!important;transform:translateX(-50%)!important;background:rgba(255,255,255,.13)!important;box-shadow:0 0 0 1px rgba(255,255,255,.03) inset!important;}\n'+
      '#happyadAppSkeleton .haSkNameLine{width:170px!important;height:18px!important;border-radius:999px!important;background:rgba(255,255,255,.085)!important;margin:13px auto 8px!important;position:relative!important;overflow:hidden!important;}\n'+
      '#happyadAppSkeleton .haSkHandleLine{width:122px!important;height:11px!important;border-radius:999px!important;background:rgba(255,255,255,.06)!important;margin:0 auto!important;position:relative!important;overflow:hidden!important;}\n'+
      '#happyadAppSkeleton .haSkHero{display:grid!important;grid-template-columns:78px minmax(0,1fr)!important;gap:13px!important;align-items:center!important;margin:8px 0 14px!important;}\n'+
      '#happyadAppSkeleton .haSkLine{height:12px!important;border-radius:999px!important;background:rgba(255,255,255,.075)!important;margin:8px 0!important;position:relative!important;overflow:hidden!important;}\n'+
      '#happyadAppSkeleton .haSkLine.sm{width:44%!important;height:9px!important;opacity:.72!important;}\n'+
      '#happyadAppSkeleton .haSkLine.md{width:68%!important;}\n'+
      '#happyadAppSkeleton .haSkLine.lg{width:86%!important;}\n'+
      '#happyadAppSkeleton .haSkStats{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important;margin:12px 0!important;}\n'+
      '#happyadAppSkeleton .haSkStat{height:48px!important;border-radius:18px!important;background:rgba(255,255,255,.055)!important;border:1px solid rgba(255,255,255,.035)!important;position:relative!important;overflow:hidden!important;}\n'+
      '#happyadAppSkeleton .haSkBio{height:58px!important;border-radius:18px!important;background:rgba(255,255,255,.045)!important;margin:12px 0 14px!important;padding:13px!important;box-sizing:border-box!important;position:relative!important;overflow:hidden!important;}\n'+
      '#happyadAppSkeleton .haSkActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;margin:0 0 15px!important;}\n'+
      '#happyadAppSkeleton .haSkBtn{height:42px!important;border-radius:999px!important;background:rgba(255,138,0,.085)!important;border:1px solid rgba(255,138,0,.105)!important;position:relative!important;overflow:hidden!important;}\n'+
      '#happyadAppSkeleton .haSkGrid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;}\n'+
      '#happyadAppSkeleton .haSkCard{aspect-ratio:1/1!important;border-radius:18px!important;background:rgba(255,255,255,.06)!important;overflow:hidden!important;position:relative!important;}\n'+
      '#happyadAppSkeleton .haSkChips{display:flex!important;gap:8px!important;overflow:hidden!important;margin:4px 0 14px!important;}\n'+
      '#happyadAppSkeleton .haSkChip{height:34px!important;min-width:84px!important;border-radius:999px!important;background:rgba(255,255,255,.06)!important;flex:0 0 auto!important;position:relative!important;overflow:hidden!important;}\n'+
      '#happyadAppSkeleton .haSkBack:after,#happyadAppSkeleton .haSkTitle:after,#happyadAppSkeleton .haSkCard:after,#happyadAppSkeleton .haSkAvatar:after,#happyadAppSkeleton .haSkLine:after,#happyadAppSkeleton .haSkStat:after,#happyadAppSkeleton .haSkBio:after,#happyadAppSkeleton .haSkBtn:after,#happyadAppSkeleton .haSkChip:after,#happyadAppSkeleton .haSkNameLine:after,#happyadAppSkeleton .haSkHandleLine:after{content:""!important;position:absolute!important;top:0!important;bottom:0!important;left:-95%;width:86%!important;z-index:2!important;background:linear-gradient(105deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.08) 28%,rgba(255,255,255,.46) 50%,rgba(255,255,255,.08) 72%,rgba(255,255,255,0) 100%)!important;transform:skewX(-14deg)!important;animation:happyadSkShimmerV20 2.25s ease-in-out infinite!important;will-change:left!important;opacity:.72!important;pointer-events:none!important;}\n'+
      '#happyadAppVideoDirect{position:absolute!important;inset:0!important;z-index:8!important;display:none!important;background:#000!important;color:#fff!important;overflow:hidden!important;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif!important;pointer-events:none!important;}\n'+      '#happyadAppVideoDirect.on{display:block!important;}\n'+      '#happyadAppVideoDirect .haVidFrame{position:absolute!important;inset:0!important;background:#000!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;}\n'+      '#happyadAppVideoDirect .haVidFrame img{display:block!important;max-width:100%!important;max-height:100%!important;width:auto!important;height:auto!important;object-fit:contain!important;background:#000!important;filter:brightness(.90)!important;transform:none!important;}\n'+      '#happyadAppVideoDirect .haVidFrame.noPoster{background:radial-gradient(circle at 50% 42%,rgba(255,138,0,.14),transparent 30%),linear-gradient(180deg,#1a1d24,#11141a 58%,#0c0e13)!important;}\n'+      '#happyadAppVideoDirect.generalVideo{background:#12141a!important;}\n'+      '#happyadAppVideoDirect .haVidFade{position:absolute!important;inset:0!important;background:linear-gradient(180deg,rgba(0,0,0,.20),rgba(0,0,0,.02) 44%,rgba(0,0,0,.58))!important;pointer-events:none!important;}\n'+      '#happyadAppVideoDirect .haVidCenter{position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;width:74px!important;height:74px!important;border-radius:50%!important;background:rgba(0,0,0,.48)!important;border:1px solid rgba(255,255,255,.20)!important;box-shadow:0 14px 44px rgba(0,0,0,.55),0 0 34px rgba(255,138,0,.22)!important;display:flex!important;align-items:center!important;justify-content:center!important;}\n'+      '#happyadAppVideoDirect .haVidCenter:before{content:""!important;margin-left:5px!important;border-left:20px solid rgba(255,255,255,.94)!important;border-top:13px solid transparent!important;border-bottom:13px solid transparent!important;z-index:2!important;}\n'+      '#happyadAppVideoDirect .haVidCenter:after{content:""!important;position:absolute!important;inset:-6px!important;border-radius:50%!important;border:3px solid rgba(255,255,255,.18)!important;border-top-color:rgba(255,138,0,.98)!important;border-right-color:rgba(255,189,102,.72)!important;animation:happyadVidPlaySpinV24 .92s linear infinite!important;box-shadow:0 0 18px rgba(255,138,0,.20)!important;}\n'+      '#happyadAppVideoDirect .haVidBottom{position:absolute!important;left:18px!important;right:18px!important;bottom:28px!important;display:grid!important;gap:8px!important;}\n'+      '#happyadAppVideoDirect .haVidTitle{height:16px!important;max-width:72%!important;border-radius:999px!important;background:rgba(255,255,255,.16)!important;overflow:hidden!important;position:relative!important;}\n'+      '#happyadAppVideoDirect .haVidMeta{height:11px!important;max-width:42%!important;border-radius:999px!important;background:rgba(255,255,255,.10)!important;overflow:hidden!important;position:relative!important;}\n'+      '#happyadAppVideoDirect .haVidTitle:after,#happyadAppVideoDirect .haVidMeta:after{content:""!important;position:absolute!important;top:0!important;bottom:0!important;left:-80%!important;width:70%!important;background:linear-gradient(105deg,rgba(255,255,255,0),rgba(255,255,255,.28),rgba(255,255,255,0))!important;animation:happyadSkShimmerV20 1.85s ease-in-out infinite!important;}\n'+      '#happyadAppSkeleton .haSkSpin,#happyadAppMiniLoader,#happyadAppMiniLoader.on{display:none!important;opacity:0!important;visibility:hidden!important;}\n'+      '@keyframes happyadSkShimmerV20{0%{left:-95%}55%,100%{left:120%}}\n'+      '@keyframes happyadVidPlaySpinV24{to{transform:rotate(360deg)}}\n';
      st.textContent += '\n'+
      '#happyadAppSkeleton .haSkTop{height:48px!important;margin-bottom:14px!important;padding:0 2px!important;}\n'+
      '#happyadAppSkeleton .haSkBack{display:grid!important;place-items:center!important;border:1px solid rgba(255,255,255,.18)!important;background:rgba(255,255,255,.045)!important;}\n'+
      '#happyadAppSkeleton .haSkBack:before{content:"‹"!important;color:#fff!important;font-size:32px!important;font-weight:500!important;line-height:1!important;transform:translateY(-1px)!important;}\n'+
      '#happyadAppSkeleton .haSkTitle{width:auto!important;height:auto!important;border-radius:0!important;background:transparent!important;color:#fff!important;font-size:21px!important;font-weight:900!important;line-height:1!important;overflow:visible!important;}\n'+
      '#happyadAppSkeleton .haSkTitle:after,#happyadAppSkeleton .haSkBack:after{display:none!important;}\n'+
      '#happyadAppSkeleton .haSkSubtle{font-size:12px!important;color:rgba(255,255,255,.56)!important;font-weight:700!important;margin:-6px 0 13px 46px!important;}\n'+
      '#happyadAppSkeleton .haSkList{display:grid!important;gap:8px!important;margin-top:4px!important;}\n'+
      '#happyadAppSkeleton .haSkRow{height:68px!important;border-radius:17px!important;background:rgba(255,255,255,.035)!important;border:1px solid rgba(255,255,255,.045)!important;display:grid!important;grid-template-columns:48px minmax(0,1fr) 42px!important;gap:10px!important;align-items:center!important;padding:9px 10px!important;}\n'+
      '#happyadAppSkeleton .haSkRowAvatar{width:48px!important;height:48px!important;border-radius:50%!important;background:rgba(255,255,255,.085)!important;position:relative!important;overflow:hidden!important;}\n'+
      '#happyadAppSkeleton .haSkRowBody{min-width:0!important;}\n'+
      '#happyadAppSkeleton .haSkRowBody .haSkLine{margin:5px 0!important;}\n'+
      '#happyadAppSkeleton .haSkRowTime{width:28px!important;height:8px!important;border-radius:999px!important;background:rgba(255,255,255,.07)!important;justify-self:end!important;}\n'+
      '#happyadAppSkeleton .haSkProfileGrid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;}\n'+
      '#happyadAppSkeleton .haSkProfileGrid .haSkCard{border-radius:10px!important;}\n'+
      '#happyadAppSkeleton .haSkVideoPage{padding:0!important;background:linear-gradient(180deg,#181b22 0%,#08090d 56%,#020203 100%)!important;}\n'+
      '#happyadAppSkeleton .haSkVideoTop{position:absolute!important;left:13px!important;right:13px!important;top:13px!important;z-index:3!important;}\n'+
      '#happyadAppSkeleton .haSkVideoPoster{position:absolute!important;inset:0!important;background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.10),transparent 24%),linear-gradient(160deg,#242833,#0e1016 60%,#050506)!important;}\n'+
      '#happyadAppSkeleton .haSkVideoPlay{position:absolute!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;width:68px!important;height:68px!important;border-radius:50%!important;background:rgba(255,255,255,.88)!important;box-shadow:0 14px 40px rgba(0,0,0,.42)!important;}\n'+
      '#happyadAppSkeleton .haSkVideoPlay:before{content:""!important;position:absolute!important;left:28px!important;top:21px!important;border-left:19px solid #08090c!important;border-top:13px solid transparent!important;border-bottom:13px solid transparent!important;}\n'+
      '#happyadAppSkeleton .haSkVideoInfo{position:absolute!important;left:18px!important;right:78px!important;bottom:34px!important;}\n'+
      '#happyadAppSkeleton .haSkPublishBox{height:52px!important;border-radius:16px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(255,255,255,.06)!important;margin-bottom:10px!important;}\n'+
      '#happyadAppSkeleton .haSkPublishBox.tall{height:132px!important;}\n'+
      '#happyadAppSkeleton .haSkMap{height:calc(100dvh - 92px)!important;border-radius:20px!important;background:linear-gradient(30deg,rgba(255,255,255,.04) 12%,transparent 12.5%,transparent 87%,rgba(255,255,255,.04) 87.5%),linear-gradient(150deg,rgba(255,255,255,.04) 12%,transparent 12.5%,transparent 87%,rgba(255,255,255,.04) 87.5%),linear-gradient(30deg,rgba(255,255,255,.04) 12%,transparent 12.5%,transparent 87%,rgba(255,255,255,.04) 87.5%),#11161b!important;background-size:54px 94px!important;background-position:0 0,0 0,27px 47px!important;border:1px solid rgba(255,255,255,.06)!important;}\n'+
      '#happyadAppSkeleton .haSkRowAvatar:after,#happyadAppSkeleton .haSkRowTime:after,#happyadAppSkeleton .haSkPublishBox:after{content:""!important;position:absolute!important;inset:0!important;background:linear-gradient(105deg,transparent 20%,rgba(255,255,255,.08) 48%,transparent 76%)!important;transform:translateX(-110%)!important;animation:happyadSkSlideV623 1.8s ease-in-out infinite!important;}\n'+
      '@keyframes happyadSkSlideV623{55%,100%{transform:translateX(110%)}}\n';
      (document.head||document.documentElement).appendChild(st);
    }catch(_e){}
  }
  function skeletonMarkup(page,url){
    page=String(page||'');
    var title='Fyblic';
    if(page==='profile')title='Mon profil';
    else if(page==='profile_public')title='Profil';
    else if(page==='video')title='Vidéos';
    else if(page==='message')title='Messages';
    else if(page==='photo')title='Photos';
    else if(page==='publish')title='Publication';
    else if(page==='map')title='Carte';
    var top='<div class="haSkTop"><div class="haSkBack"></div><div class="haSkTitle">'+title+'</div></div>';
    var line='<div class="haSkLine lg"></div><div class="haSkLine md"></div>';
    var profileTop='<div class="haSkProfileIdentity"><div class="haSkAvatar haSkAvatarCenter"><i></i></div><div class="haSkNameLine"></div><div class="haSkHandleLine"></div></div>';
    var cards='';for(var i=0;i<9;i++)cards+='<div class="haSkCard"></div>';
    if(page==='video'){
      return '<div class="haSkPage haSkVideoPage" data-page="video"><div class="haSkVideoPoster"></div><div class="haSkVideoTop">'+top+'</div><div class="haSkVideoPlay"></div><div class="haSkVideoInfo">'+line+'</div></div>';
    }
    if(page==='profile_public'){
      return '<div class="haSkPage haSkProfilePage" data-page="profile_public"><div class="haSkBack haSkVisitorBack" aria-label="Retour">‹</div>'+profileTop+'<div class="haSkStats"><div class="haSkStat"></div><div class="haSkStat"></div><div class="haSkStat"></div><div class="haSkStat"></div></div><div class="haSkGrid haSkProfileGrid">'+cards+'</div></div>';
    }
    if(page==='profile'){
      return '<div class="haSkPage haSkProfilePage" data-page="profile">'+profileTop+'<div class="haSkStats"><div class="haSkStat"></div><div class="haSkStat"></div><div class="haSkStat"></div></div><div class="haSkBio">'+line+'</div><div class="haSkActions"><div class="haSkBtn"></div><div class="haSkBtn"></div></div><div class="haSkGrid haSkProfileGrid">'+cards+'</div></div>';
    }
    if(page==='message'){
      var rows='';for(var r=0;r<7;r++)rows+='<div class="haSkRow"><div class="haSkRowAvatar"></div><div class="haSkRowBody"><div class="haSkLine md"></div><div class="haSkLine lg"></div></div><div class="haSkRowTime"></div></div>';
      return '<div class="haSkPage" data-page="message">'+top+'<div class="haSkSubtle">Conversations</div><div class="haSkList">'+rows+'</div></div>';
    }
    if(page==='publish'){
      /* V884 : réponse visuelle immédiate au clic +. Le chargement parent occupe
         la surface dès le premier cycle, puis disparaît au premier rendu utile
         de publish.html. Aucun document iframe vide/noir n'est exposé. */
      var publishTop='<div class="haSkTop"><div class="haSkBack"></div><div class="haSkTitle">Nouvelle publication</div></div>';
      return '<div class="haSkPage" data-page="publish">'+publishTop+'<div class="haSkSubtle">Chargement…</div><div class="haSkPublishBox"></div><div class="haSkPublishBox tall"></div><div class="haSkPublishBox"></div></div>';
    }
    if(page==='map')return '<div class="haSkPage" data-page="map">'+top+'<div class="haSkMap"></div></div>';
    return '<div class="haSkPage" data-page="'+page+'">'+top+line+'<div class="haSkGrid"><div class="haSkCard"></div><div class="haSkCard"></div><div class="haSkCard"></div><div class="haSkCard"></div></div></div>';
  }
  function showSkeleton(page,url,on){
    try{
      if(on&&String(page||'')==='story')on=false;
      injectSkeletonStyle();
      var root=ensureShell(); if(!root)return;
      var sk=skeleton();
      if(!sk){sk=document.createElement('div');sk.id=SKELETON_ID;sk.setAttribute('aria-hidden','true');sk.addEventListener('click',function(ev){try{var back=ev&&ev.target&&ev.target.closest&&ev.target.closest('.haSkBack');if(back){ev.preventDefault();ev.stopPropagation();close('instant-surface-back-v623');}}catch(_e){}},true);root.appendChild(sk);}
      if(on){
        sk.innerHTML=skeletonMarkup(page,url);
        sk.setAttribute('data-happyad-page',String(page||''));
        sk.classList.add('on');
        root.classList.add('on');root.classList.add('happyadSkeletonOpen');root.setAttribute('aria-hidden','false');
        document.body.classList.add('happyadAppOpen');
      }else{
        sk.classList.remove('on');sk.removeAttribute('data-happyad-page');
        root.classList.remove('happyadSkeletonOpen');
      }
    }catch(_e){}
  }
  function clearBootRestoreMaskV16ZJ(reason){
    try{
      if(document.documentElement&&document.documentElement.classList){
        document.documentElement.classList.remove(BOOT_RESTORE_CLASS_V16ZJ);
      }
      window.__HAPPYAD_BOOT_RESTORE_MASK_CLEARED_V16ZJ={reason:String(reason||''),t:Date.now()};
    }catch(_e){}
  }
  function prepareBootRestoreShellV16ZJ(page,url){
    try{
      page=String(page||'home');url=rootUrl(url||pages[page]||'index.html');
      injectSkeletonStyle();
      var root=ensureShell();
      if(root){
        root.classList.add('on');
        root.setAttribute('aria-hidden','false');
      }
      try{document.body&&document.body.classList&&document.body.classList.add('happyadAppOpen');}catch(_b){}
      if(isNoSkeletonPage(page,url)){
        try{showSkeleton(page,url,false);}catch(_sk){}
      }else{
        try{showSkeleton(page,url,true);}catch(_sk2){}
      }
      try{showVideoDirect(url,false);}catch(_v){}
      try{releaseNavGate('boot-restore-prepare-v16zj');}catch(_g){}
      window.__HAPPYAD_BOOT_RESTORE_PREPARED_V16ZJ={page:page,url:url,t:Date.now()};
    }catch(_e){}
  }
  function ensureShell(){
    injectSkeletonStyle();
    var root=shell();
    if(!root){
      root=document.createElement('div');root.id=SHELL_ID;root.setAttribute('aria-hidden','true');
      try{document.body.appendChild(root);}catch(_e){}
    }
    try{if(root&&!skeleton()){var sk=document.createElement('div');sk.id=SKELETON_ID;sk.setAttribute('aria-hidden','true');root.appendChild(sk);}}catch(_sk){}
    var l=loader();
    if(!l){l=document.createElement('div');l.id=LOADER_ID;l.setAttribute('aria-hidden','true');try{document.body.appendChild(l);}catch(_e){}}
    return root;
  }
  function rootUrl(url){
    url=clean(url);
    if(!url||url==='#'||url==='/'||url==='./')return 'index.html';
    try{
      var u=new URL(url,location.href);
      var file=(u.pathname||'').replace(/\\/g,'/').split('/').pop()||'index.html';
      var prefix=url;
      if(file==='my-profile.html')prefix='modules/my-profile.html';
      else if(file==='visitor-profile.html')prefix='modules/visitor-profile.html';
      else if(file==='user.html')prefix='modules/my-profile.html';
      else if(file==='video.html')prefix='modules/video.html';
      else if(file==='photo.html')prefix='modules/photo.html';
      else if(file==='message-center.html')prefix='modules/message-center.html';
      else if(file==='publish.html')prefix='modules/publish.html';
      else if(file==='map.html')prefix='modules/map.html';
      else if(file==='index.html'||file==='')prefix='index.html';
      return prefix+(u.search||'')+(u.hash||'');
    }catch(_e){return url;}
  }
  function pathOf(url){return rootUrl(url).split('#')[0].split('?')[0];}
  function publicUidFromUrl(url){
    try{
      var u=new URL(rootUrl(url),location.href);
      return String(u.searchParams.get('uid')||u.searchParams.get('user_id')||u.searchParams.get('profile_uid')||u.searchParams.get('auth_user_id')||u.searchParams.get('account_uid')||u.searchParams.get('owner')||u.searchParams.get('owner_id')||'').trim();
    }catch(_e){return '';}
  }
  function isValidPublicProfileUrl(url){
    try{
      var r=rootUrl(url), p=pathOf(r);
      if(p!=='modules/visitor-profile.html')return false;
      return !!publicUidFromUrl(r);
    }catch(_e){return false;}
  }
  function normalizeRouteForOpen(page,url){
    page=String(page||'home');url=rootUrl(url||pages[page]||'index.html');
    if(page==='visitorProfile')page='profile_public';
    if(page==='myProfile')page='profile';
    if(page==='profile_public'&&!isValidPublicProfileUrl(url))return {view:'profile',url:'modules/my-profile.html',invalidPublic:true};
    if(pathOf(url)==='modules/visitor-profile.html'&&!isValidPublicProfileUrl(url))return {view:'profile',url:'modules/my-profile.html',invalidPublic:true};
    return {view:page,url:url,invalidPublic:false};
  }
  function pageOf(url,forced){
    if(forced){
      forced=String(forced||'');
      if(forced==='myProfile')return 'profile';
      if(forced==='visitorProfile')return 'profile_public';
      if(pages[forced])return forced;
    }
    var r=rootUrl(url), p=pathOf(r);
    if(p==='modules/visitor-profile.html')return 'profile_public';
    if(p==='modules/my-profile.html'||p==='modules/user.html')return 'profile';
    if(p==='modules/video.html')return 'video';
    if(p==='modules/photo.html')return 'photo';
    if(p==='modules/message-center.html')return 'message';
    if(p==='modules/publish.html')return 'publish';
    if(p==='modules/map.html')return 'map';
    return 'home';
  }
  /* V886 — Publication utilise une URL canonique unique. Seuls Publier, Story
     et Live restent publics. Les anciens modes Reel/Carte retombent sur Publier. */
  function normalizePublishModeV885(mode){
    mode=String(mode||'').trim().toLowerCase();
    return (mode==='story'||mode==='live')?mode:'publish';
  }
  function publishModeFromRequestV885(url,extra){
    try{
      var mode=extra&&String(extra.publishMode||extra.mode||'').trim();
      if(!mode){var u=new URL(rootUrl(url||'modules/publish.html'),location.href);mode=String(u.searchParams.get('mode')||'');}
      return normalizePublishModeV885(mode);
    }catch(_e){return 'publish';}
  }
  function deliverPublishModeV885(fr,mode,source){
    try{
      if(!fr||!fr.contentWindow)return false;
      mode=normalizePublishModeV885(mode||fr.getAttribute('data-happyad-publish-mode-v885')||'publish');
      fr.setAttribute('data-happyad-publish-mode-v885',mode);
      fr.contentWindow.postMessage({type:'HAPPYAD_PUBLISH_SET_MODE_V885',mode:mode,publishMode:mode,source:String(source||MASTER_VERSION),at:Date.now()},'*');
      return true;
    }catch(_e){return false;}
  }
  function hasPost(url){try{var u=new URL(rootUrl(url),location.href);return !!(u.searchParams.get('post')||u.searchParams.get('id'));}catch(_e){return /[?&](post|id)=/.test(rootUrl(url));}}
  function readProfileJson(k){try{return JSON.parse(localStorage.getItem(k)||'null')||null;}catch(_e){return null;}}
  function validProfileUser(u){
    if(!u||typeof u!=='object')return false;
    var id=String(u.id||u.user_id||u.uid||u.uuid||u.auth_id||u.auth_user_id||u.authUserId||u.account_uid||u.accountUid||u.profile_id||u.owner_id||'').trim().toLowerCase();
    var nm=String(u.name||u.full_name||u.display_name||'').trim().toLowerCase();
    if(id.indexOf('guest')===0||id.indexOf('logged_out')===0)return false;
    if(nm==='utilisateur'||nm==='utilisateur happyad'||nm==='utilisateur fyblic'||nm.indexOf('aucun compte')>=0)return false;
    return !!(id||String(u.email||'').trim()||String(u.handle||u.username||'').trim());
  }
  function strictAuthProfileUidV69(){
    var id='';
    /* R69: le routeur ne doit jamais convertir un visiteur en Mon profil à
       partir d'un ancien cache HAPPYAD_USER / UserStore. Il utilise seulement
       la session centrale authentifiée, puis le UID auth local si la session
       est explicitement active. */
    try{
      var auth=window.HappyAuthSessionV598||window.HappyAuthSessionV597||window.HappyAuthSessionV596||window.HappyAuthSessionV595;
      var u=auth&&typeof auth.user==='function'?auth.user():null;
      id=String(u&&u.id||'').trim();
      if(id)return id;
    }catch(_e){}
    try{
      if(localStorage.getItem('HAPPYAD_SESSION_ACTIVE')!=='1')return '';
      return String(localStorage.getItem('HAPPYAD_AUTH_UID')||'').trim();
    }catch(_e2){return '';}
  }
  function currentProfileIds(){
    var id=strictAuthProfileUidV69();
    return id?[id]:[];
  }
  function isOwnProfileUid(uid){
    uid=String(uid||'').trim().toLowerCase();if(!uid)return false;
    var authUid=String(strictAuthProfileUidV69()||'').trim().toLowerCase();
    return !!authUid&&authUid===uid;
  }
  function profileUidFromUrl(url){
    return publicUidFromUrl(url);
  }
  function activePublicProfileUid(){
    try{var u=String(sessionStorage.getItem('HAPPYAD_PROFILE_MASTER_ACTIVE_UID')||'').trim();if(u)return u;}catch(_e){}
    try{var u2=String(localStorage.getItem('HAPPYAD_PUBLIC_PROFILE_ACTIVE_UID')||localStorage.getItem('HAPPYAD_ACTIVE_PROFILE_UID')||'').trim();if(u2)return u2;}catch(_e2){}
    try{var ap=readProfileJson('HAPPYAD_ACTIVE_PROFILE')||{};var id=String(ap.id||ap.user_id||ap.uid||ap.auth_user_id||ap.authUserId||ap.account_uid||ap.accountUid||ap.profile_uid||ap.owner_id||ap.creator_id||'').trim();if(id&&ap.__happyadUidLocked)return id;}catch(_e3){}
    return '';
  }
  function ensurePublicProfileUrl(url,extra){
    url=rootUrl(url||'modules/visitor-profile.html');
    var uid=profileUidFromUrl(url)||String((extra&&extra.uid)||(extra&&extra.profile&&profileUidFromUrl('modules/visitor-profile.html?uid='+encodeURIComponent(extra.profile.id||extra.profile.user_id||extra.profile.uid||'')))||'').trim()||activePublicProfileUid();
    if(!uid)return '';
    try{
      var u=new URL(url,location.href);
      u.searchParams.delete('public');
      u.searchParams.set('uid',uid);
      return 'modules/visitor-profile.html'+(u.search||'')+(u.hash||'');
    }catch(_e){
      return 'modules/visitor-profile.html?uid='+encodeURIComponent(uid);
    }
  }
  function isHome(url){return pageOf(url)==='home';}
  function frameId(page){return 'happyadAppFrame_'+String(page||'page').replace(/[^a-zA-Z0-9_-]/g,'_');}
  function clearVisitorStateForOwnerV649(){
    try{
      sessionStorage.setItem('HAPPYAD_PROFILE_MASTER_MODE','my');
      sessionStorage.removeItem('HAPPYAD_PROFILE_MASTER_ACTIVE_UID');
      sessionStorage.removeItem('HAPPYAD_PROFILE_MASTER_ACTIVE_URL');
    }catch(_s){}
    try{
      localStorage.removeItem('HAPPYAD_ACTIVE_PROFILE');
      localStorage.removeItem('HAPPYAD_ACTIVE_PROFILE_UID');
      localStorage.removeItem('HAPPYAD_PUBLIC_PROFILE_ACTIVE_UID');
    }catch(_l){}
    try{delete window.__HAPPYAD_ACTIVE_PROFILE_RAM;}catch(_r){window.__HAPPYAD_ACTIVE_PROFILE_RAM=null;}
  }
  function cancelVisitorFrameForOwnerV649(reason){
    try{
      var fr=document.getElementById(frameId('profile_public'));if(!fr)return;
      ['__happyadLoadWatch','__happyadRevealWatch','__happyadVisitorRevealFallbackV601'].forEach(function(k){
        try{if(fr[k])clearTimeout(fr[k]);fr[k]=null;}catch(_t){}
      });
      fr.__happyadVisitorOpenRequestedV601=false;
      fr.__happyadVisitorTargetV601=null;
      try{fr.contentWindow&&fr.contentWindow.postMessage({type:'HAPPYAD_PROFILE_HIDE_VISITOR_V649',reason:reason||'owner-profile-open-v649'},'*');}catch(_hide){}
      fr.removeAttribute('data-happyad-defer-visible');
      fr.removeAttribute('data-happyad-skeleton-start');
      fr.classList.remove('on');
      fr.setAttribute('aria-hidden','true');
      fr.setAttribute('inert','');
      fr.style.opacity='';fr.style.visibility='';
      pauseFrame(fr,reason||'owner-profile-open-v649');
    }catch(_e){}
  }
  function prepareOwnerProfileOpenV649(reason){
    clearVisitorStateForOwnerV649();
    cancelVisitorFrameForOwnerV649(reason||'owner-profile-open-v649');
    try{showSkeleton('profile_public','',false);}catch(_sk){}
  }
  function deliverOwnerTargetV649(fr,url,extra){
    try{
      if(!fr||!fr.contentWindow)return false;
      var detail={type:'HAPPYAD_PROFILE_SHOW_OWNER_V649',url:rootUrl(url||'modules/my-profile.html'),source:String(extra&&extra.source||MASTER_VERSION),requestId:'own649-'+Date.now()};
      fr.__happyadOwnerOpenRequestedV649=true;
      try{
        var api=fr.contentWindow.HappyProfileOwnerV649;
        if(api&&typeof api.show==='function')api.show(detail);
        else fr.contentWindow.postMessage(detail,'*');
      }catch(_direct){try{fr.contentWindow.postMessage(detail,'*');}catch(_m){}}
      return true;
    }catch(_e){return false;}
  }
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c;});}
  function showLoader(on){try{var l=loader();if(l)l.classList.remove('on');}catch(_e){}}
  function removeLegacyTapShield(){
    try{var sh=document.getElementById('happyadAppTapShield');if(sh&&sh.parentNode)sh.parentNode.removeChild(sh);}catch(_e){}
  }
  function removePublishTapShieldV889(reason){
    try{
      var st=publishTapShieldStateV889;
      if(st){
        if(st.safetyTimer)clearTimeout(st.safetyTimer);
        if(st.releaseTimer)clearTimeout(st.releaseTimer);
        if(st.onPointerUp)window.removeEventListener('pointerup',st.onPointerUp,true);
        if(st.onPointerCancel)window.removeEventListener('pointercancel',st.onPointerCancel,true);
        if(st.onTouchEnd)window.removeEventListener('touchend',st.onTouchEnd,true);
      }
      var sh=document.getElementById(PUBLISH_TAP_SHIELD_ID_V889);if(sh&&sh.parentNode)sh.parentNode.removeChild(sh);
      publishTapShieldStateV889=null;
      window.__HAPPYAD_PUBLISH_TAP_SHIELD_V889={active:false,reason:String(reason||'remove'),at:Date.now()};
    }catch(_e){}
  }
  function beginPublishTapShieldV889(reason,gestureAlreadyEnded){
    try{
      removePublishTapShieldV889('restart');
      injectSkeletonStyle();
      var sh=document.createElement('div');sh.id=PUBLISH_TAP_SHIELD_ID_V889;sh.setAttribute('aria-hidden','true');
      var st={ended:!!gestureAlreadyEnded,releaseRequested:false,releaseTimer:null,safetyTimer:null,onPointerUp:null,onPointerCancel:null,onTouchEnd:null};
      function swallow(ev){try{if(ev){ev.preventDefault();ev.stopPropagation();if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();}}catch(_e){}}
      ['pointerdown','pointermove','click','dblclick','contextmenu','touchstart','touchmove'].forEach(function(type){sh.addEventListener(type,swallow,{capture:true,passive:false});});
      function ended(ev){
        swallow(ev);st.ended=true;
        if(st.releaseRequested){if(st.releaseTimer)clearTimeout(st.releaseTimer);st.releaseTimer=setTimeout(function(){removePublishTapShieldV889('gesture-ended-ready');},90);}
      }
      st.onPointerUp=ended;st.onPointerCancel=ended;st.onTouchEnd=ended;
      window.addEventListener('pointerup',st.onPointerUp,true);
      window.addEventListener('pointercancel',st.onPointerCancel,true);
      window.addEventListener('touchend',st.onTouchEnd,{capture:true,passive:false});
      (document.body||document.documentElement).appendChild(sh);
      st.safetyTimer=setTimeout(function(){removePublishTapShieldV889('safety-timeout');},6000);
      publishTapShieldStateV889=st;
      window.__HAPPYAD_PUBLISH_TAP_SHIELD_V889={active:true,reason:String(reason||'publish-open'),at:Date.now()};
    }catch(_e){}
  }
  function releasePublishTapShieldV889(reason){
    try{
      var st=publishTapShieldStateV889;if(!st)return;st.releaseRequested=true;
      if(st.ended){if(st.releaseTimer)clearTimeout(st.releaseTimer);st.releaseTimer=setTimeout(function(){removePublishTapShieldV889(reason||'publish-ready');},48);}
      else{if(st.releaseTimer)clearTimeout(st.releaseTimer);st.releaseTimer=setTimeout(function(){removePublishTapShieldV889((reason||'publish-ready')+'-hold-fallback');},550);}
    }catch(_e){}
  }

  function beginNavGate(page,url){
    try{
      if(pendingNavTimer){clearTimeout(pendingNavTimer);pendingNavTimer=null;}
      pendingNav={page:String(page||''),url:rootUrl(url||''),t:Date.now()};
      window.__HAPPYAD_NAV_PENDING_UNTIL=Date.now()+NAV_GATE_MS;
      window.__HAPPYAD_NAV_PENDING_TARGET=pendingNav.page+'|'+pendingNav.url;
      removeLegacyTapShield();
      pendingNavTimer=setTimeout(function(){releaseNavGate('safe-timeout');},NAV_GATE_MS);
    }catch(_e){}
  }
  function releaseNavGate(reason){
    try{if(pendingNavTimer){clearTimeout(pendingNavTimer);pendingNavTimer=null;}}catch(_t){}
    try{pendingNav=null;}catch(_p){}
    try{window.__HAPPYAD_NAV_PENDING_UNTIL=0;window.__HAPPYAD_NAV_PENDING_TARGET='';window.__HAPPYAD_NAV_PENDING_RELEASE_REASON=String(reason||'release');}catch(_w){}
    removeLegacyTapShield();
    try{if(window.HappyOverlayMasterV615)window.HappyOverlayMasterV615.schedule('nav-release-'+String(reason||''));}catch(_o){}
  }
  function navBusy(){
    try{
      if(!pendingNav)return false;
      if((Date.now()-Number(pendingNav.t||0))>NAV_GATE_MS){releaseNavGate('stale');return false;}
      return true;
    }catch(_e){return false;}
  }
  function samePendingTarget(page,url){
    try{return !!(pendingNav&&String(pendingNav.page||'')===String(page||'')&&rootUrl(pendingNav.url||'')===rootUrl(url||''));}catch(_e){return false;}
  }
  function videoDirect(){return document.getElementById(VIDEO_DIRECT_ID);}
  function readJsonStore(store,k){try{return JSON.parse(store.getItem(k)||'null');}catch(_e){return null;}}
  function videoPostIdFromUrl(url){try{var u=new URL(rootUrl(url),location.href);return String(u.searchParams.get('post')||u.searchParams.get('id')||'').trim();}catch(_e){var m=String(url||'').match(/[?&](?:post|id)=([^&#]+)/);return m?decodeURIComponent(m[1]):'';}}
  function listFromAny(v){try{if(!v)return [];if(Array.isArray(v))return v;if(Array.isArray(v.list))return v.list;if(Array.isArray(v.posts))return v.posts;if(Array.isArray(v.items))return v.items;}catch(_e){}return [];}
  function readVideoDirectList(){
    var out=[];
    try{out=out.concat(listFromAny(readJsonStore(sessionStorage,'HAPPYAD_FAST_OPEN_VIDEO_V1')));}catch(_e){}
    try{out=out.concat(listFromAny(readJsonStore(localStorage,'HAPPYAD_FAST_OPEN_VIDEO_V1')));}catch(_e){}
    try{out=out.concat(listFromAny(readJsonStore(localStorage,'HAPPYAD_VIDEO_CACHE_STABLE_V1')));}catch(_e){}
    try{out=out.concat(listFromAny(readJsonStore(localStorage,'HAPPYAD_GLOBAL_POSTS_CACHE_V1')));}catch(_e){}
    try{out=out.concat(listFromAny(readJsonStore(localStorage,'HAPPYAD_HOME_POSTS_CACHE_V1')));}catch(_e){}
    return out;
  }
  function videoPosterFromPost(p){
    p=p||{};
    return String(p.posterUrl||p.poster_url||p.thumbnailUrl||p.thumbnail_url||p.coverUrl||p.cover_url||p.imageUrl||p.image_url||p.photoUrl||p.photo_url||p.homePosterUrl||p.home_poster_url||p.homeThumbUrl||p.home_thumb_url||p.cachedThumb||p.cached_thumb||p.thumb||p.thumb_url||'').trim();
  }
  function videoPublicUrlFromPath(path){
    path=String(path||'').trim();
    if(!path)return '';
    if(/^https?:\/\//i.test(path)||/^blob:/i.test(path)||/^data:/i.test(path))return path;
    path=path.replace(/^\/+/, '').replace(/^happyad-media\//,'');
    var base=String(window.HAPPYAD_SUPABASE_URL||'').replace(/\/+$/,'');
    return base+'/storage/v1/object/public/happyad-media/'+encodeURI(path);
  }
  function videoMediaFromPost(p){
    p=p||{};
    var src=String(p.videoUrl||p.video_url||p.mediaUrl||p.media_url||p.homeMediaUrl||p.home_media_url||p.url||p.src||'').trim();
    if(src)return videoPublicUrlFromPath(src);
    return videoPublicUrlFromPath(p.mediaPath||p.media_path||p.path||'');
  }
  function videoDirectPostForUrl(url){
    var pid=videoPostIdFromUrl(url);
    if(!pid)return null;
    var list=readVideoDirectList(), found=null;
    for(var i=0;i<list.length;i++){
      var p=list[i]||{};
      var id=String(p.id||p.post_id||p.happyadPostId||'').trim();
      var kind=String(p.kind||p.type||p.mediaType||p.media_type||'').toLowerCase();
      var media=String(p.videoUrl||p.video_url||p.mediaUrl||p.media_url||p.homeMediaUrl||p.home_media_url||p.mediaPath||p.media_path||'').toLowerCase();
      var isVid=kind.indexOf('video')>=0||/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(media)||String(p.__from_video||'')==='1';
      if(!isVid)continue;
      if(id&&id===pid){found=p;break;}
    }
    return found||null;
  }
  function videoDirectFirstCachedPostV873(){
    try{
      var list=readVideoDirectList(),firstVideo=null;
      for(var i=0;i<list.length;i++){
        var p=list[i]||{};
        var kind=String(p.kind||p.type||p.mediaType||p.media_type||'').toLowerCase();
        var media=String(p.videoUrl||p.video_url||p.mediaUrl||p.media_url||p.homeMediaUrl||p.home_media_url||p.mediaPath||p.media_path||'').toLowerCase();
        var isVideo=kind.indexOf('video')>=0||/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(media)||String(p.__from_video||'')==='1';
        if(!isVideo)continue;
        if(!firstVideo)firstVideo=p;
        if(videoPosterFromPost(p))return p;
      }
      return firstVideo;
    }catch(_e){return null;}
  }
  function ensureVideoDirect(){
    try{
      injectSkeletonStyle();
      var root=ensureShell(); if(!root)return null;
      var d=videoDirect();
      if(!d){d=document.createElement('div');d.id=VIDEO_DIRECT_ID;d.setAttribute('aria-hidden','true');root.appendChild(d);}
      return d;
    }catch(_e){return null;}
  }
  function showVideoDirect(url,on){
    try{
      var d=ensureVideoDirect(); if(!d)return false;
      if(!on){d.classList.remove('on');d.innerHTML='';d.setAttribute('aria-hidden','true');return false;}
      var hasSpecific=hasPost(url);
      /* V873 : l'ouverture centrale réutilise le premier poster vidéo déjà présent
         dans les caches Accueil/Vidéos. Même pendant un démarrage froid, le clic ne
         découvre donc plus le fond noir brut de l'iframe. */
      var p=videoDirectPostForUrl(url)||(!hasSpecific?videoDirectFirstCachedPostV873():null);
      try{var root=ensureShell();if(root){root.classList.add('on');root.setAttribute('aria-hidden','false');}document.body.classList.add('happyadAppOpen');}catch(_r){}
      var poster=p?videoPosterFromPost(p):'';
      var title=String((p&&(p.title||p.desc||p.description))||(hasSpecific?'Vidéo Fyblic':'Vidéos Fyblic')).trim();
      var author=String(p&&(p.creatorName||p.display_name||p.creator_name||p.author||p.name)||'').trim();
      d.className='on hasFrame'+(poster?'':' noPoster')+(hasSpecific?' hasSpecific':' generalVideo');
      d.setAttribute('aria-hidden','false');
      d.innerHTML='<div class="haVidFrame '+(poster?'':'noPoster')+'">'+(poster?'<img src="'+esc(poster)+'" alt="">':'')+'</div><div class="haVidFade"></div><div class="haVidCenter" aria-label="Ouverture vidéo"></div><div class="haVidBottom"><div class="haVidTitle"'+(title?' title="'+esc(title)+'"':'')+'></div><div class="haVidMeta"'+(author?' title="'+esc(author)+'"':'')+'></div></div>';
      return true;
    }catch(_e){return false;}
  }
  function nativeReplaceStateV927(value){try{return History.prototype.replaceState.call(history,value,'',location.href);}catch(_e){try{return history.replaceState(value,'',location.href);}catch(_x){}}}
  function nativePushStateV927(value){try{return History.prototype.pushState.call(history,value,'',location.href);}catch(_e){return false;}}
  function nativeGoV927(delta){try{return History.prototype.go.call(history,Number(delta)||0);}catch(_e){return false;}}
  function canonicalDepthV927(value){var n=Number(value&&value[NAV_DEPTH_KEY_V927]);return isFinite(n)&&n>=0?Math.floor(n):-1;}
  function internalDepthV927(value){var n=Number(value&&value[INTERNAL_DEPTH_KEY_V927]);return isFinite(n)&&n>0?Math.floor(n):0;}
  function isCanonicalStateV927(value){return !!(value&&value[NAV_FLAG]&&canonicalDepthV927(value)>=0&&value.view);}
  function state(page,url,meta){
    meta=meta||{};
    var s={};s[NAV_FLAG]=true;s.view=page||'home';s.url=rootUrl(url||pages[page]||'index.html');s.ts=Date.now();
    s[NAV_DEPTH_KEY_V927]=Math.max(0,Number(meta.depth!=null?meta.depth:navDepthV927)||0);
    s[NAV_ENTRY_KEY_V927]=String(meta.entry||('v927-'+Date.now()+'-'+(++navEntrySeqV927)));
    s[NAV_SOURCE_KEY_V927]=String(meta.source||MASTER_VERSION);
    s[INTERNAL_DEPTH_KEY_V927]=0;
    return s;
  }
  function ensureBaseState(){
    try{
      var s=history.state;
      if(isCanonicalStateV927(s)){
        bootHadCanonicalV927=true;
        navDepthV927=canonicalDepthV927(s);
        return s;
      }
      bootHadCanonicalV927=false;
      navDepthV927=0;
      var home=state('home','index.html',{depth:0,source:'fresh-root-v927'});
      nativeReplaceStateV927(home);
      return home;
    }catch(_e){return null;}
  }
  function currentNavState(){try{var s=history.state;return s&&s[NAV_FLAG]?s:null;}catch(_e){return null;}}
  function sameRouteV927(value,page,url){
    if(!value||!value.view)return false;
    var fromPage=String(value.view),toPage=String(page||'home');if(fromPage!==toPage)return false;
    var fromUrl=rootUrl(value.url||pages[fromPage]||'index.html'),toUrl=rootUrl(url||pages[toPage]||'index.html');
    if(toPage==='profile_public'){
      var fromUid=profileUidFromUrl(fromUrl),toUid=profileUidFromUrl(toUrl);
      if(fromUid&&toUid)return fromUid===toUid;
    }
    if((toPage==='profile'||toPage==='video'||toPage==='message'||toPage==='publish')&&pathOf(fromUrl)===pathOf(toUrl))return true;
    return fromUrl===toUrl;
  }
  function rememberReloadRouteV16ZH(page,url){
    try{
      var nr=normalizeRouteForOpen(page,url);
      page=nr.view;url=nr.url;
      var data={view:page,url:url,t:Date.now(),version:MASTER_VERSION};
      sessionStorage.setItem(RESTORE_KEY_V16ZH,JSON.stringify(data));
      sessionStorage.setItem('HAPPYAD_ACTIVE_APP_VIEW',page);
      sessionStorage.setItem('HAPPYAD_LAST_APP_URL',url);
    }catch(_e){}
  }
  function readReloadRouteV16ZH(){
    /* V927 : un nouveau lancement commence toujours sur A (Accueil). Les clés de
       session anciennes ne recréent plus artificiellement B ou C comme racine.
       Seul un rechargement d'une véritable entrée canonique peut restaurer sa vue. */
    if(!bootHadCanonicalV927)return null;
    try{
      var s=currentNavState();
      if(s&&s.view&&String(s.view)!=='home'){var hs=normalizeRouteForOpen(String(s.view),s.url||pages[s.view]||'index.html');if(!hs.invalidPublic)return {view:hs.view,url:hs.url,source:'history-state'};}
      if(isCanonicalStateV927(s)&&String(s.view)==='home')return null;
    }catch(_hs){}
    try{
      var raw=sessionStorage.getItem(RESTORE_KEY_V16ZH);
      var r=raw?JSON.parse(raw):null;
      if(r&&r.view&&String(r.view)!=='home'){
        var rr=normalizeRouteForOpen(String(r.view),r.url||pages[r.view]||'index.html');
        if(!rr.invalidPublic&&(pageOf(rr.url,rr.view)===rr.view||pages[rr.view]))return {view:rr.view,url:rr.url,source:'session-route'};
      }
    }catch(_r){}
    try{
      var p=String(sessionStorage.getItem('HAPPYAD_ACTIVE_APP_VIEW')||'home');
      var sr=normalizeRouteForOpen(p,sessionStorage.getItem('HAPPYAD_LAST_APP_URL')||pages[p]||'index.html');
      if(sr.view&&sr.view!=='home'&&!sr.invalidPublic&&(pageOf(sr.url,sr.view)===sr.view||pages[sr.view]))return {view:sr.view,url:sr.url,source:'session-active'};
    }catch(_a){}
    return null;
  }
  function routeFromLocationV16ZH(){
    try{
      var u=new URL(location.href);
      var app=String(u.searchParams.get('app')||'').trim().toLowerCase();
      var hash=String(u.hash||'').replace(/^#/,'').trim().toLowerCase();
      var key=app||hash;
      if(!key)return null;
      if(key==='video'||key==='videos'||key==='vidéos')return {view:'video',url:'modules/video.html',source:'url'};
      if(key==='photo'||key==='photos')return {view:'photo',url:'modules/photo.html',source:'url'};
      if(key==='message'||key==='messages')return {view:'message',url:'modules/message-center.html?mode=inbox&source=url&v=1026-avatar-cover',source:'url'};
      if(key==='profile'||key==='profil'||key==='myprofile')return {view:'profile',url:'modules/my-profile.html',source:'url'};
      if(key==='publish'||key==='publier')return {view:'publish',url:'modules/publish.html',source:'url'};
      if(key==='map'||key==='carte')return {view:'map',url:'modules/map.html',source:'url'};
    }catch(_e){}
    return null;
  }
  function updateState(page,url){
    activePage=page||'home';activeUrl=rootUrl(url||pages[activePage]||'index.html');
    rememberReloadRouteV16ZH(activePage,activeUrl);
    try{if(window.HappyState)HappyState.route(activePage,{url:activeUrl},MASTER_VERSION);}catch(_e){}
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_CONNECTION_SURFACE_CHANGE_V869',{detail:{page:activePage,url:activeUrl,at:Date.now()}}));}catch(_surface){}
  }
  var VISITOR_DOCK_LOCK_CLASS_V854R3='happyadVisitorProfileNoDockV854R3';
  var visitorDockGuardV854R3=null;
  function visitorDockElementV854R3(){return document.getElementById('happyadMainDockV585')||document.querySelector('.bottom.happyadMainDockV585');}
  function applyVisitorDockLockV854R3(on,reason){
    try{
      on=!!on;
      var html=document.documentElement,body=document.body,dock=visitorDockElementV854R3();
      if(html)html.classList.toggle(VISITOR_DOCK_LOCK_CLASS_V854R3,on);
      if(body){body.classList.toggle(VISITOR_DOCK_LOCK_CLASS_V854R3,on);body.toggleAttribute('data-happyad-visitor-profile-open-v854r3',on);}
      if(dock){
        if(on){
          dock.hidden=true;dock.setAttribute('aria-hidden','true');dock.setAttribute('data-happyad-visitor-dock-locked-v854r3',String(reason||'visitor'));
          dock.style.setProperty('display','none','important');dock.style.setProperty('visibility','hidden','important');dock.style.setProperty('opacity','0','important');dock.style.setProperty('pointer-events','none','important');
        }else{
          dock.hidden=false;dock.removeAttribute('aria-hidden');dock.removeAttribute('data-happyad-visitor-dock-locked-v854r3');
          dock.style.removeProperty('display');dock.style.removeProperty('visibility');dock.style.removeProperty('opacity');dock.style.removeProperty('pointer-events');
        }
      }
      if(on&&dock&&!visitorDockGuardV854R3&&window.MutationObserver){
        visitorDockGuardV854R3=new MutationObserver(function(){
          try{if(document.documentElement.classList.contains(VISITOR_DOCK_LOCK_CLASS_V854R3)){
            var d=visitorDockElementV854R3();if(d&&(!d.hidden||d.style.getPropertyValue('display')!=='none'))applyVisitorDockLockV854R3(true,'mutation-guard');
          }}catch(_e){}
        });
        visitorDockGuardV854R3.observe(dock,{attributes:true,attributeFilter:['style','hidden','class','aria-hidden']});
      }
      if(!on&&visitorDockGuardV854R3){try{visitorDockGuardV854R3.disconnect();}catch(_e){}visitorDockGuardV854R3=null;}
    }catch(_e){}
  }
  window.HappyVisitorDockLockV854R3={set:applyVisitorDockLockV854R3};
  function clearBottomVideoPressed(){
    try{document.querySelectorAll('.bottom .nav').forEach(function(n){n.classList.remove('active','happyadTapOrange','happyadBottomPressedV504','happyadVideoOpeningV16R');});}catch(_e){}
  }
  function setNavActive(page,url){
    try{
      page=String(page||'home');
      document.querySelectorAll('.bottom .nav').forEach(function(n){n.classList.remove('active');});
      var visible=(page==='home'||page==='profile'||page==='video'||page==='message');
      applyVisitorDockLockV854R3(page==='profile_public','set-nav-active-'+page);
      if(document.body){document.body.classList.toggle('happyadMainDockVisible',visible);document.body.classList.toggle('happyadPublishFullscreenV586',page==='publish');document.body.classList.toggle('happyadParentAppLockedV604',visible&&page!=='home');document.body.setAttribute('data-happyad-main-page',page);}try{document.documentElement.classList.toggle('happyadParentAppLockedV604',visible&&page!=='home');}catch(_lock){}
      var key='';
      if(page==='home')key='home';
      else if(page==='video')key='video';
      else if(page==='message')key='message';
      else if(page==='profile'||page==='profile_public')key='profile';
      else if(page==='publish')key='publish';
      var button=key?document.querySelector('.bottom [data-happyad-main-nav="'+key+'"]'):null;
      if(button)button.classList.add('active');
      try{window.dispatchEvent(new CustomEvent('HAPPYAD_NAV_CHANGED_V586',{detail:{page:page,url:rootUrl(url||pages[page]||'index.html'),dockVisible:visible}}));}catch(_ev){}
    }catch(_e){}
  }
  function pauseFrame(fr,reason){
    try{
      if(!fr)return;
      var why=reason||MASTER_VERSION;
      try{fr.contentWindow.postMessage({type:'HAPPYAD_APP_FRAME_HIDDEN',reason:why,source:MASTER_VERSION},'*');}catch(_h){}
      try{fr.contentWindow.postMessage({type:'HAPPYAD_PAUSE_ALL_MEDIA',reason:why},'*');}catch(_m){}
      try{fr.contentWindow.postMessage({type:'HAPPYAD_STOP_MEDIA',reason:why},'*');}catch(_s){}
      try{fr.setAttribute('aria-hidden','true');fr.setAttribute('inert','');}catch(_a){}
    }catch(_e){}
  }
  function resumeFrame(fr,page,url,source){
    try{
      if(!fr)return;
      try{fr.removeAttribute('inert');fr.setAttribute('aria-hidden','false');}catch(_a){}
      var msg={type:'HAPPYAD_APP_FRAME_VISIBLE',page:page,url:rootUrl(url),source:source||MASTER_VERSION};
      if(page==='publish'){try{msg.publishMode=normalizePublishModeV885(fr.getAttribute('data-happyad-publish-mode-v885')||'publish');msg.mode=msg.publishMode;}catch(_pm){}}
      /* V756 : Mon profil reçoit un seul signal visible. Le lifecycle interne
         reprend alors ses workers et émet lui-même son événement RESUME, sans
         double rafraîchissement du DOM. */
      if(page!=='profile'){
        try{fr.contentWindow.postMessage({type:'HAPPYAD_MODULE_RESUME',page:page,url:rootUrl(url),source:source||MASTER_VERSION},'*');}catch(_r){}
      }
      try{fr.contentWindow.postMessage(msg,'*');}catch(_v){}
    }catch(_e){}
  }
  function isProfilePage(page){return page==='profile'||page==='profile_public';}
  function isNoSkeletonPage(page,url){
    page=String(page||'').trim();
    url=rootUrl(url||pages[page]||'');
    /* V854R2 : chaque profil possède son propre squelette interne. Le parent
       n'ajoute donc aucun second écran de chargement, notamment pour le visiteur. */
    return true;
  }
  function isSoftOpenPage(page,url){return page&&page!=='home'&&!isNoSkeletonPage(page,url);}
  function isHeavySoftPage(page){return page==='profile'||page==='profile_public'||page==='publish'||page==='map'||page==='video'||page==='photo'||page==='message';}
  function isDirectMediaPage(page){return page==='video';}
  /* Les pages contextuelles restent à la demande; les quatre onglets principaux sont préparés une seule fois par V625. */
  function prefetchUrl(url){
    try{window.__HAPPYAD_LAZY_PREFETCH_SKIPPED_V614__=rootUrl(url||'');}catch(_e){}
    return false;
  }
  function isPersistentMainPage(page){
    page=String(page||'');
    return page==='video'||page==='message'||page==='profile'||page==='profile_public'||page==='publish';
  }
  function persistentMainUrl(page){
    page=String(page||'');
    if(page==='video')return 'modules/video.html?v=986-base-video-text';
    if(page==='message')return 'modules/message-center.html?mode=inbox&source=v738-assistance&v=1026-avatar-cover';
    if(page==='profile')return 'modules/my-profile.html?v=1001-profile-identity-scale';
    if(page==='profile_public')return VISITOR_PROFILE_PRELOAD_URL_V601;
    if(page==='publish')return 'modules/publish.html?v=1122-publication-session-renewed';
    return pages[page]||'index.html';
  }
  function ownerAuthUidHintV855R23(){
    try{
      if(localStorage.getItem('HAPPYAD_SESSION_ACTIVE')!=='1')return '';
      return String(localStorage.getItem('HAPPYAD_AUTH_UID')||'').trim();
    }catch(_e){return '';}
  }
  function preloadFrame(page,url){
    try{
      page=String(page||'').trim();
      if(!isPersistentMainPage(page)||page==='profile_public')return false;
      /* V855R23 : ne jamais précharger Mon profil avec une session invitée. Une
         frame invitée persistante était la cause du profil bloqué après connexion. */
      if(page==='profile'&&!ownerAuthUidHintV855R23())return false;
      url=rootUrl(url||persistentMainUrl(page));
      var root=ensureShell();if(!root)return false;
      var fr=ensureFrame(page,url);if(!fr)return false;
      if(String(fr.getAttribute('data-happyad-src')||'').trim())return true;
      fr.setAttribute('data-happyad-preloading-v594','1');
      if(page==='profile')fr.setAttribute('data-happyad-owner-light-warmup-v864','1');
      fr.setAttribute('data-happyad-src',url);
      fr.setAttribute('data-happyad-loading','1');
      fr.setAttribute('loading','eager');
      fr.classList.remove('on');
      fr.style.opacity='';fr.style.visibility='';
      fr.setAttribute('aria-hidden','true');fr.setAttribute('inert','');
      fr.src=url;
      try{window.__HAPPYAD_MAIN_PAGE_PRELOAD_V625__=window.__HAPPYAD_MAIN_PAGE_PRELOAD_V625__||{};window.__HAPPYAD_MAIN_PAGE_PRELOAD_V625__[page]={started:true,at:Date.now(),url:url,lightWarmup:page==='profile'};}catch(_w){}
      return true;
    }catch(_e){return false;}
  }
  var messageDormantWarmupTimerV876=0;
  var messageDormantWarmupStartedV876=false;
  var messageDormantWarmupLastInteractionV876=Date.now();
  /* V879 point 1 : le premier clic après un vrai redémarrage ne doit plus payer
     la création froide de Messages. La frame prépare seulement son document et
     le cache local au premier créneau calme de l'Accueil. Le travail connecté
     (session Supabase, Realtime, présence) reste bloqué jusqu'à l'affichage réel. */
  var MESSAGE_WARMUP_QUIET_MS_V879=160;
  var MESSAGE_WARMUP_BOOT_DELAY_MS_V879=180;
  function messageWarmupScrollActiveV876(){
    try{
      var global=window.HappyadGlobalScrollCoordinatorV868;
      if(global&&typeof global.isActive==='function'&&global.isActive())return true;
    }catch(_global){}
    try{
      var homePriority=window.HappyadHomeScrollPriorityV863;
      if(homePriority&&typeof homePriority.isActive==='function'&&homePriority.isActive())return true;
    }catch(_home){}
    return false;
  }
  function messageWarmupConnectionBusyV876(){
    try{
      var coordinator=window.HappyadConnectionWorkCoordinatorV869;
      var status=coordinator&&typeof coordinator.status==='function'&&coordinator.status();
      var lastAt=Number(status&&status.stats&&status.stats.lastAt||0)||0;
      return !!(status&&(Number(status.queued||0)>0||(lastAt&&Date.now()-lastAt<700)));
    }catch(_e){return false;}
  }
  function messageWarmupSurfaceBlockedV876(){
    try{
      var body=document.body,html=document.documentElement;
      var classes=['happyadInternalScreenOpenV591','happyadNotificationInternalV591','haHomePhotoFsLock','happyadPhotoSurfaceV591','modal-open','story-open','fullscreen-open','happyadShareOpen'];
      for(var i=0;i<classes.length;i++)if((body&&body.classList.contains(classes[i]))||(html&&html.classList.contains(classes[i])))return true;
    }catch(_e){}
    return false;
  }
  function markMessageWarmupInteractionV876(event){
    messageDormantWarmupLastInteractionV876=Date.now();
    /* Un bouton du dock est une intention de navigation, pas un geste de scroll.
       L'annulation éventuelle appartient à loadFrame(), après acceptation du clic.
       Cela évite de suspendre Messages ou Profil juste avant leur ouverture. */
    try{
      var dockTarget=event&&event.target&&event.target.closest&&event.target.closest('.bottom [data-happyad-main-nav]');
      if(dockTarget){
        window.__HAPPYAD_DOCK_INTENT_V877={page:String(dockTarget.getAttribute('data-happyad-main-nav')||''),at:Date.now()};
        return;
      }
    }catch(_dockIntent){}
    if(!messageDormantWarmupStartedV876)return;
    try{
      var fr=document.getElementById(frameId('message'));
      if(activePage==='home'&&fr&&fr.getAttribute('data-happyad-message-cache-prepare-v875')==='1'&&fr.getAttribute('data-happyad-message-cache-ready-v875')!=='1'){
        cancelMessageCachePreparationV876('home-gesture-interrupt-warmup-v876');
        window.__HAPPYAD_MESSAGE_DORMANT_WARMUP_V876={started:true,ready:false,interrupted:true,at:Date.now(),network:false};
      }
    }catch(_interrupt){}
  }
  function startMessageDormantWarmupV876(){
    try{
      if(messageDormantWarmupStartedV876||document.hidden||activePage!=='home')return false;
      var uid=ownerAuthUidHintV855R23();
      if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uid))return false;
      if(messageWarmupScrollActiveV876()||messageWarmupSurfaceBlockedV876()||Date.now()-messageDormantWarmupLastInteractionV876<MESSAGE_WARMUP_QUIET_MS_V879)return false;
      var page='message',url=rootUrl(persistentMainUrl(page));
      var root=ensureShell();if(!root)return false;
      var fr=ensureFrame(page,url);if(!fr)return false;
      var hasSource=!!String(fr.getAttribute('data-happyad-src')||'').trim();
      if(hasSource&&frameLooksReady(fr,'message')){
        messageDormantWarmupStartedV876=true;
        fr.setAttribute('data-happyad-message-warm-ready-v876','1');
        window.__HAPPYAD_MESSAGE_DORMANT_WARMUP_V876={started:true,ready:true,reused:true,at:Date.now(),url:url,network:false};
        return true;
      }
      messageDormantWarmupStartedV876=true;
      /* Cache local uniquement. La frame compose hors écran sans devenir une
         surface active : pas de classe .on, pas de verrou de scroll, aucun noir. */
      root.classList.remove('on','happyadSkeletonOpen');
      root.classList.add('happyadMessageCachePreparingV876');
      root.setAttribute('aria-hidden','true');
      fr.classList.remove('on');
      fr.setAttribute('data-happyad-message-dormant-warmup-v876','1');
      fr.setAttribute('data-happyad-message-cache-prepare-v875','1');
      fr.setAttribute('data-happyad-message-cache-from-page-v875','home');
      fr.removeAttribute('data-happyad-message-cache-ready-v875');
      fr.removeAttribute('data-happyad-first-render-ready-v623');
      fr.setAttribute('data-happyad-loading','1');
      fr.setAttribute('loading','eager');
      fr.style.opacity='';fr.style.visibility='visible';
      fr.setAttribute('aria-hidden','true');fr.setAttribute('inert','');
      if(!hasSource){
        fr.setAttribute('data-happyad-src',url);
        fr.src=url;
      }else{
        /* V879 : si un scroll avait interrompu une première préparation, la frame
           persistante est réarmée sans rechargement. Le maître Messages repeint son
           cache local et renvoie READY; l'utilisateur ne paie donc plus l'interruption. */
        try{fr.contentWindow&&fr.contentWindow.postMessage({
          type:'HAPPYAD_MESSAGE_CACHE_PREPARE_V875',
          detail:{mode:'inbox',source:'navigation-warmup-rearm-v879'}
        },'*');}catch(_rearm){}
      }
      window.__HAPPYAD_MESSAGE_DORMANT_WARMUP_V876={started:true,ready:false,rearmed:hasSource,at:Date.now(),url:url,network:false};
      return true;
    }catch(_e){messageDormantWarmupStartedV876=false;return false;}
  }
  function scheduleMessageDormantWarmupV876(delay){
    try{
      if(messageDormantWarmupStartedV876)return true;
      clearTimeout(messageDormantWarmupTimerV876);
      var wait=Math.max(90,Number(delay)||MESSAGE_WARMUP_BOOT_DELAY_MS_V879);
      messageDormantWarmupTimerV876=setTimeout(function check(){
        messageDormantWarmupTimerV876=0;
        if(messageDormantWarmupStartedV876)return;
        if(document.hidden||activePage!=='home'||messageWarmupScrollActiveV876()||messageWarmupSurfaceBlockedV876()||Date.now()-messageDormantWarmupLastInteractionV876<MESSAGE_WARMUP_QUIET_MS_V879){
          messageDormantWarmupTimerV876=setTimeout(check,110);
          return;
        }
        if(!startMessageDormantWarmupV876())messageDormantWarmupTimerV876=setTimeout(check,220);
      },wait);
      return true;
    }catch(_e){return false;}
  }
  try{
    ['pointerdown','touchstart','wheel','scroll'].forEach(function(type){window.addEventListener(type,markMessageWarmupInteractionV876,{passive:true,capture:true});});
    window.addEventListener('HAPPYAD_GLOBAL_SCROLL_STATE_CHANGE_V868',function(event){if(event&&event.detail&&event.detail.active)markMessageWarmupInteractionV876();},true);
  }catch(_warmupSignals){}
  var ownerProfileWarmupTimerV864=0;
  /* V880 point 2 : Mon profil adopte le même premier accès froid que Messages.
     Sa frame persistante est préparée très tôt dès que l'Accueil est calme. Le
     moteur propriétaire reste en warmOnly : cache local/identité + première page
     locale seulement; Realtime, pagination réseau et compteurs secondaires restent
     suspendus tant que la frame n'est pas réellement visible. */
  var OWNER_PROFILE_WARMUP_BOOT_DELAY_MS_V880=220;
  function scheduleOwnerProfileWarmupV864(delay){
    try{
      clearTimeout(ownerProfileWarmupTimerV864);
      var earliest=Date.now()+Math.max(180,Number(delay)||OWNER_PROFILE_WARMUP_BOOT_DELAY_MS_V880);
      function check(){
        ownerProfileWarmupTimerV864=0;
        try{
          if(document.hidden){ownerProfileWarmupTimerV864=setTimeout(check,420);return;}
          if(activePage!=='home'){ownerProfileWarmupTimerV864=setTimeout(check,240);return;}
          /* Au boot, Auth peut confirmer la session après le routeur. Ne pas créer
             de profil invité; l'événement HAPPYAD_AUTH_STATE_V595 relancera ce
             warmup dès que l'UID propriétaire est réellement disponible. */
          if(!ownerAuthUidHintV855R23())return;
          var existing=document.getElementById(frameId('profile'));
          if(existing&&String(existing.getAttribute('data-happyad-src')||'').trim())return;
          var priority=window.HappyadHomeScrollPriorityV863;
          var global=window.HappyadGlobalScrollCoordinatorV868;
          if(Date.now()<earliest
             ||(priority&&typeof priority.isActive==='function'&&priority.isActive())
             ||(global&&typeof global.isActive==='function'&&global.isActive())){
            ownerProfileWarmupTimerV864=setTimeout(check,110);return;
          }
          preloadFrame('profile',persistentMainUrl('profile'));
        }catch(_e){ownerProfileWarmupTimerV864=setTimeout(check,220);}
      }
      ownerProfileWarmupTimerV864=setTimeout(check,Math.max(110,Number(delay)||OWNER_PROFILE_WARMUP_BOOT_DELAY_MS_V880));
      return true;
    }catch(_e){return false;}
  }
  var videoDormantWarmupTimerV883=0;
  var VIDEO_WARMUP_BOOT_DELAY_MS_V883=320;
  var VIDEO_WARMUP_QUIET_MS_V883=220;
  function preloadVideoFrameV624(){
    try{
      var page='video',url=persistentMainUrl(page),root=ensureShell();
      if(!root)return false;
      var fr=ensureFrame(page,url);if(!fr)return false;
      if(String(fr.getAttribute('data-happyad-src')||'').trim())return true;
      /* V883 : préparation froide de la Centrale uniquement depuis les caches
         locaux. Le module reconnaît cet attribut et s'arrête avant Supabase,
         Realtime et synchronisation profil tant que Vidéos n'est pas ouverte. */
      fr.setAttribute('data-happyad-video-dormant-warmup-v883','1');
      fr.setAttribute('data-happyad-preloading-v594','1');
      fr.setAttribute('data-happyad-src',rootUrl(url));
      fr.setAttribute('data-happyad-loading','1');
      fr.setAttribute('loading','eager');
      fr.classList.remove('on');
      fr.style.opacity='';fr.style.visibility='';
      fr.setAttribute('aria-hidden','true');fr.setAttribute('inert','');
      fr.src=rootUrl(url);
      try{window.__HAPPYAD_VIDEO_WARMUP_V624__={started:true,ready:false,dormant:true,network:false,at:Date.now(),url:url};}catch(_w){}
      return true;
    }catch(_e){return false;}
  }
  function scheduleVideoWarmupV624(delay){
    try{
      clearTimeout(videoDormantWarmupTimerV883);
      var wait=Math.max(180,Number(delay)||VIDEO_WARMUP_BOOT_DELAY_MS_V883);
      var earliest=Date.now()+wait;
      function check(){
        videoDormantWarmupTimerV883=0;
        try{
          if(document.hidden){videoDormantWarmupTimerV883=setTimeout(check,420);return;}
          if(activePage!=='home')return;
          var existing=document.getElementById(frameId('video'));
          if(existing&&String(existing.getAttribute('data-happyad-src')||'').trim())return;
          var priority=window.HappyadHomeScrollPriorityV863;
          var global=window.HappyadGlobalScrollCoordinatorV868;
          var scrollActive=(priority&&typeof priority.isActive==='function'&&priority.isActive())||
                           (global&&typeof global.isActive==='function'&&global.isActive());
          if(Date.now()<earliest||scrollActive||messageWarmupSurfaceBlockedV876()||
             Date.now()-messageDormantWarmupLastInteractionV876<VIDEO_WARMUP_QUIET_MS_V883){
            videoDormantWarmupTimerV883=setTimeout(check,120);return;
          }
          preloadVideoFrameV624();
        }catch(_e){videoDormantWarmupTimerV883=setTimeout(check,240);}
      }
      videoDormantWarmupTimerV883=setTimeout(check,wait);
      return true;
    }catch(_e){return false;}
  }

  function scheduleMainTabsPreloadV594(){
    try{
      if(window[MAIN_TABS_PRELOAD_FLAG]){
        /* V883 : si le tout premier créneau a été manqué parce que l'utilisateur
           a quitté l'Accueil très vite, un retour Accueil réarme uniquement les
           warmups encore absents. */
        scheduleMessageDormantWarmupV876(MESSAGE_WARMUP_BOOT_DELAY_MS_V879);
        scheduleOwnerProfileWarmupV864(OWNER_PROFILE_WARMUP_BOOT_DELAY_MS_V880);
        scheduleVideoWarmupV624(VIDEO_WARMUP_BOOT_DELAY_MS_V883);
        return true;
      }
      window[MAIN_TABS_PRELOAD_FLAG]=true;
      window.__HAPPYAD_MAIN_TABS_DIRECT_V625__=true;
      /* V879 point 1 : Messages reste un préchauffage dormant/local uniquement.
         Il démarre très tôt au premier repos physique de l'Accueil. On ne le bloque
         plus derrière le coordinateur réseau de l'Accueil, car son boot caché
         s'arrête avant Supabase/Realtime. Le scroll garde néanmoins priorité absolue. */
      scheduleMessageDormantWarmupV876(MESSAGE_WARMUP_BOOT_DELAY_MS_V879);
      scheduleOwnerProfileWarmupV864(OWNER_PROFILE_WARMUP_BOOT_DELAY_MS_V880);
      scheduleVideoWarmupV624(VIDEO_WARMUP_BOOT_DELAY_MS_V883);
      return true;
    }catch(_e){return false;}
  }
  function scheduleSoftPreload(){
    try{window[PREFETCH_FLAG]=true;window.__HAPPYAD_SOFT_PRELOAD_DISABLED_V614__=true;}catch(_e){}
    return false;
  }
  function hideOtherFrames(root,fr,page){
    try{
      if(!root)return;
      root.querySelectorAll('.happyadAppFrame').forEach(function(x){
        if(x!==fr){pauseFrame(x,'switch-to-'+page);x.classList.remove('on');x.style.opacity='';x.style.visibility='';}
      });
    }catch(_e){}
  }
  function minSkeletonMs(page){
    page=String(page||'');
    if(page==='profile_public')return 0;
    return 0;
  }
  function maxSkeletonMs(page){
    page=String(page||'');
    /* V625 : le Profil visiteur conserve sa garde interne et ne doit jamais être
       révélé au milieu du changement d'UID. Le squelette reste jusqu'au vrai rendu. */
    if(page==='profile_public')return 12000;
    if(page==='profile')return 12000;
    if(page==='message')return 12000;
    if(page==='video')return 0;
    return 4200;
  }
  function frameLooksReady(fr,page){
    try{
      if(fr&&fr.getAttribute('data-happyad-first-render-ready-v623')==='1')return true;
      var d=fr&&fr.contentDocument;
      if(!d||!d.body)return false;
      if(page==='publish'){
        var publishHtml=d.documentElement;
        return !!(publishHtml&&(
          publishHtml.getAttribute('data-happyad-publish-ready-v936')==='1'||
          publishHtml.getAttribute('data-happyad-publish-failed-v936')==='1'
        ));
      }
      if(d.readyState==='loading')return false;
      var txt=String(d.body.innerText||'').replace(/\s+/g,' ').trim().toLowerCase();
      if(!txt&&!(d.images&&d.images.length)&&!d.querySelector('video,.reel,#videoFeed,.videoFeed,.centralVideo,.happyadVideo'))return false;
      if(page==='profile'||page==='profile_public'){
        if(page==='profile'&&fr.getAttribute('data-happyad-profile-shell-ready-v877')==='1')return true;
        var html=d.documentElement;
        var gate=!!(html&&html.classList&&html.classList.contains('haProfileBootGateV621C'));
        var masterReady=!!(html&&html.classList&&html.classList.contains('haProfileReadyV621C'));
        var signaled=fr.getAttribute('data-happyad-first-render-ready-v623')==='1';
        return !gate&&(masterReady||signaled);
      }
      if(page==='message'){
        var htmlMessage=d.documentElement;
        return fr.getAttribute('data-happyad-message-cache-ready-v875')==='1'||
          !!(htmlMessage&&htmlMessage.getAttribute('data-happyad-message-cache-ready-v875')==='1');
      }
      if(page==='video'){
        /* V16R: la centrale vidéo doit apparaître vite. On attend seulement que le document ne soit plus vide,
           pas que toute la liste Supabase soit prête. La frame/play reste au-dessus pendant ce court délai. */
        var hasVideoNode=!!(d.querySelector('video,.reel,#videoFeed,.videoFeed,.centralVideo,.happyadVideo,#videoList,#videoRoot,.video-list'));
        var hasBody=txt.length>12 || hasVideoNode || !!(d.body&&d.body.children&&d.body.children.length>1);
        return hasBody;
      }
      return true;
    }catch(_e){return page==='publish'?false:true;}
  }
  function shouldHoldSkeleton(fr,page,source){
    try{
      if(!fr||fr.getAttribute('data-happyad-defer-visible')!=='1')return false;
      var started=Number(fr.getAttribute('data-happyad-skeleton-start')||0)||Date.now();
      var elapsed=Date.now()-started;
      /* V876 : aucun plafond ne peut révéler une frame vide. Le signal enfant est
         émis même sans IndexedDB et reste donc l'unique preuve de peinture. */
      if(page==='message'&&fr.getAttribute('data-happyad-message-cache-prepare-v875')==='1'){
        return !frameLooksReady(fr,'message');
      }
      /* V936 : Publication n'est jamais exposée sur un simple événement load.
         Son moteur envoie READY après la pose de tous les gestionnaires. En cas
         d'échec réel, son écran Réessayer envoie FAILED et devient la surface sûre. */
      if(page==='publish')return !frameLooksReady(fr,'publish');
      if(elapsed<minSkeletonMs(page))return true;
      if(elapsed<maxSkeletonMs(page)&&!frameLooksReady(fr,page))return true;
    }catch(_e){}
    return false;
  }
  function centralVideoHasStarted(fr){
    try{
      var d=fr&&fr.contentDocument;if(!d)return false;
      var vids=d.querySelectorAll('video');
      for(var i=0;i<vids.length;i++){
        var v=vids[i];
        if(!v)continue;
        if((v.readyState>=2||v.currentTime>0.06)&&(!v.paused||v.currentTime>0.15))return true;
      }
      if(d.querySelector('.happyadVideoPlaying,.video-playing,.is-playing,.playing video'))return true;
    }catch(_e){}
    return false;
  }
  function holdVideoFrameSafe(fr,url,source){
    try{
      var d=videoDirect();
      if(!d||!d.classList||!d.classList.contains('on')){showVideoDirect(url,false);return;}
      if(fr&&fr.__happyadVideoFrameHoldTimer){clearTimeout(fr.__happyadVideoFrameHoldTimer);fr.__happyadVideoFrameHoldTimer=null;}
      var started=Date.now();
      function hide(reason){
        try{if(fr&&fr.__happyadVideoFrameHoldTimer){clearTimeout(fr.__happyadVideoFrameHoldTimer);fr.__happyadVideoFrameHoldTimer=null;}}catch(_t){}
        try{showVideoDirect(url,false);}catch(_h){}
        try{window.__HAPPYAD_VIDEO_FRAME_HIDDEN__={reason:reason||'hide',t:Date.now(),source:source||''};}catch(_m){}
      }
      function watch(){
        try{
          var cur=videoDirect();
          if(!cur||!cur.classList||!cur.classList.contains('on'))return;
          if(activePage!=='video'){hide('not-video');return;}
          if(centralVideoHasStarted(fr)){hide('central-video-playing');return;}
          /* Fyblic V34: ne pas laisser la couche noire directe bloquer la centrale vidéo.
             Dès que la frame vidéo est prête, on l'affiche; le module vidéo gère son propre chargement. */
          if(Date.now()-started>900&&frameLooksReady(fr,'video')){hide('central-frame-ready-v34');return;}
          if(Date.now()-started>2400){hide('video-direct-short-timeout-v34');return;}
          /* V16T sécurité: la frame protège du noir, mais ne peut plus bloquer toute l'app indéfiniment. */
          if(Date.now()-started>12000){hide('safe-timeout');return;}
          fr.__happyadVideoFrameHoldTimer=setTimeout(watch,260);
        }catch(_e){try{fr.__happyadVideoFrameHoldTimer=setTimeout(watch,420);}catch(_x){}}
      }
      watch();
    }catch(_e){try{showVideoDirect(url,false);}catch(_x){}}
  }
  function centralVideoVisualReadyV873(fr){
    try{
      var d=fr&&fr.contentDocument;if(!d||!d.body)return false;
      var html=d.documentElement;
      if(html&&html.getAttribute('data-happyad-video-visual-ready-v873')==='1')return true;
      var feed=d.getElementById('feed');
      if(!feed)return false;
      return !!feed.querySelector('.reel,.empty');
    }catch(_e){return false;}
  }
  function stopCentralVideoOpeningV873(fr,token,reason){
    try{
      if(!fr||fr.__happyadCentralVideoOpeningTokenV873!==token)return false;
      if(fr.__happyadCentralVideoOpeningWatchV873){clearTimeout(fr.__happyadCentralVideoOpeningWatchV873);fr.__happyadCentralVideoOpeningWatchV873=0;}
      fr.__happyadCentralVideoOpeningTokenV873='';
      showVideoDirect('',false);
      window.__HAPPYAD_CENTRAL_VIDEO_OPENING_V873={reason:String(reason||'ready'),at:Date.now()};
      return true;
    }catch(_e){return false;}
  }
  function cancelMessageCachePreparationV876(reason){
    try{
      var root=shell();
      var fr=document.getElementById(frameId('message'));
      if(root)root.classList.remove('happyadMessageCachePreparingV876','happyadMessageCachePreparingWithinShellV876');
      if(!fr||fr.getAttribute('data-happyad-message-cache-prepare-v875')!=='1')return false;
      try{if(fr.__happyadRevealWatch){clearTimeout(fr.__happyadRevealWatch);fr.__happyadRevealWatch=null;}}catch(_watch){}
      try{if(fr.__happyadLoadWatch){clearTimeout(fr.__happyadLoadWatch);fr.__happyadLoadWatch=null;}}catch(_load){}
      fr.removeAttribute('data-happyad-defer-visible');
      fr.removeAttribute('data-happyad-skeleton-start');
      fr.removeAttribute('data-happyad-message-cache-prepare-v875');
      fr.removeAttribute('data-happyad-message-cache-from-page-v875');
      fr.removeAttribute('data-happyad-message-dormant-warmup-v876');
      fr.classList.remove('on');
      fr.style.opacity='';fr.style.visibility='';
      fr.setAttribute('aria-hidden','true');fr.setAttribute('inert','');
      pauseFrame(fr,reason||'cancel-message-cache-prepare-v876');
      if(root&&activePage==='home'&&!root.querySelector('.happyadAppFrame.on')){
        root.classList.remove('on');root.setAttribute('aria-hidden','true');
      }
      /* V879 : une interruption de geste ne doit pas marquer le warmup comme
         définitivement effectué. On le réarme seulement après retour au repos;
         le coordinateur de scroll garde donc la priorité absolue. */
      if(activePage==='home'&&/home-gesture-interrupt-warmup-v876/i.test(String(reason||''))){
        messageDormantWarmupStartedV876=false;
        scheduleMessageDormantWarmupV876(MESSAGE_WARMUP_BOOT_DELAY_MS_V879);
      }
      return true;
    }catch(_e){return false;}
  }
  function startCentralVideoOpeningV873(fr,url){
    try{
      if(!fr)return false;
      try{if(window.HappyPwaInstallV610&&typeof window.HappyPwaInstallV610.hide==='function')window.HappyPwaInstallV610.hide();}catch(_pwa){}
      if(fr.__happyadCentralVideoOpeningWatchV873){clearTimeout(fr.__happyadCentralVideoOpeningWatchV873);fr.__happyadCentralVideoOpeningWatchV873=0;}
      var token='video873-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
      var started=Date.now();
      fr.__happyadCentralVideoOpeningTokenV873=token;
      showVideoDirect(url,true);
      function watch(){
        try{
          if(fr.__happyadCentralVideoOpeningTokenV873!==token)return;
          if(activePage!=='video'){stopCentralVideoOpeningV873(fr,token,'leave-video');return;}
          if(centralVideoVisualReadyV873(fr)){
            requestAnimationFrame(function(){stopCentralVideoOpeningV873(fr,token,'first-visual');});
            return;
          }
          /* Aucun temps minimal : le poster disparaît au premier rendu utile.
             Le plafond court empêche une couche de chargement persistante si un
             ancien navigateur ne transmet pas le signal visuel. */
          if(Date.now()-started>=720){stopCentralVideoOpeningV873(fr,token,'short-safety');return;}
          fr.__happyadCentralVideoOpeningWatchV873=setTimeout(watch,24);
        }catch(_e){stopCentralVideoOpeningV873(fr,token,'watch-error');}
      }
      fr.__happyadCentralVideoOpeningWatchV873=setTimeout(watch,16);
      return true;
    }catch(_e){try{showVideoDirect(url,false);}catch(_x){}return false;}
  }
  function revealFrame(fr,page,url,source){
    /* V656 : aucun rappel différé d'une ancienne page ne peut reprendre l'écran.
       Ce verrou bloque notamment une frame Vidéo qui termine son chargement après
       le retour du fullscreen photo dans un Profil visiteur. */
    var validMessageCacheRevealV875=page==='message'&&fr&&fr.getAttribute('data-happyad-message-cache-prepare-v875')==='1'&&String(fr.getAttribute('data-happyad-message-cache-from-page-v875')||'')===String(activePage||'');
    if(page&&activePage&&page!==activePage&&!validMessageCacheRevealV875){
      try{
        if(fr){fr.classList.remove('on');fr.setAttribute('aria-hidden','true');fr.setAttribute('inert','');fr.style.opacity='';fr.style.visibility='';pauseFrame(fr,'stale-frame-reveal-blocked-v656-'+page);}
        if(page==='video'){showVideoDirect('',false);blankVideoFrame('stale-video-reveal-v656');}
        if(page==='profile_public')showSkeleton('profile_public',url,false);
      }catch(_stale){}
      return false;
    }
    try{if(fr&&fr.__happyadLoadWatch){clearTimeout(fr.__happyadLoadWatch);fr.__happyadLoadWatch=null;}}catch(_t){}
    try{if(fr&&fr.__happyadRevealWatch){clearTimeout(fr.__happyadRevealWatch);fr.__happyadRevealWatch=null;}}catch(_rt){}
    if(shouldHoldSkeleton(fr,page,source)){
      /* Messages sera rappelé par HAPPYAD_MESSAGE_CACHE_READY_V875. Aucun polling
         et surtout aucune révélation forcée d'un document noir. */
      if(page==='message'&&fr&&fr.getAttribute('data-happyad-message-cache-prepare-v875')==='1')return;
      try{fr.__happyadRevealWatch=setTimeout(function(){revealFrame(fr,page,url,(source||'frame')+'-hold');},160);}catch(_h){}
      return;
    }
    var root=ensureShell();
    if(page==='message'&&fr&&fr.getAttribute('data-happyad-message-cache-prepare-v875')==='1'){
      /* La navigation devient active au même instant où la liste locale déjà
         peinte devient visible. Avant cela, Accueil reste la vraie surface. */
      try{setNavActive(page,url);updateState(page,url);}catch(_messageState){}
    }
    try{root&&root.classList.remove('happyadMessageCachePreparingV876','happyadMessageCachePreparingWithinShellV876');}catch(_messagePreparingClass){}
    hideOtherFrames(root,fr,page);
    try{
      fr.removeAttribute('data-happyad-loading');
      fr.removeAttribute('data-happyad-defer-visible');
      fr.removeAttribute('data-happyad-skeleton-start');
      fr.removeAttribute('data-happyad-message-cache-prepare-v875');
      fr.removeAttribute('data-happyad-message-cache-from-page-v875');
      fr.removeAttribute('data-happyad-message-dormant-warmup-v876');
      fr.removeAttribute('data-happyad-message-warm-ready-v876');
      fr.style.opacity='';
      fr.style.visibility='';
      fr.classList.add('on');
      if(page==='profile')fr.removeAttribute('data-happyad-owner-light-warmup-v864');
      fr.removeAttribute('inert');
      fr.setAttribute('aria-hidden','false');
    }catch(_e){}
    resumeFrame(fr,page,url,source||'frame-visible-v615');
    try{root.classList.add('on');root.setAttribute('aria-hidden','false');}catch(_r){}
    try{document.body.classList.add('happyadAppOpen');}catch(_b){}
    clearBootRestoreMaskV16ZJ('frame-visible-'+String(page||''));
    showSkeleton(page,url,false);
    if(page==='video'&&videoDirect()&&videoDirect().classList.contains('on')){holdVideoFrameSafe(fr,url,source||'frame-visible');}
    else {showVideoDirect(url,false);}
    showLoader(false);
    releaseNavGate('reveal-'+String(source||page||''));
    if(page==='publish')releasePublishTapShieldV889('publish-revealed-v889');
    /* Audit V757 : Mon profil reçoit un seul HAPPYAD_APP_FRAME_VISIBLE.
       Les anciens maîtres internes rafraîchissent sur chaque signal visible ; le
       second signal à +45 ms donnait l'impression d'un rechargement. */
    if(page!=='profile'&&page!=='publish'){try{setTimeout(function(){resumeFrame(fr,page,url,source||MASTER_VERSION);},45);}catch(_m){}}
  }
  function clearVideoRouteMemory(reason){
    try{sessionStorage.removeItem('HAPPYAD_VIDEO_POST_OPEN_V532');}catch(_e){}
    try{sessionStorage.removeItem('HAPPYAD_PENDING_APP_URL_V493');}catch(_e){}
    try{sessionStorage.removeItem('HAPPYAD_VIDEO_DIRECT_ANCHOR_V855R79');}catch(_e){}
    try{delete window.__HAPPYAD_VIDEO_DIRECT_ANCHOR_V855R79;}catch(_e){window.__HAPPYAD_VIDEO_DIRECT_ANCHOR_V855R79='';}
    try{delete window.__happyadVideoPostOpenV532;}catch(_e){window.__happyadVideoPostOpenV532=null;}
    try{window.__HAPPYAD_LAST_VIDEO_NAV_CLEAR__={reason:String(reason||''),t:Date.now()};}catch(_e){}
  }
  function blankVideoFrame(reason){
    /* V594: la centrale Vidéos est un onglet permanent.
       On la met en pause et on la cache, sans supprimer ni recharger son iframe. */
    try{
      var fr=document.getElementById(frameId('video'));
      if(!fr)return;
      pauseFrame(fr,reason||'pause-persistent-video-frame-v594');
      fr.classList.remove('on');
      fr.style.opacity='';fr.style.visibility='';
    }catch(_e){}
  }
  function ensureFrame(page,url){
    var root=ensureShell();if(!root)return null;
    var id=frameId(page);
    var fr=document.getElementById(id);
    if(!fr){
      fr=document.createElement('iframe');
      fr.id=id;fr.className='happyadAppFrame';fr.setAttribute('data-happyad-page',page);
      fr.setAttribute('title','Fyblic '+page);
      fr.setAttribute('loading','eager');
      fr.setAttribute('aria-hidden','true');
      fr.setAttribute('inert','');
      fr.setAttribute('allow','autoplay; camera; microphone; clipboard-write; fullscreen');
      fr.addEventListener('load',function(){
        var pg=fr.getAttribute('data-happyad-page')||page;
        var declared=String(fr.getAttribute('data-happyad-src')||'').trim();
        if(!declared){return;}
        var u=declared||url||pages[pg]||'';
        installBridge(fr,pg);
        if(pg==='profile'&&fr.__happyadOwnerOpenRequestedV649){try{deliverOwnerTargetV649(fr,declared||u||'modules/my-profile.html',{source:'owner-frame-load-v649'});}catch(_ownerLoad){}}
        if(pg==='profile_public'&&fr.__happyadVisitorTargetV601){
          /* V854R2 : le Profil visiteur possède désormais son propre document et
             son propre moteur. Le parent ne lui envoie plus un ordre de remplacement
             d'UID après le chargement : un changement d'UID détruit la frame, tandis
             que le même UID réutilise directement la frame déjà peinte. */
          if(activePage!=='profile_public'){
            try{fr.__happyadVisitorOpenRequestedV601=false;fr.removeAttribute('data-happyad-loading');fr.removeAttribute('data-happyad-defer-visible');fr.style.opacity='';fr.style.visibility='';fr.classList.remove('on');fr.setAttribute('aria-hidden','true');fr.setAttribute('inert','');pauseFrame(fr,'visitor-load-hidden-owner-active-v854');}catch(_visitorHidden){}
            return;
          }
          try{
            fr.removeAttribute('data-happyad-preloading-v594');
            fr.removeAttribute('data-happyad-loading');
            fr.setAttribute('data-happyad-ready-v594','1');
            fr.__happyadVisitorOpenRequestedV601=false;
          }catch(_visitorLoad){}
          return;
        }
        if(pg==='message'&&(fr.getAttribute('data-happyad-message-dormant-warmup-v876')==='1'||fr.getAttribute('data-happyad-message-cache-prepare-v875')==='1')){
          /* Le signal CACHE_READY est l'unique autorité de révélation. load ne
             suspend pas ce document avant ses deux frames de peinture et ne le
             rend jamais visible de lui-même. */
          try{fr.removeAttribute('data-happyad-loading');fr.setAttribute('data-happyad-ready-v594','1');}catch(_messageDormantLoad){}
          return;
        }
        if(fr.getAttribute('data-happyad-preloading-v594')==='1'){
          try{
            var currentHref=String(fr.contentWindow&&fr.contentWindow.location&&fr.contentWindow.location.href||'');
            if(currentHref==='about:blank'&&String(u||'')&&String(u||'')!=='about:blank')return;
          }catch(_href){}
          try{
            fr.removeAttribute('data-happyad-preloading-v594');
            fr.removeAttribute('data-happyad-loading');
            fr.setAttribute('data-happyad-ready-v594','1');
            fr.style.opacity='';fr.style.visibility='';
            pauseFrame(fr,'persistent-preload-ready-v594');
            fr.contentWindow&&fr.contentWindow.postMessage({type:'HAPPYAD_MAIN_TAB_PRELOADED_V594',page:pg},'*');
          }catch(_pre){}
          return;
        }
        /* V885 : publish.html garde toujours le même src. Dès que son document
           existe, on lui injecte le mode demandé avant sa révélation. */
        if(pg==='publish'){
          try{deliverPublishModeV885(fr,fr.getAttribute('data-happyad-publish-mode-v885')||'publish','publish-frame-load-v885');}catch(_publishMode){}
        }
        /* V884 : une Publication ouverte par l'utilisateur peut être persistante
           tout en composant cachée. Son load doit d'abord honorer defer-visible;
           sinon l'ancien garde-fou des onglets persistants la remettrait en pause
           et le loader pourrait rester affiché jusqu'au timeout. */
        if(pg==='publish'&&fr.getAttribute('data-happyad-defer-visible')==='1'){
          if(frameLooksReady(fr,'publish'))revealFrame(fr,pg,u,'publish-frame-load-ready-v936');
          return;
        }
        if(isPersistentMainPage(pg)&&!fr.classList.contains('on')){
          try{fr.removeAttribute('data-happyad-loading');fr.setAttribute('data-happyad-ready-v594','1');fr.style.opacity='';fr.style.visibility='';pauseFrame(fr,'persistent-hidden-load-ready-v594');}catch(_hidden){}
          return;
        }
        if(fr.getAttribute('data-happyad-defer-visible')==='1')revealFrame(fr,pg,u,'frame-load-ready');
        else {
          showLoader(false);
          try{fr.removeAttribute('data-happyad-loading');fr.setAttribute('data-happyad-ready-v594','1');fr.style.opacity='';fr.style.visibility='';}catch(_e){}
          if(fr.classList.contains('on')&&pg!=='publish'){
            try{resumeFrame(fr,pg,u,'frame-load-visible-v625');}catch(_resume){}
          }
        }
      });
      root.appendChild(fr);
    }
    fr.setAttribute('data-happyad-page',page);
    return fr;
  }
  function visitorProfileSeedV601(uid,extra){
    uid=String(uid||'').trim();extra=extra||{};
    var candidates=[];
    try{if(extra.profile)candidates.push(extra.profile);}catch(_e){}
    try{if(extra.detail&&extra.detail.profile)candidates.push(extra.detail.profile);}catch(_e2){}
    try{var ap=readProfileJson('HAPPYAD_ACTIVE_PROFILE');if(ap)candidates.push(ap);}catch(_e3){}
    try{var stable=readProfileJson('HAPPYAD_PUBLIC_PROFILE_STABLE_'+uid);if(stable)candidates.push(stable);}catch(_e4){}
    try{var ram=window.__HAPPYAD_PUBLIC_PROFILE_RAM_CACHE__||{};if(ram[uid])candidates.push(ram[uid]);}catch(_e5){}
    for(var i=0;i<candidates.length;i++){
      var p=candidates[i]||{};
      var id=String(p.id||p.user_id||p.uid||p.auth_user_id||p.account_uid||p.profile_uid||p.owner_id||p.creator_id||'').trim();
      if(id&&id===uid)return Object.assign({},p,{id:uid,user_id:uid,uid:uid,__happyadUidLocked:true,__happyadRouteUid:uid});
    }
    return {id:uid,user_id:uid,uid:uid,name:'Chargement profil...',__happyadUidLocked:true,__happyadRouteUid:uid};
  }
  function visitorFrameReusableV601(fr){
    try{
      if(!fr||!String(fr.getAttribute('data-happyad-src')||'').trim())return false;
      var href=String(fr.contentWindow&&fr.contentWindow.location&&fr.contentWindow.location.href||'');
      var d=fr.contentDocument;
      if(!href||href==='about:blank'||!d||d.readyState==='loading')return false;
      /* V656 : une frame Profil visiteur qui a été naviguée par erreur vers une
         page Vidéo n'est jamais réutilisée comme profil. */
      var path='';try{path=new URL(href,location.href).pathname.replace(/\/+/g,'/');}catch(_u){}
      if(!/(?:^|\/)modules\/visitor-profile\.html$/i.test(path)&&!/(?:^|\/)visitor-profile\.html$/i.test(path))return false;
      return true;
    }catch(_e){return false;}
  }
  function visitorMessageV601(url,extra){
    url=ensurePublicProfileUrl(url,extra||{});
    var uid=profileUidFromUrl(url);
    return {type:VISITOR_PROFILE_MESSAGE_V601,uid:uid,url:url,profile:visitorProfileSeedV601(uid,extra||{}),source:String(extra&&extra.source||MASTER_VERSION),requestId:'vp601-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)};
  }
  function deliverVisitorTargetV601(fr,url,extra){
    try{
      if(!fr||!fr.contentWindow)return false;
      var msg=visitorMessageV601(url,extra||{});if(!msg.uid)return false;
      fr.__happyadVisitorTargetV601={url:msg.url,extra:extra||{},message:msg};
      fr.setAttribute('data-happyad-route-url-v601',msg.url);
      fr.setAttribute('data-happyad-target-uid-v601',msg.uid);
      try{fr.contentWindow.postMessage(msg,'*');}catch(_m){}
      return true;
    }catch(_e){return false;}
  }
  function destroyVisitorFrameV668(reason){
    try{
      var fr=document.getElementById(frameId('profile_public'));if(!fr)return false;
      try{pauseFrame(fr,reason||'visitor-destroy-v668');}catch(_p){}
      try{if(fr.__happyadLoadWatch)clearTimeout(fr.__happyadLoadWatch);if(fr.__happyadRevealWatch)clearTimeout(fr.__happyadRevealWatch);if(fr.__happyadVisitorRevealFallbackV601)clearTimeout(fr.__happyadVisitorRevealFallbackV601);}catch(_t){}
      fr.src='about:blank';fr.remove();return true;
    }catch(_e){return false;}
  }
  function destroyOwnerFrameV855R23(reason){
    try{
      var fr=document.getElementById(frameId('profile'));if(!fr)return false;
      try{pauseFrame(fr,reason||'owner-destroy-v855r23');}catch(_p){}
      ['__happyadLoadWatch','__happyadRevealWatch','__happyadVideoFrameHoldTimer'].forEach(function(k){try{if(fr[k])clearTimeout(fr[k]);fr[k]=null;}catch(_t){}});
      try{fr.src='about:blank';}catch(_s){}
      fr.remove();return true;
    }catch(_e){return false;}
  }
  var ownerAuthSyncTimerV855R23=0;
  function syncOwnerProfileAuthV855R23(detail){
    detail=detail&&typeof detail==='object'?detail:{};
    var authenticated=!!detail.authenticated;
    var uid=String(detail.user_id||detail.user&&detail.user.id||'').trim();
    clearTimeout(ownerAuthSyncTimerV855R23);
    if(!authenticated){
      /* La déconnexion doit rendre l'Accueil immédiatement, puis supprimer la
         frame privée afin qu'aucun ancien profil ne puisse réapparaître. */
      if(activePage!=='home'||document.body.classList.contains('happyadAppOpen'))close('auth-signed-out-v855r23',true);
      destroyOwnerFrameV855R23('auth-signed-out-v855r23');
      return true;
    }
    var fr=document.getElementById(frameId('profile'));
    if(fr&&fr.contentWindow){
      try{fr.contentWindow.postMessage({type:'HAPPYAD_AUTH_SIGNED_IN_V595',detail:{authenticated:true,user_id:uid,user:detail.user||null,event:detail.event||'SIGNED_IN'}},'*');}catch(_m){}
    }
    if(activePage==='profile'){
      if(!fr){
        loadFrame('profile',persistentMainUrl('profile'),{source:'auth-signed-in-v855r23',force:true,revealOwnerBoot:true});
      }else{
        ownerAuthSyncTimerV855R23=setTimeout(function(){
          try{
            var current=document.getElementById(frameId('profile'));
            var painted=String(current&&current.getAttribute('data-happyad-owner-uid-v855r23')||'').trim();
            if(uid&&painted===uid)return;
            destroyOwnerFrameV855R23('auth-profile-reload-fallback-v855r23');
            loadFrame('profile',persistentMainUrl('profile'),{source:'auth-profile-reload-fallback-v855r23',force:true,revealOwnerBoot:true});
          }catch(_e){}
        },1800);
      }
    }
    /* V869 : une connexion réussie ne crée plus Mon profil en arrière-plan.
       La session est déjà conservée par le maître Auth; la frame Profil sera
       construite uniquement au clic sur Profil. */
    return true;
  }
  function resetVisitorFrameForUrl(url){
    try{
      var target=rootUrl(url||''),targetUid=profileUidFromUrl(target),fr=document.getElementById(frameId('profile_public'));
      if(!fr)return;
      var currentUid=String(fr.getAttribute('data-happyad-target-uid-v601')||profileUidFromUrl(fr.getAttribute('data-happyad-route-url-v601')||fr.getAttribute('data-happyad-src')||'')).trim();
      if(!targetUid||!currentUid||currentUid!==targetUid){destroyVisitorFrameV668('visitor-uid-change-v668');return;}
      fr.setAttribute('data-happyad-route-url-v601',target);
    }catch(_e){destroyVisitorFrameV668('visitor-reset-error-v668');}
  }
  function sameFrameUrl(fr,url){
    try{return rootUrl(fr.getAttribute('data-happyad-src')||'')===rootUrl(url||'');}catch(_e){return false;}
  }
  function ownerProfileFrameReusableV756(fr){
    try{
      if(!fr)return false;
      var declared=rootUrl(fr.getAttribute('data-happyad-src')||'');
      if(pathOf(declared)!=='modules/my-profile.html')return false;
      var href=String(fr.contentWindow&&fr.contentWindow.location&&fr.contentWindow.location.href||'');
      if(!href||href==='about:blank')return false;
      var u=new URL(href,location.href);
      if(!/(?:^|\/)modules\/my-profile\.html$/i.test(u.pathname)&&!/(?:^|\/)my-profile\.html$/i.test(u.pathname))return false;
      if(/[?&]public=1(?:&|$)/.test(u.search||''))return false;
      var d=fr.contentDocument;
      if(!d||d.readyState==='loading'||!d.body)return false;
      return true;
    }catch(_e){return false;}
  }
  function loadFrame(page,url,extra){
    extra=extra||{};
    var requestedPublishModeV885='';
    if(page==='publish'){
      requestedPublishModeV885=publishModeFromRequestV885(url,extra);
      extra.publishMode=requestedPublishModeV885;
      /* src canonique : Story ne change plus l'URL physique de l'iframe. */
      url=persistentMainUrl('publish');
    }
    if(page!=='message')cancelMessageCachePreparationV876('switch-to-'+String(page||'unknown'));
    var root=ensureShell();if(!root)return false;
    if(page==='profile_public')resetVisitorFrameForUrl(url);
    var fr=ensureFrame(page,url);if(!fr)return false;
    if(page==='publish'){
      try{fr.setAttribute('data-happyad-publish-mode-v885',requestedPublishModeV885||'publish');}catch(_pmAttr){}
      /* Frame déjà chaude : le mode change avant la révélation, sans reload. */
      try{if(frameLooksReady(fr,'publish'))deliverPublishModeV885(fr,requestedPublishModeV885||'publish','publish-reuse-before-reveal-v885');}catch(_pmReady){}
    }
    var ownerReusableV756=page==='profile'&&ownerProfileFrameReusableV756(fr);
    if(page==='profile'){
      /* V687 : un clic explicite sur le bouton Mon profil prépare Publications
         avant que la frame déjà chaude soit rendue visible. Un retour depuis une
         photo/vidéo ne passe pas par cette source et conserve donc son onglet. */
      try{
        var freshSource=String(extra&&extra.source||'');
        if(/main-tabs-profile-v595/i.test(freshSource)){
          var tabsApi=fr.contentWindow&&(fr.contentWindow.HappyProfileContentTabsV687||fr.contentWindow.HappyProfileContentTabsV686||fr.contentWindow.HappyProfileContentTabsV685);
          if(tabsApi&&typeof tabsApi.prepareFreshOpen==='function')tabsApi.prepareFreshOpen('main-tabs-profile-v687');
        }
      }catch(_tabsPrepare){}
      prepareOwnerProfileOpenV649('load-owner-profile-v756');
      /* La frame propriétaire déjà peinte ne reçoit plus un second ordre de
         reconstruction à chaque passage Accueil -> Profil. */
      if(!ownerReusableV756)deliverOwnerTargetV649(fr,url,extra);
      else{
        fr.setAttribute('data-happyad-src','modules/my-profile.html?v=1001-profile-identity-scale');
        fr.setAttribute('data-happyad-owner-persistent-v756','1');
      }
    }
    /* V649 : un clic sur Mon profil verrouille d'abord le mode propriétaire.
       Le profil visiteur persistant reste en cache, mais ne peut plus reprendre l'écran. */
    /* V625 : un clic sur n'importe quel onglet principal pendant son préchargement
       transforme immédiatement la frame cachée en frame active. Le gestionnaire
       load ne doit donc plus la remettre en pause après le clic. */
    if(page!=='profile_public'){
      try{fr.removeAttribute('data-happyad-preloading-v594');}catch(_pre){}
    }
    var visitorPersistent=(page==='profile_public');
    var visitorHasSource=visitorPersistent&&!!String(fr.getAttribute('data-happyad-src')||'').trim();
    var visitorReady=visitorPersistent&&visitorFrameReusableV601(fr);
    var mustReload=visitorPersistent?(!visitorHasSource||!visitorReady):!sameFrameUrl(fr,url);
    if(page==='profile'&&ownerReusableV756)mustReload=false;
    var directMedia=isDirectMediaPage(page);
    /* V883 : si la Centrale a été préparée hors écran, le premier vrai clic
       transforme cette même iframe en surface active. Aucun poster transitoire
       n'est nécessaire lorsque son premier rendu local est déjà prêt. */
    if(page==='video'&&!hasPost(url)&&fr.getAttribute('data-happyad-video-dormant-warmup-v883')==='1'){
      try{
        fr.removeAttribute('data-happyad-video-dormant-warmup-v883');
        fr.contentWindow&&fr.contentWindow.postMessage({type:'HAPPYAD_VIDEO_ACTIVATE_V883',source:'navigation-first-central-open-v883'},'*');
        window.__HAPPYAD_VIDEO_WARMUP_V624__={started:true,ready:true,dormant:false,network:'activate-on-open',at:Date.now(),url:url};
      }catch(_videoActivate){}
    }
    var centralVideoOpeningV873=page==='video'&&!hasPost(url)&&(mustReload||!frameLooksReady(fr,'video'));
    var inboxMessageCachePendingV875=page==='message'&&/main-tabs-message/i.test(String(extra&&extra.source||''))&&(mustReload||!frameLooksReady(fr,'message'));
    if(page==='video'&&!hasPost(url)){
      try{if(window.HappyPwaInstallV610&&typeof window.HappyPwaInstallV610.hide==='function')window.HappyPwaInstallV610.hide();}catch(_pwa){}
    }
    /* V756 : au premier chargement seulement, Mon profil reste invisible jusqu'à
       son vrai signal READY; l'Accueil ou la page précédente reste affichée. Une
       fois peinte, la même iframe est réutilisée sans rechargement. */
    var ownerFirstPendingV756=page==='profile'&&!ownerReusableV756&&!frameLooksReady(fr,'profile')&&!extra.revealOwnerBoot;
    /* V855R24 : au premier affichage d'un Profil visiteur, le squelette parent
       est rendu immédiatement avant de masquer la surface précédente. L'iframe
       reste invisible jusqu'au signal peint du profil : aucun écran noir ne peut
       apparaître entre le clic et le squelette interne. */
    var visitorFirstPendingV855R24=visitorPersistent&&(!visitorReady||mustReload);
    /* V884 : Publication n'est jamais révélée avant sa première peinture utile.
       Le clic est accepté immédiatement et le parent montre son état Chargement,
       tandis que l'iframe compose hors écran. Dès qu'elle est peinte, elle prend
       la place du loader sans transition par un écran noir. */
    var publishFirstPendingV884=page==='publish'&&(mustReload||!frameLooksReady(fr,'publish'));
    var deferVisible=visitorFirstPendingV855R24||ownerFirstPendingV756||inboxMessageCachePendingV875||publishFirstPendingV884;
    if(visitorPersistent){
      fr.__happyadVisitorOpenRequestedV601=true;
      fr.__happyadVisitorTargetV601={url:rootUrl(url),extra:extra||{}};
    }

    /* V23: vidéo = ouverture centrale seulement.
       Pendant le chargement, on garde juste une frame/poster avec bouton play tournant;
       aucun lecteur vidéo direct n'est lancé hors centrale. */
    if(deferVisible){
      showVideoDirect(url,false);
      if(inboxMessageCachePendingV875){
        /* V876 : la page actuelle reste la seule surface opaque. Sur Accueil, le
           shell entier compose à opacity:0; depuis une autre frame, seule Messages
           compose à opacity:0 et l'ancienne frame reste visible. */
        showSkeleton(page,url,false);
        try{if(window.HappyPwaInstallV610&&typeof window.HappyPwaInstallV610.hide==='function')window.HappyPwaInstallV610.hide();}catch(_pwaMessage){}
        try{
          var currentSurfaceV876=root.querySelector('.happyadAppFrame.on[data-happyad-page]');
          var prepareOverHomeV876=activePage==='home'||!currentSurfaceV876||currentSurfaceV876===fr;
          root.classList.remove('happyadMessageCachePreparingV876','happyadMessageCachePreparingWithinShellV876');
          /* V998 : via le dock, l'ancienne page est déjà coupée. Le shell reste
             opaque pendant la préparation de Messages afin qu'Accueil ou une
             autre frame ne réapparaisse jamais derrière la nouvelle surface. */
          if(prepareOverHomeV876&&!extra.menu){
            root.classList.remove('on');
            root.classList.add('happyadMessageCachePreparingV876');
            root.setAttribute('aria-hidden','true');
          }else{
            root.classList.add('on','happyadMessageCachePreparingWithinShellV876');
            root.classList.remove('happyadMessageCachePreparingV876');
            root.setAttribute('aria-hidden','false');
          }
          fr.classList.remove('on');
          fr.style.opacity='';
          fr.style.visibility='visible';
          fr.setAttribute('data-happyad-defer-visible','1');
          fr.setAttribute('data-happyad-skeleton-start',String(Date.now()));
          fr.setAttribute('data-happyad-message-cache-prepare-v875','1');
          fr.setAttribute('data-happyad-message-cache-from-page-v875',String(activePage||'home'));
          fr.setAttribute('data-happyad-message-dormant-warmup-v876','1');
          fr.removeAttribute('data-happyad-message-cache-ready-v875');
          fr.removeAttribute('data-happyad-first-render-ready-v623');
          fr.setAttribute('inert','');
          fr.setAttribute('aria-hidden','true');
          /* Une frame Messages peut déjà exister, chargée mais suspendue. Dans ce
             cas aucun nouvel événement load ne relancera son boot : cet ordre lui
             demande explicitement de peindre le cache pendant qu'elle reste
             transparente. Pour une frame neuve, le message peut être perdu sans
             conséquence car son bootstrap relit l'attribut ci-dessus. */
          try{fr.contentWindow&&fr.contentWindow.postMessage({
            type:'HAPPYAD_MESSAGE_CACHE_PREPARE_V875',
            detail:{mode:'inbox',source:'navigation-cache-prepare-v876'}
          },'*');}catch(_messagePreparePost){}
        }catch(_messagePending){}
      }else if(ownerFirstPendingV756){
        /* Aucun écran noir/spinner : la surface précédente reste visible jusqu'au
           premier rendu réel de Mon profil. */
        showSkeleton(page,url,false);
        try{
          fr.classList.add('on');
          fr.style.opacity='0';
          fr.style.visibility='hidden';
          fr.setAttribute('data-happyad-defer-visible','1');
          fr.setAttribute('data-happyad-skeleton-start',String(Date.now()));
          fr.removeAttribute('data-happyad-first-render-ready-v623');
        }catch(_ownerPending){}
      }else{
        showSkeleton(page,url,true);
        try{
          /* On suspend le média de la surface précédente, mais on ne la masque pas avant le rendu suivant. */
          root.querySelectorAll('.happyadAppFrame').forEach(function(x){if(x!==fr)pauseFrame(x,'prepare-module-'+page);});
          fr.classList.remove('on');
          fr.style.opacity='0';
          fr.style.visibility='hidden';
          fr.setAttribute('data-happyad-defer-visible','1');
          fr.setAttribute('data-happyad-skeleton-start',String(Date.now()));
          fr.removeAttribute('data-happyad-first-render-ready-v623');
        }catch(_d){}
      }
    }else{
      if(centralVideoOpeningV873)startCentralVideoOpeningV873(fr,url);
      else showVideoDirect(url,false);
      showSkeleton(page,url,false);
      hideOtherFrames(root,fr,page);
    }

    if(mustReload){
      fr.setAttribute('data-happyad-src',rootUrl(url));
      fr.setAttribute('data-happyad-loading','1');
      fr.removeAttribute('data-happyad-first-render-ready-v623');
      if(page==='profile')fr.removeAttribute('data-happyad-profile-shell-ready-v877');
      try{fr.setAttribute('loading','eager');}catch(_loading){}
      showLoader(false);
      try{fr.src=rootUrl(url);}catch(_e){try{fr.setAttribute('src',rootUrl(url));}catch(_x){}}
      try{
        if(fr.__happyadLoadWatch)clearTimeout(fr.__happyadLoadWatch);
        fr.__happyadLoadWatch=setTimeout(function(){
          if(fr.getAttribute('data-happyad-defer-visible')==='1')revealFrame(fr,page,url,'frame-load-timeout');
          else{showLoader(false);try{fr.removeAttribute('data-happyad-loading');fr.style.opacity='';fr.style.visibility='';}catch(_w){}}
        },(page==='video'?1200:(page==='profile_public'?4200:(page==='profile'?1800:4200))));
      }catch(_w){}
    }

    /* V876 : pendant la préparation froide de l'inbox, ne pas annoncer Messages
       avant que ses vraies lignes locales puissent remplacer Accueil. */
    if(!inboxMessageCachePendingV875){setNavActive(page,url);updateState(page,url);}
    if(visitorPersistent){
      fr.setAttribute('data-happyad-route-url-v601',rootUrl(url));
      if(!mustReload&&visitorReady){
        /* Même UID : aucune reconstruction, aucun masque et aucun deuxième
           chargement. La frame autonome déjà peinte reprend immédiatement. */
        try{
          hideOtherFrames(root,fr,page);
          root.classList.add('on');root.setAttribute('aria-hidden','false');
          document.body.classList.add('happyadAppOpen');
          fr.style.opacity='';fr.style.visibility='';fr.classList.add('on');
          fr.removeAttribute('inert');fr.setAttribute('aria-hidden','false');
          showSkeleton(page,url,false);
          resumeFrame(fr,page,url,'visitor-same-uid-reuse-v854');
          releaseNavGate('visitor-same-uid-reuse-v854');
        }catch(_visitorReuse){}
        return true;
      }
    }
    if(deferVisible){
      return true;
    }
    revealFrame(fr,page,url,'frame-show-immediate');
    return true;
  }
  function restoreProfileSurfaceAfterPhotoV656(source,detail){
    try{
      var fr=frameFromMessageSourceV623(source);
      if(!fr)return false;
      var page=String(fr.getAttribute('data-happyad-page')||'');
      if(page!=='profile'&&page!=='profile_public')return false;
      if(activePage!==page)return false;
      var url=String(fr.getAttribute('data-happyad-route-url-v601')||fr.getAttribute('data-happyad-src')||activeUrl||pages[page]||'');
      clearVideoRouteMemory('profile-photo-close-v656');
      showVideoDirect('',false);
      blankVideoFrame('profile-photo-close-v656');
      var root=ensureShell();
      hideOtherFrames(root,fr,page);
      fr.style.opacity='';fr.style.visibility='';fr.classList.add('on');fr.removeAttribute('inert');fr.setAttribute('aria-hidden','false');
      if(root){root.classList.add('on');root.setAttribute('aria-hidden','false');}
      document.body.classList.add('happyadAppOpen');
      resumeFrame(fr,page,url,'profile-photo-close-v656');
      setNavActive(page,url);updateState(page,url);
      showSkeleton(page,url,false);showLoader(false);releaseNavGate('profile-photo-close-v656');
      return true;
    }catch(_e){return false;}
  }

  function postToFrameV594(page,message){
    try{
      var fr=document.getElementById(frameId(page));
      if(fr&&fr.contentWindow){fr.contentWindow.postMessage(message,'*');return true;}
    }catch(_e){}
    return false;
  }
  function activateMainTabV594(page,extra){
    extra=extra||{};page=String(page||'').trim();
    if(page==='home')return close('main-tab-home-v594',{menu:!!extra.menu,replace:!!extra.replace,fromPop:!!extra.fromPop,source:extra.source});
    if(!isPersistentMainPage(page))return open(pages[page]||extra.url||'index.html',extra);
    var url=rootUrl(extra.url||persistentMainUrl(page));
    if(page==='message')url=persistentMainUrl('message');
    if(page==='video')url=persistentMainUrl('video');
    if(page==='profile')url=persistentMainUrl('profile');
    if(page==='publish'){extra.publishMode=publishModeFromRequestV885(extra.url||url,extra);url=persistentMainUrl('publish');}
    try{releaseNavGate('activate-main-tab-v594');}catch(_g){}
    try{if(window.HappyMedia)window.HappyMedia.pauseAll('switch-main-tab-'+page+'-v594');}catch(_m){}
    var ok=loadFrame(page,url,extra);
    if(ok){
      pushNav(page,url,{replace:!!extra.replace,fromPop:!!extra.fromPop,menu:!!extra.menu,source:extra.source});
      if(page!=='profile'&&page!=='publish'){
        try{setTimeout(function(){postToFrameV594(page,{type:'HAPPYAD_APP_FRAME_VISIBLE',page:page,url:url,source:extra.source||'main-tabs-v594'});},0);}catch(_v){}
      }
    }
    return ok;
  }
  function deliverVideoTargetV594(postId,extra){
    postId=String(postId||'').trim();if(!postId)return false;
    var msg={type:'HAPPYAD_VIDEO_OPEN_POST_V594',postId:postId,id:postId,detail:{postId:postId,id:postId,source:String(extra&&extra.source||'video-target-v594')}};
    /* Fyblic V855R78 — cible vidéo avant affichage.
       Le frame Vidéos est persistant et peut encore contenir la dernière vidéo vue.
       Un envoi synchrone lui donne la cible exacte pendant qu'il est encore caché,
       puis quelques répétitions couvrent uniquement le cas où le frame finit son boot. */
    postToFrameV594('video',msg);
    var delays=[55,150,360,760];
    delays.forEach(function(delay){setTimeout(function(){postToFrameV594('video',msg);},delay);});
    return true;
  }
  function openVideoPostV594(url,extra){
    extra=extra||{};
    var postId=videoPostIdFromUrl(url||'');
    if(!postId)return activateMainTabV594('video',{source:extra.source||'video-central-v594'});
    /* Fyblic V855R79 — toutes les cartes vidéo utilisent la même ouverture directe
       que le Chat direct : préparation cachée, cible en position 0, puis révélation. */
    if(!extra.__happyadVideoDirectBypassV855R79){
      try{
        var tabs=window.HappyMainTabsV598||window.HappyMainTabsV596||window.HappyMainTabsV595||window.HappyMainTabsV594;
        if(tabs&&typeof tabs.openVideoDirect==='function')return tabs.openVideoDirect({postId:postId,id:postId,source:extra.source||'video-card-v855r79-target-first'});
      }catch(_direct){}
    }
    try{sessionStorage.setItem(VIDEO_TARGET_KEY_V594,postId);}catch(_s){}
    try{window.__HAPPYAD_VIDEO_TARGET_POST_V594=postId;}catch(_w){}
    /* Préparer la publication exacte avant de révéler l'onglet Vidéos.
       Ainsi aucune ancienne/dernière vidéo n'a le temps de devenir la vue active. */
    deliverVideoTargetV594(postId,extra);
    var ok=activateMainTabV594('video',{source:extra.source||'video-card-v855r78-exact'});
    return ok;
  }
  function installBridge(fr,page){
    try{
      var w=fr.contentWindow,d=fr.contentDocument;if(!w||!d||d.__HAPPYAD_CORE_NAV_V8_BRIDGED__)return;d.__HAPPYAD_CORE_NAV_V8_BRIDGED__=true;
      w.happyadOpenInternalUrlV492=function(url,extra){return open(url,extra||{});};
      w.happyadOpenAppPage=function(p,url){return openAppPage(p,url);};
      w.happyadCloseAppPage=function(){return back({source:'frame-api-'+page+'-v927'});};
      d.addEventListener('click',function(e){
        try{
          var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a)return;
          var href=a.getAttribute('href')||'';var rt=rootUrl(href);var pp=pageOf(rt);
          if(pp==='home'||pages[pp]){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();open(rt,{source:'frame-link-'+page});return false;}
        }catch(_e){}
      },true);
    }catch(_e){}
  }
  function finishMenuResetV927(){
    var target=menuResetV927;menuResetV927=null;
    if(!target)return false;
    navDepthV927=0;
    nativeReplaceStateV927(state('home','index.html',{depth:0,source:'menu-root-v927'}));
    if(target.page!=='home'){
      navDepthV927=1;
      nativePushStateV927(state(target.page,target.url,{depth:1,source:target.source||'menu-target-v927'}));
    }
    return true;
  }
  function pushNav(page,url,options){
    options=options&&typeof options==='object'?options:{replace:!!options};
    page=String(page||'home');url=rootUrl(url||pages[page]||'index.html');
    if(options.fromPop)return true;
    var current=null;try{current=history.state||null;}catch(_e){}
    var currentDepth=canonicalDepthV927(current);if(currentDepth<0)currentDepth=navDepthV927;
    if(options.menu){
      var suspendedOffset=0;
      try{window.dispatchEvent(new CustomEvent('HAPPYAD_MAIN_MENU_NAVIGATION_V927',{detail:{page:page,url:url,source:String(options.source||'main-menu-v927'),at:Date.now()}}));}catch(_menuEvent){}
      try{var internal=window.HappyInternalReturnV694||window.HappyInternalReturnV591;if(internal&&typeof internal.historyOffset==='function')suspendedOffset=Math.max(0,Number(internal.historyOffset())||0);if(internal&&typeof internal.prepareMenuNavigation==='function')internal.prepareMenuNavigation('menu-'+page+'-v927');}catch(_layers){}
      var activeInternalDepth=internalDepthV927(current);
      var offset=Math.max(0,currentDepth)+activeInternalDepth+suspendedOffset;
      menuResetV927={page:page,url:url,source:String(options.source||'main-menu-v927')};
      if(offset>0){nativeGoV927(-offset);return true;}
      return finishMenuResetV927();
    }
    if(sameRouteV927(current,page,url)){
      navDepthV927=Math.max(0,currentDepth);
      if(options.replace)nativeReplaceStateV927(state(page,url,{depth:navDepthV927,source:options.source||'same-route-replace-v927'}));
      return true;
    }
    if(options.replace){
      navDepthV927=Math.max(0,currentDepth);
      nativeReplaceStateV927(state(page,url,{depth:navDepthV927,source:options.source||'route-replace-v927'}));
      return true;
    }
    navDepthV927=Math.max(0,currentDepth)+1;
    nativePushStateV927(state(page,url,{depth:navDepthV927,source:options.source||'route-open-v927'}));
    return true;
  }
  function open(url,extra){
    extra=extra||{};url=rootUrl(url||'index.html');var page=pageOf(url,extra.page);
    if(page==='publish'){extra.publishMode=publishModeFromRequestV885(url,extra);url=persistentMainUrl('publish');}
    var normalized=normalizeRouteForOpen(page,url);
    if(normalized.invalidPublic){page=normalized.view;url=normalized.url;extra.replace=true;}
    if(page!=='profile_public')destroyVisitorFrameV668('leave-visitor-for-'+String(page||'unknown'));
    if(page==='profile_public'){
      url=ensurePublicProfileUrl(url,extra);
      if(!url){try{console.warn('Fyblic profile_public blocked: missing uid');}catch(_w){} return false;}
      var __profileUid=profileUidFromUrl(url);
      if(__profileUid&&isOwnProfileUid(__profileUid)){
        try{localStorage.removeItem('HAPPYAD_ACTIVE_PROFILE');}catch(_ap){}
        try{sessionStorage.removeItem('HAPPYAD_PROFILE_MASTER_ACTIVE_UID');sessionStorage.setItem('HAPPYAD_PROFILE_MASTER_MODE','my');}catch(_ss){}
        url='modules/my-profile.html';
        page='profile';
      }else if(__profileUid){
        try{sessionStorage.setItem('HAPPYAD_PROFILE_MASTER_ACTIVE_UID',__profileUid);sessionStorage.setItem('HAPPYAD_PROFILE_MASTER_ACTIVE_URL',url);localStorage.setItem('HAPPYAD_PUBLIC_PROFILE_ACTIVE_UID',__profileUid);localStorage.setItem('HAPPYAD_ACTIVE_PROFILE_UID',__profileUid);}catch(_uid){}
        /* V927 : un autre profil est une vraie destination C. Il ne remplace plus
           le profil B, afin que Retour fasse C -> B au lieu de sauter vers A. */
      }
    }
    applyVisitorDockLockV854R3(page==='profile_public','open-'+page);
    if(page==='video'&&hasPost(url)&&!extra.__happyadVideoPersistentV594)return openVideoPostV594(url,extra);
    if(page==='home')return close('open-home',{fromPop:!!extra.fromPop,replace:!!extra.replace,menu:!!extra.menu,source:extra.source});
    if(page==='profile'||page==='profile_public'){
      clearVideoRouteMemory('open-'+page+'-v656');
      showVideoDirect('',false);
      blankVideoFrame('open-'+page+'-v656');
    }
    if(navBusy()&&!extra.fromPop&&!extra.replace&&!extra.force){
      if(samePendingTarget(page,url))return true;
      try{window.__HAPPYAD_NAV_REPLACED_PENDING_V615__={from:pendingNav,to:{page:page,url:url},t:Date.now()};}catch(_ig){}
      releaseNavGate('replace-pending-target-v615');
    }
    if(page==='publish'){var publishOpenSourceV889=String(extra&&extra.source||'publish');beginPublishTapShieldV889('open-'+publishOpenSourceV889,/doc-link|frame-link|keyboard|programmatic/i.test(publishOpenSourceV889));}
    beginNavGate(page,url);
    if(page!=='video'||!hasPost(url))clearVideoRouteMemory('open-'+page);
    if(page==='video'&&!hasPost(url))blankVideoFrame('open-video-central');
    try{if(window.HappyMedia)HappyMedia.pauseAll('before-open-'+page);}catch(_e){}
    var ok=loadFrame(page,url,extra);
    if(ok)pushNav(page,url,{replace:!!extra.replace,fromPop:!!extra.fromPop,menu:!!extra.menu,source:extra.source});
    else if(page==='publish')removePublishTapShieldV889('publish-open-failed-v889');
    return ok;
  }
  function openAppPage(page,url){
    page=String(page||'').trim();
    if(!url)url=pages[page]||pages[page==='myProfile'?'profile':page==='visitorProfile'?'profile_public':'']||'index.html';
    return open(url,{page:page});
  }
  function close(reason,options){
    reason=String(reason||'close');
    options=options&&typeof options==='object'?options:{replace:options===true,fromPop:options===false};
    var preserveInternalLayerV928=String(options.preserveInternalLayer||'');
    /* Un bouton Retour ne fabrique jamais une nouvelle route Accueil. Il dépile
       l'entrée précédente; seul le menu principal reçoit options.menu=true. */
    if(!options.fromPop&&!options.menu&&!options.replace&&!options.renderOnly)return back({source:reason});
    removePublishTapShieldV889('close-'+reason);
    cancelMessageCachePreparationV876('close-'+reason);
    applyVisitorDockLockV854R3(false,'close-'+reason);
    /* V855R25 : libérer immédiatement les couches photo avant le retour Accueil.
       Sans cela, le maître de retour interne pouvait conserver home-photo/profile-photo
       le temps d'un observer DOM et masquer brièvement le menu inférieur. */
    try{
      var ir=window.HappyInternalReturnV694||window.HappyInternalReturnV591;
      if(ir&&typeof ir.close==='function'){
        if(preserveInternalLayerV928!=='home-photo')ir.close('home-photo');
        if(preserveInternalLayerV928!=='profile-photo')ir.close('profile-photo');
        ir.close('photo-central');
      }
    }catch(_photoLayers){}
    var root=shell(),frames=[];
    try{if(root)frames=Array.prototype.slice.call(root.querySelectorAll('.happyadAppFrame'));}catch(_e){frames=[];}

    /* V619: rendre l'Accueil visible avant tout nettoyage coûteux. */
    try{
      frames.forEach(function(fr){fr.classList.remove('on');fr.setAttribute('aria-hidden','true');fr.setAttribute('inert','');});
      if(root){root.classList.remove('on','happyadSkeletonOpen','happyadMessageCachePreparingV876','happyadMessageCachePreparingWithinShellV876');root.setAttribute('aria-hidden','true');}
      showSkeleton('home','index.html',false);showVideoDirect('',false);showLoader(false);releaseNavGate(reason);
      document.body.classList.remove('happyadAppOpen','happyadPublishFullscreenV586','no-scroll','modal-open','story-open','fullscreen-open','happyad-story-fullscreen-lock','happyadShareOpen');
      document.documentElement.classList.remove('no-scroll','modal-open','story-open','fullscreen-open','happyad-story-fullscreen-lock','happyadShareOpen');
      document.body.classList.add('happyadMainDockVisible');
      /* Mettre l'état historique Accueil avant l'événement de navigation : les autres
         maîtres ne peuvent plus relire momentanément l'ancienne route profile_public. */
      pushNav('home','index.html',{fromPop:!!options.fromPop,menu:!!options.menu,replace:!!options.replace,source:options.source||reason});
      updateState('home','index.html');
      setNavActive('home','index.html');
      try{
        var ir2=window.HappyInternalReturnV694||window.HappyInternalReturnV591;
        if(ir2&&typeof ir2.applyDock==='function')ir2.applyDock('home');
      }catch(_dockSync){}
      try{destroyVisitorFrameV668(reason+'-home-v668');}catch(_visitorDestroy){}
      try{scheduleMainTabsPreloadV594();}catch(_warm){}
    }catch(_e){}

    /* Le média et les observers sont suspendus après le premier rendu Accueil. */
    setTimeout(function(){
      clearVideoRouteMemory(reason);blankVideoFrame(reason);
      try{if(window.HappyMedia)HappyMedia.pauseAll(reason);}catch(_m){}
      frames.forEach(function(fr){try{pauseFrame(fr,reason);}catch(_p){}});
      try{
        removeLegacyTapShield();
        document.documentElement.style.removeProperty('overflow');document.documentElement.style.removeProperty('overflow-y');document.documentElement.style.removeProperty('touch-action');
        document.body.style.removeProperty('overflow');document.body.style.removeProperty('overflow-y');document.body.style.removeProperty('touch-action');document.body.style.removeProperty('position');document.body.style.removeProperty('top');document.body.style.removeProperty('width');
        clearBootRestoreMaskV16ZJ('close-'+reason);
        if(window.HappyOverlayMasterV615)window.HappyOverlayMasterV615.reconcile('navigation-close-'+reason);
      }catch(_cleanup){}
    },0);
    return true;
  }
  function back(options){
    options=options||{};
    if(menuResetV927)return false;
    /* V931 : le bouton Retour propre au Profil visiteur ferme toujours la vraie
       route profile_public C avant de rendre les couches internes suspendues de B.
       Cas critique : Mon profil -> fullscreen photo -> mention -> Profil visiteur.
       Une couche photo héritée/stale ne doit jamais voler ce premier Retour. */
    var routeBackFromVisitorV931=(activePage==='profile_public'&&String(options.source||'').indexOf('profile-back-v854')===0);
    if(!routeBackFromVisitorV931){
      try{
        var internal=window.HappyInternalReturnV694||window.HappyInternalReturnV591;
        var top=internal&&typeof internal.top==='function'?String(internal.top()||''):'';
        if(top&&typeof internal.back==='function')return internal.back(top,{source:options.source||'navigation-back-v927'});
      }catch(_internal){}
    }
    nativeGoV927(-1);
    return true;
  }

  /* V927 : restauration visuelle pilotée uniquement par l'entrée dépilée. */
  function restore(page,url,options){
    options=options||{};
    restoring=true;
    try{
      if(!page||page==='home')close('pop-home',{fromPop:true,source:'popstate-v927',preserveInternalLayer:String(options.preserveInternalLayer||'')});
      else open(url||pages[page],{page:page,replace:true,fromPop:true});
    }finally{setTimeout(function(){restoring=false;},0);}
  }
  function activeFrame(){try{var r=shell();return r&&r.querySelector&&r.querySelector('.happyadAppFrame.on[data-happyad-page]');}catch(_e){return null;}}

  function frameFromMessageSourceV623(source){
    try{
      var root=shell();if(!root||!source)return null;
      var list=root.querySelectorAll('.happyadAppFrame');
      for(var i=0;i<list.length;i++){try{if(list[i].contentWindow===source)return list[i];}catch(_e){}}
    }catch(_e){}
    return null;
  }
  function acceptFirstRenderV623(ev,data){
    try{
      var fr=frameFromMessageSourceV623(ev&&ev.source);if(!fr)return false;
      var page=fr.getAttribute('data-happyad-page')||'';
      var type=String(data&&data.type||'');
      /* V625: le signal générique du début de document ne ferme plus le squelette
         des pages lourdes. On attend leur maître réellement prêt. */
      if(page==='profile_public'&&type!=='HAPPYAD_PROFILE_VISUAL_READY_V621C'&&type!=='HAPPYAD_PROFILE_READY'&&type!=='HAPPYAD_PROFILE_ENGINE_READY_V854')return false;
      if(page==='profile'&&type!=='HAPPYAD_PROFILE_SHELL_READY_V877'&&type!=='HAPPYAD_PROFILE_VISUAL_READY_V621C'&&type!=='HAPPYAD_PROFILE_READY'&&type!=='HAPPYAD_PROFILE_ENGINE_READY_V854')return false;
      /* Le moteur prêt n'est pas une preuve visuelle. Messages est révélée
         uniquement lorsque son cache (ou son état sans cache) est déjà peint. */
      if(page==='message'&&type!=='HAPPYAD_MESSAGE_CACHE_READY_V875')return false;
      if(page==='video'&&type!=='HAPPYAD_VIDEO_VISUAL_READY_V873'&&type!=='HAPPYAD_VIDEO_TAB_READY_V594'&&type!=='HAPPYAD_VIDEO_READY')return false;
      if(page==='publish'&&type!=='HAPPYAD_PUBLISH_READY_V936'&&type!=='HAPPYAD_PUBLISH_BOOT_FAILED_V936')return false;
      fr.setAttribute('data-happyad-first-render-ready-v623','1');
      fr.setAttribute('data-happyad-first-render-reason-v623',type||'ready');
      if(page==='publish'){
        if(type==='HAPPYAD_PUBLISH_READY_V936'){
          fr.setAttribute('data-happyad-publish-ready-v936','1');
          fr.removeAttribute('data-happyad-publish-failed-v936');
        }else{
          fr.setAttribute('data-happyad-publish-failed-v936','1');
          fr.removeAttribute('data-happyad-publish-ready-v936');
        }
      }
      if(page==='profile'&&type==='HAPPYAD_PROFILE_SHELL_READY_V877')fr.setAttribute('data-happyad-profile-shell-ready-v877','1');
      if(page==='video'&&fr.__happyadCentralVideoOpeningTokenV873){
        var videoOpeningTokenV873=fr.__happyadCentralVideoOpeningTokenV873;
        requestAnimationFrame(function(){stopCentralVideoOpeningV873(fr,videoOpeningTokenV873,type||'video-ready');});
      }
      if(page==='message')fr.setAttribute('data-happyad-message-cache-ready-v875','1');
      /* Le préchauffage automatique s'arrête exactement après la peinture locale.
         Accueil demeure la surface active et aucun boot connecté ne peut commencer
         avant un vrai clic sur Messages. */
      if(page==='message'&&fr.getAttribute('data-happyad-message-dormant-warmup-v876')==='1'&&fr.getAttribute('data-happyad-defer-visible')!=='1'){
        var dormantRootV876=shell();
        fr.setAttribute('data-happyad-message-warm-ready-v876','1');
        fr.removeAttribute('data-happyad-message-cache-prepare-v875');
        fr.removeAttribute('data-happyad-message-cache-from-page-v875');
        fr.classList.remove('on');
        fr.style.opacity='';fr.style.visibility='';
        fr.setAttribute('aria-hidden','true');fr.setAttribute('inert','');
        if(dormantRootV876){
          dormantRootV876.classList.remove('happyadMessageCachePreparingV876','happyadMessageCachePreparingWithinShellV876');
          if(activePage==='home'&&!dormantRootV876.querySelector('.happyadAppFrame.on'))dormantRootV876.classList.remove('on');
          dormantRootV876.setAttribute('aria-hidden','true');
        }
        pauseFrame(fr,'message-dormant-cache-ready-v876');
        try{window.__HAPPYAD_MESSAGE_DORMANT_WARMUP_V876={started:true,ready:true,at:Date.now(),count:Number(data&&data.count||0)||0,network:false};}catch(_warmMarker){}
        return true;
      }
      if(page==='profile'){fr.setAttribute('data-happyad-owner-persistent-v756','1');var ownerUid=String(data&&data.uid||'').trim();if(ownerUid){fr.setAttribute('data-happyad-owner-uid-v855r23',ownerUid);fr.removeAttribute('data-happyad-owner-guest-v855r23');}else{fr.removeAttribute('data-happyad-owner-uid-v855r23');fr.setAttribute('data-happyad-owner-guest-v855r23','1');}}
      if(fr.getAttribute('data-happyad-defer-visible')==='1'){
        revealFrame(fr,page,fr.getAttribute('data-happyad-route-url-v601')||fr.getAttribute('data-happyad-src')||pages[page]||'',type||'first-render-v625');
      }
      return true;
    }catch(_e){return false;}
  }

  window.HappyNavigation={
    version:MASTER_VERSION,rootUrl:rootUrl,pathOf:pathOf,pageOf:pageOf,profileUidFromUrl:profileUidFromUrl,isOwnProfileUid:isOwnProfileUid,strictAuthProfileUidV69:strictAuthProfileUidV69,open:open,openAppPage:openAppPage,close:close,back:back,restore:restore,
    currentPage:function(){return activePage;},currentUrl:function(){return activeUrl;},
    activeFrame:activeFrame,isBusy:navBusy,releaseNavGate:releaseNavGate,pauseFrame:pauseFrame,resumeFrame:resumeFrame,clearVideoRouteMemory:clearVideoRouteMemory,blankVideoFrame:blankVideoFrame,prefetchUrl:prefetchUrl,scheduleSoftPreload:scheduleSoftPreload,prepareOwnerProfile:prepareOwnerProfileOpenV649,
    preloadFrame:preloadFrame,preloadMainTabs:scheduleMainTabsPreloadV594,warmVideo:preloadVideoFrameV624,activateMainTab:activateMainTabV594,openVideoPost:openVideoPostV594,postToFrame:postToFrameV594,deliverVisitorProfile:deliverVisitorTargetV601,restoreProfileAfterPhoto:restoreProfileSurfaceAfterPhotoV656,invalidateOwnerProfile:destroyOwnerFrameV855R23,syncOwnerProfileAuth:syncOwnerProfileAuthV855R23
  };
  window.happyadOpenInternalUrlV492=function(url,extra){return window.HappyNavigation.open(url,extra||{});};
  window.happyadOpenAppPage=function(page,url){return window.HappyNavigation.openAppPage(page,url);};
  window.happyadCloseAppPage=function(){return window.HappyNavigation.back({source:'parent-api-v927'});};

  try{document.addEventListener('click',function(e){
    try{
      var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a)return;
      var href=a.getAttribute('href')||'';var rt=rootUrl(href);var pg=pageOf(rt);
      if(pg&&pg!=='home'&&pages[pg]){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();open(rt,{source:'doc-link'});return false;}
      if(pg==='home'&&(document.body.classList.contains('happyadAppOpen')||activePage!=='home')){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();close('home-link');return false;}
    }catch(_e){}
  },true);}catch(_e){}
  try{window.addEventListener('HAPPYAD_AUTH_STATE_V595',function(ev){
    var authDetail=ev&&ev.detail||{};
    try{syncOwnerProfileAuthV855R23(authDetail);}catch(_e){}
    /* V880 : si le routeur a démarré avant la confirmation Auth, préparer Mon
       profil dès que la session propriétaire devient valide, sans attendre un clic. */
    try{if(authDetail.authenticated&&activePage==='home')scheduleOwnerProfileWarmupV864(120);}catch(_warm){}
  },true);}catch(_e){}
  try{window.addEventListener('message',function(ev){
    try{
      var d=ev&&ev.data;if(!d)return;
      var readyType=String(d&&d.type||'');
      if(readyType==='HAPPYAD_PUBLISH_RETRY_V936'){
        var retryFrameV936=frameFromMessageSourceV623(ev&&ev.source);
        if(retryFrameV936&&String(retryFrameV936.getAttribute('data-happyad-page')||'')==='publish'){
          try{
            retryFrameV936.removeAttribute('data-happyad-first-render-ready-v623');
            retryFrameV936.removeAttribute('data-happyad-publish-ready-v936');
            retryFrameV936.removeAttribute('data-happyad-publish-failed-v936');
            retryFrameV936.setAttribute('data-happyad-defer-visible','1');
            retryFrameV936.setAttribute('data-happyad-skeleton-start',String(Date.now()));
            retryFrameV936.classList.remove('on');
            retryFrameV936.style.opacity='0';
            retryFrameV936.style.visibility='hidden';
            showSkeleton('publish',retryFrameV936.getAttribute('data-happyad-src')||persistentMainUrl('publish'),true);
          }catch(_retry){}
        }
        return;
      }
      if(activePage==='profile_public'&&(readyType==='HAPPYAD_VISITOR_PROFILE_NO_DOCK_V854R3'||((readyType==='HAPPYAD_PROFILE_VISUAL_READY_V621C'||readyType==='HAPPYAD_PROFILE_READY')&&String(d.mode||'')==='visitor')))applyVisitorDockLockV854R3(true,readyType||'visitor-ready');
      if(readyType==='HAPPYAD_INTERNAL_SCREEN_CLOSE_V591'&&d.detail&&String(d.detail.id||'')==='profile-photo'){
        restoreProfileSurfaceAfterPhotoV656(ev.source,d.detail||{});
      }
      if(readyType==='HAPPYAD_FRAME_BOOTSTRAP_READY_V623'||readyType==='HAPPYAD_FIRST_RENDER_READY_V623'||readyType==='HAPPYAD_FIRST_RENDER_READY_V622'||readyType==='HAPPYAD_MESSAGE_CACHE_READY_V875'||readyType==='HAPPYAD_MESSAGE_CENTER_READY'||readyType==='HAPPYAD_PROFILE_SHELL_READY_V877'||readyType==='HAPPYAD_PROFILE_VISUAL_READY_V621C'||readyType==='HAPPYAD_VIDEO_VISUAL_READY_V873'||readyType==='HAPPYAD_VIDEO_TAB_READY_V594'||readyType==='HAPPYAD_VIDEO_READY'||readyType==='HAPPYAD_PROFILE_READY'||readyType==='HAPPYAD_PROFILE_ENGINE_READY_V854'||readyType==='HAPPYAD_PUBLISH_READY_V936'||readyType==='HAPPYAD_PUBLISH_BOOT_FAILED_V936'){
        acceptFirstRenderV623(ev,d);
      }
      if(d==='HAPPYAD_CLOSE_APP_PAGE'||d.type==='HAPPYAD_CLOSE_APP_PAGE'||d.type==='HAPPYAD_NAV_BACK_REQUEST'){
        ev.stopImmediatePropagation&&ev.stopImmediatePropagation();
        return back({source:'frame-message-'+String(d.type||d)+'-v927'});
      }
      if(d.type==='HAPPYAD_PROFILE_SWITCH_PAINTED_V601'){
        if(activePage!=='profile_public')return false;
        ev.stopImmediatePropagation&&ev.stopImmediatePropagation();
        var vfr=document.getElementById(frameId('profile_public'));
        if(vfr){
          var expected=String(vfr.getAttribute('data-happyad-target-uid-v601')||'');
          if(!expected||!d.uid||String(d.uid)===expected){
            try{if(vfr.__happyadVisitorRevealFallbackV601){clearTimeout(vfr.__happyadVisitorRevealFallbackV601);vfr.__happyadVisitorRevealFallbackV601=null;}}catch(_vf){}
            revealFrame(vfr,'profile_public',vfr.getAttribute('data-happyad-route-url-v601')||activeUrl,'visitor-painted-v601');
          }
        }
        return true;
      }
      if(d.type==='HAPPYAD_OPEN_INTERNAL_URL' && d.url){
        ev.stopImmediatePropagation&&ev.stopImmediatePropagation();
        try{
          if(window.HappyNotificationReturnCenter&&typeof window.HappyNotificationReturnCenter.handoff==='function')window.HappyNotificationReturnCenter.handoff('notification-internal-url-v927');
          else if(window.HappyInternalReturnV587&&typeof window.HappyInternalReturnV587.closeNotification==='function')window.HappyInternalReturnV587.closeNotification('notification-internal-url-fallback-v927');
        }catch(_v587){}
        return open(d.url,d.extra||{source:'message-open'});
      }
    }catch(_e){}
  },true);}catch(_e){}

  /* V927 : le navigateur et le bouton Retour Android lisent la même pile que les
     commandes internes. Une couche superposée conserve la même route : le maître
     des retours internes la fermera sans que Navigation ne recharge la page. */
  function onCanonicalPopV927(ev){
    try{
      var next=ev&&ev.state;
      if(menuResetV927){
        if(isCanonicalStateV927(next)&&canonicalDepthV927(next)===0&&internalDepthV927(next)===0)finishMenuResetV927();
        return;
      }
      if(!isCanonicalStateV927(next))return;
      navDepthV927=canonicalDepthV927(next);
      var layerRestored=false;
      try{var internal=window.HappyInternalReturnV694||window.HappyInternalReturnV591;if(internal&&typeof internal.restoreHistoryState==='function')layerRestored=!!internal.restoreHistoryState(next);}catch(_internal){}
      /* Une couche suspendue conserve la route sur laquelle elle est née.
         Après C -> B (notification, chat...), on restaure donc aussi cette route
         sous la couche. Sinon B serait visuellement présent mais sa fermeture
         révélerait encore C au lieu de poursuivre vers A. */
      var restoredLayerV928=layerRestored?String(next[INTERNAL_LAYER_KEY_V927]||''):'';
      if(!sameRouteV927(next,activePage,activeUrl))restore(String(next.view||'home'),next.url||pages[next.view]||'index.html',{preserveInternalLayer:restoredLayerV928});
      if(layerRestored)return;
    }catch(_e){}
  }
  try{EventTarget.prototype.addEventListener.call(window,'popstate',onCanonicalPopV927,true);}catch(_pop){}

  function bootHomeSafety(){
    try{
      var st=currentNavState();
      if(!st||!st.view||st.view==='home'){
        showSkeleton('home','index.html',false);
        showVideoDirect('',false);
        showLoader(false);
        releaseNavGate('boot-home');
        clearBootRestoreMaskV16ZJ('boot-home');
        var root=shell();
        if(root&&!root.querySelector('.happyadAppFrame.on')){root.classList.remove('on');root.setAttribute('aria-hidden','true');}
        document.body.classList.remove('happyadAppOpen');
      }
    }catch(_e){}
  }
  function bootRestoreOpenPageV16ZJ(){
    try{
      var r=routeFromLocationV16ZH()||readReloadRouteV16ZH();
      if(!r||!r.view||String(r.view)==='home')return false;
      var nr=normalizeRouteForOpen(String(r.view),r.url||pages[r.view]||'index.html');
      if(nr.invalidPublic)return false;
      var page=nr.view;
      var url=nr.url;
      if(!pages[page]&&page!=='profile_public')return false;
      prepareBootRestoreShellV16ZJ(page,url);
      try{open(url,{page:page,fromPop:r.source==='history-state',force:true,source:r.source==='history-state'?'reload-canonical-v927':'url-entry-v927'});}catch(_o){}
      return true;
    }catch(_e){clearBootRestoreMaskV16ZJ('restore-error');return false;}
  }
  function bootV16ZJ(){
    ensureBaseState();
    var restored=bootRestoreOpenPageV16ZJ();
    if(!restored){
      bootHomeSafety();
      scheduleMainTabsPreloadV594();
    }
    try{window.__HAPPYAD_LAZY_MODULE_BOOT_V614__={at:Date.now(),preloadedFrames:0,directMainPages:true,visitorSkeletonOnly:true,visitorPostsPreload:false,profileBatchSize:12,hiddenNetworkFrames:false};}catch(_e){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bootV16ZJ,{once:true});else bootV16ZJ();
  try{if(window.HappyMasterRegistry)HappyMasterRegistry.register('navigation',{file:'core/navigation-master-v656.js',responsibility:'navigation unique, iframe, retour interne, bouton téléphone, ouverture modules',legacy:['happyadOpenInternalUrlV492','happyadOpenAppPage','happyadCloseAppPage','V492 router','V520 history'],active:true,version:MASTER_VERSION});}catch(_e){}
})();
