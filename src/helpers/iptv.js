export const IPTV_SOURCE = '电视源'
export const IPTV_FAVORITES_KEY = 'airplaytv.iptv.favorites.v1'
export const IPTV_PAIRING_RETURN_KEY = 'airplaytv.iptv.pairing-return'

export const pairingReturnPath = (value) => (
  ['/tv', '/control'].includes(value) ? value : '/?from-join-room'
)

export const pairingScanRoute = (value, origin, returnTo) => {
  try {
    const url = new URL(value)
    const room = url.searchParams.get('room_id')?.trim()
    if (url.origin !== origin || url.pathname !== '/join' || !room || room.length > 256) return null
    return {path: '/join', query: {room_id: room, returnTo: pairingReturnPath(returnTo)}}
  } catch (_) { return null }
}

export const filterChannels = (channels, {keyword = '', group = '', favoritesOnly = false, favorites = []} = {}) => {
  const query = keyword.trim().toLocaleLowerCase()
  const favoriteIds = new Set(favorites)
  return channels.filter((channel) => (!group || channel.group === group)
    && (!query || channel.name.toLocaleLowerCase().includes(query))
    && (!favoritesOnly || favoriteIds.has(channel.id)))
}

export const liveCastContext = (channel, room, mode) => ({
  event: '/ctl_load_Video', group: room, vid: channel.id, pid: channel.pid, source: IPTV_SOURCE, mode: String(mode ?? ''),
})
