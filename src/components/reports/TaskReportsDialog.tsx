import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { reportService } from "@/services"
import type { Task, TaskProgressReport } from "@/types"

interface TaskReportsDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatReportDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatReportDate(iso.slice(0, 10))
}

export function TaskReportsDialog({
  task,
  open,
  onOpenChange,
}: TaskReportsDialogProps) {
  const [reports, setReports] = useState<TaskProgressReport[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !task?.id) {
      setReports([])
      return
    }
    setLoading(true)
    reportService
      .getByTask(task.id)
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [open, task?.id])

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Progress reports</DialogTitle>
          <DialogDescription>
            {task.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No progress reports yet for this task.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Use &quot;Log progress&quot; to add what you did.
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <Card key={report.id} className="overflow-hidden">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[10px] bg-secondary">
                          {report.user?.name?.slice(0, 2).toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">
                        {report.user?.name ?? "Unknown"}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {formatReportDate(report.reportDate)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {report.content}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(report.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
