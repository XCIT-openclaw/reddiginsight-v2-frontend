# ReddigInsight MVP Project Plan

## Project Overview

**Project Name**: ReddigInsight MVP v2
**Duration**: 4 Weeks
**Team Size**: 1 Developer
**Status**: Week 1 Complete

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth)
- **Payments**: Creem
- **Crawling**: Apify
- **AI/LLM**: OpenAI or compatible

## Milestones

### Milestone 1: Foundation (Week 1) ✅ COMPLETE

**Status**: Completed
**Completion Date**: Week 1

**Deliverables**:
- [x] Project initialization with Next.js 15
- [x] TypeScript configuration
- [x] Tailwind CSS + shadcn/ui setup
- [x] Supabase client configuration
- [x] Database schema design and SQL scripts
- [x] Authentication system (login/signup)
- [x] User credit system
- [x] Creem payment integration
- [x] Basic dashboard UI
- [x] Report list pages
- [x] Landing page

**Key Files Created**:
- `src/app/` - All page routes
- `src/components/` - UI components
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/lib/supabase/` - Supabase clients
- `src/types/database.ts` - TypeScript types
- `supabase/schema.sql` - Database schema

### Milestone 2: Core Features (Week 2)

**Status**: Not Started
**Priority**: High

**Tasks**:
- [ ] Implement Apify Reddit crawler integration
  - Create API route for triggering crawls
  - Handle crawl results and storage
  - Error handling and retries

- [ ] Build LLM sentiment analysis pipeline
  - Connect to LLM API
  - Design prompt templates
  - Batch processing for efficiency

- [ ] Implement keyword extraction
  - NLP-based keyword detection
  - Frequency analysis
  - Topic clustering

- [ ] Create report generation workflow
  - Combine analysis results
  - Generate structured reports
  - Store in database

- [ ] Add email notifications
  - Set up email service (Resend/SendGrid)
  - Email templates
  - Notification triggers

- [ ] Build PDF export
  - PDF generation library
  - Report formatting
  - Download functionality

### Milestone 3: Enhancement (Week 3)

**Status**: Not Started
**Priority**: Medium

**Tasks**:
- [ ] Implement trend detection
  - Time-series analysis
  - Anomaly detection
  - Trend visualization

- [ ] Build user analytics dashboard
  - Usage statistics
  - Credit consumption charts
  - Report history

- [ ] Create admin monitoring panel
  - System health metrics
  - User activity logs
  - Error tracking

- [ ] Add rate limiting
  - Per-user limits
  - API rate limiting
  - Abuse prevention

- [ ] Implement caching
  - Redis setup
  - Cache strategies
  - Cache invalidation

- [ ] Error handling improvements
  - Error boundaries
  - Graceful degradation
  - User-friendly error messages

### Milestone 4: Launch Prep (Week 4)

**Status**: Not Started
**Priority**: High

**Tasks**:
- [ ] Testing
  - Unit tests (Jest)
  - Integration tests
  - E2E tests (Playwright)
  - Test coverage > 80%

- [ ] CI/CD Setup
  - GitHub Actions
  - Automated testing
  - Deployment pipeline

- [ ] Performance Optimization
  - Bundle size optimization
  - Image optimization
  - Database query optimization

- [ ] Security Audit
  - Vulnerability scanning
  - Input validation review
  - Authentication testing

- [ ] Documentation
  - API documentation
  - User guides
  - Developer docs

- [ ] Production Deployment
  - Vercel deployment
  - Environment variables
  - Monitoring setup
  - Backup strategy

## Resource Allocation

### Development Hours (Weekly)

| Week | Task Category | Hours |
|------|---------------|-------|
| 1 | Foundation | 20h ✅ |
| 2 | Core Features | 25h |
| 3 | Enhancement | 20h |
| 4 | Launch Prep | 15h |

**Total**: 80 hours

## Dependencies

### External Services

1. **Supabase** - Database and Auth
   - Free tier sufficient for MVP
   - Upgrade path available

2. **Creem** - Payments
   - Simpler than Stripe
   - Good for international

3. **Apify** - Reddit Crawling
   - Managed service
   - Reliable Reddit scraping

4. **LLM Provider** - Analysis
   - OpenAI GPT-4 or equivalent
   - Cost per analysis: ~$0.10

### Development Tools

- GitHub for version control
- Vercel for deployment
- VS Code for development

## Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| Reddit API rate limits | Medium | High | Use Apify with proxy rotation | Dev |
| LLM costs exceed budget | Medium | Medium | Implement caching, optimize prompts | Dev |
| Payment integration delays | Low | High | Start early, have backup provider | Dev |
| Performance issues at scale | Medium | Medium | Implement caching early | Dev |

## Budget Estimate

### Monthly Costs (Post-Launch)

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Pro | $25/mo |
| Creem | Pay as you go | ~2% of revenue |
| Apify | Start | $49/mo |
| LLM API | Usage-based | Variable |
| Vercel | Pro | $20/mo |

**Estimated Monthly**: $100-200 + LLM costs

## Success Criteria

### Week 1 (Achieved)
- [x] App builds and deploys successfully
- [x] Users can sign up and log in
- [x] Credit system works
- [x] Payment flow functional (mock mode)

### Week 2
- [ ] Reports generate successfully
- [ ] Analysis results are accurate
- [ ] Processing time < 5 minutes

### Week 3
- [ ] All features functional
- [ ] Performance meets requirements
- [ ] Error rate < 1%

### Week 4
- [ ] All tests passing
- [ ] Production deployment live
- [ ] Documentation complete

## Next Steps

1. Set up Supabase project and run schema SQL
2. Configure Apify account and test crawler
3. Integrate LLM API for sentiment analysis
4. Build report generation pipeline
5. Test end-to-end flow

---

**Last Updated**: Week 1 Complete
**Next Review**: Start of Week 2