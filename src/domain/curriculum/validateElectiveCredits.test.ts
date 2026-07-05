import { describe, it, expect } from 'vitest'
import type { Subject } from '../../data/types'
import { validateElectiveCredits } from './validateElectiveCredits'

describe('validateElectiveCredits', () => {
  const sampleSubjects: Subject[] = [
    { code: 'CS101', name: 'Core 1', credits: 3 },
    { code: 'CS102', name: 'Core 2', credits: 4 },
  ]

  it('passes on valid data (all core grades selected, elective credits match required)', () => {
    const grades = {
      CS101: 'A',
      CS102: 'B+',
    }
    const result = validateElectiveCredits(sampleSubjects, grades, 6, 6)

    expect(result.allCoreGradesSelected).toBe(true)
    expect(result.isElectiveCreditValid).toBe(true)
    expect(result.hasExcessElectiveCredits).toBe(false)
  })

  it('detects missing fields (one or more core subjects have no grade)', () => {
    const gradesWithMissingCore = {
      CS101: 'A',
      // CS102 is missing grade
    }
    const result = validateElectiveCredits(sampleSubjects, gradesWithMissingCore, 6, 6)

    expect(result.allCoreGradesSelected).toBe(false)
    expect(result.isElectiveCreditValid).toBe(true)
    expect(result.hasExcessElectiveCredits).toBe(false)
  })

  it('detects wrong credit totals when selected credits do not match required', () => {
    const grades = {
      CS101: 'A',
      CS102: 'B+',
    }
    const result = validateElectiveCredits(sampleSubjects, grades, 4, 6)

    expect(result.allCoreGradesSelected).toBe(true)
    expect(result.isElectiveCreditValid).toBe(false)
    expect(result.hasExcessElectiveCredits).toBe(false)
  })

  describe('boundaries at electiveCreditsRequired', () => {
    const grades = {
      CS101: 'A',
      CS102: 'B+',
    }

    it('validates exactly electiveCreditsRequired', () => {
      const result = validateElectiveCredits(sampleSubjects, grades, 6, 6)
      expect(result.isElectiveCreditValid).toBe(true)
      expect(result.hasExcessElectiveCredits).toBe(false)
    })

    it('detects insufficient elective credits (one below required)', () => {
      const result = validateElectiveCredits(sampleSubjects, grades, 5, 6)
      expect(result.isElectiveCreditValid).toBe(false)
      expect(result.hasExcessElectiveCredits).toBe(false)
    })

    it('detects excess elective credits (one above required)', () => {
      const result = validateElectiveCredits(sampleSubjects, grades, 7, 6)
      expect(result.isElectiveCreditValid).toBe(false)
      expect(result.hasExcessElectiveCredits).toBe(true)
    })
  })
})
