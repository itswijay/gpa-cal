import { AlertTriangle, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'

interface CustomDegreeConflictDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomDegreeConflictDialog({
  open,
  onOpenChange,
}: CustomDegreeConflictDialogProps) {
  const navigate = useNavigate()

  const handleGoToDashboard = () => {
    onOpenChange(false)
    navigate('/')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            Curriculum Conflict Detected
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            You cannot configure a custom degree program while you have active grades saved under a preloaded degree curriculum.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 sm:mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs sm:text-sm text-yellow-700 dark:text-yellow-400 space-y-2">
          <p>
            Mixing different academic structures will corrupt your overall cumulative GPA calculations and dashboard graph analytics.
          </p>
          <p className="font-semibold flex items-center gap-1.5 mt-2">
            <Trash2 className="h-4 w-4 shrink-0 text-red-500" />
            How to resolve this:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-1 font-medium text-muted-foreground">
            <li>Go back to your main GPA Summary dashboard.</li>
            <li>Click the <strong className="text-foreground">"Clear All Data"</strong> button to delete your current semester records.</li>
            <li>Return here to set up your customized curriculum.</li>
          </ul>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button
            variant="default"
            className="w-full font-semibold"
            onClick={handleGoToDashboard}
          >
            Go to Dashboard to Clear Data
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-sm"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
