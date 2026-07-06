import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, Save, GraduationCap, BookOpen, AlertCircle, ChevronDown } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { validateCustomDegreeForm } from '../../domain/curriculum/validateCustomDegreeForm'
import type { DynamicSubject, DynamicSemester } from '../../domain/curriculum/customDegreeForm'
import { mapSemesterMapToDynamicSemesters } from '../../domain/curriculum/mapSemesterMapToDynamicSemesters'
import { mapDynamicSemestersToSemesterMap } from '../../domain/curriculum/mapDynamicSemestersToSemesterMap'
import { useCustomDegreeFormState } from '../hooks/useCustomDegreeFormState'
import { DeleteProgramDialog } from '../components/custom-degree/DeleteProgramDialog'
import { SuggestDeletionDialog } from '../components/custom-degree/SuggestDeletionDialog'
import { CurriculumDropdown } from '../components/custom-degree/CurriculumDropdown'

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
  } = useCustomDegreeFormState({ isAuthenticated, user, authLoading })

  const [isSaving, setIsSaving] = useState(false)

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
          subjects: [...sem.subjects, { code: '', name: '', credits: '3', isElective: false }],
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

  const handleSubjectElectiveToggle = (semId: string, subjectIndex: number) => {
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
                    onChange={(e) => setUniversityName(e.target.value)}
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
                    onChange={(e) => setUniversityShort(e.target.value)}
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
                        toast.success(`Loaded ${mappedSems.length} semesters from preloaded database! You can now edit them or add new semesters.`)
                      }
                    }
                  }}
                  onSelectCustom={() => {
                    setSelectedDegreeOption('custom')
                    setDegreeName('')
                    setSemesters([{ id: 'sem_1', name: 'Semester 1', subjects: [{ code: '', name: '', credits: '3' }] }])
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
                    onChange={(e) => setFacultyName(e.target.value)}
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
                    onChange={(e) => setDegreeName(e.target.value)}
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
                    disabled={isSaving}
                  />
                </div>
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
                    <div className="bg-muted/40 border-b border-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-primary" />
                          <h3 className="font-bold text-lg text-foreground">{sem.name}</h3>
                        </div>

                        {/* Elective Credits Selector */}
                        <div className="flex items-center gap-2 text-xs bg-muted/80 border border-border px-2.5 py-1 rounded-lg text-muted-foreground">
                          <span className="font-semibold text-foreground">Required Elective Credits:</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 font-bold text-primary hover:bg-primary/10 gap-1 flex items-center"
                                disabled={isSaving}
                              >
                                <span>{sem.electiveCreditsRequired || '0'}</span>
                                <ChevronDown className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-card border-border min-w-[75px]">
                              {['0', '1', '2', '3', '4', '5', '6', '8'].map((val) => (
                                <DropdownMenuItem
                                  key={val}
                                  onSelect={() => handleSemesterElectiveCreditsChange(sem.id, val)}
                                  className="hover:bg-accent focus:bg-accent text-center justify-center font-bold cursor-pointer py-1"
                                >
                                  {val}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSemester(sem.id)}
                        disabled={isSaving}
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-600 font-medium self-end sm:self-auto"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove Semester
                      </Button>
                    </div>

                    {/* Subjects Grid Table (Desktop) & Card List (Mobile) */}
                    <div className="p-4 sm:p-6">
                      {/* Mobile View: Dynamic Input Cards */}
                      <div className="block sm:hidden space-y-4">
                        {sem.subjects.map((sub, subIdx) => (
                          <div
                            key={subIdx}
                            className="relative p-4 rounded-lg border border-border bg-muted/20 space-y-3"
                          >
                            <div className="absolute top-2 right-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveSubject(sem.id, subIdx)}
                                disabled={isSaving}
                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 w-8 rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-2.5 pr-8">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                                  Code
                                </Label>
                                <Input
                                  placeholder="CYB101"
                                  value={sub.code}
                                  onChange={(e) =>
                                    handleSubjectChange(sem.id, subIdx, 'code', e.target.value)
                                  }
                                  className="bg-muted/40 border-border font-mono uppercase h-9 text-xs px-2"
                                  disabled={isSaving}
                                  maxLength={15}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                                  Type
                                </Label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSubjectElectiveToggle(sem.id, subIdx)}
                                  disabled={isSaving}
                                  className={`w-full h-9 justify-center rounded-lg font-bold text-[10px] transition-all px-1 ${
                                    sub.isElective
                                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
                                      : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                                  }`}
                                >
                                  {sub.isElective ? 'Elective' : 'Core'}
                                </Button>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                                  Credits
                                </Label>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-between bg-muted/40 border-border hover:bg-accent text-foreground font-semibold h-9 text-xs px-2 py-1"
                                      disabled={isSaving}
                                    >
                                      <span>{sub.credits}</span>
                                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="bg-card border-border min-w-[60px]">
                                    {['1', '2', '3', '4', '5', '6', '8'].map((creditVal) => (
                                      <DropdownMenuItem
                                        key={creditVal}
                                        onSelect={() =>
                                          handleSubjectChange(sem.id, subIdx, 'credits', creditVal)
                                        }
                                        className="hover:bg-accent focus:bg-accent text-center justify-center font-semibold cursor-pointer py-1"
                                      >
                                        {creditVal}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground uppercase font-bold">
                                Subject Name
                              </Label>
                              <Input
                                placeholder="e.g. Introduction to Security"
                                value={sub.name}
                                onChange={(e) =>
                                  handleSubjectChange(sem.id, subIdx, 'name', e.target.value)
                                }
                                className="bg-muted/40 border-border h-9 text-xs"
                                disabled={isSaving}
                                maxLength={80}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop View: Clean Table Layout */}
                      <div className="hidden sm:block w-full overflow-x-auto">
                        <table className="min-w-full text-left text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground font-semibold">
                              <th className="pb-3 w-[160px] pr-4">Subject Code</th>
                              <th className="pb-3 pr-4">Subject Name</th>
                              <th className="pb-3 w-[120px] pr-4 text-center">Type</th>
                              <th className="pb-3 w-[100px] pr-4 text-center">Credits</th>
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
                                <td className="py-3 pr-4 text-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSubjectElectiveToggle(sem.id, subIdx)}
                                    disabled={isSaving}
                                    className={`w-full h-10 justify-center rounded-lg font-bold text-xs transition-all ${
                                      sub.isElective
                                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
                                        : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
                                    }`}
                                  >
                                    {sub.isElective ? 'Elective' : 'Core'}
                                  </Button>
                                </td>
                                <td className="py-3 pr-4">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        className="w-full justify-between bg-muted/30 border-border hover:bg-accent text-foreground font-semibold h-10"
                                        disabled={isSaving}
                                      >
                                        <span className="w-full text-center">{sub.credits}</span>
                                        <ChevronDown className="h-4 w-4 opacity-70 shrink-0" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-card border-border min-w-[80px]">
                                      {['1', '2', '3', '4', '5', '6', '8'].map((creditVal) => (
                                        <DropdownMenuItem
                                          key={creditVal}
                                          onSelect={() =>
                                            handleSubjectChange(sem.id, subIdx, 'credits', creditVal)
                                          }
                                          className="hover:bg-accent focus:bg-accent text-center justify-center font-semibold cursor-pointer py-1.5"
                                        >
                                          {creditVal}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
