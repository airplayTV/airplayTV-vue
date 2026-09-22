import {normalizeCastChannels} from './cast-session.js'

const escapeXml = value => String(value ?? '').replace(/[<>&"']/g, char => ({'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'}[char]))

export const isLiveVideo = video => video?.media_kind === 'live' || video?.type === 'iptv'

export const liveLineSelector = (links, pid) => (links || []).filter(line => line?.id).map((line, index) => ({
  id: line.id, html: escapeXml(line.name || '直播线路'), default: pid ? line.id === pid : index === 0,
}))

export const channelPlaylist = channels => normalizeCastChannels(channels).map(channel => ({
  id: channel.pid, vid: channel.id, title: channel.name, artist: channel.group,
}))

const coverIdentity = name => {
  const numbered = name.match(/^(CCTV|CETV)[\s-]*(\d{1,2}(?:K|\+)?)(.*)$/i)
  if (numbered) return {label: numbered[1].toUpperCase(), number: numbered[2].toUpperCase(), caption: numbered[3].trim()}
  const network = name.match(/^(CCTV|CGTN)\s*(.*)$/i)
  if (network) return {label: network[1].toUpperCase(), caption: network[2].trim()}
  if (name.endsWith('卫视') && name.length > 2) return {label: name.slice(0, -2), caption: '卫视'}
  return {label: name, caption: ''}
}

// Estimate mixed Latin/CJK width before XML escaping so entities do not shrink the label.
const coverFontSize = (text, maximum, width) => {
  const units = Array.from(text).reduce((sum, char) => sum + (/^[\x00-\x7f]$/.test(char) ? 0.68 : 1), 0)
  return Math.min(maximum, Math.floor(width / Math.max(1, units)))
}

// Local typographic identity, not an official station logo or programme snapshot.
export const channelCover = channel => {
  const name = String(channel.name || '电视直播').trim()
  const group = String(channel.group || channel.tag || '电视直播')
  const color = {央视: '#a42b36', CGTN: '#32677f', 卫视: '#23765d'}[group] || '#4b6388'
  const {label, number = '', caption} = coverIdentity(name)
  const size = coverFontSize(label + number, number || /^(CCTV|CGTN)$/.test(label) ? 114 : 96, 480)
  const subtitle = caption ? `<text x="300" y="476" text-anchor="middle" fill="#26363f" font-size="${coverFontSize(caption, 48, 400)}" letter-spacing="4">${escapeXml(caption)}</text>` : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" role="img" aria-label="${escapeXml(name)}">
<title>${escapeXml(name)}</title>
<rect width="600" height="800" fill="#e9eff3"/>
<g font-family="Arial, Microsoft YaHei, PingFang SC, sans-serif">
<text x="66" y="104" fill="#5c6e79" font-size="${coverFontSize(group, 34, 400)}">${escapeXml(group)}</text>
<text x="300" y="${caption ? 405 : 427}" text-anchor="middle" fill="#26363f" font-size="${size}" font-weight="700">${escapeXml(label)}${number ? `<tspan fill="${color}" dx="8">${escapeXml(number)}</tspan>` : ''}</text>
${subtitle}
<rect x="252" y="669" width="96" height="4" fill="${color}"/>
<text x="300" y="730" text-anchor="middle" fill="#647580" font-size="32" letter-spacing="4">电视直播</text>
</g></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export const videoThumbnail = video => video.thumb || (isLiveVideo(video) ? channelCover(video) : '')

export const castSessionThumbnail = session => {
  if (session?.media_kind !== 'live') return session?.thumb || ''
  const channel = session.channels?.find(item => item.id === session.vid)
  return channelCover(channel || {name: session.title})
}

export const tvSearchLocation = (query, keyword) => ({
  path: '/tv', query: {...query, keyword: String(keyword ?? '').trim() || undefined},
})
