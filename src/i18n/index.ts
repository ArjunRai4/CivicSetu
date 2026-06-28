import { Language } from '../types'
import en, { type Strings } from './en'
import hi from './hi'

const dicts: Partial<Record<Language, Strings>> = {
  [Language.ENGLISH]: en,
  [Language.HINDI]: hi,
}

// Returns the dictionary for a language, falling back to English.
// Other regional languages are "coming soon" (spec build priority #6).
export function strings(lang: Language): Strings {
  return dicts[lang] ?? en
}

export const SUPPORTED_UI_LANGUAGES = [Language.ENGLISH, Language.HINDI]

export const COMING_SOON_LANGUAGES = [
  Language.TAMIL,
  Language.BENGALI,
  Language.TELUGU,
  Language.MARATHI,
  Language.KANNADA,
]

export type { Strings }
export { en, hi }
