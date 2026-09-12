'use strict';

/* Fyblic P1.02.08 — configuration serveur depuis l'environnement Netlify.
   Ce module n'accepte volontairement qu'une clé Supabase publiable. */
const URL_VARIABLES=Object.freeze([
  'HAPPYAD_SUPABASE_URL',
  'SUPABASE_URL'
]);
const PUBLISHABLE_KEY_VARIABLES=Object.freeze([
  'HAPPYAD_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_ANON_KEY'
]);

function clean(value){return String(value==null?'':value).trim();}

function firstValue(env,names){
  env=env||{};
  for(const name of names){
    const value=clean(env[name]);
    if(value)return value;
  }
  return '';
}

function normalizedProjectUrl(value){
  try{
    const url=new URL(clean(value));
    if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)return '';
    if(!/^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname))return '';
    if(url.pathname&&url.pathname!=='/')return '';
    return url.origin;
  }catch(_e){return '';}
}

function validPublishableKey(value){
  return /^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(clean(value));
}

function readPublicSupabaseConfig(env){
  env=env||process.env||{};
  const url=normalizedProjectUrl(firstValue(env,URL_VARIABLES));
  const candidate=firstValue(env,PUBLISHABLE_KEY_VARIABLES);
  const publishableKey=validPublishableKey(candidate)?candidate:'';
  return Object.freeze({
    url,
    publishableKey,
    ready:Boolean(url&&publishableKey)
  });
}

module.exports=Object.freeze({readPublicSupabaseConfig});
