<template>
  <n-modal :show="show" preset="card" class="review-login" :mask-closable="!submitting" @update:show="$emit('update:show', $event)">
    <div class="login-heading">
      <n-tag :bordered="false" type="warning">隐藏功能</n-tag>
      <h2>广告标记模式</h2>
      <p>登录后可从现有源和视频列表进入分段评审。密码只用于本次登录，不会存入浏览器。</p>
    </div>
    <n-form @submit.prevent="submit">
      <n-form-item label="管理密码" :feedback="error" :validation-status="error ? 'error' : undefined">
        <n-input
          ref="inputRef"
          v-model:value="password"
          type="password"
          show-password-on="click"
          autocomplete="current-password"
          placeholder="输入广告评审密码"
          :disabled="submitting"
          @keyup.enter="submit"
        />
      </n-form-item>
      <div class="login-actions">
        <n-button :disabled="submitting" @click="$emit('update:show', false)">取消</n-button>
        <n-button type="primary" attr-type="submit" :loading="submitting" :disabled="!password">进入标记模式</n-button>
      </div>
    </n-form>
  </n-modal>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { NButton, NForm, NFormItem, NInput, NModal, NTag } from 'naive-ui'
import { useAdReviewStore } from '@/stores/ad-review.js'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['update:show', 'success'])
const store = useAdReviewStore()
const password = ref('')
const error = ref('')
const submitting = ref(false)
const inputRef = ref(null)

watch(() => props.show, async (visible) => {
  if (!visible) return
  password.value = ''
  error.value = ''
  await nextTick()
  inputRef.value?.focus()
})

const submit = async () => {
  if (!password.value || submitting.value) return
  error.value = ''
  submitting.value = true
  try {
    await store.enter(password.value)
    password.value = ''
    emit('update:show', false)
    emit('success')
  } catch (reason) {
    error.value = reason.message || '登录失败'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.review-login { width: min(92vw, 440px); }
.login-heading h2 { margin: 12px 0 6px; font-size: 22px; }
.login-heading p { margin: 0 0 20px; color: #5f6b7a; line-height: 1.6; }
.login-actions { display: flex; justify-content: flex-end; gap: 12px; }
</style>
