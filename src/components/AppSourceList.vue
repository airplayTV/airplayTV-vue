<template>
  <div>
    <div v-for="(source, idx) in sourceList" :key="idx">
      <n-h5>
        <n-text>
          {{ idx }}
        </n-text>
      </n-h5>

      <div class="flex-row" style="gap: 8px 12px">
        <div v-for="(item, idx) in source" :key="idx" class="source-item">
          <n-tag
            :type="pid === item.id ? 'info' : ''"
            :bordered="false"
            @click="onOpenVideoPlay(vid, item)"
          >
            {{ item.name }}
          </n-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import {
  NButton,
  NEllipsis,
  NGi,
  NGrid,
  NGridItem,
  NH1,
  NH2,
  NH3,
  NH4,
  NH5,
  NIcon,
  NImage,
  NInput,
  NInputGroup,
  NPagination,
  NSelect,
  NTag,
  NText
} from 'naive-ui'
import { BrokenImageRound } from '@vicons/material'
import { useRoute, useRouter } from 'vue-router'
import { getCurrentSource } from '@/helpers/utils.ts'

const video = ref(null)
const route = ref(null)
const router = ref(null)

const onOpenVideoPlay = (vid, source) => {
  router.value.push(`/video/play/${vid}/${source.id}?_source=${getCurrentSource(route.value)}`)
}

export default defineComponent({
  components: {
    NSelect,
    NInputGroup,
    NInput,
    NButton,
    NIcon,
    NGrid,
    NGi,
    NImage,
    NEllipsis,
    NH1,
    NH2,
    NPagination,
    NTag,
    NH3,
    NH4,
    NH5,
    NGridItem,
    NText,
    BrokenImageRound
  },
  props: ['sourceList', 'vid', 'pid'],
  setup() {
    route.value = useRoute()
    router.value = useRouter()
    return {
      video,
      onOpenVideoPlay
    }
  }
})
</script>

<style scoped lang="scss">
.n-h5 {
  margin: 10px 0 4px 0;
}

.source-item {
  //margin-right: 10px;

  .active {
    background-color: #18a058;
    color: #ffffff;
  }

  .n-tag {
    min-width: 50px;
    display: flex;
    justify-content: center;
  }
}
</style>
