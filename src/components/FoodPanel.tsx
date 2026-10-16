import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DishCard } from './DishCard'
import type { Dish } from '../types/food'

export function FoodPanel({
  dishes,
  title,
  onDetails,
  onLocate,
}: {
  dishes: Dish[]
  title: string
  onDetails: (dish: Dish) => void
  onLocate: (dish: Dish) => void
}) {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const list = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  function changePage(next: number) {
    setPage(next)
    list.current?.scrollTo({ top: 0 })
    if (window.matchMedia('(max-width: 800px)').matches)
      heading.current?.scrollIntoView({ block: 'start' })
  }
  const pages = Math.max(1, Math.ceil(dishes.length / 10))
  const current = Math.min(page, pages)
  return (
    <section className="food-panel" aria-labelledby="collection-title">
      <header className="collection-header">
        <div>
          <p className="eyebrow">{t('atlas.collection')}</p>
          <h2 ref={heading} id="collection-title">
            {title}
          </h2>
        </div>
        <span className="count-badge">
          {dishes.length} <span>{t('atlas.dishes')}</span>
        </span>
      </header>
      {dishes.length ? (
        <>
          <div ref={list} className="dish-list">
            {dishes.slice((current - 1) * 10, current * 10).map((d) => (
              <DishCard
                key={d.id}
                dish={d}
                onDetails={onDetails}
                onLocate={onLocate}
              />
            ))}
          </div>
          <nav className="pagination" aria-label={t('atlas.pagination')}>
            <button
              disabled={current === 1}
              onClick={() => changePage(current - 1)}
              aria-label={t('atlas.previous')}
            >
              ←
            </button>
            <span aria-live="polite">
              {t('atlas.page', { current, total: pages })}
            </span>
            <button
              disabled={current === pages}
              onClick={() => changePage(current + 1)}
              aria-label={t('atlas.next')}
            >
              →
            </button>
          </nav>
        </>
      ) : (
        <div className="empty-state">
          <span aria-hidden="true">◎</span>
          <h3>{t('atlas.emptyTitle')}</h3>
          <p>{t('atlas.empty')}</p>
        </div>
      )}
    </section>
  )
}
