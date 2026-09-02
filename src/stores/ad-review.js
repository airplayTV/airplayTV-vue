import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { applyAdReviewLabelEvents, createAdReviewSession, normalizeAdReviewSnapshot } from '@/helpers/ad-review-state.js'
import {
  createAdReviewSingleFlight,
  isAdReviewAuthenticationError,
  normalizeAdReviewHistoryPage,
  normalizeAdReviewSnapshotDetail,
  runAdReviewSnapshotDeletion,
  runAdReviewSourceDeletion,
  runAdReviewVideoDeletion,
} from '@/helpers/ad-review-history.js'
import { adReviewAPI } from '@/helpers/ad-review-api.js'
import { loadCandidateConflictsSafely, mergeCandidateActivation } from '@/helpers/ad-review-publication.js'
import { normalizeAdReviewRuleOverview } from '@/helpers/ad-review-rule-overview.js'

export const useAdReviewStore = defineStore('ad-review', () => {
  const session = createAdReviewSession(typeof sessionStorage === 'undefined' ? null : sessionStorage)
  const enabled = ref(session.enabled())
  const authenticated = ref(false)
  const snapshot = ref(null)
  const blocks = ref([])
  const selectedBlockId = ref(null)
  const candidate = ref(null)
  const conflicts = ref([])
  const conflictsError = ref('')
  const active = ref(null)
  const loading = ref(false)
  const historyPage = ref(normalizeAdReviewHistoryPage())
  const historyLoading = ref(false)
  const historyError = ref('')
  const ruleOverview = ref(normalizeAdReviewRuleOverview())
  const ruleOverviewLoading = ref(false)
  const ruleOverviewError = ref('')
  const historySnapshot = ref(null)
  const historySnapshotLoading = ref(false)
  const historySnapshotError = ref('')
  const deletingSnapshotId = ref(null)
  const deletingSource = ref('')
  const deletingVideoKey = ref('')
  const runRestore = createAdReviewSingleFlight()

  const selectedBlock = computed(() => blocks.value.find((block) => block.id === selectedBlockId.value) ?? null)
  const labeledCount = computed(() => blocks.value.filter((block) => block.labelEvent).length)
  const unlabeledCount = computed(() => blocks.value.length - labeledCount.value)

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
      conflictsError.value = ''
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

  const markUnlabeledContent = async () => {
    if (!snapshot.value?.id) return 0
    const result = await adReviewAPI.markUnlabeledContent(snapshot.value.id)
    applyAdReviewLabelEvents(blocks.value, result.events ?? result.Events ?? [])
    return Number(result.count ?? result.Count ?? 0)
  }

  const generateCandidate = async (source) => {
    candidate.value = await adReviewAPI.generateCandidate(source)
    active.value = mergeCandidateActivation(active.value, candidate.value)
    const ruleId = candidate.value.rule?.ID ?? candidate.value.rule?.id
    const conflictResult = await loadCandidateConflictsSafely(ruleId, adReviewAPI.conflicts)
    conflicts.value = conflictResult.conflicts
    conflictsError.value = conflictResult.error?.message || ''
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
      if (isAdReviewAuthenticationError(error)) exitLocal()
      historyError.value = error.message || '读取广告标记历史失败'
      throw error
    } finally {
      historyLoading.value = false
    }
  }

  const loadRuleOverview = async () => {
    ruleOverviewLoading.value = true
    ruleOverviewError.value = ''
    try {
      ruleOverview.value = normalizeAdReviewRuleOverview(await adReviewAPI.ruleOverview())
      return ruleOverview.value
    } catch (error) {
      if (isAdReviewAuthenticationError(error)) exitLocal()
      ruleOverviewError.value = error.message || '读取来源规则概览失败'
      throw error
    } finally {
      ruleOverviewLoading.value = false
    }
  }

  const loadSnapshotDetail = async (snapshotId) => {
    historySnapshotLoading.value = true
    historySnapshotError.value = ''
    try {
      historySnapshot.value = normalizeAdReviewSnapshotDetail(await adReviewAPI.snapshotDetail(snapshotId))
      return historySnapshot.value
    } catch (error) {
      if (isAdReviewAuthenticationError(error)) exitLocal()
      historySnapshotError.value = error.message || '读取历史快照失败'
      throw error
    } finally {
      historySnapshotLoading.value = false
    }
  }

  const deleteSnapshot = async (snapshotId, filter = {}) => {
    deletingSnapshotId.value = snapshotId
    historyError.value = ''
    try {
      return await runAdReviewSnapshotDeletion(snapshotId, {
        deleteSnapshot: adReviewAPI.deleteSnapshot,
        reloadHistory: async () => {
          const page = await loadHistory(filter)
          if (page.page > 1 && page.items.length === 0) {
            await loadHistory({ ...filter, page: page.page - 1 })
          }
        },
      })
    } catch (error) {
      if (isAdReviewAuthenticationError(error)) exitLocal()
      historyError.value = error.message || '永久删除快照失败'
      throw error
    } finally {
      deletingSnapshotId.value = null
    }
  }

  const deleteSourceReviewData = async (source) => {
    deletingSource.value = source
    ruleOverviewError.value = ''
    try {
      return await runAdReviewSourceDeletion(source, {
        deleteSource: adReviewAPI.deleteSourceReviewData,
        reloadOverview: loadRuleOverview,
      })
    } catch (error) {
      if (isAdReviewAuthenticationError(error)) exitLocal()
      ruleOverviewError.value = error.message || '删除来源广告标记数据失败'
      throw error
    } finally {
      deletingSource.value = ''
    }
  }

  const deleteVideoReviewData = async (video, filter = {}) => {
    deletingVideoKey.value = `${video.source}\u0000${video.vid}`
    historyError.value = ''
    try {
      return await runAdReviewVideoDeletion(video, {
        deleteVideo: adReviewAPI.deleteVideoReviewData,
        reloadHistory: async () => {
          const page = await loadHistory(filter)
          if (page.page > 1 && page.items.length === 0) {
            await loadHistory({ ...filter, page: page.page - 1 })
          }
        },
      })
    } catch (error) {
      if (isAdReviewAuthenticationError(error)) exitLocal()
      historyError.value = error.message || '删除视频广告标记数据失败'
      throw error
    } finally {
      deletingVideoKey.value = ''
    }
  }

  return {
    enabled, authenticated, snapshot, blocks, selectedBlockId, selectedBlock,
    candidate, conflicts, conflictsError, active, loading, labeledCount, unlabeledCount,
    historyPage, historyLoading, historyError, ruleOverview, ruleOverviewLoading, ruleOverviewError,
    historySnapshot, historySnapshotLoading, historySnapshotError, deletingSnapshotId, deletingSource, deletingVideoKey,
    enter, restore, logout, loadSnapshot, label, markUnlabeledContent, generateCandidate, refreshActive, activate, rollback,
    loadHistory, loadRuleOverview, loadSnapshotDetail, deleteSnapshot, deleteSourceReviewData, deleteVideoReviewData,
  }
})
