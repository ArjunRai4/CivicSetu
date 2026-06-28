import { type Badge, type Citizen } from '../types'

// Points (spec §8 Gamification)
export const POINTS = {
  REPORT: 10,
  VERIFIED_REPORT_BONUS: 20,
  VERIFY_OTHER: 5,
  HELP_RESOLVE: 15,
}

export interface BadgeDef {
  id: string
  name: string
  description: string
  icon: string // lucide icon name
  earned: (c: Citizen) => boolean
}

// Badge catalogue (spec §8).
export const BADGE_DEFS: BadgeDef[] = [
  {
    id: 'first-report',
    name: 'First Report',
    description: 'Filed your first civic report',
    icon: 'Flag',
    earned: (c) => c.totalReports >= 1,
  },
  {
    id: 'eagle-eye',
    name: 'Eagle Eye',
    description: 'Reported 10 issues',
    icon: 'Eye',
    earned: (c) => c.totalReports >= 10,
  },
  {
    id: 'civic-champion',
    name: 'Civic Champion',
    description: 'Reported 50 issues',
    icon: 'Trophy',
    earned: (c) => c.totalReports >= 50,
  },
  {
    id: 'verifier-10x',
    name: 'Verifier 10x',
    description: 'Verified 10 reports from neighbours',
    icon: 'BadgeCheck',
    earned: (c) => c.totalVerifications >= 10,
  },
  {
    id: 'community-pillar',
    name: 'Community Pillar',
    description: 'Reached 100 reputation',
    icon: 'Award',
    earned: (c) => c.reputationScore >= 100,
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Used voice input in 2+ languages',
    icon: 'Languages',
    earned: (c) => (c.voiceLanguagesUsed?.length ?? 0) >= 2,
  },
]

// Recompute the earned-badge list for a citizen, preserving earnedAt when
// already present so the "new badge!" toast can detect freshly unlocked ones.
export function computeBadges(c: Citizen, now = Date.now()): Badge[] {
  const existing = new Map(c.badges.map((b) => [b.id, b]))
  const out: Badge[] = []
  for (const def of BADGE_DEFS) {
    if (def.earned(c)) {
      out.push(
        existing.get(def.id) ?? {
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          earnedAt: now,
        },
      )
    }
  }
  return out
}

// Returns badge ids newly earned in `after` that weren't in `before`.
export function newlyEarned(before: Badge[], after: Badge[]): Badge[] {
  const had = new Set(before.map((b) => b.id))
  return after.filter((b) => !had.has(b.id))
}

export function reputationTier(score: number): { label: string; next: number } {
  if (score >= 100) return { label: 'Community Pillar', next: 100 }
  if (score >= 75) return { label: 'Civic Leader', next: 100 }
  if (score >= 50) return { label: 'Active Advocate', next: 75 }
  if (score >= 25) return { label: 'Contributor', next: 50 }
  return { label: 'Newcomer', next: 25 }
}
