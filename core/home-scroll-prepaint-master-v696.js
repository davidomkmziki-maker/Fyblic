(function(){
  'use strict';
  if(window.__HAPPYAD_HOME_SCROLL_PREPAINT_V696__)return;
  window.__HAPPYAD_HOME_SCROLL_PREPAINT_V696__=true;

  var VERSION='V855R100_HOME_SCROLL_PHYSICAL_STABLE';
  function installCss(){
    if(document.getElementById('happyad-home-scroll-prepaint-v696-css'))return;
    var st=document.createElement('style');
    st.id='happyad-home-scroll-prepaint-v696-css';
    st.textContent=`
/* V855R100 : aucun observer média concurrent. La timeline garde une géométrie
   continue ; aucune carte n'est désactivée/réactivée lors d'un retour rapide. */
#list.homeTimeline .miniCard{
  content-visibility:visible!important;
  contain-intrinsic-size:none!important;
  will-change:auto!important;
  transform:none!important;
  backface-visibility:visible!important;
}
#list.homeTimeline .miniCardFrame{
  will-change:auto!important;
  transform:none!important;
  backface-visibility:visible!important;
  background:#0a0d13!important;
}
#list.homeTimeline .miniMedia,
#list.homeTimeline .haAlbumSingleMedia{
  background-color:#111722!important;
  background-image:linear-gradient(145deg,#171d28,#0a0e15)!important;
  background-size:cover!important;
  background-position:center!important;
}
#list.homeTimeline .miniMedia>img,
#list.homeTimeline .haAlbumSingleMedia>img{
  visibility:visible!important;
  opacity:1!important;
  backface-visibility:visible!important;
}
`;
    document.head.appendChild(st);
  }
  installCss();
  try{if(window.HappyMasterRegistry)HappyMasterRegistry.register('home-scroll-prepaint',{file:'core/home-scroll-prepaint-master-v696.js',responsibility:'stabilité physique Accueil; géométrie continue sans content-visibility auto; aucun observer média concurrent',active:true,version:VERSION})}catch(_e){}
})();
