/* Fyblic V807 — pont unique des notifications Système.
   Les événements importants émis par Fyblic sont enregistrés dans Notifications > Système.
   Le RPC limite chaque compte à ses propres notifications et déduplique chaque événement. */
(function(){
  'use strict';
  if(window.__HAPPYAD_SYSTEM_NOTIFICATION_MASTER_V807__)return;
  window.__HAPPYAD_SYSTEM_NOTIFICATION_MASTER_V807__=true;

  var VERSION='V855R56_SYSTEM_NOTIFICATION_PREFERENCES';
  var RPC='happyad_create_system_notification_v807';
  var inflight=Object.create(null);

  function clean(value){return String(value==null?'':value).replace(/\s+/g,' ').trim();}
  function client(){
    try{if(typeof window.happyadSb==='function'){var c=window.happyadSb();if(c&&c.rpc&&c.auth)return c;}}catch(_e){}
    try{if(window.happyadSupabase&&window.happyadSupabase.rpc)return window.happyadSupabase;}catch(_e){}
    try{if(window.supabaseClient&&window.supabaseClient.rpc)return window.supabaseClient;}catch(_e){}
    try{if(window.HAPPYAD_SUPABASE&&window.HAPPYAD_SUPABASE.rpc)return window.HAPPYAD_SUPABASE;}catch(_e){}
    return null;
  }
  function metadata(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
  function refreshNotifications(){
    try{if(window.HappyNotificationMaster&&typeof window.HappyNotificationMaster.refresh==='function')window.HappyNotificationMaster.refresh();}catch(_e){}
  }
  async function notify(payload){
    payload=payload&&typeof payload==='object'?payload:{};
    var eventKey=clean(payload.eventKey||payload.event_key).slice(0,180);
    var title=clean(payload.title).slice(0,180);
    var body=clean(payload.body).slice(0,1200);
    var meta=Object.assign({},metadata(payload.metadata),{client_source:VERSION});
    if(!eventKey||!title||!body)return {ok:false,ignored:true};
    try{
      var notificationMaster=window.HappyNotificationMaster;
      if(notificationMaster&&typeof notificationMaster.allows==='function'&&!notificationMaster.allows('system',meta,'category')){
        return {ok:true,ignored:true,reason:'NOTIFICATION_PREFERENCE_DISABLED'};
      }
    }catch(_preferenceError){}
    if(inflight[eventKey])return inflight[eventKey];
    inflight[eventKey]=(async function(){
      var c=client();
      if(!c)return {ok:false,offline:true};
      var result=await c.rpc(RPC,{
        p_event_key:eventKey,
        p_title:title,
        p_body:body,
        p_metadata:meta
      });
      if(result&&result.error)throw result.error;
      refreshNotifications();
      return result&&result.data||{ok:true};
    })().catch(function(error){
      try{console.warn('[Fyblic Système]',clean(error&&error.message||error));}catch(_e){}
      return {ok:false,error:clean(error&&error.message||error)};
    }).finally(function(){delete inflight[eventKey];});
    return inflight[eventKey];
  }
  function verificationMessage(state){
    state=state&&typeof state==='object'?state:{};
    var id=clean(state.id||state.requestId||state.request_id);
    var status=clean(state.status).toLowerCase();
    if(!id||!status)return null;
    if(status==='pending')return {
      eventKey:'seller-verification:'+id+':pending',
      title:'Demande de vérification envoyée',
      body:'Votre dossier a bien été transmis à l’équipe Fyblic. Vous recevrez une notification dès que son examen sera terminé.',
      metadata:{seller_verification_request_id:id,seller_verification_status:'pending',system_message:true,notification_preference_key:'verificationDecisions'}
    };
    if(status==='under_review')return {
      eventKey:'seller-verification:'+id+':under_review',
      title:'Vérification en cours',
      body:'L’équipe Fyblic examine actuellement votre demande de vérification vendeur.',
      metadata:{seller_verification_request_id:id,seller_verification_status:'under_review',system_message:true,notification_preference_key:'verificationDecisions'}
    };
    if(['approved','verified','validated','active'].indexOf(status)>=0)return {
      eventKey:'seller-verification:'+id+':approved',
      title:'Vérification vendeur approuvée',
      body:'Votre compte vendeur a été approuvé. Vous pouvez maintenant publier vos offres.',
      metadata:{seller_verification_request_id:id,seller_verification_status:'approved',system_message:true,notification_preference_key:'verificationDecisions'}
    };
    if(['rejected','refused'].indexOf(status)>=0){
      var reason=clean(state.adminNote||state.admin_note);
      return {
        eventKey:'seller-verification:'+id+':rejected',
        title:'Vérification vendeur refusée',
        body:'Votre demande de vérification vendeur a été refusée.'+(reason?' Motif : '+reason:''),
        metadata:{seller_verification_request_id:id,seller_verification_status:'rejected',admin_note:reason,system_message:true,notification_preference_key:'verificationDecisions'}
      };
    }
    return null;
  }
  function publishedMessage(detail){
    detail=detail&&typeof detail==='object'?detail:{};
    var listing=detail.listing&&typeof detail.listing==='object'?detail.listing:detail;
    var id=clean(listing.id||listing.listing_id||listing.post_id);
    if(!id)return null;
    var title=clean(listing.title)||'Votre annonce';
    var price=clean(listing.price_label||listing.priceLabel);
    if(!price&&listing.price!=null){
      var amount=Number(listing.price);
      if(Number.isFinite(amount)&&amount>0)price=amount.toLocaleString('fr-CD');
    }
    var currency=clean(listing.currency).toUpperCase();
    if(price&&currency&&price.toUpperCase().indexOf(currency)<0)price+=' '+currency;
    return {
      eventKey:'marketplace-product:'+id+':published',
      title:'Annonce publiée',
      body:'Votre annonce « '+title+' » est maintenant active dans Fyblic Annonces.'+(price?' Prix : '+price+'.':''),
      metadata:{listing_id:id,post_id:id,marketplace_status:'published',system_message:true,title:title,price_label:price,notification_preference_key:'listingStatus'}
    };
  }

  document.addEventListener('happyad:seller-verification-status',function(event){
    var payload=verificationMessage(event&&event.detail);
    if(payload)notify(payload);
  },true);
  document.addEventListener('happyad:marketplace-product-published',function(event){
    var payload=publishedMessage(event&&event.detail);
    if(payload)notify(payload);
  },true);
  document.addEventListener('happyad:system-notification-request',function(event){
    notify(event&&event.detail);
  },true);

  window.HAPPYAD_SYSTEM_NOTIFICATION_BRIDGE={version:VERSION,notify:notify};
  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('system-notification',{file:'core/system-notification-master-v807.js',responsibility:'notifications Système dédupliquées pour les validations et annonces Fyblic',active:true,version:VERSION});}catch(_e){}
})();
