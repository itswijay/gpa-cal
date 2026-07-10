import { describe, it, expect } from 'vitest'
import { calculateYearWeightedGpa } from './calculateYearWeightedGpa'
import type { YearWeightedGpaConfig } from '../../data/types'

const config: YearWeightedGpaConfig = {
  semestersPerYear: 2,
  yearWeights: [
    { year: 1, weight: 0.2 },
    { year: 2, weight: 0.2 },
    { year: 3, weight: 0.3 },
    { year: 4, weight: 0.3 },
  ],
}

describe('calculateYearWeightedGpa', () => {
  it('(a) full 4 years — matches handbook formula', () => {
    const semesters = [
      { semester: 'Semester 1', gpa: 3.0, credits: 20 },
      { semester: 'Semester 2', gpa: 4.0, credits: 20 },
      { semester: 'Semester 3', gpa: 3.0, credits: 20 },
      { semester: 'Semester 4', gpa: 3.0, credits: 20 },
      { semester: 'Semester 5', gpa: 2.0, credits: 20 },
      { semester: 'Semester 6', gpa: 4.0, credits: 20 },
      { semester: 'Semester 7', gpa: 4.0, credits: 20 },
      { semester: 'Semester 8', gpa: 4.0, credits: 20 },
    ]
    expect(calculateYearWeightedGpa(semesters, config)).toBe(3.40)
  })

  it('(b) years 1-2 only — re-normalizes weights to 0.5/0.5', () => {
    const semesters = [
      { semester: 'Semester 1', gpa: 3.0, credits: 20 },
      { semester: 'Semester 2', gpa: 4.0, credits: 20 },
      { semester: 'Semester 3', gpa: 3.0, credits: 20 },
      { semester: 'Semester 4', gpa: 3.0, credits: 20 },
    ]
    expect(calculateYearWeightedGpa(semesters, config)).toBe(3.25)
  })

  it('(c) single semester — re-normalizes to weight 1.0', () => {
    const semesters = [{ semester: 'Semester 1', gpa: 3.0, credits: 20 }]
    expect(calculateYearWeightedGpa(semesters, config)).toBe(3.00)
  })

  it('(d) draft semester is fully excluded — same result as (c)', () => {
    const semesters = [
      { semester: 'Semester 1', gpa: 3.0, credits: 20 },
      { semester: 'Semester 2', gpa: 1.0, credits: 20, isDraft: true },
    ]
    expect(calculateYearWeightedGpa(semesters, config)).toBe(3.00)
  })

  it('(e) semester with no matching year weight is silently excluded', () => {
    const semesters = [
      { semester: 'Semester 1', gpa: 3.0, credits: 20 },
      { semester: 'Semester 2', gpa: 4.0, credits: 20 },
      { semester: 'Semester 3', gpa: 3.0, credits: 20 },
      { semester: 'Semester 4', gpa: 3.0, credits: 20 },
      { semester: 'Semester 9', gpa: 4.0, credits: 20 },
    ]
    expect(calculateYearWeightedGpa(semesters, config)).toBe(3.25)
  })

  it('(f) empty semesters array returns 0', () => {
    expect(calculateYearWeightedGpa([], config)).toBe(0)
  })
})
