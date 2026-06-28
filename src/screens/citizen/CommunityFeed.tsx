import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Flag, MapPin, Users } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Card, Pill, SeverityBadge, StatusBadge } from '../../components/shared/ui'
import { IssueCategory, IssueStatus } from '../../types'
import { categoryLabel, CATEGORY_META } from '../../utils/labels'
import { WARDS, DEMO_WARD } from '../../data/mockData/ward'
import { haversine } from '../../utils/geometry'
import { formatDistance, relativeTime } from '../../utils/format'

export function CommunityFeed() {
  const { state, verifyIssue } = useApp()
  const navigate = useNavigate()
  const [cat, setCat] = useState<IssueCategory | 'ALL'>('ALL')

  const ward = state.activeCitizen.ward
  const center = WARDS[ward]?.center ?? WARDS[DEMO_WARD].center

  const feed = useMemo(
    () =>
      state.issues
        .filter(
          (i) =>
            i.location.ward === ward &&
            i.reportedBy !== state.activeCitizen.id &&
            i.status !== IssueStatus.RESOLVED,
        )
        .filter((i) => cat === 'ALL' || i.category === cat)
        .sort((a, b) => b.reportedAt - a.reportedAt),
    [state.issues, ward, state.activeCitizen.id, cat],
  )

  const cats = useMemo(() => {
    const set = new Set<IssueCategory>()
    state.issues
      .filter((i) => i.location.ward === ward && i.reportedBy !== state.activeCitizen.id)
      .forEach((i) => set.add(i.category))
    return [...set]
  }, [state.issues, ward, state.activeCitizen.id])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-extrabold">
          <Users size={20} className="text-saffron" /> Community feed
        </h1>
        <p className="text-sm text-ink/50">Issues reported by your neighbours in {ward}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill active={cat === 'ALL'} onClick={() => setCat('ALL')}>All</Pill>
        {cats.map((c) => (
          <Pill key={c} active={cat === c} onClick={() => setCat(c)}>
            {CATEGORY_META[c].emoji} {categoryLabel(c)}
          </Pill>
        ))}
      </div>

      {feed.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink/40">No open issues from neighbours here.</p>
      ) : (
        <div className="space-y-3">
          {feed.map((i) => {
            const verifs = i.verifications.filter((v) => v.confirmsExists).length
            const dist = haversine(center, i.location)
            const alreadyVerified = i.verifications.some((v) => v.citizenId === state.activeCitizen.id)
            return (
              <Card key={i.id} className="overflow-hidden">
                <div
                  className="flex cursor-pointer gap-3 p-3"
                  onClick={() => navigate(`/citizen/reports/${i.id}`)}
                >
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black/5">
                    <img src={i.photoDataUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span>{CATEGORY_META[i.category].emoji}</span>
                      <h3 className="truncate text-sm font-bold">{i.title}</h3>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-ink/50">
                      <MapPin size={12} /> {formatDistance(dist)} away · {relativeTime(i.reportedAt)}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <StatusBadge status={i.status} />
                      <SeverityBadge severity={i.severity} />
                      {verifs >= 3 && (
                        <span className="rounded-full bg-success-light px-2 py-0.5 text-[10px] font-bold text-success">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-black/5 px-3 py-2">
                  <span className="flex items-center gap-1 text-xs text-ink/50">
                    <ShieldCheck size={13} className="text-success" /> {verifs} confirmations
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={alreadyVerified}
                      onClick={() => verifyIssue(i.id, true)}
                      className="flex items-center gap-1 rounded-full bg-success-light px-3 py-1 text-xs font-bold text-success disabled:opacity-40"
                    >
                      <ShieldCheck size={13} /> Verify
                    </button>
                    <button
                      disabled={alreadyVerified}
                      onClick={() => verifyIssue(i.id, false)}
                      className="flex items-center gap-1 rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-ink/60 disabled:opacity-40"
                    >
                      <Flag size={13} /> Flag
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
