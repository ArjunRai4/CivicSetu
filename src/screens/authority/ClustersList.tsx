import { useNavigate } from 'react-router-dom'
import { Radar, ChevronRight, MapPin, Layers } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Card } from '../../components/shared/ui'
import { categoryLabel, CATEGORY_META } from '../../utils/labels'

const STATUS_STYLE: Record<string, string> = {
  DETECTED: 'bg-danger-light text-danger',
  INSPECTING: 'bg-warning-light text-warning',
  RESOLVED: 'bg-success-light text-success',
  DISMISSED: 'bg-black/5 text-ink/40',
}

export function ClustersList() {
  const { state } = useApp()
  const navigate = useNavigate()
  const clusters = [...state.rootCauseClusters].sort(
    (a, b) => b.confidence - a.confidence,
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Radar size={22} className="text-saffron" />
        <h1 className="text-2xl font-extrabold">Detected patterns</h1>
        <span className="rounded-full bg-saffron-light px-2 py-0.5 text-sm font-bold text-saffron">
          {clusters.length}
        </span>
      </div>
      <p className="text-sm text-ink/50">
        Recurring issue clusters the AI surfaced for root-cause action across the city.
      </p>

      {clusters.length === 0 ? (
        <Card className="p-6 text-center text-sm text-ink/40">No patterns detected yet.</Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {clusters.map((c) => (
            <Card key={c.id} onClick={() => navigate(`/authority/clusters/${c.id}`)} className="p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  {CATEGORY_META[c.category].emoji} {categoryLabel(c.category)}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[c.status]}`}>
                  {c.status}
                </span>
              </div>
              <h3 className="mt-2 text-sm font-bold leading-snug">{c.pattern}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-ink/60">{c.rootCauseHypothesis}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="flex items-center gap-3 text-ink/50">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {c.ward.replace(/ Ward.*/, '')}</span>
                  <span className="flex items-center gap-1"><Layers size={12} /> {c.issueIds.length} issues</span>
                </span>
                <span className="flex items-center gap-1 font-semibold text-saffron">
                  {Math.round(c.confidence * 100)}% <ChevronRight size={14} />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
