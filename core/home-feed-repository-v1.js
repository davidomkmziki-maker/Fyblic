/* Fyblic HOME FEED REPOSITORY V1
   Acces distant unique aux lignes happyad_posts utilisees par l'Accueil.
   Aucune responsabilite DOM, rendu, cache visuel ou actions. */
(function(){
  'use strict';
  var VERSION='V2_BATCH_COMPLETE_REPOSITORY';
  var bridge=null;

  function connect(adapter){bridge=adapter||null;return api;}
  function client(){
    try{
      if(bridge&&typeof bridge.getClient==='function')return bridge.getClient()||null;
      if(typeof window.happyadSb==='function')return window.happyadSb()||null;
      return window.happyadSupabase||null;
    }catch(_e){return null;}
  }
  function text(v){return String(v==null?'':v).trim();}
  function cursorDate(row){
    try{
      var raw=row&&(row.created_at||row.createdAt||row.timestamp||row.time||row.date)||'';
      if(typeof raw==='number'||/^\d+$/.test(String(raw))){var n=Number(raw);if(n>0)return new Date(n>100000000000?n:n*1000).toISOString();}
      var d=new Date(raw);return isNaN(d.getTime())?'':d.toISOString();
    }catch(_e){return '';}
  }
  function cursorFromRows(rows){
    try{var r=(rows||[])[(rows||[]).length-1]||null;if(!r)return null;var at=cursorDate(r),id=text(r.id);return at&&id?{created_at:at,id:id}:null;}catch(_e){return null;}
  }
  function applyCursor(q,cursor){
    try{
      if(!q||!cursor||!cursor.created_at||!cursor.id)return q;
      return q.or('created_at.lt.'+cursor.created_at+',and(created_at.eq.'+cursor.created_at+',id.lt.'+cursor.id+')');
    }catch(_e){return q;}
  }
  function basePostsQuery(c){
    return c.from('happyad_posts').select('*').is('deleted_at',null).order('created_at',{ascending:false}).order('id',{ascending:false});
  }
  function normalizeLimit(v,fallback){v=Math.floor(Number(v)||0);return Math.max(1,Math.min(200,v||fallback||20));}
  function rowTime(row){try{var d=Date.parse(String(row&&row.created_at||''));return Number.isFinite(d)?d:0;}catch(_e){return 0;}}
  function compareRows(a,b){var ta=rowTime(a),tb=rowTime(b);if(ta!==tb)return tb-ta;return text(b&&b.id).localeCompare(text(a&&a.id));}
  function batchId(row){return text(row&&(row.batch_id||row.batchId));}
  async function completeBoundaryBatch(c,page){
    page=Array.isArray(page)?page.slice():[];if(!page.length)return page;
    var bid=batchId(page[page.length-1]);if(!bid)return page;
    try{
      var r=await c.from('happyad_posts').select('*').eq('batch_id',bid).is('deleted_at',null).order('group_index',{ascending:true}).limit(18);
      if(r&&r.error)throw r.error;
      var seen=Object.create(null),all=[];
      page.concat((r&&r.data)||[]).forEach(function(x){var id=text(x&&x.id);if(!id||seen[id])return;seen[id]=1;all.push(x);});
      all.sort(compareRows);return all;
    }catch(_e){return page;}
  }

  async function fetchHead(options){
    options=options||{};
    var c=client();if(!c)return {rows:[],cursor:null,done:false,error:new Error('Supabase indisponible')};
    var userOnly=options.userOnly===true;
    var pageSize=normalizeLimit(options.pageSize,userOnly?18:20);
    var probe=normalizeLimit(options.probe,userOnly?pageSize:pageSize+1);
    if(probe<pageSize)probe=pageSize;
    var uid=text(options.userId);
    if(userOnly&&!uid)return {rows:[],cursor:null,done:true,error:null};
    try{
      var q=basePostsQuery(c).limit(probe);
      if(userOnly)q=q.eq('user_id',uid);
      var result=await q;
      if(result&&result.error)throw result.error;
      var rows=(result&&result.data)||[];
      var page=rows.slice(0,pageSize);
      page=await completeBoundaryBatch(c,page);
      return {rows:rows,page:page,cursor:cursorFromRows(page),done:rows.length<=pageSize,error:null};
    }catch(error){return {rows:[],page:[],cursor:null,done:false,error:error};}
  }

  async function fetchPage(cursor,options){
    options=options||{};
    var c=client();if(!c)return {rows:[],error:new Error('Supabase indisponible')};
    var pageSize=normalizeLimit(options.pageSize,20);
    var probe=normalizeLimit(options.probe,pageSize+1);if(probe<pageSize)probe=pageSize;
    try{
      var q=basePostsQuery(c).limit(probe);
      q=applyCursor(q,cursor);
      var result=await q;
      if(result&&result.error)throw result.error;
      var rows=(result&&result.data)||[];
      var page=rows.slice(0,pageSize);
      page=await completeBoundaryBatch(c,page);
      return {rows:rows,page:page,cursor:cursorFromRows(page),done:rows.length<=pageSize,error:null};
    }catch(error){return {rows:[],error:error};}
  }

  async function fetchDeletedIds(options){
    options=options||{};
    var c=client();if(!c)return {ids:[],rows:[],error:new Error('Supabase indisponible')};
    var limit=normalizeLimit(options.limit,300);
    try{
      var result=await c.from('happyad_posts').select('id,deleted_at').not('deleted_at','is',null).order('deleted_at',{ascending:false}).limit(limit);
      if(result&&result.error)throw result.error;
      var rows=(result&&result.data)||[];
      return {ids:rows.map(function(x){return text(x&&x.id);}).filter(Boolean),rows:rows,error:null};
    }catch(error){return {ids:[],rows:[],error:error};}
  }

  async function fetchById(id){
    id=text(id);if(!id)return {row:null,error:null};
    var c=client();if(!c)return {row:null,error:new Error('Supabase indisponible')};
    try{
      var result=await c.from('happyad_posts').select('*').eq('id',id).is('deleted_at',null).maybeSingle();
      if(result&&result.error)throw result.error;
      return {row:(result&&result.data)||null,error:null};
    }catch(error){return {row:null,error:error};}
  }

  async function fetchByIds(ids){
    var clean=[],seen=Object.create(null);
    (ids||[]).forEach(function(v){v=text(v);if(v&&!seen[v]){seen[v]=1;clean.push(v);}});
    if(!clean.length)return {rows:[],error:null};
    var c=client();if(!c)return {rows:[],error:new Error('Supabase indisponible')};
    try{
      var result=await c.from('happyad_posts').select('*').in('id',clean).is('deleted_at',null);
      if(result&&result.error)throw result.error;
      return {rows:(result&&result.data)||[],error:null};
    }catch(error){return {rows:[],error:error};}
  }

  var api={version:VERSION,connect:connect,cursorDate:cursorDate,cursorFromRows:cursorFromRows,applyCursor:applyCursor,fetchHead:fetchHead,fetchPage:fetchPage,fetchDeletedIds:fetchDeletedIds,fetchById:fetchById,fetchByIds:fetchByIds};
  window.HappyHomeFeedRepositoryV1=api;
  try{if(window.HappyMasterRegistry)window.HappyMasterRegistry.register('home-feed-repository-v1',{file:'core/home-feed-repository-v1.js',responsibility:'acces Supabase unique aux publications de l Accueil, tete, curseur, pages, suppressions et lecture ciblee',active:true,version:VERSION});}catch(_e){}
})();
