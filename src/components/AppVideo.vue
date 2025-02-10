<template>
  <div v-if="video" class="flex-column">
    <div class="flex-column flex-align-center">
      <n-image width="200" height="280" :src="video.thumb" class="thumb">
        <template #error>
          <n-icon :size="100" color="lightGrey">
            <BrokenImageRound />
          </n-icon>
        </template>
      </n-image>
    </div>

    <n-h2>{{ video.name }}</n-h2>

    <n-ellipsis :line-clamp="6">
      <b>
        <n-text depth="2">简介：</n-text>
      </b>
      <n-text depth="3">
        {{ video.intro }}
      </n-text>
    </n-ellipsis>

    <AppSourceList :source-list="videoSourceList" :vid="video.id" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onBeforeUpdate, onUpdated, ref } from 'vue'
import {
  NButton,
  NEllipsis,
  NGi,
  NGrid,
  NH1,
  NH2,
  NIcon,
  NImage,
  NInput,
  NInputGroup,
  NPagination,
  NSelect,
  NText,
  useLoadingBar,
} from 'naive-ui'
import { BrokenImageRound } from '@vicons/material'
import { useRoute } from 'vue-router'
import { httpVideo } from '@/helpers/api.ts'
import AppSourceList from '@/components/AppSourceList.vue'
import { formatVideoSourceMap } from '@/helpers/app.ts'
import { getCurrentSource } from '@/helpers/utils.ts'

const video = ref(null)
// const pages = ref(0)
// const page = ref(0)
const _key = ref(null)

const loadingBar = ref(null)
const route = ref(null)

const loadVideo = (id: string | number) => {
  loadingBar.value!.start()
  httpVideo(new URLSearchParams({ id, _source: getCurrentSource(route.value) }).toString())
    .then((resp) => {
      console.log('[resp]', resp)
      video.value = resp.data
    })
    .catch((err) => {
      console.log('[err]', err)
    })
    .finally(() => {
      loadingBar.value!.finish()
    })
}

const onBeforeMountHandler = () => {
  console.log('[ROUTE]', route.value.params)
  // loadVideo(route.value.params.id)
  doRequest()
}

const videoSourceList = computed(() => {
  return formatVideoSourceMap(video.value.links)
})

const onBeforeUpdateHandler = () => {
  doRequest()
}
const onUpdatedHandler = () => {}

const doRequest = () => {
  const _k = `${route.value.params.id},${route.value.query._source}`
  if (_k != _key.value) {
    _key.value = _k
    loadVideo(route.value.params.id)
  }
}

export default defineComponent({
  components: {
    AppSourceList,
    NSelect,
    NInputGroup,
    NInput,
    NButton,
    NIcon,
    NGrid,
    NGi,
    NImage,
    NEllipsis,
    NH1,
    NH2,
    NText,
    NPagination,
    BrokenImageRound,
  },
  setup() {
    // const { sourceList } = storeToRefs(useAppStore())
    // const { getSourceList, setSourceList } = useAppStore()
    onBeforeMount(onBeforeMountHandler)

    onBeforeUpdate(onBeforeUpdateHandler)
    onUpdated(onUpdatedHandler)

    loadingBar.value = useLoadingBar()
    route.value = useRoute()
    return {
      video,
      videoSourceList,
    }
  },
})
</script>

<style scoped>
.thumb {
  border-radius: 4px;
}

.name {
  padding: 5px 0;
}

.n-h2 {
  margin: 12px 0 4px 0 !important;
}
</style>
