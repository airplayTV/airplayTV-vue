<template>
  <div>
    <n-grid x-gap="12" y-gap="1" :cols="cols">
      <n-gi v-for="(video, idx) in videoList" :key="idx" @click="onOpenVideo(video)">
        <div class="flex-row flex-justify-center flex-align-center">
          <n-image width="175" height="230" :src="video.thumb" class="thumb" preview-disabled>
          </n-image>
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
        v-model:page="page"
        :page-count="pages"
        simple
        @update:page="$emit('onUpdatePage', page)"
      />
    </div>

    <div class="padding-10px"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, defineProps } from 'vue'
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

const router = ref(null)

const onOpenVideo = (video) => {
  console.log('[]', router)
  router.value.push(`/video/detail/${video.id}`)
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
  props: ['cols', 'videoList', 'page', 'pages'],
  emits: ['onUpdatePage'],
  setup() {
    // const { sourceList } = storeToRefs(useAppStore())
    // const { getSourceList, setSourceList } = useAppStore()
    // onBeforeMount(onBeforeMountHandler)
    // loadingBar.value = useLoadingBar()
    router.value = useRouter()

    return {
      // page,
      onOpenVideo,
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
