import countries from '../data/countries.json'
export function canonicalCountryCode(value: string) {
  const normalized = value.trim().toLowerCase()
  return (
    countries.find((c) =>
      [c.alpha2, c.alpha3, c.name].some((v) => v.toLowerCase() === normalized),
    )?.alpha3 ?? value.toUpperCase()
  )
}
export function countryCode(alpha2: string) {
  return countries.find((c) => c.alpha2 === alpha2.toUpperCase())?.alpha3 ?? ''
}
export function getLocalizedRegionName(code: string, language = 'en') {
  if (!code) return ''
  const country = countries.find((c) => c.alpha3 === code || c.alpha2 === code)
  return country
    ? (new Intl.DisplayNames([language.startsWith('ja') ? 'ja' : 'en'], {
        type: 'region',
      }).of(country.alpha2) ?? country.name)
    : code
}
