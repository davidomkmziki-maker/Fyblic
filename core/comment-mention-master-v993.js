/* Fyblic V993 — mentions @ dans les commentaires.
   - @ ouvre immédiatement des suggestions de vrais profils
   - la saisie après @ filtre par nom ou @username
   - fonctionne dans Accueil, Photo et Vidéo, y compris en mode réponse
   - n'intercepte Entrée que lorsqu'une suggestion a été sélectionnée au clavier
   - l'insertion utilise toujours le username Supabase réel afin que le clic du commentaire ouvre le bon profil via ProfileLink V992
*/
(function(){
  'use strict';
  if(window.HappyCommentMentionMasterV993)return;

  var POPUP_ID='happyadCommentMentionPopupV993';
  var STYLE_ID='happyadCommentMentionStyleV993';
  var input=null,popup=null,items=[],activeToken=null,activeIndex=-1,searchTimer=0,searchSeq=0,uidCache='',uidAt=0;
  var resultCache=new Map();

  function clean(v){return String(v==null?'':v).trim();}
  function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c;});}
  function low(v){return clean(v).toLowerCase();}
  function uniq(arr){var seen=new Set(),out=[];(arr||[]).forEach(function(v){v=clean(v);if(v&&!seen.has(v)){seen.add(v);out.push(v);}});return out;}

  function client(){
    try{if(window.HappySupabaseClientMasterV972&&typeof window.HappySupabaseClientMasterV972.get==='function'){var c=window.HappySupabaseClientMasterV972.get();if(c&&c.from)return c;}}catch(_e){}
    try{if(typeof window.happyadSb==='function'){var c2=window.happyadSb();if(c2&&c2.from)return c2;}}catch(_e2){}
    try{if(window.happyadSupabase&&window.happyadSupabase.from)return window.happyadSupabase;}catch(_e3){}
    try{if(window.parent&&window.parent!==window){if(window.parent.HappySupabaseClientMasterV972&&typeof window.parent.HappySupabaseClientMasterV972.get==='function'){var pc=window.parent.HappySupabaseClientMasterV972.get();if(pc&&pc.from)return pc;}if(typeof window.parent.happyadSb==='function'){var pc2=window.parent.happyadSb();if(pc2&&pc2.from)return pc2;}if(window.parent.happyadSupabase&&window.parent.happyadSupabase.from)return window.parent.happyadSupabase;}}catch(_e4){}
    return null;
  }
  async function ensureClient(){
    var c=client();if(c)return c;
    try{if(window.HappySupabaseClientMasterV972&&typeof window.HappySupabaseClientMasterV972.ensure==='function'){c=await window.HappySupabaseClientMasterV972.ensure();if(c&&c.from)return c;}}catch(_e){}
    try{if(typeof window.happyadEnsureSupabaseV936==='function'){c=await window.happyadEnsureSupabaseV936(9000);if(c&&c.from)return c;}}catch(_e2){}
    try{if(window.parent&&window.parent!==window&&window.parent.HappySupabaseClientMasterV972&&typeof window.parent.HappySupabaseClientMasterV972.ensure==='function'){c=await window.parent.HappySupabaseClientMasterV972.ensure();if(c&&c.from)return c;}}catch(_e3){}
    return client();
  }
  async function currentUid(c){
    if(uidCache&&Date.now()-uidAt<120000)return uidCache;
    try{var local=clean(localStorage.getItem('HAPPYAD_AUTH_UID'));if(local){uidCache=local;uidAt=Date.now();return local;}}catch(_e){}
    try{if(c&&c.auth&&typeof c.auth.getUser==='function'){var r=await c.auth.getUser(),u=r&&r.data&&r.data.user;if(u&&u.id){uidCache=clean(u.id);uidAt=Date.now();return uidCache;}}}catch(_e2){}
    return '';
  }
  function normalize(row){
    row=row||{};var id=clean(row.id||row.user_id||row.uid),username=clean(row.username||row.handle).replace(/^@+/,''),name=clean(row.full_name||row.display_name||row.name)||username||'Utilisateur Fyblic';
    if(!id||!username)return null;
    return {id:id,username:username,name:name,avatar:clean(row.avatar_url||row.avatar||row.photo_url),badge:clean(row.badge||row.user_badge)};
  }
  function avatarHtml(p){
    if(p&&p.avatar)return '<img src="'+esc(p.avatar)+'" alt="">';
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="22" r="13"></circle><path d="M10 58c2.8-15 11.8-22 22-22s19.2 7 22 22"></path></svg>';
  }
  function badgeHtml(p){
    var b=low(p&&p.badge);if(!b)return '';
    var cls=/violet|purple/.test(b)?' violet':(/rose|pink/.test(b)?' rose':'');
    return '<span class="haCommentMentionBadgeV993'+cls+'" aria-label="Compte vérifié">✓</span>';
  }
  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');s.id=STYLE_ID;s.textContent='\
#'+POPUP_ID+'{position:fixed;z-index:2147483643;display:none;box-sizing:border-box;max-height:min(292px,40dvh);overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:6px;background:rgba(15,19,27,.985);border:1px solid rgba(255,255,255,.13);border-radius:18px;box-shadow:0 16px 46px rgba(0,0,0,.55);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#fff;scrollbar-width:none}\
#'+POPUP_ID+'::-webkit-scrollbar{display:none}\
#'+POPUP_ID+'.show{display:block}\
#'+POPUP_ID+' .haCommentMentionHeadV993{padding:6px 9px 7px;color:#aab3c1;font-size:11px;font-weight:850;letter-spacing:.02em}\
#'+POPUP_ID+' .haCommentMentionStatusV993{padding:18px 12px;text-align:center;color:#aeb7c5;font-size:13px;font-weight:750}\
#'+POPUP_ID+' .haCommentMentionPersonV993{appearance:none;-webkit-appearance:none;width:100%;min-height:58px;border:0;border-radius:13px;background:transparent;color:#fff;padding:6px 8px;display:grid;grid-template-columns:43px minmax(0,1fr);align-items:center;gap:10px;text-align:left;touch-action:manipulation;-webkit-tap-highlight-color:transparent}\
#'+POPUP_ID+' .haCommentMentionPersonV993:active,#'+POPUP_ID+' .haCommentMentionPersonV993.active{background:rgba(255,255,255,.09)}\
#'+POPUP_ID+' .haCommentMentionAvatarV993{width:42px;height:42px;border-radius:50%;overflow:hidden;background:#eef1f5;display:grid;place-items:center;border:1px solid rgba(255,255,255,.18)}\
#'+POPUP_ID+' .haCommentMentionAvatarV993 img{width:100%;height:100%;object-fit:cover;display:block}\
#'+POPUP_ID+' .haCommentMentionAvatarV993 svg{width:100%;height:100%;fill:#9aa3b2}\
#'+POPUP_ID+' .haCommentMentionCopyV993{min-width:0}\
#'+POPUP_ID+' .haCommentMentionNameV993{display:flex;align-items:center;gap:5px;min-width:0;color:#fff;font-size:14px;font-weight:900;line-height:1.18}\
#'+POPUP_ID+' .haCommentMentionNameV993>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\
#'+POPUP_ID+' .haCommentMentionHandleV993{display:block;margin-top:3px;color:#63aef9;font-size:12px;font-weight:760;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\
#'+POPUP_ID+' .haCommentMentionBadgeV993{position:relative;display:inline-grid;place-items:center;flex:0 0 15px;width:15px;height:15px;border-radius:50%;background:#1597ff;color:#fff;font-size:9px;font-weight:1000;line-height:1}.haCommentMentionBadgeV993.violet{background:#9b55e8}.haCommentMentionBadgeV993.rose{background:#f04f93}\
';document.head.appendChild(s);
  }
  function ensurePopup(){
    ensureStyle();if(popup&&popup.isConnected)return popup;
    popup=document.getElementById(POPUP_ID);if(!popup){popup=document.createElement('div');popup.id=POPUP_ID;popup.setAttribute('role','listbox');popup.setAttribute('aria-label','Suggestions de personnes à mentionner');document.body.appendChild(popup);}
    if(!popup.__haMentionBoundV993){popup.__haMentionBoundV993=true;popup.addEventListener('pointerdown',function(e){var b=e.target&&e.target.closest?e.target.closest('[data-ha-comment-mention-index]'):null;if(!b)return;e.preventDefault();e.stopPropagation();choose(Number(b.getAttribute('data-ha-comment-mention-index')));},true);popup.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('[data-ha-comment-mention-index]'):null;if(!b)return;e.preventDefault();e.stopPropagation();},true);}
    return popup;
  }
  function visible(){return !!(popup&&popup.classList.contains('show'));}
  function hide(){clearTimeout(searchTimer);activeToken=null;activeIndex=-1;items=[];if(popup){popup.classList.remove('show');popup.innerHTML='';}if(input)try{input.removeAttribute('aria-controls');input.removeAttribute('aria-expanded');}catch(_e){} }
  function tokenFor(el){
    if(!el)return null;var value=String(el.value||''),caret=typeof el.selectionStart==='number'?el.selectionStart:value.length,before=value.slice(0,caret);
    var m=before.match(/(^|[\s\(\[\{\"'.,!?;:])@([A-Za-z0-9._-]{0,40})$/);if(!m)return null;
    var q=String(m[2]||''),start=caret-q.length-1;return {start:start,end:caret,query:q,caret:caret,value:value};
  }
  function position(){
    if(!visible()||!input)return;try{
      var r=input.getBoundingClientRect(),host=input.closest&&input.closest('.haCommentComposer,.commentComposer,.commentInputBar'),hr=host?host.getBoundingClientRect():r;
      var vw=Math.max(280,window.innerWidth||document.documentElement.clientWidth||360),vh=Math.max(300,window.innerHeight||document.documentElement.clientHeight||640);
      var wanted=Math.min(430,Math.max(270,Number(hr.width||r.width||300))),w=Math.min(vw-16,wanted);popup.style.width=Math.round(w)+'px';popup.style.left=Math.round(Math.max(8,Math.min(Number(hr.left||r.left||8),vw-w-8)))+'px';
      var h=Math.min(Number(popup.scrollHeight||180),Math.round(vh*.40),292),top=Number(r.top||0)-h-8;if(top<8)top=Math.min(vh-h-8,Number(r.bottom||0)+8);popup.style.top=Math.round(Math.max(8,top))+'px';
    }catch(_e){}
  }
  function showStatus(text){var p=ensurePopup();p.innerHTML='<div class="haCommentMentionHeadV993">Mentionner une personne</div><div class="haCommentMentionStatusV993">'+esc(text)+'</div>';p.classList.add('show');if(input){input.setAttribute('aria-controls',POPUP_ID);input.setAttribute('aria-expanded','true');}requestAnimationFrame(position);}
  function render(list){
    if(!activeToken||!input)return;items=(list||[]).slice(0,12);activeIndex=-1;var p=ensurePopup();
    if(!items.length){showStatus('Aucune personne trouvée');return;}
    p.innerHTML='<div class="haCommentMentionHeadV993">Mentionner une personne</div>'+items.map(function(x,i){return '<button type="button" class="haCommentMentionPersonV993" role="option" aria-selected="false" data-ha-comment-mention-index="'+i+'"><span class="haCommentMentionAvatarV993">'+avatarHtml(x)+'</span><span class="haCommentMentionCopyV993"><span class="haCommentMentionNameV993"><span>'+esc(x.name)+'</span>'+badgeHtml(x)+'</span><span class="haCommentMentionHandleV993">@'+esc(x.username)+'</span></span></button>';}).join('');
    p.classList.add('show');input.setAttribute('aria-controls',POPUP_ID);input.setAttribute('aria-expanded','true');requestAnimationFrame(position);
  }
  function setActiveIndex(next){
    if(!visible()||!items.length)return false;next=(next+items.length)%items.length;activeIndex=next;var rows=popup.querySelectorAll('[data-ha-comment-mention-index]');for(var i=0;i<rows.length;i++){var on=i===next;rows[i].classList.toggle('active',on);rows[i].setAttribute('aria-selected',on?'true':'false');if(on)try{rows[i].scrollIntoView({block:'nearest'});}catch(_e){}}return true;
  }
  function choose(index){
    var p=items[index],el=input,tok=el&&tokenFor(el);if(!p||!el||!tok)return hide();
    var before=String(el.value||'').slice(0,tok.start),after=String(el.value||'').slice(tok.end),insert='@'+p.username+' ';
    el.value=before+insert+after;var caret=before.length+insert.length;try{el.focus({preventScroll:true});el.setSelectionRange(caret,caret);}catch(_e){try{el.focus();}catch(_e2){}}
    hide();try{el.dispatchEvent(new Event('input',{bubbles:true}));}catch(_e3){}
  }
  function cacheKey(q){return low(q)||'@';}
  async function genericProfiles(c){
    try{var g=await c.from('profiles').select('id,full_name,username,avatar_url,badge').not('username','is',null).limit(18);if(g&&!g.error&&Array.isArray(g.data))return g.data;}catch(_e){}return [];
  }
  async function suggestionsForEmpty(c,me){
    var ids=[];
    if(me){
      try{var rel=await Promise.all([c.from('happyad_follows').select('creator_id,created_at').eq('follower_id',me).order('created_at',{ascending:false}).limit(50),c.from('happyad_follows').select('follower_id').eq('creator_id',me).limit(80)]),following=(rel[0]&&rel[0].data||[]).map(function(r){return clean(r&&r.creator_id);}).filter(Boolean),followers=new Set((rel[1]&&rel[1].data||[]).map(function(r){return clean(r&&r.follower_id);}).filter(Boolean)),friends=following.filter(function(id){return followers.has(id);}),friendSet=new Set(friends);ids=uniq(friends.concat(following.filter(function(id){return !friendSet.has(id);}))).slice(0,35);}catch(_e){}
    }
    if(ids.length){try{var r=await c.from('profiles').select('id,full_name,username,avatar_url,badge').in('id',ids),rows=r&&!r.error&&Array.isArray(r.data)?r.data:[],rank=new Map(ids.map(function(id,i){return [id,i];}));rows.sort(function(a,b){return (rank.has(clean(a&&a.id))?rank.get(clean(a&&a.id)):9999)-(rank.has(clean(b&&b.id))?rank.get(clean(b&&b.id)):9999);});if(rows.length)return rows;}catch(_e2){}}
    return genericProfiles(c);
  }
  async function searchProfiles(q,seq){
    var key=cacheKey(q),cached=resultCache.get(key);if(cached&&Date.now()-cached.at<45000){if(seq===searchSeq&&activeToken)render(cached.rows);return;}
    var c=await ensureClient();if(seq!==searchSeq||!activeToken)return;if(!c){render([]);return;}
    var me=await currentUid(c),needle=clean(q).replace(/^@+/,'').replace(/[%_]/g,'');if(seq!==searchSeq||!activeToken)return;
    var raw=[];
    try{
      if(needle){var pattern='%'+needle+'%',res=await Promise.all([c.from('profiles').select('id,full_name,username,avatar_url,badge').ilike('username',pattern).limit(24),c.from('profiles').select('id,full_name,username,avatar_url,badge').ilike('full_name',pattern).limit(24)]);raw=(res[0]&&!res[0].error&&res[0].data||[]).concat(res[1]&&!res[1].error&&res[1].data||[]);}else raw=await suggestionsForEmpty(c,me);
    }catch(_e){raw=[];}
    if(seq!==searchSeq||!activeToken)return;
    var map=new Map();raw.forEach(function(r){var p=normalize(r);if(p&&p.id!==me&&!map.has(p.id))map.set(p.id,p);});var list=Array.from(map.values());
    if(needle){var n=low(needle);list.sort(function(a,b){function score(p){var u=low(p.username),nm=low(p.name);if(u===n)return 0;if(u.indexOf(n)===0)return 1;if(nm.indexOf(n)===0)return 2;if(u.indexOf(n)>=0)return 3;if(nm.indexOf(n)>=0)return 4;return 5;}var d=score(a)-score(b);return d||a.name.localeCompare(b.name);});}
    try{var gate=window.HappyInteractionPrivacyV855R52;if(gate&&typeof gate.loadPolicies==='function'&&typeof gate.allowedByPolicy==='function'&&list.length){await gate.loadPolicies(list.map(function(p){return p.id;}),false);if(seq!==searchSeq||!activeToken)return;list=list.filter(function(p){try{var policy=gate.policyCache&&gate.policyCache.get(p.id);return !policy||gate.allowedByPolicy(policy,'mentions');}catch(_e){return true;}});}}catch(_privacy){}
    list=list.slice(0,12);resultCache.set(key,{at:Date.now(),rows:list});if(seq===searchSeq&&activeToken)render(list);
  }
  function schedule(el){
    input=el;var tok=tokenFor(el);activeToken=tok;clearTimeout(searchTimer);if(!tok){hide();input=el;return;}
    searchSeq++;var seq=searchSeq;showStatus(tok.query?'Recherche…':'Suggestions…');searchTimer=setTimeout(function(){searchProfiles(tok.query,seq);},tok.query?120:70);
  }
  function bind(el){
    if(!el||el.__haCommentMentionV993)return;el.__haCommentMentionV993=true;el.setAttribute('autocomplete','off');
    el.addEventListener('input',function(){schedule(el);});
    el.addEventListener('focus',function(){var t=tokenFor(el);if(t)setTimeout(function(){schedule(el);},0);});
    el.addEventListener('click',function(){var t=tokenFor(el);if(t)schedule(el);else if(input===el)hide();});
    el.addEventListener('keydown',function(e){
      if(!visible()||input!==el)return;
      if(e.key==='ArrowDown'){e.preventDefault();e.stopPropagation();setActiveIndex(activeIndex<0?0:activeIndex+1);return;}
      if(e.key==='ArrowUp'){e.preventDefault();e.stopPropagation();setActiveIndex(activeIndex<0?items.length-1:activeIndex-1);return;}
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();hide();return;}
      if(e.key==='Enter'&&activeIndex>=0){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();choose(activeIndex);}
    },true);
    el.addEventListener('blur',function(){setTimeout(function(){if(input===el)hide();},150);});
  }
  function scan(){
    try{document.querySelectorAll('#happyadHomeCommentPopup .haCommentInputV905,#commentPanel #commentInput').forEach(bind);}catch(_e){}
  }
  function init(){
    ensureStyle();scan();
    document.addEventListener('focusin',function(e){var el=e.target;if(el&&el.matches&&el.matches('#happyadHomeCommentPopup .haCommentInputV905,#commentPanel #commentInput'))bind(el);},true);
    document.addEventListener('pointerdown',function(e){if(!visible())return;if(popup&&popup.contains(e.target))return;if(input&&e.target===input)return;hide();},true);
    window.addEventListener('resize',position,{passive:true});window.addEventListener('scroll',position,{passive:true,capture:true});
    try{if(window.visualViewport){visualViewport.addEventListener('resize',position,{passive:true});visualViewport.addEventListener('scroll',position,{passive:true});}}catch(_vv){}
    try{new MutationObserver(function(records){for(var i=0;i<records.length;i++){if(records[i].addedNodes&&records[i].addedNodes.length){scan();break;}}}).observe(document.documentElement,{subtree:true,childList:true});}catch(_mo){}
  }
  window.HappyCommentMentionMasterV993={version:'993',scan:scan,hide:hide,search:function(el){if(el)schedule(el);},tokenFor:tokenFor};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
