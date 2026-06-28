import { useEffect, useMemo } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  Polygon,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import type { ReactNode } from 'react'
import type { HeatCell } from '../../utils/geometry'

export interface MapMarker {
  id: string
  lat: number
  lng: number
  color: string
  label?: string // short text/emoji inside the pin
  count?: number // verification / cluster count badge
  popup?: ReactNode
  onClick?: () => void
}

export interface ClusterPolygon {
  id: string
  points: { lat: number; lng: number }[]
  color: string
  label?: string
}

function pinIcon(color: string, label?: string, count?: number): L.DivIcon {
  const badge =
    count && count > 0
      ? `<span style="position:absolute;top:-6px;right:-6px;background:#1E3A8A;color:#fff;border-radius:9999px;min-width:16px;height:16px;font-size:10px;line-height:16px;text-align:center;padding:0 3px;border:1.5px solid #fff;">${count}</span>`
      : ''
  return L.divIcon({
    className: 'cs-pin',
    html: `<div style="position:relative;">
      <div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);font-size:12px;line-height:1;">${label ?? ''}</span>
      </div>${badge}
    </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  })
}

function MapController({
  center,
  zoom,
  fitPoints,
}: {
  center?: [number, number]
  zoom?: number
  fitPoints?: { lat: number; lng: number }[]
}) {
  const map = useMap()
  useEffect(() => {
    // Leaflet sometimes renders before the container has size.
    const t = setTimeout(() => map.invalidateSize(), 150)
    return () => clearTimeout(t)
  }, [map])
  useEffect(() => {
    if (fitPoints && fitPoints.length > 1) {
      const b = L.latLngBounds(fitPoints.map((p) => [p.lat, p.lng]))
      map.fitBounds(b.pad(0.2), { animate: false })
    } else if (center) {
      map.setView(center, zoom ?? map.getZoom(), { animate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.[0], center?.[1], zoom, JSON.stringify(fitPoints?.length)])
  return null
}

export function MapView({
  center,
  zoom = 14,
  markers = [],
  heat = [],
  polygons = [],
  fitToMarkers = false,
  className = '',
}: {
  center: [number, number]
  zoom?: number
  markers?: MapMarker[]
  heat?: HeatCell[]
  polygons?: ClusterPolygon[]
  fitToMarkers?: boolean
  className?: string
}) {
  const icons = useMemo(
    () => markers.map((m) => pinIcon(m.color, m.label, m.count)),
    [markers],
  )

  return (
    <div className={`h-full w-full overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
        preferCanvas
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <MapController
          center={center}
          zoom={zoom}
          fitPoints={fitToMarkers ? markers : undefined}
        />

        {/* predictive heat cells */}
        {heat.map((c, i) => (
          <CircleMarker
            key={`heat-${i}`}
            center={[c.lat, c.lng]}
            radius={10 + c.weight * 26}
            pathOptions={{
              color: 'transparent',
              fillColor: c.weight > 0.66 ? '#dc2626' : c.weight > 0.33 ? '#f59e0b' : '#16a34a',
              fillOpacity: 0.18 + c.weight * 0.32,
            }}
          />
        ))}

        {/* cluster boundary polygons */}
        {polygons.map((p) => (
          <Polygon
            key={p.id}
            positions={p.points.map((pt) => [pt.lat, pt.lng])}
            pathOptions={{ color: p.color, weight: 2, fillColor: p.color, fillOpacity: 0.08, dashArray: '6 6' }}
          />
        ))}

        {/* issue markers */}
        {markers.map((m, i) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={icons[i]}
            eventHandlers={m.onClick ? { click: m.onClick } : undefined}
          >
            {m.popup && <Popup>{m.popup}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
