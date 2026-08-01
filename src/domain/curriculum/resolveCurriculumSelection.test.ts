import { describe, it, expect } from 'vitest'
import type { CurriculumSelectionUniversity } from './resolveCurriculumSelection'
import { resolveCurriculumSelection } from './resolveCurriculumSelection'

describe('resolveCurriculumSelection', () => {
  const preloadedUniversities: CurriculumSelectionUniversity[] = [
    {
      shortName: 'SLIIT',
      faculties: {
        Computing: {
          'Data Science': {},
          'Software Engineering': {},
        },
        'Faculty of Business': {
          'Business Administration': {},
        },
      },
    },
  ]

  const base = {
    universityShort: 'SLIIT',
    facultyName: '',
    degreeName: '',
    degreeNameWasTyped: false,
    preloadedUniversities,
  }

  it('returns null when there is no university to resolve from', () => {
    expect(resolveCurriculumSelection({ ...base, universityShort: '' })).toBeNull()
  })

  it('returns null when no preloaded universities have been fetched yet', () => {
    expect(resolveCurriculumSelection({ ...base, preloadedUniversities: [] })).toBeNull()
  })

  it('sends everything to custom when the university is not in the list', () => {
    expect(resolveCurriculumSelection({ ...base, universityShort: 'UOM' })).toEqual({
      selectedUniversityOption: 'custom',
      preloadedFaculties: [],
      selectedFacultyOption: 'custom',
      normalizedFacultyName: null,
      preloadedDegrees: [],
      selectedDegreeOption: 'custom',
      normalizedDegreeName: null,
    })
  })

  it('resolves the university only, leaving faculty and degree alone, when no faculty is set', () => {
    expect(resolveCurriculumSelection(base)).toEqual({
      selectedUniversityOption: 'SLIIT',
      preloadedFaculties: ['Computing', 'Faculty of Business'],
      selectedFacultyOption: null,
      normalizedFacultyName: null,
      preloadedDegrees: null,
      selectedDegreeOption: null,
      normalizedDegreeName: null,
    })
  })

  it('sends faculty and degree to custom when the faculty is not in the list', () => {
    expect(
      resolveCurriculumSelection({ ...base, facultyName: 'Faculty of Medicine' })
    ).toEqual({
      selectedUniversityOption: 'SLIIT',
      preloadedFaculties: ['Computing', 'Faculty of Business'],
      selectedFacultyOption: 'custom',
      normalizedFacultyName: null,
      preloadedDegrees: [],
      selectedDegreeOption: 'custom',
      normalizedDegreeName: null,
    })
  })

  it('normalizes the casing of a fully matched university, faculty and degree', () => {
    expect(
      resolveCurriculumSelection({
        ...base,
        universityShort: 'sliit',
        facultyName: ' computing ',
        degreeName: 'data science',
      })
    ).toEqual({
      selectedUniversityOption: 'SLIIT',
      preloadedFaculties: ['Computing', 'Faculty of Business'],
      selectedFacultyOption: 'Computing',
      normalizedFacultyName: 'Computing',
      preloadedDegrees: ['Data Science', 'Software Engineering'],
      selectedDegreeOption: 'Data Science',
      normalizedDegreeName: 'Data Science',
    })
  })

  it('leaves the degree alone when the name was typed by hand, even on an exact match', () => {
    expect(
      resolveCurriculumSelection({
        ...base,
        facultyName: 'Computing',
        degreeName: 'Data Science',
        degreeNameWasTyped: true,
      })
    ).toEqual({
      selectedUniversityOption: 'SLIIT',
      preloadedFaculties: ['Computing', 'Faculty of Business'],
      selectedFacultyOption: 'Computing',
      normalizedFacultyName: 'Computing',
      preloadedDegrees: ['Data Science', 'Software Engineering'],
      selectedDegreeOption: null,
      normalizedDegreeName: null,
    })
  })

  it('resolves the faculty but leaves the degree alone when no degree is set', () => {
    expect(resolveCurriculumSelection({ ...base, facultyName: 'Computing' })).toEqual({
      selectedUniversityOption: 'SLIIT',
      preloadedFaculties: ['Computing', 'Faculty of Business'],
      selectedFacultyOption: 'Computing',
      normalizedFacultyName: 'Computing',
      preloadedDegrees: ['Data Science', 'Software Engineering'],
      selectedDegreeOption: null,
      normalizedDegreeName: null,
    })
  })

  it('sends the degree to custom when the name does not match any preloaded degree', () => {
    expect(
      resolveCurriculumSelection({
        ...base,
        facultyName: 'Computing',
        degreeName: 'Marine Biology',
      })
    ).toEqual({
      selectedUniversityOption: 'SLIIT',
      preloadedFaculties: ['Computing', 'Faculty of Business'],
      selectedFacultyOption: 'Computing',
      normalizedFacultyName: 'Computing',
      preloadedDegrees: ['Data Science', 'Software Engineering'],
      selectedDegreeOption: 'custom',
      normalizedDegreeName: null,
    })
  })
})
