import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, HelpCircle, Save, Sparkles, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

interface GoalTrackerProps {
  completedSemesters: number[]
  targetGPA: number | null
  onSaveTargetGPA: (targetGPA: number | null) => Promise<void>
}

export function GoalTracker({
  completedSemesters,
  targetGPA,
  onSaveTargetGPA,
}: GoalTrackerProps) {
  const [targetInput, setTargetInput] = useState<string>('')
  const [totalSemesters, setTotalSemesters] = useState<number>(8)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize input value when targetGPA changes
  useEffect(() => {
    if (targetGPA !== null) {
      setTargetInput(targetGPA.toFixed(3))
    } else {
      setTargetInput('')
    }
  }, [targetGPA])

  const completedCount = completedSemesters.length
  const currentGPA =
    completedCount > 0
      ? parseFloat(
          (
            completedSemesters.reduce((sum, val) => sum + val, 0) /
            completedCount
          ).toFixed(3)
        )
      : 0

  const remainingCount = Math.max(0, totalSemesters - completedCount)

  // Quick set options
  const quickOptions = [3.0, 3.3, 3.5, 3.7, 4.0]

  const handleSave = async (value: number | null) => {
    setIsSaving(true)
    try {
      await onSaveTargetGPA(value)
      toast.success(
        value !== null
          ? `Target GPA set to ${value.toFixed(3)}!`
          : 'Target GPA cleared!'
      )
    } catch (error) {
      console.error('Failed to save target GPA:', error)
      toast.error('Failed to save target GPA. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseFloat(targetInput)
    if (isNaN(parsed) || parsed < 0 || parsed > 4) {
      toast.error('Please enter a valid GPA between 0.00 and 4.00')
      return
    }
    const rounded = parseFloat(parsed.toFixed(3))
    handleSave(rounded)
  }

  const handleClear = () => {
    handleSave(null)
  }

  // Goal calculations
  let requiredGPA = 0
  let progressPercentage = 0
  let status: 'none' | 'completed' | 'on_track' | 'challenging' | 'impossible' = 'none'

  if (targetGPA !== null) {
    progressPercentage = currentGPA > 0 ? Math.min(100, (currentGPA / targetGPA) * 100) : 0

    if (remainingCount === 0) {
      status = currentGPA >= targetGPA ? 'completed' : 'impossible'
    } else {
      const sumCompleted = completedSemesters.reduce((sum, val) => sum + val, 0)
      const requiredSum = targetGPA * totalSemesters - sumCompleted
      requiredGPA = requiredSum / remainingCount

      if (requiredGPA > 4.0) {
        status = 'impossible'
      } else if (requiredGPA <= targetGPA) {
        status = 'on_track'
      } else {
        status = 'challenging'
      }
    }
  }

  // Radial progress calculations
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference

  // Status visual configurations
  const statusConfig = {
    completed: {
      badgeClass: 'bg-green-500/10 text-green-500 border border-green-500/20',
      badgeText: 'Goal Achieved! 🎉',
      message: 'Outstanding achievement! You have successfully reached your target GPA.',
      progressColor: 'stroke-green-500',
    },
    on_track: {
      badgeClass: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
      badgeText: 'On Track',
      message: `Keep doing what you are doing! You need to maintain an average of ${requiredGPA.toFixed(
        3
      )} in your remaining ${remainingCount} semester${remainingCount > 1 ? 's' : ''}.`,
      progressColor: 'stroke-primary',
    },
    challenging: {
      badgeClass: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
      badgeText: 'Challenging',
      message: `Step it up! You need to average a ${requiredGPA.toFixed(
        3
      )} in your remaining ${remainingCount} semester${remainingCount > 1 ? 's' : ''} to hit your goal.`,
      progressColor: 'stroke-amber-500',
    },
    impossible: {
      badgeClass: 'bg-red-500/10 text-red-500 border border-red-500/20',
      badgeText: 'Out of Reach',
      message: remainingCount === 0
        ? `You finished with ${currentGPA.toFixed(3)}, short of your ${(targetGPA ?? 0).toFixed(3)} target.`
        : `Mathematically impossible. Reaching ${(targetGPA ?? 0).toFixed(3)} requires a ${requiredGPA.toFixed(
            3
          )} average, which exceeds the maximum possible 4.00. Consider adjusting your goal.`,
      progressColor: 'stroke-red-500',
    },
    none: {
      badgeClass: 'bg-muted text-muted-foreground border border-border',
      badgeText: 'No Goal Set',
      message: 'Set a target GPA to start tracking your goal and view academic insights.',
      progressColor: 'stroke-muted',
    },
  }

  const currentConfig = statusConfig[status]

  return (
    <div className="w-full mt-6 bg-card/40 border border-border rounded-lg p-5 sm:p-6 backdrop-blur-md transition-all duration-200">
      <div className="flex items-center gap-2 mb-5">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Goal Tracker</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left/Top: Goal Setter Inputs */}
        <div className="md:col-span-7 space-y-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="target-gpa" className="text-xs font-semibold text-muted-foreground">
                Target Cumulative GPA (0.00 - 4.00)
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Input
                    id="target-gpa"
                    type="number"
                    step="0.001"
                    min="0"
                    max="4"
                    placeholder="Enter target (e.g. 3.70)"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    className="font-mono text-sm pr-12 h-10"
                  />
                  {targetGPA !== null && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <Button type="submit" disabled={isSaving} className="px-4 h-10 flex gap-1 items-center">
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Quick-select Badges */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground mr-1">Quick Set:</span>
            {quickOptions.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => {
                  setTargetInput(val.toFixed(2))
                  handleSave(val)
                }}
                className={`text-xs px-2.5 py-1 rounded-full font-mono transition-all border ${
                  targetGPA === val
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground hover:bg-accent border-border'
                }`}
              >
                {val.toFixed(1)}
              </button>
            ))}
          </div>

          {/* Configuration Settings */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              Degree Duration:
            </span>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1 px-2.5 font-mono">
                    {totalSemesters} Semesters
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-[100px] max-h-[200px] overflow-y-auto font-mono">
                  {Array.from({ length: 11 }, (_, i) => i + 2).map((num) => (
                    <DropdownMenuItem
                      key={num}
                      onSelect={() => setTotalSemesters(num)}
                      className="text-xs justify-center"
                    >
                      {num} Sems
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Right/Bottom: Goal Progress Ring & Stats */}
        <div className="md:col-span-5 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-border/50 pt-5 md:pt-0 md:pl-6">
          <div className="relative w-28 h-28 flex items-center justify-center mb-3">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90">
              {/* Background Circle */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                className="stroke-muted-foreground/10 fill-none"
                strokeWidth="7"
              />
              {/* Progress Circle */}
              {targetGPA !== null && progressPercentage > 0 && (
                <motion.circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className={`fill-none ${currentConfig.progressColor}`}
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-muted-foreground font-medium">Achieved</span>
              <span className="text-base font-bold font-mono">
                {targetGPA !== null ? `${Math.round(progressPercentage)}%` : '--'}
              </span>
            </div>
          </div>

          <div className="text-center w-full">
            <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${currentConfig.badgeClass}`}>
              {currentConfig.badgeText}
            </span>
          </div>
        </div>
      </div>

      {/* Goal Advisory / Motivational Box */}
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className={`mt-4 p-3 rounded-lg flex items-start gap-2.5 text-xs sm:text-sm ${
            status === 'impossible'
              ? 'bg-red-500/5 text-red-600 dark:text-red-400/90 border border-red-500/10'
              : status === 'challenging'
              ? 'bg-amber-500/5 text-amber-600 dark:text-amber-400/90 border border-amber-500/10'
              : status === 'on_track' || status === 'completed'
              ? 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400/90 border border-emerald-500/10'
              : 'bg-muted/40 text-muted-foreground border border-border/50'
          }`}
        >
          {status === 'impossible' ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : status === 'none' ? (
            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : status === 'completed' || status === 'on_track' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-500 animate-pulse" />
          )}
          <p className="leading-relaxed">{currentConfig.message}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
