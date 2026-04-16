import {addHistory, addTimeline, findHistory, findTimeline, updateHistory, updateTimeline} from "@/helpers/db.js";
import {httpVideoSource} from "@/helpers/api.js";

const sourceTypeOption = {
  mp3: 'mp3',
  mp4: 'mp4',
  m3u8: 'm3u8',
}

const playTypeOption = {
  art: 0,
  iframe: 1,
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
  } else if (playerCtx.playing) {
    duration = playerCtx.duration
    lastTime = playerCtx.currentTime
  }
  return { duration, lastTime }
}

const addTimelineWarp = async (playerCtx = {}, _source = '', video = {}, source = {}) => {
  const { duration, lastTime } = getPlayerTimeCtx(playerCtx, source)

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

  const find = await findHistory(_source, video.id, source.id)
  if (!find) {
    await addHistory({
      source: _source,
      vid: video.id,
      name: video.name,
      thumb: video.thumb,
      pid: source.id,
      pname: source.name,
      url: `${source.url}`,// 可能是个函数，存储需要字符串
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

const handlerPlayList = (links, video = {}, source = {}) => {
  return (links || []).map(row => {
    if (row.ctx && row.ctx.collect_id) {
      return {
        id: row.id,
        title: row.name,
        artist: row.ctx.name,
        src: async () => {
          const resp = await httpVideoSource(row.ctx.collect_id, row.ctx.id, appStore.source)
          return resp.data.url
        },
        pic: row.ctx.thumb,
        lrc: '',
      }
    } else if (row.id) {
      return {
        id: row.id,
        title: row.name,
        artist: row.group,
        src: async () => {
          if (row.url) {
            return row.url
          }
          // const resp = await httpVideoSource(row.ctx.collect_id, row.ctx.id, appStore.source)
          // return resp.data.url
          return ''
        },
        pic: row.thumb,
      }
    }
    return {
      id: video.id,
      title: video.name,
      artist: video.actors,
      src: source.url,
      pic: video.thumb,
      lrc: '',
    }
  })
}

export {
  playTypeOption,
  findSourceLink,
  addTimelineWarp,
  addHistoryWarp,
  handlerPlayList,
}