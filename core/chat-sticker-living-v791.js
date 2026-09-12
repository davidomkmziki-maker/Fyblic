/* Fyblic V799 — intégration V795 conservée.
   Sticker transparent légèrement réduit et centré ; seule la bouche reste animée. */
(function(){
  'use strict';
  if(window.__HAPPYAD_CHAT_STICKER_LIVING_V791__)return;
  window.__HAPPYAD_CHAT_STICKER_LIVING_V791__=true;

  var UNIT_ID='happyadChatStickerUnitV791';
  var scheduled=false;

  function clean(value){return String(value==null?'':value).replace(/\s+/g,' ').trim();}

  function isOwnStoryUnit(node){
    if(!node||node.nodeType!==1)return false;
    if(node.classList.contains('haStoryAddOnlyV629'))return true;
    var name=node.querySelector('.radarName');
    return clean(name&&name.textContent).toLowerCase()==='ta story';
  }

  function makeSticker(){
    var unit=document.createElement('div');
    unit.id=UNIT_ID;
    unit.className='happyadChatStickerUnitV791';
    unit.setAttribute('data-happyad-chat-sticker','v791');
    unit.innerHTML=''
      +'<button type="button" class="radarItem happyadChatStickerButtonV791" aria-label="Chat annonce" data-happyad-chat-sticker-button="v791">'
      +  '<div class="radarAvatar happyadChatStickerAvatarV791">'
      +    '<span class="happyadChatStickerSceneV791" aria-hidden="true">'
      +      '<img class="happyadChatStickerImageV791" src="icons/happyad-chat-sticker-v797-transparent.png" alt="" draggable="false" loading="eager" fetchpriority="high" decoding="async">'
      +      '<span class="happyadChatEyeV791 happyadChatEyeLeftV791"><i class="happyadChatPupilV791"></i></span>'
      +      '<span class="happyadChatEyeV791 happyadChatEyeRightV791"><i class="happyadChatPupilV791"></i></span>'
      +      '<span class="happyadChatMouthV791"></span>'
      +    '</span>'
      +  '</div>'
      +  '<div class="radarName happyadChatStickerNameV791">Chat</div>'
      +  '<div class="radarMeta happyadChatStickerMetaV791">annonce</div>'
      +'</button>';
    return unit;
  }

  function neutralizeOldMapButton(block){
    var link=block&&block.querySelector&&block.querySelector('.mapLite');
    if(!link)return;
    link.removeAttribute('href');
    link.removeAttribute('target');
    link.removeAttribute('download');
    link.setAttribute('role','button');
    link.setAttribute('tabindex','0');
    link.setAttribute('aria-label','Annonces');
    link.removeAttribute('data-happyad-annonces-placeholder-v790');
    link.setAttribute('data-happyad-annonces-placeholder-v791','1');
    if(clean(link.textContent)!=='📍 Annonces')link.textContent='📍 Annonces';
  }

  function removeStaleStickers(){
    var staleSelectors=['#happyadChatStickerUnitV789','#happyadChatStickerUnitV790','.happyadChatStickerUnitV789','.happyadChatStickerUnitV790'];
    for(var s=0;s<staleSelectors.length;s++){
      var list=document.querySelectorAll(staleSelectors[s]);
      for(var i=0;i<list.length;i++)if(list[i]&&list[i].parentNode)list[i].parentNode.removeChild(list[i]);
    }
  }

  function patchBlock(block){
    if(!block||!block.isConnected)return;
    var row=block.querySelector('.radarRow');
    if(!row)return;

    removeStaleStickers();
    var sticker=row.querySelector('#'+UNIT_ID);
    if(!sticker){
      var duplicate=document.getElementById(UNIT_ID);
      if(duplicate&&duplicate.parentNode)duplicate.parentNode.removeChild(duplicate);
      sticker=makeSticker();
    }

    var children=Array.prototype.slice.call(row.children||[]);
    var own=children.find(isOwnStoryUnit)||null;
    if(own){
      if(own.nextElementSibling!==sticker)row.insertBefore(sticker,own.nextElementSibling);
    }else if(row.firstElementChild!==sticker){
      row.insertBefore(sticker,row.firstElementChild||null);
    }

    neutralizeOldMapButton(block);
  }

  function patchAll(){
    scheduled=false;
    var block=document.getElementById('homeRadarStoryMasterV629')||document.getElementById('homeRadarBlock');
    if(!block)return;
    var extras=document.querySelectorAll('.happyadChatStickerUnitV791');
    for(var i=0;i<extras.length;i++)if(!block.contains(extras[i]))extras[i].remove();
    patchBlock(block);
  }

  function schedulePatch(){
    if(scheduled)return;
    scheduled=true;
    if(window.requestAnimationFrame)requestAnimationFrame(patchAll);
    else setTimeout(patchAll,0);
  }

  document.addEventListener('click',function(event){
    var sticker=event.target&&event.target.closest&&event.target.closest('[data-happyad-chat-sticker-button="v791"]');
    if(sticker){
      event.preventDefault();
      event.stopPropagation();
      try{document.dispatchEvent(new CustomEvent('happyad:chat-sticker-requested',{detail:{source:'home-radar',version:'v791',integrated:true,integrationVersion:'v795',stickerPresentation:'v799-smaller-mouth-only'}}));}catch(_e){}
      return;
    }
    var annonces=event.target&&event.target.closest&&event.target.closest('[data-happyad-annonces-placeholder-v791="1"]');
    if(annonces){
      event.preventDefault();
      event.stopPropagation();
      try{document.dispatchEvent(new CustomEvent('happyad:annonces-requested',{detail:{source:'home-radar',version:'v791',integrated:true,integrationVersion:'v795',stickerPresentation:'v799-smaller-mouth-only'}}));}catch(_e){}
    }
  },true);

  document.addEventListener('keydown',function(event){
    var target=event.target;
    if(!target||!target.matches||!target.matches('[data-happyad-annonces-placeholder-v791="1"]'))return;
    if(event.key!=='Enter'&&event.key!==' ')return;
    event.preventDefault();
    try{target.click();}catch(_e){}
  },true);

  var observerInstalled=false;
  function installObserver(){
    if(observerInstalled)return;observerInstalled=true;
    try{new MutationObserver(schedulePatch).observe(document.documentElement,{childList:true,subtree:true});}catch(_e){}
  }

  /* R89 : le sticker existe au même premier rendu que RADAR. L'observateur global
     n'est installé qu'après le parsing pour ne pas alourdir l'ouverture. */
  try{patchAll();}catch(_e){}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){installObserver();schedulePatch();},{once:true});
  else{installObserver();schedulePatch();}
  window.addEventListener('pageshow',schedulePatch);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)schedulePatch();});
})();
