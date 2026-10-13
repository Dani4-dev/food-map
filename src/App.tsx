import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'

import { FoodPanel } from './components/FoodPanel'
import { WorldMap } from './components/WorldMap'
import { useDishes } from './hooks/useDishes'
import { getLocalizedRegionName } from './i18n/regionNames'

function App() {
  const { t, i18n } = useTranslation()
  const [selectedLocation, setSelectedLocation] = useState('')

  const { dishes, isLoading, hasError } = useDishes(
    selectedLocation,
    i18n.language,
  )

  const toggleLanguage = () => {
    void i18n.changeLanguage(
      i18n.language.startsWith('ja') ? 'en' : 'ja',
    )
  }

  const localizedRegion = getLocalizedRegionName(
    selectedLocation,
    i18n.language,
  )

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">{t('app.brand')}</p>
          <h1>{t('app.title')}</h1>
        </div>

        <button
          className="language-switch"
          onClick={toggleLanguage}
          aria-label={t('app.languageSwitchAria')}
        >
          {t('app.languageSwitch')}
        </button>
      </header>

      <main className="app-main">
        <WorldMap
          onSelectLocation={setSelectedLocation}
          selectedLocation={selectedLocation}
        />

        <FoodPanel
          dishes={dishes}
          region={localizedRegion}
          isLoading={isLoading}
          errorMessage={hasError ? t('foodPanel.error') : null}
        />
      </main>
    </div>
  )
}

export default App