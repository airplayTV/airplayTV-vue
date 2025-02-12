<template>
  <div class="padding-10px">
    <div class="flex-row flex-align-center flex-justify-between">
      <div class="flex-row flex-align-center">
        <div class="logo" @click="router.push('/')">AirplayTV</div>
        <ul style="">
          <li v-if="room">
            <RouterLink to="/control">遥控</RouterLink>
          </li>
          <li v-else>
            <RouterLink to="/qr">投射</RouterLink>
          </li>

          <li>
            <RouterLink to="/history">历史</RouterLink>
          </li>
          <li class="">
            <RouterLink to="/setting">设置</RouterLink>
          </li>
        </ul>
      </div>
      <div class="flex-row flex-align-center">
        <div class="xxx" @click="onToggleSearchBox">
          <n-icon color="#18A058" size="20">
            <SearchSharp />
          </n-icon>
        </div>
      </div>
    </div>

    <div v-if="showSearch">
      <div style="padding: 2px"></div>
      <n-input-group>
        <n-input v-model:value="keyword" type="text" placeholder="请输入关键字进行查找" />

        <n-button type="primary" ghost @click="onClickSearch"> 搜索</n-button>
      </n-input-group>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, onBeforeUpdate, ref } from 'vue'
import { NButton, NIcon, NInput, NInputGroup, NSelect } from 'naive-ui'
import { SearchSharp } from 'vicons/ionicons-v5'
import { useAppStore } from '@/stores/app.ts'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { getStorageSync } from '@/helpers/utils.ts'
import { KEY_ROOM_ID } from '@/helpers/constant.ts'

const room = ref(null)
const source = ref(0)
const keyword = ref(null)
const showSearch = ref(false)
const router = ref(null)

const onToggleSearchBox = () => {
  showSearch.value = !showSearch.value
}

const onClickSearch = () => {
  console.log('[keyword]', keyword.value)
  router.value.push(`/video/search?page=1&keyword=` + encodeURIComponent(keyword.value))
}

const onBeforeMountHandler = () => {
  room.value = getStorageSync(KEY_ROOM_ID)
}

const onBeforeUpdateHandler = () => {}

export default defineComponent({
  components: {
    NSelect,
    NInputGroup,
    NInput,
    NButton,
    NIcon,
    SearchSharp,
  },
  setup() {
    const { sourceList } = storeToRefs(useAppStore())
    const { getSourceList, setSourceList } = useAppStore()
    router.value = useRouter()

    onBeforeMount(onBeforeMountHandler)
    onBeforeUpdate(onBeforeUpdateHandler)

    return {
      source,
      keyword,
      sourceList,
      showSearch,
      onToggleSearchBox,
      getSourceList,
      setSourceList,
      router,
      onClickSearch,
      room,
    }
  },
})
</script>

<style scoped>
ul {
  padding: 0;
  margin: 0;
  list-style-type: none;
}

ul li {
  display: inline; /* 或使用 inline-block */
  padding: 2px 5px;
  color: #343434;
}

ul li.active {
  color: #18a058;
}

.logo {
  margin-right: 10px;
  font-size: 18px;
  font-weight: bold;
}
</style>
