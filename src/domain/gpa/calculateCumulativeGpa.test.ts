import { describe, it, expect } from 'vitest'
import { calculateCumulativeGpa } from './calculateCumulativeGpa'

describe('calculateCumulativeGpa', () => {
  it('Equal credits across all semesters matches a simple average', () => {
    // Given semesters [{gpa:3.5, credits:10}, {gpa:3.6, credits:10}, {gpa:3.8, credits:10}]
    // Then calculateCumulativeGpa returns 3.633 (rounded to 3 decimals)
    const semesters = [
      { gpa: 3.5, credits: 10 },
      { gpa: 3.6, credits: 10 },
      { gpa: 3.8, credits: 10 },
    ]
    expect(calculateCumulativeGpa(semesters)).toBe(3.633)
  })

  it('Different credit totals produce a genuinely credit-weighted result', () => {
    // Given semesters [{gpa:3.5, credits:20}, {gpa:3.8, credits:10}]
    // Then calculateCumulativeGpa returns 3.6
    // (NOT 3.65, which would be the old flat-average bug)
    const semesters = [
      { gpa: 3.5, credits: 20 },
      { gpa: 3.8, credits: 10 },
    ]
    expect(calculateCumulativeGpa(semesters)).toBe(3.6)
  })

  it('Draft semesters are still excluded, now with credit weighting', () => {
    // Given semesters [{gpa:3.0, credits:15}, {gpa:4.0, credits:15}, {gpa:2.0, credits:10, isDraft:true}]
    // Then calculateCumulativeGpa returns 3.5 (the draft's credits are also excluded, not just its GPA)
    const semesters = [
      { gpa: 3.0, credits: 15 },
      { gpa: 4.0, credits: 15 },
      { gpa: 2.0, credits: 10, isDraft: true },
    ]
    expect(calculateCumulativeGpa(semesters)).toBe(3.5)
  })

  it('Empty input still returns 0', () => {
    // Given an empty array
    // Then calculateCumulativeGpa returns 0
    expect(calculateCumulativeGpa([])).toBe(0)
  })

  it('All-draft or zero-total-credits input returns 0, not NaN', () => {
    // Given semesters that are all drafts (or all have credits: 0)
    // Then calculateCumulativeGpa returns 0
    const allDrafts = [
      { gpa: 3.5, credits: 10, isDraft: true },
      { gpa: 3.8, credits: 10, isDraft: true },
    ]
    const zeroCredits = [
      { gpa: 3.5, credits: 0 },
      { gpa: 3.8, credits: 0 },
    ]
    expect(calculateCumulativeGpa(allDrafts)).toBe(0)
    expect(calculateCumulativeGpa(zeroCredits)).toBe(0)
  })
})