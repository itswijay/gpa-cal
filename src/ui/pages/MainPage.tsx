import { useNavigate } from 'react-router-dom'
import { useTheme } from '../components/theme-provider'
import {
  Sun,
  Moon,
  Trash2,
  Edit3,
  Github,
  BarChart3,
  HelpCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import CountUp from 'react-countup'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useFirebaseData } from '../hooks/useFirebaseData'
import { LoginButton } from '../components/auth/LoginButton'
import { UserAvatar } from '../components/auth/UserAvatar'
import { AnalyticsDialog } from '../components/auth/AnalyticsDialog'
import { MigrationDialog } from '../components/auth/MigrationDialog'
import { HowToUseDialog } from '../components/HowToUseDialog'
import { Spinner } from '../components/ui/spinner'
import { GPAChart } from '../components/analytics/GPAChart'
import { deleteSemesterData } from '../../adapters/firebase/gpaRepository'
import { calculateCumulativeGpa } from '../../domain/gpa/calculateCumulativeGpa'
import { calculateYearWeightedGpa } from '../../domain/gpa/calculateYearWeightedGpa'
import { parseSemesterNumber } from '../../domain/curriculum/parseSemesterNumber'
import { validateYearWeightConfig } from '../../domain/curriculum/validateYearWeightConfig'
import { useResolvedGpaConfig } from '../hooks/useResolvedGpaConfig'
import { saveGpaMethodPreference } from '../../adapters/storage/gpaMethodStore'
import type { DegreeGpaConfig, YearWeightedGpaConfig } from '../../data/types'

type Grade = {
  gpa: number
  semester: string
  credits: number
  grades?: Record<string, string>
  faculty?: string
  degree?: string
  university?: string
  isDraft?: boolean
}

const MainPage = () => {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated, isGuest, loading } = useAuth()
  const { data: firebaseData } = useFirebaseData()
  const [semesters, setSemesters] = useState<Grade[]>([])
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false)
  const [showMigrationDialog, setShowMigrationDialog] = useState(false)
  const [showHowToUseDialog, setShowHowToUseDialog] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Year-weighted GPA state
  const [gpaDisplayMethod, setGpaDisplayMethod] = useState<'normal' | 'year-weighted'>('normal')
  const [activeYearConfig, setActiveYearConfig] = useState<YearWeightedGpaConfig | undefined>()
  const [inlineFormSemestersPerYear, setInlineFormSemestersPerYear] = useState(2)
  const [inlineFormWeights, setInlineFormWeights] = useState<Record<number, string>>({})

  // Derived values for year-weighted feature
  const nonDraftSemesters = semesters.filter((s) => !s.isDraft)
  const activeDegreeEntry = nonDraftSemesters[0]
  const maxSemNumber = nonDraftSemesters.reduce(
    (max, s) => Math.max(max, parseSemesterNumber(s.semester)),
    0
  )
  const numInlineYears =
    inlineFormSemestersPerYear > 0 ? Math.ceil(maxSemNumber / inlineFormSemestersPerYear) : 0
  const inlineWeightSum = Object.values(inlineFormWeights).reduce(
    (sum, w) => sum + (Number(w) || 0),
    0
  )

  const { config: resolvedGpaConfig, loading: gpaConfigLoading } = useResolvedGpaConfig({
    faculty: activeDegreeEntry?.faculty,
    degree: activeDegreeEntry?.degree,
    universityShort: activeDegreeEntry?.university,
  })

  // Sync toggle default and active config from resolved degree config
  useEffect(() => {
    if (!gpaConfigLoading) {
      setGpaDisplayMethod(resolvedGpaConfig.defaultMethod)
      setActiveYearConfig(resolvedGpaConfig.yearWeightedConfig)
    }
  }, [resolvedGpaConfig, gpaConfigLoading])

  // Auto-distribute inline form weights evenly when number of years changes
  useEffect(() => {
    if (numInlineYears <= 0) return
    const even = Math.floor(100 / numInlineYears)
    const newWeights: Record<number, string> = {}
    for (let i = 1; i <= numInlineYears; i++) {
      newWeights[i] = i === 1 ? String(100 - even * (numInlineYears - 1)) : String(even)
    }
    setInlineFormWeights(newWeights)
  }, [numInlineYears])

  // Detect sign-out by checking if user becomes null
  useEffect(() => {
    if (isSigningOut && !user && !isAuthenticated) {
      setTimeout(() => {
        setIsSigningOut(false)
      }, 1000)
    }
  }, [user, isAuthenticated, isSigningOut])

  useEffect(() => {
    const toastMessage = localStorage.getItem('showToast')
    if (toastMessage) {
      toast.success(toastMessage)
      localStorage.removeItem('showToast')
    }

    const justSignedIn = localStorage.getItem('justSignedIn')
    if (justSignedIn && isAuthenticated) {
      localStorage.removeItem('justSignedIn')
      const localData = localStorage.getItem('gpaData')
      if (localData && JSON.parse(localData).length > 0) {
        setShowMigrationDialog(true)
      }
    }
  }, [isAuthenticated])

  // Load data based on authentication status
  useEffect(() => {
    if (isAuthenticated) {
      const sortedData = [...firebaseData].sort((a, b) => {
        const semesterA = parseInt(a.semester.split(' ')[1])
        const semesterB = parseInt(b.semester.split(' ')[1])
        return semesterA - semesterB
      })
      setSemesters(sortedData)
    } else if (isGuest) {
      const savedData = JSON.parse(
        localStorage.getItem('gpaData') || '[]'
      ) as Grade[]
      const sortedData = [...savedData].sort((a, b) => {
        const semesterA = parseInt(a.semester.split(' ')[1])
        const semesterB = parseInt(b.semester.split(' ')[1])
        return semesterA - semesterB
      })
      setSemesters(sortedData)
    }
  }, [isAuthenticated, isGuest, firebaseData])

  const calculateGPA = () => {
    if (gpaDisplayMethod === 'year-weighted' && activeYearConfig) {
      return calculateYearWeightedGpa(semesters, activeYearConfig)
    }
    return calculateCumulativeGpa(semesters)
  }

  const handleSavePersonalWeights = () => {
    const yearWeights = Array.from({ length: numInlineYears }, (_, i) => ({
      year: i + 1,
      weight: (Number(inlineFormWeights[i + 1]) || 0) / 100,
    }))
    const yearWeightedConfig: YearWeightedGpaConfig = {
      semestersPerYear: inlineFormSemestersPerYear,
      yearWeights,
    }
    const error = validateYearWeightConfig(yearWeightedConfig)
    if (error) {
      toast.error(error)
      return
    }
    if (activeDegreeEntry?.faculty && activeDegreeEntry?.degree) {
      const newConfig: DegreeGpaConfig = { defaultMethod: 'year-weighted', yearWeightedConfig }
      saveGpaMethodPreference(activeDegreeEntry.faculty, activeDegreeEntry.degree, newConfig)
    }
    setActiveYearConfig(yearWeightedConfig)
    toast.success('Year-weighted GPA configuration saved for this degree.')
  }

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all GPA data?')) {
      localStorage.removeItem('gpaData')
      localStorage.removeItem('lockedUniversity')
      localStorage.removeItem('lockedFaculty')
      localStorage.removeItem('lockedDegree')
      localStorage.removeItem('gpaSelections')
      setSemesters([])

      if (isAuthenticated && user) {
        try {
          const deletePromises = firebaseData.map((entry) =>
            deleteSemesterData(user.uid, entry.semester)
          )
          await Promise.all(deletePromises)
          toast.success('All semester data successfully cleared from cloud!')
        } catch (error) {
          console.error('Error clearing cloud semester data:', error)
          toast.error('Failed to clear cloud data. Please try again.')
        }
      } else {
        toast.success('All local semester data successfully cleared!')
      }
    }
  }

  const handleEditSemester = (semester: Grade) => {
    if (!semester.grades || Object.keys(semester.grades).length === 0) {
      if (
        window.confirm(
          `This semester was saved before the edit feature was available. ` +
            `You can still edit it, but you'll need to re-enter all the grades. ` +
            `Do you want to continue?`
        )
      ) {
        localStorage.setItem('editingSemester', JSON.stringify(semester))
        navigate('/addGrades')
      }
    } else {
      localStorage.setItem('editingSemester', JSON.stringify(semester))
      navigate('/addGrades')
    }
  }

  const handleDeleteSemester = async (semesterToDelete: string) => {
    if (
      window.confirm(`Are you sure you want to delete ${semesterToDelete}?`)
    ) {
      try {
        if (isAuthenticated && user) {
          await deleteSemesterData(user.uid, semesterToDelete)
          const updatedSemesters = semesters
            .filter((sem) => sem.semester !== semesterToDelete)
            .sort((a, b) => {
              const semesterA = parseInt(a.semester.split(' ')[1])
              const semesterB = parseInt(b.semester.split(' ')[1])
              return semesterA - semesterB
            })
          setSemesters(updatedSemesters)
          toast.success(`${semesterToDelete} has been deleted`)
        } else {
          const updatedSemesters = semesters
            .filter((sem) => sem.semester !== semesterToDelete)
            .sort((a, b) => {
              const semesterA = parseInt(a.semester.split(' ')[1])
              const semesterB = parseInt(b.semester.split(' ')[1])
              return semesterA - semesterB
            })
          localStorage.setItem('gpaData', JSON.stringify(updatedSemesters))
          setSemesters(updatedSemesters)
          toast.success(`${semesterToDelete} has been deleted`)
        }
      } catch (error) {
        console.error('Error deleting semester:', error)
        toast.error('Failed to delete semester')
      }
    }
  }

  const rowVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 50,
        damping: 15,
        mass: 1,
        duration: 0.6,
        opacity: {
          duration: 0.6,
          ease: 'easeInOut',
        },
        y: {
          type: 'spring',
          stiffness: 70,
          damping: 12,
          duration: 0.6,
        },
        scale: {
          duration: 0.6,
          ease: 'easeOut',
        },
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -20,
      transition: {
        duration: 0.6,
        ease: 'easeInOut',
      },
    },
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground p-0 mt-0">
      {/* Loading Overlay During Sign Out */}
      {isSigningOut && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="h-8 w-8" />
            <p className="text-white text-sm font-medium">Signing out...</p>
          </div>
        </div>
      )}

      <main className="flex-grow">
        <div className="min-h-screen w-full px-4 sm:px-6 md:px-10 py-4">
          {/* Header with How To Use, Theme Toggle & Auth - Full Width */}
          <div className="flex items-center justify-between w-full mb-6">
            {/* Left: How To Use Button */}
            <div className="flex-1 flex justify-start">
              <button
                onClick={() => setShowHowToUseDialog(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors duration-200 shadow-sm"
                title="How to use"
              >
                <HelpCircle className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">How to Use</span>
              </button>
              <button
                onClick={() => setShowHowToUseDialog(true)}
                className="sm:hidden p-3 rounded-full border border-border bg-card hover:bg-accent transition-colors duration-200 shadow-sm"
                title="How to use"
              >
                <HelpCircle className="w-5 h-5 text-primary" />
              </button>
            </div>

            {/* Center: Theme Toggle */}
            <div className="flex justify-center">
              <button
                onClick={toggleTheme}
                className="p-3 rounded-full border border-border bg-card hover:bg-accent transition-colors duration-200 shadow-sm"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-blue-600" />
                )}
              </button>
            </div>

            {/* Right: GitHub & Auth Button */}
            <div className="flex-1 flex justify-end items-center gap-2">
              <a
                href="https://github.com/itswijay/gpa-cal"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:block p-3 rounded-full hover:bg-accent transition-colors duration-200"
                title="Star us on GitHub & contribute!"
              >
                <Github className="w-5 h-5" />
              </a>

              {loading ? (
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              ) : isAuthenticated ? (
                <UserAvatar onSignOutStart={() => setIsSigningOut(true)} />
              ) : (
                <LoginButton variant="outline" size="sm" />
              )}
            </div>
          </div>

          {/* Content Container */}
          <div className="max-w-2xl mx-auto">
            {/* Page Title */}
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
              GPA Summary
            </h1>

            {/* GPA Table */}
            <div className="w-full overflow-x-auto rounded-lg border border-border shadow-sm mb-6">
              <table className="min-w-full text-left bg-card text-sm sm:text-base">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="font-semibold p-2 sm:p-3 min-w-[100px] sm:min-w-[200px] border">
                      Semester
                    </th>
                    <th className="font-semibold p-2 sm:p-3 min-w-[80px] sm:min-w-[150px] text-center border">
                      GPA
                    </th>
                    <th className="font-semibold p-2 sm:p-3 min-w-[60px] sm:min-w-[150px] text-center border">
                      Credits
                    </th>
                    <th className="font-semibold p-2 sm:p-3 w-[80px] sm:w-[120px] text-center border">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {semesters.map((s) => (
                      <motion.tr
                        key={s.semester}
                        variants={rowVariants}
                        initial="initial"
                        animate="animate"
                        layout
                      >
                        <td className="p-2 sm:p-4 font-mono font-medium text-sm sm:text-base text-left border truncate">
                          {s.semester}
                        </td>
                        <td className="p-2 sm:p-4 font-mono font-semibold text-sm sm:text-base text-center border">
                          {s.isDraft ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                              Draft
                            </span>
                          ) : (
                            s.gpa
                          )}
                        </td>
                        <td className="p-2 sm:p-4 font-mono font-semibold text-sm sm:text-base text-center border">
                          {s.credits}
                        </td>
                        <td className="p-1 sm:p-4 text-center border">
                          <div className="flex justify-center gap-1 sm:gap-2">
                            <button
                              onClick={() => handleEditSemester(s)}
                              className={`p-1 sm:p-2 transition-colors ${
                                s.grades && Object.keys(s.grades).length > 0
                                  ? 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400'
                              }`}
                              title={
                                s.grades && Object.keys(s.grades).length > 0
                                  ? 'Edit semester (grades available)'
                                  : 'Edit semester (grades will need to be re-entered)'
                              }
                            >
                              <Edit3 className="w-4 h-4 sm:w-[21px] sm:h-[21px]" />
                            </button>
                            <button
                              onClick={() => handleDeleteSemester(s.semester)}
                              className="p-1 sm:p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              title="Delete semester"
                            >
                              <Trash2 className="w-4 h-4 sm:w-[21px] sm:h-[21px]" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-evenly gap-4 sm:gap-16 mt-4 mx-2 sm:mx-8">
              <button
                onClick={handleClearData}
                className="flex-1 bg-red-600 text-sm text-white px-4 py-2 rounded hover:bg-red-700 transition text-center"
              >
                Clear All Data
              </button>

              <button
                onClick={() => navigate('/addGrades')}
                className="flex-1 bg-blue-600 text-sm text-white px-4 py-2 rounded hover:bg-blue-700 transition text-center"
              >
                + Add Semester Marks
              </button>
            </div>

            {/* View Analytics Button */}
            {!showAnalytics && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => {
                    if (isGuest) {
                      setShowAnalyticsDialog(true)
                    } else if (isAuthenticated) {
                      const completedCount = semesters.filter((s) => !s.isDraft).length
                      if (completedCount === 0) {
                        toast.error(
                          "Please calculate and save at least one completed semester's grades first to generate GPA progress analytics.",
                          { duration: 4000 }
                        )
                        return
                      }
                      setShowAnalytics(true)
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-200 shadow-sm text-sm font-medium"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Analytics
                </button>
              </div>
            )}

            {/* Analytics Chart */}
            <AnimatePresence>
              {showAnalytics && semesters.length > 0 && (
                <GPAChart
                  data={semesters
                    .filter((s) => !s.isDraft)
                    .map((s) => ({
                      semester: s.semester,
                      gpa: s.gpa,
                      credits: s.credits,
                    }))}
                  onClose={() => setShowAnalytics(false)}
                />
              )}
            </AnimatePresence>

            {/* GPA Display Section */}
            {nonDraftSemesters.length > 0 && (
              <div className="mt-8 flex flex-col items-center gap-4">

                {/* GPA Method Toggle */}
                <div className="inline-flex rounded-lg border border-border overflow-hidden shadow-sm text-xs font-medium">
                  <button
                    onClick={() => setGpaDisplayMethod('normal')}
                    className={`px-4 py-2 transition-colors ${
                      gpaDisplayMethod === 'normal'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    Normal GPA
                  </button>
                  <button
                    onClick={() => setGpaDisplayMethod('year-weighted')}
                    className={`px-4 py-2 transition-colors ${
                      gpaDisplayMethod === 'year-weighted'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    Year-Weighted FGPA
                  </button>
                </div>

                {/* GPA Value Box */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="p-4 bg-card border border-border rounded-lg shadow-sm w-full max-w-[220px]"
                >
                  <div className="text-center">
                    <h3 className="text-sm sm:text-base font-medium text-muted-foreground mb-2">
                      {gpaDisplayMethod === 'year-weighted' ? 'Final GPA (FGPA)' : 'Your GPA'}
                    </h3>
                    <div className="text-2xl sm:text-3xl font-bold text-primary">
                      {gpaDisplayMethod === 'year-weighted' && !activeYearConfig ? (
                        <span className="text-lg text-muted-foreground">—</span>
                      ) : (
                        <CountUp
                          end={calculateGPA()}
                          decimals={gpaDisplayMethod === 'year-weighted' ? 2 : 3}
                          duration={1.5}
                        />
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Inline Year-Weight Configuration Form */}
                {gpaDisplayMethod === 'year-weighted' && !activeYearConfig && !gpaConfigLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-sm bg-card border border-border rounded-lg shadow-sm p-4 space-y-4"
                  >
                    <p className="text-xs text-muted-foreground">
                      No year-weight config found for this degree. Set one below or{' '}
                      <button
                        onClick={() => navigate('/custom-degree')}
                        className="text-primary underline underline-offset-2 hover:text-primary/80"
                      >
                        suggest it to the public database
                      </button>
                      .
                    </p>

                    {/* Semesters per year */}
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-medium text-foreground whitespace-nowrap">
                        Semesters per year
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={inlineFormSemestersPerYear}
                        onChange={(e) =>
                          setInlineFormSemestersPerYear(Math.max(1, Number(e.target.value)))
                        }
                        className="w-16 text-center text-sm border border-border rounded px-2 py-1 bg-muted"
                      />
                    </div>

                    {/* Year weight rows */}
                    {numInlineYears > 0 && (
                      <div className="space-y-2">
                        {Array.from({ length: numInlineYears }, (_, i) => i + 1).map((year) => (
                          <div key={year} className="flex items-center gap-3">
                            <span className="text-xs font-medium text-muted-foreground w-12">
                              Year {year}
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={inlineFormWeights[year] ?? ''}
                              onChange={(e) =>
                                setInlineFormWeights((prev) => ({
                                  ...prev,
                                  [year]: e.target.value,
                                }))
                              }
                              className="w-16 text-center text-sm border border-border rounded px-2 py-1 bg-muted"
                            />
                            <span className="text-xs text-muted-foreground">%</span>
                          </div>
                        ))}

                        {/* Weight sum indicator */}
                        <p
                          className={`text-xs font-medium ${
                            Math.abs(inlineWeightSum - 100) <= 0.5
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-500'
                          }`}
                        >
                          Total: {inlineWeightSum}% {Math.abs(inlineWeightSum - 100) <= 0.5 ? '✓' : '(must be 100%)'}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleSavePersonalWeights}
                        className="flex-1 text-xs bg-primary text-primary-foreground px-3 py-2 rounded hover:bg-primary/90 transition-colors font-medium"
                      >
                        Save for this degree
                      </button>
                      <button
                        onClick={() => navigate('/custom-degree')}
                        className="flex-1 text-xs border border-border bg-card px-3 py-2 rounded hover:bg-accent transition-colors font-medium"
                      >
                        Suggest to public
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* GitHub Button - Mobile only, above footer */}
      <div className="sm:hidden w-full flex justify-center py-2">
        <a
          href="https://github.com/itswijay/gpa-cal"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <Github className="w-3.5 h-3.5" />
          <span>Star us on GitHub</span>
        </a>
      </div>

      <footer className="w-full text-center bg-background py-3 border-t border-border z-50">
        <div className="text-xs text-muted-foreground opacity-50">
          Developed by Toran
        </div>
      </footer>

      {/* Auth Dialogs */}
      <AnalyticsDialog
        open={showAnalyticsDialog}
        onOpenChange={setShowAnalyticsDialog}
      />

      <MigrationDialog
        open={showMigrationDialog}
        onOpenChange={setShowMigrationDialog}
        onMigrationComplete={() => {
          toast.success('Data imported successfully!')
          window.location.reload()
        }}
      />

      <HowToUseDialog
        open={showHowToUseDialog}
        onOpenChange={setShowHowToUseDialog}
      />
    </div>
  )
}

export default MainPage
