import { describe, it, expect } from 'vitest'
import type { Subject } from '../../data/types'
import { calculateSemesterGpa } from './calculateSemesterGpa'

describe('calculateSemesterGpa', () => {
  it('calculates credit-weighted GPA correctly (normal input)', () => {
    const subjects: Subject[] = [
      { code: 'SUB1', name: 'Subject 1', credits: 3 },
      { code: 'SUB2', name: 'Subject 2', credits: 2 },
    ]
    const electives: Subject[] = []
    const grades = {
      SUB1: 'A', // point = 4.0
      SUB2: 'B', // point = 3.0
    }
    // Expected weighted GPA: (4.0 * 3 + 3.0 * 2) / (3 + 2) = (12 + 6) / 5 = 3.6
    expect(calculateSemesterGpa(subjects, electives, grades)).toBe(3.6)
  })

  it('returns 0 when subjects/electives list is empty or no grades are present (empty input)', () => {
    expect(calculateSemesterGpa([], [], {})).toBe(0)
  })

  it('excludes electives without selected grades and subjects with invalid grades (exclusion test)', () => {
    const subjects: Subject[] = [
      { code: 'SUB1', name: 'Subject 1', credits: 3 },
      { code: 'SUB2', name: 'Subject 2', credits: 2 },
    ]
    const electives: Subject[] = [
      { code: 'ELE1', name: 'Elective 1', credits: 3 },
      { code: 'ELE2', name: 'Elective 2', credits: 4 },
    ]
    const grades = {
      SUB1: 'A',       // point = 4.0
      SUB2: 'INVALID', // should be excluded due to invalid grade
      ELE1: 'B',       // point = 3.0
      // ELE2 has no grade, so it's filtered out entirely
    }
    // Included subjects: SUB1 (3 credits, 4.0 pt), ELE1 (3 credits, 3.0 pt)
    // Expected weighted GPA: (4.0 * 3 + 3.0 * 3) / (3 + 3) = (12 + 9) / 6 = 21 / 6 = 3.5
    expect(calculateSemesterGpa(subjects, electives, grades)).toBe(3.5)
  })

  it('rounds the semester GPA to 3 decimal places (rounding to 3 decimals)', () => {
    const subjects: Subject[] = [
      { code: 'SUB1', name: 'Subject 1', credits: 3 },
      { code: 'SUB2', name: 'Subject 2', credits: 4 },
    ]
    const electives: Subject[] = []
    const grades = {
      SUB1: 'A-', // point = 3.7
      SUB2: 'B+', // point = 3.3
    }
    // Expected weighted GPA: (3.7 * 3 + 3.3 * 4) / (3 + 4) = (11.1 + 13.2) / 7 = 24.3 / 7 = 3.471428...
    // Expected rounded: 3.471
    expect(calculateSemesterGpa(subjects, electives, grades)).toBe(3.471)
  })
})
