/* FYBLIC V221 : contrat partagé WEB / Android. Tous les compteurs sont lus par lots depuis Supabase. */
(function(root){
'use strict';
async function rpc(c,name,args){
 if(!c||typeof c.rpc!=='function')throw Error('Connexion indisponible');
 const r=await c.rpc(name,args);
 if(r.error)throw r.error;
 return r.data||{};
}
async function counts(c,ids,range){
 const args={};
 if(ids)args.p_ids=[...new Set(ids.map(String).filter(Boolean))];
 if(range){
  if(range.start)args.p_start=range.start;
  if(range.end){args.p_end=range.end;if(/^\d{4}-\d{2}-\d{2}$/.test(String(range.end))){const end=new Date(range.end+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+1);args.p_end=end.toISOString();}}
 }
 if(args.p_ids&&args.p_ids.length>100){
  const pages=[];
  for(let i=0;i<args.p_ids.length;i+=100){pages.push(await rpc(c,'fyblic_counts_v221',Object.assign({},args,{p_ids:args.p_ids.slice(i,i+100)})));}
  const items=pages.flatMap(p=>p.items||[]);
  const keys=['views','videoViews','listingViews','photoViews','originCentral','originHome','originBoutique','likes','comments','shares','saves','reposts'];
  const merged={items};keys.forEach(k=>merged[k]=pages.reduce((sum,p)=>sum+(Number(p[k])||0),0));return merged;
 }
 return rpc(c,'fyblic_counts_v221',args);
}
async function read(c,id){
 const d=await counts(c,[id]);const row=(d.items||[]).find(x=>String(x.id)===String(id));
 if(!row)throw Error('Publication indisponible');return row;
}
async function record(c,id,kind){
 const source=kind==='listing'?'boutique_detail':kind;
 if(!['boutique_detail','central_video','home_video'].includes(source))throw Error('Origine non reconnue');
 const session=await c.auth.getSession();if(session.error)throw session.error;
 if(!session.data?.session?.user)return read(c,id).then(x=>Number(source==='boutique_detail'?x.listingViews:x.views));
 const d=await rpc(c,'fyblic_record_view_v221',{p_post_id:String(id),p_source:source});return Number(d.count)||0;
}
function compact(n){n=Math.max(0,Number(n)||0);if(n>=1e9)return Math.floor(n/1e8)/10+'MD';if(n>=1e6)return Math.floor(n/1e5)/10+'M';if(n>=1e3)return Math.floor(n/100)/10+'k';return String(n);}
async function analytics(c,kind,data,args){
 const d=await counts(c,kind==='content'?[args.p_content_id]:null,{start:args.p_start,end:args.p_end});
 const rows=d.items||[],byId=new Map(rows.map(x=>[String(x.id),x]));
 function patch(item){
  const exact=byId.get(String(item.id));
  return exact?Object.assign({},item,{views:exact.views,videoViews:exact.videoViews,
   listingViews:exact.listingViews,photoViews:exact.photoViews,
   originCentral:exact.originCentral,originHome:exact.originHome,originBoutique:exact.originBoutique,
   likes:exact.likes,comments:exact.comments,shares:exact.shares,saves:exact.saves,reposts:exact.reposts,
   isVideo:exact.isVideo,type:exact.type,mediaKind:exact.type,
   interactions:exact.likes+exact.comments+exact.shares+exact.saves+exact.reposts,
   countsVerifiedV220:true,countsVerifiedV221:true}):item;
 }
 data=Object.assign({},data);
 if(kind==='profile'){
  data.overview=Object.assign({},data.overview,{views:d.views,viewsChange:null,
   interactions:d.likes+d.comments+d.shares+d.saves+d.reposts,interactionsChange:null});
  data.content=Object.assign({},data.content,{videoViews:d.videoViews,listingViews:d.listingViews,
   photoViews:d.photoViews,likes:d.likes,comments:d.comments,shares:d.shares,saves:d.saves,reposts:d.reposts});
  data.originStats={central:d.originCentral,home:d.originHome,boutique:d.originBoutique};
  data.content.top=(data.content.top||[]).map(patch);
  // Supprimer les courbes anciennes : elles ne mesurent pas les visiteurs uniques.
  data.overview.series=[];
  data.overview.performanceSeries=(data.overview.performanceSeries||[]).map(x=>Object.assign({},x,{views:null}));
  ['topContents','topPosts','topContent'].forEach(key=>{if(Array.isArray(data[key]))data[key]=data[key].map(patch);});
 }else if(kind==='content'){
  if(!byId.has(String(args.p_content_id)))throw Error('Publication indisponible');
  data=patch(Object.assign({},data,{id:String(args.p_content_id)}));
 }else{
  const old=new Map((data.items||[]).map(x=>[String(x.id),x]));
  const sorted=rows.slice().sort(args.p_sort==='recent'?(a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)):(a,b)=>Number(b.views)-Number(a.views)||Number(b.likes)-Number(a.likes));
  const offset=Math.max(0,Number(args.p_offset)||0),limit=Math.max(1,Number(args.p_limit)||12);
  data.items=sorted.slice(offset,offset+limit).map(x=>patch(Object.assign({},x,old.get(String(x.id))||{})));
  data.total=sorted.length;data.hasMore=offset+data.items.length<sorted.length;
 }
 data.countsVerifiedV221=true;return data;
}
root.FyblicCountsV221={counts,read,record,compact,analytics};
root.FyblicCountsV220=root.FyblicCountsV221; // Anciennes pages et points d'entrée inchangés.
})(typeof window==='undefined'?globalThis:window);
