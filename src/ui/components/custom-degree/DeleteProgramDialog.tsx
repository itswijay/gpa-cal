import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'

export interface DeleteProgramDialogProps {
  isOpen: boolean
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteProgramDialog({
  isOpen,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteProgramDialogProps) {
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
            <div className="flex items-center gap-3 text-red-500">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold">Delete Custom Program?</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to completely delete your custom degree program template from your account? This action is permanent and will not affect the public database suggestion if you submitted one.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isDeleting}
                className="font-semibold text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Program'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
