import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {NodeTypes, parse} from '@vue/compiler-dom'

const source = await readFile(new URL('../src/views/ControlView.vue', import.meta.url), 'utf8')
const templateSource = source.slice(
  source.indexOf('<template>') + '<template>'.length,
  source.indexOf('</template>'),
)
const templateAst = parse(templateSource)

const attributeValue = (node, name) => node.props?.find((prop) => (
  prop.type === NodeTypes.ATTRIBUTE && prop.name === name
))?.value?.content

const hasClass = (node, name) => attributeValue(node, 'class')?.split(/\s+/).includes(name)

const findElement = (predicate, node = templateAst, parent = null) => {
  if (node.type === NodeTypes.ELEMENT && predicate(node)) return {node, parent}
  for (const child of node.children ?? []) {
    const match = findElement(predicate, child, node)
    if (match) return match
  }
  return null
}

test('restores the room-scoped cast snapshot before rendering the optional card', () => {
  assert.match(source, /room\.value\s*=\s*getStorageSync\(KEY_ROOM_ID\)[\s\S]*castSession\.value\s*=\s*loadCastSession\(room\.value\)/)
  assert.match(source, /v-if="castSession"[^>]*data-testid="current-cast-card"/)

  const controls = findElement((node) => hasClass(node, 'controls'))
  const card = findElement((node) => attributeValue(node, 'data-testid') === 'current-cast-card')
  const footer = findElement((node) => node.tag === 'AppFooter')

  assert.ok(controls && card && footer)
  assert.equal(card.parent, controls.parent, 'card must be a sibling after the controls container')
  assert.notEqual(card.parent, controls.node, 'card must not be nested inside the controls container')
  assert.ok(controls.node.loc.end.offset < card.node.loc.start.offset)
  assert.ok(card.node.loc.end.offset < footer.node.loc.start.offset)
})

test('renders compact current-cast metadata and only shows a multi-episode switcher', () => {
  assert.match(source, /v-if="castSession\.thumb"[\s\S]*:src="castSession\.thumb"[\s\S]*(?:width="88"|:width="88")[\s\S]*(?:height="88"|:height="88")/)
  assert.match(source, /<n-ellipsis[^>]*>[\s\S]*castSession\.title[\s\S]*<\/n-ellipsis>/)
  assert.match(source, /<n-ellipsis[^>]*>[\s\S]*castSession\.episodeName[\s\S]*<\/n-ellipsis>/)
  assert.match(source, /shouldShowEpisodeSwitcher\(castSession\)/)
  assert.match(source, /v-for="episode in castSession\.episodes"/)
  assert.match(source, /episode\.id === castSession\.pid/)
})

test('shows the current source beside the episode in the cast summary', () => {
  assert.match(
    source,
    /当前：[\s\S]*castSession\.episodeName[\s\S]*源：[\s\S]*castSession\.source/,
  )
})

test('ignores the current episode and all clicks while another switch is pending', () => {
  assert.match(source, /if\s*\([\s\S]*switchingEpisodePid\.value\s*!==\s*null[\s\S]*episode\?\.id\s*===\s*castSession\.value\?\.pid[\s\S]*\)\s*return/)
  assert.match(source, /:disabled="switchingEpisodePid !== null"/)
  assert.match(source, /switchingEpisodePid === episode\.id/)
})

test('sends stored identifiers and the current source secret through the ACK command path', () => {
  assert.match(source, /event:\s*ControlEventLoadVideo/)
  for (const field of ['vid', 'source']) {
    assert.match(source, new RegExp(`${field}:\\s*castSession\\.value\\.${field}`))
  }
  assert.match(source, /pid:\s*targetEpisode\.id/)
  assert.match(source, /mode:\s*appStore\.sourceSecret/)
  assert.match(source, /group:\s*room\.value/)
  assert.match(source, /room:\s*room\.value/)
  assert.match(source, /from:\s*clientId\.value/)
  assert.match(source, /sendControl:\s*sendControlWithAck/)
})

test('moves and persists the highlight only inside ACK success and retains the warning on failure', () => {
  const updateStateStart = source.indexOf('updateState: () => {', source.indexOf('const switchEpisodeHandler'))
  const failureStart = source.indexOf('onFailure: () => {', updateStateStart)
  assert.notEqual(updateStateStart, -1)
  assert.notEqual(failureStart, -1)

  const success = source.slice(updateStateStart, failureStart)
  assert.match(success, /updateCastSessionEpisode\(castSession\.value, targetEpisode\)/)
  assert.match(success, /saveCastSession\(nextSession\)/)
  assert.match(success, /castSession\.value\s*=\s*savedSession/)
  assert.match(source.slice(failureStart), /message\.warning\('电视未连接，请重新扫码'\)/)
})

test('always clears pending state, including synchronous failures', () => {
  const handlerStart = source.indexOf('const switchEpisodeHandler')
  const handlerEnd = source.indexOf('\n}', source.indexOf('finally', handlerStart))
  const handler = source.slice(handlerStart, handlerEnd + 2)
  assert.match(handler, /switchingEpisodePid\.value\s*=\s*targetEpisode\.id[\s\S]*try\s*{[\s\S]*await sendControlCommand/)
  assert.match(handler, /finally\s*{\s*switchingEpisodePid\.value\s*=\s*null\s*}/)
})

test('does not persist the current source secret', () => {
  const handlerStart = source.indexOf('const switchEpisodeHandler')
  assert.notEqual(handlerStart, -1)
  const updateStateStart = source.indexOf('updateState: () => {', handlerStart)
  const failureStart = source.indexOf('onFailure: () => {', updateStateStart)
  assert.notEqual(updateStateStart, -1)
  assert.notEqual(failureStart, -1)
  const success = source.slice(updateStateStart, failureStart)
  assert.doesNotMatch(success, /mode\s*:/)
  assert.doesNotMatch(success, /sourceSecret/)
})
