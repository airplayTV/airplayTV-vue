import { httpInstance } from './request'

const EventJoinGroup = 'joinGroup'
const EventSendToClient = 'sendToClient'
const EventLeaveGroup = 'leaveGroup'
const EventSendToGroup = 'sendToGroup'
const EventListGroupClient = 'listGroupClient'

// function joinGroup(groupName) {
//   return send({
//     data: JSON.stringify({ group: groupName, event: EventJoinGroup, data: null }),
//   })
// }
//
// function sendToGroup(data) {
//   return send({
//     data: JSON.stringify({ group: data.group, event: EventSendToGroup, data: data, }),
//   })
// }
//
// function isFunction(v) {
//   return typeof v == 'function';
// }
//
// function httpRequest(obj) {
//   if (!obj.url) {
//     console.error('[httpRequest] 参数错误')
//     return
//   }
//   obj.url = `${apiUrl}${obj.url}`
//   if (!obj.data) {
//     obj.data = {}
//   }
//
//   showLoading()
//
//   obj.data._source = getStorageSync(KEY_VIDEO_SOURCE)
//   uni.request({
//     url: obj.url,
//     data: obj.data,
//     header: obj.header,
//     method: obj.method,
//     timeout: obj.timeout,
//     dataType: obj.dataType,
//     responseType: obj.responseType,
//     sslVerify: obj.sslVerify,
//     withCredentials: obj.withCredentials,
//     success: function (resp) {
//       if (resp.statusCode !== 200) {
//         if (isFunction(obj.fail)) {
//           obj.fail(resp.data ? resp.data : resp.errMsg)
//         }
//         return
//       }
//       if (resp.data.code !== 200) {
//         if (isFunction(obj.fail)) {
//           obj.fail(resp.data.msg)
//         }
//         return
//       }
//       if (isFunction(obj.success)) {
//         obj.success(resp.data)
//       }
//     },
//     fail: obj.fail,
//     complete: () => {
//       hideLoading()
//
//       if (isFunction(obj.complete)) {
//         obj.complete()
//       }
//     },
//   })
// }
//
// function httpRequestAsync(obj) {
//   return new Promise((resolve, reject) => {
//     obj.success = (resp) => {
//       resolve(resp)
//     }
//     obj.fail = (error) => {
//       resolve({ msg: error })
//     }
//     httpRequest(obj)
//   })
// }
//
// async function httpRequestSync(obj) {
//   return await httpRequestAsync(obj)
// }

const httpSourceList = () => {
  return httpInstance.get('/api/video/provider')
}

const httpVideoList = (tag: string | number, page: number) => {
  return httpInstance.get(`/api/video/list?tag=${tag}&page=${page}`)
}

const httpVideo = (query: string) => {
  return httpInstance.get(`/api/video/detail?${query}`)
}

const httpVideoSource = (vid: string | number, pid: string | number, _source: string) => {
  return httpInstance.get(`/api/video/source?vid=${vid}&pid=${pid}&_source=${_source}`)
}

const httpVideoSearch = (query: string) => {
  return httpInstance.get(`/api/video/search?${query}`)
}

const httpVideoSearchSSE = (keyword: string, page: string | number) => {
  return httpInstance.get(`/api/sse/video/search?keyword=${keyword}&page=${page}`)
}

export {
  httpSourceList,
  httpVideoList,
  httpVideo,
  httpVideoSource,
  httpVideoSearch,
  httpVideoSearchSSE,
}
