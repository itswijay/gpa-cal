import { describe, it, expect } from 'vitest'
import type { Subject } from '../data/types'
import { calculateCumulativeGPA, calculateSemesterGPA } from './tempGpaUtils'

describe('calculateCumulativeGPA', () => {
  it('calculates the average of normal per-semester GPA values (normal input)', () => {
    const semesters = [
      { gpa: 3.5 },
      { gpa: 3.8 },
      { gpa: 3.2 },
    ]
    // Expected average: (3.5 + 3.8 + 3.2) / 3 = 10.5 / 3 = 3.5
    expect(calculateCumulativeGPA(semesters)).toBe(3.5)
  })

  it('returns 0 when semesters array is empty (empty input)', () => {
    expect(calculateCumulativeGPA([])).toBe(0)
  })

  it('excludes draft semesters from the cumulative GPA (draft semester being excluded)', () => {
    const semesters = [
      { gpa: 3.5, isDraft: false },
      { gpa: 4.0, isDraft: true },
      { gpa: 3.7 },
    ]
    // The draft semester with GPA 4.0 should be excluded
    // Expected average: (3.5 + 3.7) / 2 = 7.2 / 2 = 3.6
    expect(calculateCumulativeGPA(semesters)).toBe(3.6)
  })

  it('rounds the cumulative GPA to 3 decimal places (rounding to 3 decimals)', () => {
    const semesters = [
      { gpa: 3.5 },
      { gpa: 3.6 },
      { gpa: 3.8 },
    ]
    // Sum = 10.9. Average = 10.9 / 3 = 3.6333333...
    // Expected rounded: 3.633
    expect(calculateCumulativeGPA(semesters)).toBe(3.633)
  })
})

describe('calculateSemesterGPA', () => {
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
    expect(calculateSemesterGPA(subjects, electives, grades)).toBe(3.6)
  })

  it('returns 0 when subjects/electives list is empty or no grades are present (empty input)', () => {
    expect(calculateSemesterGPA([], [], {})).toBe(0)
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
    expect(calculateSemesterGPA(subjects, electives, grades)).toBe(3.5)
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
    expect(calculateSemesterGPA(subjects, electives, grades)).toBe(3.471)
  })
})
