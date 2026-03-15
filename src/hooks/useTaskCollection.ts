import { useCallback, useEffect, useState } from "react"
import { taskService } from "@/services"
import type { Task } from "@/types"
import { withNormalizedStatus } from "@/lib/taskStatus"

interface UseTaskCollectionOptions {
  view: "my-tasks" | "all"
  userId?: string
}

export function useTaskCollection({ view, userId }: UseTaskCollectionOptions) {
  const [taskList, setTaskList] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
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
    } finally {
      setLoading(false)
    }
  }, [view, userId])

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
