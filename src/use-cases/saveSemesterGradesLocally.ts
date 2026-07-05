import { saveSemesterDataLocally } from '../adapters/storage/localGpaStore'
import { prepareSemesterEntry } from './prepareSemesterEntry'
import type { Subject, GPAEntry } from '../data/types'

export interface SaveSemesterGradesLocallyInput {
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
 * Orchestration Use Case to validate, calculate, and persist
 * the semester GPA entry locally to browser localStorage.
 */
export async function saveSemesterGradesLocally(
  input: SaveSemesterGradesLocallyInput
): Promise<GPAEntry> {
  const newEntry = prepareSemesterEntry(input)

  saveSemesterDataLocally(newEntry)

  return newEntry
}
