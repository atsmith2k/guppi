import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { GuppiDB } from '../db/client.js';
import { OnboardingEngine } from '../engine/onboarder.js';
import { RAGEngine } from '../engine/rag.js';
import { startGuppiServer } from '../server/index.js';
import { runStdioMCPServer } from '../server/mcp.js';

export function runCLI() {
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
      const db = new GuppiDB(process.cwd());
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
      const db = new GuppiDB(process.cwd());
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
      const db = new GuppiDB(process.cwd());
      const rag = new RAGEngine(db);
      const res = rag.queryContext(prompt);
      console.log(`\n${res.synthesizedContext}`);
    });

  // guppi remember
  program
    .command('remember <title> <content>')
    .description('Add a key decision or architectural rule to GUPPI memory from CLI')
    .action((title, content) => {
      const db = new GuppiDB(process.cwd());
      const rag = new RAGEngine(db);
      const mem = rag.storeMemory(title, content, 'decision', ['cli_recorded'], 'cli_user');
      console.log(`\n🧠 Memory saved [ID: ${mem.id}]: "${mem.title}"`);
    });

  program.parse();
}
