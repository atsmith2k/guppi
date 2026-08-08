import { GuppiDB, EvalRunRecord } from '../db/client.js';

export class AgentEvalEngine {
  constructor(private db: GuppiDB) {}

  public evaluateRun(
    agentId: string,
    queryPrompt: string,
    responseText: string,
    latencyMs: number,
    tokenCost: number = 0,
    relevantContextItems: string[] = []
  ): EvalRunRecord {
    // 1. Calculate Precision Score: check presence of key query concepts in response
    const queryWords = queryPrompt.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const matchedWords = queryWords.filter((w) => responseText.toLowerCase().includes(w));
    const precisionScore = queryWords.length > 0 ? matchedWords.length / queryWords.length : 1.0;

    // 2. Calculate Faithfulness Score: check presence of provided RAG context in response
    let faithfulnessScore = 0.85;
    if (relevantContextItems.length > 0) {
      const matchedContext = relevantContextItems.filter((ctx) =>
        responseText.toLowerCase().includes(ctx.toLowerCase().slice(0, 20))
      );
      faithfulnessScore = matchedContext.length / relevantContextItems.length;
    }

    const evalRecord = this.db.recordEvalRun({
      agent_id: agentId,
      query_prompt: queryPrompt,
      response_text: responseText,
      precision_score: parseFloat(precisionScore.toFixed(2)),
      faithfulness_score: parseFloat(faithfulnessScore.toFixed(2)),
      latency_ms: latencyMs,
      token_cost: tokenCost,
    });

    return evalRecord;
  }

  public getBenchmarkReport(limit: number = 50) {
    const runs = this.db.getEvalRuns(limit);
    if (runs.length === 0) {
      return {
        totalRuns: 0,
        avgPrecision: 0,
        avgFaithfulness: 0,
        avgLatencyMs: 0,
        totalTokenCost: 0,
        runs: [],
      };
    }

    const totalRuns = runs.length;
    const avgPrecision = runs.reduce((acc, r) => acc + r.precision_score, 0) / totalRuns;
    const avgFaithfulness = runs.reduce((acc, r) => acc + r.faithfulness_score, 0) / totalRuns;
    const avgLatencyMs = runs.reduce((acc, r) => acc + r.latency_ms, 0) / totalRuns;
    const totalTokenCost = runs.reduce((acc, r) => acc + r.token_cost, 0);

    return {
      totalRuns,
      avgPrecision: parseFloat(avgPrecision.toFixed(2)),
      avgFaithfulness: parseFloat(avgFaithfulness.toFixed(2)),
      avgLatencyMs: Math.round(avgLatencyMs),
      totalTokenCost,
      runs,
    };
  }
}
