import type { Subject } from '../../data/types'

export interface ElectiveValidationResult {
  allCoreGradesSelected: boolean
  isElectiveCreditValid: boolean
  hasExcessElectiveCredits: boolean
}

/**
 * Validate elective credits selection and core subject completion status.
 */
export function validateElectiveCredits(
  subjects: Subject[],
  grades: Record<string, string>,
  selectedElectiveCredits: number,
  electiveCreditsRequired: number
): ElectiveValidationResult {
  const allCoreGradesSelected = subjects.every(
    (sub) => !!grades[sub.code]
  )
  const isElectiveCreditValid = selectedElectiveCredits === electiveCreditsRequired
  const hasExcessElectiveCredits = selectedElectiveCredits > electiveCreditsRequired

  return {
    allCoreGradesSelected,
    isElectiveCreditValid,
    hasExcessElectiveCredits,
  }
}
