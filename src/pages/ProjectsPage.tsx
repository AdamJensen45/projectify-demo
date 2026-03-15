import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { projectService } from "@/services"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { NewProjectDialog } from "@/components/projects/NewProjectDialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/AuthContext"
import { useSearch } from "@/context/SearchContext"
import type { Project } from "@/types"

export function ProjectsPage() {
  const { isAdmin } = useAuth()
  const { query } = useSearch()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectService.getAll().then((p) => {
      setProjects(p)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return projects
    const q = query.toLowerCase()
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    )
  }, [projects, query])

  const handleAddProject = (project: Project) => {
    setProjects((prev) => [project, ...prev])
  }

  const handleDeleteProject = async (id: string) => {
    const project = projects.find((p) => p.id === id)
    try {
      await projectService.delete(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      toast.success("Project deleted", {
        description: project ? `"${project.name}" has been removed.` : undefined,
      })
    } catch {
      toast.error("Failed to delete project")
    }
  }

  if (loading) {
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
          {filtered.length} of {projects.length} project{projects.length !== 1 ? "s" : ""}
          {!isAdmin && " you have access to"}
          {query && ` matching "${query}"`}
        </p>
        {isAdmin && <NewProjectDialog onAdd={handleAddProject} />}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm">
            {query ? `No projects match "${query}"` : "You have not been assigned to any projects yet."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={isAdmin ? handleDeleteProject : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
