/* Shared contract with Android V220. Supabase owns account uniqueness. */
(function(root){
'use strict';
async function rpc(c,name,args){if(!c)throw Error('Connexion indisponible');const r=await c.rpc(name,args);if(r.error)throw r.error;return r.data||{};}
async function counts(c,ids,range){const args={};if(ids)args.p_ids=ids.map(String);if(range){args.p_start=range.start;args.p_end=range.end;if(/^\d{4}-\d{2}-\d{2}$/.test(String(range.end))){const end=new Date(range.end+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+1);args.p_end=end.toISOString();}}return rpc(c,'fyblic_counts_v220',args);}
async function read(c,id){const d=await counts(c,[id]);const row=(d.items||[]).find(x=>String(x.id)===String(id));if(!row)throw Error('Publication indisponible');return row;}
async function record(c,id,kind){const session=await c.auth.getSession();if(session.error)throw session.error;if(!session.data?.session?.user)return read(c,id).then(x=>Number(kind==='listing'?x.listingViews:x.views));const d=await rpc(c,'fyblic_record_view_v220',{p_post_id:String(id),p_kind:kind});return Number(d.count)||0;}
function compact(n){n=Math.max(0,Number(n)||0);if(n>=1e9)return Math.floor(n/1e8)/10+'MD';if(n>=1e6)return Math.floor(n/1e5)/10+'M';if(n>=1e3)return Math.floor(n/100)/10+'k';return String(n);}
async function analytics(c,kind,data,args){
 const d=await counts(c,kind==='content'?[args.p_content_id]:null,{start:args.p_start,end:args.p_end});
 const rows=d.items||[],byId=new Map(rows.map(x=>[String(x.id),x]));
 function patch(item){const exact=byId.get(String(item.id));return exact?Object.assign({},item,{views:exact.views,likes:exact.likes,isVideo:exact.isVideo,type:exact.type,mediaKind:exact.type,countsVerifiedV220:true}):item;}
 data=Object.assign({},data);
 if(kind==='profile'){
  data.overview=Object.assign({},data.overview,{views:d.views,viewsChange:null});
  data.content=Object.assign({},data.content,{videoViews:d.views,likes:d.likes});
  data.content.top=(data.content.top||[]).map(patch);
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
 data.countsVerifiedV220=true;return data;
}
root.FyblicCountsV220={counts,read,record,compact,analytics};
})(typeof window==='undefined'?globalThis:window);
