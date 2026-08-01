export interface PublicUniversityLookup {
  shortName: string
  faculties: Record<string, Record<string, unknown>>
}

export interface IsDuplicatePublicDegreeParams {
  universityShort: string
  facultyName: string
  degreeName: string
  preloadedUniversities: PublicUniversityLookup[]
}

function normalize(value: string): string {
  return value.toLowerCase().trim()
}

/**
 * Determine whether a degree with the same university, faculty and degree name
 * already exists in the public curricula. All three parts are compared
 * case-insensitively and whitespace-trimmed, so " data science " collides with
 * "Data Science". Returns false when the university or faculty isn't found at all.
 */
export function isDuplicatePublicDegree({
  universityShort,
  facultyName,
  degreeName,
  preloadedUniversities,
}: IsDuplicatePublicDegreeParams): boolean {
  const uShort = normalize(universityShort)
  const fName = normalize(facultyName)
  const dName = normalize(degreeName)

  const matchedUni = preloadedUniversities.find(
    (uni) => normalize(uni.shortName) === uShort
  )
  if (!matchedUni) return false

  const facultyKeys = Object.keys(matchedUni.faculties || {})
  const matchedFaculty = facultyKeys.find((fac) => normalize(fac) === fName)
  if (matchedFaculty === undefined) return false

  const degreeKeys = Object.keys(matchedUni.faculties[matchedFaculty] || {})
  return degreeKeys.some((deg) => normalize(deg) === dName)
}
