import { useEffect, useState } from "react"
import { normalizeUserList, projectService, userService } from "@/services"
import type { Project, User } from "@/types"

interface UseTaskFormLookupsOptions {
  enabled: boolean
  includeProjects?: boolean
}

export function useTaskFormLookups({
  enabled,
  includeProjects = false,
}: UseTaskFormLookupsOptions) {
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    if (!enabled) return

    const requests = includeProjects
      ? Promise.all([userService.getAll(), projectService.getAll()])
      : Promise.all([userService.getAll(), Promise.resolve([] as Project[])])

    requests
      .then(([userList, projectList]) => {
        setUsers(normalizeUserList(userList))
        setProjects(projectList)
      })
      .catch(() => {
        setUsers([])
        setProjects([])
      })
  }, [enabled, includeProjects])

  return { users, projects }
}
