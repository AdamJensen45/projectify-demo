export type DashboardTimeRange = "8h" | "24h" | "1w" | "2w" | "all"

export const DASHBOARD_TIME_RANGE_OPTIONS: {
  value: DashboardTimeRange
  label: string
}[] = [
  { value: "8h", label: "Last 8 hours" },
  { value: "24h", label: "Last 24 hours" },
  { value: "1w", label: "Last 1 week" },
  { value: "2w", label: "Last 2 weeks" },
  { value: "all", label: "All time" },
]

export function isTaskInRange(
  dueDate: string | undefined,
  range: DashboardTimeRange
): boolean {
  if (!dueDate || range === "all") return true
  const date = new Date(dueDate.slice(0, 10))
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const ms = today.getTime() - date.getTime()
  const days = ms / (24 * 60 * 60 * 1000)
  if (range === "8h" || range === "24h") return days >= 0 && days <= 1
  if (range === "1w") return days >= 0 && days <= 7
  if (range === "2w") return days >= 0 && days <= 14
  return true
}

export function isTimestampInRange(
  timestamp: string | undefined,
  range: DashboardTimeRange
): boolean {
  if (!timestamp || range === "all") return true
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return false
  const diffMs = Date.now() - date.getTime()
  const hours = diffMs / (60 * 60 * 1000)
  const days = diffMs / (24 * 60 * 60 * 1000)
  if (range === "8h") return hours >= 0 && hours <= 8
  if (range === "24h") return hours >= 0 && hours <= 24
  if (range === "1w") return days >= 0 && days <= 7
  if (range === "2w") return days >= 0 && days <= 14
  return true
}
