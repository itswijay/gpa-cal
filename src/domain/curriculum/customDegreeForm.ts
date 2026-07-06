export interface DynamicSubject {
  code: string
  name: string
  credits: string
  isElective?: boolean
}

export interface DynamicSemester {
  id: string
  name: string
  electiveCreditsRequired?: string
  subjects: DynamicSubject[]
}
