'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  ThumbsUp, 
  Clock,
  ExternalLink,
  Share2,
  RefreshCw,
  Download
} from 'lucide-react'
import { toast } from 'sonner';
    import RingChart from '@/components/ui/RingChart'
  import VerifiedLink from '@/components/ui/VerifiedLink'
  import type { ComprehensiveAnalysis } from '@/lib/ai/sentiment'

interface Post {
  id: string
  reddit_id: string
  title: string
  content: string | null
  author: string | null
  score: number
  num_comments: number
  url: string
  created_utc: string
  sentiment_score: number | null
  sentiment_label: 'positive' | 'negative' | 'neutral' | null
  keywords: string[] | null
}

interface KeyQuote {
  post_id: string;
  author: string;
  text: string;
  context: string;
}

interface ActionRecommendation {
  post_id: string;
  action: 'reply' | 'suggest' | 'ignore' | 'moderate' | 'escalate';
  reason: string;
  priority: 'low' | 'medium' | 'high';
  timing: 'immediate' | 'short-term' | 'long-term';
}

interface ReportDetail {
  id: string
  subreddit: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at: string | null
  pmf_score?: number // Product Market Fit score
  posts: Post[]
  summary: {
    total_posts: number
    avg_sentiment: number
    positive_count: number
    negative_count: number
    neutral_count: number
    top_keywords: string[]
  }
  discussion_summary?: string[]
  key_quotes?: KeyQuote[]
  avg_influence_score?: number
  action_recommendations?: ActionRecommendation[]
}

// Mock data for development
const mockReportDetail: ReportDetail = {
  id: '1',
  subreddit: 'programming',
  status: 'completed',
  created_at: new Date(Date.now() - 86400000).toISOString(),
  completed_at: new Date(Date.now() - 86400000 + 300000).toISOString(),
  posts: [
    {
      id: '1',
      reddit_id: 'abc123',
      title: 'What are your thoughts on the new TypeScript 5.0 features?',
      content: 'Just read about the new decorators and...',
      author: 'developer_jane',
      score: 1247,
      num_comments: 342,
      url: 'https://reddit.com/r/programming/comments/abc123',
      created_utc: new Date(Date.now() - 3600000).toISOString(),
      sentiment_score: 0.75,
      sentiment_label: 'positive',
      keywords: ['typescript', 'features', 'decorators', 'programming'],
    },
    {
      id: '2',
      reddit_id: 'def456',
      title: 'Why I switched from VS Code to Neovim',
      content: 'After 5 years of VS Code...',
      author: 'vim_enthusiast',
      score: 892,
      num_comments: 156,
      url: 'https://reddit.com/r/programming/comments/def456',
      created_utc: new Date(Date.now() - 7200000).toISOString(),
      sentiment_score: 0.45,
      sentiment_label: 'neutral',
      keywords: ['neovim', 'vscode', 'editor', 'configuration'],
    },
    {
      id: '3',
      reddit_id: 'ghi789',
      title: 'Frustrated with legacy code at work',
      content: 'Been dealing with this 10-year old codebase...',
      author: 'stressed_dev',
      score: 534,
      num_comments: 89,
      url: 'https://reddit.com/r/programming/comments/ghi789',
      created_utc: new Date(Date.now() - 10800000).toISOString(),
      sentiment_score: -0.35,
      sentiment_label: 'negative',
      keywords: ['legacy', 'code', 'frustration', 'work'],
    },
  ],
  summary: {
    total_posts: 25,
    avg_sentiment: 0.42,
    positive_count: 15,
    negative_count: 5,
    neutral_count: 5,
    top_keywords: ['typescript', 'react', 'programming', 'career', 'learning'],
  },
  discussion_summary: [
    'Active engagement on product features',
    'Mixed feedback on user experience aspects', 
    'Positive sentiment around customer support',
    'Concerns raised about pricing model',
    'Feature requests for integration capabilities'
  ],
  key_quotes: [
    {
      post_id: 'abc123',
      author: 'developer_jane',
      text: "The new decorator features in TypeScript 5.0 could revolutionize how we handle dependency injection...",
      context: 'Discussion about TypeScript improvements'
    },
    {
      post_id: 'def456',
      author: 'vim_enthusiast',
      text: "After months of fighting with VS Code performance, the switch to Neovim was a breath of fresh air.",
      context: 'Editor configuration thread'
    }
  ],
  avg_influence_score: 0.63,
  action_recommendations: [
    {
      post_id: 'abc123',
      action: 'suggest',
      reason: 'Highly engaged positive discussion about core product features',
      priority: 'medium',
      timing: 'short-term'
    },
    {
      post_id: 'ghi789',
      action: 'reply',
      reason: 'Negative sentiment about development friction needs addressing',
      priority: 'high',
      timing: 'immediate'
    }
  ]
}

const sentimentColors = {
  positive: 'bg-green-500/10 text-green-600 border-green-500/20',
  negative: 'bg-red-500/10 text-red-600 border-red-500/20',
  neutral: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
}

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>()
  const { profile, session } = useAuth()
  const [report, setReport] = useState<ReportDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Fetch report data by ID via backend API (not direct Supabase)
  useEffect(() => {
    let cancelled = false

    const fetchReport = async () => {
      try {
        const token = session?.access_token
        if (!token) {
          if (!cancelled) setIsLoading(false)
          return
        }

        const res = await fetch("/api/reports/" + params.id, {
          headers: { Authorization: "Bearer " + token },
        })

        if (!res.ok) {
          if (!cancelled) {
            console.error("Error fetching report:", res.status)
            setIsLoading(false)
          }
          return
        }

        const json = await res.json()
        if (cancelled) return

        if (json.success && json.report) {
          const r = json.report
          const meta = r.metadata || {}
          const transformed: ReportDetail = {
            id: meta.id || params.id,
            subreddit: meta.subreddit || r.subreddit || "unknown",
            status: meta.status || r.status || "completed",
            created_at: meta.createdAt || meta.created_at || new Date().toISOString(),
            completed_at: meta.completedAt || r.completedAt || r.completed_at || null,
            pmf_score: typeof r.pmfScore === "number" ? r.pmfScore : undefined,
            posts: (r.topPosts || []).map((p: any) => ({
              id: p.id || "",
              reddit_id: p.redditId || "",
              title: p.title || "",
              content: p.content || null,
              author: p.author || null,
              score: p.upvotes || p.score || p.upVotes || 0,
              num_comments: p.comments_count || p.num_comments || p.commentsCount || p.numComments || 0,
              url: p.url || "",
              created_utc: (() => { const dateKeys = ['postedAt', 'posted_at', 'createdUtc', 'created_utc', 'createdAt', 'created_at', 'date', 'timestamp', 'publishedAt']; for (const k of dateKeys) { if (p[k] && !isNaN(new Date(p[k]).getTime())) return new Date(p[k]).toISOString(); } for (const k of Object.keys(p)) { const v = p[k]; if (typeof v === 'string' || typeof v === 'number') { const d = new Date(v); if (!isNaN(d.getTime()) && d.getFullYear() > 2000) return d.toISOString(); } } return new Date().toISOString(); })(),
              sentiment_score: p.sentimentScore || null,
              sentiment_label: p.sentiment || null,
              keywords: p.keywords || null,
            })),
            summary: {
              total_posts: r.totalCount || (r.topPosts && r.topPosts.length) || 0,
              avg_sentiment: r.avgSentimentScore || 0,
              positive_count: r.positiveSentimentCount || 0,
              negative_count: r.negativeSentimentCount || 0,
              neutral_count: r.neutralSentimentCount || 0,
              top_keywords: meta.keywords || r.keyTopics || [],
            },
            discussion_summary: r.discussionSummary || [],
            key_quotes: (r.keyQuotes || []).map((q: any) => ({
              post_id: q.post_id || "",
              author: q.author || "",
              text: q.text || q.quote || "",
              context: q.context || "",
            })),
            avg_influence_score: typeof r.avgInfluenceScore === "number" ? r.avgInfluenceScore : undefined,
            action_recommendations: Array.isArray(r.actionRecommendations) ? r.actionRecommendations : [],

          }
          setReport(transformed)
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Unexpected error:", err)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    if (params.id) {
      fetchReport()
    }
  }, [params.id, session?.access_token])
  // Function to trigger AI analysis
  const triggerAnalysis = async () => {
    if (!report?.id) return;
    
    setIsAnalyzing(true);
    try {
      // Use token from AuthContext (not direct Supabase call)
      const token = session?.access_token;
      
      if (!token) {
        throw new Error("Authentication required");
      }
      
      const response = await fetch("/api/reports/" + report.id + "/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });
      
      if (!response.ok) {
        throw new Error("HTTP error: " + response.status);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error("Analysis failed");
      }
      
      setReport(prev => prev ? {...prev, 
        discussion_summary: result.analysis.discussionSummary.mainPoints,
        key_quotes: result.analysis.keyQuotes,
        avg_influence_score: result.analysis.avgInfluenceScore,
        action_recommendations: result.analysis.actionRecommendations,
        pmf_score: result.analysis.sentimentBreakdown?.positive 
          ? (result.analysis.sentimentBreakdown.positive / result.analysis.sentimentBreakdown.totalPosts) * 100 
          : prev.pmf_score
      } : null);
    } catch (error) {
      console.error("Error triggering analysis:", error);
      alert("Failed to trigger AI analysis: " + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export report as HTML
  const handleExportPDF = async () => {
    if (!report?.id) return;
    const token = session?.access_token;
    if (!token) {
      alert('Please log in to export reports');
      return;
    }
    try {
      const resp = await fetch('/api/reports/' + report.id + '/export', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Export failed');
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reddiginsight-' + report.subreddit + '-' + report.id + '.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + (error as Error).message);
    }
  };
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Report not found</h2>
        <Link href="/reports">
          <Button className="mt-4">Back to Reports</Button>
        </Link>
      </div>
    )
  }

  const sentimentPercentage = ((report.summary.avg_sentiment + 1) / 2) * 100

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">r/{report.subreddit}</h1>
            <p className="text-muted-foreground mt-1">
              Generated by AI on {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExportPDF()}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          
          <Button variant="outline" size="sm" onClick={async () => {
            const url = window.location.href;
            try {
              await navigator.clipboard.writeText(url);
              toast.success("Link copied to clipboard!");
            } catch {
              toast.error("Failed to copy link");
            }
          }}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* New Section: AI Analysis Results */}
      {(report.discussion_summary || report.key_quotes || report.avg_influence_score || report.action_recommendations) && (
        <div className="space-y-8">
          {/* Discussion Summary Card */}
          {report.discussion_summary && report.discussion_summary.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Discussion Summary</CardTitle>
                <CardDescription>Key insights from the analyzed discussions</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.discussion_summary.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 mt-1 text-green-500">&#x2713;</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {report.key_quotes && report.key_quotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Quotes</CardTitle>
                <CardDescription>Representative comments from the community</CardDescription>
                <CardDescription className="text-xs mt-1">Representative comments selected by AI based on their relevance and impact within the community discussion.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.key_quotes.map((quote, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-1">
                      <blockquote className="text-sm italic">
                        "{quote.text}"
                      </blockquote>
                      &#x2014; {quote.author} ({quote.context})
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Influence Score */}
          {report.avg_influence_score !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle>Influence Score</CardTitle>
                <CardDescription>Overall impact factor of the discussions</CardDescription>
                <CardDescription className="text-xs mt-1">Overall engagement level of the discussions (1-10 scale). Higher scores indicate more active, influential conversations with greater community participation.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-4 mr-4">
                    <div 
                      className="bg-blue-600 h-4 rounded-full"
                      style={{ width: `${report.avg_influence_score * 10}%` }}
                    ></div>
                  </div>
                  <span className="text-lg font-semibold">{(report.avg_influence_score ?? 0).toFixed(1)} / 10</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Recommendations */}
          {report.action_recommendations && report.action_recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Action Recommendations</CardTitle>
                <p className="text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-md p-2 mt-1 mb-2">
                  <strong>Disclaimer:</strong> These action suggestions are generated by AI for informational purposes only. ReddigInsight does not guarantee the accuracy or effectiveness of these recommendations. Users are solely responsible for their own business decisions and actions. ReddigInsight assumes no liability for any outcomes resulting from the use of these suggestions.
                </p>
                <CardDescription>Suggested responses based on analysis</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-3">
                   {report.action_recommendations.map((item: any, index: number) => {
                     const text = typeof item === "string" ? item : (item.reason || item.action || "");
                     return (
                       <div key={index} className="border rounded-lg p-4">
                         <div className="flex gap-3 items-start">
                           <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                             {index + 1}
                           </span>
                           <p className="text-sm text-muted-foreground">{text}</p>
                         </div>
                       </div>
                     );
                   })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {/* End AI Analysis Results */}

      {/* PMF Score Visualization */}
      {report.pmf_score !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle>Product Market Fit (PMF) Score</CardTitle>
            <CardDescription>1-10 scale, assessed by AI. Based on how strongly the community discussion indicates demand for a solution. 10 = users are urgently seeking a solution, 1 = no detectable interest.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <RingChart 
                data={[
                  { 
                    name: 'PMF Score', 
                    value: report.pmf_score, 
                    color: (report.pmf_score ?? 0) >= 7 ? '#10b981' : (report.pmf_score ?? 0) >= 5 ? '#f59e0b' : '#ef4444' 
                  },
                  { 
                    name: 'Remaining', 
                    value: 10 - (report.pmf_score ?? 0), 
                    color: '#e5e7eb' 
                  }
                ]}
                size="large"
              />
              <p className="mt-4 text-sm text-muted-foreground text-center">
                {(report.pmf_score ?? 0) >= 7 
                  ? 'Strong Product-Market Fit: Customers love your product!' 
                  : (report.pmf_score ?? 0) >= 5 
                  ? 'Moderate Product-Market Fit: Potential for growth' 
                  : 'Low Product-Market Fit: Consider pivoting or feature adjustments'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Posts Analyzed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.summary.total_posts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Sentiment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">
                {(report.summary.avg_sentiment * 100).toFixed(0)}%
              </div>
              {report.summary.avg_sentiment > 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sentiment Breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-red-500/10 text-red-600">
                -{report.summary.negative_count} Negative
              </Badge>
              <Badge className="bg-gray-500/10 text-gray-600">
                {report.summary.neutral_count} Neutral
              </Badge>
              <Badge className="bg-green-500/10 text-green-600">
                +{report.summary.positive_count} Positive
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top Keywords</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {report.summary.top_keywords.slice(0, 10).map((keyword) => (
                <Badge key={keyword} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Sentiment Distribution</CardTitle>
          <CardDescription>Overall sentiment analysis of posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Negative {report.summary.total_posts > 0 ? ((report.summary.negative_count / report.summary.total_posts) * 100).toFixed(0) + "%" : "0%"}</span>
              <span>Neutral {report.summary.total_posts > 0 ? ((report.summary.neutral_count / report.summary.total_posts) * 100).toFixed(0) + "%" : "0%"}</span>
              <span>Positive {report.summary.total_posts > 0 ? ((report.summary.positive_count / report.summary.total_posts) * 100).toFixed(0) + "%" : "0%"}</span>
            </div>
            <div className="h-4 rounded-full bg-gray-200 overflow-hidden flex">
              <div 
                className="bg-red-500 h-full"
                style={{ width: `${(report.summary.negative_count / report.summary.total_posts) * 100}%` }}
              />
              <div 
                className="bg-gray-400 h-full"
                style={{ width: `${(report.summary.neutral_count / report.summary.total_posts) * 100}%` }}
              />
              <div 
                className="bg-green-500 h-full"
                style={{ width: `${(report.summary.positive_count / report.summary.total_posts) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Posts</CardTitle>
          <CardDescription>Most engaged posts from r/{report.subreddit}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.posts.slice(0, 10).map((post) => (
              <div key={post.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-medium line-clamp-2">{post.title}</h3>
                  <VerifiedLink 
                    href={post.url} 
                    className="flex-shrink-0"
                    isVerified={true}
                    sourceType="reddit"
                  >
                    Link
                  </VerifiedLink>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {post.score.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {post.num_comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {(post.created_utc ? (() => { try { const d = new Date(post.created_utc); if (isNaN(d.getTime())) throw new Error(); return d.toLocaleDateString(); } catch { return 'N/A'; } })() : 'N/A')}
                  </span>
                  {post.sentiment_label && (
                    <Badge className={sentimentColors[post.sentiment_label]}>
                      {post.sentiment_label}
                    </Badge>
                  )}
                </div>
                {post.keywords && post.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {post.keywords.map((keyword) => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
