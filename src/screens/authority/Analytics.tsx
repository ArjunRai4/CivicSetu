import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Card, SectionTitle, Button } from '../../components/shared/ui'
import { BarCard, LineCard, StackedBarCard } from '../../components/charts/Charts'
import { IssueCategory, IssueStatus } from '../../types'
import { categoryLabel, CATEGORY_META } from '../../utils/labels'
import { avgResponseHoursForIssues } from '../../services/impactCalculator'
import { DAY_MS, monthName, formatDate, pct } from '../../utils/format'

export function Analytics() {
  const { state } = useApp()
  const [monthsBack, setMonthsBack] = useState(6)

  const issues = state.issues

  // response time by category (resolved only)
  const responseByCategory = useMemo(() => {
    return Object.values(IssueCategory)
      .map((c) => {
        const resolved = issues.filter(
          (i) => i.category === c && i.status === IssueStatus.RESOLVED,
        )
        return {
          name: categoryLabel(c),
          value: avgResponseHoursForIssues(resolved),
          color: CATEGORY_META[c].color,
        }
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [issues])

  // monthly buckets
  const monthly = useMemo(() => {
    const now = Date.now()
    const buckets: { name: string; reported: number; resolved: number; open: number; rate: number }[] = []
    for (let k = monthsBack - 1; k >= 0; k--) {
      const start = new Date(now - k * 30 * DAY_MS)
      buckets.push({ name: monthName(start.getTime()).slice(0, 3), reported: 0, resolved: 0, open: 0, rate: 0 })
    }
    issues.forEach((i) => {
      const monthsAgo = Math.floor((now - i.reportedAt) / (30 * DAY_MS))
      const idx = monthsBack - 1 - monthsAgo
      if (idx >= 0 && idx < monthsBack) {
        buckets[idx].reported += 1
        if (i.status === IssueStatus.RESOLVED) buckets[idx].resolved += 1
      }
    })
    buckets.forEach((b) => {
      b.open = b.reported - b.resolved
      b.rate = pct(b.resolved, b.reported)
    })
    return buckets
  }, [issues, monthsBack])

  // top wards by volume
  const topWards = useMemo(() => {
    const m = new Map<string, number>()
    issues.forEach((i) => m.set(i.location.ward, (m.get(i.location.ward) ?? 0) + 1))
    return [...m.entries()]
      .map(([ward, value]) => ({ name: ward.replace(/ Ward.*/, ''), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [issues])

  function exportCsv() {
    const rows = [
      ['Reference', 'Category', 'Severity', 'Status', 'Ward', 'Address', 'Reported', 'Authority'],
      ...issues.map((i) => [
        i.complaintLetter.referenceNumber,
        i.category,
        String(i.severity),
        i.status,
        i.location.ward,
        i.location.address.replace(/,/g, ';'),
        formatDate(i.reportedAt),
        state.authorities.find((a) => a.id === i.assignedAuthorityId)?.shortName ?? '',
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'civicsetu-issues.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Analytics</h1>
          <p className="text-sm text-ink/50">Citywide civic performance across all departments</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={monthsBack}
            onChange={(e) => setMonthsBack(Number(e.target.value))}
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download size={14} /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <SectionTitle className="mb-2">Avg response time by category (hours)</SectionTitle>
          <BarCard data={responseByCategory} />
        </Card>

        <Card className="p-4">
          <SectionTitle className="mb-2">Resolution rate over time (%)</SectionTitle>
          <LineCard data={monthly} lines={[{ key: 'rate', color: '#16A34A', name: 'Resolution %' }]} />
        </Card>

        <Card className="p-4">
          <SectionTitle className="mb-2">Reported vs resolved per month</SectionTitle>
          <StackedBarCard
            data={monthly}
            bars={[
              { key: 'resolved', color: '#16A34A', name: 'Resolved' },
              { key: 'open', color: '#F4811F', name: 'Still open' },
            ]}
          />
        </Card>

        <Card className="p-4">
          <SectionTitle className="mb-2">Top wards by issue volume</SectionTitle>
          <BarCard data={topWards} layout="vertical" color="#1E3A8A" />
        </Card>
      </div>
    </div>
  )
}
