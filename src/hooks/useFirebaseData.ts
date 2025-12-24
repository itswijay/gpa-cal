import { useEffect, useState } from 'react'
import { subscribeSemesterData, type GPAEntry } from '../firebase/firestore'
import { useAuth } from './useAuth'

interface UseFirebaseDataReturn {
  data: GPAEntry[]
  loading: boolean
  error: string | null
}

/**
 * Hook to load and subscribe to Firebase data
 * Only loads data if user is authenticated
 */
export function useFirebaseData(): UseFirebaseDataReturn {
  const { user, isAuthenticated } = useAuth()
  const [data, setData] = useState<GPAEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setData([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Subscribe to real-time updates
      const unsubscribe = subscribeSemesterData(user.uid, (semesters) => {
        setData(semesters)
        setLoading(false)
      })

      // Cleanup subscription on unmount
      return () => unsubscribe()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load data from Firebase'
      setError(errorMessage)
      setLoading(false)
    }
  }, [user, isAuthenticated])

  return { data, loading, error }
}
