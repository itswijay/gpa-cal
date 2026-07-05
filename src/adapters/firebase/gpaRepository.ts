import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { GPAEntry } from '../../data/types'

export interface UserProfile {
  email: string
  displayName: string
  photoURL: string
  role?: string
  targetGPA?: number
  createdAt?: Date
  preferences?: {
    faculty?: string
    degree?: string
  }
}

// User Profile Operations
export async function createUserProfile(
  userId: string,
  profile: UserProfile
): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await setDoc(
    userRef,
    {
      ...profile,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', userId)
  const snapshot = await getDoc(userRef)

  if (snapshot.exists()) {
    return snapshot.data() as UserProfile
  }
  return null
}

export async function updateUserPreferences(
  userId: string,
  preferences: { faculty?: string; degree?: string }
): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await setDoc(
    userRef,
    {
      preferences,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export async function updateUserTargetGPA(
  userId: string,
  targetGPA: number | null
): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await setDoc(
    userRef,
    {
      targetGPA,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

// Semester/GPA Operations
export async function saveSemesterData(
  userId: string,
  semesterData: GPAEntry
): Promise<void> {
  // Use semester name as document ID for easy updates
  const semesterId = semesterData.semester.replace(/\s+/g, '_').toLowerCase()
  const semesterRef = doc(db, 'users', userId, 'semesters', semesterId)

  await setDoc(semesterRef, {
    ...semesterData,
    id: semesterId,
    updatedAt: serverTimestamp(),
    createdAt: semesterData.createdAt || serverTimestamp(),
  })
}

export async function getSemesterData(userId: string): Promise<GPAEntry[]> {
  const semestersRef = collection(db, 'users', userId, 'semesters')
  const q = query(semestersRef, orderBy('semester', 'asc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as GPAEntry[]
}

export async function deleteSemesterData(
  userId: string,
  semester: string
): Promise<void> {
  const semesterId = semester.replace(/\s+/g, '_').toLowerCase()
  const semesterRef = doc(db, 'users', userId, 'semesters', semesterId)
  await deleteDoc(semesterRef)
}

// Real-time listener for semester data
export function subscribeSemesterData(
  userId: string,
  callback: (semesters: GPAEntry[]) => void
): Unsubscribe {
  const semestersRef = collection(db, 'users', userId, 'semesters')
  const q = query(semestersRef, orderBy('semester', 'asc'))

  return onSnapshot(q, (snapshot) => {
    const semesters = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as GPAEntry[]
    callback(semesters)
  })
}

// Migration: Import local data to Firestore
export async function migrateLocalDataToFirestore(
  userId: string,
  localData: GPAEntry[]
): Promise<void> {
  const promises = localData.map((entry) => saveSemesterData(userId, entry))
  await Promise.all(promises)
}

// Check if user has any data in Firestore
export async function userHasData(userId: string): Promise<boolean> {
  const semestersRef = collection(db, 'users', userId, 'semesters')
  const snapshot = await getDocs(semestersRef)
  return !snapshot.empty
}

// Import JSON data to Firestore (replaces existing data)
export async function importDataToFirestore(
  userId: string,
  data: GPAEntry[]
): Promise<void> {
  // Delete existing data first to ensure clean import
  const existingData = await getSemesterData(userId)
  const deletePromises = existingData.map((entry) =>
    deleteSemesterData(userId, entry.semester)
  )
  await Promise.all(deletePromises)

  // Import new data
  await migrateLocalDataToFirestore(userId, data)
}
