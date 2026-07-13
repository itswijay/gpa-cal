import { describe, it, expect } from 'vitest'
import { buildSuggestionNotificationMessage } from './buildSuggestionNotificationMessage'

describe('buildSuggestionNotificationMessage', () => {
  const base = {
    degreeName: 'BSc in Software Engineering',
    universityName: 'Sabaragamuwa University of Sri Lanka',
    facultyName: 'Computing',
  }

  it('returns the combined message when both curriculum and GPA method changed', () => {
    const result = buildSuggestionNotificationMessage({
      ...base,
      isCurriculumChange: true,
      gpaMethod: 'year-weighted',
    })
    expect(result).toBe(
      '🎓📊 New curriculum + GPA method suggestion: BSc in Software Engineering at Sabaragamuwa University of Sri Lanka (Computing). Review in the admin panel.'
    )
  })

  it('returns the curriculum-only message when only the curriculum changed', () => {
    const result = buildSuggestionNotificationMessage({
      ...base,
      isCurriculumChange: true,
      gpaMethod: 'normal',
    })
    expect(result).toBe(
      '🎓 New curriculum suggestion: BSc in Software Engineering at Sabaragamuwa University of Sri Lanka (Computing). Review in the admin panel.'
    )
  })

  it('returns the GPA-method-only message when only the GPA method changed', () => {
    const result = buildSuggestionNotificationMessage({
      ...base,
      isCurriculumChange: false,
      gpaMethod: 'year-weighted',
    })
    expect(result).toBe(
      '📊 New GPA method suggestion (Year-Weighted) for BSc in Software Engineering at Sabaragamuwa University of Sri Lanka (Computing) — no curriculum changes. Review in the admin panel.'
    )
  })

  it('falls back to the curriculum-suggestion message when neither changed', () => {
    const result = buildSuggestionNotificationMessage({
      ...base,
      isCurriculumChange: false,
      gpaMethod: undefined,
    })
    expect(result).toBe(
      '🎓 New curriculum suggestion: BSc in Software Engineering at Sabaragamuwa University of Sri Lanka (Computing). Review in the admin panel.'
    )
  })
})
