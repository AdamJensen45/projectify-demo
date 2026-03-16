export type UserRole = "admin" | "member"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string
}

export type ProjectStatus = "active" | "completed" | "on-hold" | "planning"

export type TaskStatus = "todo" | "in-progress" | "completed"

export type TaskPriority = "low" | "medium" | "high" | "urgent"

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  progress: number
  startDate: string
  endDate: string
  team: TeamMember[]
}

export interface TeamMember {
  id: string
  name: string
  avatar: string
  role: string
}

export interface Task {
  id: string
  name: string
  projectId: string
  assignee?: TeamMember | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
}

export interface Activity {
  id: string
  user: string
  action: string
  target: string
  timestamp: string
}

export interface TaskProgressReport {
  id: string
  taskId: string
  user: TeamMember
  content: string
  reportDate: string
  createdAt: string
}
