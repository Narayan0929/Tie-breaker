import React from 'react';
import { X, Sparkles, ArrowRight, Tag } from 'lucide-react';
import { PRESET_SCENARIOS, PresetScenario } from '../data/sampleDecisions';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: PresetScenario) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Decision Dilemma Presets
              </h3>
              <p className="text-xs text-slate-500">
                Choose a realistic dilemma to test The Tiebreaker&apos;s analysis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preset Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {PRESET_SCENARIOS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
              className="group cursor-pointer rounded-2xl border border-slate-200 p-5 hover:border-indigo-400 hover:bg-indigo-50/20 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                  <Tag className="h-3 w-3 text-slate-500" />
                  <span>{preset.category}</span>
                </span>
                <span className="text-xs font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <span>Load Preset</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {preset.title}
              </h4>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {preset.options.map((opt, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800"
                  >
                    Option {String.fromCharCode(65 + i)}: {opt}
                  </span>
                ))}
              </div>

              <p className="mt-2.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {preset.context}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
