interface TypingIndicatorProps {
  timestamp?: Date;
}

export function TypingIndicator({ timestamp }: TypingIndicatorProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
        <span className="text-sm text-white font-bold">AI</span>
      </div>
      <div className="space-y-1">
        <div className="bg-white dark:bg-gray-800 rounded-2xl px-5 py-4 shadow-lg backdrop-blur-sm border border-border/20">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
        {timestamp && (
          <div className="text-xs text-muted-foreground pl-2">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}