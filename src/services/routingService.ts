// AP3 — Department routing (rule-based, no Gemini call). Maps IssueCategory →
// Authority via handlesCategories, tie-broken by jurisdiction/ward match.
import { type Authority, IssueCategory } from '../types'
import { DEFAULT_AUTHORITY_ID } from '../data/mockData/authorities'

function jurisdictionMatchesWard(auth: Authority, ward: string): boolean {
  if (!ward) return false
  const j = auth.jurisdiction.toLowerCase()
  // crude token overlap: ward "Indiranagar Ward 80" -> token "indiranagar"
  const wardToken = ward.split(' ')[0].toLowerCase()
  return j.includes(wardToken)
}

export function findAuthority(
  category: IssueCategory,
  ward: string,
  authorities: Authority[],
): Authority {
  const candidates = authorities.filter((a) =>
    a.handlesCategories.includes(category),
  )
  if (candidates.length === 0) {
    return (
      authorities.find((a) => a.id === DEFAULT_AUTHORITY_ID) ?? authorities[0]
    )
  }
  if (candidates.length === 1) return candidates[0]
  // Prefer a jurisdiction that matches the ward.
  const byWard = candidates.find((a) => jurisdictionMatchesWard(a, ward))
  if (byWard) return byWard
  // Else prefer the fastest-responding candidate (best service).
  return candidates.slice().sort((a, b) => a.avgResponseTimeHours - b.avgResponseTimeHours)[0]
}

export function findAuthorityId(
  category: IssueCategory,
  ward: string,
  authorities: Authority[],
): string {
  return findAuthority(category, ward, authorities).id
}
