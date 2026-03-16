export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

interface DateBoundsOptions {
  value: string
  min?: string
  max?: string
  minMessage?: string
  maxMessage?: string
}

export function validateDateBounds({
  value,
  min,
  max,
  minMessage = "Date cannot be before the allowed minimum.",
  maxMessage = "Date cannot be after the allowed maximum.",
}: DateBoundsOptions): string | null {
  if (!value) return null
  if (min && value < min) return minMessage
  if (max && value > max) return maxMessage
  return null
}
