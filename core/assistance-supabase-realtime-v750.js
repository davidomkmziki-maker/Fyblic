(function(){
  'use strict';
  if(window.__HAPPYAD_ASSISTANCE_SUPABASE_REALTIME_V750__)return;
  window.__HAPPYAD_ASSISTANCE_SUPABASE_REALTIME_V750__=true;

  var BUILD='HAPPYAD_ASSISTANCE_SUPABASE_REALTIME_V851R10_SCROLL_COORDINATOR';
  var DELETED_CHATS_KEY='happyad_support_deleted_v745';
  var syncTimer=0,pullTimer=0,syncing=false,pulling=false,started=false;
  var client=null,currentUser=null,channel=null,lastFingerprint='';
  var applyingRemote=false,retryTimer=0,initialPullDone=false,reconnectTimer=0;
  var lastMarkedReadByCase=Object.create(null),channelGeneration=0;

  function api(){return window.HappyadAssistance||null}
  function isLocalWriting(){return !!window.__HAPPYAD_ASSISTANCE_LOCAL_WRITING__}
  function isUiQuiet(){return Date.now()<Number(window.__HAPPYAD_ASSISTANCE_UI_QUIET_UNTIL__||0)}
  function deferForUi(action,delay){
    var remaining=Number(window.__HAPPYAD_ASSISTANCE_UI_QUIET_UNTIL__||0)-Date.now();
    var wait=Math.max(Number(delay||220),remaining+80);
    if(action==='sync')scheduleSync(wait);else schedulePull(wait);
  }
  function clean(v){return String(v==null?'':v).trim()}
  function clone(v){try{return JSON.parse(JSON.stringify(v))}catch(_e){return null}}
  function now(){return new Date().toISOString()}
  function uid(prefix){return (prefix||'ha')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)}
  function errText(error){return clean(error&&(error.message||error.details||error.hint||error.error_description)||error)}
  function emit(name,detail){try{window.dispatchEvent(new CustomEvent(name,{detail:detail||{}}))}catch(_e){}}
  function deletedChats(){
    try{var raw=JSON.parse(localStorage.getItem(DELETED_CHATS_KEY)||'{}');return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}}
    catch(_e){return {}}
  }
  function isDeleted(chatOrRow){
    var deleted=deletedChats(),client='',remote='';
    if(chatOrRow){
      if(Object.prototype.hasOwnProperty.call(chatOrRow,'client_case_id')){
        client=clean(chatOrRow.client_case_id||'');
        remote=clean(chatOrRow.id||'');
      }else{
        client=clean(chatOrRow.id||'');
        remote=clean(chatOrRow.remoteCaseId||chatOrRow.remote_case_id||'');
      }
    }
    return Boolean((client&&deleted['client:'+client])||(remote&&deleted['remote:'+remote]));
  }
  function activityTime(chat){
    var value=Date.parse(chat&&chat.lastActivityAt||'');if(Number.isFinite(value))return value;
    var latest=0;(chat&&chat.messages||[]).forEach(function(message){var t=Date.parse(message&&message.time||'');if(Number.isFinite(t)&&t>latest)latest=t});
    if(latest)return latest;
    value=Date.parse(chat&&chat.createdAt||'');if(Number.isFinite(value))return value;
    value=Date.parse(chat&&chat.updatedAt||'');return Number.isFinite(value)?value:0;
  }
  function compareChats(a,b){
    var delta=activityTime(b)-activityTime(a);if(delta)return delta;
    delta=(Date.parse(b&&b.createdAt||'')||0)-(Date.parse(a&&a.createdAt||'')||0);if(delta)return delta;
    return clean(a&&a.id).localeCompare(clean(b&&b.id));
  }

  function getClient(){
    if(client&&client.rpc)return client;
    try{
      if(window.parent&&window.parent!==window){
        if(typeof window.parent.happyadSb==='function')client=window.parent.happyadSb();
        if(!client&&window.parent.happyadSupabase)client=window.parent.happyadSupabase;
        if(!client&&window.parent.supabaseClient&&window.parent.supabaseClient.rpc)client=window.parent.supabaseClient;
      }
    }catch(_e){}
    return client&&client.rpc?client:null;
  }
  async function getAuthUser(){
    var c=getClient();if(!c||!c.auth)return null;
    try{
      var r=await c.auth.getUser();
      currentUser=r&&r.data&&r.data.user?r.data.user:null;
      return currentUser;
    }catch(_e){return null}
  }
  function getContext(){
    var a=api();
    try{return a&&typeof a.getCurrentContext==='function'?(a.getCurrentContext()||{}):(window.__HAPPYAD_ASSISTANCE_CONTEXT__||{})}catch(_e){return {}}
  }
  function getChats(){
    var a=api();
    try{return a&&typeof a.getChats==='function'?(a.getChats()||[]).filter(function(chat){return !isDeleted(chat)}):[]}catch(_e){return []}
  }
  function replaceChats(rows,currentId,options){
    var a=api();
    if(!a)return false;
    var method=typeof a.applyRemoteChatsSilent==='function'?a.applyRemoteChatsSilent:a.replaceChats;
    if(typeof method!=='function')return false;
    options=options&&typeof options==='object'?options:{};
    applyingRemote=true;
    try{return method.call(a,rows,{
      currentId:currentId||a.getCurrentChatId&&a.getCurrentChatId(),
      remote:true,
      silent:true,
      allowCurrentSwitch:options.allowCurrentSwitch===true
    })}
    finally{setTimeout(function(){applyingRemote=false},0)}
  }
  function safeLocalMessage(m){
    var x=clone(m)||{};
    delete x.remoteId;delete x.remoteCaseId;delete x.remoteSyncedAt;
    return x;
  }
  function remoteSender(m){
    if(m&&m.kind==='card')return 'system';
    var role=clean(m&&m.role).toLowerCase();
    if(role==='user')return 'user';
    if(role==='assistant')return 'assistant';
    if(role==='system')return 'system';
    return '';
  }
  function remoteType(m){
    if(m&&m.kind==='card')return 'card';
    var v=clean(m&&(m.message_type||m.type||m.kind)).toLowerCase();
    return ['text','image','video','audio','file','system','card'].indexOf(v)>=0?v:'text';
  }
  function messagePayload(m){
    var sender=remoteSender(m);if(!sender)return null;
    return {
      client_message_id:left(clean(m.id)||uid('msg'),180),
      sender_type:sender,
      sender_name:sender==='assistant'?'Assistance Fyblic':'',
      body:clean(m.text||m.body||(m.kind==='card'?(m.cardType||'Carte Assistance'):'')),
      message_type:remoteType(m),
      attachments:Array.isArray(m.attachments)?m.attachments:[],
      event_key:left(clean(m.event_key||m.semantic||m.cardType||''),180),
      created_at:m.time||m.created_at||now(),
      metadata:{
        local_message:safeLocalMessage(m),
        timeline_order:Number(m.timelineOrder||0),
        timeline_kind:m.kind||'message',
        timeline_card_type:m.cardType||'',
        timeline_semantic:m.semantic||'',
        build:BUILD
      }
    };
  }
  function left(v,n){return clean(v).slice(0,n)}
  function localMeta(chat){
    return {
      local_chat:{
        id:chat.id,title:chat.title,status:chat.status,state:chat.state,
        categoryId:chat.categoryId||'',selectedCategoryId:chat.selectedCategoryId||'',
        selectedTopicId:chat.selectedTopicId||'',country:chat.country||'',
        adminReason:chat.adminReason||'',closedBy:chat.closedBy||'',
        botLocked:chat.botLocked===true,resolutionPending:chat.resolutionPending===true,
        resolvedAt:chat.resolvedAt||'',nextTimelineOrder:Number(chat.nextTimelineOrder||1),
        createdAt:chat.createdAt||now(),updatedAt:chat.updatedAt||now(),
        lastActivityAt:chat.lastActivityAt||chat.updatedAt||chat.createdAt||now()
      },
      timeline_manifest:(chat.messages||[]).map(function(message,index){return {
        id:clean(message&&message.id),order:Number(message&&message.timelineOrder||index+1),
        role:clean(message&&message.role),kind:clean(message&&message.kind||'message'),
        card_type:clean(message&&message.cardType),semantic:clean(message&&message.semantic)
      }}),
      integration:'happyad-v750',build:BUILD
    };
  }
  function meaningfulChat(chat){
    if(!chat||!chat.id)return false;
    if(chat.state==='waiting_admin'||chat.status==='waiting_admin'||chat.status==='resolved')return true;
    return (chat.messages||[]).some(function(m){return m&&m.role==='user'&&clean(m.text)});
  }
  async function syncOne(chat,context){
    var c=getClient();if(!c||!currentUser||isDeleted(chat)||!meaningfulChat(chat))return chat;
    var p={
      p_client_case_id:left(chat.id,180),
      p_user_name:left(context.user&&context.user.name,180),
      p_user_username:left(context.user&&context.user.username,100),
      p_user_avatar_url:left(context.user&&context.user.avatar,1200),
      p_country:left(chat.country||context.country,120),
      p_language:left(context.language||navigator.language||'fr',24),
      p_source:left(context.source||'happyad',80),
      p_category_id:left(chat.selectedCategoryId||chat.categoryId,120),
      p_category_label:left(chat.categoryLabel||'',220),
      p_topic_id:left(chat.selectedTopicId||'',120),
      p_topic_label:left(chat.topicLabel||chat.title||'',220),
      p_subject:left(chat.title||'Demande Assistance',300),
      p_metadata:localMeta(chat)
    };
    var r=await c.rpc('happyad_assistance_upsert_case',p);
    if(r.error)throw r.error;
    var remote=Array.isArray(r.data)?r.data[0]:r.data;
    if(!remote||!remote.id)return chat;
    chat.remoteCaseId=remote.id;
    chat.remoteCaseNumber=remote.case_number||chat.remoteCaseNumber||'';
    chat.remoteStatus=remote.status||'';

    var messages=(chat.messages||[]).map(messagePayload).filter(Boolean);
    if(messages.length){
      var sm=await c.rpc('happyad_assistance_sync_messages',{p_case_id:remote.id,p_messages:messages});
      if(sm.error)throw sm.error;
    }
    var waiting=chat.state==='waiting_admin'||chat.status==='waiting_admin';
    if(waiting&&clean(chat.country||context.country)&&!remote.escalated_at){
      var es=await c.rpc('happyad_assistance_escalate_case',{
        p_case_id:remote.id,p_country:chat.country||context.country,p_priority:'normal',
        p_subject:left(chat.title||'Demande Assistance',300),
        p_metadata:{admin_reason:chat.adminReason||'',build:BUILD}
      });
      if(es.error)throw es.error;
      remote=Array.isArray(es.data)?es.data[0]:es.data;
      chat.remoteStatus=remote&&remote.status||'waiting_agent';
    }
    if(chat.status==='resolved'&&remote.status!=='resolved'&&remote.status!=='closed'&&chat.closedBy!=='admin'){
      var fin=await c.rpc('happyad_assistance_user_finish_case',{p_case_id:remote.id,p_status:'resolved'});
      if(fin.error&&errText(fin.error).indexOf('CASE_ACCESS_DENIED_OR_CLOSED')<0)throw fin.error;
      chat.remoteStatus='resolved';
      chat.resolutionPending=false;
    }
    chat.remoteSyncedAt=now();
    return chat;
  }
  async function syncAll(){
    if(syncing||applyingRemote)return;
    if(isLocalWriting()){scheduleSync(240);return;}
    if(isUiQuiet()){deferForUi('sync',260);return;}
    var c=getClient();var a=api();if(!c||!a)return;
    if(!currentUser&&!(await getAuthUser()))return;
    syncing=true;
    try{
      var context=getContext(),rows=getChats(),changed=false;
      for(var i=0;i<rows.length;i++){
        var before=JSON.stringify([rows[i].remoteCaseId||'',rows[i].remoteCaseNumber||'',rows[i].remoteStatus||'']);
        rows[i]=await syncOne(rows[i],context);
        var after=JSON.stringify([rows[i].remoteCaseId||'',rows[i].remoteCaseNumber||'',rows[i].remoteStatus||'']);
        if(after!==before)changed=true;
      }
      if(changed)replaceChats(rows,a.getCurrentChatId&&a.getCurrentChatId());
      emit('HAPPYAD_ASSISTANCE_REMOTE_SYNCED_V750',{count:rows.length,at:Date.now()});
      schedulePull(80);
    }catch(error){
      console.warn('Fyblic Assistance sync V750',error);
      emit('HAPPYAD_ASSISTANCE_REMOTE_ERROR_V750',{phase:'sync',message:errText(error)});
      scheduleSync(3500);
    }finally{syncing=false}
  }
  function baseChatFromCase(row){
    var meta=row&&row.metadata&&row.metadata.local_chat||{};
    return {
      id:clean(row.client_case_id)||uid('case'),title:meta.title||row.subject||'Demande Assistance',
      status:'open',state:'root',categoryId:meta.categoryId||row.category_id||'',
      selectedCategoryId:meta.selectedCategoryId||row.category_id||'',selectedTopicId:meta.selectedTopicId||row.topic_id||'',
      country:meta.country||row.user_country||'',adminReason:meta.adminReason||'',adminHasReplied:false,
      botLocked:Boolean(meta.botLocked||['waiting_agent','assigned','answered','waiting_user','resolved','closed'].indexOf(row.status)>=0),
      resolutionPending:Boolean(meta.resolutionPending),resolvedAt:meta.resolvedAt||row.resolved_at||row.closed_at||'',
      agentName:row.assigned_agent_name||'',agentConnected:!!row.assigned_agent_id,
      agentConnectionAnnounced:!!row.assigned_agent_id,closedBy:meta.closedBy||'',
      createdAt:meta.createdAt||row.created_at||now(),updatedAt:row.updated_at||meta.updatedAt||now(),
      lastActivityAt:row.last_message_at||meta.lastActivityAt||meta.updatedAt||row.created_at||now(),messages:[],
      nextTimelineOrder:Number(meta.nextTimelineOrder||1),
      remoteCaseId:row.id,remoteCaseNumber:row.case_number||'',remoteStatus:row.status||''
    };
  }
  function genericLocalMessage(m){
    var role=m.sender_type==='user'?'user':m.sender_type==='agent'?'admin':m.sender_type==='system'?'assistant':'assistant';
    var semantic=m.event_key&&String(m.event_key).indexOf('agent-connected:')===0?'agent-connected':'';
    return {
      id:m.client_message_id||('remote-'+m.id),remoteId:m.id,role:role,text:m.body||'',time:m.created_at||now(),
      feedback:role==='admin'&&semantic!=='agent-connected',feedbackResult:'',origin:role==='admin'?'admin':'bot',
      semantic:semantic,agentName:m.sender_name||'',timelineOrder:0
    };
  }
  function mergeCase(local,row,messages){
    var chat=local||baseChatFromCase(row);
    chat.remoteCaseId=row.id;chat.remoteCaseNumber=row.case_number||chat.remoteCaseNumber||'';chat.remoteStatus=row.status||'';
    chat.title=row.subject||chat.title;chat.country=row.user_country||chat.country;chat.updatedAt=row.updated_at||chat.updatedAt;
    chat.lastActivityAt=row.last_message_at||chat.lastActivityAt||chat.createdAt||chat.updatedAt;
    chat.agentName=row.assigned_agent_name||chat.agentName||'';chat.agentConnected=!!row.assigned_agent_id;
    chat.agentConnectionAnnounced=chat.agentConnected||chat.agentConnectionAnnounced;

    var current=Array.isArray(chat.messages)?chat.messages:[];
    var byId={},byRemote={},maxOrder=0;
    current.forEach(function(message,index){
      var id=clean(message&&message.id);
      var remote=clean(message&&message.remoteId);
      if(id)byId[id]=message;if(remote)byRemote[remote]=message;
      var order=Number(message&&message.timelineOrder);
      if(Number.isFinite(order)&&order>maxOrder)maxOrder=order;
      if(!Number.isFinite(order)||order<=0){message.timelineOrder=index+1;maxOrder=Math.max(maxOrder,index+1)}
    });

    var incoming=(messages||[]).map(function(remoteMessage,index){
      var localMessage=remoteMessage&&remoteMessage.metadata&&remoteMessage.metadata.local_message?clone(remoteMessage.metadata.local_message):null;
      if(!localMessage)localMessage=genericLocalMessage(remoteMessage);
      if(remoteMessage.sender_type==='agent'){
        localMessage.role='admin';localMessage.origin='admin';localMessage.feedback=true;
        localMessage.semantic=localMessage.semantic||'agent-reply';
        localMessage.agentName=remoteMessage.sender_name||row.assigned_agent_name||'';
      }
      if(remoteMessage.sender_type==='system'&&remoteMessage.event_key&&String(remoteMessage.event_key).indexOf('agent-connected:')===0){
        localMessage.role='admin';localMessage.origin='admin';localMessage.feedback=false;
        localMessage.semantic='agent-connected';localMessage.agentName=remoteMessage.sender_name||row.assigned_agent_name||'';
        chat.agentConnected=true;chat.agentConnectionAnnounced=true;chat.agentName=localMessage.agentName;
      }
      localMessage.id=localMessage.id||remoteMessage.client_message_id||('remote-'+remoteMessage.id);
      localMessage.remoteId=remoteMessage.id;
      localMessage.time=localMessage.time||remoteMessage.created_at||now();
      localMessage.__remoteIndex=index;
      return localMessage;
    }).sort(function(left,right){
      var lo=Number(left.timelineOrder),ro=Number(right.timelineOrder);
      var lv=Number.isFinite(lo)&&lo>0?lo:Number.MAX_SAFE_INTEGER;
      var rv=Number.isFinite(ro)&&ro>0?ro:Number.MAX_SAFE_INTEGER;
      if(lv!==rv)return lv-rv;
      var time=(Date.parse(left.time||'')||0)-(Date.parse(right.time||'')||0);
      return time||left.__remoteIndex-right.__remoteIndex;
    });

    incoming.forEach(function(localMessage){
      var existing=byId[clean(localMessage.id)]||byRemote[clean(localMessage.remoteId)]||null;
      if(existing){
        existing.remoteId=localMessage.remoteId||existing.remoteId;
        if(!existing.agentName&&localMessage.agentName)existing.agentName=localMessage.agentName;
        if(existing.role==='admin'){existing.feedback=true;existing.origin='admin'}
        return;
      }
      var order=Number(localMessage.timelineOrder);
      if(!Number.isFinite(order)||order<=0){order=++maxOrder;localMessage.timelineOrder=order}
      else maxOrder=Math.max(maxOrder,order);
      delete localMessage.__remoteIndex;
      current.push(localMessage);
      byId[clean(localMessage.id)]=localMessage;
      if(localMessage.remoteId)byRemote[clean(localMessage.remoteId)]=localMessage;
    });

    /* L'ordre local est la source de vérité. Une confirmation Supabase enrichit
       les messages mais ne déplace jamais un élément déjà affiché. */
    current.sort(function(left,right){
      var lo=Number(left&&left.timelineOrder),ro=Number(right&&right.timelineOrder);
      if(Number.isFinite(lo)&&Number.isFinite(ro)&&lo!==ro)return lo-ro;
      return 0;
    });
    chat.messages=current;
    chat.nextTimelineOrder=Math.max(Number(chat.nextTimelineOrder||1),maxOrder+1);
    if(chat.messages.length){var last=chat.messages[chat.messages.length-1];chat.lastActivityAt=row.last_message_at||last.time||chat.lastActivityAt;}
    chat.adminHasReplied=chat.messages.some(function(m){return m.role==='admin'&&m.semantic!=='agent-connected'});
    var localTerminal=chat.status==='resolved'&&(chat.resolutionPending||chat.closedBy==='user'||chat.resolvedAt);
    if(['waiting_agent','assigned','answered','waiting_user'].indexOf(row.status)>=0&&!localTerminal){
      chat.status='waiting_admin';chat.state='waiting_admin';chat.botLocked=true;
      chat.messages=chat.messages.filter(function(m){return !(m.kind==='card'&&m.cardType==='resolved')});
    }
    if(row.status==='resolved'||row.status==='closed'){
      chat.status='resolved';chat.state='resolved';chat.botLocked=true;
      chat.resolutionPending=false;
      chat.resolvedAt=row.resolved_at||row.closed_at||chat.resolvedAt||row.updated_at||now();
      chat.closedBy=row.closed_by?'admin':(chat.closedBy||'user');
      var assistanceApi=api();
      if(assistanceApi&&typeof assistanceApi.ensureResolvedTimeline==='function'){
        assistanceApi.ensureResolvedTimeline(chat,{closedBy:chat.closedBy||'admin',resolvedAt:chat.resolvedAt});
      }else if(!chat.messages.some(function(m){return m.kind==='card'&&m.cardType==='resolved'})){
        chat.messages.push({id:'remote-resolved-'+row.id,role:'system',kind:'card',cardType:'resolved',time:chat.resolvedAt,timelineOrder:chat.nextTimelineOrder++});
      }
    }
    return chat;
  }
  function remoteFingerprint(cases,messages){
    return JSON.stringify({
      cases:(cases||[]).map(function(x){return [x.id,x.updated_at,x.status,x.user_unread_count,x.assigned_agent_id,x.assigned_agent_name,x.resolved_at,x.closed_at];}),
      messages:(messages||[]).map(function(m){return [m.id,m.case_id,m.client_message_id,m.sender_type,m.created_at,m.event_key,m.body,m.updated_at];})
    });
  }
  async function pullRemote(){
    if(pulling)return;
    if(isLocalWriting()){schedulePull(260);return;}
    if(isUiQuiet()){deferForUi('pull',280);return;}
    var c=getClient(),a=api();if(!c||!a)return;
    if(!currentUser&&!(await getAuthUser()))return;
    pulling=true;
    try{
      var q=await c.from('happyad_assistance_cases').select('*').eq('user_id',currentUser.id).order('updated_at',{ascending:false}).limit(200);
      if(q.error)throw q.error;
      var rawCases=q.data||[];
      for(var deletedIndex=0;deletedIndex<rawCases.length;deletedIndex++){
        var deletedRow=rawCases[deletedIndex];
        if(!isDeleted(deletedRow))continue;
        var deletionResult=await deleteRemoteCase({clientCaseId:deletedRow.client_case_id,remoteCaseId:deletedRow.id});
        if(!deletionResult||deletionResult.ok!==true){
          clearDeletedMarks({clientCaseId:deletedRow.client_case_id,remoteCaseId:deletedRow.id});
        }
      }
      var cases=rawCases.filter(function(row){return !isDeleted(row)}),ids=cases.map(function(x){return x.id}),allMessages=[];
      for(var start=0;start<ids.length;start+=80){
        var chunk=ids.slice(start,start+80);if(!chunk.length)continue;
        var mr=await c.from('happyad_assistance_messages').select('*').in('case_id',chunk).order('created_at',{ascending:true}).limit(5000);
        if(mr.error)throw mr.error;allMessages=allMessages.concat(mr.data||[]);
      }
      var grouped={};allMessages.forEach(function(m){(grouped[m.case_id]||(grouped[m.case_id]=[])).push(m)});
      var requestedCurrent=a.getCurrentChatId&&a.getCurrentChatId();
      var allLocal=getChats().filter(function(ch){return !isDeleted(ch)});
      var visibleLocal=allLocal.find(function(ch){return String(ch&&ch.id)===String(requestedCurrent)})||null;
      var ownRemoteIds=new Set(cases.map(function(row){return clean(row.id)}));
      var local=allLocal.filter(function(ch){
        var remoteId=clean(ch&&ch.remoteCaseId);
        return !remoteId||ownRemoteIds.has(remoteId)||String(ch&&ch.id)===String(requestedCurrent);
      }),map={};

      /* V851R8 : même si le snapshot serveur ne contient pas encore le dossier
         créé/synchronisé quelques millisecondes plus tôt, le fil ouvert n'est
         jamais retiré du modèle local ni remplacé par une autre demande. */
      if(visibleLocal&&!local.some(function(ch){return String(ch&&ch.id)===String(visibleLocal.id)}))local.push(visibleLocal);
      local.forEach(function(ch){map[String(ch.id)]=ch});
      cases.forEach(function(row){var key=clean(row.client_case_id);map[key]=mergeCase(map[key]||null,row,grouped[row.id]||[])});
      if(visibleLocal&&!map[String(visibleLocal.id)])map[String(visibleLocal.id)]=visibleLocal;
      var merged=Object.keys(map).map(function(k){return map[k]}).filter(function(ch){return !isDeleted(ch)}).sort(compareChats);
      var fingerprint=remoteFingerprint(cases,allMessages);
      if(initialPullDone&&fingerprint===lastFingerprint){
        emit('HAPPYAD_ASSISTANCE_REMOTE_PULLED_V750',{cases:cases.length,messages:allMessages.length,unchanged:true,at:Date.now()});
        return;
      }
      var allowCurrentSwitch=false;
      if(!initialPullDone&&cases.length){
        var initialLocal=local.find(function(x){return String(x.id)===String(requestedCurrent)});
        var pristine=initialLocal&&initialLocal.state==='root'&&initialLocal.status==='open'&&
          (initialLocal.messages||[]).length<=2&&!(initialLocal.messages||[]).some(function(m){return m.role==='user'&&clean(m.text)});
        if(pristine){requestedCurrent=cases[0].client_case_id||requestedCurrent;allowCurrentSwitch=true;}
      }
      replaceChats(merged,requestedCurrent,{allowCurrentSwitch:allowCurrentSwitch});initialPullDone=true;lastFingerprint=fingerprint;
      var currentId=requestedCurrent,current=merged.find(function(x){return String(x.id)===String(currentId)});
      if(current&&current.remoteCaseId&&!document.hidden){
        var row=cases.find(function(x){return x.id===current.remoteCaseId});
        if(row&&Number(row.user_unread_count)>0){
          var last=(grouped[row.id]||[]).slice(-1)[0];
          var lastId=last&&last.id||'';
          if(lastId&&lastMarkedReadByCase[row.id]!==lastId){
            lastMarkedReadByCase[row.id]=lastId;
            c.rpc('happyad_assistance_mark_read',{p_case_id:row.id,p_last_message_id:lastId}).then(function(result){
              if(result&&result.error)delete lastMarkedReadByCase[row.id];
            });
          }
        }
      }
      emit('HAPPYAD_ASSISTANCE_REMOTE_PULLED_V750',{cases:cases.length,messages:allMessages.length,at:Date.now()});
    }catch(error){
      console.warn('Fyblic Assistance pull V750',error);
      emit('HAPPYAD_ASSISTANCE_REMOTE_ERROR_V750',{phase:'pull',message:errText(error)});
      schedulePull(3500);
    }finally{pulling=false}
  }
  function persistDeletedChats(rows){
    try{localStorage.setItem(DELETED_CHATS_KEY,JSON.stringify(rows||{}))}catch(_e){}
  }
  function clearDeletedMarks(detail){
    var rows=deletedChats(),changed=false;
    var clientId=clean(detail&&detail.clientCaseId),remoteId=clean(detail&&detail.remoteCaseId);
    if(clientId&&Object.prototype.hasOwnProperty.call(rows,'client:'+clientId)){delete rows['client:'+clientId];changed=true}
    if(remoteId&&Object.prototype.hasOwnProperty.call(rows,'remote:'+remoteId)){delete rows['remote:'+remoteId];changed=true}
    if(changed)persistDeletedChats(rows);
  }
  async function resolveRemoteCaseId(c,detail){
    var ownerId=clean(currentUser&&currentUser.id);
    if(!ownerId)return '';
    var remoteId=clean(detail&&detail.remoteCaseId);
    if(remoteId){
      var direct=await c.from('happyad_assistance_cases').select('id').eq('id',remoteId).eq('user_id',ownerId).limit(1);
      if(direct.error)throw direct.error;
      if(direct.data&&direct.data.length)return clean(direct.data[0].id);
    }
    var clientId=clean(detail&&detail.clientCaseId);if(!clientId)return '';
    var query=await c.from('happyad_assistance_cases').select('id').eq('client_case_id',clientId).eq('user_id',ownerId).limit(1);
    if(query.error)throw query.error;
    return clean(query.data&&query.data[0]&&query.data[0].id);
  }
  async function remoteCaseIsGone(c,remoteId){
    var ownerId=clean(currentUser&&currentUser.id);
    for(var attempt=0;attempt<3;attempt++){
      var check=c.from('happyad_assistance_cases').select('id').eq('id',remoteId);
      if(ownerId)check=check.eq('user_id',ownerId);
      check=await check.limit(1);
      if(check.error)throw check.error;
      if(!check.data||!check.data.length)return true;
      await new Promise(function(resolve){setTimeout(resolve,attempt===0?90:180)});
    }
    return false;
  }
  async function deleteRemoteCase(detail){
    detail=detail||{};
    var c=getClient();if(!c)return {ok:false,code:'client_unavailable',message:'Supabase indisponible'};
    if(!currentUser&&!(await getAuthUser()))return {ok:false,code:'auth_required',message:'Session utilisateur indisponible'};
    var clientId=clean(detail.clientCaseId),remoteId='';
    try{
      remoteId=await resolveRemoteCaseId(c,detail);
      if(!remoteId){
        clearDeletedMarks({clientCaseId:clientId});
        return {ok:true,deleted:false,reason:'not_found',clientCaseId:clientId,remoteCaseId:''};
      }
      var result=await c.rpc('happyad_assistance_user_hard_delete_case_v851r6b',{p_case_id:remoteId});
      if(result.error)throw result.error;
      var payload=result&&result.data;
      if(Array.isArray(payload))payload=payload[0]||null;
      if(!payload||payload.ok!==true){
        return {ok:false,code:clean(payload&&payload.code)||'delete_rejected',message:clean(payload&&payload.code)||'Suppression refusee par le serveur',clientCaseId:clientId,remoteCaseId:remoteId};
      }
      var gone=await remoteCaseIsGone(c,remoteId);
      if(!gone)return {ok:false,code:'not_deleted',message:'La discussion existe encore sur le serveur',clientCaseId:clientId,remoteCaseId:remoteId};
      clearDeletedMarks({clientCaseId:clientId,remoteCaseId:remoteId});
      schedulePull(80);
      emit('HAPPYAD_ASSISTANCE_REMOTE_DELETED_V851R6',{clientCaseId:clientId,remoteCaseId:remoteId,at:Date.now()});
      return {ok:true,deleted:true,clientCaseId:clientId,remoteCaseId:remoteId};
    }catch(error){
      var message=errText(error);
      console.warn('Fyblic Assistance delete V851R6',error);
      return {ok:false,code:message.indexOf('PGRST202')>=0?'rpc_missing':'server_error',message:message,clientCaseId:clientId,remoteCaseId:remoteId};
    }
  }
  async function flushRemoteDeletions(){
    var deleted=deletedChats(),keys=Object.keys(deleted);
    var remoteIds=keys.filter(function(key){return key.indexOf('remote:')===0}).map(function(key){return key.slice(7)});
    var clientIds=keys.filter(function(key){return key.indexOf('client:')===0}).map(function(key){return key.slice(7)});
    for(var i=0;i<remoteIds.length;i++){
      var remoteResult=await deleteRemoteCase({remoteCaseId:remoteIds[i]});
      if(!remoteResult||remoteResult.ok!==true)clearDeletedMarks({remoteCaseId:remoteIds[i]});
    }
    for(var j=0;j<clientIds.length;j++){
      var clientResult=await deleteRemoteCase({clientCaseId:clientIds[j]});
      if(!clientResult||clientResult.ok!==true)clearDeletedMarks({clientCaseId:clientIds[j]});
    }
  }
  function scheduleSync(delay){
    clearTimeout(syncTimer);syncTimer=setTimeout(syncAll,Math.max(80,Number(delay||260)));
  }
  function schedulePull(delay){clearTimeout(pullTimer);pullTimer=setTimeout(pullRemote,Math.max(100,Number(delay||220)))}
  function stopRealtime(){
    clearTimeout(reconnectTimer);reconnectTimer=0;
    try{if(channel&&client)client.removeChannel(channel)}catch(_e){}channel=null;
  }
  function scheduleReconnect(delay){
    clearTimeout(reconnectTimer);
    reconnectTimer=setTimeout(function(){
      if(!currentUser||document.hidden)return;
      startRealtime();schedulePull(80);scheduleSync(140);
    },Math.max(500,Number(delay||1200)));
  }
  function startRealtime(){
    var c=getClient();if(!c||!currentUser)return;
    stopRealtime();
    var generation=++channelGeneration;
    channel=c.channel('happyad-assistance-user-v750-'+currentUser.id+'-'+generation)
      .on('postgres_changes',{event:'*',schema:'public',table:'happyad_assistance_cases'},function(){schedulePull(isUiQuiet()?420:140)})
      .on('postgres_changes',{event:'*',schema:'public',table:'happyad_assistance_messages'},function(){schedulePull(isUiQuiet()?420:120)})
      .subscribe(function(status){
        emit('HAPPYAD_ASSISTANCE_REALTIME_STATUS_V750',{status:status,at:Date.now()});
        if(status==='SUBSCRIBED'){schedulePull(40);return}
        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'||status==='CLOSED')scheduleReconnect(1400);
      });
  }
  async function start(){
    if(started)return;var a=api();if(!a){retryTimer=setTimeout(start,120);return}
    var c=getClient();if(!c){retryTimer=setTimeout(start,350);return}
    var user=await getAuthUser();if(!user){retryTimer=setTimeout(start,700);return}
    started=true;startRealtime();await flushRemoteDeletions();await pullRemote();scheduleSync(120);
    try{
      c.auth.onAuthStateChange(function(_event,session){
        var next=session&&session.user||null;
        if(!next){currentUser=null;started=false;stopRealtime();return}
        if(!currentUser||next.id!==currentUser.id){currentUser=next;startRealtime();schedulePull(40);scheduleSync(100)}
      });
    }catch(_e){}
  }

  window.addEventListener('HAPPYAD_ASSISTANCE_LOCAL_CHANGED_V40',function(){scheduleSync(isLocalWriting()?260:120)});
  window.addEventListener('HAPPYAD_ASSISTANCE_CHAT_DELETE_REQUEST_V851R6',async function(event){
    var detail=event&&event.detail||{},requestId=clean(detail.requestId);
    var result=await deleteRemoteCase(detail);
    emit('HAPPYAD_ASSISTANCE_CHAT_DELETE_RESULT_V851R6',Object.assign({},result,{requestId:requestId,at:Date.now()}));
  });
  window.addEventListener('HAPPYAD_ASSISTANCE_CHAT_DELETED_V745',function(event){deleteRemoteCase(event&&event.detail||{});schedulePull(40)});
  window.addEventListener('HAPPYAD_ASSISTANCE_WRITING_FINISHED_V745',function(){scheduleSync(80);schedulePull(320)});
  window.addEventListener('HAPPYAD_ASSISTANCE_WRITING_FINISHED_V750',function(){scheduleSync(80);schedulePull(320)});
  window.addEventListener('HAPPYAD_ASSISTANCE_CONTEXT_CHANGED_V40',function(){scheduleSync(100);schedulePull(80)});
  window.addEventListener('focus',function(){schedulePull(isUiQuiet()?520:220)});
  window.addEventListener('online',function(){start();flushRemoteDeletions();schedulePull(40);scheduleSync(80)});
  document.addEventListener('visibilitychange',function(){if(!document.hidden){if(!channel)startRealtime();schedulePull(80);scheduleSync(140)}});
  window.HappyadAssistanceRealtimeV750=window.HappyadAssistanceRealtimeV749=Object.freeze({build:BUILD,start:start,sync:syncAll,pull:pullRemote,deleteCase:deleteRemoteCase,isConnected:function(){return !!(started&&currentUser&&channel)}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
