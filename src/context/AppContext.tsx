import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useCallback,
  type ReactNode,
} from 'react'
import {
  type AppState,
  type Issue,
  type Authority,
  type Citizen,
  type DetectedIssue,
  type GeoLocation,
  type RootCauseCluster,
  type ImpactNarrative,
  type EscalationEntry,
  type Verification,
  IssueStatus,
  IssueCategory,
  Language,
} from '../types'
import { reducer, type Action } from './reducer'
import { loadOrSeed, saveState } from '../services/storageService'
import { seedInitialState } from '../data/seedState'
import { setForceCache } from '../services/geminiService'
import {
  predictWorsening,
  analyzeRootCause,
  generateImpactNarrative,
  generateEscalationScript,
  draftComplaintLetter,
} from '../services/geminiService'
import { findAuthority } from '../services/routingService'
import {
  detectClusters,
  buildClusterRecord,
  genericAnalysis,
} from '../services/clusterService'
import { CACHED_ROOT_CAUSE } from '../data/mockData/cachedResponses'
import { computeWardStats } from '../services/impactCalculator'
import { wardContextString } from '../data/mockData/ward'
import { renderShareCard } from '../utils/shareCard'
import { categoryLabel } from '../utils/labels'
import { DAY_MS, daysSince, monthName } from '../utils/format'

function refNo(seq: number): string {
  return `CS-2026-${String(seq).padStart(5, '0')}`
}
function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  authorityById: (id: string) => Authority | undefined
  citizenById: (id: string) => Citizen | undefined
  setView: (v: 'CITIZEN' | 'AUTHORITY') => void
  setDemoMode: (v: boolean) => void
  setHighContrast: (v: boolean) => void
  setLanguage: (l: Language) => void
  setActiveAuthority: (id: string) => void
  // EC2 — worsening prediction for a draft detected issue
  predictForDetected: (d: DetectedIssue, location: GeoLocation) => Promise<DetectedIssue>
  // FN1 — file + auto-dispatch detected issues
  fileDetectedIssues: (
    detected: DetectedIssue[],
    photoDataUrl: string,
    location: GeoLocation,
  ) => Promise<Issue[]>
  changeStatus: (
    issueId: string,
    toStatus: IssueStatus,
    changedBy: 'CITIZEN' | 'AUTHORITY' | 'SYSTEM',
    note?: string,
  ) => void
  reassign: (issueId: string, authorityId: string) => void
  verifyIssue: (issueId: string, confirms: boolean, note?: string) => void
  regenerateLetter: (issueId: string, language: Language) => Promise<void>
  // FN3 — cluster check
  runClusterCheck: () => Promise<RootCauseCluster | null>
  setClusterStatus: (clusterId: string, status: RootCauseCluster['status']) => void
  // FN2 — escalation
  getEscalatableIssues: () => Issue[]
  runEscalation: (
    issueId: string,
  ) => Promise<{ transcript: string; officerName: string; officerTitle: string; authorityName: string; issue: Issue }>
  // FN4 — impact report
  generateWardImpact: (ward: string) => Promise<ImpactNarrative>
  recordVoiceLanguage: (l: Language) => void
  markNotificationsRead: () => void
  resetAll: () => void
}

const Ctx = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadOrSeed)

  // keep a ref to the latest state for async helpers (avoids stale closures)
  const stateRef = useRef(state)
  stateRef.current = state

  // persist
  useEffect(() => {
    saveState(state)
  }, [state])

  // Demo Mode forces cached AI responses (fast + reliable) and toggles a class.
  useEffect(() => {
    setForceCache(state.demoMode)
  }, [state.demoMode])

  useEffect(() => {
    document.documentElement.classList.toggle('cs-high-contrast', state.highContrast)
  }, [state.highContrast])

  const authorityById = useCallback(
    (id: string) => stateRef.current.authorities.find((a) => a.id === id),
    [],
  )
  const citizenById = useCallback(
    (id: string) => stateRef.current.citizens.find((c) => c.id === id),
    [],
  )

  const setView = useCallback((v: 'CITIZEN' | 'AUTHORITY') => dispatch({ type: 'SET_VIEW', view: v }), [])
  const setDemoMode = useCallback((v: boolean) => dispatch({ type: 'SET_DEMO_MODE', value: v }), [])
  const setHighContrast = useCallback((v: boolean) => dispatch({ type: 'SET_HIGH_CONTRAST', value: v }), [])
  const setLanguage = useCallback((l: Language) => dispatch({ type: 'SET_LANGUAGE', language: l }), [])
  const setActiveAuthority = useCallback((id: string) => dispatch({ type: 'SET_ACTIVE_AUTHORITY', authorityId: id }), [])

  const agentLog = useCallback(
    (fn: import('../types').AgentLogEntry['fn'], message: string, relatedIssueId?: string) => {
      dispatch({
        type: 'ADD_AGENT_LOG',
        entry: { id: uid('agent'), fn, message, at: Date.now(), relatedIssueId },
      })
    },
    [],
  )

  // ---- EC2: worsening prediction --------------------------------------------
  const predictForDetected = useCallback(
    async (d: DetectedIssue, location: GeoLocation): Promise<DetectedIssue> => {
      const similar = stateRef.current.issues.filter(
        (i) => i.category === d.category && i.location.ward === location.ward,
      )
      const worsening = await predictWorsening(
        {
          category: d.category,
          severity: d.severity,
          description: d.description,
          ward: location.ward,
          city: location.city,
          reportedAt: Date.now(),
        },
        similar,
      )
      return { ...d, worsening }
    },
    [],
  )

  // ---- FN1: dispatchToAuthority ---------------------------------------------
  const fileDetectedIssues = useCallback(
    async (
      detected: DetectedIssue[],
      photoDataUrl: string,
      location: GeoLocation,
    ): Promise<Issue[]> => {
      const s = stateRef.current
      const batchId = uid('batch')
      const now = Date.now()
      let seq = s.referenceSeq
      const built: Issue[] = detected.map((d) => {
        const authority = findAuthority(d.category, location.ward, s.authorities)
        const reference = refNo(seq++)
        const worsening = d.worsening ?? {
          likelihood: 0.5,
          timeframeDays: 21,
          reasoning: d.severityReasoning,
        }
        const issue: Issue = {
          id: uid('iss'),
          category: d.category,
          severity: d.severity,
          status: IssueStatus.DISPATCHED, // FN1 auto-dispatch
          title: d.title,
          description: d.description,
          severityReasoning: d.severityReasoning,
          photoDataUrl,
          boundingBox: d.boundingBox,
          location,
          reportedBy: s.activeCitizen.id,
          reportedAt: now,
          assignedAuthorityId: authority.id,
          verifications: [],
          statusHistory: [
            {
              fromStatus: IssueStatus.REPORTED,
              toStatus: IssueStatus.DISPATCHED,
              changedAt: now,
              changedBy: 'SYSTEM',
              note: `Auto-dispatched by AI to ${authority.shortName}.`,
            },
          ],
          worseningPrediction: worsening,
          complaintLetter: {
            language: s.activeCitizen.preferredLanguage,
            subject: `Complaint: ${d.title} — ${reference}`,
            body: `Dear ${authority.officer.name},\n\nI wish to report the following civic issue at ${location.address}, ${location.ward}.\n\n${d.description}\n\nReference: ${reference}. Kindly inspect and resolve within 7 working days. Should there be no action within 30 days, I reserve the right to file an RTI application under the Right to Information Act, 2005.\n\nYours sincerely,\n${s.activeCitizen.name}`,
            referenceNumber: reference,
          },
          escalationLog: [],
          detectedFromBatch: batchId,
          slaHours: 7 * 24,
        }
        return issue
      })

      dispatch({ type: 'ADD_ISSUES', issues: built, byActiveCitizen: true })

      // FN1 surfaced to the user — one agent-log line per dispatch.
      for (const issue of built) {
        const a = s.authorities.find((x) => x.id === issue.assignedAuthorityId)
        agentLog(
          'dispatchToAuthority',
          `AI dispatched "${issue.title}" to ${a?.shortName ?? 'authority'}. Reference ${issue.complaintLetter.referenceNumber}.`,
          issue.id,
        )
      }

      // FN3 — new issues may complete a pattern.
      setTimeout(() => void runClusterCheck(), 400)

      return built
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agentLog],
  )

  const changeStatus = useCallback(
    (issueId: string, toStatus: IssueStatus, changedBy: 'CITIZEN' | 'AUTHORITY' | 'SYSTEM', note?: string) => {
      dispatch({ type: 'CHANGE_STATUS', issueId, toStatus, changedBy, note })
    },
    [],
  )

  const reassign = useCallback((issueId: string, authorityId: string) => {
    dispatch({ type: 'REASSIGN', issueId, authorityId })
  }, [])

  const verifyIssue = useCallback((issueId: string, confirms: boolean, note?: string) => {
    const v: Verification = {
      citizenId: stateRef.current.activeCitizen.id,
      verifiedAt: Date.now(),
      confirmsExists: confirms,
      note,
    }
    dispatch({ type: 'ADD_VERIFICATION', issueId, verification: v })
    if (confirms) dispatch({ type: 'INC_VERIFICATION_STAT' })
  }, [])

  const regenerateLetter = useCallback(async (issueId: string, language: Language) => {
    const s = stateRef.current
    const issue = s.issues.find((i) => i.id === issueId)
    if (!issue) return
    const authority = s.authorities.find((a) => a.id === issue.assignedAuthorityId)
    const citizen = s.citizens.find((c) => c.id === issue.reportedBy) ?? s.activeCitizen
    const letter = await draftComplaintLetter(
      issue,
      language,
      authority?.name ?? 'Municipal Authority',
      authority?.officer.name ?? 'The Officer',
      authority?.officer.title ?? 'Officer in charge',
      citizen.name,
    )
    dispatch({ type: 'UPDATE_ISSUE', issueId, patch: { complaintLetter: letter } })
  }, [])

  // ---- FN3: verifyClusterPattern --------------------------------------------
  const runClusterCheck = useCallback(async (): Promise<RootCauseCluster | null> => {
    const s = stateRef.current
    const candidates = detectClusters(s.issues, Date.now())
    for (const c of candidates) {
      const exists = s.rootCauseClusters.some(
        (cl) => cl.ward === c.ward && cl.category === c.category && cl.status !== 'DISMISSED',
      )
      if (exists) continue
      const isAnchor = c.category === IssueCategory.POTHOLE && c.ward.startsWith('Indiranagar')
      const analysis = isAnchor
        ? CACHED_ROOT_CAUSE
        : await analyzeRootCause(c.issues, wardContextString(c.ward)).catch(() => genericAnalysis(c))
      if (analysis.confidence < 0.6) continue
      const cluster = buildClusterRecord(c, analysis, Date.now())
      dispatch({ type: 'ADD_CLUSTER', cluster })
      agentLog(
        'verifyClusterPattern',
        `AI detected a recurring pattern: ${analysis.pattern}. Surfaced to authority.`,
      )
      return cluster
    }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentLog])

  const setClusterStatus = useCallback(
    (clusterId: string, status: RootCauseCluster['status']) =>
      dispatch({ type: 'SET_CLUSTER_STATUS', clusterId, status }),
    [],
  )

  // ---- FN2: escalateAfterDays -----------------------------------------------
  const getEscalatableIssues = useCallback((): Issue[] => {
    const now = Date.now()
    return stateRef.current.issues.filter((i) => {
      if (i.status === IssueStatus.RESOLVED || i.status === IssueStatus.ESCALATED) return false
      const slaDays = (i.slaHours ?? 168) / 24
      return daysSince(i.reportedAt, now) >= slaDays
    })
  }, [])

  const runEscalation = useCallback(
    async (issueId: string) => {
      const s = stateRef.current
      const issue = s.issues.find((i) => i.id === issueId)!
      const authority = s.authorities.find((a) => a.id === issue.assignedAuthorityId)
      const citizen = s.citizens.find((c) => c.id === issue.reportedBy) ?? s.activeCitizen
      const days = Math.max(7, daysSince(issue.reportedAt))
      const transcript = await generateEscalationScript(
        issue,
        days,
        authority?.officer.name ?? 'Officer',
        authority?.officer.title ?? 'Officer in charge',
        authority?.name ?? 'the department',
        citizen.name,
      )
      const entry: EscalationEntry = {
        type: 'VOICEMAIL',
        triggeredAt: Date.now(),
        daysUnresolved: days,
        transcript,
        delivered: true,
      }
      dispatch({ type: 'ADD_ESCALATION', issueId, entry })
      // Also file an RTI escalation entry (the AI advocate's next step).
      const rtiEntry: EscalationEntry = {
        type: 'RTI',
        triggeredAt: Date.now() + 1,
        daysUnresolved: days,
        transcript: `RTI application drafted under the Right to Information Act, 2005 for reference ${issue.complaintLetter.referenceNumber}, seeking the action-taken report and the responsible officer's accountability for the unresolved ${categoryLabel(issue.category).toLowerCase()} at ${issue.location.address}.`,
        delivered: true,
      }
      dispatch({ type: 'ADD_ESCALATION', issueId, entry: rtiEntry })
      agentLog(
        'escalateAfterDays',
        `AI escalation triggered for ${issue.complaintLetter.referenceNumber}. Voicemail to ${authority?.officer.name ?? 'officer'} queued + RTI drafted.`,
        issue.id,
      )
      return {
        transcript,
        officerName: authority?.officer.name ?? 'Officer',
        officerTitle: authority?.officer.title ?? 'Officer in charge',
        authorityName: authority?.shortName ?? 'Department',
        issue,
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agentLog],
  )

  // ---- FN4: generateImpactReport --------------------------------------------
  const generateWardImpact = useCallback(
    async (ward: string): Promise<ImpactNarrative> => {
      const s = stateRef.current
      const now = Date.now()
      const period = { start: now - 30 * DAY_MS, end: now }
      const stats = computeWardStats(ward, s.issues, s.citizens, period)
      const narrativeText = await generateImpactNarrative(stats, period)
      let shareableImageUrl: string | undefined
      try {
        shareableImageUrl = renderShareCard(stats, monthName(now))
      } catch {
        shareableImageUrl = undefined
      }
      const narrative: ImpactNarrative = {
        id: uid('narr'),
        generatedAt: now,
        ward,
        periodStart: period.start,
        periodEnd: period.end,
        reportsCount: stats.reportsCount,
        resolvedCount: stats.resolvedCount,
        estimatedCostSavedINR: stats.estimatedCostSavedINR,
        estimatedAccidentsPrevented: stats.estimatedAccidentsPrevented,
        narrativeText,
        shareableImageUrl,
      }
      dispatch({ type: 'ADD_NARRATIVE', narrative })
      agentLog('generateImpactReport', `AI generated the ${monthName(now)} impact report for ${ward}.`)
      return narrative
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agentLog],
  )

  const recordVoiceLanguage = useCallback(
    (l: Language) => dispatch({ type: 'RECORD_VOICE_LANG', language: l }),
    [],
  )
  const markNotificationsRead = useCallback(() => dispatch({ type: 'MARK_NOTIFS_READ' }), [])
  const resetAll = useCallback(() => {
    const fresh = seedInitialState()
    dispatch({ type: 'RESET', state: fresh })
  }, [])

  const value: AppContextValue = {
    state,
    dispatch,
    authorityById,
    citizenById,
    setView,
    setDemoMode,
    setHighContrast,
    setLanguage,
    setActiveAuthority,
    predictForDetected,
    fileDetectedIssues,
    changeStatus,
    reassign,
    verifyIssue,
    regenerateLetter,
    runClusterCheck,
    setClusterStatus,
    getEscalatableIssues,
    runEscalation,
    generateWardImpact,
    recordVoiceLanguage,
    markNotificationsRead,
    resetAll,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used within AppProvider')
  return v
}
