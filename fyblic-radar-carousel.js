/* FYBLIC carousel: add before </body> after the site's existing scripts. */
(()=>{'use strict';
if(window.__fyblicRadarCarouselV1)return;window.__fyblicRadarCarouselV1=true;
const base='https://txjjyhupbejgjcianrmr.supabase.co',key='sb_publishable_35EsjCOhZtaPtoZwdyAYOw_KaqlSKHD';
let cfg=null,version=null,timer=null,reset=null,busy=false;
const stop=()=>{clearInterval(timer);clearTimeout(reset);timer=null;reset=null};
function mount(){
 const host=document.getElementById('sponsorTrack');if(!host)return;
 if(!cfg||!cfg.active){stop();host.querySelectorAll('.fyblic-carousel-v1').forEach(x=>x.remove());return;}
 if(host.querySelector('.fyblic-carousel-v1'))return;
 const urls=(Array.isArray(cfg.slides)&&cfg.slides.length?cfg.slides.map(x=>x.imageUrl):[cfg.image_url]).filter(Boolean).slice(0,3);if(!urls.length)return;
 stop();const shell=document.createElement('div');shell.className='sponsorAd happyadFixedRadarAd fyblic-carousel-v1';
 shell.style.cssText='position:relative;overflow:hidden;flex:0 0 100%;width:100%;height:100%;display:block';
 const rail=document.createElement('div');rail.style.cssText='display:flex;width:100%;height:100%;transform:translateX(0);will-change:transform';
 const images=urls.length>1?[...urls,urls[0]]:urls;
 images.forEach((url,i)=>{const img=new Image();img.src=url;img.alt='Publicité Fyblic '+(i%urls.length+1);img.decoding='async';img.style.cssText='display:block;flex:0 0 100%;width:100%;height:100%;object-fit:cover';rail.appendChild(img)});
 shell.appendChild(rail);host.replaceChildren(shell);let index=0;
 if(urls.length>1&&!document.hidden)timer=setInterval(()=>{
  index++;rail.style.transition='transform .6s ease';rail.style.transform='translateX(-'+index*100+'%)';
  if(index===urls.length)reset=setTimeout(()=>{index=0;rail.style.transition='none';rail.style.transform='translateX(0)'},620);
 },4000);
}
async function poll(){
 if(busy||document.hidden)return;busy=true;
 try{
  const endpoint=base+'/rest/v1/happyad_admin_radar_fixed?id=eq.main&select=';
  const headers={apikey:key};const meta=await fetch(endpoint+'active,version',{headers,cache:'no-store'});if(!meta.ok)throw Error('read');
  const rows=await meta.json(),m=rows[0];if(!m)return;
  if(m.version!==version||!cfg){const res=await fetch(endpoint+'active,image_url,slides,version',{headers,cache:'no-store'});if(!res.ok)throw Error('read');const full=(await res.json())[0];if(full){stop();cfg=full;version=full.version;document.querySelectorAll('.fyblic-carousel-v1').forEach(x=>x.remove())}}
  mount();
 }catch(e){console.warn('Fyblic carousel: synchronisation différée');}finally{busy=false}
}
new MutationObserver(()=>mount()).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('visibilitychange',()=>{stop();document.querySelectorAll('.fyblic-carousel-v1').forEach(x=>x.remove());if(!document.hidden)poll()});
setInterval(poll,30000);poll();
})();
