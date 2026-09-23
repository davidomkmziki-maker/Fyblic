/* Fyblic V1089 — Chat header SVG source. Aucun média image, aucune ligne Story. */
(function(){
  'use strict';
  if(window.__FYBLIC_HOME_CHAT_HEADER_V1089__)return;
  window.__FYBLIC_HOME_CHAT_HEADER_V1089__=true;
  document.addEventListener('click',function(event){
    var button=event.target&&event.target.closest&&event.target.closest('#homeChatBtnV1089');
    if(!button)return;
    event.preventDefault();
    event.stopPropagation();
    var detail={source:'home-header',version:'v1089',integrated:true,integrationVersion:'v795',icon:'source-svg-bag'};
    try{
      if(window.HappyadChatIntegrationV795&&typeof window.HappyadChatIntegrationV795.open==='function'){
        window.HappyadChatIntegrationV795.open({mode:'ask',context:{source:'home-header-v1089',detail:detail}});
        return;
      }
    }catch(_e){}
    try{document.dispatchEvent(new CustomEvent('happyad:chat-sticker-requested',{detail:detail}));}catch(_x){}
  },true);
})();
