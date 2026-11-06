import React, { useState } from 'react';
import {
  ThumbsUp,
  ThumbsDown,
  Plus,
  Minus,
  CheckCircle2,
  Circle,
  PlusCircle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react';
import { OptionAnalysis, ProConItem, ImpactLevel } from '../types/decision';

interface ProsConsViewProps {
  options: OptionAnalysis[];
  onUpdateOptions: (updated: OptionAnalysis[]) => void;
}

export const ProsConsView: React.FC<ProsConsViewProps> = ({
  options,
  onUpdateOptions,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'pro' | 'con'>('pro');
  const [newImpact, setNewImpact] = useState<ImpactLevel>('Medium');
  const [newCategory, setNewCategory] = useState('Personal');
  const [targetOptionId, setTargetOptionId] = useState<string>(options[0]?.optionId || '');

  // Toggle item strike-through / checked
  const toggleItemChecked = (optId: string, itemId: string, isPro: boolean) => {
    const updated = options.map((opt) => {
      if (opt.optionId !== optId) return opt;
      if (isPro) {
        return {
          ...opt,
          pros: opt.pros.map((p) =>
            p.id === itemId ? { ...p, checked: !p.checked } : p
          ),
        };
      } else {
        return {
          ...opt,
          cons: opt.cons.map((c) =>
            c.id === itemId ? { ...c, checked: !c.checked } : c
          ),
        };
      }
    });
    onUpdateOptions(updated);
  };

  // Adjust user weight
  const adjustWeight = (
    optId: string,
    itemId: string,
    isPro: boolean,
    delta: number
  ) => {
    const updated = options.map((opt) => {
      if (opt.optionId !== optId) return opt;
      const adjustList = (list: ProConItem[]) =>
        list.map((item) => {
          if (item.id === itemId) {
            const current = item.userWeight ?? (item.impact === 'High' ? 5 : item.impact === 'Medium' ? 3 : 1);
            const next = Math.max(1, Math.min(5, current + delta));
            return { ...item, userWeight: next };
          }
          return item;
        });

      return {
        ...opt,
        pros: isPro ? adjustList(opt.pros) : opt.pros,
        cons: !isPro ? adjustList(opt.cons) : opt.cons,
      };
    });
    onUpdateOptions(updated);
  };

  // Add custom Pro or Con
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: ProConItem = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Custom user-added point',
      impact: newImpact,
      category: newCategory.trim() || 'Custom',
      userWeight: newImpact === 'High' ? 5 : newImpact === 'Medium' ? 3 : 1,
      checked: false,
    };

    const updated = options.map((opt) => {
      if (opt.optionId !== targetOptionId) return opt;
      return {
        ...opt,
        pros: newType === 'pro' ? [...opt.pros, newItem] : opt.pros,
        cons: newType === 'con' ? [...opt.cons, newItem] : opt.cons,
      };
    });

    onUpdateOptions(updated);
    setNewTitle('');
    setNewDesc('');
  };

  // Compute live scores for each option
  const computeScores = (opt: OptionAnalysis) => {
    const proTotal = opt.pros
      .filter((p) => !p.checked)
      .reduce((sum, p) => sum + (p.userWeight ?? (p.impact === 'High' ? 5 : p.impact === 'Medium' ? 3 : 1)), 0);

    const conTotal = opt.cons
      .filter((c) => !c.checked)
      .reduce((sum, c) => sum + (c.userWeight ?? (c.impact === 'High' ? 5 : c.impact === 'Medium' ? 3 : 1)), 0);

    return { proTotal, conTotal, net: proTotal - conTotal };
  };

  const displayedOptions =
    activeTab === 'all'
      ? options
      : options.filter((o) => o.optionId === activeTab);

  return (
    <div className="space-y-6">
      {/* View Filter & Live Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            <span>Interactive Pros & Cons Breakdown</span>
          </h3>
          <p className="text-xs text-slate-500">
            Click items to disregard them, tweak weights (+/-), or add your own thoughts to recalculate net scores.
          </p>
        </div>

        {/* Option Tabs for Mobile / Single View */}
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 p-1 text-xs font-medium text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`rounded-md px-3 py-1.5 transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'hover:text-slate-900'
            }`}
          >
            Side-by-Side (All)
          </button>
          {options.map((opt) => (
            <button
              key={opt.optionId}
              type="button"
              onClick={() => setActiveTab(opt.optionId)}
              className={`rounded-md px-3 py-1.5 transition-all ${
                activeTab === opt.optionId
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              {opt.optionName}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Options */}
      <div
        className={`grid gap-6 ${
          displayedOptions.length === 1
            ? 'grid-cols-1 max-w-2xl mx-auto'
            : displayedOptions.length === 2
            ? 'grid-cols-1 lg:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {displayedOptions.map((opt) => {
          const { proTotal, conTotal, net } = computeScores(opt);

          return (
            <div
              key={opt.optionId}
              className="flex flex-col rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Option Header */}
              <div className="border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 leading-snug">
                      {opt.optionName}
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-500 italic">
                      {opt.tagline}
                    </p>
                  </div>

                  {/* Net Score Badge */}
                  <div
                    className={`shrink-0 rounded-xl px-3 py-1.5 text-right border ${
                      net > 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : net < 0
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Net Balance
                    </div>
                    <div className="text-base font-extrabold flex items-center justify-end gap-1">
                      {net > 0 ? (
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-rose-600" />
                      )}
                      <span>{net > 0 ? `+${net}` : net} pts</span>
                    </div>
                  </div>
                </div>

                {/* Score breakdown pills */}
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    <ThumbsUp className="h-3 w-3" />
                    +{proTotal} Pro Points
                  </span>
                  <span className="flex items-center gap-1 text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                    <ThumbsDown className="h-3 w-3" />
                    -{conTotal} Con Points
                  </span>
                </div>
              </div>

              {/* Best If Callout */}
              <div className="mb-5 rounded-lg bg-indigo-50/60 border border-indigo-100 p-2.5 text-xs text-indigo-900">
                <span className="font-bold text-indigo-700">Best path if: </span>
                {opt.bestIf}
              </div>

              {/* Pros List */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>Pros ({opt.pros.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Weight (1-5)</span>
                </div>

                <div className="space-y-2.5">
                  {opt.pros.map((pro) => {
                    const weight = pro.userWeight ?? (pro.impact === 'High' ? 5 : pro.impact === 'Medium' ? 3 : 1);
                    return (
                      <div
                        key={pro.id}
                        className={`group relative rounded-xl border p-3 transition-all ${
                          pro.checked
                            ? 'border-slate-200 bg-slate-50 opacity-40 line-through'
                            : 'border-emerald-100 bg-emerald-50/30 hover:border-emerald-300 hover:bg-emerald-50/60'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleItemChecked(opt.optionId, pro.id, true)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors"
                            title={pro.checked ? 'Re-enable this pro' : 'Disregard / strike out this pro'}
                          >
                            {pro.checked ? (
                              <CheckCircle2 className="h-4 w-4 text-slate-400" />
                            ) : (
                              <Circle className="h-4 w-4 text-emerald-500" />
                            )}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="text-xs font-bold text-slate-900">
                                {pro.title}
                              </span>
                              <span className="rounded-full bg-emerald-100/80 px-2 py-0.2 text-[10px] font-semibold text-emerald-800">
                                {pro.category}
                              </span>
                              <span className="text-[10px] font-medium text-emerald-600">
                                • {pro.impact} Impact
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {pro.description}
                            </p>
                          </div>

                          {/* Weight Stepper */}
                          {!pro.checked && (
                            <div className="flex flex-col items-center gap-0.5 shrink-0 pl-1">
                              <button
                                type="button"
                                onClick={() => adjustWeight(opt.optionId, pro.id, true, 1)}
                                className="h-5 w-5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px] font-bold"
                                title="Increase weight"
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </button>
                              <span className="text-xs font-extrabold text-emerald-800">
                                {weight}
                              </span>
                              <button
                                type="button"
                                onClick={() => adjustWeight(opt.optionId, pro.id, true, -1)}
                                className="h-5 w-5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px] font-bold"
                                title="Decrease weight"
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cons List */}
              <div className="space-y-3 mt-auto">
                <div className="flex items-center justify-between text-xs font-bold text-rose-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <ThumbsDown className="h-3.5 w-3.5" />
                    <span>Cons ({opt.cons.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Weight (1-5)</span>
                </div>

                <div className="space-y-2.5">
                  {opt.cons.map((con) => {
                    const weight = con.userWeight ?? (con.impact === 'High' ? 5 : con.impact === 'Medium' ? 3 : 1);
                    return (
                      <div
                        key={con.id}
                        className={`group relative rounded-xl border p-3 transition-all ${
                          con.checked
                            ? 'border-slate-200 bg-slate-50 opacity-40 line-through'
                            : 'border-rose-100 bg-rose-50/30 hover:border-rose-300 hover:bg-rose-50/60'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => toggleItemChecked(opt.optionId, con.id, false)}
                            className="mt-0.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title={con.checked ? 'Re-enable this con' : 'Disregard / strike out this con'}
                          >
                            {con.checked ? (
                              <CheckCircle2 className="h-4 w-4 text-slate-400" />
                            ) : (
                              <Circle className="h-4 w-4 text-rose-400" />
                            )}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="text-xs font-bold text-slate-900">
                                {con.title}
                              </span>
                              <span className="rounded-full bg-rose-100/80 px-2 py-0.2 text-[10px] font-semibold text-rose-800">
                                {con.category}
                              </span>
                              <span className="text-[10px] font-medium text-rose-600">
                                • {con.impact} Impact
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {con.description}
                            </p>
                          </div>

                          {/* Weight Stepper */}
                          {!con.checked && (
                            <div className="flex flex-col items-center gap-0.5 shrink-0 pl-1">
                              <button
                                type="button"
                                onClick={() => adjustWeight(opt.optionId, con.id, false, 1)}
                                className="h-5 w-5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 flex items-center justify-center text-[10px] font-bold"
                                title="Increase weight"
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </button>
                              <span className="text-xs font-extrabold text-rose-800">
                                {weight}
                              </span>
                              <button
                                type="button"
                                onClick={() => adjustWeight(opt.optionId, con.id, false, -1)}
                                className="h-5 w-5 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 flex items-center justify-center text-[10px] font-bold"
                                title="Decrease weight"
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Point Form */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
        <div className="flex items-center gap-2 mb-3">
          <PlusCircle className="h-4 w-4 text-indigo-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Have a factor the AI didn&apos;t mention? Add your own Pro or Con
          </h4>
        </div>

        <form onSubmit={handleAddCustomItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-3">
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Apply to Option
            </label>
            <select
              value={targetOptionId}
              onChange={(e) => setTargetOptionId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {options.map((opt) => (
                <option key={opt.optionId} value={opt.optionId}>
                  {opt.optionName}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Type
            </label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'pro' | 'con')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="pro">Pro (Advantage)</option>
              <option value="con">Con (Disadvantage)</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Title / Point
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Free gym on-site, or high learning curve"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Impact
            </label>
            <select
              value={newImpact}
              onChange={(e) => setNewImpact(e.target.value as ImpactLevel)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="High">High Impact (5)</option>
              <option value="Medium">Medium Impact (3)</option>
              <option value="Low">Low Impact (1)</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
