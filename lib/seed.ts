// Run this once to seed requirement profiles:
// npx ts-node -e "import('./lib/seed').then(m => m.seed())"
// Or paste into Supabase SQL editor using the schema.sql INSERT statements.

export const SEED_PROFILES = [
  {
    university_name: "University of Leicester",
    track_name: "Humanities",
    min_award: 3,
    min_det: 120,
    min_maths: 4,
    min_sci: 4,
    min_arabic: 3,
    min_english: 3,
    min_lss: 3,
  },
  {
    university_name: "University of Leicester",
    track_name: "STEM International",
    min_award: 3,
    min_det: 95,
    min_maths: 3,
    min_sci: 3,
    min_arabic: 3,
    min_english: 3,
    min_lss: 3,
  },
  {
    university_name: "Cambridge PACE",
    track_name: "English as a Second Language",
    min_award: 1,
    min_det: 0,
    min_maths: 1,
    min_sci: 1,
    min_arabic: 1,
    min_english: 3,
    min_lss: 1,
  },
];
