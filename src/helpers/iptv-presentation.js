import {normalizeCastChannels} from './cast-session.js'

const escapeXml = value => String(value ?? '').replace(/[<>&"']/g, char => ({'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'}[char]))

export const isLiveVideo = video => video?.media_kind === 'live' || video?.type === 'iptv'

export const channelPlaylist = channels => normalizeCastChannels(channels).map(channel => ({
  id: channel.pid, vid: channel.id, title: channel.name, artist: channel.group,
}))

// Local channel artwork, not a snapshot of the current programme.
export const channelCover = channel => {
  const name = escapeXml(channel.name)
  const group = escapeXml(channel.group || channel.tag || '电视直播')
  const color = {央视: '#a73845', CGTN: '#32677f', 卫视: '#23765d'}[channel.group || channel.tag] || '#4b6388'
  const length = String(channel.name || '').length
  const size = length > 12 ? 32 : length > 8 ? 40 : 56
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#172d35"/></linearGradient></defs><rect width="600" height="800" fill="url(#bg)"/><circle cx="520" cy="230" r="250" fill="#fff" opacity=".04"/><circle cx="50" cy="570" r="220" fill="#fff" opacity=".04"/><rect x="80" y="322" width="440" height="156" rx="12" fill="#fff" opacity=".08"/><text x="300" y="352" text-anchor="middle" fill="#fff" opacity=".65" font-family="sans-serif" font-size="18">${group}</text><text x="300" y="407" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700" font-size="${size}">${name}</text><text x="300" y="449" text-anchor="middle" fill="#fff" opacity=".65" font-family="sans-serif" font-size="16" letter-spacing="4">电视直播 · LIVE</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const videoThumbnail = video => video.thumb || (isLiveVideo(video) ? channelCover(video) : '')

export const tvSearchLocation = (query, keyword) => ({
  path: '/tv', query: {...query, keyword: String(keyword ?? '').trim() || undefined},
})
