export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          credits: number
          created_at: string
          updated_at: string
          is_admin: boolean
          plan: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          email: string
          credits?: number
          created_at?: string
          updated_at?: string
          plan?: string
          stripe_customer_id?: string | null
          is_admin?: boolean
        }
        Update: {
          id?: string
          email?: string
          credits?: number
          created_at?: string
          updated_at?: string
          plan?: string
          stripe_customer_id?: string | null
          is_admin?: boolean
        }
      }
      reports: {
        Row: {
          id: string
          user_id: string
          subreddit: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          credits_used: number
          created_at: string
          updated_at: string
          is_admin: boolean
          completed_at: string | null
          error_message: string | null
          discussion_summary?: string[] | null
          key_quotes?: string[] | null
          avg_influence_score?: number | null
          action_recommendations?: string[] | null
        }
        Insert: {
          id?: string
          user_id: string
          subreddit: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          credits_used?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          error_message?: string | null
          discussion_summary?: string[] | null
          key_quotes?: string[] | null
          avg_influence_score?: number | null
          action_recommendations?: string[] | null
        }
        Update: {
          id?: string
          user_id?: string
          subreddit?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          credits_used?: number
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          error_message?: string | null
          discussion_summary?: string[] | null
          key_quotes?: string[] | null
          avg_influence_score?: number | null
          action_recommendations?: string[] | null
        }
      }
      crawled_posts: {
        Row: {
          id: string
          report_id: string
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
          crawled_at: string
          is_key_quote?: boolean | null
          quote_text?: string | null
          influence_score?: number | null
          sentiment_confidence?: number | null
          action_recommendation?: string | null
        }
        Insert: {
          id?: string
          report_id: string
          reddit_id: string
          title: string
          content?: string | null
          author?: string | null
          score?: number
          num_comments?: number
          url: string
          created_utc: string
          sentiment_score?: number | null
          sentiment_label?: 'positive' | 'negative' | 'neutral' | null
          keywords?: string[] | null
          crawled_at?: string
          is_key_quote?: boolean | null
          quote_text?: string | null
          influence_score?: number | null
          sentiment_confidence?: number | null
          action_recommendation?: string | null
        }
        Update: {
          id?: string
          report_id?: string
          reddit_id?: string
          title?: string
          content?: string | null
          author?: string | null
          score?: number
          num_comments?: number
          url?: string
          created_utc?: string
          sentiment_score?: number | null
          sentiment_label?: 'positive' | 'negative' | 'neutral' | null
          keywords?: string[] | null
          crawled_at?: string
          is_key_quote?: boolean | null
          quote_text?: string | null
          influence_score?: number | null
          sentiment_confidence?: number | null
          action_recommendation?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          credits: number
          payment_method: 'creem' | 'stripe' | 'free_trial'
          payment_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          credits: number
          payment_method: 'creem' | 'stripe' | 'free_trial'
          payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          credits?: number
          payment_method?: 'creem' | 'stripe' | 'free_trial'
          payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          created_at?: string
          completed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
