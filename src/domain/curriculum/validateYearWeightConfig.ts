import type { YearWeightedGpaConfig } from '../../data/types'

export function validateYearWeightConfig(config: YearWeightedGpaConfig): string | null {
  if (!config.yearWeights || config.yearWeights.length === 0) {
    return 'At least one year weight entry is required.'
  }

  for (const yw of config.yearWeights) {
    if (yw.weight <= 0) {
      return `Year ${yw.year} weight must be greater than 0.`
    }
  }

  const total = config.yearWeights.reduce((sum, yw) => sum + yw.weight, 0)
  if (Math.abs(total - 1.0) > 0.005) {
    const pct = Math.round(total * 100)
    return `Year weights must sum to 100% (currently ${pct}%).`
  }

  return null
}
