import type { DegreeGpaConfig } from '../../data/types'

const key = (faculty: string, degree: string) => `gpaConfig::${faculty}::${degree}`

export function getGpaMethodPreference(faculty: string, degree: string): DegreeGpaConfig | null {
  try {
    const raw = localStorage.getItem(key(faculty, degree))
    return raw ? (JSON.parse(raw) as DegreeGpaConfig) : null
  } catch {
    return null
  }
}

export function saveGpaMethodPreference(
  faculty: string,
  degree: string,
  config: DegreeGpaConfig
): void {
  localStorage.setItem(key(faculty, degree), JSON.stringify(config))
}

export function clearGpaMethodPreference(faculty: string, degree: string): void {
  localStorage.removeItem(key(faculty, degree))
}
