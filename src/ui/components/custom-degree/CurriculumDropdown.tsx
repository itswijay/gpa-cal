import React from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export interface CurriculumDropdownProps {
  id: string
  label: string
  triggerPlaceholder: string
  selectedDisplayValue: React.ReactNode
  options: { value: string; label: React.ReactNode }[]
  onSelectOption: (value: string) => void
  onSelectCustom: () => void
  customLabel: string
  disabled: boolean
}

export function CurriculumDropdown({
  id,
  label,
  triggerPlaceholder,
  selectedDisplayValue,
  options,
  onSelectOption,
  onSelectCustom,
  customLabel,
  disabled,
}: CurriculumDropdownProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="w-full justify-between bg-muted/50 border-border hover:bg-accent text-foreground font-semibold h-11"
            disabled={disabled}
          >
            <span className="truncate">
              {selectedDisplayValue || triggerPlaceholder}
            </span>
            <ChevronDown className="h-4 w-4 ml-2 opacity-70 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[calc(100vw-3rem)] sm:w-[48rem] max-w-[50rem] bg-card border-border max-h-[300px] overflow-y-auto">
          {options.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onSelect={() => onSelectOption(opt.value)}
              className="hover:bg-accent focus:bg-accent py-2 cursor-pointer"
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem
            onSelect={onSelectCustom}
            className="hover:bg-accent focus:bg-accent border-t border-border mt-1 py-2 text-primary font-semibold text-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            {customLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
