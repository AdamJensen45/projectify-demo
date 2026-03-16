import type { TaskStatus } from "@/types"

const VALID: TaskStatus[] = ["todo", "in-progress", "completed"]

export function normalizeTaskStatus(value: string | undefined | null): TaskStatus {
  if (value == null || value === "") return "todo"
  const v = String(value).toLowerCase().replace(/_/g, "-").trim()
  const cleaned = v.replace(/[^a-z-]/g, "")
  if (
    v === "in-progress" ||
    v === "inprogress" ||
    cleaned === "in-progress" ||
    cleaned === "inprogress" ||
    cleaned.endsWith("n-progress") ||
    cleaned.includes("progress")
  ) {
    return "in-progress"
  }
  if (
    v === "completed" ||
    v === "complete" ||
    cleaned === "completed" ||
    cleaned === "complete" ||
    cleaned.includes("complete")
  ) {
    return "completed"
  }
  if (
    v === "todo" ||
    v === "to-do" ||
    cleaned === "todo" ||
    cleaned === "to-do" ||
    cleaned.includes("todo")
  ) {
    return "todo"
  }
  return VALID.includes(cleaned as TaskStatus) ? (cleaned as TaskStatus) : "todo"
}

export function withNormalizedStatus<T extends { status?: string | null }>(task: T): T & { status: TaskStatus } {
  return { ...task, status: normalizeTaskStatus(task.status) } as T & { status: TaskStatus }
}
