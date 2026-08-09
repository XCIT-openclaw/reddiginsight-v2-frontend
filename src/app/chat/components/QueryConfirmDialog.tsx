'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Subscript, Search, Clock, Hash } from 'lucide-react';

interface QueryParams {
  subreddit: string;
  keywords: string;
  timeRange: string;
  limit?: number;
}

interface QueryConfirmDialogProps {
  open: boolean;
  params: QueryParams;
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

export function QueryConfirmDialog({ open, params, onConfirm, onCancel }: QueryConfirmDialogProps) {
  if (!open) return null;
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border border-indigo-200/30 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Confirm Query Parameters
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            The AI has generated these search parameters. Please review and confirm to proceed.
          </DialogDescription>
        </DialogHeader>
        
        {/* Notice: subreddit sourced from Reddit popular list */}
        <div className="mx-0 mb-2 p-3 rounded-lg bg-amber-50/80 border border-amber-200/60 text-sm text-amber-800 flex items-start gap-2">
          <svg className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>The subreddit was suggested by AI from Reddit&rsquo;s official <strong>popular subreddits</strong> list &mdash; it&rsquo;s a real, active community. If you prefer a different subreddit, you can manually adjust it on the <strong>Dashboard &gt; Direct Input</strong> card.</span>
        </div>
        
        <div className="space-y-4 py-4">
          {/* Subreddit */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100/50">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <Subscript className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Subreddit</p>
              <p className="font-medium text-primary">r/{params.subreddit}</p>
            </div>
          </div>
          
          {/* Keywords */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50/50 border border-purple-100/50">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Search className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Keywords</p>
              <p className="font-medium text-primary">{params.keywords}</p>
            </div>
          </div>
          
          {/* Time Range */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-pink-50/50 border border-pink-100/50">
            <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              <Clock className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Time Range</p>
              <p className="font-medium text-primary">{timeRangeLabels[params.timeRange] || params.timeRange}</p>
            </div>
          </div>
          
          {/* Limit (optional) */}
          {params.limit != null && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/50 border border-gray-100/50">
              <div className="p-2 rounded-lg bg-gradient-to-r from-gray-500 to-slate-500 text-white">
                <Hash className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Max Posts</p>
                <p className="font-medium text-primary">{params.limit}</p>
                <p className="text-xs text-muted-foreground mt-0.5">The maximum number of posts analyzed</p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Confirm & Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}