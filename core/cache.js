(function(){
  'use strict';
  if(window.HappyCache)return;
  var prefix='HAPPYAD_CORE_';
  function key(k){return prefix+String(k||'').replace(/^HAPPYAD_CORE_/,'');}
  window.HappyCache={
    key:key,
    get:function(k,def){try{var raw=localStorage.getItem(key(k));return raw==null?def:JSON.parse(raw);}catch(_e){return def;}},
    set:function(k,v){try{localStorage.setItem(key(k),JSON.stringify(v));}catch(_e){}return v;},
    del:function(k){try{localStorage.removeItem(key(k));}catch(_e){}},
    sessionGet:function(k,def){try{var raw=sessionStorage.getItem(key(k));return raw==null?def:JSON.parse(raw);}catch(_e){return def;}},
    sessionSet:function(k,v){try{sessionStorage.setItem(key(k),JSON.stringify(v));}catch(_e){}return v;},
    clearPwaCaches:function(){try{if(window.caches&&caches.keys)caches.keys().then(function(keys){keys.forEach(function(k){try{var n=String(k||'');if(/^happyad-message-media-v1$|^happyad-push-state-v1$/i.test(n))return;if(n.toLowerCase().indexOf('happyad')>-1)caches.delete(k);}catch(_e){}});});}catch(_e){}},
    auditKeys:function(){var out=[];try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(/^HAPPYAD_/i.test(k))out.push({type:'localStorage',key:k});}}catch(_e){}try{for(var j=0;j<sessionStorage.length;j++){var sk=sessionStorage.key(j);if(/^HAPPYAD_/i.test(sk))out.push({type:'sessionStorage',key:sk});}}catch(_e){}return out;}
  };
})();
