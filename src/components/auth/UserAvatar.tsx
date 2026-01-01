import { useState } from 'react'
import { LogOut, User, Key } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface UserAvatarProps {
  className?: string
  onSignOutStart?: () => void
}

export function UserAvatar({
  className = '',
  onSignOutStart,
}: UserAvatarProps) {
  const { user, signOut, sendPasswordReset } = useAuth()
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  if (!user) return null

  const handleSignOut = async () => {
    try {
      onSignOutStart?.()
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const handleResetPassword = async () => {
    if (!user?.email) return

    try {
      setIsResettingPassword(true)
      await sendPasswordReset(user.email)
      // Show success message to user
      toast.success(
        'Password reset email sent! Please check your inbox and spam folder.',
        { duration: 10000 }
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to send password reset email'
      console.error('Password reset failed:', error)
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setIsResettingPassword(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex items-center justify-center overflow-hidden rounded-full border-2 border-transparent transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${className}`}
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User avatar'}
              className="h-8 w-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 p-2">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User avatar'}
              className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-5 w-5" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {user.displayName || 'User'}
            </span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleResetPassword}
          disabled={isResettingPassword}
          className="cursor-pointer hover:bg-accent focus:bg-accent"
        >
          <Key className="mr-2 h-4 w-4" />
          <span className="font-medium">
            {isResettingPassword ? 'Sending...' : 'Reset password'}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer bg-destructive/5 text-destructive hover:bg-destructive/15 hover:text-destructive focus:bg-destructive/15 focus:text-destructive dark:bg-destructive/10 dark:text-white/80 dark:hover:bg-destructive/20"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-medium">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
