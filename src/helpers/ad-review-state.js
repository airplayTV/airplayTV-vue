export const AD_REVIEW_MODE_KEY = 'airplay_ad_review_mode'
export const AD_REVIEW_TOKEN_KEY = 'airplay_ad_review_token'

const read = (value, camel, pascal, fallback = null) => value?.[camel] ?? value?.[pascal] ?? fallback

export const createAdReviewSession = (storage) => ({
  enabled: () => storage?.getItem(AD_REVIEW_MODE_KEY) === '1',
  token: () => storage?.getItem(AD_REVIEW_TOKEN_KEY) || '',
  enable: (token) => {
    storage?.setItem(AD_REVIEW_MODE_KEY, '1')
    storage?.setItem(AD_REVIEW_TOKEN_KEY, token || '')
  },
  disable: () => {
    storage?.removeItem(AD_REVIEW_MODE_KEY)
    storage?.removeItem(AD_REVIEW_TOKEN_KEY)
  },
})

export const createAdReviewAPIError = (body = {}) => {
  const error = new Error(body.msg || '请求失败')
  error.status = body.code
  error.data = body
  return error
}

export const normalizeAdReviewSnapshot = (data = {}) => {
  const rawSnapshot = data.snapshot ?? data.Snapshot ?? {}
  const blocks = data.blocks ?? data.Blocks ?? []
  return {
    snapshot: {
      id: read(rawSnapshot, 'id', 'ID'),
      source: read(rawSnapshot, 'source', 'Source', ''),
      vid: read(rawSnapshot, 'vid', 'VID', ''),
      pid: read(rawSnapshot, 'pid', 'PID', ''),
      playlistURL: read(rawSnapshot, 'playlist_url', 'PlaylistURL', ''),
      finalURL: read(rawSnapshot, 'final_url', 'FinalURL', ''),
    },
    blocks: blocks.map((block) => ({
      id: read(block, 'id', 'ID'),
      snapshotId: read(block, 'snapshot_id', 'SnapshotID'),
      blockIndex: read(block, 'block_index', 'BlockIndex', 0),
      discontinuityId: read(block, 'discontinuity_id', 'DiscontinuityID', 0),
      startMs: read(block, 'start_ms', 'StartMS', 0),
      endMs: read(block, 'end_ms', 'EndMS', 0),
      segmentCount: read(block, 'segment_count', 'SegmentCount', 0),
      duration: read(block, 'duration', 'Duration', 0),
      labelEvent: null,
    })).sort((left, right) => left.blockIndex - right.blockIndex),
  }
}

export const formatApproxTime = (milliseconds = 0) => {
  const total = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':')
}

export const findNextAdReviewBlockId = (blocks = [], currentId) => {
  const index = blocks.findIndex((block) => block.id === currentId)
  return index >= 0 ? blocks[index + 1]?.id ?? null : null
}

export const applyAdReviewLabelEvents = (blocks = [], events = []) => {
  const eventsByBlock = new Map(events.map((event) => [read(event, 'block_id', 'BlockID'), event]))
  for (const block of blocks) {
    const event = eventsByBlock.get(block.id)
    if (event) block.labelEvent = event
  }
  return blocks
}
