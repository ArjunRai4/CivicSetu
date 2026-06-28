// Small shared UI primitives (buttons, cards, badges, pills, spinner).
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { IssueStatus, Severity } from '../../types'
import { STATUS_META, SEVERITY_META } from '../../utils/labels'

// ---- Button ----------------------------------------------------------------
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline'
const VARIANT: Record<Variant, string> = {
  primary: 'bg-saffron text-white hover:bg-saffron-dark shadow-sm',
  secondary: 'bg-civicblue text-white hover:bg-civicblue/90 shadow-sm',
  ghost: 'bg-transparent text-ink/70 hover:bg-black/5',
  danger: 'bg-danger text-white hover:bg-danger/90',
  success: 'bg-success text-white hover:bg-success/90',
  outline: 'bg-white text-ink border border-black/10 hover:bg-black/5',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

// ---- Card ------------------------------------------------------------------
export function Card({
  className = '',
  children,
  onClick,
}: {
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-white shadow-card ${onClick ? 'cursor-pointer transition hover:shadow-float' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

// ---- StatusBadge -----------------------------------------------------------
export function StatusBadge({ status, className = '' }: { status: IssueStatus; className?: string }) {
  const m = STATUS_META[status]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
      style={{ color: m.color, backgroundColor: m.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
      {m.label}
    </span>
  )
}

// ---- SeverityBadge ---------------------------------------------------------
export function SeverityBadge({ severity, className = '' }: { severity: Severity; className?: string }) {
  const m = SEVERITY_META[severity]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
      style={{ color: m.color, backgroundColor: m.bg }}
    >
      {m.label} · S{severity}
    </span>
  )
}

// ---- Pill ------------------------------------------------------------------
export function Pill({
  children,
  active = false,
  onClick,
  className = '',
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
        active
          ? 'bg-saffron text-white'
          : 'bg-white text-ink/70 ring-1 ring-black/10 hover:bg-black/5'
      } ${className}`}
    >
      {children}
    </button>
  )
}

// ---- Spinner / loading dots ------------------------------------------------
export function LoadingDots({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink/60">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-saffron"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      {label}
    </span>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-saffron/30 border-t-saffron ${className}`}
    />
  )
}

// ---- Section heading -------------------------------------------------------
export function SectionTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-sm font-bold uppercase tracking-wide text-ink/50 ${className}`}>
      {children}
    </h2>
  )
}

// ---- KPI stat --------------------------------------------------------------
export function Stat({
  value,
  label,
  accent = 'var(--color-saffron)',
}: {
  value: ReactNode
  label: string
  accent?: string
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="text-2xl font-extrabold" style={{ color: accent }}>
        {value}
      </div>
      <div className="mt-1 text-xs font-medium text-ink/55">{label}</div>
    </div>
  )
}
