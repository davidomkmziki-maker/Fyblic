(function(){
  'use strict';
  if(window.__HAPPYAD_CORE_BOOTSTRAPPED__)return;
  window.__HAPPYAD_CORE_BOOTSTRAPPED__=true;
  try{if(window.HappyHistory)HappyHistory.reset({name:'home',params:{}});}catch(_e){}
  try{if(window.HappyState)HappyState.merge({coreReady:true,pwaDisabled:!!window.__HAPPYAD_PWA_DISABLED__});}catch(_e){}
  try{if(window.__HAPPYAD_PWA_DISABLED__&&window.HappyCache)HappyCache.clearPwaCaches();}catch(_e){}
})();
