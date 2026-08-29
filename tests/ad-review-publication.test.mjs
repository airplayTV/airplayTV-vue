import test from 'node:test'
import assert from 'node:assert/strict'

import { loadCandidateConflictsSafely, mergeCandidateActivation } from '../src/helpers/ad-review-publication.js'

test('无冲突候选返回激活记录时立即更新当前规则', () => {
  const candidate = {
    rule: { ID: 12, Source: '源A' },
    activation: { ID: 21, RuleVersionID: 12 },
  }

  assert.deepEqual(mergeCandidateActivation(null, candidate), {
    rule: candidate.rule,
    activation: candidate.activation,
  })
})

test('冲突候选没有激活记录时保留旧规则', () => {
  const current = {
    rule: { ID: 7, Source: '源A' },
    activation: { ID: 9, RuleVersionID: 7 },
  }
  const candidate = {
    rule: { ID: 12, Source: '源A' },
    activation: null,
  }

  assert.equal(mergeCandidateActivation(current, candidate), current)
})

test('候选已生成后冲突详情加载失败不否定发布结果', async () => {
  const failure = new Error('conflict endpoint unavailable')

  const result = await loadCandidateConflictsSafely(12, async () => {
    throw failure
  })

  assert.deepEqual(result.conflicts, [])
  assert.equal(result.error, failure)
})
