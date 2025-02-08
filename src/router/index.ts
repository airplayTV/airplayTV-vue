import { createRouter, createWebHistory } from 'vue-router'
import VideoListView from '@/views/VideoListView.vue'
import { useAppStore } from '@/stores/app.ts'
import { httpSourceList } from '@/helpers/api.ts'
import { storeToRefs } from 'pinia'
import { arrayContainsValue, getStorageSync, setStorageSync } from '@/helpers/utils.ts'
import { KEY_VIDEO_SOURCE, KEY_VIDEO_TAG } from '@/helpers/constant.ts'

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
      component: () => import('../views/VideoPlay.vue'),
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

const checkOrResetSource = (sourceList: any) => {
  const tmpSource = getStorageSync(KEY_VIDEO_SOURCE)
  const findSource = arrayContainsValue(sourceList, tmpSource, (item: any, v: any) => {
    return item.name == v
  })
  // console.log('[findSource]', findSource)
  if (!findSource) {
    setStorageSync(KEY_VIDEO_SOURCE, sourceList[0]?.name)
    resetSourceTag(sourceList[0]?.tags)
  } else {
    resetSourceTag(
      arrayContainsValue(sourceList, tmpSource, (item: any, v: any) => {
        if (item.name == v) {
          return item.tags
        }
        return null
      }),
    )
  }
}

const resetSourceTag = (currentSourceTags: any) => {
  const tmpTag = getStorageSync(KEY_VIDEO_TAG)
  const findTag = arrayContainsValue(currentSourceTags, tmpTag, (item: any, v: any) => {
    return item.value == v
  })
  if (!findTag) {
    setStorageSync(KEY_VIDEO_TAG, currentSourceTags[0]?.value)
  }
}

export default router
