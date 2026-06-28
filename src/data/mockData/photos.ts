// Self-contained SVG "photos" as data URIs — no network dependency, so the
// live demo and the Cloud Run deployment never show broken images.
import { IssueCategory } from '../../types'
import { CATEGORY_META } from '../../utils/labels'

function toDataUri(svg: string): string {
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg)
}

// A realistic-feeling category thumbnail: gradient sky, road, big subject emoji,
// faux EXIF-ish caption. Deterministic per (category, seed).
export function categoryPhoto(category: IssueCategory, seed = 0): string {
  const meta = CATEGORY_META[category]
  const c = meta.color
  const tilt = ((seed % 5) - 2) * 1.5
  const sky = ['#cfe3f2', '#e7d8c4', '#d8e0e6', '#e9e2d2'][seed % 4]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sky}"/>
      <stop offset="1" stop-color="#f3efe6"/>
    </linearGradient>
  </defs>
  <rect width="640" height="420" fill="url(#sky)"/>
  <rect y="250" width="640" height="170" fill="#6b6f76"/>
  <rect y="250" width="640" height="10" fill="#54585e"/>
  <g opacity="0.5">
    <rect x="40" y="120" width="90" height="130" fill="#b8b2a4"/>
    <rect x="150" y="90" width="70" height="160" fill="#cdc6b6"/>
    <rect x="470" y="100" width="80" height="150" fill="#c2bbac"/>
    <rect x="560" y="140" width="60" height="110" fill="#b3ad9f"/>
  </g>
  <rect x="305" y="260" width="30" height="160" fill="#f4d35e" opacity="0.7"/>
  <g transform="translate(320 215) rotate(${tilt})">
    <circle r="78" fill="${c}" opacity="0.16"/>
    <text x="0" y="28" font-size="92" text-anchor="middle">${meta.emoji}</text>
  </g>
  <rect x="0" y="386" width="640" height="34" fill="#000" opacity="0.45"/>
  <text x="14" y="408" font-family="monospace" font-size="16" fill="#fff" opacity="0.92">CIVICSETU • ${meta.label.toUpperCase()} • Bengaluru</text>
</svg>`
  return toDataUri(svg)
}

// The curated magic-moment photo: an Indian street where a pothole, garbage
// pile and a dead streetlight are drawn EXACTLY where the cached AP1 bounding
// boxes point — so the overlay always lands perfectly in the live demo.
export const DEMO_STREET_PHOTO: string = toDataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="dsky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9db8cf"/>
      <stop offset="1" stop-color="#d9d2c2"/>
    </linearGradient>
    <linearGradient id="droad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7c8089"/>
      <stop offset="1" stop-color="#5a5e66"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#dsky)"/>
  <!-- buildings -->
  <g opacity="0.85">
    <rect x="0" y="150" width="150" height="200" fill="#b7ad99"/>
    <rect x="150" y="110" width="120" height="240" fill="#cabfa6"/>
    <rect x="520" y="120" width="130" height="230" fill="#c0b59c"/>
    <rect x="650" y="160" width="150" height="190" fill="#ada391"/>
    <g fill="#8a8270" opacity="0.6">
      <rect x="170" y="140" width="22" height="28"/><rect x="210" y="140" width="22" height="28"/>
      <rect x="170" y="190" width="22" height="28"/><rect x="210" y="190" width="22" height="28"/>
      <rect x="545" y="150" width="22" height="28"/><rect x="585" y="150" width="22" height="28"/>
    </g>
  </g>
  <!-- road -->
  <rect y="330" width="800" height="270" fill="url(#droad)"/>
  <polygon points="380,330 420,330 470,600 330,600" fill="#f0d35a" opacity="0.55"/>
  <rect y="330" width="800" height="6" fill="#474b52"/>
  <!-- footpath -->
  <rect y="330" width="800" height="0" />
  <!-- (1) leaning broken streetlight, left -->
  <g transform="translate(96 90) rotate(-8)">
    <rect x="6" y="0" width="10" height="300" fill="#3f4651"/>
    <rect x="6" y="0" width="70" height="9" fill="#3f4651"/>
    <rect x="64" y="2" width="26" height="16" rx="4" fill="#2b3039"/>
    <text x="60" y="46" font-size="30" text-anchor="middle">🌑</text>
  </g>
  <!-- (2) pothole, centre carriageway -->
  <g transform="translate(400 430)">
    <ellipse cx="0" cy="0" rx="96" ry="46" fill="#2c2f35"/>
    <ellipse cx="0" cy="-6" rx="74" ry="32" fill="#16181c"/>
    <ellipse cx="-10" cy="6" rx="40" ry="16" fill="#0c1a24" opacity="0.8"/>
    <path d="M-96 0 L-130 28 M96 0 L132 30 M-40 40 L-55 70 M50 40 L70 66" stroke="#3a3d44" stroke-width="3" fill="none"/>
  </g>
  <!-- (3) garbage pile, right pavement -->
  <g transform="translate(648 360)">
    <ellipse cx="40" cy="120" rx="120" ry="26" fill="#000" opacity="0.18"/>
    <circle cx="0" cy="70" r="46" fill="#3f7d3a"/>
    <circle cx="58" cy="80" r="40" fill="#2f6b2c"/>
    <circle cx="30" cy="40" r="38" fill="#4c8f45"/>
    <rect x="-30" y="60" width="40" height="50" fill="#a8a090" transform="rotate(-12 -10 85)"/>
    <text x="20" y="64" font-size="42" text-anchor="middle">🗑️</text>
  </g>
  <rect x="0" y="566" width="800" height="34" fill="#000" opacity="0.45"/>
  <text x="16" y="589" font-family="monospace" font-size="16" fill="#fff" opacity="0.92">CIVICSETU DEMO • 100 Feet Road, Indiranagar • 28/06/2026</text>
</svg>`)
