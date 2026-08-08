import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { GuppiDB } from '../db/client.js';
import { OnboardingEngine } from '../engine/onboarder.js';
import { RAGEngine } from '../engine/rag.js';
import { GuardEngine } from '../engine/guard.js';
import { TelemetryEngine } from '../engine/telemetry.js';
import { CodeSkeletonizer } from '../engine/skeletonizer.js';
import { BrainstormEngine } from '../engine/brainstorm.js';
import { SelfHealingEngine } from '../engine/self_heal.js';
import { MultiRepoMeshEngine } from '../engine/mesh.js';
import { TestGenEngine } from '../engine/test_gen.js';

export function createMCPServer(db: GuppiDB) {
  const ragEngine = new RAGEngine(db);
  const guardEngine = new GuardEngine(db);
  const telemetryEngine = new TelemetryEngine(db);
  const onboarder = new OnboardingEngine(db);
  const brainstormEngine = new BrainstormEngine(db);
  const selfHealingEngine = new SelfHealingEngine(db);
  const meshEngine = new MultiRepoMeshEngine(db);
  const testGenEngine = new TestGenEngine(db);

  const server = new Server(
    {
      name: 'guppi-agentic-sidecar',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  // Expose MCP Virtual Context Filesystem Resources (guppi://)
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'guppi://memories/all',
          name: 'All Workspace RAG Memories',
          description: 'Virtual context file containing all stored workspace architectural decisions and rules.',
          mimeType: 'application/json',
        },
        {
          uri: 'guppi://memories/decisions',
          name: 'Architectural Decisions',
          description: 'Key decisions recorded for this workspace.',
          mimeType: 'application/json',
        },
        {
          uri: 'guppi://symbols/all',
          name: 'Codebase AST Symbol Map',
          description: 'Complete AST symbol index of functions, classes, and types.',
          mimeType: 'application/json',
        },
        {
          uri: 'guppi://git/history',
          name: 'Git Commit History & Diffs',
          description: 'Git commit history and file diff summaries.',
          mimeType: 'application/json',
        },
        {
          uri: 'guppi://brainstorm/blueprint',
          name: 'Latest Brainstorm Spec Blueprint',
          description: 'Synthesized Spec Blueprint image generated from interactive Q&A brainstorming.',
          mimeType: 'text/markdown',
        },
        {
          uri: 'guppi://telemetry/latest',
          name: 'Live Agent Telemetry Stream',
          description: 'Recent tool execution traces and latency metrics.',
          mimeType: 'application/json',
        },
        {
          uri: 'guppi://guardrails/rules',
          name: 'Active Safety Guardrail Rules',
          description: 'Workspace pre-flight safety rules and secret patterns.',
          mimeType: 'application/json',
        },
        {
          uri: 'guppi://working/scratchpad',
          name: 'Working Memory Tier Scratchpad',
          description: 'Ephemeral working memory key-value scratchpad for active agent sessions.',
          mimeType: 'application/json',
        },
      ],
    };
  });

  // Read Resource Handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    if (uri === 'guppi://memories/all') {
      const memories = db.getRecentMemories(100);
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(memories, null, 2) }] };
    }

    if (uri === 'guppi://memories/decisions') {
      const memories = db.getRecentMemories(100).filter((m) => m.category === 'decision');
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(memories, null, 2) }] };
    }

    if (uri === 'guppi://symbols/all') {
      const symbols = db.querySymbols('', 200);
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(symbols, null, 2) }] };
    }

    if (uri === 'guppi://git/history') {
      const commits = db.queryGitCommits('', 50);
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(commits, null, 2) }] };
    }

    if (uri === 'guppi://brainstorm/blueprint') {
      const blueprint = db.getWorkingMemory('latest_brainstorm_blueprint') || '# No Brainstorm Blueprint generated yet.';
      return { contents: [{ uri, mimeType: 'text/markdown', text: blueprint }] };
    }

    if (uri === 'guppi://telemetry/latest') {
      const traces = db.getTelemetryTraces(50);
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(traces, null, 2) }] };
    }

    if (uri === 'guppi://guardrails/rules') {
      const rules = db.getGuardrails();
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(rules, null, 2) }] };
    }

    if (uri === 'guppi://working/scratchpad') {
      const scratchpad = db.getAllWorkingMemory();
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(scratchpad, null, 2) }] };
    }

    throw new Error(`Resource not found: ${uri}`);
  });

  // List available GUPPI MCP tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'guppi_generate_tests',
          description:
            'Extracts AST function/class signatures from a source file and automatically generates an isolated unit test suite in test/generated/.',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'Target source file path' },
            },
            required: ['filePath'],
          },
        },
        {
          name: 'guppi_mesh_query',
          description:
            'Queries AST symbols, files, and RAG context across all linked external multi-repository workspaces in GUPPI Mesh.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Cross-repository query or symbol search' },
            },
            required: ['query'],
          },
        },
        {
          name: 'guppi_self_heal',
          description:
            'Analyzes error tracebacks or failed tests, creates emergency backup snapshot, and proposes an AST self-healing repair diff.',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'Target file path needing repair' },
              errorTrace: { type: 'string', description: 'Error traceback or failed assertion log' },
              failedTestName: { type: 'string', description: 'Name of failed test suite (optional)' },
            },
            required: ['filePath', 'errorTrace'],
          },
        },
        {
          name: 'guppi_brainstorm_start',
          description:
            'Starts an interactive Q&A brainstorming session based on proven methodologies (Starbursting, SCAMPER, 5-Whys, Critic Pass) to build a Spec Blueprint.',
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
            'Submits an answer to the active brainstorming session and returns the next question or final synthesized Spec Blueprint.',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: { type: 'string', description: 'Brainstorming session ID' },
              answer: { type: 'string', description: 'Your answer to the current question' },
            },
            required: ['sessionId', 'answer'],
          },
        },
        {
          name: 'guppi_onboard',
          description:
            'Triggers or refreshes GUPPI programmatic workspace onboarding. Scans files, AST symbols, rule files, and git history.',
          inputSchema: {
            type: 'object',
            properties: {
              force: { type: 'boolean', description: 'Force re-indexing all workspace files' },
            },
          },
        },
        {
          name: 'guppi_query_context',
          description:
            'Queries GUPPI Hybrid RAG memory engine for relevant workspace architectural rules, past decisions, AST symbols, and codebase topology.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The semantic context query or question' },
              maxItems: { type: 'number', description: 'Max number of memory items to return (default 5)' },
            },
            required: ['query'],
          },
        },
        {
          name: 'guppi_skeletonize',
          description:
            'Generates a token-compressed AST code skeleton for a file, retaining imports, signatures, interfaces, and docstrings while stripping implementation bodies (saves ~70-80% tokens).',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'File path to skeletonize' },
            },
            required: ['filePath'],
          },
        },
        {
          name: 'guppi_git_rag',
          description:
            'Queries GUPPI Git History & Diff database to answer questions about past commits, changes, and authoring notes.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Commit query or keyword search' },
            },
            required: ['query'],
          },
        },
        {
          name: 'guppi_compact_session',
          description:
            'Generates a structured Handoff Checkpoint summarizing current session findings, active bugs, and next steps into GUPPI Working Memory to prevent context rot.',
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
          name: 'guppi_remember',
          description:
            'Stores a key architectural decision, rule, convention, or bug solution into GUPPI long-term memory graph for future agent sessions.',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Concise title of the decision or rule' },
              content: { type: 'string', description: 'Detailed explanation, rationale, or code example' },
              category: {
                type: 'string',
                enum: ['decision', 'rule', 'architecture', 'bug_solution', 'convention', 'context'],
                description: 'Memory category',
              },
              tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorical retrieval' },
            },
            required: ['title', 'content'],
          },
        },
        {
          name: 'guppi_working_memory',
          description:
            'Read or write key-value items in GUPPI Working Memory Scratchpad tier during task execution.',
          inputSchema: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['get', 'set', 'get_all'], description: 'Working memory action' },
              key: { type: 'string', description: 'Scratchpad key' },
              value: { type: 'string', description: 'Value to store (required if action is set)' },
              agentId: { type: 'string', description: 'Agent identifier' },
            },
            required: ['action'],
          },
        },
        {
          name: 'guppi_link_knowledge',
          description:
            'Creates a Knowledge Graph edge connecting a GUPPI memory item to an AST symbol or file path.',
          inputSchema: {
            type: 'object',
            properties: {
              memoryId: { type: 'string', description: 'GUPPI memory ID' },
              targetId: { type: 'string', description: 'Target file path or AST symbol ID' },
              relationType: { type: 'string', description: 'Relation type (e.g. affects, defines, resolves)' },
            },
            required: ['memoryId', 'targetId'],
          },
        },
        {
          name: 'guppi_inspect_symbol',
          description:
            'Queries GUPPI AST index to retrieve symbol signatures, docstrings, exports, imports, and exact file locations without loading large files.',
          inputSchema: {
            type: 'object',
            properties: {
              symbolName: { type: 'string', description: 'Name of the function, class, or type to search' },
            },
            required: ['symbolName'],
          },
        },
        {
          name: 'guppi_guard_check',
          description:
            'Runs pre-flight safety & rule verification checks on proposed code changes to detect secrets, anti-patterns, or contract violations.',
          inputSchema: {
            type: 'object',
            properties: {
              content: { type: 'string', description: 'Code snippet or file content to check' },
              filePath: { type: 'string', description: 'Target file path being created or modified' },
            },
            required: ['content'],
          },
        },
        {
          name: 'guppi_log_telemetry',
          description:
            'Records a tool call, subagent step, latency, or token count to GUPPI real-time telemetry stream for visual trace deck analysis.',
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
      ],
    };
  });

  // Handle Tool Calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'guppi_generate_tests') {
        const filePath = (args?.filePath as string) || '';
        const suite = testGenEngine.generateTestsForFile(filePath);
        return {
          content: [
            {
              type: 'text',
              text: `🧪 GUPPI Unit Test Suite Generated!\n\n- Source File: ${suite.filePath}\n- Generated Test File: ${suite.testFilePath}\n- Symbols Tested: ${suite.symbolsTested.join(', ') || 'Module'}\n\nGenerated Test Code Preview:\n\`\`\`typescript\n${suite.testCode}\n\`\`\``,
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

      if (name === 'guppi_self_heal') {
        const filePath = (args?.filePath as string) || '';
        const errorTrace = (args?.errorTrace as string) || '';
        const failedTestName = (args?.failedTestName as string) || 'Test Suite';
        const entry = selfHealingEngine.proposeSelfHeal(filePath, errorTrace, failedTestName);
        return {
          content: [
            {
              type: 'text',
              text: `🛠️ GUPPI Emergency Backup Created & Self-Healing Proposed!\n\n- Entry ID: ${entry.id}\n- File: ${entry.file_path}\n- Backup Snapshot: ${entry.backup_snapshot}\n\nProposed Fix:\n${entry.proposed_diff}`,
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
                text: `🎉 Brainstorming Complete! Synthesized Spec Blueprint saved to GUPPI Memory.\n\n${res.state.synthesizedBlueprint}`,
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

      if (name === 'guppi_onboard') {
        const report = await onboarder.runOnboarding();
        return {
          content: [
            {
              type: 'text',
              text: `✅ GUPPI Onboarding Complete!\n\n- Project: ${report.projectName}\n- Framework: ${report.framework}\n- Total Files Indexed: ${report.totalFiles}\n- Total Lines: ${report.totalLines}\n- AST Symbols Extracted: ${report.symbolCount}\n- Rule Files Found: ${report.ruleFilesFound.join(', ') || 'None'}\n- Memories Created: ${report.memoriesCreated}\n- Duration: ${report.durationMs}ms`,
            },
          ],
        };
      }

      if (name === 'guppi_query_context') {
        const query = (args?.query as string) || '';
        const maxItems = (args?.maxItems as number) || 5;
        const res = ragEngine.queryContext(query, maxItems);
        return {
          content: [{ type: 'text', text: res.synthesizedContext }],
        };
      }

      if (name === 'guppi_skeletonize') {
        const filePath = (args?.filePath as string) || '';
        const skeleton = CodeSkeletonizer.skeletonizeFile(filePath);
        return {
          content: [{ type: 'text', text: `### AST Code Skeleton for \`${filePath}\` (Implementation Bodies Folded):\n\`\`\`typescript\n${skeleton}\n\`\`\`` }],
        };
      }

      if (name === 'guppi_git_rag') {
        const query = (args?.query as string) || '';
        const commits = db.queryGitCommits(query, 10);
        if (commits.length === 0) {
          return { content: [{ type: 'text', text: `No Git commits found matching "${query}".` }] };
        }
        let text = `### Git History matches for "${query}":\n`;
        commits.forEach((c) => {
          text += `- [**${c.hash}**] ${c.message} (${c.author}, ${c.date})\n  Files:\n${c.files_changed}\n\n`;
        });
        return { content: [{ type: 'text', text }] };
      }

      if (name === 'guppi_compact_session') {
        const summary = (args?.summary as string) || '';
        const nextSteps = (args?.nextSteps as string) || 'None specified';
        const checkpoint = `## Session Checkpoint [${new Date().toISOString()}]\n\n### Summary:\n${summary}\n\n### Next Steps:\n${nextSteps}`;
        db.setWorkingMemory('session_checkpoint_latest', checkpoint, 'session_compactor');
        return { content: [{ type: 'text', text: `📦 Session Checkpoint Compacted & Saved to Working Memory!` }] };
      }

      if (name === 'guppi_remember') {
        const title = (args?.title as string) || '';
        const content = (args?.content as string) || '';
        const category = (args?.category as any) || 'decision';
        const tags = (args?.tags as string[]) || ['agent_recorded'];

        const mem = ragEngine.storeMemory(title, content, category, tags);
        return {
          content: [
            {
              type: 'text',
              text: `🧠 Saved to GUPPI Memory [ID: ${mem.id}]!\nTitle: ${mem.title}\nCategory: ${mem.category}\nTags: ${mem.tags.join(', ')}`,
            },
          ],
        };
      }

      if (name === 'guppi_working_memory') {
        const action = args?.action as string;
        const key = args?.key as string;
        const value = args?.value as string;
        const agentId = (args?.agentId as string) || 'agent';

        if (action === 'set') {
          if (!key || !value) throw new Error('Key and value required for set');
          db.setWorkingMemory(key, value, agentId);
          return { content: [{ type: 'text', text: `📝 Stored Working Memory: "${key}"` }] };
        } else if (action === 'get') {
          if (!key) throw new Error('Key required for get');
          const val = db.getWorkingMemory(key);
          return { content: [{ type: 'text', text: val ? `📝 Working Memory [${key}]: ${val}` : `Key "${key}" not found in working memory.` }] };
        } else {
          const all = db.getAllWorkingMemory();
          return { content: [{ type: 'text', text: JSON.stringify(all, null, 2) }] };
        }
      }

      if (name === 'guppi_link_knowledge') {
        const memoryId = args?.memoryId as string;
        const targetId = args?.targetId as string;
        const relationType = (args?.relationType as string) || 'affects';
        db.linkMemory(memoryId, targetId, relationType);
        return { content: [{ type: 'text', text: `🔗 Knowledge Edge Linked: Memory [${memoryId}] --(${relationType})--> [${targetId}]` }] };
      }

      if (name === 'guppi_inspect_symbol') {
        const symbolName = (args?.symbolName as string) || '';
        const symbols = db.querySymbols(symbolName);
        if (symbols.length === 0) {
          return { content: [{ type: 'text', text: `No AST symbols found matching "${symbolName}".` }] };
        }

        let output = `### AST Symbols matching "${symbolName}":\n`;
        symbols.forEach((s) => {
          output += `- \`${s.signature}\` (${s.kind}) in [${s.file_path}](file://${s.file_path}#L${s.line_start}-L${s.line_end})\n`;
          if (s.docstring) output += `  Docstring: ${s.docstring.trim()}\n`;
        });
        return { content: [{ type: 'text', text: output }] };
      }

      if (name === 'guppi_guard_check') {
        const content = (args?.content as string) || '';
        const filePath = (args?.filePath as string) || undefined;
        const res = guardEngine.checkContent(content, filePath);

        if (res.passed) {
          return { content: [{ type: 'text', text: `✅ Guardrail Check Passed! No rule violations detected.` }] };
        }

        let output = `⚠️ Guardrail Check Failed with ${res.violations.length} violation(s):\n`;
        res.violations.forEach((v) => {
          output += `- [${v.severity.toUpperCase()}] ${v.ruleName}: ${v.message}\n  Matched: \`${v.matchedSnippet}\`\n`;
        });
        return { content: [{ type: 'text', text: output }] };
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

      throw new Error(`Unknown tool: ${name}`);
    } catch (err: any) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Error executing ${name}: ${err.message}` }],
      };
    }
  });

  return server;
}

export async function runStdioMCPServer(db: GuppiDB) {
  const server = createMCPServer(db);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
