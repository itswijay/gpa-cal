/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, type ReactNode } from 'react'
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendEmailVerification,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config'

export interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  signInWithGoogle: () => Promise<{ isNewUser: boolean } | void>
  signOut: () => Promise<void>
  sendVerificationEmail: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async (): Promise<{ isNewUser: boolean } | void> => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      // Check if this is a new user (first time sign in)
      const isNewUser =
        user.metadata.creationTime === user.metadata.lastSignInTime

      // Send verification email if email is not verified
      if (!user.emailVerified) {
        await sendEmailVerification(user)
      }

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

  const sendVerificationEmail = async (): Promise<void> => {
    if (user && !user.emailVerified) {
      try {
        await sendEmailVerification(user)
      } catch (error) {
        console.error('Error sending verification email:', error)
        throw error
      }
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isGuest: !user,
    signInWithGoogle,
    signOut,
    sendVerificationEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
