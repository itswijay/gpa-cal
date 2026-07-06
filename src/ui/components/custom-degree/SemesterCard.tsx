import { motion } from 'framer-motion'
import { ChevronDown, BookOpen, Trash2, Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import type { DynamicSemester, DynamicSubject } from '../../../domain/curriculum/customDegreeForm'

export interface SemesterCardProps {
  sem: DynamicSemester
  isSaving: boolean
  onRemoveSemester: (semId: string) => void
  onElectiveCreditsChange: (semId: string, value: string) => void
  onAddSubject: (semId: string) => void
  onRemoveSubject: (semId: string, subIdx: number) => void
  onSubjectChange: (semId: string, subIdx: number, field: keyof DynamicSubject, value: string) => void
  onSubjectElectiveToggle: (semId: string, subIdx: number) => void
}

export function SemesterCard({
  sem,
  isSaving,
  onRemoveSemester,
  onElectiveCreditsChange,
  onAddSubject,
  onRemoveSubject,
  onSubjectChange,
  onSubjectElectiveToggle,
}: SemesterCardProps) {
  return (
    <motion.div
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
                    onSelect={() => onElectiveCreditsChange(sem.id, val)}
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
          onClick={() => onRemoveSemester(sem.id)}
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
                  onClick={() => onRemoveSubject(sem.id, subIdx)}
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
                      onSubjectChange(sem.id, subIdx, 'code', e.target.value)
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
                    onClick={() => onSubjectElectiveToggle(sem.id, subIdx)}
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
                            onSubjectChange(sem.id, subIdx, 'credits', creditVal)
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
                    onSubjectChange(sem.id, subIdx, 'name', e.target.value)
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
                        onSubjectChange(sem.id, subIdx, 'code', e.target.value)
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
                        onSubjectChange(sem.id, subIdx, 'name', e.target.value)
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
                      onClick={() => onSubjectElectiveToggle(sem.id, subIdx)}
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
                              onSubjectChange(sem.id, subIdx, 'credits', creditVal)
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
                      onClick={() => onRemoveSubject(sem.id, subIdx)}
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
          onClick={() => onAddSubject(sem.id)}
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
  )
}
