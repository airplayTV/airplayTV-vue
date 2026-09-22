import test from 'node:test'
import assert from 'node:assert/strict'

import * as adReviewState from '../src/helpers/ad-review-state.js'

test('ad review DELETE config includes a JSON body without dropping existing options', () => {
  const config = {
    headers: { 'X-Ad-Review-Request': '1' },
    params: { source: '量子资源' },
  }

  assert.deepEqual(adReviewState.withAdReviewDeleteJSONBody?.(config), {
    headers: { 'X-Ad-Review-Request': '1' },
    params: { source: '量子资源' },
    data: {},
  })
})
