import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Lightbulb,
  Wrench,
  Search,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Button, Card, SeverityBadge, StatusBadge } from '../../components/shared/ui'
import { MapView, type MapMarker } from '../../components/map/MapView'
import { CATEGORY_META, categoryLabel } from '../../utils/labels'
import { centroid } from '../../utils/geometry'
import { formatDate } from '../../utils/format'

export function ClusterDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, setClusterStatus } = useApp()
  const cluster = state.rootCauseClusters.find((c) => c.id === id)

  const issues = useMemo(
    () =>
      (cluster?.issueIds ?? [])
        .map((iid) => state.issues.find((i) => i.id === iid))
        .filter(Boolean)
        .sort((a, b) => a!.reportedAt - b!.reportedAt) as NonNullable<
        ReturnType<typeof state.issues.find>
      >[],
    [cluster, state.issues],
  )

  if (!cluster) {
    return (
      <div className="py-20 text-center text-ink/50">
        Cluster not found.
        <div className="mt-3">
          <Button variant="outline" onClick={() => navigate('/authority/clusters')}>Back to clusters</Button>
        </div>
      </div>
    )
  }

  const center = centroid(issues.map((i) => i.location))
  const markers: MapMarker[] = issues.map((i) => ({
    id: i.id,
    lat: i.location.lat,
    lng: i.location.lng,
    color: CATEGORY_META[i.category].color,
    label: CATEGORY_META[i.category].emoji,
    onClick: () => navigate(`/authority/tickets/${i.id}`),
  }))

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <button onClick={() => navigate('/authority/clusters')} className="flex items-center gap-1 text-sm text-ink/60">
        <ArrowLeft size={16} /> All patterns
      </button>

      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-saffron">
          {CATEGORY_META[cluster.category].emoji} {categoryLabel(cluster.category)} cluster · {cluster.ward}
        </div>
        <h1 className="mt-1 text-2xl font-extrabold">{cluster.pattern}</h1>
      </div>

      {/* AI hypothesis */}
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-saffron">
            <Lightbulb size={18} /> AI root-cause hypothesis
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-saffron-light px-2 py-0.5 text-xs font-bold text-saffron">
              {Math.round(cluster.confidence * 100)}% confidence
            </span>
            {cluster.priorityForAuthority && (
              <span className="rounded-full bg-danger-light px-2 py-0.5 text-xs font-bold text-danger">
                {cluster.priorityForAuthority} priority
              </span>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink/80">{cluster.rootCauseHypothesis}</p>

        <div className="mt-4 rounded-xl bg-civicblue-light/50 p-3">
          <div className="flex items-center gap-2 text-sm font-bold text-civicblue">
            <Wrench size={16} /> Recommended action
          </div>
          <p className="mt-1 text-sm text-ink/75">{cluster.recommendedAction}</p>
        </div>

        {/* action buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant={cluster.status === 'INSPECTING' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setClusterStatus(cluster.id, 'INSPECTING')}
          >
            <Search size={14} /> Mark inspecting
          </Button>
          <Button
            variant={cluster.status === 'RESOLVED' ? 'success' : 'outline'}
            size="sm"
            onClick={() => setClusterStatus(cluster.id, 'RESOLVED')}
          >
            <CheckCircle2 size={14} /> Mark resolved
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setClusterStatus(cluster.id, 'DISMISSED')}>
            <XCircle size={14} /> Dismiss
          </Button>
        </div>
      </Card>

      {/* map */}
      <Card className="overflow-hidden">
        <div className="h-72">
          <MapView center={[center.lat, center.lng]} zoom={15} markers={markers} fitToMarkers />
        </div>
      </Card>

      {/* timeline + issues */}
      <Card className="p-5">
        <h2 className="mb-3 text-sm font-bold">Constituent reports ({issues.length})</h2>
        <ol className="relative space-y-3 border-l-2 border-black/10 pl-4">
          {issues.map((i) => (
            <li key={i.id} className="relative">
              <span className="absolute -left-[22px] top-1.5 h-3 w-3 rounded-full bg-saffron ring-2 ring-white" />
              <button
                onClick={() => navigate(`/authority/tickets/${i.id}`)}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-black/[0.03]"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/5">
                  <img src={i.photoDataUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{i.title}</div>
                  <div className="text-xs text-ink/45">{formatDate(i.reportedAt)} · {i.location.address}</div>
                  <div className="mt-1 flex gap-1.5">
                    <SeverityBadge severity={i.severity} />
                    <StatusBadge status={i.status} />
                  </div>
                </div>
                <ChevronRight size={16} className="text-ink/30" />
              </button>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}
