import { MapPin, ShieldCheck, Clock } from 'lucide-react'
import { type Issue } from '../../types'
import { Card, StatusBadge, SeverityBadge } from './ui'
import { categoryLabel, CATEGORY_META } from '../../utils/labels'
import { relativeTime, daysSince } from '../../utils/format'

export function IssueCard({
  issue,
  onClick,
  showWard = true,
  rightSlot,
}: {
  issue: Issue
  onClick?: () => void
  showWard?: boolean
  rightSlot?: React.ReactNode
}) {
  const verifs = issue.verifications.filter((v) => v.confirmsExists).length
  return (
    <Card onClick={onClick} className="flex gap-3 p-3">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/5">
        <img src={issue.photoDataUrl} alt={issue.title} className="h-full w-full object-cover" />
        <span
          className="absolute left-1 top-1 rounded-md px-1 text-[14px]"
          title={categoryLabel(issue.category)}
        >
          {CATEGORY_META[issue.category].emoji}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-bold text-ink">{issue.title}</h3>
          {rightSlot}
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-ink/50">
          <MapPin size={12} />
          <span className="truncate">{showWard ? issue.location.ward : issue.location.address}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={issue.status} />
          <SeverityBadge severity={issue.severity} />
        </div>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink/45">
          <span className="flex items-center gap-1">
            <Clock size={11} /> {daysSince(issue.reportedAt)}d · {relativeTime(issue.reportedAt)}
          </span>
          {verifs > 0 && (
            <span className="flex items-center gap-1 text-success">
              <ShieldCheck size={11} /> {verifs}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
