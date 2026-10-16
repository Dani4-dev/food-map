import { after, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
})
const { getDishes, normalize, getLocationOptions } = await server.ssrLoadModule(
  '/src/services/dishService.ts',
)
const { foodDatabase } = await server.ssrLoadModule('/src/data/foodDatabase.ts')
const { countryCode, getLocalizedRegionName } = await server.ssrLoadModule(
  '/src/i18n/regionNames.ts',
)
after(() => server.close())

test('all records have unique IDs, supported country codes, and a name', () => {
  assert.equal(new Set(foodDatabase.map((d) => d.id)).size, foodDatabase.length)
  for (const dish of foodDatabase) {
    assert.ok(dish.id)
    assert.match(dish.origin.country, /^[A-Z]{3}$/)
    assert.ok(dish.name.en || dish.name.ja)
  }
})
test('country, region, and city filters respect the selected origin', () => {
  for (const record of foodDatabase) {
    const country = record.origin.country
    assert.ok(getDishes({ country }, 'en').some((d) => d.id === record.id))
    if (record.origin.region) {
      const dishes = getDishes({ country, region: record.origin.region }, 'en')
      assert.ok(dishes.some((d) => d.id === record.id))
      assert.ok(
        dishes.every(
          (d) => normalize(d.region) === normalize(record.origin.region),
        ),
      )
    }
    if (record.origin.city) {
      assert.ok(
        getDishes({ country, city: record.origin.city }, 'en').some(
          (d) => d.id === record.id,
        ),
      )
    }
  }
})
test('search finds English and Japanese dish names and origin names', () => {
  for (const record of foodDatabase) {
    for (const query of [
      record.name.en,
      record.name.ja,
      record.origin.city,
      record.origin.region,
    ].filter(Boolean)) {
      assert.ok(getDishes(null, 'en', query).some((d) => d.id === record.id))
    }
  }
  assert.equal(getDishes(null, 'en', 'no-such-dish-917326').length, 0)
})
test('details preserve recipe fields and use nonempty language fallbacks', () => {
  const fixture = {
    id: 'test-fixture',
    name: { en: 'Fallback', ja: '' },
    origin: { country: 'JPN' },
    recipe: { ingredients: { en: 'Rice' }, preparation: { ja: '炊く' } },
  }
  foodDatabase.push(fixture)
  try {
    const dish = getDishes({ country: 'JPN' }, 'ja').find(
      (d) => d.id === fixture.id,
    )
    assert.equal(dish.name, 'Fallback')
    assert.equal(dish.ingredients, 'Rice')
    assert.equal(dish.preparation, '炊く')
  } finally {
    foodDatabase.pop()
  }
})
test('ISO codes and country labels work in both UI languages', () => {
  assert.equal(countryCode('ru'), 'RUS')
  assert.equal(countryCode('jp'), 'JPN')
  assert.equal(getLocalizedRegionName('RUS', 'en'), 'Russia')
  assert.equal(getLocalizedRegionName('JPN', 'ja'), '日本')
  assert.equal(countryCode('invalid'), '')
})
test('location filters contain unique nonempty options', () => {
  for (const country of new Set(foodDatabase.map((d) => d.origin.country))) {
    const { regions, cities } = getLocationOptions(country)
    assert.equal(new Set(regions).size, regions.length)
    assert.equal(new Set(cities).size, cities.length)
    assert.ok([...regions, ...cities].every(Boolean))
  }
})
