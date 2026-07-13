import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from './config'
import type { SemesterMap, GpaMethod, YearWeightedGpaConfig, DegreeGpaConfig } from '../../data/types'
import { notifyAdmin } from '../notifications/notifyAdmin'

export interface CustomDegreeData {
  universityName?: string
  universityShort?: string
  facultyName?: string
  degreeName: string
  semesters: SemesterMap
  isSuggested?: boolean
  suggestionStatus?: 'pending' | 'approved' | 'rejected' | 'delete_pending'
  rejectionReason?: string
  deletionReason?: string
  suggestionId?: string
  updatedAt?: unknown
  gpaMethod?: GpaMethod
  yearWeightedConfig?: YearWeightedGpaConfig
}

export interface CurriculumSuggestion {
  id: string
  suggestedBy: string
  suggestedByEmail: string
  universityName: string
  universityShort: string
  facultyName: string
  degreeName: string
  semesters: SemesterMap
  status: 'pending' | 'approved' | 'rejected' | 'delete_pending'
  rejectionReason?: string
  deletionReason?: string
  createdAt?: unknown
  gpaMethod?: GpaMethod
  yearWeightedConfig?: YearWeightedGpaConfig
}

// Custom Degree Operations
/**
 * Save user's custom degree curriculum to Firestore
 */
export async function saveCustomDegree(
  userId: string,
  data: CustomDegreeData,
  userEmail?: string
): Promise<void> {
  const isNewSuggestion = !!(data.isSuggested && !data.suggestionId)

  const customDegreeRef = doc(db, 'users', userId, 'customDegree', 'default')
  
  let suggestionId = data.suggestionId
  
  if (data.isSuggested) {
    if (!suggestionId) {
      // Create new suggestion document with auto-generated ID
      const suggestionsCol = collection(db, 'curriculaSuggestions')
      const suggestionRef = doc(suggestionsCol)
      suggestionId = suggestionRef.id
    }
    
    const suggestionRef = doc(db, 'curriculaSuggestions', suggestionId)
    await setDoc(suggestionRef, {
      id: suggestionId,
      suggestedBy: userId,
      suggestedByEmail: userEmail || 'anonymous@mygpacal.com',
      universityName: data.universityName || '',
      universityShort: (data.universityShort || '').toUpperCase(),
      facultyName: data.facultyName || '',
      degreeName: data.degreeName,
      semesters: data.semesters,
      status: data.suggestionStatus || 'pending',
      rejectionReason: data.rejectionReason || '',
      createdAt: serverTimestamp(),
      ...(data.gpaMethod ? { gpaMethod: data.gpaMethod } : {}),
      ...(data.yearWeightedConfig ? { yearWeightedConfig: data.yearWeightedConfig } : {}),
    })
  }

  // Build clean save object for Firestore (replacing undefined with null or omitting them)
  const saveObj: Record<string, unknown> = {
    degreeName: data.degreeName,
    semesters: data.semesters,
    isSuggested: data.isSuggested || false,
    suggestionId: suggestionId || null,
    updatedAt: serverTimestamp()
  }

  if (data.universityName !== undefined) saveObj.universityName = data.universityName
  if (data.universityShort !== undefined) saveObj.universityShort = data.universityShort.toUpperCase()
  if (data.facultyName !== undefined) saveObj.facultyName = data.facultyName
  if (data.suggestionStatus !== undefined) saveObj.suggestionStatus = data.suggestionStatus
  if (data.rejectionReason !== undefined) saveObj.rejectionReason = data.rejectionReason
  if (data.gpaMethod !== undefined) saveObj.gpaMethod = data.gpaMethod
  if (data.yearWeightedConfig !== undefined) saveObj.yearWeightedConfig = data.yearWeightedConfig

  await setDoc(customDegreeRef, saveObj)

  if (isNewSuggestion) {
    notifyAdmin(
      `🎓 New curriculum suggestion: ${data.degreeName} at ${data.universityName || ''} (${data.facultyName || ''}). Review in the admin panel.`
    )
  }
}

/**
 * Retrieve user's custom degree curriculum from Firestore
 */
export async function getCustomDegree(
  userId: string
): Promise<CustomDegreeData | null> {
  const customDegreeRef = doc(db, 'users', userId, 'customDegree', 'default')
  const snapshot = await getDoc(customDegreeRef)

  if (snapshot.exists()) {
    return snapshot.data() as CustomDegreeData
  }
  return null
}

/**
 * Delete own custom degree configuration
 */
export async function deleteCustomDegree(
  userId: string,
  suggestionId?: string
): Promise<void> {
  const customDegreeRef = doc(db, 'users', userId, 'customDegree', 'default')
  await deleteDoc(customDegreeRef)

  if (suggestionId) {
    const suggestionRef = doc(db, 'curriculaSuggestions', suggestionId)
    await deleteDoc(suggestionRef)
  }
}

/**
 * Suggest deletion of an already approved/public custom degree with a reason
 */
export async function suggestCustomDegreeDeletion(
  userId: string,
  suggestionId: string,
  reason: string,
  data: CustomDegreeData,
  userEmail?: string
): Promise<void> {
  const customDegreeRef = doc(db, 'users', userId, 'customDegree', 'default')
  await setDoc(customDegreeRef, {
    suggestionStatus: 'delete_pending',
    deletionReason: reason,
    updatedAt: serverTimestamp(),
  }, { merge: true })

  const suggestionRef = doc(db, 'curriculaSuggestions', suggestionId)
  await setDoc(suggestionRef, {
    id: suggestionId,
    suggestedBy: userId,
    suggestedByEmail: userEmail || 'anonymous@mygpacal.com',
    universityName: data.universityName || '',
    universityShort: (data.universityShort || '').toUpperCase(),
    facultyName: data.facultyName || '',
    degreeName: data.degreeName,
    semesters: data.semesters,
    status: 'delete_pending',
    deletionReason: reason,
    createdAt: serverTimestamp(),
  })

  notifyAdmin(`🗑️ Deletion requested for ${data.degreeName} at ${data.universityName || ''}. Reason: ${reason}.`)
}

/**
 * Fetch all dynamic curriculum suggestions from queue
 */
export async function getCurriculaSuggestions(): Promise<CurriculumSuggestion[]> {
  const suggestionsCol = collection(db, 'curriculaSuggestions')
  const q = query(suggestionsCol, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  
  const list: CurriculumSuggestion[] = []
  snapshot.forEach((doc) => {
    list.push(doc.data() as CurriculumSuggestion)
  })
  return list
}

/**
 * Approve custom curriculum suggestion and merge structure into globalCurricula
 */
export async function approveCurriculumSuggestion(
  suggestion: CurriculumSuggestion
): Promise<void> {
  const uShort = suggestion.universityShort.toUpperCase()
  const universityRef = doc(db, 'globalCurricula', uShort)
  const uniSnap = await getDoc(universityRef)

  let faculties: Record<string, Record<string, SemesterMap>> = {}
  if (uniSnap.exists()) {
    const data = uniSnap.data()
    faculties = (data.faculties || {}) as Record<string, Record<string, SemesterMap>>
  }

  if (!faculties[suggestion.facultyName]) {
    faculties[suggestion.facultyName] = {}
  }

  // Merge the curriculum structure into global options
  faculties[suggestion.facultyName][suggestion.degreeName] = suggestion.semesters

  // 1. Update/Create global university document
  const universityUpdate: Record<string, unknown> = {
    name: suggestion.universityName,
    shortName: uShort,
    faculties: faculties,
    updatedAt: serverTimestamp(),
  }

  if (suggestion.gpaMethod) {
    const uniData = uniSnap.exists() ? uniSnap.data() : {}
    const gpaConfigs = (uniData.gpaConfigs || {}) as Record<string, Record<string, DegreeGpaConfig>>
    if (!gpaConfigs[suggestion.facultyName]) gpaConfigs[suggestion.facultyName] = {}
    gpaConfigs[suggestion.facultyName][suggestion.degreeName] = {
      defaultMethod: suggestion.gpaMethod,
      ...(suggestion.yearWeightedConfig ? { yearWeightedConfig: suggestion.yearWeightedConfig } : {}),
    }
    universityUpdate.gpaConfigs = gpaConfigs
  }

  await setDoc(universityRef, universityUpdate, { merge: true })

  // 2. Mark suggestion as approved in queue
  const suggestionRef = doc(db, 'curriculaSuggestions', suggestion.id)
  await setDoc(suggestionRef, {
    status: 'approved',
    updatedAt: serverTimestamp(),
  }, { merge: true })

  // 3. Mark user private Custom Degree as approved
  const customDegreeRef = doc(db, 'users', suggestion.suggestedBy, 'customDegree', 'default')
  await setDoc(customDegreeRef, {
    suggestionStatus: 'approved',
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

/**
 * Reject dynamic curriculum suggestion and attach admin rejection reason note
 */
export async function rejectCurriculumSuggestion(
  suggestionId: string,
  userId: string,
  reason: string
): Promise<void> {
  // 1. Mark suggestion as rejected in queue with reason
  const suggestionRef = doc(db, 'curriculaSuggestions', suggestionId)
  await setDoc(suggestionRef, {
    status: 'rejected',
    rejectionReason: reason,
    updatedAt: serverTimestamp(),
  }, { merge: true })

  // 2. Update user private Custom Degree with rejection status and reason
  const customDegreeRef = doc(db, 'users', userId, 'customDegree', 'default')
  await setDoc(customDegreeRef, {
    suggestionStatus: 'rejected',
    rejectionReason: reason,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

/**
 * Approve deletion suggestion and completely wipe it out from public curricula and user profile
 */
export async function approveCurriculumDeletion(
  suggestion: CurriculumSuggestion
): Promise<void> {
  const uShort = suggestion.universityShort.toUpperCase()
  const universityRef = doc(db, 'globalCurricula', uShort)
  const uniSnap = await getDoc(universityRef)

  if (uniSnap.exists()) {
    const data = uniSnap.data()
    const faculties = data.faculties || {}
    const gpaConfigs = (data.gpaConfigs || {}) as Record<string, Record<string, DegreeGpaConfig>>

    if (faculties[suggestion.facultyName] && faculties[suggestion.facultyName][suggestion.degreeName]) {
      delete faculties[suggestion.facultyName][suggestion.degreeName]

      // If a faculty has no more programs, clean it up completely
      if (Object.keys(faculties[suggestion.facultyName]).length === 0) {
        delete faculties[suggestion.facultyName]
      }

      if (gpaConfigs[suggestion.facultyName] && gpaConfigs[suggestion.facultyName][suggestion.degreeName]) {
        delete gpaConfigs[suggestion.facultyName][suggestion.degreeName]

        // If a faculty has no more gpaConfigs entries, clean it up completely
        if (Object.keys(gpaConfigs[suggestion.facultyName]).length === 0) {
          delete gpaConfigs[suggestion.facultyName]
        }
      }

      await setDoc(universityRef, {
        faculties: faculties,
        gpaConfigs: gpaConfigs,
        updatedAt: serverTimestamp(),
      }, { merge: true })
    }
  }

  // Delete suggestions queue entry
  const suggestionRef = doc(db, 'curriculaSuggestions', suggestion.id)
  await deleteDoc(suggestionRef)

  // Delete user custom degree document
  const customDegreeRef = doc(db, 'users', suggestion.suggestedBy, 'customDegree', 'default')
  await deleteDoc(customDegreeRef)
}

/**
 * Reject deletion suggestion and restore status back to 'approved'
 */
export async function rejectCurriculumDeletion(
  suggestionId: string,
  userId: string,
  feedback: string
): Promise<void> {
  // Restore suggestion status to approved in queue
  const suggestionRef = doc(db, 'curriculaSuggestions', suggestionId)
  await setDoc(suggestionRef, {
    status: 'approved',
    deletionReason: null,
    updatedAt: serverTimestamp(),
  }, { merge: true })

  // Restore custom degree status to approved in user doc and show feedback reason
  const customDegreeRef = doc(db, 'users', userId, 'customDegree', 'default')
  await setDoc(customDegreeRef, {
    suggestionStatus: 'approved',
    deletionReason: null,
    rejectionReason: feedback,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

/**
 * Read the year-weighted GPA config for a specific degree from globalCurricula.
 * Returns null if none has been approved for that degree yet.
 */
export async function getGlobalDegreeGpaConfig(
  universityShort: string,
  faculty: string,
  degree: string
): Promise<DegreeGpaConfig | null> {
  const universityRef = doc(db, 'globalCurricula', universityShort.toUpperCase())
  const snap = await getDoc(universityRef)
  if (!snap.exists()) return null
  const data = snap.data()
  return (data.gpaConfigs?.[faculty]?.[degree] as DegreeGpaConfig) ?? null
}
