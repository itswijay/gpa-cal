import type { DegreeGpaConfig } from '../../../data/types'

interface GpaFormulaCardProps {
  config: DegreeGpaConfig
}

export function GpaFormulaCard({ config }: GpaFormulaCardProps) {
  const isYearWeighted = config.defaultMethod === 'year-weighted' && config.yearWeightedConfig

  return (
    <div className="mb-6 p-4 bg-card border border-border rounded-lg shadow-sm text-center">
      <h2 className="text-sm font-medium text-muted-foreground mb-2">Your GPA Formula</h2>
      {isYearWeighted ? (
        <>
          <p className="text-sm sm:text-base font-semibold text-foreground break-words">
            FGPA ={' '}
            {[...config.yearWeightedConfig!.yearWeights]
              .sort((a, b) => a.year - b.year)
              .map((yw) => `(Year ${yw.year} × ${Math.round(yw.weight * 100)}%)`)
              .join(' + ')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Each year's GPA is the credit-weighted average of its{' '}
            {config.yearWeightedConfig!.semestersPerYear} semester(s).
          </p>
        </>
      ) : (
        <>
          <p className="text-sm sm:text-base font-semibold text-foreground">
            GPA = Σ (Semester GPA × Credits) / Σ Credits
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Credit-weighted average across all completed semesters.
          </p>
        </>
      )}
    </div>
  )
}
