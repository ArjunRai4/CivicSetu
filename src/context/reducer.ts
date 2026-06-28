import {
  type AppState,
  type Issue,
  type Citizen,
  type Notification,
  type AgentLogEntry,
  type RootCauseCluster,
  type ImpactNarrative,
  type Verification,
  type EscalationEntry,
  type StatusChange,
  IssueStatus,
  Language,
} from '../types'
import { computeBadges, POINTS } from '../services/gamificationRules'

export type Action =
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'SET_VIEW'; view: 'CITIZEN' | 'AUTHORITY' }
  | { type: 'SET_DEMO_MODE'; value: boolean }
  | { type: 'SET_HIGH_CONTRAST'; value: boolean }
  | { type: 'SET_ACTIVE_AUTHORITY'; authorityId: string }
  | { type: 'SET_LANGUAGE'; language: Language }
  | { type: 'ADD_ISSUES'; issues: Issue[]; byActiveCitizen: boolean }
  | { type: 'CHANGE_STATUS'; issueId: string; toStatus: IssueStatus; changedBy: StatusChange['changedBy']; note?: string }
  | { type: 'REASSIGN'; issueId: string; authorityId: string }
  | { type: 'UPDATE_ISSUE'; issueId: string; patch: Partial<Issue> }
  | { type: 'ADD_VERIFICATION'; issueId: string; verification: Verification }
  | { type: 'ADD_ESCALATION'; issueId: string; entry: EscalationEntry }
  | { type: 'ADD_CLUSTER'; cluster: RootCauseCluster }
  | { type: 'SET_CLUSTER_STATUS'; clusterId: string; status: RootCauseCluster['status'] }
  | { type: 'ADD_NARRATIVE'; narrative: ImpactNarrative }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'MARK_NOTIFS_READ' }
  | { type: 'ADD_AGENT_LOG'; entry: AgentLogEntry }
  | { type: 'RECORD_VOICE_LANG'; language: Language }
  | { type: 'INC_VERIFICATION_STAT' }
  | { type: 'RESET'; state: AppState }

function notif(
  type: Notification['type'],
  message: string,
  relatedIssueId?: string,
): Notification {
  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    message,
    relatedIssueId,
    createdAt: Date.now(),
    read: false,
  }
}

// Sync the activeCitizen object into the citizens[] array (keeps both in sync).
function syncCitizen(state: AppState, citizen: Citizen): Partial<AppState> {
  return {
    activeCitizen: citizen,
    citizens: state.citizens.map((c) => (c.id === citizen.id ? citizen : c)),
  }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
    case 'RESET':
      return action.state

    case 'SET_VIEW':
      return { ...state, currentView: action.view }

    case 'SET_DEMO_MODE':
      return { ...state, demoMode: action.value }

    case 'SET_HIGH_CONTRAST':
      return { ...state, highContrast: action.value }

    case 'SET_ACTIVE_AUTHORITY':
      return { ...state, activeAuthorityId: action.authorityId }

    case 'SET_LANGUAGE': {
      const citizen = { ...state.activeCitizen, preferredLanguage: action.language }
      return { ...state, ...syncCitizen(state, citizen) }
    }

    case 'ADD_ISSUES': {
      const issues = [...action.issues, ...state.issues]
      let extra: Partial<AppState> = {}
      if (action.byActiveCitizen) {
        const c = { ...state.activeCitizen }
        c.totalReports += action.issues.length
        c.reputationScore = Math.min(
          100,
          c.reputationScore + action.issues.length * POINTS.REPORT,
        )
        c.badges = computeBadges(c)
        extra = syncCitizen(state, c)
      }
      return {
        ...state,
        issues,
        ...extra,
        referenceSeq: state.referenceSeq + action.issues.length,
        notifications: [
          notif(
            'STATUS_UPDATE',
            `${action.issues.length} report${action.issues.length > 1 ? 's' : ''} filed and auto-dispatched.`,
            action.issues[0]?.id,
          ),
          ...state.notifications,
        ],
      }
    }

    case 'CHANGE_STATUS': {
      let changed: Issue | undefined
      const issues = state.issues.map((iss) => {
        if (iss.id !== action.issueId) return iss
        const sc: StatusChange = {
          fromStatus: iss.status,
          toStatus: action.toStatus,
          changedAt: Date.now(),
          changedBy: action.changedBy,
          note: action.note,
        }
        changed = {
          ...iss,
          status: action.toStatus,
          statusHistory: [...iss.statusHistory, sc],
        }
        return changed
      })
      // Reward the reporter when their issue is resolved.
      let extra: Partial<AppState> = {}
      if (
        changed &&
        action.toStatus === IssueStatus.RESOLVED &&
        changed.reportedBy === state.activeCitizen.id
      ) {
        const c = { ...state.activeCitizen }
        c.totalResolved += 1
        c.reputationScore = Math.min(100, c.reputationScore + POINTS.HELP_RESOLVE)
        c.badges = computeBadges(c)
        extra = syncCitizen(state, c)
      }
      return {
        ...state,
        issues,
        ...extra,
        notifications: changed
          ? [
              notif(
                'STATUS_UPDATE',
                `${changed.title} → ${action.toStatus.replace('_', ' ').toLowerCase()}.`,
                changed.id,
              ),
              ...state.notifications,
            ]
          : state.notifications,
      }
    }

    case 'REASSIGN':
      return {
        ...state,
        issues: state.issues.map((iss) =>
          iss.id === action.issueId
            ? { ...iss, assignedAuthorityId: action.authorityId }
            : iss,
        ),
      }

    case 'UPDATE_ISSUE':
      return {
        ...state,
        issues: state.issues.map((iss) =>
          iss.id === action.issueId ? { ...iss, ...action.patch } : iss,
        ),
      }

    case 'ADD_VERIFICATION': {
      const issues = state.issues.map((iss) =>
        iss.id === action.issueId
          ? { ...iss, verifications: [...iss.verifications, action.verification] }
          : iss,
      )
      return { ...state, issues }
    }

    case 'INC_VERIFICATION_STAT': {
      const c = { ...state.activeCitizen }
      c.totalVerifications += 1
      c.reputationScore = Math.min(100, c.reputationScore + POINTS.VERIFY_OTHER)
      c.badges = computeBadges(c)
      return { ...state, ...syncCitizen(state, c) }
    }

    case 'ADD_ESCALATION': {
      let escalated: Issue | undefined
      const issues = state.issues.map((iss) => {
        if (iss.id !== action.issueId) return iss
        const sc: StatusChange = {
          fromStatus: iss.status,
          toStatus: IssueStatus.ESCALATED,
          changedAt: Date.now(),
          changedBy: 'SYSTEM',
          note: 'AI advocate escalation triggered.',
        }
        escalated = {
          ...iss,
          status: IssueStatus.ESCALATED,
          escalationLog: [...iss.escalationLog, action.entry],
          statusHistory: [...iss.statusHistory, sc],
        }
        return escalated
      })
      return {
        ...state,
        issues,
        notifications: escalated
          ? [
              notif(
                'ESCALATION',
                `AI escalated ${escalated.complaintLetter.referenceNumber} to the officer.`,
                escalated.id,
              ),
              ...state.notifications,
            ]
          : state.notifications,
      }
    }

    case 'ADD_CLUSTER': {
      const issues = state.issues.map((iss) =>
        action.cluster.issueIds.includes(iss.id)
          ? { ...iss, rootCauseClusterId: action.cluster.id }
          : iss,
      )
      return {
        ...state,
        issues,
        rootCauseClusters: [action.cluster, ...state.rootCauseClusters],
      }
    }

    case 'SET_CLUSTER_STATUS':
      return {
        ...state,
        rootCauseClusters: state.rootCauseClusters.map((cl) =>
          cl.id === action.clusterId ? { ...cl, status: action.status } : cl,
        ),
      }

    case 'ADD_NARRATIVE':
      return {
        ...state,
        impactNarratives: [
          action.narrative,
          ...state.impactNarratives.filter(
            (n) => n.ward !== action.narrative.ward,
          ),
        ],
      }

    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.notification, ...state.notifications] }

    case 'MARK_NOTIFS_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      }

    case 'ADD_AGENT_LOG':
      return { ...state, agentLog: [action.entry, ...state.agentLog].slice(0, 50) }

    case 'RECORD_VOICE_LANG': {
      const used = new Set(state.activeCitizen.voiceLanguagesUsed ?? [])
      used.add(action.language)
      const c = {
        ...state.activeCitizen,
        voiceLanguagesUsed: [...used],
      }
      c.badges = computeBadges(c)
      return { ...state, ...syncCitizen(state, c) }
    }

    default:
      return state
  }
}
