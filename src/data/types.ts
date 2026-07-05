import type { Timestamp } from 'firebase/firestore'
export type { Timestamp }

export type Subject = {
  code: string
  name: string
  credits: number
}

export type SemesterSubjects = {
  core: Subject[]
  electives?: Subject[]
  electiveCreditsRequired: number
}

export type SemesterMap = {
  [semester: string]: SemesterSubjects
}

export type DegreeMap = {
  [degree: string]: SemesterMap
}

export type FacultyMap = {
  [faculty: string]: DegreeMap
}

export interface GPAEntry {
  id?: string
  semester: string
  gpa: number
  credits: number
  grades?: Record<string, string>
  university?: string
  faculty?: string
  degree?: string
  isDraft?: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}
