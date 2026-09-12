'use strict';

const sharp = require('sharp');
const FALLBACK = '/icons/happyad-icon-v535center1-512.png';

function clean(value){return String(value==null?'':value).trim();}
function originOf(event){
  const headers=event.headers||{};
  const host=headers['x-forwarded-host']||headers.host||'happyad.netlify.app';
  const proto=headers['x-forwarded-proto']||'https';
  return proto+'://'+host;
}
function allowedRemote(url){
  try{
    const u=new URL(url);
    return u.protocol==='https:' && (
      u.hostname.endsWith('.supabase.co') ||
      u.hostname.endsWith('.cloudflarestream.com') ||
      u.hostname.endsWith('.cloudflarestorage.com')
    );
  }catch(_error){return false;}
}

exports.handler=async function(event){
  const query=event.queryStringParameters||{};
  const origin=originOf(event);
  let source=clean(query.image);
  if(!allowedRemote(source))source=origin+FALLBACK;
  try{
    const response=await fetch(source,{headers:{Accept:'image/*'}});
    if(!response.ok)throw new Error('image fetch '+response.status);
    const input=Buffer.from(await response.arrayBuffer());
    const overlay=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 250 250"><circle cx="125" cy="125" r="94" fill="rgba(0,0,0,.64)" stroke="white" stroke-width="7"/><path d="M105 77 L105 173 L181 125 Z" fill="white"/></svg>');
    const output=await sharp(input,{failOn:'none'})
      .rotate()
      .resize(1200,1200,{fit:'cover',position:'centre'})
      .composite([{input:overlay,gravity:'centre'}])
      .png({quality:92,compressionLevel:7})
      .toBuffer();
    return {statusCode:200,isBase64Encoded:true,headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=31536000, immutable','Access-Control-Allow-Origin':'*'},body:output.toString('base64')};
  }catch(_error){
    return {statusCode:302,headers:{Location:origin+FALLBACK,'Cache-Control':'no-store'},body:''};
  }
};
