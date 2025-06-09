import {createRouter, createWebHistory} from 'vue-router'
import {arrayContainsValue, getStorageSync, setStorageSync} from "@/helpers/utils.js";
import {KEY_VIDEO_SOURCE, KEY_VIDEO_TAG} from "@/helpers/constant.js";
import {storeToRefs} from "pinia";
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
  const { sourceList } = storeToRefs(useAppStore())
  const { setSourceList } = useAppStore()
  if (!sourceList.value) {
    const resp = await httpSourceList()
    setSourceList(resp.data)

    checkOrResetSource(resp.data)
  }
  next()
})

const checkOrResetSource = (sourceList) => {
  const appStore = useAppStore()
  const tmpSource = getStorageSync(KEY_VIDEO_SOURCE)
  const findSource = arrayContainsValue(sourceList, tmpSource, (item, v) => {
    return item.name === v
  })
  // console.log('[findSource]', findSource)
  if (!findSource) {
    setStorageSync(KEY_VIDEO_SOURCE, sourceList[0]?.name)
    appStore.setSource(sourceList[0]?.name)
    resetSourceTag(sourceList[0]?.tags)
  } else {
    appStore.setSource(tmpSource)
    resetSourceTag(
      arrayContainsValue(sourceList, tmpSource, (item, v) => {
        if (item.name === v) {
          return item.tags
        }
        return null
      }),
    )
  }
}

const resetSourceTag = (currentSourceTags) => {
  const appStore = useAppStore()
  const tmpTag = getStorageSync(KEY_VIDEO_TAG)
  const findTag = arrayContainsValue(currentSourceTags, tmpTag, (item, v) => {
    return item.value === v
  })
  if (!findTag) {
    setStorageSync(KEY_VIDEO_TAG, currentSourceTags[0]?.value)
    appStore.setTags(currentSourceTags[0]?.value)
  } else {
    appStore.setTags(tmpTag)
  }
}

export default router
