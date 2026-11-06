import React, { useState, useEffect } from 'react';
import {
  Scale,
  Layers,
  Sliders,
  Compass,
  Dices,
  MessageSquare,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Share2,
  BookmarkCheck,
  Gamepad2,
  Mic,
  Bot
} from 'lucide-react';
import { Header } from './components/Header';
import { DecisionForm } from './components/DecisionForm';
import { VerdictHero } from './components/VerdictHero';
import { ProsConsView } from './components/ProsConsView';
import { ComparisonMatrixView } from './components/ComparisonMatrixView';
import { SwotMatrixView } from './components/SwotMatrixView';
import { TiebreakerLab } from './components/TiebreakerLab';
import { ChatConsultant } from './components/ChatConsultant';
import { GeminiChatbotView } from './components/GeminiChatbotView';
import { TiebreakerGame } from './components/TiebreakerGame';
import { LiveVoiceModal } from './components/LiveVoiceModal';
import { HistoryModal } from './components/HistoryModal';
import { ExportModal } from './components/ExportModal';
import { PresetsModal } from './components/PresetsModal';
import { DecisionResult, OptionAnalysis, ComparisonCriterion } from './types/decision';
import { getSavedDecisions, saveDecision, deleteSavedDecision } from './utils/storage';
import { PresetScenario } from './data/sampleDecisions';
import { triggerTiebreakerConfetti } from './utils/confetti';

type ActiveTab = 'pros_cons' | 'matrix' | 'swot' | 'tiebreaker' | 'chat';

export default function App() {
  const [activeDecision, setActiveDecision] = useState<DecisionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Consulting AI Decision Engine...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('pros_cons');
  const [savedDecisions, setSavedDecisions] = useState<DecisionResult[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetScenario | null>(null);

  // New Feature States: Game Shell, Live Voice API, and Standalone Chatbot
  const [isGameActive, setIsGameActive] = useState(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [isChatbotActive, setIsChatbotActive] = useState(false);

  // Load saved history on mount
  useEffect(() => {
    setSavedDecisions(getSavedDecisions());
  }, []);

  // Cycling loading steps for rich UX
  useEffect(() => {
    if (!isLoading) return;
    const steps = [
      'Mapping decision criteria and constraint boundaries...',
      'Synthesizing multi-option Pros & Cons with impact weighting...',
      'Constructing 4-quadrant SWOT matrices...',
      'Running 10/10/10 temporal horizons and reversibility stress tests...',
      'Formulating executive Tiebreaker verdict & action steps...',
    ];
    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const interval = setInterval(() => {
      stepIdx = (stepIdx + 1) % steps.length;
      setLoadingStep(steps[stepIdx]);
    }, 2400);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Check if current decision is saved
  const isCurrentSaved = Boolean(
    activeDecision && savedDecisions.some((d) => d.id === activeDecision.id)
  );

  const handleToggleSave = () => {
    if (!activeDecision) return;
    if (isCurrentSaved) {
      const updated = deleteSavedDecision(activeDecision.id);
      setSavedDecisions(updated);
    } else {
      saveDecision(activeDecision);
      setSavedDecisions(getSavedDecisions());
    }
  };

  const handleFormSubmit = async (data: {
    decisionTitle: string;
    options: string[];
    context: string;
    priorities: string[];
    advisorLens: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsChatbotActive(false);

    try {
      const response = await fetch('/api/analyze-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const result: DecisionResult = await response.json();
      setActiveDecision(result);
      setActiveTab('pros_cons');
      saveDecision(result);
      setSavedDecisions(getSavedDecisions());
      triggerTiebreakerConfetti();
    } catch (err: any) {
      console.error('Failed to analyze decision:', err);
      setErrorMessage(
        err?.message ||
          'Failed to communicate with the decision engine. Please verify the Gemini API key in Settings > Secrets.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateOptions = (updatedOptions: OptionAnalysis[]) => {
    if (!activeDecision) return;
    const updated = { ...activeDecision, options: updatedOptions };
    setActiveDecision(updated);
    saveDecision(updated);
  };

  const handleUpdateCriteria = (updatedCriteria: ComparisonCriterion[]) => {
    if (!activeDecision) return;
    const updated = { ...activeDecision, comparisonMatrix: updatedCriteria };
    setActiveDecision(updated);
    saveDecision(updated);
  };

  const handleSelectHistoryItem = (item: DecisionResult) => {
    setActiveDecision(item);
    setActiveTab('pros_cons');
    setIsHistoryOpen(false);
    setIsChatbotActive(false);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteSavedDecision(id);
    setSavedDecisions(updated);
  };

  const handleSelectPreset = (preset: PresetScenario) => {
    setSelectedPreset(preset);
    setActiveDecision(null);
    setIsChatbotActive(false);
  };

  // --- FULL-VIEWPORT GAME SHELL ---
  // Core game craft guideline: never render website navbars or footers when playing game
  if (isGameActive) {
    return (
      <TiebreakerGame
        onExitGame={() => setIsGameActive(false)}
        decisionTitle={activeDecision?.decisionTitle || 'The Trial of Equilibrium'}
        options={activeDecision?.options}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        onNewDecision={() => {
          setActiveDecision(null);
          setSelectedPreset(null);
          setErrorMessage(null);
          setIsChatbotActive(false);
        }}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onLaunchGame={() => setIsGameActive(true)}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onOpenChatbot={() => setIsChatbotActive(!isChatbotActive)}
        savedCount={savedDecisions.length}
        hasActiveDecision={Boolean(activeDecision)}
        isChatbotActive={isChatbotActive}
      />

      <main className="pb-24">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="mx-auto max-w-4xl px-4 pt-4 sm:px-6">
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">Error analyzing decision: </span>
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="font-bold text-rose-600 hover:text-rose-900"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Loading overlay / spinner */}
        {isLoading && (
          <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
            <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
              <Scale className="h-10 w-10 text-indigo-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              The Tiebreaker is at Work
            </h3>
            <p className="mt-2 text-sm text-indigo-600 font-semibold min-h-[1.5rem] transition-all">
              {loadingStep}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Generating balanced pros & cons, multi-criteria comparison, and SWOT perspectives
            </p>
          </div>
        )}

        {/* View Mode 1: Dedicated Multi-turn Gemini Chatbot */}
        {isChatbotActive && !isLoading && (
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsChatbotActive(false)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Decision Analyzer</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLiveVoiceOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Mic className="h-3.5 w-3.5" />
                <span>Switch to Live Voice Advisor</span>
              </button>
            </div>

            <GeminiChatbotView
              initialDecisionContext={activeDecision?.decisionTitle}
            />
          </div>
        )}

        {/* View Mode 2: Input Form (when no active decision, not chatbot, not loading) */}
        {!activeDecision && !isLoading && !isChatbotActive && (
          <DecisionForm
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
            onOpenPresets={() => setIsPresetsOpen(true)}
            initialPreset={selectedPreset}
          />
        )}

        {/* View Mode 3: Active Decision Dashboard */}
        {activeDecision && !isLoading && !isChatbotActive && (
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-8">
            {/* Back button and quick actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveDecision(null);
                  setSelectedPreset(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Change Inputs / Start Over</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsGameActive(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors shadow-2xs"
                >
                  <Gamepad2 className="h-3.5 w-3.5" />
                  <span>Test in 60fps Game</span>
                </button>

                <div className="text-xs text-slate-500">
                  Advisor Lens:{' '}
                  <span className="font-semibold text-slate-800">
                    {activeDecision.advisorLens.split('(')[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Verdict Hero Banner */}
            <VerdictHero
              decision={activeDecision}
              onOpenTiebreakerLab={() => setActiveTab('tiebreaker')}
              onExport={() => setIsExportOpen(true)}
              isSaved={isCurrentSaved}
              onToggleSave={handleToggleSave}
            />

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200">
              <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px">
                <button
                  type="button"
                  onClick={() => setActiveTab('pros_cons')}
                  className={`flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'pros_cons'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Pros & Cons List</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('matrix')}
                  className={`flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'matrix'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <Sliders className="h-4 w-4" />
                  <span>Comparison Matrix & Table</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('swot')}
                  className={`flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'swot'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <Compass className="h-4 w-4" />
                  <span>SWOT Analysis</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('tiebreaker')}
                  className={`flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'tiebreaker'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <Dices className="h-4 w-4" />
                  <span>Tiebreaker Lab & Gut-Check</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`flex items-center gap-2 border-b-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'chat'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Ask The Tiebreaker</span>
                </button>
              </nav>
            </div>

            {/* Active Tab Content Area */}
            <div>
              {activeTab === 'pros_cons' && (
                <ProsConsView
                  options={activeDecision.options}
                  onUpdateOptions={handleUpdateOptions}
                />
              )}

              {activeTab === 'matrix' && (
                <ComparisonMatrixView
                  criteria={activeDecision.comparisonMatrix}
                  options={activeDecision.options}
                  onUpdateCriteria={handleUpdateCriteria}
                />
              )}

              {activeTab === 'swot' && (
                <SwotMatrixView options={activeDecision.options} />
              )}

              {activeTab === 'tiebreaker' && (
                <TiebreakerLab decision={activeDecision} />
              )}

              {activeTab === 'chat' && (
                <ChatConsultant decision={activeDecision} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Live Voice API Modal */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        decisionTitle={activeDecision?.decisionTitle}
      />

      {/* Modals */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedDecisions={savedDecisions}
        onSelectDecision={handleSelectHistoryItem}
        onDeleteDecision={handleDeleteHistoryItem}
      />

      {activeDecision && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          decision={activeDecision}
        />
      )}

      <PresetsModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectPreset={handleSelectPreset}
      />
    </div>
  );
}
