'use strict';

const {readPublicSupabaseConfig}=require('../lib/happyad-server-env');
const SUPABASE=readPublicSupabaseConfig();
function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function clean(value){return String(value==null?'':value).trim();}
function originOf(event){try{const raw=clean(event&&event.rawUrl);if(raw)return new URL(raw).origin;}catch(_e){}const h=(event&&event.headers)||{};const host=clean(h['x-forwarded-host']||h['X-Forwarded-Host']||h.host||h.Host);const proto=clean(h['x-forwarded-proto']||h['X-Forwarded-Proto']||'https').split(',')[0].trim()||'https';return host?proto+'://'+host:'';}
async function fetchFast(url,options,ms){const ac=new AbortController();const t=setTimeout(()=>ac.abort(),Math.max(550,Number(ms)||1500));try{return await fetch(url,Object.assign({},options||{},{signal:ac.signal}));}finally{clearTimeout(t);}}
function firstMediaValue(value){if(value==null)return '';if(typeof value==='string'){const s=clean(value);if(!s)return '';if((s[0]==='['&&s.at(-1)===']')||(s[0]==='{'&&s.at(-1)==='}')){try{return firstMediaValue(JSON.parse(s));}catch(_e){}}return s;}if(Array.isArray(value)){for(const x of value){const v=firstMediaValue(x);if(v)return v;}return '';}if(typeof value==='object'){for(const k of ['url','publicUrl','public_url','src','path','storage_path','file_path','media_url','image_url','photo_url','video_url','thumbnail_url','poster_url','cover_url']){const v=firstMediaValue(value[k]);if(v)return v;}}return '';}
function absoluteMedia(value){let src=clean(value);if(!src)return '';if(/^https?:\/\//i.test(src))return src;src=src.replace(/^\/+/, '').replace(/^happyad-media\//i,'');if(!SUPABASE.ready)return '';return SUPABASE.url+'/storage/v1/object/public/happyad-media/'+encodeURI(src);}
function isVideoRow(row,hint){row=row||{};const kind=clean(row.media_type||row.home_media_type||row.type||row.kind||row.mime_type||hint).toLowerCase();if(/video|reel|clip|mp4|webm|mov|m4v/.test(kind))return true;const raw=firstMediaValue(row.video_url||row.video_url_compressed||row.compressed_video_url||row.video_url_original||row.original_video_url||row.media_url||row.home_media_url||row.media_path||row.media_urls||row.files);return /\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(raw);}
function mediaCandidate(row,hint){row=row||{};const video=isVideoRow(row,hint);const poster=firstMediaValue(row.thumbnail_url||row.thumbnailUrl||row.poster_url||row.posterUrl||row.cover_url||row.coverUrl||row.home_thumbnail_url||row.homeThumbnailUrl||row.preview_url||row.previewUrl||row.marketplace_cover_url||row.marketplaceCoverUrl||row.image_url||row.imageUrl||row.photo_url||row.photoUrl);const media=firstMediaValue(row.marketplace_cover_url||row.marketplaceCoverUrl||row.home_media_url||row.homeMediaUrl||row.media_url||row.mediaUrl||row.media_path||row.mediaPath||row.image_url||row.imageUrl||row.photo_url||row.photoUrl||row.video_url_compressed||row.compressed_video_url||row.video_url_original||row.original_video_url||row.video_url||row.media_urls||row.images||row.photos||row.files||row.gallery||row.medias||row.media||row.marketplace_media);let value=video?(poster||media):(media||poster);if(video&&!poster&&/\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(media))value='';return absoluteMedia(value);}
function decodePart(value){try{return decodeURIComponent(clean(value));}catch(_e){return clean(value);}}
function publicPathParts(event){
  const q=(event&&event.queryStringParameters)||{};
  const routed=clean(q.path).replace(/^\/+|\/+$/g,'');
  if(routed)return routed.split('/').filter(Boolean).map(decodePart);
  try{
    const raw=clean(event&&event.rawUrl);
    if(raw){const u=new URL(raw);const parts=u.pathname.split('/').filter(Boolean).map(decodePart);const s=parts.indexOf('s');if(s>=0)return parts.slice(s+1);}
  }catch(_e){}
  const parts=clean(event&&event.path).split('/').filter(Boolean).map(decodePart),s=parts.indexOf('s');
  return s>=0?parts.slice(s+1):[];
}
function parseShareRequest(event){
  const q=(event&&event.queryStringParameters)||{};
  let postId=decodePart(q.post),hint=clean(q.type).toLowerCase(),rev=clean(q.v)||'r19';
  const parts=publicPathParts(event);
  if(!postId&&parts.length){
    const first=clean(parts[0]).toLowerCase();
    if((first==='p'||first==='photo'||first==='v'||first==='video')&&parts[1]){
      postId=decodePart(parts[1]);
      if(!hint)hint=(first==='v'||first==='video')?'video':'photo';
      if(parts[2])rev=clean(parts[2]);
    }else{
      postId=decodePart(parts[0]);
      if(parts[1])rev=clean(parts[1]);
    }
  }
  if(postId==='p'||postId==='v'||postId==='photo'||postId==='video')postId='';
  return {postId,type:/video|reel|clip|^v$/.test(hint)?'video':'photo',rev};
}
function directTarget(origin,postId,type){return origin+'/?happyad_post='+encodeURIComponent(postId)+'&happyad_type='+encodeURIComponent(type||'photo')+'&happyad_direct=1&source=shared_link';}
function sharePublicationTitle(row){
  let title=clean(row&&row.title).replace(/\s+/g,' ');
  if(!title)return 'Publication Fyblic';
  const max=64;
  if(title.length<=max)return title;
  return title.slice(0,max-3).trimEnd()+'...';
}
async function loadPost(postId,ms){if(!postId||!SUPABASE.ready)return null;try{const url=SUPABASE.url+'/rest/v1/happyad_posts?id=eq.'+encodeURIComponent(postId)+'&select=*&limit=1';const r=await fetchFast(url,{headers:{apikey:SUPABASE.publishableKey,Authorization:'Bearer '+SUPABASE.publishableKey,Accept:'application/json'}},ms||650);if(!r.ok)return null;const a=await r.json();return Array.isArray(a)&&a[0]?a[0]:null;}catch(_e){return null;}}
exports.handler=async function(event){
  const parsed=parseShareRequest(event),postId=parsed.postId,origin=originOf(event);if(!origin)return {statusCode:400,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'},body:'Fyblic'};let row=null,type=parsed.type||'photo',source='';
  /* V889: carte immediate et route universelle. Supabase enrichit seulement si elle repond tres vite. */
  row=await loadPost(postId,420);if(row){type=isVideoRow(row,type)?'video':'photo';source=mediaCandidate(row,type);}
  const publicationTitle=sharePublicationTitle(row);
  const rev=parsed.rev||'r19';
  const image=origin+'/share-image/'+encodeURIComponent(postId)+'/r20?type='+encodeURIComponent(type);
  const target=directTarget(origin,postId,type),canonical=origin+'/s/'+(type==='video'?'v':'p')+'/'+encodeURIComponent(postId)+'/'+encodeURIComponent(rev);
  const logo=origin+'/icons/fyblic-app-icon-v1046-512.png';
  const structured=JSON.stringify({'@context':'https://schema.org','@type':'SocialMediaPosting','headline':publicationTitle,'publisher':{'@type':'Organization','name':'Fyblic','logo':{'@type':'ImageObject','url':logo}},'image':[image],'url':canonical}).replace(/</g,'\u003c');
  const html='<!doctype html><html lang="fr"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Fyblic</title><meta name="description" content="'+esc(publicationTitle)+'">'+
    '<link rel="icon" type="image/png" sizes="192x192" href="'+esc(logo)+'"><link rel="shortcut icon" href="'+esc(logo)+'"><link rel="apple-touch-icon" href="'+esc(logo)+'">'+
    '<meta property="og:type" content="'+(type==='video'?'video.other':'article')+'"><meta property="og:site_name" content="Fyblic"><meta property="og:title" content="Fyblic"><meta property="og:description" content="'+esc(publicationTitle)+'"><meta property="og:url" content="'+esc(canonical)+'">'+
    '<meta property="og:image" content="'+esc(image)+'"><meta property="og:image:url" content="'+esc(image)+'"><meta property="og:image:secure_url" content="'+esc(image)+'"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="900"><meta property="og:image:alt" content="'+esc(publicationTitle)+'">'+
    '<meta property="og:logo" content="'+esc(logo)+'"><meta itemprop="logo" content="'+esc(logo)+'"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Fyblic"><meta name="twitter:description" content="'+esc(publicationTitle)+'"><meta name="twitter:image" content="'+esc(image)+'">'+
    '<meta name="robots" content="noindex,nofollow"><script type="application/ld+json">'+structured+'</script></head>'+
    '<body style="margin:0;background:#03070d"><script>location.replace('+JSON.stringify(target)+');<\/script></body></html>';
  return {statusCode:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':row?'public, max-age=120, s-maxage=86400, stale-while-revalidate=604800':'public, max-age=10, s-maxage=20, stale-while-revalidate=60','X-Robots-Tag':'noindex'},body:html};
};
