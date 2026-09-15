(function(){
'use strict';
if(window.HappyProfileLinkMasterV992)return;

var VERSION='V996_MENTION_PRIMARY_NAME_BADGE';
var STORAGE_KEY='HAPPYAD_MENTION_PROFILE_CACHE_V996';
var CACHE=Object.create(null),PENDING=Object.create(null),saveTimer=0,realtimeStarted=false,realtimeChannel=null;

function clean(v){return String(v==null?'':v).trim();}
function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c;});}
function low(v){return clean(v).toLowerCase();}
function client(){
  try{if(window.HappySupabaseClientMasterV972&&typeof window.HappySupabaseClientMasterV972.get==='function')return window.HappySupabaseClientMasterV972.get();}catch(_e){}
  try{if(typeof window.happyadSb==='function')return window.happyadSb();}catch(_e2){}
  try{if(window.happyadSupabase)return window.happyadSupabase;}catch(_e3){}
  try{if(window.parent&&window.parent!==window){if(window.parent.HappySupabaseClientMasterV972&&typeof window.parent.HappySupabaseClientMasterV972.get==='function')return window.parent.HappySupabaseClientMasterV972.get();if(typeof window.parent.happyadSb==='function')return window.parent.happyadSb();if(window.parent.happyadSupabase)return window.parent.happyadSupabase;}}catch(_e4){}
  return null;
}
function uidOf(p,allowId){p=p||{};return clean(p.user_id||p.authorId||p.author_id||p.userId||p.auth_user_id||p.authUserId||p.profile_uid||p.profile_id||p.owner_id||p.ownerId||p.uid||(allowId?p.id:''));}
function profilePayload(p,uid){
  p=p||{};uid=clean(uid||uidOf(p,true));var handle=clean(p.username||p.handle||p.authorHandle).replace(/^@+/,'');
  var name=clean(p.full_name||p.display_name||p.name||p.author||p.author_name)||handle||'Utilisateur Fyblic';
  return {id:uid,user_id:uid,uid:uid,name:name,full_name:name,display_name:name,username:handle,handle:handle,avatar:clean(p.avatar_url||p.avatar||p.author_avatar||p.photo_url),avatar_url:clean(p.avatar_url||p.avatar||p.author_avatar||p.photo_url),badge:clean(p.badge||p.user_badge||p.author_badge||p.profile_badge||p.verification_badge||p.verified_badge),updated_at:clean(p.updated_at),__happyadUidLocked:true};
}
function normalizeProfile(p){
  p=p||{};var out=profilePayload(p,uidOf(p,true)),h=low(out.username);if(!out.id||!h)return null;out.username=h;out.handle=h;return out;
}
function loadCache(){
  try{var raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')||{};Object.keys(raw).forEach(function(h){var row=raw[h];if(!row||!row.data)return;var p=normalizeProfile(row.data);if(p)CACHE[low(h)]={at:Number(row.at||0)||0,data:p};});}catch(_e){}
}
function saveCacheSoon(){
  clearTimeout(saveTimer);saveTimer=setTimeout(function(){saveTimer=0;try{var keys=Object.keys(CACHE).sort(function(a,b){return Number(CACHE[b].at||0)-Number(CACHE[a].at||0);}).slice(0,300),out={};keys.forEach(function(h){out[h]={at:CACHE[h].at,data:CACHE[h].data};});localStorage.setItem(STORAGE_KEY,JSON.stringify(out));}catch(_e){}},100);
}
function badgeHtmlFromValue(v){
  v=clean(v);if(!v)return '';
  try{if(typeof window.badgeMarkHtml==='function'){var h=window.badgeMarkHtml(v);if(h)return h;}}catch(_e){}
  try{if(window.parent&&window.parent!==window&&typeof window.parent.badgeMarkHtml==='function'){var ph=window.parent.badgeMarkHtml(v);if(ph)return ph;}}catch(_e2){}
  var b=low(v),cls='';if(/rose|pink/.test(b))cls='rose';else if(/violet|purple|jaune|yellow|business/.test(b))cls='violet';else if(/bleu|blue|verif|cert/.test(b))cls='bleu';
  return cls?'<span class="happyBadgeMark '+cls+'" aria-label="Compte vérifié"></span>':'';
}
function mentionLabelHtml(p,handle){
  p=p||{};var name=clean(p.full_name||p.name||p.display_name)||clean(handle).replace(/^@+/,'')||'Utilisateur Fyblic';
  return '<span class="happyadCommentMentionNameV995">@'+esc(name)+'</span>'+badgeHtmlFromValue(p.badge);
}
function selectorHandle(h){try{return window.CSS&&CSS.escape?CSS.escape(h):h.replace(/["\\]/g,'\\$&');}catch(_e){return h;}}
function paintHandle(handle,p,root){
  handle=low(handle).replace(/^@+/,'');if(!handle)return;p=p||cached(handle);if(!p)return;root=root||document;
  try{root.querySelectorAll('[data-happyad-comment-mention-v992="'+selectorHandle(handle)+'"]').forEach(function(el){el.innerHTML=mentionLabelHtml(p,handle);el.setAttribute('aria-label','@'+clean(p.name||p.full_name||handle));if(p.id)el.setAttribute('data-happyad-comment-mention-uid-v995',p.id);});}catch(_e){}
}
function cached(handle){var hit=CACHE[low(handle).replace(/^@+/,'')];return hit&&hit.data||null;}
function rememberProfile(p,options){
  options=options||{};var n=normalizeProfile(p);if(!n)return null;var h=low(n.username),old=CACHE[h]&&CACHE[h].data||{};
  n=Object.assign({},old,n);CACHE[h]={at:Date.now(),data:n};paintHandle(h,n,document);saveCacheSoon();return n;
}
function queueHydrate(handle,delay){
  handle=low(handle).replace(/^@+/,'');if(!handle||PENDING[handle])return;
  PENDING[handle]=setTimeout(function(){delete PENDING[handle];resolveMention(handle,{force:true,allowCached:false}).catch(function(){});},Number(delay||40));
}
function scanMentions(root){
  root=root||document;var nodes=[];try{if(root.matches&&root.matches('[data-happyad-comment-mention-v992]'))nodes.push(root);if(root.querySelectorAll)root.querySelectorAll('[data-happyad-comment-mention-v992]').forEach(function(x){nodes.push(x);});}catch(_e){}
  var seen=Object.create(null);nodes.forEach(function(el){var h=low(el.getAttribute('data-happyad-comment-mention-v992')||'').replace(/^@+/,'');if(!h||seen[h])return;seen[h]=1;var hit=cached(h);if(hit)paintHandle(h,hit,root);queueHydrate(h,55);});
}
function master(){try{if(window.HappyProfile)return window.HappyProfile;}catch(_e){}try{if(window.parent&&window.parent!==window&&window.parent.HappyProfile)return window.parent.HappyProfile;}catch(_e2){}return null;}
function openProfile(p,opts){
  opts=opts||{};var uid=clean(opts.uid||uidOf(p,true));if(!uid)return false;var payload=profilePayload(p,uid),m=master();
  try{localStorage.setItem('HAPPYAD_ACTIVE_PROFILE',JSON.stringify(payload));}catch(_e){}
  try{if(m&&typeof m.openVisitor==='function')return m.openVisitor(uid,payload,{source:clean(opts.source)||'profile-link-master-v995',postId:clean(opts.postId)});}catch(_e2){}
  var url='modules/visitor-profile.html?uid='+encodeURIComponent(uid)+(opts.postId?'&post='+encodeURIComponent(opts.postId):'');
  try{if(window.parent&&window.parent!==window){window.parent.postMessage({type:'HAPPYAD_OPEN_INTERNAL_URL',url:url,source:clean(opts.source)||'profile-link-master-v995'},'*');return true;}}catch(_e3){}
  try{location.href=(location.pathname.indexOf('/modules/')>=0?'visitor-profile.html?uid=':'modules/visitor-profile.html?uid=')+encodeURIComponent(uid);return true;}catch(_e4){return false;}
}
async function resolveMention(raw,options){
  options=options||{};var handle=low(raw).replace(/^@+/,'');if(!handle)return null;var hit=CACHE[handle];
  if(options.allowCached!==false&&hit&&hit.data){if(options.force!==true||Date.now()-Number(hit.at||0)<15000)return hit.data;}
  var c=client();if(!c||!c.from)return hit&&hit.data||null;
  try{
    async function profileLookup(exact){
      var select='id,full_name,username,avatar_url,badge,updated_at',builder=c.from('profiles').select(select);
      var r=exact?await builder.eq('username',handle).limit(1):await builder.ilike('username',handle).limit(1);
      if(r&&r.error){
        var legacy=c.from('profiles').select('id,full_name,username,avatar_url,badge');
        r=exact?await legacy.eq('username',handle).limit(1):await legacy.ilike('username',handle).limit(1);
      }
      return r&&!r.error&&Array.isArray(r.data)?r.data[0]||null:null;
    }
    var row=await profileLookup(true);if(!row)row=await profileLookup(false);
    if(row)return rememberProfile(row,{source:'profiles'});
  }catch(_e){}
  return hit&&hit.data||null;
}
async function openMention(raw,opts){
  var h=low(raw).replace(/^@+/,'');var p=cached(h);if(p&&p.id){queueHydrate(h,0);return openProfile(p,Object.assign({},opts||{},{uid:p.id}));}
  p=await resolveMention(h,{force:true});if(!p)return false;return openProfile(p,Object.assign({},opts||{},{uid:p.id}));
}
async function openComment(c,opts){c=c||{};var uid=uidOf(c,false);if(uid)return openProfile(profilePayload(c,uid),Object.assign({},opts||{},{uid:uid}));var h=clean(c.username||c.handle||c.authorHandle).replace(/^@+/,'');if(h)return openMention(h,opts);return false;}
function mentionHtml(value){
  var text=String(value==null?'':value),out='',last=0,re=/(^|[^A-Za-z0-9._-])@([A-Za-z0-9][A-Za-z0-9._-]{0,63})/g,m,handles=[];
  while((m=re.exec(text))){var at=m.index+m[1].length;out+=esc(text.slice(last,at));var handle=low(m[2]),full='@'+m[2],hit=cached(handle);out+='<span class="happyadCommentMentionV992" role="link" tabindex="0" data-happyad-comment-mention-v992="'+esc(handle)+'">'+(hit?mentionLabelHtml(hit,handle):esc(full))+'</span>';handles.push(handle);last=at+full.length;}
  out+=esc(text.slice(last));if(handles.length)setTimeout(function(){handles.forEach(function(h){queueHydrate(h,35);});},0);return out;
}
function ensureStyle(){
  try{if(document.getElementById('happyad-profile-link-v992-style'))return;var s=document.createElement('style');s.id='happyad-profile-link-v992-style';s.textContent='.happyadCommentMentionV992{display:inline-flex!important;align-items:center!important;gap:3px!important;color:#168bff!important;font-weight:780!important;cursor:pointer!important;text-decoration:none!important;-webkit-tap-highlight-color:transparent;vertical-align:baseline}.happyadCommentMentionV992:active{opacity:.72}.happyadCommentMentionNameV995{color:#168bff!important}.happyadCommentMentionV992 .happyBadgeMark{width:13px!important;height:13px!important;flex:0 0 13px!important;margin:0 1px!important;vertical-align:-1px!important}.happyadProfileIdentityLinkV992{cursor:pointer!important;-webkit-tap-highlight-color:transparent}';document.head.appendChild(s);}catch(_e){}
}
function startRealtime(){
  if(realtimeStarted)return;var c=client();if(!c||!c.channel)return;realtimeStarted=true;
  try{realtimeChannel=c.channel('happyad-mention-current-profile-v995').on('postgres_changes',{event:'UPDATE',schema:'public',table:'profiles'},function(payload){try{var row=payload&&payload.new||null;if(row&&row.username)rememberProfile(row,{source:'realtime'});}catch(_e){}}).subscribe();}catch(_e2){realtimeStarted=false;realtimeChannel=null;}
}
function init(){
  ensureStyle();scanMentions(document);try{new MutationObserver(function(records){records.forEach(function(r){[].slice.call(r.addedNodes||[]).forEach(function(n){if(n&&n.nodeType===1)scanMentions(n);});});}).observe(document.documentElement,{subtree:true,childList:true});}catch(_e){}
  startRealtime();setTimeout(startRealtime,1800);
}
loadCache();ensureStyle();
window.HappyProfileLinkMasterV992={version:VERSION,mentionHtml:mentionHtml,resolveMention:resolveMention,openMention:openMention,openProfile:openProfile,openComment:openComment,profilePayload:profilePayload,rememberProfile:rememberProfile,cachedMention:cached,scanMentions:scanMentions,paintMention:paintHandle};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
