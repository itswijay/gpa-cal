/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, type ReactNode } from 'react'
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config'
import { getUserProfile, createUserProfile, updateUserTargetGPA, type UserProfile } from '../firebase/firestore'

export interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  isAdmin: boolean
  loading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  signInWithGoogle: () => Promise<{ isNewUser: boolean } | void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updateTargetGPA: (targetGPA: number | null) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          let profile = await getUserProfile(firebaseUser.uid)
          if (!profile) {
            const newProfile: UserProfile = {
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL || '',
              role: 'user',
            }
            await createUserProfile(firebaseUser.uid, newProfile)
            profile = newProfile
          }
          setUserProfile(profile)
        } catch (e) {
          console.error('Error fetching or initializing user profile:', e)
          setUserProfile(null)
        }
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  // Refresh user data (useful after email verification)
  const refreshUser = async (): Promise<void> => {
    if (auth.currentUser) {
      await auth.currentUser.reload()
      setUser({ ...auth.currentUser })
    }
  }

  const signInWithGoogle = async (): Promise<{ isNewUser: boolean } | void> => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      // Check if this is a new user (first time sign in)
      const isNewUser =
        user.metadata.creationTime === user.metadata.lastSignInTime

      // Google users are automatically verified
      return { isNewUser }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      // Clear all local data on logout (as per requirement)
      localStorage.removeItem('gpaData')
      localStorage.removeItem('lockedFaculty')
      localStorage.removeItem('lockedDegree')
      localStorage.removeItem('gpaSelections')
      localStorage.removeItem('editingSemester')
      localStorage.removeItem('showToast')

      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const sendPasswordReset = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Error sending password reset email:', error)
      throw error
    }
  }

  const updateTargetGPA = async (targetGPA: number | null): Promise<void> => {
    if (user) {
      try {
        await updateUserTargetGPA(user.uid, targetGPA)
        setUserProfile((prev) => {
          if (!prev) return null
          return {
            ...prev,
            targetGPA: targetGPA ?? undefined,
          }
        })
      } catch (error) {
        console.error('Error updating target GPA:', error)
        throw error
      }
    }
  }

  const value: AuthContextType = {
    user,
    userProfile,
    isAdmin: userProfile?.role === 'admin',
    loading,
    isAuthenticated: !!user,
    isGuest: !user,
    signInWithGoogle,
    signOut,
    refreshUser,
    sendPasswordReset,
    updateTargetGPA,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
