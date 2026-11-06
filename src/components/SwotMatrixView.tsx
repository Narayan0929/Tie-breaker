import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Sparkles, AlertTriangle, Compass } from 'lucide-react';
import { OptionAnalysis } from '../types/decision';

interface SwotMatrixViewProps {
  options: OptionAnalysis[];
}

export const SwotMatrixView: React.FC<SwotMatrixViewProps> = ({ options }) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    options[0]?.optionId || ''
  );

  const currentOption =
    options.find((o) => o.optionId === selectedOptionId) || options[0];

  if (!currentOption) return null;

  const { swot } = currentOption;

  return (
    <div className="space-y-6">
      {/* Header bar and option selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Compass className="h-5 w-5 text-indigo-600" />
            <span>Strategic SWOT Matrix</span>
          </h3>
          <p className="text-xs text-slate-500">
            Strengths, Weaknesses, Opportunities & Threats mapped across internal and external factors.
          </p>
        </div>

        {/* Option Tabs */}
        <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {options.map((opt) => (
            <button
              key={opt.optionId}
              type="button"
              onClick={() => setSelectedOptionId(opt.optionId)}
              className={`rounded-lg px-3.5 py-1.5 transition-all ${
                selectedOptionId === opt.optionId
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.optionName}
            </button>
          ))}
        </div>
      </div>

      {/* Option Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Displaying Matrix For
          </div>
          <div className="text-base font-extrabold text-slate-900">
            {currentOption.optionName}
          </div>
          <p className="text-xs text-slate-500 italic mt-0.5">
            {currentOption.tagline}
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs text-indigo-800">
          <span className="font-bold">Strategic Posture: </span>
          {currentOption.bestIf}
        </div>
      </div>

      {/* 2x2 SWOT Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top-Left: STRENGTHS */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-emerald-200/80 pb-3 mb-3">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm tracking-wide">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span>STRENGTHS</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-full">
              Internal • Helpful
            </span>
          </div>

          <p className="text-xs text-emerald-900/80 mb-3 font-medium">
            Unique advantages, proprietary assets, and core competencies you control:
          </p>

          <ul className="space-y-2 text-xs text-slate-800 flex-1">
            {swot.strengths.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-lg bg-white/80 border border-emerald-100 p-2.5 shadow-2xs"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white mt-0.5">
                  ✓
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top-Right: WEAKNESSES */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-3 mb-3">
            <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm tracking-wide">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <AlertCircle className="h-4 w-4" />
              </div>
              <span>WEAKNESSES</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100/70 px-2 py-0.5 rounded-full">
              Internal • Harmful
            </span>
          </div>

          <p className="text-xs text-amber-900/80 mb-3 font-medium">
            Inherent vulnerabilities, resource bottlenecks, and structural friction:
          </p>

          <ul className="space-y-2 text-xs text-slate-800 flex-1">
            {swot.weaknesses.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-lg bg-white/80 border border-amber-100 p-2.5 shadow-2xs"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white mt-0.5">
                  !
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom-Left: OPPORTUNITIES */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-sky-200/80 pb-3 mb-3">
            <div className="flex items-center gap-2 text-sky-800 font-extrabold text-sm tracking-wide">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <span>OPPORTUNITIES</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-100/70 px-2 py-0.5 rounded-full">
              External • Helpful
            </span>
          </div>

          <p className="text-xs text-sky-900/80 mb-3 font-medium">
            Positive tailwinds, market catalysts, and upside that this path unlocks:
          </p>

          <ul className="space-y-2 text-xs text-slate-800 flex-1">
            {swot.opportunities.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-lg bg-white/80 border border-sky-100 p-2.5 shadow-2xs"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-600 text-[10px] font-bold text-white mt-0.5">
                  ★
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom-Right: THREATS */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-rose-200/80 pb-3 mb-3">
            <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm tracking-wide">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <span>THREATS</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-100/70 px-2 py-0.5 rounded-full">
              External • Harmful
            </span>
          </div>

          <p className="text-xs text-rose-900/80 mb-3 font-medium">
            Exogenous risks, competitive shifts, regulatory changes, or worst-case pitfalls:
          </p>

          <ul className="space-y-2 text-xs text-slate-800 flex-1">
            {swot.threats.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-lg bg-white/80 border border-rose-100 p-2.5 shadow-2xs"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white mt-0.5">
                  ✕
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
