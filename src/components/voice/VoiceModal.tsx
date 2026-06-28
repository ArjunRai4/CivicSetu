import { useEffect, useRef, useState } from 'react'
import { Mic, Square, Sparkles, Check } from 'lucide-react'
import { Modal } from '../shared/Modal'
import { Button, Spinner } from '../shared/ui'
import { Language, type VoiceExtraction } from '../../types'
import {
  startRecognition,
  speechRecognitionSupported,
  type RecognitionHandle,
} from '../../services/voiceInputService'
import { extractFromVoice } from '../../services/geminiService'
import { LANGUAGE_META, categoryLabel } from '../../utils/labels'
import { SUPPORTED_UI_LANGUAGES, COMING_SOON_LANGUAGES } from '../../i18n'
import { DEMO_VOICE_TRANSCRIPT_HI } from '../../data/mockData/demoPhoto'
import { useApp } from '../../context/AppContext'

type Phase = 'idle' | 'listening' | 'processing' | 'result'

export function VoiceModal({
  open,
  onClose,
  onApply,
}: {
  open: boolean
  onClose: () => void
  onApply: (extraction: VoiceExtraction, transcript: string, language: Language) => void
}) {
  const { state, recordVoiceLanguage } = useApp()
  const [language, setLanguage] = useState<Language>(state.activeCitizen.preferredLanguage)
  const [phase, setPhase] = useState<Phase>('idle')
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [extraction, setExtraction] = useState<VoiceExtraction | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const recRef = useRef<RecognitionHandle | null>(null)

  useEffect(() => {
    if (!open) {
      recRef.current?.abort()
      setPhase('idle')
      setTranscript('')
      setInterim('')
      setExtraction(null)
      setNote(null)
      setLanguage(state.activeCitizen.preferredLanguage)
    }
  }, [open, state.activeCitizen.preferredLanguage])

  async function process(text: string) {
    setPhase('processing')
    setTranscript(text)
    recordVoiceLanguage(language)
    const ex = await extractFromVoice(text, language)
    setExtraction(ex)
    setPhase('result')
  }

  function startListening() {
    setTranscript('')
    setInterim('')
    setExtraction(null)
    if (!speechRecognitionSupported()) {
      setNote('Live mic not supported in this browser — using the demo voice note instead.')
      void process(language === Language.HINDI ? DEMO_VOICE_TRANSCRIPT_HI : 'There is a big pothole near the metro station, unattended for two weeks. Please send someone immediately.')
      return
    }
    setPhase('listening')
    recRef.current = startRecognition({
      langCode: LANGUAGE_META[language].speechCode,
      onInterim: (t) => setInterim(t),
      onFinal: (t) => {
        setInterim('')
        void process(t)
      },
      onError: () => {
        setNote('Could not capture audio — using the demo voice note instead.')
        void process(language === Language.HINDI ? DEMO_VOICE_TRANSCRIPT_HI : 'Big pothole near the metro station, unattended for two weeks. Please send someone immediately.')
      },
    })
  }

  function stopListening() {
    recRef.current?.stop()
  }

  const langClass = `lang-${language}`

  return (
    <Modal open={open} onClose={onClose} title="Voice report" maxWidth="max-w-md">
      {/* language picker */}
      <div className="mb-4 flex flex-wrap gap-2">
        {SUPPORTED_UI_LANGUAGES.map((l) => (
          <button
            key={l}
            onClick={() => setLanguage(l)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              language === l ? 'bg-saffron text-white' : 'bg-black/5 text-ink/70'
            }`}
          >
            {LANGUAGE_META[l].native}
          </button>
        ))}
        {COMING_SOON_LANGUAGES.map((l) => (
          <span
            key={l}
            title="Coming soon"
            className="rounded-full bg-black/5 px-3 py-1 text-sm text-ink/30"
          >
            {LANGUAGE_META[l].native}
          </span>
        ))}
      </div>

      {/* mic / state */}
      <div className="flex flex-col items-center gap-4 py-2">
        {phase === 'idle' && (
          <>
            <button
              onClick={startListening}
              className="grid h-20 w-20 place-items-center rounded-full bg-saffron text-white shadow-float transition active:scale-95"
              aria-label="Start recording"
            >
              <Mic size={32} />
            </button>
            <p className="text-sm text-ink/60">
              Tap and speak in {LANGUAGE_META[language].native}
            </p>
          </>
        )}

        {phase === 'listening' && (
          <>
            <button
              onClick={stopListening}
              className="grid h-20 w-20 place-items-center rounded-full bg-danger text-white shadow-float animate-pulse-ring"
              aria-label="Stop recording"
            >
              <Square size={28} />
            </button>
            <p className="text-sm font-medium text-danger">Listening… tap to stop</p>
            <p className={`min-h-[1.5rem] text-center text-base ${langClass}`}>
              {interim || <span className="text-ink/30">…</span>}
            </p>
          </>
        )}

        {phase === 'processing' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Spinner className="h-8 w-8" />
            <p className="flex items-center gap-2 text-sm text-ink/60">
              <Sparkles size={16} className="text-civicblue" /> Gemini is translating &amp; extracting…
            </p>
          </div>
        )}

        {phase === 'result' && extraction && (
          <div className="w-full space-y-3">
            <div className="rounded-xl bg-black/[0.03] p-3">
              <div className="text-xs font-semibold uppercase text-ink/40">You said</div>
              <p className={`mt-1 text-sm ${langClass}`}>{transcript}</p>
            </div>
            <div className="rounded-xl bg-civicblue-light/60 p-3">
              <div className="text-xs font-semibold uppercase text-civicblue">English translation</div>
              <p className="mt-1 text-sm text-ink">{extraction.translation}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Field label="Category" value={extraction.extractedCategory ? categoryLabel(extraction.extractedCategory) : '—'} />
              <Field label="Severity" value={extraction.extractedSeverity ? `S${extraction.extractedSeverity}` : '—'} />
              <Field label="Location hint" value={extraction.extractedLocation ?? '—'} />
              <Field label="Confidence" value={`${Math.round(extraction.confidence * 100)}%`} />
            </div>
            {extraction.urgencyKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {extraction.urgencyKeywords.map((k) => (
                  <span key={k} className="rounded-full bg-warning-light px-2 py-0.5 text-xs font-medium text-warning">
                    ⚡ {k}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={startListening} className="flex-1">
                Re-record
              </Button>
              <Button
                onClick={() => onApply(extraction, transcript, language)}
                className="flex-1"
              >
                <Check size={16} /> Use this
              </Button>
            </div>
          </div>
        )}

        {note && <p className="text-center text-xs text-ink/40">{note}</p>}
      </div>
    </Modal>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-2 ring-1 ring-black/5">
      <div className="text-[10px] font-semibold uppercase text-ink/40">{label}</div>
      <div className="truncate text-sm font-medium">{value}</div>
    </div>
  )
}
