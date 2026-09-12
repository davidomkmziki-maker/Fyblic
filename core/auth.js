(function(){
  'use strict';
  if(window.HappyAuth)return;
  window.HappyAuth={
    currentUser:function(){try{if(window.currentUser)return window.currentUser;}catch(_e){}try{var u=localStorage.getItem('happyad_current_user')||localStorage.getItem('HAPPYAD_CURRENT_USER');if(u)return JSON.parse(u);}catch(_e){}return null;},
    id:function(){var u=this.currentUser();return u&&(u.id||u.uid||u.user_id)||null;},
    isOwner:function(uid){var id=this.id();return !!id&&!!uid&&String(id)===String(uid);},
    logoutCleanup:function(){try{if(window.HappyState)HappyState.user(null);}catch(_e){}}
  };
})();
