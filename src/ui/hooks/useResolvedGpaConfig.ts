import { useState, useEffect } from 'react'
import type { DegreeGpaConfig } from '../../data/types'
import { getGpaMethodPreference } from '../../adapters/storage/gpaMethodStore'
import { getGlobalDegreeGpaConfig } from '../../adapters/firebase/curriculumRepository'

const DEFAULT_CONFIG: DegreeGpaConfig = { defaultMethod: 'normal' }

interface Params {
  faculty: string | undefined
  degree: string | undefined
  universityShort: string | undefined
}

interface Result {
  config: DegreeGpaConfig
  isPersonal: boolean
  loading: boolean
}

export function useResolvedGpaConfig({ faculty, degree, universityShort }: Params): Result {
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
      // 1. Personal localStorage preference takes highest priority
      const personal = getGpaMethodPreference(faculty!, degree!)
      if (personal) {
        if (!cancelled) {
          setConfig(personal)
          setIsPersonal(true)
          setLoading(false)
        }
        return
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
  }, [faculty, degree, universityShort])

  return { config, isPersonal, loading }
}
