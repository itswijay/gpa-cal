import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { saveSemesterGrades } from '../../use-cases/saveSemesterGrades'
import { resolveCreatedAt } from '../pages/addGrades/resolveCreatedAt'
import type { Subject, GPAEntry } from '../../data/types'

export interface UseAutoSaveDraftParams {
  grades: Record<string, string>
  isAuthenticated: boolean
  user: { uid: string } | null | undefined
  universitySelected: string
  facultySelected: string
  degreeSelected: string
  semSelected: string
  subjects: Subject[]
  electives: Subject[]
  electiveCreditsRequired: number
  allCoreGradesSelected: boolean
  isElectiveCreditValid: boolean
  dropdownsSelected: boolean
  isEditing: boolean
  editingSemesterData: GPAEntry | null
  firebaseData: GPAEntry[]
  gpa: number
  setEditingSemesterData: (entry: GPAEntry | null) => void
}

export function useAutoSaveDraft({
  grades,
  isAuthenticated,
  user,
  universitySelected,
  facultySelected,
  degreeSelected,
  semSelected,
  subjects,
  electives,
  electiveCreditsRequired,
  allCoreGradesSelected,
  isElectiveCreditValid,
  dropdownsSelected,
  isEditing,
  editingSemesterData,
  firebaseData,
  gpa,
  setEditingSemesterData,
}: UseAutoSaveDraftParams) {
  useEffect(() => {
    if (!isAuthenticated || !user || !dropdownsSelected) return

    // Check if grades have actually changed compared to the last saved data
    const lastSavedEntry = firebaseData.find((entry) => entry.semester === semSelected)
    const lastSavedGrades = lastSavedEntry?.grades || editingSemesterData?.grades || {}

    const currentKeys = Object.keys(grades).filter((k) => grades[k])
    const savedKeys = Object.keys(lastSavedGrades).filter((k) => lastSavedGrades[k])

    let hasChanged = false
    if (currentKeys.length !== savedKeys.length) {
      hasChanged = true
    } else {
      for (const key of currentKeys) {
        if (grades[key] !== lastSavedGrades[key]) {
          hasChanged = true
          break
        }
      }
    }
    if (!hasChanged) return

    // Avoid auto-saving an empty draft on initial selection
    const gradesCount = Object.keys(grades).length
    if (gradesCount === 0 && !isEditing) return

    // Debounce the save request by 1500ms
    const timer = setTimeout(async () => {
      toast.loading('Saving draft...', { id: 'auto-save' })

      try {
        // Resolve createdAt to maintain timestamp
        const createdAt = resolveCreatedAt(
          isEditing,
          editingSemesterData,
          semSelected,
          firebaseData
        )

        const newEntry = await saveSemesterGrades({
          userId: user.uid,
          semester: semSelected,
          subjects,
          electives,
          grades,
          electiveCreditsRequired,
          university: universitySelected,
          faculty: facultySelected,
          degree: degreeSelected,
          createdAt,
        })

        if (isEditing) {
          localStorage.setItem('editingSemester', JSON.stringify(newEntry))
          setEditingSemesterData(newEntry)
        }

        if (newEntry.isDraft) {
          toast.success('Draft saved automatically!', { id: 'auto-save' })
        } else {
          toast.success('Semester grades completed & auto-saved!', { id: 'auto-save' })
        }
      } catch (error) {
        console.error('Failed to auto-save grades:', error)
        toast.error('Failed to auto-save. Please check connection.', { id: 'auto-save' })
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [
    grades,
    isAuthenticated,
    user,
    universitySelected,
    facultySelected,
    degreeSelected,
    semSelected,
    subjects,
    electives,
    electiveCreditsRequired,
    allCoreGradesSelected,
    isElectiveCreditValid,
    dropdownsSelected,
    isEditing,
    editingSemesterData,
    firebaseData,
    gpa,
    setEditingSemesterData,
  ])
}
