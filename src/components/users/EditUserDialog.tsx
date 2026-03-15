import { useEffect, useState } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { userService } from "@/services"
import type { User, UserRole } from "@/types"

interface EditUserDialogProps {
  user: User
  onUpdated: (user: User) => void
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function EditUserDialog({ user, onUpdated }: EditUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>(user.role)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) {
      setName(user.name)
      setEmail(user.email)
      setPassword("")
      setRole(user.role)
      setError("")
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()
    const nextPassword = password.trim()

    if (!trimmedName || !normalizedEmail) {
      setError("Name and email are required.")
      return
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError("Please enter a valid email address.")
      return
    }

    if (nextPassword && nextPassword.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const updated = await userService.update(user.id, {
        name: trimmedName,
        email: normalizedEmail,
        ...(nextPassword ? { password: nextPassword } : {}),
        role,
      })

      onUpdated(updated)
      toast.success("User updated", {
        description: `${updated.name}'s details were saved successfully.`,
      })
      setOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update user"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update account details, role, or password for this user.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor={`edit-user-name-${user.id}`}>Name</Label>
            <Input
              id={`edit-user-name-${user.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-user-email-${user.id}`}>Email</Label>
            <Input
              id={`edit-user-email-${user.id}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-user-password-${user.id}`}>New Password</Label>
            <Input
              id={`edit-user-password-${user.id}`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Leave blank to keep current password"
            />
            <p className="text-xs text-muted-foreground">
              Leave this empty if you do not want to change the password.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
