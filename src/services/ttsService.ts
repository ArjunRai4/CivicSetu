// Text-to-speech wrapper around the Web SpeechSynthesis API (spec EC5 / AP8).
// Real browser synthesis — used for the AI advocate escalation voicemail and
// the "Read aloud" buttons on complaint letters.

export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

let cachedVoices: SpeechSynthesisVoice[] = []
function loadVoices(): SpeechSynthesisVoice[] {
  if (!ttsSupported()) return []
  const v = window.speechSynthesis.getVoices()
  if (v.length) cachedVoices = v
  return cachedVoices
}

// Prime the voice list (some browsers populate asynchronously).
if (ttsSupported()) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = () => loadVoices()
}

function pickVoice(langCode: string): SpeechSynthesisVoice | undefined {
  const voices = loadVoices()
  // exact match (e.g. en-IN), then language prefix (en), then default.
  return (
    voices.find((v) => v.lang.toLowerCase() === langCode.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(langCode.split('-')[0])) ??
    voices.find((v) => v.default) ??
    voices[0]
  )
}

export interface SpeakHandle {
  cancel: () => void
}

export interface SpeakOptions {
  text: string
  langCode?: string // e.g. 'en-IN', 'hi-IN'
  rate?: number
  pitch?: number
  onStart?: () => void
  onEnd?: () => void
  onWord?: (charIndex: number) => void
}

export function speak(opts: SpeakOptions): SpeakHandle {
  if (!ttsSupported()) {
    // Graceful no-op with simulated timing so callers' UIs still flow.
    opts.onStart?.()
    const t = setTimeout(() => opts.onEnd?.(), 2500)
    return { cancel: () => clearTimeout(t) }
  }
  const synth = window.speechSynthesis
  synth.cancel() // stop anything in flight
  const u = new SpeechSynthesisUtterance(opts.text)
  const voice = pickVoice(opts.langCode ?? 'en-IN')
  if (voice) u.voice = voice
  u.lang = opts.langCode ?? 'en-IN'
  u.rate = opts.rate ?? 1
  u.pitch = opts.pitch ?? 1
  u.onstart = () => opts.onStart?.()
  u.onend = () => opts.onEnd?.()
  u.onboundary = (e) => opts.onWord?.(e.charIndex)
  // Safari/Chrome sometimes need a tick before speaking.
  setTimeout(() => synth.speak(u), 60)
  return { cancel: () => synth.cancel() }
}

export function cancelSpeech(): void {
  if (ttsSupported()) window.speechSynthesis.cancel()
}
