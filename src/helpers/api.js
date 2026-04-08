import {httpInstance} from './request'

const httpSourceList = () => {
  return httpInstance.get('/api/video/provider')
}

const httpVideoList = (tag, page, _source) => {
  return httpInstance.get(`/api/video/list?tag=${tag}&page=${page}&_source=${_source}`)
}

const httpVideo = (id, _source) => {
  return httpInstance.get(`/api/video/detail?id=${id}&_source=${_source}`)
}

const httpVideoSource = (vid, pid, _source, _m3u8p) => {
  return httpInstance.get(`/api/video/source?vid=${vid}&pid=${pid}&_source=${_source}&_m3u8p=${_m3u8p}`)
}

const httpVideoSearch = (query) => {
  return httpInstance.get(`/api/video/search?${query}`)
}

const apiVideoSearchSSE = (keyword, page, source, _source, sourceMode) => {
  return `/api/sse/video/search?page=${page}&keyword=${keyword}&source=${source}&_source=${_source}&_mode=${sourceMode}`
}

const httpPlayUrlNetworkCheck = (url) => {
  return httpInstance.get(`/api/m3u8/network-check?url=${url}`)
}

const apiSourceStat = (query) => {
  return httpInstance.get(`/api/source/stat?${query}`)
}

const httpCollectAdd = (data) => {
  return httpInstance.post(`/api/collect/add`, data)
}

const httpCollectList = () => {
  return httpInstance.get(`/api/collect/list`)
}

const httpCollectDetail = (collectId, limit = 0) => {
  return httpInstance.get(`/api/collect/detail?collect_id=${collectId}&limit=${limit}`)
}

export {
  httpSourceList,
  httpVideoList,
  httpVideo,
  httpVideoSource,
  httpVideoSearch,
  apiVideoSearchSSE,
  httpPlayUrlNetworkCheck,
  apiSourceStat,
  httpCollectAdd,
  httpCollectList,
  httpCollectDetail,
}
