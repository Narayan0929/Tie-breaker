import React from 'react';
import { Award, AlertTriangle, ArrowRight, Share2, Sparkles, Dices, BookmarkCheck } from 'lucide-react';
import { DecisionResult } from '../types/decision';

interface VerdictHeroProps {
  decision: DecisionResult;
  onOpenTiebreakerLab: () => void;
  onExport: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export const VerdictHero: React.FC<VerdictHeroProps> = ({
  decision,
  onOpenTiebreakerLab,
  onExport,
  isSaved,
  onToggleSave,
}) => {
  const { recommendation, executiveSummary, decisionTitle } = decision;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />

      {/* Top Meta info */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>AI Executive Recommendation</span>
          </div>
          <h2 className="mt-1 text-lg sm:text-xl font-bold tracking-tight text-white line-clamp-1">
            {decisionTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleSave}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isSaved
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
            }`}
          >
            <BookmarkCheck className="h-3.5 w-3.5" />
            <span>{isSaved ? 'Saved to History' : 'Save Decision'}</span>
          </button>

          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Export / Copy</span>
          </button>

          <button
            type="button"
            onClick={onOpenTiebreakerLab}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
          >
            <Dices className="h-3.5 w-3.5 text-indigo-200" />
            <span>Gut-Check Lab</span>
          </button>
        </div>
      </div>

      {/* Main Verdict Section */}
      <div className="relative z-10 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: The Winner & Verdict (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-baseline gap-3">
            <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
              The Recommended Path
            </span>
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
              <Award className="h-3.5 w-3.5 text-emerald-400" />
              <span>{recommendation.confidencePercentage}% Confidence</span>
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            &ldquo;{recommendation.recommendedOption}&rdquo;
          </h3>

          <p className="text-base text-indigo-100/90 font-medium italic border-l-2 border-indigo-400 pl-3">
            {recommendation.verdict}
          </p>

          <p className="text-sm text-slate-300 leading-relaxed">
            {executiveSummary}
          </p>
        </div>

        {/* Right: The Critical Tradeoff & Immediate Next Step (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Key Tradeoff */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>The Core Tradeoff You Accept</span>
            </div>
            <p className="mt-1.5 text-xs text-amber-100/90 leading-relaxed">
              {recommendation.keyTradeoff}
            </p>
          </div>

          {/* Immediate Next Step */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 backdrop-blur-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
              <ArrowRight className="h-4 w-4 text-emerald-400" />
              <span>Next 24-Hour Action Test</span>
            </div>
            <p className="mt-1.5 text-xs text-emerald-100/90 leading-relaxed">
              {recommendation.immediateNextStep}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
