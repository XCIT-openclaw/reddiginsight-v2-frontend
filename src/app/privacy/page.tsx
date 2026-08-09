"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Eye, Database, Lock, UserCheck, Search, Brain, FileText, Server, Cookie } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div>
              <h1 className="text-xl font-bold">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground">How we protect and handle your data</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm bg-indigo-100 text-indigo-700 mb-4">
            <Shield className="mr-2 h-4 w-4" />
            Your Privacy Matters
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Privacy Policy</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We are committed to protecting your privacy and being transparent about how we collect,
            use, and protect your personal information when you use ReddigInsight — our AI-powered
            Reddit community analysis platform.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Last updated:</strong> August 7, 2026
          </p>
        </div>

        {/* Privacy Principles */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-2">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle className="text-lg">Transparency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                We clearly explain what data we collect and how we use it to provide you with Reddit
                community insights, sentiment analysis, and actionable recommendations.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle className="text-lg">Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Your personal information is protected with industry-standard encryption and Supabase
                Row-Level Security (RLS) policies. Crawled Reddit data is processed in memory only.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center mb-4">
                <UserCheck className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle className="text-lg">Control</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                You can view, download, or delete your analysis reports at any time. Account deletion
                removes all associated data from our systems.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Information We Collect */}
        <div className="bg-muted/30 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Database className="h-6 w-6 text-indigo-600" />
            Information We Collect
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Account Information</h4>
              <p className="text-muted-foreground">
                When you create an account, we collect your email address. Authentication is handled
                securely by Supabase Auth. We do not collect your name, phone number, or social media profiles.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Usage Data</h4>
              <p className="text-muted-foreground">
                We log your interactions with the platform — search queries submitted, subreddits analyzed,
                reports generated, and credits consumed. This helps us monitor service quality and prevent abuse.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Search & Analysis Data</h4>
              <p className="text-muted-foreground">
                When you request a Reddit analysis, we record the search parameters you provided (target
                subreddit, keywords, time range, and sort order). We also store the final analysis results
                (sentiment scores, key topics, PMF ratings, and AI-generated insights) in your account
                so you can revisit past reports.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Reddit Content Data</h4>
              <p className="text-muted-foreground">
                Our service temporarily fetches publicly available Reddit posts and metadata via third-party
                crawling services. This crawled content is processed entirely in server memory to
                generate your report and is <strong>not</strong> permanently stored on our servers or databases.
                Only the aggregated analysis results are saved.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Payment Information</h4>
              <p className="text-muted-foreground">
                Payments are processed by Creem, our third-party payment provider. We never receive or store
                your full credit card number. We retain only transaction metadata: purchase date, amount,
                and number of credits purchased.
              </p>
            </div>
          </div>
        </div>

        {/* How We Process Reddit Data */}
        <div className="bg-muted/30 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Server className="h-6 w-6 text-indigo-600" />
            How We Handle Reddit Data
          </h3>
          <div className="space-y-4 text-muted-foreground">
            <p>
              A core privacy principle of ReddigInsight is that we do <strong>not</strong> build a permanent
              database of crawled Reddit posts. Here is how the data flows:
            </p>
            <ul className="space-y-3 list-disc pl-5">
              <li>
                <strong className="text-foreground">Fetch:</strong> When you initiate an analysis, our backend
                sends your search parameters to the third-party crawler, which fetches publicly accessible Reddit posts and comments.
              </li>
              <li>
                <strong className="text-foreground">Process in Memory:</strong> The crawled data is held in
                server RAM only. Our AI pipeline (DeepSeek) analyzes it to produce sentiment scores, topic
                extractions, PMF ratings, and action recommendations.
              </li>
              <li>
                <strong className="text-foreground">Discard Raw Data:</strong> Once your report is generated,
                the raw crawled content is immediately discarded from memory. It is never written to our database
                or any persistent storage.
              </li>
              <li>
                <strong className="text-foreground">Store Results Only:</strong> Only the final, aggregated
                analysis report (numerical scores, keyword lists, AI-generated summaries) is saved to your
                account in Supabase. You can delete these reports anytime.
              </li>
            </ul>
            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200 mt-4">
              <p className="text-sm text-indigo-900">
                <strong>Key Point:</strong> ReddigInsight analyzes only <strong>publicly available</strong> Reddit
                content. We do not access private messages, private subreddits, or any Reddit content that requires
                authentication beyond what is publicly visible.
              </p>
            </div>
          </div>
        </div>

        {/* Data Sharing */}
        <div className="bg-muted/30 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Search className="h-6 w-6 text-indigo-600" />
            Data Sharing & Third-Party Services
          </h3>
          <div className="space-y-4 text-muted-foreground">
            <p>
              We do <strong>not</strong> sell, rent, or trade your personal information. We share data only
              with the following service providers that are essential to operating ReddigInsight:
            </p>
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div className="p-4 rounded-lg bg-white/70 border">
                <h4 className="font-semibold mb-2 text-foreground">Supabase</h4>
                <p className="text-sm">Provides our authentication system, PostgreSQL database for user accounts and reports, and Row-Level Security for data isolation.</p>
              </div>
              <div className="p-4 rounded-lg bg-white/70 border">
                <h4 className="font-semibold mb-2 text-foreground">Third-Party Crawler</h4>
                <p className="text-sm">Fetches publicly available Reddit posts on our behalf using your search keywords and subreddit name. Raw crawled data is processed in memory and discarded after analysis.</p>
              </div>
              <div className="p-4 rounded-lg bg-white/70 border">
                <h4 className="font-semibold mb-2 text-foreground">DeepSeek</h4>
                <p className="text-sm">AI language model provider that performs sentiment analysis, topic extraction, and insight generation on crawled post content.</p>
              </div>
              <div className="p-4 rounded-lg bg-white/70 border">
                <h4 className="font-semibold mb-2 text-foreground">Creem</h4>
                <p className="text-sm">Payment processor for credit purchases. Receives your email and payment details; we never see your full card number.</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Processing */}
        <div className="bg-muted/30 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Brain className="h-6 w-6 text-indigo-600" />
            AI Data Processing
          </h3>
          <div className="space-y-4 text-muted-foreground">
            <p>
              ReddigInsight uses DeepSeek's AI models to analyze Reddit post content. Here is what you should know:
            </p>
            <ul className="space-y-3 list-disc pl-5">
              <li>
                <strong className="text-foreground">Content Sent to AI:</strong> Publicly crawled Reddit post
                titles and body text are sent to DeepSeek's API for sentiment analysis and insight generation.
                No personally identifiable information about you or Reddit users is included.
              </li>
              <li>
                <strong className="text-foreground">AI Provider Policies:</strong> DeepSeek's API usage is
                governed by their own privacy policy and data processing terms. We recommend reviewing
                DeepSeek's privacy documentation for details on how they handle API-submitted content.
              </li>
              <li>
                <strong className="text-foreground">No Training on Your Data:</strong> Based on our
                understanding of DeepSeek's API terms, user-submitted content is not used to train their
                base models. However, we encourage you to review their latest policy for any updates.
              </li>
              <li>
                <strong className="text-foreground">Batch Processing:</strong> Posts are sent for analysis
                in batches. Only post text content is transmitted — no user identities, IP addresses, or
                other metadata beyond the post content itself.
              </li>
            </ul>
          </div>
        </div>

        {/* Cookies */}
        <div className="bg-muted/30 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Cookie className="h-6 w-6 text-indigo-600" />
            Cookies
          </h3>
          <div className="space-y-4 text-muted-foreground">
            <p>
              ReddigInsight uses only <strong>essential authentication cookies</strong> managed by Supabase Auth.
              These session cookies are required for the platform to function — they keep you signed in as you
              navigate between pages.
            </p>
            <p>
              We do <strong>not</strong> use:
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>Tracking cookies for advertising or analytics purposes</li>
              <li>Third-party marketing or retargeting cookies</li>
              <li>Fingerprinting or other covert tracking techniques</li>
            </ul>
            <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
              <p className="text-sm text-indigo-900">
                <strong>Your Choice:</strong> You can disable cookies in your browser settings, but this will
                prevent you from signing in and using ReddigInsight. The Supabase auth cookie
                (<code>sb-jodnxkcwgxamjrdydlzz-auth-token</code>) can be cleared at any time to sign out.
              </p>
            </div>
          </div>
        </div>

        {/* Data Security & Retention */}
        <div className="bg-muted/30 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Lock className="h-6 w-6 text-indigo-600" />
            Data Security & Retention
          </h3>
          <div className="space-y-4 text-muted-foreground">
            <p>
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Security Measures</h4>
                <ul className="space-y-2 list-disc pl-5">
                  <li>HTTPS encryption for all data in transit</li>
                  <li>Supabase Row-Level Security for database isolation</li>
                  <li>JWT-based authentication with token expiry</li>
                  <li>Crawled Reddit data processed in memory only (never persisted)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-foreground">Data Retention</h4>
                <ul className="space-y-2 list-disc pl-5">
                  <li><strong>Account data:</strong> Until account deletion</li>
                  <li><strong>Analysis reports:</strong> Stored until you delete them or your account is deleted</li>
                  <li><strong>Crawled Reddit posts:</strong> Held in memory during processing only; discarded immediately after</li>
                  <li><strong>AI chat history:</strong> Stored in your browser's localStorage; cleared when you use the Clear button</li>
                                  </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Your Rights */}
        <div className="bg-muted/30 rounded-2xl p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <FileText className="h-6 w-6 text-indigo-600" />
            Your Rights
          </h3>
          <div className="space-y-4 text-muted-foreground">
            <p>Depending on your jurisdiction, you may have the following rights regarding your personal data:</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-white/70 border">
                <h4 className="font-semibold mb-2 text-foreground">Access & Portability</h4>
                <p className="text-sm">Request a copy of your personal data. You can export your analysis reports at any time from the Reports page.</p>
              </div>
              <div className="p-4 rounded-lg bg-white/70 border">
                <h4 className="font-semibold mb-2 text-foreground">Correction</h4>
                <p className="text-sm">Update inaccurate or incomplete information. You can change your email via your account settings.</p>
              </div>
              <div className="p-4 rounded-lg bg-white/70 border">
                <h4 className="font-semibold mb-2 text-foreground">Deletion</h4>
                <p className="text-sm">Request deletion of your account and all associated data. Delete individual reports anytime from the Reports page.</p>
              </div>
              <div className="p-4 rounded-lg bg-white/70 border">
                <h4 className="font-semibold mb-2 text-foreground">Restriction & Objection</h4>
                <p className="text-sm">Restrict or object to certain processing of your data. Contact us to exercise these rights.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 rounded-2xl p-8 border border-indigo-200/30">
          <h3 className="text-2xl font-bold mb-4">Questions About Privacy?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            If you have any questions about this Privacy Policy, how we handle your data, or would like
            to exercise your data rights, please reach out to us. We are committed to transparency
            and protecting your privacy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 text-white px-6 py-3 text-sm font-medium hover:bg-indigo-700 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
