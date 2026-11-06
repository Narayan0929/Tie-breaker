import { DecisionResult } from '../types/decision';

const STORAGE_KEY = 'the_tiebreaker_saved_decisions';

export const getSavedDecisions = (): DecisionResult[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load decisions from storage', e);
    return [];
  }
};

export const saveDecision = (decision: DecisionResult): void => {
  try {
    const existing = getSavedDecisions();
    const filtered = existing.filter((d) => d.id !== decision.id);
    const updated = [decision, ...filtered].slice(0, 30); // keep up to 30 decisions
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save decision', e);
  }
};

export const deleteSavedDecision = (id: string): DecisionResult[] => {
  try {
    const existing = getSavedDecisions();
    const updated = existing.filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete decision', e);
    return [];
  }
};
