import { useMemo } from "react"
import type { Task, TaskStatus } from "@/types"
import { normalizeTaskStatus } from "@/lib/taskStatus"

export function useFilteredTasks(tasks: Task[], statusFilter: TaskStatus | "all") {
  return useMemo(() => {
    if (statusFilter === "all") return tasks
    return tasks.filter((task) => normalizeTaskStatus(task.status) === statusFilter)
  }, [tasks, statusFilter])
}
