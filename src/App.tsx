import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import { FoodPanel } from './components/FoodPanel'
import { WorldMap } from './components/WorldMap'
import { DishDetails } from './components/DishDetails'
import { SearchBox } from './components/SearchBox'
import type { SearchSuggestion } from './services/searchSuggestions'
import { getLocalizedRegionName } from './i18n/regionNames'
import { getDishes, getLocationOptions } from './services/dishService'
import { searchPlaces } from './services/geographyService'
import type { Dish, LocationSelection } from './types/food'

function App() {
  const { t, i18n } = useTranslation()
  const [location, setLocation] = useState<LocationSelection | null>(null)
  const [query, setQuery] = useState('')
  const [dishQuery, setDishQuery] = useState('')
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null)
  const [places, setPlaces] = useState<
    { id: number; location: LocationSelection }[]
  >([])
  const [searchState, setSearchState] = useState<
    'idle' | 'loading' | 'empty' | 'error'
  >('idle')
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const searchId = useRef(0)
  const dishes = getDishes(location, i18n.language, dishQuery).filter(
    (dish) => !selectedDishId || dish.id === selectedDishId,
  )
  const details = getDishes(null, i18n.language).find((d) => d.id === detailsId)
  const countryName = getLocalizedRegionName(
    location?.country ?? '',
    i18n.language,
  )
  const title =
    location?.city ||
    location?.region ||
    countryName ||
    (dishQuery ? t('atlas.searchResults') : t('atlas.allDishes'))
  const options = getLocationOptions(location?.country ?? '')
  function select(value: LocationSelection | null) {
    searchId.current += 1
    setLocation(value)
    setDishQuery('')
    setSelectedDishId(null)
    setPlaces([])
    setSearchState('idle')
    setQuery('')
  }
  async function search() {
    const value = query.trim()
    if (!value) {
      select(null)
      return
    }
    const id = ++searchId.current
    setPlaces([])
    setSearchState('loading')
    // Search both languages and the original origin names locally before the network lookup.
    const local = getDishes(null, i18n.language, value)
    setLocation(null)
    setDishQuery(value)
    setSelectedDishId(null)
    try {
      const result = await searchPlaces(value)
      if (id !== searchId.current) return
      setPlaces(result)
      setSearchState(result.length || local.length ? 'idle' : 'empty')
    } catch {
      if (id === searchId.current) setSearchState('error')
    }
  }
  function chooseOrigin(kind: 'region' | 'city', value: string) {
    if (!location) return
    if (!value) select({ country: location.country })
    else void focusLocation({ country: location.country, [kind]: value })
  }
  async function focusLocation(origin: LocationSelection) {
    select(origin)
    const id = ++searchId.current
    try {
      const results = await searchPlaces(
        [
          origin.city || origin.region,
          getLocalizedRegionName(origin.country, 'en'),
        ]
          .filter(Boolean)
          .join(', '),
      )
      if (id !== searchId.current) return
      const match = results.find((p) => p.location.country === origin.country)
      if (match) setLocation({ ...match.location, ...origin })
    } catch {
      if (id === searchId.current) setSearchState('error')
    }
  }
  function locateDish(dish: Dish) {
    return focusLocation({
      country: dish.country!,
      ...(dish.city ? { city: dish.city } : { region: dish.region }),
    })
  }
  function chooseSuggestion(suggestion: SearchSuggestion) {
    if (suggestion.kind === 'dish') {
      select(null)
      setDishQuery(suggestion.label)
      setSelectedDishId(suggestion.dishId ?? null)
    } else if (suggestion.location) {
      if (suggestion.kind === 'country') select(suggestion.location)
      else void focusLocation(suggestion.location)
    }
    setQuery(suggestion.label)
  }
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="#main" onClick={() => select(null)}>
          <span className="brand-icon" aria-hidden="true">
            ◎
          </span>
          <span>
            Food<span className="brand-accent">Map</span>
            <small>{t('atlas.brandLine')}</small>
          </span>
        </a>
        <button
          className="language-switch"
          onClick={() => {
            const lang = i18n.language.startsWith('ja') ? 'en' : 'ja'
            void i18n.changeLanguage(lang)
            document.documentElement.lang = lang
          }}
          aria-label={t('app.languageSwitchAria')}
        >
          文 / A <span>{t('app.languageSwitch')}</span>
        </button>
      </header>
      <main id="main">
        <div className="intro">
          <div>
            <p className="eyebrow">{t('atlas.eyebrow')}</p>
            <h1>
              {t('atlas.title')} <em>{t('atlas.titleAccent')}</em>
            </h1>
            <p className="intro-description">{t('atlas.subtitle')}</p>
          </div>
        </div>
        <SearchBox
          query={query}
          loading={searchState === 'loading'}
          onChange={(value) => {
            searchId.current += 1
            setQuery(value)
            setPlaces([])
            setSearchState('idle')
          }}
          onSearch={() => void search()}
          onClear={() => select(null)}
          onSelect={chooseSuggestion}
        />
        {(places.length > 0 || searchState !== 'idle') && (
          <div className="search-results" aria-live="polite">
            {places.map((p) => (
              <button key={p.id} onClick={() => select(p.location)}>
                <span>⌖</span>
                <span>{p.location.label}</span>
                <span>↗</span>
              </button>
            ))}
            {searchState !== 'idle' && (
              <p role="status">{t('atlas.search_' + searchState)}</p>
            )}
          </div>
        )}
        <div className="location-toolbar">
          <div className="breadcrumbs">
            <button onClick={() => select(null)}>{t('atlas.world')}</button>
            {location && (
              <>
                <span>/</span>
                <button onClick={() => select({ country: location.country })}>
                  {countryName}
                </button>
                {(location.region || location.city) && (
                  <>
                    <span>/</span>
                    <strong>{location.city || location.region}</strong>
                  </>
                )}
              </>
            )}
          </div>
          {location && (
            <div className="location-filters">
              <label>
                <span>{t('atlas.region')}</span>
                <select
                  value={location.region || ''}
                  onChange={(e) => chooseOrigin('region', e.target.value)}
                >
                  <option value="">{t('atlas.allRegions')}</option>
                  {[
                    ...new Set([
                      ...options.regions,
                      ...(location.region ? [location.region] : []),
                    ]),
                  ].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t('atlas.city')}</span>
                <select
                  value={location.city || ''}
                  onChange={(e) => chooseOrigin('city', e.target.value)}
                >
                  <option value="">{t('atlas.allCities')}</option>
                  {[
                    ...new Set([
                      ...options.cities,
                      ...(location.city ? [location.city] : []),
                    ]),
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
        <div className="atlas-layout">
          <WorldMap location={location} onSelect={select} />
          <FoodPanel
            key={JSON.stringify(location) + dishQuery + i18n.language}
            dishes={dishes}
            title={title}
            onDetails={(d) => setDetailsId(d.id)}
            onLocate={(d) => void locateDish(d)}
          />
        </div>
      </main>
      <footer className="app-footer">
        <span>
          FoodMap <span aria-hidden="true">·</span> {t('atlas.footer')}
        </span>
        <span>{t('atlas.curated')}</span>
      </footer>
      {details && (
        <DishDetails dish={details} onClose={() => setDetailsId(null)} />
      )}
    </div>
  )
}
export default App
