import {addHistory, addTimeline, findHistory, findTimeline, updateHistory, updateTimeline} from "@/helpers/db.js";

const sourceTypeOption = {
  mp3: 'mp3',
  mp4: 'mp4',
  m3u8: 'm3u8',
}

const findSourceLink = (links, pid) => {
  links = (links || []).map((item, idx) => {
    item._idx = idx
    return item
  })
  if (links.length <= 0) {
    return null
  }
  if (!pid) {
    return links[0]
  }
  return links.find(item => item.id === pid) || null
}

const getPlayerTimeCtx = (playerCtx, source = {}) => {
  let duration = 0
  let lastTime = 0
  if (source.type === sourceTypeOption.mp3 && playerCtx.target) {
    duration = playerCtx.target.duration
    lastTime = playerCtx.target.currentTime
  } else if (artInstance.value) {
    duration = artInstance.value.duration
    lastTime = artInstance.value.currentTime
  }
  return { duration, lastTime }
}

const addTimelineWarp = async (playerCtx = {}, _source = '', video = {}, source = {}) => {
  const { duration, lastTime } = getPlayerTimeCtx(playerCtx, source)
  console.log('[addTimelineWarp]', {
    video: video,
    _source: _source, vid: video.id, pid: source.id,
  })
  const find = await findTimeline(_source, video.id, source.id)
  if (!find) {
    await addTimeline({
      source: _source,
      vid: video.id,
      pid: source.id,
      duration: duration,
      lastTime: lastTime,
      updated_at: Date.now(),
    })
  } else {
    await updateTimeline(find.id, {
      duration: duration,
      lastTime: lastTime,
      updated_at: Date.now(),
    })
  }
}

const addHistoryWarp = async (playerCtx = {}, _source = '', video = {}, source = {}) => {
  const { duration, lastTime } = getPlayerTimeCtx(playerCtx, source)
  console.log('[addHistoryWarp]', {
    _source: _source, vid: video.id, pid: source.id
  })
  const find = await findHistory(_source, video.id, source.id)
  if (!find) {
    await addHistory({
      source: _source,
      vid: video.id,
      name: video.name,
      thumb: video.thumb,
      pid: source.id,
      pname: source.name,
      url: source.url,
      type: source.type,
      duration: duration,
      lastTime: lastTime,
      updated_at: Date.now(),
    })
  } else {
    await updateHistory(find.id, {
      pid: source.id,
      name: video.name,
      thumb: video.thumb,
      pname: source.name,
      lastTime: lastTime,
      updated_at: Date.now(),
    })
  }
}


export {
  findSourceLink,
  addTimelineWarp,
  addHistoryWarp,
}