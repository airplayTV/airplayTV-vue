<template>
  <div>
    <AppHeader />

    <div style="padding: 0 10px">
      <div class="padding-10px"></div>

      <n-form
        ref="formRef"
        label-placement="left"
        label-width="auto"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="切换源" path="source">
          <n-select
            v-model:value="source"
            placeholder="切换源"
            @update:value="onUpdateSource"
            :options="formattedSourceList"
          />
        </n-form-item>
      </n-form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, ref } from 'vue'
import { NDivider, NForm, NFormItem, NInput, NSelect, NSpace } from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app.ts'
import { getStorageSync, setStorageSync } from '@/helpers/utils.ts'
import { KEY_VIDEO_SOURCE } from '@/helpers/constant.ts'
import router from '@/router'

const source = ref(null)
const formattedSourceList = ref(null)

const onBeforeMountHandler = () => {
  source.value = getStorageSync(KEY_VIDEO_SOURCE)
}

const onUpdateSource = (value) => {
  console.log('[onUpdateSource]', value)
  setStorageSync(KEY_VIDEO_SOURCE, value)
  source.value = value
  router.push('/')
}

export default defineComponent({
  components: {
    AppHeader,
    NForm,
    NInput,
    NFormItem,
    NSelect,
    NSpace,
    NDivider,
  },
  setup() {
    const { sourceList } = storeToRefs(useAppStore())
    formattedSourceList.value = sourceList.value?.map((item) => {
      return {
        label: item.name,
        value: item.name,
      }
    })

    onBeforeMount(onBeforeMountHandler)

    return {
      source,
      formattedSourceList,
      onUpdateSource,
    }
  },
})
</script>
