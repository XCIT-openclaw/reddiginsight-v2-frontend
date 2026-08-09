import Link from 'next/link'
import { DashboardNav } from '@/components/DashboardNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Mail,
  Search,
  Brain
} from 'lucide-react'

const features = [
  {
    icon: BarChart3,
    title: 'Sentiment Analysis',
    description: 'Understand the emotional tone of any subreddit with AI-powered sentiment scoring.',
  },
  {
    icon: TrendingUp,
    title: 'Trend Detection',
    description: 'Identify trending topics and emerging discussions before they go viral.',
  },
  {
    icon: MessageSquare,
    title: 'Keyword Extraction',
    description: 'Automatically extract the most relevant keywords and topics from posts.',
  },
  {
    icon: Brain,
    title: 'AI Insights',
    description: 'Get actionable insights powered by advanced language models.',
  },
]

const benefits = [
  'Analyze any public subreddit in seconds',
  'Export reports to HTML for sharing',
  'No Reddit API key required',
  'Pay only for what you use',
  'GDPR compliant data handling',
  '24/7 support available',
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20">
      <DashboardNav />

      {/* Hero Section */}
      <section className="relative overflow-visible py-20">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-indigo-500/10 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-border/20">
              <Zap className="h-4 w-4 mr-2 text-indigo-600" />
              AI-Powered Reddit Analysis
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6">
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 leading-tight py-1">
                Understand Any Subreddit
              </span>
              <span className="block text-3xl sm:text-4xl lg:text-5xl text-foreground mt-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 leading-tight py-1">
                In Seconds
              </span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Unlock valuable insights from Reddit communities. Analyze sentiment, discover trends,
              and extract key topics with our ultra-fast <span className="font-semibold text-indigo-600">AI-powered</span> platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="group">
                <Button size="lg" className="rounded-full px-8 py-6 text-lg gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform group-hover:scale-105 shadow-lg group-hover:shadow-indigo-500/25">
                  Start Free Analysis
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#features" className="group">
                <Button variant="ghost" size="lg" className="rounded-full px-8 py-6 text-lg border-2 border-indigo-200/30 hover:bg-indigo-500/10 text-indigo-700 hover:text-indigo-900 transition-all duration-300 transform group-hover:scale-105 dark:border-indigo-500/30 dark:hover:bg-indigo-500/5 dark:text-violet-200 dark:hover:text-violet-50">
                  Learn More
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              1 free credit included – No credit card required – <span className="text-green-600 font-medium">Instant access</span></p>
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <section className="py-20 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-gray-800/20 dark:to-indigo-900/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-20"></div>
            <Card className="overflow-hidden shadow-xl relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/90 dark:to-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                      <Search className="h-5 w-5 text-indigo-200" />
                    </div>
                    <span className="text-lg sm:text-xl font-medium">Analyzing r/programming</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-lg transition-transform hover:scale-105">
                      <div className="text-3xl sm:text-4xl font-bold text-white mb-1">2,847</div>
                      <div className="text-indigo-200 text-sm">Posts Analyzed</div>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-lg transition-transform hover:scale-105">
                      <div className="text-3xl sm:text-4xl font-bold text-green-300 mb-1">+68%</div>
                      <div className="text-indigo-200 text-sm">Sentiment Score</div>
                    </div>
                    <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-lg transition-transform hover:scale-105">
                      <div className="text-3xl sm:text-4xl font-bold text-white mb-1">24</div>
                      <div className="text-indigo-200 text-sm">Top Keywords</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-indigo-200">Positive</span>
                      <span className="text-indigo-200">Neutral</span>
                      <span className="text-indigo-200">Negative</span>
                    </div>
                    <div className="h-3 rounded-full bg-black/20 backdrop-blur-sm overflow-hidden flex">
                      <div className="bg-gradient-to-r from-green-400 to-green-500 w-[68%] h-full" />
                      <div className="bg-gradient-to-r from-gray-400 to-gray-500 w-[20%] h-full" />
                      <div className="bg-gradient-to-r from-red-400 to-red-500 w-[12%] h-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-transparent to-indigo-50/30 dark:to-indigo-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-border/30 mb-6">
              <BarChart3 className="h-5 w-5 text-indigo-600 mr-2" />
              <span className="text-indigo-700 font-medium dark:text-indigo-300">Powerful Features</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 leading-tight py-1">
              Advanced Reddit Analysis Tools
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Everything you need to understand and leverage Reddit communities effectively
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div key={feature.title} className="group">
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-500 h-full transform hover:-translate-y-2 border border-border/30">
                  <div className="p-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-bold text-xl mb-3 text-foreground transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-300">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 leading-tight py-1">
                Why Choose ReddigInsight?
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our platform provides the most comprehensive Reddit analysis tools available,
                helping you make <span className="font-semibold text-indigo-600">data-driven decisions</span>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.slice(0, 6).map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors group">
                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="leading-tight">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="transform transition-all duration-700 hover:scale-105">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 shadow-xl border border-border/20 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <span className="font-semibold text-lg">Your Balance</span>
                  <div className="inline-flex items-center bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 rounded-full text-white text-sm">
                    <Zap className="h-4 w-4 mr-2" />
                    1 Free Credit
                  </div>
                </div>
                <div className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">$9.9/mo</div>
                <div className="text-muted-foreground mb-6">for 10 powerful analysis reports</div>
                <Link href="/signup">
                  <Button className="w-full rounded-xl py-6 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl text-white">
                    Get Started Now
                  </Button>
                </Link>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Join thousands of marketers who trust our platform
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="transition-all duration-700 hover:scale-[1.02]">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              Ready to Transform Your Reddit Analytics?
            </h2>
            <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Start with 1 free credit. No credit card required. Experience the power of <span className="font-semibold text-indigo-200">AI-driven insights</span> instantly.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="group relative">
                <Button size="lg" className="rounded-full px-10 py-6 text-lg gap-2 bg-white text-indigo-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105">
                  <Zap className="h-5 w-5 text-indigo-600" /> 
                  Create Your Free Account
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/pricing" className="group">
                <Button size="lg" className="rounded-full px-10 py-6 text-lg transition-all duration-300 transform group-hover:scale-105 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30">
                  View Pricing Plans
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>


      {/* Contact & Support */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 sm:p-10 shadow-sm border border-border/30 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-6">
              <Mail className="h-7 w-7 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Contact & Support</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto leading-relaxed">
              If you encounter any issues while using ReddigInsight or have suggestions for improving our service, please feel free to reach out to us via the email below.
            </p>
            <a href="mailto:supports@reddiginsight.com" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-lg transition-colors">
              <Mail className="h-5 w-5" />
              supports@reddiginsight.com
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-16 bg-white/80 backdrop-blur-sm dark:bg-gray-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12">
            <div className="flex items-center gap-3 group mb-6 md:mb-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                ReddigInsight
              </span>
            </div>
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <Link href="/pricing" className="hover:text-foreground transition-colors duration-300 hover:scale-105 transform">Pricing</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors duration-300 hover:scale-105 transform">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors duration-300 hover:scale-105 transform">Terms of Service</Link>
            </div>
          </div>
          <div className="border-t border-border/20 pt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} ReddigInsight. All rights reserved. Made with ❤️ for AI-powered insights.
          </div>
        </div>
      </footer>
    </div>
  )
}