import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Lightbulb,
  Check,
  Shield,
  Target,
  Rocket,
  Flame,
  Feather,
  Hourglass,
  Scale
} from 'lucide-react';
import { POPULAR_PRIORITIES, ADVISOR_LENSES, PresetScenario } from '../data/sampleDecisions';

interface DecisionFormProps {
  onSubmit: (data: {
    decisionTitle: string;
    options: string[];
    context: string;
    priorities: string[];
    advisorLens: string;
  }) => void;
  isLoading: boolean;
  onOpenPresets: () => void;
  initialPreset?: PresetScenario | null;
}

const LENS_ICONS: Record<string, React.ReactNode> = {
  Target: <Target className="h-4 w-4" />,
  Rocket: <Rocket className="h-4 w-4" />,
  ShieldCheck: <Shield className="h-4 w-4" />,
  Flame: <Flame className="h-4 w-4" />,
  Feather: <Feather className="h-4 w-4" />,
  Hourglass: <Hourglass className="h-4 w-4" />,
};

export const DecisionForm: React.FC<DecisionFormProps> = ({
  onSubmit,
  isLoading,
  onOpenPresets,
  initialPreset,
}) => {
  const [title, setTitle] = useState(initialPreset?.title || '');
  const [options, setOptions] = useState<string[]>(
    initialPreset?.options || ['', '']
  );
  const [context, setContext] = useState(initialPreset?.context || '');
  const [showContext, setShowContext] = useState(Boolean(initialPreset?.context));
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(
    initialPreset?.priorities || ['Peace of Mind & Low Stress', 'Financial Upside']
  );
  const [customPriority, setCustomPriority] = useState('');
  const [selectedLens, setSelectedLens] = useState(
    initialPreset?.advisorLens || 'Pragmatic Strategist (Objective, realistic, evidence-focused)'
  );

  // Sync if preset changes
  React.useEffect(() => {
    if (initialPreset) {
      setTitle(initialPreset.title);
      setOptions(initialPreset.options);
      setContext(initialPreset.context);
      setSelectedPriorities(initialPreset.priorities);
      setSelectedLens(initialPreset.advisorLens);
      if (initialPreset.context) setShowContext(true);
    }
  }, [initialPreset]);

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const setYesNoDilemma = () => {
    setOptions(['Yes (Do it / Take the leap)', 'No (Pass / Keep status quo)']);
  };

  const togglePriority = (p: string) => {
    if (selectedPriorities.includes(p)) {
      setSelectedPriorities(selectedPriorities.filter((item) => item !== p));
    } else {
      setSelectedPriorities([...selectedPriorities, p]);
    }
  };

  const addCustomPriority = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPriority.trim() && !selectedPriorities.includes(customPriority.trim())) {
      setSelectedPriorities([...selectedPriorities, customPriority.trim()]);
      setCustomPriority('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Filter non-empty options or fallback to default
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    const finalOptions = validOptions.length >= 2 ? validOptions : ['Option A', 'Option B'];

    onSubmit({
      decisionTitle: title.trim(),
      options: finalOptions,
      context: context.trim(),
      priorities: selectedPriorities,
      advisorLens: selectedLens,
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Intro hero banner */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 border border-indigo-200/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-xs mb-3">
          <Scale className="h-3.5 w-3.5 text-indigo-600" />
          <span>Multi-Perspective AI Decision Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-sans">
          Stuck on a tough choice? Let&apos;s break the tie.
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-2xl mx-auto">
          Input your dilemma. AI conducts a deep pros & cons breakdown, structured SWOT analysis, 
          and weighted multi-criteria comparison to guide your next move.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onOpenPresets}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-200/60 px-3 py-1.5 rounded-full transition-colors"
          >
            <Lightbulb className="h-3.5 w-3.5 text-indigo-600" />
            <span>Need inspiration? Try pre-built dilemmas</span>
          </button>
        </div>
      </div>

      {/* Main Decision Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50"
      >
        {/* Step 1: Dilemma Title */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="decision-title"
              className="text-sm font-bold text-slate-900 flex items-center gap-2"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                1
              </span>
              What decision are you facing?
            </label>
            <span className="text-xs text-slate-400">Required</span>
          </div>
          <input
            id="decision-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Should I accept the startup offer or stay at my current corporate job?"
            className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder-slate-400 text-base shadow-xs focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
          />
        </div>

        {/* Step 2: The Options */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                2
              </span>
              The Options you are weighing
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={setYesNoDilemma}
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600 underline underline-offset-2 transition-colors"
              >
                Set as Yes vs No
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-200/60">
                  {String.fromCharCode(65 + idx)}
                </div>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + idx)} (e.g. ${
                    idx === 0 ? 'Accept the job offer' : 'Stay at current company'
                  })`}
                  className="flex-1 rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove this option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 4 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add another option (up to 4)</span>
            </button>
          )}
        </div>

        {/* Step 3: Priorities & What Matters Most */}
        <div className="mb-6">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
              3
            </span>
            What matters most in this decision?
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Select priority pillars so AI calibrates the weightings and recommendations to your values.
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {POPULAR_PRIORITIES.map((priority) => {
              const isSelected = selectedPriorities.includes(priority);
              return (
                <button
                  key={priority}
                  type="button"
                  onClick={() => togglePriority(priority)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                  <span>{priority}</span>
                </button>
              );
            })}
          </div>

          {/* Add custom priority */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customPriority}
              onChange={(e) => setCustomPriority(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomPriority(e);
                }
              }}
              placeholder="Add your own custom priority (e.g. Low commute, Family time)..."
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addCustomPriority}
              disabled={!customPriority.trim()}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Step 4: Advisor Persona / Lens */}
        <div className="mb-6">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
              4
            </span>
            Advisor Lens & Analytical Perspective
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {ADVISOR_LENSES.map((lens) => {
              const isSelected = selectedLens.includes(lens.name);
              return (
                <div
                  key={lens.id}
                  onClick={() => setSelectedLens(`${lens.name} (${lens.tagline})`)}
                  className={`cursor-pointer rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold text-xs text-slate-900">
                    <span className={`${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>
                      {LENS_ICONS[lens.icon] || <Target className="h-4 w-4" />}
                    </span>
                    <span>{lens.name}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                    {lens.tagline}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 5: Optional Context & Constraints (Accordion) */}
        <div className="mb-8 border-t border-slate-200/80 pt-4">
          <button
            type="button"
            onClick={() => setShowContext(!showContext)}
            className="flex w-full items-center justify-between text-left text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-500" />
              <span>
                {showContext ? 'Hide extra background context' : 'Add background context & constraints (optional)'}
              </span>
            </span>
            {showContext ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showContext && (
            <div className="mt-3">
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
                placeholder="Mention specific constraints, salary numbers, timelines, emotional hurdles, family factors, or previous attempts..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                The more context provided, the sharper and more tailored the SWOT and criteria scores will be.
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          className="group relative flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 hover:from-indigo-500 hover:via-blue-500 hover:to-indigo-600 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Analyzing dilemmas & weighing tradeoffs...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-indigo-200 transition-transform group-hover:rotate-12" />
              <span>Break The Tie & Analyze Decision</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
