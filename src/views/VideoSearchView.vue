<template>
  <div>
    <AppHeader />
    <div style="padding: 0 10px">
      <n-tabs type="line" animated placement="top">
        <n-tab-pane
          v-for="(item, sourceName) in videoSearchResultMap"
          :key="sourceName"
          :name="sourceName"
          :tab="computedTabName(sourceName)"
        >
          <AppSearchList
            :cols="cols"
            :video-list="videoSearchResultMap[sourceName].list"
            :page="videoSearchResultMap[sourceName].page"
            :pages="videoSearchResultMap[sourceName].pages"
            @on-update-page="onUpdatePage"
          />

          <div v-if="computedTabMsg(sourceName)">
            <div class="padding-30px"></div>
            <n-result status="404" title="暂无数据" :description="item.msg"></n-result>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app.ts'
import { NResult, NTabPane, NTabs, useLoadingBar } from 'naive-ui'
import AppSearchList from '@/components/AppSearchList.vue'
import { useRoute } from 'vue-router'
import { apiUrl } from '@/config.ts'
import { getStorageSync } from '@/helpers/utils.ts'
import { KEY_VIDEO_SOURCE } from '@/helpers/constant.ts'

const route = ref(null)
const windowWidth = ref(0)
const cols = ref(2)
// const appSourceList = ref(null)
const videoSearchResultMap = ref({})
const searchEventSource = ref(null)
const loadingBar = ref(null)

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
  loadingBar.value?.start()

  const source = getStorageSync(KEY_VIDEO_SOURCE)
  searchEventSource.value = new EventSource(
    `${apiUrl}/api/sse/video/search?_source=${source}&keyword=${keyword}&page=1`,
  )

  searchEventSource.value.addEventListener('update', (e) => {
    // console.log(JSON.parse(e.data))
    try {
      const resp = JSON.parse(e.data)
      let d = resp.data.data
      if (resp.data.code == 200) {
        d.msg = ''
      } else {
        d = {}
        d.msg = resp.data.msg
        d.total = 0
      }
      videoSearchResultMap.value[resp.source] = d

      // console.log('[XXX]', JSON.parse(JSON.stringify(videoSearchResultMap.value)))
    } catch (e) {
      //
    }
  })

  searchEventSource.value.addEventListener('finish', (e) => {
    console.log('[FINISH]', e)
    searchEventSource.value.close()

    loadingBar.value?.finish()
  })

  searchEventSource.value.onerror = () => {
    console.error('EventSource failed.')
  }
}

const onUpdatePage = (page) => {
  console.log('[onUpdatePageXX]', page)
}

const computedTabName = (sourceName) => {
  const n = videoSearchResultMap.value[sourceName]?.total
  if (n === false) {
    return sourceName
  }
  return `${sourceName}(${n})`
}
const computedTabMsg = (sourceName) => {
  console.log('[xx]', {
    aa: sourceName,
    bb: videoSearchResultMap.value[sourceName]?.msg,
    cc: JSON.parse(JSON.stringify(videoSearchResultMap.value[sourceName])),
  })
  return videoSearchResultMap.value[sourceName]?.msg
}

export default defineComponent({
  components: {
    AppSearchList,
    AppHeader,
    NTabs,
    NTabPane,
    NResult,
  },
  setup() {
    const { sourceList } = storeToRefs(useAppStore())
    const { getSourceList, setSourceList } = useAppStore()

    // appSourceList.value = sourceList.value
    // console.log('[sourceList.XXX]', sourceList.value)

    sourceList.value.filter((item) => {
      videoSearchResultMap.value[item.name] = { msg: false, total: false, name: item.name }
    })

    route.value = useRoute()
    loadingBar.value = useLoadingBar()

    onMounted(onMountedHandler)
    onBeforeMount(onBeforeMountHandler)
    return {
      cols,
      // appSourceList,
      onUpdatePage,
      videoSearchResultMap,
      computedTabName,
      computedTabMsg,
    }
  },
})
</script>
