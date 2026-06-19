export type PerformanceLevel = 1 | 2 | 3 | 4;

export const PERFORMANCE_LABELS: Record<PerformanceLevel, string> = {
  4: "Outstanding",
  3: "Exceeds expectations",
  2: "Meets expectations",
  1: "Does not yet meet expectations",
};

export const PERFORMANCE_LABELS_SHORT: Record<PerformanceLevel, string> = {
  4: "Outstanding",
  3: "Exceeds",
  2: "Meets",
  1: "Doesn't meet",
};

export const AWARD_LEVELS = [
  { value: 3, label: "Distinction award" },
  { value: 2, label: "Advanced achievement award" },
  { value: 1, label: "Secondary achievement award" },
] as const;

export type AwardValue = 1 | 2 | 3;

export const AWARD_LABELS: Record<AwardValue, string> = {
  3: "Distinction award",
  2: "Advanced achievement award",
  1: "Secondary achievement award",
};

export const SUBJECTS = [
  { key: "maths",   label: "Applicable Maths" },
  { key: "sci",     label: "Scientific Thinking" },
  { key: "arabic",  label: "Arabic" },
  { key: "english", label: "English" },
  { key: "lss",     label: "Life Skills" },
] as const;

export type SubjectKey = (typeof SUBJECTS)[number]["key"];

export interface University {
  id: string;
  name: string;
  created_at: string;
}

export interface RequirementProfile {
  id: string;
  university_id: string;
  track_name: string;
  min_award: AwardValue;
  min_det: number;
  min_maths: PerformanceLevel;
  min_sci: PerformanceLevel;
  min_arabic: PerformanceLevel;
  min_english: PerformanceLevel;
  min_lss: PerformanceLevel;
  created_at: string;
  universities?: { name: string };
}

export interface Student {
  id: string;
  student_code: string;
  name: string;
  award_level: AwardValue;
  det_score: number;
  maths: PerformanceLevel;
  sci: PerformanceLevel;
  arabic: PerformanceLevel;
  english: PerformanceLevel;
  lss: PerformanceLevel;
  created_at: string;
}

export interface AdvisorNote {
  id: string;
  student_id: string;
  profile_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export type EligibilityStatus = "recommended" | "negotiable" | "ineligible";

export interface SubjectResult {
  key: SubjectKey;
  label: string;
  studentVal: PerformanceLevel;
  requiredVal: PerformanceLevel;
  gap: number;
  counted: boolean;
}

export interface EligibilityResult {
  status: EligibilityStatus;
  score: number;
  awardGap: number;
  detGap: number;
  subjects: SubjectResult[];
}

export function computeEligibility(
  student: Student,
  profile: RequirementProfile
): EligibilityResult {
  const awardGap = student.award_level - profile.min_award;
  const detGap = student.det_score - profile.min_det;

  const subjects: SubjectResult[] = SUBJECTS.map(({ key, label }) => {
    const studentVal = student[key as SubjectKey];
    const requiredVal = profile[`min_${key}` as keyof RequirementProfile] as PerformanceLevel;
    const counted = requiredVal > 1;
    const gap = counted ? studentVal - requiredVal : 0;
    return { key, label, studentVal, requiredVal, gap, counted };
  });

  const detContribution = detGap < 0 ? detGap * 0.08 : 0;
  const subjectSum = subjects.reduce((sum, s) => sum + s.gap, 0);
  const score = awardGap * 6 + detContribution + subjectSum;

  let status: EligibilityStatus;
  if (score >= 0) {
    status = "recommended";
  } else if (score >= -5) {
    status = "negotiable";
  } else {
    status = "ineligible";
  }

  return { status, score, awardGap, detGap, subjects };
}

export const STATUS_CONFIG: Record<
  EligibilityStatus,
  { label: string; bg: string; text: string; border: string; dot: string; barBg: string }
> = {
  recommended: {
    label: "Recommended",
    bg: "bg-[#EAF5EF]",
    text: "text-[#2D7D5A]",
    border: "border-[#2D7D5A]",
    dot: "bg-[#2D7D5A]",
    barBg: "bg-[#2D7D5A]",
  },
  negotiable: {
    label: "Negotiable",
    bg: "bg-[#FFF5E0]",
    text: "text-[#C07400]",
    border: "border-[#C07400]",
    dot: "bg-[#C07400]",
    barBg: "bg-[#C07400]",
  },
  ineligible: {
    label: "Not eligible",
    bg: "bg-[#FAEAEA]",
    text: "text-[#B03030]",
    border: "border-[#B03030]",
    dot: "bg-[#B03030]",
    barBg: "bg-[#B03030]",
  },
};
