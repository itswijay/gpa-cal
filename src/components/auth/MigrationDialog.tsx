import { useState } from 'react'
import { CloudUpload, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
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
      toast.success('Data imported successfully!')
    } catch (error) {
      console.error('Migration failed:', error)
      toast.error('Failed to import data. Please try again.')
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
      onOpenChange(false)
      if (onMigrationComplete) {
        onMigrationComplete()
      }
      toast.success('Account created successfully!')
    } catch (error) {
      console.error('Failed to create profile:', error)
      toast.error('Failed to set up account. Please try again.')
    } finally {
      setIsClearing(false)
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
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <CloudUpload className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Import Your Data?
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            We found existing GPA data on this device. Would you like to import
            it to your account?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 sm:mt-4 rounded-lg border bg-muted/50 p-3 sm:p-4">
          <h4 className="font-medium text-sm sm:text-base">
            Found on this device:
          </h4>
          <ul className="mt-2 space-y-1 text-xs sm:text-sm text-muted-foreground">
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

        <div className="mt-4 sm:mt-6 flex flex-col gap-2">
          <Button
            onClick={handleImportData}
            disabled={isImporting || isClearing}
            className="w-full text-sm"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <CloudUpload className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">
                  Import Data to My Account
                </span>
                <span className="sm:hidden">Import Data</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleStartFresh}
            disabled={isImporting || isClearing}
            className="w-full text-sm"
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

        <p className="mt-3 sm:mt-4 text-center text-[10px] sm:text-xs text-muted-foreground">
          Importing will sync your data to the cloud and make it accessible from
          any device.
        </p>
      </DialogContent>
    </Dialog>
  )
}
