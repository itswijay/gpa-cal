import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getCustomDegree } from '../../adapters/firebase/curriculumRepository'
import type { SemesterMap, GpaMethod } from '../../data/types'
import type { DynamicSemester } from '../../domain/curriculum/customDegreeForm'
import { mapSemesterMapToDynamicSemesters } from '../../domain/curriculum/mapSemesterMapToDynamicSemesters'
import { resolveCurriculumSelection } from '../../domain/curriculum/resolveCurriculumSelection'
import { db } from '../../adapters/firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import type { User } from 'firebase/auth'

export interface PreloadedUniversity {
  shortName: string
  name: string
  faculties: Record<string, Record<string, SemesterMap>>
}

export interface UseCustomDegreeFormStateParams {
  isAuthenticated: boolean
  user: User | null
  authLoading: boolean
}

export function useCustomDegreeFormState({
  isAuthenticated,
  user,
  authLoading,
}: UseCustomDegreeFormStateParams) {
  const [degreeName, setDegreeNameState] = useState('')
  // True while the degree name is one the user typed by hand rather than one that came
  // from a dropdown or from loading their saved degree. Effect #3 below uses it to leave
  // hand-typed input alone — otherwise it would rewrite and lock the field mid-typing the
  // moment the text happened to match a public degree. A ref, so it never re-renders or
  // feeds the effect's dependency array.
  const degreeNameTypedRef = useRef(false)

  // Programmatic updates (dropdown selections, loading an existing degree) clear the flag;
  // only the Degree Program Name input uses setDegreeNameTyped.
  const setDegreeName = useCallback((value: string) => {
    degreeNameTypedRef.current = false
    setDegreeNameState(value)
  }, [])

  const setDegreeNameTyped = useCallback((value: string) => {
    degreeNameTypedRef.current = true
    setDegreeNameState(value)
  }, [])
  const [universityName, setUniversityName] = useState('')
  const [universityShort, setUniversityShort] = useState('')
  const [facultyName, setFacultyName] = useState('')
  const [preloadedUniversities, setPreloadedUniversities] = useState<PreloadedUniversity[]>([])
  const [selectedUniversityOption, setSelectedUniversityOption] = useState<string>('')
  const [preloadedFaculties, setPreloadedFaculties] = useState<string[]>([])
  const [selectedFacultyOption, setSelectedFacultyOption] = useState<string>('')
  const [preloadedDegrees, setPreloadedDegrees] = useState<string[]>([])
  const [selectedDegreeOption, setSelectedDegreeOption] = useState<string>('')
  const [isSuggested, setIsSuggested] = useState(false)
  const [suggestionStatus, setSuggestionStatus] = useState<'pending' | 'approved' | 'rejected' | 'delete_pending'>('pending')
  const [rejectionReason, setRejectionReason] = useState('')
  const [suggestionId, setSuggestionId] = useState('')
  const [semesters, setSemesters] = useState<DynamicSemester[]>([
    {
      id: 'sem_1',
      name: 'Semester 1',
      electiveCreditsRequired: '0',
      subjects: [{ code: '', name: '', credits: '3', isElective: false }],
    },
  ])
  const [isLoadingExisting, setIsLoadingExisting] = useState(true)
  const [hasExistingProgram, setHasExistingProgram] = useState(false)
  const [hasUserEdited, setHasUserEdited] = useState(false)
  const [gpaMethod, setGpaMethod] = useState<GpaMethod>('normal')
  const [semestersPerYear, setSemestersPerYear] = useState(2)
  const [yearWeightInputs, setYearWeightInputs] = useState<Record<number, string>>({})

  // 1. Fetch all preloaded/global universities
  useEffect(() => {
    async function loadAllUniversities() {
      try {
        const uniMap: Record<string, { name: string; faculties: Record<string, Record<string, SemesterMap>> }> = {}

        const querySnapshot = await getDocs(collection(db, 'globalCurricula'))
        querySnapshot.docs.forEach((doc) => {
          const data = doc.data()
          if (data.shortName) {
            uniMap[data.shortName.toUpperCase()] = {
              name: data.name || data.shortName,
              faculties: (data.faculties || {}) as Record<string, Record<string, SemesterMap>>,
            }
          }
        })

        const list = Object.entries(uniMap).map(([short, details]) => ({
          shortName: short,
          name: details.name,
          faculties: details.faculties,
        }))
        setPreloadedUniversities(list)
      } catch (err) {
        console.error('Failed to load universities list:', err)
        setPreloadedUniversities([])
      }
    }
    loadAllUniversities()
  }, [])

  // 2. Load existing custom degree if available
  useEffect(() => {
    async function loadExisting() {
      if (isAuthenticated && user) {
        try {
          const existing = await getCustomDegree(user.uid)
          if (existing) {
            setHasExistingProgram(true)
            setDegreeName(existing.degreeName)
            setUniversityName(existing.universityName || '')
            setUniversityShort(existing.universityShort || '')
            setFacultyName(existing.facultyName || '')
            setIsSuggested(existing.isSuggested || false)
            setSuggestionStatus(existing.suggestionStatus || 'pending')
            setRejectionReason(existing.rejectionReason || '')
            setSuggestionId(existing.suggestionId || '')

            // Map university abbreviation to dropdown status
            const uShort = (existing.universityShort || '').toUpperCase().trim()
            if (uShort) {
              if (uShort === 'SUSL') {
                setSelectedUniversityOption('SUSL')
              } else {
                setSelectedUniversityOption(uShort)
              }
            }
            
            // Map Firestore SemesterMap back to our dynamic local state (sorted ascending)
            const mappedSems = mapSemesterMapToDynamicSemesters(existing.semesters)

            if (mappedSems.length > 0) {
              setSemesters(mappedSems)
            }

            // Restore GPA calculation method and year-weight config if previously saved
            if (existing.gpaMethod) {
              setGpaMethod(existing.gpaMethod)
            }
            if (existing.yearWeightedConfig) {
              setSemestersPerYear(existing.yearWeightedConfig.semestersPerYear)
              const weightRecord: Record<number, string> = {}
              existing.yearWeightedConfig.yearWeights.forEach((yw) => {
                weightRecord[yw.year] = String(Math.round(yw.weight * 100))
              })
              setYearWeightInputs(weightRecord)
            }
          }
        } catch (error) {
          console.error('Error loading existing custom degree:', error)
          
          // Check if it is a Firestore permission denied error
          const err = error as { code?: string; message?: string } | null
          const isPermissionDenied = 
            err?.code === 'permission-denied' || 
            (err?.message && err.message.includes('permission-denied')) ||
            (err?.message && err.message.includes('Permission'))

          if (isPermissionDenied) {
            console.warn(
              'Firebase security rules warning: Please ensure your Firestore security rules allow ' +
              'read/write access to the "customDegree" collection. ' +
              'Update your firestore.rules to include:\n\n' +
              'match /users/{userId}/customDegree/{document} {\n' +
              '  allow read, write: if request.auth != null && request.auth.uid == userId;\n' +
              '}\n'
            )
          } else {
            toast.error('Failed to load existing custom degree.')
          }
        } finally {
          setIsLoadingExisting(false)
        }
      } else if (!authLoading) {
        setIsLoadingExisting(false)
      }
    }
    loadExisting()
  }, [isAuthenticated, user, authLoading, setDegreeName])

  // 3. Synchronize dropdown state with loaded custom degree once preloaded universities lists are fetched
  useEffect(() => {
    const resolved = resolveCurriculumSelection({
      universityShort,
      facultyName,
      degreeName,
      degreeNameWasTyped: degreeNameTypedRef.current,
      preloadedUniversities,
    })
    if (!resolved) return

    // A null field means resolution didn't reach that piece of state, which is not the same
    // as clearing it — see resolveCurriculumSelection.
    setSelectedUniversityOption(resolved.selectedUniversityOption)
    setPreloadedFaculties(resolved.preloadedFaculties)
    if (resolved.selectedFacultyOption !== null) {
      setSelectedFacultyOption(resolved.selectedFacultyOption)
    }
    if (resolved.normalizedFacultyName !== null) {
      setFacultyName(resolved.normalizedFacultyName)
    }
    if (resolved.preloadedDegrees !== null) {
      setPreloadedDegrees(resolved.preloadedDegrees)
    }
    if (resolved.selectedDegreeOption !== null) {
      setSelectedDegreeOption(resolved.selectedDegreeOption)
    }
    if (resolved.normalizedDegreeName !== null) {
      setDegreeName(resolved.normalizedDegreeName)
    }
  }, [preloadedUniversities, universityShort, facultyName, degreeName, setDegreeName])

  return {
    degreeName,
    setDegreeName,
    setDegreeNameTyped,
    universityName,
    setUniversityName,
    universityShort,
    setUniversityShort,
    facultyName,
    setFacultyName,
    preloadedUniversities,
    setPreloadedUniversities,
    selectedUniversityOption,
    setSelectedUniversityOption,
    preloadedFaculties,
    setPreloadedFaculties,
    selectedFacultyOption,
    setSelectedFacultyOption,
    preloadedDegrees,
    setPreloadedDegrees,
    selectedDegreeOption,
    setSelectedDegreeOption,
    isSuggested,
    setIsSuggested,
    suggestionStatus,
    setSuggestionStatus,
    rejectionReason,
    setRejectionReason,
    suggestionId,
    setSuggestionId,
    semesters,
    setSemesters,
    isLoadingExisting,
    setIsLoadingExisting,
    hasExistingProgram,
    setHasExistingProgram,
    hasUserEdited,
    setHasUserEdited,
    gpaMethod,
    setGpaMethod,
    semestersPerYear,
    setSemestersPerYear,
    yearWeightInputs,
    setYearWeightInputs,
  }
}
