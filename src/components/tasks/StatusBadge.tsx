import type { TaskStatus } from "@/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { normalizeTaskStatus } from "@/lib/taskStatus"

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: {
    label: "To Do",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
}

interface StatusBadgeProps {
  /** Raw status from API or normalized; will be normalized for display. */
  status: TaskStatus | string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = normalizeTaskStatus(status)
  const config = statusConfig[normalized] ?? statusConfig.todo
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}
