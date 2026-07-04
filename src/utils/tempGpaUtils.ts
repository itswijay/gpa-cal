import type { Subject } from '../data/types'
import { gradePoints } from '../data/grading'

export interface CumulativeGPASemesterInput {
  gpa: number
  isDraft?: boolean
}

/**
 * Calculates cumulative GPA by averaging per-semester GPA values.
 * Excludes draft semesters.
 */
export const calculateCumulativeGPA = (semesters: CumulativeGPASemesterInput[]): number => {
  let totalGPA = 0
  let semCount = 0

  semesters.forEach((sem) => {
    if (sem.isDraft) return
    const GPA = sem.gpa
    if (GPA !== undefined) {
      totalGPA += GPA
      semCount += 1
    }
  })

  return semCount === 0 ? 0 : parseFloat((totalGPA / semCount).toFixed(3))
}

/**
 * Calculates semester GPA by weighting grade points by credits.
 */
export const calculateSemesterGPA = (
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
