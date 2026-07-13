import { useState, useEffect } from 'react'
import type { DegreeGpaConfig } from '../../data/types'
import { getGlobalDegreeGpaConfig, getCustomDegree } from '../../adapters/firebase/curriculumRepository'

const DEFAULT_CONFIG: DegreeGpaConfig = { defaultMethod: 'normal' }

interface Params {
  faculty: string | undefined
  degree: string | undefined
  universityShort: string | undefined
  userId: string | undefined
}

interface Result {
  config: DegreeGpaConfig
  isPersonal: boolean
  loading: boolean
}

export function useResolvedGpaConfig({ faculty, degree, universityShort, userId }: Params): Result {
  const [config, setConfig] = useState<DegreeGpaConfig>(DEFAULT_CONFIG)
  const [isPersonal, setIsPersonal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!faculty || !degree) {
      setConfig(DEFAULT_CONFIG)
      setIsPersonal(false)
      setLoading(false)
      return
    }

    let cancelled = false

    async function resolve() {
      // 1. The user's own custom degree is the source of truth for their own config —
      // no admin approval needed to see it reflected.
      if (userId) {
        try {
          const own = await getCustomDegree(userId)
          if (own?.gpaMethod && own.facultyName === faculty && own.degreeName === degree) {
            if (!cancelled) {
              setConfig({ defaultMethod: own.gpaMethod, yearWeightedConfig: own.yearWeightedConfig })
              setIsPersonal(true)
              setLoading(false)
            }
            return
          }
        } catch {
          // fall through to global config
        }
      }

      // 2. Firestore global config (one-time fetch — only changes on admin approval)
      if (universityShort) {
        try {
          const global = await getGlobalDegreeGpaConfig(universityShort, faculty!, degree!)
          if (!cancelled) {
            setConfig(global ?? DEFAULT_CONFIG)
            setIsPersonal(false)
            setLoading(false)
          }
          return
        } catch {
          // fall through to default
        }
      }

      // 3. Default
      if (!cancelled) {
        setConfig(DEFAULT_CONFIG)
        setIsPersonal(false)
        setLoading(false)
      }
    }

    resolve()
    return () => { cancelled = true }
  }, [faculty, degree, universityShort, userId])

  return { config, isPersonal, loading }
}
