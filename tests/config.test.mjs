import assert from 'node:assert/strict'
import test from 'node:test'
import * as config from '../src/config.js'

test('默认保持线上 API 与 WebSocket 地址', () => {
  assert.equal(config.apiUrl, 'https://airplay-api.artools.cc')
  assert.equal(config.socketUrl, 'wss://airplay-api.artools.cc/api/wss')
})

test('开发环境地址覆盖通过协议验证且不接受凭据或无效 URL', () => {
  assert.equal(typeof config.resolveServiceConfig, 'function')
  assert.deepEqual(config.resolveServiceConfig({
    VITE_API_URL: 'http://127.0.0.1:18082', VITE_SOCKET_URL: 'ws://127.0.0.1:18082/api/wss',
  }), {apiUrl: 'http://127.0.0.1:18082', socketUrl: 'ws://127.0.0.1:18082/api/wss'})
  for (const value of ['javascript:alert(1)', 'not a URL', '//example.test', 'https://user:pass@example.test']) {
    const actual = config.resolveServiceConfig({VITE_API_URL: value, VITE_SOCKET_URL: value})
    assert.equal(actual.apiUrl, config.apiUrl)
    assert.equal(actual.socketUrl, config.socketUrl)
  }
  assert.equal(config.resolveServiceConfig({VITE_API_URL: 'ws://localhost:123'}).apiUrl, config.apiUrl)
  assert.equal(config.resolveServiceConfig({VITE_SOCKET_URL: 'https://localhost:123'}).socketUrl, config.socketUrl)
})
