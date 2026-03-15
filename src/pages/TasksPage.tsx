import { useState, useMemo } from "react"
import { Navigate } from "react-router-dom"
import { toast } from "sonner"
import { taskService } from "@/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MyReportsCard } from "@/components/reports/MyReportsCard"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TaskTable } from "@/components/tasks/TaskTable"
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog"
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog"
import { TaskReportsDialog } from "@/components/reports/TaskReportsDialog"
import { LogProgressDialog } from "@/components/reports/LogProgressDialog"
import { useMyReports } from "@/hooks/useMyReports"
import { useTaskCollection } from "@/hooks/useTaskCollection"
import { useFilteredTasks } from "@/hooks/useFilteredTasks"
import { useAuth } from "@/context/AuthContext"
import { useSearch } from "@/context/SearchContext"
import type { Task, TaskStatus } from "@/types"
import { withNormalizedStatus } from "@/lib/taskStatus"

interface TasksPageProps {
  view?: "my-tasks" | "all"
}

export function TasksPage({ view = "my-tasks" }: TasksPageProps) {
  const { user, isAdmin } = useAuth()
  const { query } = useSearch()
  const { taskList, setTaskList, loading } = useTaskCollection({ view, userId: user?.id })
  const { reports: myReports, reload: loadMyReports } = useMyReports(view === "my-tasks" && !!user?.id)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [reportsDialogTask, setReportsDialogTask] = useState<Task | null>(null)
  const [logProgressOpen, setLogProgressOpen] = useState(false)

  if (view === "all" && !isAdmin) {
    return <Navigate to="/tasks/my-tasks" replace />
  }

  const visibleTasks = useMemo(() => {
    if (!query.trim()) return taskList
    const q = query.toLowerCase()
    return taskList.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.assignee?.name && t.assignee.name.toLowerCase().includes(q))
    )
  }, [taskList, query])

  const filteredTasks = useFilteredTasks(visibleTasks, statusFilter)

  const handleAddTask = (task: Task) => {
    setTaskList((prev) => [task, ...prev])
  }

  const handleDeleteTask = async (id: string) => {
    const task = taskList.find((t) => t.id === id)
    try {
      await taskService.delete(id)
      setTaskList((prev) => prev.filter((t) => t.id !== id))
      toast.success("Task deleted", {
        description: task ? `"${task.name}" has been removed.` : undefined,
      })
    } catch {
      toast.error("Failed to delete task")
    }
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    const previous = taskList.find((t) => t.id === id)
    if (!previous) return

    // Optimistic update: show selected status immediately so it never "snaps back" to To Do
    setTaskList((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status } as Task : t
      )
    )
    if (statusFilter !== "all" && statusFilter !== status) {
      setStatusFilter("all")
    }

    try {
      const updated = await taskService.update(id, { status })
      setTaskList((prev) =>
        prev.map((t) => (t.id === id ? withNormalizedStatus(updated) : t))
      )
      toast.success("Status updated", {
        description: `Task marked as "${status.replace(/-/g, " ")}"`,
      })
    } catch {
      setTaskList((prev) =>
        prev.map((t) => (t.id === id ? previous : t))
      )
      toast.error("Failed to update status")
    }
  }

  const handleComplete = async (id: string) => {
    try {
      const updated = await taskService.complete(id)
      setTaskList((prev) =>
        prev.map((t) => (t.id === id ? withNormalizedStatus(updated) : t))
      )
      if (statusFilter !== "all") setStatusFilter("all")
      toast.success("Task completed")
    } catch {
      toast.error("Failed to complete task")
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setEditDialogOpen(true)
  }

  const handleEditSave = (updated: Task) => {
    setTaskList((prev) =>
      prev.map((t) => (t.id === updated.id ? withNormalizedStatus(updated) : t))
    )
    setEditDialogOpen(false)
    setEditingTask(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredTasks.length} of {visibleTasks.length} task{visibleTasks.length !== 1 ? "s" : ""}
          {view === "my-tasks" && " assigned to you"}
        </p>
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          {view === "all" && isAdmin && <NewTaskDialog onAdd={handleAddTask} />}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {view === "all" ? "All Tasks" : "My Tasks"}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-0.5">
            {view === "all"
              ? "View and manage all tasks. Create tasks and assign them to team members."
              : "Tasks assigned to you across your projects."}
          </p>
        </CardHeader>
        <CardContent>
          <TaskTable
            tasks={filteredTasks}
            onDelete={view === "all" && isAdmin ? handleDeleteTask : undefined}
            onEdit={view === "all" && isAdmin ? handleEditTask : undefined}
            onViewReports={(task) => setReportsDialogTask(task)}
            onStatusChange={handleStatusChange}
            onComplete={handleComplete}
            currentUserId={view === "all" ? undefined : user?.id}
          />
        </CardContent>
      </Card>

      <EditTaskDialog
        task={editingTask}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) setEditingTask(null)
        }}
        onSave={handleEditSave}
      />

      <TaskReportsDialog
        task={reportsDialogTask}
        open={!!reportsDialogTask}
        onOpenChange={(open) => !open && setReportsDialogTask(null)}
      />

      {view === "my-tasks" && (
        <MyReportsCard
          reports={myReports}
          tasks={taskList}
          onLogProgress={() => setLogProgressOpen(true)}
          onSelectTask={setReportsDialogTask}
        />
      )}

      <LogProgressDialog
        open={logProgressOpen}
        onOpenChange={setLogProgressOpen}
        onSuccess={loadMyReports}
      />
    </div>
  )
}
