import type { TaskPriority } from "@/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: {
    label: "Low",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  },
  medium: {
    label: "Medium",
    className: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  high: {
    label: "High",
    className: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  },
  urgent: {
    label: "Urgent",
    className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800",
  },
}

interface PriorityBadgeProps {
  priority: TaskPriority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}
