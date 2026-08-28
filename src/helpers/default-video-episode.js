const findEpisode = (links, pid) => links.find((episode) => episode?.id === pid)

const resolveDefaultVideoEpisodeId = async ({
  links = [],
  requestedPid,
  source,
  vid,
  findHistoryRecord,
}) => {
  const episodes = Array.isArray(links)
    ? links.filter((episode) => episode?.id !== undefined && episode?.id !== null)
    : []

  if (episodes.length === 0) return null
  if (findEpisode(episodes, requestedPid)) return requestedPid

  if (typeof findHistoryRecord === 'function') {
    try {
      const history = await findHistoryRecord(source, vid)
      if (findEpisode(episodes, history?.pid)) return history.pid
    } catch (_) {
      // IndexedDB 不可用时保持原有的首集回退行为。
    }
  }

  return episodes[0].id
}

export {resolveDefaultVideoEpisodeId}
