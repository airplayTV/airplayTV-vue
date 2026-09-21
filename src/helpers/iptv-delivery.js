const fragmentPrefix = 'https://iptv.invalid/segment/'

// One bounded map per playback session. These identities never go over the network:
// the loader translates them back to the current CDN URL before downloading.
export const createDirectLoader = BaseLoader => {
  const targets = new Map()
  return class DirectLoader extends BaseLoader {
    load(context, config, callbacks) {
      let url = context.url
      if (url.startsWith(fragmentPrefix)) {
        url = targets.get(url)
        if (!url) {
          callbacks.onError({code: 0, text: 'Expired live segment identity'}, context, null, this.stats)
          return
        }
      }
      super.load({...context, url}, config, {
        ...callbacks,
        onSuccess: (response, ...args) => {
          if (typeof response.data === 'string' && response.data.startsWith('#EXTM3U') && response.data.includes('#EXTINF:')) {
            const playlist = new URL(context.url)
            // A single media playlist is first loaded as "manifest", then as
            // "level" on refresh. Those must share the same identity namespace.
            const kind = ['audioTrack', 'subtitleTrack'].includes(context.type) ? context.type : 'main'
            const scope = encodeURIComponent(`${playlist.origin}${playlist.pathname}:${kind}`)
            let sequence = BigInt(response.data.match(/#EXT-X-MEDIA-SEQUENCE:(\d+)/)?.[1] || '0')
            const data = response.data.split('\n').map(line => {
              const value = line.trim()
              if (!value || value.startsWith('#')) return line
              const identity = `${fragmentPrefix}${scope}/${sequence++}`
              targets.set(identity, new URL(value, response.url || url).href)
              while (targets.size > 2048) targets.delete(targets.keys().next().value)
              return identity
            }).join('\n')
            response = {...response, data}
          }
          callbacks.onSuccess(response, ...args)
        },
      })
    }
  }
}

const directLoadErrors = new Set([
  'fragLoadError', 'fragLoadTimeOut', 'keyLoadError', 'keyLoadTimeOut',
  'manifestLoadError', 'manifestLoadTimeOut', 'levelLoadError', 'levelLoadTimeOut',
  'levelParsingError',
])

// Direct -> proxy -> visible error. Never oscillate or keep old engine callbacks alive.
export const createLiveDelivery = ({Hls, video, url, proxyUrl, onMode, onError, now = Date.now}) => {
  let engine = null
  let mode = 'direct'
  let closed = false
  let failed = false
  let lastProgress = now()
  let lastTime = video.currentTime
  const stop = () => { const previous = engine; engine = null; previous?.destroy() }
  const fail = () => {
    if (closed || failed) return
    failed = true
    stop()
    video.pause?.()
    onError()
  }
  const recover = () => {
    if (closed || failed) return
    if (mode === 'proxy') { fail(); return }
    mode = 'proxy'
    load()
  }
  const load = () => {
    const resume = !(video.readyState >= 2 && video.paused)
    stop()
    lastTime = video.currentTime
    lastProgress = now()
    const target = mode === 'direct' ? url : proxyUrl
    onMode(mode, target)
    if (Hls.isSupported()) {
      const instance = new Hls(mode === 'direct' ? {loader: createDirectLoader(Hls.DefaultConfig.loader)} : {})
      engine = instance
      instance.on(Hls.Events.ERROR, (_, data) => {
        if (closed || failed || engine !== instance) return
        if (mode === 'direct' && (data.fatal || directLoadErrors.has(data.details))) recover()
        else if (data.fatal) fail()
      })
      instance.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!closed && !failed && engine === instance && resume) video.play().catch(() => {})
      })
      instance.loadSource(target)
      instance.attachMedia(video)
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = target
      if (resume) video.play().catch(() => { /* Autoplay rejection is not a delivery error. */ })
    } else fail()
  }
  load()
  return {
    mediaError: recover,
    tick() {
      if (closed || failed) return
      if ((video.readyState >= 2 && video.paused) || video.currentTime !== lastTime) {
        lastTime = video.currentTime
        lastProgress = now()
      } else if (now() - lastProgress >= 20000) recover()
    },
    get liveSyncPosition() { return engine?.liveSyncPosition },
    destroy() { closed = true; stop() },
  }
}
