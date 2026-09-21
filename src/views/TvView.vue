<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div class="flex-1 flex-column">
      <AppHeader />
      <div class="tags-container">
        <n-space>
          <n-tag v-for="item in groups" :key="item.value" :type="group === item.value ? 'warning' : ''"
                 :disabled="group === item.value" @click="setGroup(item.value)">{{ item.label }}</n-tag>
        </n-space>
      </div>
      <main class="tv-list flex-1">
        <n-alert v-if="error" type="error">{{ error }} <n-button text @click="loadChannels">重试</n-button></n-alert>
        <n-spin :show="loading">
          <AppVideoGrid v-if="filtered.length" :video-list="filtered" :cols="size._column" :height="size._height" :source="IPTV_SOURCE">
            <template #actions="{video}">
              <button class="channel-favorite" type="button" :aria-pressed="favorites.includes(video.id)"
                        :aria-label="`${favorites.includes(video.id) ? '取消收藏' : '收藏'}${video.name}`"
                        @click="toggleFavorite(video.id)">{{ favorites.includes(video.id) ? '★' : '☆' }}</button>
            </template>
          </AppVideoGrid>
          <n-empty v-else-if="!loading && !error" description="没有符合条件的频道" />
        </n-spin>
      </main>
    </div>
    <AppFooter />
  </div>
</template>

<script setup>
import {computed, onBeforeUnmount, onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {NAlert, NButton, NEmpty, NSpace, NSpin, NTag, useMessage} from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import AppVideoGrid from '@/components/AppVideoGrid.vue'
import {httpInstance} from '@/helpers/request'
import {computeWindowWidthColumn} from '@/helpers/utils'
import {normalizeCastChannels} from '@/helpers/cast-session.js'
import {filterChannels, IPTV_FAVORITES_KEY, IPTV_SOURCE} from '@/helpers/iptv.js'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const channels = ref([])
const favorites = ref([])
const loading = ref(false)
const error = ref('')
const size = ref(computeWindowWidthColumn())
const resize = () => { size.value = computeWindowWidthColumn() }
let active = true
const group = computed(() => typeof route.query.group === 'string' ? route.query.group : '')
const groups = computed(() => [
  {label: '全部', value: ''},
  ...[...new Set(channels.value.map(channel => channel.group).filter(Boolean))].map(value => ({label: value, value})),
  {label: '我的收藏', value: 'favorites'},
])
const filtered = computed(() => filterChannels(channels.value, {
  keyword: typeof route.query.keyword === 'string' ? route.query.keyword : '',
  group: group.value === 'favorites' ? '' : group.value,
  favoritesOnly: group.value === 'favorites', favorites: favorites.value,
}))
const setGroup = value => router.push({path: '/tv', query: {...route.query, group: value || undefined}})
const loadChannels = async () => {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const response = await httpInstance.get('/api/iptv/channels')
    if (!active) return
    if (!Array.isArray(response.data)) throw new Error('invalid catalog')
    channels.value = normalizeCastChannels(response.data).map(channel => ({...channel, media_kind: 'live'}))
  } catch (_) {
    if (active) error.value = '频道目录加载失败，请稍后重试'
  } finally { if (active) loading.value = false }
}
const toggleFavorite = id => {
  const next = favorites.value.includes(id) ? favorites.value.filter(value => value !== id) : [...favorites.value, id]
  try {
    localStorage.setItem(IPTV_FAVORITES_KEY, JSON.stringify(next))
    favorites.value = next
  } catch (_) { message.warning('当前浏览器无法保存收藏') }
}
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(IPTV_FAVORITES_KEY) || '[]')
    if (Array.isArray(saved)) favorites.value = saved.filter(id => typeof id === 'string').slice(0, 500)
  } catch (_) { /* Ignore invalid local data. */ }
  window.addEventListener('resize', resize)
  void loadChannels()
})
onBeforeUnmount(() => { active = false; window.removeEventListener('resize', resize) })
</script>

<style scoped>
.tags-container { margin: 0 20px 10px; }
.tv-list { padding: 0 10px; }
.channel-favorite { position: absolute; right: 10px; top: 10px; color: #fff; background: #0006; border: 0; border-radius: 4px; padding: 4px 8px; font-size: 18px; cursor: pointer; }
.tv-list :deep(.n-grid > div) { position: relative; }
</style>
