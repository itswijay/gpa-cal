import type { SemesterMap, Subject } from '../../data/types'

function normalizeSubjects(subjects: Subject[] | undefined): Subject[] {
  return [...(subjects ?? [])]
    .map((subj) => ({ code: subj.code.trim(), name: subj.name.trim(), credits: subj.credits }))
    .sort((a, b) => a.code.localeCompare(b.code))
}

function subjectsEqual(a: Subject[], b: Subject[]): boolean {
  if (a.length !== b.length) return false
  return a.every(
    (subj, i) =>
      subj.code === b[i].code && subj.name === b[i].name && subj.credits === b[i].credits
  )
}

/**
 * Determine whether a proposed curriculum differs from what's currently public,
 * comparing subject order-insensitively so a reordered-but-identical array
 * doesn't register as a change.
 */
export function hasCurriculumChanged(
  existing: SemesterMap | null,
  proposed: SemesterMap
): boolean {
  if (existing === null) return true

  const existingKeys = Object.keys(existing)
  const proposedKeys = Object.keys(proposed)
  if (existingKeys.length !== proposedKeys.length) return true
  if (existingKeys.some((key) => !(key in proposed))) return true

  for (const semesterName of existingKeys) {
    const existingSem = existing[semesterName]
    const proposedSem = proposed[semesterName]

    if (existingSem.electiveCreditsRequired !== proposedSem.electiveCreditsRequired) return true
    if (!subjectsEqual(normalizeSubjects(existingSem.core), normalizeSubjects(proposedSem.core))) return true
    if (!subjectsEqual(normalizeSubjects(existingSem.electives), normalizeSubjects(proposedSem.electives))) return true
  }

  return false
}
