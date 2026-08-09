'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Clock, CheckCircle, XCircle, TrendingUp, Search } from 'lucide-react'

interface Report {
  id: string
  subreddit: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'timed_out'
  created_at: string
  completed_at: string | null
  credits_used: number
  error_message?: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-600 border-green-500/20',
  failed: 'bg-red-500/10 text-red-600 border-red-500/20',
  timed_out: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: TrendingUp,
  completed: CheckCircle,
  failed: XCircle,
  timed_out: XCircle,
}

function mapBackendReport(r: any): Report {
  const metadata = r.metadata || r
  return {
    id: metadata.id || r.id,
    subreddit: metadata.subreddit || r.subreddit || 'unknown',
    status: metadata.status || r.status || 'pending',
    created_at: metadata.createdAt || r.created_at || new Date().toISOString(),
    completed_at: metadata.completedAt || r.completed_at || null,
    credits_used: metadata.creditsUsed || r.credits_used || 0,
    error_message: metadata.errorMessage || metadata.error || r.error_message || undefined,
  }
}

export default function ReportsPage() {
  const { session } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  console.log('[ReportsPage] MOUNT'); const cachedReportsRef = useRef<Report[] | null>(null)

  useEffect(() => {
    const token = session?.access_token
    if (!token) {
      // Show cached data while waiting for token
      if (cachedReportsRef.current) {
        setReports(cachedReportsRef.current)
        setFilteredReports(cachedReportsRef.current)
      }
      setIsLoading(false)
      return
    }

    let cancelled = false

    const doFetch = async () => {
      try {
        console.log("[ReportsPage] fetch start"); const res = await fetch("/api/reports", {
          headers: { Authorization: "Bearer " + token },
        })
        if (cancelled) return

        console.log("[ReportsPage] fetch response status=" + res.status); if (!res.ok) {
          if (res.status !== 401) console.error("Failed to fetch reports:", res.status)
          return
        }

        const data = await res.json()
        if (cancelled) return

        if (data.success && Array.isArray(data.reports)) {
          const mapped = data.reports.map(mapBackendReport)
          console.log("[ReportsPage] fetch success, " + mapped.length + " reports"); cachedReportsRef.current = mapped
          setReports(mapped)
          setFilteredReports(mapped)
        }
      } catch (err: any) {
        if (!cancelled) console.error("Reports fetch error:", err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    doFetch()
    return () => { console.log('[ReportsPage] UNMOUNT (cleanup)'); cancelled = true }
  }, [session?.access_token])

  useEffect(() => {
    if (searchQuery) {
      setFilteredReports(
        reports.filter((r) =>
          r.subreddit.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredReports(reports)
    }
  }, [searchQuery, reports])

  const groupedReports = {
    active: filteredReports.filter((r) => r.status === 'pending' || r.status === 'processing'),
    completed: filteredReports.filter((r) => r.status === 'completed'),
    failed: filteredReports.filter((r) => r.status === 'failed' || r.status === 'timed_out'),
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your subreddit analysis reports
          </p>
        </div>
        <Link href="/dashboard">
          <Button>Create New Report</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by subreddit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading reports...
          </CardContent>
        </Card>
      )}

      {/* Completed Reports */}
      {!isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Completed
            </CardTitle>
            <CardDescription>
              {groupedReports.completed.length} report(s) ready to view
            </CardDescription>
          </CardHeader>
          <CardContent>
            {groupedReports.completed.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No completed reports yet
              </div>
            ) : (
              <div className="space-y-3">
                {groupedReports.completed.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-medium">r/{report.subreddit}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Link href={`/reports/${report.id}`}>
                      <Button variant="outline" size="sm">
                        View Report
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {/* Active Reports */}
      {!isLoading && groupedReports.active.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Processing
            </CardTitle>
            <CardDescription>
              Reports currently being generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupedReports.active.map((report) => {
                const StatusIcon = statusIcons[report.status]
                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-medium">r/{report.subreddit}</span>
                      <Badge className={statusColors[report.status] || statusColors.pending}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {report.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Failed Reports */}
      {!isLoading && groupedReports.failed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Failed
            </CardTitle>
            <CardDescription>
              Reports that encountered errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupedReports.failed.map((report) => (
                <div
                  key={report.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">r/{report.subreddit}</span>
                      <Badge className={statusColors[report.status] || statusColors.failed}>
                        <XCircle className="h-3 w-3 mr-1" />
                        {report.status}
                      </Badge>
                    </div>
                    {report.error_message && (
                      <span className="text-sm text-red-600">
                        {report.error_message}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground mt-2 sm:mt-0">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
