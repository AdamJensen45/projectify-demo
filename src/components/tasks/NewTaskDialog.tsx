import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
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
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { taskService, projectService, userService, normalizeUserList } from "@/services"
import type { Task, TaskStatus, TaskPriority, User, Project } from "@/types"

interface NewTaskDialogProps {
  onAdd: (task: Task) => void
  defaultProjectId?: string
}

export function NewTaskDialog({ onAdd, defaultProjectId }: NewTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [assigneeId, setAssigneeId] = useState("")
  const [projectId, setProjectId] = useState(defaultProjectId ?? "")
  const [status, setStatus] = useState<TaskStatus>("todo")
  const [priority, setPriority] = useState<TaskPriority>("medium")
  const [dueDate, setDueDate] = useState("")
  const [dueDateError, setDueDateError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (!open) return
    Promise.all([userService.getAll(), projectService.getAll()])
      .then(([u, p]) => {
        const users = normalizeUserList(u)
        setUsers(users)
        setProjects(p)
        if (!assigneeId && users.length > 0) setAssigneeId(users[0].id)
        if (!projectId && p.length > 0) setProjectId(p[0].id)
      })
      .catch(() => {})
  }, [open])

  const resetForm = () => {
    setName("")
    setAssigneeId("")
    setProjectId(defaultProjectId ?? "")
    setStatus("todo")
    setPriority("medium")
    setDueDate("")
    setDueDateError(null)
  }

  const today = new Date().toISOString().slice(0, 10)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const trimmedName = name.trim()
    if (!trimmedName || !assigneeId || !projectId || !dueDate) {
      setError("Task name, project, assignee and due date are required.")
      return
    }
    if (dueDate < today) {
      setDueDateError("Due date cannot be in the past.")
      setError("Due date cannot be in the past.")
      return
    }

    const selectedUser = users.find((u) => u.id === assigneeId)
    if (!selectedUser) return

    const taskData: Partial<Task> = {
      name: trimmedName,
      projectId,
      assignee: {
        id: selectedUser.id,
        name: selectedUser.name,
        avatar: selectedUser.avatar,
        role: selectedUser.role,
      },
      status,
      priority,
      dueDate,
    }

    setLoading(true)
    try {
      const created = await taskService.create(taskData)
      onAdd(created)
      toast.success("Task created", {
        description: `"${created.name}" has been added successfully.`,
      })
      resetForm()
      setOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create task"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError("") }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task and assign it to a team member.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="task-name">Task Name</Label>
            <Input
              id="task-name"
              placeholder="Enter task name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {!defaultProjectId && (
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            <Label htmlFor="due-date">Due Date</Label>
            <DatePicker
              id="due-date"
              value={dueDate}
              min={today}
              onChange={(nextValue) => {
                setDueDate(nextValue)
                if (nextValue) setDueDateError(null)
              }}
              onValidationError={setDueDateError}
              minErrorMessage="Due date cannot be in the past."
              placeholder="Select due date"
              required
            />
            {dueDateError && (
              <p className="text-sm text-destructive">{dueDateError}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !assigneeId || !projectId}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
