<script setup>
import AppHeader from '../components/AppHeader.vue'
import AppVideoList from '@/components/AppVideoList.vue'
import {onBeforeUpdate, onMounted, ref} from 'vue'
import AppFooter from '@/components/AppFooter.vue'
import {computeWindowWidthColumn, getStorageSync, setStorageSync} from '@/helpers/utils'
import {storeToRefs} from 'pinia'
import {useAppStore} from '@/stores/app'
import {KEY_VIDEO_SOURCE, KEY_VIDEO_TAG} from '@/helpers/constant'
import {NSpace, NTag} from 'naive-ui'
import {useRoute} from "vue-router";

const route = useRoute()

const windowWidth = ref(0)
const cols = ref(2)
const tagList = ref([])
const tag = ref(null)
const _pageKey = ref('')

onMounted(() => {
  window.onresize = () => {
    const { _column, _windowWidth } = computeWindowWidthColumn()
    windowWidth.value = _windowWidth
    cols.value = _column
  }
  const { _column, _windowWidth } = computeWindowWidthColumn()
  windowWidth.value = _windowWidth
  cols.value = _column

  loadTagList()
})

const loadTagList = () => {
  const { sourceList } = storeToRefs(useAppStore())
  const tmpSource = getStorageSync(KEY_VIDEO_SOURCE)
  tag.value = getStorageSync(KEY_VIDEO_TAG)

  sourceList.value.filter((item) => {
    if (item.name === tmpSource) {
      tagList.value = item.tags.map((_tag) => {
        return { label: _tag.name, value: _tag.value, data: _tag }
      })
    }
  })

  console.log('[tagList]', tagList.value)

}

const onUpdateTag = (value) => {
  console.log('[onUpdateTag]', value)
  setStorageSync(KEY_VIDEO_TAG, value)
  tag.value = value
}

const onBeforeUpdateHandler = () => {
  _pageKey.value = route.fullPath
}

onBeforeUpdate(onBeforeUpdateHandler)

</script>

<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <div class="flex-1 flex-column flex-justify-between">
      <AppHeader />
      <div class="tags-container">
        <n-space>
          <n-tag v-for="(item,idx) in tagList" :key="idx" @click="onUpdateTag(item.value)"
                 :type="tag===item.value?'success':''">
            {{ item.label }}
          </n-tag>
        </n-space>
      </div>
      <div style="padding: 0 10px" class="flex-1 flex-column flex-justify-between">
        <AppVideoList :cols="cols" :key="_pageKey" />
      </div>
    </div>

    <AppFooter />
  </div>
</template>

<style scoped lang="scss">
.tags-container {
  margin: 0 20px 10px 20px;
}
</style>
