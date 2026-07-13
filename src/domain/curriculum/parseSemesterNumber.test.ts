import { describe, it, expect } from 'vitest'
import { parseSemesterNumber } from './parseSemesterNumber'

describe('parseSemesterNumber', () => {
  it('extracts 1 from "Semester 1"', () => {
    expect(parseSemesterNumber('Semester 1')).toBe(1)
  })

  it('extracts 10 from "Semester 10"', () => {
    expect(parseSemesterNumber('Semester 10')).toBe(10)
  })

  it('extracts 2 from "Semester 2"', () => {
    expect(parseSemesterNumber('Semester 2')).toBe(2)
  })

  it('returns 0 when no number is present', () => {
    expect(parseSemesterNumber('No number here')).toBe(0)
  })
})
