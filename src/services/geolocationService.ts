// Geolocation + reverse-geocoding (spec §Geo-location and mapping).
// Real navigator.geolocation; Nominatim reverse-geocode with an offline-safe
// nearest-ward fallback so the demo works without network or permission.
import { type GeoLocation } from '../types'
import { WARDS, DEMO_WARD, DEMO_CITY } from '../data/mockData/ward'
import { haversine } from '../utils/geometry'

export function geolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator
}

export function getCurrentPosition(timeoutMs = 6000): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve) => {
    if (!geolocationSupported()) {
      resolve(fallbackPoint())
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(fallbackPoint()),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 },
    )
  })
}

// If the real location is outside our seeded Bengaluru wards (e.g. judge runs
// the demo elsewhere), snap to the demo ward so map + ward logic stay coherent.
function fallbackPoint(): { lat: number; lng: number } {
  const c = WARDS[DEMO_WARD].center
  return { lat: c.lat + 0.0015, lng: c.lng - 0.001 }
}

export function nearestWard(lat: number, lng: number): string {
  let best = DEMO_WARD
  let bestD = Infinity
  for (const [name, info] of Object.entries(WARDS)) {
    const d = haversine({ lat, lng }, info.center)
    if (d < bestD) {
      bestD = d
      best = name
    }
  }
  // If absurdly far from any seeded ward, default to the demo ward.
  return bestD > 30000 ? DEMO_WARD : best
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoLocation> {
  const ward = nearestWard(lat, lng)
  const fallback: GeoLocation = {
    lat,
    lng,
    address: `${WARDS[ward]?.name ?? DEMO_WARD}, ${DEMO_CITY}`,
    ward,
    city: DEMO_CITY,
  }
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 3500)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json' },
    })
    clearTimeout(timer)
    if (!res.ok) return fallback
    const data: any = await res.json()
    const a = data.address ?? {}
    const road = a.road ?? a.pedestrian ?? a.suburb ?? ''
    const suburb = a.suburb ?? a.neighbourhood ?? ''
    const city = a.city ?? a.town ?? a.state_district ?? DEMO_CITY
    const address = [road, suburb].filter(Boolean).join(', ') || data.display_name || fallback.address
    return { lat, lng, address, ward, city }
  } catch {
    return fallback
  }
}

export async function captureLocation(): Promise<GeoLocation> {
  const { lat, lng } = await getCurrentPosition()
  return reverseGeocode(lat, lng)
}
