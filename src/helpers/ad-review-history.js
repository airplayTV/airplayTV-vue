const readValue = (value, keys, fallback = null) => {
  for (const key of keys) {
    if (value?.[key] !== undefined && value?.[key] !== null) return value[key]
  }
  return fallback
}

const readNumber = (value, keys, fallback = 0) => {
  const parsed = Number(readValue(value, keys, fallback))
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeLabelCounts = (value = {}) => ({
  CONTENT: readNumber(value, ['CONTENT', 'content', 'Content']),
  AD: readNumber(value, ['AD', 'ad', 'Ad']),
  UNSURE: readNumber(value, ['UNSURE', 'unsure', 'Unsure']),
  UNPLAYABLE: readNumber(value, ['UNPLAYABLE', 'unplayable', 'Unplayable']),
})

const normalizeSnapshotSummary = (value = {}) => ({
  id: readNumber(value, ['id', 'ID']),
  createdAt: readValue(value, ['created_at', 'createdAt', 'CreatedAt'], ''),
  latestLabeledAt: readValue(value, ['latest_labeled_at', 'latestLabeledAt', 'LatestLabeledAt'], ''),
  labeledBlockCount: readNumber(value, ['labeled_block_count', 'labeledBlockCount', 'LabeledBlockCount']),
  labelCounts: normalizeLabelCounts(readValue(value, ['label_counts', 'labelCounts', 'LabelCounts'], {})),
})

const normalizeEpisode = (value = {}) => {
  const snapshots = readValue(value, ['snapshots', 'Snapshots'], [])
    .map(normalizeSnapshotSummary)
    .sort((left, right) => {
      const timeDifference = Date.parse(right.latestLabeledAt) - Date.parse(left.latestLabeledAt)
      return Number.isNaN(timeDifference) || timeDifference === 0 ? right.id - left.id : timeDifference
    })
  return {
    pid: String(readValue(value, ['pid', 'PID'], '')),
    latestSnapshotId: readNumber(value, ['latest_snapshot_id', 'latestSnapshotId', 'LatestSnapshotID'], snapshots[0]?.id ?? 0),
    snapshotCount: readNumber(value, ['snapshot_count', 'snapshotCount', 'SnapshotCount'], snapshots.length),
    latestLabeledAt: readValue(value, ['latest_labeled_at', 'latestLabeledAt', 'LatestLabeledAt'], ''),
    labelCounts: normalizeLabelCounts(readValue(value, ['label_counts', 'labelCounts', 'LabelCounts'], {})),
    snapshots,
  }
}

const normalizeVideo = (value = {}) => ({
  source: String(readValue(value, ['source', 'Source'], '')),
  vid: String(readValue(value, ['vid', 'VID'], '')),
  videoName: String(readValue(value, ['video_name', 'videoName', 'VideoName'], '')),
  latestLabeledAt: readValue(value, ['latest_labeled_at', 'latestLabeledAt', 'LatestLabeledAt'], ''),
  snapshotCount: readNumber(value, ['snapshot_count', 'snapshotCount', 'SnapshotCount']),
  episodeCount: readNumber(value, ['episode_count', 'episodeCount', 'EpisodeCount']),
  labelCounts: normalizeLabelCounts(readValue(value, ['label_counts', 'labelCounts', 'LabelCounts'], {})),
  episodes: readValue(value, ['episodes', 'Episodes'], []).map(normalizeEpisode),
})

export const normalizeAdReviewHistoryPage = (value = {}) => ({
  items: readValue(value, ['items', 'Items'], []).map(normalizeVideo),
  total: readNumber(value, ['total', 'Total']),
  page: readNumber(value, ['page', 'Page'], 1),
  pageSize: readNumber(value, ['page_size', 'pageSize', 'PageSize'], 20),
})

const normalizeLabelEvent = (value) => value ? {
  id: readNumber(value, ['id', 'ID']),
  label: String(readValue(value, ['label', 'Label'], '')),
  previousId: readValue(value, ['previous_id', 'previousId', 'PreviousID']),
  reason: String(readValue(value, ['reason', 'Reason'], '')),
  createdAt: readValue(value, ['created_at', 'createdAt', 'CreatedAt'], ''),
} : null

export const normalizeAdReviewSnapshotDetail = (value = {}) => {
  const snapshot = readValue(value, ['snapshot', 'Snapshot'], {})
  return {
    snapshot: {
      id: readNumber(snapshot, ['id', 'ID']),
      source: String(readValue(snapshot, ['source', 'Source'], '')),
      vid: String(readValue(snapshot, ['vid', 'VID'], '')),
      pid: String(readValue(snapshot, ['pid', 'PID'], '')),
      videoName: String(readValue(snapshot, ['video_name', 'videoName', 'VideoName'], '')),
      playlistURL: String(readValue(snapshot, ['playlist_url', 'playlistURL', 'PlaylistURL'], '')),
      finalURL: String(readValue(snapshot, ['final_url', 'finalURL', 'FinalURL'], '')),
      playlistHash: String(readValue(snapshot, ['playlist_hash', 'playlistHash', 'PlaylistHash'], '')),
      ruleVersion: String(readValue(snapshot, ['rule_version', 'ruleVersion', 'RuleVersion'], '')),
      createdAt: readValue(snapshot, ['created_at', 'createdAt', 'CreatedAt'], ''),
    },
    blocks: readValue(value, ['blocks', 'Blocks'], []).map((block) => ({
      id: readNumber(block, ['id', 'ID']),
      snapshotId: readNumber(block, ['snapshot_id', 'snapshotId', 'SnapshotID']),
      blockIndex: readNumber(block, ['block_index', 'blockIndex', 'BlockIndex']),
      discontinuityId: readNumber(block, ['discontinuity_id', 'discontinuityId', 'DiscontinuityID']),
      startMs: readNumber(block, ['start_ms', 'startMs', 'StartMS']),
      endMs: readNumber(block, ['end_ms', 'endMs', 'EndMS']),
      segmentCount: readNumber(block, ['segment_count', 'segmentCount', 'SegmentCount']),
      duration: readNumber(block, ['duration', 'Duration']),
      labelEvent: normalizeLabelEvent(readValue(block, ['label_event', 'labelEvent', 'LabelEvent'])),
    })).sort((left, right) => left.blockIndex - right.blockIndex),
  }
}

export const normalizeAdReviewHistoryFilter = (value = {}) => {
  const page = Math.max(1, Number.parseInt(value.page, 10) || 1)
  const requestedPageSize = Number.parseInt(value.pageSize ?? value.page_size, 10) || 20
  return {
    keyword: String(value.keyword ?? '').trim(),
    source: String(value.source ?? '').trim(),
    page,
    page_size: Math.min(100, Math.max(1, requestedPageSize)),
  }
}

export const normalizeAdReviewHistoryRouteQuery = (value = {}) => {
  const filter = normalizeAdReviewHistoryFilter(value)
  return { source: filter.source, keyword: filter.keyword, page: filter.page }
}

export const buildAdReviewHistoryRouteQuery = (value = {}) => {
  const filter = normalizeAdReviewHistoryRouteQuery(value)
  const query = {}
  if (filter.source) query.source = filter.source
  if (filter.keyword) query.keyword = filter.keyword
  if (filter.page > 1) query.page = String(filter.page)
  return query
}

export const buildAdReviewHistoryListRoute = (source = '') => ({
  name: 'AdReviewHistoryList',
  query: buildAdReviewHistoryRouteQuery({ source }),
})

export const shouldShowAdReviewHistory = (enabled, authenticated) => Boolean(enabled && authenticated)

export const isAdReviewAuthenticationError = (error = {}) =>
  Number(error.status ?? error.data?.code) === 401

export const adReviewAccessAction = ({ enabled, authenticated, restoring }) => {
  if (authenticated) return 'show'
  if (restoring) return 'loading'
  if (enabled) return 'restore'
  return 'login'
}

export const createAdReviewSingleFlight = () => {
  let pending = null
  return (task) => {
    if (pending) return pending
    pending = Promise.resolve()
      .then(task)
      .finally(() => { pending = null })
    return pending
  }
}

export const runAdReviewSnapshotDeletion = async (snapshotId, { deleteSnapshot, reloadHistory }) => {
  const result = await deleteSnapshot(snapshotId)
  await reloadHistory()
  return result
}

export const runAdReviewSourceDeletion = async (source, { deleteSource, reloadOverview }) => {
  const result = await deleteSource(source)
  await reloadOverview()
  return result
}

export const runAdReviewVideoDeletion = async (video, { deleteVideo, reloadHistory }) => {
  const result = await deleteVideo(video.source, video.vid)
  await reloadHistory()
  return result
}

const createAdReviewRunId = () => globalThis.crypto?.randomUUID?.() ??
  `${Date.now()}-${Math.random().toString(36).slice(2)}`

export const buildAdReviewCalibrationRoute = ({ source, vid, pid, runId = createAdReviewRunId() }) => ({
  name: 'VideoDetail',
  params: { id: String(vid ?? '') },
  query: {
    _source: String(source ?? ''),
    pid: String(pid ?? ''),
    ad_review_run: String(runId),
  },
})

export const normalizeAdReviewPreviewMode = (mode) => mode === 'proxy' ? 'proxy' : 'direct'

export const adReviewPreviewFallbackMode = (mode) =>
  normalizeAdReviewPreviewMode(mode) === 'direct' ? 'proxy' : null
