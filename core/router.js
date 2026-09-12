(function(){
  'use strict';
  if(window.HappyRouter)return;
  function cleanRoute(name){return String(name||'home').replace(/^#/,'').trim()||'home';}
  function activeVisitorUid(){try{return String(sessionStorage.getItem('HAPPYAD_PROFILE_MASTER_ACTIVE_UID')||localStorage.getItem('HAPPYAD_PUBLIC_PROFILE_ACTIVE_UID')||localStorage.getItem('HAPPYAD_ACTIVE_PROFILE_UID')||'').trim();}catch(_e){return '';}}
  function buildUrl(name,params){
    name=cleanRoute(name);params=params||{};
    if(name==='home')return 'index.html';
    if(name==='video')return 'modules/video.html'+(params.postId?('?post='+encodeURIComponent(params.postId)):'');
    if(name==='photo')return 'modules/photo.html'+(params.postId?('?post='+encodeURIComponent(params.postId)):'');
    if(name==='myProfile')return 'modules/my-profile.html';
    if(name==='visitorProfile'){
      var uid=String(params.uid||params.user_id||params.profile_uid||params.auth_user_id||params.authUserId||params.account_uid||params.accountUid||activeVisitorUid()||'').trim();
      if(!uid)return 'modules/my-profile.html';
      return 'modules/visitor-profile.html?uid='+encodeURIComponent(uid)+(params.postId?('&post='+encodeURIComponent(params.postId)):'');
    }
    if(name==='publish')return 'modules/publish.html';
    if(name==='map'||name==='localisation')return 'modules/map.html';
    return name;
  }
  function openRoute(name,params,options){name=cleanRoute(name);params=params||{};options=options||{};try{if(window.HappyMedia)HappyMedia.pauseAll('router-go-'+name);}catch(_e){}try{if(window.HappyHistory&&!options.replace)HappyHistory.push({name:name,params:params});else if(window.HappyHistory)HappyHistory.replace({name:name,params:params});}catch(_e){}try{if(window.HappyState)HappyState.route(name,params,'router-go');}catch(_e){}var url=buildUrl(name,params);try{if(name==='home'){if(typeof window.happyadCloseAppPage==='function'){window.happyadCloseAppPage();return true;}location.href='index.html';return true;}if(typeof window.happyadOpenAppPage==='function'){window.happyadOpenAppPage(name,url);return true;}if(typeof window.happyadOpenInternalUrlV492==='function'){window.happyadOpenInternalUrlV492(url);return true;}}catch(_e){}if(!options.noNavigate)location.href=url;return true;}
  window.HappyRouter={go:openRoute,url:buildUrl,back:function(){return false;},current:function(){try{return HappyHistory.current();}catch(_e){return {name:'home',params:{}};}}};
})();
