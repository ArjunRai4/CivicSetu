import { type Citizen, Language } from '../../types'
import { mulberry32, pick, randInt } from '../../utils/rng'
import { computeBadges } from '../../services/gamificationRules'

const WARD_POOL = [
  'Indiranagar Ward 80',
  'Koramangala Ward 68',
  'Whitefield Ward 84',
  'Jayanagar Ward 169',
  'HSR Layout Ward 174',
  'Malleshwaram Ward 45',
]

const LANG_POOL = [
  Language.ENGLISH,
  Language.HINDI,
  Language.KANNADA,
  Language.TAMIL,
  Language.TELUGU,
  Language.MARATHI,
  Language.BENGALI,
]

const FIRST = [
  'Arjun', 'Priya', 'Ramesh', 'Sneha', 'Vikram', 'Anjali', 'Karthik', 'Divya',
  'Rohan', 'Meera', 'Suresh', 'Pooja', 'Aditya', 'Kavya', 'Manoj', 'Nisha',
  'Rahul', 'Shruti', 'Ganesh', 'Lakshmi', 'Imran', 'Fatima', 'Joseph', 'Grace',
  'Deepak', 'Reshma', 'Naveen', 'Ananya', 'Sanjay', 'Tara',
]
const LAST = [
  'Sharma', 'Rao', 'Kumar', 'Reddy', 'Nair', 'Iyer', 'Gowda', 'Shetty',
  'Hegde', 'Naik', 'Menon', 'Pai', 'Desai', 'Bhat', 'Murthy',
]

function buildCitizen(i: number, rnd: () => number): Citizen {
  const name = `${FIRST[i % FIRST.length]} ${pick(LAST, rnd)}`
  const totalReports = randInt(0, 28, rnd)
  const totalResolved = Math.floor(totalReports * (0.4 + rnd() * 0.5))
  const totalVerifications = randInt(0, 22, rnd)
  const reputationScore = Math.min(
    100,
    totalReports * 3 + totalVerifications * 2 + randInt(0, 15, rnd),
  )
  const c: Citizen = {
    id: `cit-${i}`,
    name,
    preferredLanguage: pick(LANG_POOL, rnd),
    ward: pick(WARD_POOL, rnd),
    totalReports,
    totalResolved,
    totalVerifications,
    reputationScore,
    badges: [],
    voiceLanguagesUsed: [],
  }
  c.badges = computeBadges(c)
  return c
}

const rnd = mulberry32(20260628)

// citizens[0] is the active demo citizen — Arjun Sharma, Hindi, Indiranagar.
const demoCitizen: Citizen = {
  id: 'cit-0',
  name: 'Arjun Sharma',
  preferredLanguage: Language.HINDI,
  ward: 'Indiranagar Ward 80',
  totalReports: 9,
  totalResolved: 6,
  totalVerifications: 11,
  reputationScore: 64,
  badges: [],
  voiceLanguagesUsed: [Language.ENGLISH],
}
demoCitizen.badges = computeBadges(demoCitizen)

// A standout contributor referenced in the impact narrative (Ramesh K.).
const rameshIndex = 2
const built: Citizen[] = [demoCitizen]
for (let i = 1; i < 30; i++) {
  const c = buildCitizen(i, rnd)
  if (i === rameshIndex) {
    c.name = 'Ramesh K.'
    c.ward = 'Indiranagar Ward 80'
    c.totalReports = 14
    c.totalResolved = 11
    c.totalVerifications = 18
    c.reputationScore = 88
    c.badges = computeBadges(c)
  }
  built.push(c)
}

export const CITIZENS: Citizen[] = built
export const DEMO_CITIZEN_ID = 'cit-0'
export const TOP_CONTRIBUTOR_NAME = 'Ramesh K.'
