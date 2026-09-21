<template>
    <div class="links">
      <n-grid x-gap="12" y-gap="1" :cols="cols">
        <n-gi v-for="(video, idx) in videoList" :key="video.id">
          <RouterLink
              :target="getRouterLinkType(appStore.styleConfig)"
              @click="appStore.setLatestVideo(video)"
              :to="{path: `/video/detail/${video.id}`, query: {_source: source, ...(video.pid ? {pid: video.pid} : {})}}" class="flex-column">
            <div class="flex-row flex-justify-center flex-align-center position-relative">
              <n-image
                  width="300"
                  :height="height"
                  :src="videoThumbnail(video)"
                  :key="videoThumbnail(video)"
                  @error="$emit('image-error', video, idx)"
                  class="thumb overflow-hidden"
                  :object-fit="getImageObjectFit(appStore.styleConfig)"
                  preview-disabled
              />
              <div class="position-absolute vod-update-time" style="width: 100%;">
                <div class="c" v-if="video.updated_at">
                  更新：{{ FormatToDate(video.updated_at) }}
                </div>
              </div>
            </div>

            <div class="name text-align-center flex-justify-center">
              <n-ellipsis :line-clamp="1">
                {{ video.name }}
              </n-ellipsis>
            </div>
          </RouterLink>
          <slot name="actions" :video="video" />

        </n-gi>
      </n-grid>
    </div>
</template>

<script setup>
import {NEllipsis, NGi, NGrid, NImage} from 'naive-ui'
import {useAppStore} from '@/stores/app.js'
import {FormatToDate} from '@/helpers/time.js'
import {getImageObjectFit, getRouterLinkType} from '@/helpers/app.js'
import {videoThumbnail} from '@/helpers/iptv-presentation.js'
defineProps(['videoList', 'cols', 'height', 'source'])
defineEmits(['image-error'])
const appStore = useAppStore()
</script>
<style scoped>


.thumb {
  border-radius: 4px;
  background-color: #f2f2f2;
}

.name {
  padding: 5px 0;
  display: flex;
}

.vod-update-time {
  width: 175px;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.47);
  border-radius: 4px;
  font-size: 12px;
  color: #ffffff;

  .c {
    padding: 4px 6px;
  }
}
</style>
