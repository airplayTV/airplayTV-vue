import {ref} from 'vue'
import {defineStore} from 'pinia'
import {setStorageSync} from "@/helpers/utils.js";
import {
  KEY_VIDEO_SOURCE,
  KEY_VIDEO_SOURCE_LIST,
  KEY_VIDEO_TAG,
  KEY_VIDEO_SOURCE_SECRET,
  KEY_VIDEO_STYLE_CONFIG,
  KEY_VIDEO_LATEST_VIDEO
} from "@/helpers/constant.js";

export const useAppStore = defineStore('app', () => {
  const sourceList = ref(null)
  const source = ref(null)
  const tags = ref(null)
  const styleConfig = ref(0)
  const sourceSecret = ref(null)
  const latestVideo = ref(null)// 最近一次点击的视频信息，防止部分视频详情没有图片，用来补充

  function getSourceList() {
    return sourceList.value
  }

  function setSourceList(data) {
    setStorageSync(KEY_VIDEO_SOURCE_LIST, data)
    sourceList.value = data
  }

  function setSource(data) {
    setStorageSync(KEY_VIDEO_SOURCE, data)
    source.value = data
  }

  function setTags(data) {
    setStorageSync(KEY_VIDEO_TAG, data)
    tags.value = data
  }

  function setStyleConfig(data) {
    setStorageSync(KEY_VIDEO_STYLE_CONFIG, data)
    styleConfig.value = data
  }

  function setSourceSecret(data, local = true) {
    if (local){
      setStorageSync(KEY_VIDEO_SOURCE_SECRET, data)
    }
    sourceSecret.value = data
  }

  function setLatestVideo(data) {
    setStorageSync(KEY_VIDEO_LATEST_VIDEO, data)
    latestVideo.value = data
  }

  return {
    sourceList,
    getSourceList,
    setSourceList,
    source,
    tags,
    setSource,
    setTags,
    setStyleConfig,
    setSourceSecret,
    styleConfig,
    sourceSecret,
    latestVideo,
    setLatestVideo,
  }
})
