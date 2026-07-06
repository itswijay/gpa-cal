import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'

export interface SuggestDeletionDialogProps {
  isOpen: boolean
  isDeleting: boolean
  deletionReasonInput: string
  onDeletionReasonChange: (value: string) => void
  onCancel: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function SuggestDeletionDialog({
  isOpen,
  isDeleting,
  deletionReasonInput,
  onDeletionReasonChange,
  onCancel,
  onSubmit,
}: SuggestDeletionDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-xl shadow-2xl p-6 max-w-md w-full space-y-4"
          >
            <form onSubmit={onSubmit}>
              <div className="flex items-center gap-3 text-red-500">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <h3 className="text-lg font-bold">Request Public Deletion</h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
                This custom program has been approved and is public. To request its removal from the public database catalog, please enter a valid deletion reason:
              </p>
              <div className="mt-3">
                <textarea
                  className="w-full min-h-[100px] p-3 text-xs bg-muted/30 border border-border rounded-xl focus:border-red-500/50 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder:text-muted-foreground/60"
                  placeholder="e.g. This syllabus is obsolete. A new academic curriculum has replaced it."
                  value={deletionReasonInput}
                  onChange={(e) => onDeletionReasonChange(e.target.value)}
                  required
                  disabled={isDeleting}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isDeleting}
                  className="font-semibold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
                >
                  {isDeleting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
