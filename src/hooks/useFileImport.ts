import { useRef } from 'react'
import { validateImportData } from '../firebase/firestore'
import type { GPAEntry, ImportValidation } from '../firebase/firestore'

interface FileImportResult {
  success: boolean
  validation: ImportValidation
}

/**
 * Custom hook for handling JSON file imports
 */
export function useFileImport() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Trigger file input dialog
   */
  const triggerFileDialog = () => {
    fileInputRef.current?.click()
  }

  /**
   * Handle file selection and parsing
   */
  const handleFileImport = async (file: File): Promise<FileImportResult> => {
    try {
      // Check file type
      if (!file.name.endsWith('.json')) {
        return {
          success: false,
          validation: {
            isValid: false,
            errors: ['Please select a valid JSON file'],
          },
        }
      }

      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return {
          success: false,
          validation: {
            isValid: false,
            errors: ['File size exceeds 5MB limit'],
          },
        }
      }

      // Read file
      const fileContent = await readFile(file)

      // Parse JSON
      let parsedData: unknown
      try {
        parsedData = JSON.parse(fileContent)
      } catch (error) {
        return {
          success: false,
          validation: {
            isValid: false,
            errors: [
              'Invalid JSON format. Please check the file and try again.',
            ],
          },
        }
      }

      // Validate data structure
      const validation = validateImportData(parsedData)

      return {
        success: validation.isValid,
        validation,
      }
    } catch (error) {
      return {
        success: false,
        validation: {
          isValid: false,
          errors: [
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred while importing the file',
          ],
        },
      }
    }
  }

  /**
   * Helper function to read file content
   */
  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const content = e.target?.result
        if (typeof content === 'string') {
          resolve(content)
        } else {
          reject(new Error('Failed to read file'))
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsText(file)
    })
  }

  /**
   * Handle file input change event
   */
  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
    onImport: (result: FileImportResult) => void
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      const result = await handleFileImport(file)
      onImport(result)

      // Reset input so same file can be selected again
      event.target.value = ''
    }
  }

  return {
    fileInputRef,
    triggerFileDialog,
    handleFileImport,
    handleFileInputChange,
  }
}
