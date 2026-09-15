(function(){
  'use strict';
  if(window.HappyState)return;
  var state={version:'CORE_STRUCTURE_V16ZA',activeModule:'home',activeRoute:{name:'home',params:{},source:'boot'},currentUser:null,requestedUid:null,flags:{pwaDisabled:!!window.__HAPPYAD_PWA_DISABLED__}};
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(_e){return v;}}
  window.HappyState={
    get:function(key){return key?state[key]:clone(state);},
    set:function(key,value){state[key]=value;return value;},
    merge:function(obj){Object.assign(state,obj||{});return clone(state);},
    route:function(name,params,source){state.activeModule=name||'home';state.activeRoute={name:name||'home',params:params||{},source:source||'unknown',ts:Date.now()};return clone(state.activeRoute);},
    user:function(user){if(arguments.length){state.currentUser=user||null;}return state.currentUser;},
    visitor:function(uid){if(arguments.length){state.requestedUid=uid||null;}return state.requestedUid;}
  };
})();
