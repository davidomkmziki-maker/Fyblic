/* FYBLIC V221 : compteur vérifié de l'accueil, fetch groupé et sans faux 0. */
(function(){'use strict';
 const pending=new Set(),done=new Map();let scanTimer=0,flushTimer=0,loading=false;
 function client(){try{return typeof window.happyadSb==='function'?window.happyadSb():window.happyadSupabase||window.supabaseClient;}catch(_){return null;}}
 function scan(){
  document.querySelectorAll('.miniCard[data-post-id] .happyadVideoViewsCount').forEach(node=>{
   const card=node.closest('.miniCard[data-post-id]'),id=String(card?.dataset.postId||'');if(!id)return;
   if(done.has(id)){
     const count=done.get(id);if(node.textContent!==count)node.textContent=count;
   }else{
     if(node.textContent!=='—')node.textContent='—';pending.add(id);
   }
  });
  if(pending.size)kick(100);
 }
 function kick(ms){if(flushTimer||loading)return;flushTimer=setTimeout(flush,ms);}
 async function flush(){
  flushTimer=0;if(loading||!pending.size)return;
  const c=client();if(!c||!window.FyblicCountsV221){kick(1500);return;}
  loading=true;const ids=[...pending].slice(0,100);ids.forEach(id=>pending.delete(id));
  try{
   const d=await window.FyblicCountsV221.counts(c,ids);
   (d.items||[]).forEach(item=>{
    const id=String(item.id),value=window.FyblicCountsV221.compact(item.views);
    done.set(id,value);
    document.querySelectorAll('.miniCard[data-post-id]').forEach(card=>{
     if(card.dataset.postId!==id)return;
     card.querySelectorAll('.happyadVideoViewsCount').forEach(el=>{if(el.textContent!==value)el.textContent=value;});
    });
    try{if(typeof window.getA==='function'&&typeof window.setA==='function'){
      const a=window.getA(id)||{};a.views=Number(item.views)||0;a.__uniqueViewsV220=true;window.setA(id,a);
    }}catch(_){}
   });
  }catch(e){ids.forEach(id=>pending.add(id));console.warn('Vues Fyblic indisponibles',e);}
  finally{loading=false;if(pending.size)kick(2000);}
 }
 function init(){
  scan();const target=document.getElementById('list')||document.body;
  const observer=new MutationObserver(()=>{
   if(scanTimer)return;scanTimer=setTimeout(()=>{scanTimer=0;scan();},140);
  });
  observer.observe(target,{subtree:true,childList:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){done.clear();scan();}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
