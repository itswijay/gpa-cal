import { Button } from '../components/ui/button'
import { ChevronDown, ArrowLeft, GraduationCap } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { Subject } from '../../data/types'
import { gradeOptions } from '../../data/grading'
import { calculateSemesterGpa } from '../../domain/gpa/calculateSemesterGpa'
import { validateElectiveCredits } from '../../domain/curriculum/validateElectiveCredits'
import { useNavigate } from 'react-router-dom'
import CountUp from 'react-countup'
import toast from 'react-hot-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/components/ui/dropdown-menu'
import { useAuth } from '../hooks/useAuth'
import { useFirebaseData } from '../hooks/useFirebaseData'
import { useResolvedCurricula } from '../hooks/useResolvedCurricula'
import { saveSemesterGrades } from '../../use-cases/saveSemesterGrades'
import { saveSemesterGradesLocally } from '../../use-cases/saveSemesterGradesLocally'
import { CustomDegreeAuthDialog } from '../components/auth/CustomDegreeAuthDialog'
import { resolveCreatedAt } from './addGrades/resolveCreatedAt'
import {
  DEFAULT_UNIVERSITY,
  DEFAULT_FACULTY,
  DEFAULT_DEGREE,
  DEFAULT_SEMESTER,
  useSemesterFormState,
} from '../hooks/useSemesterFormState'
import { useAutoSaveDraft } from '../hooks/useAutoSaveDraft'

function Grades() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { data: firebaseData } = useFirebaseData()
  const [isSaving, setIsSaving] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)

  const handleCustomDegreeClick = () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true)
      return
    }

    // Selecting an existing university/faculty/degree on the custom degree page
    // auto-populates its current semesters/subjects, so this is safe even if the
    // user already has grades saved under a preloaded degree.
    navigate('/custom-degree')
  }
  const { resolvedCurricula, customDegree } = useResolvedCurricula(isAuthenticated, user)

  const {
    universitySelected,
    setUniversitySelected,
    facultySelected,
    setFacultySelected,
    degreeSelected,
    setDegreeSelected,
    semSelected,
    setSemSelected,
    isEditing,
    setIsEditing,
    editingSemesterData,
    setEditingSemesterData,
    subjects,
    electives,
    grades,
    setGrades,
    electiveCreditsRequired,
    universityOptions,
    facultyOptions,
    degreeOptions,
    semesterOptions,
  } = useSemesterFormState({
    resolvedCurricula,
    isAuthenticated,
    firebaseData,
  })


  const handleSave = async () => {
    if (semSelected === DEFAULT_SEMESTER) {
      alert('Please select a semester.')
      return
    }

    setIsSaving(true)
    try {
      // Resolve createdAt to maintain timestamp
      const createdAt = resolveCreatedAt(
        isEditing,
        editingSemesterData,
        semSelected,
        firebaseData
      )

      if (isAuthenticated && user) {
        // Save to Firebase
        await saveSemesterGrades({
          userId: user.uid,
          semester: semSelected,
          subjects,
          electives,
          grades,
          electiveCreditsRequired,
          university: universitySelected,
          faculty: facultySelected,
          degree: degreeSelected,
          createdAt,
        })
        const successMessage = isEditing
          ? `${semSelected} grades updated successfully!`
          : 'Your grades successfully saved!'
        toast.success(successMessage)
      } else {
        // Save to localStorage
        await saveSemesterGradesLocally({
          semester: semSelected,
          subjects,
          electives,
          grades,
          electiveCreditsRequired,
          university: universitySelected,
          faculty: facultySelected,
          degree: degreeSelected,
          createdAt,
        })
        localStorage.setItem('lockedUniversity', universitySelected)
        localStorage.setItem('lockedFaculty', facultySelected)
        localStorage.setItem('lockedDegree', degreeSelected)

        const successMessage = isEditing
          ? `${semSelected} grades updated successfully!`
          : 'Your grades successfully saved!'
        localStorage.setItem('showToast', successMessage)
      }

      // Clean up editing data
      localStorage.removeItem('editingSemester')
      navigate('/')
    } catch (error) {
      console.error('Error saving grades:', error)
      toast.error('Failed to save grades. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedElectiveCredits = useMemo(() => {
    return electives
      .filter((elective: Subject) => grades[elective.code])
      .reduce((sum: number, elective: Subject) => sum + elective.credits, 0)
  }, [grades, electives])

  const gpa = useMemo(() => {
    return calculateSemesterGpa(subjects, electives, grades)
  }, [subjects, electives, grades])

  const {
    allCoreGradesSelected,
    isElectiveCreditValid,
    hasExcessElectiveCredits,
  } = validateElectiveCredits(
    subjects,
    grades,
    selectedElectiveCredits,
    electiveCreditsRequired
  )

  const dropdownsSelected =
    universitySelected !== DEFAULT_UNIVERSITY &&
    facultySelected !== DEFAULT_FACULTY &&
    degreeSelected !== DEFAULT_DEGREE &&
    semSelected !== DEFAULT_SEMESTER

  const canSave =
    dropdownsSelected && allCoreGradesSelected && isElectiveCreditValid

  // Auto-save drafts for authenticated users when grades change
  useAutoSaveDraft({
    grades,
    isAuthenticated,
    user,
    universitySelected,
    facultySelected,
    degreeSelected,
    semSelected,
    subjects,
    electives,
    electiveCreditsRequired,
    allCoreGradesSelected,
    isElectiveCreditValid,
    dropdownsSelected,
    isEditing,
    editingSemesterData,
    firebaseData,
    gpa,
    setEditingSemesterData,
    setIsEditing,
  })

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground p-0 mt-0">
      <main className="flex-grow">
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="relative flex justify-center items-center mb-8 w-full">
              <button
                onClick={() => {
                  localStorage.removeItem('editingSemester')
                  navigate('/')
                }}
                className="absolute left-0 p-2 rounded-full border border-border bg-card hover:bg-accent transition-colors duration-200"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {isEditing ? `Edit ${semSelected}` : 'GPA Cal'}
              </h1>

              <Button
                variant="outline"
                className="absolute right-0 border-primary/40 hover:border-primary hover:bg-primary/5 text-primary bg-card transition-all font-semibold rounded-lg shadow-sm h-8 w-8 sm:h-9 sm:w-auto p-0 sm:px-4 sm:py-2 gap-2 text-xs sm:text-sm flex items-center justify-center animate-pulse-subtle"
                onClick={handleCustomDegreeClick}
                title={customDegree ? "Manage Custom Degree" : "Create Custom Degree"}
              >
                <div className="relative">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  {customDegree?.isSuggested && (
                    <span 
                      className={`absolute -top-1.5 -right-1.5 h-2 w-2 rounded-full border border-card ${
                        customDegree.suggestionStatus === 'approved'
                          ? 'bg-green-500'
                          : customDegree.suggestionStatus === 'rejected'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`}
                      title={
                        customDegree.suggestionStatus === 'approved'
                          ? 'Suggestion Approved'
                          : customDegree.suggestionStatus === 'rejected'
                          ? 'Changes Requested'
                          : 'Suggestion Under Review'
                      }
                    />
                  )}
                </div>
                <span className="hidden sm:inline">
                  {customDegree ? 'Manage Custom Degree' : 'Create Custom Degree'}
                </span>
              </Button>
            </div>

            {/* Dropdowns */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center sm:items-start gap-4 mb-8">
              <div id="university" className="w-[18rem]">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="w-full justify-between bg-muted border-border hover:bg-accent text-muted-foreground"
                      disabled={
                        Boolean(localStorage.getItem('lockedUniversity')) ||
                        isEditing ||
                        (isAuthenticated && firebaseData.length > 0)
                      }
                    >
                      <span className="truncate">
                        {universitySelected === DEFAULT_UNIVERSITY
                          ? DEFAULT_UNIVERSITY
                          : resolvedCurricula[universitySelected]?.shortName || universitySelected}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[18rem] bg-popover border-border max-h-[300px] overflow-y-auto">
                    {universityOptions.map((uni) => (
                      <DropdownMenuItem
                        key={uni.shortName}
                        onSelect={() => {
                          setUniversitySelected(uni.shortName)
                          setFacultySelected(DEFAULT_FACULTY)
                          setDegreeSelected(DEFAULT_DEGREE)
                          setSemSelected(DEFAULT_SEMESTER)
                        }}
                        className="hover:bg-accent focus:bg-accent"
                      >
                        <div className="flex flex-col items-start gap-0.5 w-full">
                          <span className="font-semibold text-xs text-primary">{uni.shortName}</span>
                          <span className="text-[11px] text-muted-foreground truncate max-w-[16rem]">
                            {uni.name}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div id="faculty" className="w-[18rem]">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="w-full justify-between bg-muted border-border hover:bg-accent text-muted-foreground"
                      disabled={
                        universitySelected === DEFAULT_UNIVERSITY ||
                        Boolean(localStorage.getItem('lockedFaculty')) ||
                        isEditing ||
                        (isAuthenticated && firebaseData.length > 0)
                      }
                    >
                      <span className="truncate">{facultySelected}</span>
                      <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[18rem] bg-popover border-border max-h-[300px] overflow-y-auto">
                    {facultyOptions.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onSelect={() => {
                          setFacultySelected(option)
                          setDegreeSelected(DEFAULT_DEGREE)
                          setSemSelected(DEFAULT_SEMESTER)
                        }}
                        className="hover:bg-accent focus:bg-accent"
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div id="degree" className="w-[18rem]">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="w-full justify-between bg-muted border-border hover:bg-accent text-muted-foreground"
                      disabled={
                        facultySelected === DEFAULT_FACULTY ||
                        Boolean(localStorage.getItem('lockedDegree')) ||
                        isEditing ||
                        (isAuthenticated && firebaseData.length > 0)
                      }
                    >
                      <span className="truncate">{degreeSelected}</span>
                      <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[18rem] bg-popover border-border max-h-[300px] overflow-y-auto">
                    {degreeOptions.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onSelect={() => {
                          setDegreeSelected(option)
                          setSemSelected(DEFAULT_SEMESTER)
                        }}
                        className="hover:bg-accent focus:bg-accent"
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div id="sem" className="w-[18rem]">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="w-full justify-between bg-muted border-border hover:bg-accent text-muted-foreground"
                      disabled={
                        degreeSelected === DEFAULT_DEGREE ||
                        isEditing
                      }
                    >
                      <span className="truncate">{semSelected}</span>
                      <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[18rem] bg-popover border-border max-h-[300px] overflow-y-auto">
                    {semesterOptions.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onSelect={() => {
                          setSemSelected(option)
                        }}
                        className="hover:bg-accent focus:bg-accent"
                      >
                        {option}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>


            {/* Core Subjects Table */}
            {subjects.length > 0 && (
              <div className="mt-10 max-w-4xl mx-auto">
                <h2 className="text-xl md:text-2xl font-semibold mb-6 text-foreground text-center">
                  Core Subjects
                </h2>

                {/* Show message if editing but no grades available */}
                {isEditing &&
                  (!editingSemesterData?.grades ||
                    Object.keys(editingSemesterData.grades).length === 0) && (
                    <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-md">
                      <strong>Note:</strong> This semester was saved before the
                      edit feature was available. You can still edit by
                      selecting grades again, and they will be saved for future
                      edits.
                    </div>
                  )}

                <div className="w-full overflow-x-auto rounded-lg border border-border shadow-sm">
                  <table className="min-w-full text-left bg-card text-sm sm:text-base">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="text-sm sm:text-base font-semibold text-muted-foreground p-3 min-w-[100px]">
                          Code
                        </th>
                        <th className="p-3 min-w-[160px] text-sm sm:text-base font-semibold text-muted-foreground hidden sm:table-cell">
                          Name
                        </th>
                        <th className="p-3 min-w-[60px] text-sm sm:text-base font-semibold text-muted-foreground text-center">
                          Credits
                        </th>
                        <th className="p-3 min-w-[120px] text-sm text-center sm:text-base font-semibold text-muted-foreground">
                          Your Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((sub: Subject, index: number) => (
                        <tr
                          key={sub.code}
                          className={`border-b border-border hover:bg-accent/50 transition-colors ${
                            index % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                          }`}
                        >
                          <td className="p-4 sm:text-base font-mono text-sm">
                            {sub.code}
                          </td>
                          <td className="p-4 text-sm sm:text-base hidden sm:table-cell">
                            {sub.name}
                          </td>
                          <td className="p-4 text-sm font-semibold sm:text-base text-center">
                            {sub.credits}
                          </td>
                          <td className="p-4 text-center">
                            {/* Grade dropdown component */}
                            <GradeDropdown
                              selectedGrade={grades[sub.code]}
                              onSelect={(grade) =>
                                setGrades((prev: Record<string, string>) => ({
                                  ...prev,
                                  [sub.code]: grade,
                                }))
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Elective Subjects Table */}
            {electives.length > 0 && (
              <div className="mt-10 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                    Elective Subjects
                  </h2>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Required Credits: {selectedElectiveCredits}/
                    {electiveCreditsRequired}
                  </div>
                </div>
                {hasExcessElectiveCredits && (
                  <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
                    Warning: Selected elective credits (
                    {selectedElectiveCredits}) exceed the required amount (
                    {electiveCreditsRequired})
                  </div>
                )}
                {!isElectiveCreditValid &&
                  !hasExcessElectiveCredits &&
                  selectedElectiveCredits > 0 && (
                    <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-md">
                      Note: You need to select more elective subjects to meet
                      the credit requirement
                    </div>
                  )}
                <div className="w-full overflow-x-auto rounded-lg border border-border shadow-sm">
                  <table className="min-w-full text-left bg-card text-sm sm:text-base">
                    <thead>
                      <tr className="bg-muted border-b border-border">
                        <th className="text-sm sm:text-base font-semibold text-muted-foreground p-3 min-w-[100px]">
                          Code
                        </th>
                        <th className="p-3 min-w-[160px] text-sm sm:text-base font-semibold text-muted-foreground hidden sm:table-cell">
                          Name
                        </th>
                        <th className="p-3 min-w-[60px] text-sm sm:text-base font-semibold text-muted-foreground text-center">
                          Credits
                        </th>
                        <th className="p-3 min-w-[120px] text-sm text-center sm:text-base font-semibold text-muted-foreground">
                          Your Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {electives.map((sub: Subject, index: number) => (
                        <tr
                          key={sub.code}
                          className={`border-b border-border hover:bg-accent/50 transition-colors ${
                            index % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                          }`}
                        >
                          <td className="p-4 sm:text-base font-mono text-sm">
                            {sub.code}
                          </td>
                          <td className="p-4 text-sm sm:text-base hidden sm:table-cell">
                            {sub.name}
                          </td>
                          <td className="p-4 text-sm font-semibold sm:text-base text-center">
                            {sub.credits}
                          </td>
                          <td className="p-4 text-center">
                            {/* Grade dropdown component */}
                            <GradeDropdown
                              selectedGrade={grades[sub.code]}
                              onSelect={(grade) =>
                                setGrades((prev: Record<string, string>) => ({
                                  ...prev,
                                  [sub.code]: grade,
                                }))
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/*GPA*/}
            {subjects.length > 0 && (
              <div className="mt-6 text-center">
                {allCoreGradesSelected && isElectiveCreditValid ? (
                  <p className="text-lg sm:text-xl font-semibold text-green-600 dark:text-green-400">
                    GPA: <CountUp end={gpa} decimals={3} duration={1.5} />
                  </p>
                ) : (
                  <p className="text-lg text-muted-foreground">
                    {!allCoreGradesSelected
                      ? 'Please select all core subject grades'
                      : 'Please select the required elective credits'}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button
                disabled={!canSave || isSaving}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSave}
              >
                {isSaving ? (
                  <>
                    Saving...
                  </>
                ) : isEditing ? (
                  'Update Semester'
                ) : (
                  'Save Semester'
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full text-center text-xs text-muted-foreground bg-background py-2 border-t border-border z-50 opacity-40">
        Developed by Toran
      </footer>

      <CustomDegreeAuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </div>
  )
}

// Grade Dropdown Component
const GradeDropdown = ({
  selectedGrade,
  onSelect,
}: {
  selectedGrade?: string
  onSelect: (grade: string) => void
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-[105px] justify-between bg-muted border-border hover:bg-accent text-gray-900 dark:text-white">
          <span className="truncate">{selectedGrade || 'Grade'}</span>
          <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[80px] bg-popover border-border">
        {selectedGrade && (
          <>
            <DropdownMenuItem
              onSelect={() => onSelect('')}
              className="hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 focus:bg-red-100 dark:focus:bg-red-900/20"
            >
              Remove
            </DropdownMenuItem>
            <DropdownMenuItem className="opacity-50 cursor-default" disabled>
              ─────
            </DropdownMenuItem>
          </>
        )}
        {gradeOptions.map((grade) => (
          <DropdownMenuItem
            key={grade}
            onSelect={() => onSelect(grade)}
            className="hover:bg-accent focus:bg-accent"
          >
            {grade}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default Grades
