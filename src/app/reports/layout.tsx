'use client'

import { useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { DashboardNav } from "@/components/DashboardNav"
import { Skeleton } from "@/components/ui/skeleton"

function ReportsSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/30 h-14 bg-white/80 backdrop-blur-sm" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </main>
    </div>
  )
}

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return <ReportsSkeleton />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <DashboardNav />
      </Suspense>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
