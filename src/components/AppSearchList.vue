<template>
  <div>
    <n-grid x-gap="12" y-gap="1" :cols="cols" class="links">
      <n-gi v-for="(video, idx) in videoList" :key="video.id">
        <RouterLink :target="getRouterLinkType(appStore.styleConfig)" :to="`/video/detail/${video.id}?_source=${pageSource}`" class="flex-column">
          <div class="flex-row flex-justify-center flex-align-center position-relative">
            <n-image
                :width="width"
                :height="height"
                :src="video.thumb"
                :key="video.thumb"
                class="thumb"
                object-fit="cover"
                preview-disabled
            />
            <div class="position-absolute vod-update-time" :style="{width:`${width}px`}">
              <div class="c" v-if="video.updated_at">
                更新：{{ FormatToDate(video.updated_at) }}
              </div>
            </div>
          </div>

          <div class="name text-align-center flex-justify-center">
            <n-ellipsis :line-clamp="1">
              {{ video.name }}
            </n-ellipsis>
          </div>

        </RouterLink>
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
import {defineComponent, ref} from 'vue'
import {NButton, NEllipsis, NGi, NGrid, NIcon, NImage, NInput, NInputGroup, NPagination, NSelect,} from 'naive-ui'
import {BrokenImageRound} from '@vicons/material'
import {useRouter} from 'vue-router'
import {FormatToDate} from "@/helpers/time.js";
import {getRouterLinkType} from "../helpers/app.js";
import {useAppStore} from "@/stores/app.js";

const router = ref(null)
const pageModel = ref(null)
const pageSource = ref(null)
const appStore = useAppStore()

const onOpenVideo = (video) => {
  router.value.push(`/video/detail/${video.id}?_source=${pageSource.value}`)
}

export default defineComponent({
  methods: { FormatToDate },
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
  props: ['cols', 'width', 'height', 'videoList', 'page', 'pages', 'source'],
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
      appStore,
      getRouterLinkType,
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
  display: flex;
}

.vod-update-time {
  width: 175px;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.47);
  border-radius: 4px;
  font-size: 12px;
  color: #ffffff;

  .c {
    padding: 4px 6px;
  }
}
</style>
