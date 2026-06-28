// Gentle Demo-Mode automation (spec §Things to fake): while Demo Mode is on,
// periodically add a simulated community verification to a ward issue so the
// community feed feels alive. Kept low-frequency + capped to avoid churn.
import { useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { IssueStatus } from '../../types'

export function DemoModeRunner() {
  const { state, dispatch } = useApp()
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (!state.demoMode) return
    let added = 0
    const timer = setInterval(() => {
      if (added >= 6) return
      const s = stateRef.current
      const candidates = s.issues.filter(
        (i) =>
          i.location.ward === s.activeCitizen.ward &&
          i.reportedBy !== s.activeCitizen.id &&
          i.status !== IssueStatus.RESOLVED &&
          i.verifications.length < 5,
      )
      if (candidates.length === 0) return
      const issue = candidates[Math.floor(Math.random() * candidates.length)]
      const others = s.citizens.filter((c) => c.id !== s.activeCitizen.id)
      const who = others[Math.floor(Math.random() * others.length)]
      dispatch({
        type: 'ADD_VERIFICATION',
        issueId: issue.id,
        verification: {
          citizenId: who.id,
          verifiedAt: Date.now(),
          confirmsExists: true,
        },
      })
      added += 1
    }, 9000)
    return () => clearInterval(timer)
  }, [state.demoMode, dispatch])

  return null
}
