import { describe, it, expect } from 'vitest'
import type { SemesterMap } from '../../data/types'
import { hasCurriculumChanged } from './hasCurriculumChanged'

describe('hasCurriculumChanged', () => {
  const baseSemesters: SemesterMap = {
    'Semester 1': {
      core: [
        { code: 'CS101', name: 'Intro to CS', credits: 3 },
        { code: 'CS102', name: 'Data Structures', credits: 4 },
      ],
      electives: [{ code: 'EL101', name: 'Elective One', credits: 2 }],
      electiveCreditsRequired: 2,
    },
  }

  it('returns false for identical input', () => {
    const proposed: SemesterMap = JSON.parse(JSON.stringify(baseSemesters))
    expect(hasCurriculumChanged(baseSemesters, proposed)).toBe(false)
  })

  it('returns true when a subject credit value changed', () => {
    const proposed: SemesterMap = JSON.parse(JSON.stringify(baseSemesters))
    proposed['Semester 1'].core[1].credits = 5
    expect(hasCurriculumChanged(baseSemesters, proposed)).toBe(true)
  })

  it('returns false when a core subject array is reordered but otherwise identical', () => {
    const proposed: SemesterMap = {
      'Semester 1': {
        core: [
          { code: 'CS102', name: 'Data Structures', credits: 4 },
          { code: 'CS101', name: 'Intro to CS', credits: 3 },
        ],
        electives: [{ code: 'EL101', name: 'Elective One', credits: 2 }],
        electiveCreditsRequired: 2,
      },
    }
    expect(hasCurriculumChanged(baseSemesters, proposed)).toBe(false)
  })

  it('returns true when a semester is added', () => {
    const proposed: SemesterMap = JSON.parse(JSON.stringify(baseSemesters))
    proposed['Semester 2'] = {
      core: [{ code: 'CS201', name: 'Algorithms', credits: 3 }],
      electiveCreditsRequired: 0,
    }
    expect(hasCurriculumChanged(baseSemesters, proposed)).toBe(true)
  })

  it('returns true when a core subject is removed', () => {
    const proposed: SemesterMap = {
      'Semester 1': {
        core: [{ code: 'CS101', name: 'Intro to CS', credits: 3 }],
        electives: [{ code: 'EL101', name: 'Elective One', credits: 2 }],
        electiveCreditsRequired: 2,
      },
    }
    expect(hasCurriculumChanged(baseSemesters, proposed)).toBe(true)
  })

  it('returns true when existing is null', () => {
    expect(hasCurriculumChanged(null, baseSemesters)).toBe(true)
  })

  it('returns false when a subject name only differs by leading/trailing whitespace', () => {
    const proposed: SemesterMap = {
      'Semester 1': {
        core: [
          { code: 'CS101', name: 'Intro to CS', credits: 3 },
          { code: 'CS102', name: ' Data Structures ', credits: 4 },
        ],
        electives: [{ code: 'EL101', name: 'Elective One', credits: 2 }],
        electiveCreditsRequired: 2,
      },
    }
    expect(hasCurriculumChanged(baseSemesters, proposed)).toBe(false)
  })
})
