import { GuppiDB, TelemetryTrace } from '../db/client.js';

export class TelemetryEngine {
  private db: GuppiDB;

  constructor(db: GuppiDB) {
    this.db = db;
  }

  public recordStep(
    agentId: string,
    stepName: string,
    toolName: string,
    inputPayload: any,
    outputPayload: any,
    tokensUsed: number = 0,
    latencyMs: number = 0,
    status: 'success' | 'error' | 'pending' = 'success'
  ): TelemetryTrace {
    return this.db.logTelemetry({
      id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      agent_id: agentId,
      step_name: stepName,
      tool_name: toolName,
      input_payload: typeof inputPayload === 'string' ? inputPayload : JSON.stringify(inputPayload),
      output_payload: typeof outputPayload === 'string' ? outputPayload : JSON.stringify(outputPayload),
      tokens_used: tokensUsed,
      latency_ms: latencyMs,
      status,
    });
  }

  public getTraces(limit: number = 50): TelemetryTrace[] {
    return this.db.getTelemetryTraces(limit);
  }
}
