import { cn } from '@/lib/utils';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export function ChatMessage({ content, role, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';
  
  return (
    <div className={cn(
      'flex gap-4 animate-fade-in-down', 
      isUser ? 'justify-end' : 'justify-start'
    )}>
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
          <span className="text-sm text-white font-bold">AI</span>
        </div>
      )}
      
      <div className={cn(
        'max-w-[85%] rounded-2xl px-5 py-3.5 shadow-lg',
        isUser 
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none' 
          : 'bg-white dark:bg-gray-800/80 text-foreground rounded-bl-none',
        'backdrop-blur-sm border border-border/20'
      )}>
        <div className="prose dark:prose-invert prose-sm whitespace-pre-wrap break-words max-w-none">
          {content}
        </div>
        <div className={cn(
          'text-xs mt-2 opacity-70',
          isUser ? 'text-right' : 'text-left'
        )}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center shadow-lg">
          <span className="text-sm text-white font-bold">YOU</span>
        </div>
      )}
    </div>
  );
}