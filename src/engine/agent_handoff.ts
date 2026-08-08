import { GuppiDB, SubagentCheckpoint } from '../db/client.js';

export interface HandoffPackage {
  checkpointId: string;
  parentAgentId: string;
  subagentRole: string;
  taskSummary: string;
  contextScratchpad: Record<string, string>;
  recentMemories: { id: string; title: string; category: string }[];
  instructionPrompt: string;
}

export class AgentHandoffEngine {
  private db: GuppiDB;

  constructor(db: GuppiDB) {
    this.db = db;
  }

  /**
   * Save a subagent task handoff checkpoint to GUPPI SQLite database.
   */
  public saveCheckpoint(
    parentAgentId: string,
    subagentRole: string,
    taskSummary: string,
    stateObj: Record<string, any>
  ): SubagentCheckpoint {
    const jsonState = JSON.stringify(stateObj);
    const checkpoint = this.db.createSubagentCheckpoint({
      parent_agent_id: parentAgentId,
      subagent_role: subagentRole,
      task_summary: taskSummary,
      state_json: jsonState,
    });

    // Also mirror to working memory scratchpad for active session access
    this.db.setWorkingMemory(`checkpoint_${checkpoint.id}`, taskSummary, parentAgentId);
    return checkpoint;
  }

  /**
   * Generates a token-optimized Handoff Package for newly spawned subagents.
   */
  public generateHandoffPackage(checkpointId: string): HandoffPackage {
    const ckpt = this.db.getSubagentCheckpoint(checkpointId);
    if (!ckpt) throw new Error(`Checkpoint ${checkpointId} not found.`);

    const scratchpad = this.db.getAllWorkingMemory().reduce((acc, cur) => {
      acc[cur.key] = cur.value;
      return acc;
    }, {} as Record<string, string>);

    const memories = this.db.getRecentMemories(5).map((m) => ({
      id: m.id,
      title: m.title,
      category: m.category,
    }));

    const stateObj = JSON.parse(ckpt.state_json);
    const instructionPrompt = `
=== GUPPI SUBAGENT HANDOFF INSTRUCTION ===
Role: ${ckpt.subagent_role}
Parent Task ID: ${ckpt.parent_agent_id}
Task Summary: ${ckpt.task_summary}

Active State Parameters:
${JSON.stringify(stateObj, null, 2)}

Instructions:
1. Continue execution focusing strictly on the task summary above.
2. Store intermediate progress in GUPPI Working Memory via guppi_working_memory.
3. Save final checkpoint using guppi_subagent_checkpoint upon completion.
`;

    return {
      checkpointId: ckpt.id,
      parentAgentId: ckpt.parent_agent_id,
      subagentRole: ckpt.subagent_role,
      taskSummary: ckpt.task_summary,
      contextScratchpad: scratchpad,
      recentMemories: memories,
      instructionPrompt,
    };
  }

  /**
   * Lists all recorded subagent handoff checkpoints.
   */
  public listCheckpoints(limit: number = 20): SubagentCheckpoint[] {
    return this.db.getSubagentCheckpoints(limit);
  }
}
