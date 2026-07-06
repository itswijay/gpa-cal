import { describe, it, expect } from 'vitest'
import { validateCustomDegreeForm } from './validateCustomDegreeForm'
import type { DynamicSemester } from './customDegreeForm'

describe('validateCustomDegreeForm', () => {
  const validSemester: DynamicSemester = {
    id: 'sem-1',
    name: 'Semester 1',
    subjects: [
      {
        code: 'SCS1101',
        name: 'Introduction to Programming',
        credits: '3',
      },
    ],
  }

  const defaultInput = {
    isSuggested: false,
    universityName: 'University of Colombo',
    universityShort: 'UOC',
    facultyName: 'School of Computing',
    degreeName: 'BSc in Computer Science',
    semesters: [validSemester],
  }

  it('should validate successfully for correct inputs', () => {
    const result = validateCustomDegreeForm(defaultInput)
    expect(result).toEqual({ valid: true })
  })

  describe('suggested degree checks', () => {
    it('should fail if isSuggested is true and universityName is missing', () => {
      const result = validateCustomDegreeForm({
        ...defaultInput,
        isSuggested: true,
        universityName: '   ',
      })
      expect(result).toEqual({
        valid: false,
        error: 'Please enter the full university name for suggestion.',
      })
    })

    it('should fail if isSuggested is true and universityShort is missing', () => {
      const result = validateCustomDegreeForm({
        ...defaultInput,
        isSuggested: true,
        universityShort: ' ',
      })
      expect(result).toEqual({
        valid: false,
        error: 'Please enter the university abbreviation (e.g. SUSL).',
      })
    })

    it('should fail if isSuggested is true and facultyName is missing', () => {
      const result = validateCustomDegreeForm({
        ...defaultInput,
        isSuggested: true,
        facultyName: '',
      })
      expect(result).toEqual({
        valid: false,
        error: 'Please enter the faculty name.',
      })
    })
  })

  describe('degree name checks', () => {
    it('should fail if degree name is empty', () => {
      const result = validateCustomDegreeForm({
        ...defaultInput,
        degreeName: '   ',
      })
      expect(result).toEqual({
        valid: false,
        error: 'Please enter a degree program name.',
      })
    })
  })

  describe('semester level checks', () => {
    it('should fail if any semester has zero subjects', () => {
      const emptySemester: DynamicSemester = {
        id: 'sem-2',
        name: 'Semester 2',
        subjects: [],
      }
      const result = validateCustomDegreeForm({
        ...defaultInput,
        semesters: [validSemester, emptySemester],
      })
      expect(result).toEqual({
        valid: false,
        error: 'Please add at least one subject to Semester 2.',
      })
    })
  })

  describe('subject level checks', () => {
    it('should fail if any subject is missing a code', () => {
      const invalidSemester: DynamicSemester = {
        id: 'sem-1',
        name: 'Semester 1',
        subjects: [
          {
            code: ' ',
            name: 'Mathematics',
            credits: '4',
          },
        ],
      }
      const result = validateCustomDegreeForm({
        ...defaultInput,
        semesters: [invalidSemester],
      })
      expect(result).toEqual({
        valid: false,
        error: 'Subject 1 in Semester 1 is missing a code.',
      })
    })

    it('should fail if any subject is missing a name', () => {
      const invalidSemester: DynamicSemester = {
        id: 'sem-1',
        name: 'Semester 1',
        subjects: [
          {
            code: 'MATH101',
            name: ' ',
            credits: '4',
          },
        ],
      }
      const result = validateCustomDegreeForm({
        ...defaultInput,
        semesters: [invalidSemester],
      })
      expect(result).toEqual({
        valid: false,
        error: 'Subject 1 in Semester 1 is missing a name.',
      })
    })

    it('should fail if credits is non-numeric', () => {
      const invalidSemester: DynamicSemester = {
        id: 'sem-1',
        name: 'Semester 1',
        subjects: [
          {
            code: 'MATH101',
            name: 'Mathematics',
            credits: 'abc',
          },
        ],
      }
      const result = validateCustomDegreeForm({
        ...defaultInput,
        semesters: [invalidSemester],
      })
      expect(result).toEqual({
        valid: false,
        error: 'Subject "MATH101" in Semester 1 must have credits between 1 and 12.',
      })
    })

    it('should fail if credits is zero', () => {
      const invalidSemester: DynamicSemester = {
        id: 'sem-1',
        name: 'Semester 1',
        subjects: [
          {
            code: 'MATH101',
            name: 'Mathematics',
            credits: '0',
          },
        ],
      }
      const result = validateCustomDegreeForm({
        ...defaultInput,
        semesters: [invalidSemester],
      })
      expect(result).toEqual({
        valid: false,
        error: 'Subject "MATH101" in Semester 1 must have credits between 1 and 12.',
      })
    })

    it('should fail if credits is negative', () => {
      const invalidSemester: DynamicSemester = {
        id: 'sem-1',
        name: 'Semester 1',
        subjects: [
          {
            code: 'MATH101',
            name: 'Mathematics',
            credits: '-2',
          },
        ],
      }
      const result = validateCustomDegreeForm({
        ...defaultInput,
        semesters: [invalidSemester],
      })
      expect(result).toEqual({
        valid: false,
        error: 'Subject "MATH101" in Semester 1 must have credits between 1 and 12.',
      })
    })

    it('should fail if credits is over 12', () => {
      const invalidSemester: DynamicSemester = {
        id: 'sem-1',
        name: 'Semester 1',
        subjects: [
          {
            code: 'MATH101',
            name: 'Mathematics',
            credits: '13',
          },
        ],
      }
      const result = validateCustomDegreeForm({
        ...defaultInput,
        semesters: [invalidSemester],
      })
      expect(result).toEqual({
        valid: false,
        error: 'Subject "MATH101" in Semester 1 must have credits between 1 and 12.',
      })
    })
  })
})
