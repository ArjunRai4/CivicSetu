import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Sparkles,
  ChevronDown,
  User,
  Building2,
  Zap,
  Check,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { AgentActivityLog } from '../agent/AgentActivityLog'
import { relativeTime } from '../../utils/format'

export function TopBar({ view }: { view: 'CITIZEN' | 'AUTHORITY' }) {
  const { state, setView, setDemoMode, markNotificationsRead } = useApp()
  const navigate = useNavigate()
  const [showNotif, setShowNotif] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [showViewMenu, setShowViewMenu] = useState(false)

  const unread = state.notifications.filter((n) => !n.read).length

  function switchView(v: 'CITIZEN' | 'AUTHORITY') {
    setView(v)
    setShowViewMenu(false)
    navigate(v === 'CITIZEN' ? '/citizen/home' : '/authority/dashboard')
  }

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-black/5 bg-white/90 px-3 backdrop-blur sm:px-5">
        {/* brand */}
        <button
          onClick={() => navigate(view === 'CITIZEN' ? '/citizen/home' : '/authority/dashboard')}
          className="flex items-center gap-2"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-saffron text-base font-black text-white">
            से
          </span>
          <div className="text-left leading-none">
            <div className="text-base font-extrabold text-ink">CivicSetu</div>
            <div className="hidden text-[10px] text-ink/40 sm:block">From one photo to action</div>
          </div>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Demo Mode */}
          <button
            onClick={() => setDemoMode(!state.demoMode)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold transition ${
              state.demoMode ? 'bg-saffron text-white' : 'bg-black/5 text-ink/60'
            }`}
            title="Speeds up time-based features and uses cached AI for a reliable demo"
          >
            <Zap size={14} />
            <span className="hidden sm:inline">Demo</span>
          </button>

          {/* AI activity */}
          <button
            onClick={() => setShowActivity(true)}
            className="relative rounded-full p-2 text-civicblue hover:bg-black/5"
            aria-label="AI activity log"
            title="AI activity log"
          >
            <Sparkles size={18} />
            {state.agentLog.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-civicblue px-1 text-[9px] font-bold text-white">
                {state.agentLog.length}
              </span>
            )}
          </button>

          {/* notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotif((v) => !v)
                if (!showNotif) markNotificationsRead()
              }}
              className="relative rounded-full p-2 text-ink/60 hover:bg-black/5"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
            {showNotif && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
                <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-float ring-1 ring-black/5">
                  <div className="border-b border-black/5 px-4 py-2.5 text-sm font-bold">Notifications</div>
                  <div className="max-h-80 overflow-y-auto thin-scroll">
                    {state.notifications.length === 0 ? (
                      <p className="p-4 text-sm text-ink/40">Nothing yet.</p>
                    ) : (
                      state.notifications.slice(0, 12).map((n) => (
                        <div key={n.id} className="flex flex-col gap-0.5 border-b border-black/5 px-4 py-2.5 last:border-0">
                          <span className="text-sm text-ink">{n.message}</span>
                          <span className="text-xs text-ink/40">{relativeTime(n.createdAt)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* view toggle */}
          <div className="relative">
            <button
              onClick={() => setShowViewMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-full bg-civicblue px-2.5 py-1.5 text-xs font-semibold text-white"
            >
              {view === 'CITIZEN' ? <User size={14} /> : <Building2 size={14} />}
              <span className="hidden sm:inline">{view === 'CITIZEN' ? 'Citizen' : 'Authority'}</span>
              <ChevronDown size={14} />
            </button>
            {showViewMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowViewMenu(false)} />
                <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl bg-white shadow-float ring-1 ring-black/5">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-ink/40">View as</div>
                  <ViewItem icon={<User size={16} />} label="Citizen" active={view === 'CITIZEN'} onClick={() => switchView('CITIZEN')} />
                  <ViewItem icon={<Building2 size={16} />} label="Authority" active={view === 'AUTHORITY'} onClick={() => switchView('AUTHORITY')} />
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <AgentActivityLog open={showActivity} onClose={() => setShowActivity(false)} />
    </>
  )
}

function ViewItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-black/5 ${active ? 'font-bold text-saffron' : 'text-ink'}`}
    >
      <span className="flex items-center gap-2">{icon}{label}</span>
      {active && <Check size={16} />}
    </button>
  )
}
