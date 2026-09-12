(function(){
  'use strict';
  if(window.__HAPPYAD_PROFILE_AVATAR_RECOVERY_MASTER_V743__)return;
  window.__HAPPYAD_PROFILE_AVATAR_RECOVERY_MASTER_V743__=true;

  /* V855R32 : compatibilité avec les anciens appels V743. La récupération depuis
     les posts, stories, auth_metadata ou anciens caches est volontairement
     supprimée. public.profiles.avatar_url est désormais l'unique autorité et une
     valeur NULL est un état définitif, jamais une photo à « réparer ». */
  var M=window.HappyProfileAvatarMasterV855R32||window.HappyProfileAvatarMaster||null;
  function clean(v){return String(v==null?'':v).trim();}
  function currentUid(){
    try{return clean(localStorage.getItem('HAPPYAD_AUTH_UID'));}catch(_e){return '';}
  }
  function repair(force){
    var uid=currentUid();
    if(!uid||!M||typeof M.resolve!=='function')return Promise.resolve(null);
    return M.resolve(uid,{force:!!force});
  }
  function current(){var uid=currentUid(),entry=M&&uid&&M.getEntry(uid);return entry&&entry.known?entry.url:'';}
  window.HappyadProfileAvatarRecoveryV743=Object.freeze({
    build:'PROFILE_AVATAR_RECOVERY_V743_COMPAT_V855R32_NO_RESURRECTION',
    repair:repair,
    current:current,
    isVisitorSurface:function(){return false;}
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){repair(false);},{once:true});else repair(false);
  window.addEventListener('online',function(){repair(true);});
})();
