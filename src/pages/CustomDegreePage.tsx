import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, Save, GraduationCap, BookOpen, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '../hooks/useAuth'
import { saveCustomDegree, getCustomDegree, type CustomDegreeData } from '../firebase/firestore'
import type { SemesterMap, Subject } from '../data/types'
import { Spinner } from '../components/ui/spinner'

interface DynamicSubject {
  code: string
  name: string
  credits: string
}

interface DynamicSemester {
  id: string
  name: string
  subjects: DynamicSubject[]
}

export default function CustomDegreePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [degreeName, setDegreeName] = useState('')
  const [semesters, setSemesters] = useState<DynamicSemester[]>([
    {
      id: 'sem_1',
      name: 'Semester 1',
      subjects: [{ code: '', name: '', credits: '3' }],
    },
  ])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingExisting, setIsLoadingExisting] = useState(true)

  // Redirect guest users back
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('You must be logged in to access this page.')
      navigate('/')
    }
  }, [isAuthenticated, authLoading, navigate])

  // Load existing custom degree if available
  useEffect(() => {
    async function loadExisting() {
      if (isAuthenticated && user) {
        try {
          const existing = await getCustomDegree(user.uid)
          if (existing) {
            setDegreeName(existing.degreeName)
            
            // Map Firestore SemesterMap back to our dynamic local state
            const mappedSems: DynamicSemester[] = Object.entries(existing.semesters).map(([semName, semData], idx) => ({
              id: `sem_${idx + 1}`,
              name: semName,
              subjects: (semData.core || []).map((sub) => ({
                code: sub.code,
                name: sub.name,
                credits: String(sub.credits),
              })),
            }))

            if (mappedSems.length > 0) {
              setSemesters(mappedSems)
            }
          }
        } catch (error) {
          console.error('Error loading existing custom degree:', error)
          toast.error('Failed to load existing custom degree.')
        } finally {
          setIsLoadingExisting(false)
        }
      } else if (!authLoading) {
        setIsLoadingExisting(false)
      }
    }
    loadExisting()
  }, [isAuthenticated, user, authLoading])

  const handleAddSemester = () => {
    const nextSemNumber = semesters.length + 1
    const newSem: DynamicSemester = {
      id: `sem_${Date.now()}`,
      name: `Semester ${nextSemNumber}`,
      subjects: [{ code: '', name: '', credits: '3' }],
    }
    setSemesters([...semesters, newSem])
    toast.success(`Semester ${nextSemNumber} added!`)
  }

  const handleRemoveSemester = (semId: string) => {
    if (semesters.length === 1) {
      toast.error('Your degree program must have at least one semester.')
      return
    }
    const filtered = semesters.filter((sem) => sem.id !== semId)
    // Re-index semester display names
    const reindexed = filtered.map((sem, idx) => ({
      ...sem,
      name: `Semester ${idx + 1}`,
    }))
    setSemesters(reindexed)
    toast.success('Semester removed')
  }

  const handleAddSubject = (semId: string) => {
    setSemesters(
      semesters.map((sem) => {
        if (sem.id !== semId) return sem
        return {
          ...sem,
          subjects: [...sem.subjects, { code: '', name: '', credits: '3' }],
        }
      })
    )
  }

  const handleRemoveSubject = (semId: string, subjectIndex: number) => {
    setSemesters(
      semesters.map((sem) => {
        if (sem.id !== semId) return sem
        if (sem.subjects.length === 1) {
          toast.error('Each semester must have at least one subject.')
          return sem
        }
        return {
          ...sem,
          subjects: sem.subjects.filter((_, idx) => idx !== subjectIndex),
        }
      })
    )
  }

  const handleSubjectChange = (
    semId: string,
    subjectIndex: number,
    field: keyof DynamicSubject,
    value: string
  ) => {
    setSemesters(
      semesters.map((sem) => {
        if (sem.id !== semId) return sem
        const updatedSubjects = sem.subjects.map((sub, idx) => {
          if (idx !== subjectIndex) return sub
          
          let formattedValue = value
          if (field === 'code') {
            // Automatically uppercase subject codes and remove spaces
            formattedValue = value.toUpperCase().replace(/\s+/g, '')
          }

          return {
            ...sub,
            [field]: formattedValue,
          }
        })
        return {
          ...sem,
          subjects: updatedSubjects,
        }
      })
    )
  }

  const validateForm = (): boolean => {
    if (!degreeName.trim()) {
      toast.error('Please enter a degree program name.')
      return false
    }

    for (const sem of semesters) {
      if (sem.subjects.length === 0) {
        toast.error(`Please add at least one subject to ${sem.name}.`)
        return false
      }

      for (let i = 0; i < sem.subjects.length; i++) {
        const sub = sem.subjects[i]
        const displayIdx = i + 1

        if (!sub.code.trim()) {
          toast.error(`Subject ${displayIdx} in ${sem.name} is missing a code.`)
          return false
        }
        if (!sub.name.trim()) {
          toast.error(`Subject ${displayIdx} in ${sem.name} is missing a name.`)
          return false
        }
        const parsedCredits = Number(sub.credits)
        if (isNaN(parsedCredits) || parsedCredits <= 0 || parsedCredits > 12) {
          toast.error(`Subject "${sub.code || displayIdx}" in ${sem.name} must have credits between 1 and 12.`)
          return false
        }
      }
    }
    return true
  }

  const handleSaveProgram = async () => {
    if (!validateForm() || !user) return

    setIsSaving(true)
    try {
      // Map local dynamic state into SemesterMap schema
      const mappedSemesters: SemesterMap = {}
      semesters.forEach((sem) => {
        const subjectsList: Subject[] = sem.subjects.map((sub) => ({
          code: sub.code.trim(),
          name: sub.name.trim(),
          credits: Number(sub.credits),
        }))

        mappedSemesters[sem.name] = {
          core: subjectsList,
          electiveCreditsRequired: 0,
        }
      })

      const customDegreeData: CustomDegreeData = {
        degreeName: degreeName.trim(),
        semesters: mappedSemesters,
      }

      await saveCustomDegree(user.uid, customDegreeData)
      toast.success('Custom degree program saved successfully!')
      
      // Navigate back to addGrades
      navigate('/addGrades')
    } catch (error) {
      console.error('Error saving custom degree:', error)
      toast.error('Failed to save degree program. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoadingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-sm text-muted-foreground">Loading configurations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground p-0 mt-0">
      <main className="flex-grow">
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-6">
            
            {/* Header */}
            <div className="relative flex justify-center items-center mb-8">
              <button
                onClick={() => navigate('/addGrades')}
                disabled={isSaving}
                className="absolute left-0 p-2 rounded-full border border-border bg-card hover:bg-accent transition-colors duration-200 disabled:opacity-50"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="h-7 w-7 text-primary" />
                Custom Degree Creator
              </h1>
            </div>

            {/* Warning Message on Data Isolation */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm text-blue-600 dark:text-blue-400 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Private Curricula Mode</span>: Your custom degree program is saved securely in your private cloud profile. It is only accessible to you and will not interfere with other students' preloaded data lists.
              </div>
            </motion.div>

            {/* Degree Metadata */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6">
              <div className="space-y-2">
                <Label htmlFor="degreeName" className="text-base font-semibold text-foreground">
                  Degree Program Name
                </Label>
                <Input
                  id="degreeName"
                  placeholder="e.g., BSc in Cybersecurity, BCom in Accounting"
                  value={degreeName}
                  onChange={(e) => setDegreeName(e.target.value)}
                  className="bg-muted/50 border-border max-w-xl h-11"
                  disabled={isSaving}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  This custom title will display inside your GPA reports and grade selector tools.
                </p>
              </div>
            </div>

            {/* Dynamic Semesters Card List */}
            <div className="space-y-6 mb-8">
              <AnimatePresence initial={false}>
                {semesters.map((sem) => (
                  <motion.div
                    key={sem.id}
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
                  >
                    {/* Semester Section Header */}
                    <div className="bg-muted/40 border-b border-border px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-lg text-foreground">{sem.name}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSemester(sem.id)}
                        disabled={isSaving}
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-600 font-medium"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove Semester
                      </Button>
                    </div>

                    {/* Subjects Grid Table */}
                    <div className="p-6">
                      <div className="w-full overflow-x-auto">
                        <table className="min-w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground font-semibold">
                              <th className="pb-3 w-1/4 pr-4">Subject Code</th>
                              <th className="pb-3 w-1/2 pr-4">Subject Name</th>
                              <th className="pb-3 w-1/6 pr-4 text-center">Credits</th>
                              <th className="pb-3 w-[80px] text-center">Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sem.subjects.map((sub, subIdx) => (
                              <tr key={subIdx} className="border-b border-border last:border-0">
                                <td className="py-3 pr-4">
                                  <Input
                                    placeholder="e.g. CYB101"
                                    value={sub.code}
                                    onChange={(e) =>
                                      handleSubjectChange(sem.id, subIdx, 'code', e.target.value)
                                    }
                                    className="bg-muted/30 border-border font-mono uppercase h-10"
                                    disabled={isSaving}
                                    maxLength={15}
                                  />
                                </td>
                                <td className="py-3 pr-4">
                                  <Input
                                    placeholder="e.g. Introduction to Security"
                                    value={sub.name}
                                    onChange={(e) =>
                                      handleSubjectChange(sem.id, subIdx, 'name', e.target.value)
                                    }
                                    className="bg-muted/30 border-border h-10"
                                    disabled={isSaving}
                                    maxLength={80}
                                  />
                                </td>
                                <td className="py-3 pr-4">
                                  <select
                                    value={sub.credits}
                                    onChange={(e) =>
                                      handleSubjectChange(sem.id, subIdx, 'credits', e.target.value)
                                    }
                                    className="flex h-10 w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-center font-semibold"
                                    disabled={isSaving}
                                  >
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                    <option value="6">6</option>
                                    <option value="8">8</option>
                                  </select>
                                </td>
                                <td className="py-3 text-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveSubject(sem.id, subIdx)}
                                    disabled={isSaving}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-10 w-10 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <Button
                        onClick={() => handleAddSubject(sem.id)}
                        disabled={isSaving}
                        variant="outline"
                        size="sm"
                        className="mt-4 border-dashed border-primary/40 hover:border-primary text-primary flex items-center gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        Add Subject
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Semester List Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-xl p-6 shadow-sm">
              <Button
                variant="outline"
                onClick={handleAddSemester}
                disabled={isSaving}
                className="w-full sm:w-auto hover:bg-accent flex items-center gap-2"
              >
                <Plus className="h-5 w-5 text-primary" />
                Add Semester Block
              </Button>

              <div className="flex gap-4 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/addGrades')}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProgram}
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-sm font-semibold h-10 px-5"
                >
                  {isSaving ? (
                    <>
                      <Spinner className="h-4 w-4 text-white" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Program
                    </>
                  )}
                </Button>
              </div>
            </div>

          </div>
        </div>
      </main>
      <footer className="w-full text-center text-xs text-muted-foreground bg-background py-2 border-t border-border z-50 opacity-40">
        Developed by Toran
      </footer>
    </div>
  )
}
