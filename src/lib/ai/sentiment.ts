// Type definitions for sentiment analysis
// These types are used by both frontend components and backend API

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  score: number;
  num_comments: number;
  url: string;
  created_utc: number;
  subreddit: string;
}

export interface DiscussionSummary {
  points: string[];
}

export interface KeyQuote {
  post_id: string;
  author: string;
  text: string;
  context: string;
}

export interface InfluenceScore {
  post_id: string;
  score: number;
  factors: string[];
  subreddit_size_factor?: number;
  engagement_rate?: number;
}

export interface SentimentWithConfidence {
  sentiment_score: number;
  sentiment_label: 'positive' | 'negative' | 'neutral';
  confidence: number;
  emotions?: string[];
}

export interface ActionRecommendation {
  post_id: string;
  action: 'reply' | 'suggest' | 'ignore' | 'moderate' | 'escalate';
  reason: string;
  priority: 'low' | 'medium' | 'high';
  timing: 'immediate' | 'short-term' | 'long-term';
}

export interface ComprehensiveAnalysis {
  discussionSummary: {
    mainPoints: string[];
  };
  keyQuotes: KeyQuote[];
  avgInfluenceScore: number;
  influenceBreakdown: InfluenceScore[];
  sentimentBreakdown: {
    totalPosts: number;
    positive: number;
    negative: number;
    neutral: number;
    avgSentiment: number;
    avgConfidence: number;
  };
  actionRecommendations: ActionRecommendation[];
  postAnalyses: Array<{
    id: string;
    sentiment_analysis: SentimentWithConfidence;
    keywords: string[];
    influence_score: number;
    action_recommendation: ActionRecommendation;
  }>;
  overallInsights: {
    positive: string[];
    negative: string[];
    thematic: string[];
  };
}

export interface PostAnalysis {
  id: string;
  sentiment_score: number;
  sentiment_label: 'positive' | 'negative' | 'neutral';
  keywords: string[];
}

export interface ReportAnalysis {
  pmfScore: number;
  avgSentiment: number;
  positiveInsights: string[];
  negativeInsights: string[];
  postAnalyses: PostAnalysis[];
}

// Note: Analysis functions are implemented in the backend
// Frontend should call the backend API via apiClient