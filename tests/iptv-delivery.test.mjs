import assert from 'node:assert/strict'
import test from 'node:test'
import * as delivery from '../src/helpers/iptv-delivery.js'

test('rotating CDN paths keep sequence identity while downloading the latest upstream URL', () => {
  class Loader {
    load(context, config, callbacks) { this.loaded = context; this.callbacks = callbacks }
  }
  const DirectLoader = delivery.createDirectLoader(Loader)
  const loader = new DirectLoader()
  let first, second
  const manifest = url => `#EXTM3U\n#EXT-X-MEDIA-SEQUENCE:123\n#EXTINF:3,\n${url}\n`
  loader.load({url:'https://api.test/live/a.m3u8',type:'manifest'}, {}, {onSuccess: response => { first = response.data.trim().split('\n').at(-1) }})
  loader.callbacks.onSuccess({url:'https://api.test/live/a.m3u8',data:manifest('https://a.cctv.cn/signed1/123.ts')},{},{},{})
  loader.load({url:'https://api.test/live/a.m3u8',type:'level',level:0,id:0}, {}, {onSuccess: response => { second = response.data.trim().split('\n').at(-1) }})
  loader.callbacks.onSuccess({url:'https://api.test/live/a.m3u8',data:manifest('https://b.cctv.cn/signed2/123.ts')},{},{},{})
  assert.equal(first,second)
  const audio = new DirectLoader()
  let audioIdentity
  audio.load({url:'https://api.test/live/audio.m3u8',type:'audioTrack'}, {}, {onSuccess: response => { audioIdentity=response.data.trim().split('\n').at(-1) }})
  audio.callbacks.onSuccess({url:'https://api.test/live/audio.m3u8',data:manifest('https://b.cctv.cn/audio.aac')},{},{},{})
  assert.notEqual(audioIdentity,second)
  const fragmentLoader = new DirectLoader()
  fragmentLoader.load({url:second}, {}, {})
  assert.equal(fragmentLoader.loaded.url,'https://b.cctv.cn/signed2/123.ts')
  const otherSession = delivery.createDirectLoader(Loader)
  const isolated = new otherSession()
  let failure
  isolated.load({url:second},{},{onError: error => { failure=error }})
  assert.ok(failure, 'unmapped synthetic URLs must fail locally, never go to the API')
})

function harness() {
  const instances=[]; const modes=[]; const errors=[];let now=0
  class Hls {
    static Events={ERROR:'error',MANIFEST_PARSED:'parsed'}
    static DefaultConfig={loader:class {}}
    static isSupported(){return true}
    constructor(config){this.config=config;instances.push(this)}
    on(event,cb){if(event==='error')this.error=cb;else this.parsed=cb}
    loadSource(url){this.url=url}
    attachMedia(){}
    destroy(){this.destroyed=true}
  }
  const video={readyState:0,currentTime:0,paused:false,ended:false,play:()=>Promise.resolve()}
  const player=delivery.createLiveDelivery({Hls,video,url:'https://api.test/live/a.m3u8',proxyUrl:'https://api.test/live/a.m3u8?web=1',onMode:(...args)=>modes.push(args),onError:()=>errors.push(true),now:()=>now})
  return {player,video,instances,modes,errors,time:value=>{now=value}}
}
test('direct fragment 403 switches once, ignores stale callbacks, proxy fatal reports failure',()=>{
  const h=harness()
  assert.equal(h.instances[0].url,'https://api.test/live/a.m3u8')
  h.instances[0].error(null,{fatal:false,details:'fragLoadError',response:{code:403}})
  assert.equal(h.instances.length,2)
  assert.equal(h.instances[0].destroyed,true)
  assert.equal(h.instances[1].url,'https://api.test/live/a.m3u8?web=1')
  h.instances[0].error(null,{fatal:true,details:'levelParsingError'})
  assert.equal(h.errors.length,0)
  h.instances[1].error(null,{fatal:true})
  assert.equal(h.errors.length,1)
  assert.equal(h.instances.length,2)
  h.player.destroy();h.player.mediaError()
  assert.equal(h.errors.length,1)
})
test('startup/stall timeout falls back; user pause never triggers fallback',()=>{
  const h=harness()
  h.time(21000);h.player.tick()
  assert.equal(h.instances.length,2)
  h.player.destroy()
  const paused=harness();paused.video.readyState=4;paused.video.paused=true
  paused.time(60000);paused.player.tick()
  assert.equal(paused.instances.length,1)
  paused.video.paused=false;paused.time(81000);paused.player.tick()
  assert.equal(paused.instances.length,2)
  paused.player.destroy()
})

test('native HLS uses the same one-way fallback and rejects callbacks after disposal',()=>{
  const modes=[], errors=[]
  const video={currentTime:0,readyState:0,paused:false,canPlayType:()=>true,play:()=>Promise.resolve()}
  const controller=delivery.createLiveDelivery({Hls:{isSupported:()=>false},video,url:'direct',proxyUrl:'proxy',onMode:mode=>modes.push(mode),onError:()=>errors.push(true)})
  assert.equal(video.src,'direct')
  controller.mediaError();assert.equal(video.src,'proxy')
  controller.mediaError();assert.equal(errors.length,1)
  controller.destroy();controller.mediaError()
  assert.deepEqual(modes,['direct','proxy'])
  assert.equal(errors.length,1)
})
