import type { SemesterMap } from '../../data/types'
import type { DynamicSemester } from './customDegreeForm'

export function mapSemesterMapToDynamicSemesters(
  semesters: SemesterMap
): DynamicSemester[] {
  const getSemNumber = (name: string): number => {
    const num = name.match(/\d+/)
    return num ? parseInt(num[0], 10) : 999
  }

  const sortedEntries = Object.entries(semesters || {}).sort((a, b) => {
    return getSemNumber(a[0]) - getSemNumber(b[0])
  })

  return sortedEntries.map(([semName, semData], idx) => {
    const coreMapped = (semData.core || []).map((sub) => ({
      code: sub.code,
      name: sub.name,
      credits: String(sub.credits),
      isElective: false,
    }))
    const electivesMapped = (semData.electives || []).map((sub) => ({
      code: sub.code,
      name: sub.name,
      credits: String(sub.credits),
      isElective: true,
    }))
    return {
      id: `sem_${idx + 1}`,
      name: semName,
      electiveCreditsRequired: semData.electiveCreditsRequired
        ? String(semData.electiveCreditsRequired)
        : '0',
      subjects: [...coreMapped, ...electivesMapped],
    }
  })
}
