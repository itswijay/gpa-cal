import { describe, it, expect } from 'vitest'
import { validateImportData } from './validateImportData'

describe('validateImportData', () => {
  it('passes on valid import data (valid data)', () => {
    const validData = [
      {
        semester: 'Semester 1',
        gpa: 3.5,
        credits: 15,
        grades: { CS101: 'A', CS102: 'B+' },
        faculty: 'Computing',
        degree: 'Software Engineering',
        isDraft: false,
      },
      {
        semester: 'Semester 2',
        gpa: 3.72,
        credits: 16,
        grades: { CS201: 'A-' },
        isDraft: true,
      },
    ]

    const result = validateImportData(validData)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(result.data).toHaveLength(2)
    expect(result.data?.[0].semester).toBe('Semester 1')
    expect(result.data?.[1].isDraft).toBe(true)
  })

  it('fails when imported data is not an array or is empty (missing fields / bad format)', () => {
    expect(validateImportData(null).isValid).toBe(false)
    expect(validateImportData({}).isValid).toBe(false)
    expect(validateImportData([]).isValid).toBe(false)
    expect(validateImportData([]).errors[0]).toContain('empty')
  })

  it('fails when required fields are missing or invalid (missing fields)', () => {
    const missingSemester = [
      { gpa: 3.5, credits: 15 },
    ]
    const invalidGpa = [
      { semester: 'Semester 1', gpa: 'three point five', credits: 15 },
    ]
    const outOfBoundsGpa = [
      { semester: 'Semester 1', gpa: 4.5, credits: 15 },
    ]
    const negativeGpa = [
      { semester: 'Semester 1', gpa: -0.5, credits: 15 },
    ]
    const zeroCredits = [
      { semester: 'Semester 1', gpa: 3.5, credits: 0 },
    ]
    const negativeCredits = [
      { semester: 'Semester 1', gpa: 3.5, credits: -5 },
    ]
    const invalidGrades = [
      { semester: 'Semester 1', gpa: 3.5, credits: 15, grades: 'A' },
    ]

    expect(validateImportData(missingSemester).isValid).toBe(false)
    expect(validateImportData(missingSemester).errors[0]).toContain('semester')

    expect(validateImportData(invalidGpa).isValid).toBe(false)
    expect(validateImportData(invalidGpa).errors[0]).toContain('GPA')

    expect(validateImportData(outOfBoundsGpa).isValid).toBe(false)
    expect(validateImportData(outOfBoundsGpa).errors[0]).toContain('GPA')

    expect(validateImportData(negativeGpa).isValid).toBe(false)
    expect(validateImportData(negativeGpa).errors[0]).toContain('GPA')

    expect(validateImportData(zeroCredits).isValid).toBe(false)
    expect(validateImportData(zeroCredits).errors[0]).toContain('credits')

    expect(validateImportData(negativeCredits).isValid).toBe(false)
    expect(validateImportData(negativeCredits).errors[0]).toContain('credits')

    expect(validateImportData(invalidGrades).isValid).toBe(false)
    expect(validateImportData(invalidGrades).errors[0]).toContain('grades')
  })

  it('fails when duplicate semesters are present (duplicate semesters)', () => {
    const duplicateData = [
      { semester: 'Semester 1', gpa: 3.5, credits: 15 },
      { semester: 'Semester 1', gpa: 3.6, credits: 16 },
    ]
    const result = validateImportData(duplicateData)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Duplicate semester')
  })
})
