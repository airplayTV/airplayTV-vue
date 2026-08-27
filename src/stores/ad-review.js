import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { createAdReviewSession, normalizeAdReviewSnapshot } from '@/helpers/ad-review-state.js'
import { createAdReviewSingleFlight, normalizeAdReviewHistoryPage } from '@/helpers/ad-review-history.js'
import { adReviewAPI } from '@/helpers/ad-review-api.js'

export const useAdReviewStore = defineStore('ad-review', () => {
  const session = createAdReviewSession(typeof sessionStorage === 'undefined' ? null : sessionStorage)
  const enabled = ref(session.enabled())
  const authenticated = ref(false)
  const snapshot = ref(null)
  const blocks = ref([])
  const selectedBlockId = ref(null)
  const candidate = ref(null)
  const conflicts = ref([])
  const active = ref(null)
  const loading = ref(false)
  const historyPage = ref(normalizeAdReviewHistoryPage())
  const historyLoading = ref(false)
  const historyError = ref('')
  const runRestore = createAdReviewSingleFlight()

  const selectedBlock = computed(() => blocks.value.find((block) => block.id === selectedBlockId.value) ?? null)
  const labeledCount = computed(() => blocks.value.filter((block) => block.labelEvent).length)

  const enter = async (password) => {
    const result = await adReviewAPI.login(password)
    session.enable(result.token)
    enabled.value = true
    authenticated.value = true
  }

  const restore = () => {
    if (!enabled.value) return false
    if (authenticated.value) return true
    return runRestore(async () => {
      try {
        await adReviewAPI.session()
        authenticated.value = true
        return true
      } catch (_) {
        exitLocal()
        return false
      }
    })
  }

  const exitLocal = () => {
    session.disable()
    enabled.value = false
    authenticated.value = false
    snapshot.value = null
    blocks.value = []
    selectedBlockId.value = null
  }

  const logout = async () => {
    try { await adReviewAPI.logout() } finally { exitLocal() }
  }

  const loadSnapshot = async (input) => {
    loading.value = true
    try {
      const normalized = normalizeAdReviewSnapshot(await adReviewAPI.createSnapshot(input))
      snapshot.value = normalized.snapshot
      blocks.value = normalized.blocks
      selectedBlockId.value = normalized.blocks[0]?.id ?? null
      candidate.value = null
      conflicts.value = []
      return normalized
    } finally {
      loading.value = false
    }
  }

  const label = async (block, labelValue, reason = '') => {
    const event = await adReviewAPI.labelBlock(block.id, {
      label: labelValue,
      previous_id: block.labelEvent?.ID ?? block.labelEvent?.id ?? null,
      reason,
    })
    block.labelEvent = event
    return event
  }

  const generateCandidate = async (source) => {
    candidate.value = await adReviewAPI.generateCandidate(source)
    const ruleId = candidate.value.rule?.ID ?? candidate.value.rule?.id
    conflicts.value = ruleId ? await adReviewAPI.conflicts(ruleId) : []
    return candidate.value
  }

  const refreshActive = async (source) => {
    try {
      active.value = await adReviewAPI.activeRule(source)
    } catch (error) {
      if (error.status === 404) active.value = null
      else throw error
    }
    return active.value
  }

  const activate = async (ruleId, options) => {
    const activation = await adReviewAPI.activateRule(ruleId, options)
    active.value = { activation, rule: candidate.value?.rule ?? null }
    return activation
  }

  const rollback = async (activationId, reason) => {
    const activation = await adReviewAPI.rollbackActivation(activationId, reason)
    active.value = { activation, rule: null }
    return activation
  }

  const loadHistory = async (filter = {}) => {
    historyLoading.value = true
    historyError.value = ''
    try {
      historyPage.value = normalizeAdReviewHistoryPage(await adReviewAPI.labeledVideos(filter))
      return historyPage.value
    } catch (error) {
      historyError.value = error.message || '读取广告标记历史失败'
      throw error
    } finally {
      historyLoading.value = false
    }
  }

  return {
    enabled, authenticated, snapshot, blocks, selectedBlockId, selectedBlock,
    candidate, conflicts, active, loading, labeledCount,
    historyPage, historyLoading, historyError,
    enter, restore, logout, loadSnapshot, label, generateCandidate, refreshActive, activate, rollback, loadHistory,
  }
})
