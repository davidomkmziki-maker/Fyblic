(function(){
'use strict';
if(window.HappyGlobalCoherenceV997)return;
var raf=0,storyProbeTimer=0,searchStoryRows=[],storyProbeStamp=Object.create(null);
function clean(v){return String(v==null?'':v).trim()}
function storyId(p){p=p||{};return clean(p.sourceId||p.source_id||p.story_id||p.storyId||p.id)}
function ownerOf(p){p=p||{};return clean(p.creatorId||p.user_id||p.userId||p.auth_user_id||p.authUserId||p.account_uid||p.accountUid||p.owner_id||p.ownerId||p.creator_id||p.uid)}
function created(p){var v=p&&(p.created_at||p.createdAt||p.timestamp||p.at);var n=typeof v==='number'?v:Date.parse(v||0);return isFinite(n)?n:0}
function active(p){if(!p)return false;if(p.is_active===false||p.active===false)return false;var x=p.expires_at||p.expiresAt;return !(x&&Date.parse(x)<=Date.now())}
function currentUid(){try{return clean(localStorage.getItem('HAPPYAD_AUTH_UID'))}catch(_e){return ''}}
function accountKey(base){try{var iso=window.HappyAccountIsolationV937;if(iso&&typeof iso.key==='function')return iso.key(base,currentUid())}catch(_e){}return clean(base)+':'+(currentUid()||'guest')}
function readSeen(){try{return JSON.parse(localStorage.getItem(accountKey('HAPPYAD_HOME_RADAR_SEEN_V1'))||'{}')||{}}catch(_e){return {}}}
function stories(){
  var out=[],seen=Object.create(null);
  function add(arr){if(!Array.isArray(arr))return;arr.forEach(function(p){if(!active(p))return;var id=storyId(p)||[ownerOf(p),created(p)].join(':');if(!id||seen[id])return;seen[id]=1;out.push(p)})}
  try{var api=window.HappyStoryV629;if(api&&typeof api.getCachedStories==='function')add(api.getCachedStories())}catch(_e){}
  try{add(window.HAPPYAD_STORIES_ITEMS)}catch(_e){}
  try{add(JSON.parse(localStorage.getItem(accountKey('HAPPYAD_STORIES_CACHE_V1'))||'[]'))}catch(_e){}
  add(searchStoryRows);
  return out;
}
function seenItem(p,seenMap){var id=storyId(p);return !!(p&&(p.isSeen||p.seen||p.viewed))||!!(id&&seenMap&&seenMap[id])}
function stateFor(owner){
  owner=clean(owner);if(!owner)return null;
  var list=stories().filter(function(p){return ownerOf(p)===owner}).sort(function(a,b){return created(a)-created(b)});
  if(!list.length)return null;
  var seenMap=readSeen(),allSeen=list.every(function(p){return seenItem(p,seenMap)}),start=list.find(function(p){return !seenItem(p,seenMap)})||list[0];
  try{
    var safe=(window.CSS&&CSS.escape)?CSS.escape(owner):owner.replace(/"/g,'\\"');
    var radar=document.querySelector('#homeRadarStoryMasterV629 button.radarItem[data-story-owner="'+safe+'"],#homeRadarBlock button.radarItem[data-story-owner="'+safe+'"]');
    if(radar){var av=radar.querySelector('.radarAvatar');if(av)allSeen=av.classList.contains('seen');var sid=clean(radar.dataset.storyId);if(sid){var exact=list.find(function(p){return storyId(p)===sid});if(exact)start=exact}}
  }catch(_e){}
  return {owner:owner,list:list,start:start,id:storyId(start),seen:allSeen};
}
function probeSearchStories(){
  clearTimeout(storyProbeTimer);storyProbeTimer=0;
  var root=document.getElementById('happyadSmartSearchV427');if(!root||!root.classList.contains('on'))return;
  var now=Date.now(),ids=[];
  root.querySelectorAll('.haSearchUser[data-ha-profile-uid]').forEach(function(row){var id=clean(row.getAttribute('data-ha-profile-uid'));if(id&&ids.indexOf(id)<0&&(!storyProbeStamp[id]||now-storyProbeStamp[id]>30000))ids.push(id)});
  ids=ids.slice(0,20);if(!ids.length)return;ids.forEach(function(id){storyProbeStamp[id]=now});
  var c=null;try{c=typeof window.happyadSb==='function'?window.happyadSb():(window.happyadSupabase||null)}catch(_e){}if(!c||!c.from)return;
  Promise.resolve(c.from('happyad_stories').select('*').in('user_id',ids).eq('is_active',true).order('created_at',{ascending:false}).limit(60)).then(function(r){
    if(!r||r.error||!Array.isArray(r.data))return;var map=Object.create(null);searchStoryRows.concat(r.data).forEach(function(p){var id=storyId(p)||[ownerOf(p),created(p)].join(':');if(id&&active(p))map[id]=p});searchStoryRows=Object.keys(map).map(function(k){return map[k]});schedule();
  }).catch(function(){});
}
function scheduleStoryProbe(){clearTimeout(storyProbeTimer);storyProbeTimer=setTimeout(probeSearchStories,240)}
function decorateSearch(){
  var root=document.getElementById('happyadSmartSearchV427');if(!root)return;
  root.querySelectorAll('.haSearchUser[data-ha-profile-uid]').forEach(function(row){
    var av=row.querySelector('.haSearchAvatar');if(!av)return;
    var st=stateFor(row.getAttribute('data-ha-profile-uid'));
    av.classList.toggle('haSearchStoryRingV997',!!st);
    av.classList.toggle('story-seen',!!(st&&st.seen));
    if(st){av.dataset.storyOwnerV997=st.owner;av.dataset.storyIdV997=st.id||'';av.setAttribute('role','button');av.setAttribute('tabindex','0');av.setAttribute('aria-label',st.seen?'Ouvrir la story déjà vue':'Ouvrir la nouvelle story')}
    else{delete av.dataset.storyOwnerV997;delete av.dataset.storyIdV997;av.removeAttribute('role');av.removeAttribute('tabindex');av.removeAttribute('aria-label')}
  });
  if(root.classList.contains('on'))scheduleStoryProbe();
}
function openSearchStory(av){
  var owner=clean(av&&av.dataset.storyOwnerV997);if(!owner)return false;
  var st=stateFor(owner);if(!st)return false;
  var id=clean(av.dataset.storyIdV997),start=id?st.list.find(function(p){return storyId(p)===id})||st.start:st.start;
  try{if(window.HappyStoryV629&&typeof window.HappyStoryV629.openOwner==='function'){window.HappyStoryV629.openOwner(owner,storyId(start),start);setTimeout(schedule,120);setTimeout(schedule,650);return true}}catch(_e){}
  try{
    var safe=(window.CSS&&CSS.escape)?CSS.escape(owner):owner.replace(/"/g,'\\"');
    var btn=document.querySelector('#homeRadarStoryMasterV629 button.radarItem[data-story-owner="'+safe+'"],#homeRadarBlock button.radarItem[data-story-owner="'+safe+'"]');
    if(btn){btn.click();setTimeout(schedule,120);return true}
  }catch(_e){}
  return false;
}
function run(){raf=0;decorateSearch()}
function schedule(){if(raf)return;raf=requestAnimationFrame(run)}
function bind(){
  document.addEventListener('click',function(e){var av=e.target&&e.target.closest&&e.target.closest('#happyadSmartSearchV427 .haSearchAvatar.haSearchStoryRingV997');if(!av)return;e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();openSearchStory(av)},true);
  document.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;var av=e.target&&e.target.closest&&e.target.closest('#happyadSmartSearchV427 .haSearchAvatar.haSearchStoryRingV997');if(!av)return;e.preventDefault();e.stopPropagation();openSearchStory(av)},true);
  try{new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true})}catch(_e){}
  document.addEventListener('happyad:stories-master-sync-v924',schedule,true);
  window.addEventListener('storage',schedule,true);
  window.addEventListener('pageshow',schedule,true);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)schedule()},true);
  schedule();setTimeout(schedule,220);setTimeout(schedule,900);
}
bind();
  window.HappyGlobalCoherenceV997={version:'1000',refresh:schedule,stateFor:stateFor,openSearchStory:openSearchStory};
})();
