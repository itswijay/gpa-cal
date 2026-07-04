export interface CumulativeGPASemesterInput {
  gpa: number
  isDraft?: boolean
}

/**
 * Calculates cumulative GPA by averaging per-semester GPA values.
 * Excludes draft semesters.
 */
export const calculateCumulativeGpa = (semesters: CumulativeGPASemesterInput[]): number => {
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
