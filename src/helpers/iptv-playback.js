import {sendCastingCommand} from './casting.js'
import {buildCastSessionCandidate, saveCastSession} from './cast-session.js'
import {IPTV_SOURCE, liveCastContext} from './iptv.js'

export const startLivePlayback = async ({
  video, pid, room, clientId, mode, loadSource, sendControl, saveSession = saveCastSession, navigate,
  isCurrent = () => true,
}) => {
  const line = pid ? video.links?.find(item => item.id === pid) : video.links?.[0]
  if (!line?.id) throw new Error('直播线路不存在')
  if (room && room !== clientId) {
    await sendCastingCommand({
      room,
      context: liveCastContext({id: video.id, pid: line.id}, room, mode),
      castSession: buildCastSessionCandidate({room, video, current: line, source: IPTV_SOURCE}),
      sendControl,
      saveSession: session => isCurrent() ? saveSession(session) : session,
      navigate: path => isCurrent() ? navigate(path) : undefined,
    })
    return null
  }
  const response = await loadSource(video.id, line.id, IPTV_SOURCE)
  if (!isCurrent()) return null
  if (!response?.data?.url || response.data.type !== 'hls') throw new Error('直播源暂时不可用')
  const source = response.data
  const deliveryMode = ['auto', 'proxy'].includes(source.delivery_mode) ? source.delivery_mode : 'direct'
  return {...source, delivery_mode: deliveryMode, proxyUrl: deliveryMode === 'auto' ? source.proxy_url : undefined}
}
