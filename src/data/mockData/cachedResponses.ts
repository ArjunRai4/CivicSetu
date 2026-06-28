// Curated cached Gemini responses (spec §Fail-safe patterns). Used when no API
// key is configured OR in Demo Mode, so the live demo never depends on network.
import {
  IssueCategory,
  Severity,
  type DetectedIssue,
  type WorseningPrediction,
  type RootCauseAnalysis,
  type VoiceExtraction,
} from '../../types'

// --- AP1: multi-issue detection for the curated DEMO photo --------------------
// Bounding boxes line up exactly with the drawn elements in DEMO_STREET_PHOTO.
export const DEMO_DETECTION: DetectedIssue[] = [
  {
    category: IssueCategory.POTHOLE,
    title: 'Large pothole on carriageway',
    description:
      'Approximately 45cm-wide pothole in the centre of the active traffic lane on 100 Feet Road, with exposed aggregate and visible water pooling at the base.',
    severity: Severity.HIGH,
    severityReasoning:
      'Diameter exceeds 40cm, sits squarely in the two-wheeler path, and edges show fresh spalling indicating active degradation.',
    boundingBox: { x: 0.36, y: 0.62, width: 0.28, height: 0.2 },
    estimatedDepartment: 'PWD',
    selected: true,
  },
  {
    category: IssueCategory.GARBAGE,
    title: 'Uncollected garbage black-spot',
    description:
      'Mixed solid waste roughly 1.5m across accumulated on the pavement beside the carriageway, partially spilling toward the drain mouth.',
    severity: Severity.MEDIUM,
    severityReasoning:
      'Moderate volume with no roadway overflow yet, but proximity to the storm drain risks blockage during rain.',
    boundingBox: { x: 0.72, y: 0.5, width: 0.26, height: 0.32 },
    estimatedDepartment: 'BBMP_SANITATION',
    selected: true,
  },
  {
    category: IssueCategory.STREETLIGHT,
    title: 'Non-functional / leaning streetlight',
    description:
      'Street light pole leaning ~8° from vertical with an unlit, damaged luminaire — likely a dead lamp or supply fault on this stretch.',
    severity: Severity.HIGH,
    severityReasoning:
      'A dark pole on an arterial road with heavy night two-wheeler traffic is a direct accident and safety risk; structural lean adds a fall hazard.',
    boundingBox: { x: 0.05, y: 0.12, width: 0.2, height: 0.52 },
    estimatedDepartment: 'BESCOM',
    selected: true,
  },
]

// --- AP2: worsening predictions, cached per category --------------------------
export const CACHED_WORSENING: Partial<Record<IssueCategory, WorseningPrediction>> = {
  [IssueCategory.POTHOLE]: {
    likelihood: 0.87,
    timeframeDays: 18,
    reasoning:
      'This ~45cm pothole sits in an active two-wheeler lane on 100 Feet Road, a stretch that saw 4 similar potholes in the last 4 months — all expanded past 60cm within 3 weeks. With monsoon onset roughly 12 days away, water infiltration will accelerate edge erosion, and high two-wheeler impact loading compounds the damage.',
    milestones: [
      { day: 7, status: 'Edges begin spalling, diameter grows to ~55cm' },
      { day: 14, status: 'Monsoon water pooling; accident risk rises sharply' },
      { day: 21, status: 'Critical: deep enough to throw two-wheeler riders' },
    ],
  },
  [IssueCategory.GARBAGE]: {
    likelihood: 0.7,
    timeframeDays: 10,
    reasoning:
      'Open garbage black-spots in Indiranagar attract additional dumping within days once established. Sitting beside a storm-drain mouth, this pile risks washing into and blocking the drain at the first heavy shower — turning a sanitation issue into localised flooding.',
    milestones: [
      { day: 3, status: 'Pile doubles as neighbours add waste to the spot' },
      { day: 7, status: 'Leachate and odour; stray-animal scavenging begins' },
      { day: 10, status: 'First rain washes debris into the storm drain' },
    ],
  },
  [IssueCategory.STREETLIGHT]: {
    likelihood: 0.6,
    timeframeDays: 30,
    reasoning:
      'A leaning pole with a dead luminaire rarely self-corrects. On an arterial with heavy night traffic, the dark patch persists and the structural lean worsens with vibration and wind loading, raising the chance of a pole failure over the monsoon.',
    milestones: [
      { day: 10, status: 'Adjacent lamps may flicker if the fault is on the feeder' },
      { day: 20, status: 'Lean increases; base fixing loosens further' },
      { day: 30, status: 'Risk of pole collapse during high winds / rain' },
    ],
  },
  [IssueCategory.WATER_LEAK]: {
    likelihood: 0.75,
    timeframeDays: 14,
    reasoning:
      'Continuous water leakage erodes the road sub-base and wastes treated water. In a mixed-use stretch this typically progresses from surface seepage to a visible cavity within two weeks.',
    milestones: [
      { day: 5, status: 'Surface seepage widens, road softens' },
      { day: 14, status: 'Sub-base washout; cavity / sinkhole risk' },
    ],
  },
  [IssueCategory.DRAINAGE]: {
    likelihood: 0.82,
    timeframeDays: 12,
    reasoning:
      'A choked drain in Indiranagar reliably backs up during the first monsoon spell, flooding the carriageway and accelerating pothole formation on the adjacent road.',
    milestones: [
      { day: 6, status: 'Silt accumulation reduces flow capacity further' },
      { day: 12, status: 'Overflow floods the road during rain' },
    ],
  },
}

export const GENERIC_WORSENING: WorseningPrediction = {
  likelihood: 0.55,
  timeframeDays: 21,
  reasoning:
    'Based on similar cases in this ward and the approaching monsoon, this issue is likely to worsen gradually if left unaddressed, increasing inconvenience and repair cost over the coming weeks.',
  milestones: [
    { day: 7, status: 'Early deterioration begins' },
    { day: 21, status: 'Noticeable worsening; intervention recommended' },
  ],
}

// --- AP5: cached root-cause analysis for the seeded pothole cluster -----------
export const CACHED_ROOT_CAUSE: RootCauseAnalysis = {
  patternDetected: true,
  pattern: '5 potholes within 200m on 100 Feet Road over 28 days',
  rootCauseHypothesis:
    'All five potholes occurred on a 200m stretch of 100 Feet Road between the Indiranagar metro and the 12th Main intersection. This stretch was resurfaced in early 2024 but the underlying stormwater drainage was not upgraded. The pattern — recurring potholes after rain events — strongly suggests failing subsurface drainage undermining the road base from below rather than surface infiltration. Surface patching will not resolve it; subsurface inspection is required.',
  recommendedAction:
    'Engage the BWSSB / BBMP-SWD drainage team for a camera inspection of the underground stormwater line beneath this 200m stretch. Coordinate with PWD to schedule sub-grade rehabilitation if drainage failure is confirmed. Hold off on surface repairs until the subsurface cause is verified.',
  confidence: 0.78,
  priorityForAuthority: 'HIGH',
}

// --- AP6: cached voice extraction (Hindi pothole example) ---------------------
export const CACHED_VOICE_EXTRACTION: VoiceExtraction = {
  translation:
    'There is a big pothole near the metro station and it has been there for two weeks. Please send someone immediately.',
  extractedCategory: IssueCategory.POTHOLE,
  extractedLocation: 'near the metro station',
  extractedSeverity: Severity.HIGH,
  urgencyKeywords: ['immediately', 'two weeks'],
  confidence: 0.85,
}

// --- AP8: cached escalation voicemail script ---------------------------------
export function cachedEscalationScript(
  officerName: string,
  category: string,
  location: string,
  ref: string,
  days: number,
  citizen: string,
): string {
  return `Namaste ${officerName}. This is an automated escalation from CivicSetu on behalf of citizen ${citizen}. Reference number ${ref}, regarding a ${category.toLowerCase()} issue at ${location} — reported ${days} days ago and still unresolved. Per municipal SLA this requires attention within five working days. If no action is recorded within 48 hours, an RTI application will be filed under the Right to Information Act, 2005. Kindly review and respond. Thank you.`
}
