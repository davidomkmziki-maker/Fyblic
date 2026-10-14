'use strict';

const {loadPost,isVideoRow,errorResponse,ShareError}=require('../lib/happyad-share-source');
function esc(value){return String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function clean(value){return String(value==null?'':value).trim();}
function originOf(event){try{const raw=clean(event&&event.rawUrl);if(raw)return new URL(raw).origin;}catch(_e){}const h=(event&&event.headers)||{};const host=clean(h['x-forwarded-host']||h['X-Forwarded-Host']||h.host||h.Host);const proto=clean(h['x-forwarded-proto']||h['X-Forwarded-Proto']||'https').split(',')[0].trim()||'https';return host?proto+'://'+host:'';}
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
  let postId=decodePart(q.post),hint=clean(q.type).toLowerCase(),rev=clean(q.v)||'r23';
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
exports.handler=async function(event){
  const method=clean(event&&event.httpMethod||'GET').toUpperCase();
  if(!['GET','HEAD'].includes(method))return {statusCode:405,headers:{Allow:'GET, HEAD','Cache-Control':'no-store'},body:''};
  const parsed=parseShareRequest(event),postId=parsed.postId,origin=originOf(event);
  if(!origin)return errorResponse(new ShareError('INVALID_ORIGIN',400),method);
  let row,type=parsed.type||'photo';
  try{row=await loadPost(postId);type=isVideoRow(row,type)?'video':'photo';}
  catch(error){
    const response=errorResponse(error,method);
    // Human visitors can still reach the native site route if the metadata request fails.
    if(method!=='HEAD'&&response.statusCode===503){
      response.headers['Content-Type']='text/html; charset=utf-8';
      const target=directTarget(origin,postId,type);
      response.body='<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Fyblic</title></head><body><a href="'+esc(target)+'">Ouvrir la publication</a><script>location.replace('+JSON.stringify(target).replace(/</g,'\\u003c')+');<\/script></body></html>';
    }
    return response;
  }
  const publicationTitle=sharePublicationTitle(row);
  const rev=parsed.rev||'r23';
  const image=origin+'/share-image/'+encodeURIComponent(postId)+'/r23?type='+encodeURIComponent(type);
  const target=directTarget(origin,postId,type),canonical=origin+'/s/'+(type==='video'?'v':'p')+'/'+encodeURIComponent(postId)+'/'+encodeURIComponent(rev);
  const structured=JSON.stringify({'@context':'https://schema.org','@type':'SocialMediaPosting','headline':publicationTitle,'publisher':{'@type':'Organization','name':'Fyblic'},'image':[image],'url':canonical}).replace(/</g,'\\u003c');
  const html='<!doctype html><html lang="fr"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Fyblic</title><meta name="description" content="'+esc(publicationTitle)+'">'+
    '<meta property="og:type" content="'+(type==='video'?'video.other':'article')+'"><meta property="og:site_name" content="Fyblic"><meta property="og:title" content="Fyblic"><meta property="og:description" content="'+esc(publicationTitle)+'"><meta property="og:url" content="'+esc(canonical)+'">'+
    '<meta property="og:image" content="'+esc(image)+'"><meta property="og:image:url" content="'+esc(image)+'"><meta property="og:image:secure_url" content="'+esc(image)+'"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="900"><meta property="og:image:alt" content="'+esc(publicationTitle)+'">'+
    '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="Fyblic"><meta name="twitter:description" content="'+esc(publicationTitle)+'"><meta name="twitter:image" content="'+esc(image)+'">'+
    '<meta name="robots" content="noindex,nofollow"><script type="application/ld+json">'+structured+'</script></head>'+
    '<body style="margin:0;background:#03070d"><script>location.replace('+JSON.stringify(target)+');<\/script></body></html>';
  return {statusCode:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=120, s-maxage=300','X-Robots-Tag':'noindex'},body:method==='HEAD'?'':html};
};
