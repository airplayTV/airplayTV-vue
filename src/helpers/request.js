import axios from 'axios'
import { apiUrl } from '../config'
import { getStorageSync } from '@/helpers/utils'
import { KEY_VIDEO_SOURCE } from '@/helpers/constant'

const httpInstance = axios.create({
  baseURL: apiUrl,
  timeout: 1000 * 20,
  headers: { 'X-Client': 'airplayTV-web' },
})

httpInstance.interceptors.request.use(
  (config) => {
    const url = new URL(config.url, apiUrl)
    if (!url.searchParams.get('_source')) {
      url.searchParams.append('_source', getStorageSync(KEY_VIDEO_SOURCE))
    }
    config.url = url.pathname + url.search
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

httpInstance.interceptors.response.use(
  (response) => {
    if (response.status !== 200) {
      return Promise.reject(response.statusText)
    }
    if (response.data.code !== 200) {
      return Promise.reject(response.data.msg)
    }
    // console.log('[responseX]', response.data)
    return response.data
  },
  (error) => {
    return Promise.reject(error)
  },
)

export { httpInstance }
