import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mic,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Map as MapIcon,
  FileText,
  TrendingUp,
  Building2,
  X,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { CameraCapture } from '../../components/camera/CameraCapture'
import { VoiceModal } from '../../components/voice/VoiceModal'
import { Typewriter } from '../../components/shared/Typewriter'
import { Button, SeverityBadge, StatusBadge, Spinner } from '../../components/shared/ui'
import {
  type DetectedIssue,
  type GeoLocation,
  type Issue,
  IssueCategory,
  Severity,
  Language,
  type VoiceExtraction,
} from '../../types'
import { detectIssuesInImage } from '../../services/geminiService'
import { findAuthority } from '../../services/routingService'
import { captureLocation } from '../../services/geolocationService'
import { categoryPhoto } from '../../data/mockData/photos'
import { categoryLabel, CATEGORY_META, SEVERITY_META } from '../../utils/labels'
import { bboxToStyle } from '../../utils/geometry'

type Step = 'camera' | 'analyzing' | 'detected' | 'confirmation'

const ANALYZE_LINES = [
  'Scanning image regions for civic defects…',
  'Classifying issues into categories…',
  'Estimating severity from visual cues…',
  'Forecasting how each issue will worsen…',
  'Routing each issue to the right department…',
]

export function ReportFlow() {
  const { state, predictForDetected, fileDetectedIssues } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('camera')
  const [photo, setPhoto] = useState<string | null>(null)
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [detected, setDetected] = useState<DetectedIssue[]>([])
  const [filed, setFiled] = useState<Issue[]>([])
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [lineIdx, setLineIdx] = useState(0)
  const busy = useRef(false)

  // animate the analyzing lines
  useEffect(() => {
    if (step !== 'analyzing') return
    setLineIdx(0)
    const id = setInterval(() => setLineIdx((i) => Math.min(i + 1, ANALYZE_LINES.length - 1)), 700)
    return () => clearInterval(id)
  }, [step])

  async function runVisionAnalysis(dataUrl: string) {
    if (busy.current) return
    busy.current = true
    setPhoto(dataUrl)
    setStep('analyzing')
    const started = Date.now()
    const loc = await captureLocation()
    setLocation(loc)
    const det = await detectIssuesInImage(dataUrl, `${loc.address}, ${loc.ward}, ${loc.city}`)
    const withWorsening = await Promise.all(
      det.map((d) => predictForDetected(d, loc)),
    )
    // ensure the analysis is visible for a beat
    const elapsed = Date.now() - started
    if (elapsed < 2600) await new Promise((r) => setTimeout(r, 2600 - elapsed))
    setDetected(withWorsening.map((d) => ({ ...d, selected: true })))
    setStep('detected')
    busy.current = false
  }

  async function onVoiceApply(ex: VoiceExtraction, _transcript: string, _lang: Language) {
    setVoiceOpen(false)
    const cat = ex.extractedCategory ?? IssueCategory.OTHER
    const sev = ex.extractedSeverity ?? Severity.MEDIUM
    const p = categoryPhoto(cat, 7)
    setPhoto(p)
    setStep('analyzing')
    const loc = await captureLocation()
    setLocation(loc)
    const draft: DetectedIssue = {
      category: cat,
      title: `${categoryLabel(cat)} (voice report)`,
      description: ex.translation,
      severity: sev,
      severityReasoning: 'Reported via voice; severity inferred from the spoken description.',
      boundingBox: { x: 0.08, y: 0.08, width: 0.84, height: 0.84 },
      estimatedDepartment: 'OTHER',
      selected: true,
    }
    const withW = await predictForDetected(draft, loc)
    await new Promise((r) => setTimeout(r, 1400))
    setDetected([{ ...withW, selected: true }])
    setStep('detected')
  }

  function toggle(i: number) {
    setDetected((d) => d.map((x, idx) => (idx === i ? { ...x, selected: !x.selected } : x)))
  }

  async function fileAll() {
    if (!photo || !location) return
    const chosen = detected.filter((d) => d.selected)
    if (chosen.length === 0) return
    const issues = await fileDetectedIssues(chosen, photo, location)
    setFiled(issues)
    setStep('confirmation')
  }

  function restart() {
    setStep('camera')
    setPhoto(null)
    setDetected([])
    setFiled([])
  }

  // ---- CAMERA ----
  if (step === 'camera') {
    return (
      <div className="relative h-full">
        <CameraCapture onCapture={runVisionAnalysis} />
        <button
          onClick={() => setVoiceOpen(true)}
          className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-saffron shadow-card backdrop-blur"
        >
          <Mic size={16} /> Voice
        </button>
        <VoiceModal open={voiceOpen} onClose={() => setVoiceOpen(false)} onApply={onVoiceApply} />
      </div>
    )
  }

  const selectedCount = detected.filter((d) => d.selected).length

  return (
    <div className="min-h-full bg-canvas">
      {/* slim header */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-canvas/95 px-4 py-3 backdrop-blur">
        <button onClick={restart} className="rounded-lg p-1.5 text-ink/50 hover:bg-black/5" aria-label="Cancel">
          <X size={20} />
        </button>
        <span className="text-sm font-bold">
          {step === 'analyzing' ? 'AI analysis' : step === 'detected' ? 'Detected issues' : 'Filed'}
        </span>
        <span className="w-8" />
      </div>

      <div className="px-4 pb-6">
        {/* photo with overlays */}
        {photo && (
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl bg-black/10 shadow-card">
            <img src={photo} alt="Captured" className="h-full w-full object-cover" />
            {step === 'detected' &&
              detected.map((d, i) => (
                <div
                  key={i}
                  className="absolute rounded-lg border-2"
                  style={{
                    ...bboxToStyle(d.boundingBox),
                    borderColor: SEVERITY_META[d.severity].color,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0)',
                    opacity: d.selected ? 1 : 0.35,
                  }}
                >
                  <span
                    className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: SEVERITY_META[d.severity].color }}
                  >
                    {i + 1}
                  </span>
                </div>
              ))}
            {step === 'analyzing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45 text-white">
                <div className="flex items-center gap-2 text-lg font-bold">
                  <Sparkles size={20} className="animate-pulse text-saffron" /> Gemini is analyzing…
                </div>
                <div className="h-1 w-40 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-1/2 animate-[cs-fade-up_1s_infinite_alternate] bg-saffron" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* analyzing reasoning lines */}
        {step === 'analyzing' && (
          <div className="mx-auto mt-5 max-w-md space-y-2">
            {ANALYZE_LINES.slice(0, lineIdx + 1).map((l, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-ink/70 animate-fade-up">
                {i < lineIdx ? (
                  <CheckCircle2 size={16} className="text-success" />
                ) : (
                  <Spinner className="h-4 w-4" />
                )}
                {l}
              </div>
            ))}
          </div>
        )}

        {/* detected cards */}
        {step === 'detected' && (
          <>
            <p className="mx-auto mt-4 max-w-md text-center text-sm text-ink/60">
              Gemini found <b className="text-ink">{detected.length}</b> issue
              {detected.length > 1 ? 's' : ''} in this photo. Untick any false positives.
            </p>
            <div className="mx-auto mt-3 max-w-md space-y-3">
              {detected.map((d, i) => (
                <DetectedCard
                  key={i}
                  index={i}
                  d={d}
                  ward={location?.ward ?? ''}
                  authorityName={
                    findAuthority(d.category, location?.ward ?? '', state.authorities).shortName
                  }
                  onToggle={() => toggle(i)}
                />
              ))}
            </div>
            <div className="sticky bottom-2 z-10 mx-auto mt-4 max-w-md">
              <Button onClick={fileAll} disabled={selectedCount === 0} className="w-full" size="lg">
                <Sparkles size={18} /> File all selected ({selectedCount})
              </Button>
            </div>
          </>
        )}

        {/* confirmation */}
        {step === 'confirmation' && (
          <div className="mx-auto mt-6 max-w-md text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-light animate-pop">
              <CheckCircle2 size={36} className="text-success" />
            </div>
            <h2 className="mt-3 text-xl font-bold">
              {filed.length} ticket{filed.length > 1 ? 's' : ''} filed &amp; auto-dispatched
            </h2>
            <p className="mt-1 text-sm text-ink/60">
              The AI routed each to the right department and drafted a complaint letter.
            </p>

            <div className="mt-5 space-y-2 text-left">
              {filed.map((f) => {
                const a = state.authorities.find((x) => x.id === f.assignedAuthorityId)
                return (
                  <div key={f.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/5">
                      <img src={f.photoDataUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{f.title}</div>
                      <div className="text-xs text-ink/50">
                        {a?.shortName} · {f.complaintLetter.referenceNumber}
                      </div>
                    </div>
                    <StatusBadge status={f.status} />
                  </div>
                )
              })}
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/citizen/home')}>
                <MapIcon size={16} /> View on map
              </Button>
              <Button className="flex-1" onClick={() => navigate('/citizen/reports')}>
                <FileText size={16} /> My reports <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetectedCard({
  index,
  d,
  authorityName,
  onToggle,
}: {
  index: number
  d: DetectedIssue
  ward: string
  authorityName: string
  onToggle: () => void
}) {
  const meta = CATEGORY_META[d.category]
  return (
    <div className={`rounded-2xl bg-white p-4 shadow-card transition ${d.selected ? '' : 'opacity-60'}`}>
      <div className="flex items-start gap-3">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: SEVERITY_META[d.severity].color }}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{meta.emoji}</span>
            <h3 className="truncate text-sm font-bold">{d.title}</h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <SeverityBadge severity={d.severity} />
            <span className="inline-flex items-center gap-1 rounded-full bg-civicblue-light px-2 py-0.5 text-xs font-medium text-civicblue">
              <Building2 size={11} /> {authorityName}
            </span>
          </div>
        </div>
        {/* toggle */}
        <button
          onClick={onToggle}
          aria-label={d.selected ? 'Deselect' : 'Select'}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${d.selected ? 'bg-saffron' : 'bg-black/15'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${d.selected ? 'left-[22px]' : 'left-0.5'}`}
          />
        </button>
      </div>

      <p className="mt-2 text-sm text-ink/70">{d.description}</p>
      <p className="mt-1 text-xs italic text-ink/45">{d.severityReasoning}</p>

      {/* worsening prediction (EC2) */}
      {d.worsening && (
        <div className="mt-3 rounded-xl border border-warning/30 bg-warning-light/60 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-warning">
              <TrendingUp size={14} /> Predicted impact
            </div>
            <div className="text-xs font-semibold text-warning">
              {Math.round(d.worsening.likelihood * 100)}% · ~{d.worsening.timeframeDays}d
            </div>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink/75">
            <Typewriter text={d.worsening.reasoning} />
          </p>
          {d.worsening.milestones && d.worsening.milestones.length > 0 && (
            <div className="mt-2 space-y-1 border-l-2 border-warning/40 pl-3">
              {d.worsening.milestones.map((m, i) => (
                <div key={i} className="text-[11px] text-ink/60">
                  <b className="text-warning">Day {m.day}:</b> {m.status}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
