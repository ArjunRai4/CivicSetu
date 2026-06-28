// ============================================================
// geminiService — all AI prompt functions (spec AP1–AP8).
//
// Every function:
//   • uses the live Gemini API when VITE_GEMINI_API_KEY is set AND cache is
//     not forced (Demo Mode forces cache for speed + reliability),
//   • ALWAYS wraps the call in try/catch and falls back to curated cached
//     responses (spec §Fail-safe patterns) so the demo never breaks.
// ============================================================
import { GoogleGenAI } from '@google/genai'
import {
  type Issue,
  type DetectedIssue,
  type WorseningPrediction,
  type ComplaintLetter,
  type RootCauseAnalysis,
  type VoiceExtraction,
  type WardStats,
  type DateRange,
  type Department,
  IssueCategory,
  Severity,
  Language,
} from '../types'
import {
  DEMO_DETECTION,
  CACHED_WORSENING,
  GENERIC_WORSENING,
  CACHED_ROOT_CAUSE,
  CACHED_VOICE_EXTRACTION,
  cachedEscalationScript,
} from '../data/mockData/cachedResponses'
import { categoryLabel, severityLabel, LANGUAGE_META } from '../utils/labels'
import { formatDate, formatINR } from '../utils/format'

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim()
const TEXT_MODEL =
  (import.meta.env.VITE_GEMINI_TEXT_MODEL as string) || 'gemini-2.0-flash'
const VISION_MODEL =
  (import.meta.env.VITE_GEMINI_VISION_MODEL as string) || 'gemini-2.0-flash'

let forceCache = false
export function setForceCache(v: boolean) {
  forceCache = v
}
export function hasLiveAI(): boolean {
  return !!API_KEY && !forceCache
}
export function aiStatus(): 'live' | 'cached' {
  return hasLiveAI() ? 'live' : 'cached'
}

let _client: GoogleGenAI | null = null
function client(): GoogleGenAI {
  if (!_client) _client = new GoogleGenAI({ apiKey: API_KEY! })
  return _client
}

// --- helpers ----------------------------------------------------------------
function stripFences(text: string): string {
  let t = text.trim()
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  }
  return t.trim()
}
function parseJson<T>(text: string): T {
  return JSON.parse(stripFences(text)) as T
}
function toCategory(v: unknown): IssueCategory {
  const s = String(v).toUpperCase()
  return (Object.values(IssueCategory) as string[]).includes(s)
    ? (s as IssueCategory)
    : IssueCategory.OTHER
}
function toSeverity(v: unknown): Severity {
  const n = Math.round(Number(v))
  return (n >= 1 && n <= 4 ? n : 2) as Severity
}
function toDepartment(v: unknown): Department {
  const valid: Department[] = [
    'PWD', 'BBMP_SANITATION', 'BESCOM', 'BWSSB', 'TRAFFIC_POLICE',
    'BBMP_PARKS', 'BBMP_ANIMAL', 'OTHER',
  ]
  const s = String(v).toUpperCase() as Department
  return valid.includes(s) ? s : 'OTHER'
}

async function generateText(opts: {
  model: string
  system: string
  user: string
  temperature: number
  json: boolean
  imageBase64?: string
}): Promise<string> {
  const parts: any[] = [{ text: opts.user }]
  if (opts.imageBase64) {
    const data = opts.imageBase64.includes(',')
      ? opts.imageBase64.split(',')[1]
      : opts.imageBase64
    const mime = opts.imageBase64.startsWith('data:image/svg')
      ? 'image/svg+xml'
      : 'image/jpeg'
    parts.unshift({ inlineData: { mimeType: mime, data } })
  }
  const res = await client().models.generateContent({
    model: opts.model,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: opts.system,
      temperature: opts.temperature,
      ...(opts.json ? { responseMimeType: 'application/json' } : {}),
    },
  })
  return res.text ?? ''
}

// ============================================================
// AP1 — Multi-issue detection (Vision)
// ============================================================
const AP1_SYSTEM = `You are an expert civic issues analyst specializing in Indian urban infrastructure. You analyze photographs of public spaces to identify civic problems requiring government attention.
Behavior rules:
- Be thorough: identify every distinct issue visible, not just the most prominent one.
- Do not invent issues that aren't visible. Visible evidence only.
- Use the Indian context: monsoon damage, two-wheeler traffic, mixed-use streets, open drainage, footpath encroachment.
- Respond ONLY in valid JSON. No prose, no markdown fences.
- Bounding boxes are normalized 0-1 with top-left origin.`

export async function detectIssuesInImage(
  imageBase64: string,
  locationContext?: string,
): Promise<DetectedIssue[]> {
  if (!hasLiveAI()) return structuredClone(DEMO_DETECTION)
  try {
    const user = `Analyze the attached image and identify ALL distinct civic issues visible.
Location context: ${locationContext || 'unknown'}
Return JSON of shape: {"issues":[{"category": one of [POTHOLE,STREETLIGHT,WATER_LEAK,GARBAGE,FALLEN_TREE,BROKEN_SIGNAL,EXPOSED_WIRING,STRAY_ANIMAL,DRAINAGE,OTHER], "title": string, "description": string, "severity": 1-4 integer, "severityReasoning": string, "boundingBox": {"x":0-1,"y":0-1,"width":0-1,"height":0-1}, "estimatedDepartment": one of [PWD,BBMP_SANITATION,BESCOM,BWSSB,TRAFFIC_POLICE,OTHER]}]}`
    const raw = await generateText({
      model: VISION_MODEL,
      system: AP1_SYSTEM,
      user,
      temperature: 0.2,
      json: true,
      imageBase64,
    })
    const parsed = parseJson<{ issues: any[] }>(raw)
    const issues = (parsed.issues ?? []).map((it): DetectedIssue => ({
      category: toCategory(it.category),
      title: String(it.title ?? 'Civic issue'),
      description: String(it.description ?? ''),
      severity: toSeverity(it.severity),
      severityReasoning: String(it.severityReasoning ?? ''),
      boundingBox: {
        x: Number(it.boundingBox?.x ?? 0.1),
        y: Number(it.boundingBox?.y ?? 0.1),
        width: Number(it.boundingBox?.width ?? 0.2),
        height: Number(it.boundingBox?.height ?? 0.2),
      },
      estimatedDepartment: toDepartment(it.estimatedDepartment),
      selected: true,
    }))
    return issues.length > 0 ? issues : structuredClone(DEMO_DETECTION)
  } catch (err) {
    console.warn('[Gemini AP1] fell back to cache:', err)
    return structuredClone(DEMO_DETECTION)
  }
}

// ============================================================
// AP2 — Worsening prediction
// ============================================================
const AP2_SYSTEM = `You are a civic infrastructure forecasting expert with deep knowledge of Indian urban conditions, monsoon cycles, traffic patterns, and material degradation. You predict whether a reported civic issue will worsen and on what timeline.
Behavior rules:
- Cite specific reasoning: dimensions, weather, traffic, comparable cases.
- Do not be vague. Specify HOW and WHEN.
- Respond ONLY in valid JSON.`

export async function predictWorsening(
  issue: { category: IssueCategory; severity: Severity; description: string; ward: string; city: string; reportedAt: number },
  similarHistorical: Issue[],
): Promise<WorseningPrediction> {
  const cached = CACHED_WORSENING[issue.category] ?? GENERIC_WORSENING
  if (!hasLiveAI()) return structuredClone(cached)
  try {
    const histSummary =
      similarHistorical
        .slice(0, 5)
        .map(
          (h) =>
            `- ${categoryLabel(h.category)} (sev ${h.severity}) reported ${formatDate(h.reportedAt)}, status ${h.status}`,
        )
        .join('\n') || 'No close historical matches.'
    const user = `Predict the worsening trajectory for this issue:
- Category: ${categoryLabel(issue.category)}
- Severity now: ${issue.severity}/4
- Location: ${issue.ward}, ${issue.city}
- Description: ${issue.description}
- Reported: ${formatDate(issue.reportedAt)}
Environmental context:
- Current date: ${formatDate(Date.now())}
- Monsoon status: approaching onset (~12 days)
- Traffic level: HIGH
Similar historical cases:
${histSummary}
Return JSON: {"likelihood":0-1 number,"timeframeDays":integer,"reasoning":string citing specifics,"milestones":[{"day":integer,"status":string}]}`
    const raw = await generateText({
      model: TEXT_MODEL,
      system: AP2_SYSTEM,
      user,
      temperature: 0.4,
      json: true,
    })
    const p = parseJson<any>(raw)
    return {
      likelihood: Math.max(0, Math.min(1, Number(p.likelihood ?? cached.likelihood))),
      timeframeDays: Math.round(Number(p.timeframeDays ?? cached.timeframeDays)),
      reasoning: String(p.reasoning ?? cached.reasoning),
      milestones: Array.isArray(p.milestones)
        ? p.milestones.map((m: any) => ({ day: Number(m.day), status: String(m.status) }))
        : cached.milestones,
    }
  } catch (err) {
    console.warn('[Gemini AP2] fell back to cache:', err)
    return structuredClone(cached)
  }
}

// ============================================================
// AP4 — Complaint letter drafting
// ============================================================
const AP4_SYSTEM = `You are an official complaint letter writer for Indian municipal authorities. You draft formal complaint letters in the citizen's preferred language using standard Indian municipal complaint format.
Behavior rules:
- Formal salutation and valediction appropriate to the language.
- Reference relevant act/rule (IRC standards, Solid Waste Management Rules 2016, Electricity Act 2003, etc.) when applicable.
- State issue, location, severity clearly. Request specific action within a specific timeframe.
- Mention the right to RTI follow-up if not resolved within 30 days.
- Write entirely in the requested language's native script.
- Respond ONLY in valid JSON: {"subject": string, "body": string}.`

export async function draftComplaintLetter(
  issue: Issue,
  language: Language,
  authorityName: string,
  officerName: string,
  officerTitle: string,
  citizenName: string,
): Promise<ComplaintLetter> {
  const fallback: ComplaintLetter = {
    language,
    subject: `Urgent Action Required: ${issue.title} — ${issue.complaintLetter.referenceNumber}`,
    body: buildFallbackLetter(issue, authorityName, officerName, citizenName, language),
    referenceNumber: issue.complaintLetter.referenceNumber,
  }
  if (!hasLiveAI()) return fallback
  try {
    const user = `Draft a complaint letter in ${LANGUAGE_META[language].label} for this issue:
Addressed to: ${authorityName}
Officer: ${officerName}, ${officerTitle}
Issue: ${issue.title}
Category: ${categoryLabel(issue.category)}
Severity: ${issue.severity}/4
Location: ${issue.location.address}, ${issue.location.ward}, ${issue.location.city}
Reported by: ${citizenName}
Reference number: ${issue.complaintLetter.referenceNumber}
Date: ${formatDate(Date.now())}
Description: ${issue.description}
AI worsening reasoning to cite: ${issue.worseningPrediction.reasoning}
Return JSON {"subject":string,"body":string}.`
    const raw = await generateText({
      model: TEXT_MODEL,
      system: AP4_SYSTEM,
      user,
      temperature: 0.7,
      json: true,
    })
    const p = parseJson<any>(raw)
    return {
      language,
      subject: String(p.subject ?? fallback.subject),
      body: String(p.body ?? fallback.body),
      referenceNumber: issue.complaintLetter.referenceNumber,
    }
  } catch (err) {
    console.warn('[Gemini AP4] fell back to cache:', err)
    return fallback
  }
}

function buildFallbackLetter(
  issue: Issue,
  authorityName: string,
  officerName: string,
  citizenName: string,
  language: Language,
): string {
  if (language === Language.HINDI) {
    return `सेवा में,\n${officerName},\n${authorityName}\n\nविषय: ${issue.title} — संदर्भ ${issue.complaintLetter.referenceNumber}\n\nमहोदय/महोदया,\n\nमैं आपका ध्यान ${issue.location.address}, ${issue.location.ward} पर एक गंभीर नागरिक समस्या की ओर आकर्षित करना चाहता/चाहती हूँ। ${issue.description}\n\nकृपया 7 कार्यदिवसों के भीतर निरीक्षण एवं समाधान की व्यवस्था करें। 30 दिनों में कार्रवाई न होने पर मैं सूचना का अधिकार अधिनियम, 2005 के तहत आवेदन करने का अधिकार सुरक्षित रखता/रखती हूँ।\n\nभवदीय,\n${citizenName}\nसंदर्भ: ${issue.complaintLetter.referenceNumber}\nदिनांक: ${formatDate(Date.now())}`
  }
  return `Dear ${officerName},\n\nSubject: Urgent Action Required for ${issue.title} at ${issue.location.ward} — Reference ${issue.complaintLetter.referenceNumber}\n\nI am writing to bring to your immediate attention a civic issue at ${issue.location.address}, ${issue.location.ward}, ${issue.location.city}.\n\nDescription: ${issue.description} ${issue.worseningPrediction.reasoning}\n\nAs per applicable municipal standards, I respectfully request that this be inspected and repaired within 7 working days. Should no action be taken within 30 days, I reserve the right to file an RTI application under the Right to Information Act, 2005.\n\nKindly acknowledge receipt of this complaint at your earliest convenience.\n\nYours sincerely,\n${citizenName}\nReference: ${issue.complaintLetter.referenceNumber}\nDate: ${formatDate(Date.now())}`
}

// ============================================================
// AP5 — Root-cause cluster analysis
// ============================================================
const AP5_SYSTEM = `You are an infrastructure pattern analyst with expertise in identifying root causes from clusters of related civic complaints. You distinguish superficial coincidences from genuine systemic problems.
Behavior rules:
- Hypothesize specifically. "Poor maintenance" is unacceptable.
- Confidence must reflect actual certainty: 0.8+ only with strong evidence.
- Respond ONLY in valid JSON.`

export async function analyzeRootCause(
  clusteredIssues: Issue[],
  wardContext: string,
): Promise<RootCauseAnalysis> {
  if (!hasLiveAI()) return structuredClone(CACHED_ROOT_CAUSE)
  try {
    const list = clusteredIssues
      .map(
        (i) =>
          `- ${formatDate(i.reportedAt)}: ${categoryLabel(i.category)} (sev ${i.severity}) at ${i.location.address}`,
      )
      .join('\n')
    const user = `Analyze the following ${clusteredIssues.length} issues reported in the same ward within 30 days for a common root cause.
Issues:
${list}
Ward context:
${wardContext}
Return JSON: {"patternDetected":boolean,"pattern":string,"rootCauseHypothesis":string,"recommendedAction":string,"confidence":0-1 number,"priorityForAuthority":"LOW"|"MEDIUM"|"HIGH"}`
    const raw = await generateText({
      model: TEXT_MODEL,
      system: AP5_SYSTEM,
      user,
      temperature: 0.3,
      json: true,
    })
    const p = parseJson<any>(raw)
    return {
      patternDetected: Boolean(p.patternDetected ?? true),
      pattern: String(p.pattern ?? CACHED_ROOT_CAUSE.pattern),
      rootCauseHypothesis: String(p.rootCauseHypothesis ?? CACHED_ROOT_CAUSE.rootCauseHypothesis),
      recommendedAction: String(p.recommendedAction ?? CACHED_ROOT_CAUSE.recommendedAction),
      confidence: Math.max(0, Math.min(1, Number(p.confidence ?? CACHED_ROOT_CAUSE.confidence))),
      priorityForAuthority: ['LOW', 'MEDIUM', 'HIGH'].includes(p.priorityForAuthority)
        ? p.priorityForAuthority
        : 'HIGH',
    }
  } catch (err) {
    console.warn('[Gemini AP5] fell back to cache:', err)
    return structuredClone(CACHED_ROOT_CAUSE)
  }
}

// ============================================================
// AP6 — Voice input extraction
// ============================================================
const AP6_SYSTEM = `You are a multilingual civic complaint processor. You receive verbal reports in Indian regional languages and extract structured information.
Behavior rules:
- Provide accurate English translation preserving meaning.
- Extract category, location, severity only if clearly implied — null is acceptable.
- Identify urgency keywords.
- Respond ONLY in valid JSON.`

export async function extractFromVoice(
  transcript: string,
  originalLanguage: Language,
): Promise<VoiceExtraction> {
  if (!hasLiveAI()) {
    return { ...structuredClone(CACHED_VOICE_EXTRACTION) }
  }
  try {
    const user = `Process this verbal civic complaint:
Original language: ${LANGUAGE_META[originalLanguage].label}
Transcript: "${transcript}"
Return JSON: {"translation":string,"extractedCategory":category-enum-or-null,"extractedLocation":string-or-null,"extractedSeverity":1-4-or-null,"urgencyKeywords":string[],"confidence":0-1}`
    const raw = await generateText({
      model: TEXT_MODEL,
      system: AP6_SYSTEM,
      user,
      temperature: 0.3,
      json: true,
    })
    const p = parseJson<any>(raw)
    return {
      translation: String(p.translation ?? transcript),
      extractedCategory: p.extractedCategory ? toCategory(p.extractedCategory) : null,
      extractedLocation: p.extractedLocation ? String(p.extractedLocation) : null,
      extractedSeverity: p.extractedSeverity ? toSeverity(p.extractedSeverity) : null,
      urgencyKeywords: Array.isArray(p.urgencyKeywords) ? p.urgencyKeywords.map(String) : [],
      confidence: Math.max(0, Math.min(1, Number(p.confidence ?? 0.7))),
    }
  } catch (err) {
    console.warn('[Gemini AP6] fell back to cache:', err)
    return { ...structuredClone(CACHED_VOICE_EXTRACTION) }
  }
}

// ============================================================
// AP7 — Impact narrative (plain text)
// ============================================================
const AP7_SYSTEM = `You write warm, motivating monthly impact summaries for citizens of Indian wards. Tone is civic-proud, encouraging, India-aware, plain English with occasional natural Hindi phrases.
Behavior rules:
- Lead with concrete numbers, not platitudes.
- Highlight ONE standout story.
- Close forward-looking, naming the top contributor.
- Use ₹ and round large numbers (₹4.2 lakh). Plain text only. Max 250 words.`

export async function generateImpactNarrative(
  stats: WardStats,
  period: DateRange,
): Promise<string> {
  if (!hasLiveAI()) return buildFallbackNarrative(stats, period)
  try {
    const user = `Write the monthly impact narrative for ${stats.ward}.
Stats for ${formatDate(period.start)} to ${formatDate(period.end)}:
- Total reports: ${stats.reportsCount}
- Resolved: ${stats.resolvedCount} (${stats.resolutionPct}%)
- Top categories: ${stats.topCategories.map((c) => categoryLabel(c.category)).join(', ')}
- Top contributor: ${stats.topContributor} (${stats.topContributorReports} reports)
- Avg response time: ${stats.avgResponseHours} hours
- Estimated cost saved: ${formatINR(stats.estimatedCostSavedINR)}
- Estimated accidents prevented: ${stats.estimatedAccidentsPrevented}
Return plain text, 3 paragraphs, <= 250 words.`
    const raw = await generateText({
      model: TEXT_MODEL,
      system: AP7_SYSTEM,
      user,
      temperature: 0.75,
      json: false,
    })
    return raw.trim() || buildFallbackNarrative(stats, period)
  } catch (err) {
    console.warn('[Gemini AP7] fell back to cache:', err)
    return buildFallbackNarrative(stats, period)
  }
}

function buildFallbackNarrative(stats: WardStats, period: DateRange): string {
  const month = new Date(period.end).toLocaleString('en-IN', { month: 'long' })
  const lakh = (stats.estimatedCostSavedINR / 100000).toFixed(1)
  const topCat = stats.topCategories[0]
    ? categoryLabel(stats.topCategories[0].category)
    : 'civic issues'
  return `This ${month}, ${stats.ward} spoke up. Citizens filed ${stats.reportsCount} civic reports — ${stats.resolvedCount} of which are already resolved, putting our resolution rate at ${stats.resolutionPct}% with an average response time of about ${stats.avgResponseHours} hours. Together, our reports prevented an estimated ${stats.estimatedAccidentsPrevented} accidents and saved roughly ₹${lakh} lakh in deferred repair costs.

The story that stood out was the surge in ${topCat.toLowerCase()} reports. Instead of treating each as an isolated complaint, our AI surfaced the underlying pattern to the responsible authority — turning what would have been repeated patch jobs into a proper, root-cause inspection. That's how patterns become permanent fixes.

Special thanks to ${stats.topContributor}, this month's most active advocate with ${stats.topContributorReports} reports. Keep walking, keep watching, keep reporting. Aapka ward, aapki awaaz.`
}

// ============================================================
// AP8 — Escalation voicemail script (plain text)
// ============================================================
const AP8_SYSTEM = `You generate short, polite-but-firm escalation voicemail scripts for Indian municipal officers, spoken via TTS in Indian English.
Behavior rules:
- Respectful greeting; state issue, location, reference in first 2 sentences.
- Cite days unresolved as factual leverage. Mention RTI if no action in 48 hours.
- Plain text only. Max 80 words (~30 seconds).`

export async function generateEscalationScript(
  issue: Issue,
  daysUnresolved: number,
  officerName: string,
  officerTitle: string,
  authorityName: string,
  citizenName: string,
): Promise<string> {
  const fallback = cachedEscalationScript(
    officerName,
    categoryLabel(issue.category),
    issue.location.address,
    issue.complaintLetter.referenceNumber,
    daysUnresolved,
    citizenName,
  )
  if (!hasLiveAI()) return fallback
  try {
    const user = `Generate the escalation voicemail script.
Recipient: ${officerName}, ${officerTitle} at ${authorityName}
Issue: ${categoryLabel(issue.category)} at ${issue.location.address}
Reference: ${issue.complaintLetter.referenceNumber}
Days unresolved: ${daysUnresolved}
Severity: ${severityLabel(issue.severity)}
Reporter: ${citizenName}`
    const raw = await generateText({
      model: TEXT_MODEL,
      system: AP8_SYSTEM,
      user,
      temperature: 0.5,
      json: false,
    })
    return raw.trim() || fallback
  } catch (err) {
    console.warn('[Gemini AP8] fell back to cache:', err)
    return fallback
  }
}
