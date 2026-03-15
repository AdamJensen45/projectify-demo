import { useEffect, useMemo, useRef, useState } from "react"
import { Gantt, type Task as GanttTask, ViewMode } from "gantt-task-react"
import "gantt-task-react/dist/index.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { Project, ProjectStatus } from "@/types"

const TIMELINE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "year", label: "This year" },
] as const

type TimelineValue = (typeof TIMELINE_OPTIONS)[number]["value"]

function startOfMonth(d: Date): Date {
  const out = new Date(d)
  out.setDate(1)
  out.setHours(0, 0, 0, 0)
  return out
}

const LIST_WIDTH_ESTIMATE = 180
const MIN_COLUMN_WIDTH: Partial<Record<ViewMode, number>> = {
  [ViewMode.Year]: 80,
  [ViewMode.Month]: 40,
  [ViewMode.Week]: 40,
}

const STATUS_OPTIONS: { value: "non-completed" | "all" | ProjectStatus; label: string }[] = [
  { value: "non-completed", label: "Non-completed" },
  { value: "active", label: "Active" },
  { value: "on-hold", label: "On hold" },
  { value: "planning", label: "Planning" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
]

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: ViewMode.Week, label: "Week" },
  { value: ViewMode.Month, label: "Month" },
  { value: ViewMode.Year, label: "Year" },
]

function getTimelineRange(value: TimelineValue) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (value === "all") return { start: null as Date | null, end: null as Date | null, viewDate: today }
  const start = startOfMonth(today)
  const end = new Date(today.getFullYear(), 11, 31)
  end.setHours(23, 59, 59, 999)
  return { start, end, viewDate: start }
}

function projectOverlapsRange(
  startDate: string,
  endDate: string,
  rangeStart: Date | null,
  rangeEnd: Date | null
) {
  if (rangeStart == null || rangeEnd == null) return true
  const pStart = new Date(startDate).getTime()
  const pEnd = new Date(endDate).getTime()
  return pEnd >= rangeStart.getTime() && pStart <= rangeEnd.getTime()
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark")
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    return () => observer.disconnect()
  }, [])

  return isDark
}

interface GanttSectionProps {
  projects: Project[]
}

export function GanttSection({ projects }: GanttSectionProps) {
  const isDark = useDarkMode()
  const [timeline, setTimeline] = useState<TimelineValue>("all")
  const [statusFilter, setStatusFilter] = useState<
    "non-completed" | "all" | ProjectStatus
  >("non-completed")
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month)

  const { start: rangeStart, end: rangeEnd, viewDate } = getTimelineRange(timeline)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const filteredProjects = useMemo(() => {
    const searchLower = search.trim().toLowerCase()
    return projects.filter((p) => {
      if (statusFilter === "non-completed" && p.status === "completed") return false
      if (statusFilter !== "all" && statusFilter !== "non-completed" && p.status !== statusFilter)
        return false
      if (searchLower && !p.name.toLowerCase().includes(searchLower)) return false
      if (!projectOverlapsRange(p.startDate, p.endDate, rangeStart, rangeEnd)) return false
      return true
    })
  }, [projects, statusFilter, search, rangeStart, rangeEnd])

  const ganttTasks: GanttTask[] = useMemo(
    () =>
      filteredProjects.map((project) => ({
        start: new Date(project.startDate),
        end: new Date(project.endDate),
        name: project.name,
        id: project.id,
        type: "task" as const,
        progress: project.progress,
        isDisabled: true,
        styles: {
          progressColor: "hsl(217, 91%, 60%)",
          progressSelectedColor: "hsl(217, 91%, 50%)",
          backgroundColor: isDark ? "hsl(215, 25%, 30%)" : "#b8c2cc",
          backgroundSelectedColor: isDark ? "hsl(215, 25%, 35%)" : "#a3b0bd",
        },
      })),
    [filteredProjects, isDark]
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setContainerWidth(entry.contentRect.width)
    })
    ro.observe(el)
    setContainerWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  const columnWidth = useMemo(() => {
    const defaultCol = 120
    if (ganttTasks.length === 0) return defaultCol
    const minDate = new Date(Math.min(...ganttTasks.map((t) => t.start.getTime())))
    const maxDate = new Date(Math.max(...ganttTasks.map((t) => t.end.getTime())))
    let columnCount: number
    if (viewMode === ViewMode.Year) {
      columnCount = maxDate.getFullYear() - minDate.getFullYear() + 1
    } else if (viewMode === ViewMode.Month) {
      columnCount =
        (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
        (maxDate.getMonth() - minDate.getMonth()) +
        1
    } else {
      const msPerWeek = 7 * 24 * 60 * 60 * 1000
      columnCount = Math.ceil((maxDate.getTime() - minDate.getTime()) / msPerWeek) + 1
    }
    columnCount = Math.max(1, columnCount)
    const effectiveContainerWidth =
      containerWidth > 0
        ? containerWidth
        : typeof document !== "undefined"
          ? document.documentElement.clientWidth - 80
          : 900
    const timelineWidth = Math.max(400, effectiveContainerWidth - LIST_WIDTH_ESTIMATE)
    const fillWidth = timelineWidth / columnCount
    const minWidth = MIN_COLUMN_WIDTH[viewMode as keyof typeof MIN_COLUMN_WIDTH] ?? 40
    return Math.max(minWidth, Math.round(fillWidth))
  }, [ganttTasks, viewMode, containerWidth])

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Project Timeline</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-[140px] md:w-[160px]"
            />
            <Select value={timeline} onValueChange={(v) => setTimeline(v as TimelineValue)}>
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue placeholder="Timeline" />
              </SelectTrigger>
              <SelectContent>
                {TIMELINE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="h-9 w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={viewMode}
              onValueChange={(v) => setViewMode(v as ViewMode)}
            >
              <SelectTrigger className="h-9 w-[100px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                {VIEW_MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent ref={containerRef} className="gantt-card-content">
        {ganttTasks.length > 0 ? (
          <Gantt
            tasks={ganttTasks}
            viewMode={viewMode}
            viewDate={viewDate}
            listCellWidth=""
            columnWidth={columnWidth}
            barCornerRadius={4}
            fontSize="12"
            rowHeight={40}
            headerHeight={44}
            todayColor={isDark ? "transparent" : "rgba(252, 248, 227, 0.5)"}
          />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No projects match the current filters.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
