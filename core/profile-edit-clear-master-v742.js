(function(){
  'use strict';
  if(window.__HAPPYAD_PROFILE_EDIT_CLEAR_MASTER_V742__)return;
  window.__HAPPYAD_PROFILE_EDIT_CLEAR_MASTER_V742__=true;
  function qsa(s,r){try{return Array.prototype.slice.call((r||document).querySelectorAll(s));}catch(_e){return [];}}
  function visible(el){
    if(!el)return false;
    try{var s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.05&&r.width>20&&r.height>20;}catch(_e){return false;}
  }
  function isRealAdjust(el){
    if(!el||el.id==='editPanel'||el.id==='profileEditBackdrop')return false;
    var id=String(el.id||'').toLowerCase(),cl=String(el.className||'').toLowerCase(),txt=String(el.textContent||'').toLowerCase();
    return visible(el)&&(
      id.indexOf('photoadjust')>=0||id.indexOf('adjustphoto')>=0||id.indexOf('avataradjust')>=0||id.indexOf('profilephotoadjust')>=0||
      cl.indexOf('photoadjust')>=0||cl.indexOf('adjustphoto')>=0||cl.indexOf('avataradjust')>=0||
      ((txt.indexOf('ajuster photo')>=0||txt.indexOf('zone visible du profil')>=0)&&txt.indexOf('zoom')>=0)
    );
  }
  function realAdjust(){return qsa('#photoAdjustModal,.photoAdjustModal,#avatarAdjustModal,.avatarAdjustModal,#profilePhotoAdjustModal,.profilePhotoAdjustModal,[id*="PhotoAdjust"],[id*="AdjustPhoto"],[class*="photoAdjust"],[class*="adjustPhoto"]').find(isRealAdjust)||null;}
  function restoreOldInline(){
    qsa('[data-ha-v439-old-opacity],[data-ha-v439-old-pointer]').forEach(function(el){
      try{
        el.style.opacity=el.dataset.haV439OldOpacity||'';
        el.style.pointerEvents=el.dataset.haV439OldPointer||'';
        delete el.dataset.haV439OldOpacity;delete el.dataset.haV439OldPointer;
      }catch(_e){}
    });
  }
  function resetStalePhotoState(){
    var adjust=realAdjust();
    document.body.classList.toggle('haPhotoAdjustReallyOpenV742',!!adjust);
    if(adjust)return;
    try{document.body.classList.remove('haPhotoEditorFrontV439','haPhotoCropV438','haPhotoCropActiveV438','haPhotoSavedClosingV440','haPhotoReturnProfileV441','haPhotoIsLoading');}catch(_e){}
    restoreOldInline();
    ['happyadPhotoLoadingV438','happyadPhotoSavingV440'].forEach(function(id){var el=document.getElementById(id);if(el){try{el.classList.remove('on','show','active','open');el.style.display='none';el.style.visibility='hidden';el.style.opacity='0';el.style.pointerEvents='none';}catch(_e){}}});
  }
  function forcePanel(){
    resetStalePhotoState();
    if(realAdjust())return;
    var panel=document.getElementById('editPanel'),back=document.getElementById('profileEditBackdrop');
    if(!panel||!panel.classList.contains('show'))return;
    try{
      panel.style.setProperty('display','block','important');
      panel.style.setProperty('opacity','1','important');
      panel.style.setProperty('visibility','visible','important');
      panel.style.setProperty('pointer-events','auto','important');
      panel.style.setProperty('filter','none','important');
      panel.style.setProperty('-webkit-filter','none','important');
      panel.style.setProperty('z-index','2147483001','important');
    }catch(_e){}
    if(back){try{back.style.setProperty('backdrop-filter','none','important');back.style.setProperty('-webkit-backdrop-filter','none','important');back.style.setProperty('filter','none','important');back.style.setProperty('z-index','2147483000','important');}catch(_e){}}
  }
  document.addEventListener('pointerdown',function(e){
    var b=e.target&&e.target.closest&&e.target.closest('#openEdit,#openEditMasterV572,[data-open-edit]');
    if(!b)return;resetStalePhotoState();setTimeout(forcePanel,0);setTimeout(forcePanel,80);setTimeout(forcePanel,280);
  },true);
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest&&e.target.closest('#openEdit,#openEditMasterV572,[data-open-edit]');
    if(b){resetStalePhotoState();setTimeout(forcePanel,0);setTimeout(forcePanel,100);setTimeout(forcePanel,400);}
  },true);
  document.addEventListener('change',function(e){if(e.target&&e.target.matches&&e.target.matches('input[type="file"]'))setTimeout(function(){document.body.classList.toggle('haPhotoAdjustReallyOpenV742',!!realAdjust());},120);},true);
  var mo=new MutationObserver(function(records){
    /* R93 : aucun élément du fil Accueil n'appartient à l'éditeur de profil.
       Ignorer ces mutations évite querySelectorAll/getBoundingClientRect pendant le scroll. */
    var relevant=(records||[]).some(function(rec){
      var t=rec&&rec.target;
      try{if(t&&t.nodeType===1&&t.closest&&t.closest('#list'))return false;}catch(_home){}
      return true;
    });
    if(relevant)setTimeout(forcePanel,0);
  });
  try{mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','aria-hidden']});}catch(_e){}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){resetStalePhotoState();setTimeout(forcePanel,100);},{once:true});else{resetStalePhotoState();setTimeout(forcePanel,100);}
  window.addEventListener('pageshow',function(){resetStalePhotoState();setTimeout(forcePanel,60);});
})();
