import { useTranslation } from 'react-i18next'
import { DishCard } from './DishCard'
import type { Dish } from '../types/food'

interface FoodPanelProps {
  dishes: Dish[]
  region?: string
  isLoading?: boolean
  errorMessage?: string | null
}

export function FoodPanel({ dishes, region, isLoading, errorMessage }: FoodPanelProps) {
  const { t } = useTranslation()
  const hasSelection = Boolean(region) && region !== t('worldMap.defaultSelection')

  return (
    <section className="panel food-panel">
      <div className="food-panel__header">
        <h2>{hasSelection ? t('foodPanel.titleWithRegion', { region }) : t('foodPanel.title')}</h2>
        <p>
          {hasSelection
            ? t('foodPanel.description', { region })
            : t('foodPanel.emptyState')}
        </p>
      </div>

      <div className="dish-list">
        {isLoading ? (
          <p className="status-message">{t('foodPanel.loading')}</p>
        ) : errorMessage ? (
          <p className="status-message status-message--error">{errorMessage}</p>
        ) : dishes.length > 0 ? (
          dishes.map((dish) => <DishCard key={dish.id} dish={dish} />)
        ) : (
          <p className="empty-state">{t('foodPanel.empty')}</p>
        )}
      </div>
    </section>
  )
}
