import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { projectService } from "@/services"
import type { Project, ProjectStatus } from "@/types"

interface NewProjectDialogProps {
  onAdd: (project: Project) => void
}

export function NewProjectDialog({ onAdd }: NewProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<ProjectStatus>("planning")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [endDateError, setEndDateError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const resetForm = () => {
    setName("")
    setDescription("")
    setStatus("planning")
    setStartDate("")
    setEndDate("")
    setEndDateError(null)
  }

  const today = new Date().toISOString().slice(0, 10)
  const endDateMin = startDate && startDate > today ? startDate : today

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const trimmedName = name.trim()
    if (!trimmedName || !startDate || !endDate) {
      setError("Name, start date and end date are required.")
      return
    }
    if (endDate < startDate) {
      setEndDateError("End date must be on or after start date.")
      setError("End date must be on or after start date.")
      return
    }
    if (endDate < today) {
      setEndDateError("End date cannot be in the past.")
      setError("End date cannot be in the past.")
      return
    }

    setLoading(true)
    try {
      const created = await projectService.create({
        name: trimmedName,
        description,
        status,
        progress: 0,
        startDate,
        endDate,
        team: [],
      })
      onAdd(created)
      toast.success("Project created", {
        description: `"${created.name}" has been added successfully.`,
      })
      resetForm()
      setOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError("") }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="Enter project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-desc">Description</Label>
            <Input
              id="project-desc"
              placeholder="Brief description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <DatePicker
                id="start-date"
                value={startDate}
                onChange={(nextValue) => {
                  setStartDate(nextValue)
                  setEndDateError(null)
                }}
                placeholder="Select start date"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <DatePicker
                id="end-date"
                value={endDate}
                min={endDateMin}
                onChange={(nextValue) => {
                  setEndDate(nextValue)
                  if (nextValue) setEndDateError(null)
                }}
                onValidationError={setEndDateError}
                minErrorMessage={
                  startDate && startDate > today
                    ? "End date must be on or after start date."
                    : "End date cannot be in the past."
                }
                placeholder="Select end date"
                required
              />
              {endDateError && (
                <p className="text-sm text-destructive">{endDateError}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
