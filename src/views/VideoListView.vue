<script setup lang="ts">
import AppHeader from '../components/AppHeader.vue'
import AppVideoList from '@/components/AppVideoList.vue'
import { onMounted, ref } from 'vue'
import AppFooter from '@/components/AppFooter.vue'
import { computeWindowWidthColumn, getStorageSync, setStorageSync } from '@/helpers/utils.ts'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app.ts'
import { KEY_VIDEO_SOURCE, KEY_VIDEO_TAG } from '@/helpers/constant.ts'
import { NSpace, NTag } from 'naive-ui'

const windowWidth = ref(0)
const cols = ref(2)
const tagList = ref([])
const tag = ref(null)

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
    if (item.name == tmpSource) {
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
        <AppVideoList :cols="cols" :key="tag" />
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
