import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveSemesterGrades } from './saveSemesterGrades'
import { saveSemesterData } from '../adapters/firebase/gpaRepository'
import type { Subject } from '../data/types'

vi.mock('../adapters/firebase/gpaRepository', () => ({
  saveSemesterData: vi.fn().mockResolvedValue(undefined),
}))

describe('saveSemesterGrades use-case', () => {
  const mockSubjects: Subject[] = [
    { code: 'SUB1', name: 'Subject 1', credits: 3 },
    { code: 'SUB2', name: 'Subject 2', credits: 2 },
  ]

  const mockElectives: Subject[] = [
    { code: 'ELE1', name: 'Elective 1', credits: 3 },
    { code: 'ELE2', name: 'Elective 2', credits: 2 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saves a complete semester (not a draft) when all core and correct elective credits are selected', async () => {
    const input = {
      userId: 'user123',
      semester: 'Semester 1',
      subjects: mockSubjects,
      electives: mockElectives,
      grades: {
        SUB1: 'A', // 4.0
        SUB2: 'B', // 3.0
        ELE1: 'A', // 4.0
      },
      electiveCreditsRequired: 3,
      university: 'SUSL',
      faculty: 'Computing',
      degree: 'SE',
    }

    const result = await saveSemesterGrades(input)

    expect(result.isDraft).toBe(false)
    expect(result.credits).toBe(8) // 3 + 2 (core) + 3 (elective required)
    // GPA computation: (4.0 * 3 + 3.0 * 2 + 4.0 * 3) / (3 + 2 + 3) = (12 + 6 + 12) / 8 = 30 / 8 = 3.75
    expect(result.gpa).toBe(3.75)
    expect(saveSemesterData).toHaveBeenCalledTimes(1)
    expect(saveSemesterData).toHaveBeenCalledWith('user123', result)
  })

  it('saves a draft semester when core grades are missing', async () => {
    const input = {
      userId: 'user123',
      semester: 'Semester 1',
      subjects: mockSubjects,
      electives: mockElectives,
      grades: {
        SUB1: 'A',
        ELE1: 'A',
      },
      electiveCreditsRequired: 3,
      university: 'SUSL',
      faculty: 'Computing',
      degree: 'SE',
    }

    const result = await saveSemesterGrades(input)

    expect(result.isDraft).toBe(true)
    expect(result.credits).toBe(8)
    expect(saveSemesterData).toHaveBeenCalledTimes(1)
  })

  it('saves a draft semester when elective credits do not match the required amount', async () => {
    const input = {
      userId: 'user123',
      semester: 'Semester 1',
      subjects: mockSubjects,
      electives: mockElectives,
      grades: {
        SUB1: 'A',
        SUB2: 'B',
        ELE2: 'A', // only 2 elective credits, but 3 are required
      },
      electiveCreditsRequired: 3,
      university: 'SUSL',
      faculty: 'Computing',
      degree: 'SE',
    }

    const result = await saveSemesterGrades(input)

    expect(result.isDraft).toBe(true)
    expect(result.credits).toBe(8)
    expect(saveSemesterData).toHaveBeenCalledTimes(1)
  })
})
