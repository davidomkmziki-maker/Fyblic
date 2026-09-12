/* Fyblic MENTION RENDER MASTER V942
   - Identite canonique par UID quand elle existe.
   - Nom principal dynamique via profiles.full_name.
   - Compatibilite groupes/anciens caches: si une mention conserve le handle mais
     perd momentanement l'UID, le moteur resout username -> UID -> full_name.
   - Aucun clic profil ici (point 3 reste separe). */
(function(){
  'use strict';
  if(window.HappyMentionRenderV942){
    window.HappyMentionRenderV941=window.HappyMentionRenderV942;
    window.HappyMentionRenderV937R2=window.HappyMentionRenderV942;
    window.HappyMentionRenderV937R1=window.HappyMentionRenderV942;
    return;
  }

  var VERSION='V942_GROUP_UID_DYNAMIC_FULL_NAME';
  var CLASS_NAME='happyadMentionBlueV941';
  var CACHE_KEY='HAPPYAD_MENTION_PROFILE_NAMES_V942';
  var CACHE_TTL=30000;
  var BACKGROUND_REFRESH=45000;
  var MAX_LOCAL=220;
  var profileCache=Object.create(null);       // uid -> {name,username,at}
  var handleCache=Object.create(null);        // lower(username) -> {uid,name,username,at}
  var pendingIds=Object.create(null);
  var pendingHandles=Object.create(null);
  var batchTimer=0,retryTimer=0,observer=null,refreshTimer=0,retryAttempts=0;

  function clean(v){return String(v==null?'':v).trim();}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}
  function safeUid(v){return clean(v);}
  function cleanName(v){return clean(v).replace(/^@+/, '').replace(/\s+/g,' ');}
  function cleanHandle(v){return clean(v).replace(/^@+/, '');}
  function handleKey(v){return cleanHandle(v).toLowerCase();}

  function arr(v){
    if(Array.isArray(v))return v.slice();
    if(v==null)return [];
    if(typeof v==='object')return [];
    var s=String(v).trim();
    if(!s)return [];
    try{var p=JSON.parse(s);if(Array.isArray(p))return p;}catch(_e){}
    if(s.charAt(0)==='{'&&s.charAt(s.length-1)==='}'){
      return s.slice(1,-1).split(',').map(function(x){return x.replace(/^\s*"|"\s*$/g,'').trim();}).filter(Boolean);
    }
    if(s.indexOf(',')>=0)return s.split(',').map(function(x){return x.trim();}).filter(Boolean);
    return [s];
  }

  function mentionTokens(v){
    var out=[],seen=Object.create(null);
    function add(raw){var h=cleanHandle(raw);if(!h)return;var k=h.toLowerCase();if(seen[k])return;seen[k]=1;out.push(h);}
    if(Array.isArray(v))v.forEach(add);
    else {
      var s=clean(v),m;if(!s)return out;
      try{var re=/@[\p{L}\p{N}._-]+/gu;while((m=re.exec(s)))add(m[0]);}
      catch(_e){var re2=/@[A-Za-z0-9._-]+/g;while((m=re2.exec(s)))add(m[0]);}
    }
    return out;
  }

  function indexRecord(uid,record){
    uid=safeUid(uid);if(!uid||!record)return;
    var name=cleanName(record.name),username=cleanHandle(record.username),at=Number(record.at)||Date.now();
    if(!name)name=username||'Utilisateur Fyblic';
    profileCache[uid]={name:name,username:username,at:at};
    if(username)handleCache[username.toLowerCase()]={uid:uid,name:name,username:username,at:at};
  }
  function loadLocal(){
    try{
      var raw=JSON.parse(localStorage.getItem(CACHE_KEY)||'{}');
      Object.keys(raw||{}).slice(-MAX_LOCAL).forEach(function(uid){var x=raw[uid]||{};if(uid&&(x.name||x.username))indexRecord(uid,{name:x.name,username:x.username,at:x.at});});
    }catch(_e){}
  }
  function saveLocal(){
    try{
      var rows=Object.keys(profileCache).map(function(uid){return {uid:uid,x:profileCache[uid]};})
        .filter(function(r){return r.x&&(r.x.name||r.x.username);})
        .sort(function(a,b){return Number(a.x.at||0)-Number(b.x.at||0);}).slice(-MAX_LOCAL),out={};
      rows.forEach(function(r){out[r.uid]={name:r.x.name||'',username:r.x.username||'',at:Number(r.x.at)||Date.now()};});
      localStorage.setItem(CACHE_KEY,JSON.stringify(out));
    }catch(_e){}
  }
  loadLocal();

  function client(){
    try{if(typeof window.happyadSb==='function'){var a=window.happyadSb();if(a&&a.from)return a;}}catch(_e){}
    try{if(window.happyadSupabase&&window.happyadSupabase.from)return window.happyadSupabase;}catch(_e2){}
    try{if(window.supabaseClient&&window.supabaseClient.from)return window.supabaseClient;}catch(_e3){}
    try{if(window.parent&&window.parent!==window){if(typeof window.parent.happyadSb==='function'){var b=window.parent.happyadSb();if(b&&b.from)return b;}if(window.parent.happyadSupabase&&window.parent.happyadSupabase.from)return window.parent.happyadSupabase;if(window.parent.supabaseClient&&window.parent.supabaseClient.from)return window.parent.supabaseClient;}}catch(_e4){}
    return null;
  }

  function identities(post){
    post=post||{};
    var ids=arr(post.mentioned_user_ids).length?arr(post.mentioned_user_ids):arr(post.mentionedUserIds);
    var rawHandles=arr(post.mention_handles).length?arr(post.mention_handles):arr(post.mentionHandles);
    var byKey=Object.create(null),order=[];
    function add(handle,uid,source,name){
      handle=cleanHandle(handle);if(!handle)return;
      var key=handle.toLowerCase(),display=cleanName(name),sid=safeUid(uid);
      if(byKey[key]){if(!byKey[key].uid&&sid)byKey[key].uid=sid;if(!byKey[key].name&&display)byKey[key].name=display;return;}
      var item={uid:sid,handle:handle,key:key,source:source||'',name:display};byKey[key]=item;order.push(item);
    }
    rawHandles.forEach(function(h,i){add(h,ids[i]||'', 'identity','');});
    var users=Array.isArray(post.mentionedUsers)?post.mentionedUsers:[];
    users.forEach(function(u){if(u)add(u.username||u.handle||'',u.id||u.user_id||u.uid||'', 'selected',u.full_name||u.display_name||u.name||'');});
    mentionTokens(post.mentions||post.mention_text||post.mentionText||'').forEach(function(h,i){add(h,ids[i]||'', 'legacy','');});
    /* Si le texte contient des mentions absentes des tableaux, les conserver comme
       fallback resolvable par username. C'est le cas de certains anciens albums. */
    mentionTokens(post.description||post.desc||post.caption||'').forEach(function(h){add(h,'','text','');});
    return order;
  }
  function pairs(post){return identities(post);}

  function isCoreChar(ch){if(!ch)return false;try{return /[\p{L}\p{N}_-]/u.test(ch);}catch(_e){return /[A-Za-z0-9_-]/.test(ch);}}
  function boundaryBefore(source,at){if(at<=0)return true;var ch=source.charAt(at-1);return !(isCoreChar(ch)||ch==='.'||ch==='@');}
  function boundaryAfter(source,at){if(at>=source.length)return true;var ch=source.charAt(at);if(isCoreChar(ch)||ch==='@')return false;if(ch==='.'&&isCoreChar(source.charAt(at+1)))return false;return true;}

  function cachedRecord(pair){
    if(pair&&pair.uid&&profileCache[safeUid(pair.uid)])return profileCache[safeUid(pair.uid)];
    var k=pair&&pair.handle?handleKey(pair.handle):'';return k&&handleCache[k]||null;
  }
  function visualLabel(pair,fallback){var rec=cachedRecord(pair),name=rec&&cleanName(rec.name);if(!name&&pair&&pair.name)name=cleanName(pair.name);return name?('@'+name):fallback;}

  function html(text,post){
    var source=String(text==null?'':text),list=identities(post).slice();
    if(source&&!list.length)mentionTokens(source).forEach(function(h){list.push({uid:'',handle:h,key:h.toLowerCase(),source:'text-fallback',name:''});});
    list.sort(function(a,b){return b.handle.length-a.handle.length;});
    if(!source||!list.length)return esc(source);
    var lower=source.toLowerCase(),out='',last=0,i=0;
    while(i<source.length){
      if(source.charAt(i)!=='@'||!boundaryBefore(source,i)){i++;continue;}
      var found=null;
      for(var k=0;k<list.length;k++){var raw='@'+list[k].handle,rl=raw.toLowerCase();if(lower.slice(i,i+rl.length)===rl&&boundaryAfter(source,i+rl.length)){found={pair:list[k],len:raw.length};break;}}
      if(!found){i++;continue;}
      out+=esc(source.slice(last,i));
      var sourceShown=source.slice(i,i+found.len),shown=visualLabel(found.pair,sourceShown),uid=found.pair.uid||((handleCache[handleKey(found.pair.handle)]||{}).uid||'');
      out+='<span class="'+CLASS_NAME+'" data-happyad-mention-handle="'+esc(found.pair.handle)+'" data-happyad-mention-source="'+esc(sourceShown)+'"'+(uid?' data-happyad-mention-uid="'+esc(uid)+'"':'')+'>'+esc(shown)+'</span>';
      i+=found.len;last=i;
      if(uid)queueId(uid,false);else queueHandle(found.pair.handle,false);
    }
    out+=esc(source.slice(last));scheduleBatch(20);return out;
  }

  function mentionNodes(root){
    root=root&&root.querySelectorAll?root:document;var out=[];
    try{if(root.nodeType===1&&root.classList&&root.classList.contains(CLASS_NAME))out.push(root);Array.prototype.push.apply(out,root.querySelectorAll('.'+CLASS_NAME));}catch(_e){}
    return out;
  }
  function updateNode(el,record){if(!el||!record)return;var name=cleanName(record.name);if(!name)return;var next='@'+name;if(el.textContent!==next)el.textContent=next;el.setAttribute('data-happyad-mention-display-name',name);if(record.uid)el.setAttribute('data-happyad-mention-uid',safeUid(record.uid));if(record.username)el.setAttribute('data-happyad-mention-current-username',cleanHandle(record.username));}
  function updateUid(uid,record){uid=safeUid(uid);if(!uid||!record)return;mentionNodes(document).forEach(function(el){if(safeUid(el.getAttribute('data-happyad-mention-uid'))===uid)updateNode(el,Object.assign({uid:uid},record));});}
  function updateHandle(handle,record){var key=handleKey(handle);if(!key||!record)return;mentionNodes(document).forEach(function(el){if(handleKey(el.getAttribute('data-happyad-mention-handle'))===key)updateNode(el,Object.assign({uid:record.uid||''},record));});}
  function applyCached(root){mentionNodes(root).forEach(function(el){var uid=safeUid(el.getAttribute('data-happyad-mention-uid')),key=handleKey(el.getAttribute('data-happyad-mention-handle')),rec=(uid&&profileCache[uid])||(key&&handleCache[key]);if(rec)updateNode(el,Object.assign({uid:uid||rec.uid||''},rec));});}

  function queueId(uid,force){uid=safeUid(uid);if(!uid)return;var rec=profileCache[uid],fresh=rec&&(Date.now()-Number(rec.at||0)<CACHE_TTL);if(force||!fresh)pendingIds[uid]=1;}
  function queueHandle(handle,force){var key=handleKey(handle);if(!key)return;var rec=handleCache[key],fresh=rec&&(Date.now()-Number(rec.at||0)<CACHE_TTL);if(rec&&rec.uid){queueId(rec.uid,force);return;}if(force||!fresh)pendingHandles[key]=cleanHandle(handle);}
  function queueNode(el,force){var uid=safeUid(el&&el.getAttribute&&el.getAttribute('data-happyad-mention-uid')),handle=cleanHandle(el&&el.getAttribute&&el.getAttribute('data-happyad-mention-handle'));if(uid)queueId(uid,force);else if(handle)queueHandle(handle,force);}
  function scheduleBatch(delay){if(batchTimer)return;batchTimer=setTimeout(function(){batchTimer=0;flushBatch();},Math.max(0,Number(delay)||40));}
  function allVisible(force){mentionNodes(document).forEach(function(el){queueNode(el,!!force);});}

  async function fetchIds(c,ids){
    var changed=false;
    for(var i=0;i<ids.length;i+=80){
      var part=ids.slice(i,i+80),res=await c.from('profiles').select('id,full_name,username').in('id',part);if(res&&res.error)throw res.error;
      var found=Object.create(null);
      (res&&res.data||[]).forEach(function(p){var uid=safeUid(p&&p.id),username=cleanHandle(p&&p.username),name=cleanName(p&&p.full_name)||username||'Utilisateur Fyblic';if(!uid)return;found[uid]=1;indexRecord(uid,{name:name,username:username,at:Date.now()});updateUid(uid,profileCache[uid]);if(username)updateHandle(username,Object.assign({uid:uid},profileCache[uid]));changed=true;});
      part.forEach(function(uid){if(!found[uid]&&profileCache[uid])profileCache[uid].at=Date.now();});
    }
    return changed;
  }
  async function fetchHandles(c,handles){
    var changed=false;
    for(var i=0;i<handles.length;i+=60){
      var part=handles.slice(i,i+60),raws=part.map(function(k){return pendingHandles[k]||k;});
      var res=await c.from('profiles').select('id,full_name,username').in('username',raws);if(res&&res.error)throw res.error;
      var found=Object.create(null);
      (res&&res.data||[]).forEach(function(p){var uid=safeUid(p&&p.id),username=cleanHandle(p&&p.username),key=handleKey(username),name=cleanName(p&&p.full_name)||username||'Utilisateur Fyblic';if(!uid||!key)return;found[key]=1;indexRecord(uid,{name:name,username:username,at:Date.now()});updateHandle(username,Object.assign({uid:uid},profileCache[uid]));changed=true;});
      /* Fallback ilike individuel uniquement pour les handles non trouves exactement.
         Les groupes anciens restent compatibles avec la casse historique. */
      for(var j=0;j<part.length;j++){
        var key=part[j];if(found[key]||handleCache[key])continue;
        var raw=raws[j];
        try{var one=await c.from('profiles').select('id,full_name,username').ilike('username',raw).limit(1);var p=one&&!one.error&&one.data&&one.data[0];if(p&&p.id){var uid=safeUid(p.id),username=cleanHandle(p.username),name=cleanName(p.full_name)||username||'Utilisateur Fyblic';indexRecord(uid,{name:name,username:username,at:Date.now()});handleCache[key]=Object.assign({uid:uid},profileCache[uid]);updateHandle(raw,handleCache[key]);changed=true;}}catch(_e){}
      }
    }
    return changed;
  }

  async function flushBatch(){
    var ids=Object.keys(pendingIds),handles=Object.keys(pendingHandles),handlePayload=Object.assign({},pendingHandles);pendingIds=Object.create(null);pendingHandles=Object.create(null);
    if(!ids.length&&!handles.length)return;
    var c=client();
    if(!c){ids.forEach(function(id){pendingIds[id]=1;});handles.forEach(function(k){pendingHandles[k]=handlePayload[k]||k;});retryAttempts++;if(retryAttempts<=10){clearTimeout(retryTimer);retryTimer=setTimeout(function(){retryTimer=0;flushBatch();},650);}return;}
    var changed=false;
    try{if(ids.length)changed=(await fetchIds(c,ids))||changed;retryAttempts=0;}catch(_e){ids.forEach(function(id){if(!profileCache[id])pendingIds[id]=1;});}
    /* fetchHandles lit handlePayload via pendingHandles; restaurer temporairement les valeurs. */
    handles.forEach(function(k){pendingHandles[k]=handlePayload[k]||k;});
    try{if(handles.length)changed=(await fetchHandles(c,handles))||changed;retryAttempts=0;}catch(_e2){}
    handles.forEach(function(k){delete pendingHandles[k];});
    if(changed)saveLocal();
    if(Object.keys(pendingIds).length||Object.keys(pendingHandles).length){retryAttempts++;if(retryAttempts<=6){clearTimeout(retryTimer);retryTimer=setTimeout(function(){retryTimer=0;flushBatch();},1400);}}
  }

  function hydrate(root,force){applyCached(root||document);mentionNodes(root||document).forEach(function(el){queueNode(el,!!force);});scheduleBatch(25);return true;}
  function refresh(force){retryAttempts=0;allVisible(force!==false);scheduleBatch(10);}
  function paint(el,text,post){if(!el)return false;el.innerHTML=html(text,post);hydrate(el,false);return true;}

  function ensureStyle(){if(document.getElementById('happyad-mention-blue-v941-style'))return;var st=document.createElement('style');st.id='happyad-mention-blue-v941-style';st.textContent='.'+CLASS_NAME+'{color:#1689ff!important;font-weight:inherit!important;text-decoration:none!important;pointer-events:none!important;}';(document.head||document.documentElement).appendChild(st);}
  function observe(){
    if(observer||!document.documentElement)return;
    try{observer=new MutationObserver(function(muts){var has=false;muts.forEach(function(m){if(has)return;for(var i=0;i<m.addedNodes.length;i++){var n=m.addedNodes[i];if(n&&n.nodeType===1&&(n.classList&&n.classList.contains(CLASS_NAME)||n.querySelector&&n.querySelector('.'+CLASS_NAME))){has=true;break;}}});if(has){applyCached(document);allVisible(false);scheduleBatch(35);}});observer.observe(document.documentElement,{childList:true,subtree:true});}catch(_e){}
  }
  function acceptIdentity(detail){detail=detail||{};var uid=safeUid(detail.uid||detail.id||detail.user_id),name=cleanName(detail.full_name||detail.display_name||detail.name),username=cleanHandle(detail.username||detail.handle);if(!uid)return;if(name||username){indexRecord(uid,{name:name||username||'Utilisateur Fyblic',username:username,at:Date.now()});updateUid(uid,profileCache[uid]);if(username)updateHandle(username,Object.assign({uid:uid},profileCache[uid]));saveLocal();}else{queueId(uid,true);scheduleBatch(5);}}

  ensureStyle();observe();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){observe();hydrate(document,false);},{once:true});else setTimeout(function(){hydrate(document,false);},0);
  window.addEventListener('focus',function(){refresh(true);},true);
  window.addEventListener('pageshow',function(){refresh(true);},true);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh(true);},true);
  document.addEventListener('happyad:profile-identity-changed',function(e){acceptIdentity(e&&e.detail||{});},true);
  document.addEventListener('happyad:profile-username-changed',function(e){var d=e&&e.detail||{};queueId(d.uid,true);scheduleBatch(5);},true);
  window.addEventListener('message',function(e){var d=e&&e.data||{};if(d.type==='HAPPYAD_PROFILE_IDENTITY_CHANGED_V941'||d.type==='HAPPYAD_PROFILE_IDENTITY_CHANGED_V942')acceptIdentity(d.detail||d);},true);
  refreshTimer=setInterval(function(){if(!document.hidden&&mentionNodes(document).length)refresh(true);},BACKGROUND_REFRESH);

  var api={version:VERSION,className:CLASS_NAME,pairs:pairs,identities:identities,html:html,paint:paint,hydrate:hydrate,refresh:refresh,ensureStyle:ensureStyle,acceptIdentity:acceptIdentity};
  window.HappyMentionRenderV942=api;
  window.HappyMentionRenderV941=api;
  window.HappyMentionRenderV937R2=api;
  window.HappyMentionRenderV937R1=api;
})();
