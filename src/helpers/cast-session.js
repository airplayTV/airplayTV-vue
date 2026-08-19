import {KEY_CAST_SESSION} from './constant.js'

export const CAST_SESSION_VERSION = 1

const MAX_IDENTIFIER_LENGTH = 256
const MAX_TITLE_LENGTH = 512
const MAX_THUMB_LENGTH = 2048
const MAX_EPISODES = 500

const normalizeRequiredIdentifier = (value) => {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= MAX_IDENTIFIER_LENGTH ? normalized : null
}

const normalizeOptionalText = (value, maximumLength) => {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized && normalized.length <= maximumLength ? normalized : null
}

const normalizeEpisode = (episode) => {
  if (!episode || typeof episode !== 'object') return null
  const id = normalizeRequiredIdentifier(episode.id)
  const name = normalizeOptionalText(episode.name, MAX_TITLE_LENGTH)
  return id && name ? {id, name} : null
}

const normalizeEpisodes = (episodes) => {
  if (episodes === undefined || episodes === null) return []
  if (!Array.isArray(episodes)) return null
  return episodes.reduce((normalized, episode) => {
    const safeEpisode = normalizeEpisode(episode)
    if (safeEpisode && normalized.length < MAX_EPISODES) normalized.push(safeEpisode)
    return normalized
  }, [])
}

const normalizeUpdatedAt = (value) => (
  Number.isSafeInteger(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER ? value : Date.now()
)

export const buildCastSessionCandidate = ({room, video = {}, current = {}, source} = {}) => ({
  room,
  vid: video.id,
  pid: current.id,
  source,
  title: video.name,
  thumb: video.thumb,
  episodeName: current.name || current.title,
  episodes: Array.isArray(video.links)
    ? video.links.map((link) => ({id: link?.id, name: link?.name || link?.title}))
    : [],
})

export const normalizeCastSession = (candidate) => {
  if (!candidate || typeof candidate !== 'object') return null
  if (candidate.version !== undefined && candidate.version !== CAST_SESSION_VERSION) return null

  const room = normalizeRequiredIdentifier(candidate.room)
  const vid = normalizeRequiredIdentifier(candidate.vid)
  const pid = normalizeRequiredIdentifier(candidate.pid)
  const source = normalizeRequiredIdentifier(candidate.source)
  const title = normalizeOptionalText(candidate.title, MAX_TITLE_LENGTH)
  const thumb = normalizeOptionalText(candidate.thumb, MAX_THUMB_LENGTH)
  const episodeName = normalizeOptionalText(candidate.episodeName, MAX_TITLE_LENGTH)
  const episodes = normalizeEpisodes(candidate.episodes)

  if (!room || !vid || !pid || !source || episodes === null) return null
  if (candidate.title !== undefined && candidate.title !== null && !title) return null
  if (candidate.thumb !== undefined && candidate.thumb !== null && !thumb) return null
  if (candidate.episodeName !== undefined && candidate.episodeName !== null && !episodeName) return null

  return {
    version: CAST_SESSION_VERSION,
    room,
    vid,
    pid,
    source,
    ...(title ? {title} : {}),
    ...(thumb ? {thumb} : {}),
    ...(episodeName ? {episodeName} : {}),
    episodes,
    updatedAt: normalizeUpdatedAt(candidate.updatedAt),
  }
}

export const saveCastSession = (candidate, storage = globalThis.localStorage) => {
  const session = normalizeCastSession(candidate)
  if (!session || !storage || typeof storage.setItem !== 'function') return null
  try {
    storage?.setItem(KEY_CAST_SESSION, JSON.stringify(session))
    return session
  } catch (_) {
    return null
  }
}

export const loadCastSession = (room, storage = globalThis.localStorage) => {
  const normalizedRoom = normalizeRequiredIdentifier(room)
  if (!normalizedRoom) return null
  try {
    const rawSession = storage?.getItem(KEY_CAST_SESSION)
    if (!rawSession) return null
    const candidate = JSON.parse(rawSession)
    if (candidate?.version !== CAST_SESSION_VERSION) return null
    const session = normalizeCastSession(candidate)
    return session?.room === normalizedRoom ? session : null
  } catch (_) {
    return null
  }
}

export const findCastEpisode = (session, pid) => {
  const episodeId = normalizeRequiredIdentifier(pid)
  if (!episodeId || !Array.isArray(session?.episodes)) return null
  return session.episodes
    .map(normalizeEpisode)
    .find((episode) => episode?.id === episodeId) ?? null
}

export const shouldShowEpisodeSwitcher = (session) => (
  Array.isArray(session?.episodes)
  && session.episodes.filter((episode) => normalizeEpisode(episode)).length > 1
)

export const updateCastSessionEpisode = (session, episode) => {
  const normalizedSession = normalizeCastSession(session)
  if (!normalizedSession) return null
  if (normalizedSession.updatedAt === Number.MAX_SAFE_INTEGER) {
    throw new Error('invalid cast session timestamp')
  }
  const matchingEpisode = findCastEpisode(normalizedSession, episode?.id)
  if (!matchingEpisode) return null

  return normalizeCastSession({
    ...normalizedSession,
    pid: matchingEpisode.id,
    episodeName: matchingEpisode.name,
    updatedAt: Math.max(Date.now(), normalizedSession.updatedAt + 1),
  })
}
