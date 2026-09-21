/* Adaptateur V1070 : tous les anciens appels Boutique rejoignent le moteur unifié. */
(function(){
  'use strict';
  if(window.__HAPPYAD_LISTING_PUBLICATION_SUPABASE_V821__)return;
  window.__HAPPYAD_LISTING_PUBLICATION_SUPABASE_V821__=true;
  function engine(){try{return window.FyblicPublicationEngineV1070||(window.parent&&window.parent.FyblicPublicationEngineV1070);}catch(_e){return null;}}
  async function publish(payload){var e=engine();if(!e)throw new Error('Moteur de publication Fyblic indisponible');return e.publishLegacyListing(payload||{});}
  window.HAPPYAD_PUBLICATION_BRIDGE={version:'V1070_UNIFIED_ADAPTER',categories:['Produit','Électronique'],publishOffer:publish,publishListing:publish};
})();
