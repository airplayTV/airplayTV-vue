export const TV_HISTORY_UPDATED_EVENT = 'tv-history-updated'

const MAX_TEXT_LENGTH = 256

const isNonEmptyString = (value) => (
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= MAX_TEXT_LENGTH
)

const isNonNegativeSafeInteger = (value) => Number.isSafeInteger(value) && value >= 0

export const normalizePlaybackHistoryUpdate = (data, room) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  if (typeof room !== 'string' || room.length === 0) return null
  if (data.version !== 1 || typeof data.room !== 'string' || data.room !== room) return null
  if (!isNonEmptyString(data.source) || !isNonEmptyString(data.vid) || !isNonEmptyString(data.pid)) {
    return null
  }
  if (typeof data.title !== 'string' || typeof data.episode_name !== 'string' || typeof data.thumb !== 'string') {
    return null
  }
  if (
    !isNonNegativeSafeInteger(data.position_ms) ||
    !isNonNegativeSafeInteger(data.duration_ms) ||
    !isNonNegativeSafeInteger(data.updated_at)
  ) {
    return null
  }

  const thumb = /^https?:\/\//i.test(data.thumb) ? data.thumb : ''
  return {
    source: data.source.trim(),
    vid: data.vid.trim(),
    pid: data.pid.trim(),
    name: data.title.slice(0, MAX_TEXT_LENGTH),
    pname: data.episode_name.slice(0, MAX_TEXT_LENGTH),
    thumb,
    lastTime: data.position_ms / 1_000,
    duration: data.duration_ms / 1_000,
    updated_at: data.updated_at,
    tv_updated_at: data.updated_at,
  }
}
