<template>
  <div>
    <AppHeader />
    <div style="padding: 0 10px">
      <n-tabs type="line" animated placement="top">
        <n-tab-pane
          v-for="(item, idx) in appSourceList"
          :key="idx"
          :name="item.name"
          :tab="item.name"
        >
          <AppSearchList
            v-if="videoSearchResultMap[item.name]"
            :cols="cols"
            :video-list="videoSearchResultMap[item.name].list"
            :page="videoSearchResultMap[item.name].page"
            :pages="videoSearchResultMap[item.name].pages"
            @on-update-page="onUpdatePage"
          />

          <div v-else>
            <div class="padding-30px"></div>
            <n-result status="404" title="暂无数据" description="生活总归带点荒谬"></n-result>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>

<script lang="ts">
import AppVideoList from '@/components/AppVideoList.vue'
import { defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app.ts'
import { NBadge, NResult, NTabPane, NTabs } from 'naive-ui'
import AppSearchList from '@/components/AppSearchList.vue'
import { useRoute } from 'vue-router'
import { apiUrl } from '@/config.ts'
import { getStorageSync } from '@/helpers/utils.ts'
import { KEY_VIDEO_SOURCE } from '@/helpers/constant.ts'

const route = ref(null)
const windowWidth = ref(0)
const cols = ref(2)
const appSourceList = ref(null)
const videoSearchResultMap = ref({})
const searchEventSource = ref(null)

const computeWindowWidth = () => {
  windowWidth.value = window.innerWidth
  console.log('[]', window.innerWidth)
  if (window.innerWidth <= 370) {
    cols.value = 1
  } else if (window.innerWidth <= 370 + 200) {
    cols.value = 2
  } else if (window.innerWidth <= 370 + 200 * 2) {
    cols.value = 3
  } else if (window.innerWidth <= 370 + 200 * 3) {
    cols.value = 4
  } else {
    cols.value = 5
  }
}

const onMountedHandler = () => {
  window.onresize = () => {
    computeWindowWidth()
  }
  computeWindowWidth()
}

const onBeforeMountHandler = () => {
  console.log('[onBeforeMountHandler]', route.value.query)
  resetSearchEvent(route.value.query.keyword)
}

const resetSearchEvent = (keyword) => {
  const source = getStorageSync(KEY_VIDEO_SOURCE)
  searchEventSource.value = new EventSource(
    `${apiUrl}/api/sse/video/search?_source=${source}&keyword=${keyword}&page=1`,
  )

  searchEventSource.value.addEventListener('update', (e) => {
    console.log(JSON.parse(e.data))
    try {
      const resp = JSON.parse(e.data)
      videoSearchResultMap.value[resp.source] = resp.data.data
    } catch (e) {
      //
    }
  })

  searchEventSource.value.addEventListener('finish', (e) => {
    console.log('[FINISH]', e)
    searchEventSource.value.close()
  })

  searchEventSource.value.onerror = () => {
    console.error('EventSource failed.')
  }
}

const onUpdatePage = (page) => {
  console.log('[onUpdatePageXX]', page)
}

export default defineComponent({
  components: {
    AppSearchList,
    AppHeader,
    AppVideoList,
    NTabs,
    NTabPane,
    NBadge,
    NResult,
  },
  setup() {
    const { sourceList } = storeToRefs(useAppStore())
    const { getSourceList, setSourceList } = useAppStore()

    appSourceList.value = sourceList.value
    console.log('[sourceList]', sourceList.value)

    route.value = useRoute()

    onMounted(onMountedHandler)
    onBeforeMount(onBeforeMountHandler)
    return {
      cols,
      appSourceList,
      onUpdatePage,
      videoSearchResultMap,
    }
  },
})
</script>
