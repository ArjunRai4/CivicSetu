import { useState } from 'react'
import {
  Star,
  Zap,
  Contrast,
  RotateCcw,
  Languages,
  Globe,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Button, Card, SectionTitle } from '../../components/shared/ui'
import { Icon } from '../../components/shared/Icon'
import { LANGUAGE_META } from '../../utils/labels'
import { formatDate } from '../../utils/format'
import { reputationTier } from '../../services/gamificationRules'
import { SUPPORTED_UI_LANGUAGES, COMING_SOON_LANGUAGES } from '../../i18n'

export function Profile() {
  const { state, setLanguage, setDemoMode, setHighContrast, resetAll } = useApp()
  const c = state.activeCitizen
  const tier = reputationTier(c.reputationScore)
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="space-y-5">
      {/* header */}
      <Card className="p-5 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-saffron to-civicblue text-2xl font-black text-white">
          {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <h1 className="mt-3 text-xl font-extrabold">{c.name}</h1>
        <p className="text-sm text-ink/50">{c.ward}</p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-saffron-light px-3 py-1 text-sm font-bold text-saffron">
          <Star size={15} /> {tier.label} · {c.reputationScore} pts
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-saffron"
            style={{ width: `${Math.min(100, (c.reputationScore / tier.next) * 100)}%` }}
          />
        </div>
      </Card>

      {/* language */}
      <div>
        <SectionTitle className="mb-2 flex items-center gap-1.5">
          <Globe size={14} /> Preferred language
        </SectionTitle>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_UI_LANGUAGES.map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                c.preferredLanguage === l ? 'bg-saffron text-white' : 'bg-white text-ink/70 ring-1 ring-black/10'
              }`}
            >
              {LANGUAGE_META[l].native}
            </button>
          ))}
          {COMING_SOON_LANGUAGES.map((l) => (
            <span key={l} title="Coming soon" className="rounded-full bg-black/5 px-3 py-1.5 text-sm text-ink/30">
              {LANGUAGE_META[l].native}
            </span>
          ))}
        </div>
      </div>

      {/* earned badges */}
      <div>
        <SectionTitle className="mb-2">Earned badges ({c.badges.length})</SectionTitle>
        {c.badges.length === 0 ? (
          <p className="text-sm text-ink/40">No badges yet — file your first report!</p>
        ) : (
          <div className="space-y-2">
            {c.badges.map((b) => (
              <Card key={b.id} className="flex items-center gap-3 p-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-saffron text-white">
                  <Icon name={b.icon} size={20} />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-bold">{b.name}</div>
                  <div className="text-xs text-ink/50">{b.description}</div>
                </div>
                <div className="text-[11px] text-ink/40">{formatDate(b.earnedAt)}</div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* settings */}
      <div>
        <SectionTitle className="mb-2">Settings</SectionTitle>
        <Card className="divide-y divide-black/5">
          <ToggleRow
            icon={<Zap size={18} className="text-saffron" />}
            title="Demo Mode"
            subtitle="Speeds up SLAs & uses cached AI for reliable demos"
            value={state.demoMode}
            onChange={setDemoMode}
          />
          <ToggleRow
            icon={<Contrast size={18} className="text-civicblue" />}
            title="High contrast"
            subtitle="Stronger contrast for readability"
            value={state.highContrast}
            onChange={setHighContrast}
          />
          <div className="flex items-center gap-3 p-4">
            <Languages size={18} className="text-ink/50" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Voice languages used</div>
              <div className="text-xs text-ink/50">
                {(c.voiceLanguagesUsed ?? []).length
                  ? (c.voiceLanguagesUsed ?? []).map((l) => LANGUAGE_META[l].native).join(', ')
                  : 'None yet'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* reset */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <RotateCcw size={16} className="text-danger" /> Reset demo data
        </div>
        <p className="mt-1 text-xs text-ink/50">
          Restores the seeded issues, clusters and stats. Useful before a fresh demo run.
        </p>
        {confirmReset ? (
          <div className="mt-3 flex gap-2">
            <Button variant="danger" size="sm" className="flex-1" onClick={resetAll}>
              Yes, reset everything
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setConfirmReset(true)}>
            Reset
          </Button>
        )}
      </Card>

      <p className="pb-2 pt-1 text-center text-xs text-ink/30">
        CivicSetu · Vibe2Ship · Powered by Gemini on Google Cloud
      </p>
    </div>
  )
}

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onChange,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      {icon}
      <div className="flex-1">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-ink/50">{subtitle}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        aria-label={title}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${value ? 'bg-saffron' : 'bg-black/15'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${value ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}
