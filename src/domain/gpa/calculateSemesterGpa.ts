import type { Subject } from '../../data/types'
import { gradePoints } from '../../data/grading'

/**
 * Calculates semester GPA by weighting grade points by credits.
 */
export const calculateSemesterGpa = (
  subjects: Subject[],
  electives: Subject[],
  grades: Record<string, string>
): number => {
  let totalCredits = 0
  let totalPoints = 0

  const allSubjects = [
    ...subjects,
    ...electives.filter((elective: Subject) => grades[elective.code]),
  ]

  allSubjects.forEach((sub) => {
    const grade = grades[sub.code]
    const point = gradePoints[grade]

    if (point !== undefined) {
      totalCredits += sub.credits
      totalPoints += point * sub.credits
    }
  })

  return totalCredits === 0
    ? 0
    : Number((totalPoints / totalCredits).toFixed(3))
}
