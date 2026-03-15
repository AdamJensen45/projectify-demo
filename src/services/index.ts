import {
  projectApi,
  taskApi,
  activityApi,
  userApi,
  reportApi,
  normalizeUserList,
} from "@/services/api"

export const projectService = projectApi
export const taskService = taskApi
export const activityService = activityApi
export const userService = userApi
export const reportService = reportApi
export { normalizeUserList }
