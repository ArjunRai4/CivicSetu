// LocalStorage persistence (spec: key civicsetu_state_v1).
import { type AppState } from '../types'
import { STORAGE_KEY, seedInitialState } from '../data/seedState'

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppState
    // minimal shape guard
    if (!parsed || !Array.isArray(parsed.issues) || !parsed.activeCitizen) {
      return null
    }
    return parsed
  } catch (err) {
    console.warn('[CivicSetu] Failed to load state, reseeding.', err)
    return null
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.warn('[CivicSetu] Failed to save state.', err)
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

// Load existing state or seed a fresh one (and persist it).
export function loadOrSeed(): AppState {
  const existing = loadState()
  if (existing) return existing
  const fresh = seedInitialState()
  saveState(fresh)
  return fresh
}

export { STORAGE_KEY }
