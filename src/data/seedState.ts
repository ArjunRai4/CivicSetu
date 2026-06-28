import {
  type AppState,
  type RootCauseCluster,
  IssueCategory,
} from '../types'
import { AUTHORITIES, DEMO_AUTHORITY_ID } from './mockData/authorities'
import { CITIZENS, DEMO_CITIZEN_ID } from './mockData/citizens'
import { buildHistoricalIssues } from './mockData/historicalIssues'
import { DEMO_WARD } from './mockData/ward'
import {
  detectClusters,
  buildClusterRecord,
  genericAnalysis,
} from '../services/clusterService'
import { CACHED_ROOT_CAUSE } from './mockData/cachedResponses'

export const STORAGE_KEY = 'civicsetu_state_v1'

// Constructs the full initial AppState from mock data (spec §seedState.ts).
export function seedInitialState(now: number = Date.now()): AppState {
  const { issues, nextSeq } = buildHistoricalIssues(now)

  // Detect clusters at load time so the Authority dashboard shows patterns
  // immediately (spec EC3 accept criteria: >=2 clusters at first load).
  const candidates = detectClusters(issues, now)
  const clusters: RootCauseCluster[] = candidates.map((c) => {
    // Use the curated cached analysis for the anchor pothole cluster.
    const isAnchor =
      c.ward === DEMO_WARD && c.category === IssueCategory.POTHOLE
    const analysis = isAnchor ? CACHED_ROOT_CAUSE : genericAnalysis(c)
    return buildClusterRecord(c, analysis, now)
  })

  // Link issues back to their cluster.
  for (const cluster of clusters) {
    for (const id of cluster.issueIds) {
      const iss = issues.find((i) => i.id === id)
      if (iss) iss.rootCauseClusterId = cluster.id
    }
  }

  const activeCitizen =
    CITIZENS.find((c) => c.id === DEMO_CITIZEN_ID) ?? CITIZENS[0]

  return {
    currentView: 'CITIZEN',
    activeCitizen,
    activeAuthorityId: DEMO_AUTHORITY_ID,
    issues,
    authorities: AUTHORITIES,
    citizens: CITIZENS,
    rootCauseClusters: clusters,
    impactNarratives: [],
    notifications: [
      {
        id: 'notif-seed-1',
        type: 'STATUS_UPDATE',
        message: 'Your streetlight report on CMH Road is now In progress.',
        createdAt: now - 5 * 60 * 60 * 1000,
        read: false,
      },
      {
        id: 'notif-seed-2',
        type: 'ESCALATION',
        message: 'A water-leak report on CMH Road is approaching its SLA deadline.',
        createdAt: now - 2 * 60 * 60 * 1000,
        read: false,
      },
    ],
    agentLog: [
      {
        id: 'agent-seed-1',
        fn: 'verifyClusterPattern',
        message: `AI detected a recurring pattern: 5 potholes on 100 Feet Road. Surfaced to PWD.`,
        at: now - 3 * 60 * 60 * 1000,
      },
    ],
    demoMode: false,
    highContrast: false,
    referenceSeq: nextSeq,
  }
}
