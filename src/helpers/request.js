import axios from 'axios'
import {apiUrl} from '../config'
import {useAppStore} from "@/stores/app.js";


const httpInstance = axios.create({
  baseURL: apiUrl,
  timeout: 1000 * 20,
  headers: { 'X-Client': 'airplayTV-web' },
})

httpInstance.interceptors.request.use(
  (config) => {
    const appStore = useAppStore()

    const url = new URL(config.url, apiUrl)
    if (!url.searchParams.get('_source')) {
      url.searchParams.append('_source', appStore.source)
    }
    if (!url.searchParams.get('_s_key')) {
      url.searchParams.append('_s_key', appStore.sourceSecret)
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

export {httpInstance}
