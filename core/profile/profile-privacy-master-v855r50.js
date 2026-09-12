(function(){
'use strict';
if(window.HappyProfilePrivacyV855R50)return;
var VERSION='V855R50_PROFILE_VISIBILITY';
var DEFAULTS={
  privateAccount:false,
  publicPosts:true,
  publicStories:true,
  showCity:false,
  showFollowers:true,
  showFollowing:true,
  viewerIsFollower:false,
  postsAllowed:false,
  storiesAllowed:false,
  available:false,
  error:''
};
function clean(v){return String(v==null?'':v).trim();}
function bool(v,fallback){
  if(v===true||v===false)return v;
  var s=clean(v).toLowerCase();
  if(s==='true'||s==='1'||s==='yes'||s==='on')return true;
  if(s==='false'||s==='0'||s==='no'||s==='off')return false;
  return !!fallback;
}
function client(){
  try{
    if(window.happyadSupabase&&window.happyadSupabase.rpc)return window.happyadSupabase;
    if(window.supabaseClient&&window.supabaseClient.rpc)return window.supabaseClient;
    if(typeof window.happyadSb==='function'){var shared=window.happyadSb();if(shared&&shared.rpc)return shared;}
    if(window.HappySupabaseClientMasterV972&&typeof window.HappySupabaseClientMasterV972.get==='function')return window.HappySupabaseClientMasterV972.get();
  }catch(_e){}
  return null;
}
function normalize(data){
  var row=Array.isArray(data)?(data[0]||{}):(data||{});
  var out={
    privateAccount:bool(row.private_account,false),
    publicPosts:bool(row.public_posts,true),
    publicStories:bool(row.public_stories,true),
    showCity:bool(row.show_city,false),
    showFollowers:bool(row.show_followers,true),
    showFollowing:bool(row.show_following,true),
    viewerIsFollower:bool(row.viewer_is_follower,false),
    postsAllowed:bool(row.posts_allowed,false),
    storiesAllowed:bool(row.stories_allowed,false),
    available:true,
    error:''
  };
  return out;
}
async function load(ownerUid){
  ownerUid=clean(ownerUid);
  if(!ownerUid)return Object.assign({},DEFAULTS,{error:'OWNER_UID_MISSING'});
  var c=client();
  if(!c)return Object.assign({},DEFAULTS,{error:'SUPABASE_UNAVAILABLE'});
  try{
    var result=await c.rpc('happyad_profile_privacy_v855r50',{p_owner:ownerUid});
    if(result&&result.error)throw result.error;
    return normalize(result&&result.data);
  }catch(e){
    return Object.assign({},DEFAULTS,{error:clean(e&&e.message||e)||'PRIVACY_READ_FAILED'});
  }
}
window.HappyProfilePrivacyV855R50={VERSION:VERSION,DEFAULTS:Object.assign({},DEFAULTS),load:load,normalize:normalize};
})();
