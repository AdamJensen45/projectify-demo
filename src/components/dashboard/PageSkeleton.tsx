import { useEffect, useState, type ReactNode } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface PageSkeletonProps {
  children: ReactNode
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-72 rounded-xl lg:col-span-3" />
        <Skeleton className="h-72 rounded-xl lg:col-span-2" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

export function PageSkeleton({ children }: PageSkeletonProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <DashboardSkeleton />
  return <>{children}</>
}
