import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Home, Users, BarChart3, User, Camera } from 'lucide-react'
import { TopBar } from './TopBar'

const NAV = [
  { to: '/citizen/home', label: 'Home', icon: Home },
  { to: '/citizen/feed', label: 'Feed', icon: Users },
  { to: '/citizen/report', label: 'Report', icon: Camera, primary: true },
  { to: '/citizen/impact', label: 'Impact', icon: BarChart3 },
  { to: '/citizen/profile', label: 'Profile', icon: User },
]

export function CitizenLayout() {
  const loc = useLocation()
  // The report flow + map are full-bleed; other screens get the padded column.
  const fullBleed = loc.pathname.startsWith('/citizen/report') || loc.pathname === '/citizen/home'

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <TopBar view="CITIZEN" />
      <main className="relative mx-auto w-full max-w-[480px] flex-1 overflow-y-auto thin-scroll pb-20">
        <div className={fullBleed ? 'h-full' : 'p-4'}>
          <Outlet />
        </div>
      </main>

      {/* bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex h-16 w-full max-w-[480px] items-center justify-around border-t border-black/5 bg-white/95 backdrop-blur">
        {NAV.map(({ to, label, icon: Icon, primary }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 ${
                primary
                  ? '-mt-6'
                  : isActive
                    ? 'text-saffron'
                    : 'text-ink/45'
              }`
            }
          >
            {({ isActive }) =>
              primary ? (
                <span className="grid h-14 w-14 place-items-center rounded-full bg-saffron text-white shadow-float ring-4 ring-canvas">
                  <Icon size={24} />
                </span>
              ) : (
                <>
                  <Icon size={22} className={isActive ? 'text-saffron' : ''} />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )
            }
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
