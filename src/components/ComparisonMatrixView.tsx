import React, { useState } from 'react';
import {
  Sliders,
  Award,
  HelpCircle,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Trophy
} from 'lucide-react';
import { ComparisonCriterion, OptionAnalysis } from '../types/decision';
import { triggerTiebreakerConfetti } from '../utils/confetti';

interface ComparisonMatrixViewProps {
  criteria: ComparisonCriterion[];
  options: OptionAnalysis[];
  onUpdateCriteria: (updated: ComparisonCriterion[]) => void;
}

export const ComparisonMatrixView: React.FC<ComparisonMatrixViewProps> = ({
  criteria,
  options,
  onUpdateCriteria,
}) => {
  const [activeExplainId, setActiveExplainId] = useState<string | null>(null);

  // Handle changing user weight for a criterion (1 to 5)
  const handleWeightChange = (critId: string, newWeight: number) => {
    const updated = criteria.map((c) =>
      c.id === critId ? { ...c, userWeight: newWeight } : c
    );
    onUpdateCriteria(updated);
  };

  // Reset weights to default
  const resetWeights = () => {
    const updated = criteria.map((c) => ({
      ...c,
      userWeight: c.importance === 'Critical' ? 5 : c.importance === 'Important' ? 3 : 2,
    }));
    onUpdateCriteria(updated);
  };

  // Calculate weighted totals for each option
  const optionNames = options.map((o) => o.optionName);

  const totalPossibleWeight = criteria.reduce(
    (sum, c) => sum + (c.userWeight ?? (c.importance === 'Critical' ? 5 : c.importance === 'Important' ? 3 : 2)),
    0
  );

  const scoresByOption: Record<string, { rawSum: number; weightedSum: number; maxWeighted: number; weightedPercentage: number }> = {};

  optionNames.forEach((optName) => {
    let rawSum = 0;
    let weightedSum = 0;
    let maxWeighted = 0;

    criteria.forEach((c) => {
      const score = c.scores[optName] ?? 5;
      const weight = c.userWeight ?? (c.importance === 'Critical' ? 5 : c.importance === 'Important' ? 3 : 2);
      rawSum += score;
      weightedSum += score * weight;
      maxWeighted += 10 * weight;
    });

    const weightedPercentage = maxWeighted > 0 ? Math.round((weightedSum / maxWeighted) * 100) : 0;
    scoresByOption[optName] = { rawSum, weightedSum, maxWeighted, weightedPercentage };
  });

  // Determine top winning option by weighted percentage
  let topOption = optionNames[0] || '';
  let highestPercentage = -1;
  optionNames.forEach((opt) => {
    if ((scoresByOption[opt]?.weightedPercentage ?? 0) > highestPercentage) {
      highestPercentage = scoresByOption[opt]?.weightedPercentage ?? 0;
      topOption = opt;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-600" />
            <span>Interactive Multi-Criteria Decision Matrix</span>
          </h3>
          <p className="text-xs text-slate-500">
            Slide importance weights to test scenarios. Watch the mathematical winner adapt in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={resetWeights}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Weights</span>
        </button>
      </div>

      {/* Dynamic Calculated Winner Card */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-blue-50/80 to-purple-50/80 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-indigo-700">
                Current Weighted Leader
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {highestPercentage}% Match
              </span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">
              {topOption}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => triggerTiebreakerConfetti()}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>Celebrate & Lock It In</span>
        </button>
      </div>

      {/* The Matrix Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="py-3.5 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px] min-w-[220px]">
                Evaluation Criterion
              </th>
              <th className="py-3.5 px-3 font-bold text-slate-700 uppercase tracking-wider text-[11px] w-[140px]">
                Importance Weight
              </th>
              {options.map((opt) => (
                <th
                  key={opt.optionId}
                  className={`py-3.5 px-4 font-bold text-slate-800 text-[12px] min-w-[180px] ${
                    opt.optionName === topOption ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-extrabold text-slate-900">{opt.optionName}</span>
                    {opt.optionName === topOption && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        <Award className="h-2.5 w-2.5" />
                        Leader
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {criteria.map((c) => {
              const currentWeight = c.userWeight ?? (c.importance === 'Critical' ? 5 : c.importance === 'Important' ? 3 : 2);
              const isExplaining = activeExplainId === c.id;

              return (
                <React.Fragment key={c.id}>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    {/* Criterion Name & Description */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>{c.criteriaName}</span>
                        <button
                          type="button"
                          onClick={() => setActiveExplainId(isExplaining ? null : c.id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Show AI breakdown and rationale"
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 leading-snug">
                        {c.description}
                      </p>
                    </td>

                    {/* Weight Slider */}
                    <td className="py-3.5 px-3 align-top">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              c.importance === 'Critical'
                                ? 'bg-rose-100 text-rose-800'
                                : c.importance === 'Important'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {currentWeight}x Multiplier
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={currentWeight}
                          onChange={(e) => handleWeightChange(c.id, Number(e.target.value))}
                          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                        />
                      </div>
                    </td>

                    {/* Option Scores */}
                    {options.map((opt) => {
                      const score = c.scores[opt.optionName] ?? 5;
                      const isWinner = c.winnerOption.toLowerCase().includes(opt.optionName.toLowerCase());

                      return (
                        <td
                          key={opt.optionId}
                          className={`py-3.5 px-4 align-top ${
                            opt.optionName === topOption ? 'bg-indigo-50/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-xs text-slate-900">
                              {score}/10
                            </span>
                            {isWinner && (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                                Best
                              </span>
                            )}
                          </div>
                          {/* Progress bar */}
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                score >= 8
                                  ? 'bg-emerald-500'
                                  : score >= 6
                                  ? 'bg-indigo-500'
                                  : score >= 4
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${score * 10}%` }}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Accordion / Tooltip Explanation */}
                  {isExplaining && (
                    <tr className="bg-indigo-50/40">
                      <td colSpan={2 + options.length} className="px-4 py-2.5 border-t border-b border-indigo-100 text-xs text-slate-700">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-indigo-700 shrink-0">Analysis:</span>
                          <span>{c.why}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Matrix Footer Totals */}
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
              <td className="py-4 px-4 text-xs font-extrabold uppercase text-slate-700">
                Weighted Total Score
              </td>
              <td className="py-4 px-3 text-xs text-slate-500">
                Sum of (Score × Weight)
              </td>
              {options.map((opt) => {
                const data = scoresByOption[opt.optionName];
                const isOverallWinner = opt.optionName === topOption;

                return (
                  <td
                    key={opt.optionId}
                    className={`py-4 px-4 ${
                      isOverallWinner ? 'bg-indigo-100/60 text-indigo-950' : 'text-slate-800'
                    }`}
                  >
                    <div className="text-base font-extrabold">
                      {data?.weightedPercentage}%
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {data?.weightedSum} / {data?.maxWeighted} pts
                    </div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
