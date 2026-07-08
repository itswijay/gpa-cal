export interface CumulativeGPASemesterInput {
  gpa: number
  credits: number
  isDraft?: boolean
}

/**
 * Calculates cumulative GPA by credit-weighting per-semester GPA values.
 * Excludes draft semesters.
 */
export const calculateCumulativeGpa = (semesters: CumulativeGPASemesterInput[]): number => {
  let totalWeightedGPA = 0
  let totalCredits = 0

  semesters.forEach((sem) => {
    if (sem.isDraft) return
    const GPA = sem.gpa
    const credits = sem.credits
    if (GPA !== undefined && credits !== undefined) {
      totalWeightedGPA += GPA * credits
      totalCredits += credits
    }
  })

  return totalCredits === 0 ? 0 : parseFloat((totalWeightedGPA / totalCredits).toFixed(3))
}