import {
  type Issue,
  type StatusChange,
  IssueCategory,
  IssueStatus,
  Severity,
  Language,
} from '../../types'
import { mulberry32, pick, randInt } from '../../utils/rng'
import { DAY_MS } from '../../utils/format'
import { categoryPhoto } from './photos'
import { WARDS, randomPointInWard, DEMO_WARD } from './ward'
import { AUTHORITIES } from './authorities'
import { findAuthorityId } from '../../services/routingService'
import { CACHED_WORSENING, GENERIC_WORSENING } from './cachedResponses'

const TITLES: Record<IssueCategory, string[]> = {
  [IssueCategory.POTHOLE]: ['Pothole on carriageway', 'Deep pothole near junction', 'Road crater after rain'],
  [IssueCategory.STREETLIGHT]: ['Streetlight not working', 'Dark stretch — lamp failure', 'Flickering street lamp'],
  [IssueCategory.WATER_LEAK]: ['Pipeline water leakage', 'Continuous water overflow', 'Burst water main'],
  [IssueCategory.GARBAGE]: ['Uncollected garbage pile', 'Garbage black-spot', 'Overflowing waste bin'],
  [IssueCategory.FALLEN_TREE]: ['Fallen tree blocking road', 'Uprooted tree on footpath', 'Dangerous leaning tree'],
  [IssueCategory.BROKEN_SIGNAL]: ['Traffic signal not working', 'Faulty signal timing', 'Dead traffic light'],
  [IssueCategory.EXPOSED_WIRING]: ['Exposed electrical wiring', 'Hanging live cables', 'Open junction box'],
  [IssueCategory.STRAY_ANIMAL]: ['Stray cattle on road', 'Aggressive stray dogs', 'Stray animal menace'],
  [IssueCategory.DRAINAGE]: ['Choked storm-water drain', 'Open drain hazard', 'Overflowing sewage'],
  [IssueCategory.OTHER]: ['Civic issue reported', 'Public nuisance', 'Infrastructure complaint'],
}

const ROADS: Record<string, string[]> = {
  'Indiranagar Ward 80': ['100 Feet Road', 'CMH Road', '12th Main', '80 Feet Road', 'Chinmaya Mission Hospital Rd'],
  'Koramangala Ward 68': ['80 Feet Road', '5th Block Main', 'Sony World Junction', 'ST Bed Layout Rd'],
  'Whitefield Ward 84': ['Whitefield Main Rd', 'ITPL Road', 'Varthur Road', 'Hope Farm Junction'],
  'Jayanagar Ward 169': ['11th Main', '4th Block Rd', 'Jayanagar 9th Block', 'BTM Link Rd'],
  'HSR Layout Ward 174': ['Sector 1 Main', '27th Main', 'Agara Lake Rd', 'Outer Ring Rd'],
  'Malleshwaram Ward 45': ['Sampige Road', '8th Cross', 'Margosa Road', '15th Cross'],
}

function descFor(cat: IssueCategory, road: string): string {
  const map: Record<IssueCategory, string> = {
    [IssueCategory.POTHOLE]: `A pothole has formed on ${road}, posing a risk to two-wheeler riders.`,
    [IssueCategory.STREETLIGHT]: `The street light on ${road} is non-functional, leaving the stretch unsafe at night.`,
    [IssueCategory.WATER_LEAK]: `Treated water is leaking continuously from a pipeline on ${road}.`,
    [IssueCategory.GARBAGE]: `Garbage has accumulated on ${road} and has not been collected for days.`,
    [IssueCategory.FALLEN_TREE]: `A tree has fallen on ${road}, partially obstructing movement.`,
    [IssueCategory.BROKEN_SIGNAL]: `The traffic signal at ${road} is not functioning, causing confusion.`,
    [IssueCategory.EXPOSED_WIRING]: `Exposed electrical wiring spotted on ${road} — an electrocution hazard.`,
    [IssueCategory.STRAY_ANIMAL]: `Stray animals are creating a menace on ${road}.`,
    [IssueCategory.DRAINAGE]: `The storm-water drain on ${road} is choked and overflowing.`,
    [IssueCategory.OTHER]: `A civic issue has been reported on ${road}.`,
  }
  return map[cat]
}

function refNo(seq: number): string {
  return `CS-2026-${String(seq).padStart(5, '0')}`
}

function buildStatusHistory(
  final: IssueStatus,
  reportedAt: number,
  rnd: () => number,
): StatusChange[] {
  const chain: IssueStatus[] = [
    IssueStatus.REPORTED,
    IssueStatus.ACKNOWLEDGED,
    IssueStatus.DISPATCHED,
    IssueStatus.IN_PROGRESS,
    IssueStatus.RESOLVED,
  ]
  const notes: Record<string, string> = {
    [IssueStatus.ACKNOWLEDGED]: 'Complaint registered and acknowledged.',
    [IssueStatus.DISPATCHED]: 'Field team dispatched to site.',
    [IssueStatus.IN_PROGRESS]: 'Repair work underway.',
    [IssueStatus.RESOLVED]: 'Issue resolved and verified.',
  }
  const history: StatusChange[] = []
  let t = reportedAt
  let idx = chain.indexOf(final)
  if (final === IssueStatus.ESCALATED) idx = 2 // escalated from dispatched
  for (let i = 1; i <= idx; i++) {
    t += randInt(6, 40, rnd) * 60 * 60 * 1000
    history.push({
      fromStatus: chain[i - 1],
      toStatus: chain[i],
      changedAt: t,
      changedBy: 'AUTHORITY',
      note: notes[chain[i]],
    })
  }
  if (final === IssueStatus.ESCALATED) {
    t += 7 * DAY_MS
    history.push({
      fromStatus: IssueStatus.DISPATCHED,
      toStatus: IssueStatus.ESCALATED,
      changedAt: t,
      changedBy: 'SYSTEM',
      note: 'Auto-escalated by AI advocate after SLA breach.',
    })
  }
  return history
}

interface IssueSpec {
  category: IssueCategory
  ward: string
  severity?: Severity
  status?: IssueStatus
  daysAgo?: number
  reportedBy?: string
  road?: string
  lat?: number
  lng?: number
  language?: Language
}

let SEQ = 100

function makeIssue(spec: IssueSpec, rnd: () => number, now: number): Issue {
  const seq = SEQ++
  const ward = spec.ward
  const wardInfo = WARDS[ward] ?? WARDS[DEMO_WARD]
  const road = spec.road ?? pick(ROADS[ward] ?? ROADS[DEMO_WARD], rnd)
  const category = spec.category
  const severity = spec.severity ?? (randInt(1, 4, rnd) as Severity)
  const status = spec.status ?? IssueStatus.REPORTED
  const daysAgo = spec.daysAgo ?? randInt(1, 180, rnd)
  const reportedAt = now - daysAgo * DAY_MS
  const pt =
    spec.lat != null && spec.lng != null
      ? { lat: spec.lat, lng: spec.lng }
      : randomPointInWard(ward, rnd)
  const reportedBy = spec.reportedBy ?? `cit-${randInt(1, 29, rnd)}`
  const authorityId = findAuthorityId(category, ward, AUTHORITIES)
  const reference = refNo(seq)
  const title = pick(TITLES[category], rnd)
  const description = descFor(category, road)
  const statusHistory = buildStatusHistory(status, reportedAt, rnd)
  const worsening = CACHED_WORSENING[category] ?? GENERIC_WORSENING

  // light community verifications
  const vCount = randInt(0, 4, rnd)
  const verifications = Array.from({ length: vCount }).map(() => ({
    citizenId: `cit-${randInt(1, 29, rnd)}`,
    verifiedAt: reportedAt + randInt(1, 48, rnd) * 60 * 60 * 1000,
    confirmsExists: rnd() > 0.1,
  }))

  return {
    id: `iss-${seq}`,
    category,
    severity,
    status,
    title,
    description,
    severityReasoning: worsening.reasoning.slice(0, 120) + '…',
    photoDataUrl: categoryPhoto(category, seq),
    location: {
      lat: pt.lat,
      lng: pt.lng,
      address: `${road}, ${ward.replace(/ Ward.*/, '')}`,
      ward,
      city: wardInfo.city,
    },
    reportedBy,
    reportedAt,
    assignedAuthorityId: authorityId,
    verifications,
    statusHistory,
    worseningPrediction: worsening,
    complaintLetter: {
      language: spec.language ?? Language.ENGLISH,
      subject: `Complaint: ${title} — ${reference}`,
      body: `Dear Sir/Madam,\n\nI wish to report ${description} Location: ${road}, ${ward}. Reference: ${reference}.\n\nKindly arrange for inspection and resolution at the earliest.\n\nYours faithfully,\nA concerned citizen`,
      referenceNumber: reference,
    },
    escalationLog: [],
    slaHours: 7 * 24,
  }
}

// ---------------------------------------------------------------------------
// Build the full seed set. Returns issues + the next reference sequence.
// ---------------------------------------------------------------------------
export function buildHistoricalIssues(now: number = Date.now()): {
  issues: Issue[]
  nextSeq: number
} {
  SEQ = 100
  const rnd = mulberry32(778899)
  const issues: Issue[] = []

  // === CLUSTER A: 5 potholes on 100 Feet Road, Indiranagar within 28 days ===
  // (anchors EC3 root-cause demo; matches CACHED_ROOT_CAUSE)
  const clusterAbase = WARDS[DEMO_WARD].center
  const clusterAStatuses = [
    IssueStatus.REPORTED,
    IssueStatus.DISPATCHED,
    IssueStatus.ACKNOWLEDGED,
    IssueStatus.REPORTED,
    IssueStatus.DISPATCHED,
  ]
  for (let i = 0; i < 5; i++) {
    issues.push(
      makeIssue(
        {
          category: IssueCategory.POTHOLE,
          ward: DEMO_WARD,
          severity: i < 2 ? Severity.HIGH : Severity.MEDIUM,
          status: clusterAStatuses[i],
          daysAgo: 4 + i * 5, // spread across ~24 days
          road: '100 Feet Road',
          lat: clusterAbase.lat + 0.0018 + i * 0.0004,
          lng: clusterAbase.lng - 0.0012 + i * 0.0003,
          reportedBy: i === 0 ? 'cit-0' : i === 1 ? 'cit-2' : `cit-${randInt(3, 20, rnd)}`,
        },
        rnd,
        now,
      ),
    )
  }

  // === CLUSTER B: 4 streetlight outages in Whitefield within 26 days ===
  for (let i = 0; i < 4; i++) {
    issues.push(
      makeIssue(
        {
          category: IssueCategory.STREETLIGHT,
          ward: 'Whitefield Ward 84',
          severity: Severity.MEDIUM,
          status: i % 2 === 0 ? IssueStatus.REPORTED : IssueStatus.DISPATCHED,
          daysAgo: 3 + i * 7,
          road: 'ITPL Road',
        },
        rnd,
        now,
      ),
    )
  }

  // === CLUSTER C: 3 garbage black-spots in Koramangala within 20 days ===
  for (let i = 0; i < 3; i++) {
    issues.push(
      makeIssue(
        {
          category: IssueCategory.GARBAGE,
          ward: 'Koramangala Ward 68',
          severity: Severity.MEDIUM,
          status: IssueStatus.REPORTED,
          daysAgo: 5 + i * 6,
          road: '5th Block Main',
        },
        rnd,
        now,
      ),
    )
  }

  // === OVERDUE escalation issue (EC5): reported 9 days ago, unresolved ===
  issues.push(
    makeIssue(
      {
        category: IssueCategory.WATER_LEAK,
        ward: DEMO_WARD,
        severity: Severity.HIGH,
        status: IssueStatus.DISPATCHED,
        daysAgo: 9,
        road: 'CMH Road',
        reportedBy: 'cit-0',
      },
      rnd,
      now,
    ),
  )

  // === Demo citizen's own reports (variety, incl. one resolved) ===
  issues.push(
    makeIssue(
      { category: IssueCategory.GARBAGE, ward: DEMO_WARD, severity: Severity.MEDIUM, status: IssueStatus.RESOLVED, daysAgo: 21, reportedBy: 'cit-0', road: '12th Main' },
      rnd,
      now,
    ),
  )
  issues.push(
    makeIssue(
      { category: IssueCategory.STREETLIGHT, ward: DEMO_WARD, severity: Severity.MEDIUM, status: IssueStatus.IN_PROGRESS, daysAgo: 5, reportedBy: 'cit-0', road: 'CMH Road' },
      rnd,
      now,
    ),
  )

  // === Fill the rest of Indiranagar to reach 30 in the demo ward ===
  const indiranagarSoFar = issues.filter((i) => i.location.ward === DEMO_WARD).length
  const indiranagarCats = [
    IssueCategory.POTHOLE, IssueCategory.GARBAGE, IssueCategory.STREETLIGHT,
    IssueCategory.WATER_LEAK, IssueCategory.DRAINAGE, IssueCategory.FALLEN_TREE,
    IssueCategory.STRAY_ANIMAL, IssueCategory.EXPOSED_WIRING, IssueCategory.BROKEN_SIGNAL,
  ]
  const statusPool = [
    IssueStatus.RESOLVED, IssueStatus.RESOLVED, IssueStatus.RESOLVED,
    IssueStatus.IN_PROGRESS, IssueStatus.DISPATCHED, IssueStatus.ACKNOWLEDGED,
    IssueStatus.REPORTED,
  ]
  for (let i = indiranagarSoFar; i < 30; i++) {
    issues.push(
      makeIssue(
        {
          category: pick(indiranagarCats, rnd),
          ward: DEMO_WARD,
          status: pick(statusPool, rnd),
          daysAgo: randInt(2, 175, rnd),
          reportedBy: rnd() < 0.25 ? 'cit-0' : rnd() < 0.4 ? 'cit-2' : `cit-${randInt(3, 29, rnd)}`,
        },
        rnd,
        now,
      ),
    )
  }

  // === 50 issues across the other wards for citywide map density ===
  const otherWards = Object.keys(WARDS).filter((w) => w !== DEMO_WARD)
  const allCats = Object.values(IssueCategory)
  while (issues.length < 80) {
    issues.push(
      makeIssue(
        {
          category: pick(allCats, rnd),
          ward: pick(otherWards, rnd),
          status: pick(statusPool, rnd),
          daysAgo: randInt(2, 180, rnd),
        },
        rnd,
        now,
      ),
    )
  }

  return { issues, nextSeq: SEQ }
}
