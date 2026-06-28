// Renders a branded, shareable impact card to a PNG data URL via HTML5 Canvas
// (spec §Bonus impact storytelling — "Share" generates a canvas card).
import { type WardStats } from '../types'
import { formatINRShort } from './format'

export function renderShareCard(stats: WardStats, monthLabel: string): string {
  const W = 1080
  const H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // background gradient (saffron → deep blue)
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#F4811F')
  g.addColorStop(1, '#1E3A8A')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // subtle panel
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  roundRect(ctx, 60, 60, W - 120, H - 120, 36)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'top'

  ctx.font = '700 44px Inter, sans-serif'
  ctx.fillText('CivicSetu', 110, 110)
  ctx.font = '400 26px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText('From one photo to action', 110, 168)

  ctx.fillStyle = '#ffffff'
  ctx.font = '800 60px Inter, sans-serif'
  ctx.fillText(`${monthLabel} in`, 110, 250)
  ctx.font = '800 56px Inter, sans-serif'
  wrapText(ctx, stats.ward, 110, 322, W - 220, 60)

  // big stats grid
  const stat = (
    x: number,
    y: number,
    big: string,
    label: string,
  ) => {
    ctx.fillStyle = '#ffffff'
    ctx.font = '800 88px Inter, sans-serif'
    ctx.fillText(big, x, y)
    ctx.font = '500 28px Inter, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(label, x, y + 100)
  }

  stat(110, 470, String(stats.reportsCount), 'Reports filed')
  stat(580, 470, String(stats.resolvedCount), 'Resolved')
  stat(110, 660, `${stats.resolutionPct}%`, 'Resolution rate')
  stat(580, 660, `${stats.avgResponseHours}h`, 'Avg response')

  // impact footer band
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  roundRect(ctx, 110, 850, W - 220, 150, 24)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = '700 34px Inter, sans-serif'
  ctx.fillText(
    `${formatINRShort(stats.estimatedCostSavedINR)} saved · ~${stats.estimatedAccidentsPrevented} accidents prevented`,
    140,
    890,
  )
  ctx.font = '400 26px Inter, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText(`Top advocate: ${stats.topContributor}`, 140, 940)

  return canvas.toDataURL('image/png')
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ')
  let line = ''
  let yy = y
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy)
      line = w
      yy += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, yy)
}
