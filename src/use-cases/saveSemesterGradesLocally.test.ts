import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveSemesterGradesLocally } from './saveSemesterGradesLocally'
import { saveSemesterDataLocally } from '../adapters/storage/localGpaStore'
import type { Subject } from '../data/types'

vi.mock('../adapters/storage/localGpaStore', () => ({
  saveSemesterDataLocally: vi.fn(),
}))

describe('saveSemesterGradesLocally use-case', () => {
  const mockSubjects: Subject[] = [
    { code: 'SUB1', name: 'Subject 1', credits: 3 },
    { code: 'SUB2', name: 'Subject 2', credits: 2 },
  ]

  const mockElectives: Subject[] = [
    { code: 'ELE1', name: 'Elective 1', credits: 3 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prepares and saves a semester entry locally', async () => {
    const input = {
      semester: 'Semester 1',
      subjects: mockSubjects,
      electives: mockElectives,
      grades: {
        SUB1: 'A',
        SUB2: 'B',
        ELE1: 'A',
      },
      electiveCreditsRequired: 3,
      university: 'SUSL',
      faculty: 'Computing',
      degree: 'SE',
    }

    const result = await saveSemesterGradesLocally(input)

    expect(result.isDraft).toBe(false)
    expect(result.credits).toBe(8)
    expect(result.gpa).toBe(3.75)
    expect(saveSemesterDataLocally).toHaveBeenCalledTimes(1)
    expect(saveSemesterDataLocally).toHaveBeenCalledWith(result)
  })
})
