import {
  IssueCategory,
  IssueStatus,
  Severity,
  Language,
  type Department,
} from '../types'

// ---- Category metadata ------------------------------------------------------
export const CATEGORY_META: Record<
  IssueCategory,
  { label: string; icon: string; color: string; emoji: string }
> = {
  [IssueCategory.POTHOLE]: { label: 'Pothole', icon: 'Construction', color: '#b45309', emoji: '🕳️' },
  [IssueCategory.STREETLIGHT]: { label: 'Streetlight', icon: 'Lightbulb', color: '#ca8a04', emoji: '💡' },
  [IssueCategory.WATER_LEAK]: { label: 'Water leak', icon: 'Droplets', color: '#0284c7', emoji: '💧' },
  [IssueCategory.GARBAGE]: { label: 'Garbage', icon: 'Trash2', color: '#16a34a', emoji: '🗑️' },
  [IssueCategory.FALLEN_TREE]: { label: 'Fallen tree', icon: 'TreeDeciduous', color: '#15803d', emoji: '🌳' },
  [IssueCategory.BROKEN_SIGNAL]: { label: 'Broken signal', icon: 'TrafficCone', color: '#dc2626', emoji: '🚦' },
  [IssueCategory.EXPOSED_WIRING]: { label: 'Exposed wiring', icon: 'Zap', color: '#d97706', emoji: '⚡' },
  [IssueCategory.STRAY_ANIMAL]: { label: 'Stray animal', icon: 'Dog', color: '#9333ea', emoji: '🐕' },
  [IssueCategory.DRAINAGE]: { label: 'Drainage', icon: 'Waves', color: '#0891b2', emoji: '🌊' },
  [IssueCategory.OTHER]: { label: 'Other', icon: 'CircleHelp', color: '#6b7280', emoji: '❓' },
}

export function categoryLabel(c: IssueCategory): string {
  return CATEGORY_META[c]?.label ?? c
}

// ---- Status metadata --------------------------------------------------------
export const STATUS_META: Record<
  IssueStatus,
  { label: string; color: string; bg: string; markerColor: string }
> = {
  [IssueStatus.REPORTED]: { label: 'Reported', color: '#dc2626', bg: '#fee2e2', markerColor: '#dc2626' },
  [IssueStatus.ACKNOWLEDGED]: { label: 'Acknowledged', color: '#d97706', bg: '#fef3c7', markerColor: '#f59e0b' },
  [IssueStatus.DISPATCHED]: { label: 'Dispatched', color: '#2563eb', bg: '#dbeafe', markerColor: '#2563eb' },
  [IssueStatus.IN_PROGRESS]: { label: 'In progress', color: '#ca8a04', bg: '#fef9c3', markerColor: '#eab308' },
  [IssueStatus.RESOLVED]: { label: 'Resolved', color: '#16a34a', bg: '#dcfce7', markerColor: '#16a34a' },
  [IssueStatus.ESCALATED]: { label: 'Escalated', color: '#9333ea', bg: '#f3e8ff', markerColor: '#9333ea' },
}

export const STATUS_ORDER: IssueStatus[] = [
  IssueStatus.REPORTED,
  IssueStatus.ACKNOWLEDGED,
  IssueStatus.DISPATCHED,
  IssueStatus.IN_PROGRESS,
  IssueStatus.RESOLVED,
]

// ---- Severity metadata ------------------------------------------------------
export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; bg: string }
> = {
  [Severity.LOW]: { label: 'Low', color: '#16a34a', bg: '#dcfce7' },
  [Severity.MEDIUM]: { label: 'Medium', color: '#d97706', bg: '#fef3c7' },
  [Severity.HIGH]: { label: 'High', color: '#ea580c', bg: '#ffedd5' },
  [Severity.CRITICAL]: { label: 'Critical', color: '#dc2626', bg: '#fee2e2' },
}

export function severityLabel(s: Severity): string {
  return SEVERITY_META[s]?.label ?? String(s)
}

// ---- Language metadata ------------------------------------------------------
export const LANGUAGE_META: Record<
  Language,
  { label: string; native: string; speechCode: string }
> = {
  [Language.ENGLISH]: { label: 'English', native: 'English', speechCode: 'en-IN' },
  [Language.HINDI]: { label: 'Hindi', native: 'हिन्दी', speechCode: 'hi-IN' },
  [Language.TAMIL]: { label: 'Tamil', native: 'தமிழ்', speechCode: 'ta-IN' },
  [Language.BENGALI]: { label: 'Bengali', native: 'বাংলা', speechCode: 'bn-IN' },
  [Language.TELUGU]: { label: 'Telugu', native: 'తెలుగు', speechCode: 'te-IN' },
  [Language.MARATHI]: { label: 'Marathi', native: 'मराठी', speechCode: 'mr-IN' },
  [Language.KANNADA]: { label: 'Kannada', native: 'ಕನ್ನಡ', speechCode: 'kn-IN' },
}

// ---- Department display ------------------------------------------------------
export const DEPARTMENT_LABEL: Record<Department, string> = {
  PWD: 'PWD Bangalore Urban',
  BBMP_SANITATION: 'BBMP Sanitation',
  BESCOM: 'BESCOM',
  BWSSB: 'BWSSB',
  TRAFFIC_POLICE: 'Bengaluru Traffic Police',
  BBMP_PARKS: 'BBMP Parks & Forestry',
  BBMP_ANIMAL: 'BBMP Animal Welfare',
  OTHER: 'General Grievance Cell',
}
