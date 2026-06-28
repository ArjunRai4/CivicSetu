// Speech recognition wrapper around the Web Speech API (spec EC4).
// Falls back gracefully where unsupported (Firefox) — the UI offers a cached
// demo transcript path in that case.

type SpeechRecognitionCtor = new () => any

function getCtor(): SpeechRecognitionCtor | null {
  const w = window as any
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function speechRecognitionSupported(): boolean {
  return getCtor() !== null
}

export interface RecognitionHandle {
  stop: () => void
  abort: () => void
}

export interface RecognitionOptions {
  langCode: string // e.g. 'hi-IN'
  onInterim?: (text: string) => void
  onFinal?: (text: string) => void
  onError?: (err: string) => void
  onEnd?: () => void
}

export function startRecognition(opts: RecognitionOptions): RecognitionHandle {
  const Ctor = getCtor()
  if (!Ctor) {
    opts.onError?.('not-supported')
    return { stop: () => {}, abort: () => {} }
  }
  const rec = new Ctor()
  rec.lang = opts.langCode
  rec.interimResults = true
  rec.continuous = false
  rec.maxAlternatives = 1

  let finalText = ''
  rec.onresult = (event: any) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i]
      if (r.isFinal) finalText += r[0].transcript
      else interim += r[0].transcript
    }
    if (interim) opts.onInterim?.(interim)
    if (finalText) opts.onFinal?.(finalText.trim())
  }
  rec.onerror = (e: any) => opts.onError?.(e.error ?? 'error')
  rec.onend = () => opts.onEnd?.()

  try {
    rec.start()
  } catch (e) {
    opts.onError?.(String(e))
  }
  return {
    stop: () => {
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    },
    abort: () => {
      try {
        rec.abort()
      } catch {
        /* ignore */
      }
    },
  }
}
