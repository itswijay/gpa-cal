import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  PlusCircle,
  Save,
  BarChart3,
  Cloud,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface HowToUseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const steps = [
  {
    icon: GraduationCap,
    title: 'Welcome to GPA Cal',
    description:
      'This app helps you track your academic performance across semesters. Calculate your GPA easily and monitor your progress over time.',
    tips: [
      'Works offline - your data is saved locally',
      'Optional cloud sync for registered users',
      'Simple and intuitive interface',
    ],
  },
  {
    icon: PlusCircle,
    title: 'Add Your Grades',
    description:
      'Click "+ Add Semester Marks" to start entering your grades for each semester.',
    tips: [
      'Select your Faculty and Degree Program',
      'Choose the semester you want to add',
      'Select grades for each subject from the dropdown',
    ],
  },
  {
    icon: Save,
    title: 'Save & Track',
    description:
      'For signed-in users, grades are saved automatically as drafts in real-time. If not signed in, enter all grades and click "Save Semester" to save locally.',
    tips: [
      'Auto-save: Grades sync automatically as you make changes (for signed-in users)',
      'Drafts: Incomplete semesters show a "Draft" badge and are excluded from cumulative GPA',
      'Edit or delete semesters anytime from the summary table',
    ],
  },
  {
    icon: BarChart3,
    title: 'View Analytics',
    description:
      'Click "View Analytics" to see your GPA performance chart and track your progress visually.',
    tips: [
      'See your GPA trend over semesters',
      'Identify your best performing semesters',
      'Track your academic journey',
    ],
  },
  {
    icon: GraduationCap,
    title: 'Custom Degree Program',
    description:
      "Unlock our visual builder to structure a custom curriculum, extend preloaded programs with missing semesters, or edit existing degree structures!",
    tips: [
      'Sign in and click "Create Custom Degree" at the top-right',
      'Select any preloaded degree program to instantly auto-populate its existing semesters',
      'Extend with new semesters, then toggle "Suggest for Public Database" to submit it for global review!',
    ],
  },
  {
    icon: Cloud,
    title: 'Cloud Sync',
    description:
      'Sign in with Google to sync your data across devices and protect your custom structures.',
    tips: [
      'Access your data safely from any device',
      'Automatically merge local session data upon sign-in',
      'Keep your custom courses protected on your private cloud profile',
    ],
  },
]

export function HowToUseDialog({ open, onOpenChange }: HowToUseDialogProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    setCurrentStep(0)
    onOpenChange(false)
  }

  const step = steps[currentStep]
  const StepIcon = step.icon

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row items-center gap-2 text-lg sm:text-xl text-center sm:text-left">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10">
              <StepIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <span className="flex-1">{step.title}</span>
          </DialogTitle>
          <DialogDescription className="pt-2 text-xs sm:text-sm">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 sm:mt-4 space-y-2">
          {step.tips.map((tip, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-lg bg-muted/50 p-2 sm:p-3"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {index + 1}
              </span>
              <p className="text-xs sm:text-sm text-muted-foreground">{tip}</p>
            </div>
          ))}
        </div>

        {/* Step Indicators */}
        <div className="mt-4 sm:mt-6 flex items-center justify-center gap-1.5">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="mt-3 sm:mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            size="sm"
            className="gap-1 text-xs sm:text-sm"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Previous</span>
            <span className="xs:hidden">Prev</span>
          </Button>

          <span className="text-xs sm:text-sm text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleClose}
              size="sm"
              className="gap-1 text-xs sm:text-sm"
            >
              Get Started
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              size="sm"
              className="gap-1 text-xs sm:text-sm"
            >
              Next
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
