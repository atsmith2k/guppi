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
import { DependencyAnalyzer } from '../engine/dependency_analyzer.js';
import { AgentHandoffEngine } from '../engine/agent_handoff.js';
import { ExecutionFeedbackEngine } from '../engine/execution_feedback.js';
import { GuardEnforcerEngine } from '../engine/guard_enforcer.js';
import { TaskPlannerEngine } from '../engine/task_planner.js';
import { EpisodicMemoryEngine } from '../engine/episodic_memory.js';
import { AgentEvalEngine } from '../engine/agent_eval.js';
import { SymbolCallGraphEngine } from '../engine/symbol_call_graph.js';

export function createMCPServer(db: GuppiDB) {
  const ragEngine = new RAGEngine(db);
  const guardEngine = new GuardEngine(db);
  const telemetryEngine = new TelemetryEngine(db);
  const onboarder = new OnboardingEngine(db);
  const brainstormEngine = new BrainstormEngine(db);
  const selfHealingEngine = new SelfHealingEngine(db);
  const meshEngine = new MultiRepoMeshEngine(db);
  const testGenEngine = new TestGenEngine(db);
  const dependencyAnalyzer = new DependencyAnalyzer(db);
  const handoffEngine = new AgentHandoffEngine(db);
  const feedbackEngine = new ExecutionFeedbackEngine(db);
  const guardEnforcer = new GuardEnforcerEngine(db);
  const taskPlanner = new TaskPlannerEngine(db);
  const episodicMemory = new EpisodicMemoryEngine(db);
  const agentEval = new AgentEvalEngine(db);
  const callGraphEngine = new SymbolCallGraphEngine(db);



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
        {
          uri: 'guppi://graph/dependencies',
          name: 'Symbol & File Dependency Graph',
          description: 'AST dependency relations and import/call graph edges across the workspace.',
          mimeType: 'application/json',
        },
        {
          uri: 'guppi://checkpoints/active',
          name: 'Subagent Session Handoff Checkpoints',
          description: 'Serialized task checkpoints and handoff state packages for subagents.',
          mimeType: 'application/json',
        },
        {
          uri: 'guppi://feedback/recent',
          name: 'Execution Feedback & Auto-Fix History',
          description: 'Log of error tracebacks, diagnostic matches, and suggested auto-fix diffs.',
          mimeType: 'application/json',
        },
        {
          uri: 'guppi://backups/recent',
          name: 'Active Shadow File Backups',
          description: 'List of non-destructive shadow backup snapshots created before code edits.',
          mimeType: 'application/json',
        },
        {
          uri: 'guppi://tasks/active',
          name: 'Active Task Execution Plans & DAG Steps',
          description: 'Task plans, role assignments, and step progress states.',
          mimeType: 'application/json',
        },
        {
          uri: 'guppi://facts/graph',
          name: 'Extracted Entity-Relation Fact Graph',
          description: 'Subject-relation-object fact triples extracted from codebase and commit history.',
          mimeType: 'application/json',
        },
        {
          uri: 'guppi://eval/reports',
          name: 'Agent RAG Precision & Latency Eval Reports',
          description: 'Benchmark runs, context precision scores, and latency metrics.',
          mimeType: 'application/json',
        },
        {
          uri: 'guppi://graph/callgraph',
          name: 'AST Symbol Call Graph & Call Hierarchy',
          description: 'AST symbol caller-callee call graph nodes and edges.',
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

    if (uri === 'guppi://graph/dependencies') {
      const edges = db.getDependencyEdges('', 100);
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(edges, null, 2) }] };
    }

    if (uri === 'guppi://checkpoints/active') {
      const ckpts = handoffEngine.listCheckpoints(20);
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(ckpts, null, 2) }] };
    }

    if (uri === 'guppi://feedback/recent') {
      const fb = feedbackEngine.getHistory(20);
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(fb, null, 2) }] };
    }

    if (uri === 'guppi://backups/recent') {
      const backups = guardEnforcer.getBackups(20);
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(backups, null, 2) }] };
    }

    if (uri === 'guppi://tasks/active') {
      const plans = taskPlanner.listActivePlans(20);
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(plans, null, 2) }] };
    }

    if (uri === 'guppi://facts/graph') {
      const facts = episodicMemory.queryFacts('', 100);
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(facts, null, 2) }] };
    }

    if (uri === 'guppi://eval/reports') {
      const report = agentEval.getBenchmarkReport(50);
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(report, null, 2) }] };
    }

    if (uri === 'guppi://graph/callgraph') {
      const nodes = db.getAllCallGraphNodes();
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(nodes, null, 2) }] };
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
        {
          name: 'guppi_impact_analysis',
          description:
            'Evaluates downstream breaking changes and caller impact across the codebase before editing a symbol or file.',
          inputSchema: {
            type: 'object',
            properties: {
              symbolOrPath: { type: 'string', description: 'Function/class symbol name or file path to evaluate' },
            },
            required: ['symbolOrPath'],
          },
        },
        {
          name: 'guppi_dependency_trace',
          description:
            'Queries GUPPI AST dependency graph to trace symbol imports, call references, and class extensions.',
          inputSchema: {
            type: 'object',
            properties: {
              symbolOrPath: { type: 'string', description: 'Symbol or file path filter' },
            },
          },
        },
        {
          name: 'guppi_subagent_checkpoint',
          description:
            'Manages subagent task checkpoints, state serialization, and context handoff packages for multi-agent delegation.',
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
        {
          name: 'guppi_auto_fix_suggest',
          description:
            'Parses terminal error logs, build failures, or test tracebacks, matches against RAG bug solutions, and suggests surgical auto-repair patches.',
          inputSchema: {
            type: 'object',
            properties: {
              commandType: { type: 'string', description: 'Command type (e.g. build, test, typescript, python)' },
              stdout: { type: 'string', description: 'Standard output log' },
              stderr: { type: 'string', description: 'Standard error or traceback log' },
              exitCode: { type: 'number', description: 'Command exit code' },
              filePath: { type: 'string', description: 'Target file path needing fix' },
            },
            required: ['commandType'],
          },
        },
        {
          name: 'guppi_guard_enforce',
          description:
            'Performs pre-flight safety audit before code modifications and creates a non-destructive shadow backup in .guppi/backups.',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'Target file path to backup and check' },
              proposedContent: { type: 'string', description: 'Proposed code content' },
            },
            required: ['filePath'],
          },
        },
        {
          name: 'guppi_rollback_file',
          description:
            'Restores a file to its latest shadow backup snapshot if a modification introduced a regression or build failure.',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: { type: 'string', description: 'File path to rollback' },
            },
            required: ['filePath'],
          },
        },
        {
          name: 'guppi_task_plan_create',
          description:
            'Decomposes a complex goal into a multi-agent DAG task plan with step dependencies and assigned roles (Poached from Aider & Superpowers).',
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
            'Updates execution status and result for a task plan step in the DAG orchestrator.',
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
          name: 'guppi_episodic_remember',
          description:
            'Stores an episodic agent memory with Ebbinghaus decay scoring and extracts entity-relation Fact Graph triples (Poached from Mem0 & MemGPT).',
          inputSchema: {
            type: 'object',
            properties: {
              topic: { type: 'string', description: 'Memory topic or title' },
              content: { type: 'string', description: 'Detailed memory content' },
              memoryType: { type: 'string', enum: ['episodic', 'semantic', 'preference'] },
              importanceScore: { type: 'number', description: 'Importance rating between 0.1 and 1.0' },
            },
            required: ['topic', 'content'],
          },
        },
        {
          name: 'guppi_query_facts',
          description:
            'Queries GUPPI entity-relation Fact Graph for subject-relation-object triples extracted across codebase and commits.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Keyword or subject search query' },
            },
          },
        },
        {
          name: 'guppi_evaluate_run',
          description:
            'Benchmarks an agent interaction evaluating context precision score, answer faithfulness score, token cost, and latency (Poached from DeepEval & AgentOps).',
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
          name: 'guppi_call_graph_build',
          description:
            'Scans AST symbols across TypeScript files and builds the complete caller-callee call graph hierarchy (Poached from Tree-Sitter & GraphRAG).',
          inputSchema: {
            type: 'object',
          },
        },
        {
          name: 'guppi_signature_mutate_simulate',
          description:
            'Simulates mutating a function/method signature, evaluating breaking changes, risk score (0-100%), and listing affected caller sites.',
          inputSchema: {
            type: 'object',
            properties: {
              targetSymbol: { type: 'string', description: 'Function or class method symbol name' },
              proposedSignature: { type: 'string', description: 'New proposed signature' },
            },
            required: ['targetSymbol', 'proposedSignature'],
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

      if (name === 'guppi_impact_analysis') {
        const target = (args?.symbolOrPath as string) || '';
        const report = dependencyAnalyzer.evaluateImpact(target);
        return {
          content: [
            {
              type: 'text',
              text: `🎯 Impact Analysis for "${target}":\n- Risk Level: [${report.riskLevel}]\n- Recommendation: ${report.recommendation}\n- Directly Affected Symbols (${report.directlyAffectedSymbols.length}): ${report.directlyAffectedSymbols.join(', ') || 'None'}\n- Affected Files (${report.affectedFiles.length}): ${report.affectedFiles.join(', ') || 'None'}`,
            },
          ],
        };
      }

      if (name === 'guppi_dependency_trace') {
        const target = (args?.symbolOrPath as string) || '';
        const edges = db.getDependencyEdges(target, 50);
        if (edges.length === 0) {
          return { content: [{ type: 'text', text: `No AST dependency edges found for "${target}".` }] };
        }
        let text = `### AST Dependency Edges for "${target}":\n`;
        edges.forEach((e) => {
          text += `- \`${e.source_symbol}\` --[${e.edge_type}]--> \`${e.target_symbol}\` in ${e.file_path}:${e.line_number}\n`;
        });
        return { content: [{ type: 'text', text }] };
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

      if (name === 'guppi_auto_fix_suggest') {
        const commandType = (args?.commandType as string) || 'build';
        const stdout = (args?.stdout as string) || '';
        const stderr = (args?.stderr as string) || '';
        const exitCode = (args?.exitCode as number) || 1;
        const filePath = (args?.filePath as string) || undefined;

        const res = feedbackEngine.analyzeAndProposeFix(commandType, stdout, stderr, exitCode, filePath);
        return {
          content: [
            {
              type: 'text',
              text: `🛠️ GUPPI Execution Feedback & Surgical Auto-Fix Suggestion:\n\n- Diagnosis: ${res.fix.diagnosis}\n- Target File: ${res.fix.filePath || 'Unknown'}\n- Confidence: ${(res.fix.confidence * 100).toFixed(0)}%\n${res.fix.matchedMemoryTitle ? `- Matched Past Solution: "${res.fix.matchedMemoryTitle}"\n` : ''}\nSuggested Surgical Diff:\n\`\`\`typescript\n${res.fix.suggestedPatch}\n\`\`\``,
            },
          ],
        };
      }

      if (name === 'guppi_guard_enforce') {
        const filePath = args?.filePath as string;
        const proposedContent = args?.proposedContent as string | undefined;
        const res = guardEnforcer.preparePreFlight(filePath, proposedContent);

        let output = `🛡️ GUPPI Guard Enforcer Pre-flight Status:\n- Allowed: ${res.allowed ? '✅ YES' : '❌ NO'}\n`;
        if (res.backup) {
          output += `- Shadow Backup Snapshot Created: [${res.backup.id}] -> \`${res.backup.backup_path}\`\n`;
        }
        if (res.violations.length > 0) {
          output += `- Safety Violations:\n  ${res.violations.join('\n  ')}\n`;
        }
        return { content: [{ type: 'text', text: output }] };
      }

      if (name === 'guppi_rollback_file') {
        const filePath = args?.filePath as string;
        const res = guardEnforcer.rollbackFile(filePath);
        return { content: [{ type: 'text', text: res.message }] };
      }

      if (name === 'guppi_task_plan_create') {
        const goal = (args?.goal as string) || '';
        const title = (args?.title as string) || undefined;
        const res = taskPlanner.createPlan(goal, title);
        let output = `📋 Task Plan Created! [ID: ${res.plan.id}]\nGoal: "${res.plan.goal}"\n\nDAG Execution Steps:\n`;
        res.steps.forEach((s) => {
          output += `${s.step_number}. [${s.assigned_role}] ${s.title} (Status: ${s.status})\n`;
        });
        return { content: [{ type: 'text', text: output }] };
      }

      if (name === 'guppi_task_step_update') {
        const stepId = args?.stepId as string;
        const status = args?.status as any;
        const result = args?.result as string | undefined;
        taskPlanner.updateStepStatus(stepId, status, result);
        return { content: [{ type: 'text', text: `✅ Task Step [${stepId}] status updated to: ${status}` }] };
      }

      if (name === 'guppi_episodic_remember') {
        const topic = (args?.topic as string) || '';
        const content = (args?.content as string) || '';
        const memoryType = (args?.memoryType as any) || 'episodic';
        const importanceScore = (args?.importanceScore as number) || 0.8;
        const mem = episodicMemory.remember(topic, content, memoryType, importanceScore);
        const extracted = episodicMemory.extractFactTriples(content, topic);
        return {
          content: [
            {
              type: 'text',
              text: `🧠 Episodic Memory Stored! [ID: ${mem.id}]\nTopic: "${mem.topic}"\nDecay Score: ${mem.decay_score}\nFact Triples Extracted (${extracted.length}):\n${extracted.map((f) => `- ${f.subject} --[${f.relation}]--> ${f.object}`).join('\n') || 'None'}`,
            },
          ],
        };
      }

      if (name === 'guppi_query_facts') {
        const query = (args?.query as string) || '';
        const facts = episodicMemory.queryFacts(query, 20);
        if (facts.length === 0) {
          return { content: [{ type: 'text', text: `No Fact Triples found matching "${query}".` }] };
        }
        let output = `### Extracted Fact Triples matching "${query}":\n`;
        facts.forEach((f) => {
          output += `- \`${f.subject}\` --[**${f.relation}**]--> \`${f.object}\` (Confidence: ${(f.confidence * 100).toFixed(0)}%, Source: ${f.source})\n`;
        });
        return { content: [{ type: 'text', text: output }] };
      }

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

      if (name === 'guppi_call_graph_build') {
        const graph = callGraphEngine.buildCallGraph();
        return {
          content: [
            {
              type: 'text',
              text: `🕸️ AST Symbol Call Graph Built!\n- Total Symbol Nodes: ${graph.nodes.length}\n- Total Call Edges: ${graph.edges.length}\n\nCall Graph Sample:\n${graph.edges.slice(0, 5).map((e) => `- \`${e.caller_symbol}\` calls \`${e.callee_symbol}\` in ${e.file_path}:${e.line_number}`).join('\n') || 'No edges detected.'}`,
            },
          ],
        };
      }

      if (name === 'guppi_signature_mutate_simulate') {
        const targetSymbol = (args?.targetSymbol as string) || '';
        const proposedSignature = (args?.proposedSignature as string) || '';
        const sim = callGraphEngine.simulateSignatureMutation(targetSymbol, proposedSignature);
        return {
          content: [
            {
              type: 'text',
              text: `🔬 Signature Mutation Simulation for "${targetSymbol}":\n- Proposed Signature: \`${proposedSignature}\`\n- Risk Score: [${sim.riskScore}%]\n- Breaking Change Call Sites (${sim.breakingChangeCount}): ${sim.affectedCallSites.map((c) => c.caller_symbol).join(', ') || 'None'}\n- Recommendation: ${sim.recommendation}`,
            },
          ],
        };
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
