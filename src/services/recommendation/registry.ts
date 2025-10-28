// Pluggable scorer registry

import { RecommendationScenario, RecommendRankRequest, CandidateItem } from './types';

export interface Scorer {
  // returns topK and full scored list (used to form alternatives)
  rank(req: RecommendRankRequest): Promise<{
    topK: CandidateItem[];
    coarseList: CandidateItem[]; // length M
    fullPool: CandidateItem[]; // for OOP sampling
  }>;
}

const registry = new Map<RecommendationScenario, Scorer>();

export function registerScorer(scenario: RecommendationScenario, scorer: Scorer) {
  registry.set(scenario, scorer);
}

export function getScorer(scenario: RecommendationScenario): Scorer | undefined {
  return registry.get(scenario);
}
