import assert from 'node:assert/strict'
import test from 'node:test'
import {startLivePlayback} from '../src/helpers/iptv-playback.js'
import {createLiveDelivery} from '../src/helpers/iptv-delivery.js'
import {liveLineSelector} from '../src/helpers/iptv-presentation.js'

test('alternate line controls preserve IDs and escape labels', () => {
 const items=liveLineSelector([{id:'a',name:'A'},{id:'b',name:'<img>'}], 'b')
 assert.deepEqual(items.map(x=>x.default),[false,true])
 assert.equal(items[1].html,'&lt;img&gt;');assert.equal(items[1].id,'b')
})

test('source policy defaults direct and never invents a proxy URL', async () => {
 for (const delivery_mode of [undefined, 'direct', 'invalid']) {
  const result = await startLivePlayback({video:{id:'a',links:[{id:'line'}]},loadSource:async()=>({data:{url:'https://cdn.test/a.m3u8',type:'hls',delivery_mode}})})
  assert.equal(result.proxyUrl, undefined)
 }
})
test('direct-only error stops without loading an undefined proxy', () => {
 const modes=[];let errors=0
 const video={currentTime:0,readyState:0,paused:false,canPlayType:()=>true,play:()=>Promise.resolve(),pause(){}}
 const player=createLiveDelivery({Hls:{isSupported:()=>false},video,url:'direct',onMode:m=>modes.push(m),onError:()=>errors++})
 player.mediaError()
 assert.deepEqual(modes,['direct']); assert.equal(errors,1)
 player.destroy()
})

test('auto uses only explicit fallback; proxy starts at supplied URL without direct retry', async () => {
 for (const delivery_mode of ['auto', 'proxy']) {
  const source = {url:'https://api.test/api/iptv/live/a.m3u8?web=1',type:'hls',delivery_mode,proxy_url:'https://api.test/explicit'}
  const result = await startLivePlayback({video:{id:'a',links:[{id:'line'}]},loadSource:async()=>({data:source})})
  assert.equal(result.url, source.url)
  assert.equal(result.proxyUrl, delivery_mode === 'auto' ? source.proxy_url : undefined)
 }
 const modes=[];let errors=0
 const video={currentTime:0,readyState:0,paused:false,canPlayType:()=>true,play:()=>Promise.resolve(),pause(){}}
 const player=createLiveDelivery({Hls:{isSupported:()=>false},video,url:'proxy',initialMode:'proxy',onMode:m=>modes.push(m),onError:()=>errors++})
 assert.equal(video.src,'proxy');player.mediaError()
 assert.deepEqual(modes,['proxy']);assert.equal(errors,1);player.destroy()
})
