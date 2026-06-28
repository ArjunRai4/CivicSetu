import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  TrendingUp,
  Volume2,
  Square,
  FileText,
  ShieldCheck,
  Flag,
  CheckCircle2,
  PhoneCall,
  Building2,
  Languages,
  ChevronDown,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Button, Card, StatusBadge, SeverityBadge, Spinner } from '../../components/shared/ui'
import { MapView } from '../../components/map/MapView'
import { FakeCallScreen } from '../../components/escalation/FakeCallScreen'
import { speak, cancelSpeech } from '../../services/ttsService'
import {
  CATEGORY_META,
  STATUS_META,
  LANGUAGE_META,
} from '../../utils/labels'
import { formatDateTime, relativeTime, daysSince } from '../../utils/format'
import { IssueStatus, Language } from '../../types'

export function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    state,
    authorityById,
    citizenById,
    changeStatus,
    verifyIssue,
    runEscalation,
    getEscalatableIssues,
    regenerateLetter,
  } = useApp()

  const issue = useMemo(() => state.issues.find((i) => i.id === id), [state.issues, id])
  const [reading, setReading] = useState(false)
  const [letterOpen, setLetterOpen] = useState(false)
  const [escalating, setEscalating] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [call, setCall] = useState<null | {
    transcript: string
    officerName: string
    officerTitle: string
    authorityName: string
    referenceNumber: string
  }>(null)

  if (!issue) {
    return (
      <div className="py-20 text-center text-ink/50">
        Report not found.
        <div className="mt-3">
          <Button variant="outline" onClick={() => navigate('/citizen/reports')}>Back to my reports</Button>
        </div>
      </div>
    )
  }

  const authority = authorityById(issue.assignedAuthorityId)
  const verifs = issue.verifications.filter((v) => v.confirmsExists)
  const isMine = issue.reportedBy === state.activeCitizen.id
  const escalatable = getEscalatableIssues().some((i) => i.id === issue.id)
  const w = issue.worseningPrediction

  function toggleRead() {
    if (reading) {
      cancelSpeech()
      setReading(false)
      return
    }
    setReading(true)
    speak({
      text: `${issue.complaintLetter.subject}. ${issue.complaintLetter.body}`,
      langCode: LANGUAGE_META[issue.complaintLetter.language]?.speechCode ?? 'en-IN',
      onEnd: () => setReading(false),
    })
  }

  async function escalateNow() {
    setEscalating(true)
    const res = await runEscalation(issue!.id)
    setEscalating(false)
    setCall({
      transcript: res.transcript,
      officerName: res.officerName,
      officerTitle: res.officerTitle,
      authorityName: res.authorityName,
      referenceNumber: issue!.complaintLetter.referenceNumber,
    })
  }

  async function regen(lang: Language) {
    setRegenerating(true)
    await regenerateLetter(issue!.id, lang)
    setRegenerating(false)
  }

  return (
    <div className="space-y-4 pb-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-ink/60">
        <ArrowLeft size={16} /> Back
      </button>

      {/* photo + header */}
      <Card className="overflow-hidden">
        <div className="h-48 w-full overflow-hidden bg-black/5">
          <img src={issue.photoDataUrl} alt={issue.title} className="h-full w-full object-cover" />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg font-extrabold">
              {CATEGORY_META[issue.category].emoji} {issue.title}
            </h1>
            <StatusBadge status={issue.status} />
          </div>
          <p className="mt-1 text-sm text-ink/60">{issue.location.address}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <SeverityBadge severity={issue.severity} />
            <span className="rounded-full bg-black/5 px-2 py-0.5 font-medium text-ink/60">
              {issue.complaintLetter.referenceNumber}
            </span>
            {authority && (
              <span className="inline-flex items-center gap-1 rounded-full bg-civicblue-light px-2 py-0.5 font-medium text-civicblue">
                <Building2 size={11} /> {authority.shortName}
              </span>
            )}
            <span className="text-ink/40">{daysSince(issue.reportedAt)}d ago</span>
          </div>
        </div>
      </Card>

      {/* escalation prompt */}
      {escalatable && issue.status !== IssueStatus.ESCALATED && (
        <Card className="border border-danger/20 bg-danger-light/40 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-danger">
            <PhoneCall size={16} /> SLA breached — AI advocate ready
          </div>
          <p className="mt-1 text-xs text-ink/60">
            This report has been unresolved past its 7-day SLA. The AI can call the officer
            with a TTS voicemail and file an RTI on your behalf.
          </p>
          <Button variant="danger" className="mt-3 w-full" onClick={escalateNow} disabled={escalating}>
            {escalating ? <Spinner className="h-4 w-4" /> : <PhoneCall size={16} />}
            {escalating ? 'Generating voicemail…' : 'Trigger AI advocate escalation'}
          </Button>
        </Card>
      )}

      {/* AI worsening analysis */}
      <Card className="p-4">
        <div className="flex items-center gap-1.5 text-sm font-bold text-warning">
          <TrendingUp size={16} /> AI worsening prediction
        </div>
        <div className="mt-1 text-xs font-semibold text-warning">
          {Math.round(w.likelihood * 100)}% likely to worsen · ~{w.timeframeDays} days
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink/75">{w.reasoning}</p>
        {w.milestones && (
          <div className="mt-3 space-y-1.5 border-l-2 border-warning/40 pl-3">
            {w.milestones.map((m, i) => (
              <div key={i} className="text-xs text-ink/65">
                <b className="text-warning">Day {m.day}:</b> {m.status}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* status timeline */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-bold">Status timeline</h2>
        <ol className="space-y-3">
          <TimelineItem
            label="Reported"
            color="#dc2626"
            time={issue.reportedAt}
            note="Citizen filed the report."
          />
          {issue.statusHistory.map((s, i) => (
            <TimelineItem
              key={i}
              label={STATUS_META[s.toStatus].label}
              color={STATUS_META[s.toStatus].markerColor}
              time={s.changedAt}
              note={s.note}
              by={s.changedBy}
            />
          ))}
        </ol>
      </Card>

      {/* complaint letter */}
      <Card className="p-4">
        <button
          onClick={() => setLetterOpen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <FileText size={16} className="text-civicblue" /> Complaint letter
          </span>
          <ChevronDown size={18} className={`transition ${letterOpen ? 'rotate-180' : ''}`} />
        </button>
        {letterOpen && (
          <div className="mt-3">
            <div className="rounded-xl bg-black/[0.03] p-3">
              <div className="text-sm font-bold">{issue.complaintLetter.subject}</div>
              <pre className={`mt-2 whitespace-pre-wrap font-sans text-sm text-ink/75 lang-${issue.complaintLetter.language}`}>
                {issue.complaintLetter.body}
              </pre>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={toggleRead}>
                {reading ? <Square size={14} /> : <Volume2 size={14} />}
                {reading ? 'Stop' : 'Read aloud'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => regen(Language.ENGLISH)}
                disabled={regenerating}
              >
                <Languages size={14} /> English
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => regen(Language.HINDI)}
                disabled={regenerating}
              >
                <Languages size={14} /> हिन्दी
              </Button>
              {regenerating && <Spinner className="h-4 w-4 self-center" />}
            </div>
          </div>
        )}
      </Card>

      {/* escalation log */}
      {issue.escalationLog.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-purple-700">
            <PhoneCall size={16} /> Escalation log
          </h2>
          <div className="space-y-2">
            {issue.escalationLog.map((e, i) => (
              <div key={i} className="rounded-xl bg-purple-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700">{e.type}</span>
                  <span className="text-[11px] text-ink/40">{relativeTime(e.triggeredAt)}</span>
                </div>
                <p className="mt-1 text-xs text-ink/70">{e.transcript}</p>
                {e.type === 'VOICEMAIL' && (
                  <button
                    onClick={() =>
                      speak({ text: e.transcript, langCode: 'en-IN' })
                    }
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-purple-700"
                  >
                    <Volume2 size={12} /> Replay voicemail
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* community verifications */}
      <Card className="p-4">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <ShieldCheck size={16} className="text-success" /> Community verifications ({verifs.length})
        </h2>
        <div className="mt-2 flex items-center gap-1">
          {verifs.slice(0, 8).map((v, i) => {
            const c = citizenById(v.citizenId)
            const initials = (c?.name ?? '?').split(' ').map((n) => n[0]).join('').slice(0, 2)
            return (
              <span
                key={i}
                title={c?.name}
                className="grid h-7 w-7 place-items-center rounded-full bg-civicblue text-[10px] font-bold text-white ring-2 ring-white"
                style={{ marginLeft: i ? -8 : 0 }}
              >
                {initials}
              </span>
            )
          })}
          {verifs.length === 0 && <span className="text-xs text-ink/40">No verifications yet.</span>}
          {verifs.length >= 3 && (
            <span className="ml-2 rounded-full bg-success-light px-2 py-0.5 text-[10px] font-bold text-success">
              ✓ Verified
            </span>
          )}
        </div>
        {!isMine && (
          <div className="mt-3 flex gap-2">
            <Button variant="success" size="sm" className="flex-1" onClick={() => verifyIssue(issue.id, true)}>
              <ShieldCheck size={14} /> I've seen this
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => verifyIssue(issue.id, false)}>
              <Flag size={14} /> Looks false
            </Button>
          </div>
        )}
      </Card>

      {/* mark resolved */}
      {isMine && issue.status !== IssueStatus.RESOLVED && (
        <Button
          variant="success"
          className="w-full"
          onClick={() => changeStatus(issue.id, IssueStatus.RESOLVED, 'CITIZEN', 'Citizen confirmed resolution.')}
        >
          <CheckCircle2 size={16} /> Mark as resolved
        </Button>
      )}

      {/* mini map */}
      <Card className="overflow-hidden">
        <div className="h-40">
          <MapView
            center={[issue.location.lat, issue.location.lng]}
            zoom={15}
            markers={[
              {
                id: issue.id,
                lat: issue.location.lat,
                lng: issue.location.lng,
                color: STATUS_META[issue.status].markerColor,
                label: CATEGORY_META[issue.category].emoji,
              },
            ]}
          />
        </div>
      </Card>

      {call && (
        <FakeCallScreen
          open={!!call}
          onClose={() => setCall(null)}
          transcript={call.transcript}
          officerName={call.officerName}
          officerTitle={call.officerTitle}
          authorityName={call.authorityName}
          referenceNumber={call.referenceNumber}
        />
      )}
    </div>
  )
}

function TimelineItem({
  label,
  color,
  time,
  note,
  by,
}: {
  label: string
  color: string
  time: number
  note?: string
  by?: string
}) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="mt-1 h-3 w-3 rounded-full ring-2 ring-white" style={{ backgroundColor: color }} />
        <span className="w-px flex-1 bg-black/10" />
      </div>
      <div className="pb-1">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[11px] text-ink/45">
          {formatDateTime(time)}
          {by ? ` · ${by.toLowerCase()}` : ''}
        </div>
        {note && <div className="mt-0.5 text-xs text-ink/60">{note}</div>}
      </div>
    </li>
  )
}
