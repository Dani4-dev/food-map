const regionNamesByLanguage: Record<string, Record<string, string>> = {
  en: {
    Canada: 'Canada',
    Japan: 'Japan',
    Italy: 'Italy',
    Mexico: 'Mexico',
    France: 'France',
    India: 'India',
  },
  ja: {
    Canada: 'カナダ',
    Japan: '日本',
    Italy: 'イタリア',
    Mexico: 'メキシコ',
    France: 'フランス',
    India: 'インド',
  },
}

export function getLocalizedRegionName(region: string, language = 'en') {
  const normalizedLanguage = language?.startsWith('ja') ? 'ja' : 'en'
  const normalizedRegion = region?.trim()

  if (!normalizedRegion) {
    return ''
  }

  return regionNamesByLanguage[normalizedLanguage]?.[normalizedRegion] ?? normalizedRegion
}
