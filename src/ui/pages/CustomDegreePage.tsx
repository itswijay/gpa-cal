import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, Save, GraduationCap, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '../hooks/useAuth'
import {
  saveCustomDegree,
  deleteCustomDegree,
  suggestCustomDegreeDeletion,
} from '../../adapters/firebase/curriculumRepository'
import type { CustomDegreeData } from '../../adapters/firebase/curriculumRepository'
import { Spinner } from '../components/ui/spinner'
import { validateCustomDegreeForm } from '../../domain/curriculum/validateCustomDegreeForm'
import { validateYearWeightConfig } from '../../domain/curriculum/validateYearWeightConfig'
import type { DynamicSubject, DynamicSemester } from '../../domain/curriculum/customDegreeForm'
import { mapSemesterMapToDynamicSemesters } from '../../domain/curriculum/mapSemesterMapToDynamicSemesters'
import { mapDynamicSemestersToSemesterMap } from '../../domain/curriculum/mapDynamicSemestersToSemesterMap'
import { parseSemesterNumber } from '../../domain/curriculum/parseSemesterNumber'
import { useCustomDegreeFormState } from '../hooks/useCustomDegreeFormState'
import { DeleteProgramDialog } from '../components/custom-degree/DeleteProgramDialog'
import { SuggestDeletionDialog } from '../components/custom-degree/SuggestDeletionDialog'
import { CurriculumDropdown } from '../components/custom-degree/CurriculumDropdown'
import { SemesterCard } from '../components/custom-degree/SemesterCard'
import type { YearWeightedGpaConfig } from '../../data/types'

export default function CustomDegreePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const {
    degreeName,
    setDegreeName,
    universityName,
    setUniversityName,
    universityShort,
    setUniversityShort,
    facultyName,
    setFacultyName,
    preloadedUniversities,
    selectedUniversityOption,
    setSelectedUniversityOption,
    preloadedFaculties,
    setPreloadedFaculties,
    selectedFacultyOption,
    setSelectedFacultyOption,
    preloadedDegrees,
    setPreloadedDegrees,
    selectedDegreeOption,
    setSelectedDegreeOption,
    isSuggested,
    setIsSuggested,
    suggestionStatus,
    setSuggestionStatus,
    rejectionReason,
    suggestionId,
    semesters,
    setSemesters,
    isLoadingExisting,
    hasExistingProgram,
    hasUserEdited,
    setHasUserEdited,
    gpaMethod,
    setGpaMethod,
    semestersPerYear,
    setSemestersPerYear,
    yearWeightInputs,
    setYearWeightInputs,
  } = useCustomDegreeFormState({ isAuthenticated, user, authLoading })

  const [isSaving, setIsSaving] = useState(false)

  const numYears = useMemo(() => {
    if (semesters.length === 0 || semestersPerYear <= 0) return 0
    const maxSemNum = semesters.reduce(
      (max, sem) => Math.max(max, parseSemesterNumber(sem.name)),
      0
    )
    return Math.ceil(maxSemNum / semestersPerYear)
  }, [semesters, semestersPerYear])

  const weightSum = Object.values(yearWeightInputs).reduce(
    (sum, w) => sum + (Number(w) || 0),
    0
  )

  const distributeEvenWeights = () => {
    const even = Math.floor(100 / numYears)
    const newWeights: Record<number, string> = {}
    for (let i = 1; i <= numYears; i++) {
      newWeights[i] = i === 1 ? String(100 - even * (numYears - 1)) : String(even)
    }
    setYearWeightInputs(newWeights)
  }

  // Auto-distribute weights evenly when year count changes due to user edits.
  // Skipped during initial data load (hasUserEdited is false) to preserve loaded weights,
  // and skipped while Normal is active so editing semesters there doesn't clobber a
  // dormant year-weighted config the user isn't currently looking at.
  useEffect(() => {
    if (numYears <= 0) return
    if (!hasUserEdited) return
    if (gpaMethod !== 'year-weighted') return
    distributeEvenWeights()
  }, [numYears])

  // Seed even weights when Year-Weighted becomes active and no weights are set yet
  // (e.g. right after auto-loading a preloaded degree). Weights loaded from a saved
  // config or already typed by the user are preserved.
  useEffect(() => {
    if (gpaMethod !== 'year-weighted' || numYears <= 0) return
    const hasAnyWeight = Array.from({ length: numYears }, (_, i) => yearWeightInputs[i + 1]).some(
      (w) => w !== undefined && w !== ''
    )
    if (hasAnyWeight) return
    distributeEvenWeights()
  }, [gpaMethod])

  // Deletion Dialog States
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isSuggestDeleteOpen, setIsSuggestDeleteOpen] = useState(false)
  const [deletionReasonInput, setDeletionReasonInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteProgram = async () => {
    if (!user) return
    setIsDeleting(true)
    const loadToast = toast.loading('Deleting your custom degree from your account...')
    try {
      await deleteCustomDegree(user.uid)
      toast.success('Custom degree successfully removed from your account!', { id: loadToast })
      setIsDeleteConfirmOpen(false)
      navigate('/addGrades')
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('Failed to delete program. Try again later.', { id: loadToast })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSuggestDeletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !suggestionId) return
    if (!deletionReasonInput.trim()) {
      toast.error('Please enter a deletion reason.')
      return
    }

    setIsDeleting(true)
    const loadToast = toast.loading('Submitting deletion request...')
    try {
      // Map local dynamic state into SemesterMap schema
      const mappedSemesters = mapDynamicSemestersToSemesterMap(semesters)

      const customDegreeData: CustomDegreeData = {
        degreeName: degreeName.trim(),
        universityName: universityName.trim() || undefined,
        universityShort: universityShort.trim() || undefined,
        facultyName: facultyName.trim() || undefined,
        isSuggested: true,
        suggestionStatus: 'delete_pending',
        deletionReason: deletionReasonInput.trim(),
        suggestionId,
        semesters: mappedSemesters,
      }

      await suggestCustomDegreeDeletion(
        user.uid,
        suggestionId,
        deletionReasonInput.trim(),
        customDegreeData,
        user.email || undefined
      )

      toast.success('Deletion suggestion submitted for admin review!', { id: loadToast })
      setIsSuggestDeleteOpen(false)
      setDeletionReasonInput('')
      navigate('/addGrades')
    } catch (error) {
      console.error('Suggest deletion failed:', error)
      toast.error('Failed to suggest deletion.', { id: loadToast })
    } finally {
      setIsDeleting(false)
    }
  }



  // Redirect guest users back
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('You must be logged in to access this page.')
      navigate('/')
    }
  }, [isAuthenticated, authLoading, navigate])



  const handleAddSemester = () => {
    setHasUserEdited(true)
    const nextSemNumber = semesters.length + 1
    const newSem: DynamicSemester = {
      id: `sem_${Date.now()}`,
      name: `Semester ${nextSemNumber}`,
      electiveCreditsRequired: '0',
      subjects: [{ code: '', name: '', credits: '3', isElective: false }],
    }
    setSemesters([...semesters, newSem])
    toast.success(`Semester ${nextSemNumber} added!`)
  }

  const handleRemoveSemester = (semId: string) => {
    if (semesters.length === 1) {
      toast.error('Your degree program must have at least one semester.')
      return
    }
    setHasUserEdited(true)
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
    setHasUserEdited(true)
    setSemesters(
      semesters.map((sem) => {
        if (sem.id !== semId) return sem
        return {
          ...sem,
          subjects: [...sem.subjects, { code: '', name: '', credits: '3', isElective: false }],
        }
      })
    )
  }

  const handleRemoveSubject = (semId: string, subjectIndex: number) => {
    setHasUserEdited(true)
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
    setHasUserEdited(true)
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

  const handleSubjectElectiveToggle = (semId: string, subjectIndex: number) => {
    setHasUserEdited(true)
    setSemesters(
      semesters.map((sem) => {
        if (sem.id !== semId) return sem
        const updatedSubjects = sem.subjects.map((sub, idx) => {
          if (idx !== subjectIndex) return sub
          return {
            ...sub,
            isElective: !sub.isElective,
          }
        })
        return {
          ...sem,
          subjects: updatedSubjects,
        }
      })
    )
  }

  const handleSemesterElectiveCreditsChange = (semId: string, value: string) => {
    setHasUserEdited(true)
    setSemesters(
      semesters.map((sem) => {
        if (sem.id !== semId) return sem
        return {
          ...sem,
          electiveCreditsRequired: value,
        }
      })
    )
  }

  const handleSaveProgram = async () => {
    if (!user) return

    const validationResult = validateCustomDegreeForm({
      isSuggested,
      universityName,
      universityShort,
      facultyName,
      degreeName,
      semesters,
    })

    if (!validationResult.valid) {
      toast.error(validationResult.error)
      return
    }

    // Always carry the year-weight config through (even while Normal is active) so
    // switching methods back and forth doesn't wipe it from Firestore on save. Only
    // block the save on incomplete/invalid weights when Year-Weighted is actually selected.
    let yearWeightedConfig: YearWeightedGpaConfig | undefined
    if (numYears > 0) {
      const yearWeights = Array.from({ length: numYears }, (_, i) => ({
        year: i + 1,
        weight: (Number(yearWeightInputs[i + 1]) || 0) / 100,
      }))
      yearWeightedConfig = { semestersPerYear, yearWeights }
    }
    if (gpaMethod === 'year-weighted') {
      const weightError = validateYearWeightConfig(yearWeightedConfig!)
      if (weightError) {
        toast.error(weightError)
        return
      }
    }

    setIsSaving(true)
    try {
      // Map local dynamic state into SemesterMap schema
      const mappedSemesters = mapDynamicSemestersToSemesterMap(semesters)

      const customDegreeData: CustomDegreeData = {
        degreeName: degreeName.trim(),
        universityName: universityName.trim() || undefined,
        universityShort: universityShort.trim() || undefined,
        facultyName: facultyName.trim() || undefined,
        isSuggested,
        suggestionStatus: isSuggested ? 'pending' : undefined,
        rejectionReason: isSuggested ? undefined : rejectionReason,
        suggestionId: suggestionId || undefined,
        semesters: mappedSemesters,
        gpaMethod,
        yearWeightedConfig,
      }

      await saveCustomDegree(user.uid, customDegreeData, user.email || undefined)
      
      if (isSuggested) {
        toast.success('Custom degree saved and suggested for review!')
      } else {
        toast.success('Custom degree program saved successfully!')
      }
      // Navigate back to addGrades
      navigate('/addGrades')
    } catch (error) {
      console.error('Error saving custom degree:', error)
      
      const err = error as { code?: string; message?: string } | null
      const isPermissionDenied = 
        err?.code === 'permission-denied' || 
        (err?.message && err.message.includes('permission-denied')) ||
        (err?.message && err.message.includes('Permission'))

      if (isPermissionDenied) {
        toast.error(
          'Missing database permissions! Please configure your Firestore security rules to allow access to the customDegree collection.',
          { duration: 8000 }
        )
      } else {
        toast.error('Failed to save degree program. Please try again.')
      }
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
              <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2 ml-4 sm:ml-0">
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
              <div className="space-y-2">
                <div>
                  <span className="font-semibold">Private Curricula Mode</span>: Your custom degree program is saved securely in your private cloud profile. It is only accessible to you and will not interfere with other students' preloaded data lists.
                </div>
                <div className="text-xs bg-blue-500/5 border border-blue-500/10 rounded-md p-2 flex items-center gap-1.5 mt-1 text-blue-700/80 dark:text-blue-300/80">
                  <span className="text-sm">💡</span>
                  <span>
                    <strong>Pro Tip:</strong> If this curriculum is missing or has incomplete semesters in the public database, you can toggle <strong>"Suggest for Public Curricula"</strong> below to submit your updates for admin review!
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Degree Metadata */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6 space-y-4">
              
              {/* University Selector Dropdown */}
              <CurriculumDropdown
                id="universitySelector"
                label="Select University"
                triggerPlaceholder="Choose a University"
                selectedDisplayValue={
                  selectedUniversityOption === 'custom'
                    ? 'Other / Custom University'
                    : preloadedUniversities.find((u) => u.shortName === selectedUniversityOption)?.name
                }
                options={preloadedUniversities.map((uni) => ({
                  value: uni.shortName,
                  label: (
                    <div className="flex flex-col items-start gap-0.5 w-full">
                      <span className="font-bold text-xs text-primary">{uni.shortName}</span>
                      <span className="text-[11px] text-muted-foreground truncate max-w-full">
                        {uni.name}
                      </span>
                    </div>
                  ),
                }))}
                onSelectOption={(value) => {
                  const uni = preloadedUniversities.find((u) => u.shortName === value)
                  if (uni) {
                    setSelectedUniversityOption(uni.shortName)
                    setUniversityShort(uni.shortName)
                    setUniversityName(uni.name)
                    const facNames = Object.keys(uni.faculties || {})
                    setPreloadedFaculties(facNames)
                    setSelectedFacultyOption('')
                    setFacultyName('')
                    setPreloadedDegrees([])
                    setSelectedDegreeOption('')
                    setDegreeName('')
                  }
                }}
                onSelectCustom={() => {
                  setSelectedUniversityOption('custom')
                  setUniversityShort('')
                  setUniversityName('')
                  setPreloadedFaculties([])
                  setSelectedFacultyOption('custom')
                  setFacultyName('')
                  setPreloadedDegrees([])
                  setSelectedDegreeOption('custom')
                  setDegreeName('')
                }}
                customLabel="Add Custom / New University"
                disabled={isSaving}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="universityName" className="text-sm font-semibold text-foreground">
                    University Full Name
                  </Label>
                  <Input
                    id="universityName"
                    placeholder="e.g. Sabaragamuwa University of Sri Lanka"
                    value={universityName}
                    onChange={(e) => {
                      setUniversityName(e.target.value)
                      setHasUserEdited(true)
                    }}
                    className={`bg-muted/50 border-border h-11 transition-all ${
                      selectedUniversityOption !== 'custom' && selectedUniversityOption !== ''
                        ? 'opacity-70 bg-muted cursor-not-allowed font-medium'
                        : ''
                    }`}
                    disabled={isSaving || (selectedUniversityOption !== 'custom' && selectedUniversityOption !== '')}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="universityShort" className="text-sm font-semibold text-foreground">
                    University Abbreviation
                  </Label>
                  <Input
                    id="universityShort"
                    placeholder="e.g. SUSL"
                    value={universityShort}
                    onChange={(e) => {
                      setUniversityShort(e.target.value)
                      setHasUserEdited(true)
                    }}
                    className={`bg-muted/50 border-border h-11 uppercase font-semibold transition-all ${
                      selectedUniversityOption !== 'custom' && selectedUniversityOption !== ''
                        ? 'opacity-70 bg-muted cursor-not-allowed font-semibold'
                        : ''
                    }`}
                    disabled={isSaving || (selectedUniversityOption !== 'custom' && selectedUniversityOption !== '')}
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Faculty Selector Dropdown */}
              {preloadedFaculties.length > 0 && (
                <CurriculumDropdown
                  id="facultySelector"
                  label="Select Faculty"
                  triggerPlaceholder="Choose a Faculty"
                  selectedDisplayValue={
                    selectedFacultyOption === 'custom'
                      ? 'Other / Custom Faculty'
                      : selectedFacultyOption
                  }
                  options={preloadedFaculties.map((fac) => ({
                    value: fac,
                    label: fac,
                  }))}
                  onSelectOption={(value) => {
                    setSelectedFacultyOption(value)
                    setFacultyName(value)
                    
                    // Get preloaded degrees under this faculty
                    const uni = preloadedUniversities.find((u) => u.shortName === selectedUniversityOption)
                    if (uni) {
                      const degNames = Object.keys(uni.faculties[value] || {})
                      setPreloadedDegrees(degNames)
                    } else {
                      setPreloadedDegrees([])
                    }
                    setSelectedDegreeOption('')
                    setDegreeName('')
                  }}
                  onSelectCustom={() => {
                    setSelectedFacultyOption('custom')
                    setFacultyName('')
                    setPreloadedDegrees([])
                    setSelectedDegreeOption('custom')
                    setDegreeName('')
                  }}
                  customLabel="Add Custom / New Faculty"
                  disabled={isSaving}
                />
              )}

              {/* Degree Selector Dropdown */}
              {preloadedDegrees.length > 0 && (
                <CurriculumDropdown
                  id="degreeSelector"
                  label="Select Degree Program"
                  triggerPlaceholder="Choose a Degree Program"
                  selectedDisplayValue={
                    selectedDegreeOption === 'custom'
                      ? 'Other / Custom Degree Program'
                      : selectedDegreeOption
                  }
                  options={preloadedDegrees.map((deg) => ({
                    value: deg,
                    label: deg,
                  }))}
                  onSelectOption={(value) => {
                    setSelectedDegreeOption(value)
                    setDegreeName(value)
                    
                    // AUTO-POPULATE: load existing preloaded semesters for this degree!
                    const uni = preloadedUniversities.find((u) => u.shortName === selectedUniversityOption)
                    if (uni && selectedFacultyOption) {
                      const existingSems = uni.faculties[selectedFacultyOption]?.[value] || {}
                      
                      const mappedSems = mapSemesterMapToDynamicSemesters(existingSems)
                      if (mappedSems.length > 0) {
                        setSemesters(mappedSems)
                        setHasUserEdited(false)
                        toast.success(`Loaded ${mappedSems.length} semesters from preloaded database! You can now edit them or add new semesters.`)
                      }
                    }
                  }}
                  onSelectCustom={() => {
                    setSelectedDegreeOption('custom')
                    setDegreeName('')
                    setSemesters([{ id: 'sem_1', name: 'Semester 1', subjects: [{ code: '', name: '', credits: '3' }] }])
                    setHasUserEdited(false)
                  }}
                  customLabel="Add Custom / New Degree Program"
                  disabled={isSaving}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facultyName" className="text-sm font-semibold text-foreground">
                    Faculty Name
                  </Label>
                  <Input
                    id="facultyName"
                    placeholder="e.g. Computing"
                    value={facultyName}
                    onChange={(e) => {
                      setFacultyName(e.target.value)
                      setHasUserEdited(true)
                    }}
                    className={`bg-muted/50 border-border h-11 transition-all ${
                      preloadedFaculties.length > 0 && selectedFacultyOption !== 'custom' && selectedFacultyOption !== ''
                        ? 'opacity-70 bg-muted cursor-not-allowed font-medium'
                        : ''
                    }`}
                    disabled={
                      isSaving || 
                      (preloadedFaculties.length > 0 && selectedFacultyOption !== 'custom' && selectedFacultyOption !== '')
                    }
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degreeName" className="text-sm font-semibold text-foreground">
                    Degree Program Name
                  </Label>
                  <Input
                    id="degreeName"
                    placeholder="e.g. BSc in Computer Science"
                    value={degreeName}
                    onChange={(e) => {
                      setDegreeName(e.target.value)
                      setHasUserEdited(true)
                    }}
                    className={`bg-muted/50 border-border h-11 transition-all ${
                      preloadedDegrees.length > 0 && selectedDegreeOption !== 'custom' && selectedDegreeOption !== ''
                        ? 'opacity-70 bg-muted cursor-not-allowed font-medium'
                        : ''
                    }`}
                    disabled={
                      isSaving || 
                      (preloadedDegrees.length > 0 && selectedDegreeOption !== 'custom' && selectedDegreeOption !== '')
                    }
                    maxLength={100}
                  />
                </div>
              </div>

              {/* Public Suggestion Toggle */}
              <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor="suggestToggle" className="text-sm font-semibold text-foreground cursor-pointer">
                      Suggest for Public Database
                    </Label>
                    {isSuggested && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        suggestionStatus === 'approved'
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : suggestionStatus === 'rejected'
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                      }`}>
                        {suggestionStatus === 'approved' ? 'Approved' : suggestionStatus === 'rejected' ? 'Changes Requested' : 'Under Review'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Allow an admin to review and approve this syllabus structure to be preloaded for all students.
                  </p>
                  {!hasUserEdited && (
                    <p className="text-[11px] text-muted-foreground italic mt-0.5">
                      Make a change to your degree structure to enable this.
                    </p>
                  )}
                  {suggestionStatus === 'rejected' && rejectionReason && (
                    <p className="text-xs text-red-500 font-semibold bg-red-500/5 p-2 rounded border border-red-500/10 mt-1">
                      Note from Admin: {rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="suggestToggle"
                    checked={isSuggested}
                    onChange={(e) => {
                      setIsSuggested(e.target.checked)
                      if (e.target.checked && (suggestionStatus === 'rejected' || suggestionStatus === 'approved')) {
                        setSuggestionStatus('pending')
                      }
                    }}
                    className="h-5 w-5 rounded border-border text-primary focus:ring-primary bg-muted cursor-pointer"
                    disabled={isSaving || !hasUserEdited}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Semesters Card List */}
            <div className="space-y-6 mb-8">
              <AnimatePresence initial={false}>
                {semesters.map((sem) => (
                  <SemesterCard
                    key={sem.id}
                    sem={sem}
                    isSaving={isSaving}
                    onRemoveSemester={handleRemoveSemester}
                    onElectiveCreditsChange={handleSemesterElectiveCreditsChange}
                    onAddSubject={handleAddSubject}
                    onRemoveSubject={handleRemoveSubject}
                    onSubjectChange={handleSubjectChange}
                    onSubjectElectiveToggle={handleSubjectElectiveToggle}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* GPA Calculation Method */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-1">GPA Calculation Method</h2>
                <p className="text-xs text-muted-foreground">
                  Choose how the final GPA is calculated for this degree program.
                </p>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gpaMethod"
                    value="normal"
                    checked={gpaMethod === 'normal'}
                    onChange={() => {
                      setGpaMethod('normal')
                      setHasUserEdited(true)
                    }}
                    disabled={isSaving}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">Normal (Credit-Weighted)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gpaMethod"
                    value="year-weighted"
                    checked={gpaMethod === 'year-weighted'}
                    onChange={() => {
                      setGpaMethod('year-weighted')
                      setHasUserEdited(true)
                    }}
                    disabled={isSaving}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">Year-Weighted (FGPA)</span>
                </label>
              </div>

              {gpaMethod === 'year-weighted' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-2 border-t border-border"
                >
                  <div className="flex items-center gap-3">
                    <Label className="text-xs font-medium whitespace-nowrap">Semesters per year</Label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={semestersPerYear}
                      onChange={(e) => {
                        setSemestersPerYear(Math.max(1, Number(e.target.value)))
                        setHasUserEdited(true)
                      }}
                      disabled={isSaving}
                      className="w-16 text-center text-sm border border-border rounded px-2 py-1 bg-muted"
                    />
                  </div>

                  {numYears > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Year weights (must total 100%)</p>
                      {Array.from({ length: numYears }, (_, i) => i + 1).map((year) => (
                        <div key={year} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-muted-foreground w-14">Year {year}</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={yearWeightInputs[year] ?? ''}
                            onChange={(e) => {
                              setYearWeightInputs((prev) => ({ ...prev, [year]: e.target.value }))
                              setHasUserEdited(true)
                            }}
                            disabled={isSaving}
                            className="w-16 text-center text-sm border border-border rounded px-2 py-1 bg-muted"
                          />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                      ))}
                      <p
                        className={`text-xs font-medium ${
                          Math.abs(weightSum - 100) <= 0.5
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-500'
                        }`}
                      >
                        Total: {weightSum}%{' '}
                        {Math.abs(weightSum - 100) <= 0.5 ? '✓' : '(must be 100%)'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Add semesters above to configure year weights.
                    </p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Semester List Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleAddSemester}
                  disabled={isSaving || isDeleting}
                  className="w-full sm:w-auto hover:bg-accent flex items-center gap-2"
                >
                  <Plus className="h-5 w-5 text-primary" />
                  Add Semester Block
                </Button>

                {/* Delete from Account (Always available if they have a saved custom degree template) */}
                {hasExistingProgram && (
                  <Button
                    variant="destructive"
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    disabled={isSaving || isDeleting}
                    className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 font-semibold flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Program
                  </Button>
                )}

                {/* Suggest Public Deletion (Only if template was approved/is public) */}
                {suggestionId && suggestionStatus === 'approved' && (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsSuggestDeleteOpen(true)}
                    disabled={isSaving || isDeleting}
                    className="bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-500 font-semibold flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Suggest Public Deletion
                  </Button>
                )}

                {/* Public Deletion Pending Badge */}
                {suggestionId && suggestionStatus === 'delete_pending' && (
                  <Button
                    variant="outline"
                    type="button"
                    disabled={true}
                    className="bg-muted border border-border text-muted-foreground font-semibold flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Public Deletion Pending
                  </Button>
                )}
              </div>

              <div className="flex gap-4 w-full sm:w-auto">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/addGrades')}
                  disabled={isSaving || isDeleting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProgram}
                  disabled={isSaving || isDeleting || suggestionStatus === 'delete_pending'}
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

      <DeleteProgramDialog
        isOpen={isDeleteConfirmOpen}
        isDeleting={isDeleting}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDeleteProgram}
      />

      <SuggestDeletionDialog
        isOpen={isSuggestDeleteOpen}
        isDeleting={isDeleting}
        deletionReasonInput={deletionReasonInput}
        onDeletionReasonChange={setDeletionReasonInput}
        onCancel={() => {
          setIsSuggestDeleteOpen(false)
          setDeletionReasonInput('')
        }}
        onSubmit={handleSuggestDeletionSubmit}
      />
    </div>
  )
}
