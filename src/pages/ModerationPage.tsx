import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldAlert,
  Check,
  X,
  ShieldCheck,
  Mail,
  School,
  BookOpen,
  ArrowLeft,
  Loader2,
  Calendar,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import {
  getCurriculaSuggestions,
  approveCurriculumSuggestion,
  rejectCurriculumSuggestion,
  approveCurriculumDeletion,
  rejectCurriculumDeletion,
  type CurriculumSuggestion
} from '../firebase/firestore'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../components/ui/dialog'
import { useTheme } from '../components/theme-provider'
import { Sun, Moon } from 'lucide-react'

export default function ModerationPage() {
  const { isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const [suggestions, setSuggestions] = useState<CurriculumSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'delete_pending'>('pending')
  
  // Selection & Modal States
  const [selectedSuggestion, setSelectedSuggestion] = useState<CurriculumSuggestion | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedSemester, setExpandedSemester] = useState<string | null>(null)

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast.error('Access Denied: You must be an Administrator.')
      navigate('/')
    }
  }, [isAdmin, authLoading, navigate])

  // Load suggestions
  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const data = await getCurriculaSuggestions()
      setSuggestions(data)
    } catch (err) {
      console.error('Failed to load curricula suggestions:', err)
      toast.error('Failed to fetch suggestions from moderation queue.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadSuggestions()
    }
  }, [isAdmin])

  // Handlers
  const handleApprove = async (suggestion: CurriculumSuggestion) => {
    setIsSubmitting(true)
    const isDeletionRequest = suggestion.status === 'delete_pending'
    const loadToast = toast.loading(isDeletionRequest ? 'Wiping curriculum out of database...' : `Approving ${suggestion.degreeName} into database...`)
    try {
      if (isDeletionRequest) {
        await approveCurriculumDeletion(suggestion)
        toast.success(`Curriculum "${suggestion.degreeName}" successfully deleted from catalog!`, { id: loadToast })
      } else {
        await approveCurriculumSuggestion(suggestion)
        toast.success(`${suggestion.degreeName} successfully merged and approved!`, { id: loadToast })
      }
      setIsPreviewOpen(false)
      setSelectedSuggestion(null)
      await loadSuggestions()
    } catch (err) {
      console.error('Action failed:', err)
      toast.error('Database write error. Check security rules.', { id: loadToast })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSuggestion) return
    if (!rejectionReason.trim()) {
      toast.error('Please enter a feedback reason.')
      return
    }

    setIsSubmitting(true)
    const isDeletionRequest = selectedSuggestion.status === 'delete_pending'
    const loadToast = toast.loading(isDeletionRequest ? 'Sending deletion rejection feedback...' : 'Sending moderation note...')
    try {
      if (isDeletionRequest) {
        await rejectCurriculumDeletion(selectedSuggestion.id, selectedSuggestion.suggestedBy, rejectionReason.trim())
        toast.success('Deletion request rejected. Feedback sent to developer.', { id: loadToast })
      } else {
        await rejectCurriculumSuggestion(selectedSuggestion.id, selectedSuggestion.suggestedBy, rejectionReason.trim())
        toast.success('Suggestion rejected. Feedback sent to developer.', { id: loadToast })
      }
      setIsRejectOpen(false)
      setSelectedSuggestion(null)
      setRejectionReason('')
      await loadSuggestions()
    } catch (err) {
      console.error('Rejection failed:', err)
      toast.error('Failed to submit moderation feedback.', { id: loadToast })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredSuggestions = suggestions.filter((s) => s.status === activeTab)

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-semibold">Verifying secure admin session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Navigation Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10 w-full px-4 sm:px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full border border-border bg-card hover:bg-accent text-foreground transition-all active:scale-95 shadow-sm"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">Admin Moderation Console</h1>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-full border border-border bg-card hover:bg-accent transition-colors duration-200 shadow-sm"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-blue-600" />
          )}
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Dashboard Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-card border border-border rounded-xl flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500">
                <ShieldAlert className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pending</h4>
                <p className="text-xl sm:text-2xl font-bold">{suggestions.filter(s => s.status === 'pending').length}</p>
              </div>
            </div>

            <div className="p-4 bg-card border border-border rounded-xl flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Approved</h4>
                <p className="text-xl sm:text-2xl font-bold">{suggestions.filter(s => s.status === 'approved').length}</p>
              </div>
            </div>

            <div className="p-4 bg-card border border-border rounded-xl flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg text-red-500">
                <X className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Rejected</h4>
                <p className="text-xl sm:text-2xl font-bold">{suggestions.filter(s => s.status === 'rejected').length}</p>
              </div>
            </div>

            <div className="p-4 bg-card border border-border rounded-xl flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 rounded-lg text-rose-500">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Deletion Req</h4>
                <p className="text-xl sm:text-2xl font-bold">{suggestions.filter(s => s.status === 'delete_pending').length}</p>
              </div>
            </div>
          </div>

          {/* Filtering Tabs */}
          <div className="flex border-b border-border bg-card/30 p-1 rounded-lg self-start gap-1 flex-wrap">
            {(['pending', 'approved', 'rejected', 'delete_pending'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-md uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent/40'
                }`}
              >
                {tab === 'delete_pending' ? 'Deletion Requests' : tab}
              </button>
            ))}
          </div>

          {/* List Section */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-card/10 border border-border/50 border-dashed rounded-xl">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground font-semibold">Loading suggestion queue...</p>
            </div>
          ) : filteredSuggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-card/20 border border-border border-dashed rounded-xl">
              <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
              <h3 className="font-semibold text-lg">No {activeTab} suggestions found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                There are currently no curriculum suggestions in the {activeTab} moderation status block.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredSuggestions.map((suggestion) => (
                  <motion.div
                    key={suggestion.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5 bg-card border border-border rounded-xl flex flex-col justify-between hover:border-primary/30 transition-all group"
                  >
                    <div>
                      {/* Badge / Meta */}
                      <div className="flex items-center justify-between mb-3 text-[11px] font-semibold text-primary">
                        <span className="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {suggestion.universityShort}
                        </span>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[140px]" title={suggestion.suggestedByEmail}>
                            {suggestion.suggestedByEmail}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold truncate group-hover:text-primary transition-colors">
                        {suggestion.degreeName}
                      </h3>
                      <p className="text-xs text-muted-foreground font-semibold mt-1 truncate">
                        {suggestion.facultyName}
                      </p>

                      <div className="mt-4 pt-3 border-t border-border flex flex-col gap-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <School className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{suggestion.universityName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{Object.keys(suggestion.semesters || {}).length} Semesters configured</span>
                        </div>
                      </div>

                      {/* Deletion Request Reason */}
                      {suggestion.status === 'delete_pending' && suggestion.deletionReason && (
                        <div className="mt-4 p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg text-xs text-rose-500">
                          <span className="font-bold block uppercase tracking-wider mb-1">Reason for Deletion Request:</span>
                          <p>{suggestion.deletionReason}</p>
                        </div>
                      )}

                      {/* Rejection Note */}
                      {suggestion.status === 'rejected' && suggestion.rejectionReason && (
                        <div className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-xs text-red-400">
                          <span className="font-bold block uppercase tracking-wider mb-1">Rejection Note:</span>
                          <p>{suggestion.rejectionReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-4 border-t border-border flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedSuggestion(suggestion)
                          setExpandedSemester(Object.keys(suggestion.semesters)[0] || null)
                          setIsPreviewOpen(true)
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-grow text-xs font-semibold"
                      >
                        Inspect Curricula
                      </Button>

                      {suggestion.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => {
                              setSelectedSuggestion(suggestion)
                              setIsRejectOpen(true)
                            }}
                            variant="destructive"
                            size="sm"
                            className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-500 hover:text-red-400 p-2"
                            title="Reject / Request Changes"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleApprove(suggestion)}
                            disabled={isSubmitting}
                            variant="default"
                            size="sm"
                            className="bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 text-green-500 p-2 h-9 w-9"
                            title="Approve Curriculum"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {suggestion.status === 'delete_pending' && (
                        <>
                          <Button
                            onClick={() => {
                              setSelectedSuggestion(suggestion)
                              setIsRejectOpen(true)
                            }}
                            variant="outline"
                            size="sm"
                            className="border-gray-500/30 hover:bg-gray-500/10 text-foreground p-2 h-9 w-9"
                            title="Reject Deletion / Keep Program"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleApprove(suggestion)}
                            disabled={isSubmitting}
                            variant="destructive"
                            size="sm"
                            className="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-500 p-2 h-9 w-9"
                            title="Approve Deletion"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* CURRICULA INSPECTION DIALOG */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl bg-card border-border max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
              <BookOpen className="h-5 w-5 text-primary" />
              Inspect Curriculum Structure
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Review and inspect subject list configurations, credits, and course types.
            </DialogDescription>
          </DialogHeader>

          {selectedSuggestion && (
            <div className="flex-grow overflow-y-auto pr-1 my-4 space-y-4">
              {/* Summary Metadata */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 border rounded-xl text-xs">
                <div>
                  <span className="text-muted-foreground block uppercase font-bold text-[10px] tracking-wider">Degree Program</span>
                  <span className="font-bold text-sm text-primary">{selectedSuggestion.degreeName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block uppercase font-bold text-[10px] tracking-wider">University</span>
                  <span className="font-bold text-sm text-primary">{selectedSuggestion.universityShort}</span>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground block uppercase font-bold text-[10px] tracking-wider">Faculty</span>
                  <span className="font-semibold">{selectedSuggestion.facultyName}</span>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground block uppercase font-bold text-[10px] tracking-wider">Creator Email</span>
                  <span className="font-semibold truncate block">{selectedSuggestion.suggestedByEmail}</span>
                </div>
              </div>

              {/* Semesters Cascade */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Semester Configuration</Label>
                {Object.entries(selectedSuggestion.semesters || {}).map(([semName, semData]) => {
                  const isExpanded = expandedSemester === semName
                  const totalCore = semData.core?.length || 0
                  const totalElective = semData.electives?.length || 0
                  const electiveCredits = semData.electiveCreditsRequired || 0

                  return (
                    <div key={semName} className="border border-border rounded-xl bg-card overflow-hidden">
                      {/* Header Toggle */}
                      <button
                        onClick={() => setExpandedSemester(isExpanded ? null : semName)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-muted/20 hover:bg-muted/40 transition-colors text-sm font-semibold"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{semName}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{totalCore} Core / {totalElective} Electives</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </button>

                      {/* Subjects Details */}
                      {isExpanded && (
                        <div className="p-4 border-t border-border bg-card space-y-3">
                          {/* Cores */}
                          <div>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1.5">Core Modules</span>
                            {semData.core && semData.core.length > 0 ? (
                              <div className="space-y-1.5">
                                {semData.core.map((subj, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-xs p-2 bg-muted/10 border rounded-lg">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-semibold text-foreground">{subj.name}</span>
                                      <span className="text-[10px] text-muted-foreground">{subj.code}</span>
                                    </div>
                                    <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-mono font-semibold">
                                      {subj.credits} Credit{subj.credits !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No core modules configured.</p>
                            )}
                          </div>

                          {/* Electives */}
                          <div className="pt-2">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider block">Elective Modules</span>
                              {electiveCredits > 0 && (
                                <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded font-semibold">
                                  Select {electiveCredits} credit{electiveCredits !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {semData.electives && semData.electives.length > 0 ? (
                              <div className="space-y-1.5">
                                {semData.electives.map((subj, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-xs p-2 bg-muted/10 border rounded-lg">
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-semibold text-foreground">{subj.name}</span>
                                      <span className="text-[10px] text-muted-foreground">{subj.code}</span>
                                    </div>
                                    <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded font-mono font-semibold">
                                      {subj.credits} Credit{subj.credits !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No elective modules configured.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border pt-4 flex gap-2">
            <Button
              onClick={() => setIsPreviewOpen(false)}
              variant="outline"
              size="sm"
              className="text-xs font-semibold"
            >
              Close Inspector
            </Button>
            {selectedSuggestion && selectedSuggestion.status === 'pending' && (
              <>
                <Button
                  onClick={() => {
                    setIsPreviewOpen(false)
                    setIsRejectOpen(true)
                  }}
                  variant="destructive"
                  size="sm"
                  className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-500 text-xs font-semibold"
                >
                  Reject & Provide Feedback
                </Button>
                <Button
                  onClick={() => handleApprove(selectedSuggestion)}
                  disabled={isSubmitting}
                  variant="default"
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold"
                >
                  {isSubmitting ? 'Approving...' : 'Approve & Publish'}
                </Button>
              </>
            )}

            {selectedSuggestion && selectedSuggestion.status === 'delete_pending' && (
              <>
                <Button
                  onClick={() => {
                    setIsPreviewOpen(false)
                    setIsRejectOpen(true)
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold border-gray-500/30 hover:bg-gray-500/10 text-foreground"
                >
                  Reject Deletion
                </Button>
                <Button
                  onClick={() => handleApprove(selectedSuggestion)}
                  disabled={isSubmitting}
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                >
                  {isSubmitting ? 'Deleting...' : 'Approve Deletion'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECTION REASON DIALOG */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <form onSubmit={handleRejectSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-red-500">
                <AlertCircle className="h-5 w-5" />
                {selectedSuggestion?.status === 'delete_pending' ? 'Reject Deletion Request' : 'Reject & Send Feedback'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {selectedSuggestion?.status === 'delete_pending'
                  ? 'Provide a reason explaining to the student why this public curriculum cannot be deleted.'
                  : 'Provide feedback to the student explaining what needs to be changed for approval.'}
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-2">
              <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Rejection Note
              </Label>
              <textarea
                id="reason"
                className="w-full min-h-[120px] p-3 text-xs bg-muted/30 border border-border rounded-xl focus:border-red-500/50 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-muted-foreground/60"
                placeholder="e.g. Please check the credits of 'Advanced Algorithms' in Semester 4. It should be 3 credits instead of 4."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                onClick={() => {
                  setIsRejectOpen(false)
                  setRejectionReason('')
                }}
                variant="outline"
                size="sm"
                className="text-xs font-semibold"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="destructive"
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold"
              >
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
