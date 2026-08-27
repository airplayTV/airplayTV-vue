import axios from 'axios'
import { v4 as uuid } from 'uuid'
import { apiUrl } from '../config'
import { AD_REVIEW_TOKEN_KEY, createAdReviewAPIError } from './ad-review-state.js'

const basePath = '/api/admin/ad-review'

const client = axios.create({
  baseURL: apiUrl,
  timeout: 60000,
  headers: { 'X-Client': 'airplayTV-web' },
})

client.interceptors.request.use((config) => {
  const token = typeof sessionStorage === 'undefined' ? '' : sessionStorage.getItem(AD_REVIEW_TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use((response) => {
  const body = response.data
  if (body && typeof body === 'object' && 'code' in body) {
    if (body.code !== 200) return Promise.reject(createAdReviewAPIError(body))
    return body.data
  }
  return body
}, (error) => {
  const message = error.response?.data?.msg || error.response?.data?.error || error.message || '请求失败'
  const normalized = new Error(message)
  normalized.status = error.response?.status
  normalized.data = error.response?.data
  return Promise.reject(normalized)
})

const writeConfig = () => ({
  headers: {
    'Content-Type': 'application/json',
    'X-Ad-Review-Request': '1',
    'Idempotency-Key': uuid(),
  },
})

export const adReviewAPI = {
  login: (password) => client.post(`${basePath}/session`, { password }, writeConfig()),
  session: () => client.get(`${basePath}/session`),
  logout: () => client.delete(`${basePath}/session`, writeConfig()),
  createSnapshot: (input) => client.post(`${basePath}/snapshots`, input, writeConfig()),
  markUnlabeledContent: (snapshotId) => client.post(`${basePath}/snapshots/${snapshotId}/labels/content`, {}, writeConfig()),
  labeledVideos: (params) => client.get(`${basePath}/videos`, { params }),
  snapshotDetail: (snapshotId) => client.get(`${basePath}/snapshots/${snapshotId}`),
  labelBlock: (blockId, input) => client.post(`${basePath}/blocks/${blockId}/label`, input, writeConfig()),
  generateCandidate: (source) => client.post(`${basePath}/rules/candidate`, { source }, writeConfig()),
  activateRule: (ruleId, input) => client.post(`${basePath}/rules/${ruleId}/activate`, input, writeConfig()),
  rollbackActivation: (activationId, reason) => client.post(`${basePath}/activations/${activationId}/rollback`, { reason }, writeConfig()),
  conflicts: (ruleId, status = 'pending') => client.get(`${basePath}/conflicts`, { params: { rule_id: ruleId, status } }),
  activeRule: (source) => client.get(`${basePath}/rules/active`, { params: { source } }),
  previewURL: (snapshotId, blockId, count = 1, mode = 'direct') =>
    `${apiUrl}${basePath}/snapshots/${snapshotId}/blocks/${blockId}/preview.m3u8?count=${count}&mode=${mode}`,
}
