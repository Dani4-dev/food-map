import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getSearchSuggestions,
  type SearchSuggestion,
} from '../services/searchSuggestions'

interface Props {
  query: string
  loading: boolean
  onChange: (value: string) => void
  onSearch: () => void
  onClear: () => void
  onSelect: (suggestion: SearchSuggestion) => void
}

export function SearchBox({
  query,
  loading,
  onChange,
  onSearch,
  onClear,
  onSelect,
}: Props) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const input = useRef<HTMLInputElement>(null)
  const listId = useId()
  const suggestions = getSearchSuggestions(query, i18n.language)
  const expanded = open && Boolean(query.trim())
  function choose(suggestion: SearchSuggestion) {
    setOpen(false)
    setActive(-1)
    onSelect(suggestion)
  }
  return (
    <div
      className="search-widget"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false)
          setActive(-1)
        }
      }}
    >
      <form
        className="search-bar"
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          setOpen(false)
          setActive(-1)
          onSearch()
        }}
      >
        <span aria-hidden="true">⌕</span>
        <input
          ref={input}
          value={query}
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={
            expanded && suggestions[active] ? listId + '-' + active : undefined
          }
          placeholder={t('atlas.searchPlaceholder')}
          aria-label={t('atlas.searchPlaceholder')}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return
            if (event.key === 'Escape') {
              event.preventDefault()
              setOpen(false)
              setActive(-1)
            }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              if (suggestions.length) {
                const next =
                  event.key === 'ArrowDown'
                    ? (active + 1) % suggestions.length
                    : active <= 0
                      ? suggestions.length - 1
                      : active - 1
                setActive(next)
                document
                  .getElementById(listId + '-' + next)
                  ?.scrollIntoView({ block: 'nearest' })
              }
            }
            if (event.key === 'Enter' && expanded && suggestions[active]) {
              event.preventDefault()
              choose(suggestions[active])
            }
          }}
        />
        {query && (
          <button
            type="button"
            className="clear-search"
            aria-label={t('atlas.clear')}
            onClick={() => {
              onClear()
              setActive(-1)
              setOpen(false)
              input.current?.focus()
            }}
          >
            ×
          </button>
        )}
        <button className="search-submit" type="submit" disabled={loading}>
          {t(loading ? 'atlas.searching' : 'atlas.search')}
        </button>
      </form>
      {expanded && (
        <div className="suggestions-popup">
          <ul
            id={listId}
            role="listbox"
            aria-label={t('atlas.suggestions')}
            className="suggestions-list"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                id={listId + '-' + index}
                role="option"
                aria-selected={active === index}
                className={
                  active === index ? 'suggestion is-active' : 'suggestion'
                }
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(suggestion)}
              >
                <span className="suggestion-icon" aria-hidden="true">
                  {suggestion.kind === 'dish' ? '◌' : '⌖'}
                </span>
                <span className="suggestion-text">
                  <strong>{suggestion.label}</strong>
                  <small>{suggestion.detail}</small>
                </span>
                <span className="suggestion-kind">
                  {t('atlas.suggestion_' + suggestion.kind)}
                </span>
              </li>
            ))}
          </ul>
          <p className="suggestions-hint">
            {t(
              suggestions.length
                ? 'atlas.suggestionHint'
                : 'atlas.suggestionNoMatch',
            )}
          </p>
        </div>
      )}
    </div>
  )
}
