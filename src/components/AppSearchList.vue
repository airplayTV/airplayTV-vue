<template>
  <div>
    <n-grid x-gap="12" y-gap="1" :cols="cols">
      <n-gi v-for="(video, idx) in videoList" :key="idx" @click="onOpenVideo(video)">
        <div class="flex-row flex-justify-center flex-align-center">
          <n-image
            width="175"
            height="230"
            :src="video.thumb"
            :key="video.thumb"
            class="thumb"
            object-fit="cover"
            preview-disabled
          />
        </div>

        <div class="name text-align-center">
          <n-ellipsis :line-clamp="1">
            {{ video.name }}
          </n-ellipsis>
        </div>
      </n-gi>
    </n-grid>

    <div class="flex-row flex-justify-center" v-if="page > 0">
      <n-pagination
        v-model:page="pageModel"
        :page-count="pages"
        simple
        @update:page="$emit('onUpdatePage', { source, page: pageModel })"
      />
    </div>

    <div class="padding-10px"></div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import {
  NButton,
  NEllipsis,
  NGi,
  NGrid,
  NIcon,
  NImage,
  NInput,
  NInputGroup,
  NPagination,
  NSelect,
} from 'naive-ui'
import { BrokenImageRound } from '@vicons/material'
import { useRouter } from 'vue-router'
import { getStorageSync } from '@/helpers/utils'
import { KEY_VIDEO_SOURCE } from '@/helpers/constant'

const router = ref(null)
const pageModel = ref(null)
const pageSource = ref(null)

const onOpenVideo = (video) => {
  router.value.push(`/video/detail/${video.id}?_source=${pageSource.value}`)
}

export default defineComponent({
  components: {
    NSelect,
    NInputGroup,
    NInput,
    NButton,
    NIcon,
    NGrid,
    NGi,
    NImage,
    NEllipsis,
    NPagination,
    BrokenImageRound,
  },
  props: ['cols', 'videoList', 'page', 'pages', 'source'],
  emits: ['onUpdatePage'],
  setup(props) {
    // const { sourceList } = storeToRefs(useAppStore())
    // const { getSourceList, setSourceList } = useAppStore()
    // onBeforeMount(onBeforeMountHandler)
    // loadingBar.value = useLoadingBar()
    router.value = useRouter()

    pageModel.value = props.page
    pageSource.value = props.source

    return {
      // page,
      onOpenVideo,
      pageModel,
      pageSource,
    }
  },
})
</script>

<style scoped>
.thumb {
  border-radius: 4px;
  background-color: #f2f2f2;
}

.name {
  padding: 5px 0;
}
</style>
