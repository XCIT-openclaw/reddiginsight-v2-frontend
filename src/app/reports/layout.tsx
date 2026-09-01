'use client'

import { Suspense } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { AuthRequiredNotice } from "@/components/AuthRequiredNotice"
import { DashboardNav } from "@/components/DashboardNav"
import { Skeleton } from "@/components/ui/skeleton"

function ReportsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
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

  if (loading) {
    return <ReportsSkeleton />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
        <DashboardNav />
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <AuthRequiredNotice
            title="Sign in to view your reports"
            description="Reports are tied to your account so your research history stays private. Sign in to open completed subreddit analyses and export reports for your team."
            bullets={[
              "View saved subreddit insight reports",
              "Track completed, active, and failed analyses",
              "Open sentiment, theme, quote, and recommendation details",
              "Export completed reports for collaboration",
            ]}
            returnTo="/reports"
          />
        </main>
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
      <Suspense fallback={null}>
        <DashboardNav />
      </Suspense>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
