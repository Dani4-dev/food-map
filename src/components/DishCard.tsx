import { useTranslation } from 'react-i18next'
import type { Dish } from '../types/food'
import { getLocalizedRegionName } from '../i18n/regionNames'

export function DishCard({
  dish,
  onDetails,
  onLocate,
}: {
  dish: Dish
  onDetails: (dish: Dish) => void
  onLocate: (dish: Dish) => void
}) {
  const { t, i18n } = useTranslation()
  return (
    <article className="dish-card">
      <div className="dish-card__visual">
        {dish.image ? (
          <img
            src={dish.image}
            alt={dish.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : null}
        <svg
          className="food-symbol"
          aria-hidden="true"
          viewBox="0 0 120 90"
          fill="none"
        >
          <ellipse
            cx="60"
            cy="72"
            rx="42"
            ry="6"
            fill="currentColor"
            opacity=".12"
          />
          <path
            d="M25 42h70c-3 24-17 31-35 31S28 66 25 42Z"
            fill="currentColor"
            opacity=".18"
          />
          <path
            d="M23 42h74M31 45c3 18 14 27 29 27s27-9 29-27M46 30c-8-9 8-11 0-20M61 30c-8-9 8-11 0-20M76 30c-8-9 8-11 0-20"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M42 78h36"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span className="image-label">{t('atlas.kitchen')}</span>
      </div>
      <div className="dish-card__body">
        <p className="dish-card__location">
          {dish.city ||
            dish.region ||
            getLocalizedRegionName(dish.country ?? '', i18n.language)}
        </p>
        <h3>{dish.name}</h3>
        <p className="dish-card__description">
          {dish.description || t('atlas.noDescription')}
        </p>
        <div className="card-actions">
          <button className="details-button" onClick={() => onDetails(dish)}>
            {t('atlas.details')} <span aria-hidden="true">↗</span>
          </button>
          <button
            className="locate-button"
            onClick={() => onLocate(dish)}
            aria-label={t('atlas.showOnMap') + ': ' + dish.name}
            title={t('atlas.showOnMap')}
          >
            ⌖
          </button>
        </div>
      </div>
    </article>
  )
}
