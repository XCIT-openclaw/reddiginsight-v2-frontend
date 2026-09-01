'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AuthRequiredNotice } from '@/components/AuthRequiredNotice'
import { DashboardNav } from '@/components/DashboardNav'
import { Skeleton } from '@/components/ui/skeleton'

const STORAGE_KEY = 'dashboard_params'

function ParamSaver() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const subreddit = searchParams?.get('subreddit')
    const keywords = searchParams?.get('keywords')
    const timeRange = searchParams?.get('timeRange')
    const limit = searchParams?.get('limit')

    if (subreddit || keywords || timeRange) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        subreddit: subreddit || '',
        keywords: keywords || '',
        timeRange: timeRange || '',
        limit: limit ? Number(limit) : undefined
      }))
      console.log('[ParamSaver] Saved params to localStorage:', { subreddit, keywords, timeRange })
    }
  }, [searchParams])

  return null
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
      <div className="border-b border-border/30 h-14 bg-white/80 backdrop-blur-sm" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <Skeleton className="h-10 w-64 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
        <DashboardNav />
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <AuthRequiredNotice
            title="Sign in to run a Reddit analysis"
            description="Your dashboard turns a subreddit, keywords, and time range into an AI-powered community insight report. Create a free account to start your first analysis."
            bullets={[
              'Review AI-suggested search parameters before analysis',
              'Analyze public subreddit discussions by keywords and time range',
              'Generate sentiment, theme, keyword, quote, and recommendation summaries',
              'Track credits and active analyses in one workspace',
            ]}
            returnTo="/dashboard"
          />
        </main>
      </div>
    )
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
      <Suspense fallback={null}>
        <ParamSaver />
      </Suspense>
      <DashboardNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
