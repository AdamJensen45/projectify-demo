import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { projectService } from "@/services"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { NewProjectDialog } from "@/components/projects/NewProjectDialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/AuthContext"
import { useSearch } from "@/context/SearchContext"
import type { Project, ProjectStatus } from "@/types"

const PAGE_SIZE = 12

export function ProjectsPage() {
  const { isAdmin } = useAuth()
  const { query } = useSearch()
  const [page, setPage] = useState(0)
  const [projects, setProjects] = useState<Project[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all")

  useEffect(() => {
    setPage(0)
  }, [query, statusFilter])

  const loadProjects = useCallback(async () => {
    setLoading(true)
    try {
      const response = await projectService.getPage({
        page,
        size: PAGE_SIZE,
        search: query.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      })
      setProjects(response.content)
      setTotalElements(response.totalElements)
      setTotalPages(Math.max(1, response.totalPages))
    } catch {
      setProjects([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, query, statusFilter])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const handleAddProject = (_project: Project) => {
    if (page !== 0) {
      setPage(0)
      return
    }
    void loadProjects()
  }

  const handleDeleteProject = async (id: string) => {
    const project = projects.find((p) => p.id === id)
    try {
      await projectService.delete(id)
      if (projects.length === 1 && page > 0) {
        setPage((current) => Math.max(0, current - 1))
      } else {
        setProjects((prev) => prev.filter((p) => p.id !== id))
        setTotalElements((current) => Math.max(0, current - 1))
        void loadProjects()
      }
      toast.success("Project deleted", {
        description: project ? `"${project.name}" has been removed.` : undefined,
      })
    } catch {
      toast.error("Failed to delete project")
    }
  }

  if (loading && projects.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {totalElements} project{totalElements !== 1 ? "s" : ""}
          {!isAdmin && " you have access to"}
          {query && ` matching "${query}"`}
          {statusFilter !== "all" && ` • ${statusFilter.replace(/-/g, " ")}`}
        </p>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProjectStatus | "all")}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && <NewProjectDialog onAdd={handleAddProject} />}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm">
            {query ? `No projects match "${query}"` : "You have not been assigned to any projects yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={isAdmin ? handleDeleteProject : undefined}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalElements={totalElements}
              size={PAGE_SIZE}
            />
          )}
        </>
      )}
    </div>
  )
}
