import { PillarModule } from './types.js';
import { GuppiDB } from '../../db/client.js';
import { AgentEvalEngine } from '../../engine/agent_eval.js';
import { TelemetryEngine } from '../../engine/telemetry.js';
import { TestGenEngine } from '../../engine/test_gen.js';
import { BrainstormEngine } from '../../engine/brainstorm.js';
import { MultiRepoMeshEngine } from '../../engine/mesh.js';

export function createQualityPillar(db: GuppiDB): PillarModule {
  const agentEval = new AgentEvalEngine(db);
  const telemetryEngine = new TelemetryEngine(db);
  const testGenEngine = new TestGenEngine(db);
  const brainstormEngine = new BrainstormEngine(db);
  const meshEngine = new MultiRepoMeshEngine(db);

  return {
    pillarName: 'Quality & Telemetry',
    description: 'Agent evaluation benchmarks, real-time telemetry tracing, AST unit test generation, Q&A brainstorm ideation, and multi-repo mesh search.',
    resources: [
      {
        uri: 'guppi://brainstorm/blueprint',
        name: 'Latest Brainstorm Spec Blueprint',
        description: 'Synthesized Spec Blueprint markdown image generated from interactive Q&A brainstorming.',
        mimeType: 'text/markdown',
      },
      {
        uri: 'guppi://telemetry/latest',
        name: 'Live Agent Telemetry Stream',
        description: 'Recent tool execution traces and latency metrics.',
        mimeType: 'application/json',
      },
      {
        uri: 'guppi://eval/reports',
        name: 'Agent RAG Precision & Latency Eval Reports',
        description: 'Benchmark runs, context precision scores, and latency metrics.',
        mimeType: 'application/json',
      },
    ],
    tools: [
      {
        name: 'guppi_evaluate_run',
        description:
          '📊 AGENT RAG EVALUATION BENCHMARK: Benchmark an agent interaction evaluating context precision score, answer faithfulness score, token cost, and latency (Poached from DeepEval & AgentOps).',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: { type: 'string', description: 'Identifier of agent' },
            queryPrompt: { type: 'string', description: 'User query prompt' },
            responseText: { type: 'string', description: 'Agent response text' },
            latencyMs: { type: 'number', description: 'Execution latency in milliseconds' },
            tokenCost: { type: 'number', description: 'Token cost' },
          },
          required: ['agentId', 'queryPrompt', 'responseText'],
        },
      },
      {
        name: 'guppi_log_telemetry',
        description:
          '📊 REAL-TIME TELEMETRY TRACER: Record a tool call, subagent step, latency, or token count to GUPPI trace deck.',
        inputSchema: {
          type: 'object',
          properties: {
            agentId: { type: 'string', description: 'Identifier of the agent or subagent' },
            stepName: { type: 'string', description: 'Name of the step being executed' },
            toolName: { type: 'string', description: 'Tool invoked' },
            inputPayload: { type: 'object', description: 'Input payload' },
            outputPayload: { type: 'object', description: 'Output payload or status summary' },
            tokensUsed: { type: 'number', description: 'Token cost' },
            latencyMs: { type: 'number', description: 'Latency in milliseconds' },
            status: { type: 'string', enum: ['success', 'error', 'pending'] },
          },
          required: ['agentId', 'stepName', 'toolName'],
        },
      },
      {
        name: 'guppi_generate_tests',
        description:
          '🧪 AUTOMATED AST UNIT TEST GENERATOR: Extract AST signatures from a source file and auto-generate an isolated unit test suite spec in test/generated/.',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Target source file path' },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'guppi_brainstorm_start',
        description:
          '💡 INTERACTIVE Q&A IDEATION: Start a 4-phase Q&A ideation session (Starbursting, SCAMPER, 5-Whys, Critic Pass) to build an atomic Spec Blueprint for primary agents.',
        inputSchema: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'The project idea or feature topic to brainstorm' },
          },
          required: ['topic'],
        },
      },
      {
        name: 'guppi_brainstorm_answer',
        description:
          '💡 SUBMIT BRAINSTORM ANSWER: Submit answer to current Q&A question and advance phase or synthesize final Spec Blueprint.',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Brainstorming session ID' },
            answer: { type: 'string', description: 'Your answer to current question' },
          },
          required: ['sessionId', 'answer'],
        },
      },
      {
        name: 'guppi_mesh_query',
        description:
          '🌐 MULTI-REPO KNOWLEDGE MESH: Search AST symbols, files, and RAG context across all linked external repository workspaces in GUPPI Mesh.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Cross-repository query or symbol search' },
          },
          required: ['query'],
        },
      },
    ],
    async handleReadResource(uri: string) {
      if (uri === 'guppi://brainstorm/blueprint') {
        const blueprint = db.getWorkingMemory('latest_brainstorm_blueprint') || '# No Brainstorm Blueprint generated yet.';
        return { contents: [{ uri, mimeType: 'text/markdown', text: blueprint }] };
      }
      if (uri === 'guppi://telemetry/latest') {
        const traces = db.getTelemetryTraces(50);
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(traces, null, 2) }] };
      }
      if (uri === 'guppi://eval/reports') {
        const report = agentEval.getBenchmarkReport(50);
        return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(report, null, 2) }] };
      }
      return null;
    },
    async handleToolCall(name: string, args: any) {
      if (name === 'guppi_evaluate_run') {
        const agentId = (args?.agentId as string) || 'agent';
        const queryPrompt = (args?.queryPrompt as string) || '';
        const responseText = (args?.responseText as string) || '';
        const latencyMs = (args?.latencyMs as number) || 150;
        const tokenCost = (args?.tokenCost as number) || 0;
        const record = agentEval.evaluateRun(agentId, queryPrompt, responseText, latencyMs, tokenCost);
        return {
          content: [
            {
              type: 'text',
              text: `📊 Agent Run Evaluated & Benchmarked! [Run ID: ${record.id}]\n- Precision Score: ${(record.precision_score * 100).toFixed(0)}%\n- Faithfulness Score: ${(record.faithfulness_score * 100).toFixed(0)}%\n- Latency: ${record.latency_ms}ms\n- Token Cost: ${record.token_cost} tokens`,
            },
          ],
        };
      }

      if (name === 'guppi_log_telemetry') {
        const trace = telemetryEngine.recordStep(
          (args?.agentId as string) || 'primary_agent',
          (args?.stepName as string) || 'step',
          (args?.toolName as string) || 'tool',
          args?.inputPayload,
          args?.outputPayload,
          (args?.tokensUsed as number) || 0,
          (args?.latencyMs as number) || 0,
          (args?.status as any) || 'success'
        );
        return { content: [{ type: 'text', text: `📊 Telemetry logged [ID: ${trace.id}]` }] };
      }

      if (name === 'guppi_generate_tests') {
        const filePath = (args?.filePath as string) || '';
        const suite = testGenEngine.generateTestsForFile(filePath);
        return {
          content: [
            {
              type: 'text',
              text: `🧪 GUPPI Unit Test Suite Generated!\n\n- Source File: ${suite.filePath}\n- Generated Test File: ${suite.testFilePath}\n- Symbols Tested: ${suite.symbolsTested.join(', ') || 'Module'}\n\nGenerated Test Code Preview:\n\`\`\`typescript\n${suite.testCode}\n\`\`\`\n\n💡 Next Suggested Agent Action: Run unit test runner to verify coverage.`,
            },
          ],
        };
      }

      if (name === 'guppi_brainstorm_start') {
        const topic = (args?.topic as string) || '';
        const state = brainstormEngine.startSession(topic);
        const q = brainstormEngine.getNextQuestion(state.sessionId);
        return {
          content: [
            {
              type: 'text',
              text: `💡 Brainstorm Session Started! [ID: ${state.sessionId}]\nTopic: "${topic}"\n\n### Question 1 (${q?.phase} - ${q?.persona} Persona):\n${q?.question}\n\nContext: ${q?.context}\nSuggested Ideas:\n- ${q?.suggestedAnswers?.join('\n- ')}`,
            },
          ],
        };
      }

      if (name === 'guppi_brainstorm_answer') {
        const sessionId = args?.sessionId as string;
        const answer = args?.answer as string;
        const res = brainstormEngine.submitAnswer(sessionId, answer);
        if (res.state.isComplete) {
          return {
            content: [
              {
                type: 'text',
                text: `🎉 Brainstorming Complete! Synthesized Spec Blueprint saved to GUPPI Memory.\n\n${res.state.synthesizedBlueprint}\n\n💡 Next Suggested Agent Action: Run guppi_task_plan_create to decompose this Blueprint into a DAG task plan.`,
              },
            ],
          };
        }
        const q = res.nextQuestion;
        return {
          content: [
            {
              type: 'text',
              text: `✅ Answer Recorded!\n\n### Next Question (${q?.phase} - ${q?.persona} Persona):\n${q?.question}\n\nContext: ${q?.context}\nSuggested Ideas:\n- ${q?.suggestedAnswers?.join('\n- ')}`,
            },
          ],
        };
      }

      if (name === 'guppi_mesh_query') {
        const query = (args?.query as string) || '';
        const results = meshEngine.searchMesh(query);
        if (results.length === 0) {
          return { content: [{ type: 'text', text: `No linked multi-repo nodes found matching "${query}".` }] };
        }
        let output = `### Multi-Repo Knowledge Mesh Results for "${query}":\n`;
        results.forEach((r) => {
          output += `#### 📁 Repo: ${r.repoName} (${r.repoPath})\n`;
          r.matches.forEach((m) => {
            output += `- \`${m.signature}\` (${m.kind}) in ${m.file_path}\n`;
          });
          output += `\n`;
        });
        return { content: [{ type: 'text', text: output }] };
      }

      return null;
    },
  };
}
