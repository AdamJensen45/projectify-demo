import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { TaskTable } from "@/components/tasks/TaskTable"
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog"
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog"
import { LogProgressDialog } from "@/components/reports/LogProgressDialog"
import { TaskReportsDialog } from "@/components/reports/TaskReportsDialog"
import { projectService, taskService } from "@/services"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Project, Task, ProjectStatus, TaskStatus } from "@/types"
import { withNormalizedStatus } from "@/lib/taskStatus"

const statusStyles: Record<ProjectStatus, string> = {
  active: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  "on-hold": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  planning: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
}

const statusLabels: Record<ProjectStatus, string> = {
  active: "Active",
  completed: "Completed",
  "on-hold": "On Hold",
  planning: "Planning",
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isAdmin } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [logProgressOpen, setLogProgressOpen] = useState(false)
  const [reportsDialogTask, setReportsDialogTask] = useState<Task | null>(null)

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      const updated = await taskService.update(taskId, { status })
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? withNormalizedStatus(updated) : t))
      )
      toast.success("Status updated", {
        description: `Task marked as "${status.replace(/-/g, " ")}"`,
      })
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleComplete = async (taskId: string) => {
    try {
      const updated = await taskService.complete(taskId)
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? withNormalizedStatus(updated) : t))
      )
      toast.success("Task completed")
    } catch {
      toast.error("Failed to complete task")
    }
  }

  const handleAddTask = (task: Task) => {
    if (task.projectId !== project?.id) return
    setTasks((prev) => [withNormalizedStatus(task), ...prev])
  }

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    try {
      await taskService.delete(taskId)
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
      toast.success("Task deleted", {
        description: task ? `"${task.name}" has been removed.` : undefined,
      })
    } catch {
      toast.error("Failed to delete task")
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setEditDialogOpen(true)
  }

  const handleEditSave = (updated: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? withNormalizedStatus(updated) : t))
    )
    setEditDialogOpen(false)
    setEditingTask(null)
  }

  useEffect(() => {
    if (!id) return
    async function load() {
      if (!id) return
      try {
        const [p, projectTasks] = await Promise.all([
          projectService.getById(id),
          projectService.getTasks(id),
        ])
        setProject(p)
        setTasks(projectTasks.map(withNormalizedStatus))
      } catch {
        setError("Project not found")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  const progress =
    tasks.length === 0
      ? 0
      : Math.round(
          (100 * tasks.filter((t) => t.status === "completed").length) / tasks.length
        )

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/projects" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Projects
          </Link>
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">{error || "Project not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/projects" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{project.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
            <Badge
              variant="outline"
              className={cn("shrink-0 font-medium", statusStyles[project.status])}
            >
              {statusLabels[project.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Progress</p>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{progress}%</p>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Timeline</p>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {formatDate(project.startDate)} - {formatDate(project.endDate)}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Team</p>
              <div className="flex -space-x-2">
                {project.team.map((member) => (
                  <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                    <AvatarFallback className="text-xs bg-secondary">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.team.length === 0 && (
                  <p className="text-sm text-muted-foreground">No team members</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">
              Project Tasks ({tasks.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogProgressOpen(true)}
              >
                Log progress
              </Button>
              {isAdmin && (
                <NewTaskDialog
                  defaultProjectId={project.id}
                  onAdd={handleAddTask}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <TaskTable
              tasks={tasks}
              onStatusChange={handleStatusChange}
              onComplete={handleComplete}
              onDelete={isAdmin ? handleDeleteTask : undefined}
              onEdit={isAdmin ? handleEditTask : undefined}
              onViewReports={(task) => setReportsDialogTask(task)}
              currentUserId={isAdmin ? undefined : user?.id}
            />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No tasks yet for this project.
              {isAdmin && " Use \"New Task\" above to add one and assign a member."}
            </p>
          )}
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

      <LogProgressDialog
        open={logProgressOpen}
        onOpenChange={setLogProgressOpen}
        taskOptions={tasks}
      />

      <TaskReportsDialog
        task={reportsDialogTask}
        open={!!reportsDialogTask}
        onOpenChange={(open) => !open && setReportsDialogTask(null)}
      />
    </div>
  )
}
