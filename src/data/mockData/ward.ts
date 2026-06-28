// Ward data for the demo ward (Indiranagar) and a few others used for
// citywide map density. Coordinates are real Bengaluru neighbourhoods.

export interface WardInfo {
  name: string
  city: string
  center: { lat: number; lng: number }
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
  roadTypes?: string
  recentWorks?: string
  population?: number
  topComplaints?: string
  drainageHistory?: string
}

export const WARDS: Record<string, WardInfo> = {
  'Indiranagar Ward 80': {
    name: 'Indiranagar Ward 80',
    city: 'Bengaluru',
    center: { lat: 12.9719, lng: 77.6412 },
    bounds: { minLat: 12.962, maxLat: 12.982, minLng: 77.631, maxLng: 77.651 },
    roadTypes: 'Mixed arterial (100 Feet Road, CMH Road) + dense residential cross-streets',
    recentWorks: '100 Feet Road resurfaced early 2024; stormwater drains NOT upgraded',
    population: 78000,
    topComplaints: 'Potholes after rain, garbage black-spots, streetlight outages',
    drainageHistory: 'Underground stormwater line last desilted 2019; recurrent monsoon flooding near 12th Main',
  },
  'Koramangala Ward 68': {
    name: 'Koramangala Ward 68',
    city: 'Bengaluru',
    center: { lat: 12.9352, lng: 77.6245 },
    bounds: { minLat: 12.926, maxLat: 12.945, minLng: 77.615, maxLng: 77.635 },
    roadTypes: 'Commercial + tech-park feeder roads',
    recentWorks: 'Smart City footpath works ongoing',
    population: 92000,
  },
  'Whitefield Ward 84': {
    name: 'Whitefield Ward 84',
    city: 'Bengaluru',
    center: { lat: 12.9698, lng: 77.7499 },
    bounds: { minLat: 12.96, maxLat: 12.98, minLng: 77.74, maxLng: 77.76 },
    roadTypes: 'IT corridor arterial + new layouts',
    population: 115000,
  },
  'Jayanagar Ward 169': {
    name: 'Jayanagar Ward 169',
    city: 'Bengaluru',
    center: { lat: 12.9255, lng: 77.5832 },
    bounds: { minLat: 12.916, maxLat: 12.935, minLng: 77.573, maxLng: 77.593 },
    roadTypes: 'Planned grid, tree-lined residential',
    population: 86000,
  },
  'HSR Layout Ward 174': {
    name: 'HSR Layout Ward 174',
    city: 'Bengaluru',
    center: { lat: 12.9116, lng: 77.6473 },
    bounds: { minLat: 12.902, maxLat: 12.921, minLng: 77.637, maxLng: 77.657 },
    roadTypes: 'Sector grid + lake-adjacent roads',
    population: 99000,
  },
  'Malleshwaram Ward 45': {
    name: 'Malleshwaram Ward 45',
    city: 'Bengaluru',
    center: { lat: 13.0035, lng: 77.5709 },
    bounds: { minLat: 12.994, maxLat: 13.013, minLng: 77.561, maxLng: 77.581 },
    roadTypes: 'Old planned residential, heritage core',
    population: 71000,
  },
}

export const DEMO_WARD = 'Indiranagar Ward 80'
export const DEMO_CITY = 'Bengaluru'

export function wardContextString(wardName: string): string {
  const w = WARDS[wardName]
  if (!w) return wardName
  return [
    `Ward: ${w.name}, ${w.city}`,
    w.roadTypes && `Road types: ${w.roadTypes}`,
    w.recentWorks && `Recent works: ${w.recentWorks}`,
    w.drainageHistory && `Drainage history: ${w.drainageHistory}`,
    w.population && `Population: ~${w.population.toLocaleString('en-IN')}`,
  ]
    .filter(Boolean)
    .join('. ')
}

// Random point within a ward's bounds (deterministic-ish via provided rng).
export function randomPointInWard(
  wardName: string,
  rnd: () => number,
): { lat: number; lng: number } {
  const w = WARDS[wardName] ?? WARDS[DEMO_WARD]
  return {
    lat: w.bounds.minLat + rnd() * (w.bounds.maxLat - w.bounds.minLat),
    lng: w.bounds.minLng + rnd() * (w.bounds.maxLng - w.bounds.minLng),
  }
}
