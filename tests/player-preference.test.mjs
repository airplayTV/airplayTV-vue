import test from 'node:test'
import assert from 'node:assert/strict'

import {
  playTypeOption,
  resolvePlayerPreference,
} from '../src/helpers/player-preference.js'

test('defaults missing player preference to DPlayer', () => {
  assert.equal(resolvePlayerPreference(null), 1)
  assert.equal(resolvePlayerPreference(undefined), 1)
})

test('keeps selectable player preferences', () => {
  assert.equal(resolvePlayerPreference(playTypeOption.dp), 1)
  assert.equal(resolvePlayerPreference(playTypeOption.art), 2)
  assert.equal(resolvePlayerPreference(playTypeOption.libmedia), 4)
})

test('rejects internal and unknown player preferences', () => {
  assert.equal(resolvePlayerPreference(playTypeOption.iframe), 1)
  assert.equal(resolvePlayerPreference(99), 1)
  assert.equal(resolvePlayerPreference('4'), 1)
})
