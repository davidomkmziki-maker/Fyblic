(function(){
'use strict';
if(window.HappyMessagePrivacyV855R51)return;
var policyCache=new Map();
function clean(v){return String(v==null?'':v).trim();}
function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(v));}
function bool(v,f){if(v===true||v===false)return v;var s=clean(v).toLowerCase();if(s==='true'||s==='1'||s==='yes'||s==='on')return true;if(s==='false'||s==='0'||s==='no'||s==='off')return false;return !!f;}
function client(){
  try{
    if(window.happyadSupabase&&window.happyadSupabase.rpc)return window.happyadSupabase;
    if(window.supabaseClient&&window.supabaseClient.rpc)return window.supabaseClient;
    if(typeof window.happyadSb==='function'){var shared=window.happyadSb();if(shared&&shared.rpc)return shared;}
    if(window.HappySupabaseClientMasterV972&&typeof window.HappySupabaseClientMasterV972.get==='function')return window.HappySupabaseClientMasterV972.get();
  }catch(_e){}
  return null;
}
function normalizePolicy(data){
  var row=Array.isArray(data)?(data[0]||{}):(data||{});
  return {
    unknownMessages:bool(row.unknown_messages,false),
    readReceipts:bool(row.read_receipts,false),
    typingIndicator:bool(row.typing_indicator,false),
    activeStatus:bool(row.active_status,false),
    calls:bool(row.calls_allowed,false),
    viewerIsKnown:bool(row.viewer_is_known,false),
    newConversationAllowed:bool(row.new_conversation_allowed,false),
    available:true
  };
}
function safePolicy(){return {unknownMessages:false,readReceipts:false,typingIndicator:false,activeStatus:false,calls:false,viewerIsKnown:false,newConversationAllowed:false,available:false};}
async function loadPolicy(targetId,force){
  targetId=clean(targetId);if(!isUuid(targetId))return safePolicy();
  if(!force&&policyCache.has(targetId))return policyCache.get(targetId);
  var c=client();if(!c)return safePolicy();
  try{
    var r=await c.rpc('happyad_message_privacy_v855r51',{p_target:targetId});
    if(r&&r.error)throw r.error;
    var p=normalizePolicy(r&&r.data);policyCache.set(targetId,p);return p;
  }catch(_e){return safePolicy();}
}
async function loadPolicies(targetIds){
  var ids=Array.from(new Set((targetIds||[]).map(clean).filter(isUuid))).slice(0,100);
  if(!ids.length)return policyCache;
  var missing=ids.filter(function(id){return !policyCache.has(id);});
  if(!missing.length)return policyCache;
  var c=client();if(!c)return policyCache;
  try{
    var r=await c.rpc('happyad_message_privacy_batch_v855r51',{p_targets:missing});
    if(r&&r.error)throw r.error;
    (Array.isArray(r.data)?r.data:[]).forEach(function(row){
      var id=clean(row&&row.target_user_id);if(id)policyCache.set(id,normalizePolicy(row));
    });
  }catch(_e){
    await Promise.all(missing.map(function(id){return loadPolicy(id,false);}));
  }
  return policyCache;
}
async function touchPresence(conversationId,typing){
  var c=client();if(!c)return false;
  var args={p_conversation:isUuid(conversationId)?clean(conversationId):null,p_typing:!!typing};
  try{var r=await c.rpc('happyad_message_presence_touch_v855r51',args);if(r&&r.error)throw r.error;return true;}catch(_e){return false;}
}
async function readPresence(targetId,conversationId){
  var c=client();if(!c||!isUuid(targetId))return {active:false,typing:false};
  try{
    var r=await c.rpc('happyad_message_presence_read_v855r51',{p_target:clean(targetId),p_conversation:isUuid(conversationId)?clean(conversationId):null});
    if(r&&r.error)throw r.error;
    var row=Array.isArray(r.data)?(r.data[0]||{}):(r.data||{});
    return {active:bool(row.active_visible,false),typing:bool(row.typing_visible,false)};
  }catch(_e){return {active:false,typing:false};}
}
function clear(targetId){if(targetId)policyCache.delete(clean(targetId));else policyCache.clear();}
window.HappyMessagePrivacyV855R51={VERSION:'V855R51',loadPolicy:loadPolicy,loadPolicies:loadPolicies,touchPresence:touchPresence,readPresence:readPresence,clear:clear,safePolicy:safePolicy,cache:policyCache};
})();
