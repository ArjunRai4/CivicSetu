import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Map, Radar, BarChart3 } from 'lucide-react'
import { TopBar } from './TopBar'
import { useApp } from '../../context/AppContext'

const NAV = [
  { to: '/authority/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/authority/map', label: 'Citywide Map', icon: Map },
  { to: '/authority/clusters', label: 'Clusters', icon: Radar },
  { to: '/authority/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AuthorityLayout() {
  const { state, authorityById, setActiveAuthority } = useApp()
  const active = authorityById(state.activeAuthorityId)

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <TopBar view="AUTHORITY" />
      <div className="flex flex-1 overflow-hidden">
        {/* sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-black/5 bg-white md:flex">
          <div className="border-b border-black/5 p-4">
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink/40">Signed in as</div>
            <select
              value={state.activeAuthorityId}
              onChange={(e) => setActiveAuthority(e.target.value)}
              className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm font-semibold"
            >
              {state.authorities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.shortName}
                </option>
              ))}
            </select>
            {active && (
              <div className="mt-2 text-xs text-ink/50">
                {active.officer.name} · {active.officer.title}
              </div>
            )}
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'bg-saffron text-white' : 'text-ink/70 hover:bg-black/5'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* mobile top tabs */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex gap-1 overflow-x-auto border-b border-black/5 bg-white px-2 py-1.5 md:hidden thin-scroll">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                    isActive ? 'bg-saffron text-white' : 'text-ink/60'
                  }`
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </div>
          <main className="flex-1 overflow-y-auto thin-scroll p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
