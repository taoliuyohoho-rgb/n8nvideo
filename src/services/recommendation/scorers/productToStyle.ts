import { PrismaClient } from '@prisma/client';
import { Scorer } from '../registry';
import { RecommendRankRequest, CandidateItem } from '../types';
import { DEFAULT_M_COARSE, DEFAULT_K_FINE, buildSegmentKey, SCENARIO_SEGMENT_TEMPLATES } from '../constants';

const prisma = new PrismaClient();

function linearScore(features: Record<string, number>, weights: Record<string, number>): number {
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  let s = 0;
  for (const k of Object.keys(weights)) s += (features[k] || 0) * weights[k];
  return s / total;
}

export const productToStyleScorer: Scorer = {
  async rank(req: RecommendRankRequest) {
    const m = DEFAULT_M_COARSE;
    const k = DEFAULT_K_FINE;

    // full pool: active styles
    const styles = await prisma.style.findMany({ where: { isActive: true } });

    // build features for coarse scoring
    const coarseScored: CandidateItem[] = styles.map((s) => {
      const f: Record<string, number> = {};
      // category match
      f.categoryMatch = req.task.category && s.category === req.task.category ? 1 : 0.5;
      // language heuristic (if provided)
      f.languageMatch = req.task.language ? 1 : 0.7;
      // platform fit (if provided)
      f.platformFit = req.task.channel ? 1 : 0.7;
      // simple tone variety encouragement (unknown tone=0.5)
      f.toneFit = s.tone ? 0.8 : 0.5;

      const score = linearScore(f, { categoryMatch: 1.0, languageMatch: 0.6, platformFit: 0.6, toneFit: 0.3 });
      return {
        id: s.id,
        type: 'style',
        title: s.name,
        summary: s.description || undefined,
        coarseScore: score,
        reason: f,
      } as CandidateItem;
    });

    // sort by coarse and take M
    coarseScored.sort((a, b) => (b.coarseScore || 0) - (a.coarseScore || 0));
    const coarseTopM = coarseScored.slice(0, m);

    // fine scoring: add simple historical metric (placeholder 0.7)
    const fineList = coarseTopM.map((c) => ({
      ...c,
      fineScore: (c.coarseScore || 0) * 0.7 + 0.3, // placeholder fine
    }));

    // diversity: ensure at least two distinct tones if possible
    const toneMap: Record<string, CandidateItem[]> = {};
    for (const c of fineList) {
      const tone = (styles.find(s => s.id === c.id)?.tone || 'unknown').toLowerCase();
      toneMap[tone] = toneMap[tone] || [];
      toneMap[tone].push(c);
    }

    fineList.sort((a, b) => (b.fineScore || 0) - (a.fineScore || 0));
    const topK: CandidateItem[] = [];
    for (const c of fineList) {
      if (topK.length >= k) break;
      // simple diversity: avoid same tone dominance
      const tone = (styles.find(s => s.id === c.id)?.tone || 'unknown').toLowerCase();
      const hasSameTone = topK.some(t => (styles.find(s => s.id === t.id)?.tone || 'unknown').toLowerCase() === tone);
      if (hasSameTone && topK.length < k - 1) {
        // allow but try to keep one slot for different tone
        topK.push(c);
      } else if (!hasSameTone) {
        topK.push(c);
      } else if (topK.length === 0) {
        topK.push(c);
      }
    }
    while (topK.length < Math.min(k, fineList.length)) topK.push(fineList[topK.length]);

    return {
      topK,
      coarseList: coarseTopM,
      fullPool: coarseScored, // using all styles as pool for OOP sampling until we add hard constraints filtering list
    };
  },
};
