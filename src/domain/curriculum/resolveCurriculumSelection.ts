export interface CurriculumSelectionUniversity {
  shortName: string
  faculties: Record<string, Record<string, unknown>>
}

export interface ResolveCurriculumSelectionParams {
  universityShort: string
  facultyName: string
  degreeName: string
  degreeNameWasTyped: boolean
  preloadedUniversities: CurriculumSelectionUniversity[]
}

export interface CurriculumSelectionResult {
  selectedUniversityOption: string
  preloadedFaculties: string[]
  selectedFacultyOption: string | null
  normalizedFacultyName: string | null
  preloadedDegrees: string[] | null
  selectedDegreeOption: string | null
  normalizedDegreeName: string | null
}

function normalize(value: string): string {
  return value.toLowerCase().trim()
}

/**
 * Work out what the university/faculty/degree dropdowns should show for a given set of
 * form values, without touching React state.
 *
 * `null` on a field means "leave that piece of state alone" — distinct from setting it to
 * an empty string. The distinction is load-bearing: `''` renders a dropdown's placeholder
 * while `'custom'` renders "Other / Custom …", so a field that resolution doesn't reach
 * must keep whatever value it already had. Returns `null` overall when there is nothing to
 * resolve from.
 */
export function resolveCurriculumSelection({
  universityShort,
  facultyName,
  degreeName,
  degreeNameWasTyped,
  preloadedUniversities,
}: ResolveCurriculumSelectionParams): CurriculumSelectionResult | null {
  if (!universityShort || preloadedUniversities.length === 0) return null

  // Deliberately an exact compare against the uppercased input rather than the
  // lowercase-both-sides used for faculty and degree: the preloaded list is built with
  // uppercased shortName keys, so the two are equivalent for real data.
  const uShort = universityShort.toUpperCase().trim()
  const matchedUni = preloadedUniversities.find((uni) => uni.shortName === uShort)

  if (!matchedUni) {
    return {
      selectedUniversityOption: 'custom',
      preloadedFaculties: [],
      selectedFacultyOption: 'custom',
      normalizedFacultyName: null,
      preloadedDegrees: [],
      selectedDegreeOption: 'custom',
      normalizedDegreeName: null,
    }
  }

  const facNames = Object.keys(matchedUni.faculties || {})
  const resolved: CurriculumSelectionResult = {
    selectedUniversityOption: uShort,
    preloadedFaculties: facNames,
    selectedFacultyOption: null,
    normalizedFacultyName: null,
    preloadedDegrees: null,
    selectedDegreeOption: null,
    normalizedDegreeName: null,
  }

  // Without a faculty name there is nothing to match, so faculty and degree state is left
  // untouched rather than reset.
  if (!facultyName) return resolved

  const matchedFaculty = facNames.find((fac) => normalize(fac) === normalize(facultyName))

  if (!matchedFaculty) {
    return {
      ...resolved,
      selectedFacultyOption: 'custom',
      preloadedDegrees: [],
      selectedDegreeOption: 'custom',
    }
  }

  const degNames = Object.keys(matchedUni.faculties[matchedFaculty] || {})
  resolved.selectedFacultyOption = matchedFaculty
  resolved.normalizedFacultyName = matchedFaculty
  resolved.preloadedDegrees = degNames

  // A hand-typed degree name is left entirely alone — resolving it would rewrite and lock
  // the input while the user is still typing.
  if (!degreeName || degreeNameWasTyped) return resolved

  const matchedDegree = degNames.find((deg) => normalize(deg) === normalize(degreeName))

  if (matchedDegree) {
    resolved.selectedDegreeOption = matchedDegree
    resolved.normalizedDegreeName = matchedDegree
  } else {
    resolved.selectedDegreeOption = 'custom'
  }

  return resolved
}
