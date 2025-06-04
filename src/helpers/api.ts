import { httpInstance } from './request'

const httpSourceList = () => {
  return httpInstance.get('/api/video/provider')
}

const httpVideoList = (tag: string | number, page: number, _source: string) => {
  return httpInstance.get(`/api/video/list?tag=${tag}&page=${page}&_source=${_source}`)
}

const httpVideo = (id: string | number, _source: string) => {
  return httpInstance.get(`/api/video/detail?id=${id}&_source=${_source}`)
}

const httpVideoSource = (vid: string | number, pid: string | number, _source: string, _m3u8p: boolean) => {
  return httpInstance.get(`/api/video/source?vid=${vid}&pid=${pid}&_source=${_source}&_m3u8p=${_m3u8p}`)
}

const httpVideoSearch = (query: string) => {
  return httpInstance.get(`/api/video/search?${query}`)
}

const httpVideoSearchSSE = (keyword: string, page: string | number) => {
  return httpInstance.get(`/api/sse/video/search?keyword=${keyword}&page=${page}`)
}

const httpPlayUrlNetworkCheck = (url: string) => {
  return httpInstance.get(`/api/m3u8/network-check?url=${url}`)
}

export {
  httpSourceList,
  httpVideoList,
  httpVideo,
  httpVideoSource,
  httpVideoSearch,
  httpVideoSearchSSE,
  httpPlayUrlNetworkCheck,
}
