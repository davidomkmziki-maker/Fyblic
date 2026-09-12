'use strict';

const SUPABASE_URL = 'https://txjjyhupbejgjcianrmr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_35EsjCOhZtaPtoZwdyAYOw_KaqlSKHD';

function esc(value){
  return String(value == null ? '' : value)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function clean(value){ return String(value == null ? '' : value).trim(); }
function absoluteMedia(value){
  let src=clean(value);if(!src)return '';
  if(/^https?:\/\//i.test(src))return src;
  src=src.replace(/^\/+/, '').replace(/^happyad-media\//i,'');
  return SUPABASE_URL.replace(/\/+$/,'') + '/storage/v1/object/public/happyad-media/' + encodeURI(src);
}
function mediaCandidate(row){
  row=row||{};
  const isVideo=/video|reel|clip/i.test(clean(row.media_type||row.type||row.kind));
  const poster=clean(row.thumbnail_url||row.poster_url||row.cover_url||row.image_url||row.photo_url);
  const media=clean(row.home_media_url||row.media_url||row.media_path||row.image_url||row.photo_url||row.video_url_compressed||row.video_url_original);
  let value=isVideo?(poster||media):(media||poster);
  if(isVideo&&!poster&&/\.(mp4|webm|mov|m4v)(?:$|[?#])/i.test(media))value='';
  return absoluteMedia(value);
}
function originOf(event){
  const headers=event.headers||{};
  const host=headers['x-forwarded-host']||headers.host||'happyad.netlify.app';
  const proto=headers['x-forwarded-proto']||'https';
  return proto+'://'+host;
}
function safeVersion(value){return clean(value).replace(/[^a-zA-Z0-9_-]/g,'').slice(0,48)||'1';}

exports.handler = async function(event){
  const pathParts=clean(event.path).split('/').filter(Boolean);
  const query=event.queryStringParameters||{};
  const rawPost=clean(query.post || pathParts[pathParts.length-2] || pathParts[pathParts.length-1]);
  const postId=rawPost.includes('/')?rawPost.split('/')[0]:rawPost;
  const version=safeVersion(query.v || pathParts[pathParts.length-1]);
  const origin=originOf(event);
  let row=null;
  if(postId){
    try{
      const select='id,title,description,caption,media_type,thumbnail_url,poster_url,cover_url,home_media_url,media_url,media_path,video_url_compressed,video_url_original,user_id,display_name,creator_name';
      const url=SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/happyad_posts?id=eq.'+encodeURIComponent(postId)+'&select='+encodeURIComponent(select)+'&limit=1';
      const response=await fetch(url,{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+SUPABASE_KEY,Accept:'application/json'}});
      if(response.ok){const data=await response.json();row=Array.isArray(data)&&data[0]?data[0]:null;}
    }catch(_error){}
  }
  row=row||{};
  const type=/video|reel|clip/i.test(clean(row.media_type||query.type))?'video':'photo';
  const title=clean(row.title)||'Publication Fyblic';
  const description=clean(row.description||row.caption)||'Découvrez cette publication sur Fyblic.';
  const requestedImage=/^https:\/\//i.test(clean(query.image))?clean(query.image):'';
  const sourceImage=requestedImage||mediaCandidate(row)||origin+'/icons/happyad-icon-v535center1-512.png';
  const image=type==='video'
    ? origin+'/share-image/'+encodeURIComponent(postId)+'/'+encodeURIComponent(version)+'?image='+encodeURIComponent(sourceImage)+'&type=video'
    : sourceImage;
  const target=origin+'/?happyad_post='+encodeURIComponent(postId)+'&happyad_type='+encodeURIComponent(type)+'&source=shared_link';
  const canonical=origin+'/s/'+encodeURIComponent(postId)+'/'+encodeURIComponent(version)+'?type='+encodeURIComponent(type);
  const imageTypeMeta=type==='video'?'<meta property="og:image:type" content="image/png">':'';
  const play=type==='video'?'<span style="position:absolute;left:50%;top:50%;width:76px;height:76px;border-radius:50%;background:rgba(0,0,0,.68);border:2px solid rgba(255,255,255,.92);transform:translate(-50%,-50%);display:grid;place-items:center"><i style="display:block;margin-left:7px;width:0;height:0;border-top:17px solid transparent;border-bottom:17px solid transparent;border-left:27px solid #fff"></i></span>':'';
  const html='<!doctype html><html lang="fr"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+esc(title)+'</title><meta name="description" content="'+esc(description)+'">'+
    '<meta property="og:type" content="article"><meta property="og:site_name" content="Fyblic">'+
    '<meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'">'+
    '<meta property="og:url" content="'+esc(canonical)+'"><meta property="og:image" content="'+esc(image)+'">'+
    '<meta property="og:image:secure_url" content="'+esc(image)+'">'+
    imageTypeMeta+'<meta property="og:image:width" content="1200"><meta property="og:image:height" content="1200">'+
    '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(title)+'">'+
    '<meta name="twitter:description" content="'+esc(description)+'"><meta name="twitter:image" content="'+esc(image)+'">'+
    '<meta http-equiv="refresh" content="0;url='+esc(target)+'"><meta name="robots" content="noindex,nofollow">'+
    '</head><body style="margin:0;background:#03070d;color:#fff;font-family:Arial,sans-serif">'+
    '<main style="min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px"><div><div style="position:relative;width:min(86vw,520px);margin:auto"><img src="'+esc(sourceImage)+'" alt="" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:20px;display:block">'+play+'</div><h1>'+esc(title)+'</h1><p>Ouverture dans Fyblic…</p><p><a style="color:#ff8a00" href="'+esc(target)+'">Ouvrir la publication</a></p></div></main>'+ 
    '<script>location.replace('+JSON.stringify(target)+');<\/script></body></html>';
  return {statusCode:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=0, s-maxage=90, must-revalidate','X-Robots-Tag':'noindex'},body:html};
};
