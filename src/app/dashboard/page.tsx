'use client'

import { useState, useEffect, Suspense, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle, Zap, MessageSquare, Sparkles, CheckCircle2, Info, Hash } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Report {
  id: string
  subreddit: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'timed_out'
  created_at: string
  credits_used: number
  progressPercent?: number
  statusMessage?: string
}

const mockReports: Report[] = []

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-600',
  processing: 'bg-blue-500/10 text-blue-600',
  completed: 'bg-green-500/10 text-green-600',
  failed: 'bg-red-500/10 text-red-600',
  timed_out: 'bg-amber-500/10 text-amber-600',
}

const statusIcons = {
  pending: Clock,
  processing: TrendingUp,
  completed: CheckCircle,
  failed: XCircle,
  timed_out: Clock,
}

const timeRangeOptions = [
  { value: 'day', label: 'Past 24 hours' },
  { value: 'week', label: 'Past week' },
  { value: 'month', label: 'Past month' },
  { value: 'year', label: 'Past year' },
  { value: 'all', label: 'All time' },
]

const STORAGE_KEY = 'dashboard_params'

function SearchParamsHandler({
  onParamsLoaded,
  setSubreddits,
  setKeywords,
  setTimeRange,
  setLimit,
}: {
  onParamsLoaded: (loaded: boolean) => void
  setSubreddits: (value: string) => void
  setKeywords: (value: string) => void
  setTimeRange: (value: string) => void
  setLimit: (value: number | null) => void
}) {
  const searchParams = useSearchParams()

  // Handle Creem subscription success redirect
  useEffect(() => {
    const subscription = searchParams.get("subscription");
    const checkoutId = searchParams.get("checkout_id");
    const orderId = searchParams.get("order_id");
    const productId = searchParams.get("product_id");
    if (subscription === "success" && checkoutId) {
      console.log("[Dashboard] Creem redirect detected, verifying checkout...");
      fetch("/api/creem/verify-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkout_id: checkoutId, order_id: orderId, product_id: productId }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("[Dashboard] Verify checkout result:", data);
          console.log("[Dashboard] Verify checkout debug:", data.debug);
          if (data.pending) {
            toast.success(data.message || "Payment received", {
              description: "Your credits will appear in a few seconds.",
              duration: 5000,
            });
          } else if (data.success) {
            toast.success(data.message || "Payment verified", {
              description: data.alreadyProcessed
                ? "Credits were already added (" + (data.credits ?? 0) + " credits)"
                : "+ " + data.creditsAdded + " credits added. Total: " + data.totalCredits,
              duration: 5000,
            });
          } else {
            toast.error(data.error || "Payment verification failed", {
              description: data.details || "Please try again.",
              duration: 8000,
            });
          }
          if (window.history.replaceState) {
            window.history.replaceState({}, "", "/dashboard");
          }
          const reloadDelay = data.pending ? 4000 : 2000;
          setTimeout(() => window.location.reload(), reloadDelay);
        })
        .catch((err) => {
          console.error("[Dashboard] Verify checkout error:", err);
          toast.error("Payment verification failed", {
            description: String(err),
            duration: 8000,
          });
        });
    }
  }, [searchParams]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const params = JSON.parse(stored)
      console.log('[SearchParamsHandler] Restored params from localStorage:', params)
      setSubreddits(params.subreddit || '')
      setKeywords(params.keywords || '')
      if (params.timeRange && timeRangeOptions.some((opt) => opt.value === params.timeRange)) {
        setTimeRange(params.timeRange)
      }
      setLimit(params.limit ? Number(params.limit) : null)
      onParamsLoaded(true)
    } else {
      onParamsLoaded(false)
    }
  }, [onParamsLoaded, setSubreddits, setKeywords, setTimeRange, setLimit])

  return null
}

export default function DashboardPage() {
  const router = useRouter()
  const { profile, profileLoading, refreshProfile, session } = useAuth()
  const [subreddits, setSubreddits] = useState('')
  const [keywords, setKeywords] = useState('')
  const [timeRange, setTimeRange] = useState('month')
  const [maxPosts, setMaxPosts] = useState<number | null>(null)
  const [searchSort, setSearchSort] = useState('relevance')
  const [isLoading, setIsLoading] = useState(false)
  const [reports, setReports] = useState<Report[]>(mockReports)
  const [paramsLoaded, setParamsLoaded] = useState(false)

  const handleParamsLoaded = useCallback((loaded: boolean) => {
    setParamsLoaded(loaded)
  }, [])
  // Fetch reports on mount and resume polling for active ones
  useEffect(() => {
    if (!session?.access_token) return;
    fetch('/api/reports', { headers: { Authorization: 'Bearer ' + session.access_token } })
      .then(res => res.json())
      .then(data => {
        if (data.reports && Array.isArray(data.reports)) {
          setReports((prev: any) => { const serverIds = new Set(data.reports.map((r: any) => r.id)); const localOnly = prev.filter((r: any) => !serverIds.has(r.id)); return [...data.reports.map((r: any) => ({ ...r, status: r.status || 'completed', progressPercent: r.progressPercent ?? (r.status === 'completed' ? 100 : 0) })), ...localOnly]; });
          data.reports.forEach((r: any) => {
            if (r.status === 'pending' || r.status === 'processing') pollReportStatus(r.id);
          });
        }
      })
      .catch(() => {});
  }, [session?.access_token]);

  const pollReportStatus = async (reportId: string) => {
    const startTime = Date.now()
    console.log('[DEBUG poll] starting for reportId:', reportId); const poll = async () => {
      if (Date.now() - startTime > 15 * 60 * 1000) {
        setReports((prev: any) => prev.map((r: any) => r.id === reportId ? { ...r, status: 'timed_out' } : r))
        return
      }
      try {
        const token = session?.access_token
        if (!token) { setTimeout(poll, 3000); return }
        const res = await fetch('/api/reports/' + reportId + '/progress', {
          headers: { 'Authorization': 'Bearer ' + token }
        })
        if (!res.ok) { setTimeout(poll, 3000); return }
        const data = await res.json()
        console.log('[DEBUG poll] got data:', JSON.stringify(data)); let newStatus: string = 'pending'
        const ts = data.progress && data.progress.taskStatus
        if (ts === 'done') newStatus = 'completed'
        else if (ts === 'error') newStatus = 'failed'
        else if (ts === 'crawling' || ts === 'fetching_results' || ts === 'analyzing' || ts === 'initializing') newStatus = 'processing'
        console.log('[DEBUG poll] updating status to:', newStatus, 'progress:', data.progress && data.progress.progressPercent); setReports((prev: any) => prev.map((r: any) => r.id === reportId ? { ...r, status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : r.completed_at, statusMessage: (data.progress && data.progress.message) || r.statusMessage, progressPercent: (data.progress && data.progress.progressPercent) != null ? data.progress.progressPercent : r.progressPercent } : r))
        if (newStatus === 'completed' || newStatus === 'failed') return
      } catch (e) { console.warn('poll error:', e) }
      setTimeout(poll, 3000)
    }
    poll()
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subreddits.trim() || !keywords.trim()) return
    
    if ((profile?.credits ?? 0) < 1) {
      router.push('/pricing')
      return
    }

    setIsLoading(true)
setIsLoading(true)
    
    try {
      // Get Supabase auth token
      const token = session?.access_token
      
      if (!token) {
        throw new Error('Authentication required')
      }
      
      // Call local API Route (HTTPS)
      // Vercel serverless will forward to backend (HTTP)
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          subreddit: subreddits.split(',').map(s => s.trim().replace(/^r\//, ''))[0],
          keywords: keywords.split(',').map(k => k.trim()).slice(0, 5),
          timeframe: timeRange,
          searchSort: searchSort
        }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }
      
      const data = await response.json()
      
      console.log('[DEBUG] POST response:', JSON.stringify(data)); if (data.reportId) {
        setReports(prev => [{
          id: data.reportId,
          subreddit: subreddits.split(',')[0].replace(/^r\//, ''),
          status: data.status as 'pending' | 'processing' | 'completed',
          created_at: new Date().toISOString(),
          credits_used: 1,
        }, ...prev])
        console.log('[DEBUG] calling pollReportStatus for:', data.reportId); pollReportStatus(data.reportId)
        setSubreddits('')
        setKeywords('')
        setParamsLoaded(false)
        refreshProfile()
      }
    } catch (error) {
      console.error('Error creating report:', error)
    } finally {
      setIsLoading(false)
    }
  }

  console.log('[DEBUG render] reports:', reports.length, 'hasActiveCrawl:', reports.some((r: any) => r.status === 'pending' || r.status === 'processing'));   const getDisplayMessage = (msg: string | undefined) => {
    if (!msg) return "";
    return msg.replace(/Apify/gi, 'Crawl').replace(/actor/gi, 'task').replace(/Crawlee/gi, 'Engine').replace(/EasyApi/gi, 'Service').replace(/initializing/gi, 'Initializing').replace(/fetching_results/gi, 'Fetching results');
  };

  const hasActiveCrawl = reports.some((r: any) => r.status === 'pending' || r.status === 'processing')
  const activeReport = reports.find((r: any) => r.status === 'pending' || r.status === 'processing')
  const latestCompleted = reports.filter((r: any) => r.status === 'completed').sort((a: any, b: any) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())[0];
  const [dotPhase, setDotPhase] = useState(0)
  useEffect(() => {
    if (!hasActiveCrawl) return
    const interval = setInterval(() => setDotPhase(prev => (prev + 1) % 4), 600)
    return () => clearInterval(interval)
  }, [hasActiveCrawl])

  return (
    <div className="space-y-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20 min-h-screen py-8">
      {/* Search Params Handler - wrapped in Suspense */}
      <Suspense fallback={null}>
        <SearchParamsHandler
          onParamsLoaded={handleParamsLoaded}
          setSubreddits={setSubreddits}
          setKeywords={setKeywords}
          setTimeRange={setTimeRange}
          setLimit={setMaxPosts}
        />
      </Suspense>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          Uncover Reddit Insights
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Discover valuable insights from Reddit communities
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:gap-6 grid-cols-1 sm:grid-cols-3">
        <div className="group">
          <Card data-testid="credits-card" className="bg-white/80 backdrop-blur-sm border border-border/20 shadow-xl hover:shadow-2xl transition-all duration-500 h-full group-hover:-translate-y-1">
            <div className="pt-4 pl-5 pr-5 pb-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <BarChart3 className="h-4 w-4" />
                </div>
              </div>
              <CardContent className="p-0">
                <div data-testid="credits-value" className="text-3xl font-bold text-primary">
                  {profileLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    profile?.credits ?? 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {profileLoading ? 'Loading credits...' : ((profile?.credits ?? 0) > 0 ? 'Ready to analyze' : 'Buy more credits to continue')}
                </p>
              </CardContent>
            </div>
          </Card>
        </div>
        
        <div className="group">
          <Card className="bg-white/80 backdrop-blur-sm border border-border/20 shadow-xl hover:shadow-2xl transition-all duration-500 h-full group-hover:-translate-y-1">
            <div className="pt-4 pl-5 pr-5 pb-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary">
                  {reports.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Total reports</p>
              </CardContent>
            </div>
          </Card>
        </div>
        
        <div className="group">
          <Card className="bg-white/80 backdrop-blur-sm border border-border/20 shadow-xl hover:shadow-2xl transition-all duration-500 h-full group-hover:-translate-y-1">
            <div className="pt-4 pl-5 pr-5 pb-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">Processing</CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <CardContent className="p-0">
                <div className="text-3xl font-bold text-primary">
                  {reports.filter(r => r.status === 'processing' || r.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">Reports in progress</p>
              </CardContent>
            </div>
          </Card>
        </div>
      </div>

      {/* AI Chat Params Loaded Notification */}
      {paramsLoaded && (
        <div className="max-w-4xl mx-auto">
          <Alert className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/30">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="text-indigo-700">
                <strong>Parameters loaded from AI conversation.</strong> Review and click "Uncover Insights" to start analysis.
                {subreddits && <span className="ml-2 text-sm">Subreddit: <strong>{subreddits}</strong></span>}
                {keywords && <span className="ml-2 text-sm">Keywords: <strong>{keywords}</strong></span>}
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}

      {/* Main Action Area */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Chat Mode */}
        <Card className="bg-gradient-to-br from-indigo-100/50 to-purple-100/50 border border-indigo-200/30 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">AI-Guided Analysis</CardTitle>
                <CardDescription>Not sure what to search? Let AI help you find the right subreddits and keywords</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/chat">
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 text-lg">
                <MessageSquare className="h-5 w-5 mr-2" />
                Start AI Conversation
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Direct Input Mode */}
        <Card className="bg-white/80 backdrop-blur-sm border border-border/20 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Direct Input</CardTitle>
                <CardDescription>Already know what to analyze? Enter your parameters directly</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subreddit">Subreddit</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">r/</span>
                  <Input
                    id="subreddit"
                    placeholder="programming, startups, artificial"
                    value={subreddits}
                    onChange={(e) => setSubreddits(e.target.value)}
                    className="pl-8"
                    disabled={isLoading || profileLoading || hasActiveCrawl || (profile === null || profile.credits < 1)}
                  />
                </div>
                <p className="text-xs text-amber-600 font-medium flex items-center gap-1 mt-1"><span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold mr-1">!</span> Please verify this subreddit exists on <a href="https://www.reddit.com" target="_blank" rel="noopener noreferrer" className="underline text-amber-700 hover:text-amber-800">reddit.com</a> before analyzing. Non-existent subreddits will return no results and still consume 1 credit.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
<Input
                    id="keywords"
                    placeholder="AI tools, cursor, copilot"
                    value={keywords}
                    onChange={(e) => { const val = e.target.value; const parts = val.split(","); if (parts.length <= 5) setKeywords(val); }}
                    disabled={isLoading || profileLoading || hasActiveCrawl || (profile === null || profile.credits < 1)}
                  />
                <p className="text-xs text-muted-foreground">Comma-separated keywords (max 5). Multi-word phrases like &ldquo;price range&rdquo; count as one keyword.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeRange">Time Range</Label>
                <Select value={timeRange} onValueChange={(value) => value && setTimeRange(value)} disabled={isLoading || profileLoading || hasActiveCrawl || (profile === null || profile.credits < 1)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="searchSort">Search Sort</Label>
                <Select value={searchSort} onValueChange={(value) => value && setSearchSort(value)} disabled={isLoading || profileLoading || hasActiveCrawl || (profile === null || profile.credits < 1)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sort order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="comments">Comments</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  <strong>Relevance</strong> — Most relevant posts matching keywords. <strong>Hot</strong> — Currently trending posts. <strong>Top</strong> — Most upvoted posts of all time. <strong>New</strong> — Most recent posts (best with time filter). <strong>Comments</strong> — Posts with most comments.
                </p>
              </div>


              <div className="space-y-2">
                <Label htmlFor="maxPosts">Max Posts</Label>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <p className="font-medium text-sm">{maxPosts ?? (profile?.plan === 'pro' ? 300 : 100)}</p>
                </div>
                <p className="text-xs text-muted-foreground">The maximum number of posts analyzed</p>
              </div>

              
              <Button 
                type="submit" 
                disabled={isLoading || profileLoading || hasActiveCrawl || !subreddits.trim() || !keywords.trim() || (profile === null || profile.credits < 1)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6"
              >
                {isLoading || hasActiveCrawl ? 'Analyzing...' : profileLoading ? 'Loading...' : 'Uncover Insights (1 credit)'}
              </Button>
            </form>
            
            {!profileLoading && profile !== null && profile.credits < 1 && (
              <p className="text-sm text-muted-foreground mt-4 flex items-center">
                <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                You need credits to analyze.{' '}
                <Link href="/pricing" className="ml-1 text-primary hover:underline font-medium">
                  Buy credits
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card className="bg-white/80 backdrop-blur-sm border border-border/20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Recent Reports</CardTitle>
          <CardDescription>Your latest Reddit analyses</CardDescription>
        </CardHeader>
        <CardContent>
          {hasActiveCrawl && activeReport && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600 animate-pulse" />
                  <span className="text-sm font-medium text-indigo-700">Analyzing r/{activeReport.subreddit}</span>
                </div>
                <span className="text-sm font-bold text-indigo-600">{activeReport.progressPercent ?? 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-indigo-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-in-out" style={{ width: (activeReport.progressPercent ?? 0) + "%" }} />
              </div>
              <p className="text-xs text-indigo-500 mt-2 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                {getDisplayMessage(activeReport.statusMessage) || "Processing"}{activeReport.status === "processing" && dotPhase > 0 && <span>{".".repeat(dotPhase)}</span>}
              </p>
            </div>
          )}

          {reports.filter(r => r.status === 'pending' || r.status === 'processing').length === 0 && !latestCompleted ? (
            <div className="text-center py-10 text-muted-foreground">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-indigo-400" />
              </div>
              <p>No reports processing now.</p>
              <p className="mt-2">Start by analyzing a subreddit above!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(reports.filter(r => r.status === 'pending' || r.status === 'processing').length > 0 ? reports.filter(r => r.status === 'pending' || r.status === 'processing') : (latestCompleted ? [latestCompleted] : [])).map((report) => {
                const StatusIcon = statusIcons[report.status]
                return (
                  <div key={report.id} className="p-4 rounded-xl border border-border/30 hover:bg-gradient-to-r from-indigo-50/50 to-purple-50/50 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">r/{report.subreddit}</span>
                        <Badge className={statusColors[report.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {report.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                        {report.status === 'completed' && (
                          <Link href={`/reports/${report.id}`}>
                            <Button variant="outline" size="sm">View Report</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
