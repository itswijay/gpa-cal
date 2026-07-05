import { useEffect, useState, useMemo } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../../adapters/firebase/config'
import { getCustomDegree } from '../../adapters/firebase/curriculumRepository'
import type { CustomDegreeData } from '../../adapters/firebase/curriculumRepository'

export interface ResolvedUniversity {
  name: string
  shortName: string
  faculties: Record<string, Record<string, unknown>>
}

export interface UseResolvedCurriculaReturn {
  resolvedCurricula: Record<string, ResolvedUniversity>
  customDegree: CustomDegreeData | null
  loading: boolean
  error: string | null
}

export function useResolvedCurricula(
  isAuthenticated: boolean,
  user: { uid: string } | null
): UseResolvedCurriculaReturn {
  const [customDegree, setCustomDegree] = useState<CustomDegreeData | null>(null)
  const [globalCurriculaList, setGlobalCurriculaList] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's custom degree if authenticated
  useEffect(() => {
    async function loadCustomDegree() {
      if (isAuthenticated && user) {
        try {
          const data = await getCustomDegree(user.uid)
          setCustomDegree(data)
        } catch (e) {
          console.error('Failed to load custom degree:', e)
        }
      } else {
        setCustomDegree(null)
      }
    }
    loadCustomDegree()
  }, [isAuthenticated, user])

  // Fetch all available globalCurricula from Firestore
  useEffect(() => {
    async function fetchGlobalCurricula() {
      try {
        setLoading(true)
        const querySnapshot = await getDocs(collection(db, 'globalCurricula'))
        const list = querySnapshot.docs.map(doc => doc.data())
        setGlobalCurriculaList(list)
      } catch (err) {
        console.error('Failed to fetch public curricula from Firestore:', err)
        setError('Failed to load university curricula')
      } finally {
        setLoading(false)
      }
    }
    fetchGlobalCurricula()
  }, [])

  // Resolve curricula mapping (merges Firestore globalCurricula list and private custom degree structures)
  const resolvedCurricula = useMemo(() => {
    const uniMap: Record<string, ResolvedUniversity> = {}

    globalCurriculaList.forEach((item) => {
      const doc = item as {
        name?: string
        shortName?: string
        faculties?: Record<string, Record<string, unknown>>
      }
      if (doc.shortName) {
        const key = doc.shortName.toUpperCase()
        uniMap[key] = {
          name: doc.name || '',
          shortName: key,
          faculties: (doc.faculties || {}) as Record<string, Record<string, unknown>>,
        }
      }
    })

    if (customDegree) {
      const uShort = (customDegree.universityShort || 'Custom Degree').toUpperCase()
      const uName = customDegree.universityName || 'Custom Degree'
      const fName = customDegree.facultyName || 'Custom Faculty'

      if (!uniMap[uShort]) {
        uniMap[uShort] = {
          name: uName,
          shortName: uShort,
          faculties: {} as Record<string, Record<string, unknown>>,
        }
      }

      if (!uniMap[uShort].faculties[fName]) {
        uniMap[uShort].faculties[fName] = {} as Record<string, unknown>
      }

      uniMap[uShort].faculties[fName][customDegree.degreeName] = customDegree.semesters
    }

    return uniMap
  }, [globalCurriculaList, customDegree])

  return {
    resolvedCurricula,
    customDegree,
    loading,
    error,
  }
}
