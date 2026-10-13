import { foodDatabase, getDishImageUrl } from '../data/foodDatabase'
import type { Dish } from '../types/food'

export function getDishesByCountry(
  countryCode: string,
  language: string,
): Dish[] {
  const lang = language.startsWith('ja') ? 'ja' : 'en'

  return foodDatabase
    .filter(
      (dish) =>
        dish.origin.country.toUpperCase() ===
        countryCode.toUpperCase(),
    )
    .map((dish) => ({
      id: dish.id,
      name:
        dish.name[lang] ??
        dish.name.en ??
        dish.name.ja ??
        '',
      description:
        dish.description?.[lang] ??
        dish.description?.en ??
        dish.description?.ja,
      image: getDishImageUrl(dish.image),
      country: dish.origin.country,
    }))
}