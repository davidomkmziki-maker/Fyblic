/* Fyblic V996 — mentions @ professionnelles dans les commentaires.
   - badge Fyblic canonique via happyBadgeMark/badgeMarkHtml
   - popup réellement scrollable: un glissement vertical ne sélectionne jamais un profil
   - recherche directement dans le popup + recherche depuis la saisie après @
   - suggestions étendues, amis/abonnements prioritaires puis profils disponibles
   - le champ affiche le NOM PRINCIPAL (full_name) choisi; le vrai @username reste seulement l'identifiant technique persiste
*/
(function(){
  'use strict';
  if(window.HappyCommentMentionMasterV994)return;

  var POPUP_ID='happyadCommentMentionPopupV994';
  var STYLE_ID='happyadCommentMentionStyleV994';
  var SEARCH_ID='happyadCommentMentionSearchV994';
  var LIST_ID='happyadCommentMentionListV994';
  var MAX_RESULTS=100;
  var input=null,popup=null,popupSearch=null,popupList=null,items=[],activeToken=null,activeIndex=-1,searchTimer=0,searchSeq=0,uidCache='',uidAt=0;
  var resultCache=new Map();
  var pointerState=null,lastPointerAt=0;

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
    return {id:id,username:username,name:name,avatar:clean(row.avatar_url||row.avatar||row.photo_url),badge:clean(row.badge||row.user_badge||row.profile_badge||row.badge_type||row.verification_badge||row.verified_badge||row.certification)};
  }
  function avatarHtml(p){
    if(p&&p.avatar)return '<img src="'+esc(p.avatar)+'" alt="">';
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="22" r="13"></circle><path d="M10 58c2.8-15 11.8-22 22-22s19.2 7 22 22"></path></svg>';
  }
  function fallbackBadgeClass(v){
    var b=low(v);if(!b||/^(aucun|none|false|0|1|true|null|undefined)$/.test(b))return '';
    if(/rose|pink/.test(b))return 'rose';
    if(/violet|purple|jaune|yellow|business/.test(b))return 'violet';
    if(/bleu|blue|verif|cert/.test(b))return 'bleu';
    return '';
  }
  function badgeHtml(p){
    var b=clean(p&&p.badge);if(!b)return '';
    try{if(typeof window.badgeMarkHtml==='function'){var html=window.badgeMarkHtml(b);if(html)return html;}}catch(_e){}
    var cls=fallbackBadgeClass(b);return cls?'<span class="happyBadgeMark '+cls+'" aria-label="Compte vérifié"></span>':'';
  }
  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    var s=document.createElement('style');s.id=STYLE_ID;s.textContent='\
#'+POPUP_ID+'{position:fixed;z-index:2147483643;display:none;box-sizing:border-box;max-height:min(330px,45dvh);overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:6px;background:rgba(15,19,27,.985);border:1px solid rgba(255,255,255,.13);border-radius:18px;box-shadow:0 16px 46px rgba(0,0,0,.55);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#fff;scrollbar-width:none}\
#'+POPUP_ID+'::-webkit-scrollbar{display:none}\
#'+POPUP_ID+'.show{display:block}\
#'+POPUP_ID+' .haCommentMentionHeadV994{position:sticky;top:-6px;z-index:4;padding:7px 7px 8px;background:linear-gradient(to bottom,rgba(15,19,27,.998) 0%,rgba(15,19,27,.995) 82%,rgba(15,19,27,.92) 100%)}\
#'+POPUP_ID+' .haCommentMentionTitleV994{padding:0 3px 7px;color:#aab3c1;font-size:11px;font-weight:850;letter-spacing:.02em}\
#'+POPUP_ID+' .haCommentMentionSearchWrapV994{height:38px;border-radius:12px;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.10);display:flex;align-items:center;padding:0 10px;gap:7px}\
#'+POPUP_ID+' .haCommentMentionSearchIconV994{flex:0 0 15px;width:15px;height:15px;opacity:.72}\
#'+POPUP_ID+' .haCommentMentionSearchIconV994 svg{display:block;width:100%;height:100%;fill:none;stroke:#d9e1ec;stroke-width:2.1}\
#'+POPUP_ID+' .haCommentMentionSearchV994{appearance:none;-webkit-appearance:none;min-width:0;flex:1;height:34px;border:0!important;outline:0!important;background:transparent!important;color:#fff!important;font:750 13px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:0!important;margin:0!important;box-shadow:none!important}\
#'+POPUP_ID+' .haCommentMentionSearchV994::placeholder{color:#8f99a8;opacity:1}\
#'+POPUP_ID+' .haCommentMentionStatusV994{padding:20px 12px;text-align:center;color:#aeb7c5;font-size:13px;font-weight:750}\
#'+POPUP_ID+' .haCommentMentionPersonV994{appearance:none;-webkit-appearance:none;width:100%;min-height:58px;border:0;border-radius:13px;background:transparent;color:#fff;padding:6px 8px;display:grid;grid-template-columns:43px minmax(0,1fr);align-items:center;gap:10px;text-align:left;touch-action:pan-y;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}\
#'+POPUP_ID+' .haCommentMentionPersonV994:active,#'+POPUP_ID+' .haCommentMentionPersonV994.active{background:rgba(255,255,255,.09)}\
#'+POPUP_ID+' .haCommentMentionAvatarV994{width:42px;height:42px;border-radius:50%;overflow:hidden;background:#eef1f5;display:grid;place-items:center;border:1px solid rgba(255,255,255,.18);pointer-events:none}\
#'+POPUP_ID+' .haCommentMentionAvatarV994 img{width:100%;height:100%;object-fit:cover;display:block}\
#'+POPUP_ID+' .haCommentMentionAvatarV994 svg{width:100%;height:100%;fill:#9aa3b2}\
#'+POPUP_ID+' .haCommentMentionCopyV994{min-width:0;pointer-events:none}\
#'+POPUP_ID+' .haCommentMentionNameV994{display:flex;align-items:center;gap:5px;min-width:0;color:#fff;font-size:14px;font-weight:900;line-height:1.18}\
#'+POPUP_ID+' .haCommentMentionNameV994>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\
#'+POPUP_ID+' .haCommentMentionNameV994 .happyBadgeMark{flex:0 0 15px!important;width:15px!important;height:15px!important;margin-left:1px!important;vertical-align:0!important}\
#'+POPUP_ID+' .haCommentMentionNameV994 .happyBadgeMark.bleu:before,#'+POPUP_ID+' .haCommentMentionNameV994 .happyBadgeMark.blue:before{background:linear-gradient(135deg,#6fd4ff,#38b6ff,#0090ff)!important;box-shadow:0 0 3px rgba(79,195,255,.45),0 0 8px rgba(0,120,255,.25)!important}\
#'+POPUP_ID+' .haCommentMentionNameV994 .happyBadgeMark.violet:before{background:linear-gradient(135deg,#e9d5ff,#c084fc,#9333ea)!important;box-shadow:0 0 3px rgba(147,51,234,.45),0 0 8px rgba(109,40,217,.25)!important}\
#'+POPUP_ID+' .haCommentMentionNameV994 .happyBadgeMark.rose:before,#'+POPUP_ID+' .haCommentMentionNameV994 .happyBadgeMark.pink:before{background:linear-gradient(135deg,#ffb4d4,#ff5ca8,#e60073)!important;box-shadow:0 0 3px rgba(255,92,168,.55),0 0 9px rgba(230,0,115,.30)!important}\
#'+POPUP_ID+' .haCommentMentionHandleV994{display:block;margin-top:3px;color:#63aef9;font-size:12px;font-weight:760;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\
';document.head.appendChild(s);
  }
  function ensureStructure(){
    ensureStyle();
    if(popup&&popup.isConnected&&popupSearch&&popupList)return popup;
    popup=document.getElementById(POPUP_ID);
    if(!popup){popup=document.createElement('div');popup.id=POPUP_ID;popup.setAttribute('role','listbox');popup.setAttribute('aria-label','Suggestions de personnes à mentionner');document.body.appendChild(popup);}
    popup.innerHTML='<div class="haCommentMentionHeadV994"><div class="haCommentMentionTitleV994">Mentionner une personne</div><div class="haCommentMentionSearchWrapV994"><span class="haCommentMentionSearchIconV994" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l5 5"></path></svg></span><input id="'+SEARCH_ID+'" class="haCommentMentionSearchV994" type="search" inputmode="search" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Rechercher un utilisateur"></div></div><div id="'+LIST_ID+'"></div>';
    popupSearch=popup.querySelector('#'+SEARCH_ID);popupList=popup.querySelector('#'+LIST_ID);
    if(!popup.__haMentionBoundV994){
      popup.__haMentionBoundV994=true;
      popup.addEventListener('pointerdown',function(e){
        var b=e.target&&e.target.closest?e.target.closest('[data-ha-comment-mention-index]'):null;if(!b)return;
        pointerState={id:e.pointerId,index:Number(b.getAttribute('data-ha-comment-mention-index')),x:Number(e.clientX||0),y:Number(e.clientY||0),scrollTop:Number(popup.scrollTop||0),moved:false};lastPointerAt=Date.now();
      },true);
      popup.addEventListener('pointermove',function(e){
        if(!pointerState||pointerState.id!==e.pointerId)return;var dx=Math.abs(Number(e.clientX||0)-pointerState.x),dy=Math.abs(Number(e.clientY||0)-pointerState.y),ds=Math.abs(Number(popup.scrollTop||0)-pointerState.scrollTop);if(dx>7||dy>7||ds>3)pointerState.moved=true;
      },true);
      popup.addEventListener('pointerup',function(e){
        if(!pointerState||pointerState.id!==e.pointerId)return;var st=pointerState;pointerState=null;lastPointerAt=Date.now();
        var b=e.target&&e.target.closest?e.target.closest('[data-ha-comment-mention-index]'):null,idx=b?Number(b.getAttribute('data-ha-comment-mention-index')):-1,ds=Math.abs(Number(popup.scrollTop||0)-st.scrollTop);
        if(st.moved||ds>3||idx!==st.index)return;
        e.preventDefault();e.stopPropagation();choose(st.index);
      },true);
      popup.addEventListener('pointercancel',function(){pointerState=null;lastPointerAt=Date.now();},true);
      popup.addEventListener('click',function(e){
        var b=e.target&&e.target.closest?e.target.closest('[data-ha-comment-mention-index]'):null;if(!b)return;e.preventDefault();e.stopPropagation();
        if(e.detail===0&&Date.now()-lastPointerAt>450)choose(Number(b.getAttribute('data-ha-comment-mention-index')));
      },true);
    }
    if(popupSearch&&!popupSearch.__haMentionSearchBoundV994){
      popupSearch.__haMentionSearchBoundV994=true;
      popupSearch.addEventListener('input',function(){
        clearTimeout(searchTimer);searchSeq++;var seq=searchSeq,q=clean(popupSearch.value).replace(/^@+/,'');showStatus(q?'Recherche…':'Suggestions…',q,true);searchTimer=setTimeout(function(){searchProfiles(q,seq,true);},q?100:60);
      });
      popupSearch.addEventListener('keydown',function(e){
        if(e.key==='ArrowDown'){e.preventDefault();e.stopPropagation();setActiveIndex(activeIndex<0?0:activeIndex+1);return;}
        if(e.key==='ArrowUp'){e.preventDefault();e.stopPropagation();setActiveIndex(activeIndex<0?items.length-1:activeIndex-1);return;}
        if(e.key==='Escape'){e.preventDefault();e.stopPropagation();hide();try{input&&input.focus({preventScroll:true});}catch(_e){}return;}
        if(e.key==='Enter'&&activeIndex>=0){e.preventDefault();e.stopPropagation();choose(activeIndex);}
      },true);
    }
    return popup;
  }
  function visible(){return !!(popup&&popup.classList.contains('show'));}
  function hide(){clearTimeout(searchTimer);activeToken=null;activeIndex=-1;items=[];pointerState=null;if(popup){popup.classList.remove('show');if(popupList)popupList.innerHTML='';}if(input)try{input.removeAttribute('aria-controls');input.removeAttribute('aria-expanded');}catch(_e){} }
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
      var h=Math.min(Number(popup.scrollHeight||210),Math.round(vh*.45),330),top=Number(r.top||0)-h-8;if(top<8)top=Math.min(vh-h-8,Number(r.bottom||0)+8);popup.style.top=Math.round(Math.max(8,top))+'px';
    }catch(_e){}
  }
  function syncPopupSearch(q,force){
    ensureStructure();if(!popupSearch)return;try{if(force||document.activeElement!==popupSearch)popupSearch.value=clean(q);}catch(_e){}
  }
  function showStatus(text,q,keepSearchFocus){
    var p=ensureStructure();syncPopupSearch(q,false);if(popupList)popupList.innerHTML='<div class="haCommentMentionStatusV994">'+esc(text)+'</div>';try{p.scrollTop=0;}catch(_scroll){}p.classList.add('show');if(input){input.setAttribute('aria-controls',POPUP_ID);input.setAttribute('aria-expanded','true');}requestAnimationFrame(position);if(keepSearchFocus&&popupSearch&&document.activeElement===popupSearch){try{var n=popupSearch.value.length;popupSearch.setSelectionRange(n,n);}catch(_e){}}
  }
  function render(list,q){
    if(!activeToken||!input)return;items=(list||[]).slice(0,MAX_RESULTS);activeIndex=-1;var p=ensureStructure();syncPopupSearch(q,false);
    if(!items.length){showStatus('Aucune personne trouvée',q,false);return;}
    if(popupList)popupList.innerHTML=items.map(function(x,i){return '<button type="button" class="haCommentMentionPersonV994" role="option" aria-selected="false" data-ha-comment-mention-index="'+i+'"><span class="haCommentMentionAvatarV994">'+avatarHtml(x)+'</span><span class="haCommentMentionCopyV994"><span class="haCommentMentionNameV994"><span>'+esc(x.name)+'</span>'+badgeHtml(x)+'</span><span class="haCommentMentionHandleV994">@'+esc(x.username)+'</span></span></button>';}).join('');
    try{p.scrollTop=0;}catch(_scroll){}p.classList.add('show');input.setAttribute('aria-controls',POPUP_ID);input.setAttribute('aria-expanded','true');requestAnimationFrame(position);
  }
  function setActiveIndex(next){
    if(!visible()||!items.length)return false;next=(next+items.length)%items.length;activeIndex=next;var rows=popup.querySelectorAll('[data-ha-comment-mention-index]');for(var i=0;i<rows.length;i++){var on=i===next;rows[i].classList.toggle('active',on);rows[i].setAttribute('aria-selected',on?'true':'false');if(on)try{rows[i].scrollIntoView({block:'nearest'});}catch(_e){}}return true;
  }
  function aliasStore(el){
    if(!el)return [];if(!Array.isArray(el.__haCommentMentionAliasesV996))el.__haCommentMentionAliasesV996=[];return el.__haCommentMentionAliasesV996;
  }
  function rememberAlias(el,p){
    if(!el||!p)return;var visible='@'+clean(p.name||p.full_name||p.username),stored='@'+clean(p.username).replace(/^@+/,'');if(!visible||visible==='@'||!stored||stored==='@')return;
    var list=aliasStore(el),key=low(visible);for(var i=list.length-1;i>=0;i--){if(low(list[i]&&list[i].visible)===key)list.splice(i,1);}list.push({visible:visible,stored:stored,uid:clean(p.id),name:clean(p.name),username:clean(p.username).replace(/^@+/,'')});if(list.length>40)list.splice(0,list.length-40);
  }
  function serializeValue(el,value){
    var text=String(value==null?(el&&el.value||''):value),list=(el&&Array.isArray(el.__haCommentMentionAliasesV996)?el.__haCommentMentionAliasesV996.slice():[]);
    list.sort(function(a,b){return String(b&&b.visible||'').length-String(a&&a.visible||'').length;});
    list.forEach(function(a){var visible=String(a&&a.visible||''),stored=String(a&&a.stored||'');if(!visible||!stored)return;var start=0,idx;while((idx=text.indexOf(visible,start))!==-1){var before=idx>0?text.charAt(idx-1):'',after=text.charAt(idx+visible.length)||'',leftOk=!before||/[\s([{"'.,!?;:]/.test(before),rightOk=!after||/[\s)\]}"'.,!?;:]/.test(after);if(leftOk&&rightOk){text=text.slice(0,idx)+stored+text.slice(idx+visible.length);start=idx+stored.length;}else start=idx+visible.length;}});return text;
  }
  function clearAliases(el){try{if(el)el.__haCommentMentionAliasesV996=[];}catch(_e){}}
  function choose(index){
    var p=items[index],el=input,tok=el&&tokenFor(el);if(!p||!el||!tok)return hide();
    try{var links=window.HappyProfileLinkMasterV992;if(links&&typeof links.rememberProfile==='function')links.rememberProfile({id:p.id,user_id:p.id,username:p.username,full_name:p.name,name:p.name,avatar_url:p.avatar,badge:p.badge},{source:'comment-mention-select-v996'});}catch(_prime){}
    /* V996 : l'utilisateur voit le premier nom du profil, comme dans les publications.
       L'identifiant @username n'est conserve qu'en interne lors de l'enregistrement. */
    var before=String(el.value||'').slice(0,tok.start),after=String(el.value||'').slice(tok.end),visible='@'+clean(p.name||p.username),insert=visible+' ';
    rememberAlias(el,p);el.value=before+insert+after;var caret=before.length+insert.length;hide();try{el.focus({preventScroll:true});el.setSelectionRange(caret,caret);}catch(_e){try{el.focus();}catch(_e2){}}
    try{el.dispatchEvent(new Event('input',{bubbles:true}));}catch(_e3){}
  }
  function cacheKey(q){return low(q)||'@';}
  async function genericProfiles(c){
    try{var g=await c.from('profiles').select('id,full_name,username,avatar_url,badge').not('username','is',null).order('full_name',{ascending:true,nullsFirst:false}).limit(MAX_RESULTS);if(g&&!g.error&&Array.isArray(g.data))return g.data;}catch(_e){}
    try{var g2=await c.from('profiles').select('id,full_name,username,avatar_url,badge').not('username','is',null).limit(MAX_RESULTS);if(g2&&!g2.error&&Array.isArray(g2.data))return g2.data;}catch(_e2){}return [];
  }
  async function suggestionsForEmpty(c,me){
    var ids=[],generalPromise=genericProfiles(c);
    if(me){
      try{var rel=await Promise.all([c.from('happyad_follows').select('creator_id,created_at').eq('follower_id',me).order('created_at',{ascending:false}).limit(100),c.from('happyad_follows').select('follower_id').eq('creator_id',me).limit(120)]),following=(rel[0]&&rel[0].data||[]).map(function(r){return clean(r&&r.creator_id);}).filter(Boolean),followers=new Set((rel[1]&&rel[1].data||[]).map(function(r){return clean(r&&r.follower_id);}).filter(Boolean)),friends=following.filter(function(id){return followers.has(id);}),friendSet=new Set(friends);ids=uniq(friends.concat(following.filter(function(id){return !friendSet.has(id);}))).slice(0,80);}catch(_e){}
    }
    var priority=[];
    if(ids.length){try{var r=await c.from('profiles').select('id,full_name,username,avatar_url,badge').in('id',ids),rows=r&&!r.error&&Array.isArray(r.data)?r.data:[],rank=new Map(ids.map(function(id,i){return [id,i];}));rows.sort(function(a,b){return (rank.has(clean(a&&a.id))?rank.get(clean(a&&a.id)):9999)-(rank.has(clean(b&&b.id))?rank.get(clean(b&&b.id)):9999);});priority=rows;}catch(_e2){}}
    var general=await generalPromise,map=new Map(),out=[];priority.concat(general||[]).forEach(function(row){var id=clean(row&&row.id);if(id&&id!==me&&!map.has(id)){map.set(id,1);out.push(row);}});return out.slice(0,MAX_RESULTS);
  }
  async function searchProfiles(q,seq,fromPopup){
    var key=cacheKey(q),cached=resultCache.get(key);if(cached&&Date.now()-cached.at<45000){if(seq===searchSeq&&activeToken)render(cached.rows,q);return;}
    var c=await ensureClient();if(seq!==searchSeq||!activeToken)return;if(!c){render([],q);return;}
    var me=await currentUid(c),needle=clean(q).replace(/^@+/,'').replace(/[%_]/g,'');if(seq!==searchSeq||!activeToken)return;
    var raw=[];
    try{
      if(needle){var pattern='%'+needle+'%',res=await Promise.all([c.from('profiles').select('id,full_name,username,avatar_url,badge').ilike('username',pattern).limit(70),c.from('profiles').select('id,full_name,username,avatar_url,badge').ilike('full_name',pattern).limit(70)]);raw=(res[0]&&!res[0].error&&res[0].data||[]).concat(res[1]&&!res[1].error&&res[1].data||[]);}else raw=await suggestionsForEmpty(c,me);
    }catch(_e){raw=[];}
    if(seq!==searchSeq||!activeToken)return;
    var map=new Map();raw.forEach(function(r){var p=normalize(r);if(p&&p.id!==me&&!map.has(p.id))map.set(p.id,p);});var list=Array.from(map.values());
    if(needle){var n=low(needle);list.sort(function(a,b){function score(p){var u=low(p.username),nm=low(p.name);if(u===n)return 0;if(u.indexOf(n)===0)return 1;if(nm.indexOf(n)===0)return 2;if(u.indexOf(n)>=0)return 3;if(nm.indexOf(n)>=0)return 4;return 5;}var d=score(a)-score(b);return d||a.name.localeCompare(b.name);});}
    try{var gate=window.HappyInteractionPrivacyV855R52;if(gate&&typeof gate.loadPolicies==='function'&&typeof gate.allowedByPolicy==='function'&&list.length){await gate.loadPolicies(list.map(function(p){return p.id;}),false);if(seq!==searchSeq||!activeToken)return;list=list.filter(function(p){try{var policy=gate.policyCache&&gate.policyCache.get(p.id);return !policy||gate.allowedByPolicy(policy,'mentions');}catch(_e){return true;}});}}catch(_privacy){}
    list=list.slice(0,MAX_RESULTS);resultCache.set(key,{at:Date.now(),rows:list});if(seq===searchSeq&&activeToken)render(list,needle);
  }
  function schedule(el){
    input=el;var tok=tokenFor(el);activeToken=tok;clearTimeout(searchTimer);if(!tok){hide();input=el;return;}
    searchSeq++;var seq=searchSeq;showStatus(tok.query?'Recherche…':'Suggestions…',tok.query,false);searchTimer=setTimeout(function(){searchProfiles(tok.query,seq,false);},tok.query?110:65);
  }
  function bind(el){
    if(!el||el.__haCommentMentionV994)return;el.__haCommentMentionV994=true;el.setAttribute('autocomplete','off');
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
    el.addEventListener('blur',function(){setTimeout(function(){try{if(popup&&popup.contains(document.activeElement))return;}catch(_e){}if(input===el)hide();},180);});
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
  window.HappyCommentMentionMasterV994={version:'996',scan:scan,hide:hide,search:function(el){if(el)schedule(el);},tokenFor:tokenFor,serializeValue:serializeValue,clearAliases:clearAliases};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
