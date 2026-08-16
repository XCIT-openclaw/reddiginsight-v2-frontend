"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Scale, AlertTriangle, CheckCircle, XCircle, Users, Brain, CreditCard, RefreshCw, Copyright } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            <div>
              <h1 className="text-xl font-bold">Terms of Service</h1>
              <p className="text-sm text-muted-foreground">
                Terms and conditions for using our service
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 md:px-6 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div
            className="text-center space-y-6"
          >
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm bg-indigo-100 text-indigo-700 mb-4">
              <Scale className="mr-2 h-4 w-4" />
              Legal Terms
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Terms of Service
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              These terms govern your use of our AI-powered Reddit analysis platform. 
              By using our service, you agree to these terms and conditions.
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Last updated:</strong> August 7, 2026
            </p>
          </div>

          {/* Key Points */}
          <div
            className="grid gap-6 md:grid-cols-3"
          >
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">What You Can Do</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Use our service to analyze Reddit communities and generate AI-powered insight reports, save your analysis reports, and share your AI-generated insights with others.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-lg">What You Cannot Do</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Misuse our service, violate others' rights, or use generated content for illegal or harmful purposes.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Our Commitment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Provide reliable service, protect your privacy, and maintain the quality of our AI-powered Reddit analysis tools.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Service Description */}
          <div
            className="space-y-8"
          >
            <div className="bg-muted/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <FileText className="h-6 w-6 text-indigo-600" />
                Our Service
              </h3>
              
              <div className="space-y-4 text-muted-foreground">
                <p>
                  ReddigInsight is an AI-powered platform that transforms search queries into AI-powered Reddit community analysis reports 
                  using advanced AI technology. Our service includes:
                </p>
                
                <ul className="space-y-2">
                  <li>• <strong>Free Tier:</strong> New accounts receive 1 free credit to try the service</li>
                  <li>• <strong>Paid Plans (Starter & Pro):</strong> Analyze up to 300 posts per subreddit search. Pro also includes priority processing and advanced export options</li>
                  <li>• <strong>AI Technology:</strong> Powered by DeepSeek AI models for sentiment analysis and insight generation</li>
                  <li>• <strong>Analysis Tools:</strong> Sentiment breakdown, PMF scoring, key topic extraction, and actionable recommendations</li>
                  <li>• <strong>Report Management:</strong> Save, export, and revisit your analysis reports anytime</li>
                </ul>
              </div>
            </div>
          </div>

          {/* User Responsibilities */}
          <div
            className="space-y-8"
          >
            <div className="bg-muted/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <FileText className="h-6 w-6 text-indigo-600" />
                Your Responsibilities
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-3 text-green-700">Acceptable Use</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Use the service for personal, educational, or professional analysis design purposes</li>
                    <li>• Provide accurate information when creating an account</li>
                    <li>• Respect intellectual property rights and analysis industry standards</li>
                    <li>• Submit only lawful, appropriate search queries and analysis requests</li>
                    <li>• Keep your account credentials secure</li>
                    <li>• Report any technical issues or misuse</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-red-700">Prohibited Activities</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Using generated content for fraudulent or misleading purposes</li>
                    <li>• Uploading inappropriate, offensive, or illegal content</li>
                    <li>• Attempting to reverse-engineer our AI algorithms</li>
                    <li>• Sharing account credentials with others</li>
                    <li>• Using automated tools to bulk-generate content</li>
                    <li>• Violating any applicable laws or regulations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Intellectual Property */}
          <div
            className="space-y-8"
          >
            <div className="bg-muted/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Copyright className="h-6 w-6 text-indigo-600" />
                Intellectual Property and Generated Content
              </h3>
              
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">Your Rights to Generated Content</h4>
                  <p>
                    You have the right to use any analysis reports and design content generated through our service for personal, 
                    educational, or commercial purposes. You retain ownership of your original search queries and have 
                    full rights to the AI-generated analysis reports created from them.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">Our Intellectual Property</h4>
                  <p>
                    The ReddigInsight platform, including our AI algorithms, website design, brand elements, 
                    and proprietary technology, remains our intellectual property. You may not copy, modify, or 
                    redistribute our platform or technology.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">Industry Standards</h4>
                  <p>
                    We encourage responsible use of AI-generated content and respect for analysis industry standards. 
                    Generated content should be used in accordance with applicable analysis industry guidelines and 
                    intellectual property laws.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Availability */}
          <div
            className="space-y-8"
          >
            <div className="bg-muted/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-indigo-600" />
                Service Availability and Disclaimers
              </h3>
              
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Service Availability</h4>
                  <p>
                    While we strive to maintain 24/7 service availability, we cannot guarantee uninterrupted access. 
                    We may temporarily suspend service for maintenance, updates, or due to circumstances beyond our control.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">AI-Generated Content</h4>
                  <p>
                    Our analysis reports are generated by AI technology using DeepSeek models. While we strive for 
                    high quality and realistic results, the generated content is for research and informational purposes and may not 
                    represent actual real outcomes or market sentiment.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">No Warranties</h4>
                  <p>
                    Our service is provided "as is" without warranties of any kind. We do not guarantee the suitability 
                    of generated content for any specific purpose or its accuracy in representing actual analysis designs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI and Reddit Analysis Terms */}
          <div
            className="space-y-8"
          >
            <div className="bg-muted/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Brain className="h-6 w-6 text-indigo-600" />
                AI Technology and Reddit Analysis Terms
              </h3>
              
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">AI Model Usage</h4>
                  <p>
                    Our service uses DeepSeek AI models to generate analysis reports. By using our service, 
                    you acknowledge that AI-generated content may not always be perfect and may require human review 
                    for professional applications.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Content Accuracy</h4>
                  <p>
                    While we strive for high-quality results, AI-generated analysis reports are for research and informational purposes only. 
                    They may not accurately represent actual community sentiment, market conditions, or real-world user opinions.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Compliance & Safety Filters</h4>
                  <p>
                    The AI providers we use comply with applicable regional content-safety regulations and automatically reject
                    prompts or uploads that involve NSFW material, copyrighted or trademark-infringing assets, or other prohibited
                    content. By using the service, you agree not to attempt to bypass or disable these safety mechanisms.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Professional Use</h4>
                  <p>
                    For professional analysis design applications, we recommend using our generated content as a starting point 
                    and conducting additional research or consultation with industry experts as needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div
            className="space-y-8"
          >
            <div className="bg-muted/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-indigo-600" />
                Payment and Subscription Terms
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-3">Premium Subscriptions</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Monthly and annual subscription options available</li>
                    <li>• Automatic renewal unless cancelled</li>
                    <li>• 10 analysis credits per month</li>
                    <li>• Premium features and advanced customization</li>
                    <li>• Priority processing and higher quality outputs</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Cancellation and Refunds</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Cancel anytime through your account settings</li>
                    <li>• Refunds processed according to our refund policy</li>
                    <li>• No refunds for partially used subscription periods</li>
                    <li>• Free trial cancellations take effect immediately</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Changes to Terms */}
          <div
            className="space-y-8"
          >
            <div className="bg-muted/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <RefreshCw className="h-6 w-6 text-indigo-600" />
                Changes to These Terms
              </h3>
              
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may update these Terms of Service from time to time to reflect changes in our service, 
                  legal requirements, or business practices. When we make changes:
                </p>
                
                <ul className="space-y-2">
                  <li>• We will update the "Last updated" date at the top of this page</li>
                  <li>• For significant changes, we will notify users via email or service notifications</li>
                  <li>• Continued use of our service after changes constitutes acceptance of new terms</li>
                  <li>• You can always find the current version of our terms on this page</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div
            className="text-center bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 rounded-2xl p-8 border border-indigo-200/30"
          >
            <h3 className="text-2xl font-bold mb-4">Questions About These Terms?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              If you have any questions about these Terms of Service or need clarification about your rights and responsibilities 
              regarding our AI-powered Reddit analysis platform, please contact us. We're here to help ensure you understand 
              and can comply with these terms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 text-white px-6 py-3 text-sm font-medium hover:bg-indigo-700 transition-colors">
              Back to Home
            </Link>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}