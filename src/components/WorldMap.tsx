import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GeoJSON, MapContainer, TileLayer } from 'react-leaflet'
import { type LatLngExpression } from 'leaflet'
import type { Feature, GeoJsonObject } from 'geojson'
import 'leaflet/dist/leaflet.css'
import { getLocalizedRegionName } from '../i18n/regionNames'

interface WorldMapProps {
  onSelectLocation: (location: string) => void
  selectedLocation: string
}

interface CountryProperties {
  name?: string
  name_long?: string
  admin?: string
  ADMIN?: string
}

interface CountryFeature extends Omit<Feature, 'properties'> {
  properties?: CountryProperties | null
}

const mapCenter: LatLngExpression = [20, 0]

function getCountryName(feature?: CountryFeature) {
  const props = feature?.properties
  return props?.name || props?.name_long || props?.admin || props?.ADMIN || 'Selected country'
}

export function WorldMap({ onSelectLocation, selectedLocation }: WorldMapProps) {
  const { t, i18n } = useTranslation()
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
      .then((response) => response.json())
      .then((data) => {
        if (active) {
          setGeoJsonData(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const countryStyle = useMemo(
    () => ({
      fillColor: '#f0b67f',
      weight: 1,
      opacity: 1,
      color: '#ffffff',
      fillOpacity: 0.7,
    }),
    [],
  )

  const onEachFeature = (feature: CountryFeature, layer: { on: (event: string, handler: () => void) => void }) => {
    layer.on('click', () => {
      onSelectLocation(getCountryName(feature))
    })
  }

  const displaySelection = selectedLocation
    ? getLocalizedRegionName(selectedLocation, i18n.language)
    : t('worldMap.defaultSelection')

  return (
    <section className="panel world-map">
      <div className="world-map__header">
        <div>
          <h2>{t('worldMap.title')}</h2>
          <p>{t('worldMap.instructions')}</p>
        </div>
        <div className="selection-pill selection-pill--compact">
          <strong>{t('worldMap.selectedLocation')}:</strong> {displaySelection}
        </div>
      </div>

      <div className="map-shell">
        <MapContainer attributionControl={false} center={mapCenter} zoom={2} minZoom={1} maxZoom={6} scrollWheelZoom className="map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {!isLoading && geoJsonData && <GeoJSON data={geoJsonData} style={countryStyle} onEachFeature={onEachFeature} />}
        </MapContainer>
      </div>
    </section>
  )
}
