<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div>
      <AppHeader />
      <div style="padding: 0 10px">
        <n-tabs type="line" animated placement="top" :key="videoSearchResultKey">
          <n-tab-pane
              v-for="item in videoSearchResultList"
              :key="item._id"
              :name="item.source"
              :tab="computedTabName(item)"
          >
            <AppSearchList
                :key="videoSearchResultKey"
                :cols="cols"
                :video-list="item.data.list"
                :page="item.data.page"
                :pages="item.data.pages"
                :source="item.source"
                @on-update-page="onUpdatePage"
            />

            <div v-if="computedTabMsg(item)">
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
const videoSearchResultList = ref([])
const videoSearchResultKey = ref('')
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

  videoSearchResultList.value = []
  let tmpList = []

  searchEventSource.value = new EventSource(
      `${apiUrl}/api/sse/video/search?_source=${appStore.source}&keyword=${keyword}&page=1`,
  )

  searchEventSource.value.addEventListener('update', (e) => {
    try {
      const resp = JSON.parse(e.data)
      let d = resp.data.data
      // console.log('[d]', resp.source, resp.data)
      if (resp.data.code === 200) {
        d.msg = ''
      } else {
        d = {}
        d.msg = resp.data.msg
        d.total = 0
      }

      tmpList.push({ source: resp.source, data: d, total: d.total, _id: Math.random() })
      tmpList.sort((a, b) => b.total - a.total)
      videoSearchResultList.value = tmpList

      videoSearchResultKey.value = `${Math.random()}`
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

  httpVideoSearch(new URLSearchParams(o).toString()).then((resp) => {
    videoSearchResultList.value.filter((item, idx) => {
      if (item.source === data.source) {
        videoSearchResultList.value[idx] = {
          source: data.source,
          data: resp.data,
          total: resp.data.total,
          _id: Math.random()
        }
        videoSearchResultList.value = [...videoSearchResultList.value]
      }
    })

    // videoSearchResultKey.value = `${Math.random()}`
  }).catch((err) => {
    console.log('[httpVideoSearch.Error]', err)
  }).finally(() => {
    loadingBar.value?.finish()
  })
}

const computedTabName = (item) => {
  return `${item.source}(${item.total})`
}
const computedTabMsg = (item) => {
  return item.data.msg
}

const onBeforeUpdateHandler = () => {
  console.log('[onBeforeUpdateHandler]')

  doSearch()
}
const onUpdatedHandler = () => {
  console.log('[onUpdatedHandler]')
}

const resetVideoSearchResultMap = () => {
  videoSearchResultList.value = []
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
    const appStore = useAppStore()
    appSourceList.value = appStore.sourceList

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
      videoSearchResultList,
      videoSearchResultKey,
      computedTabName,
      computedTabMsg,
      route,
    }
  },
})
</script>
