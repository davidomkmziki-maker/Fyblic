/* FYBLIC V1173 — unique autorite visuelle du compteur de vues Accueil.
   Le rendu initial ne presente jamais un 0 non verifie.
   Une actualisation reseau ne retire pas la derniere valeur valide. */
(function(root){'use strict';
 const values=new Map(), pending=new Set();
 let loading=false, timer=0, scanTimer=0, lastRefresh=0;
 function client(){try{return typeof root.happyadSb==='function'?root.happyadSb():root.happyadSupabase||root.supabaseClient;}catch(_){return null;}}
 function norm(n){const v=Number(n);return Number.isFinite(v)&&v>=0?Math.floor(v):null;}
 function get(id){id=String(id||'');return values.has(id)?values.get(id):null;}
 function text(n){return root.FyblicCountsV221?root.FyblicCountsV221.compact(n):String(n);}
 function localValue(id){
  try{if(typeof root.getA==='function'){const a=root.getA(id);if(a&&a.__uniqueViewsV220===true)return norm(a.views);}}catch(_e){}
  return null;
 }
 function display(id){const v=get(id),fallback=v===null?localValue(id):v;return fallback===null?'—':text(fallback);}
 function paint(id){
  const val=display(id);
  document.querySelectorAll('.miniCard[data-post-id]').forEach(card=>{
   if(String(card.dataset.postId||'')!==String(id))return;
   card.querySelectorAll('.happyadVideoViewsCount').forEach(node=>{if(node.textContent!==val)node.textContent=val;});
   card.querySelectorAll('.happyadVideoViewsBadge').forEach(node=>{if(node.getAttribute('aria-label')!==val+' vues')node.setAttribute('aria-label',val+' vues');});
  });
 }
 function accept(id,n){
  id=String(id||'');n=norm(n);if(!id||n===null)return false;
  // Les vues uniques ne diminuent pas au cours d'une session. Evite qu'une requete ancienne
  // repondant apres une requete recente fasse osciller le compteur.
  const old=get(id);if(old!==null&&old>n)n=old;
  values.set(id,n);pending.delete(id);
  try{if(typeof root.getA==='function'&&typeof root.setA==='function'){
   const a=root.getA(id)||{};
   if(a.views!==n||a.__uniqueViewsV220!==true){a.views=n;a.__uniqueViewsV220=true;root.setA(id,a);}
  }}catch(_e){}
  paint(id);return true;
 }
 function scan(){
  const ids=new Set();
  document.querySelectorAll('.miniCard[data-post-id] .happyadVideoViewsCount').forEach(node=>{
   const card=node.closest('.miniCard[data-post-id]'),id=String(card?.dataset.postId||'');if(!id)return;
   ids.add(id);
   const expected=display(id);
   if(node.textContent!==expected)node.textContent=expected;
  });
  ids.forEach(id=>{if(!values.has(id))pending.add(id);});
  if(pending.size)kick(60);
 }
 function kick(ms){if(timer||loading||!pending.size)return;timer=setTimeout(flush,ms);}
 async function flush(){
  timer=0;if(loading||!pending.size)return;
  const c=client();if(!c||!root.FyblicCountsV221){kick(2500);return;}
  loading=true;const ids=[...pending].slice(0,100);ids.forEach(id=>pending.delete(id));
  try{
   const d=await root.FyblicCountsV221.counts(c,ids);
   const found=new Set();
   (d.items||[]).forEach(item=>{
    const id=String(item.id||'');if(!id)return;found.add(id);accept(id,item.views);
   });
   // Ne pas inventer 0 pour un identifiant sans ligne accessible dans Supabase.
   ids.forEach(id=>{if(!found.has(id))console.warn('Compteur non verifie :',id);});
  }catch(e){ids.forEach(id=>pending.add(id));console.warn('Compteurs Fyblic temporairement indisponibles',e);}
  finally{loading=false;if(pending.size)kick(3000);}
 }
 function refresh(){
  // Garder les valeurs affichees pendant la revalidation.
  document.querySelectorAll('.miniCard[data-post-id] .happyadVideoViewsCount').forEach(node=>{
   const id=String(node.closest('.miniCard[data-post-id]')?.dataset.postId||'');if(id)pending.add(id);
  });
  if(pending.size)kick(100);
 }
 function init(){
  scan();const target=document.getElementById('list')||document.body;
  if(!target)return;
  const observer=new MutationObserver(()=>{
   if(scanTimer)return;
   scanTimer=setTimeout(()=>{scanTimer=0;scan();},140);
  });
  observer.observe(target,{subtree:true,childList:true});
  document.addEventListener('visibilitychange',()=>{
   if(!document.hidden&&Date.now()-lastRefresh>10000){lastRefresh=Date.now();refresh();}
  });
 }
 root.FyblicViewsHomeV1173={get,display,accept,refresh};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
