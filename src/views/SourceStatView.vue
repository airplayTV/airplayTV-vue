<template>
  <div class="min-height-100vh flex-column flex-justify-between">
    <!--
    <div class="fixed-qr-reader-content" v-show="showQrReader">
      <div id="qr-reader" class="qr-reader"></div>
    </div>
    -->

    <div>
      <AppHeader />

      <div style="padding: 10px 10px;">

        <n-scrollbar x-scrollable>
          <n-table :striped="true" :bordered="false" :single-line="false" style="width: 100%;">
            <thead>
            <tr>
              <th>#</th>
              <th>源名</th>
              <th>分辨率</th>
              <th>检测视频</th>
              <th>时间</th>
              <th>错误信息</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(item,idx) in statList" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td>
                <n-ellipsis :line-clamp="1" style="max-width: 120px; min-width: 80px;">
                  {{ item.source }}
                </n-ellipsis>
              </td>
              <td>
                <span v-if="item.width > 0">{{ item.width }}*{{ item.height }}</span>
                <span v-else>N/A</span>
              </td>
              <td>
                <n-ellipsis :line-clamp="1" style="max-width: 200px">
                  {{ item.name }}{{ item.name }}{{ item.name }}{{ item.name }}{{ item.name }}{{ item.name }}{{
                    item.name
                  }}{{ item.name }}{{ item.name }}{{ item.name }}{{ item.name }}{{ item.name }}{{
                    item.name
                  }}{{ item.name }}
                </n-ellipsis>
              </td>
              <td>
                <n-text class="text-ellipsis">
                  {{ item.time || '2028-10-05 12:44:88' }}
                </n-text>
              </td>
              <td>
                <n-ellipsis :line-clamp="1" style="max-width: 200px">
                  {{ item.err }}
                </n-ellipsis>

              </td>
            </tr>
            </tbody>
          </n-table>

        </n-scrollbar>


      </div>
    </div>

    <AppFooter />


  </div>
</template>

<script setup>
import {NEllipsis, NScrollbar, NTable, NText, useLoadingBar, useMessage} from 'naive-ui'
import AppHeader from '@/components/AppHeader.vue'
import {useRoute, useRouter} from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import {onBeforeMount, ref} from "vue";
import {apiSourceStat} from "@/helpers/api.js";


const route = useRoute()
const router = useRouter()
const message = useMessage()
const loadingBar = useLoadingBar()

const statList = ref([])

const onBeforeMountHandler = () => {
  loadSourceStat()
}

const loadSourceStat = () => {
  loadingBar.start()
  apiSourceStat().then((resp) => {
    console.log('[resp]', resp.data)
    statList.value = resp.data
  }).catch((err) => {
    message.warning(err)
  }).finally(() => {
    loadingBar.finish()
  })

}

onBeforeMount(onBeforeMountHandler)

</script>

<style scoped lang="scss">
.fixed-qr-reader-content {
  width: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;

  .qr-reader {
    width: 100%;
    height: 100%;
  }
}
</style>
