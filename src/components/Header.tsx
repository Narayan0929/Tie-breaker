import React from 'react';
import {
  Scale,
  History,
  PlusCircle,
  Sparkles,
  BookOpen,
  Gamepad2,
  Mic,
  MessageSquare
} from 'lucide-react';

interface HeaderProps {
  onNewDecision: () => void;
  onOpenHistory: () => void;
  onOpenPresets: () => void;
  onLaunchGame: () => void;
  onOpenLiveVoice: () => void;
  onOpenChatbot: () => void;
  savedCount: number;
  hasActiveDecision: boolean;
  isChatbotActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNewDecision,
  onOpenHistory,
  onOpenPresets,
  onLaunchGame,
  onOpenLiveVoice,
  onOpenChatbot,
  savedCount,
  hasActiveDecision,
  isChatbotActive,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div
          onClick={onNewDecision}
          className="flex cursor-pointer items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 shadow-md shadow-indigo-500/20 text-white">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 font-sans">
                The Tiebreaker
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200/60">
                <Sparkles className="h-3 w-3 text-indigo-500" />
                AI Suite
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
              Turn tough dilemmas into crystal-clear decisions
            </p>
          </div>
        </div>

        {/* Feature Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Gemini Live Voice Advisor */}
          <button
            type="button"
            onClick={onOpenLiveVoice}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 shadow-2xs transition-all"
            title="Talk in real-time with Gemini 3.8 Live API"
          >
            <Mic className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
            <span className="hidden sm:inline">Live Voice</span>
          </button>

          {/* Dedicated Gemini Chatbot */}
          <button
            type="button"
            onClick={onOpenChatbot}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold transition-all shadow-2xs ${
              isChatbotActive
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Multi-turn Gemini Decision Chatbot"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Chatbot</span>
          </button>

          {/* Interactive Game Shell */}
          <button
            type="button"
            onClick={onLaunchGame}
            className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-purple-700 hover:from-purple-100 hover:to-indigo-100 transition-all shadow-2xs"
            title="Launch 60fps Equilibrium Trial Game"
          >
            <Gamepad2 className="h-3.5 w-3.5 text-purple-600" />
            <span className="hidden sm:inline">Play Game</span>
          </button>

          {/* Examples */}
          <button
            type="button"
            onClick={onOpenPresets}
            className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
            title="Browse sample dilemmas"
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
            <span>Examples</span>
          </button>

          {/* Saved History */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Saved</span>
            {savedCount > 0 && (
              <span className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
                {savedCount}
              </span>
            )}
          </button>

          {hasActiveDecision && (
            <button
              type="button"
              onClick={onNewDecision}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 sm:py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-98 transition-all"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
