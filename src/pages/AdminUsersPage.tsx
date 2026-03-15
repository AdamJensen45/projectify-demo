import { useState, useEffect, useMemo } from "react"
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
import { userService, normalizeUserList } from "@/services"
import type { User, UserRole } from "@/types"

const PAGE_SIZE = 15

export function AdminUsersPage() {
  const { user: currentUser } = useAuth()
  const { query } = useSearch()
  const [page, setPage] = useState(0)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all")

  useEffect(() => {
    setPage(0)
  }, [query, roleFilter])

  useEffect(() => {
    setLoading(true)
    setError(null)
    userService
      .getAll()
      .then((data) => setAllUsers(Array.isArray(data) ? normalizeUserList(data) : []))
      .catch((e) => {
        setAllUsers([])
        setError(e instanceof Error ? e.message : "Failed to load users")
        toast.error("Failed to load users")
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = allUsers
    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    }
    return list
  }, [allUsers, query, roleFilter])

  const totalElements = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))
  const paginatedUsers = useMemo(
    () => filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filtered, page]
  )

  const handleUserUpdated = (updatedUser: User) => {
    setAllUsers((current) =>
      current.map((existing) => (existing.id === updatedUser.id ? updatedUser : existing))
    )
  }

  const handleUserDeleted = (deletedUserId: string) => {
    setAllUsers((current) => current.filter((existing) => existing.id !== deletedUserId))
  }

  const handleUserCreated = () => {
    userService
      .getAll()
      .then((data) => setAllUsers(Array.isArray(data) ? normalizeUserList(data) : []))
      .catch(() => {})
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
          {loading && allUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : paginatedUsers.length === 0 ? (
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
                {paginatedUsers.map((u) => (
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
