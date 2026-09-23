/* Fyblic V821 — publication réelle de toutes les catégories Marketplace.
   - une seule centrale : public.happyad_posts ;
   - vendeur obligatoirement approuvé par Admin (V801) ;
   - médias publics dans happyad-media ;
   - justificatifs privés dans happyad-marketplace-private ;
   - catégories : Produit, Électronique, Véhicule, Terrain, Service,
     Emploi, Immobilier et Autre.
*/
(function(){
  'use strict';
  if(window.__HAPPYAD_LISTING_PUBLICATION_SUPABASE_V821__)return;
  window.__HAPPYAD_LISTING_PUBLICATION_SUPABASE_V821__=true;

  var VERSION='V1081_FAST_PRIMARY';
  var PUBLIC_BUCKET='happyad-media';
  var PRIVATE_BUCKET='happyad-marketplace-private';
  var RPC='happyad_publish_listing_v1';
  var verificationBridge=window.HAPPYAD_VERIFICATION_BRIDGE||null;

  function clean(value){return String(value==null?'':value).replace(/\s+/g,' ').trim();}
  function lower(value){return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  function num(value){var n=Number(String(value==null?'':value).replace(/\s/g,'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0;}
  function int(value){var n=Math.floor(num(value));return Number.isFinite(n)?n:0;}
  function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  function withTimeout(promise,ms,label){
    return new Promise(function(resolve,reject){
      var timer=setTimeout(function(){reject(new Error(label+' : délai dépassé.'));},ms);
      Promise.resolve(promise).then(function(value){clearTimeout(timer);resolve(value);},function(error){clearTimeout(timer);reject(error);});
    });
  }
  function isNetworkError(error){
    var message=lower(error&&error.message||error);
    return message.indexOf('failed to fetch')>=0||message.indexOf('networkerror')>=0||message.indexOf('network request failed')>=0||message.indexOf('load failed')>=0||message.indexOf('délai dépassé')>=0||message.indexOf('delai depasse')>=0;
  }
  function errorDetails(error){
    var parts=[];
    try{if(error&&error.statusCode)parts.push('statusCode='+error.statusCode);}catch(_e){}
    try{if(error&&error.status)parts.push('status='+error.status);}catch(_e){}
    try{if(error&&error.error)parts.push('error='+error.error);}catch(_e){}
    try{if(error&&error.message)parts.push('message='+error.message);}catch(_e){}
    return clean(parts.join(' | ')||error&&error.message||error);
  }
  /* V1001 — le nom de l'infrastructure reste interne. Tous les textes transmis
     à l'interface Marketplace sont formulés comme des étapes Fyblic. */
  function publicMessage(message){
    return clean(message)
      .replace(/Vérification\s+Supabase/gi,'Vérification de la publication')
      .replace(/Enregistrement\s+Supabase/gi,'Enregistrement de la publication')
      .replace(/Supabase/gi,'Fyblic');
  }
  function simpleProgressMessage(message){var raw=clean(message);if(/échec|echec|failed|erreur/i.test(raw))return 'Échec';if(/publiée|publiee|published|terminée|terminee/i.test(raw))return 'Publication terminée';if(/envoi|upload/i.test(raw))return 'Envoi du média';return 'Publication en cours';}
  function progress(payload,message){
    message=simpleProgressMessage(publicMessage(message));
    try{if(payload&&typeof payload.onProgress==='function')payload.onProgress(message);}catch(_e){}
    try{document.dispatchEvent(new CustomEvent('happyad:listing-publication-progress',{detail:{message:message,source:VERSION}}));}catch(_e){}
  }
  function client(){
    try{if(typeof window.happyadSb==='function'){var c=window.happyadSb();if(c&&c.from&&c.storage&&c.auth)return c;}}catch(_e){}
    try{if(window.happyadSupabase&&window.happyadSupabase.from)return window.happyadSupabase;}catch(_e){}
    try{if(window.supabaseClient&&window.supabaseClient.from)return window.supabaseClient;}catch(_e){}
    try{if(window.HAPPYAD_SUPABASE&&window.HAPPYAD_SUPABASE.from)return window.HAPPYAD_SUPABASE;}catch(_e){}
    return null;
  }
  function uuid(){
    try{if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();}catch(_e){}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(ch){var r=Math.random()*16|0,v=ch==='x'?r:(r&3|8);return v.toString(16);});
  }
  function extension(file){
    var name=clean(file&&file.name).toLowerCase();
    var match=name.match(/\.([a-z0-9]{1,8})$/);
    if(match)return match[1].replace(/[^a-z0-9]/g,'')||'bin';
    var type=clean(file&&file.type).toLowerCase();
    if(type==='image/jpeg')return 'jpg';
    if(type==='image/png')return 'png';
    if(type==='image/webp')return 'webp';
    if(type==='video/mp4')return 'mp4';
    if(type==='video/webm')return 'webm';
    if(type==='video/quicktime')return 'mov';
    if(type==='application/pdf')return 'pdf';
    return 'bin';
  }
  function inferredMime(file){
    var declared=clean(file&&file.type).toLowerCase();
    if(declared&&declared!=='application/octet-stream')return declared;
    var ext=extension(file);
    return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',avif:'image/avif',heic:'image/heic',heif:'image/heif',gif:'image/gif',bmp:'image/bmp',tif:'image/tiff',tiff:'image/tiff',svg:'image/svg+xml',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime',m4v:'video/x-m4v','3gp':'video/3gpp','3g2':'video/3gpp2',mkv:'video/x-matroska',avi:'video/x-msvideo',mpeg:'video/mpeg',mpg:'video/mpeg',ogv:'video/ogg',ts:'video/mp2t',mts:'video/mp2t',m2ts:'video/mp2t'})[ext]||declared||'application/octet-stream';
  }
  function canonicalCategory(value){
    var n=lower(value);
    if(n==='produit'||n==='product')return 'Produit';
    if(n.indexOf('electron')>=0)return 'Électronique';
    if(n.indexOf('vehicule')>=0||n==='vehicle'||n==='car')return 'Véhicule';
    if(n==='terrain'||n==='land')return 'Terrain';
    if(n==='service'||n==='prestation')return 'Service';
    if(n==='emploi'||n==='job'||n==='travail')return 'Emploi';
    if(n==='immobilier'||n==='property'||n==='real estate')return 'Immobilier';
    if(n==='autre'||n==='other')return 'Autre';
    return '';
  }
  function categoryRule(category){
    category=canonicalCategory(category);
    var common={category:category,minMedia:1,maxMedia:6,priceRequired:true,availabilityRequired:true,privateOwnership:false,privateOfficial:false};
    if(category==='Produit'||category==='Électronique')return Object.assign(common,{condition:true,quantity:true,product:true});
    if(category==='Véhicule')return Object.assign(common,{condition:true,vehicle:true,minMedia:2,privateOwnership:true,privateOfficial:true});
    if(category==='Terrain')return Object.assign(common,{land:true,minMedia:2,privateOwnership:true,privateOfficial:true});
    if(category==='Service')return Object.assign(common,{service:true});
    if(category==='Emploi')return Object.assign(common,{job:true,priceRequired:false,availabilityRequired:false,privateOwnership:true});
    if(category==='Immobilier')return Object.assign(common,{property:true,minMedia:2,privateOwnership:true,privateOfficial:true});
    if(category==='Autre')return Object.assign(common,{condition:true,quantity:true,minMedia:2,privateOwnership:true});
    return null;
  }
  function errorText(error){
    var message=clean(error&&error.message||error);
    if(message.indexOf('SELLER_NOT_APPROVED')>=0)return 'Ton compte vendeur doit d’abord être approuvé par Fyblic.';
    if(message.indexOf('HAPPYAD_V801_VERIFICATION_REQUIRED')>=0)return 'Le système de vérification vendeur V801 doit être installé.';
    if(message.indexOf('HAPPYAD_POSTS_TABLE_REQUIRED')>=0)return 'La centrale happyad_posts est introuvable.';
    if(message.indexOf('CATEGORY_INVALID')>=0)return 'Choisis une catégorie valide pour l’annonce.';
    if(message.indexOf('MEDIA_UPLOAD_MISSING')>=0)return 'Un média public n’a pas été chargé correctement. Réessaie.';
    if(message.indexOf('PRIVATE_UPLOAD_MISSING')>=0)return 'Un justificatif privé n’a pas été chargé correctement. Réessaie.';
    if(message.indexOf('MEDIA_COUNT_INVALID')>=0)return 'Le nombre d’images ou vidéos ne respecte pas la catégorie.';
    if(message.indexOf('OWNERSHIP_REQUIRED')>=0)return 'Ajoute le justificatif demandé pour cette catégorie.';
    if(message.indexOf('OFFICIAL_REQUIRED')>=0)return 'Ajoute le document officiel demandé pour cette catégorie.';
    if(message.indexOf('TITLE_INVALID')>=0)return 'Le titre de l’annonce est invalide.';
    if(message.indexOf('DESCRIPTION_INVALID')>=0)return 'La description doit contenir au moins 10 caractères.';
    if(message.indexOf('PRICE_INVALID')>=0)return 'Indique un prix ou tarif supérieur à zéro.';
    if(message.indexOf('CURRENCY_REQUIRED')>=0)return 'Choisis la monnaie du montant indiqué.';
    if(message.indexOf('LOCATION_REQUIRED')>=0)return 'Indique le pays et la ville de l’annonce.';
    if(message.indexOf('CONDITION_INVALID')>=0)return 'Choisis l’état réel de l’annonce.';
    if(message.indexOf('QUANTITY_INVALID')>=0)return 'Indique une quantité valide.';
    if(message.indexOf('VEHICLE_DETAILS_INVALID')>=0)return 'Vérifie l’année et le kilométrage du véhicule.';
    if(message.indexOf('LAND_DETAILS_INVALID')>=0)return 'Complète la superficie, l’unité, l’usage et le document du terrain.';
    if(message.indexOf('SERVICE_DETAILS_INVALID')>=0)return 'Complète le mode, la tarification et l’expérience du service.';
    if(message.indexOf('JOB_DETAILS_INVALID')>=0)return 'Complète les informations obligatoires de l’emploi.';
    if(message.indexOf('PROPERTY_DETAILS_INVALID')>=0)return 'Complète le type, les pièces et la superficie du bien.';
    if(message.indexOf('ATTESTATION_REQUIRED')>=0)return 'Confirme l’attestation avant de publier.';
    if(message.indexOf('PUBLICATION_RETURN_INVALID')>=0)return 'Fyblic n’a pas confirmé l’identifiant de l’annonce publiée.';
    if(message.indexOf('Could not find the function')>=0||message.indexOf(RPC)>=0)return 'Le SQL de publication toutes catégories V811 doit être exécuté.';
    if(message.indexOf('row-level security')>=0||message.indexOf('policy')>=0)return 'Les règles Storage Marketplace V811 ne sont pas encore installées.';
    if(isNetworkError(error))return 'Connexion interrompue pendant la publication. Fyblic a réessayé automatiquement, mais aucune confirmation fiable n’a été reçue. Tes informations restent affichées : réessaie lorsque le réseau est stable.';
    return publicMessage(message)||'Publication de l’annonce impossible.';
  }
  async function freshSession(c){
    var sessionResult=await withTimeout(c.auth.getSession(),15000,'Vérification de session');
    if(sessionResult&&sessionResult.error)throw sessionResult.error;
    var session=sessionResult&&sessionResult.data&&sessionResult.data.session||null;
    var expiresAt=Number(session&&session.expires_at||0);
    if(!session||!session.access_token||expiresAt*1000-Date.now()<120000){
      var refreshed=await withTimeout(c.auth.refreshSession(),20000,'Actualisation de session');
      if(refreshed&&refreshed.error)throw refreshed.error;
      session=refreshed&&refreshed.data&&refreshed.data.session||session;
    }
    return session;
  }
  async function currentUser(c){
    await freshSession(c);
    var result=await withTimeout(c.auth.getUser(),15000,'Vérification du compte');
    if(result&&result.error)throw result.error;
    var user=result&&result.data&&result.data.user;
    if(!user||!user.id)throw new Error('Connecte-toi à ton compte Fyblic avant de publier.');
    return user;
  }
  async function approvedSeller(){
    var bridge=verificationBridge||window.HAPPYAD_VERIFICATION_BRIDGE;
    if(!bridge)throw new Error('Le service de vérification vendeur est indisponible.');
    var state=null;
    try{if(typeof bridge.getCachedStatus==='function')state=bridge.getCachedStatus();}catch(_e){}
    var status=lower(state&&state.status);
    if(['approved','verified','validated','active'].indexOf(status)>=0)return state;
    if(typeof bridge.getStatus!=='function')throw new Error('Le service de vérification vendeur est indisponible.');
    state=await bridge.getStatus();
    status=lower(state&&state.status);
    if(['approved','verified','validated','active'].indexOf(status)<0)throw new Error('SELLER_NOT_APPROVED');
    return state;
  }
  function requiredText(value,min,message){if(clean(value).length<min)throw new Error(message);}
  function publicMediaKind(file){
    var type=lower(file&&file.type),ext=extension(file);
    if(type.indexOf('video/')===0||/^(mp4|webm|mov|m4v|3gp|3g2|mkv|avi|mpeg|mpg|ogv|ts|mts|m2ts|flv|wmv|vob|asf|divx)$/.test(ext))return 'video';
    if(type.indexOf('image/')===0||/^(jpg|jpeg|jfif|png|webp|avif|heic|heif|gif|apng|bmp|tif|tiff|svg|jxl|ico|dng|raw|cr2|cr3|nef|arw)$/.test(ext))return 'image';
    return '';
  }
  function validatePublicFile(file){
    var kind=publicMediaKind(file);
    if(!kind)throw new Error('Les médias publics acceptent uniquement des images ou vidéos.');
    if(kind==='image'&&Number(file.size||0)>20*1024*1024)throw new Error('Chaque image doit faire au maximum 20 Mo.');
    if(kind==='video'&&Number(file.size||0)>1100000000)throw new Error('Chaque vidéo doit faire au maximum 1,1 Go.');
  }
  function validatePrivateFile(file){
    var type=lower(file&&file.type);
    if(['image/jpeg','image/png','image/webp','application/pdf'].indexOf(type)<0)throw new Error('Les justificatifs doivent être JPG, PNG, WEBP ou PDF.');
    if(Number(file.size||0)>12*1024*1024)throw new Error('Chaque justificatif doit faire au maximum 12 Mo.');
  }
  function validate(payload){
    payload=payload&&typeof payload==='object'?payload:{};
    var offer=payload.offer&&typeof payload.offer==='object'?payload.offer:{};
    var proofs=payload.proofs&&typeof payload.proofs==='object'?payload.proofs:{};
    var category=canonicalCategory(offer.category);
    var rule=categoryRule(category);
    if(!rule)throw new Error('CATEGORY_INVALID');
    var files=Array.isArray(proofs.evidence)?proofs.evidence.filter(Boolean):[];
    var ownership=Array.isArray(proofs.ownership)?proofs.ownership.filter(Boolean):[];
    var official=Array.isArray(proofs.official)?proofs.official.filter(Boolean):[];

    requiredText(offer.title,3,'TITLE_INVALID');
    requiredText(offer.description,10,'DESCRIPTION_INVALID');
    if(clean(offer.description).length>6000)throw new Error('DESCRIPTION_INVALID');
    if(clean(offer.country).length<2||clean(offer.city).length<2)throw new Error('LOCATION_REQUIRED');
    requiredText(offer.type,2,'TYPE_REQUIRED');
    if(rule.priceRequired&&num(offer.price)<=0)throw new Error('PRICE_INVALID');
    if(num(offer.price)>0&&clean(offer.currency).length<2)throw new Error('CURRENCY_REQUIRED');
    if(rule.availabilityRequired&&clean(offer.availability).length<2)throw new Error('AVAILABILITY_REQUIRED');
    if(rule.condition&&['Neuf','Comme neuf','Occasion','Reconditionné'].indexOf(clean(offer.condition))<0)throw new Error('CONDITION_INVALID');
    if(rule.quantity&&(int(offer.quantity)<1||int(offer.quantity)>999999))throw new Error('QUANTITY_INVALID');
    if(rule.vehicle){
      var year=int(offer.vehicleYear),mileage=num(offer.vehicleMileage),maxYear=(new Date()).getFullYear()+1;
      if(year<1950||year>maxYear||mileage<0)throw new Error('VEHICLE_DETAILS_INVALID');
    }
    if(rule.land){
      if(num(offer.landArea)<=0||clean(offer.landAreaUnit).length<1||clean(offer.landUse).length<2||clean(offer.landDocumentType).length<2)throw new Error('LAND_DETAILS_INVALID');
    }
    if(rule.service){
      if(clean(offer.serviceMode).length<2||clean(offer.servicePricing).length<2||clean(offer.serviceExperience).length<1)throw new Error('SERVICE_DETAILS_INVALID');
    }
    if(rule.job){
      if(clean(offer.companyName).length<2||clean(offer.jobContract).length<2||clean(offer.jobWorkMode).length<2||clean(offer.jobExperience).length<1||int(offer.jobPositions)<1)throw new Error('JOB_DETAILS_INVALID');
      if(num(offer.price)>0&&clean(offer.currency).length<2)throw new Error('CURRENCY_REQUIRED');
    }
    if(rule.property){
      if(clean(offer.propertyType).length<2||int(offer.propertyRooms)<1||num(offer.propertyArea)<=0)throw new Error('PROPERTY_DETAILS_INVALID');
    }
    if(files.length<rule.minMedia||files.length>rule.maxMedia)throw new Error('MEDIA_COUNT_INVALID');
    files.forEach(validatePublicFile);
    if(rule.privateOwnership&&ownership.length<1)throw new Error('OWNERSHIP_REQUIRED');
    if(rule.privateOfficial&&official.length<1)throw new Error('OFFICIAL_REQUIRED');
    if(ownership.length>2||official.length>2)throw new Error('Maximum 2 justificatifs par type.');
    ownership.forEach(validatePrivateFile);official.forEach(validatePrivateFile);
    if(proofs.attested!==true)throw new Error('ATTESTATION_REQUIRED');
    return {offer:offer,proofs:proofs,category:category,rule:rule,files:files,ownership:ownership,official:official};
  }
  function duplicateUpload(error){
    var message=lower(errorDetails(error));
    return message.indexOf('duplicate')>=0||message.indexOf('already exists')>=0||message.indexOf('resource already exists')>=0||String(error&&error.statusCode||error&&error.status||'')==='409';
  }
  async function uploadWithRetry(c,bucket,path,file,options,label,payload){
    var lastError=null;
    for(var attempt=1;attempt<=3;attempt++){
      progress(payload,label+(attempt>1?' — nouvel essai '+attempt+'/3':'…'));
      try{
        if(attempt>1)await freshSession(c);
        var result=await withTimeout(c.storage.from(bucket).upload(path,file,options),90000,label);
        if(result&&result.error){
          if(duplicateUpload(result.error))return {path:path,replayed:true};
          throw result.error;
        }
        return result&&result.data||{path:path};
      }catch(error){
        lastError=error;
        if(duplicateUpload(error))return {path:path,replayed:true};
        if(!isNetworkError(error)||attempt===3)break;
        await sleep(attempt*900);
      }
    }
    var wrapped=new Error(label+' : '+(errorDetails(lastError)||'échec réseau'));
    wrapped.cause=lastError;
    wrapped.happyadNetwork=isNetworkError(lastError);
    throw wrapped;
  }
  async function uploadPrivate(c,user,listingId,file,kind,index,payload){
    var path=user.id+'/marketplace/'+listingId+'/private/'+kind+'/'+String(index+1).padStart(2,'0')+'-'+uuid()+'.'+extension(file);
    await uploadWithRetry(c,PRIVATE_BUCKET,path,file,{upsert:false,cacheControl:'3600',contentType:inferredMime(file)},'Envoi du justificatif '+(index+1),payload);
    return path;
  }
  async function cleanup(c,bucket,paths){
    if(!paths.length)return;
    try{await c.storage.from(bucket).remove(paths);}catch(_e){}
  }
  function details(offer){
    var category=canonicalCategory(offer&&offer.category);
    var out={
      show_on_home:offer&&offer.showOnHome===true,
      cover_index:Math.max(0,int(offer&&offer.coverIndex)||0)
    };
    if(category==='Produit'||category==='Électronique'||category==='Autre'){
      out.condition=clean(offer.condition);out.quantity=int(offer.quantity)||null;
      if(category!=='Autre'){out.product_brand=clean(offer.productBrand);out.product_model=clean(offer.productModel);}
    }
    if(category==='Véhicule'){
      out.condition=clean(offer.condition);out.vehicle_year=int(offer.vehicleYear)||null;out.vehicle_mileage=num(offer.vehicleMileage);
    }
    if(category==='Terrain'){
      out.land_area=num(offer.landArea);out.land_area_unit=clean(offer.landAreaUnit);out.land_use=clean(offer.landUse);out.land_document_type=clean(offer.landDocumentType);
    }
    if(category==='Service'){
      out.service_mode=clean(offer.serviceMode);out.service_pricing=clean(offer.servicePricing);out.service_experience=clean(offer.serviceExperience);
    }
    if(category==='Emploi'){
      out.company_name=clean(offer.companyName);out.job_contract=clean(offer.jobContract);out.job_work_mode=clean(offer.jobWorkMode);out.job_experience=clean(offer.jobExperience);out.job_positions=int(offer.jobPositions)||null;out.job_deadline=clean(offer.jobDeadline)||null;
    }
    if(category==='Immobilier'){
      out.property_type=clean(offer.propertyType);out.property_rooms=int(offer.propertyRooms)||null;out.property_area=num(offer.propertyArea);
    }
    return out;
  }
  function normalizedListing(row,offer,category,media,user,verification){
    row=row&&typeof row==='object'?row:{};
    var coverIndex=Math.max(0,Math.min(int(offer&&offer.coverIndex)||0,Math.max(0,media.length-1)));
    var first=media[coverIndex]||media[0]||{};
    var id=clean(row.id||row.listing_id||row.post_id);
    var d=details(offer);
    return Object.assign({},row,d,{
      id:id,post_id:id,user_id:user.id,owner_id:user.id,seller_id:user.id,
      mode:'marketplace',happyad_marketplace:true,is_marketplace:true,
      marketplace_category:category,category:category,listing_type:clean(offer.type),listing_status:'active',status:'active',is_active:true,
      title:clean(offer.title),description:clean(offer.description),country:clean(offer.country),city:clean(offer.city),location:clean(offer.location||[offer.city,offer.country].filter(Boolean).join(' · ')),
      marketplace_price:num(offer.price),price:num(offer.price),price_label:clean(offer.priceLabel||(num(offer.price)>0?offer.price+' '+offer.currency:'Salaire non précisé')),currency:clean(offer.currency),availability:clean(offer.availability),
      product_condition:clean(offer.condition),condition:clean(offer.condition),quantity:int(offer.quantity)||null,product_brand:clean(offer.productBrand),product_model:clean(offer.productModel),
      marketplace_details:d,marketplace_media:media,media:media,media_url:first.src||'',media_path:first.path||'',media_type:first.type||'image',
      marketplace_show_on_home:offer&&offer.showOnHome===true,showOnHome:offer&&offer.showOnHome===true,
      marketplace_cover_index:coverIndex,coverIndex:coverIndex,marketplace_cover_url:first.src||'',marketplace_cover_path:first.path||'',marketplace_cover_type:first.type||'image',
      listing_views_count:Number(row.listing_views_count||0),viewsCount:Number(row.listing_views_count||0),
      seller_badge:clean(row.seller_badge||row.badge||verification&&verification.badge),
      seller_verification_id:clean(verification&&verification.id||verification&&verification.requestId),created_at:row.created_at||new Date().toISOString()
    });
  }
  function patchOneCache(key,listing){
    try{
      var raw=JSON.parse(localStorage.getItem(key)||'null');
      var shape='array',list=raw;
      if(raw&&Array.isArray(raw.posts)){shape='posts';list=raw.posts;}
      else if(raw&&Array.isArray(raw.data)){shape='data';list=raw.data;}
      if(!Array.isArray(list))list=[];
      var next=[listing].concat(list.filter(function(item){return clean(item&&item.id)!==clean(listing.id);})).slice(0,420);
      if(shape==='posts'){raw=raw||{};raw.posts=next;localStorage.setItem(key,JSON.stringify(raw));}
      else if(shape==='data'){raw=raw||{};raw.data=next;localStorage.setItem(key,JSON.stringify(raw));}
      else localStorage.setItem(key,JSON.stringify(next));
    }catch(_e){}
  }
  function patchCaches(listing){
    var confirmed=Object.assign({},listing,{__homeServerConfirmedV643:true,__fromPublishSuccess:true});
    ['HAPPYAD_GLOBAL_POSTS_CACHE_V1','HAPPYAD_PUBLISH_POSTS_V2','HAPPYAD_HOME_POSTS_CACHE_V1','HAPPYAD_ALL_POSTS_V1','HAPPYAD_SEARCH_POSTS_FAST_CACHE_V1','HAPPYAD_PROFILE_POSTS_CACHE_V1'].forEach(function(key){patchOneCache(key,listing);});
    ['HAPPYAD_HOME_CONFIRMED_ORDER_V643','HAPPYAD_HOME_BOOT_SNAPSHOT_V1'].forEach(function(key){patchOneCache(key,confirmed);});
    try{
      var session=JSON.parse(sessionStorage.getItem('HAPPYAD_SESSION_ALL_POSTS_V104')||'[]');if(!Array.isArray(session))session=[];
      sessionStorage.setItem('HAPPYAD_SESSION_ALL_POSTS_V104',JSON.stringify([confirmed].concat(session.filter(function(x){return clean(x&&x.id)!==clean(confirmed.id);})).slice(0,100)));
    }catch(_s){}
    try{localStorage.setItem('HAPPYAD_HOME_REFRESH_NEEDED','1');}catch(_e){}
    try{sessionStorage.removeItem('HAPPYAD_ALL_POSTS_LAST_SYNC');sessionStorage.removeItem('HAPPYAD_PROFILE_POSTS_LAST_SYNC');}catch(_e){}
  }
  function queueProfileNotice(listing){
    try{
      var key='FYBLIC_PROFILE_PUBLICATION_NOTICES_V1',list=JSON.parse(localStorage.getItem(key)||'[]');
      if(!Array.isArray(list))list=[];
      var id='boutique_'+clean(listing&&listing.id||Date.now()),item={id:id,postId:clean(listing&&listing.id),text:'Ta publication Boutique est entièrement prête.',kind:'success',at:Date.now()};
      list=[item].concat(list.filter(function(x){return x&&String(x.id)!==id;})).slice(0,12);
      localStorage.setItem(key,JSON.stringify(list));
    }catch(_e){}
  }
  async function findPublishedListing(c,listingId,userId){
    try{
      var found=await withTimeout(c.from('happyad_posts').select('*').eq('id',listingId).maybeSingle(),20000,'Vérification de publication');
      if(found&&found.error)return null;
      var row=found&&found.data||null;
      if(row&&clean(row.id)===clean(listingId)&&(!row.user_id||clean(row.user_id)===clean(userId)))return row;
    }catch(_e){}
    return null;
  }
  async function callPublishRpc(c,args,listingId,user,payload){
    var lastError=null;
    for(var attempt=1;attempt<=3;attempt++){
      progress(payload,attempt===1?'Enregistrement de l’annonce…':'Vérification de la publication — nouvel essai '+attempt+'/3');
      try{
        if(attempt>1)await freshSession(c);
        var result=await withTimeout(c.rpc(RPC,args),45000,'Enregistrement de la publication');
        if(result&&result.error){
          var msg=errorDetails(result.error);
          if(msg.indexOf('LISTING_ALREADY_EXISTS')>=0){
            var existing=await findPublishedListing(c,listingId,user.id);
            if(existing)return {data:{ok:true,listing:existing,replayed:true},error:null};
          }
          throw result.error;
        }
        return result;
      }catch(error){
        lastError=error;
        var existingAfterError=await findPublishedListing(c,listingId,user.id);
        if(existingAfterError)return {data:{ok:true,listing:existingAfterError,replayed:true},error:null};
        if(!isNetworkError(error)||attempt===3)break;
        await sleep(attempt*1000);
      }
    }
    var wrapped=new Error('Enregistrement de la publication : '+(errorDetails(lastError)||'échec réseau'));
    wrapped.cause=lastError;
    wrapped.happyadNetwork=isNetworkError(lastError);
    throw wrapped;
  }
  async function publishListing(payload){
    var parsed=validate(payload);
    var c=client();
    if(!c)throw new Error('Le service Fyblic est momentanément indisponible.');
    progress(payload,'Vérification de la connexion…');
    var user=await currentUser(c);
    progress(payload,'Vérification du vendeur…');
    var verification=await approvedSeller();
    var listingId='market_'+Date.now().toString(36)+'_'+uuid().replace(/-/g,'').slice(0,12);
    var media=[],publicPaths=[],allPublicPaths=[],ownershipPaths=[],officialPaths=[];
    try{
      /* V1082 : tous les médias Boutique appartiennent à UNE seule publication logique.
         Le moteur principal conserve les File et envoie jusqu'à deux médias en parallèle.
         L'annonce n'est enregistrée qu'une seule fois après disponibilité de toutes les qualités principales. */
      var engine=window.FyblicPublicationEngineV1082;
      if(!engine||typeof engine.submitMany!=='function'||typeof engine.available!=='function')throw new Error('Système de publication V1082 indisponible.');
      if(!(await engine.available(true)))throw new Error(typeof engine.readinessMessage==='function'?engine.readinessMessage():'Mise à jour SQL V1082 requise.');
      progress(payload,'Envoi du média');
      var mediaBatch=await engine.submitMany(parsed.files,{
        publicationType:'boutique',groupId:listingId,postId:listingId,uploadConcurrency:2,
        postIdForAsset:function(index){return listingId+'_media_'+(index+1);},
        payloadForAsset:function(index){return {listingId:listingId,mediaIndex:index,source:'boutique-v1081'};},
        onProgress:function(detail){progress(payload,detail&&detail.primaryReady?'Publication en cours':(detail&&detail.stage||'Publication en cours'));}
      });
      if(!mediaBatch||!mediaBatch.used)throw new Error('Moteur Boutique V1082 indisponible');
      if(mediaBatch.completion&&typeof mediaBatch.completion.catch==='function'){
        mediaBatch.completion.catch(function(error){console.warn('Fyblic Boutique V1082 — optimisation secondaire:',error&&error.message||error);});
      }
      var readyJobs=await mediaBatch.visibleCompletion;
      readyJobs.forEach(function(job,index){
        var ready=job&&job.result||{},primary=ready.primary||{},poster=ready.poster||null,outputs=Array.isArray(ready.outputs)?ready.outputs:[];
        if(!primary.url||!primary.path)throw new Error('Qualité principale Boutique indisponible pour le média '+(index+1));
        var variants=outputs.filter(function(x){return x&&x.path&&x.path!==primary.path&&(!poster||x.path!==poster.path);});
        var cleanup=[primary.path].concat(variants.map(function(x){return x&&x.path;})).concat(poster&&poster.path?[poster.path]:[]).filter(Boolean);
        var mediaKind=String(primary.mime||'').indexOf('video/')===0?'video':'image';
        var item={path:primary.path,src:primary.url,type:mediaKind,mime:primary.mime||(mediaKind==='video'?'video/mp4':'image/webp'),name:parsed.files[index]&&parsed.files[index].name||'',size:Number(primary.bytes||0),poster:poster&&poster.url||'',variants:variants,cleanupPaths:Array.from(new Set(cleanup))};
        media.push(item);publicPaths.push(item.path);allPublicPaths=allPublicPaths.concat(item.cleanupPaths||[item.path]);
      });
      for(var j=0;j<parsed.ownership.length;j++)ownershipPaths.push(await uploadPrivate(c,user,listingId,parsed.ownership[j],'ownership',j,payload));
      for(var k=0;k<parsed.official.length;k++)officialPaths.push(await uploadPrivate(c,user,listingId,parsed.official[k],'official',k,payload));
      var offer=parsed.offer;
      var rpcArgs={
        p_listing_id:listingId,p_title:clean(offer.title),p_description:clean(offer.description),p_offer_type:clean(offer.type),p_category:parsed.category,
        p_country:clean(offer.country),p_city:clean(offer.city),p_price:num(offer.price),p_currency:clean(offer.currency),p_availability:clean(offer.availability),
        p_details:details(offer),p_media_paths:publicPaths,p_media_items:media,p_ownership_paths:ownershipPaths,p_official_paths:officialPaths,p_attested:true
      };
      var result=await callPublishRpc(c,rpcArgs,listingId,user,payload);
      if(result&&result.error)throw result.error;
      var data=result&&result.data||{};
      var listing=normalizedListing(data.listing||{},offer,parsed.category,media,user,verification);
      if(!clean(listing&&listing.id))throw new Error('PUBLICATION_RETURN_INVALID');
      progress(payload,'Annonce publiée.');
      patchCaches(listing);
      queueProfileNotice(listing);
      try{document.dispatchEvent(new CustomEvent('happyad:marketplace-listing-published',{detail:{listing:listing,source:VERSION}}));}catch(_e){}
      try{document.dispatchEvent(new CustomEvent('HAPPYAD_REAL_OFFERS_READY',{detail:{count:1,listing:listing,source:VERSION}}));}catch(_e){}
      try{if(window.HappyadChatIntegrationV795&&typeof window.HappyadChatIntegrationV795.reloadListings==='function')setTimeout(function(){window.HappyadChatIntegrationV795.reloadListings();},80);}catch(_e){}
      return {ok:true,listing:listing,source:'supabase-v820'};
    }catch(error){
      /* En cas d’échec réseau ambigu, ne pas supprimer automatiquement les fichiers :
         la requête serveur peut avoir abouti sans que le téléphone reçoive la réponse. */
      if(!isNetworkError(error)&&!error.happyadNetwork){
        await cleanup(c,PUBLIC_BUCKET,allPublicPaths);
        await cleanup(c,PRIVATE_BUCKET,ownershipPaths.concat(officialPaths));
      }
      throw new Error(errorText(error));
    }
  }

  window.HAPPYAD_PUBLICATION_BRIDGE={
    version:VERSION,
    categories:['Produit','Électronique','Véhicule','Terrain','Service','Emploi','Immobilier','Autre'],
    publishOffer:publishListing,
    publishListing:publishListing
  };

  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('listing-publication-supabase',{file:'core/listing-publication-supabase-master-v821.js',responsibility:'publication réelle Marketplace V821 avec couverture photo/vidéo reliée',active:true,version:VERSION});}catch(_e){}
})();
