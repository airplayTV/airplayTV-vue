<template>
  <div class="min-height-100vh flex-column flex-justify-between">
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
                :source="sourceName"
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

    <AppFooter />
  </div>
</template>

<script>
import {defineComponent, onBeforeMount, onBeforeUpdate, onMounted, onUpdated, ref} from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import {storeToRefs} from 'pinia'
import {useAppStore} from '@/stores/app'
import {NResult, NTabPane, NTabs, useLoadingBar} from 'naive-ui'
import AppSearchList from '@/components/AppSearchList.vue'
import {useRoute} from 'vue-router'
import {apiUrl} from '@/config'
import {computeWindowWidthColumn} from '@/helpers/utils'
import {httpVideoSearch} from '@/helpers/api'
import AppFooter from '@/components/AppFooter.vue'

const route = ref(null)
const windowWidth = ref(0)
const cols = ref(2)
const appSourceList = ref(null)
const videoSearchResultMap = ref({})
const searchEventSource = ref(null)
const loadingBar = ref(null)
const keyword = ref(null)
const appStore = useAppStore()

const onMountedHandler = () => {
  window.onresize = () => {
    const { _column, _windowWidth } = computeWindowWidthColumn()
    windowWidth.value = _windowWidth
    cols.value = _column
  }
  const { _column, _windowWidth } = computeWindowWidthColumn()
  windowWidth.value = _windowWidth
  cols.value = _column
}

const onBeforeMountHandler = () => {
  doSearch()
}

const resetSearchEvent = (keyword) => {
  loadingBar.value?.start()

  searchEventSource.value = new EventSource(
      `${apiUrl}/api/sse/video/search?_source=${appStore.source}&keyword=${keyword}&page=1`,
  )

  searchEventSource.value.addEventListener('update', (e) => {
    try {
      const resp = JSON.parse(e.data)
      let d = resp.data.data
      console.log('[d]', resp.source, resp.data)
      if (resp.data.code === 200) {
        d.msg = ''
      } else {
        d = {}
        d.msg = resp.data.msg
        d.total = 0
      }
      videoSearchResultMap.value[resp.source] = d
    } catch (e) {
      console.log('[JSON.Error]', e)
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

const onUpdatePage = (data) => {
  console.log('[onUpdatePage]', data)
  const o = {
    _source: data.source,
    page: data.page,
    keyword: keyword.value,
  }

  loadingBar.value?.start()

  httpVideoSearch(new URLSearchParams(o).toString())
      .then((resp) => {
        console.log('[httpVideoSearch.resp]', resp)
        console.log('[data.source]', data.source)

        videoSearchResultMap.value[data.source] = {
          total: resp.data?.total,
          msg: resp?.msg,
          ...resp.data,
        }
      })
      .catch((err) => {
        console.log('[httpVideoSearch.Error]', err)
      })
      .finally(() => {
        loadingBar.value?.finish()
      })
}

const computedTabName = (sourceName) => {
  const n = videoSearchResultMap.value[sourceName]?.total
  if (n === false) {
    return sourceName
  }
  return `${sourceName}(${n})`
}
const computedTabMsg = (sourceName) => {
  // console.log('[xx]', {
  //   aa: sourceName,
  //   bb: videoSearchResultMap.value[sourceName]?.msg,
  //   cc: JSON.parse(JSON.stringify(videoSearchResultMap.value[sourceName]))
  // })
  return videoSearchResultMap.value[sourceName]?.msg
}

const onBeforeUpdateHandler = () => {
  console.log('[onBeforeUpdateHandler]')

  doSearch()
}
const onUpdatedHandler = () => {
  console.log('[onUpdatedHandler]')
}

const resetVideoSearchResultMap = () => {
  appSourceList.value.filter((item) => {
    videoSearchResultMap.value[item.name] = { msg: false, total: false, name: item.name }
  })
}

const doSearch = () => {
  if (keyword.value !== route.value.query.keyword) {
    resetVideoSearchResultMap()
    keyword.value = route.value.query.keyword
    resetSearchEvent(keyword.value)
  }
}

export default defineComponent({
  components: {
    AppFooter,
    AppSearchList,
    AppHeader,
    NTabs,
    NTabPane,
    NResult,
  },
  setup() {
    const { sourceList } = storeToRefs(useAppStore())
    const { getSourceList, setSourceList } = useAppStore()

    appSourceList.value = sourceList.value
    // console.log('[sourceList.XXX]', sourceList.value)

    route.value = useRoute()
    loadingBar.value = useLoadingBar()

    onMounted(onMountedHandler)
    onBeforeMount(onBeforeMountHandler)
    onBeforeUpdate(onBeforeUpdateHandler)
    onUpdated(onUpdatedHandler)
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
