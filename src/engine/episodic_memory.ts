import { GuppiDB, EpisodicMemoryRecord, FactTriple } from '../db/client.js';

export class EpisodicMemoryEngine {
  constructor(private db: GuppiDB) {}

  public remember(
    topic: string,
    content: string,
    memoryType: 'episodic' | 'semantic' | 'preference' = 'episodic',
    importanceScore: number = 0.8
  ): EpisodicMemoryRecord {
    const now = new Date().toISOString();
    return this.db.addEpisodicMemory({
      topic,
      content,
      memory_type: memoryType,
      importance_score: Math.min(Math.max(importanceScore, 0.1), 1.0),
      last_accessed_at: now,
    });
  }

  public getRankedMemories(limit: number = 20): EpisodicMemoryRecord[] {
    const memories = this.db.getEpisodicMemories(limit);
    const now = Date.now();

    // Apply Ebbinghaus decay formula: R = importance * e^(-deltaHours / halfLife)
    const HALF_LIFE_HOURS = 72;
    return memories
      .map((m) => {
        const lastAccessTime = new Date(m.last_accessed_at).getTime();
        const deltaHours = Math.max((now - lastAccessTime) / (1000 * 60 * 60), 0);
        const decayScore = m.importance_score * Math.exp(-deltaHours / HALF_LIFE_HOURS);
        return { ...m, decay_score: parseFloat(decayScore.toFixed(3)) };
      })
      .sort((a, b) => b.decay_score - a.decay_score);
  }

  public extractFactTriples(text: string, sourceName: string = 'codebase'): FactTriple[] {
    const extracted: FactTriple[] = [];

    // Rule-based extraction patterns (e.g., "A extends B", "A uses B", "A depends on B", "A fixes B")
    const patterns = [
      /([a-zA-Z0-9_\-]+)\s+(uses|imports|extends|implements|calls|depends on|fixes|requires|manages|stores|configures)\s+([a-zA-Z0-9\._\-]+)/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const subject = match[1];
        const relation = match[2].toLowerCase().replace(/\s+/g, '_');
        const object = match[3];

        const triple = this.db.addFactTriple({
          subject,
          relation,
          object,
          confidence: 0.9,
          source: sourceName,
        });
        extracted.push(triple);
      }
    }

    return extracted;
  }

  public queryFacts(query: string, limit: number = 20): FactTriple[] {
    return this.db.queryFactTriples(query, limit);
  }
}
