(function(){
  'use strict';
  if(window.__HAPPYAD_SHARE_COUNT_MASTER_V567__)return;
  window.__HAPPYAD_SHARE_COUNT_MASTER_V567__=true;
  var VERSION='V567_REAL_SHARE_EVENTS_COUNT';
  var KEY='HAPPYAD_SHARE_COUNT_FLOOR_V1';
  function clean(v){return String(v==null?'':v).trim();}
  function client(){try{if(typeof window.happyadSb==='function')return window.happyadSb();if(window.happyadSupabase)return window.happyadSupabase;if(window.supabaseClient)return window.supabaseClient;}catch(_e){}return null;}
  function read(){try{var x=JSON.parse(localStorage.getItem(KEY)||'{}');return x&&typeof x==='object'?x:{};}catch(_e){return {};}}
  function write(x){try{localStorage.setItem(KEY,JSON.stringify(x));}catch(_e){}}
  var floor=read();
  function directPatch(id,count){
    id=clean(id);count=Math.max(0,Number(count)||0);if(!id)return;
    try{
      var selectors='[data-post-id="'+id.replace(/"/g,'\\"')+'"],[data-photo-id="'+id.replace(/"/g,'\\"')+'"],.reel[data-id="'+id.replace(/"/g,'\\"')+'"]';
      document.querySelectorAll(selectors).forEach(function(root){
        root.querySelectorAll('[data-card-act="share"],[data-profile-act="share"],[data-profile-fs-act="share"],.act[data-act="share"]').forEach(function(btn){
          var s=btn.querySelector('small');if(!s){var spans=btn.querySelectorAll('span');s=spans.length?spans[spans.length-1]:null;}
          if(s)s.textContent=(typeof window.happyadCompactCount==='function'?window.happyadCompactCount(count):String(count));
        });
      });
    }catch(_e){}
  }
  function patchLocal(id,count){
    id=clean(id);count=Math.max(0,Number(count)||0);if(!id)return count;
    floor[id]=Math.max(Number(floor[id]||0),count);write(floor);count=Number(floor[id]||0);
    try{if(typeof window.getA==='function'&&typeof window.setA==='function'){var a=window.getA(id)||{};a.shares=count;window.setA(id,a);}}catch(_e){}
    try{if(typeof window.getHappyAction==='function'&&typeof window.setHappyAction==='function'){var h=window.getHappyAction(id)||{};h.shares=count;window.setHappyAction(id,h);}}catch(_e){}
    try{if(typeof window.refreshLikeEverywhere==='function')window.refreshLikeEverywhere(id);}catch(_e){}
    try{if(typeof window.refresh==='function')window.refresh();}catch(_e){}
    try{if(typeof window.applyLikeCacheToCards==='function'&&typeof window.profileVisiblePosts==='function')window.applyLikeCacheToCards(window.profileVisiblePosts());}catch(_e){}
    directPatch(id,count);
    return count;
  }
  function wrapSetter(name){
    try{
      var fn=window[name];if(typeof fn!=='function'||fn.__happyadShareFloorWrapped)return;
      var wrapped=function(id,state){
        try{var k=clean(id),min=Number(floor[k]||0);if(state&&typeof state==='object'&&Number(state.shares||0)<min)state.shares=min;}catch(_e){}
        return fn.apply(this,arguments);
      };
      wrapped.__happyadShareFloorWrapped=true;wrapped.__original=fn;window[name]=wrapped;
    }catch(_e){}
  }
  function install(){wrapSetter('setA');wrapSetter('setHappyAction');}
  async function fetchCounts(ids){
    ids=Array.from(new Set((ids||[]).map(clean).filter(Boolean))).slice(0,100);if(!ids.length)return;
    try{var c=client();if(!c||!c.from)return;var r=await c.from('happyad_posts').select('id,shares_count').in('id',ids);if(r&&r.error)return;(r.data||[]).forEach(function(p){patchLocal(p.id,p.shares_count);});}catch(_e){}
  }
  function discover(){
    var ids=[];try{var q=new URLSearchParams(location.search);ids.push(q.get('post'),q.get('id'),q.get('happyad_post'));}catch(_e){}
    try{document.querySelectorAll('[data-post-id],[data-photo-id],.reel[data-id]').forEach(function(el){ids.push(el.dataset.postId||el.dataset.photoId||el.dataset.id);});}catch(_e){}
    try{['ALL_POSTS','allPhotoPosts','posts','profilePosts'].forEach(function(k){if(Array.isArray(window[k]))window[k].slice(0,100).forEach(function(p){ids.push(p&& (p.id||p.post_id));if(p&&p.shares_count!=null)patchLocal(p.id||p.post_id,p.shares_count);});});}catch(_e){}
    fetchCounts(ids);
  }
  function applyCount(id,count){install();var n=patchLocal(id,count);try{localStorage.setItem('HAPPYAD_SHARE_COUNT_SYNC_V1',JSON.stringify({id:clean(id),count:n,t:Date.now()}));}catch(_e){}return n;}
  window.addEventListener('storage',function(e){if(e.key==='HAPPYAD_SHARE_COUNT_SYNC_V1'&&e.newValue){try{var x=JSON.parse(e.newValue);if(x&&x.id)patchLocal(x.id,x.count);}catch(_e){}}},true);
  window.addEventListener('message',function(e){var d=e&&e.data;if(d&&d.type==='HAPPYAD_SHARE_COUNT_UPDATED')applyCount(d.detail&&d.detail.post_id,d.detail&&d.detail.shares_count);},true);
  window.HappyadShareCountMaster={version:VERSION,applyCount:applyCount,fetchCounts:fetchCounts,discover:discover};
  install();setTimeout(install,200);setTimeout(install,900);setTimeout(discover,350);setTimeout(discover,1600);
})();
