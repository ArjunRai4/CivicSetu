// ============================================================
// CivicSetu — domain types (spec §Data Models)
// ============================================================

// === Enums ===

export enum IssueCategory {
  POTHOLE = 'POTHOLE',
  STREETLIGHT = 'STREETLIGHT',
  WATER_LEAK = 'WATER_LEAK',
  GARBAGE = 'GARBAGE',
  FALLEN_TREE = 'FALLEN_TREE',
  BROKEN_SIGNAL = 'BROKEN_SIGNAL',
  EXPOSED_WIRING = 'EXPOSED_WIRING',
  STRAY_ANIMAL = 'STRAY_ANIMAL',
  DRAINAGE = 'DRAINAGE',
  OTHER = 'OTHER',
}

export enum IssueStatus {
  REPORTED = 'REPORTED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  DISPATCHED = 'DISPATCHED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
}

export enum Severity {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
}

export enum Language {
  ENGLISH = 'en',
  HINDI = 'hi',
  TAMIL = 'ta',
  BENGALI = 'bn',
  TELUGU = 'te',
  MARATHI = 'mr',
  KANNADA = 'kn',
}

// Departments returned by Gemini vision (AP1) — mapped to Authority ids.
export type Department =
  | 'PWD'
  | 'BBMP_SANITATION'
  | 'BESCOM'
  | 'BWSSB'
  | 'TRAFFIC_POLICE'
  | 'BBMP_PARKS'
  | 'BBMP_ANIMAL'
  | 'OTHER'

// === Core entities ===

export interface GeoLocation {
  lat: number
  lng: number
  address: string
  ward: string
  city: string
}

export interface BoundingBox {
  x: number // normalized 0-1, top-left origin
  y: number
  width: number
  height: number
}

export interface WorseningMilestone {
  day: number
  status: string
}

export interface WorseningPrediction {
  likelihood: number // 0-1
  timeframeDays: number
  reasoning: string
  milestones?: WorseningMilestone[]
}

export interface ComplaintLetter {
  language: Language
  subject: string
  body: string
  referenceNumber: string // "CS-2026-00123"
}

export interface Verification {
  citizenId: string
  verifiedAt: number
  confirmsExists: boolean
  note?: string
}

export interface StatusChange {
  fromStatus: IssueStatus
  toStatus: IssueStatus
  changedAt: number
  changedBy: 'CITIZEN' | 'AUTHORITY' | 'SYSTEM'
  note?: string
}

export interface EscalationEntry {
  type: 'VOICEMAIL' | 'RTI' | 'PUBLIC_POST'
  triggeredAt: number
  daysUnresolved: number
  audioUrl?: string
  transcript: string
  delivered: boolean
}

export interface Issue {
  id: string
  category: IssueCategory
  severity: Severity
  status: IssueStatus
  title: string
  description: string
  severityReasoning?: string
  photoDataUrl: string
  boundingBox?: BoundingBox
  location: GeoLocation
  reportedBy: string
  reportedAt: number
  assignedAuthorityId: string
  verifications: Verification[]
  statusHistory: StatusChange[]
  worseningPrediction: WorseningPrediction
  rootCauseClusterId?: string
  complaintLetter: ComplaintLetter
  escalationLog: EscalationEntry[]
  detectedFromBatch?: string
  slaHours?: number
}

export interface Authority {
  id: string
  name: string
  shortName: string
  department: string
  handlesCategories: IssueCategory[]
  contactEmail: string
  contactPhone: string
  officer: {
    name: string
    title: string
  }
  jurisdiction: string
  avgResponseTimeHours: number
  resolutionRatePct: number
}

export interface Badge {
  id: string
  name: string
  description: string
  earnedAt: number
  icon: string // lucide icon name
}

export interface Citizen {
  id: string
  name: string
  preferredLanguage: Language
  ward: string
  totalReports: number
  totalResolved: number
  totalVerifications: number
  reputationScore: number // 0-100
  badges: Badge[]
  voiceLanguagesUsed?: Language[]
}

export interface RootCauseCluster {
  id: string
  detectedAt: number
  ward: string
  issueIds: string[]
  pattern: string
  rootCauseHypothesis: string
  recommendedAction: string
  confidence: number // 0-1
  category: IssueCategory
  status: 'DETECTED' | 'INSPECTING' | 'RESOLVED' | 'DISMISSED'
  priorityForAuthority?: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface ImpactNarrative {
  id: string
  generatedAt: number
  ward: string
  periodStart: number
  periodEnd: number
  reportsCount: number
  resolvedCount: number
  estimatedCostSavedINR: number
  estimatedAccidentsPrevented: number
  narrativeText: string
  shareableImageUrl?: string
}

export interface Notification {
  id: string
  type: 'STATUS_UPDATE' | 'ESCALATION' | 'VERIFICATION' | 'ACHIEVEMENT'
  message: string
  relatedIssueId?: string
  createdAt: number
  read: boolean
}

// An entry in the visible "AI activity log" (spec §Function Calling).
export interface AgentLogEntry {
  id: string
  fn: 'dispatchToAuthority' | 'escalateAfterDays' | 'verifyClusterPattern' | 'generateImpactReport' | 'detectIssues' | 'predictWorsening'
  message: string
  at: number
  relatedIssueId?: string
}

// === App state ===

export interface AppState {
  currentView: 'CITIZEN' | 'AUTHORITY'
  activeCitizen: Citizen
  activeAuthorityId: string // which authority the authority-view is logged in as
  issues: Issue[]
  authorities: Authority[]
  citizens: Citizen[]
  rootCauseClusters: RootCauseCluster[]
  impactNarratives: ImpactNarrative[]
  notifications: Notification[]
  agentLog: AgentLogEntry[]
  demoMode: boolean
  highContrast: boolean
  referenceSeq: number // for CS-2026-NNNNN generation
}

// ============================================================
// Service-level helper types (Gemini / AI return shapes)
// ============================================================

export interface DetectedIssue {
  category: IssueCategory
  title: string
  description: string
  severity: Severity
  severityReasoning: string
  boundingBox: BoundingBox
  estimatedDepartment: Department
  // attached client-side after detection:
  selected?: boolean
  worsening?: WorseningPrediction
}

export interface RootCauseAnalysis {
  patternDetected: boolean
  pattern: string
  rootCauseHypothesis: string
  recommendedAction: string
  confidence: number
  priorityForAuthority: 'LOW' | 'MEDIUM' | 'HIGH'
}

export interface VoiceExtraction {
  translation: string
  extractedCategory: IssueCategory | null
  extractedLocation: string | null
  extractedSeverity: Severity | null
  urgencyKeywords: string[]
  confidence: number
}

export interface WardStats {
  ward: string
  reportsCount: number
  resolvedCount: number
  resolutionPct: number
  topCategories: { category: IssueCategory; count: number }[]
  topContributor: string
  topContributorReports: number
  avgResponseHours: number
  estimatedCostSavedINR: number
  estimatedAccidentsPrevented: number
}

export interface DateRange {
  start: number
  end: number
}
