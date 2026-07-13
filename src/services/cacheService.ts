const storageKeyPrefix = 'foodmap-cache:'

function getStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export function getCachedData<T>(key: string, ttlDays = 7): T | null {
  const storage = getStorage()
  if (!storage) {
    return null
  }

  const rawValue = storage.getItem(`${storageKeyPrefix}${key}`)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as { value: T; expiresAt?: number }
    const ttlMs = ttlDays * 24 * 60 * 60 * 1000
    const isExpired = typeof parsed.expiresAt === 'number' && Date.now() > parsed.expiresAt

    if (isExpired) {
      storage.removeItem(`${storageKeyPrefix}${key}`)
      return null
    }

    if (parsed.expiresAt && parsed.expiresAt - Date.now() > ttlMs) {
      storage.removeItem(`${storageKeyPrefix}${key}`)
      return null
    }

    return parsed.value as T
  } catch {
    return null
  }
}

export function setCachedData<T>(key: string, value: T, ttlDays = 7) {
  const storage = getStorage()
  if (!storage) {
    return
  }

  try {
    const payload = {
      value,
      expiresAt: Date.now() + ttlDays * 24 * 60 * 60 * 1000,
    }

    storage.setItem(`${storageKeyPrefix}${key}`, JSON.stringify(payload))
  } catch {
    // Ignore storage errors and fall back to runtime caching.
  }
}
