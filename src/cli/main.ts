import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { GuppiDB } from '../db/client.js';
import { OnboardingEngine } from '../engine/onboarder.js';
import { RAGEngine } from '../engine/rag.js';
import { startGuppiServer } from '../server/index.js';
import { runStdioMCPServer } from '../server/mcp.js';

export function runCLI() {
  let _db: GuppiDB | null = null;
  const getDB = () => (_db ||= new GuppiDB(process.cwd()));

  const program = new Command();

  program
    .name('guppi')
    .description('GUPPI — Pluggable Agentic Sidecar, Onboarding & Memory Engine')
    .version('1.0.0');

  // guppi init
  program
    .command('init')
    .description('Initialize GUPPI in the current workspace and generate MCP configuration')
    .action(async () => {
      const workspace = process.cwd();
      const db = new GuppiDB(workspace);
      console.log(`\n🎉 Initialized GUPPI workspace database at: ${db.dbPath}`);

      // Run initial onboarding
      const onboarder = new OnboardingEngine(db, workspace);
      console.log(`\n🔍 Programmatically onboarding workspace...`);
      const report = await onboarder.runOnboarding();

      console.log(`\n✅ Onboarding complete!`);
      console.log(`- Project: ${report.projectName}`);
      console.log(`- Framework: ${report.framework}`);
      console.log(`- Files Indexed: ${report.totalFiles}`);
      console.log(`- Lines of Code: ${report.totalLines}`);
      console.log(`- AST Symbols: ${report.symbolCount}`);

      // Generate MCP config integration guide & file
      const mcpConfig = {
        mcpServers: {
          guppi: {
            command: 'guppi',
            args: ['mcp'],
            env: {
              GUPPI_WORKSPACE: workspace,
            },
          },
        },
      };

      const guppiDir = path.join(workspace, '.guppi');
      fs.writeFileSync(path.join(guppiDir, 'mcp.json'), JSON.stringify(mcpConfig, null, 2));

      console.log(`\n🔌 Generated MCP integration snippet at .guppi/mcp.json`);
      console.log(`\nTo connect Antigravity CLI, Claude Code, Cursor, or Pi:`);
      console.log(`  Add the server config from .guppi/mcp.json to your agent settings or mcp_config.json!`);
    });

  // guppi onboard
  program
    .command('onboard')
    .description('Run or refresh programmatic onboarding traversal for the workspace')
    .action(async () => {
      const db = getDB();
      const onboarder = new OnboardingEngine(db, process.cwd());
      console.log(`🔍 Running GUPPI onboarding scan...`);
      const report = await onboarder.runOnboarding();
      console.log(`✅ Onboarded ${report.totalFiles} files and ${report.symbolCount} symbols in ${report.durationMs}ms.`);
    });

  // guppi start
  program
    .command('start')
    .description('Start the GUPPI background server daemon and Web Dashboard UI')
    .option('-p, --port <number>', 'Server port', '3737')
    .action((options) => {
      const port = parseInt(options.port);
      startGuppiServer({ port, workspaceDir: process.cwd(), autoOnboard: true });
    });

  // guppi mcp
  program
    .command('mcp')
    .description('Run GUPPI Model Context Protocol (MCP) server over stdio')
    .action(async () => {
      const workspace = process.env.GUPPI_WORKSPACE || process.cwd();
      const db = new GuppiDB(workspace);
      await runStdioMCPServer(db);
    });

  // guppi status
  program
    .command('status')
    .description('Check workspace health, memory count, and telemetry metrics')
    .action(() => {
      const db = getDB();
      const onboarded = db.getConfig('onboarded') === 'true';
      const projectName = db.getConfig('project_name') || path.basename(process.cwd());
      const framework = db.getConfig('framework') || 'Unknown';
      const files = db.getCodeIndex();
      const memories = db.getRecentMemories(100);
      const traces = db.getTelemetryTraces(100);

      console.log(`\n📊 GUPPI Workspace Status:`);
      console.log(`- Project Name: ${projectName}`);
      console.log(`- Framework: ${framework}`);
      console.log(`- Onboarded Status: ${onboarded ? '✅ Onboarded' : '❌ Not Onboarded'}`);
      console.log(`- Total Files Indexed: ${files.length}`);
      console.log(`- Total RAG Memories: ${memories.length}`);
      console.log(`- Telemetry Traces Logged: ${traces.length}`);
    });

  // guppi query
  program
    .command('query <prompt>')
    .description('Perform instant RAG memory & symbol search from CLI')
    .action((prompt) => {
      const db = getDB();
      const rag = new RAGEngine(db);
      const res = rag.queryContext(prompt);
      console.log(`\n${res.synthesizedContext}`);
    });

  // guppi remember
  program
    .command('remember <title> <content>')
    .description('Add a key decision or architectural rule to GUPPI memory from CLI')
    .action((title, content) => {
      const db = getDB();
      const rag = new RAGEngine(db);
      const mem = rag.storeMemory(title, content, 'decision', ['cli_recorded'], 'cli_user');
      console.log(`\n🧠 Memory saved [ID: ${mem.id}]: "${mem.title}"`);
    });

  // guppi impact
  program
    .command('impact <target>')
    .description('Evaluate breaking change impact for a symbol or file')
    .action(async (target) => {
      const db = getDB();
      const { DependencyAnalyzer } = await import('../engine/dependency_analyzer.js');
      const analyzer = new DependencyAnalyzer(db);
      const report = analyzer.evaluateImpact(target);

      console.log(`\n🎯 GUPPI Impact Analysis: "${target}"`);
      console.log(`- Risk Level: [${report.riskLevel}]`);
      console.log(`- Recommendation: ${report.recommendation}`);
      console.log(`- Affected Files (${report.affectedFiles.length}): ${report.affectedFiles.join(', ') || 'None'}`);
    });

  // guppi checkpoint
  program
    .command('checkpoint <role> <summary>')
    .description('Save a subagent execution checkpoint to GUPPI working memory')
    .action(async (role, summary) => {
      const db = getDB();
      const { AgentHandoffEngine } = await import('../engine/agent_handoff.js');
      const handoff = new AgentHandoffEngine(db);
      const ckpt = handoff.saveCheckpoint('cli_user', role, summary, { cliTime: new Date().toISOString() });
      console.log(`\n📦 Checkpoint saved [ID: ${ckpt.id}] for Role: "${role}"`);
    });

  // guppi resume
  program
    .command('resume <checkpointId>')
    .description('Retrieve compressed context handoff package to resume subagent session')
    .action(async (checkpointId) => {
      const db = getDB();
      const { AgentHandoffEngine } = await import('../engine/agent_handoff.js');
      const handoff = new AgentHandoffEngine(db);
      try {
        const pkg = handoff.generateHandoffPackage(checkpointId);
        console.log(pkg.instructionPrompt);
      } catch (err: any) {
        console.error(`\n❌ Error resuming checkpoint: ${err.message}`);
      }
    });


  // guppi fix
  program
    .command('fix <errorLog>')
    .description('Parse terminal error output and suggest surgical auto-repair diff')
    .action(async (errorLog) => {
      const db = getDB();
      const { ExecutionFeedbackEngine } = await import('../engine/execution_feedback.js');
      const feedback = new ExecutionFeedbackEngine(db);
      const res = feedback.analyzeAndProposeFix('cli', errorLog, '', 1);

      console.log(`\n🛠️ GUPPI Auto-Fix Proposal:`);
      console.log(`- Diagnosis: ${res.fix.diagnosis}`);
      console.log(`- Confidence: ${(res.fix.confidence * 100).toFixed(0)}%`);
      console.log(`Suggested Patch:\n${res.fix.suggestedPatch}`);
    });

  // guppi backups
  program
    .command('backups')
    .description('List active shadow file backup snapshots created before code edits')
    .action(async () => {
      const db = getDB();
      const backups = db.getShadowBackups(20);
      console.log(`\n🛡️ Active Shadow File Backups (${backups.length}):`);
      backups.forEach((b) => {
        console.log(`- [${b.id}] ${b.file_path} -> ${b.backup_path} (${b.created_at})`);
      });
    });

  // guppi plan
  program
    .command('plan <goal>')
    .description('Decompose goal into multi-agent DAG task plan (Poached from Aider & Superpowers)')
    .action(async (goal) => {
      const db = getDB();
      const { TaskPlannerEngine } = await import('../engine/task_planner.js');
      const planner = new TaskPlannerEngine(db);
      const res = planner.createPlan(goal);

      console.log(`\n📋 Task Plan Created [ID: ${res.plan.id}]`);
      console.log(`Goal: "${res.plan.goal}"\n`);
      res.steps.forEach((s) => {
        console.log(`${s.step_number}. [${s.assigned_role}] ${s.title}`);
      });
    });

  // guppi tasks
  program
    .command('tasks')
    .description('List all active task plans and DAG step completion progress')
    .action(async () => {
      const db = getDB();
      const { TaskPlannerEngine } = await import('../engine/task_planner.js');
      const planner = new TaskPlannerEngine(db);
      const plans = planner.listActivePlans(20);

      console.log(`\n📋 Active GUPPI Task Plans (${plans.length}):`);
      plans.forEach((p) => {
        console.log(`- [${p.plan.id}] "${p.plan.title}" - Progress: ${p.progressPercent}% (${p.completedCount}/${p.totalCount} steps)`);
      });
    });

  // guppi facts
  program
    .command('facts [query]')
    .description('Query extracted subject-relation-object Fact Graph (Poached from Mem0 & MemGPT)')
    .action(async (query) => {
      const db = getDB();
      const { EpisodicMemoryEngine } = await import('../engine/episodic_memory.js');
      const memEngine = new EpisodicMemoryEngine(db);
      const facts = memEngine.queryFacts(query || '', 20);

      console.log(`\n🕸️ GUPPI Fact Triples (${facts.length}):`);
      facts.forEach((f) => {
        console.log(`- \`${f.subject}\` --[${f.relation}]--> \`${f.object}\` (Confidence: ${(f.confidence * 100).toFixed(0)}%)`);
      });
    });

  // guppi eval
  program
    .command('eval')
    .description('Display Agent RAG precision, faithfulness & latency report (Poached from DeepEval & AgentOps)')
    .action(async () => {
      const db = getDB();
      const { AgentEvalEngine } = await import('../engine/agent_eval.js');
      const evalEngine = new AgentEvalEngine(db);
      const report = evalEngine.getBenchmarkReport(50);

      console.log(`\n📊 Agent Benchmark Report (${report.totalRuns} total runs):`);
      console.log(`- Average Precision: ${(report.avgPrecision * 100).toFixed(0)}%`);
      console.log(`- Average Faithfulness: ${(report.avgFaithfulness * 100).toFixed(0)}%`);
      console.log(`- Average Latency: ${report.avgLatencyMs}ms`);
      console.log(`- Total Token Cost: ${report.totalTokenCost} tokens`);
    });

  // guppi callgraph
  program
    .command('callgraph [symbol]')
    .description('Build call graph and simulate signature mutation risk (Poached from Tree-Sitter & GraphRAG)')
    .action(async (symbol) => {
      const db = getDB();
      const { SymbolCallGraphEngine } = await import('../engine/symbol_call_graph.js');
      const cgEngine = new SymbolCallGraphEngine(db);
      const graph = cgEngine.buildCallGraph();

      console.log(`\n🕸️ AST Symbol Call Graph Built: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

      if (symbol) {
        const sim = cgEngine.simulateSignatureMutation(symbol, `(updated: any) => void`);
        console.log(`\n🔬 Signature Mutation Simulation for "${symbol}":`);
        console.log(`- Risk Score: [${sim.riskScore}%]`);
        console.log(`- Breaking Change Call Sites: ${sim.breakingChangeCount}`);
        console.log(`- Recommendation: ${sim.recommendation}`);
      }
    });

  // guppi symbol
  program
    .command('symbol <query>')
    .description('Serena-style scope-aware symbol search enriched with GUPPI memory')
    .action(async (query) => {
      const db = getDB();
      const { LSTTraversalEngine } = await import('../engine/lst_traversal.js');
      const lstEngine = new LSTTraversalEngine(db);
      const matches = lstEngine.findSymbols(query);

      console.log(`\n🔍 Serena LST Symbol Matches for "${query}" (${matches.length} found):`);
      matches.forEach((m) => {
        console.log(`- [${m.kind}] ${m.symbolName} in ${m.filePath}:${m.lineStart}`);
        console.log(`  Signature: ${m.signature}`);
        if (m.docstring) console.log(`  Docstring: ${m.docstring}`);
      });
    });

  // guppi tree
  program
    .command('tree <file> [selector]')
    .description('Query Lossless Semantic Tree (LST) structure for a file')
    .action(async (file, selector) => {
      const db = getDB();
      const { LSTTraversalEngine } = await import('../engine/lst_traversal.js');
      const lstEngine = new LSTTraversalEngine(db);
      const nodes = lstEngine.queryLSTTree(file, selector || 'SourceFile');

      console.log(`\n🌳 LST Query Matches for "${file}" (${nodes.length} nodes):`);
      nodes.forEach((n) => {
        console.log(`- [${n.kind}] ${n.name || 'node'} (Lines ${n.startLine}-${n.endLine})`);
      });
    });

  // guppi refs
  program
    .command('refs <symbol>')
    .description('Find cross-file call references, instantiations, and usages for a symbol')
    .action(async (symbol) => {
      const db = getDB();
      const { LSTTraversalEngine } = await import('../engine/lst_traversal.js');
      const lstEngine = new LSTTraversalEngine(db);
      const refs = lstEngine.findReferences(symbol);

      console.log(`\n🕸️ Cross-File Call References for "${symbol}" (${refs.length} references):`);
      refs.forEach((r) => {
        console.log(`- ${r.filePath}:${r.lineNumber} in [${r.callerSymbol}] (${r.callType})`);
        console.log(`  ${r.lineSnippet}`);
      });
    });

  program.parse();
}


