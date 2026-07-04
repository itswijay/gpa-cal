import { describe, it, expect } from 'vitest'
import { calculateCumulativeGpa } from './calculateCumulativeGpa'

describe('calculateCumulativeGpa', () => {
  it('calculates the average of normal per-semester GPA values (normal input)', () => {
    const semesters = [
      { gpa: 3.5 },
      { gpa: 3.8 },
      { gpa: 3.2 },
    ]
    // Expected average: (3.5 + 3.8 + 3.2) / 3 = 10.5 / 3 = 3.5
    expect(calculateCumulativeGpa(semesters)).toBe(3.5)
  })

  it('returns 0 when semesters array is empty (empty input)', () => {
    expect(calculateCumulativeGpa([])).toBe(0)
  })

  it('excludes draft semesters from the cumulative GPA (draft semester being excluded)', () => {
    const semesters = [
      { gpa: 3.5, isDraft: false },
      { gpa: 4.0, isDraft: true },
      { gpa: 3.7 },
    ]
    // The draft semester with GPA 4.0 should be excluded
    // Expected average: (3.5 + 3.7) / 2 = 7.2 / 2 = 3.6
    expect(calculateCumulativeGpa(semesters)).toBe(3.6)
  })

  it('rounds the cumulative GPA to 3 decimal places (rounding to 3 decimals)', () => {
    const semesters = [
      { gpa: 3.5 },
      { gpa: 3.6 },
      { gpa: 3.8 },
    ]
    // Sum = 10.9. Average = 10.9 / 3 = 3.6333333...
    // Expected rounded: 3.633
    expect(calculateCumulativeGpa(semesters)).toBe(3.633)
  })
})
