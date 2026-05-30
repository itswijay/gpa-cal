import { GraduationCap, RefreshCw, Sparkles, TrendingUp } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { LoginButton } from './LoginButton'

interface CustomDegreeAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const benefits = [
  {
    icon: GraduationCap,
    title: 'Degree Extension & Builder',
    description: 'Extend preloaded university programs with missing semesters or build your own from scratch.',
  },
  {
    icon: RefreshCw,
    title: 'Secure Cloud Sync & Suggestion',
    description: 'Save private degree structures to the cloud and suggest incomplete semesters to help the community.',
  },
  {
    icon: Sparkles,
    title: 'Personalized GPA Calculator',
    description: 'Grade semesters directly against your dynamic subjects, ensuring exact calculations.',
  },
  {
    icon: TrendingUp,
    title: 'Unified Report Dashboard',
    description: 'See your custom results integrated seamlessly inside overall GPA performance graphs.',
  },
]

export function CustomDegreeAuthDialog({ open, onOpenChange }: CustomDegreeAuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md scrollbar-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            Unlock Custom Programs!
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Create an account or sign in to build custom degrees, extend preloaded programs, and suggest public curricula updates.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-4">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="flex items-start gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <benefit.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm sm:text-base">
                  {benefit.title}
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
          <p className="text-center text-[10px] sm:text-xs text-muted-foreground">
            Register in seconds to unlock personalized academic tracking.
          </p>
          <div className="flex flex-col gap-2">
            <LoginButton variant="default" className="w-full" />
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full text-sm"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
