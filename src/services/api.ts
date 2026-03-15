import type { User, Project, Task, Activity, TaskProgressReport } from "@/types"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token")
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
    throw new Error("Session expired")
  }

  if (!res.ok) {
    const text = await res.text()
    let message = text || `Request failed: ${res.status}`
    try {
      const body = JSON.parse(text)
      if (body && typeof body.message === "string") message = body.message
      else if (body && typeof body.error === "string") message = body.error
    } catch {
      // use message as-is
    }
    throw new Error(message)
  }

  // 204 No Content has no body; calling res.json() would throw
  if (res.status === 204) {
    return undefined as T
  }
  return res.json()
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),
  me: () => request<User>("/users/me"),
}

export const projectApi = {
  getAll: () => request<Project[]>("/projects"),
  getById: (id: string) => request<Project>(`/projects/${id}`),
  getTasks: (projectId: string) => request<Task[]>(`/projects/${projectId}/tasks`),
  create: (data: Partial<Project>) =>
    request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/projects/${id}`, { method: "DELETE" }),
}

export const taskApi = {
  getAll: () => request<Task[]>("/tasks"),
  getByAssignee: (userId: string) => request<Task[]>(`/tasks?assignee=${userId}`),
  create: (data: Partial<Task>) =>
    request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        projectId: data.projectId,
        assigneeId: data.assignee?.id,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate,
      }),
    }),
  update: async (id: string, data: Partial<Task>) => {
    if (!id || id === "undefined") {
      return Promise.reject(new Error("Task ID is missing; cannot update."))
    }
    const updated = await request<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
        ...(data.assignee?.id !== undefined && { assigneeId: data.assignee.id }),
      }),
    })
    // Backend currently returns a malformed status for "in-progress".
    // Preserve the user-selected status so the UI stays correct after a successful update.
    if (data.status !== undefined) {
      return { ...updated, status: data.status }
    }
    return updated
  },
  complete: (id: string) =>
    request<Task>(`/tasks/${id}/complete`, { method: "PATCH" }),
  delete: (id: string) => {
    if (!id || id === "undefined") {
      return Promise.reject(new Error("Task ID is missing; cannot delete."))
    }
    return request<void>(`/tasks/${id}`, { method: "DELETE" })
  },
}

export const activityApi = {
  getAll: () => request<Activity[]>("/activity"),
}

export const userApi = {
  getAll: () => request<User[]>("/users"),
  create: (data: { name: string; email: string; password: string; role: string }) =>
    request<User>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

export const reportApi = {
  getByTask: (taskId: string) =>
    request<TaskProgressReport[]>(`/tasks/${taskId}/reports`),
  getMyReports: () => request<TaskProgressReport[]>("/reports/me"),
  create: (taskId: string, data: { content: string; reportDate?: string }) =>
    request<TaskProgressReport>(`/tasks/${taskId}/reports`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
}
