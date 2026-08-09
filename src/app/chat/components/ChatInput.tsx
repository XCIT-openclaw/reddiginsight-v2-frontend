import React, { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSubmit: (content: string) => void;
  disabled: boolean;
}

const MAX_MESSAGE_LENGTH = 500;

export function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !disabled && trimmed.length <= MAX_MESSAGE_LENGTH) {
      onSubmit(trimmed);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isOverLimit = inputValue.length > MAX_MESSAGE_LENGTH;
  const charCount = inputValue.length;

  return (
    <div className="relative w-full">
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={disabled}
        rows={1}
        maxLength={MAX_MESSAGE_LENGTH + 50}
        className="w-full resize-none py-4 px-4 pr-16 border border-border/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/70 disabled:opacity-50 disabled:cursor-not-allowed max-h-32 min-h-[52px] overflow-y-auto bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 shadow-sm"
      />
      <div className="absolute right-16 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <span className={`text-xs ${isOverLimit ? 'text-red-500 font-semibold' : charCount > 400 ? 'text-amber-500' : 'text-muted-foreground'}`}>
          {charCount}/{MAX_MESSAGE_LENGTH}
        </span>
      </div>
      <button
        onClick={handleSubmit}
        disabled={disabled || !inputValue.trim() || isOverLimit}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl px-4 py-3 text-sm hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-indigo-500/20 disabled:hover:from-indigo-600 disabled:hover:to-purple-600"
      >
        Send
      </button>
    </div>
  );
}
