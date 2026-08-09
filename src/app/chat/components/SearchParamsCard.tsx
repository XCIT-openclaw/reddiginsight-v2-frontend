'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Subscript, Search, Clock, Info, Loader2 } from 'lucide-react';

interface QueryParams {
  subreddit: string;
  keywords: string;
  timeRange: string;
  limit?: number;
}

interface SearchParamsCardProps {
  params: QueryParams | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const timeRangeLabels: Record<string, string> = {
  day: 'Past 24 hours',
  week: 'Past week',
  month: 'Past month',
  year: 'Past year',
  all: 'All time',
};

export function SearchParamsCard({ params, isLoading, onConfirm, onCancel }: SearchParamsCardProps) {
  const hasParams = params !== null;
  
  return (
    <div className="w-80 shrink-0 border-l border-border/30 bg-white/60 backdrop-blur-sm dark:bg-gray-800/60 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-border/20">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Search className="h-4 w-4" />
          Search Parameters
        </h3>
      </div>
      
      <div className="flex-1 p-4">
        {!hasParams ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-muted-foreground">
            <div className="p-3 rounded-full bg-muted/50">
              <Info className="h-6 w-6 opacity-40" />
            </div>
            <p className="text-sm leading-relaxed">
              AI will suggest search parameters as you chat.
            </p>
            <p className="text-xs opacity-60">
              Once generated, you can review and confirm them here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-orange-100 border-2 border-orange-300 text-sm text-orange-900 flex items-start gap-3">
              <svg className="h-5 w-5 text-orange-500 mt-0.5 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <p className="font-semibold mb-0.5">AI-Suggested Subreddit</p>
                <p className="text-xs text-orange-700 leading-relaxed">
                  This subreddit was automatically matched from Reddit&rsquo;s official <strong>popular subreddits</strong> list. 
                  If it&rsquo;s not what you want, go to <strong>Dashboard &rarr; Direct Input</strong> card to manually enter a different subreddit.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100/50">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <Subscript className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Subreddit</p>
                <p className="font-medium text-sm text-primary break-words">r/{params.subreddit}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50/50 border border-purple-100/50">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <Search className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Keywords</p>
                <p className="font-medium text-sm text-primary break-words">{params.keywords}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{params.keywords.split(",").length}/5 keywords</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-pink-50/50 border border-pink-100/50">
              <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Time Range</p>
                <p className="font-medium text-sm text-primary">{timeRangeLabels[params.timeRange] || params.timeRange}</p>
              </div>
            </div>

          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-border/20 space-y-2">
        <Button
          onClick={onConfirm}
          disabled={!hasParams || isLoading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Confirm & Go to Dashboard
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={!hasParams || isLoading}
          className="w-full flex items-center justify-center gap-2"
        >
          <XCircle className="h-4 w-4" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}
