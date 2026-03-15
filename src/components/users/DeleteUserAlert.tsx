import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { userService } from "@/services"
import type { User } from "@/types"

interface DeleteUserAlertProps {
  user: User
  disabled?: boolean
  onDeleted: (userId: string) => void
}

export function DeleteUserAlert({ user, disabled = false, onDeleted }: DeleteUserAlertProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      await userService.delete(user.id)
      onDeleted(user.id)
      toast.success("User deleted", {
        description: `${user.name} has been removed.`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete user"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-1.5" disabled={disabled}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete user?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove <span className="font-medium text-foreground">{user.name}</span>.
            Their task assignments will be cleared, their memberships will be removed, and their progress
            reports will be deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
