const test=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
function setup(){
 class Media extends EventTarget{
  constructor(){super();this.isConnected=true;this.dataset={};this.paused=false;this.currentTime=23.456;this.duration=80;this.readyState=2;this.seeking=false;this.src='720.mp4';this.muted=false;this.volume=.4;this.playbackRate=1.25;}
  get currentSrc(){return this.src;} pause(){this.paused=true;}play(){this.paused=false;return Promise.resolve();}load(){}removeAttribute(){this.src='';} emit(name){this.dispatchEvent(new Event(name));}
 }
 const probes=[];const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../core/video-source-switch-v1125.js'),'utf8'),{window,document:{createElement(){const m=new Media();probes.push(m);return m;}},setTimeout,clearTimeout,Promise,Number,Object,String});
 return {video:new Media(),probes,switchSource:window.FyblicVideoSwitchV1125.switchSource};
}
test('upgrade while playing preserves exact time, volume and speed',async()=>{
 const {video,probes,switchSource}=setup();const promise=switchSource(video,'1080.mp4');
 assert.equal(video.src,'720.mp4');assert.equal(video.paused,false);
 video.currentTime=29.875;probes[0].emit('loadeddata');video.currentTime=0;video.emit('loadedmetadata');
 assert.equal(await promise,true);assert.equal(video.currentTime,29.875);assert.equal(video.paused,false);assert.equal(video.volume,.4);assert.equal(video.playbackRate,1.25);
});
test('paused video stays paused',async()=>{const {video,probes,switchSource}=setup();video.paused=true;const p=switchSource(video,'1080.mp4');probes[0].emit('loadeddata');video.emit('loadedmetadata');assert.equal(await p,true);assert.equal(video.paused,true);});
test('failed preflight keeps original playing',async()=>{const {video,probes,switchSource}=setup();const p=switchSource(video,'bad.mp4');probes[0].emit('error');assert.equal(await p,false);assert.equal(video.src,'720.mp4');assert.equal(video.paused,false);});
test('failed target restores original at saved time',async()=>{const {video,probes,switchSource}=setup();const p=switchSource(video,'bad.mp4');probes[0].emit('loadeddata');video.emit('error');assert.equal(video.src,'720.mp4');video.currentTime=0;video.emit('loadedmetadata');assert.equal(await p,false);assert.equal(video.currentTime,23.456);assert.equal(video.paused,false);});
test('manual choice changed during preload blocks stale auto upgrade',async()=>{const {video,probes,switchSource}=setup();let preference='auto';const p=switchSource(video,'1080.mp4',{allowed:()=>preference==='auto'});preference='720p';probes[0].emit('loadeddata');assert.equal(await p,false);assert.equal(video.src,'720.mp4');});
test('detached reader cannot resume',async()=>{const {video,probes,switchSource}=setup();const p=switchSource(video,'1080.mp4');video.isConnected=false;probes[0].emit('loadeddata');assert.equal(await p,false);assert.equal(video.src,'720.mp4');});
