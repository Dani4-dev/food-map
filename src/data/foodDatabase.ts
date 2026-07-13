import type { Dish } from '../types/food'

export const foodDatabase: Dish[] = [
  {
    id: 'japan-1',
    name: 'Sushi',
    country: 'Japan',
    description: 'Fresh rice and seafood served with precision.',
  },
  {
    id: 'japan-2',
    name: 'Ramen',
    country: 'Japan',
    description: 'Comforting noodles in a rich, savory broth.',
  },
  {
    id: 'italy-1',
    name: 'Spaghetti Carbonara',
    country: 'Italy',
    description: 'Classic pasta tossed with egg, cheese, and pepper.',
  },
  {
    id: 'italy-2',
    name: 'Margherita Pizza',
    country: 'Italy',
    description: 'Simple and iconic pizza with tomato, mozzarella, and basil.',
  },
  {
    id: 'mexico-1',
    name: 'Tacos al Pastor',
    country: 'Mexico',
    description: 'A flavorful street-food favorite with a smoky finish.',
  },
  {
    id: 'mexico-2',
    name: 'Enchiladas',
    country: 'Mexico',
    description: 'Rolled tortillas filled with meat or cheese and covered in sauce.',
  },
  {
    id: 'india-1',
    name: 'Butter Chicken',
    country: 'India',
    description: 'Tender chicken in a creamy tomato-based curry.',
  },
  {
    id: 'india-2',
    name: 'Biryani',
    country: 'India',
    description: 'Fragrant rice layered with spices and marinated meat or vegetables.',
  },
  {
    id: 'france-1',
    name: 'Croissant',
    country: 'France',
    description: 'Buttery pastry with a crisp, golden crust.',
  },
  {
    id: 'france-2',
    name: 'Ratatouille',
    country: 'France',
    description: 'A colorful vegetable stew that highlights Provençal flavors.',
  },
]

export function getDishesByRegion(region: string): Dish[] {
  const normalizedRegion = region.trim().toLowerCase()

  return foodDatabase.filter((dish) => dish.country?.toLowerCase() === normalizedRegion)
}
