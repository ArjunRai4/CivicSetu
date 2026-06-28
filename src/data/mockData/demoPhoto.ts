// The single curated demo photo + its location (spec §Mock Data demoPhoto.ts).
import { DEMO_STREET_PHOTO } from './photos'
import { DEMO_WARD, DEMO_CITY, WARDS } from './ward'
import { type GeoLocation } from '../../types'

export { DEMO_STREET_PHOTO }

export const DEMO_LOCATION: GeoLocation = {
  lat: WARDS[DEMO_WARD].center.lat + 0.0021,
  lng: WARDS[DEMO_WARD].center.lng - 0.0015,
  address: '100 Feet Road, near Indiranagar Metro Station',
  ward: DEMO_WARD,
  city: DEMO_CITY,
}

// Hindi sample transcript for the multilingual voice demo (EC4).
export const DEMO_VOICE_TRANSCRIPT_HI =
  'मेट्रो स्टेशन के पास बड़ा गड्ढा है, दो हफ्ते से ऐसे ही पड़ा है। कृपया तुरंत किसी को भेजिए।'
