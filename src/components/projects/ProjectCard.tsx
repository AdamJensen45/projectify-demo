import { useState } from "react"
import { Link } from "react-router-dom"
import type { Project, ProjectStatus } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Calendar, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectCardProps {
  project: Project
  onDelete?: (id: string) => void
}

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

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <div className="relative group">
        <Link to={`/projects/${project.id}`} className="block">
          <Card className="transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base leading-snug pr-2">
                  {project.name}
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn("shrink-0 font-medium", statusStyles[project.status])}
                >
                  {statusLabels[project.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-1.5" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {project.team.slice(0, 3).map((member) => (
                    <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                      <AvatarFallback className="text-[10px] bg-secondary">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {project.team.length > 3 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                      +{project.team.length - 3}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatShortDate(project.startDate)} – {formatShortDate(project.endDate)}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {onDelete && (
          <div
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowConfirm(true)
            }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Delete project"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">"{project.name}"</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirm(false)
                onDelete?.(project.id)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
