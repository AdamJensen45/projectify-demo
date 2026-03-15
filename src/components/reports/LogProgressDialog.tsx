import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { reportService, taskService } from "@/services"
import { useAuth } from "@/context/AuthContext"
import type { Task } from "@/types"

interface LogProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTaskId?: string
  taskOptions?: Task[]
  onSuccess?: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

export function LogProgressDialog({
  open,
  onOpenChange,
  defaultTaskId = "",
  taskOptions = [],
  onSuccess,
}: LogProgressDialogProps) {
  const { user, isAdmin } = useAuth()
  const [taskId, setTaskId] = useState(defaultTaskId)
  const [content, setContent] = useState("")
  const [reportDate, setReportDate] = useState(today())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])

  const options = taskOptions.length > 0 ? taskOptions : tasks

  useEffect(() => {
    if (!open) return
    setReportDate(today())
    setContent("")
    setError("")
    setTaskId(defaultTaskId || (options[0]?.id ?? ""))
  }, [open, defaultTaskId])

  useEffect(() => {
    if (open && !taskId && options.length > 0) setTaskId(options[0].id)
  }, [open, taskId, options])

  useEffect(() => {
    if (!open || taskOptions.length > 0) return
    if (isAdmin) {
      taskService.getAll().then(setTasks).catch(() => setTasks([]))
    } else if (user?.id) {
      taskService.getByAssignee(user.id).then(setTasks).catch(() => setTasks([]))
    }
  }, [open, user?.id, isAdmin, taskOptions.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const trimmed = content.trim()
    if (!trimmed) {
      setError("Describe what you did today.")
      return
    }
    if (!taskId) {
      setError("Select a task.")
      return
    }
    setLoading(true)
    try {
      await reportService.create(taskId, { content: trimmed, reportDate })
      toast.success("Progress reported", {
        description: "Your update has been saved.",
      })
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save report")
      toast.error("Failed to save report")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setError("") }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log progress</DialogTitle>
          <DialogDescription>
            Record what you did on a task for this day. This helps track daily progress.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label>Task</Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger>
                <SelectValue placeholder="Select task" />
              </SelectTrigger>
              <SelectContent>
                {options.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-date">Date</Label>
            <Input
              id="report-date"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-content">What did you do?</Label>
            <Textarea
              id="report-content"
              placeholder="e.g. Implemented login API, fixed validation bug..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={2000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">{content.length}/2000</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !content.trim() || !taskId}>
              {loading ? "Saving..." : "Save report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
