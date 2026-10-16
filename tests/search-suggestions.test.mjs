import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
const { getSearchSuggestions } = await server.ssrLoadModule('/src/services/searchSuggestions.ts')
after(() => server.close())

test('empty input has no suggestions and broad input is limited', () => {
  assert.deepEqual(getSearchSuggestions('  ', 'en'), [])
  assert.ok(getSearchSuggestions('a', 'en').length <= 8)
})
test('countries match names in both languages and ISO codes', () => {
  for (const query of ['Nepal', 'ネパール', 'NPL', 'NP']) {
    assert.ok(getSearchSuggestions(query, 'en').some(s => s.id === 'country:NPL'))
  }
  assert.equal(getSearchSuggestions('Nepal', 'ja')[0].label, 'ネパール')
})
test('dish suggestions and local origins remain distinct', () => {
  assert.ok(getSearchSuggestions('Blini', 'en').some(s => s.kind === 'dish' && s.label === 'Blini' && s.dishId))
  const tula = getSearchSuggestions('Tula', 'en')
  assert.ok(tula.some(s => s.kind === 'city' && s.location.city === 'Tula'))
  assert.ok(tula.some(s => s.kind === 'region' && s.location.region === 'Tula Oblast'))
  assert.equal(new Set(tula.map(s => s.id)).size, tula.length)
})
test('exact matches rank before partial matches', () => {
  const suggestions = getSearchSuggestions('Tula', 'en')
  assert.equal(suggestions[0].label, 'Tula')
  assert.deepEqual(getSearchSuggestions('impossible-place-957183', 'en'), [])
})
