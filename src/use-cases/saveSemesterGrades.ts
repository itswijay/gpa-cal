import { saveSemesterData } from '../adapters/firebase/gpaRepository'
import type { GPAEntry } from '../adapters/firebase/gpaRepository'
import { calculateSemesterGpa } from '../domain/gpa/calculateSemesterGpa'
import { validateElectiveCredits } from '../domain/curriculum/validateElectiveCredits'
import type { Subject } from '../data/types'

export interface SaveSemesterGradesInput {
  userId: string
  semester: string
  subjects: Subject[]
  electives: Subject[]
  grades: Record<string, string>
  electiveCreditsRequired: number
  university: string
  faculty: string
  degree: string
  createdAt?: any
}

/**
 * Orchestration Use Case to validate elective/core compliance,
 * calculate the semester GPA and total credits, and save the record to Firestore.
 */
export async function saveSemesterGrades(
  input: SaveSemesterGradesInput
): Promise<GPAEntry> {
  const {
    userId,
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

  // 4. Calculate total credits for the semester entry
  const totalCredits =
    subjects.reduce((sum, sub) => sum + sub.credits, 0) +
    electiveCreditsRequired

  const newEntry: GPAEntry = {
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

  // 5. Save using the adapter
  await saveSemesterData(userId, newEntry)

  return newEntry
}
