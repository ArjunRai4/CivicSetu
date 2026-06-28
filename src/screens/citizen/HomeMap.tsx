import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronUp, ChevronDown, Plus, MapPin } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { MapView, type MapMarker } from '../../components/map/MapView'
import { IssueCard } from '../../components/shared/IssueCard'
import { WARDS, DEMO_WARD } from '../../data/mockData/ward'
import { STATUS_META, CATEGORY_META } from '../../utils/labels'
import { haversine } from '../../utils/geometry'
import { IssueStatus } from '../../types'

export function HomeMap() {
  const { state } = useApp()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(true)

  const ward = state.activeCitizen.ward
  const center = WARDS[ward]?.center ?? WARDS[DEMO_WARD].center
  const wardIssues = useMemo(
    () => state.issues.filter((i) => i.location.ward === ward),
    [state.issues, ward],
  )

  const markers: MapMarker[] = wardIssues.map((i) => ({
    id: i.id,
    lat: i.location.lat,
    lng: i.location.lng,
    color: STATUS_META[i.status].markerColor,
    label: CATEGORY_META[i.category].emoji,
    count: i.verifications.filter((v) => v.confirmsExists).length,
    onClick: () => navigate(`/citizen/reports/${i.id}`),
  }))

  const nearest = useMemo(
    () =>
      [...wardIssues]
        .sort(
          (a, b) =>
            haversine(center, a.location) - haversine(center, b.location),
        )
        .slice(0, 12),
    [wardIssues, center],
  )

  const open = wardIssues.filter((i) => i.status !== IssueStatus.RESOLVED).length

  return (
    <div className="relative h-full w-full">
      <MapView center={[center.lat, center.lng]} zoom={14.5} markers={markers} />

      {/* ward banner */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold shadow-card backdrop-blur">
          <MapPin size={15} className="text-saffron" />
          {ward}
          <span className="text-ink/40">·</span>
          <span className="text-danger">{open} open</span>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/citizen/report')}
        className="absolute bottom-[40%] right-4 z-20 grid h-14 w-14 place-items-center rounded-full bg-saffron text-white shadow-float transition active:scale-95"
        aria-label="Report new issue"
      >
        <Plus size={28} />
      </button>

      {/* bottom sheet */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 rounded-t-3xl bg-canvas shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.3)] transition-[max-height] duration-300 ${
          expanded ? 'max-h-[42%]' : 'max-h-14'
        } flex flex-col`}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center justify-between px-5 py-3"
        >
          <span className="text-sm font-bold">Nearby issues ({nearest.length})</span>
          {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
        <div className="flex-1 space-y-2 overflow-y-auto thin-scroll px-3 pb-4">
          {nearest.map((i) => (
            <IssueCard
              key={i.id}
              issue={i}
              showWard={false}
              onClick={() => navigate(`/citizen/reports/${i.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
