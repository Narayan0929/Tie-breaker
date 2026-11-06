import React, { useState } from 'react';
import {
  Dices,
  Hourglass,
  ShieldAlert,
  Flame,
  Sparkles,
  Eye,
  RefreshCw,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { DecisionResult } from '../types/decision';
import { triggerTiebreakerConfetti } from '../utils/confetti';

interface TiebreakerLabProps {
  decision: DecisionResult;
}

export const TiebreakerLab: React.FC<TiebreakerLabProps> = ({ decision }) => {
  const { options, tenTenTenRule, worstCaseStressTest, devilsAdvocateNudge, blindSpotsToWatch } = decision;

  // Coin Flip / Wheel state
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<string | null>(null);
  const [flipDegree, setFlipDegree] = useState(0);

  const handleFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setFlipResult(null);

    // Random choice among options
    const randomIndex = Math.floor(Math.random() * options.length);
    const chosen = options[randomIndex]?.optionName || 'Option A';

    // Add multiple rotations
    const newDegree = flipDegree + 1440 + Math.floor(Math.random() * 360);
    setFlipDegree(newDegree);

    setTimeout(() => {
      setFlipResult(chosen);
      setIsFlipping(false);
      triggerTiebreakerConfetti();
    }, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Introduction Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
          <Dices className="h-4 w-4" />
          <span>The Tiebreaker Psychology Lab</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-white">
          Still feeling 50/50? Test your subconscious.
        </h3>
        <p className="mt-2 text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
          Behavioral economics shows when rational analysis ends in a dead heat, our subconscious
          often already knows the right answer. Use these specialized mental models to surface it.
        </p>
      </div>

      {/* Tool 1: The Subconscious Coin Flip / Roulette */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-6">
          <div>
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Dices className="h-5 w-5 text-indigo-600" />
              <span>1. The Gut-Check Coin Flip</span>
            </h4>
            <p className="text-xs text-slate-500">
              Flip the coin. While it spins, or the second it lands, pay sharp attention to your physical reaction.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Comparing:</span>
            {options.map((opt, i) => (
              <span
                key={opt.optionId}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700"
              >
                {opt.optionName}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-6">
          {/* Animated Coin */}
          <div className="relative mb-6 flex h-32 w-32 items-center justify-center">
            <div
              style={{
                transform: `rotateY(${flipDegree}deg)`,
                transition: isFlipping ? 'transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
              }}
              className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-amber-400 bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 shadow-xl shadow-amber-500/30 text-amber-950 font-black text-center text-xs p-2 select-none"
            >
              <div className="flex flex-col items-center">
                <Sparkles className="h-6 w-6 text-amber-900 mb-1" />
                <span className="text-[11px] font-extrabold uppercase tracking-tight">
                  {isFlipping ? 'Tossing...' : flipResult ? 'Result' : 'Tiebreaker'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFlip}
            disabled={isFlipping}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${isFlipping ? 'animate-spin' : ''}`} />
            <span>{isFlipping ? 'Flipping in the air...' : 'Flip The Coin Now'}</span>
          </button>

          {/* Reveal & Gut Check Reaction Prompt */}
          {flipResult && (
            <div className="mt-6 w-full max-w-lg rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 text-center transition-all animate-in fade-in">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                The Coin Selected
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                &ldquo;{flipResult}&rdquo;
              </div>

              {/* Psychological gut reflection */}
              <div className="mt-3 rounded-xl bg-white p-3.5 text-left border border-indigo-100 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 mb-1">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>The Gut Reaction Test (Freud&apos;s Rule)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When you read that result just now: <strong>Did you feel relief or disappointment?</strong> If you felt relief, that choice aligns with your intuition. If you felt even a split-second pang of disappointment or wanted to flip again, your subconscious is telling you to pick the other option!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tool 2: The 10/10/10 Mental Model */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Hourglass className="h-5 w-5 text-indigo-600" />
            <span>2. The 10/10/10 Rule (Suzy Welch Framework)</span>
          </h4>
          <p className="text-xs text-slate-500">
            Decisions look completely different depending on the horizon you view them through.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 10 Minutes */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                In 10 Minutes
              </span>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                Immediate Reaction
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {tenTenTenRule.tenMinutes}
            </p>
          </div>

          {/* 10 Months */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                In 10 Months
              </span>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                Execution Reality
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {tenTenTenRule.tenMonths}
            </p>
          </div>

          {/* 10 Years */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                In 10 Years
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Enduring Legacy
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {tenTenTenRule.tenYears}
            </p>
          </div>
        </div>
      </div>

      {/* Tool 3: Worst-Case Scenario Stress Test & Reversibility */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-indigo-600" />
                <span>3. Worst-Case Stress Test & Reversibility</span>
              </h4>
              <p className="text-xs text-slate-500">
                Jeff Bezos Rule: Is this a two-way door (reversible) or a one-way door (hard to undo)?
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {worstCaseStressTest.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="font-bold text-sm text-slate-900">
                  {item.optionName}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      item.reversibility === 'Easily Reversible'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.reversibility === 'Moderately Reversible'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Door Type: {item.reversibility}
                  </span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                    Likelihood: {item.likelihood}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                <div className="rounded-lg bg-rose-50/60 border border-rose-100 p-3">
                  <span className="font-bold text-rose-800 block mb-1">
                    Realistic Worst-Case Scenario:
                  </span>
                  <span className="text-slate-700">{item.worstCase}</span>
                </div>

                <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3">
                  <span className="font-bold text-emerald-800 block mb-1">
                    Escape Hatch & Mitigation Plan:
                  </span>
                  <span className="text-slate-700">{item.mitigationStrategy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tool 4: Devil's Advocate & Blindspots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Devil's Advocate */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
            <Flame className="h-4 w-4 text-amber-600" />
            <span>Devil&apos;s Advocate Challenge</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed italic">
            &ldquo;{devilsAdvocateNudge}&rdquo;
          </p>
        </div>

        {/* Blind Spots to Watch */}
        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/80 to-indigo-50/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-800 mb-2">
            <Eye className="h-4 w-4 text-purple-600" />
            <span>Critical Blind Spots & Sunk Costs</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {blindSpotsToWatch.map((spot, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                <span>{spot}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
