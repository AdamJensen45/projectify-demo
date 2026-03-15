import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Project } from "@/types"

interface ProjectStatusChartProps {
  projects: Project[]
}

export function ProjectStatusChart({ projects }: ProjectStatusChartProps) {
  const statusCounts = projects.reduce(
    (acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const chartData = [
    { name: "Active", value: statusCounts["active"] || 0, color: "hsl(217, 91%, 60%)" },
    { name: "Completed", value: statusCounts["completed"] || 0, color: "hsl(142, 71%, 45%)" },
    { name: "On Hold", value: statusCounts["on-hold"] || 0, color: "hsl(38, 92%, 50%)" },
    { name: "Planning", value: statusCounts["planning"] || 0, color: "hsl(262, 83%, 58%)" },
  ]

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Project Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
