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
  createdAt?: any
  updatedAt?: any
}

export interface ImportValidation {
  isValid: boolean
  errors: string[]
  data?: GPAEntry[]
}

/**
 * Validate imported JSON data structure
 */
export function validateImportData(data: unknown): ImportValidation {
  const errors: string[] = []

  // Check if data is an array
  if (!Array.isArray(data)) {
    errors.push('Imported data must be an array of semester records')
    return { isValid: false, errors }
  }

  if (data.length === 0) {
    errors.push('Imported data is empty')
    return { isValid: false, errors }
  }

  const validEntries: GPAEntry[] = []
  const semesters = new Set<string>()

  data.forEach((entry, index) => {
    // Check required fields
    if (!entry || typeof entry !== 'object') {
      errors.push(`Record ${index + 1}: Invalid record format`)
      return
    }
    if (!entry.semester) {
      errors.push(`Record ${index + 1}: Missing semester field`)
      return
    }
    if (typeof entry.gpa !== 'number' || entry.gpa < 0 || entry.gpa > 4) {
      errors.push(
        `Record ${index + 1}: Invalid GPA (must be a number between 0 and 4)`
      )
      return
    }
    if (typeof entry.credits !== 'number' || entry.credits <= 0) {
      errors.push(
        `Record ${index + 1}: Invalid credits (must be a positive number)`
      )
      return
    }

    // Check for duplicate semesters
    if (semesters.has(entry.semester)) {
      errors.push(`Record ${index + 1}: Duplicate semester "${entry.semester}"`)
      return
    }

    semesters.add(entry.semester)

    // Validate grades if present
    if (entry.grades && typeof entry.grades !== 'object') {
      errors.push(`Record ${index + 1}: Invalid grades format`)
      return
    }

    validEntries.push({
      semester: entry.semester,
      gpa: entry.gpa,
      credits: entry.credits,
      grades: entry.grades || {},
      faculty: entry.faculty || undefined,
      degree: entry.degree || undefined,
      isDraft: entry.isDraft || false,
    })
  })

  return {
    isValid: errors.length === 0,
    errors,
    data: validEntries,
  }
}
