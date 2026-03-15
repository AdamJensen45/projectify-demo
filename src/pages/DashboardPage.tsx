import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import {
  FolderKanban,
  ListTodo,
  CheckCircle2,
  Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatCard } from "@/components/dashboard/StatCard"
import { ProjectStatusChart } from "@/components/dashboard/ProjectStatusChart"
import { ActivityPanel } from "@/components/dashboard/ActivityPanel"
import { GanttSection } from "@/components/gantt/GanttSection"
import { TaskTable } from "@/components/tasks/TaskTable"
import { PageSkeleton } from "@/components/dashboard/PageSkeleton"
import { activityService, projectService, taskService } from "@/services"
import { useMyReports } from "@/hooks/useMyReports"
import { useAuth } from "@/context/AuthContext"
import type { Project, Task, Activity } from "@/types"
import { MyReportsCard } from "@/components/reports/MyReportsCard"
import { LogProgressDialog } from "@/components/reports/LogProgressDialog"
import { TaskReportsDialog } from "@/components/reports/TaskReportsDialog"
import { withNormalizedStatus } from "@/lib/taskStatus"
import {
  type DashboardTimeRange,
  DASHBOARD_TIME_RANGE_OPTIONS as TIME_RANGE_OPTIONS,
  isTaskInRange,
  isTimestampInRange,
} from "@/lib/dashboardTimeRange"

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const { reports: myReports, reload: loadReports } = useMyReports(false)
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [reportsDialogTask, setReportsDialogTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRangeActivity, setTimeRangeActivity] = useState<DashboardTimeRange>("1w")
  const [timeRangeTasks, setTimeRangeTasks] = useState<DashboardTimeRange>("1w")
  const location = useLocation()
  const { user } = useAuth()

  const loadActivities = () => {
    activityService.getAll().then(setActivities).catch(() => setActivities([]))
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [p, t, a] = await Promise.all([
        projectService.getAll(),
        user?.id ? taskService.getByAssignee(user.id) : taskService.getAll(),
        activityService.getAll(),
      ])
      setProjects(p)
      setTasks(t.map(withNormalizedStatus))
      setActivities(a)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (location.pathname !== "/dashboard") return
    loadData()
  }, [location.pathname, user?.id])

  useEffect(() => {
    if (!loading) loadReports()
  }, [loading])

  const activitiesInRange = useMemo(
    () => activities.filter((a) => isTimestampInRange(a.timestamp, timeRangeActivity)),
    [activities, timeRangeActivity]
  )

  const tasksInTasksRange = useMemo(
    () => tasks.filter((t) => isTaskInRange(t.dueDate, timeRangeTasks)),
    [tasks, timeRangeTasks]
  )

  const recentActivity: Activity[] = useMemo(() => {
    return activitiesInRange.slice(0, 10)
  }, [activitiesInRange])

  const completedCount = tasks.filter((t) => t.status === "completed").length
  const activeTasksCount = tasks.filter((t) => t.status !== "completed").length
  const teamMemberIds = new Set(projects.flatMap((p) => p.team.map((m) => m.id)))

  const stats = [
    {
      title: "Total Projects",
      value: projects.length,
      icon: FolderKanban,
    },
    {
      title: "Active Tasks",
      value: activeTasksCount,
      icon: ListTodo,
    },
    {
      title: "Completed",
      value: completedCount,
      icon: CheckCircle2,
    },
    {
      title: "Team Members",
      value: teamMemberIds.size,
      icon: Users,
    },
  ]

  if (loading) return <PageSkeleton>{null}</PageSkeleton>

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ProjectStatusChart projects={projects} />
        </div>
        <div className="lg:col-span-2">
          <ActivityPanel
            activities={recentActivity}
            timeRange={timeRangeActivity}
            onTimeRangeChange={setTimeRangeActivity}
            timeRangeOptions={TIME_RANGE_OPTIONS}
          />
        </div>
      </div>

      <GanttSection projects={projects} />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Recent Tasks</CardTitle>
            <Select value={timeRangeTasks} onValueChange={(v) => setTimeRangeTasks(v as DashboardTimeRange)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <TaskTable tasks={tasksInTasksRange} compact />
        </CardContent>
      </Card>

      <MyReportsCard
        reports={myReports}
        tasks={tasks}
        onLogProgress={() => setLogDialogOpen(true)}
        onSelectTask={setReportsDialogTask}
        emptyHint={'Use "Log progress" to record what you did on a task.'}
      />

      <LogProgressDialog
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
        onSuccess={() => {
          loadReports()
          loadActivities()
        }}
      />

      <TaskReportsDialog
        task={reportsDialogTask}
        open={!!reportsDialogTask}
        onOpenChange={(open) => !open && setReportsDialogTask(null)}
      />
    </div>
  )
}
