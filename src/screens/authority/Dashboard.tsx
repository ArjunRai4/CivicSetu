import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Radar,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Card, StatusBadge, SeverityBadge } from '../../components/shared/ui'
import { CATEGORY_META, categoryLabel } from '../../utils/labels'
import { avgResponseHoursForIssues } from '../../services/impactCalculator'
import { daysSince, pct } from '../../utils/format'
import { IssueStatus, Severity, type Issue } from '../../types'

type SortKey = 'severity' | 'age' | 'status'

export function AuthorityDashboard() {
  const { state, authorityById } = useApp()
  const navigate = useNavigate()
  const authority = authorityById(state.activeAuthorityId)
  const [sort, setSort] = useState<SortKey>('severity')

  const tickets = useMemo(
    () => state.issues.filter((i) => i.assignedAuthorityId === state.activeAuthorityId),
    [state.issues, state.activeAuthorityId],
  )

  const open = tickets.filter((i) => i.status !== IssueStatus.RESOLVED)
  const critical = open.filter((i) => i.severity >= Severity.HIGH)
  const resolved = tickets.filter((i) => i.status === IssueStatus.RESOLVED)
  const avgResp = avgResponseHoursForIssues(resolved)
  const resolutionRate = pct(resolved.length, tickets.length)

  const clusters = useMemo(
    () =>
      state.rootCauseClusters.filter(
        (c) =>
          authority?.handlesCategories.includes(c.category) &&
          c.status !== 'DISMISSED',
      ),
    [state.rootCauseClusters, authority],
  )

  const sorted = useMemo(() => {
    const arr = [...tickets]
    if (sort === 'severity') arr.sort((a, b) => b.severity - a.severity)
    if (sort === 'age') arr.sort((a, b) => a.reportedAt - b.reportedAt)
    if (sort === 'status') arr.sort((a, b) => a.status.localeCompare(b.status))
    return arr
  }, [tickets, sort])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">{authority?.shortName} Dashboard</h1>
        <p className="text-sm text-ink/50">
          {authority?.department} · {authority?.officer.name}, {authority?.officer.title}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={<Inbox size={18} />} value={open.length} label="Open tickets" color="#2563eb" />
        <KpiCard icon={<AlertTriangle size={18} />} value={critical.length} label="High / critical" color="#dc2626" />
        <KpiCard icon={<Clock size={18} />} value={`${avgResp}h`} label="Avg response" color="#d97706" />
        <KpiCard icon={<CheckCircle2 size={18} />} value={`${resolutionRate}%`} label="Resolution rate" color="#16a34a" />
      </div>

      {/* Patterns detected (EC3) */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Radar size={18} className="text-saffron" />
          <h2 className="text-lg font-bold">Patterns detected by AI</h2>
          <span className="rounded-full bg-saffron-light px-2 py-0.5 text-xs font-bold text-saffron">
            {clusters.length}
          </span>
        </div>
        {clusters.length === 0 ? (
          <Card className="p-4 text-sm text-ink/50">No recurring patterns detected for your categories.</Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {clusters.slice(0, 3).map((c) => (
              <Card
                key={c.id}
                onClick={() => navigate(`/authority/clusters/${c.id}`)}
                className="p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-saffron-light px-2 py-0.5 text-xs font-bold text-saffron">
                    {Math.round(c.confidence * 100)}% confidence
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.status === 'DETECTED' ? 'bg-danger-light text-danger' : 'bg-civicblue-light text-civicblue'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-bold leading-snug">{c.pattern}</h3>
                <p className="mt-1 line-clamp-3 text-xs text-ink/60">{c.rootCauseHypothesis}</p>
                <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-saffron">
                  View analysis <ChevronRight size={14} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Ticket queue */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">Ticket queue ({tickets.length})</h2>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-ink/40">Sort:</span>
            {(['severity', 'age', 'status'] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setSort(k)}
                className={`rounded-full px-2.5 py-1 font-medium ${sort === k ? 'bg-saffron text-white' : 'bg-black/5 text-ink/60'}`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
        <Card className="overflow-hidden">
          {/* desktop table */}
          <div className="overflow-x-auto max-md:hidden">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-black/[0.03] text-left text-xs uppercase text-ink/50">
                <tr>
                  <th className="px-4 py-2.5">Issue</th>
                  <th className="px-4 py-2.5">Ward</th>
                  <th className="px-4 py-2.5">Severity</th>
                  <th className="px-4 py-2.5">Age</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {sorted.map((i) => (
                  <TicketRow key={i.id} issue={i} onAction={() => navigate(`/authority/tickets/${i.id}`)} />
                ))}
              </tbody>
            </table>
          </div>
          {/* mobile cards */}
          <div className="divide-y divide-black/5 md:hidden">
            {sorted.map((i) => (
              <div
                key={i.id}
                onClick={() => navigate(`/authority/tickets/${i.id}`)}
                className="flex items-center gap-3 p-3"
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/5">
                  <img src={i.photoDataUrl} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{i.title}</div>
                  <div className="mt-1 flex gap-1.5">
                    <SeverityBadge severity={i.severity} />
                    <StatusBadge status={i.status} />
                  </div>
                </div>
                <span className="text-xs text-ink/40">{daysSince(i.reportedAt)}d</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({ icon, value, label, color }: { icon: React.ReactNode; value: React.ReactNode; label: string; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ backgroundColor: color }}>
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-extrabold" style={{ color }}>{value}</div>
      <div className="text-xs font-medium text-ink/55">{label}</div>
    </Card>
  )
}

function TicketRow({ issue, onAction }: { issue: Issue; onAction: () => void }) {
  return (
    <tr className="hover:bg-black/[0.02]">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-black/5">
            <img src={issue.photoDataUrl} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="whitespace-nowrap">
            <div className="font-medium">{CATEGORY_META[issue.category].emoji} {issue.title}</div>
            <div className="text-xs text-ink/40">{categoryLabel(issue.category)} · {issue.complaintLetter.referenceNumber}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5 text-ink/60">{issue.location.ward}</td>
      <td className="px-4 py-2.5"><SeverityBadge severity={issue.severity} /></td>
      <td className="px-4 py-2.5 text-ink/60">{daysSince(issue.reportedAt)}d</td>
      <td className="px-4 py-2.5"><StatusBadge status={issue.status} /></td>
      <td className="px-4 py-2.5">
        <button onClick={onAction} className="flex items-center gap-1 rounded-lg bg-saffron px-3 py-1.5 text-xs font-bold text-white">
          Take action <ArrowRight size={13} />
        </button>
      </td>
    </tr>
  )
}
