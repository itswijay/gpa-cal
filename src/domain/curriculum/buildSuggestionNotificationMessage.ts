import type { GpaMethod } from '../../data/types'

export function buildSuggestionNotificationMessage(params: {
  degreeName: string
  universityName: string
  facultyName: string
  isCurriculumChange: boolean
  gpaMethod?: GpaMethod
}): string {
  const { degreeName, universityName, facultyName, isCurriculumChange, gpaMethod } = params
  const isYearWeighted = gpaMethod === 'year-weighted'

  if (isCurriculumChange && isYearWeighted) {
    return `🎓📊 New curriculum + GPA method suggestion: ${degreeName} at ${universityName} (${facultyName}). Review in the admin panel.`
  }
  if (isYearWeighted) {
    return `📊 New GPA method suggestion (Year-Weighted) for ${degreeName} at ${universityName} (${facultyName}) — no curriculum changes. Review in the admin panel.`
  }
  return `🎓 New curriculum suggestion: ${degreeName} at ${universityName} (${facultyName}). Review in the admin panel.`
}
