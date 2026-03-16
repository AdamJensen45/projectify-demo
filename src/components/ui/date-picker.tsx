import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { DayPicker } from "react-day-picker"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const DATE_FORMAT = "yyyy-MM-dd"
const DISPLAY_INPUT_FORMAT = "dd/MM/yyyy"

function extractDateDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8)
}

function formatDateDigits(digits: string): string {
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function isValidPartialDateDigits(digits: string): boolean {
  if (digits.length >= 1) {
    const dayFirst = Number(digits[0])
    if (Number.isNaN(dayFirst) || dayFirst < 0 || dayFirst > 3) return false
  }
  if (digits.length >= 2) {
    const day = Number(digits.slice(0, 2))
    if (Number.isNaN(day) || day < 1 || day > 31) return false
  }
  if (digits.length >= 3) {
    const monthFirst = Number(digits[2])
    if (Number.isNaN(monthFirst) || monthFirst < 0 || monthFirst > 1) return false
  }
  if (digits.length >= 4) {
    const month = Number(digits.slice(2, 4))
    if (Number.isNaN(month) || month < 1 || month > 12) return false
  }
  return true
}

function parseValue(value: string): Date | undefined {
  if (!value || value.length < 10) return undefined
  const raw = value.trim()
  const formats = [DATE_FORMAT, DISPLAY_INPUT_FORMAT]
  for (const fmt of formats) {
    const d = parse(raw.slice(0, 10), fmt, new Date())
    if (isValid(d)) return d
  }
  return undefined
}

function toValue(date: Date): string {
  return format(date, DATE_FORMAT)
}

function toDisplayValue(value: string): string {
  const parsed = parseValue(value)
  return parsed ? format(parsed, DISPLAY_INPUT_FORMAT) : value
}

export interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  onValidationError?: (message: string | null) => void
  minErrorMessage?: string
  maxErrorMessage?: string
  invalidDateMessage?: string
  id?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  onValidationError,
  minErrorMessage = "Date cannot be before the allowed minimum.",
  maxErrorMessage = "Date cannot be after the allowed maximum.",
  invalidDateMessage = "Enter a valid date as dd/mm/yyyy.",
  id,
  placeholder = "dd/mm/yyyy",
  required,
  disabled,
  className,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [draftValue, setDraftValue] = React.useState(() => toDisplayValue(value))
  const selected = parseValue(draftValue)
  const minDate = min ? parseValue(min) : undefined
  const maxDate = max ? parseValue(max) : undefined

  React.useEffect(() => {
    setDraftValue(toDisplayValue(value))
  }, [value])

  const disabledMatcher = React.useMemo((): Array<{ before: Date } | { after: Date }> | undefined => {
    const parts: Array<{ before: Date } | { after: Date }> = []
    if (minDate) parts.push({ before: minDate })
    if (maxDate) parts.push({ after: maxDate })
    return parts.length > 0 ? parts : undefined
  }, [minDate, maxDate])

  const getBoundsError = React.useCallback((date: Date): string | null => {
    const value = new Date(date)
    value.setHours(0, 0, 0, 0)
    if (minDate) {
      const lower = new Date(minDate)
      lower.setHours(0, 0, 0, 0)
      if (value < lower) return minErrorMessage
    }
    if (maxDate) {
      const upper = new Date(maxDate)
      upper.setHours(0, 0, 0, 0)
      if (value > upper) return maxErrorMessage
    }
    return null
  }, [maxDate, maxErrorMessage, minDate, minErrorMessage])

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    const nextValue = toValue(date)
    setDraftValue(format(date, DISPLAY_INPUT_FORMAT))
    onChange(nextValue)
    onValidationError?.(null)
    setOpen(false)
  }

  const handleManualChange = (nextValue: string) => {
    const digits = extractDateDigits(nextValue)
    if (!isValidPartialDateDigits(digits)) return

    const formattedValue = formatDateDigits(digits)
    setDraftValue(formattedValue)

    if (digits.length === 0) {
      onChange("")
      onValidationError?.(null)
      return
    }

    const parsed = parseValue(formattedValue)
    if (parsed) {
      const boundsError = getBoundsError(parsed)
      if (boundsError) {
        onValidationError?.(boundsError)
        return
      }
      onChange(toValue(parsed))
      onValidationError?.(null)
      return
    }

    if (digits.length === 8) {
      onValidationError?.(invalidDateMessage)
    } else {
      onValidationError?.(null)
    }
  }

  const handleBlur = () => {
    if (!draftValue.trim()) {
      setDraftValue("")
      onChange("")
      onValidationError?.(null)
      return
    }

    const parsed = parseValue(draftValue)
    if (parsed) {
      const boundsError = getBoundsError(parsed)
      if (boundsError) {
        onValidationError?.(boundsError)
      } else {
        const normalized = toValue(parsed)
        const displayValue = format(parsed, DISPLAY_INPUT_FORMAT)
        if (normalized !== value || displayValue !== draftValue) {
          setDraftValue(displayValue)
          onChange(normalized)
        }
        onValidationError?.(null)
        return
      }
    } else if (extractDateDigits(draftValue).length === 8) {
      onValidationError?.(invalidDateMessage)
    }
    const fallbackValue = toDisplayValue(value)
    if (draftValue !== fallbackValue) {
      setDraftValue(fallbackValue)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className={cn("relative w-full", className)}>
          <Input
            id={id}
            type="text"
            inputMode="numeric"
            placeholder={placeholder}
            value={draftValue}
            onChange={(e) => handleManualChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-required={required}
            className="pr-10"
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={ariaLabel ?? "Open calendar"}
              aria-expanded={open}
              disabled={disabled}
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            >
              <CalendarIcon className="h-4 w-4 opacity-60" />
            </Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-auto min-w-0 p-0 bg-popover text-popover-foreground"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
      >
        <div className="p-2">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={disabledMatcher}
            defaultMonth={selected ?? minDate ?? new Date()}
            showOutsideDays
            navLayout="around"
            className="date-picker-calendar"
            classNames={{
              months: "flex flex-col",
              month: "relative space-y-2",
              month_caption: "flex h-7 items-center justify-center px-7 pt-0.5",
              caption_label: "text-sm font-medium",
              chevron: "fill-foreground dark:fill-white",
              button_previous: cn(
                buttonVariants({ variant: "outline" }),
                "absolute left-0 top-0 h-6 w-6 bg-transparent p-0 text-foreground dark:text-white"
              ),
              button_next: cn(
                buttonVariants({ variant: "outline" }),
                "absolute right-0 top-0 h-6 w-6 bg-transparent p-0 text-foreground dark:text-white"
              ),
              month_grid: "w-full border-collapse space-y-1",
              weekdays: "flex",
              weekday:
                "w-7 rounded-md text-[0.72rem] font-normal text-muted-foreground",
              week: "mt-1 flex w-full",
              day: "h-7 w-7 p-0 text-center text-sm",
              day_button: cn(
                buttonVariants({ variant: "ghost" }),
                "h-7 w-7 p-0 text-xs font-normal"
              ),
              selected: "bg-primary text-primary-foreground rounded-md",
              today: "bg-accent text-accent-foreground rounded-md",
              outside: "text-muted-foreground opacity-50",
              disabled: "text-muted-foreground opacity-50",
              hidden: "invisible",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
