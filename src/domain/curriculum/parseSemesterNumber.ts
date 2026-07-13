export function parseSemesterNumber(semesterName: string): number {
  const match = semesterName.match(/\d+/)
  return match ? parseInt(match[0], 10) : 0
}
