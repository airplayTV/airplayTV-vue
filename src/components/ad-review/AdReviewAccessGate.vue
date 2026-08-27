<template>
  <slot v-if="ready" />
  <div v-else class="access-state" :aria-busy="restoring">
    <n-spin v-if="restoring" size="medium" description="正在验证广告标记会话" />
    <n-button v-else type="primary" secondary @click="showLogin = true">验证管理员身份</n-button>
  </div>
  <AdReviewLoginModal
    :show="showLogin"
    @update:show="onLoginVisibility"
    @success="onLoginSuccess"
  />
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { NButton, NSpin } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useAdReviewStore } from '@/stores/ad-review.js'
import { adReviewAccessAction } from '@/helpers/ad-review-history.js'
import AdReviewLoginModal from './AdReviewLoginModal.vue'

const emit = defineEmits(['ready'])
const router = useRouter()
const store = useAdReviewStore()
const restoring = ref(false)
const showLogin = ref(false)
const ready = computed(() => store.authenticated)

const ensureAccess = async () => {
  const action = adReviewAccessAction({
    enabled: store.enabled,
    authenticated: store.authenticated,
    restoring: restoring.value,
  })
  if (action === 'show') {
    emit('ready')
    return
  }
  if (action === 'login') {
    showLogin.value = true
    return
  }
  restoring.value = true
  const restored = await store.restore()
  restoring.value = false
  if (restored) emit('ready')
  else showLogin.value = true
}

const leaveProtectedPage = () => {
  if (typeof window !== 'undefined' && window.history.length > 1) router.back()
  else router.push('/setting')
}

const onLoginVisibility = (visible) => {
  showLogin.value = visible
  if (visible) return
  queueMicrotask(() => {
    if (!store.authenticated) leaveProtectedPage()
  })
}

const onLoginSuccess = () => {
  showLogin.value = false
  emit('ready')
}

onMounted(ensureAccess)
</script>

<style scoped>
.access-state {
  min-height: 50vh;
  display: grid;
  place-items: center;
  padding: 32px 16px;
}

.access-state .n-button {
  min-height: 44px;
}
</style>
