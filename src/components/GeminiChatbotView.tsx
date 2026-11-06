import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Zap,
  Target,
  Brain,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  Info
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

const ROLES = [
  {
    id: 'rapid',
    name: 'Rapid Pragmatist',
    model: 'gemini-3.1-flash-lite',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-50 border-amber-200 text-amber-800',
    description: 'Fast, high-density bulleted advice and rapid gut-checks (gemini-3.1-flash-lite).',
    starterPrompts: [
      'Give me a 30-second rapid pros/cons on leasing vs buying a car.',
      'What is the single most common mistake people make when choosing a job offer?',
      'How can I break a deadlock between two good vacation spots in under 5 minutes?',
    ],
  },
  {
    id: 'general',
    name: 'Strategic Consultant',
    model: 'gemini-3.8-flash',
    icon: Target,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
    description: 'General decision-making, balanced tradeoffs, and mental models (gemini-3.8-flash).',
    starterPrompts: [
      'Help me weigh staying in my current apartment vs moving into a fixer-upper house.',
      'How should I structure a decision matrix between 3 competing software vendors?',
      'How do I overcome the sunk cost fallacy on a project I worked on for 6 months?',
    ],
  },
  {
    id: 'complex',
    name: 'Game Theory & Reasoning',
    model: 'gemini-4-argon',
    icon: Brain,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200 text-purple-800',
    description: 'Complex multi-stage dilemmas, Nash equilibriums, and probabilistic modeling (gemini-4-argon).',
    starterPrompts: [
      'Model the game theory and strategic dynamics of negotiating an equity split with a cofounder.',
      'Analyze the expected value (EV) and payoff matrix for self-funding vs venture capital.',
      'How should I model the second-order downstream effects of expanding our product into Europe?',
    ],
  },
];

interface GeminiChatbotViewProps {
  initialDecisionContext?: string;
}

export const GeminiChatbotView: React.FC<GeminiChatbotViewProps> = ({
  initialDecisionContext,
}) => {
  const [selectedRole, setSelectedRole] = useState(ROLES[1]); // Default to Strategic Consultant
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'model',
      content: initialDecisionContext
        ? `Hello! I am your AI decision advisor. I see you are evaluating: "${initialDecisionContext}". How can I help you analyze, stress-test, or break the tie?`
        : `Hello! I am The Tiebreaker AI Chatbot. You can switch roles above between Rapid Pragmatist (gemini-3.1-flash-lite), Strategic Consultant (gemini-3.8-flash), or Complex Game Theory Analyst (gemini-4-argon). What decision is on your mind?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: ROLES[1].model,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          roleId: selectedRole.id,
          modelPreference: selectedRole.model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: data.reply || 'No response returned.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedRole.model,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `I encountered an issue generating a response: ${err?.message || 'Check your Gemini API key in Settings > Secrets'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedRole.model,
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'model',
        content: `Conversation reset. I am operating as ${selectedRole.name} using ${selectedRole.model}. What choice would you like to explore?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedRole.model,
      },
    ]);
  };

  const copyToClipboard = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch (_) {}
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Role Selection Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-600" />
              <span>Multi-Turn Gemini Decision Chatbot</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select an analytical role with specialized system instructions and routed models
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetChat}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        </div>

        {/* 3 Role Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole.id === role.id;

            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`cursor-pointer rounded-xl border p-3 transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                    <Icon className={`h-4 w-4 ${role.color}`} />
                    <span>{role.name}</span>
                  </div>
                  <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[9px] font-mono font-semibold text-slate-700">
                    {role.model}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {role.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Thread Box */}
      <div className="flex flex-col h-[620px] rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Thread messages container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';

            return (
              <div
                key={m.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-2xs ${
                    isUser
                      ? 'bg-slate-800 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`group relative max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-slate-100/90 text-slate-800 rounded-tl-xs border border-slate-200/70'
                  }`}
                >
                  {!isUser && (
                    <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1">
                      <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-500" />
                        {selectedRole.name}
                      </span>
                      {m.modelUsed && (
                        <span className="text-[9px] font-mono text-slate-400">
                          {m.modelUsed}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="whitespace-pre-line leading-relaxed font-normal">
                    {m.content}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{m.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(m.id, m.content)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-slate-600 transition-opacity"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3 pl-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-2xl bg-slate-100 p-3.5 text-xs text-slate-600 border border-slate-200">
                <span>{selectedRole.name} is evaluating using {selectedRole.model}...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pill Row */}
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              Try asking:
            </span>
            {selectedRole.starterPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                disabled={isLoading}
                onClick={() => handleSend(prompt)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/80 hover:text-indigo-900 transition-all disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <div className="border-t border-slate-200 p-4 bg-white">
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
              placeholder={`Message ${selectedRole.name} (${selectedRole.model})...`}
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
    </div>
  );
};
