import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Activity } from "@/types"
import type { DashboardTimeRange } from "@/lib/dashboardTimeRange"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

function formatRelativeTime(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

interface ActivityPanelProps {
  activities: Activity[]
  timeRange?: DashboardTimeRange
  onTimeRangeChange?: (value: DashboardTimeRange) => void
  timeRangeOptions?: { value: DashboardTimeRange; label: string }[]
}

export function ActivityPanel({
  activities,
  timeRange,
  onTimeRangeChange,
  timeRangeOptions = [],
}: ActivityPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          {timeRangeOptions.length > 0 && onTimeRangeChange && (
            <Select value={timeRange} onValueChange={(v) => onTimeRangeChange(v as DashboardTimeRange)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 max-h-80 overflow-y-auto">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <Avatar className="h-8 w-8 mt-0.5">
              <AvatarFallback className="text-xs bg-secondary">
                {getInitials(activity.user)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-0.5">
              <p className="text-sm leading-snug">
                <span className="font-medium">{activity.user}</span>{" "}
                <span className="text-muted-foreground">{activity.action}</span>{" "}
                <span className="font-medium">{activity.target}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
