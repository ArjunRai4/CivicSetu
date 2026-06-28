// India-aware formatting helpers (spec §India-aware design).

// ₹ with Indian grouping; rounds large numbers to lakh/crore for narratives.
export function formatINR(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN')
}

// "₹4.2 lakh" style for impact headlines.
export function formatINRShort(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} crore`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} lakh`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return '₹' + Math.round(amount)
}

// DD/MM/YYYY — Indian standard.
export function formatDate(ms: number): string {
  const d = new Date(ms)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

export function formatDateTime(ms: number): string {
  const d = new Date(ms)
  return `${formatDate(ms)} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export function monthName(ms: number): string {
  return MONTHS[new Date(ms).getMonth()]
}

// "3 days ago", "2h ago", "just now"
export function relativeTime(ms: number, nowMs = Date.now()): string {
  const diff = nowMs - ms
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  const mon = Math.floor(day / 30)
  if (mon < 12) return `${mon}mo ago`
  return `${Math.floor(mon / 12)}y ago`
}

export function daysSince(ms: number, nowMs = Date.now()): number {
  return Math.floor((nowMs - ms) / (1000 * 60 * 60 * 24))
}

export function hoursSince(ms: number, nowMs = Date.now()): number {
  return Math.floor((nowMs - ms) / (1000 * 60 * 60))
}

// Human distance in metres/km.
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`
  return `${(metres / 1000).toFixed(1)} km`
}

export function pct(part: number, whole: number): number {
  if (whole === 0) return 0
  return Math.round((part / whole) * 100)
}

const DAY_MS = 1000 * 60 * 60 * 24
export { DAY_MS }
