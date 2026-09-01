import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardList,
  FileText,
  LineChart,
  Mail,
  MessageSquare,
  Quote,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import { DashboardNav } from '@/components/DashboardNav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const workflow = [
  {
    icon: MessageSquare,
    title: 'Clarify the research question',
    description:
      'Use AI Chat to describe your product idea, market, or customer question. The assistant suggests a subreddit, keywords, time range, and post limit to search.',
  },
  {
    icon: ClipboardList,
    title: 'Run the subreddit analysis',
    description:
      'Review and adjust the inputs on the Dashboard, then start the analysis. Free accounts can analyze up to 100 posts; paid plans can analyze up to 300 posts per report.',
  },
  {
    icon: FileText,
    title: 'Read and export the report',
    description:
      'Open the finished report to review sentiment, themes, keywords, quotes, indicators, and action recommendations. Export completed reports as HTML for collaboration.',
  },
]

const capabilities = [
  {
    icon: Search,
    title: 'AI-guided search setup',
    description:
      'Turn a broad research question into subreddit search parameters before spending a report credit.',
  },
  {
    icon: BarChart3,
    title: 'Sentiment and themes',
    description:
      'Summarize the emotional tone and recurring discussion themes across collected public posts.',
  },
  {
    icon: LineChart,
    title: 'Trends and keywords',
    description:
      'Identify frequently discussed keywords and topics from the selected subreddit and time range.',
  },
  {
    icon: Quote,
    title: 'Key quotes and context',
    description:
      'Review representative community quotes alongside the analysis instead of relying on isolated comments.',
  },
  {
    icon: Brain,
    title: 'Research indicators',
    description:
      'Use product-market-fit and influence indicators as structured inputs for further research and discussion.',
  },
  {
    icon: Sparkles,
    title: 'Action recommendations',
    description:
      'Receive practical next steps you can compare against your product, marketing, or research hypotheses.',
  },
]

const audiences = [
  {
    title: 'Founders',
    description: 'Explore demand signals, pain points, and language used by potential customers in relevant communities.',
  },
  {
    title: 'Product teams',
    description: 'Summarize recurring user needs and prioritize questions for customer discovery.',
  },
  {
    title: 'Marketers',
    description: 'Validate messaging themes and identify community language before launching a campaign.',
  },
  {
    title: 'Researchers',
    description: 'Organize public subreddit discussions into a structured report for qualitative analysis.',
  },
]

const reportSections = [
  'Discussion summary',
  'Community sentiment',
  'Key themes and keywords',
  'Representative quotes',
  'PMF and influence indicators',
  'Action recommendations',
]

const practicalFacts = [
  '1 free credit for your first report',
  'No LLM API key required',
  'One credit generates one report',
  'No Reddit API key required',
  'Export completed reports to HTML',
  'Email support',
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
      <DashboardNav />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <Badge variant="secondary" className="mb-6 rounded-full bg-white/80 px-4 py-2 shadow-lg backdrop-blur-sm">
                <Sparkles className="mr-2 h-4 w-4 text-indigo-600" aria-hidden="true" />
                AI-Powered Reddit Research
              </Badge>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Turn public Reddit discussions into{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  actionable insight reports
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                ReddigInsight helps you define a research question, analyze relevant public subreddit posts, and turn
                the results into a structured report with sentiment, themes, keywords, quotes, indicators, and
                recommendations.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    Create Free Account
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link href="/how-to-use">
                  <Button size="lg" variant="outline" className="gap-2">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    How to Use
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Start with 1 free credit for 1 analysis report now.
              </p>
            </div>

          </div>
        </div>
      </section>

      <section className="bg-white/70 py-16 shadow-inner dark:bg-gray-900/50 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">How ReddigInsight works</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              The workflow moves from research setup to analysis and then to a report you can share with collaborators.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {workflow.map((step, index) => {
              const Icon = step.icon
              return (
                <Card key={step.title} className="border-border/40 bg-background/80 shadow-lg">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <Icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <div className="mt-8 text-center">
            <Link href="/how-to-use" className="group inline-flex items-center gap-2 font-medium text-indigo-600">
              Read the step-by-step guide
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">What the analysis includes</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              ReddigInsight organizes collected public posts into sections designed for product, marketing, and
              qualitative research use.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability) => {
              const Icon = capability.icon
              return (
                <Card key={capability.title} className="border-border/40 bg-white/90 shadow-lg backdrop-blur dark:bg-gray-900/90">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500">
                      <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{capability.title}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{capability.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-white/70 py-16 shadow-inner dark:bg-gray-900/50 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <h2 className="text-3xl font-bold sm:text-4xl">Built for evidence-driven research</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Use ReddigInsight when you need more than a quick keyword search: collect relevant public posts, review
                AI-generated summaries, and translate community signals into next steps you can test.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {practicalFacts.map((fact) => (
                  <div key={fact} className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/70 p-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                    <span className="text-sm leading-relaxed">{fact}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="border-border/40 bg-white/90 shadow-lg backdrop-blur dark:bg-gray-900/90">
              <CardHeader>
                <CardTitle>What is in a report?</CardTitle>
                <CardDescription>
                  Each completed report is saved to your account and can be exported as HTML.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportSections.map((section) => (
                  <div key={section} className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                    <span className="text-sm">{section}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500">
              <Users className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">Who can use it</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              ReddigInsight is designed for people who need to understand community conversations quickly and structure
              them for team decisions.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {audiences.map((audience) => (
              <Card key={audience.title} className="border-border/40 bg-white/90 shadow-lg backdrop-blur dark:bg-gray-900/90">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold">{audience.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{audience.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-indigo-600 to-purple-600 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">Start your first Reddit research report</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-indigo-100">
            Create a free account to try the workflow with one report credit. Upgrade when you need monthly reports with
            a higher post-analysis limit.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
                Create Free Account
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-indigo-100">Subscription prices are shown before checkout and exclude tax.</p>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Card className="border-border/30 bg-white shadow-sm dark:bg-gray-800">
            <CardContent className="p-8 text-center sm:p-10">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <Mail className="h-7 w-7 text-indigo-600" aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold">Contact and support</h2>
              <p className="mx-auto mt-4 max-w-lg leading-relaxed text-muted-foreground">
                If you encounter an issue while using ReddigInsight or have suggestions for improving the service, contact
                us by email.
              </p>
              <a
                href="mailto:supports@reddiginsight.com"
                className="mt-6 inline-flex items-center gap-2 text-lg font-medium text-indigo-600 transition-colors hover:text-indigo-700"
              >
                <Mail className="h-5 w-5" aria-hidden="true" />
                supports@reddiginsight.com
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border/30 bg-white/80 py-12 backdrop-blur-sm dark:bg-gray-900/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-3">
              <Image src="/images/logo.png" alt="ReddigInsight" width={32} height={32} className="h-8 w-8" />
              <span className="text-lg font-bold">ReddigInsight</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <Link href="/how-to-use" className="transition-colors hover:text-foreground">How to Use</Link>
              <Link href="/pricing" className="transition-colors hover:text-foreground">Pricing</Link>
              <Link href="/privacy" className="transition-colors hover:text-foreground">Privacy Policy</Link>
              <Link href="/terms" className="transition-colors hover:text-foreground">Terms of Service</Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-border/20 pt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} ReddigInsight. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
