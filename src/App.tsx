import { useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import { ToastHost } from './components/shared/ToastHost'
import { AgentWatcher, BadgeWatcher } from './components/shared/Watchers'
import { DemoModeRunner } from './components/shared/DemoModeRunner'
import { IntroScreen } from './components/layout/IntroScreen'
import { CitizenLayout } from './components/layout/CitizenLayout'
import { AuthorityLayout } from './components/layout/AuthorityLayout'

// Citizen screens
import { HomeMap } from './screens/citizen/HomeMap'
import { ReportFlow } from './screens/citizen/ReportFlow'
import { MyReports } from './screens/citizen/MyReports'
import { TicketDetail } from './screens/citizen/TicketDetail'
import { CommunityFeed } from './screens/citizen/CommunityFeed'
import { ImpactDashboard } from './screens/citizen/ImpactDashboard'
import { Profile } from './screens/citizen/Profile'

// Authority screens
import { AuthorityDashboard } from './screens/authority/Dashboard'
import { CitywideMap } from './screens/authority/CitywideMap'
import { ClustersList } from './screens/authority/ClustersList'
import { ClusterDetail } from './screens/authority/ClusterDetail'
import { AuthorityTicketDetail } from './screens/authority/AuthorityTicketDetail'
import { Analytics } from './screens/authority/Analytics'

function App() {
  const [entered, setEntered] = useState(
    () => sessionStorage.getItem('cs_entered') === '1',
  )

  function begin() {
    sessionStorage.setItem('cs_entered', '1')
    setEntered(true)
  }

  if (!entered) return <IntroScreen onBegin={begin} />

  return (
    <ToastProvider>
      <AppProvider>
        <AgentWatcher />
        <BadgeWatcher />
        <DemoModeRunner />
        <ToastHost />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/citizen/home" replace />} />

            <Route path="/citizen" element={<CitizenLayout />}>
              <Route index element={<Navigate to="/citizen/home" replace />} />
              <Route path="home" element={<HomeMap />} />
              <Route path="report" element={<ReportFlow />} />
              <Route path="reports" element={<MyReports />} />
              <Route path="reports/:id" element={<TicketDetail />} />
              <Route path="feed" element={<CommunityFeed />} />
              <Route path="impact" element={<ImpactDashboard />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="/authority" element={<AuthorityLayout />}>
              <Route index element={<Navigate to="/authority/dashboard" replace />} />
              <Route path="dashboard" element={<AuthorityDashboard />} />
              <Route path="map" element={<CitywideMap />} />
              <Route path="clusters" element={<ClustersList />} />
              <Route path="clusters/:id" element={<ClusterDetail />} />
              <Route path="tickets/:id" element={<AuthorityTicketDetail />} />
              <Route path="analytics" element={<Analytics />} />
            </Route>

            <Route path="*" element={<Navigate to="/citizen/home" replace />} />
          </Routes>
        </HashRouter>
      </AppProvider>
    </ToastProvider>
  )
}

export default App
