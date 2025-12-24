import { Button } from '../components/ui/button'
import { ChevronDown, ArrowLeft } from 'lucide-react'
import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  subjectData,
  type Subject,
  type SemesterSubjects,
} from '../data/subjects/index'
import { gradeOptions, gradePoints } from '../data/grading'
import { useNavigate } from 'react-router-dom'
import CountUp from 'react-countup'
import toast from 'react-hot-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '../hooks/useAuth'
import { useFirebaseData } from '../hooks/useFirebaseData'
import { saveSemesterData } from '../firebase/firestore'

const DEFAULT_FACULTY = 'Select Your Faculty'
const DEFAULT_DEGREE = 'Select Your Degree Program'
const DEFAULT_SEMESTER = 'Select Your Semester'

type GPAEntry = {
  semester: string
  gpa: number
  credits: number
  grades?: Record<string, string>
  faculty?: string
  degree?: string
}

function Grades() {
  const [gpa, setGPA] = useState<number>(0)
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { data: firebaseData } = useFirebaseData()
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingSemesterData, setEditingSemesterData] =
    useState<GPAEntry | null>(null)
  const facultyOptions = Object.keys(subjectData)
  const [facultySelected, setFacultySelected] = useState(DEFAULT_FACULTY)
  const [degreeSelected, setDegreeSelected] = useState(DEFAULT_DEGREE)
  const [semSelected, setSemSelected] = useState(DEFAULT_SEMESTER)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [electives, setElectives] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [electiveCreditsRequired, setElectiveCreditsRequired] = useState(0)
  const [selectedElectiveCredits, setSelectedElectiveCredits] = useState(0)

  const handleSave = async () => {
    if (semSelected === DEFAULT_SEMESTER) {
      alert('Please select a semester.')
      return
    }

    const totalCredits = [
      ...subjects,
      ...electives.filter((elective: Subject) => grades[elective.code]),
    ].reduce((sum: number, sub: Subject) => sum + sub.credits, 0)

    const newEntry = {
      semester: semSelected,
      gpa,
      credits: totalCredits,
      grades: grades, // Store the grades for future editing
      faculty: facultySelected,
      degree: degreeSelected,
    }

    setIsSaving(true)
    try {
      if (isAuthenticated && user) {
        // Save to Firebase
        await saveSemesterData(user.uid, newEntry)
        const successMessage = isEditing
          ? `${semSelected} grades updated successfully!`
          : 'Your grades successfully saved!'
        toast.success(successMessage)
      } else {
        // Save to localStorage
        const existingData = JSON.parse(
          localStorage.getItem('gpaData') || '[]'
        ) as GPAEntry[]
        const updatedData = [
          ...existingData.filter((entry) => entry.semester !== semSelected),
          newEntry,
        ]

        localStorage.setItem('gpaData', JSON.stringify(updatedData))
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

  useEffect(() => {
    const savedSelections = JSON.parse(
      localStorage.getItem('gpaSelections') || '{}'
    )
    const lockedFaculty = localStorage.getItem('lockedFaculty')
    const lockedDegree = localStorage.getItem('lockedDegree')

    // Check if we're in editing mode
    const editingData = localStorage.getItem('editingSemester')
    if (editingData) {
      try {
        const semesterData = JSON.parse(editingData) as GPAEntry
        setIsEditing(true)
        setEditingSemesterData(semesterData)

        // Set the semester selection
        setSemSelected(semesterData.semester)

        // Set faculty and degree from editing data
        if (semesterData.faculty) {
          setFacultySelected(semesterData.faculty)
        } else {
          // Fallback to locked values if available
          if (lockedFaculty) setFacultySelected(lockedFaculty)
          else if (savedSelections.faculty)
            setFacultySelected(savedSelections.faculty)
        }
        if (semesterData.degree) {
          setDegreeSelected(semesterData.degree)
        } else {
          // Fallback to locked values if available
          if (lockedDegree) setDegreeSelected(lockedDegree)
          else if (savedSelections.degree)
            setDegreeSelected(savedSelections.degree)
        }
      } catch (error) {
        // If parsing fails, clean up and continue normally
        localStorage.removeItem('editingSemester')
        console.error('Error parsing editing data:', error)
      }
    } else {
      // Not editing, use locked values or saved selections
      if (lockedFaculty) setFacultySelected(lockedFaculty)
      else if (savedSelections.faculty)
        setFacultySelected(savedSelections.faculty)

      if (lockedDegree) setDegreeSelected(lockedDegree)
      else if (savedSelections.degree) setDegreeSelected(savedSelections.degree)

      if (savedSelections.semester) setSemSelected(savedSelections.semester)
    }

    // For authenticated users, check Firebase data for first semester to lock faculty/degree
    if (isAuthenticated && firebaseData.length > 0) {
      const firstSemester = firebaseData[0]
      if (firstSemester.faculty && !isEditing) {
        setFacultySelected(firstSemester.faculty)
      }
      if (firstSemester.degree && !isEditing) {
        setDegreeSelected(firstSemester.degree)
      }
    }
  }, [isAuthenticated, firebaseData, isEditing])

  const savedSemesters = JSON.parse(
    localStorage.getItem('gpaData') || '[]'
  ) as {
    semester: string
    gpa: number
    subjects: number
  }[]

  // For authenticated users, combine localStorage and Firebase semesters
  const usedSemesters = useMemo(() => {
    const firebaseSemesters = isAuthenticated
      ? firebaseData.map((entry) => entry.semester)
      : []
    return [
      ...new Set([
        ...savedSemesters.map((entry) => entry.semester),
        ...firebaseSemesters,
      ]),
    ]
  }, [isAuthenticated, firebaseData, savedSemesters])

  useEffect(() => {
    if (usedSemesters.includes(semSelected) && !isEditing) {
      setSemSelected(DEFAULT_SEMESTER)
    }
  }, [semSelected, usedSemesters, isEditing])

  const degreeOptions =
    facultySelected !== DEFAULT_FACULTY
      ? Object.keys(subjectData[facultySelected] || {})
      : []

  const semesterOptions =
    facultySelected !== DEFAULT_FACULTY && degreeSelected !== DEFAULT_DEGREE
      ? Object.keys(
          (subjectData[facultySelected]?.[degreeSelected] as Record<
            string,
            SemesterSubjects
          >) || {}
        ).filter(
          (sem) =>
            !usedSemesters.includes(sem) || (isEditing && sem === semSelected)
        )
      : []

  useEffect(() => {
    if (facultySelected && degreeSelected && semSelected) {
      const semesterData =
        subjectData[facultySelected]?.[degreeSelected]?.[semSelected]
      if (semesterData) {
        setSubjects(semesterData.core || [])
        setElectives(semesterData.electives || [])
        setElectiveCreditsRequired(semesterData.electiveCreditsRequired || 0)

        // If not editing, clear grades
        if (!isEditing) {
          setGrades({})
        }
        // If editing and we have editing data with grades, load them
        else if (isEditing && editingSemesterData?.grades) {
          setGrades(editingSemesterData.grades)
        }
      }
    }
  }, [
    facultySelected,
    degreeSelected,
    semSelected,
    isEditing,
    editingSemesterData,
  ])

  // Separate useEffect to handle loading grades when editingSemesterData changes
  useEffect(() => {
    if (isEditing && editingSemesterData?.grades && subjects.length > 0) {
      setGrades(editingSemesterData.grades)
    }
  }, [isEditing, editingSemesterData, subjects])

  useEffect(() => {
    const newSelectedElectiveCredits = electives
      .filter((elective: Subject) => grades[elective.code])
      .reduce((sum: number, elective: Subject) => sum + elective.credits, 0)
    setSelectedElectiveCredits(newSelectedElectiveCredits)
  }, [grades, electives])

  const calculateGPA = useCallback(() => {
    let totalCredits = 0
    let totalPoints = 0

    const allSubjects = [
      ...subjects,
      ...electives.filter((elective: Subject) => grades[elective.code]),
    ]

    allSubjects.forEach((sub) => {
      const grade = grades[sub.code]
      const point = gradePoints[grade]

      if (point !== undefined) {
        totalCredits += sub.credits
        totalPoints += point * sub.credits
      }
    })

    return totalCredits === 0
      ? 0
      : Number((totalPoints / totalCredits).toFixed(3))
  }, [subjects, electives, grades])

  useEffect(() => {
    const newGPA = calculateGPA()
    setGPA(newGPA)
  }, [calculateGPA])

  const allCoreGradesSelected = subjects.every(
    (sub: Subject) => grades[sub.code]
  )
  const isElectiveCreditValid =
    selectedElectiveCredits === electiveCreditsRequired
  const hasExcessElectiveCredits =
    selectedElectiveCredits > electiveCreditsRequired

  const dropdownsSelected =
    facultySelected !== DEFAULT_FACULTY &&
    degreeSelected !== DEFAULT_DEGREE &&
    semSelected !== DEFAULT_SEMESTER

  const canSave =
    dropdownsSelected && allCoreGradesSelected && isElectiveCreditValid

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground p-0 mt-0">
      <main className="flex-grow">
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="relative flex justify-center items-center mb-8">
              {isEditing && (
                <button
                  onClick={() => {
                    localStorage.removeItem('editingSemester')
                    navigate('/')
                  }}
                  className="absolute left-0 p-2 rounded-full border border-border bg-card hover:bg-accent transition-colors duration-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-3xl font-bold text-foreground">
                {isEditing ? `Edit ${semSelected}` : 'GPA Cal'}
              </h1>
            </div>

            {/* Dropdowns */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center sm:items-start gap-4 mb-8">
              <div id="faculty" className="w-[18rem]">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="w-full justify-between bg-muted border-border hover:bg-accent text-muted-foreground"
                      disabled={
                        Boolean(localStorage.getItem('lockedFaculty')) ||
                        isEditing ||
                        (isAuthenticated && firebaseData.length > 0)
                      }
                    >
                      <span className="truncate">{facultySelected}</span>
                      <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[18rem] bg-popover border-border">
                    {facultyOptions.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onSelect={() => {
                          setFacultySelected(option)
                          setDegreeSelected('Select Your Degree Program')
                          setSemSelected('Select Your Semester')
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
                        facultySelected === 'Select Your Faculty' ||
                        isEditing ||
                        (isAuthenticated && firebaseData.length > 0)
                      }
                    >
                      <span className="truncate">{degreeSelected}</span>
                      <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[18rem] bg-popover border-border">
                    {degreeOptions.map((option) => (
                      <DropdownMenuItem
                        key={option}
                        onSelect={() => {
                          setDegreeSelected(option)
                          setSemSelected('Select Your Semester')
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
                        degreeSelected === 'Select Your Degree Program' ||
                        isEditing
                      }
                    >
                      <span className="truncate">{semSelected}</span>
                      <ChevronDown className="h-4 w-4 ml-2 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[18rem] bg-popover border-border">
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
