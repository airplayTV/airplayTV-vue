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

export const shouldShowAdReviewHistory = (enabled, authenticated) => Boolean(enabled && authenticated)

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

export const buildAdReviewCalibrationRoute = ({ source, vid, pid }) => ({
  name: 'VideoDetail',
  params: { id: String(vid ?? '') },
  query: {
    _source: String(source ?? ''),
    pid: String(pid ?? ''),
    ad_review_autostart: '1',
  },
})
