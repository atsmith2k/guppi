import { PillarModule } from './types.js';
import { GuppiDB } from '../../db/client.js';
import { TaskPlannerEngine } from '../../engine/task_planner.js';
import { AgentHandoffEngine } from '../../engine/agent_handoff.js';

export function createPlanningPillar(db: GuppiDB): PillarModule {
  const taskPlanner = new TaskPlannerEngine(db);
  const handoffEngine = new AgentHandoffEngine(db);

  return {
    pillarName: 'Multi-Agent Planning & Handoff',
    description: 'DAG task plan decomposition, role assignments, step status orchestration, session compactor, and subagent handoff checkpoints.',
    resources: [
      {
        uri: 'guppi://tasks/active',
        name: 'Active Task Execution Plans & DAG Steps',
        description: 'Task plans, role assignments, and step progress states.',
        mimeType: 'application/json',
      },
      {
        uri: 'guppi://checkpoints/active',
        name: 'Subagent Session Handoff Checkpoints',
        description: 'Serialized task checkpoints and handoff state packages for subagents.',
        mimeType: 'application/json',
      },
    ],
    tools: [
      {
        name: 'guppi_task_plan_create',
        description:
          '📋 CREATE MULTI-AGENT DAG TASK PLAN: Decompose complex goals into structured multi-agent DAG task dependency steps with role assignments (Poached from Aider & Superpowers).',
        inputSchema: {
          type: 'object',
          properties: {
            goal: { type: 'string', description: 'Goal or feature request to decompose' },
            title: { type: 'string', description: 'Optional custom plan title' },
          },
          required: ['goal'],
        },
      },
      {
        name: 'guppi_task_step_update',
        description:
          '✅ UPDATE TASK STEP STATUS: Mark DAG step status as pending, running, completed, or failed in the orchestrator.',
        inputSchema: {
          type: 'object',
          properties: {
            stepId: { type: 'string', description: 'Step ID to update' },
            status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'] },
            result: { type: 'string', description: 'Execution result summary or error' },
          },
          required: ['stepId', 'status'],
        },
      },
      {
        name: 'guppi_compact_session',
        description:
          '📦 SESSION COMPACTOR HANDOFF: Save a structured session summary and next steps into GUPPI Working Memory to prevent context rot during long tasks.',
        inputSchema: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Summary of session investigation and current progress' },
            nextSteps: { type: 'string', description: 'Next steps for subagent or primary agent' },
          },
          required: ['summary'],
        },
      },
      {
        name: 'guppi_subagent_checkpoint',
        description:
          '📦 SUBAGENT CHECKPOINT & HANDOFF PACKAGE: Save subagent task checkpoints, serialize task state, and generate handoff packages for multi-agent delegation.',
        inputSchema: {
          type: 'object',
          properties: {
            action: { type: 'string', enum: ['save', 'get_package', 'list'], description: 'Checkpoint action' },
            parentAgentId: { type: 'string', description: 'Parent agent identifier' },
            subagentRole: { type: 'string', description: 'Role of subagent (e.g. Researcher, Code Refactorer)' },
            taskSummary: { type: 'string', description: 'Task progress summary' },
            stateObj: { type: 'object', description: 'JSON-serializable task state object' },
            checkpointId: { type: 'string', description: 'Target checkpoint ID for get_package' },
          },
          required: ['action'],
        },
      },
    ],
    async handleReadResource(uri: string) {
      if (uri === 'guppi://tasks/active') {
        const plans = taskPlanner.listActivePlans(20);
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(plans, null, 2) }] };
      }
      if (uri === 'guppi://checkpoints/active') {
        const ckpts = handoffEngine.listCheckpoints(20);
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(ckpts, null, 2) }] };
      }
      return null;
    },
    async handleToolCall(name: string, args: any) {
      if (name === 'guppi_task_plan_create') {
        const goal = (args?.goal as string) || '';
        const title = (args?.title as string) || undefined;
        const res = taskPlanner.createPlan(goal, title);
        let output = `📋 Task Plan Created! [ID: ${res.plan.id}]\nGoal: "${res.plan.goal}"\n\nDAG Execution Steps:\n`;
        res.steps.forEach((s) => {
          output += `${s.step_number}. [${s.assigned_role}] ${s.title} (Status: ${s.status})\n`;
        });
        output += `\n💡 Next Suggested Agent Action: Update step completion using guppi_task_step_update or save subagent checkpoint with guppi_subagent_checkpoint.`;
        return { content: [{ type: 'text', text: output }] };
      }

      if (name === 'guppi_task_step_update') {
        const stepId = args?.stepId as string;
        const status = args?.status as any;
        const result = args?.result as string | undefined;
        taskPlanner.updateStepStatus(stepId, status, result);
        return { content: [{ type: 'text', text: `✅ Task Step [${stepId}] status updated to: ${status}` }] };
      }

      if (name === 'guppi_compact_session') {
        const summary = (args?.summary as string) || '';
        const nextSteps = (args?.nextSteps as string) || 'None specified';
        const checkpoint = `## Session Checkpoint [${new Date().toISOString()}]\n\n### Summary:\n${summary}\n\n### Next Steps:\n${nextSteps}`;
        db.setWorkingMemory('session_checkpoint_latest', checkpoint, 'session_compactor');
        return { content: [{ type: 'text', text: `📦 Session Checkpoint Compacted & Saved to Working Memory!` }] };
      }

      if (name === 'guppi_subagent_checkpoint') {
        const action = (args?.action as string) || 'list';
        if (action === 'save') {
          const parentId = (args?.parentAgentId as string) || 'parent_agent';
          const role = (args?.subagentRole as string) || 'subagent';
          const summary = (args?.taskSummary as string) || 'Task summary';
          const stateObj = (args?.stateObj as Record<string, any>) || {};
          const ckpt = handoffEngine.saveCheckpoint(parentId, role, summary, stateObj);
          return { content: [{ type: 'text', text: `📦 Subagent Checkpoint Saved [ID: ${ckpt.id}] for Role: "${ckpt.subagent_role}"` }] };
        } else if (action === 'get_package') {
          const ckptId = args?.checkpointId as string;
          const pkg = handoffEngine.generateHandoffPackage(ckptId);
          return { content: [{ type: 'text', text: pkg.instructionPrompt }] };
        } else {
          const list = handoffEngine.listCheckpoints(20);
          return { content: [{ type: 'text', text: JSON.stringify(list, null, 2) }] };
        }
      }

      return null;
    },
  };
}
