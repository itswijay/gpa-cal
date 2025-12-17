import { useState } from 'react'
import { BarChart3, RefreshCw, Target, TrendingUp, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { LoginButton } from './LoginButton'

interface AnalyticsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoginSuccess?: (isNewUser: boolean) => void
}

const features = [
  {
    icon: BarChart3,
    title: 'GPA Performance Charts',
    description: 'Visualize your academic progress with interactive graphs',
  },
  {
    icon: RefreshCw,
    title: 'Sync Across Devices',
    description: 'Access your data from any device, anytime',
  },
  {
    icon: TrendingUp,
    title: 'GPA Predictions',
    description: 'Get insights on your future academic performance',
    comingSoon: true,
  },
  {
    icon: Target,
    title: 'Goal Setting',
    description: 'Set and track your academic goals',
    comingSoon: true,
  },
]

export function AnalyticsDialog({
  open,
  onOpenChange,
  onLoginSuccess,
}: AnalyticsDialogProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLoginSuccess = (isNewUser: boolean) => {
    setIsLoggingIn(false)
    onOpenChange(false)
    if (onLoginSuccess) {
      onLoginSuccess(isNewUser)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-6 w-6 text-primary" />
            Unlock Analytics & More!
          </DialogTitle>
          <DialogDescription>
            Sign in to access powerful features for tracking your academic
            journey.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{feature.title}</h4>
                  {feature.comingSoon && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-center text-xs text-muted-foreground">
            Your local data stays private. Register only if you want these
            features!
          </p>
          <div className="flex flex-col gap-2">
            <LoginButton
              onLoginSuccess={handleLoginSuccess}
              variant="default"
              className="w-full"
            />
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}