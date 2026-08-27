import test from 'node:test'
import assert from 'node:assert/strict'

import { createLongPressController } from '../src/helpers/long-press.js'

test('短按执行原按钮操作，长按只执行隐藏入口', () => {
  let pending
  const calls = []
  const options = {
    delay: 2000,
    onClick: () => calls.push('click'),
    onLongPress: () => calls.push('long'),
    setTimer: (callback) => {
      pending = callback
      return 1
    },
    clearTimer: () => { pending = undefined },
  }

  const shortPress = createLongPressController(options)
  shortPress.start()
  shortPress.end()
  assert.deepEqual(calls, ['click'])

  const longPress = createLongPressController(options)
  longPress.start()
  pending()
  longPress.end()
  assert.deepEqual(calls, ['click', 'long'])
})

test('取消按压不会触发任何操作', () => {
  let called = false
  const controller = createLongPressController({
    delay: 2000,
    onClick: () => { called = true },
    onLongPress: () => { called = true },
  })

  controller.start()
  controller.cancel()

  assert.equal(called, false)
})
