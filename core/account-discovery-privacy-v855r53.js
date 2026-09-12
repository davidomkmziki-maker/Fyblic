(function(){
'use strict';
if(window.HappyAccountDiscoveryV855R53)return;
var policyCache=new Map();
function clean(v){return String(v==null?'':v).trim();}
function bool(v,d){if(v===true||v===false)return v;if(v==null)return !!d;return String(v).toLowerCase()==='true';}
function client(){try{if(typeof window.happyadSb==='function')return window.happyadSb();if(window.happyadSupabase)return window.happyadSupabase;if(window.supabaseClient)return window.supabaseClient;}catch(_e){}return null;}
function policySafe(){return {findByPhone:false,findByGmail:false,contactSuggestions:false,recommendations:false,externalSearch:false,available:false};}
function normalizePolicy(row){row=Array.isArray(row)?row[0]:row;row=row&&typeof row==='object'?row:{};return {findByPhone:bool(row.find_by_phone,false),findByGmail:bool(row.find_by_gmail,false),contactSuggestions:bool(row.contact_suggestions,false),recommendations:bool(row.recommendations,false),externalSearch:bool(row.external_search,false),available:true};}
async function policy(target,force){target=clean(target);if(!target)return policySafe();if(!force&&policyCache.has(target))return policyCache.get(target);var c=client();if(!c||!c.rpc)return policySafe();try{var r=await c.rpc('happyad_account_discovery_policy_v855r53',{p_target:target});if(r&&r.error)throw r.error;var p=normalizePolicy(r&&r.data);policyCache.set(target,p);return p;}catch(_e){return policySafe();}}
async function search(query,limit){var c=client(),q=clean(query);if(!c||!c.rpc||!q)return [];try{var r=await c.rpc('happyad_account_discovery_search_v855r53',{p_query:q,p_limit:Math.max(1,Math.min(80,Number(limit)||40))});if(r&&r.error)throw r.error;return Array.isArray(r&&r.data)?r.data:[];}catch(_e){return [];}}
async function contactMatches(emails,phones,limit){var c=client();if(!c||!c.rpc)return [];try{var r=await c.rpc('happyad_account_contact_matches_v855r53',{p_emails:Array.isArray(emails)?emails:[],p_phones:Array.isArray(phones)?phones:[],p_limit:Math.max(1,Math.min(100,Number(limit)||50))});if(r&&r.error)throw r.error;return Array.isArray(r&&r.data)?r.data:[];}catch(_e){return [];}}
async function recommendations(limit){var c=client();if(!c||!c.rpc)return [];var args={p_limit:Math.max(1,Math.min(30,Number(limit)||12))};try{var r=await c.rpc('happyad_account_recommendations_v855r54',args);if(r&&r.error)throw r.error;return Array.isArray(r&&r.data)?r.data:[];}catch(_e){try{var f=await c.rpc('happyad_account_recommendations_v855r53',args);if(f&&f.error)throw f.error;return Array.isArray(f&&f.data)?f.data:[];}catch(_x){return [];}}}
function ensureRobotsMeta(){var meta=document.querySelector('meta[name="robots"]');if(!meta){meta=document.createElement('meta');meta.name='robots';document.head.appendChild(meta);}return meta;}
async function applyRobots(target){var meta=ensureRobotsMeta();meta.content='noindex,nofollow,noarchive';var p=await policy(target,false);meta.content=p.available&&p.externalSearch?'index,follow,max-image-preview:large':'noindex,nofollow,noarchive';return p.externalSearch===true;}
function routeProfileUid(){
  try{
    var q=new URLSearchParams(location.search||'');
    var app=clean(q.get('app')).toLowerCase();
    var direct=clean(q.get('uid')||q.get('user_id')||q.get('profile_uid'));
    if(app==='profile_public'&&direct)return direct;
    var moduleUrl=clean(q.get('module_url'));
    if(moduleUrl&&/visitor-profile\.html/i.test(moduleUrl)){
      var u=new URL(moduleUrl,location.href);
      return clean(u.searchParams.get('uid')||u.searchParams.get('user_id')||u.searchParams.get('profile_uid'));
    }
  }catch(_e){}
  return '';
}
function autoApplyRouteRobots(){var uid=routeProfileUid();if(uid)applyRobots(uid).catch(function(){});}
function clear(target){if(target)policyCache.delete(clean(target));else policyCache.clear();}
window.HappyAccountDiscoveryV855R53={VERSION:'V855R53',policy:policy,search:search,contactMatches:contactMatches,recommendations:recommendations,applyRobots:applyRobots,routeProfileUid:routeProfileUid,clear:clear,policyCache:policyCache};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',autoApplyRouteRobots,{once:true});else autoApplyRouteRobots();
})();
