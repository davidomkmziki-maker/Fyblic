'use strict';

// The same PUBLIC configuration as the browser. Never bundle a secret/service-role key.
const PUBLIC_CONFIG=require('./happyad-public-config.json');
const URL_VARIABLES=['HAPPYAD_SUPABASE_URL','SUPABASE_URL'];
const KEY_VARIABLES=['HAPPYAD_SUPABASE_PUBLISHABLE_KEY','SUPABASE_PUBLISHABLE_KEY','SUPABASE_ANON_KEY'];
function clean(v){return String(v==null?'':v).trim();}
function firstValue(env,names){for(const n of names){const v=clean(env[n]);if(v)return v;}return '';}
function projectUrl(value){
  try{const u=new URL(clean(value));return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.search&&!u.hash&&/^[-a-z0-9]+\.supabase\.co$/i.test(u.hostname)&&u.pathname==='/'?u.origin:'';}catch(_e){return '';}
}
function publicKeyKind(key,url){
  if(/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key))return 'publishable';
  // Legacy anon JWTs remain public keys. Elevated keys are always rejected.
  try{
    const parts=key.split('.');if(parts.length!==3)return '';
    const payload=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));
    if(payload.role==='anon'&&(!payload.ref||payload.ref===new URL(url).hostname.split('.')[0]))return 'anon';
  }catch(_e){}
  return '';
}
function readPublicSupabaseConfig(env=process.env){
  const configuredUrl=firstValue(env,URL_VARIABLES),configuredKey=firstValue(env,KEY_VARIABLES);
  const url=projectUrl(configuredUrl||PUBLIC_CONFIG.url);
  const candidate=configuredKey||((url===PUBLIC_CONFIG.url)?PUBLIC_CONFIG.publishableKey:'');
  const kind=publicKeyKind(candidate,url),publishableKey=kind?candidate:'';
  return Object.freeze({url,publishableKey,kind,ready:Boolean(url&&publishableKey)});
}
module.exports=Object.freeze({readPublicSupabaseConfig});
