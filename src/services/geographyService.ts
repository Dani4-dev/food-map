import { countryCode } from '../i18n/regionNames'
import type { LocationSelection } from '../types/food'

interface Place {
  place_id: number
  lat: string
  lon: string
  display_name: string
  name?: string
  type?: string
  addresstype?: string
  boundingbox?: string[]
  address?: {
    country_code?: string
    state?: string
    region?: string
    province?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
  }
}
const cache = new Map<string, unknown>()
let queue: Promise<unknown> = Promise.resolve()
let lastRequest = 0
async function request<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url =
    'https://nominatim.openstreetmap.org/' +
    path +
    '?' +
    new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      'accept-language': 'en',
      ...params,
    })
  if (cache.has(url)) return cache.get(url) as T
  const job = queue
    .catch(() => undefined)
    .then(async () => {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.max(0, 1100 - (Date.now() - lastRequest))),
      )
      lastRequest = Date.now()
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
      if (!response.ok) throw new Error('Geographic lookup failed')
      const value: T = await response.json()
      cache.set(url, value)
      return value
    })
  queue = job
  return job
}
function selection(
  place: Place,
  level?: 'region' | 'city',
): LocationSelection | null {
  const a = place.address
  const country = countryCode(a?.country_code ?? '')
  if (!country) return null
  const kind = place.addresstype ?? place.type
  const city = a?.city || a?.town || a?.village || a?.municipality
  const region = a?.state || a?.region || a?.province
  const isCountry = kind === 'country'
  const isRegion = [
    'state',
    'region',
    'province',
    'county',
    'state_district',
  ].includes(kind ?? '')
  return {
    country,
    region:
      level === 'region'
        ? region
        : level === 'city'
          ? undefined
          : !isCountry && isRegion
            ? region || place.name
            : undefined,
    city:
      level === 'city'
        ? city
        : !level && !isCountry && !isRegion
          ? city
          : undefined,
    label: place.display_name,
    lat: Number(place.lat),
    lon: Number(place.lon),
    bounds: place.boundingbox
      ? [
          [Number(place.boundingbox[0]), Number(place.boundingbox[2])],
          [Number(place.boundingbox[1]), Number(place.boundingbox[3])],
        ]
      : undefined,
  }
}
export async function searchPlaces(query: string) {
  const places = await request<Place[]>('search', { q: query, limit: '6' })
  return places
    .map((p) => ({ id: p.place_id, location: selection(p) }))
    .filter((p): p is { id: number; location: LocationSelection } =>
      Boolean(p.location),
    )
}
export async function reversePlace(lat: number, lon: number, zoom: number) {
  const level = zoom >= 9 ? 'city' : 'region'
  const place = await request<Place>('reverse', {
    lat: String(lat),
    lon: String(lon),
    zoom: level === 'city' ? '10' : '5',
    layer: 'address',
  })
  if (
    level === 'city' &&
    !(
      place.address?.city ||
      place.address?.town ||
      place.address?.village ||
      place.address?.municipality
    )
  )
    return null
  if (
    level === 'region' &&
    !(place.address?.state || place.address?.region || place.address?.province)
  )
    return null
  return selection(place, level)
}
