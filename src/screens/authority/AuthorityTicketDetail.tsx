import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  TrendingUp,
  Building2,
  Sparkles,
  Send,
  Radar,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Button, Card, StatusBadge, SeverityBadge } from '../../components/shared/ui'
import { CATEGORY_META, categoryLabel, STATUS_META } from '../../utils/labels'
import { formatDateTime, daysSince } from '../../utils/format'
import { IssueStatus } from '../../types'

const NEXT_STATUSES: IssueStatus[] = [
  IssueStatus.ACKNOWLEDGED,
  IssueStatus.DISPATCHED,
  IssueStatus.IN_PROGRESS,
  IssueStatus.RESOLVED,
]

export function AuthorityTicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state, authorityById, changeStatus, reassign } = useApp()
  const issue = useMemo(() => state.issues.find((i) => i.id === id), [state.issues, id])

  const [nextStatus, setNextStatus] = useState<IssueStatus>(IssueStatus.IN_PROGRESS)
  const [note, setNote] = useState('')

  if (!issue) {
    return (
      <div className="py-20 text-center text-ink/50">
        Ticket not found.
        <div className="mt-3">
          <Button variant="outline" onClick={() => navigate('/authority/dashboard')}>Back to dashboard</Button>
        </div>
      </div>
    )
  }

  const authority = authorityById(issue.assignedAuthorityId)
  const reporter = state.citizens.find((c) => c.id === issue.reportedBy)
  const cluster = state.rootCauseClusters.find((c) => c.id === issue.rootCauseClusterId)
  const w = issue.worseningPrediction

  function applyStatus() {
    changeStatus(issue!.id, nextStatus, 'AUTHORITY', note || undefined)
    setNote('')
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-ink/60">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* left: info */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="h-56 w-full overflow-hidden bg-black/5">
              <img src={issue.photoDataUrl} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-lg font-extrabold">
                  {CATEGORY_META[issue.category].emoji} {issue.title}
                </h1>
                <StatusBadge status={issue.status} />
              </div>
              <p className="mt-1 text-sm text-ink/60">{issue.location.address}, {issue.location.ward}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                <SeverityBadge severity={issue.severity} />
                <span className="rounded-full bg-black/5 px-2 py-0.5 font-medium text-ink/60">{issue.complaintLetter.referenceNumber}</span>
                <span className="text-ink/40">Reported by {reporter?.name ?? 'citizen'} · {daysSince(issue.reportedAt)}d ago</span>
              </div>
            </div>
          </Card>

          {/* AI reasoning */}
          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-civicblue">
              <Sparkles size={16} /> AI classification reasoning
            </div>
            <p className="mt-2 text-sm text-ink/75">
              Categorised as <b>{categoryLabel(issue.category)}</b> at severity <b>S{issue.severity}</b>.
            </p>
            {issue.severityReasoning && (
              <p className="mt-1 text-xs italic text-ink/55">{issue.severityReasoning}</p>
            )}
            <div className="mt-3 rounded-xl border border-warning/30 bg-warning-light/50 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-warning">
                <TrendingUp size={14} /> Worsening forecast — {Math.round(w.likelihood * 100)}% in ~{w.timeframeDays}d
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink/75">{w.reasoning}</p>
            </div>
          </Card>

          {cluster && (
            <Card
              onClick={() => navigate(`/authority/clusters/${cluster.id}`)}
              className="flex items-center gap-3 border border-saffron/30 bg-saffron-light/40 p-4"
            >
              <Radar size={20} className="text-saffron" />
              <div className="flex-1">
                <div className="text-sm font-bold text-saffron">Part of a detected pattern</div>
                <div className="text-xs text-ink/60">{cluster.pattern}</div>
              </div>
              <span className="text-xs font-semibold text-saffron">View →</span>
            </Card>
          )}

          {/* timeline */}
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-bold">Status timeline</h2>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="mt-1 h-3 w-3 rounded-full bg-danger ring-2 ring-white" />
                <div>
                  <div className="text-sm font-semibold">Reported</div>
                  <div className="text-[11px] text-ink/45">{formatDateTime(issue.reportedAt)}</div>
                </div>
              </li>
              {issue.statusHistory.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1 h-3 w-3 rounded-full ring-2 ring-white" style={{ backgroundColor: STATUS_META[s.toStatus].markerColor }} />
                  <div>
                    <div className="text-sm font-semibold">{STATUS_META[s.toStatus].label}</div>
                    <div className="text-[11px] text-ink/45">{formatDateTime(s.changedAt)} · {s.changedBy.toLowerCase()}</div>
                    {s.note && <div className="mt-0.5 text-xs text-ink/60">{s.note}</div>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* right: actions */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-sm font-bold">Take action</h2>
            <label className="mt-3 block text-xs font-semibold text-ink/50">Change status</label>
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as IssueStatus)}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium"
            >
              {NEXT_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>

            <label className="mt-3 block text-xs font-semibold text-ink/50">Note (attached to update)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. Field team scheduled for tomorrow 10 AM."
              className="mt-1 w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            />
            <Button className="mt-3 w-full" onClick={applyStatus}>
              <Send size={15} /> Update status
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Building2 size={16} className="text-civicblue" /> Assignment
            </div>
            <div className="mt-1 text-xs text-ink/50">Currently: {authority?.name}</div>
            <label className="mt-3 block text-xs font-semibold text-ink/50">Reassign to</label>
            <select
              value={issue.assignedAuthorityId}
              onChange={(e) => reassign(issue.id, e.target.value)}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium"
            >
              {state.authorities.map((a) => (
                <option key={a.id} value={a.id}>{a.shortName} — {a.department}</option>
              ))}
            </select>
          </Card>

          <Card className="p-4">
            <h2 className="text-sm font-bold">Complaint letter</h2>
            <div className="mt-2 max-h-48 overflow-y-auto thin-scroll rounded-xl bg-black/[0.03] p-3 text-xs text-ink/70 thin-scroll">
              <div className="font-bold">{issue.complaintLetter.subject}</div>
              <pre className={`mt-1 whitespace-pre-wrap font-sans lang-${issue.complaintLetter.language}`}>
                {issue.complaintLetter.body}
              </pre>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
