(function(){
  'use strict';
  if(window.HappyApi)return;
  function client(){return window.supabaseClient||window.supabase||window.HAPPYAD_SUPABASE||null;}
  window.HappyApi={client:client,ready:function(){return !!client();},from:function(table){var c=client();return c&&c.from?c.from(table):null;},auth:function(){var c=client();return c&&c.auth?c.auth:null;}};
})();
