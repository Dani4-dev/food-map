import axios from 'axios'
import type { Dish } from '../types/food'
import { getCachedData, setCachedData } from './cacheService'

interface WikidataBinding {
  dish?: { value?: string }
  dishLabel?: { value?: string }
  description?: { value?: string }
  image?: { value?: string }
  country?: { value?: string }
  countryLabel?: { value?: string }
}

interface WikidataQueryResponse {
  dishes: Dish[]
}

const inMemoryCache = new Map<string, Promise<WikidataQueryResponse>>()

function escapeSparqlString(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"')
}

function normalizeText(value?: string) {
  return value?.trim().replace(/\s+/g, ' ') ?? ''
}

function normalizeLanguage(language?: string) {
  const normalized = language?.split('-')[0].toLowerCase()
  return normalized === 'ja' ? 'ja' : 'en'
}

function normalizeName(value?: string) {
  const text = normalizeText(value)

  if (!text) {
    return undefined
  }

  if (/^Q\d+$/.test(text)) {
    return undefined
  }

  return text
}

function normalizeImageUrl(value?: string) {
  if (!value) {
    return undefined
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }

  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(value)}`
}

function buildDescription(value?: string) {
  const text = normalizeText(value)
  return text || undefined
}

function buildCountryName(value?: string) {
  const text = normalizeText(value)
  return text || undefined
}

function isLikelyDishEntity(name?: string, description?: string) {
  const combined = `${normalizeText(name)} ${normalizeText(description)}`.trim()

  if (!combined) {
    return false
  }

  if (/^Q\d+$/.test(combined)) {
    return false
  }

  if (/^(list of|category:|portal:|cuisine|food culture|recipe|recipes|dish|dishes|料理|食文化|名物)$/i.test(combined)) {
    return false
  }

  return true
}

function buildQuery(countryName: string) {
  return `
    SELECT DISTINCT ?dish ?dishLabel ?description ?image ?country ?countryLabel WHERE {
      ?dish wdt:P495 ?country ;
            wdt:P31 ?dishType .
      ?dishType wdt:P279* wd:Q746549 .
      OPTIONAL { ?dish wdt:P18 ?image . }
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "ja,en" .
        ?dish rdfs:label ?dishLabel .
        ?dish schema:description ?description .
        ?country rdfs:label ?countryLabel .
      }
      FILTER EXISTS {
        ?country rdfs:label "${escapeSparqlString(countryName)}"@en .
      }
    }
    LIMIT 8
  `
}

export async function fetchDishesByCountry(countryName: string, language = 'en'): Promise<WikidataQueryResponse> {
  const trimmedCountry = countryName.trim()

  if (!trimmedCountry) {
    return { dishes: [] }
  }

  const normalizedLanguage = normalizeLanguage(language)
  const cacheKey = `${trimmedCountry.toLowerCase()}_${normalizedLanguage}`

  const cached = getCachedData<WikidataQueryResponse>(cacheKey, 7)
  if (cached) {
    return cached
  }

  const pending = inMemoryCache.get(cacheKey)
  if (pending) {
    return pending
  }

  const fetchPromise = (async () => {
    const query = buildQuery(trimmedCountry)

    try {
      const response = await axios.get('https://query.wikidata.org/sparql', {
        params: {
          query,
          format: 'json',
        },
        headers: {
          Accept: 'application/sparql-results+json',
        },
        timeout: 10000,
      })

      const bindings = (response.data?.results?.bindings ?? []) as WikidataBinding[]
      const dishes: Dish[] = []
      const seenDishIds = new Set<string>()

      for (const binding of bindings) {
        const dishId = binding.dish?.value
        const dishName = normalizeName(binding.dishLabel?.value)
        const description = buildDescription(binding.description?.value)
        const image = normalizeImageUrl(binding.image?.value)
        const countryName = buildCountryName(binding.countryLabel?.value)

        if (!dishId || !dishName || !isLikelyDishEntity(dishName, description)) {
          continue
        }

        if (seenDishIds.has(dishId)) {
          continue
        }

        seenDishIds.add(dishId)

        dishes.push({
          id: dishId,
          name: dishName,
          description,
          image,
          country: countryName,
        })
      }

      const filteredDishes = dishes.slice(0, 8)
      setCachedData(cacheKey, { dishes: filteredDishes }, 7)
      return { dishes: filteredDishes }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load dishes.'
      throw new Error(message)
    }
  })()

  inMemoryCache.set(cacheKey, fetchPromise)
  return fetchPromise
}
