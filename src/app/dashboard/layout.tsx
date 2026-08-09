'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
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
    <div className="min-h-screen bg-background">
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
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
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