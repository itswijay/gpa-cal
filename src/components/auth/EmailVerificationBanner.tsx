import { useState } from 'react'
import { Mail, X, RefreshCw } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'
import toast from 'react-hot-toast'

export function EmailVerificationBanner() {
  const {
    user,
    isAuthenticated,
    isEmailVerified,
    sendVerificationEmail,
    refreshUser,
  } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Don't show if not authenticated, already verified, or dismissed
  if (!isAuthenticated || isEmailVerified || dismissed) {
    return null
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      await sendVerificationEmail()
      toast.success('Verification email sent! Check your inbox.')
    } catch (error) {
      console.error('Failed to resend verification email:', error)
      toast.error('Failed to send email. Please try again later.')
    } finally {
      setIsResending(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshUser()
      if (user?.emailVerified) {
        toast.success('Email verified successfully!')
      } else {
        toast.error('Email not verified yet. Please check your inbox.')
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-3">
        <Mail className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Please verify your email
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            We sent a verification email to{' '}
            <span className="font-medium">{user?.email}</span>. Please click the
            link to verify your account and access all features.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendEmail}
              disabled={isResending}
              className="h-7 text-xs"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-3 h-3 mr-1.5" />
                  Resend Email
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-7 text-xs"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                  I've Verified
                </>
              )}
            </Button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
