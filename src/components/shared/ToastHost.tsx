import { useToast } from '../../context/ToastContext'
import { Sparkles, Award, CheckCircle2, Info, X } from 'lucide-react'

const KIND_STYLE = {
  agent: { ring: 'ring-civicblue/30', bg: 'bg-civicblue', Icon: Sparkles },
  badge: { ring: 'ring-saffron/40', bg: 'bg-saffron', Icon: Award },
  success: { ring: 'ring-success/30', bg: 'bg-success', Icon: CheckCircle2 },
  info: { ring: 'ring-black/10', bg: 'bg-ink', Icon: Info },
} as const

export function ToastHost() {
  const { toasts, dismiss } = useToast()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[80] flex flex-col items-center gap-2 px-3 sm:items-end sm:pr-4">
      {toasts.map((t) => {
        const s = KIND_STYLE[t.kind]
        const I = s.Icon
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-white p-3 shadow-float ring-1 ${s.ring} animate-fade-up`}
          >
            <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${s.bg} text-white`}>
              <I size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold leading-snug">{t.title}</div>
              {t.detail && <div className="mt-0.5 text-xs text-ink/60">{t.detail}</div>}
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded-md p-1 text-ink/40 hover:bg-black/5" aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
