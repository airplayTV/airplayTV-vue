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

        <n-form-item label="选择类型" path="tag" v-if="formattedTagList">
          <n-select
            v-model:value="tag"
            placeholder="选择类型"
            @update:value="onUpdateSource"
            :options="formattedTagList"
          />
        </n-form-item>
      </n-form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import { NDivider, NForm, NFormItem, NInput, NSelect, NSpace } from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app.ts'
import { arrayContainsValue, getStorageSync, setStorageSync } from '@/helpers/utils.ts'
import { KEY_VIDEO_SOURCE, KEY_VIDEO_TAG } from '@/helpers/constant.ts'

const source = ref(null)
const tag = ref(null)
const formattedSourceList = ref(null)
const formattedTagList = ref(null)

const onBeforeMountHandler = () => {
  source.value = getStorageSync(KEY_VIDEO_SOURCE)
  tag.value = getStorageSync(KEY_VIDEO_TAG)
}

const onMountedHandler = () => {
  handleTagList(source.value)
}

const handleTagList = (source) => {
  formattedTagList.value = []
  formattedSourceList.value.filter((item) => {
    if (item.value == source) {
      formattedTagList.value = item.data.tags.map((_tag) => {
        return {
          label: _tag.name,
          value: _tag.value,
          data: _tag,
        }
      })

      const findTag = arrayContainsValue(formattedTagList.value, tag.value, (item, v) => {
        return item.value == v
      })
      if (!findTag) {
        setStorageSync(KEY_VIDEO_TAG, formattedTagList.value[0]?.value)
        tag.value = formattedTagList.value[0]?.value
      }
    }
  })
}

const onUpdateSource = (value) => {
  console.log('[onUpdateSource]', value)
  setStorageSync(KEY_VIDEO_SOURCE, value)
  source.value = value
  // router.push('/')

  handleTagList(source.value)
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
        data: item,
      }
    })

    onBeforeMount(onBeforeMountHandler)
    onMounted(onMountedHandler)

    return {
      source,
      tag,
      formattedSourceList,
      formattedTagList,
      onUpdateSource,
    }
  },
})
</script>
