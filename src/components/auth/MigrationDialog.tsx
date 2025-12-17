import { useState } from 'react'
import { CloudUpload, Trash2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { useAuth } from '../../hooks/useAuth'
import {
  migrateLocalDataToFirestore,
  createUserProfile,
  type GPAEntry,
} from '../../firebase/firestore'

interface MigrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMigrationComplete?: () => void
}

export function MigrationDialog({
  open,
  onOpenChange,
  onMigrationComplete,
}: MigrationDialogProps) {
  const { user } = useAuth()
  const [isImporting, setIsImporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  // Get local data
  const localData = JSON.parse(
    localStorage.getItem('gpaData') || '[]'
  ) as GPAEntry[]
  const hasLocalData = localData.length > 0

  const handleImportData = async () => {
    if (!user || !hasLocalData) return

    setIsImporting(true)
    try {
      // Create user profile first
      await createUserProfile(user.uid, {
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        preferences: {
          faculty: localStorage.getItem('lockedFaculty') || undefined,
          degree: localStorage.getItem('lockedDegree') || undefined,
        },
      })

      // Migrate local data to Firestore
      await migrateLocalDataToFirestore(user.uid, localData)

      // Clear local storage after successful migration
      localStorage.removeItem('gpaData')
      localStorage.removeItem('lockedFaculty')
      localStorage.removeItem('lockedDegree')
      localStorage.removeItem('gpaSelections')

      onOpenChange(false)
      if (onMigrationComplete) {
        onMigrationComplete()
      }
    } catch (error) {
      console.error('Migration failed:', error)
    } finally {
      setIsImporting(false)
    }
  }

  const handleStartFresh = async () => {
    if (!user) return

    setIsClearing(true)
    try {
      // Create user profile without importing data
      await createUserProfile(user.uid, {
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      })

      // Clear local storage
      localStorage.removeItem('gpaData')
      localStorage.removeItem('lockedFaculty')
      localStorage.removeItem('lockedDegree')
      localStorage.removeItem('gpaSelections')

      onOpenChange(false)
      if (onMigrationComplete) {
        onMigrationComplete()
      }
    } catch (error) {
      console.error('Failed to create profile:', error)
    } finally {
      setIsClearing(false)
    }
  }

  if (!hasLocalData) {
    // No local data to migrate, just close
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CloudUpload className="h-6 w-6 text-primary" />
            Import Your Data?
          </DialogTitle>
          <DialogDescription>
            We found existing GPA data on this device. Would you like to import
            it to your account?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-lg border bg-muted/50 p-4">
          <h4 className="font-medium">Found on this device:</h4>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>
              • {localData.length} semester{localData.length !== 1 ? 's' : ''}{' '}
              of GPA data
            </li>
            {localStorage.getItem('lockedFaculty') && (
              <li>• Faculty: {localStorage.getItem('lockedFaculty')}</li>
            )}
            {localStorage.getItem('lockedDegree') && (
              <li>• Degree: {localStorage.getItem('lockedDegree')}</li>
            )}
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            onClick={handleImportData}
            disabled={isImporting || isClearing}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <CloudUpload className="mr-2 h-4 w-4" />
                Import Data to My Account
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleStartFresh}
            disabled={isImporting || isClearing}
            className="w-full"
          >
            {isClearing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Start Fresh
              </>
            )}
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Importing will sync your data to the cloud and make it accessible from
          any device.
        </p>
      </DialogContent>
    </Dialog>
  )
}