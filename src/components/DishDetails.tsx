import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Dish } from '../types/food'
import { getLocalizedRegionName } from '../i18n/regionNames'

export function DishDetails({
  dish,
  onClose,
}: {
  dish: Dish
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const { t, i18n } = useTranslation()
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement as HTMLElement | null
    dialog?.showModal()
    return () => {
      dialog?.close()
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="recipe-dialog"
      aria-labelledby="recipe-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="recipe-content">
        <button
          className="close-button"
          autoFocus
          onClick={onClose}
          aria-label={t('atlas.close')}
        >
          ×
        </button>
        <p className="eyebrow">
          {[
            getLocalizedRegionName(dish.country ?? '', i18n.language),
            dish.region,
            dish.city,
          ]
            .filter(Boolean)
            .join(' / ')}
        </p>
        <h2 id="recipe-title">{dish.name}</h2>
        {dish.image && (
          <img className="recipe-image" src={dish.image} alt={dish.name} />
        )}
        <p className="recipe-description">
          {dish.description || t('atlas.noDescription')}
        </p>
        <div className="recipe-columns">
          <section>
            <h3>{t('atlas.ingredients')}</h3>
            <p>{dish.ingredients || t('atlas.noRecipe')}</p>
          </section>
          <section>
            <h3>{t('atlas.preparation')}</h3>
            <p>{dish.preparation || t('atlas.noRecipe')}</p>
          </section>
        </div>
      </div>
    </dialog>
  )
}
