import { useCallback, useEffect, useState } from "react"
import { reportService } from "@/services"
import type { TaskProgressReport } from "@/types"

export function useMyReports(enabled = true) {
  const [reports, setReports] = useState<TaskProgressReport[]>([])

  const reload = useCallback(() => {
    return reportService.getMyReports().then(setReports).catch(() => setReports([]))
  }, [])

  useEffect(() => {
    if (!enabled) return
    void reload()
  }, [enabled, reload])

  return {
    reports,
    reload,
    setReports,
  }
}
