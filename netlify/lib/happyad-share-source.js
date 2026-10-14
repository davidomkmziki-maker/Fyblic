'use strict';
const {readPublicSupabaseConfig}=require('./happyad-server-env');
const CONFIG=readPublicSupabaseConfig();
const clean=value=>String(value==null?'':value).trim();
class ShareError extends Error { constructor(code,status=503){super(code);this.code=code;this.status=status;} }
const validPostId=id=>/^[A-Za-z0-9_-]{1,128}$/.test(clean(id));

function values(value,depth=0){
  if(value==null||depth>5)return [];
  if(typeof value==='string'){
    const s=clean(value);if(!s||/^(null|undefined)$/i.test(s))return [];
    if(s[0]==='['||s[0]==='{'){try{return values(JSON.parse(s),depth+1);}catch(_e){return [];}}
    return [s];
  }
  if(Array.isArray(value))return value.flatMap(x=>values(x,depth+1));
  if(typeof value==='object')return ['url','publicUrl','public_url','src','path','storage_path','storagePath','file_path','filePath','media_url','mediaUrl','image_url','imageUrl','photo_url','photoUrl','thumbnail_url','thumbnailUrl','poster_url','posterUrl','cover_url','coverUrl'].flatMap(k=>values(value[k],depth+1));
  return [];
}
function absoluteMedia(value){
  let s=clean(value);if(!s||/^(data|blob|file):/i.test(s))return '';
  if(/^https?:\/\//i.test(s))return s;
  if(!CONFIG.ready)return '';
  s=s.replace(/^\/+/, '');
  if(s.startsWith('storage/v1/'))return CONFIG.url+'/'+s;
  s=s.replace(/^happyad-media\//i,'');
  // Preserve already encoded paths without double escaping %20 / %C3 etc.
  const path=s.split('/').map(part=>{try{return encodeURIComponent(decodeURIComponent(part));}catch(_e){return encodeURIComponent(part);}}).join('/');
  return CONFIG.url+'/storage/v1/object/public/happyad-media/'+path;
}
const videoURL=url=>/\.(mp4|webm|mov|m4v|m3u8)(?:$|[?#])/i.test(url);
function isVideoRow(row,hint=''){
  const kind=clean(row.media_type||row.home_media_type||row.mediaType||row.type||row.kind||row.mime_type).toLowerCase();
  if(/video|reel|clip|mp4|webm|mov|m4v/.test(kind))return true;
  if(/photo|image/.test(kind))return false;
  const urls=values(row.media_url).concat(values(row.home_media_url),values(row.video_url),values(row.mediaUrl));
  return urls.some(videoURL)||/video|reel|clip|^v$/i.test(hint);
}
function mediaCandidates(row,hint){
  const posters=['thumbnail_url','thumbnailUrl','poster_url','posterUrl','cover_url','coverUrl','home_thumbnail_url','homeThumbnailUrl','preview_url','previewUrl','marketplace_cover_url','marketplaceCoverUrl'];
  const photos=['home_media_url','homeMediaUrl','media_url','mediaUrl','media_path','mediaPath','image_url','imageUrl','photo_url','photoUrl','media_urls','mediaUrls','images','photos','files','gallery','medias','media','marketplace_media','marketplaceMedia'];
  const keys=isVideoRow(row,hint)?posters.concat(photos):photos.concat(posters);
  return [...new Set(keys.flatMap(key=>values(row[key])).filter(s=>!videoURL(s)).map(absoluteMedia).filter(Boolean))];
}
function allowedRemote(value){
  try{
    const u=new URL(value),project=new URL(CONFIG.url);
    return CONFIG.ready&&u.protocol==='https:'&&u.hostname===project.hostname&&!u.port&&!u.username&&!u.password&&
      ['/storage/v1/object/public/happyad-media/','/storage/v1/render/image/public/happyad-media/'].some(prefix=>u.pathname.startsWith(prefix));
  }catch(_e){return false;}
}
function publicRow(row){
  const enabled=value=>value===true||value===1||/^(true|1)$/i.test(clean(value));
  return row&&typeof row==='object'&&!row.deleted_at&&!enabled(row.is_deleted)&&
    !enabled(row.is_private)&&
    !['private','privé','prive','hidden','deleted'].includes(clean(row.visibility).toLowerCase());
}
async function withDeadline(ms,work){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),ms);
  try{return await work(controller.signal);}finally{clearTimeout(timer);}
}
async function loadPost(postId){
  if(!validPostId(postId))throw new ShareError('INVALID_POST',400);
  if(!CONFIG.ready)throw new ShareError('PUBLIC_CONFIG_MISSING');
  const headers={apikey:CONFIG.publishableKey,Accept:'application/json'};
  // New publishable keys belong only in apikey; Authorization is for JWTs.
  if(CONFIG.kind==='anon')headers.Authorization='Bearer '+CONFIG.publishableKey;
  return withDeadline(5000,async signal=>{
    const response=await fetch(CONFIG.url+'/rest/v1/happyad_posts?id=eq.'+encodeURIComponent(postId)+'&select=*&limit=1',{headers,signal,redirect:'error'});
    if(!response.ok)throw new ShareError('POST_FETCH_FAILED');
    const rows=await response.json();
    if(!Array.isArray(rows))throw new ShareError('POST_RESPONSE_INVALID');
    const row=rows[0];
    if(!publicRow(row))throw new ShareError('POST_UNAVAILABLE',404);
    return row;
  });
}
const MAX_BYTES=20*1024*1024;
const IMAGE_TYPES=new Set(['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/avif']);
async function fetchImage(url,timeout=5000){
  if(!allowedRemote(url))throw new ShareError('IMAGE_ORIGIN_REFUSED',422);
  return withDeadline(timeout,async signal=>{
    // No redirect to another host or forwarding of API credentials to media URLs.
    const response=await fetch(url,{signal,redirect:'error',headers:{Accept:'image/avif,image/webp,image/png,image/jpeg,image/gif'}});
    if(!response.ok)throw new ShareError('IMAGE_UNAVAILABLE');
    const type=clean(response.headers.get('content-type')).split(';')[0].toLowerCase();
    if(!IMAGE_TYPES.has(type)&&type!=='application/octet-stream')throw new ShareError('IMAGE_TYPE_REFUSED',422);
    if(Number(response.headers.get('content-length')||0)>MAX_BYTES)throw new ShareError('IMAGE_TOO_LARGE',422);
    const chunks=[];let size=0;
    for await(const chunk of response.body){size+=chunk.length;if(size>MAX_BYTES)throw new ShareError('IMAGE_TOO_LARGE',422);chunks.push(chunk);}
    if(!size)throw new ShareError('IMAGE_EMPTY',422);
    return Buffer.concat(chunks);
  });
}
function errorResponse(error,method='GET'){
  const status=error instanceof ShareError?error.status:503;
  return {statusCode:status,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','CDN-Cache-Control':'no-store','Netlify-CDN-Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(status===503?{'Retry-After':'5'}:{})},body:method==='HEAD'?'':'Aperçu indisponible. Réessayez.'};
}
module.exports={ShareError,clean,validPostId,loadPost,mediaCandidates,isVideoRow,allowedRemote,fetchImage,errorResponse};
