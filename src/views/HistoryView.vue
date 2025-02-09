<template>
  <div>
    <AppHeader />

    <div style="padding: 0 10px">

      <n-grid x-gap="12" y-gap="1" :cols="cols">
        <n-gi v-for="(video, idx) in historyList" :key="idx" @click="onOpenVideo(video)">
          <div class="flex-row flex-justify-center flex-align-center thumb-warp">
            <div class="update-time">
              {{ video.updated_time }}
            </div>
            <n-image width="175" height="230" :src="video.thumb" class="thumb" preview-disabled>
            </n-image>
          </div>

          <div class="name text-align-center">
            <div>
              <n-ellipsis :line-clamp="1">
                {{ video.name }}
              </n-ellipsis>
            </div>

          </div>
        </n-gi>
      </n-grid>


    </div>

    <AppFooter />
  </div>
</template>

<script lang="ts">
import AppHeader from '../components/AppHeader.vue'
import AppSearchList from "@/components/AppSearchList.vue";
import AppFooter from "@/components/AppFooter.vue";
import { defineComponent, onBeforeMount, onMounted, ref } from "vue";
import { computeWindowWidthColumn } from "@/helpers/utils.ts";
import { listHistory } from "@/helpers/db.ts";
import { NEllipsis, NGi, NGrid, NImage } from "naive-ui";

const windowWidth = ref(0)
const cols = ref(2)
const historyList = ref(null)

const onMountedHandler = () => {
  window.onresize = () => {
    const { _column, _windowWidth } = computeWindowWidthColumn()
    windowWidth.value = _windowWidth
    cols.value = _column
  }
  const { _column, _windowWidth } = computeWindowWidthColumn()
  windowWidth.value = _windowWidth
  cols.value = _column
}

const onBeforeMountHandler = async () => {
  const findList = await listHistory()
  historyList.value = findList.map(item => {
    item.updated_time = (new Date(item.updated_at)).toLocaleString()
    return item
  })
  // historyList.value
  console.log('[historyList]', historyList.value)
}


export default defineComponent({
  components: {
    NGrid, NEllipsis, NImage, NGi,
    AppHeader,
    AppSearchList,
    AppFooter,
  },
  setup() {

    onMounted(onMountedHandler)
    onBeforeMount(onBeforeMountHandler)

    return {
      cols,
      historyList,
    }
  }
})
</script>

<style scoped lang="scss">
.thumb {
  border-radius: 4px;
  background-color: #f2f2f2;
}

v
.name {
  padding: 5px 0;
}

.thumb-warp {
  position: relative;

  .update-time {
    width: 167px; /** width+padding总宽等于图片设置的宽度 **/
    padding: 6px 4px;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    position: absolute;
    z-index: 9;
    bottom: 0;
    background-color: rgba(44, 62, 80, 0.59);
    color: #ffffff;
    text-align: left;
  }
}
</style>
