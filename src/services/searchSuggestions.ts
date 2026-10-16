import countries from '../data/countries.json'
import { foodDatabase } from '../data/foodDatabase'
import { getLocalizedRegionName } from '../i18n/regionNames'
import { normalize } from './dishService'
import type { LocationSelection } from '../types/food'

export type SearchSuggestion = {
  id: string
  kind: 'country' | 'region' | 'city' | 'dish'
  label: string
  detail: string
  location?: LocationSelection
  dishId?: string
}

export function getSearchSuggestions(
  query: string,
  language: string,
): SearchSuggestion[] {
  const needle = normalize(query)
  if (!needle) return []
  const candidates = new Map<
    string,
    { suggestion: SearchSuggestion; rank: number }
  >()
  function add(suggestion: SearchSuggestion, aliases: (string | undefined)[]) {
    const matches = aliases
      .map((value) => normalize(value))
      .filter((value) => value.includes(needle))
    if (!matches.length) return
    const rank = Math.min(
      ...matches.map((value) =>
        value === needle ? 0 : value.startsWith(needle) ? 1 : 2,
      ),
    )
    if (!candidates.has(suggestion.id))
      candidates.set(suggestion.id, { suggestion, rank })
  }
  for (const country of countries) {
    const label = getLocalizedRegionName(country.alpha3, language)
    add(
      {
        id: 'country:' + country.alpha3,
        kind: 'country',
        label,
        detail: country.alpha3,
        location: { country: country.alpha3 },
      },
      [
        label,
        country.name,
        getLocalizedRegionName(country.alpha3, 'en'),
        getLocalizedRegionName(country.alpha3, 'ja'),
        country.alpha2,
        country.alpha3,
      ],
    )
  }
  for (const dish of foodDatabase) {
    const country = getLocalizedRegionName(dish.origin.country, language)
    const name =
      (language.startsWith('ja') ? dish.name.ja : dish.name.en)?.trim() ||
      dish.name.en ||
      dish.name.ja ||
      ''
    for (const kind of ['region', 'city'] as const) {
      const label = dish.origin[kind]
      if (label)
        add(
          {
            id: kind + ':' + dish.origin.country + ':' + normalize(label),
            kind,
            label,
            detail: country,
            location: { country: dish.origin.country, [kind]: label },
          },
          [label],
        )
    }
    add(
      {
        id: 'dish:' + dish.id,
        kind: 'dish',
        label: name,
        detail: [country, dish.origin.city || dish.origin.region]
          .filter(Boolean)
          .join(' · '),
        dishId: dish.id,
      },
      [dish.name.en, dish.name.ja],
    )
  }
  return [...candidates.values()]
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        a.suggestion.label.localeCompare(b.suggestion.label, language),
    )
    .slice(0, 8)
    .map((value) => value.suggestion)
}
