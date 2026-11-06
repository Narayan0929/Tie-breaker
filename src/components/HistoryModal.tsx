import React, { useState } from 'react';
import { X, Search, Trash2, Calendar, Award, ArrowRight } from 'lucide-react';
import { DecisionResult } from '../types/decision';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedDecisions: DecisionResult[];
  onSelectDecision: (decision: DecisionResult) => void;
  onDeleteDecision: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  savedDecisions,
  onSelectDecision,
  onDeleteDecision,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = savedDecisions.filter(
    (d) =>
      d.decisionTitle.toLowerCase().includes(search.toLowerCase()) ||
      d.recommendation.recommendedOption.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Saved Decisions History
            </h3>
            <p className="text-xs text-slate-500">
              Revisit and reload previous decisions analyzed by The Tiebreaker
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search filter */}
        <div className="border-b border-slate-100 bg-slate-50/50 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by decision title or winner..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Decisions List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-slate-700">No saved decisions found</p>
              <p className="mt-1 text-xs text-slate-400">
                Any decision you analyze can be saved to your browser history for later reflection.
              </p>
            </div>
          ) : (
            filtered.map((d) => (
              <div
                key={d.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all"
              >
                <div
                  onClick={() => {
                    onSelectDecision(d);
                    onClose();
                  }}
                  className="flex-1 cursor-pointer min-w-0"
                >
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-600 truncate">{d.advisorLens.split('(')[0]}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {d.decisionTitle}
                  </h4>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                    <Award className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Winner: {d.recommendation.recommendedOption}</span>
                    <span className="text-slate-400 font-normal">
                      ({d.recommendation.confidencePercentage}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDecision(d);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <span>View</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteDecision(d.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
