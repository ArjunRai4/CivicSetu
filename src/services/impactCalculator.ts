// Impact heuristics (spec §Bonus impact storytelling). Cost-saved and
// accidents-prevented are heuristic estimates, not real data.
import {
  type Issue,
  type Citizen,
  type WardStats,
  type DateRange,
  IssueCategory,
  IssueStatus,
} from '../types'
import { pct, hoursSince } from '../utils/format'

// ₹ saved per resolved issue, by category (deferred-repair-cost heuristic).
const COST_SAVED_INR: Record<IssueCategory, number> = {
  [IssueCategory.POTHOLE]: 15000,
  [IssueCategory.STREETLIGHT]: 8000,
  [IssueCategory.WATER_LEAK]: 22000,
  [IssueCategory.GARBAGE]: 5000,
  [IssueCategory.FALLEN_TREE]: 12000,
  [IssueCategory.BROKEN_SIGNAL]: 18000,
  [IssueCategory.EXPOSED_WIRING]: 25000,
  [IssueCategory.STRAY_ANIMAL]: 4000,
  [IssueCategory.DRAINAGE]: 30000,
  [IssueCategory.OTHER]: 6000,
}

// Accidents prevented (over ~6 months) per resolved issue, by category.
const ACCIDENTS_PREVENTED: Record<IssueCategory, number> = {
  [IssueCategory.POTHOLE]: 1.5,
  [IssueCategory.STREETLIGHT]: 2,
  [IssueCategory.WATER_LEAK]: 0.5,
  [IssueCategory.GARBAGE]: 0.2,
  [IssueCategory.FALLEN_TREE]: 1,
  [IssueCategory.BROKEN_SIGNAL]: 3,
  [IssueCategory.EXPOSED_WIRING]: 2.5,
  [IssueCategory.STRAY_ANIMAL]: 0.8,
  [IssueCategory.DRAINAGE]: 0.6,
  [IssueCategory.OTHER]: 0.3,
}

export function costSavedFor(issue: Issue): number {
  return COST_SAVED_INR[issue.category] ?? 6000
}

export function accidentsPreventedFor(issue: Issue): number {
  return ACCIDENTS_PREVENTED[issue.category] ?? 0.3
}

function resolvedAt(issue: Issue): number | null {
  const r = issue.statusHistory.find((s) => s.toStatus === IssueStatus.RESOLVED)
  return r ? r.changedAt : null
}

export function computeWardStats(
  ward: string,
  issues: Issue[],
  citizens: Citizen[],
  period: DateRange,
): WardStats {
  const inWard = issues.filter(
    (i) =>
      i.location.ward === ward &&
      i.reportedAt >= period.start &&
      i.reportedAt <= period.end,
  )
  const resolved = inWard.filter((i) => i.status === IssueStatus.RESOLVED)

  // top categories
  const catCount = new Map<IssueCategory, number>()
  for (const i of inWard) catCount.set(i.category, (catCount.get(i.category) ?? 0) + 1)
  const topCategories = [...catCount.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  // top contributor (by reports in this ward+period)
  const byCitizen = new Map<string, number>()
  for (const i of inWard) byCitizen.set(i.reportedBy, (byCitizen.get(i.reportedBy) ?? 0) + 1)
  let topContributorId = ''
  let topContributorReports = 0
  for (const [id, n] of byCitizen) {
    if (n > topContributorReports) {
      topContributorReports = n
      topContributorId = id
    }
  }
  const topContributor =
    citizens.find((c) => c.id === topContributorId)?.name ?? 'A local advocate'

  // avg response time = first acknowledgement/dispatch latency for resolved
  const responseHrs: number[] = []
  for (const i of resolved) {
    const done = resolvedAt(i)
    if (done) responseHrs.push((done - i.reportedAt) / (1000 * 60 * 60))
  }
  const avgResponseHours =
    responseHrs.length > 0
      ? Math.round(responseHrs.reduce((s, h) => s + h, 0) / responseHrs.length)
      : 0

  const estimatedCostSavedINR = resolved.reduce((s, i) => s + costSavedFor(i), 0)
  const estimatedAccidentsPrevented = Math.round(
    resolved.reduce((s, i) => s + accidentsPreventedFor(i), 0),
  )

  return {
    ward,
    reportsCount: inWard.length,
    resolvedCount: resolved.length,
    resolutionPct: pct(resolved.length, inWard.length),
    topCategories,
    topContributor,
    topContributorReports,
    avgResponseHours,
    estimatedCostSavedINR,
    estimatedAccidentsPrevented,
  }
}

// Authority analytics helpers ------------------------------------------------
export function avgResponseHoursForIssues(issues: Issue[]): number {
  const hrs: number[] = []
  for (const i of issues) {
    const done = resolvedAt(i)
    if (done) hrs.push((done - i.reportedAt) / (1000 * 60 * 60))
  }
  if (hrs.length === 0) return 0
  return Math.round(hrs.reduce((s, h) => s + h, 0) / hrs.length)
}

export function ageHours(issue: Issue, now = Date.now()): number {
  return hoursSince(issue.reportedAt, now)
}
