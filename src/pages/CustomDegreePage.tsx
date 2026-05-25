import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/button'

export default function CustomDegreePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground p-0 mt-0">
      <main className="flex-grow">
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          <div className="container mx-auto px-4 sm:px-6 py-6">
            {/* Header */}
            <div className="relative flex justify-center items-center mb-8">
              <button
                onClick={() => navigate('/addGrades')}
                className="absolute left-0 p-2 rounded-full border border-border bg-card hover:bg-accent transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-3xl font-bold text-foreground">
                Custom Degree Creator
              </h1>
            </div>

            <div className="max-w-2xl mx-auto text-center mt-12">
              <p className="text-muted-foreground text-lg mb-6">
                Define your dynamic custom degree curriculum here. (Work in Progress)
              </p>
              <Button onClick={() => navigate('/addGrades')}>
                Go Back
              </Button>
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
