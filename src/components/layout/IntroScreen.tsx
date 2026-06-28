import { useEffect } from 'react'
import { Sparkles, Camera, Building2, ArrowRight } from 'lucide-react'

// Title / problem screen (demo 0:00–0:20). SPACE or button to begin.
export function IntroScreen({ onBegin }: { onBegin: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        onBegin()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBegin])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-saffron via-[#e06b1a] to-civicblue px-6 text-center text-white">
      <div className="animate-fade-up">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-white/15 text-4xl font-black backdrop-blur">
          से
        </div>
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">CivicSetu</h1>
        <p className="mt-3 text-lg font-medium text-white/90 sm:text-2xl">
          From one photo to action — your AI agent for civic problems.
        </p>

        <p className="mx-auto mt-6 max-w-xl text-sm text-white/80 sm:text-base">
          Indian civic issues get reported, then forgotten. CivicSetu turns a single
          photo into multiple routed complaints, predicts which will worsen, spots
          street-level patterns, and follows up with authorities autonomously.
        </p>

        <div className="mx-auto mt-8 flex max-w-md flex-wrap items-center justify-center gap-3 text-xs text-white/85">
          <Chip icon={<Camera size={14} />} text="Multi-issue vision" />
          <Chip icon={<Sparkles size={14} />} text="Predictive reasoning" />
          <Chip icon={<Building2 size={14} />} text="Auto-dispatch + escalation" />
        </div>

        <button
          onClick={onBegin}
          className="mx-auto mt-10 flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-saffron shadow-float transition hover:scale-[1.02] active:scale-95"
        >
          Enter CivicSetu <ArrowRight size={18} />
        </button>
        <p className="mt-4 text-xs text-white/60">or press SPACE</p>
      </div>
    </div>
  )
}

function Chip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 font-medium backdrop-blur">
      {icon} {text}
    </span>
  )
}
