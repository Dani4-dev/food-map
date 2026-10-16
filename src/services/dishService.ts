import { foodDatabase, getDishImageUrl } from '../data/foodDatabase'
import type { Dish, LocalizedText, LocationSelection } from '../types/food'

export function normalize(value = '') {
  return value.normalize('NFKC').trim().toLocaleLowerCase().replace(/[’']/g, '')
}
function text(value: LocalizedText | undefined, language: string) {
  return (
    (language.startsWith('ja') ? value?.ja : value?.en)?.trim() ||
    value?.en?.trim() ||
    value?.ja?.trim() ||
    ''
  )
}
export function getDishesByCountry(country: string, language: string): Dish[] {
  return getDishes({ country }, language)
}
export function getDishes(
  location: LocationSelection | null,
  language: string,
  query = '',
): Dish[] {
  const search = normalize(query)
  return foodDatabase
    .filter(
      (d) =>
        (!location ||
          (d.origin.country === location.country &&
            (!location.region ||
              normalize(d.origin.region) === normalize(location.region)) &&
            (!location.city ||
              normalize(d.origin.city) === normalize(location.city)))) &&
        (!search ||
          [d.name.en, d.name.ja, d.origin.region, d.origin.city].some((v) =>
            normalize(v).includes(search),
          )),
    )
    .map((d) => ({
      id: d.id,
      name: text(d.name, language),
      description: text(d.description, language),
      image: getDishImageUrl(d.image),
      country: d.origin.country,
      region: d.origin.region,
      city: d.origin.city,
      ingredients: text(d.recipe?.ingredients, language),
      preparation: text(d.recipe?.preparation, language),
    }))
}
export function getLocationOptions(country: string) {
  const dishes = foodDatabase.filter((d) => d.origin.country === country)
  return {
    regions: [
      ...new Set(
        dishes
          .map((d) => d.origin.region)
          .filter((v): v is string => Boolean(v)),
      ),
    ].sort(),
    cities: [
      ...new Set(
        dishes.map((d) => d.origin.city).filter((v): v is string => Boolean(v)),
      ),
    ].sort(),
  }
}
