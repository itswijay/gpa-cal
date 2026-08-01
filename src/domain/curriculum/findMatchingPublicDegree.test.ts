import { describe, it, expect } from 'vitest'
import type { PublicUniversityLookup } from './findMatchingPublicDegree'
import { isDuplicatePublicDegree } from './findMatchingPublicDegree'

describe('isDuplicatePublicDegree', () => {
  const preloadedUniversities: PublicUniversityLookup[] = [
    {
      shortName: 'SUSL',
      faculties: {
        Computing: {
          'Data Science': {},
          'Software Engineering': {},
        },
        'Applied Sciences': {
          Physics: {},
        },
      },
    },
    {
      shortName: 'UOM',
      faculties: {
        Engineering: {
          'Computer Science': {},
        },
      },
    },
  ]

  it('returns true when the university, faculty and degree name all match', () => {
    expect(
      isDuplicatePublicDegree({
        universityShort: 'SUSL',
        facultyName: 'Computing',
        degreeName: 'Data Science',
        preloadedUniversities,
      })
    ).toBe(true)
  })

  it('returns false when the same degree name sits under a different faculty', () => {
    expect(
      isDuplicatePublicDegree({
        universityShort: 'SUSL',
        facultyName: 'Applied Sciences',
        degreeName: 'Data Science',
        preloadedUniversities,
      })
    ).toBe(false)
  })

  it('returns false when the same degree name sits under a different university', () => {
    expect(
      isDuplicatePublicDegree({
        universityShort: 'UOM',
        facultyName: 'Computing',
        degreeName: 'Data Science',
        preloadedUniversities,
      })
    ).toBe(false)
  })

  it('returns true when the only difference is casing and surrounding whitespace', () => {
    expect(
      isDuplicatePublicDegree({
        universityShort: ' susl ',
        facultyName: '  computing',
        degreeName: ' data science ',
        preloadedUniversities,
      })
    ).toBe(true)
  })

  it('returns false when no degree matches anywhere', () => {
    expect(
      isDuplicatePublicDegree({
        universityShort: 'SUSL',
        facultyName: 'Computing',
        degreeName: 'Marine Biology',
        preloadedUniversities,
      })
    ).toBe(false)
  })

  it('returns false when the university is not in the public list at all', () => {
    expect(
      isDuplicatePublicDegree({
        universityShort: 'UOC',
        facultyName: 'Computing',
        degreeName: 'Data Science',
        preloadedUniversities,
      })
    ).toBe(false)
  })

  it('returns false when there are no preloaded universities', () => {
    expect(
      isDuplicatePublicDegree({
        universityShort: 'SUSL',
        facultyName: 'Computing',
        degreeName: 'Data Science',
        preloadedUniversities: [],
      })
    ).toBe(false)
  })
})
