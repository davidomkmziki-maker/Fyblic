/* Fyblic LIKE DIRECT MASTER V876
   Like visible immediatement sur toutes les surfaces.
   Supabase confirme en silence; une lecture distante ancienne ne peut pas annuler
   l'etat optimiste pendant la fenetre de confirmation.
*/
(function(){
  'use strict';
  if(window.HappyLikeDirectV876)return;
  var ACTION_KEY='HAPPYAD_VIDEO_ACTIONS_V1';
  var chains=Object.create(null);

  function read(){try{return JSON.parse(localStorage.getItem(ACTION_KEY)||'{}')||{};}catch(_e){return {};}}
  function write(all){try{localStorage.setItem(ACTION_KEY,JSON.stringify(all||{}));}catch(_e){}}
  function action(id){var all=read();return all[String(id||'')]||{};}
  function token(){return Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}
  function pending(id){
    id=String(id||'');if(!id)return null;
    var a=action(id),p=a&&a.__happyadLikeDirectV876;
    if(p&&Date.now()<Number(p.until||0))return p;
    if(p){try{delete a.__happyadLikeDirectV876;var all=read();all[id]=a;write(all);}catch(_e){}}
    return null;
  }
  function mark(id,on,count,ttl){
    id=String(id||'');if(!id)return '';
    var all=read(),a=all[id]||{},t=token();
    a.like=!!on;a.likes=Math.max(0,Number(count||0)||0);
    a.__happyadLikeDirectV876={token:t,on:!!on,count:a.likes,until:Date.now()+Number(ttl||30000),at:Date.now()};
    all[id]=a;write(all);signal(id,a.like,a.likes,'optimistic');return t;
  }
  function keep(id,t,ttl){
    id=String(id||'');var all=read(),a=all[id]||{},p=a.__happyadLikeDirectV876;
    if(p&&(!t||p.token===t)){p.until=Date.now()+Number(ttl||30000);a.__happyadLikeDirectV876=p;all[id]=a;write(all);}
  }
  function apply(id,a){
    a=a||{};var p=pending(id);if(p){a.like=!!p.on;a.likes=Math.max(0,Number(p.count||0)||0);a.__happyadLikeDirectV876=p;}return a;
  }
  function isCurrent(id,t){var p=pending(id);return !!(p&&p.token===t);}
  function settle(id,t,on,count){
    id=String(id||'');if(!id)return null;
    var all=read(),a=all[id]||{},p=a.__happyadLikeDirectV876;
    if(!p||p.token!==t)return null;
    a.like=!!on;
    if(count!==null&&count!==undefined&&isFinite(Number(count)))a.likes=Math.max(0,Number(count)||0);
    /* Garde réseau après confirmation : une lecture distante lente ou un iframe en retard
       ne peut pas blanchir le cœur pendant une connexion moyenne/faible. */
    a.__happyadLikeDirectV876={token:t,on:a.like,count:a.likes,until:Date.now()+45000,at:Date.now(),confirmed:true};
    all[id]=a;write(all);signal(id,a.like,a.likes,'confirmed');return a;
  }
  function signal(id,on,count,source){
    try{window.dispatchEvent(new CustomEvent('HAPPYAD_LIKE_DIRECT_V876',{detail:{id:String(id||''),like:!!on,likes:Number(count||0),source:source||''}}));}catch(_e){}
    try{localStorage.setItem('HAPPYAD_ACTION_FAST_SYNC_V1',JSON.stringify({id:String(id||''),type:'like',like:!!on,likes:Number(count||0),source:source||'direct-v876',t:Date.now()}));}catch(_e){}
  }
  function queue(id,task){
    id=String(id||'');var prev=chains[id]||Promise.resolve();
    var next=prev.catch(function(){}).then(function(){return task();});
    var stored=next.finally(function(){if(chains[id]===stored)delete chains[id];});
    chains[id]=stored;return stored;
  }
  async function countRemote(c,id){
    if(!c||!id)return null;
    try{
      var q=await c.from('happyad_content_actions').select('post_id',{count:'exact',head:true}).eq('post_id',String(id)).eq('action_type','like').eq('liked',true);
      if(q&&!q.error&&q.count!==null&&q.count!==undefined)return Math.max(0,Number(q.count)||0);
    }catch(_e){}
    try{
      var q2=await c.from('happyad_content_actions').select('content_id',{count:'exact',head:true}).eq('content_id',String(id)).eq('action_type','like').eq('liked',true);
      if(q2&&!q2.error&&q2.count!==null&&q2.count!==undefined)return Math.max(0,Number(q2.count)||0);
    }catch(_e2){}
    return null;
  }
  async function syncPost(c,id,count){
    if(!c||count===null||count===undefined)return;
    try{var r=await c.from('happyad_posts').update({likes_count:Math.max(0,Number(count)||0)}).eq('id',String(id));if(r&&r.error)throw r.error;}catch(_e){}
  }
  async function confirm(c,id,t,on){
    if(!isCurrent(id,t))return null;
    var waits=[0,220,700],count=null;
    for(var i=0;i<waits.length;i++){
      if(waits[i])await new Promise(function(resolve){setTimeout(resolve,waits[i]);});
      if(!isCurrent(id,t))return null;
      count=await countRemote(c,id);
      if(count!==null)break;
    }
    if(count===null){keep(id,t,30000);return null;}
    if(!isCurrent(id,t))return null;
    await syncPost(c,id,count);
    if(!isCurrent(id,t))return null;
    settle(id,t,on,count);return count;
  }

  window.HappyLikeDirectV876={version:'V995_NETWORK_STABLE',read:read,write:write,action:action,pending:pending,mark:mark,keep:keep,apply:apply,isCurrent:isCurrent,settle:settle,signal:signal,queue:queue,countRemote:countRemote,confirm:confirm,syncPost:syncPost};
})();
