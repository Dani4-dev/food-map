import axios from 'axios'
import type { Dish } from '../types/food'
import { getCachedData, setCachedData } from './cacheService'

interface WikipediaSearchResult {
  title?: string
  snippet?: string
}

interface WikipediaSummary {
  title?: string
  description?: string
  extract?: string
  thumbnail?: {
    source?: string
  }
  content_urls?: {
    desktop?: {
      page?: string
    }
  }
}

interface WikipediaPageLinks {
  links?: Array<{
    title?: string
  }>
}

interface WikipediaPageResult {
  pages?: Record<string, WikipediaPageLinks>
}

interface WikipediaCategoryResult {
  categories?: Array<{
    title?: string
  }>
}

interface WikipediaQueryResult {
  query?: {
    search?: WikipediaSearchResult[]
    pages?: Record<string, { title?: string; missing?: boolean }>
  }
}

interface RankedDishCandidate {
  title: string
  description?: string
  image?: string
  wikipediaUrl?: string
  score: number
}

const inMemoryCache = new Map<string, Promise<{ dishes: Dish[] }>>()

function normalizeLanguage(language?: string) {
  const normalized = language?.split('-')[0].toLowerCase()
  return normalized === 'ja' ? 'ja' : 'en'
}

function sanitizeText(value?: string) {
  return value?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizeText(value?: string) {
  return sanitizeText(value)?.toLowerCase() ?? ''
}

function buildCuisineQueries(locationName: string, language = 'en') {
  const trimmedLocation = locationName.trim()
  const locationLabel = trimmedLocation.trim()

  if (language === 'ja') {
    return [
      `${locationLabel}料理`,
      `${locationLabel}郷土料理`,
      `${locationLabel}名物料理`,
      `${locationLabel}食文化`,
    ].filter(Boolean)
  }

  return [
    `${locationLabel} cuisine`,
    `${locationLabel} traditional food`,
    `${locationLabel} dishes`,
    `${locationLabel} specialties`,
  ].filter(Boolean)
}

function getWikipediaApiBaseUrl(language = 'en') {
  return language === 'ja' ? 'https://ja.wikipedia.org/w/api.php' : 'https://en.wikipedia.org/w/api.php'
}

function getWikipediaSummaryBaseUrl(language = 'en') {
  return language === 'ja' ? 'https://ja.wikipedia.org/api/rest_v1/page/summary/' : 'https://en.wikipedia.org/api/rest_v1/page/summary/'
}

async function fetchWikipediaSummary(title: string, language = 'en') {
  const response = await axios.get(`${getWikipediaSummaryBaseUrl(language)}${encodeURIComponent(title)}`, {
    timeout: 8000,
  })

  return response.data as WikipediaSummary
}

async function fetchPageCategories(title: string, language = 'en') {
  try {
    const response = await axios.get(getWikipediaApiBaseUrl(language), {
      params: {
        action: 'query',
        prop: 'categories',
        titles: title,
        format: 'json',
        cllimit: 20,
        clshow: '!hidden',
        origin: '*',
      },
      timeout: 8000,
    })

    const pages = response.data?.query?.pages ?? {}
    const firstPage = Object.values(pages)[0] as WikipediaCategoryResult | undefined

    return (firstPage?.categories ?? []).map((category) => sanitizeText(category.title) ?? '').filter(Boolean)
  } catch {
    return []
  }
}

async function getPageLinks(title: string, language = 'en') {
  try {
    const response = await axios.get(getWikipediaApiBaseUrl(language), {
      params: {
        action: 'query',
        prop: 'links',
        titles: title,
        pllimit: 50,
        format: 'json',
        origin: '*',
      },
      timeout: 8000,
    })

    const result = response.data as WikipediaPageResult
    const pages = result.pages ?? {}
    const firstPage = Object.values(pages)[0] as WikipediaPageLinks | undefined

    return (firstPage?.links ?? []).map((link) => sanitizeText(link.title) ?? '').filter(Boolean)
  } catch {
    return []
  }
}

async function findCuisineArticle(locationName: string, language = 'en') {
  const queries = buildCuisineQueries(locationName, language)

  for (const query of queries) {
    try {
      const response = await axios.get(getWikipediaApiBaseUrl(language), {
        params: {
          action: 'query',
          list: 'search',
          srsearch: query,
          format: 'json',
          srlimit: 3,
          origin: '*',
        },
        timeout: 8000,
      })

      const results = (response.data as WikipediaQueryResult)?.query?.search ?? []
      const firstMatch = results.find((result) => Boolean(sanitizeText(result.title)))
      if (firstMatch?.title) {
        return sanitizeText(firstMatch.title)
      }
    } catch {
      continue
    }
  }

  return undefined
}

function isFoodRelatedCandidate(title: string, description?: string, snippet?: string, categories: string[] = [], image?: string) {
  const normalizedTitle = normalizeText(title)
  const normalizedDescription = normalizeText(description || snippet)
  const normalizedCategories = categories.map((category) => normalizeText(category)).join(' ')
  const combinedText = `${normalizedTitle} ${normalizedDescription} ${normalizedCategories}`.toLowerCase()

  const foodTerms = [
    'cuisine',
    'food',
    'dish',
    'dishes',
    'recipe',
    'recipes',
    'cooking',
    'culinary',
    'specialty',
    'specialties',
    'restaurant',
    'bakery',
    'dessert',
    'desserts',
    'sweets',
    'bread',
    'noodle',
    'noodles',
    'soup',
    'stew',
    'snack',
    'snacks',
    'meal',
    'meals',
    'cookery',
    '料理',
    '食',
    '食品',
    '食文化',
    '郷土料理',
    '名物',
    '菓子',
    '飲食',
    '和食',
    '洋食',
    '中華',
    '麺',
    'パン',
    'ご飯',
    '茶',
    'コーヒー',
    '酒',
  ]

  const negativeTerms = [
    'person',
    'people',
    'history',
    'historical',
    'politics',
    'political',
    'government',
    'war',
    'battle',
    'empire',
    'continent',
    'country',
    'city',
    'town',
    'province',
    'state',
    'river',
    'mountain',
    'festival',
    'religion',
    'religious',
    'actor',
    'film',
    'song',
    'band',
    'sport',
    'football',
    'baseball',
    'team',
    'museum',
    'architect',
    'architecture',
    'university',
    'company',
    'founder',
    'president',
    'king',
    'queen',
    'prince',
    'princess',
    'biography',
  ]

  const hasFoodSignal = foodTerms.some((term) => combinedText.includes(term))
  const hasNegativeSignal = negativeTerms.some((term) => combinedText.includes(term))
  const isListOrPortal = /^(list of|category:|portal:)/.test(normalizedTitle)

  if (isListOrPortal) {
    return false
  }

  if (hasNegativeSignal && !hasFoodSignal) {
    return false
  }

  return hasFoodSignal || Boolean(image)
}

function scoreCandidate(title: string, description?: string, snippet?: string, categories: string[] = [], image?: string) {
  const normalizedTitle = normalizeText(title)
  const normalizedDescription = normalizeText(description || snippet)
  const normalizedCategories = categories.map((category) => normalizeText(category)).join(' ')
  const combinedText = `${normalizedTitle} ${normalizedDescription} ${normalizedCategories}`.toLowerCase()

  let score = 0

  if (image) {
    score += 3
  }

  if (description) {
    score += 3
  }

  if (/[料理食食品郷土料理名物菓子飲食和食洋食中華麺パンご飯茶コーヒー酒]/.test(title)) {
    score += 3
  }

  if (/(cuisine|food|dish|dishes|recipe|recipes|specialty|specialties|cooking|culinary|restaurant|bakery|dessert|desserts|snack|snacks|meal|meals)/.test(combinedText)) {
    score += 4
  }

  if (categories.some((category) => /(cuisine|food|dish|dishes|recipe|recipes|specialty|specialties|cooking|culinary|restaurant|bakery|dessert|desserts|snack|snacks|meal|meals|料理|食|食品|郷土料理|名物|菓子|飲食)/.test(normalizeText(category)))) {
    score += 2
  }

  if (/(history|historical|politics|political|government|war|battle|empire|continent|country|city|town|province|state|river|mountain|festival|religion|religious|actor|film|song|band|sport|football|baseball|team|museum|architect|architecture|university|company|founder|president|king|queen|prince|princess|biography)/.test(combinedText)) {
    score -= 4
  }

  return score
}

export async function fetchDishesByCountry(locationName: string, language = 'en'): Promise<{ dishes: Dish[] }> {
  const trimmedLocation = locationName.trim()

  if (!trimmedLocation) {
    return { dishes: [] }
  }

  const normalizedLanguage = normalizeLanguage(language)
  const cacheKey = `${trimmedLocation.toLowerCase()}_${normalizedLanguage}`

  const cached = getCachedData<{ dishes: Dish[] }>(cacheKey)
  if (cached) {
    return cached
  }

  const pending = inMemoryCache.get(cacheKey)
  if (pending) {
    return pending
  }

  const fetchPromise = (async () => {
    const cuisineTitle = await findCuisineArticle(trimmedLocation, normalizedLanguage)

    if (!cuisineTitle) {
      return { dishes: [] }
    }

    const candidateLinks = await getPageLinks(cuisineTitle, normalizedLanguage)
    const relevantLinks = candidateLinks.filter((link) => {
      const normalized = normalizeText(link)
      if (!normalized) {
        return false
      }
      return !/(cuisine|food|dish|dishes|recipe|recipes|specialty|specialties|料理|食文化|名物|郷土料理|history|historical|politics|people|country|continent|city|town|province|state|region|government|biography)/i.test(normalized)
    })

    const seenTitles = new Set<string>()
    const rankedCandidates: RankedDishCandidate[] = []

    for (const linkTitle of relevantLinks.slice(0, 12)) {
      const normalizedLink = sanitizeText(linkTitle)
      if (!normalizedLink || seenTitles.has(normalizedLink.toLowerCase())) {
        continue
      }

      seenTitles.add(normalizedLink.toLowerCase())

      try {
        const summary = await fetchWikipediaSummary(normalizedLink, normalizedLanguage)
        const description = sanitizeText(summary.description || summary.extract)
        const image = sanitizeText(summary.thumbnail?.source)
        const wikipediaUrl = sanitizeText(summary.content_urls?.desktop?.page)
        const categories = await fetchPageCategories(normalizedLink, normalizedLanguage)

        if (!isFoodRelatedCandidate(normalizedLink, description, undefined, categories, image)) {
          continue
        }

        rankedCandidates.push({
          title: normalizedLink,
          description,
          image,
          wikipediaUrl,
          score: scoreCandidate(normalizedLink, description, undefined, categories, image),
        })
      } catch {
        continue
      }
    }

    const dishes = rankedCandidates
      .sort((left, right) => right.score - left.score)
      .slice(0, 10)
      .map((candidate) => ({
        id: candidate.title,
        name: candidate.title,
        description: candidate.description,
        image: candidate.image,
        wikipediaUrl: candidate.wikipediaUrl,
      }))

    setCachedData(cacheKey, { dishes })

    return { dishes }
  })()

  inMemoryCache.set(cacheKey, fetchPromise)

  return fetchPromise
}
