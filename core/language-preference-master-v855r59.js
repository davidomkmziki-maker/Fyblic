(function(){
'use strict';
if(window.HappyLanguagePreferenceV855R59)return;

var VERSION='HAPPYAD_LANGUAGE_PREFERENCE_V855R59';
var TABLE='happyad_user_settings';
var ACTIVE_KEY='HAPPYAD_ACTIVE_LANGUAGE_V855R59';
var CACHE_PREFIX='HAPPYAD_USER_SETTINGS_V1_';
var LEGACY_KEY='happyad_language_preference_v1';
var LANGUAGES={auto:1,fr:1,en:1,sw:1,ln:1,es:1,ar:1,zh:1,hi:1,pt:1,bn:1};
var state={preference:'auto',effective:'fr',uid:'',source:'boot',ready:false,updatedAt:''};
var authBound=false;
var refreshTimer=0;

function clean(value){return String(value==null?'':value).trim();}
function cleanUid(value){var uid=clean(value).toLowerCase();return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uid)?uid:'';}
function sanitize(value){var code=clean(value).toLowerCase();return LANGUAGES[code]?code:'auto';}
function deviceLanguage(){
  var raw='';
  try{raw=String((navigator.languages&&navigator.languages[0])||navigator.language||'fr').toLowerCase();}catch(_e){raw='fr';}
  if(raw.indexOf('fr')===0)return 'fr';
  if(raw.indexOf('en')===0)return 'en';
  if(raw.indexOf('sw')===0)return 'sw';
  if(raw.indexOf('ln')===0)return 'ln';
  if(raw.indexOf('es')===0)return 'es';
  if(raw.indexOf('ar')===0)return 'ar';
  if(raw.indexOf('zh')===0)return 'zh';
  if(raw.indexOf('hi')===0)return 'hi';
  if(raw.indexOf('pt')===0)return 'pt';
  if(raw.indexOf('bn')===0)return 'bn';
  return 'fr';
}
function currentUid(){
  try{var direct=cleanUid(localStorage.getItem('HAPPYAD_AUTH_UID'));if(direct)return direct;}catch(_e){}
  try{
    var user=JSON.parse(localStorage.getItem('HAPPYAD_CENTRAL_USER_V10_CLEAN_STATS_FULL')||'{}')||{};
    return cleanUid(user.id||user.user_id||user.uid);
  }catch(_e2){return '';}
}
function readCache(uid){
  uid=cleanUid(uid);if(!uid)return '';
  try{
    var cached=JSON.parse(localStorage.getItem(CACHE_PREFIX+uid)||'null');
    var value=cached&&cached.data&&cached.data.language;
    return value?sanitize(value):'';
  }catch(_e){return '';}
}
function readActive(){
  try{
    var saved=JSON.parse(localStorage.getItem(ACTIVE_KEY)||'null');
    if(saved&&typeof saved==='object')return {uid:cleanUid(saved.uid),preference:sanitize(saved.preference)};
  }catch(_e){}
  return null;
}
function initialPreference(uid){
  var cached=readCache(uid);if(cached)return cached;
  var active=readActive();if(active&&((uid&&active.uid===uid)||(!uid&&!active.uid)))return active.preference;
  try{var legacy=clean(localStorage.getItem(LEGACY_KEY));if(legacy)return sanitize(legacy);}catch(_e){}
  return 'auto';
}
function publicState(){return {version:VERSION,preference:state.preference,effective:state.effective,uid:state.uid,source:state.source,ready:state.ready,updatedAt:state.updatedAt};}
function sameOriginEvent(event){
  try{return !event.origin||event.origin===location.origin||location.origin==='null';}catch(_e){return false;}
}
function applyToDocument(targetWindow,effective,preference,source){
  if(!targetWindow)return;
  try{
    var doc=targetWindow.document;
    if(doc&&doc.documentElement){
      doc.documentElement.lang=effective;
      doc.documentElement.dataset.happyadLanguage=effective;
      doc.documentElement.dataset.happyadLanguagePreference=preference;
      doc.documentElement.dir=effective==='ar'?'rtl':'ltr';
      try{doc.documentElement.style.setProperty('--happyad-document-direction',effective==='ar'?'rtl':'ltr');}catch(_style){}
    }
    targetWindow.dispatchEvent(new targetWindow.CustomEvent('happyad:language-change',{detail:{preference:preference,effective:effective,source:source||'',version:VERSION}}));
  }catch(_e){}
}
function applyToFrame(frame,effective,preference,source){
  if(!frame)return;
  try{applyToDocument(frame.contentWindow,effective,preference,source);}catch(_e){}
  try{frame.contentWindow.postMessage({type:'HAPPYAD_LANGUAGE_APPLY_V855R58',detail:{preference:preference,effective:effective,source:source||'',version:VERSION}},location.origin==='null'?'*':location.origin);}catch(_e2){}
  try{
    var nested=frame.contentDocument&&frame.contentDocument.querySelectorAll?frame.contentDocument.querySelectorAll('iframe'):[];
    Array.prototype.forEach.call(nested,function(child){applyToFrame(child,effective,preference,source);});
  }catch(_e3){}
}
function broadcast(source){
  applyToDocument(window,state.effective,state.preference,source);
  var frames=document.querySelectorAll('iframe');
  Array.prototype.forEach.call(frames,function(frame){applyToFrame(frame,state.effective,state.preference,source);});
}
function persistActive(){
  try{localStorage.setItem(ACTIVE_KEY,JSON.stringify({uid:state.uid,preference:state.preference,effective:state.effective,updatedAt:new Date().toISOString()}));}catch(_e){}
}
function apply(preference,source,uid){
  preference=sanitize(preference);
  var explicitUid=arguments.length>=3;
  uid=explicitUid?cleanUid(uid):(state.uid||currentUid());
  state.preference=preference;
  state.effective=preference==='auto'?deviceLanguage():preference;
  state.uid=uid;
  state.source=source||'apply';
  state.ready=true;
  state.updatedAt=new Date().toISOString();
  persistActive();
  broadcast(state.source);
  return publicState();
}
function client(){
  try{if(typeof window.happyadSb==='function'){var c=window.happyadSb();if(c&&c.from&&c.auth)return c;}}catch(_e){}
  try{if(window.happyadSupabase&&window.happyadSupabase.from&&window.happyadSupabase.auth)return window.happyadSupabase;}catch(_e2){}
  try{if(window.supabaseClient&&window.supabaseClient.from&&window.supabaseClient.auth)return window.supabaseClient;}catch(_e3){}
  return null;
}
async function sessionUser(c){
  if(!c||!c.auth)return null;
  try{var s=await c.auth.getSession();var u=s&&s.data&&s.data.session&&s.data.session.user;if(u&&cleanUid(u.id))return u;}catch(_e){}
  try{var r=await c.auth.getUser();var user=r&&r.data&&r.data.user;if(user&&cleanUid(user.id))return user;}catch(_e2){}
  return null;
}
async function refresh(source){
  clearTimeout(refreshTimer);
  var c=client();
  var uid=currentUid();
  if(!c){apply(initialPreference(uid),source||'local',uid);return publicState();}
  var user=await sessionUser(c);
  uid=cleanUid(user&&user.id)||uid;
  if(!uid){apply('auto',source||'signed-out','');return publicState();}
  var fallback=initialPreference(uid);
  try{
    var result=await c.from(TABLE).select('language,updated_at').eq('user_id',uid).maybeSingle();
    if(result&&result.error)throw result.error;
    var remote=result&&result.data&&result.data.language;
    if(remote){
      apply(remote,source||'remote',uid);
      if(result.data.updated_at)state.updatedAt=String(result.data.updated_at);
      return publicState();
    }
  }catch(_e){}
  apply(fallback,source||'cache',uid);
  return publicState();
}
function scheduleRefresh(delay,source){
  clearTimeout(refreshTimer);
  refreshTimer=setTimeout(function(){refresh(source||'scheduled').catch(function(){});},Math.max(0,Number(delay)||0));
}
function bindAuth(){
  if(authBound)return;
  var c=client();if(!c||!c.auth||typeof c.auth.onAuthStateChange!=='function')return;
  authBound=true;
  try{c.auth.onAuthStateChange(function(event,session){
    var uid=cleanUid(session&&session.user&&session.user.id);
    if(!uid){apply('auto','auth-'+String(event||'signed-out').toLowerCase(),'');return;}
    scheduleRefresh(60,'auth-'+String(event||'change').toLowerCase());
  });}catch(_e){authBound=false;}
}

window.addEventListener('message',function(event){
  if(!sameOriginEvent(event))return;
  var data=event&&event.data||{};
  if(data.type!=='HAPPYAD_LANGUAGE_PREFERENCE_V855R59')return;
  var detail=data.detail||{};
  apply(detail.preference,'settings-message',detail.uid||currentUid());
},true);
window.addEventListener('storage',function(event){
  var uid=currentUid();
  if(event.key===ACTIVE_KEY||event.key===CACHE_PREFIX+uid)scheduleRefresh(20,'storage-sync');
},true);
window.addEventListener('languagechange',function(){if(state.preference==='auto')apply('auto','device-language-change',state.uid);},true);
window.addEventListener('pageshow',function(){scheduleRefresh(40,'pageshow');},true);

document.addEventListener('load',function(event){
  var target=event&&event.target;
  if(target&&String(target.tagName||'').toLowerCase()==='iframe')applyToFrame(target,state.effective,state.preference,'iframe-load');
},true);
try{
  new MutationObserver(function(records){
    records.forEach(function(record){
      Array.prototype.forEach.call(record.addedNodes||[],function(node){
        if(!node||node.nodeType!==1)return;
        if(String(node.tagName||'').toLowerCase()==='iframe')applyToFrame(node,state.effective,state.preference,'iframe-added');
        if(node.querySelectorAll)Array.prototype.forEach.call(node.querySelectorAll('iframe'),function(frame){applyToFrame(frame,state.effective,state.preference,'iframe-added');});
      });
    });
  }).observe(document.documentElement,{childList:true,subtree:true});
}catch(_e){}

state.uid=currentUid();
apply(initialPreference(state.uid),'startup-cache',state.uid);
bindAuth();
scheduleRefresh(0,'startup-remote');
setTimeout(bindAuth,500);
setTimeout(function(){bindAuth();scheduleRefresh(0,'startup-confirm');},1600);

window.HappyLanguagePreferenceV855R59={
  version:VERSION,
  getState:publicState,
  apply:function(preference){return apply(preference,'api',currentUid());},
  refresh:function(){return refresh('api-refresh');},
  deviceLanguage:deviceLanguage
};
})();
