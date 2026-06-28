// Root-cause clustering (EC3). Groups issues by (ward, category) within a time
// window; any group with >= MIN_CLUSTER issues is a candidate pattern.
import {
  type Issue,
  type RootCauseCluster,
  type RootCauseAnalysis,
  IssueCategory,
} from '../types'
import { DAY_MS } from '../utils/format'
import { centroid } from '../utils/geometry'
import { categoryLabel } from '../utils/labels'

export const MIN_CLUSTER = 3
export const CLUSTER_WINDOW_DAYS = 30

export interface ClusterCandidate {
  ward: string
  category: IssueCategory
  issueIds: string[]
  issues: Issue[]
  center: { lat: number; lng: number }
}

export function detectClusters(
  issues: Issue[],
  now: number = Date.now(),
): ClusterCandidate[] {
  const cutoff = now - CLUSTER_WINDOW_DAYS * DAY_MS
  const groups = new Map<string, Issue[]>()
  for (const iss of issues) {
    if (iss.reportedAt < cutoff) continue
    const key = `${iss.location.ward}::${iss.category}`
    const arr = groups.get(key) ?? []
    arr.push(iss)
    groups.set(key, arr)
  }
  const candidates: ClusterCandidate[] = []
  for (const [key, arr] of groups) {
    if (arr.length < MIN_CLUSTER) continue
    const [ward, category] = key.split('::')
    candidates.push({
      ward,
      category: category as IssueCategory,
      issueIds: arr.map((i) => i.id),
      issues: arr,
      center: centroid(arr.map((i) => i.location)),
    })
  }
  // Largest, most recent clusters first.
  return candidates.sort((a, b) => b.issueIds.length - a.issueIds.length)
}

// Preliminary (non-AI) hypothesis used before a Gemini call confirms it.
export function preliminaryHypothesis(c: ClusterCandidate): string {
  return `${c.issueIds.length} ${categoryLabel(c.category).toLowerCase()} reports clustered in ${c.ward} within ${CLUSTER_WINDOW_DAYS} days — likely a shared underlying cause on this stretch.`
}

// Build a stored RootCauseCluster record from a candidate + an analysis result.
export function buildClusterRecord(
  c: ClusterCandidate,
  analysis: RootCauseAnalysis,
  now: number = Date.now(),
): RootCauseCluster {
  return {
    id: `cluster-${c.ward.replace(/\W+/g, '')}-${c.category}-${now}`,
    detectedAt: now,
    ward: c.ward,
    issueIds: c.issueIds,
    pattern: analysis.pattern,
    rootCauseHypothesis: analysis.rootCauseHypothesis,
    recommendedAction: analysis.recommendedAction,
    confidence: analysis.confidence,
    category: c.category,
    status: 'DETECTED',
    priorityForAuthority: analysis.priorityForAuthority,
  }
}

// Generic analysis fallback for non-demo clusters (no API key / demo mode).
export function genericAnalysis(c: ClusterCandidate): RootCauseAnalysis {
  const cat = categoryLabel(c.category).toLowerCase()
  return {
    patternDetected: true,
    pattern: `${c.issueIds.length} ${cat} reports within ${CLUSTER_WINDOW_DAYS} days in ${c.ward}`,
    rootCauseHypothesis: `A concentration of ${cat} reports in ${c.ward} over a short window points to a shared local cause rather than isolated incidents — for example deferred maintenance, a failing utility line, or a recurring environmental trigger on this stretch. A targeted site inspection is warranted before piecemeal fixes.`,
    recommendedAction: `Schedule a coordinated inspection of the affected stretch in ${c.ward}, identify the common upstream cause, and address it once rather than repeatedly patching individual reports.`,
    confidence: Math.min(0.75, 0.5 + c.issueIds.length * 0.05),
    priorityForAuthority: c.issueIds.length >= 5 ? 'HIGH' : 'MEDIUM',
  }
}
