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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"
import { taskService, userService } from "@/services"
import type { Task, TaskStatus, TaskPriority, User } from "@/types"
import { normalizeTaskStatus } from "@/lib/taskStatus"

interface EditTaskDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (task: Task) => void
}

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onSave,
}: EditTaskDialogProps) {
  const [name, setName] = useState("")
  const [assigneeId, setAssigneeId] = useState("")
  const [status, setStatus] = useState<TaskStatus>("todo")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [dueDate, setDueDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    if (!open) return
    userService.getAll().then(setUsers).catch(() => {})
  }, [open])

  useEffect(() => {
    if (task) {
      setName(task.name)
      setAssigneeId(task.assignee?.id ?? "")
      setStatus(normalizeTaskStatus(task.status))
      setPriority(task.priority)
      setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "")
    }
  }, [task, open])

  const today = new Date().toISOString().slice(0, 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task) return
    setError("")
    const trimmedName = name.trim()
    if (!trimmedName || !dueDate) {
      setError("Task name and due date are required.")
      return
    }
    if (dueDate < today) {
      setError("Due date cannot be in the past.")
      return
    }

    const selectedUser = users.find((u) => u.id === assigneeId)
    if (!selectedUser) {
      setError("Please select an assignee.")
      return
    }

    setLoading(true)
    try {
      const updated = await taskService.update(task.id, {
        name: trimmedName,
        assignee: {
          id: selectedUser.id,
          name: selectedUser.name,
          avatar: selectedUser.avatar,
          role: selectedUser.role,
        },
        status,
        priority,
        dueDate,
      })
      onSave(updated)
      toast.success("Task updated", {
        description: `"${updated.name}" has been saved.`,
      })
      onOpenChange(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update task"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setError("") }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update task details and assignee.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-task-name">Task Name</Label>
            <Input
              id="edit-task-name"
              placeholder="Enter task name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px] bg-secondary">
                          {u.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <span>{u.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-due-date">Due Date</Label>
            <Input
              id="edit-due-date"
              type="date"
              value={dueDate}
              min={today}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !assigneeId}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
