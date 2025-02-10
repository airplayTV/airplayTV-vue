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
            @update:value="onUpdateTag"
            :options="formattedTagList"
          />
        </n-form-item>

        <div>
          <n-space justify="end">
            <n-button strong secondary type="warning" @click="showClearHistoryModal=true">
              清空历史
            </n-button>
            <n-button strong secondary type="warning" @click="showClearStorageModal = true">
              清空缓存
            </n-button>
          </n-space>
        </div>
      </n-form>
    </div>

    <n-modal
      v-model:show="showClearHistoryModal"
      preset="dialog"
      title="提示"
      content="确定清空历史数据？"
      positive-text="确认"
      negative-text="关闭"
      @positive-click="onClearVideoHistory"
    />
    <n-modal
      v-model:show="showClearStorageModal"
      preset="dialog"
      title="提示"
      content="确定清空缓存数据？"
      positive-text="确认"
      negative-text="关闭"
      @positive-click="onClearLocalStorage"
    />

  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import {
  NButton,
  NDivider,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  useMessage
} from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app.ts'
import { arrayContainsValue, getStorageSync, setStorageSync } from '@/helpers/utils.ts'
import { KEY_VIDEO_SOURCE, KEY_VIDEO_TAG } from '@/helpers/constant.ts'
import { clearHistory } from '@/helpers/db.ts'

const source = ref(null)
const tag = ref(null)
const formattedSourceList = ref(null)
const formattedTagList = ref(null)
const showClearHistoryModal = ref(false)
const showClearStorageModal = ref(false)
const message = ref(null)

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
          data: _tag
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

const onUpdateTag = (value) => {
  console.log('[onUpdateTag]', value)
  setStorageSync(KEY_VIDEO_TAG, value)
}

const onClearVideoHistoryHandler = async () => {
  showClearHistoryModal.value = true
}
const onClearLocalStorageHandler = () => {
  showClearStorageModal.value = true
}

const onClearVideoHistory = async () => {
  await clearHistory()
  message.value.info('历史播放记录已清空')
}
const onClearLocalStorage = () => {
  localStorage.clear()
  message.value.info('本地缓存数据已清空')
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
    NButton,
    NModal
  },
  setup() {
    const { sourceList } = storeToRefs(useAppStore())
    formattedSourceList.value = sourceList.value?.map((item) => {
      return {
        label: item.name,
        value: item.name,
        data: item
      }
    })

    message.value = useMessage()

    onBeforeMount(onBeforeMountHandler)
    onMounted(onMountedHandler)

    return {
      source,
      tag,
      formattedSourceList,
      formattedTagList,
      onUpdateSource,
      onUpdateTag,
      onClearVideoHistoryHandler,
      onClearLocalStorageHandler,
      onClearVideoHistory,
      onClearLocalStorage,
      showClearHistoryModal,
      showClearStorageModal
    }
  }
})
</script>
