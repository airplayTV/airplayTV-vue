// https://dexie.org/docs/Tutorial/Vue

// db.js
import Dexie from 'dexie'

const db = new Dexie('db.airplayTV')

db.version(1).stores({
  // '++id, name, age'
  history: [
    '++id',
    'source', // 源
    'vid',
    'pid',
    'name', // 名称
    'thumb', // 地址
    'url', // 播放地址
    'type', // 视频源类型，hls/auto
    'duration', // 总时长，秒
    'lastTime', // 最后播放时间
    'updated_at', // 更新时间
  ].join(', '),
})

const addHistory = async (history) => {
  return await db.history.add(history)
}

const updateHistory = async (key, updates) => {
  return await db.history.update(key, updates)
}

const deleteHistory = async (key) => {
  return await db.history.delete(key)
}

const clearHistory = async () => {
  return await db.history.clear()
}

const listHistory = async (page = 1, limit = 20) => {
  page = +page
  limit = +limit
  if (page < 1) {
    page = 1
  }
  if (limit > 100 || limit <= 0) {
    limit = 20
  }
  // 倒序取出100
  return await db.history.orderBy('updated_at').desc().offset((page - 1) * limit).limit(limit).toArray()
}

const findHistory = async (source, vid, pid) => {
  return await db.history.where({ source: source, vid: vid, pid: pid }).first()
}

const deleteVideoHistory = async (source, vid, pid) => {
  return await db.history.where({ source: source, vid: vid, pid: pid }).delete()
}

export {
  db,
  addHistory,
  updateHistory,
  deleteVideoHistory,
  deleteHistory,
  clearHistory,
  listHistory,
  findHistory,
}
