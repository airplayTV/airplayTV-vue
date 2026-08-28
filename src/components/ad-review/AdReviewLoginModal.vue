<template>
  <n-modal
    :show="show"
    preset="card"
    class="review-login"
    style="width: min(560px, calc(100vw - 24px))"
    :mask-closable="!submitting"
    aria-labelledby="ad-review-login-title"
    @update:show="$emit('update:show', $event)"
  >
    <div class="login-heading">
      <div class="security-icon" aria-hidden="true">
        <n-icon :size="26"><shield-lock /></n-icon>
      </div>
      <div class="heading-copy">
        <n-tag :bordered="false" size="small" type="success">仅限管理员</n-tag>
        <h2 id="ad-review-login-title">广告标记模式</h2>
      </div>
      <p>验证身份后，可从现有源、视频列表或搜索结果进入分段评审。</p>
    </div>

    <div class="security-note">
      <n-icon :size="18" aria-hidden="true"><clock /></n-icon>
      <span>凭证仅用于创建当前会话，不会存入浏览器；会话有效期为 2 小时。</span>
    </div>

    <n-form @submit.prevent="submit">
      <n-form-item label="管理密码" :show-feedback="false" :validation-status="error ? 'error' : undefined">
        <n-input
          ref="inputRef"
          v-model:value="password"
          size="large"
          type="password"
          show-password-on="click"
          autocomplete="current-password"
          placeholder="输入广告评审密码"
          :disabled="submitting"
          :input-props="{ 'aria-describedby': error ? 'ad-review-login-error' : undefined }"
          @keyup.enter="submit"
        />
      </n-form-item>
      <div v-if="error" id="ad-review-login-error" class="login-error" role="alert" aria-live="assertive">
        {{ error }}
      </div>
      <div class="login-actions">
        <n-button class="primary-action" type="primary" attr-type="submit" :loading="submitting" :disabled="!password">
          进入标记模式
        </n-button>
        <n-button class="secondary-action" :disabled="submitting" @click="$emit('update:show', false)">取消</n-button>
      </div>
    </n-form>
  </n-modal>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { NButton, NForm, NFormItem, NIcon, NInput, NModal, NTag } from 'naive-ui'
import Clock from '@vicons/tabler/Clock'
import ShieldLock from '@vicons/tabler/ShieldLock'
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
    await nextTick()
    inputRef.value?.focus()
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.review-login {
  --login-muted: #5f6b7a;
  --login-soft: #f4f7f5;
  --login-border: #dfe8e2;
  --login-accent: #18a058;
  --login-accent-soft: #e9f7ef;
  --login-error: #d03050;
  border-radius: 20px;
  overflow: hidden;
}
.login-heading { display: grid; grid-template-columns: 52px minmax(0, 1fr); align-items: center; gap: 12px; }
.security-icon { width: 52px; height: 52px; border: 1px solid #cce8d7; border-radius: 15px; background: var(--login-accent-soft); color: var(--login-accent); display: grid; place-items: center; }
.heading-copy { display: grid; justify-items: start; gap: 7px; }
.login-heading h2 { margin: 0; font-size: 23px; line-height: 1.25; letter-spacing: -.01em; }
.login-heading p { grid-column: 1 / -1; margin: 4px 0 0; color: var(--login-muted); font-size: 14px; line-height: 1.65; }
.security-note { margin: 18px 0 20px; padding: 11px 12px; border: 1px solid var(--login-border); border-radius: 12px; background: var(--login-soft); color: var(--login-muted); display: flex; align-items: flex-start; gap: 9px; font-size: 13px; line-height: 1.55; }
.security-note .n-icon { flex: 0 0 auto; margin-top: 1px; color: var(--login-accent); }
.login-error { margin: 8px 0 0; padding: 9px 11px; border-radius: 10px; background: rgba(208, 48, 80, .08); color: var(--login-error); font-size: 13px; line-height: 1.5; }
.login-actions { margin-top: 22px; display: flex; justify-content: flex-end; gap: 10px; }
.login-actions .n-button { min-width: 112px; min-height: 44px; }
.secondary-action { order: -1; }
@media (prefers-color-scheme: dark) {
  .review-login {
    --login-muted: #b9c2cc;
    --login-soft: #20262d;
    --login-border: #354039;
    --login-accent-soft: #153326;
    --login-error: #ff9aaa;
  }
  .security-icon { border-color: #28543a; }
  .login-error { background: rgba(255, 105, 130, .12); }
}
@media (max-width: 520px) {
  .review-login { border-radius: 16px; }
  .login-heading { grid-template-columns: 46px minmax(0, 1fr); gap: 10px; }
  .security-icon { width: 46px; height: 46px; border-radius: 13px; }
  .login-heading h2 { font-size: 21px; }
  .security-note { margin-block: 16px 18px; }
  .login-actions { flex-direction: column; }
  .login-actions .n-button { width: 100%; }
  .secondary-action { order: initial; }
}
</style>
