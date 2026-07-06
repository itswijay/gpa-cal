import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getCustomDegree } from '../../adapters/firebase/curriculumRepository'
import type { SemesterMap } from '../../data/types'
import type { DynamicSemester } from '../../domain/curriculum/customDegreeForm'
import { mapSemesterMapToDynamicSemesters } from '../../domain/curriculum/mapSemesterMapToDynamicSemesters'
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
  const [degreeName, setDegreeName] = useState('')
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
  }, [isAuthenticated, user, authLoading])

  // 3. Synchronize dropdown state with loaded custom degree once preloaded universities lists are fetched
  useEffect(() => {
    if (universityShort && preloadedUniversities.length > 0) {
      const uShort = universityShort.toUpperCase().trim()
      const matchedUni = preloadedUniversities.find(uni => uni.shortName === uShort)
      
      if (matchedUni) {
        setSelectedUniversityOption(uShort)
        const facNames = Object.keys(matchedUni.faculties || {})
        setPreloadedFaculties(facNames)
        
        // Check if the loaded faculty matches one of the preloaded faculties
        if (facultyName) {
          const matchedFaculty = facNames.find(
            (fac) => fac.toLowerCase().trim() === facultyName.toLowerCase().trim()
          )
          if (matchedFaculty) {
            setSelectedFacultyOption(matchedFaculty)
            setFacultyName(matchedFaculty) // normalize casing
            
            const degNames = Object.keys(matchedUni.faculties[matchedFaculty] || {})
            setPreloadedDegrees(degNames)
            
            if (degreeName) {
              const matchedDegree = degNames.find(
                (deg) => deg.toLowerCase().trim() === degreeName.toLowerCase().trim()
              )
              if (matchedDegree) {
                setSelectedDegreeOption(matchedDegree)
                setDegreeName(matchedDegree) // normalize casing
              } else {
                setSelectedDegreeOption('custom')
              }
            }
          } else {
            setSelectedFacultyOption('custom')
            setPreloadedDegrees([])
            setSelectedDegreeOption('custom')
          }
        }
      } else {
        setSelectedUniversityOption('custom')
        setPreloadedFaculties([])
        setSelectedFacultyOption('custom')
        setPreloadedDegrees([])
        setSelectedDegreeOption('custom')
      }
    }
  }, [preloadedUniversities, universityShort, facultyName, degreeName])

  return {
    degreeName,
    setDegreeName,
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
  }
}
