import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, MapPin } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { MapView, type MapMarker, type ClusterPolygon } from '../../components/map/MapView'
import { Card } from '../../components/shared/ui'
import { CATEGORY_META, categoryLabel } from '../../utils/labels'
import { WARDS } from '../../data/mockData/ward'
import { computeHeatGrid, boundingPolygon, centroid } from '../../utils/geometry'
import { IssueCategory, IssueStatus, Severity } from '../../types'

export function CitywideMap() {
  const { state } = useApp()
  const navigate = useNavigate()
  const [heat, setHeat] = useState(false)
  const [cat, setCat] = useState<IssueCategory | 'ALL'>('ALL')
  const [sev, setSev] = useState<Severity | 'ALL'>('ALL')
  const [status, setStatus] = useState<IssueStatus | 'ALL'>('ALL')
  const [ward, setWard] = useState<string | 'ALL'>('ALL')

  const cityCenter = useMemo(() => {
    const pts = Object.values(WARDS).map((w) => w.center)
    return centroid(pts)
  }, [])

  const filtered = useMemo(
    () =>
      state.issues.filter(
        (i) =>
          (cat === 'ALL' || i.category === cat) &&
          (sev === 'ALL' || i.severity === sev) &&
          (status === 'ALL' || i.status === status) &&
          (ward === 'ALL' || i.location.ward === ward),
      ),
    [state.issues, cat, sev, status, ward],
  )

  const markers: MapMarker[] = filtered.map((i) => ({
    id: i.id,
    lat: i.location.lat,
    lng: i.location.lng,
    color: CATEGORY_META[i.category].color,
    label: CATEGORY_META[i.category].emoji,
    onClick: () => navigate(`/authority/tickets/${i.id}`),
  }))

  const heatCells = useMemo(
    () => (heat ? computeHeatGrid(filtered.map((i) => ({ ...i.location, reportedAt: i.reportedAt }))) : []),
    [heat, filtered],
  )

  const polygons: ClusterPolygon[] = useMemo(
    () =>
      state.rootCauseClusters
        .filter((c) => c.status !== 'DISMISSED')
        .map((c) => {
          const pts = c.issueIds
            .map((id) => state.issues.find((i) => i.id === id)?.location)
            .filter(Boolean) as { lat: number; lng: number }[]
          return {
            id: c.id,
            points: boundingPolygon(pts),
            color: '#9333ea',
            label: c.pattern,
          }
        })
        .filter((p) => p.points.length > 0),
    [state.rootCauseClusters, state.issues],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Citywide map</h1>
        <button
          onClick={() => setHeat((v) => !v)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
            heat ? 'bg-danger text-white' : 'bg-white text-ink/70 ring-1 ring-black/10'
          }`}
        >
          <Flame size={15} /> Predictive heatmap {heat ? 'on' : 'off'}
        </button>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-2 text-sm">
        <Select label="Category" value={cat} onChange={(v) => setCat(v as any)}
          options={[['ALL', 'All categories'], ...Object.values(IssueCategory).map((c) => [c, categoryLabel(c)] as [string, string])]} />
        <Select label="Severity" value={String(sev)} onChange={(v) => setSev(v === 'ALL' ? 'ALL' : (Number(v) as Severity))}
          options={[['ALL', 'All severities'], ['4', 'Critical'], ['3', 'High'], ['2', 'Medium'], ['1', 'Low']]} />
        <Select label="Status" value={status} onChange={(v) => setStatus(v as any)}
          options={[['ALL', 'All statuses'], ...Object.values(IssueStatus).map((s) => [s, s.replace('_', ' ')] as [string, string])]} />
        <Select label="Ward" value={ward} onChange={(v) => setWard(v as any)}
          options={[['ALL', 'All wards'], ...Object.keys(WARDS).map((w) => [w, w] as [string, string])]} />
        <span className="flex items-center gap-1 self-center text-xs text-ink/50">
          <MapPin size={13} /> {filtered.length} issues
        </span>
      </div>

      <Card className="overflow-hidden">
        <div className="h-[68vh]">
          <MapView
            center={[cityCenter.lat, cityCenter.lng]}
            zoom={12}
            markers={heat ? [] : markers}
            heat={heatCells}
            polygons={polygons}
          />
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 text-xs text-ink/50">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#9333ea]" /> Cluster boundary</span>
        {heat && <span className="flex items-center gap-1"><Flame size={12} className="text-danger" /> Hotspot density (recency-weighted)</span>}
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 ring-1 ring-black/10">
      <span className="text-xs text-ink/40">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-sm font-medium outline-none">
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </label>
  )
}
