import { useMemo, useState } from 'react'
import {
  Sparkles,
  Share2,
  Download,
  FileText,
  Star,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Button, Card, Stat, Spinner, SectionTitle } from '../../components/shared/ui'
import { Modal } from '../../components/shared/Modal'
import { Icon } from '../../components/shared/Icon'
import { PieCard, LineCard } from '../../components/charts/Charts'
import { BADGE_DEFS, reputationTier } from '../../services/gamificationRules'
import { categoryLabel, CATEGORY_META } from '../../utils/labels'
import { monthName, DAY_MS } from '../../utils/format'
import { type ImpactNarrative } from '../../types'

export function ImpactDashboard() {
  const { state, generateWardImpact } = useApp()
  const citizen = state.activeCitizen
  const ward = citizen.ward
  const [loading, setLoading] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const narrative = state.impactNarratives.find((n) => n.ward === ward)

  const mine = useMemo(
    () => state.issues.filter((i) => i.reportedBy === citizen.id),
    [state.issues, citizen.id],
  )

  const pieData = useMemo(() => {
    const m = new Map<string, number>()
    mine.forEach((i) => m.set(i.category, (m.get(i.category) ?? 0) + 1))
    return [...m.entries()].map(([cat, value]) => ({
      name: categoryLabel(cat as any),
      value,
      color: CATEGORY_META[cat as keyof typeof CATEGORY_META].color,
    }))
  }, [mine])

  const lineData = useMemo(() => {
    const now = Date.now()
    const buckets: { name: string; reports: number }[] = []
    for (let k = 5; k >= 0; k--) {
      const d = new Date(now - k * 30 * DAY_MS)
      buckets.push({ name: monthName(d.getTime()).slice(0, 3), reports: 0 })
    }
    mine.forEach((i) => {
      const monthsAgo = Math.floor((now - i.reportedAt) / (30 * DAY_MS))
      const idx = 5 - monthsAgo
      if (idx >= 0 && idx < 6) buckets[idx].reports += 1
    })
    return buckets
  }, [mine])

  async function generate() {
    setLoading(true)
    await generateWardImpact(ward)
    setLoading(false)
  }

  const tier = reputationTier(citizen.reputationScore)

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold">Your impact</h1>

      {/* AI narrative card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-saffron to-civicblue p-4 text-white">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={16} /> This month in {ward}
          </div>
        </div>
        <div className="p-4">
          {narrative ? (
            <NarrativeBlock narrative={narrative} onShare={() => setShareOpen(true)} />
          ) : (
            <div className="text-center">
              <p className="text-sm text-ink/60">
                Let the AI write your ward's monthly impact story from the latest data.
              </p>
              <Button className="mt-3" onClick={generate} disabled={loading}>
                {loading ? <Spinner className="h-4 w-4" /> : <Sparkles size={16} />}
                {loading ? 'Writing your story…' : "Generate this month's story"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* personal stats */}
      <div className="grid grid-cols-2 gap-3">
        <Stat value={citizen.totalReports} label="Reports filed" />
        <Stat value={citizen.totalResolved} label="Resolved" accent="var(--color-success)" />
        <Stat value={citizen.totalVerifications} label="Verifications" accent="var(--color-civicblue)" />
        <Stat value={citizen.reputationScore} label="Reputation" accent="#9333ea" />
      </div>

      {/* reputation tier */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-bold">
            <Star size={16} className="text-saffron" /> {tier.label}
          </span>
          <span className="text-ink/50">{citizen.reputationScore}/{tier.next}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-saffron"
            style={{ width: `${Math.min(100, (citizen.reputationScore / tier.next) * 100)}%` }}
          />
        </div>
      </Card>

      {/* badges */}
      <div>
        <SectionTitle className="mb-2">Badges</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {BADGE_DEFS.map((b) => {
            const earned = citizen.badges.some((x) => x.id === b.id)
            return (
              <div
                key={b.id}
                className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center ${
                  earned ? 'bg-white shadow-card' : 'bg-black/[0.03]'
                }`}
                title={b.description}
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full ${
                    earned ? 'bg-saffron text-white' : 'bg-black/10 text-ink/30'
                  }`}
                >
                  <Icon name={b.icon} size={20} />
                </span>
                <span className={`text-[11px] font-bold leading-tight ${earned ? 'text-ink' : 'text-ink/35'}`}>
                  {b.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* charts */}
      <Card className="p-4">
        <SectionTitle className="mb-2">My reports by category</SectionTitle>
        <PieCard data={pieData} />
      </Card>
      <Card className="p-4">
        <SectionTitle className="mb-2">My reporting over time</SectionTitle>
        <LineCard data={lineData} lines={[{ key: 'reports', color: '#F4811F', name: 'Reports' }]} />
      </Card>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share your ward impact">
        {narrative?.shareableImageUrl ? (
          <div className="space-y-3">
            <img src={narrative.shareableImageUrl} alt="Impact card" className="w-full rounded-2xl shadow-card" />
            <a href={narrative.shareableImageUrl} download={`civicsetu-${ward}.png`}>
              <Button className="w-full">
                <Download size={16} /> Download card
              </Button>
            </a>
          </div>
        ) : (
          <p className="text-sm text-ink/50">No card available.</p>
        )}
      </Modal>
    </div>
  )
}

function NarrativeBlock({
  narrative,
  onShare,
}: {
  narrative: ImpactNarrative
  onShare: () => void
}) {
  return (
    <div>
      <div className="mb-3 grid grid-cols-3 gap-2 text-center">
        <Mini icon={<FileText size={14} />} value={narrative.reportsCount} label="Reports" />
        <Mini icon={<ShieldCheck size={14} />} value={narrative.resolvedCount} label="Resolved" />
        <Mini icon={<TrendingUp size={14} />} value={`~${narrative.estimatedAccidentsPrevented}`} label="Accidents ↓" />
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-ink/75">{narrative.narrativeText}</p>
      <Button className="mt-3 w-full" variant="secondary" onClick={onShare}>
        <Share2 size={16} /> Share card
      </Button>
    </div>
  )
}

function Mini({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl bg-black/[0.03] p-2">
      <div className="flex items-center justify-center gap-1 text-saffron">{icon}</div>
      <div className="text-base font-extrabold text-ink">{value}</div>
      <div className="text-[10px] text-ink/50">{label}</div>
    </div>
  )
}
