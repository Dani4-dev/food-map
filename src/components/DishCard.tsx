import type { Dish } from '../types/food'

interface DishCardProps {
  dish: Dish
}

export function DishCard({ dish }: DishCardProps) {
  return (
    <article className="dish-card">
      <h3>{dish.name}</h3>
      {dish.description ? <p className="dish-card__description">{dish.description}</p> : null}
      {dish.image && (
        <img
          className="dish-card__image"
          src={dish.image}
          alt={dish.name}
        />
      )}
    </article>
  )
}
