import { useEffect, useState } from 'react'
import { Phone, PhoneOff, Sparkles, FileText, Volume2 } from 'lucide-react'
import { speak, cancelSpeech } from '../../services/ttsService'

type Phase = 'ringing' | 'speaking' | 'done'

export function FakeCallScreen({
  open,
  onClose,
  transcript,
  officerName,
  officerTitle,
  authorityName,
  referenceNumber,
}: {
  open: boolean
  onClose: () => void
  transcript: string
  officerName: string
  officerTitle: string
  authorityName: string
  referenceNumber: string
}) {
  const [phase, setPhase] = useState<Phase>('ringing')
  const [spokenChars, setSpokenChars] = useState(0)
  useEffect(() => {
    if (!open) return
    setPhase('ringing')
    setSpokenChars(0)
    const ring = setTimeout(() => {
      setPhase('speaking')
      speak({
        text: transcript,
        langCode: 'en-IN',
        rate: 0.98,
        onWord: (i) => setSpokenChars(i),
        onEnd: () => {
          setSpokenChars(transcript.length)
          setPhase('done')
        },
      })
    }, 1800)
    return () => {
      clearTimeout(ring)
      cancelSpeech()
    }
  }, [open, transcript])

  if (!open) return null

  function end() {
    cancelSpeech()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-between bg-gradient-to-b from-civicblue to-[#0f1f4d] px-6 py-12 text-white">
      {/* top: agent badge */}
      <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium">
        <Sparkles size={16} className="text-saffron" /> CivicSetu AI Advocate
      </div>

      {/* middle: avatar + status */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div
          className={`grid h-28 w-28 place-items-center rounded-full bg-white/15 text-4xl font-bold ${
            phase === 'ringing' ? 'animate-pulse-ring' : ''
          }`}
        >
          {officerName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <h2 className="mt-5 text-2xl font-bold">{officerName}</h2>
        <p className="text-white/70">{officerTitle}</p>
        <p className="text-sm text-white/50">{authorityName}</p>

        <div className="mt-4 flex items-center gap-2 text-sm">
          {phase === 'ringing' && (
            <span className="flex items-center gap-2 text-saffron">
              <Phone size={16} className="animate-ring" /> Calling…
            </span>
          )}
          {phase === 'speaking' && (
            <span className="flex items-center gap-2 text-green-300">
              <Volume2 size={16} /> AI voicemail playing
            </span>
          )}
          {phase === 'done' && (
            <span className="text-white/70">Voicemail delivered · {referenceNumber}</span>
          )}
        </div>
      </div>

      {/* transcript caption */}
      {phase !== 'ringing' && (
        <div className="mb-4 max-h-40 w-full max-w-md overflow-y-auto rounded-2xl bg-black/30 p-4 text-sm leading-relaxed thin-scroll">
          <span className="text-white">{transcript.slice(0, spokenChars)}</span>
          <span className="text-white/40">{transcript.slice(spokenChars)}</span>
        </div>
      )}

      {phase === 'done' && (
        <div className="mb-4 flex w-full max-w-md items-start gap-2 rounded-2xl bg-white/10 p-4 text-sm">
          <FileText size={18} className="mt-0.5 shrink-0 text-saffron" />
          <p>
            RTI application drafted under the Right to Information Act, 2005 for{' '}
            <b>{referenceNumber}</b>. The issue is now marked <b>Escalated</b>.
          </p>
        </div>
      )}

      {/* end call */}
      <button
        onClick={end}
        className="grid h-16 w-16 place-items-center rounded-full bg-danger shadow-float transition active:scale-95"
        aria-label="End call"
      >
        <PhoneOff size={26} />
      </button>
    </div>
  )
}
