# ReddigInsight MVP PRD (Product Requirements Document)

## Product Overview

**ReddigInsight** is an AI-powered SaaS tool that analyzes Reddit subreddits to provide actionable insights including sentiment analysis, keyword extraction, and trend detection.

## Target Users

1. **Marketing Professionals** - Monitor brand mentions and sentiment
2. **Product Managers** - Understand user feedback and pain points
3. **Researchers** - Analyze community discussions and trends
4. **Content Creators** - Find trending topics and audience interests

## Problem Statement

Analyzing Reddit communities manually is time-consuming and error-prone. Users need a tool that can:
- Quickly process large volumes of posts and comments
- Identify sentiment trends automatically
- Extract key topics and keywords
- Provide actionable insights in an easy-to-understand format

## Solution

A web-based application that:
1. Accepts subreddit names as input
2. Crawls and analyzes posts using AI
3. Generates comprehensive reports with visualizations
4. Offers a credit-based pricing model for accessibility

## Core Features

### MVP Features

1. **Subreddit Analysis**
   - Input: Subreddit name
   - Output: Comprehensive analysis report
   - Processing time: < 5 minutes

2. **Sentiment Analysis**
   - Overall sentiment score (positive/negative/neutral)
   - Breakdown by post
   - Trend over time

3. **Keyword Extraction**
   - Top mentioned topics
   - Emerging keywords
   - Keyword frequency analysis

4. **User Authentication**
   - Email/password signup
   - Secure authentication
   - Password reset

5. **Credit System**
   - 1 free credit for new users
   - Purchase additional credits
   - Credit usage tracking

6. **Payment Integration**
   - Creem payment processing
   - Multiple pricing tiers
   - Receipt generation

7. **Report Management**
   - View all past reports
   - Download/share reports
   - Report history

### Future Features (Post-MVP)

1. **Advanced Analytics**
   - Trend detection algorithms
   - Predictive insights
   - Comparative analysis

2. **API Access**
   - REST API for integration
   - Webhook notifications
   - Rate limiting

3. **Team Features**
   - Shared credits
   - Collaborative reports
   - Role-based access

4. **Custom Reports**
   - Scheduled reports
   - Custom date ranges
   - Filtered analysis

## User Stories

### Authentication
- As a new user, I want to create an account to access the platform
- As a user, I want to log in securely to my account
- As a user, I want to reset my password if I forget it

### Analysis
- As a user, I want to enter a subreddit name to start an analysis
- As a user, I want to see the progress of my analysis
- As a user, I want to view my analysis results in a clear format

### Credits & Payments
- As a new user, I want to receive a free credit to try the service
- As a user, I want to purchase additional credits
- As a user, I want to see my credit balance at all times

### Reports
- As a user, I want to view all my past reports
- As a user, I want to download a report as PDF
- As a user, I want to share a report with others

## Technical Requirements

### Frontend
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui components
- Responsive design

### Backend
- Next.js API Routes
- Supabase for database and auth
- Creem for payments
- Apify for Reddit crawling
- OpenAI/other LLM for analysis

### Performance
- Page load < 3 seconds
- Report generation < 5 minutes
- 99.9% uptime SLA

### Security
- HTTPS everywhere
- Secure authentication
- Input validation
- Rate limiting
- Data encryption at rest

## Success Metrics

1. **User Acquisition**
   - 100 signups in first month
   - 20% conversion to paid

2. **Engagement**
   - 3+ analyses per user per month
   - 5+ minutes average session time

3. **Revenue**
   - $500 MRR by month 3
   - 10% month-over-month growth

## Pricing Model

| Plan | Price | Credits | Price per Credit |
|------|-------|---------|------------------|
| Starter | $9.9 | 5 | $1.98 |
| Pro | $24.9 | 15 | $1.66 |
| Enterprise | $69.9 | 50 | $1.40 |

**Free Tier**: 1 credit on signup

## Timeline

- **Week 1**: Core infrastructure and authentication
- **Week 2**: Analysis pipeline and report generation
- **Week 3**: Payment integration and UI polish
- **Week 4**: Testing, optimization, and launch prep

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Reddit API changes | Medium | High | Use Apify for crawling |
| LLM costs overrun | Medium | Medium | Implement caching, optimize prompts |
| Payment integration issues | Low | High | Thorough testing, backup payment provider |
| Low user adoption | Medium | High | Marketing campaign, free tier |

## Conclusion

ReddigInsight MVP provides a focused solution for Reddit analysis with a simple, credit-based pricing model. The technical foundation is solid and ready for iterative development based on user feedback.