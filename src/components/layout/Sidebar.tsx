import { useState } from "react"
import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  ListChecks,
  Settings,
  Moon,
  Sun,
  Layers,
  Shield,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const baseNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks/my-tasks", label: "My Tasks", icon: ListTodo },
]
const allTasksNavItem = { to: "/tasks/all", label: "All Tasks", icon: ListChecks }
const adminNavItem = { to: "/admin/users", label: "User management", icon: Users }

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, isAdmin } = useAuth()
  const navItems = isAdmin
    ? [...baseNavItems, allTasksNavItem, adminNavItem]
    : baseNavItems
  const [dark, setDark] = useState(
    document.documentElement.classList.contains("dark")
  )

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark")
    setDark((prev) => !prev)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar-background text-sidebar-foreground transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Layers className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">ProjectFlow</span>
        </div>

        <Separator />

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}

          <Separator className="my-4" />

          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )
            }
          >
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
        </nav>

        <div className="border-t p-4 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <div className="flex items-center gap-1">
                  {isAdmin && <Shield className="h-3 w-3 text-primary" />}
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {isAdmin ? "Admin" : "Member"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3"
            onClick={toggleDarkMode}
          >
            {dark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            Toggle theme
          </Button>
        </div>
      </aside>
    </>
  )
}
