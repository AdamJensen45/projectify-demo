import { useCallback, useEffect, useState } from "react"
import { taskService } from "@/services"
import type { Task } from "@/types"
import { withNormalizedStatus } from "@/lib/taskStatus"

interface UseTaskCollectionOptions {
  view: "my-tasks" | "all"
  userId?: string
  enabled?: boolean
}

export function useTaskCollection({
  view,
  userId,
  enabled = true,
}: UseTaskCollectionOptions) {
  const [taskList, setTaskList] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      if (view === "all") {
        const tasks = await taskService.getAll()
        setTaskList(tasks.map(withNormalizedStatus))
        return
      }

      if (userId) {
        const tasks = await taskService.getByAssignee(userId)
        setTaskList(tasks.map(withNormalizedStatus))
        return
      }

      setTaskList([])
    } catch {
      setTaskList([])
    } finally {
      setLoading(false)
    }
  }, [enabled, view, userId])

  useEffect(() => {
    void reload()
  }, [reload])

  return {
    taskList,
    setTaskList,
    loading,
    reload,
  }
}
