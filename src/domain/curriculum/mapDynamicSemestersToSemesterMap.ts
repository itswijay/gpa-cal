import type { SemesterMap, Subject, SemesterSubjects } from '../../data/types'
import type { DynamicSemester } from './customDegreeForm'

export function mapDynamicSemestersToSemesterMap(
  semesters: DynamicSemester[]
): SemesterMap {
  const mappedSemesters: SemesterMap = {}

  semesters.forEach((sem) => {
    const coreSubjects: Subject[] = []
    const electiveSubjects: Subject[] = []

    sem.subjects.forEach((sub) => {
      const parsedSub: Subject = {
        code: sub.code.trim(),
        name: sub.name.trim(),
        credits: Number(sub.credits),
      }
      if (sub.isElective) {
        electiveSubjects.push(parsedSub)
      } else {
        coreSubjects.push(parsedSub)
      }
    })

    const semesterData: SemesterSubjects = {
      core: coreSubjects,
      electiveCreditsRequired: sem.electiveCreditsRequired
        ? Number(sem.electiveCreditsRequired)
        : 0,
    }

    if (electiveSubjects.length > 0) {
      semesterData.electives = electiveSubjects
    }

    mappedSemesters[sem.name] = semesterData
  })

  return mappedSemesters
}
