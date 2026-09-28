/* Fyblic VIDEO QUALITY MASTER V1099
   Preference locale par utilisateur : Auto / 1080p / 720p / 540p / 360p.
   - aucun SQL / aucune ecriture serveur
   - le choix manuel domine toujours l'adaptation reseau
   - Auto = 1080p prioritaire ; ouverture depuis une carte Accueil = 1080p si disponible
*/
(function(){
  'use strict';
  if(window.HappyVideoQualityMasterV1099)return;

  var BASE_KEY='FYBLIC_VIDEO_QUALITY_PREF_V1099';
  var ALLOWED={auto:1,'1080p':1,'720p':1,'540p':1,'360p':1};

  function clean(v){return String(v==null?'':v).trim();}
  function uid(){
    try{
      var direct=clean(localStorage.getItem('HAPPYAD_AUTH_UID')||localStorage.getItem('HAPPYAD_USER_ID')||'');
      if(direct)return direct;
      var keys=['HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL','HAPPYAD_CURRENT_USER','HAPPYAD_AUTH_USER','HAPPYAD_USER'];
      for(var i=0;i<keys.length;i++){
        try{var u=JSON.parse(localStorage.getItem(keys[i])||'null');var id=clean(u&&(u.id||u.user_id||u.uid||u.auth_id||u.profile_id));if(id)return id;}catch(_e){}
      }
      for(var j=0;j<localStorage.length;j++){
        var k=localStorage.key(j)||'';
        if(k.indexOf('sb-')!==0||k.indexOf('-auth-token')<0)continue;
        try{var token=JSON.parse(localStorage.getItem(k)||'null');var tid=clean(token&&token.user&&(token.user.id||token.user.user_id));if(tid)return tid;}catch(_t){}
      }
    }catch(_scan){}
    return 'guest';
  }
  function storageKey(){return BASE_KEY+':'+uid();}
  function normalize(q){q=clean(q).toLowerCase();return ALLOWED[q]?q:'auto';}
  function get(){try{return normalize(localStorage.getItem(storageKey())||'auto');}catch(_e){return 'auto';}}
  function set(q){
    q=normalize(q);
    try{localStorage.setItem(storageKey(),q);}catch(_e){}
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_VIDEO_QUALITY_CHANGED_V1099',{detail:{quality:q,userId:uid(),at:Date.now()}}));}catch(_ev){}
    try{window.postMessage({type:'HAPPYAD_VIDEO_QUALITY_CHANGED_V1099',quality:q,userId:uid(),at:Date.now()},'*');}catch(_pm){}
    return q;
  }
  function isManual(){return get()!=='auto';}
  function canonicalKey(key){
    key=clean(key).toLowerCase().replace(/\s+/g,'');
    if(key==='1080'||key==='1080p'||key==='fullhd'||key==='fhd')return '1080p';
    if(key==='720'||key==='720p'||key==='hd')return '720p';
    if(key==='540'||key==='540p'||key==='qhd')return '540p';
    if(key==='360'||key==='360p'||key==='sd')return '360p';
    return key;
  }
  function normalizeVariants(value){
    var out={};
    if(!value)return out;
    function put(k,v){
      var key=canonicalKey(k),url='';
      if(typeof v==='string')url=v;
      else if(v&&typeof v==='object')url=v.url||v.src||v.media_url||v.mediaUrl||v.path||'';
      url=clean(url);if(key&&url)out[key]=url;
    }
    if(Array.isArray(value))value.forEach(function(item){if(item&&typeof item==='object')put(item.name||item.quality||item.label||'',item);});
    else if(typeof value==='object')Object.keys(value).forEach(function(k){put(k,value[k]);});
    return out;
  }
  function autoDesired(){
    try{
      var c=navigator.connection||navigator.mozConnection||navigator.webkitConnection||{};
      var effective=clean(c.effectiveType).toLowerCase(),down=Number(c.downlink||0);
      /* Auto reste volontairement conservateur : 1080p sauf reseau franchement faible. */
      if(down>0){
        if(down<0.30)return '360p';
        if(down<0.55)return '540p';
        if(down<0.95)return '720p';
        return '1080p';
      }
      if(effective==='slow-2g')return '360p';
      if(effective==='2g')return '540p';
      if(effective==='3g')return '720p';
      return '1080p';
    }catch(_e){return '1080p';}
  }
  function desired(options){
    options=options||{};
    var pref=get();
    if(pref!=='auto')return pref;
    if(options.initialCard===true||options.force1080===true)return '1080p';
    return autoDesired();
  }
  function orderFor(q){
    q=normalize(q)==='auto'?'1080p':normalize(q);
    if(q==='1080p')return ['1080p','720p','540p','360p'];
    if(q==='720p')return ['720p','540p','360p','1080p'];
    if(q==='540p')return ['540p','360p','720p','1080p'];
    return ['360p','540p','720p','1080p'];
  }
  function pick(variants,fallback,options){
    var map=normalizeVariants(variants),wanted=desired(options),order=orderFor(wanted);
    for(var i=0;i<order.length;i++)if(map[order[i]])return {url:map[order[i]],quality:order[i],wanted:wanted,preference:get()};
    return {url:clean(fallback),quality:'',wanted:wanted,preference:get()};
  }
  function label(q){q=normalize(q==null?get():q);return q==='auto'?'Auto · 1080p prioritaire':q;}

  window.HappyVideoQualityMasterV1099={version:'V1099',get:get,set:set,isManual:isManual,desired:desired,autoDesired:autoDesired,normalizeVariants:normalizeVariants,pick:pick,label:label,userId:uid,storageKey:storageKey};
})();
