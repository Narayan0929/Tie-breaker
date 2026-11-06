import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, User, Bot, Loader2 } from 'lucide-react';
import { DecisionResult, ChatMessage } from '../types/decision';

interface ChatConsultantProps {
  decision: DecisionResult;
}

const QUICK_QUESTIONS = [
  'What are 3 hard questions I must ask before deciding?',
  'How do I test this decision with a 7-day low-risk experiment?',
  'If I pick the recommended option, how do I mitigate the downside?',
  'How can I negotiate or improve the terms of the other option?',
];

export const ChatConsultant: React.FC<ChatConsultantProps> = ({ decision }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `I'm The Tiebreaker. We've evaluated "${decision.decisionTitle}" and recommended "${decision.recommendation.recommendedOption}". What doubts, edge cases, or negotiations would you like to explore?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionContext: decision,
          message: textToSend,
          chatHistory: messages,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get consultant response');
      }

      const data = await res.json();
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response returned.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I ran into an issue connecting to The Tiebreaker advisor. Please check your connection or API key. (${err?.message || 'Error'})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-[600px] overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>Ask The Tiebreaker</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            </h4>
            <p className="text-[11px] text-slate-500">
              Interactive deep-dive consultant for this specific dilemma
            </p>
          </div>
        </div>

        <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
          Grounded in Your Options
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isUser
                    ? 'bg-slate-800 text-white'
                    : 'bg-indigo-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-xs'
                    : 'bg-slate-100/90 text-slate-800 rounded-tl-xs border border-slate-200/60'
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>
                <div
                  className={`mt-1.5 text-[10px] ${
                    isUser ? 'text-slate-400 text-right' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-500 text-xs pl-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <span>The Tiebreaker is evaluating your question...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Sparkles className="h-3 w-3 text-indigo-500" />
            Ideas:
          </span>
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSend(q)}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/70 hover:text-indigo-900 transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input */}
      <div className="border-t border-slate-200 p-3 sm:p-4 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask anything (e.g. 'How should I explain this choice to my family?', 'What if the price changes?')..."
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 active:scale-95 disabled:opacity-40 transition-all"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
