<template>
  <div v-if="video" class="flex-column">
    <div class="flex-column flex-align-center">
      <n-image width="200" height="280" :src="video.thumbX" class="thumb">
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
import { computed, defineComponent, onBeforeMount, ref } from 'vue'
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

const video = ref(null)
// const pages = ref(0)
// const page = ref(0)

const loadingBar = ref(null)
const route = ref(null)

const loadVideo = (id: string | number) => {
  loadingBar.value!.start()
  httpVideo(id)
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
  loadVideo(route.value.params.id)
}

const videoSourceList = computed(() => {
  return formatVideoSourceMap(video.value.links)
})

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
