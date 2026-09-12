(function(){
'use strict';
if(window.HappyInteractionPrivacyV855R52)return;
var policyCache=new Map(),postCache=new Map(),storyCache=new Map(),storyReplyOwnerCache=new Map();
function clean(v){return String(v==null?'':v).trim();}
function isUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(v));}
function bool(v,f){if(v===true||v===false)return v;var s=clean(v).toLowerCase();if(s==='true'||s==='1'||s==='yes'||s==='on')return true;if(s==='false'||s==='0'||s==='no'||s==='off')return false;return !!f;}
function client(){
  try{
    if(typeof window.happyadSb==='function'){var a=window.happyadSb();if(a&&a.rpc)return a;}
    if(window.happyadSupabase&&window.happyadSupabase.rpc)return window.happyadSupabase;
    if(window.supabaseClient&&window.supabaseClient.rpc)return window.supabaseClient;
    if(window.HappySupabaseClientMasterV972&&typeof window.HappySupabaseClientMasterV972.get==='function')return window.HappySupabaseClientMasterV972.get();
  }catch(_e){}
  return null;
}
function normalizePolicy(data){
  var row=Array.isArray(data)?(data[0]||{}):(data||{});
  return {
    comments:bool(row.comments_allowed,true),
    reposts:bool(row.reposts_allowed,true),
    storyReplies:bool(row.story_replies_allowed,true),
    mentions:bool(row.mentions_allowed,true),
    tags:bool(row.tags_allowed,true),
    available:true
  };
}
function safePolicy(){return {comments:false,reposts:false,storyReplies:false,mentions:false,tags:false,available:false};}
function kindKey(kind){
  var k=clean(kind).toLowerCase().replace(/[\s-]+/g,'_');
  if(k==='comment'||k==='comments'||k==='commentaire'||k==='commentaires')return 'comments';
  if(k==='share'||k==='shares'||k==='partage'||k==='partages'||k==='repost'||k==='reposts'||k==='republish'||k==='republication'||k==='republications')return 'reposts';
  if(k==='story_reply'||k==='story_replies'||k==='reply_story'||k==='reponse_story')return 'storyReplies';
  if(k==='mention'||k==='mentions')return 'mentions';
  if(k==='tag'||k==='tags'||k==='identification'||k==='identifications')return 'tags';
  return k;
}
function allowedByPolicy(policy,kind){var k=kindKey(kind);return !!(policy&&policy.available&&policy[k]===true);}
async function loadPolicy(targetId,force){
  targetId=clean(targetId);if(!isUuid(targetId))return safePolicy();
  if(!force&&policyCache.has(targetId))return policyCache.get(targetId);
  var c=client();if(!c)return safePolicy();
  try{var r=await c.rpc('happyad_interaction_privacy_v855r52',{p_target:targetId});if(r&&r.error)throw r.error;var p=normalizePolicy(r&&r.data);policyCache.set(targetId,p);return p;}catch(_e){return safePolicy();}
}
async function loadPolicies(targetIds,force){
  var ids=Array.from(new Set((targetIds||[]).map(clean).filter(isUuid))).slice(0,100);if(!ids.length)return policyCache;
  var missing=force?ids:ids.filter(function(id){return !policyCache.has(id);});if(!missing.length)return policyCache;
  var c=client();if(!c)return policyCache;
  try{var r=await c.rpc('happyad_interaction_privacy_batch_v855r52',{p_targets:missing});if(r&&r.error)throw r.error;(Array.isArray(r.data)?r.data:[]).forEach(function(row){var id=clean(row&&row.target_user_id);if(id)policyCache.set(id,normalizePolicy(row));});}
  catch(_e){await Promise.all(missing.map(function(id){return loadPolicy(id,!!force);}));}
  return policyCache;
}
async function canTarget(targetId,kind,force){var p=await loadPolicy(targetId,!!force);return allowedByPolicy(p,kind);}
async function remoteStatus(rpcName,args,cache,key,force){
  key=clean(key);if(!key)return {allowed:null,available:false,cached:false};
  if(!force&&cache.has(key))return {allowed:cache.get(key)===true,available:true,cached:true};
  var c=client();if(!c)return {allowed:null,available:false,cached:false};
  try{
    var r=await c.rpc(rpcName,args);if(r&&r.error)throw r.error;
    var data=r&&r.data;var v=Array.isArray(data)?data[0]:data;
    if(v&&typeof v==='object'){
      if('allowed' in v)v=v.allowed;
      else if('happyad_interaction_post_allowed_v855r52' in v)v=v.happyad_interaction_post_allowed_v855r52;
      else if('happyad_interaction_story_allowed_v855r52' in v)v=v.happyad_interaction_story_allowed_v855r52;
    }
    var ok=bool(v,false);cache.set(key,ok);return {allowed:ok,available:true,cached:false};
  }catch(_e){return {allowed:null,available:false,cached:false,error:_e||null};}
}
async function remoteAllowed(rpcName,args,cache,key,force){var s=await remoteStatus(rpcName,args,cache,key,force);return !!(s&&s.available&&s.allowed===true);}
async function canPost(postId,kind,force){var k=clean(postId)+'::'+kindKey(kind);return remoteAllowed('happyad_interaction_post_allowed_v855r52',{p_post_id:clean(postId),p_kind:kindKey(kind)},postCache,k,!!force);}
async function canStory(storyId,kind,force){var k=clean(storyId)+'::'+kindKey(kind);return remoteAllowed('happyad_interaction_story_allowed_v855r52',{p_story_id:clean(storyId),p_kind:kindKey(kind)},storyCache,k,!!force);}
async function canStoryStatus(storyId,kind,force){var k=clean(storyId)+'::'+kindKey(kind);return remoteStatus('happyad_interaction_story_allowed_v855r52',{p_story_id:clean(storyId),p_kind:kindKey(kind)},storyCache,k,!!force);}
async function canStoryRepliesOwnerStatusV899(targetId,force){targetId=clean(targetId);if(!isUuid(targetId))return {allowed:null,available:false,cached:false};return remoteStatus('happyad_story_replies_allowed_v899',{p_owner:targetId},storyReplyOwnerCache,targetId,!!force);}
async function filterTargets(targetIds,kind){
  var ids=Array.from(new Set((targetIds||[]).map(clean).filter(isUuid))).slice(0,100);if(!ids.length)return [];
  await loadPolicies(ids,false);var k=kindKey(kind);return ids.filter(function(id){return allowedByPolicy(policyCache.get(id),k);});
}
function clear(){policyCache.clear();postCache.clear();storyCache.clear();storyReplyOwnerCache.clear();}
window.HappyInteractionPrivacyV855R52={VERSION:'V899',loadPolicy:loadPolicy,loadPolicies:loadPolicies,canTarget:canTarget,canPost:canPost,canStory:canStory,canStoryStatus:canStoryStatus,canStoryRepliesOwnerStatusV899:canStoryRepliesOwnerStatusV899,filterTargets:filterTargets,allowedByPolicy:allowedByPolicy,kindKey:kindKey,clear:clear,safePolicy:safePolicy,policyCache:policyCache};
})();
