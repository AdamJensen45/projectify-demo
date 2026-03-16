import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NewUserDialog } from "@/components/NewUserDialog"
import { EditUserDialog } from "@/components/users/EditUserDialog"
import { DeleteUserAlert } from "@/components/users/DeleteUserAlert"
import { Pagination } from "@/components/ui/pagination"
import { useAuth } from "@/context/AuthContext"
import { useSearch } from "@/context/SearchContext"
import { normalizeUserPage, userService } from "@/services"
import type { User, UserRole } from "@/types"

const PAGE_SIZE = 15

export function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const { query } = useSearch()
  const [page, setPage] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all")

  useEffect(() => {
    setPage(0)
  }, [query, roleFilter])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await userService.getPage({
        page,
        size: PAGE_SIZE,
        search: query.trim() || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
      })
      const normalized = normalizeUserPage(response)
      setUsers(normalized.content)
      setTotalElements(normalized.totalElements)
      setTotalPages(Math.max(1, normalized.totalPages))
    } catch (e) {
      setUsers([])
      setTotalElements(0)
      setTotalPages(1)
      setError(e instanceof Error ? e.message : "Failed to load users")
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [page, query, roleFilter])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const handleUserUpdated = (updatedUser: User) => {
    setUsers((current) =>
      current.map((existing) => (existing.id === updatedUser.id ? updatedUser : existing))
    )
  }

  const handleUserDeleted = (deletedUserId: string) => {
    if (users.length === 1 && page > 0) {
      setPage((current) => Math.max(0, current - 1))
      return
    }
    setUsers((current) => current.filter((existing) => existing.id !== deletedUserId))
    setTotalElements((current) => Math.max(0, current - 1))
    void loadUsers()
  }

  const handleUserCreated = (_createdUser: User) => {
    if (page !== 0) {
      setPage(0)
      return
    }
    void loadUsers()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User management</h1>
          <p className="text-muted-foreground">
            Create users and assign roles. Only admins can access this page.
          </p>
        </div>
        <NewUserDialog onCreated={handleUserCreated} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>All users in the system. Members only see projects they are assigned to.</CardDescription>
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as "all" | UserRole)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No users match {query ? `"${query}"` : ""} {roleFilter !== "all" ? `with role ${roleFilter}` : ""}.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {totalElements} user{totalElements !== 1 ? "s" : ""}
                {query && ` matching "${query}"`}
                {roleFilter !== "all" && ` • ${roleFilter}`}
              </p>
              <ul className="divide-y">
                {users.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{u.name}</p>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">
                          {u.role}
                        </Badge>
                        {currentUser?.id === u.id && (
                          <Badge variant="outline">Current account</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <EditUserDialog user={u} onUpdated={handleUserUpdated} />
                      <DeleteUserAlert
                        user={u}
                        disabled={currentUser?.id === u.id}
                        onDeleted={handleUserDeleted}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="mt-4 pt-4 border-t">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalElements={totalElements}
                    size={PAGE_SIZE}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
