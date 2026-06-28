// Geometry helpers: distance, bounding-box overlay maths, grid heatmap scoring.
import type { CSSProperties } from 'react'

export interface LatLng {
  lat: number
  lng: number
}

// Haversine distance in metres.
export function haversine(a: LatLng, b: LatLng): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Convert a normalized bounding box (0-1) to CSS percentage style for overlay.
export function bboxToStyle(box: {
  x: number
  y: number
  width: number
  height: number
}): CSSProperties {
  return {
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
  }
}

export interface HeatCell {
  lat: number
  lng: number
  weight: number // 0-1 normalized
  count: number
}

// Predictive hotspot scoring: bucket points into a lat/lng grid, weight by
// recency (recent reports count more), normalize to 0-1.
export function computeHeatGrid(
  points: { lat: number; lng: number; reportedAt: number }[],
  opts: { cellSize?: number; nowMs?: number } = {},
): HeatCell[] {
  const cellSize = opts.cellSize ?? 0.004 // ~450m
  const now = opts.nowMs ?? Date.now()
  const buckets = new Map<string, { lat: number; lng: number; score: number; count: number }>()

  for (const p of points) {
    const gx = Math.round(p.lat / cellSize) * cellSize
    const gy = Math.round(p.lng / cellSize) * cellSize
    const key = `${gx.toFixed(4)},${gy.toFixed(4)}`
    const ageDays = (now - p.reportedAt) / (1000 * 60 * 60 * 24)
    // recency weight: 1.0 for fresh, decaying with a 60-day half-life
    const recency = Math.pow(0.5, ageDays / 60)
    const cur = buckets.get(key) ?? { lat: gx, lng: gy, score: 0, count: 0 }
    cur.score += 1 + recency // base density + recency boost
    cur.count += 1
    buckets.set(key, cur)
  }

  const cells = [...buckets.values()]
  const max = Math.max(1, ...cells.map((c) => c.score))
  return cells.map((c) => ({
    lat: c.lat,
    lng: c.lng,
    weight: Math.min(1, c.score / max),
    count: c.count,
  }))
}

// Convex-hull-ish bounding polygon for a set of points (simple min/max box
// with padding) — used to draw cluster boundaries on the authority map.
export function boundingPolygon(points: LatLng[], padDeg = 0.0008): LatLng[] {
  if (points.length === 0) return []
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  const minLat = Math.min(...lats) - padDeg
  const maxLat = Math.max(...lats) + padDeg
  const minLng = Math.min(...lngs) - padDeg
  const maxLng = Math.max(...lngs) + padDeg
  return [
    { lat: minLat, lng: minLng },
    { lat: minLat, lng: maxLng },
    { lat: maxLat, lng: maxLng },
    { lat: maxLat, lng: minLng },
  ]
}

export function centroid(points: LatLng[]): LatLng {
  if (points.length === 0) return { lat: 0, lng: 0 }
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length
  return { lat, lng }
}
