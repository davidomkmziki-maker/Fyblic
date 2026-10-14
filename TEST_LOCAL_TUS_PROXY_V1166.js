// Test isolé du moteur navigateur, exécutable avec `node TEST_LOCAL_TUS_PROXY_V1166.js`.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
(async()=>{
  const BASE='https://fyblic-media-worker-production.up.railway.app';
  const direct='https://testproj.storage.supabase.co/storage/v1/upload/resumable/uploadID';
  const proxy=BASE+'/api/v2/publications/12345678-1234-1234-1234-123456789abc/tus';
  const directSuccess=process.argv.includes('--direct-success');
  const ackWithoutResponse=process.argv.includes('--ack-without-response');
  let seen=[],confirmed=0;
  const map=new Map();
  const localStorage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
  const ready={enabled:true,ready:true,schemaReady:true,schemaVersion:1158,protocolVersion:1082,uploadMode:'direct-tus-binary',capabilities:{normal:true,story:true,boutique:true,album:true,groupAssets:true,groupFinalize:true,postMediaSafe:true,yieldingOptimization:true,posterBeforePrimary:true}};
  const job={id:'12345678-1234-1234-1234-123456789abc',status:'uploading',post_id:'post123',publication_group_id:'group123',original_bytes:3,progress:1,upload:{protocol:'tus',mode:'direct-binary',url:direct,offset:0,chunkBytes:6*1024*1024,tusVersion:'1.0.0',apiKey:'public-key'}};
  async function fetchMock(url,options={}) {
    let path=String(url);
    seen.push([options.method||'GET',path]);
    if(path.endsWith('/health')) return new Response(JSON.stringify({ok:true,pipelineV2:ready}),{status:200});
    if(path===direct&&options.method==='HEAD')return new Response(null,{status:200,headers:{'Upload-Offset':String(confirmed)}});
    if(path===proxy&&options.method==='HEAD')return new Response(null,{status:200,headers:{'Upload-Offset':String(confirmed)}});
    if(path.endsWith('/api/v2/publications')&&options.method==='POST')return new Response(JSON.stringify(job),{status:201});
    if(path.endsWith('/complete')&&options.method==='POST')return new Response(JSON.stringify({...job,status:'published',progress:100,primary_ready:true}),{status:202});
    if(path.includes('/api/v2/publications/')&&(options.method||'GET')==='GET')return new Response(JSON.stringify({...job,status:'published',progress:100,primary_ready:true}),{status:200});
    throw Error('Unmocked '+path+' '+options.method);
  }
  class FakeXHR {
    constructor(){this.upload={};this.status=0;this.headers={};}
    open(method,url){this.method=method;this.url=url;seen.push([method,url]);}
    setRequestHeader(k,v){this.headers[k]=v;}
    getResponseHeader(k){return k==='Upload-Offset'?String(confirmed):null;}
    send(blob){queueMicrotask(()=>{if(this.url===direct){if(directSuccess){confirmed=blob.size;this.status=204;this.onload();}else{if(ackWithoutResponse)confirmed=blob.size;this.onerror();}}else if(this.url===proxy){confirmed=blob.size;this.status=204;this.onload();}else throw Error('Unexpected XHR destination');});}
    abort(){if(this.onabort)this.onabort();}
  }
  const window={FYBLIC_MEDIA_COMPRESSOR_URL:BASE, HappySupabaseClientMasterV972:{get:()=>({auth:{getSession:async()=>({data:{session:{access_token:'testtoken',user:{id:'user-1'}}}})}})},addEventListener(){},dispatchEvent(){} };window.parent=window;
  const document={readyState:'loading',addEventListener(){}};
  const ctx={window,document,localStorage,fetch:fetchMock,XMLHttpRequest:FakeXHR,Response,Blob,Promise,setTimeout,clearTimeout,CustomEvent:class CustomEvent {constructor(k,o){this.type=k;this.detail=o.detail;}},crypto:{randomUUID:()=> '12345678-1234-1234-1234-123456789abc'},console,Date};
  vm.runInNewContext(fs.readFileSync(__dirname+'/core/publication-engine-v1082.js','utf8'),ctx);
  const f=new Blob(['abc'],{type:'image/jpeg'});f.name='sample.jpg';f.lastModified=123;
  const result=await window.FyblicPublicationEngineV1082.submitMany([f],{groupId:'group123',postId:'post123',publicationType:'normal',uploadConcurrency:1});
  assert.equal(result.used,true);
  await Promise.all([result.visibleCompletion,result.completion]);
  assert.deepEqual(seen.filter(x=>x[0]==='PATCH').map(x=>x[1]),directSuccess||ackWithoutResponse?[direct]:[direct,proxy]);
  assert.equal(confirmed,3);
  console.log('OK - '+(directSuccess?'PATCH direct maintenu':ackWithoutResponse?'réponse perdue : la position réelle évite une retransmission':'échec direct -> relais Railway')+', finalisation une seule fois.');
})().catch(error=>{console.error(error);process.exit(1);});
