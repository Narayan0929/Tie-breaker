export type ImpactLevel = 'High' | 'Medium' | 'Low';
export type ReversibilityLevel = 'Easily Reversible' | 'Moderately Reversible' | 'Hard to Reverse';
export type ImportanceLevel = 'Critical' | 'Important' | 'Nice-to-have';

export interface ProConItem {
  id: string;
  title: string;
  description: string;
  impact: ImpactLevel;
  category: string;
  userWeight?: number; // 1-5 default 3
  checked?: boolean; // user can uncheck or strike out
}

export interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface OptionAnalysis {
  optionId: string;
  optionName: string;
  tagline: string;
  pros: ProConItem[];
  cons: ProConItem[];
  swot: SwotData;
  bestIf: string;
}

export interface ComparisonCriterion {
  id: string;
  criteriaName: string;
  description: string;
  importance: ImportanceLevel;
  scores: Record<string, number>; // optionName -> score (1-10)
  winnerOption: string;
  why: string;
  userWeight?: number; // 1-5 for interactive weighted scoring
}

export interface WorstCaseItem {
  optionName: string;
  worstCase: string;
  likelihood: 'Low' | 'Medium' | 'High';
  reversibility: ReversibilityLevel;
  mitigationStrategy: string;
}

export interface DecisionResult {
  id: string;
  decisionTitle: string;
  createdAt: string;
  advisorLens: string;
  priorities: string[];
  userContext?: string;
  executiveSummary: string;
  recommendation: {
    recommendedOption: string;
    confidencePercentage: number;
    verdict: string;
    keyTradeoff: string;
    immediateNextStep: string;
  };
  options: OptionAnalysis[];
  comparisonMatrix: ComparisonCriterion[];
  tenTenTenRule: {
    tenMinutes: string;
    tenMonths: string;
    tenYears: string;
  };
  worstCaseStressTest: WorstCaseItem[];
  devilsAdvocateNudge: string;
  blindSpotsToWatch: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
