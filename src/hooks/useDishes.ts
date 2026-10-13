import { useMemo } from 'react'
import { getDishesByCountry } from '../services/dishService'

export function useDishes(country: string, language: string) {
  const dishes = useMemo(() => {
    if (!country) {
      return []
    }

    return getDishesByCountry(country, language)
  }, [country, language])

  return {
    dishes,
    isLoading: false,
    hasError: false,
  }
}