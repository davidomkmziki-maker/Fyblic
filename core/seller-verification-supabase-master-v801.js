/* Fyblic V801 — maître unique Supabase pour la vérification vendeur.
   - documents dans le bucket privé happyad-verification-private ;
   - demande enregistrée via RPC ;
   - décision réservée au système administrateur ;
   - statut synchronisé en Realtime dans le Chat.
*/
(function(){
  'use strict';
  if(window.__HAPPYAD_SELLER_VERIFICATION_SUPABASE_V801__)return;
  window.__HAPPYAD_SELLER_VERIFICATION_SUPABASE_V801__=true;

  var VERSION='V801_SELLER_VERIFICATION_ADMIN_SUPABASE';
  var BUCKET='happyad-verification-private';
  var TABLE='happyad_seller_verification_requests';
  var activeChannel=null;
  var listeners=[];
  var cachedState=null;

  function clean(value){return String(value==null?'':value).replace(/\s+/g,' ').trim();}
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
  function safeExt(file,fallback){
    var name=clean(file&&file.name).toLowerCase();
    var match=name.match(/\.([a-z0-9]{1,8})$/);
    if(match)return match[1].replace(/[^a-z0-9]/g,'')||fallback;
    var type=clean(file&&file.type).toLowerCase();
    if(type==='image/jpeg')return 'jpg';
    if(type==='image/png')return 'png';
    if(type==='image/webp')return 'webp';
    if(type==='application/pdf')return 'pdf';
    return fallback||'bin';
  }
  function normalizeState(row){
    if(!row||typeof row!=='object')return null;
    var status=clean(row.status).toLowerCase();
    if(!status)return null;
    return {
      id:clean(row.id||row.requestId||row.request_id),
      requestId:clean(row.requestId||row.request_id||row.id),
      status:status,
      fullName:clean(row.fullName||row.full_name),
      submittedAt:row.submittedAt||row.submitted_at||null,
      decidedAt:row.decidedAt||row.decided_at||null,
      adminNote:clean(row.adminNote||row.admin_note),
      adminValidation:true,
      source:'supabase-v801'
    };
  }
  function notify(state){
    cachedState=normalizeState(state);
    listeners.slice().forEach(function(fn){try{fn(cachedState);}catch(_e){}});
    try{document.dispatchEvent(new CustomEvent('happyad:seller-verification-status',{detail:cachedState}));}catch(_e){}
    return cachedState;
  }
  async function authUser(c){
    var res=await c.auth.getUser();
    if(res&&res.error)throw res.error;
    var user=res&&res.data&&res.data.user;
    if(!user||!user.id)throw new Error('Connecte-toi à ton compte Fyblic avant la vérification.');
    return user;
  }
  function errorMessage(error){
    var message=clean(error&&error.message||error);
    if(message.indexOf('ACTIVE_REQUEST_ALREADY_EXISTS')>-1)return 'Une demande est déjà en attente d’examen par l’équipe Fyblic.';
    if(message.indexOf('AUTH_REQUIRED')>-1)return 'Connecte-toi à ton compte Fyblic.';
    if(message.indexOf('DOCUMENT_UPLOAD_MISSING')>-1||message.indexOf('SELFIE_UPLOAD_MISSING')>-1)return 'Un document n’a pas été chargé correctement. Réessaie.';
    if(message.indexOf('row-level security')>-1||message.indexOf('policy')>-1)return 'Le service de vérification est temporairement indisponible.';
    if(message.indexOf('Could not find the function')>-1||message.indexOf('happyad_submit_seller_verification_v1')>-1)return 'Le service de vérification doit être mis à jour.';
    return message||'Envoi de la demande impossible.';
  }
  async function uploadFile(c,path,file){
    var result=await c.storage.from(BUCKET).upload(path,file,{
      upsert:false,
      cacheControl:'0',
      contentType:file.type||'application/octet-stream'
    });
    if(result&&result.error)throw result.error;
    return path;
  }
  async function cleanup(c,paths){
    if(!paths||!paths.length)return;
    try{await c.storage.from(BUCKET).remove(paths);}catch(_e){}
  }
  async function getStatus(){
    var c=client();
    if(!c)return null;
    try{
      await authUser(c);
      var result=await c.rpc('happyad_get_my_seller_verification_v1');
      if(result&&result.error)throw result.error;
      return notify(result&&result.data||null);
    }catch(error){
      var message=clean(error&&error.message||error);
      if(message.indexOf('Auth session missing')>-1||message.indexOf('Connecte-toi')>-1)return null;
      console.warn('Fyblic verification status V801',error);
      return cachedState;
    }
  }
  async function submitSellerVerification(payload){
    payload=payload&&typeof payload==='object'?payload:{};
    var c=client();
    if(!c)throw new Error('Le service Fyblic est momentanément indisponible.');
    var user=await authUser(c);
    var documents=Array.isArray(payload.documents)?payload.documents.filter(Boolean):[];
    var selfie=payload.selfie||null;
    if(documents.length<1||documents.length>2)throw new Error('Ajoute 1 ou 2 fichiers du document d’identité.');
    if(!selfie)throw new Error('Ajoute la photo récente de vérification.');

    var requestId=uuid();
    var prefix=user.id+'/'+requestId+'/';
    var uploaded=[];
    try{
      var documentPaths=[];
      for(var i=0;i<documents.length;i++){
        var documentPath=prefix+'identity-'+(i+1)+'.'+safeExt(documents[i],'bin');
        await uploadFile(c,documentPath,documents[i]);
        uploaded.push(documentPath);
        documentPaths.push(documentPath);
      }
      var selfiePath=prefix+'selfie.'+safeExt(selfie,'jpg');
      await uploadFile(c,selfiePath,selfie);
      uploaded.push(selfiePath);

      var rpc=await c.rpc('happyad_submit_seller_verification_v1',{
        p_request_id:requestId,
        p_account_type:clean(payload.accountType||'user'),
        p_full_name:clean(payload.fullName),
        p_country:clean(payload.country),
        p_city:clean(payload.city),
        p_identity_type:clean(payload.identityType),
        p_identity_number:clean(payload.identityNumber),
        p_document_paths:documentPaths,
        p_selfie_path:selfiePath,
        p_consent:payload.consent===true
      });
      if(rpc&&rpc.error)throw rpc.error;
      var state=normalizeState(rpc&&rpc.data||{
        id:requestId,status:'pending',fullName:payload.fullName,submittedAt:new Date().toISOString()
      });
      notify(state);
      subscribe();
      return state;
    }catch(error){
      await cleanup(c,uploaded);
      throw new Error(errorMessage(error));
    }
  }
  async function subscribe(callback){
    if(typeof callback==='function'&&listeners.indexOf(callback)<0)listeners.push(callback);
    var c=client();
    if(!c||activeChannel)return function(){
      var i=listeners.indexOf(callback);if(i>=0)listeners.splice(i,1);
    };
    try{
      var user=await authUser(c);
      activeChannel=c.channel('happyad-seller-verification-'+user.id)
        .on('postgres_changes',{
          event:'*',schema:'public',table:TABLE,filter:'user_id=eq.'+user.id
        },function(change){
          var row=change&&change.new;
          if(row&&row.id)notify(row);
          else getStatus();
        })
        .subscribe();
    }catch(error){console.warn('Fyblic verification realtime V801',error);}
    return function(){
      var i=listeners.indexOf(callback);if(i>=0)listeners.splice(i,1);
    };
  }
  function resetChannel(){
    var c=client();
    if(c&&activeChannel){try{c.removeChannel(activeChannel);}catch(_e){}}
    activeChannel=null;
  }
  function destroy(){
    resetChannel();
    listeners=[];
  }

  var prior=window.HAPPYAD_VERIFICATION_BRIDGE;
  window.HAPPYAD_VERIFICATION_BRIDGE={
    version:VERSION,
    submitSellerVerification:submitSellerVerification,
    getStatus:getStatus,
    subscribe:subscribe,
    destroy:destroy,
    getCachedStatus:function(){return cachedState;},
    previous:prior||null
  };

  document.addEventListener('visibilitychange',function(){if(!document.hidden)getStatus();},{passive:true});
  window.addEventListener('pageshow',function(){getStatus();},{passive:true});
  try{
    var authClient=client();
    if(authClient&&authClient.auth&&typeof authClient.auth.onAuthStateChange==='function'){
      authClient.auth.onAuthStateChange(function(_event,session){
        resetChannel();
        if(session&&session.user){getStatus();subscribe();}
        else notify(null);
      });
    }
  }catch(_authWatchError){}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){getStatus();subscribe();},{once:true});
  else{getStatus();subscribe();}

  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('seller-verification-supabase',{file:'core/seller-verification-supabase-master-v801.js',responsibility:'demande vendeur privée, statut Realtime et validation admin',active:true,version:VERSION});}catch(_e){}
})();
