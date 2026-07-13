import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import { FoodPanel } from './components/FoodPanel'
import { WorldMap } from './components/WorldMap'
import { getLocalizedRegionName } from './i18n/regionNames'
import { fetchDishesByCountry } from './services/dishSearchService'
import type { Dish } from './types/food'

function App() {
  const { t, i18n } = useTranslation()
  const [selectedLocation, setSelectedLocation] = useState('')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedLocation) {
      setDishes([])
      setErrorMessage(null)
      setIsLoading(false)
      return
    }

    let isMounted = true

    setIsLoading(true)
    setErrorMessage(null)

    fetchDishesByCountry(selectedLocation, i18n.language)
      .then((response) => {
        if (!isMounted) {
          return
        }

        const validDishes = response.dishes
          .filter((dish) => Boolean(dish.name?.trim()))
          .map((dish) => ({
            id: dish.id,
            name: dish.name,
            description: dish.description,
            image: dish.image,
            country: dish.country,
          }))

        setDishes(validDishes)
        setIsLoading(false)
      })
      .catch(() => {
        if (!isMounted) {
          return
        }

        setDishes([])
        setErrorMessage(t('foodPanel.error'))
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [i18n.language, selectedLocation, t])

  const toggleLanguage = () => {
    void i18n.changeLanguage(i18n.language.startsWith('ja') ? 'en' : 'ja')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">{t('app.brand')}</p>
          <h1>{t('app.title')}</h1>
        </div>
        <button className="language-switch" onClick={toggleLanguage} aria-label={t('app.languageSwitchAria')}>
          {t('app.languageSwitch')}
        </button>
      </header>

      <main className="app-main">
        <WorldMap onSelectLocation={setSelectedLocation} selectedLocation={selectedLocation} />
        <FoodPanel dishes={dishes} region={getLocalizedRegionName(selectedLocation, i18n.language)} isLoading={isLoading} errorMessage={errorMessage} />
      </main>
    </div>
  )
}

export default App