import { calculateSemesterGpa } from '../domain/gpa/calculateSemesterGpa'
import { validateElectiveCredits } from '../domain/curriculum/validateElectiveCredits'
import type { Subject, GPAEntry, Timestamp } from '../data/types'

export interface PrepareSemesterEntryInput {
  semester: string
  subjects: Subject[]
  electives: Subject[]
  grades: Record<string, string>
  electiveCreditsRequired: number
  university: string
  faculty: string
  degree: string
  createdAt?: Timestamp
}

/**
 * Shared logic to prepare a GPAEntry by checking core/elective rules,
 * calculating the semester GPA, and deriving draft status.
 */
export function prepareSemesterEntry(input: PrepareSemesterEntryInput): GPAEntry {
  const {
    semester,
    subjects,
    electives,
    grades,
    electiveCreditsRequired,
    university,
    faculty,
    degree,
    createdAt,
  } = input

  // 1. Calculate selected elective credits
  const selectedElectiveCredits = electives
    .filter((elective) => grades[elective.code])
    .reduce((sum, elective) => sum + elective.credits, 0)

  // 2. Validate using the domain rules
  const { allCoreGradesSelected, isElectiveCreditValid } = validateElectiveCredits(
    subjects,
    grades,
    selectedElectiveCredits,
    electiveCreditsRequired
  )

  const isDraft = !(allCoreGradesSelected && isElectiveCreditValid)

  // 3. Calculate GPA
  const gpa = calculateSemesterGpa(subjects, electives, grades)

  // Credits reflect the semester's required load (core + electiveCreditsRequired),
  // not the credits actually selected so far — this keeps the value stable in the
  // UI (e.g. GPA Summary table) even while the semester is still a draft.
  
  // 4. Calculate total credits for the semester entry
  const totalCredits =
    subjects.reduce((sum, sub) => sum + sub.credits, 0) +
    electiveCreditsRequired

  return {
    semester,
    gpa,
    credits: totalCredits,
    grades,
    university,
    faculty,
    degree,
    isDraft,
    createdAt,
  }
}
