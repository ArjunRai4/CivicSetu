import {
  Send,
  PhoneCall,
  Radar,
  FileText,
  ScanSearch,
  TrendingUp,
  Sparkles,
  X,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { useApp } from '../../context/AppContext'
import { aiStatus } from '../../services/geminiService'
import { relativeTime } from '../../utils/format'
import type { AgentLogEntry } from '../../types'
import type { LucideProps } from 'lucide-react'

const FN_META: Record<AgentLogEntry['fn'], { Icon: ComponentType<LucideProps>; color: string; label: string }> = {
  dispatchToAuthority: { Icon: Send, color: '#2563eb', label: 'Dispatch' },
  escalateAfterDays: { Icon: PhoneCall, color: '#9333ea', label: 'Escalation' },
  verifyClusterPattern: { Icon: Radar, color: '#d97706', label: 'Pattern' },
  generateImpactReport: { Icon: FileText, color: '#16a34a', label: 'Impact' },
  detectIssues: { Icon: ScanSearch, color: '#0891b2', label: 'Vision' },
  predictWorsening: { Icon: TrendingUp, color: '#dc2626', label: 'Forecast' },
}

export function AgentActivityLog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useApp()
  const live = aiStatus() === 'live'
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-float animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-civicblue" />
            <div>
              <div className="font-bold">AI Activity Log</div>
              <div className="text-xs text-ink/50">
                Autonomous actions taken on your behalf
              </div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-ink/50 hover:bg-black/5">
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-black/5 px-5 py-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              live ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-success' : 'bg-warning'}`} />
            {live ? 'Gemini live' : 'Cached responses (demo-safe)'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll p-4">
          {state.agentLog.length === 0 ? (
            <p className="mt-10 text-center text-sm text-ink/40">No AI actions yet.</p>
          ) : (
            <ol className="space-y-3">
              {state.agentLog.map((e) => {
                const m = FN_META[e.fn]
                const I = m.Icon
                return (
                  <li key={e.id} className="flex gap-3">
                    <div
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white"
                      style={{ backgroundColor: m.color }}
                    >
                      <I size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm leading-snug text-ink">{e.message}</div>
                      <div className="mt-0.5 text-xs text-ink/40">
                        {m.label} · {relativeTime(e.at)}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
