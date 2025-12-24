/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, type ReactNode } from 'react'
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase/config'

export interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  signInWithGoogle: () => Promise<{ isNewUser: boolean } | void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
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

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isGuest: !user,
    signInWithGoogle,
    signOut,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
