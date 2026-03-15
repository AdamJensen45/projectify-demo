import { useEffect, useMemo, useState } from "react"
import { Gantt, type Task as GanttTask, ViewMode } from "gantt-task-react"
import "gantt-task-react/dist/index.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Project } from "@/types"

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

  const ganttTasks: GanttTask[] = useMemo(
    () =>
      projects
        .filter((p) => p.status !== "completed")
        .map((project) => ({
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
    [projects, isDark]
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Project Timeline</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {ganttTasks.length > 0 && (
          <Gantt
            tasks={ganttTasks}
            viewMode={ViewMode.Month}
            listCellWidth=""
            columnWidth={120}
            barCornerRadius={4}
            fontSize="12"
            rowHeight={40}
            headerHeight={44}
            todayColor={isDark ? "transparent" : "rgba(252, 248, 227, 0.5)"}
          />
        )}
      </CardContent>
    </Card>
  )
}
