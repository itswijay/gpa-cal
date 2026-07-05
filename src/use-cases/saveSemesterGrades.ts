import { saveSemesterData } from '../adapters/firebase/gpaRepository'
import { prepareSemesterEntry } from './prepareSemesterEntry'
import type { Subject, GPAEntry } from '../data/types'

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
  const { userId, ...prepareInput } = input

  const newEntry = prepareSemesterEntry(prepareInput)

  // Save using the adapter
  await saveSemesterData(userId, newEntry)

  return newEntry
}
