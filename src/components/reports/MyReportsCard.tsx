import { FileText, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Task, TaskProgressReport } from "@/types"

interface MyReportsCardProps {
  reports: TaskProgressReport[]
  tasks: Task[]
  onLogProgress: () => void
  onSelectTask: (task: Task) => void
  emptyDescription?: string
  emptyHint?: string
}

export function MyReportsCard({
  reports,
  tasks,
  onLogProgress,
  onSelectTask,
  emptyDescription = "No progress reports yet.",
  emptyHint,
}: MyReportsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            My Progress Reports
          </CardTitle>
          <Button size="sm" onClick={onLogProgress} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Log progress
          </Button>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          What you did on your tasks. Click a report to view all reports for that task.
        </p>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center">
            <p className="text-sm text-muted-foreground">{emptyDescription}</p>
            {emptyHint ? (
              <p className="mt-1 text-xs text-muted-foreground">{emptyHint}</p>
            ) : null}
            <Button variant="outline" size="sm" className="mt-3" onClick={onLogProgress}>
              Log progress
            </Button>
          </div>
        ) : (
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {reports.slice(0, 15).map((report) => {
              const taskForReport = tasks.find((task) => task.id === report.taskId)

              return (
                <Card
                  key={report.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => taskForReport && onSelectTask(taskForReport)}
                >
                  <CardContent className="p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {taskForReport?.name ?? "Task"}
                      </span>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {new Date(report.reportDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {report.content}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Click to view all reports for this task
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
