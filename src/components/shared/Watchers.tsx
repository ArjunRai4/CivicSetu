// Invisible components that auto-surface state changes as toasts:
//  • AgentWatcher  — every autonomous FN1–FN4 call becomes a visible toast.
//  • BadgeWatcher  — newly earned gamification badges pop a celebratory toast.
import { useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

export function AgentWatcher() {
  const { state } = useApp()
  const { showToast } = useToast()
  const seen = useRef<Set<string>>(new Set(state.agentLog.map((e) => e.id)))
  const mounted = useRef(false)

  useEffect(() => {
    // skip the very first run (existing seed entries)
    if (!mounted.current) {
      mounted.current = true
      return
    }
    for (const e of state.agentLog) {
      if (!seen.current.has(e.id)) {
        seen.current.add(e.id)
        showToast({ kind: 'agent', title: 'AI agent acted', detail: e.message })
      }
    }
  }, [state.agentLog, showToast])

  return null
}

export function BadgeWatcher() {
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const seen = useRef<Set<string>>(new Set(state.activeCitizen.badges.map((b) => b.id)))
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    for (const b of state.activeCitizen.badges) {
      if (!seen.current.has(b.id)) {
        seen.current.add(b.id)
        showToast({ kind: 'badge', title: `Badge unlocked: ${b.name}`, detail: b.description })
        dispatch({
          type: 'ADD_NOTIFICATION',
          notification: {
            id: `notif-badge-${b.id}-${Date.now()}`,
            type: 'ACHIEVEMENT',
            message: `You earned the "${b.name}" badge!`,
            createdAt: Date.now(),
            read: false,
          },
        })
      }
    }
  }, [state.activeCitizen.badges, showToast, dispatch])

  return null
}
