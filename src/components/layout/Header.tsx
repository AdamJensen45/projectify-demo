import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { Menu, Search, Bell, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/context/AuthContext"
import { useSearch } from "@/context/SearchContext"
import { activityService } from "@/services"
import type { Activity } from "@/types"

interface HeaderProps {
  onMenuClick: () => void
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/tasks/my-tasks": "My Tasks",
  "/tasks/all": "All Tasks",
  "/settings": "Settings",
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { query, setQuery } = useSearch()
  const pathname = location.pathname
  const title = pageTitles[pathname] || "Dashboard"

  // Show search only where it's used: Projects and Tasks pages
  const showSearch =
    pathname === "/projects" ||
    pathname === "/tasks/my-tasks" ||
    pathname === "/tasks/all"

  const [activities, setActivities] = useState<Activity[]>([])
  const [hasUnread, setHasUnread] = useState(true)
  const [open, setOpen] = useState(false)

  const loadActivities = async () => {
    try {
      const data = await activityService.getAll()
      setActivities(data.slice(0, 10))
      if (data.length > 0) setHasUnread(true)
    } catch {
      setActivities([])
    }
  }

  useEffect(() => {
    if (!user?.id) return
    loadActivities()
  }, [user?.id, pathname])

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setHasUnread(false)
      loadActivities()
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {showSearch && (
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects & tasks..."
              className="w-64 pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}

        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {hasUnread && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              <span className="text-xs text-muted-foreground">Latest activity</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {activities.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No recent activity
                </p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                      <AvatarFallback className="text-xs bg-secondary">
                        {getInitials(activity.user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm leading-snug">
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>{" "}
                        <span className="font-medium truncate">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {user?.avatar ?? "??"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium lg:block">{user?.name}</span>
        </div>

        <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
