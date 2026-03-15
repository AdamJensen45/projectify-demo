import { useState } from "react"
import type { Task, TaskStatus } from "@/types"
import { normalizeTaskStatus } from "@/lib/taskStatus"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./StatusBadge"
import { PriorityBadge } from "./PriorityBadge"
import { Trash2, CheckCircle, Pencil, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskTableProps {
  tasks: Task[]
  compact?: boolean
  onDelete?: (id: string) => void
  onEdit?: (task: Task) => void
  onViewReports?: (task: Task) => void
  onStatusChange?: (id: string, status: TaskStatus) => void
  onComplete?: (id: string) => void
  currentUserId?: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
]

export function TaskTable({
  tasks,
  compact = false,
  onDelete,
  onEdit,
  onViewReports,
  onStatusChange,
  onComplete,
  currentUserId,
}: TaskTableProps) {
  const displayTasks = compact ? tasks.slice(0, 6) : tasks
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const handleConfirmDelete = () => {
    if (pendingDeleteId && onDelete) {
      onDelete(pendingDeleteId)
    }
    setPendingDeleteId(null)
  }

  const canEditStatus = (task: Task) =>
    !compact && !!onStatusChange && (
      currentUserId === undefined ||
      task.assignee?.id === currentUserId
    )

  const canComplete = (task: Task) =>
    !compact && normalizeTaskStatus(task.status) !== "completed" && !!onComplete && (
      currentUserId === undefined ||
      task.assignee?.id === currentUserId
    )

  const showActions = !compact && (!!onDelete || !!onEdit || !!onViewReports)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead className={compact ? "hidden sm:table-cell" : ""}>Assignee</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className={compact ? "hidden" : ""}>Priority</TableHead>
            <TableHead className={compact ? "hidden md:table-cell" : ""}>Due Date</TableHead>
            {showActions && <TableHead className="w-[100px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayTasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell className="font-medium">{task.name}</TableCell>
              <TableCell className={compact ? "hidden sm:table-cell" : ""}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-secondary">
                      {task.assignee?.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    {task.assignee?.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {canEditStatus(task) ? (
                    <Select
                      key={`status-${task.id}-${normalizeTaskStatus(task.status)}`}
                      value={normalizeTaskStatus(task.status)}
                      onValueChange={(v) => onStatusChange!(task.id, v as TaskStatus)}
                    >
                      <SelectTrigger className="h-7 w-36 text-xs px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge status={task.status} />
                  )}
                  {canComplete(task) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => onComplete!(task.id)}
                      title="Mark complete"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Complete
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell className={compact ? "hidden" : ""}>
                <PriorityBadge priority={task.priority} />
              </TableCell>
              <TableCell className={cn(compact ? "hidden md:table-cell" : "", "text-muted-foreground")}>
                {formatDate(task.dueDate)}
              </TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    {onViewReports && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => onViewReports(task)}
                        title="View progress reports"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => onEdit(task)}
                        title="Edit task"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setPendingDeleteId(task.id)}
                        title="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
