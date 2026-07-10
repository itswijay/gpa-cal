import type { YearWeightedGpaConfig } from '../../data/types'
import { parseSemesterNumber } from '../curriculum/parseSemesterNumber'

export const calculateYearWeightedGpa = (
  semesters: Array<{ semester: string; gpa: number; credits: number; isDraft?: boolean }>,
  config: YearWeightedGpaConfig
): number => {
  const active = semesters.filter((s) => !s.isDraft)

  const weightMap = new Map<number, number>(
    config.yearWeights.map((yw) => [yw.year, yw.weight])
  )

  const yearTotals = new Map<number, { weightedGpaSum: number; totalCredits: number }>()

  for (const sem of active) {
    const semNum = parseSemesterNumber(sem.semester)
    const year = Math.ceil(semNum / config.semestersPerYear)

    if (!weightMap.has(year)) continue

    if (!yearTotals.has(year)) {
      yearTotals.set(year, { weightedGpaSum: 0, totalCredits: 0 })
    }
    const totals = yearTotals.get(year)!
    totals.weightedGpaSum += sem.gpa * sem.credits
    totals.totalCredits += sem.credits
  }

  if (yearTotals.size === 0) return 0

  const presentYears = Array.from(yearTotals.entries()).map(([year, totals]) => ({
    year,
    yearGpa: totals.weightedGpaSum / totals.totalCredits,
    rawWeight: weightMap.get(year)!,
  }))

  const sumOfPresentWeights = presentYears.reduce((sum, py) => sum + py.rawWeight, 0)

  const fgpa = presentYears.reduce((sum, py) => {
    const normalizedWeight = py.rawWeight / sumOfPresentWeights
    return sum + normalizedWeight * py.yearGpa
  }, 0)

  return parseFloat(fgpa.toFixed(2))
}
