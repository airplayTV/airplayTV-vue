const DEFAULT_API_URL = 'https://airplay-api.artools.cc'
const DEFAULT_SOCKET_URL = 'wss://airplay-api.artools.cc/api/wss'

const resolveServiceUrl = (value, protocols, fallback) => {
  if (typeof value !== 'string' || !value.trim()) return fallback
  try {
    const url = new URL(value.trim())
    if (!protocols.includes(url.protocol) || url.username || url.password) return fallback
    return value.trim()
  } catch (_) { return fallback }
}

export const resolveServiceConfig = (environment = {}) => ({
  apiUrl: resolveServiceUrl(environment.VITE_API_URL, ['http:', 'https:'], DEFAULT_API_URL),
  socketUrl: resolveServiceUrl(environment.VITE_SOCKET_URL, ['ws:', 'wss:'], DEFAULT_SOCKET_URL),
})

const {apiUrl, socketUrl} = resolveServiceConfig(import.meta.env ?? {})

// // 本地调试
// const apiUrl = 'http://127.0.0.1:8082'
// const socketUrl = 'wss://airplay-api.artools.cc/api/wss'

// // 本地打包，域名同api服务中配置
// const apiUrl = 'https://airplay-tv.pages.dev'
// const socketUrl = 'wss://airplay-tv.pages.dev/api/wss'


export {apiUrl, socketUrl}
