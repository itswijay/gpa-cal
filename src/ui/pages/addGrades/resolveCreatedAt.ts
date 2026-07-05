import type { GPAEntry, Timestamp } from '../../../data/types'

/**
 * Resolves the createdAt timestamp for a semester entry.
 * Prioritizes:
 * 1. The createdAt timestamp from the active editing session, if editing.
 * 2. The createdAt timestamp from an existing local storage entry for the same semester.
 * 3. The createdAt timestamp from an existing Firestore entry for the same semester.
 */
export function resolveCreatedAt(
  isEditing: boolean,
  editingSemesterData: GPAEntry | null,
  semSelected: string,
  firebaseData: GPAEntry[]
): Timestamp | undefined {
  if (isEditing && editingSemesterData?.createdAt) {
    return editingSemesterData.createdAt
  }

  // Check localStorage
  try {
    const localData = JSON.parse(localStorage.getItem('gpaData') || '[]') as GPAEntry[]
    const existingLocal = localData.find((entry) => entry.semester === semSelected)
    if (existingLocal?.createdAt) {
      return existingLocal.createdAt
    }
  } catch (e) {
    console.error('Failed to parse local gpaData for createdAt resolution:', e)
  }

  // Check Firestore cache / memory state
  const existingFirebase = firebaseData.find((entry) => entry.semester === semSelected)
  if (existingFirebase?.createdAt) {
    return existingFirebase.createdAt
  }

  return undefined
}
