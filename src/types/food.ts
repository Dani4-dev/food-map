export interface LocalizedText {
  en?: string
  ja?: string
}
export interface DishOrigin {
  country: string
  region?: string
  city?: string
}
export interface Recipe {
  ingredients?: LocalizedText
  preparation?: LocalizedText
}
export interface DatabaseDish {
  id: string
  name: LocalizedText
  description?: LocalizedText
  image?: string
  origin: DishOrigin
  recipe?: Recipe
}
export interface Dish {
  id: string
  name: string
  description?: string
  image?: string
  country?: string
  region?: string
  city?: string
  ingredients?: string
  preparation?: string
}
export interface LocationSelection {
  country: string
  region?: string
  city?: string
  label?: string
  lat?: number
  lon?: number
  bounds?: [[number, number], [number, number]]
}
