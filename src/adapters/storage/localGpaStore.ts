import type { GPAEntry } from '../../data/types'

/**
 * Saves a semester entry locally in the browser's localStorage.
 * Handles reading the existing array, filtering duplicate semester entries,
 * appending the new entry, and writing the serialized JSON back to localStorage.
 */
export function saveSemesterDataLocally(entry: GPAEntry): void {
  const existingData = JSON.parse(
    localStorage.getItem('gpaData') || '[]'
  ) as GPAEntry[]
  
  const updatedData = [
    ...existingData.filter((item) => item.semester !== entry.semester),
    entry,
  ]
  
  localStorage.setItem('gpaData', JSON.stringify(updatedData))
}
