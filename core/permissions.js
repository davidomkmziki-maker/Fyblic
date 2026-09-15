(function(){
  'use strict';
  if(window.HappyPermissions)return;
  window.HappyPermissions={
    isLoggedIn:function(){try{return !!(window.HappyAuth&&HappyAuth.id());}catch(_e){return false;}},
    isOwner:function(uid){try{return !!(window.HappyAuth&&HappyAuth.isOwner(uid));}catch(_e){return false;}},
    modeForProfile:function(uid){return this.isOwner(uid)?'myProfile':'visitorProfile';},
    canAct:function(action,ownerUid){if(action==='view')return true;if(!this.isLoggedIn())return false;if(action==='edit'||action==='delete')return this.isOwner(ownerUid);return true;}
  };
})();
