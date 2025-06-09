<template>
  <div class="padding-10px"></div>
  <div class="padding-10px">
    <div class="flex-row flex-align-center">
      <a class="link" target="_blank" href="https://github.com/airplayTV/airplayTV-vue">
        @AirplayTV
      </a>
      <n-icon color="#5e5b5b" size="20">
        <ExternalLink />
      </n-icon>
    </div>
  </div>
</template>

<script>
import {defineComponent} from 'vue'
import {NIcon} from 'naive-ui'
import ExternalLink from '@vicons/tabler/ExternalLink'
import {SearchSharp} from '@vicons/material'

export default defineComponent({
  components: { SearchSharp, NIcon, ExternalLink },
  setup() {
    return {}
  },
})
</script>

<style scoped>
.link {
  text-decoration: none;
  color: #5e5b5b;
  padding: 2px 0;
  margin-right: 4px;
}
</style>
