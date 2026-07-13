import type { DegreeGpaConfig } from '../../../data/types'

interface GpaFormulaCardProps {
  config: DegreeGpaConfig
}

export function GpaFormulaCard({ config }: GpaFormulaCardProps) {
  const isYearWeighted = config.defaultMethod === 'year-weighted' && config.yearWeightedConfig

  return (
    <div className="mb-6 p-4 bg-card border border-border rounded-lg shadow-sm text-center">

      <p className="text-xs sm:text-sm text-muted-foreground">
        Semester GPA = Σ (Subject Grade Point × Credits) / Σ Credits
      </p>
      <div className="my-2 border-t border-dashed border-border w-16 mx-auto" />

      {isYearWeighted ? (
        <>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Year GPA = Σ (Semester GPA × Credits) / Σ Credits
          </p>
          <p className="text-[11px] text-muted-foreground/80 mt-0.5">
            (across each year's {config.yearWeightedConfig!.semestersPerYear} semester(s))
          </p>
          <div className="my-2 border-t border-dashed border-border w-16 mx-auto" />

          <p className="text-sm sm:text-base font-semibold text-foreground break-words">
            FGPA ={' '}
            {[...config.yearWeightedConfig!.yearWeights]
              .sort((a, b) => a.year - b.year)
              .map((yw) => `(Year ${yw.year} × ${Math.round(yw.weight * 100)}%)`)
              .join(' + ')}
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
