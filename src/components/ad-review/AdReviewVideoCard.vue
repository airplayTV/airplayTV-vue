<template>
  <article class="video-card">
    <div class="video-summary">
      <div class="video-copy">
        <span class="source-chip">{{ video.source }}</span>
        <h2>{{ video.videoName || video.vid }}</h2>
        <p>VID {{ video.vid }} · {{ video.episodeCount }} 个已标记剧集 · 最近标记 {{ formatDate(video.latestLabeledAt) }}</p>
      </div>
      <n-button
        secondary
        class="expand-button"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? '收起记录' : '查看记录' }}
      </n-button>
    </div>

    <div class="label-stats" aria-label="标签统计">
      <div v-for="item in countEntries(video.labelCounts)" :key="item.key" :class="['stat-item', `is-${item.key.toLowerCase()}`]">
        <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
      </div>
    </div>

    <div v-if="expanded" class="episode-list">
      <section v-for="episode in video.episodes" :key="episode.pid" class="episode-card">
        <div class="episode-heading">
          <div>
            <span class="episode-kicker">剧集 PID</span>
            <strong>{{ episode.pid }}</strong>
            <small>{{ episode.snapshotCount }} 次标记快照 · {{ formatDate(episode.latestLabeledAt) }}</small>
          </div>
          <n-button type="primary" secondary @click="recalibrate(episode.pid)">重新校准</n-button>
        </div>
        <div class="episode-counts">
          <span v-for="item in countEntries(episode.labelCounts)" :key="item.key">{{ item.label }} {{ item.value }}</span>
        </div>
        <div class="snapshot-list">
          <div
            v-for="snapshot in episode.snapshots"
            :key="snapshot.id"
            class="snapshot-row"
          >
            <RouterLink
              class="snapshot-link"
              :to="{ name: 'AdReviewSnapshot', params: { snapshotId: snapshot.id } }"
            >
              <span><strong>快照 #{{ snapshot.id }}</strong><small>{{ formatDate(snapshot.latestLabeledAt) }}</small></span>
              <span>{{ snapshot.labeledBlockCount }} 个已标记分段</span>
            </RouterLink>
            <n-popconfirm
              positive-text="永久删除"
              negative-text="取消"
              :positive-button-props="{ type: 'error' }"
              @positive-click="emit('deleteSnapshot', snapshot)"
            >
              <template #trigger>
                <n-button
                  class="snapshot-delete"
                  type="error"
                  secondary
                  :loading="deletingSnapshotId === snapshot.id"
                  :disabled="deletingSnapshotId !== null"
                  :aria-label="`永久删除快照 #${snapshot.id}`"
                >
                  删除
                </n-button>
              </template>
              将永久删除快照 #{{ snapshot.id }} 及其全部标记数据，无法恢复。
            </n-popconfirm>
          </div>
        </div>
      </section>
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue'
import { NButton, NPopconfirm } from 'naive-ui'
import { useRouter } from 'vue-router'
import { buildAdReviewCalibrationRoute } from '@/helpers/ad-review-history.js'

const props = defineProps({
  video: { type: Object, required: true },
  deletingSnapshotId: { type: Number, default: null },
})
const emit = defineEmits(['deleteSnapshot'])
const router = useRouter()
const expanded = ref(false)

const countEntries = (counts = {}) => [
  { key: 'CONTENT', label: '正常', value: counts.CONTENT || 0 },
  { key: 'AD', label: '广告', value: counts.AD || 0 },
  { key: 'UNSURE', label: '不确定', value: counts.UNSURE || 0 },
  { key: 'UNPLAYABLE', label: '无法播放', value: counts.UNPLAYABLE || 0 },
]

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '时间未知'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date)
}

const recalibrate = (pid) => router.push(buildAdReviewCalibrationRoute({
  source: props.video.source,
  vid: props.video.vid,
  pid,
}))
</script>

<style scoped>
.video-card { padding: 18px; border: 1px solid var(--history-border); border-radius: 16px; background: var(--history-panel); box-shadow: var(--history-shadow); display: grid; gap: 16px; }
.video-summary { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.video-copy { min-width: 0; }
.source-chip { display: inline-flex; padding: 3px 8px; border-radius: 999px; background: var(--history-accent-soft); color: var(--history-accent); font-size: 12px; font-weight: 600; }
.video-copy h2 { margin: 7px 0 3px; font-size: 19px; line-height: 1.35; overflow-wrap: anywhere; }
.video-copy p { margin: 0; color: var(--history-muted); font-size: 13px; line-height: 1.55; }
.expand-button, .episode-heading .n-button { min-height: 44px; flex: 0 0 auto; }
.label-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.stat-item { min-height: 54px; padding: 9px 11px; border-radius: 11px; background: var(--history-soft); display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--history-muted); }
.stat-item strong { color: var(--history-text); font-size: 17px; font-variant-numeric: tabular-nums; }
.stat-item.is-content { border-left: 3px solid #18a058; }
.stat-item.is-ad { border-left: 3px solid #d03050; }
.stat-item.is-unsure { border-left: 3px solid #8a929b; }
.stat-item.is-unplayable { border-left: 3px solid #f0a020; }
.episode-list { padding-top: 2px; border-top: 1px solid var(--history-border); display: grid; gap: 10px; }
.episode-card { padding: 14px; border-radius: 13px; background: var(--history-soft); display: grid; gap: 11px; }
.episode-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.episode-heading > div { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 2px 8px; }
.episode-kicker, .episode-heading small { color: var(--history-muted); font-size: 12px; }
.episode-heading small { grid-column: 1 / -1; }
.episode-counts { display: flex; flex-wrap: wrap; gap: 6px 12px; color: var(--history-muted); font-size: 12px; }
.snapshot-list { display: grid; gap: 6px; }
.snapshot-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: stretch; gap: 8px; }
.snapshot-link { min-height: 48px; padding: 8px 11px; box-sizing: border-box; border: 1px solid var(--history-border); border-radius: 10px; background: var(--history-panel); color: inherit; text-decoration: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.snapshot-link:hover { border-color: rgba(24, 160, 88, .45); }
.snapshot-link:focus-visible { outline: 3px solid rgba(24, 160, 88, .24); outline-offset: 2px; }
.snapshot-link > span:first-child { display: grid; gap: 2px; }
.snapshot-link small, .snapshot-link > span:last-child { color: var(--history-muted); font-size: 12px; }
.snapshot-delete { min-width: 64px; min-height: 48px; height: 100%; }
@media (max-width: 640px) {
  .video-card { padding: 14px; }
  .video-summary { align-items: stretch; flex-direction: column; }
  .expand-button { width: 100%; }
  .label-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .episode-heading { align-items: stretch; flex-direction: column; }
  .episode-heading .n-button { width: 100%; }
  .snapshot-row { grid-template-columns: 1fr; }
  .snapshot-link { align-items: flex-start; flex-direction: column; }
  .snapshot-delete { width: 100%; }
}
</style>
