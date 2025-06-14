<template>
  <div class="padding-10px">
    <div class="flex-row flex-align-center flex-justify-between">
      <div class="flex-row flex-align-center">
        <div class="logo" @click="router.push('/')">AirplayTV</div>
        <ul class="links">
          <li v-if="room">
            <RouterLink to="/control">遥控</RouterLink>
          </li>
          <li v-else>
            <RouterLink to="/qr">投射</RouterLink>
          </li>

          <li>
            <RouterLink to="/history">历史</RouterLink>
          </li>
          <li>
            <RouterLink to="/setting">设置</RouterLink>
          </li>
        </ul>
      </div>
      <div class="flex-row flex-align-center">
        <n-text depth="3">
          {{ appStore.source }}
        </n-text>
        <div class="padding-2px"></div>
        <div class="xxx flex-row" @click="onToggleSearchBox">
          <n-icon color="#000000" size="20">
            <SearchSharp />
          </n-icon>
        </div>
      </div>
    </div>

    <div v-if="showSearch">
      <div style="padding: 2px"></div>
      <n-input-group>
        <n-input v-model:value="keyword" type="text" @keyup.enter="onClickSearch" placeholder="请输入关键字进行查找" />

        <n-button type="primary" ghost @click="onClickSearch">全网搜</n-button>
      </n-input-group>
    </div>
  </div>
</template>

<script setup>
import {onBeforeMount, onBeforeUpdate, ref} from 'vue'
import {NButton, NIcon, NInput, NInputGroup, NText} from 'naive-ui'
import {SearchSharp} from '@vicons/material'
import {useRoute, useRouter} from 'vue-router'
import {getStorageSync} from '@/helpers/utils'
import {KEY_ROOM_ID} from '@/helpers/constant'
import {useAppStore} from "@/stores/app.js";

const room = ref(null)
const source = ref(0)
const keyword = ref(null)
const showSearch = ref(false)
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const onToggleSearchBox = () => {
  showSearch.value = !showSearch.value
}

const onClickSearch = () => {
  console.log('[keyword]', keyword.value)
  router.push(`/video/search?page=1&keyword=` + encodeURIComponent(keyword.value))
}

const onBeforeMountHandler = () => {
  room.value = getStorageSync(KEY_ROOM_ID)

  if (route.query.keyword) {
    keyword.value = route.query.keyword
    showSearch.value = true
  }

}

const onBeforeUpdateHandler = () => {
}

onBeforeMount(onBeforeMountHandler)
onBeforeUpdate(onBeforeUpdateHandler)

</script>

<style scoped>
ul {
  padding: 0;
  margin: 0;
  list-style-type: none;
}

ul li {
  display: inline; /* 或使用 inline-block */
}

ul li.active {
  color: #18a058;
}

.logo {
  margin-right: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #18a058;
}

.links {
  a {
    padding: 3px 0;
    margin: 0 6px;
    color: rgba(0, 0, 0, 0.8);
    text-decoration: none;
  }

  .router-link-active {
    color: #18a058;
    border-bottom: 2px solid #18a058;
  }
}
</style>
