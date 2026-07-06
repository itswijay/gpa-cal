import { useEffect, useState, useMemo, useRef } from 'react'
import type { Subject, SemesterSubjects, GPAEntry } from '../../data/types'
import type { ResolvedUniversity } from './useResolvedCurricula'

export const DEFAULT_UNIVERSITY = 'Select Your University'
export const DEFAULT_FACULTY = 'Select Your Faculty'
export const DEFAULT_DEGREE = 'Select Your Degree Program'
export const DEFAULT_SEMESTER = 'Select Your Semester'

export interface UseSemesterFormStateParams {
  resolvedCurricula: Record<string, ResolvedUniversity>
  isAuthenticated: boolean
  firebaseData: GPAEntry[]
}

export function useSemesterFormState({
  resolvedCurricula,
  isAuthenticated,
  firebaseData,
}: UseSemesterFormStateParams) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingSemesterData, setEditingSemesterData] = useState<GPAEntry | null>(null)

  const [universitySelected, setUniversitySelected] = useState(DEFAULT_UNIVERSITY)
  const [facultySelected, setFacultySelected] = useState(DEFAULT_FACULTY)
  const [degreeSelected, setDegreeSelected] = useState(DEFAULT_DEGREE)
  const [semSelected, setSemSelected] = useState(DEFAULT_SEMESTER)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [electives, setElectives] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [electiveCreditsRequired, setElectiveCreditsRequired] = useState(0)

  const gradesLoadedForRef = useRef<string | null>(null)

  const savedSemesters = useMemo(() => {
    return JSON.parse(
      localStorage.getItem('gpaData') || '[]'
    ) as GPAEntry[]
  }, [])

  // 1. Auto-save selections to localStorage
  useEffect(() => {
    if (
      universitySelected !== DEFAULT_UNIVERSITY ||
      facultySelected !== DEFAULT_FACULTY ||
      degreeSelected !== DEFAULT_DEGREE ||
      semSelected !== DEFAULT_SEMESTER
    ) {
      localStorage.setItem(
        'gpaSelections',
        JSON.stringify({
          university: universitySelected,
          faculty: facultySelected,
          degree: degreeSelected,
          semester: semSelected,
        })
      )
    }
  }, [universitySelected, facultySelected, degreeSelected, semSelected])

  // 2. Load editing semester on mount (runs only once)
  useEffect(() => {
    const savedSelections = JSON.parse(
      localStorage.getItem('gpaSelections') || '{}'
    )
    const lockedUniversity = localStorage.getItem('lockedUniversity')
    const lockedFaculty = localStorage.getItem('lockedFaculty')
    const lockedDegree = localStorage.getItem('lockedDegree')

    // Check if we're in editing mode
    const editingData = localStorage.getItem('editingSemester')
    if (editingData) {
      try {
        const semesterData = JSON.parse(editingData) as GPAEntry
        setIsEditing(true)
        setEditingSemesterData(semesterData)

        // Set the semester selection
        setSemSelected(semesterData.semester)

        // Set university, faculty, and degree from editing data
        if (semesterData.university) {
          setUniversitySelected(semesterData.university)
        } else {
          // Backward compatibility: Auto-map older records without university metadata to SUSL
          setUniversitySelected('SUSL')
        }

        if (semesterData.faculty) {
          setFacultySelected(semesterData.faculty)
        } else {
          // Fallback to locked values if available
          if (lockedFaculty) setFacultySelected(lockedFaculty)
          else if (savedSelections.faculty)
            setFacultySelected(savedSelections.faculty)
        }
        if (semesterData.degree) {
          setDegreeSelected(semesterData.degree)
        } else {
          // Fallback to locked values if available
          if (lockedDegree) setDegreeSelected(lockedDegree)
          else if (savedSelections.degree)
            setDegreeSelected(savedSelections.degree)
        }
      } catch (error) {
        // If parsing fails, clean up and continue normally
        localStorage.removeItem('editingSemester')
        console.error('Error parsing editing data:', error)
      }
    } else {
      // Not editing, use locked values or saved selections
      if (lockedUniversity) {
        setUniversitySelected(lockedUniversity)
      } else if (savedSelections.university) {
        setUniversitySelected(savedSelections.university)
      }

      if (lockedFaculty) setFacultySelected(lockedFaculty)
      else if (savedSelections.faculty)
        setFacultySelected(savedSelections.faculty)

      if (lockedDegree) setDegreeSelected(lockedDegree)
      else if (savedSelections.degree) setDegreeSelected(savedSelections.degree)

      if (savedSelections.semester) setSemSelected(savedSelections.semester)
    }
  }, []) // Empty dependency array, run once on mount

  // 3. Auto-map selection based on existing user data (only for non-editing mode)
  useEffect(() => {
    if (isEditing) return

    if (isAuthenticated && firebaseData.length > 0) {
      const firstSemester = firebaseData[0]
      setUniversitySelected(firstSemester.university || 'SUSL')
      if (firstSemester.faculty) {
        setFacultySelected(firstSemester.faculty)
      }
      if (firstSemester.degree) {
        setDegreeSelected(firstSemester.degree)
      }
    } else if (!isAuthenticated && savedSemesters.length > 0) {
      const firstSemester = savedSemesters[0]
      setUniversitySelected(firstSemester.university || 'SUSL')
    }
  }, [isAuthenticated, firebaseData, isEditing, savedSemesters])

  // For authenticated users, combine localStorage and Firebase semesters
  const usedSemesters = useMemo(() => {
    const firebaseSemesters = isAuthenticated
      ? firebaseData.map((entry) => entry.semester)
      : []
    return [
      ...new Set([
        ...savedSemesters.map((entry) => entry.semester),
        ...firebaseSemesters,
      ]),
    ]
  }, [isAuthenticated, firebaseData, savedSemesters])

  // 4. Clear semester selection if it becomes invalid (already in usedSemesters)
  useEffect(() => {
    if (usedSemesters.includes(semSelected) && !isEditing) {
      setSemSelected(DEFAULT_SEMESTER)
    }
  }, [semSelected, usedSemesters, isEditing])

  const universityOptions = useMemo(() => Object.values(resolvedCurricula), [resolvedCurricula])

  const facultyOptions = useMemo(() => {
    if (universitySelected === DEFAULT_UNIVERSITY) return []
    return Object.keys(resolvedCurricula[universitySelected]?.faculties || {})
  }, [resolvedCurricula, universitySelected])

  const degreeOptions = useMemo(() => {
    if (universitySelected === DEFAULT_UNIVERSITY || facultySelected === DEFAULT_FACULTY) return []
    return Object.keys(resolvedCurricula[universitySelected]?.faculties[facultySelected] || {})
  }, [resolvedCurricula, universitySelected, facultySelected])

  const semesterOptions = useMemo(() => {
    if (
      universitySelected === DEFAULT_UNIVERSITY ||
      facultySelected === DEFAULT_FACULTY ||
      degreeSelected === DEFAULT_DEGREE
    ) {
      return []
    }
    const keys = Object.keys(
      (resolvedCurricula[universitySelected]?.faculties[facultySelected]?.[degreeSelected] as Record<
        string,
        SemesterSubjects
      >) || {}
    ).filter(
      (sem) =>
        !usedSemesters.includes(sem) || (isEditing && sem === semSelected)
    )

    // Sort sem keys in ascending order
    const getSemNumber = (name: string): number => {
      const num = name.match(/\d+/)
      return num ? parseInt(num[0], 10) : 999
    }
    return keys.sort((a, b) => getSemNumber(a) - getSemNumber(b))
  }, [resolvedCurricula, universitySelected, facultySelected, degreeSelected, usedSemesters, isEditing, semSelected])

  // 5. Resolve subjects/electives/electiveCreditsRequired/grades when the dropdown selection or resolvedCurricula changes
  useEffect(() => {
    if (
      universitySelected !== DEFAULT_UNIVERSITY &&
      facultySelected !== DEFAULT_FACULTY &&
      degreeSelected !== DEFAULT_DEGREE &&
      semSelected !== DEFAULT_SEMESTER
    ) {
      const degreeData = resolvedCurricula[universitySelected]?.faculties[facultySelected]?.[degreeSelected] as Record<string, SemesterSubjects> | undefined
      const semesterData = degreeData?.[semSelected]
      if (semesterData) {
        setSubjects(semesterData.core || [])
        setElectives(semesterData.electives || [])
        setElectiveCreditsRequired(semesterData.electiveCreditsRequired || 0)

        // If not editing, clear grades
        if (!isEditing) {
          setGrades({})
          gradesLoadedForRef.current = null
        }
        // If editing and we have editing data with grades, load them only once
        else if (isEditing && editingSemesterData?.grades && gradesLoadedForRef.current !== semSelected) {
          setGrades(editingSemesterData.grades)
          gradesLoadedForRef.current = semSelected
        }
      }
    }
  }, [
    universitySelected,
    facultySelected,
    degreeSelected,
    semSelected,
    isEditing,
    editingSemesterData,
    resolvedCurricula,
  ])

  // 6. The separate "load grades when editingSemesterData changes" effect
  useEffect(() => {
    if (isEditing && editingSemesterData?.grades && subjects.length > 0 && gradesLoadedForRef.current !== semSelected) {
      setGrades(editingSemesterData.grades)
      gradesLoadedForRef.current = semSelected
    }
  }, [isEditing, editingSemesterData, subjects, semSelected])

  return {
    universitySelected,
    setUniversitySelected,
    facultySelected,
    setFacultySelected,
    degreeSelected,
    setDegreeSelected,
    semSelected,
    setSemSelected,
    isEditing,
    setIsEditing,
    editingSemesterData,
    setEditingSemesterData,
    subjects,
    electives,
    grades,
    setGrades,
    electiveCreditsRequired,
    universityOptions,
    facultyOptions,
    degreeOptions,
    semesterOptions,
  }
}
