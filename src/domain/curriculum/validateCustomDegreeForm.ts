import type { DynamicSemester } from './customDegreeForm'

export interface ValidateCustomDegreeFormInput {
  isSuggested: boolean
  universityName: string
  universityShort: string
  facultyName: string
  degreeName: string
  semesters: DynamicSemester[]
}

export type ValidateCustomDegreeFormResult =
  | { valid: true }
  | { valid: false; error: string }

export function validateCustomDegreeForm(
  input: ValidateCustomDegreeFormInput
): ValidateCustomDegreeFormResult {
  const {
    isSuggested,
    universityName,
    universityShort,
    facultyName,
    degreeName,
    semesters,
  } = input

  if (isSuggested) {
    if (!universityName.trim()) {
      return {
        valid: false,
        error: 'Please enter the full university name for suggestion.',
      }
    }
    if (!universityShort.trim()) {
      return {
        valid: false,
        error: 'Please enter the university abbreviation (e.g. SUSL).',
      }
    }
    if (!facultyName.trim()) {
      return {
        valid: false,
        error: 'Please enter the faculty name.',
      }
    }
  }

  if (!degreeName.trim()) {
    return {
      valid: false,
      error: 'Please enter a degree program name.',
    }
  }

  for (const sem of semesters) {
    if (sem.subjects.length === 0) {
      return {
        valid: false,
        error: `Please add at least one subject to ${sem.name}.`,
      }
    }

    for (let i = 0; i < sem.subjects.length; i++) {
      const sub = sem.subjects[i]
      const displayIdx = i + 1

      if (!sub.code.trim()) {
        return {
          valid: false,
          error: `Subject ${displayIdx} in ${sem.name} is missing a code.`,
        }
      }
      if (!sub.name.trim()) {
        return {
          valid: false,
          error: `Subject ${displayIdx} in ${sem.name} is missing a name.`,
        }
      }
      const parsedCredits = Number(sub.credits)
      if (isNaN(parsedCredits) || parsedCredits <= 0 || parsedCredits > 12) {
        return {
          valid: false,
          error: `Subject "${sub.code || displayIdx}" in ${sem.name} must have credits between 1 and 12.`,
        }
      }
    }
  }

  return { valid: true }
}
