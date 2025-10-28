interface Top5Item {
  text: string;
  score: number;
  reason: string;
  source: string;
  weight: number;
  frequency: number;
  recency: number;
  conversionLift: number;
}

interface Top5Result {
  items: string[];
  reasons: string[];
  scores: number[];
}

export class Top5Extractor {
  /**
   * 从卖点/痛点列表中提取 Top5
   */
  static async extractTop5(
    items: Array<{
      text: string;
      weight?: number;
      frequency?: number;
      recency?: number;
      conversionLift?: number;
      source?: string;
    }>,
    type: 'sellingPoints' | 'painPoints' = 'sellingPoints'
  ): Promise<Top5Result> {
    if (!items || items.length === 0) {
      return {
        items: [],
        reasons: [],
        scores: [],
      };
    }

    // 如果项目数量 <= 5，直接返回
    if (items.length <= 5) {
      return {
        items: items.map(item => item.text),
        reasons: items.map(item => `直接保留：${item.text}`),
        scores: items.map(item => item.weight || 1),
      };
    }

    // 计算综合分数
    const scoredItems: Top5Item[] = items.map(item => {
      const tfidfWeight = this.calculateTfIdfWeight(item.text, items);
      const recencyBoost = this.calculateRecencyBoost(item.recency || 0);
      const conversionLift = item.conversionLift || 0;
      const redundancyPenalty = this.calculateRedundancyPenalty(item.text, items);

      const score = tfidfWeight + recencyBoost + conversionLift - redundancyPenalty;

      return {
        text: item.text,
        score,
        reason: this.generateReason(tfidfWeight, recencyBoost, conversionLift, redundancyPenalty, type),
        source: item.source || 'unknown',
        weight: item.weight || 1,
        frequency: item.frequency || 1,
        recency: item.recency || 0,
        conversionLift: item.conversionLift || 0,
      };
    });

    // 按分数排序
    scoredItems.sort((a, b) => b.score - a.score);

    // 去重和多样性选择
    const selectedItems = this.selectDiverseItems(scoredItems, 5);

    return {
      items: selectedItems.map(item => item.text),
      reasons: selectedItems.map(item => item.reason),
      scores: selectedItems.map(item => item.score),
    };
  }

  /**
   * 计算 TF-IDF 权重
   */
  private static calculateTfIdfWeight(text: string, allItems: any[]): number {
    // 简化的 TF-IDF 计算
    const words = text.toLowerCase().split(/\s+/);
    const totalWords = allItems.reduce((sum, item) => sum + item.text.toLowerCase().split(/\s+/).length, 0);
    
    let tfidf = 0;
    for (const word of words) {
      if (word.length < 2) continue; // 忽略短词
      
      const termFreq = words.filter(w => w === word).length / words.length;
      const docFreq = allItems.filter(item => 
        item.text.toLowerCase().includes(word)
      ).length;
      const idf = Math.log(allItems.length / (docFreq + 1));
      
      tfidf += termFreq * idf;
    }
    
    return tfidf;
  }

  /**
   * 计算时效性提升
   */
  private static calculateRecencyBoost(recency: number): number {
    // recency 是 0-1 的值，1 表示最新
    return recency * 0.3;
  }

  /**
   * 计算冗余惩罚
   */
  private static calculateRedundancyPenalty(text: string, allItems: any[]): number {
    let penalty = 0;
    const words = text.toLowerCase().split(/\s+/);
    
    for (const otherItem of allItems) {
      if (otherItem.text === text) continue;
      
      const otherWords = otherItem.text.toLowerCase().split(/\s+/);
      const commonWords = words.filter(word => otherWords.includes(word));
      const similarity = commonWords.length / Math.max(words.length, otherWords.length);
      
      if (similarity > 0.7) {
        penalty += similarity * 0.5;
      }
    }
    
    return penalty;
  }

  /**
   * 生成选择理由
   */
  private static generateReason(
    tfidfWeight: number,
    recencyBoost: number,
    conversionLift: number,
    redundancyPenalty: number,
    type: 'sellingPoints' | 'painPoints'
  ): string {
    const reasons = [];
    
    if (tfidfWeight > 0.5) {
      reasons.push('关键词权重高');
    }
    
    if (recencyBoost > 0.2) {
      reasons.push('最近更新');
    }
    
    if (conversionLift > 0.1) {
      reasons.push('转化率提升');
    }
    
    if (redundancyPenalty < 0.1) {
      reasons.push('内容独特');
    }
    
    if (reasons.length === 0) {
      return type === 'sellingPoints' ? '卖点突出' : '痛点明确';
    }
    
    return reasons.join('、');
  }

  /**
   * 选择多样性项目
   */
  private static selectDiverseItems(items: Top5Item[], maxCount: number): Top5Item[] {
    const selected: Top5Item[] = [];
    const used = new Set<string>();
    
    for (const item of items) {
      if (selected.length >= maxCount) break;
      
      // 检查是否与已选择的项目过于相似
      let tooSimilar = false;
      for (const selectedItem of selected) {
        const similarity = this.calculateSimilarity(item.text, selectedItem.text);
        if (similarity > 0.8) {
          tooSimilar = true;
          break;
        }
      }
      
      if (!tooSimilar) {
        selected.push(item);
        used.add(item.text);
      }
    }
    
    // 如果多样性选择后数量不足，补充高分项目
    if (selected.length < maxCount) {
      for (const item of items) {
        if (selected.length >= maxCount) break;
        if (!used.has(item.text)) {
          selected.push(item);
        }
      }
    }
    
    return selected.slice(0, maxCount);
  }

  /**
   * 计算文本相似度
   */
  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}

export default Top5Extractor;
