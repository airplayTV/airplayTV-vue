import {createRouter, createWebHistory} from 'vue-router'
import {arrayContainsValue, getStorageSync} from "@/helpers/utils.js";
import {KEY_VIDEO_SOURCE, KEY_VIDEO_SOURCE_SECRET, KEY_VIDEO_TAG, KEY_VIDEO_THUMB_LAYOUT} from "@/helpers/constant.js";
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

  next()
})

export default router
