# ReddigInsight MVP v2

AI-powered Reddit subreddit analysis tool with sentiment analysis, keyword extraction, and trend detection.

## Features

- 🔍 **Subreddit Analysis**: Analyze any public subreddit in seconds
- 📊 **Sentiment Analysis**: Understand the emotional tone with AI-powered sentiment scoring
- 🔑 **Keyword Extraction**: Automatically extract relevant keywords and topics
- 📈 **Trend Detection**: Identify trending topics and emerging discussions
- 💳 **Credit System**: Pay-as-you-go with Creem payment integration
- 🔐 **Secure Auth**: User authentication via Supabase

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Creem
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Creem account (for payments)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd reddiginsight
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Creem Payment Configuration
CREEM_API_KEY=your-creem-api-key
CREEM_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_CREEM_MERCHANT_ID=your-merchant-id

# Apify Configuration (for Reddit crawling)
APIFY_API_TOKEN=your-apify-token
APIFY_ACTOR_ID=your-actor-id

# LLM Configuration
LLM_API_KEY=your-llm-api-key
LLM_MODEL=gpt-4-turbo

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Set up the database:
   - Go to your Supabase SQL Editor
   - Run the SQL from `supabase/schema.sql`

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
reddiginsight/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   │   ├── checkout/       # Creem checkout endpoint
│   │   │   └── webhooks/       # Webhook handlers
│   │   ├── auth/               # Auth callback routes
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── login/              # Login page
│   │   ├── pricing/            # Pricing page
│   │   ├── reports/            # Reports list and detail pages
│   │   ├── settings/           # User settings
│   │   └── signup/             # Signup page
│   ├── components/             # React components
│   │   └── ui/                 # shadcn/ui components
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx     # Authentication context
│   ├── lib/                    # Utility libraries
│   │   └── supabase/           # Supabase client configuration
│   └── types/                  # TypeScript type definitions
├── supabase/
│   └── schema.sql              # Database schema
├── .env.example                # Environment variables template
└── package.json
```

## Database Schema

### Tables

- **users**: User profiles with credit balance
- **reports**: Subreddit analysis reports
- **crawled_posts**: Individual posts from crawls
- **transactions**: Payment transactions

## API Endpoints

### Authentication
- `POST /auth/callback` - OAuth callback handler

### Payments
- `POST /api/checkout` - Create Creem checkout session
- `POST /api/webhooks/creem` - Handle Creem webhook events

## Credit System

- New users receive **1 free credit** upon signup
- Each credit allows analysis of **one subreddit**
- Credits can be purchased:
  - Starter: $9.9 for 5 credits
  - Pro: $24.9 for 15 credits
  - Enterprise: $69.9 for 50 credits

## Development

### Mock Mode

When API keys are not configured (placeholder values), the app runs in **mock mode**:
- Payments are simulated (no actual charges)
- Report data is generated with mock data
- All functionality works for testing

### Building for Production

```bash
npm run build
```

### Deployment

The app is configured for deployment to Vercel:

```bash
vercel deploy
```

## License

MIT License - See LICENSE file for details.