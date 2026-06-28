import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Inbox } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { IssueCard } from '../../components/shared/IssueCard'
import { Pill } from '../../components/shared/ui'
import { IssueStatus } from '../../types'

type Filter = 'ALL' | 'ACTIVE' | 'RESOLVED' | 'ESCALATED'

export function MyReports() {
  const { state, getEscalatableIssues } = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('ALL')

  const mine = useMemo(
    () =>
      state.issues
        .filter((i) => i.reportedBy === state.activeCitizen.id)
        .sort((a, b) => b.reportedAt - a.reportedAt),
    [state.issues, state.activeCitizen.id],
  )

  const escalatable = new Set(getEscalatableIssues().map((i) => i.id))

  const filtered = mine.filter((i) => {
    if (filter === 'ALL') return true
    if (filter === 'RESOLVED') return i.status === IssueStatus.RESOLVED
    if (filter === 'ESCALATED') return i.status === IssueStatus.ESCALATED
    return i.status !== IssueStatus.RESOLVED && i.status !== IssueStatus.ESCALATED
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold">My reports</h1>
        <p className="text-sm text-ink/50">{mine.length} total · {state.activeCitizen.ward}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['ALL', 'ACTIVE', 'RESOLVED', 'ESCALATED'] as Filter[]).map((f) => (
          <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f[0] + f.slice(1).toLowerCase()}
          </Pill>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-ink/40">
          <Inbox size={36} />
          <p className="text-sm">No reports here yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((i) => (
            <IssueCard
              key={i.id}
              issue={i}
              onClick={() => navigate(`/citizen/reports/${i.id}`)}
              rightSlot={
                escalatable.has(i.id) ? (
                  <span className="flex items-center gap-1 rounded-full bg-danger-light px-2 py-0.5 text-[10px] font-bold text-danger">
                    <AlertTriangle size={11} /> Escalation due
                  </span>
                ) : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
