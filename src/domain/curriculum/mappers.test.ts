import { describe, it, expect } from 'vitest'
import { mapSemesterMapToDynamicSemesters } from './mapSemesterMapToDynamicSemesters'
import { mapDynamicSemestersToSemesterMap } from './mapDynamicSemestersToSemesterMap'
import type { SemesterMap } from '../../data/types'
import type { DynamicSemester } from './customDegreeForm'

describe('custom degree mappers', () => {
  describe('mapSemesterMapToDynamicSemesters (loading mapper)', () => {
    it('should split core and electives correctly and convert credits to strings', () => {
      const mockSemesterMap: SemesterMap = {
        'Semester 1': {
          core: [
            { code: 'CS101', name: 'Core Subj', credits: 3 },
          ],
          electives: [
            { code: 'EL101', name: 'Elec Subj', credits: 4 },
          ],
          electiveCreditsRequired: 3,
        },
      }

      const result = mapSemesterMapToDynamicSemesters(mockSemesterMap)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: 'sem_1',
        name: 'Semester 1',
        electiveCreditsRequired: '3',
        subjects: [
          { code: 'CS101', name: 'Core Subj', credits: '3', isElective: false },
          { code: 'EL101', name: 'Elec Subj', credits: '4', isElective: true },
        ],
      })
    })

    it('should sort semesters numerically based on name digits', () => {
      const mockSemesterMap: SemesterMap = {
        'Semester 10': { core: [], electiveCreditsRequired: 0 },
        'Semester 2': { core: [], electiveCreditsRequired: 0 },
        'Semester 1': { core: [], electiveCreditsRequired: 0 },
      }

      const result = mapSemesterMapToDynamicSemesters(mockSemesterMap)

      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Semester 1')
      expect(result[1].name).toBe('Semester 2')
      expect(result[2].name).toBe('Semester 10')
      expect(result[0].id).toBe('sem_1')
      expect(result[1].id).toBe('sem_2')
      expect(result[2].id).toBe('sem_3')
    })

    it('should handle empty semesters or missing fields gracefully', () => {
      const result = mapSemesterMapToDynamicSemesters({})
      expect(result).toEqual([])
    })
  })

  describe('mapDynamicSemestersToSemesterMap (saving mapper)', () => {
    it('should map core/electives, trim names/codes, and parse credits to numbers', () => {
      const mockDynamicSemesters: DynamicSemester[] = [
        {
          id: 'sem_1',
          name: 'Semester 1',
          electiveCreditsRequired: '3',
          subjects: [
            { code: ' CS101 ', name: ' Core Subj ', credits: '3', isElective: false },
            { code: 'EL101', name: 'Elec Subj', credits: '4', isElective: true },
          ],
        },
      ]

      const result = mapDynamicSemestersToSemesterMap(mockDynamicSemesters)

      expect(result['Semester 1']).toBeDefined()
      expect(result['Semester 1'].core).toEqual([
        { code: 'CS101', name: 'Core Subj', credits: 3 },
      ])
      expect(result['Semester 1'].electives).toEqual([
        { code: 'EL101', name: 'Elec Subj', credits: 4 },
      ])
      expect(result['Semester 1'].electiveCreditsRequired).toBe(3)
    })

    it('should omit the electives key when there are no elective subjects', () => {
      const mockDynamicSemesters: DynamicSemester[] = [
        {
          id: 'sem_1',
          name: 'Semester 1',
          electiveCreditsRequired: '0',
          subjects: [
            { code: 'CS101', name: 'Core Subj', credits: '3', isElective: false },
          ],
        },
      ]

      const result = mapDynamicSemestersToSemesterMap(mockDynamicSemesters)

      expect(result['Semester 1']).toBeDefined()
      expect(result['Semester 1'].electives).toBeUndefined()
    })
  })

  describe('round-trip integration test', () => {
    it('should preserve semester contents across a load-and-save round trip', () => {
      const originalMap: SemesterMap = {
        'Semester 1': {
          core: [
            { code: 'CS101', name: 'Core Subj', credits: 3 },
          ],
          electives: [
            { code: 'EL101', name: 'Elec Subj', credits: 4 },
          ],
          electiveCreditsRequired: 3,
        },
        'Semester 2': {
          core: [
            { code: 'CS201', name: 'Another Core', credits: 2 },
          ],
          electiveCreditsRequired: 0,
        },
      }

      const loaded = mapSemesterMapToDynamicSemesters(originalMap)
      const saved = mapDynamicSemestersToSemesterMap(loaded)

      expect(saved).toEqual(originalMap)
    })
  })
})
