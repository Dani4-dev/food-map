import type { DatabaseDish } from '../types/food'

const dishFiles = import.meta.glob(
  '/DishEditor/dishes/*/*.json',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, DatabaseDish>

const imageFiles = import.meta.glob(
  '/DishEditor/dishes/Pictures/*.{png,jpg,jpeg,webp}',
  {
    eager: true,
    query: '?url',
    import: 'default',
  },
) as Record<string, string>

export const foodDatabase: DatabaseDish[] =
  Object.values(dishFiles)

export function getDishImageUrl(
  imagePath?: string,
): string | undefined {
  if (!imagePath) {
    return undefined
  }

  const fullPath = `/DishEditor/dishes/${imagePath}`

  return imageFiles[fullPath]
}