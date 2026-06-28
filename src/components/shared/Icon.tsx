// Curated dynamic-icon registry (keeps the bundle lean vs. a namespace import).
// Used for category + badge icons whose names come from data.
import {
  Construction,
  Lightbulb,
  Droplets,
  Trash2,
  TreeDeciduous,
  TrafficCone,
  Zap,
  Dog,
  Waves,
  CircleHelp,
  Flag,
  Eye,
  Trophy,
  BadgeCheck,
  Award,
  Languages,
  type LucideProps,
} from 'lucide-react'
import type { ComponentType } from 'react'

const REGISTRY: Record<string, ComponentType<LucideProps>> = {
  Construction,
  Lightbulb,
  Droplets,
  Trash2,
  TreeDeciduous,
  TrafficCone,
  Zap,
  Dog,
  Waves,
  CircleHelp,
  Flag,
  Eye,
  Trophy,
  BadgeCheck,
  Award,
  Languages,
}

export function Icon({
  name,
  ...props
}: { name: string } & LucideProps) {
  const Cmp = REGISTRY[name] ?? CircleHelp
  return <Cmp {...props} />
}
