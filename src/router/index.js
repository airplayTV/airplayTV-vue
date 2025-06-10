import {createRouter, createWebHistory} from 'vue-router'
import {arrayContainsValue, getStorageSync} from "@/helpers/utils.js";
import {KEY_VIDEO_SOURCE, KEY_VIDEO_TAG} from "@/helpers/constant.js";
import {useAppStore} from "@/stores/app.js";
import {httpSourceList} from "@/helpers/api.js";
import VideoListView from "@/views/VideoListView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: VideoListView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/video/list',
      name: 'VideoList',
      component: () => import('../views/VideoListView.vue'),
    },
    {
      path: '/video/search',
      name: 'VideoSearch',
      component: () => import('../views/VideoSearchView.vue'),
    },
    {
      path: '/video/detail/:id',
      name: 'VideoDetail',
      component: () => import('../views/VideoView.vue'),
    },
    {
      path: '/video/play/:vid/:pid',
      name: 'VideoPlay',
      component: () => import('../views/VideoPlayView.vue'),
    },
    {
      path: '/setting',
      name: 'Setting',
      component: () => import('../views/SettingView.vue'),
    },
    {
      path: '/history',
      name: 'History',
      component: () => import('../views/HistoryView.vue'),
    },
    {
      path: '/qr',
      name: 'Qr',
      component: () => import('../views/QrView.vue'),
    },
    {
      path: '/join',
      name: 'Join',
      component: () => import('../views/JoinRoomView.vue'),
    },
    {
      path: '/control',
      name: 'Control',
      component: () => import('../views/ControlView.vue'),
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const appStore = useAppStore()

  // 从 URL 解析 SOURCE 和 TAG
  if (to.query.hasOwnProperty('_source') && to.query._source !== appStore.source) {
    appStore.setSource(to.query._source)
  }
  if (to.query.hasOwnProperty('tag') && to.query.tag !== appStore.tags) {
    appStore.setTags(to.query.tag)
  }

  if (!appStore.sourceList) {
    const resp = await httpSourceList()
    appStore.setSourceList(resp.data)

    checkOrResetSource(resp.data)
  }
  next()
})

const checkOrResetSource = (sourceList) => {
  const appStore = useAppStore()
  const tmpSource = getStorageSync(KEY_VIDEO_SOURCE)
  if (sourceList.length <= 0) {
    return// 无可用源
  }
  // console.log('[xxx]', tmpSource)
  const findSource = arrayContainsValue(sourceList, tmpSource, (item, v) => {
    return item.name === v
  })
  // console.log('[findSource]', findSource)
  if (!findSource) {
    appStore.setSource(sourceList[0].name)
    resetSourceTag(sourceList[0].tags)
  } else {
    appStore.setSource(tmpSource)
    const tmpTags = arrayContainsValue(sourceList, tmpSource, (item, v) => {
      if (item.name === v) {
        return item.tags
      }
      return null
    })
    resetSourceTag(tmpTags)
  }
}

const resetSourceTag = (currentSourceTags) => {
  const appStore = useAppStore()
  const tmpTag = getStorageSync(KEY_VIDEO_TAG)
  const findTag = arrayContainsValue(currentSourceTags, tmpTag, (item, v) => {
    return item.value === v
  })
  if (!findTag) {
    appStore.setTags(currentSourceTags[0]?.value)
  } else {
    appStore.setTags(tmpTag)
  }
}

export default router
