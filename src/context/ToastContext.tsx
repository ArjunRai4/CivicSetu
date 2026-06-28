import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'

export interface Toast {
  id: string
  title: string
  detail?: string
  icon?: string // lucide icon name
  kind: 'agent' | 'badge' | 'info' | 'success'
}

interface ToastCtx {
  toasts: Toast[]
  showToast: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const showToast = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      setToasts((ts) => [...ts.slice(-3), { ...t, id }])
      timers.current[id] = setTimeout(() => dismiss(id), t.kind === 'badge' ? 6000 : 5000)
    },
    [dismiss],
  )

  return (
    <Ctx.Provider value={{ toasts, showToast, dismiss }}>{children}</Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useToast must be used within ToastProvider')
  return v
}
