import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { AuthProvider } from "@/context/AuthContext"
import { SearchProvider } from "@/context/SearchContext"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { AdminRoute } from "@/components/auth/AdminRoute"
import { AppLayout } from "@/components/layout/AppLayout"
import { LoginPage } from "@/pages/LoginPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ProjectsPage } from "@/pages/ProjectsPage"
import { ProjectDetailPage } from "@/pages/ProjectDetailPage"
import { TasksPage } from "@/pages/TasksPage"
import { AdminUsersPage } from "@/pages/AdminUsersPage"
import { SettingsPage } from "@/pages/SettingsPage"
import { NotFoundPage } from "@/pages/NotFoundPage"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SearchProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/tasks" element={<Navigate to="/tasks/my-tasks" replace />} />
                <Route path="/tasks/my-tasks" element={<TasksPage view="my-tasks" />} />
                <Route path="/tasks/all" element={<TasksPage view="all" />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route element={<AdminRoute />}>
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          <Toaster position="bottom-right" richColors />
        </SearchProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
