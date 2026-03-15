import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Layers } from "lucide-react"

export function NotFoundPage() {
  return (
    <div className="app-shell-gradient flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-6">
        <Layers className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Button asChild className="mt-6">
        <Link to="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  )
}
