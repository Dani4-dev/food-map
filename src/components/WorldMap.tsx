import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import type { Feature, FeatureCollection } from 'geojson'
import { geoJSON, latLngBounds, type Layer } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getLocalizedRegionName } from '../i18n/regionNames'
import { reversePlace } from '../services/geographyService'
import type { LocationSelection } from '../types/food'

// Match the single world covered by both the tiles and country polygons.
const worldBounds = latLngBounds(
  [-85.05112878, -180],
  [85.05112878, 180],
)

interface Props {
  location: LocationSelection | null
  onSelect: (location: LocationSelection) => void
}
function Controls({
  location,
  onSelect,
  onZoom,
  onBusy,
  onError,
}: Props & {
  onZoom: (zoom: number) => void
  onBusy: (busy: boolean) => void
  onError: (error: boolean) => void
}) {
  const requestId = useRef(0)
  const pending = useRef(false)
  useEffect(() => {
    requestId.current += 1
    pending.current = false
    onBusy(false)
  }, [location, onBusy])
  const map = useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
    click: async (e) => {
      if (map.getZoom() < 5 || pending.current) return
      const id = ++requestId.current
      pending.current = true
      onBusy(true)
      onError(false)
      try {
        const result = await reversePlace(
          e.latlng.lat,
          e.latlng.lng,
          map.getZoom(),
        )
        if (id !== requestId.current) return
        if (result)
          onSelect({
            ...result,
            bounds: undefined,
            lat: e.latlng.lat,
            lon: e.latlng.lng,
          })
        else onError(true)
      } catch {
        if (id === requestId.current) onError(true)
      } finally {
        if (id === requestId.current) {
          pending.current = false
          onBusy(false)
        }
      }
    },
  })
  useEffect(() => {
    if (!location) {
      map.setView([24, 15], Math.max(2, map.getMinZoom()))
      return
    }
    if (location.bounds)
      map.fitBounds(location.bounds, {
        padding: [35, 35],
        maxZoom: location.city ? 11 : location.region ? 7 : 5,
      })
    else if (location.lat !== undefined && location.lon !== undefined) {
      map.setView(
        [location.lat, location.lon],
        location.city ? Math.max(9, map.getZoom()) : Math.max(5, map.getZoom()),
      )
    }
  }, [location, map])
  return null
}
function ResizeMap() {
  const map = useMap()
  useEffect(() => {
    const updateViewport = () => {
      map.invalidateSize({ pan: false })
      // The viewport must fit inside one world even on wide screens.
      const minimumZoom = Math.max(2, map.getBoundsZoom(worldBounds, true))
      map.setMinZoom(minimumZoom)
      map.panInsideBounds(worldBounds, { animate: false })
    }
    const observer = new ResizeObserver(updateViewport)
    observer.observe(map.getContainer())
    updateViewport()
    return () => observer.disconnect()
  }, [map])
  return null
}
export function WorldMap({ location, onSelect }: Props) {
  const { t, i18n } = useTranslation()
  const [data, setData] = useState<FeatureCollection | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [zoom, setZoom] = useState(2)
  const [busy, setBusy] = useState(false)
  const [lookupError, setLookupError] = useState(false)
  const mapLocation = useMemo(() => {
    if (!location || location.bounds || location.lat !== undefined || !data)
      return location
    const feature = data.features.find((f) => String(f.id) === location.country)
    if (!feature) return location
    const bounds = geoJSON(feature).getBounds()
    return {
      ...location,
      bounds: [
        [bounds.getSouth(), bounds.getWest()],
        [bounds.getNorth(), bounds.getEast()],
      ] as [[number, number], [number, number]],
    }
  }, [location, data])
  useEffect(() => {
    const controller = new AbortController()
    fetch(
      'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json',
      { signal: controller.signal },
    )
      .then((r) => {
        if (!r.ok) throw new Error('Map unavailable')
        return r.json()
      })
      .then((value: FeatureCollection) => {
        setData(value)
        setFailed(false)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    return () => controller.abort()
  }, [attempt])
  function eachCountry(feature: Feature, layer: Layer) {
    const code = String(feature.id ?? '')
    layer.bindTooltip(getLocalizedRegionName(code, i18n.language))
    layer.on('click', () => {
      if (zoom < 5 && /^[A-Z]{3}$/.test(code)) {
        const bounds = geoJSON(feature).getBounds()
        onSelect({
          country: code,
          bounds: [
            [bounds.getSouth(), bounds.getWest()],
            [bounds.getNorth(), bounds.getEast()],
          ],
        })
      }
    })
  }
  const mode = zoom >= 9 ? 'city' : zoom >= 5 ? 'region' : 'country'
  return (
    <section className="map-panel" aria-label={t('worldMap.title')}>
      <div className="map-topline">
        <span className="live-dot" />
        <strong>{t('atlas.explore')}</strong>
        <span>{t('atlas.' + mode)}</span>
      </div>
      <MapContainer
        center={[24, 15]}
        zoom={2}
        minZoom={2}
        maxZoom={16}
        maxBounds={worldBounds}
        maxBoundsViscosity={1}
        bounceAtZoomLimits={false}
        className="map"
        scrollWheelZoom
      >
        <TileLayer
          noWrap
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {data && (
          <GeoJSON
            key={i18n.language + ':' + zoom + ':' + location?.country}
            data={data}
            style={(f) => ({
              color: '#64766d',
              weight: 1,
              fillColor:
                String(f?.id) === location?.country ? '#d77648' : '#899d88',
              fillOpacity:
                zoom < 5
                  ? String(f?.id) === location?.country
                    ? 0.4
                    : 0.13
                  : 0.025,
            })}
            onEachFeature={eachCountry}
          />
        )}
        {location?.lat !== undefined && location.lon !== undefined && (
          <CircleMarker
            center={[location.lat, location.lon]}
            radius={9}
            pathOptions={{
              color: '#fff',
              fillColor: '#b95430',
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Tooltip>
              {location.city ||
                location.region ||
                getLocalizedRegionName(location.country, i18n.language)}
            </Tooltip>
          </CircleMarker>
        )}
        <Controls
          location={mapLocation}
          onSelect={onSelect}
          onZoom={setZoom}
          onBusy={setBusy}
          onError={setLookupError}
        />
        <ResizeMap />
      </MapContainer>
      <div className="map-guide" role="status">
        {busy
          ? t('atlas.locating')
          : lookupError
            ? t('atlas.lookupError')
            : t('atlas.' + mode + 'Hint')}
      </div>
      {(!data || failed) && (
        <div className="map-message" role="status">
          {failed ? (
            <>
              {t('atlas.mapError')}{' '}
              <button onClick={() => setAttempt((a) => a + 1)}>
                {t('atlas.retry')}
              </button>
            </>
          ) : (
            t('atlas.mapLoading')
          )}
        </div>
      )}
    </section>
  )
}
