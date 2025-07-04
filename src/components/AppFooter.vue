<template>
  <div class="padding-10px"></div>
  <div class="padding-10px">

    <div class="flex-row flex-align-center">
      <a class="link" target="_blank" href="https://github.com/airplayTV/airplayTV-vue">
        AirplayTV
      </a>
      <n-icon color="#5e5b5b" size="20">
        <ExternalLink />
      </n-icon>
    </div>

    <div class="flex-row">
      <n-text depth="3">仅供学习交流，禁止商业用途，作者不承担任何法律责任</n-text>
    </div>

  </div>
</template>

<script setup>
import {NIcon, NText} from 'naive-ui'
import ExternalLink from '@vicons/tabler/ExternalLink'
</script>

<style scoped>
.link {
  text-decoration: none;
  color: #5e5b5b;
  padding: 2px 0;
  margin-right: 4px;
}
</style>
